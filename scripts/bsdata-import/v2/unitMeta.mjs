// ─── UNIT META: stats, size, points, keywords, abilities (Story A / task A2) ─
import { chars, resolveProfiles, children, walk, unitProfiles } from "./resolve.mjs";
import { isCruft, CRUFT_NAME } from "./filter.mjs";
import { slug } from "./emit.mjs";

const PTS_TYPEID = "51b2-306e-1021-d207";
const COUNT_TYPES = new Set(["atLeast", "atMost", "equalTo", "greaterThan", "lessThan"]);

const num = (v, d = 0) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? d : n;
};

// ── stats ──────────────────────────────────────────────────────────────────
function findUnitProfile(unit, idx) {
  const own = unitProfiles(unit, idx);
  if (own.length) return { profs: own, where: "unit" };
  // Otherwise the first Unit profile anywhere in the subtree — squads nest
  // models under "Unit Composition" / size groups several levels deep (AM,
  // GSC), the profile is often an infoLink to a sharedProfile, and some model
  // variants are `hidden` (conditionally available) — so use a NAME-only skip
  // here, not the full cruft filter.
  const nameSkip = n => n && n.name && CRUFT_NAME.test(n.name);
  for (const n of walk(unit, idx, nameSkip)) {
    if (n === unit) continue;
    const p = unitProfiles(n, idx);
    if (p.length) return { profs: p, where: "model" };
  }
  return { profs: [], where: "none" };
}

function invFromAbilities(abilities) {
  for (const a of abilities) {
    if (!/invulnerable save/i.test(a.name)) continue;
    const m = (a.text || a.name).match(/(\d)\s*\+/);
    if (m) return { InvSv: `${m[1]}+`, InvSvNote: /against|vs\b/i.test(a.text || "") ? a.text : undefined };
  }
  return {};
}
function fnpFromAbilities(abilities) {
  for (const a of abilities) {
    const m = (`${a.name} ${a.text || ""}`).match(/feel no pain\s*(\d)\s*\+/i);
    if (m) return `${m[1]}+`;
  }
  return null;
}

function statsOf(unit, idx, abilities, report, unitLabel) {
  const { profs, where } = findUnitProfile(unit, idx);
  if (where === "none") report?.noStats.push(unitLabel);
  if (profs.length > 1) report?.damageBrackets.push(unitLabel);
  const c = profs.length ? chars(profs[0]) : {};
  const invChar = (c.InvSv ?? c.InSv ?? "").toString().replace(/[^0-9+]/g, "").trim();
  const stats = {
    M: (c.M ?? "").toString().trim() || null,
    T: num(c.T, null),
    Sv: (c.Sv ?? "").toString().trim() || null,
    W: num(c.W, null),
    OC: num(c.OC, null),
    InvSv: invChar || null,
    FNP: null,
  };
  if (!stats.InvSv) {
    const inv = invFromAbilities(abilities);
    if (inv.InvSv) { stats.InvSv = inv.InvSv; if (inv.InvSvNote) stats.InvSvNote = inv.InvSvNote; }
  }
  stats.FNP = fnpFromAbilities(abilities);
  return stats;
}

// ── abilities ──────────────────────────────────────────────────────────────
const NON_ABILITY_TYPE = /^(unit|ranged weapons|melee weapons)$/i;
function abilitiesOf(unit, idx) {
  const out = [];
  const seenNames = new Set();
  const add = p => {
    if (!p || NON_ABILITY_TYPE.test(p.typeName || "")) return;
    const name = (p.name || "").trim();
    if (!name || seenNames.has(name + p.typeName)) return;
    seenNames.add(name + p.typeName);
    const text = chars(p).Description || chars(p).description || "";
    const a = { name, text: text.trim() };
    if (/^damaged:\s*\d/i.test(name)) a.bracket = true;
    out.push(a);
  };
  for (const p of resolveProfiles(unit, idx)) add(p);
  // profiles hanging off immediate children that are ability-only upgrades
  for (const { node: k } of children(unit, idx, isCruft)) {
    if (/wargear|weapon|enhancement/i.test(k.name || "")) continue;
    for (const p of resolveProfiles(k, idx)) add(p);
  }
  return out;
}

