// ─── P1 DISCOVERY ───────────────────────────────────────────────────────────
// Reads every in-scope BSData/wh40k-11e faction catalogue and produces a
// structural census (scripts/bsdata-import/v2/DISCOVERY.md + census.json)
// plus a fixture set, so the re-architecture's ingester / wargear tree /
// keyword dictionary / ability layer can be built to cover the real data by
// construction rather than patched shape-by-shape.
//
// Usage: node scripts/bsdata-import/v2/discover.mjs [--fetch]
//   --fetch   re-download catalogues into the local cache first
//
// Not part of the shipped app — planning/analysis tooling.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, ".cache");
const OUT = __dirname;
const RAW = "https://raw.githubusercontent.com/BSData/wh40k-11e/main/";

// In-scope faction catalogues. `file` is where the units live; `deps` are
// library/shared catalogues it links into (resolved for weapon/profile refs).
// Space Marine chapter supplements + AM + Aeldari + IK + Daemons + CK carry a
// thin file that links a Library; the units can live in either.
const FACTIONS = [
  { key: "aeldari",    file: "Aeldari - Craftworlds.json",           deps: ["Aeldari - Aeldari Library.json"] },
  { key: "drukhari",   file: "Aeldari - Drukhari.json",              deps: ["Aeldari - Aeldari Library.json"] },
  { key: "daemons",    file: "Chaos - Chaos Daemons.json",           deps: ["Chaos - Chaos Daemons Library.json"] },
  { key: "chaosknights", file: "Chaos - Chaos Knights Library.json", deps: ["Chaos - Chaos Knights.json"] },
  { key: "csm",        file: "Chaos - Chaos Space Marines.json",     deps: [] },
  { key: "deathguard", file: "Chaos - Death Guard.json",             deps: [] },
  { key: "emperorschildren", file: "Chaos - Emperor's Children.json", deps: [] },
  { key: "thousandsons", file: "Chaos - Thousand Sons.json",         deps: [] },
  { key: "worldeaters", file: "Chaos - World Eaters.json",           deps: [] },
  { key: "gsc",        file: "Genestealer Cults.json",               deps: [] },
  { key: "sororitas",  file: "Imperium - Adepta Sororitas.json",     deps: [] },
  { key: "custodes",   file: "Imperium - Adeptus Custodes.json",     deps: [] },
  { key: "admech",     file: "Imperium - Adeptus Mechanicus.json",   deps: [] },
  { key: "agents",     file: "Imperium - Agents of the Imperium.json", deps: [] },
  { key: "astramilitarum", file: "Imperium - Astra Militarum.json",  deps: ["Imperium - Astra Militarum - Library.json"] },
  { key: "blacktemplars", file: "Imperium - Black Templars.json",    deps: ["Imperium - Space Marines.json"] },
  { key: "bloodangels", file: "Imperium - Blood Angels.json",        deps: ["Imperium - Space Marines.json"] },
  { key: "darkangels", file: "Imperium - Dark Angels.json",          deps: ["Imperium - Space Marines.json"] },
  { key: "deathwatch", file: "Imperium - Deathwatch.json",           deps: ["Imperium - Space Marines.json"] },
  { key: "greyknights", file: "Imperium - Grey Knights.json",        deps: [] },
  { key: "imperialfists", file: "Imperium - Imperial Fists.json",    deps: ["Imperium - Space Marines.json"] },
  { key: "imperialknights", file: "Imperium - Imperial Knights.json", deps: ["Imperium - Imperial Knights - Library.json"] },
  { key: "ironhands",  file: "Imperium - Iron Hands.json",           deps: ["Imperium - Space Marines.json"] },
  { key: "ravenguard", file: "Imperium - Raven Guard.json",          deps: ["Imperium - Space Marines.json"] },
  { key: "salamanders", file: "Imperium - Salamanders.json",         deps: ["Imperium - Space Marines.json"] },
  { key: "spacemarines", file: "Imperium - Space Marines.json",      deps: [] },
  { key: "spacewolves", file: "Imperium - Space Wolves.json",        deps: ["Imperium - Space Marines.json"] },
  { key: "ultramarines", file: "Imperium - Ultramarines.json",       deps: ["Imperium - Space Marines.json"] },
  { key: "whitescars", file: "Imperium - White Scars.json",          deps: ["Imperium - Space Marines.json"] },
  { key: "votann",     file: "Leagues of Votann.json",               deps: [] },
  { key: "necrons",    file: "Necrons.json",                         deps: [] },
  { key: "orks",       file: "Orks.json",                            deps: [] },
  { key: "tau",        file: "T'au Empire.json",                     deps: [] },
  { key: "tyranids",   file: "Tyranids.json",                        deps: ["Library - Tyranids.json"] },
];

