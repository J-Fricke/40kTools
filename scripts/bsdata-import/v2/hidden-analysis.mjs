// What are the ~25k `set:hidden when <cond>` modifiers actually gating on?
// Resolve each condition's childId / scope to a human-readable target and
// bucket. Reads the discovery cache.
import { readFileSync, readdirSync } from "fs";
const CACHE = "/Users/joshua/Library/CloudStorage/GoogleDrive-jgf@newsun.org/My Drive/Games/MTG/dev/40kTools/scripts/bsdata-import/v2/.cache";

const buckets = new Map();     // bucket -> count
const egByBucket = new Map();  // bucket -> Set of examples
const bump = (b, eg) => {
  buckets.set(b, (buckets.get(b) || 0) + 1);
  const s = egByBucket.get(b) || new Set();
  if (s.size < 5 && eg) s.add(eg);
  egByBucket.set(b, s);
};

for (const file of readdirSync(CACHE).filter(f => f.endsWith(".json"))) {
  let cat;
  try { cat = JSON.parse(readFileSync(`${CACHE}/${file}`, "utf8")).catalogue; } catch { continue; }

  // name lookups
  const name = new Map();
  const put = (id, n) => { if (id && n) name.set(id, n); };
  for (const e of cat.sharedSelectionEntries || []) put(e.id, e.name);
  for (const g of cat.sharedSelectionEntryGroups || []) put(g.id, g.name);
  for (const c of cat.categoryEntries || []) put(c.id, `[cat] ${c.name}`);
  for (const c of cat.catalogueLinks || []) put(c.targetId, `[catalogue] ${c.name}`);
  for (const r of cat.sharedRules || []) put(r.id, `[rule] ${r.name}`);
  put(cat.id, `[this catalogue] ${cat.name}`);
  // forces / detachments live in the game-system file usually; label generically

  const SCOPE_WORDS = new Set(["parent", "force", "roster", "self", "ancestor", "root-entry", "primary-catalogue", "model", "unit", "primary-category", "model-or-unit"]);

  const label = (id) => {
    if (!id) return "?";
    if (SCOPE_WORDS.has(id)) return id;
    return name.get(id) || `guid:${id.slice(0, 8)}`;
  };

  let cn = cat.name;
  const walk = (node, unitName) => {
    for (const m of node.modifiers || []) {
      if (!(m.type === "set" && m.field === "hidden")) continue;
      const conds = m.conditions || [];
      const cgs = m.conditionGroups || [];
      if (!conds.length && !cgs.length) { bump("UNCONDITIONAL (static hide)", `${cn}/${unitName}: ${node.name}`); continue; }
      for (const c of conds) {
        const tgt = label(c.childId);
        const scope = label(c.scope);
        let bucket;
        if (/^\[catalogue\]/.test(tgt) || scope === "primary-catalogue") bucket = `SUBFACTION/CATALOGUE gate (${c.type})`;
        else if (/^\[cat\]/.test(tgt)) bucket = `CATEGORY gate (${c.type}) — e.g. ${tgt}`;
        else if (["atLeast", "atMost", "greaterThan", "lessThan", "equalTo"].includes(c.type) && ["parent", "unit", "model", "roster", "force", "model-or-unit"].includes(scope)) bucket = `COUNT gate (${c.type} ${c.value} @${scope})`;
        else if (["instanceOf", "notInstanceOf"].includes(c.type)) bucket = `SELECTION gate (${c.type}) target="${tgt}" @${scope}`;
        else bucket = `OTHER (${c.type} @${scope})`;
        bump(bucket.replace(/target="[^"]*"/, m => m.length > 60 ? 'target="…"' : m), `${cn}/${unitName}: ${node.name}  [${c.type} ${label(c.childId)}]`);
      }
    }
    for (const s of node.selectionEntries || []) walk(s, unitName);
    for (const g of node.selectionEntryGroups || []) walk(g, unitName);
  };

  const sh = new Map();
  for (const e of cat.sharedSelectionEntries || []) sh.set(e.id, e);
  for (const l of (cat.entryLinks || []).filter(l => l.type === "selectionEntry")) {
    const u = sh.get(l.targetId);
    if (u && ["unit", "model"].includes(u.type)) walk(u, u.name);
  }
}

// collapse SELECTION gate targets into families
const collapsed = new Map();
for (const [b, n] of buckets) {
  let key = b;
  const m = b.match(/^SELECTION gate \((\w+)\) target="([^"]+)"/);
  if (m) key = `SELECTION gate (${m[1]}) — target kind: ${/^\[/.test(m[2]) ? m[2].split("]")[0] + "]" : (/guid:/.test(m[2]) ? "guid (entry/detachment)" : "named entry: " + m[2].slice(0, 30))}`;
  collapsed.set(key, (collapsed.get(key) || 0) + n);
}

const rows = [...collapsed.entries()].sort((a, b) => b[1] - a[1]);
console.log("# `set:hidden` modifier buckets\n");
for (const [b, n] of rows) console.log(`${String(n).padStart(6)}  ${b}`);
console.log("\n# sample raw buckets (top 25, uncollapsed) with examples\n");
for (const [b, n] of [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
  console.log(`\n${n}×  ${b}`);
  for (const eg of egByBucket.get(b) || []) console.log(`      ${eg}`);
}
