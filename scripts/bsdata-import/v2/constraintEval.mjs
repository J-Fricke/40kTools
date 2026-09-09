// ─── CONSTRAINT EVALUATOR (Story A / task A4) ───────────────────────────────
// Given a wargear node and a build state, return the node's EFFECTIVE
// {min,max} — the raw `selections` constraints adjusted by any conditional
// modifier whose conditions currently pass. BattleScribe's condition
// vocabulary is closed (P1): none / atLeast / atMost / equalTo / greaterThan
// / lessThan / instanceOf / notInstanceOf.
//
// Build state:
//   modelCount : chosen squad size
//   selections : { [entryId]: count }  — how many of each entry are chosen
// `roster` / `force` / catalogue-scoped conditions are treated as satisfied
// (we do not model the army list — parent-plan R12).

const COUNT_CMP = {
  atLeast: (a, b) => a >= b,
  atMost: (a, b) => a <= b,
  equalTo: (a, b) => a === b,
  greaterThan: (a, b) => a > b,
  lessThan: (a, b) => a < b,
};
const LIST_SCOPES = new Set(["roster", "force", "primary-catalogue", "primary-category"]);

// count of what a condition refers to, in the current state
function countFor(cond, state) {
  const { childId, scope } = cond;
  // "model" child = the unit's model count (the squad-scaling case)
  if (childId === "model" || childId === "unit") return state.modelCount ?? 1;
  // an entry id -> how many of it are selected
  if (childId && state.selections && state.selections[childId] != null) return state.selections[childId];
  // scope is itself a selection-entry guid we don't track -> 0
  return 0;
}

export function conditionPasses(cond, state) {
  const scope = cond.scope || "parent";
  if (LIST_SCOPES.has(scope)) return true; // list legality — not modelled
  if (cond.type === "instanceOf" || cond.type === "notInstanceOf") {
    // "is X selected / in this branch" — for a per-unit tool we can't fully
    // resolve sub-faction/detachment membership; treat as satisfied so the
    // option stays available (FINDINGS §4 resolution).
    return true;
  }
  const cmp = COUNT_CMP[cond.type];
  if (!cmp) return true;
  return cmp(countFor(cond, state), cond.value);
}

function modifierApplies(mod, state) {
  const conds = mod.conditions || [];
  const groups = mod.conditionGroups || [];
  if (!conds.length && !groups.length) return true;
  const condOk = conds.every(c => conditionPasses(c, state));
  const groupOk = groups.every(g => {
    const list = (g.conditions || []).map(c => conditionPasses(c, state));
    return g.type === "or" ? list.some(Boolean) : list.every(Boolean);
  });
  return condOk && groupOk;
}

// node: a raw BSData selectionEntry/Group (with .constraints, .modifiers, and
// optionally _linkConstraints/_linkModifiers from resolve.children).
export function effectiveLimits(node, state = { modelCount: 1, selections: {} }) {
  let min = 0, max = Infinity;
  const cons = [...(node.constraints || []), ...(node._linkConstraints || [])];
  for (const c of cons) {
    if (c.field !== "selections") continue;
    if (c.type === "min") min = c.value;
    else if (c.type === "max") max = c.value;
  }
  const consById = new Map(cons.map(c => [c.id, c]));
  const mods = [...(node.modifiers || []), ...(node._linkModifiers || [])];
  for (const m of mods) {
    if (!["set", "increment", "decrement"].includes(m.type)) continue;
    if (!modifierApplies(m, state)) continue;
    if (m.field === "hidden") { max = 0; continue; }         // a passing hide => unavailable
    const target = consById.get(m.field);                     // modifier -> a min/max constraint on this node
    if (!target || target.field !== "selections") continue;
    const cur = target.type === "min" ? min : max;
    const next = m.type === "set" ? m.value
      : m.type === "increment" ? cur + m.value
      : cur - m.value;
    if (target.type === "min") min = next; else max = next;
  }
  if (max < min) max = min;
  return { min, max: max === Infinity ? null : max };
}

// ── Distilled form (what A5 emits, what Story D evaluates) ──────────────────
// A record node carries { min, max, conditions?: [{ target, op, value, when:
// [ {type, childId, scope, value} ] }] }. `max: null` = unlimited.

// Extract the distilled conditions from a raw BSData node (its own
// limit-adjusting modifiers). Returns [] if none.
export function distillConditions(node) {
  const cons = [...(node.constraints || []), ...(node._linkConstraints || [])];
  const byId = new Map(cons.filter(c => c.field === "selections").map(c => [c.id, c.type]));
  const out = [];
  for (const m of [...(node.modifiers || []), ...(node._linkModifiers || [])]) {
    if (!["set", "increment", "decrement"].includes(m.type)) continue;
    const target = m.field === "hidden" ? "max" : byId.get(m.field);
    if (!target) continue;
    const when = [...(m.conditions || []), ...(m.conditionGroups || []).flatMap(g => g.conditions || [])]
      .map(c => ({ type: c.type, childId: c.childId, scope: c.scope || "parent", value: c.value }));
    out.push({
      target,
      op: m.field === "hidden" ? "set0" : (m.type === "set" ? "set" : m.type === "increment" ? "inc" : "dec"),
      value: m.field === "hidden" ? 0 : m.value,
      when,
    });
  }
  return out;
}

export function effectiveLimitsFromRecord(node, state = { modelCount: 1, selections: {} }) {
  let min = node.min ?? 0;
  let max = node.max == null ? Infinity : node.max;
  for (const c of node.conditions || []) {
    const pass = (c.when || []).every(w => conditionPasses(w, state));
    if (!pass) continue;
    const apply = (cur) => c.op === "set0" ? 0 : c.op === "set" ? c.value : c.op === "inc" ? cur + c.value : cur - c.value;
    if (c.op === "set0") max = 0;
    else if (c.target === "min") min = apply(min);
    else max = apply(max);
  }
  if (max < min) max = min;
  return { min, max: max === Infinity ? null : max };
}