const ALL_FILES = [...new Set(FACTIONS.flatMap(f => [f.file, ...f.deps]))];

async function fetchAll() {
  mkdirSync(CACHE, { recursive: true });
  for (const name of ALL_FILES) {
    const dest = join(CACHE, name);
    if (existsSync(dest)) continue;
    const res = await fetch(RAW + encodeURIComponent(name));
    if (!res.ok) { console.warn(`fetch ${res.status}: ${name}`); continue; }
    writeFileSync(dest, await res.text());
    console.log(`fetched ${name}`);
  }
}

const load = name => JSON.parse(readFileSync(join(CACHE, name), "utf8")).catalogue;

// ── Shared-entry index across a catalogue + its deps ────────────────────────
function buildIndex(cat, deps) {
  const idx = { entries: new Map(), groups: new Map(), profiles: new Map() };
  const add = c => {
    for (const e of c.sharedSelectionEntries || []) idx.entries.set(e.id, e);
    for (const g of c.sharedSelectionEntryGroups || []) idx.groups.set(g.id, g);
    for (const p of c.sharedProfiles || []) idx.profiles.set(p.id, p);
  };
  add(cat);
  for (const d of deps) add(load(d));
  return idx;
}

const ch = p => Object.fromEntries((p.characteristics || []).map(x => [x.name, x.$text ?? x["#text"] ?? ""]));
const kwList = p => {
  const c = ch(p);
  const s = c.Keywords || c.keywords || "";
  return s.split(",").map(x => x.trim()).filter(Boolean);
};

function resolveProfiles(node, idx) {
  const out = [...(node.profiles || [])];
  for (const il of node.infoLinks || []) {
    if (il.type === "profile" && idx.profiles.has(il.targetId)) out.push(idx.profiles.get(il.targetId));
  }
  return out;
}
const deref = (id, idx) => idx.entries.get(id) || idx.groups.get(id);

// ── Census accumulators ────────────────────────────────────────────────────
const PTS_TYPEID = "51b2-306e-1021-d207";
const census = {
  catalogues: [],
  keywords: new Map(),          // keyword -> {count, egs:Set}
  weaponProfileTypes: new Map(),
  constraintTypes: new Map(),   // "type|field|scope" -> count
  modifierShapes: new Map(),    // "modType|field | condType|condScope..." -> {count, egs:Set}
  abilityTypeNames: new Map(),  // profile typeName among non-weapon -> count
  abilityNames: new Map(),      // ability name -> {count, egs:Set, sampleText}
  wargearShapes: new Map(),     // structural signature -> {count, egs:Set}
  unitProfileLocation: { unit: 0, model: 0, none: 0 },
  noneProfileEgs: [],
  costNames: new Map(),
  hiddenMarkers: new Map(),     // how cruft subtrees are marked
  defaultSelPresence: { withDefault: 0, withoutDefault: 0 },
  mandatoryGroupDefault: { withDefault: 0, withoutDefault: 0, egsNo: [] }, // min>=1 multi-child groups
  perSizeCostUnits: [],         // units whose pts varies by size
  invulnAbilityUnits: 0, fnpAbilityUnits: 0, leaderUnits: 0,
  damageBracketUnits: [],
};
const bump = (map, key, eg) => {
  const cur = map.get(key) || { count: 0, egs: new Set() };
  cur.count++; if (eg) cur.egs.add(eg);
  map.set(key, cur);
};
const CRUFT = /crusade|battle honour|battle scar|battle trait|weapon modification|legendary veteran|blackstone|bestest bossloot|experience point|gifts? of|tyrannic war|pariah nexus/i;

let SEEN_UNITS = 0, FIXTURE_TARGETS = [];

