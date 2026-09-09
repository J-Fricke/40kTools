// ─── RAW-ENTRY RESOLUTION HELPERS (Story A / task A1) ───────────────────────
// Reading BSData nodes: profiles (embedded or shared via infoLinks),
// characteristics, and child traversal (selectionEntries + selectionEntryGroups
// + resolved entryLinks). Ported/merged from scripts/bsdata-import/weaponHelpers.mjs
// and the P1 discover.mjs walk. `idx` is a catalogues.mjs index.

export const WEAPON_TYPES = new Set(["Ranged Weapons", "Melee Weapons"]);

// Characteristics as a name -> text map. BSData uses `$text` (sometimes `#text`).
export function chars(profile) {
  const out = {};
  for (const c of profile.characteristics || []) out[c.name] = c.$text ?? c["#text"] ?? "";
  return out;
}

// A node's profiles: embedded (`node.profiles`) + shared (`infoLinks` type
// "profile" -> catalogue sharedProfiles). Carries `_qty` through if set.
export function resolveProfiles(node, idx) {
  const embedded = node.profiles || [];
  const linked = (node.infoLinks || [])
    .filter(l => l.type === "profile")
    .map(l => idx.profile(l.targetId))
    .filter(Boolean);
  const all = [...embedded, ...linked];
  return node._qty ? all.map(p => ({ ...p, _qty: node._qty })) : all;
}

export function weaponProfiles(node, idx) {
  return resolveProfiles(node, idx).filter(p => WEAPON_TYPES.has(p.typeName));
}
export function hasWeaponProfile(node, idx) {
  return weaponProfiles(node, idx).length > 0;
}
// Non-weapon, non-"Unit" profiles = abilities (embedded + linked).
export function abilityProfiles(node, idx) {
  return resolveProfiles(node, idx).filter(p => p.typeName && p.typeName !== "Unit" && !WEAPON_TYPES.has(p.typeName));
}
export function unitProfiles(node, idx) {
  return resolveProfiles(node, idx).filter(p => p.typeName === "Unit");
}

// An entryLink can carry "N copies of this weapon" as a min===max>1
// `selections`/`parent` constraint on the LINK itself (P1: Knight Tyrant).
export function entryLinkQty(link) {
  const cs = (link.constraints || []).filter(c => c.field === "selections" && (c.scope || "parent") === "parent");
  const min = cs.find(c => c.type === "min"), max = cs.find(c => c.type === "max");
  return (min && max && min.value === max.value && min.value > 1) ? min.value : 1;
}

// Yield a node's children as { node, viaLink }. Resolves entryLinks (to shared
// entries or groups), threading entryLinkQty as `_qty` on the resolved target.
// `skip(node)` — optional predicate to prune (cruft).
export function* children(node, idx, skip) {
  for (const e of node.selectionEntries || []) {
    if (skip && skip(e)) continue;
    yield { node: e, viaLink: null };
  }
  for (const g of node.selectionEntryGroups || []) {
    if (skip && skip(g)) continue;
    yield { node: g, viaLink: null };
  }
  for (const l of node.entryLinks || []) {
    if (skip && skip(l)) continue;
    const tgt = idx.deref(l.targetId);
    if (!tgt) { yield { node: { name: l.name, _unresolved: `link -> ${l.targetId}` }, viaLink: l }; continue; }
    if (skip && skip(tgt)) continue;
    const qty = entryLinkQty(l);
    const merged = { ...tgt, name: l.name || tgt.name, id: l.id || tgt.id, _targetId: tgt.id };
    if (qty > 1) merged._qty = qty;
    // carry the link's own constraints/modifiers alongside the target's
    if (l.constraints?.length) merged._linkConstraints = l.constraints;
    if (l.modifiers?.length) merged._linkModifiers = l.modifiers;
    yield { node: merged, viaLink: l };
  }
}

// Depth-first over the whole (non-skipped) subtree, yielding every node.
export function* walk(node, idx, skip) {
  yield node;
  for (const { node: c } of children(node, idx, skip)) yield* walk(c, idx, skip);
}

// The `selections`-field min/max on a node (raw, before conditional modifiers).
export function rawLimits(node) {
  let min = 0, max = Infinity;
  for (const c of [...(node.constraints || []), ...(node._linkConstraints || [])]) {
    if (c.field !== "selections") continue;
    if (c.type === "min") min = c.value;
    else if (c.type === "max") max = c.value;
  }
  return { min, max };
}
