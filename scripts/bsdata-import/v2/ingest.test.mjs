// ─── INGESTER VALIDATION HARNESS (Story A / task A7) ────────────────────────
// node --test scripts/bsdata-import/v2/ingest.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CATALOGUES, loadFaction } from "./catalogues.mjs";
import { unitMeta } from "./unitMeta.mjs";
import { collectWeapons } from "./weapons.mjs";
import { buildWargear } from "./wargear.mjs";
import { effectiveLimitsFromRecord } from "./constraintEval.mjs";
import { newReport } from "./report.mjs";
import { ingestFaction } from "./ingest.mjs";
import { stableStringify } from "./emit.mjs";
import { keywordList, parseKeyword } from "./keywordNormalize.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function record(faction, name) {
  const { catalogue, index } = loadFaction(faction);
  const link = (catalogue.entryLinks || []).find(l => l.name === name);
  assert.ok(link, `${faction}/${name} link not found`);
  const entry = index.entry(link.targetId);
  const report = newReport();
  const meta = unitMeta(entry, index, faction, report);
  const weapons = collectWeapons(entry, index);
  const wargear = buildWargear(entry, index, weapons, faction, report);
  return { ...meta, weapons, wargear };
}
// Resolve which weapon ids a build fields. `picked` = a Set of node names the
// user explicitly selected (overrides the default within that node's group).
function resolveWeaponSet(rec, picked = new Set()) {
  const chosen = picked instanceof Set ? picked : new Set(picked);
  const out = new Set();
  const visit = node => {
    (node.weaponRefs || []).forEach(w => out.add(w));
    const kids = node.children || [];
    const siblingPicked = kids.some(k => chosen.has(k.name));
    for (const k of kids) {
      const on = chosen.has(k.name)
        || (!siblingPicked && k.defaultSelected)
        || (!siblingPicked && (k.min || 0) >= 1);
      if (on) visit(k);
    }
  };
  for (const k of rec.wargear.children || []) visit(k);
  return out;
}

test("keywords: uppercased, otherwise verbatim (no separator munging)", () => {
  assert.deepEqual(keywordList("Twin-linked, Devastating Wounds"), ["TWIN-LINKED", "DEVASTATING WOUNDS"]);
  assert.deepEqual(keywordList("Anti-Fly 4+"), ["ANTI-FLY 4+"]);
  // BSData's own inconsistency is preserved for Story B's dictionary to map
  assert.deepEqual(keywordList("Twin Linked"), ["TWIN LINKED"]);   // != "TWIN-LINKED", on purpose
  // Story-B parse helper (not applied by the ingester)
  assert.deepEqual(parseKeyword("ANTI-FLY 4+"), { kw: "anti fly", on: 4 });
  assert.deepEqual(parseKeyword("Rapid Fire 2"), { kw: "rapid fire", val: "2" });
});

test("GK Venerable Dreadnought: defaults + #22 (swap keeps other weapons)", () => {
  const vd = record("greyknights", "Venerable Dreadnought");
  const dflt = resolveWeaponSet(vd);
  assert.ok(dflt.has("assault-cannon"), "default has assault cannon");
  assert.ok(dflt.has("storm-bolter"), "default has storm bolter");
  assert.ok([...dflt].some(w => /dreadnought-combat-weapon/.test(w)), "default has DCW");
  // pick twin lascannon in the Assault Cannon slot -> storm bolter + DCW survive
  const swapped = resolveWeaponSet(vd, ["Twin lascannon"]);
  assert.ok(swapped.has("twin-lascannon"));
  assert.ok(swapped.has("storm-bolter"), "#22: storm bolter not lost when swapping the assault cannon");
});

test("GK Strike Squad: per-size points + size-scaled special weapon", () => {
  const ss = record("greyknights", "Strike Squad");
  const pts = Object.fromEntries(ss.points.map(p => [p.models, p.pts]));
  assert.equal(pts[5], 115);
  assert.equal(pts[10], 230);
  // heavy-weapon group: effective max 1 at 5 models, 2 at 10
  const find = (n) => n.name?.toLowerCase().includes("heavy weapon") && n.conditions
    ? n : (n.children || []).map(find).find(Boolean);
  const hw = find(ss.wargear);
  assert.ok(hw, "heavy weapon node found");
  assert.equal(effectiveLimitsFromRecord(hw, { modelCount: 5, selections: {} }).max, 1);
  assert.equal(effectiveLimitsFromRecord(hw, { modelCount: 10, selections: {} }).max, 2);
});

test("SM Terminator Squad: per-size points 160 / 320", () => {
  const t = record("spacemarines", "Terminator Squad");
  const pts = Object.fromEntries(t.points.map(p => [p.models, p.pts]));
  assert.equal(pts[5], 160);
  assert.equal(pts[10], 320);
  assert.equal(t.stats.InvSv, "4+");
});

test("Aeldari Laser Lance: one weapon, ranged + melee both present", () => {
  const ss = record("aeldari", "Shining Spears");
  const ll = ss.weapons.find(w => w.name === "Laser Lance");
  assert.ok(ll, "Laser Lance weapon present");
  assert.ok(ll.ranged?.length && ll.melee?.length, "both phases populated");
});

test("Ork mode weapon: one weapon, multiple ranged modes", () => {
  const { catalogue, index } = loadFaction("orks");
  // find any unit fielding a Kustom Shoota / Snazzgun / Rokkit Launcha
  let found = null;
  for (const l of (catalogue.entryLinks || []).filter(l => l.type === "selectionEntry")) {
    const e = index.entry(l.targetId);
    if (!e || !["unit", "model"].includes(e.type)) continue;
    const w = collectWeapons(e, index).find(x => (x.ranged?.length || 0) > 1);
    if (w) { found = w; break; }
  }
  assert.ok(found, "a multi-mode ranged weapon exists");
  assert.ok(found.ranged.length > 1);
});

test("determinism: ingestFaction twice is identical", () => {
  const a = stableStringify(ingestFaction("votann", newReport()));
  const b = stableStringify(ingestFaction("votann", newReport()));
  assert.equal(a, b);
});

test("all 34 catalogues ingest with 0 parse failures", () => {
  const report = newReport();
  for (const c of CATALOGUES) ingestFaction(c.key, report);
  assert.deepEqual(report.parseFailures, [], report.parseFailures.join("\n"));
  assert.ok(report.catalogues.reduce((n, c) => n + c.units, 0) > 1200, "sane unit count");
});

test("fixtures still parse into valid records (shape check)", () => {
  const dir = join(__dirname, "fixtures");
  for (const f of readdirSync(dir).filter(x => x.endsWith(".json"))) {
    const b = JSON.parse(readFileSync(join(dir, f), "utf8"));
    assert.ok(b.unit && b.unit.name, `${f}: has a unit`);
  }
});