function walkWargear(node, idx, ctx, depth, viaLink) {
  const cons = (node.constraints || []);
  for (const k of cons) bump(census.constraintTypes, `${k.type}|${k.field}|${k.scope || "parent"}`);
  for (const m of node.modifiers || []) {
    const conds = (m.conditions || []).map(c => `${c.type}/${c.scope || ""}`).join("+") || "none";
    bump(census.modifierShapes, `${m.type}:${m.field?.slice(0, 12) || "?"} when ${conds}`, `${ctx.faction}/${ctx.unit}`);
    if ((m.conditions || []).some(c => /model|selections/i.test(c.field || "") && ["atLeast", "atMost", "greaterThan", "lessThan", "equalTo"].includes(c.type))) {
      if (!census.perSizeCostUnits.includes(`${ctx.faction}/${ctx.unit}`) && /cost|pts|selections/i.test(m.field || "")) {}
    }
  }
  const childCount = (node.selectionEntries?.length || 0) + (node.entryLinks?.length || 0);
  if (childCount > 1) {
    if (node.defaultSelectionEntryId) census.defaultSelPresence.withDefault++;
    else census.defaultSelPresence.withoutDefault++;
    const minC = cons.find(k => k.type === "min" && k.field === "selections");
    if (minC && minC.value >= 1) {
      if (node.defaultSelectionEntryId) census.mandatoryGroupDefault.withDefault++;
      else { census.mandatoryGroupDefault.withoutDefault++; if (census.mandatoryGroupDefault.egsNo.length < 12) census.mandatoryGroupDefault.egsNo.push(`${ctx.faction}/${ctx.unit} › ${node.name}`); }
    }
  }

  // structural signature of this node (kind + child kinds + constraint kinds)
  const childKinds = [
    ...(node.selectionEntries || []).map(e => e.type || "entry"),
    ...(node.selectionEntryGroups || []).map(() => "group"),
    ...(node.entryLinks || []).map(l => l.type === "selectionEntryGroup" ? "linkGroup" : "linkEntry"),
  ];
  const conKinds = [...new Set(cons.map(k => `${k.type}${k.value}`))].sort().join(",");
  const hasWeapon = resolveProfiles(node, idx).some(p => /Weapons$/.test(p.typeName || ""));
  const sig = `${node.type || "group"}[${[...new Set(childKinds)].sort().join("+") || "leaf"}]${conKinds ? "{" + conKinds + "}" : ""}${hasWeapon ? "*W" : ""}`;
  if (depth <= 3) bump(census.wargearShapes, sig, `${ctx.faction}/${ctx.unit}`);

  for (const p of resolveProfiles(node, idx)) {
    if (/Weapons$/.test(p.typeName || "")) {
      bump(census.weaponProfileTypes, p.typeName);
      for (const kw of kwList(p)) {
        const c = census.keywords.get(kw) || { count: 0, egs: new Set() };
        c.count++; if (c.egs.size < 3) c.egs.add(`${ctx.faction}/${p.name}`);
        census.keywords.set(kw, c);
      }
    }
  }

  for (const e of node.selectionEntries || []) if (!CRUFT.test(e.name)) walkWargear(e, idx, ctx, depth + 1);
  for (const g of node.selectionEntryGroups || []) if (!CRUFT.test(g.name)) walkWargear(g, idx, ctx, depth + 1);
  for (const il of node.entryLinks || []) {
    if (CRUFT.test(il.name || "")) continue;
    const tgt = deref(il.targetId, idx);
    if (tgt) walkWargear({ ...tgt, name: il.name || tgt.name }, idx, ctx, depth + 1, il);
  }
}

