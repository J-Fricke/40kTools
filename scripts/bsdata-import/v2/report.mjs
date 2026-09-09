// ─── SYNC REPORT accumulator (Story A / task A6) ────────────────────────────
export function newReport() {
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    catalogues: [],
    parseFailures: [],
    unresolvedKeywordShapes: [],   // filled by A8 via a keyword sweep
    defaultRuleFallback: [],
    noStats: [],
    damageBrackets: [],
    unresolvedNodes: [],
    nonCountPointsModifiers: [],
    overridesApplied: [],
  };
}

// Move the noisy "pts modifier with non-count condition" entries out of
// unresolvedNodes into their own bucket (they're expected: the "3rd+ copy
// costs more" battle-size tax, character-dependent buffs, etc.).
export function partitionReport(r) {
  const keep = [], moved = [];
  for (const n of r.unresolvedNodes) (n.path === "points" ? moved : keep).push(n);
  r.unresolvedNodes = keep;
  r.nonCountPointsModifiers = moved.map(m => `${m.unit}: ${m.reason}`);
  return r;
}
