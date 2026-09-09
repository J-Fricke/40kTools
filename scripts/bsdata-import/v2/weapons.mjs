// ─── WEAPONS (Story A / task A3) ────────────────────────────────────────────
// unit tree -> Weapon[] (see src/core/model/unitRecord.js). Every weapon-
// bearing node in the non-cruft tree becomes one Weapon; its Ranged/Melee
// profiles become modes (P1: a weapon uses exactly one mode per phase).
//
// Characteristics are kept as RAW BSData strings ("D6", "3+", "-1", "24\"").
// No dice-averaging, no skill-to-number, no keyword parsing — the engine
// (Story B) interprets. The ingester only does structure: grouping profiles
// into a weapon, splitting modes, resolving links, and uppercasing the
// (otherwise verbatim) keyword strings.
import { walk, weaponProfiles, chars } from "./resolve.mjs";
import { isCruft } from "./filter.mjs";
import { keywordList } from "./keywordNormalize.mjs";
import { slug, uniqueId } from "./emit.mjs";

// A weapon-profile display name may be "➤ Weapon - Mode" / "Weapon - Mode" /
// "Weapon". Return { base, mode }.
function splitMode(name) {
  const n = String(name || "").replace(/^\s*[➤▶►]\s*/, "").trim();
  const m = n.match(/^(.*?)\s+[-–]\s+(.+)$/);
  return m ? { base: m[1].trim(), mode: n } : { base: n, mode: n };
}

function profileToMode(p) {
  const c = chars(p);
  const isMelee = p.typeName === "Melee Weapons";
  const mode = {
    name: splitMode(p.name).mode,
    A: str(c.A),
    S: str(c.S),
    AP: str(c.AP),
    D: str(c.D),
    keywords: keywordList(c.Keywords ?? c.keywords ?? ""),
  };
  if (isMelee) mode.WS = str(c.WS);
  else {
    mode.BS = str(c.BS);
    if (c.Range && !/melee/i.test(String(c.Range))) mode.range = str(c.Range);
  }
  if (p._qty && p._qty > 1) mode.qty = p._qty;   // "2 twin bolt cannons" — engine multiplies
  return { mode, isMelee, base: splitMode(p.name).base };
}
const str = v => (v == null ? null : String(v).trim() || null);

function weaponFromNode(node, idx) {
  const profs = weaponProfiles(node, idx);
  const byBase = new Map();
  for (const p of profs) {
    const { mode, isMelee, base } = profileToMode(p);
    const key = base || node.name;
    if (!byBase.has(key)) byBase.set(key, { name: key, ranged: [], melee: [] });
    (isMelee ? byBase.get(key).melee : byBase.get(key).ranged).push(mode);
  }
  return [...byBase.values()].map(w => {
    const out = { name: w.name };
    if (w.ranged.length) out.ranged = w.ranged;
    if (w.melee.length) out.melee = w.melee;
    if (node._qty && node._qty > 1) out.count = node._qty;
    if (/\(ref\.? only\)/i.test(w.name)) out.refOnly = true;
    return out;
  });
}

const sigOf = w => JSON.stringify([w.name, w.ranged || null, w.melee || null]);

export function collectWeapons(unitEntry, idx) {
  const taken = new Set();
  const bySig = new Map();
  for (const node of walk(unitEntry, idx, isCruft)) {
    if (!weaponProfiles(node, idx).length) continue;
    for (const w of weaponFromNode(node, idx)) {
      const sig = sigOf(w);
      if (bySig.has(sig)) continue;
      w.id = uniqueId(slug(w.name), taken);
      bySig.set(sig, w);
    }
  }
  return [...bySig.values()];
}

// Which Weapon ids does a wargear option grant?
export function weaponRefsFor(node, idx, weapons) {
  if (!weaponProfiles(node, idx).length) return [];
  const wanted = new Set();
  for (const w of weaponFromNode(node, idx)) {
    const sig = sigOf(w);
    const hit = weapons.find(x => sigOf(x) === sig) || weapons.find(x => x.name === w.name);
    if (hit) wanted.add(hit.id);
  }
  return [...wanted];
}