function analyzeUnit(link, cat, idx, factionKey) {
  const u = idx.entries.get(link.targetId);
  if (!u || u.type !== "unit" && u.type !== "model") return;
  SEEN_UNITS++;
  const ctx = { faction: factionKey, unit: u.name };

  // stats — Unit profile may be on the unit, on a model sub-entry (1-2 levels
  // deep), or reached via infoLinks to sharedProfiles.
  const unitProfilesOf = node => [
    ...(node.profiles || []).filter(p => p.typeName === "Unit"),
    ...(node.infoLinks || []).filter(l => l.type === "profile").map(l => idx.profiles.get(l.targetId)).filter(p => p && p.typeName === "Unit"),
  ];
  let where = "none";
  const own = unitProfilesOf(u);
  if (own.length) where = "unit";
  else {
    const kids = [
      ...(u.selectionEntries || []),
      ...(u.selectionEntryGroups || []).flatMap(g => g.selectionEntries || []),
      ...(u.entryLinks || []).map(l => deref(l.targetId, idx)).filter(Boolean),
    ];
    const grandkids = kids.flatMap(k => [...(k.selectionEntries || []), ...(k.entryLinks || []).map(l => deref(l.targetId, idx)).filter(Boolean)]);
    if ([...kids, ...grandkids].some(e => unitProfilesOf(e).length)) where = "model";
  }
  census.unitProfileLocation[where]++;
  if (where === "none" && census.noneProfileEgs.length < 20) census.noneProfileEgs.push(`${factionKey}/${u.name} (type:${u.type})`);
  if (own.length > 1) census.damageBracketUnits.push(`${factionKey}/${u.name}`);

  // invuln / FNP / leader are abilities, not Unit-profile characteristics
  const allAbil = [
    ...(u.profiles || []),
    ...(u.infoLinks || []).filter(l => l.type === "profile").map(l => idx.profiles.get(l.targetId)).filter(Boolean),
  ];
  if (allAbil.some(p => /invulnerable save/i.test(p.name || ""))) census.invulnAbilityUnits++;
  if (allAbil.some(p => /feel no pain/i.test((p.name || "") + (ch(p).Description || "")))) census.fnpAbilityUnits++;
  if (allAbil.some(p => /^(leader|support|attached unit)$/i.test(p.name || ""))) census.leaderUnits++;

  // abilities
  for (const p of u.profiles || []) {
    if (!/Weapons$/.test(p.typeName || "") && p.typeName !== "Unit") {
      bump(census.abilityTypeNames, p.typeName || "?");
      const c = census.abilityNames.get(p.name) || { count: 0, egs: new Set(), sample: "" };
      c.count++; if (c.egs.size < 2) c.egs.add(factionKey);
      if (!c.sample) c.sample = (ch(p).Description || "").slice(0, 140);
      census.abilityNames.set(p.name, c);
    }
  }
  for (const il of u.infoLinks || []) {
    if (il.type === "profile") {
      const p = idx.profiles.get(il.targetId);
      if (p && !/Weapons$|^Unit$/.test(p.typeName || "")) {
        bump(census.abilityTypeNames, p.typeName || "?");
        const c = census.abilityNames.get(p.name) || { count: 0, egs: new Set(), sample: "" };
        c.count++; c.egs.add(factionKey);
        if (!c.sample) c.sample = (ch(p).Description || "").slice(0, 140);
        census.abilityNames.set(p.name, c);
      }
    }
  }

  // costs
  for (const c of u.costs || []) if (c.value != null) bump(census.costNames, c.name);
  // per-size points: a modifier that sets/changes the pts cost-type field,
  // conditioned on a model-count threshold (see SM Terminator Squad:
  // set pts=320 when selections atLeast 6).
  const sizeCostMod = (u.modifiers || []).find(m => m.field === PTS_TYPEID
    && ["set", "increment", "decrement"].includes(m.type)
    && (m.conditions || []).some(c => ["atLeast", "atMost", "greaterThan", "lessThan", "equalTo"].includes(c.type)));
  if (sizeCostMod) census.perSizeCostUnits.push(`${factionKey}/${u.name}`);

  // wargear tree
  for (const e of u.selectionEntries || []) if (!CRUFT.test(e.name)) walkWargear(e, idx, ctx, 0);
  for (const g of u.selectionEntryGroups || []) if (!CRUFT.test(g.name)) walkWargear(g, idx, ctx, 0);
  for (const il of u.entryLinks || []) {
    if (CRUFT.test(il.name || "")) continue;
    const tgt = deref(il.targetId, idx);
    if (tgt) walkWargear({ ...tgt, name: il.name || tgt.name }, idx, ctx, 0, il);
  }
}

