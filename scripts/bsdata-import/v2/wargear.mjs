// ─── WARGEAR SELECTION TREE (Story A / task A5) ─────────────────────────────
// unit tree -> WargearNode (see src/core/model/unitRecord.js). Faithful
// {min,max} nodes; conditional limits distilled for constraintEval; default
// option resolved via R7's 4-step chain; weapon options reference weapons[]
// by id.
import { children, rawLimits, weaponProfiles, walk } from "./resolve.mjs";
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

function buildNode(raw, idx, weapons, ctx, depth, mandatory) {
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

  // a child chain is "mandatory" only while every ancestor is a required pick
  const childMandatory = mandatory && (min >= 1);

  // children (skip weaponless sub-branches — abilities / crests, Story C)
  const kids = [];
  for (const { node: c } of children(raw, idx, isCruft)) {
    if (depth > 8) break;
    if (!weaponProfiles(c, idx).length && !subtreeHasWeapon(c, idx)) continue;
    kids.push(buildNode(c, idx, weapons, ctx, depth + 1, childMandatory));
  }
  if (kids.length) node.children = kids;

  // default resolution (R7) — only for a genuine multi-child *choice*.
  // A group whose children are ALL mandatory (min>=1) is an
  // "always-included siblings" list (model with several fixed weapons), not
  // a pick — every child stays selected, no default needed.
  const isChoice = kids.length > 1 && !kids.every(k => (k.min || 0) >= 1);
  if (isChoice) {
    resolveDefault(raw, node, kids, idx, ctx, mandatory);
  } else if (kids.length > 1) {
    for (const k of kids) k.defaultSelected = true;
  }
  return node;
}

function resolveDefault(raw, node, kids, idx, ctx, mandatory) {
  // (1) explicit defaultSelectionEntryId
  if (raw.defaultSelectionEntryId) {
    const target = raw.defaultSelectionEntryId;
    for (let i = 0; i < kids.length; i++) {
      const childRaw = [...children(raw, idx, isCruft)][i]?.node;
      if (childRaw && (childRaw.id === target || childRaw._targetId === target)) { kids[i].defaultSelected = true; return; }
    }
  }
  const needsDefault = mandatory && (node.min || 0) >= 1;
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
  // (4) first child + report — only when this pick actually happens in the
  // default build (mandatory chain)
  if (needsDefault) {
    kids[0].defaultSelected = true;
    ctx.report?.defaultRuleFallback.push({ unit: ctx.label, group: node.name, rule: 4 });
  }
}

// does this raw subtree contain any weapon profile? (weaponless branches are
// abilities / crests / psychic powers — not Story A's concern)
function subtreeHasWeapon(raw, idx) {
  for (const n of walk(raw, idx, isCruft)) if (weaponProfiles(n, idx).length) return true;
  return false;
}

export function buildWargear(unit, idx, weapons, faction, report) {
  const ctx = { label: `${faction}/${(unit.name || "").trim()}`, report, equipped: equippedWithItems(unit, idx) };
  const kids = [];
  for (const { node: c } of children(unit, idx, isCruft)) {
    if (!subtreeHasWeapon(c, idx)) continue;   // skip pure-ability / crest branches
    kids.push(buildNode(c, idx, weapons, ctx, 1, true));
  }
  return { name: "wargear", kind: "group", min: 0, max: null, children: kids };
}
