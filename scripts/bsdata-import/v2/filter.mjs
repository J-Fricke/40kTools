// ─── CRUFT FILTER (Story A / task A1) ───────────────────────────────────────
// Which BSData subtrees the ingester drops as not-matched-play. Per P1
// FINDINGS.md §4: static hidden + name blocklist + the ~400 unit-tree
// `set:hidden` modifiers that gate on sub-faction / Legends / roster scope /
// the Chaos Daemons "Show <god>" toggles. The ~15 genuine intra-unit
// "hide option X if you have Y" modifiers are NOT cruft — they are kept on
// the node for constraintEval to turn into an effective max:0.

export const CRUFT_NAME = new RegExp([
  "crusade", "battle honour", "battle scar", "battle trait", "weapon modification",
  "legendary veteran", "blackstone", "bestest bossloot", "experience point",
  "gifts? of", "tyrannic war", "pariah nexus", "^show .+ (daemons|units)$",
  "battle tall(y|ies)", "relic fragments?",
  // roster / detachment chrome — not unit wargear (Story A non-goals; Story C/D)
  "^warlord$", "^enhancements?$", "^show/hide options$", "^detachment$",
  "^order of battle$", "^additional (rules|options)$",
  // other game modes / non-matched-play upgrade branches
  "boarding\\s*acti+ons?", "combat patrol", "weapon modifications?",
  "^(abilit(y|ies|ies)|abilties)$",   // ability groups are not wargear (Story C)
].join("|"), "i");

const SCOPE_LIST_LEGALITY = new Set(["roster", "force", "primary-catalogue"]);
// condition.type -> whether it's a "count" comparison (vs instanceOf membership)
const COUNT_TYPES = new Set(["atLeast", "atMost", "equalTo", "greaterThan", "lessThan"]);

// A `set:hidden` modifier is "cruft gating" (drop the node) rather than a real
// intra-unit constraint (keep it) when it has no conditions (always hidden),
// or every condition is list-legality (roster/force/catalogue scope) or an
// instanceOf/notInstanceOf membership test (sub-faction / detachment / Legends
// gating). It's a REAL constraint only when it counts sibling `selections`
// within the unit (parent / self / model / unit / entry-guid scope).
function hideModifierIsCruft(mod) {
  const conds = mod.conditions || [];
  const groups = mod.conditionGroups || [];
  if (!conds.length && !groups.length) return true; // unconditional static hide
  const flat = [...conds, ...groups.flatMap(g => g.conditions || [])];
  return flat.every(c => {
    const scope = c.scope || "parent";
    if (SCOPE_LIST_LEGALITY.has(scope)) return true;
    if (["instanceOf", "notInstanceOf"].includes(c.type)) return true;
    if (COUNT_TYPES.has(c.type) && ["parent", "self", "model", "unit", "model-or-unit"].includes(scope)) return false; // intra-unit → keep
    return true; // guid-scoped / anything else we don't act on → treat as cruft-gate
  });
}

// Does this node carry a genuine intra-unit hide constraint? (kept for eval)
export function intraUnitHideModifiers(node) {
  return [...(node.modifiers || []), ...(node._linkModifiers || [])]
    .filter(m => m.type === "set" && m.field === "hidden" && !hideModifierIsCruft(m));
}

// isCruft(node): prune it and its subtree from the wargear/weapon walk.
export function isCruft(node) {
  if (!node) return false;
  if (node.hidden === true) {
    // statically hidden AND not carrying a real intra-unit hide → drop
    if (!intraUnitHideModifiers(node).length) return true;
  }
  if (node.name && CRUFT_NAME.test(node.name)) return true;
  const hideMods = [...(node.modifiers || []), ...(node._linkModifiers || [])]
    .filter(m => m.type === "set" && m.field === "hidden");
  if (hideMods.length && hideMods.every(hideModifierIsCruft) && !intraUnitHideModifiers(node).length) {
    // every hide-modifier is a cruft gate — but only prune if it's also
    // currently pointing at hidden (unconditional) OR it's a known cruft name.
    // Conditional sub-faction gates on a REAL wargear node: keep the node
    // visible (per FINDINGS §4 resolution — show conditionally-hidden wargear).
    if (hideMods.some(m => !(m.conditions?.length) && !(m.conditionGroups?.length))) return true;
  }
  return false;
}