// ── Fixture extraction: self-contained unit bundle ─────────────────────────
// unit entry + every shared entry/group/profile it transitively references,
// so P2/P3 tests don't need the whole catalogue.
const FIXTURES = [
  ["greyknights", "Venerable Dreadnought"], ["greyknights", "Strike Squad"],
  ["orks", "Deff Dread"], ["orks", "Boyz"], ["orks", "Meganobz"],
  ["chaosknights", "Knight Despoiler"],
  ["custodes", "Custodian Guard"], ["custodes", "Caladius Grav-tank"],
  ["spacemarines", "Terminator Squad"], ["spacemarines", "Ballistus Dreadnought"],
  ["astramilitarum", "Leman Russ Battle Tank"],
  ["tau", "Crisis Fireknife Battlesuits"],
  ["aeldari", "Wraithknight"],
  ["necrons", "Necron Warriors"],
  ["tyranids", "Termagants"],
];
function bundle(u, idx) {
  const seen = { e: {}, g: {}, p: {} };
  const visit = node => {
    if (!node) return;
    for (const il of node.infoLinks || []) if (il.type === "profile" && idx.profiles.has(il.targetId) && !seen.p[il.targetId]) seen.p[il.targetId] = idx.profiles.get(il.targetId);
    for (const il of node.entryLinks || []) {
      if (CRUFT.test(il.name || "")) continue;
      const t = deref(il.targetId, idx);
      if (!t || CRUFT.test(t.name || "")) continue;
      const bag = idx.entries.has(il.targetId) ? seen.e : seen.g;
      if (!bag[il.targetId]) { bag[il.targetId] = t; visit(t); }
    }
    for (const s of node.selectionEntries || []) if (!CRUFT.test(s.name || "")) visit(s);
    for (const g of node.selectionEntryGroups || []) if (!CRUFT.test(g.name || "")) visit(g);
  };
  visit(u);
  return { unit: u, shared: { entries: seen.e, groups: seen.g, profiles: seen.p } };
}

// ── Run ────────────────────────────────────────────────────────────────────
if (process.argv.includes("--fetch")) await fetchAll();

for (const fac of FACTIONS) {
  if (!existsSync(join(CACHE, fac.file))) { console.warn(`missing cache: ${fac.file}`); continue; }
  const cat = load(fac.file);
  const idx = buildIndex(cat, fac.deps);
  const unitLinks = (cat.entryLinks || []).filter(l => l.type === "selectionEntry" && idx.entries.has(l.targetId)
    && ["unit", "model"].includes(idx.entries.get(l.targetId).type));
  // Some catalogues (SM chapters) carry few/no units directly — units come via
  // the library. Count what THIS file exposes as a top-level entryLink.
  census.catalogues.push({ key: fac.key, file: fac.file, deps: fac.deps, name: cat.name, units: unitLinks.length });
  for (const l of unitLinks) analyzeUnit(l, cat, idx, fac.key);

  for (const [fk, uname] of FIXTURES) {
    if (fk !== fac.key) continue;
    const link = unitLinks.find(l => idx.entries.get(l.targetId)?.name === uname) || (cat.entryLinks || []).find(l => l.name === uname);
    const u = link && idx.entries.get(link.targetId);
    if (!u) { console.warn(`fixture not found: ${fk}/${uname}`); continue; }
    mkdirSync(join(OUT, "fixtures"), { recursive: true });
    writeFileSync(join(OUT, "fixtures", `${fk}--${uname.replace(/[^a-z0-9]+/gi, "-")}.json`), JSON.stringify(bundle(u, idx), null, 1));
  }
}

// ── Emit ───────────────────────────────────────────────────────────────────
const top = (map, n = 40, sort = (a, b) => b[1].count - a[1].count) =>
  [...map.entries()].sort(sort).slice(0, n);
const asRows = (map, n) => top(map, n).map(([k, v]) =>
  `| \`${k.replace(/\|/g, " · ")}\` | ${v.count} | ${[...(v.egs || [])].slice(0, 3).join(", ")} |`).join("\n");

const md = `# P1 — BSData structural discovery

Generated by \`scripts/bsdata-import/v2/discover.mjs\` against
\`BSData/wh40k-11e\` (cached). ${census.catalogues.length} in-scope faction
catalogues, ${SEEN_UNITS} unit entries analysed.

## 1. Catalogue inventory

| faction | file | units (top-level links) | library deps |
|---|---|---|---|
${census.catalogues.map(c => `| ${c.key} | ${c.file} | ${c.units} | ${c.deps.join(", ") || "—"} |`).join("\n")}

> A low "units" count on a Space Marine chapter file means its units resolve
> through \`Imperium - Space Marines.json\` (the library) — the ingester must
> load the chapter file for its detachments/enhancements and the library for
> the shared datasheets.

## 2. Weapon profile types

${[...census.weaponProfileTypes.entries()].map(([k, v]) => `- \`${k}\` ×${v.count}`).join("\n")}

## 3. Weapon keyword census (${census.keywords.size} distinct)

| keyword | count | examples |
|---|---|---|
${asRows(census.keywords, 200)}

## 4. Constraint types

