// ─── WARGEAR SELECTION TREE (Story A / task A5) ─────────────────────────────
// unit tree -> WargearNode (see src/core/model/unitRecord.js). Faithful
// {min,max} nodes; conditional limits distilled for constraintEval; default
// option resolved via R7's 4-step chain; weapon options reference weapons[]
// by id.
import { children, rawLimits, weaponProfiles } from "./resolve.mjs";
import { isCruft } from "./filter.mjs";
import { distillConditions } from "./constraintEval.mjs";
import { weaponRefsFor } from "./weapons.mjs";

const NO_WITH = /\s(?:with|w\/|w\/ )\s|\bwith\b/i;

function kindOf(node) {
  if (node.type === "model") return "model";
  if (node.selectionEntryGroups !== undefined || (!node.type && node.selectionEntries)) return "group";
  return node.type === "upgrade" ? "option" : "group";
}

// "This model is equipped with: X; Y; Z." -> lowercased item names
function equippedWithItems(unit, idx) {
  for (const p of unit.profiles || []) {
    const txt = (p.characteristics || []).find(c => /description/i.test(c.name))?.$text || "";
    const m = txt.match(/equipped with:\s*([^.]+)\./i);
    if (m) return m[1].split(/;|,| and /i).map(s => s.replace(/^\s*\d+\s*/, "").trim().toLowerCase()).filter(Boolean);
  }
  // some datasheets put it in an "Unit Composition" style profile / rules
  return null;
}

function buildNode(raw, idx, weapons, ctx, depth) {
  if (raw._unresolved) {
    ctx.report?.unresolvedNodes.push({ unit: ctx.label, path: raw.name, reason: raw._unresolved });
    return { name: raw.name || "?", kind: "option", min: 0, max: 0, unresolved: raw._unresolved };
  }
  const { min, max } = rawLimits(raw);
  const node = {
    name: (raw.name || "").trim(),
    kind: kindOf(raw),
    min,
    max: max === Infinity ? null : max,
    srcId: raw._targetId || raw.id,
  };
  const conds = distillConditions(raw);
  if (conds.length) node.conditions = conds;

  // weapons this option grants
  if (weaponProfiles(raw, idx).length) {
    const refs = weaponRefsFor(raw, idx, weapons);
    if (refs.length) node.weaponRefs = refs;
  }

  // children
  const kids = [];
  for (const { node: c } of children(raw, idx, isCruft)) {
    if (depth > 8) break;
    kids.push(buildNode(c, idx, weapons, ctx, depth + 1));
  }
  if (kids.length) node.children = kids;

  // default resolution (R7) for a multi-child group
  if (kids.length > 1) {
    resolveDefault(raw, node, kids, idx, ctx);
  }
  return node;
}

function resolveDefault(raw, node, kids, idx, ctx) {
  // (1) explicit defaultSelectionEntryId
  if (raw.defaultSelectionEntryId) {
    const target = raw.defaultSelectionEntryId;
    for (let i = 0; i < kids.length; i++) {
      const childRaw = [...children(raw, idx, isCruft)][i]?.node;
      if (childRaw && (childRaw.id === target || childRaw._targetId === target)) { kids[i].defaultSelected = true; return; }
    }
  }
  const mandatory = (node.min || 0) >= 1;
  // (2) squad model group: the plain variant (no " with ")
  if (kids.every(k => k.kind === "model")) {
    const plain = kids.find(k => !NO_WITH.test(k.name));
    if (plain) { plain.defaultSelected = true; return; }
  }
  // (3) match "equipped with:" text
  const items = ctx.equipped;
  if (items) {
    const hit = kids.find(k => items.some(it => k.name.toLowerCase().includes(it) || it.includes(k.name.toLowerCase())));
    if (hit) { hit.defaultSelected = true; return; }
  }
  // (4) first child + report (only worth flagging for mandatory picks)
  if (mandatory) {
    kids[0].defaultSelected = true;
    ctx.report?.defaultRuleFallback.push({ unit: ctx.label, group: node.name, rule: 4 });
  }
}

export function buildWargear(unit, idx, weapons, faction, report) {
  const ctx = { label: `${faction}/${(unit.name || "").trim()}`, report, equipped: equippedWithItems(unit, idx) };
  const kids = [];
  for (const { node: c } of children(unit, idx, isCruft)) {
    kids.push(buildNode(c, idx, weapons, ctx, 1));
  }
  return { name: "wargear", kind: "group", min: 0, max: null, children: kids };
}
