// ─── BSData INGESTER v2 (Story A / task A6) ─────────────────────────────────
// node scripts/bsdata-import/v2/ingest.mjs [--fetch] [faction ...]
//
// Reads BSData/wh40k-11e faction catalogues from the local cache and writes
// src/core/data/<faction>.json = UnitRecord[] plus src/core/data/_sync-report.json.
// Deterministic: a no-upstream-change re-run produces byte-identical files.
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { CATALOGUES, loadFaction, CACHE } from "./catalogues.mjs";
import { unitMeta } from "./unitMeta.mjs";
import { collectWeapons } from "./weapons.mjs";
import { buildWargear } from "./wargear.mjs";
import { applyOverride } from "./overrides.js";
import { newReport, partitionReport } from "./report.mjs";
import { writeJson, slug } from "./emit.mjs";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "..", "src", "core", "data");

const UNIT_TYPES = new Set(["unit", "model"]);

function unitLinks(catalogue, index) {
  const seen = new Set();
  return (catalogue.entryLinks || [])
    .filter(l => l.type === "selectionEntry")
    .map(l => ({ link: l, entry: index.entry(l.targetId) }))
    .filter(x => x.entry && UNIT_TYPES.has(x.entry.type) && x.entry.import !== false)
    .filter(x => { const id = x.entry.id; if (seen.has(id)) return false; seen.add(id); return true; });
}

export function ingestFaction(key, report) {
  const { catalogue, index } = loadFaction(key);
  const links = unitLinks(catalogue, index);
  const records = [];
  const takenIds = new Set();
  for (const { entry } of links) {
    try {
      const meta = unitMeta(entry, index, key, report);
      const weapons = collectWeapons(entry, index);
      const wargear = buildWargear(entry, index, weapons, key, report);
      let rec = { ...meta, weapons, wargear };
      // dedup id within the faction file (a unit + its [Legends] twin)
      if (takenIds.has(rec.id)) { let n = 1, base = rec.id; while (takenIds.has(rec.id)) rec.id = `${base}-${++n}`; }
      takenIds.add(rec.id);
      rec = applyOverride(rec);
      if (rec.overridden) report.overridesApplied.push({ unit: rec.id, fields: rec.overridden });
      records.push(rec);
    } catch (e) {
      report.parseFailures.push(`${key}/${entry.name}: ${e.message}`);
    }
  }
  records.sort((a, b) => a.id.localeCompare(b.id));
  report.catalogues.push({ key, file: loadFaction(key).spec.file, units: records.length });
  return records;
}

async function main() {
  const args = process.argv.slice(2).filter(a => a !== "--fetch");
  if (process.argv.includes("--fetch")) {
    const { execFileSync } = await import("child_process");
    execFileSync("node", [join(__dirname, "discover.mjs"), "--fetch"], { stdio: "inherit" });
  }
  const keys = args.length ? args : CATALOGUES.map(c => c.key);
  const report = newReport();
  for (const key of keys) {
    if (!existsSync(join(CACHE, CATALOGUES.find(c => c.key === key)?.file || ""))) {
      report.parseFailures.push(`${key}: not cached`);
      continue;
    }
    const records = ingestFaction(key, report);
    writeJson(join(OUT, `${key}.json`), records);
    process.stdout.write(`${key}: ${records.length} units\n`);
  }
  partitionReport(report);
  writeJson(join(OUT, "_sync-report.json"), report);
  const problems = report.parseFailures.length + report.noStats.length + report.unresolvedNodes.length;
  console.log(`\n${report.catalogues.reduce((a, c) => a + c.units, 0)} units · ` +
    `${report.parseFailures.length} parse failures · ${report.noStats.length} no-stats · ` +
    `${report.defaultRuleFallback.length} default-fallbacks · ${report.unresolvedNodes.length} unresolved nodes · ` +
    `${report.damageBrackets.length} damage-bracket · ${report.nonCountPointsModifiers.length} non-count pts mods`);
  process.exit(report.parseFailures.length ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