// ── keywords ───────────────────────────────────────────────────────────────
function keywordsOf(unit) {
  return [...new Set((unit.categoryLinks || [])
    .map(c => (c.name || "").toLowerCase().trim())
    .filter(Boolean))].sort();
}

// ── size ───────────────────────────────────────────────────────────────────
function sizeOf(unit, idx) {
  for (const { node: g } of children(unit, idx, isCruft)) {
    const kids = [...children(g, idx, isCruft)].map(x => x.node);
    const models = kids.filter(k => k.type === "model" || k._targetId && k.type === "model");
    if (!models.length && !/\d+\s*[-–]\s*\d+/.test(g.name || "")) continue;
    let min = 0, max = 0;
    for (const c of g.constraints || []) {
      if (c.field !== "selections") continue;
      if (c.type === "min") min = c.value;
      if (c.type === "max") max = c.value;
    }
    // + a mandatory leader model (e.g. "Justicar") sitting as a sibling group
    let leader = 0;
    for (const { node: g2 } of children(unit, idx, isCruft)) {
      if (g2 === g) continue;
      const lk = [...children(g2, idx, isCruft)].map(x => x.node).filter(k => k.type === "model");
      for (const m of lk) {
        const mn = (m.constraints || []).find(c => c.type === "min" && c.field === "selections");
        if (mn && mn.value >= 1) leader = Math.max(leader, 1);
      }
    }
    if (max) return { min: (min || 1) + leader, max: max + leader };
  }
  return { min: 1, max: 1 };
}

// ── points per size ────────────────────────────────────────────────────────
function pointsOf(unit, size, report, unitLabel) {
  const base = num((unit.costs || []).find(c => c.name === "pts")?.value, 0);
  // (threshold, value) pairs from pts-field modifiers with a count condition
  const tiers = [{ at: size.min, pts: base }];
  for (const m of unit.modifiers || []) {
    if (m.field !== PTS_TYPEID) continue;
    if (!["set", "increment", "decrement"].includes(m.type)) continue;
    const conds = [...(m.conditions || []), ...(m.conditionGroups || []).flatMap(g => g.conditions || [])];
    const countCond = conds.find(c => COUNT_TYPES.has(c.type) && c.value != null);
    if (!countCond) {
      report?.unresolvedNodes.push({ unit: unitLabel, path: "points", reason: `pts modifier ${m.type} with non-count condition` });
      continue;
    }
    let at = countCond.value;
    if (countCond.type === "greaterThan") at += 1;
    tiers.push({ at, pts: m.type === "set" ? m.value : base + (m.type === "increment" ? m.value : -m.value) });
  }
  tiers.sort((a, b) => a.at - b.at);
  const ptsAt = s => { let p = base; for (const t of tiers) if (s >= t.at) p = t.pts; return p; };
  // Players field a unit at min or max size; emit those two rows (deduped).
  // A mid-range tier boundary is still reflected in the max row.
  const sizes = [...new Set([size.min || 1, size.max || 1])].sort((a, b) => a - b);
  return sizes.map(s => ({ models: s, pts: ptsAt(s) }));
}

// ── main ───────────────────────────────────────────────────────────────────
export function unitMeta(unit, idx, faction, report) {
  const name = (unit.name || "").trim();
  const label = `${faction}/${name}`;
  const abilities = abilitiesOf(unit, idx);
  const size = sizeOf(unit, idx);
  return {
    id: `${faction}/${slug(name)}`,
    faction,
    name,
    keywords: keywordsOf(unit),
    stats: statsOf(unit, idx, abilities, report, label),
    size,
    points: pointsOf(unit, size, report, label),
    abilities,
    provenance: { catalogue: idx.catalogueName, entryId: unit._targetId || unit.id },
  };
}
