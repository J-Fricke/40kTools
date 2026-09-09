// ─── CATALOGUE MAP + INDEX (Story A / task A1) ──────────────────────────────
// The single source of "which BSData files an ingest run reads" and how a
// faction's primary catalogue merges with its library dependencies into one
// lookup index. Reads from the local cache (scripts/bsdata-import/v2/.cache/,
// populated by discover.mjs --fetch). No app imports.
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CACHE = join(__dirname, ".cache");

// `file` holds the faction's units; `deps` are library/shared catalogues it
// links into for weapon/profile/entry references (verified in P1 discovery).
export const CATALOGUES = [
  { key: "aeldari",         file: "Aeldari - Craftworlds.json",             deps: ["Aeldari - Aeldari Library.json"] },
  { key: "drukhari",        file: "Aeldari - Drukhari.json",                deps: ["Aeldari - Aeldari Library.json"] },
  { key: "daemons",         file: "Chaos - Chaos Daemons.json",             deps: ["Chaos - Chaos Daemons Library.json"] },
  { key: "chaosknights",    file: "Chaos - Chaos Knights Library.json",     deps: ["Chaos - Chaos Knights.json"] },
  { key: "csm",             file: "Chaos - Chaos Space Marines.json",       deps: [] },
  { key: "deathguard",      file: "Chaos - Death Guard.json",               deps: [] },
  { key: "emperorschildren", file: "Chaos - Emperor's Children.json",       deps: [] },
  { key: "thousandsons",    file: "Chaos - Thousand Sons.json",             deps: [] },
  { key: "worldeaters",     file: "Chaos - World Eaters.json",              deps: [] },
  { key: "gsc",             file: "Genestealer Cults.json",                 deps: [] },
  { key: "sororitas",       file: "Imperium - Adepta Sororitas.json",       deps: [] },
  { key: "custodes",        file: "Imperium - Adeptus Custodes.json",       deps: [] },
  { key: "admech",          file: "Imperium - Adeptus Mechanicus.json",     deps: [] },
  { key: "agents",          file: "Imperium - Agents of the Imperium.json", deps: [] },
  { key: "astramilitarum",  file: "Imperium - Astra Militarum.json",        deps: ["Imperium - Astra Militarum - Library.json"] },
  { key: "blacktemplars",   file: "Imperium - Black Templars.json",         deps: ["Imperium - Space Marines.json"] },
  { key: "bloodangels",     file: "Imperium - Blood Angels.json",           deps: ["Imperium - Space Marines.json"] },
  { key: "darkangels",      file: "Imperium - Dark Angels.json",            deps: ["Imperium - Space Marines.json"] },
  { key: "deathwatch",      file: "Imperium - Deathwatch.json",             deps: ["Imperium - Space Marines.json"] },
  { key: "greyknights",     file: "Imperium - Grey Knights.json",           deps: [] },
  { key: "imperialfists",   file: "Imperium - Imperial Fists.json",         deps: ["Imperium - Space Marines.json"] },
  { key: "imperialknights", file: "Imperium - Imperial Knights.json",       deps: ["Imperium - Imperial Knights - Library.json"] },
  { key: "ironhands",       file: "Imperium - Iron Hands.json",             deps: ["Imperium - Space Marines.json"] },
  { key: "ravenguard",      file: "Imperium - Raven Guard.json",            deps: ["Imperium - Space Marines.json"] },
  { key: "salamanders",     file: "Imperium - Salamanders.json",            deps: ["Imperium - Space Marines.json"] },
  { key: "spacemarines",    file: "Imperium - Space Marines.json",          deps: [] },
  { key: "spacewolves",     file: "Imperium - Space Wolves.json",           deps: ["Imperium - Space Marines.json"] },
  { key: "ultramarines",    file: "Imperium - Ultramarines.json",           deps: ["Imperium - Space Marines.json"] },
  { key: "whitescars",      file: "Imperium - White Scars.json",            deps: ["Imperium - Space Marines.json"] },
  { key: "votann",          file: "Leagues of Votann.json",                 deps: [] },
  { key: "necrons",         file: "Necrons.json",                           deps: [] },
  { key: "orks",            file: "Orks.json",                              deps: [] },
  { key: "tau",             file: "T'au Empire.json",                       deps: [] },
  { key: "tyranids",        file: "Tyranids.json",                          deps: ["Library - Tyranids.json"] },
];

const loadRaw = name => JSON.parse(readFileSync(join(CACHE, name), "utf8")).catalogue;

// Build a lookup index from one or more catalogue objects.
export function makeIndex(catalogues) {
  const entries = new Map(), groups = new Map(), profiles = new Map(), rules = new Map();
  for (const c of catalogues) {
    for (const e of c.sharedSelectionEntries || []) entries.set(e.id, e);
    for (const g of c.sharedSelectionEntryGroups || []) groups.set(g.id, g);
    for (const p of c.sharedProfiles || []) profiles.set(p.id, p);
    for (const r of c.sharedRules || []) rules.set(r.id, r.name);
  }
  const primary = catalogues[0];
  return {
    entry: id => entries.get(id),
    group: id => groups.get(id),
    profile: id => profiles.get(id),
    rule: id => rules.get(id),
    deref: id => entries.get(id) || groups.get(id),
    catalogueName: primary?.name,
    catalogueId: primary?.id,
    _sizes: { entries: entries.size, groups: groups.size, profiles: profiles.size },
  };
}

// Load a faction: its primary catalogue + a merged index over primary+deps.
export function loadFaction(key) {
  const spec = CATALOGUES.find(c => c.key === key);
  if (!spec) throw new Error(`unknown faction: ${key}`);
  if (!existsSync(join(CACHE, spec.file))) throw new Error(`not cached: ${spec.file} (run discover.mjs --fetch)`);
  const primary = loadRaw(spec.file);
  const deps = spec.deps.filter(d => existsSync(join(CACHE, d))).map(loadRaw);
  return { key, spec, catalogue: primary, index: makeIndex([primary, ...deps]) };
}

// Fixture mode: an index over one unit bundle (discover.mjs `bundle` shape:
// { unit, shared: { entries:{id:e}, groups:{id:g}, profiles:{id:p} } }).
export function fixtureIndex(bundle) {
  return makeIndex([{
    name: `fixture:${bundle.unit.name}`,
    sharedSelectionEntries: Object.values(bundle.shared.entries || {}),
    sharedSelectionEntryGroups: Object.values(bundle.shared.groups || {}),
    sharedProfiles: Object.values(bundle.shared.profiles || {}),
  }]);
}