| type · field · scope | count |
|---|---|
${top(census.constraintTypes, 40).map(([k, v]) => `| \`${k.replace(/\|/g, " · ")}\` | ${v.count} |`).join("\n")}

## 5. Modifier + condition shapes

| shape | count | examples |
|---|---|---|
${asRows(census.modifierShapes, 60)}

## 6. Wargear structural signatures (depth ≤ 3)

signature = \`nodeType[childKinds]{constraints}\` (\`*W\` = carries a weapon profile)

| signature | count | examples |
|---|---|---|
${asRows(census.wargearShapes, 80)}

## 7. Default selection

- multi-child groups/choices WITH \`defaultSelectionEntryId\`: **${census.defaultSelPresence.withDefault}**
- multi-child groups/choices WITHOUT one: **${census.defaultSelPresence.withoutDefault}**

**Mandatory (\`min>=1\`) multi-child groups** — the ones that actually need a
default resolved:
- WITH \`defaultSelectionEntryId\`: **${census.mandatoryGroupDefault.withDefault}**
- WITHOUT: **${census.mandatoryGroupDefault.withoutDefault}**
${census.mandatoryGroupDefault.egsNo.map(e => `  - ${e}`).join("\n")}

## 8. Ability profile typeNames

| typeName | count |
|---|---|
${top(census.abilityTypeNames, 40).map(([k, v]) => `| ${k} | ${v.count} |`).join("\n")}

## 9. Ability names (top 80 by frequency)

| ability | count | factions | sample text |
|---|---|---|---|
${top(census.abilityNames, 80).map(([k, v]) => `| ${k} | ${v.count} | ${[...v.egs].join(",")} | ${(v.sample || "").replace(/\n/g, " ")} |`).join("\n")}

## 10. Stats & points

- Unit profile location: unit=${census.unitProfileLocation.unit}, model=${census.unitProfileLocation.model}, none=${census.unitProfileLocation.none}
- "none" examples: ${census.noneProfileEgs.slice(0, 12).join("; ")}
- Cost names seen: ${[...census.costNames.keys()].join(", ")}
- Units with a size-dependent \`pts\` modifier: **${[...new Set(census.perSizeCostUnits)].length}**
- Units with multiple Unit profiles (damage brackets): ${census.damageBracketUnits.length} (${census.damageBracketUnits.join(", ")})
- Units with an "Invulnerable Save" ability (inv save is an ability, not a Unit char): **${census.invulnAbilityUnits}**
- Units with a Feel No Pain ability: **${census.fnpAbilityUnits}**
- Units with a Leader / Support / Attached-Unit ability: **${census.leaderUnits}**

## 11. Filter (cruft) markers

Blocklist regex currently used: \`${CRUFT.source}\`

---

Machine-readable dump: \`census.json\`.

## 12. Findings vs. Plan (S1 delta)

See \`FINDINGS.md\` — the interpretation and any Plan adjustments.
`;

writeFileSync(join(OUT, "DISCOVERY.md"), md);
writeFileSync(join(OUT, "census.json"), JSON.stringify({
  catalogues: census.catalogues,
  keywords: [...census.keywords.entries()].map(([k, v]) => [k, v.count]),
  constraintTypes: [...census.constraintTypes.entries()].map(([k, v]) => [k, v.count]),
  modifierShapes: top(census.modifierShapes, 200).map(([k, v]) => [k, v.count]),
  wargearShapes: top(census.wargearShapes, 200).map(([k, v]) => [k, v.count]),
  abilityNames: top(census.abilityNames, 400).map(([k, v]) => [k, v.count]),
  defaultSelPresence: census.defaultSelPresence,
  mandatoryGroupDefault: census.mandatoryGroupDefault,
  unitProfileLocation: census.unitProfileLocation,
  noneProfileEgs: census.noneProfileEgs,
  damageBracketUnits: census.damageBracketUnits,
  perSizeCostUnits: [...new Set(census.perSizeCostUnits)],
  invulnAbilityUnits: census.invulnAbilityUnits,
  fnpAbilityUnits: census.fnpAbilityUnits,
  leaderUnits: census.leaderUnits,
}, null, 2));

console.log(`\nWrote DISCOVERY.md + census.json to ${OUT}`);
console.log(`${SEEN_UNITS} units · ${census.keywords.size} keywords · ${census.wargearShapes.size} wargear signatures · ${census.abilityNames.size} ability names`);
