// ─── WEAPONS (Story A / task A3) ────────────────────────────────────────────
// unit tree -> Weapon[] (see src/core/model/unitRecord.js). Every weapon-
// bearing node in the non-cruft tree becomes one Weapon; its Ranged/Melee
// profiles become modes (P1: a weapon uses exactly one mode per phase).
import { walk, weaponProfiles, chars } from "./resolve.mjs";
import { isCruft } from "./filter.mjs";
import { diceAverage, skillNumber } from "./dice.mjs";
import { normalizeKeywordString } from "./keywordNormalize.mjs";
import { slug, uniqueId } from "./emit.mjs";

// A weapon-profile display name may be "➤ Weapon - Mode" or "Weapon - Mode"
// or just "Weapon". Return { base, mode }.
function splitMode(name) {
  const n = String(name || "").replace(/^\s*[➤▶►]\s*/, "").trim();
  const m = n.match(/^(.*?)\s+[-–]\s+(.+)$/);
  return m ? { base: m[1].trim(), mode: n } : { base: n, mode: n };
}

function profileToMode(p) {
  const c = chars(p);
  const isMelee = p.typeName === "Melee Weapons";
  const A = diceAverage(c.A);
  let a = A == null ? 1 : A;
  if (p._qty && p._qty > 1) a *= p._qty; // "2 twin bolt cannons" etc.
  const mode = {
    name: splitMode(p.name).mode,
    A: a,
    skill: skillNumber(isMelee ? c.WS : c.BS),
    S: parseStrength(c.S),
    AP: Number(String(c.AP ?? "0").replace(/[^\d-]/g, "")) || 0,
    D: diceAverage(c.D) ?? 1,
    keywords: normalizeKeywordString(c.Keywords ?? c.keywords ?? ""),
  };
  if (!isMelee && c.Range && !/melee/i.test(c.Range)) mode.range = String(c.Range).trim();
  return { mode, isMelee, base: splitMode(p.name).base };
}

function parseStrength(s) {
  const t = String(s ?? "").trim();
  if (/^user$/i.test(t)) return null;         // "User" — resolved from the model's S elsewhere; leave null
  const n = Number(t.replace("+", ""));
  return Number.isNaN(n) ? diceAverage(t) : n;
}

export function collectWeapons(unitEntry, idx) {
  const taken = new Set();
  const bySig = new Map(); // signature -> Weapon
  for (const node of walk(unitEntry, idx, isCruft)) {
    const profs = weaponProfiles(node, idx);
    if (!profs.length) continue;
    // group this node's profiles into one weapon (its modes)
    const byBase = new Map();
    for (const p of profs) {
      const { mode, isMelee, base } = profileToMode(p);
      const key = base || node.name;
      if (!byBase.has(key)) byBase.set(key, { name: key, ranged: [], melee: [] });
      (isMelee ? byBase.get(key).melee : byBase.get(key).ranged).push(mode);
    }
    for (const w of byBase.values()) {
      const weapon = { name: w.name };
      if (w.ranged.length) weapon.ranged = w.ranged;
      if (w.melee.length) weapon.melee = w.melee;
      if (node._qty && node._qty > 1) weapon.count = node._qty;
      if (/\(ref\.? only\)/i.test(w.name)) weapon.refOnly = true;
      const sig = JSON.stringify([weapon.name, weapon.ranged, weapon.melee]);
      if (bySig.has(sig)) continue;
      weapon.id = uniqueId(slug(weapon.name), taken);
      bySig.set(sig, weapon);
    }
  }
  return [...bySig.values()];
}

// Given a wargear option node, which Weapon ids does it grant? Matched by the
// resolved weapon *name+profiles* signature, so a shared weapon used by base
// and an option resolves to the same id.
export function weaponRefsFor(node, idx, weapons) {
  const profs = weaponProfiles(node, idx);
  if (!profs.length) return [];
  const wanted = new Set();
  const byBase = new Map();
  for (const p of profs) {
    const { mode, isMelee, base } = profileToMode(p);
    if (!byBase.has(base)) byBase.set(base, { name: base, ranged: [], melee: [] });
    (isMelee ? byBase.get(base).melee : byBase.get(base).ranged).push(mode);
  }
  for (const w of byBase.values()) {
    const r = w.ranged.length ? w.ranged : undefined;
    const m = w.melee.length ? w.melee : undefined;
    const sig = JSON.stringify([w.name, r, m]);
    const hit = weapons.find(x => JSON.stringify([x.name, x.ranged, x.melee]) === sig)
      || weapons.find(x => x.name === w.name);
    if (hit) wanted.add(hit.id);
  }
  return [...wanted];
}
