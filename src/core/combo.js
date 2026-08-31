// ─── UNIT + CHARACTER COMBO (army-agnostic) ───────────────────────────────────
// Merges a unit's base weapons/stats with an attached character's buffs/weapons.
// Pure function: no faction-specific knowledge, no component state - takes a
// unit row and a char definition (from that same faction's CHARS export) and
// returns the effective combo. Extracted from UnitEvaluator.jsx so both the
// Faction Unit Evaluator and Fight Simulator call the same logic.
export function buildCombo(unit, char) {
    if (!char || char.name === "None") return {
        pts: unit.pts, W: unit.W, sv: unit.sv, inv: unit.inv, fnp: unit.fnp,
        sWs: unit.sWs, mWs: unit.mWs, ew2: null, charLabel: null, buffs: {}
    };
    // Apply char buff to unit shoot/melee weapons
    let unitSWs = char.buffs.let
        ? (unit.sWs || []).map(w => [w[0], w[1], w[2], w[3], w[4], { ...w[5], let: 1 }])
        : (unit.sWs || []);
    if (char.buffs.pfBonus) unitSWs = unitSWs.map(w =>
        w[5] && w[5].ai ? [w[0] + unit.m * char.buffs.pfBonus, w[1], w[2], w[3], w[4], w[5]] : w);
    const unitMWs = char.buffs.sh1m
        ? (unit.mWs || []).map(w => [w[0], w[1], w[2], w[3], w[4], { ...w[5], sh1: 1 }])
        : (unit.mWs || []);
    const mergedSWs = [...unitSWs, ...(char.sWs || [])];
    const mergedMWs = [...unitMWs, ...(char.mWs || [])];
    const fnp = char.buffs.unitFnp || unit.fnp;
    const inv = char.buffs.unitInv ? Math.min(unit.inv || 99, char.buffs.unitInv) : unit.inv;
    const eApMod = char.buffs.eApMod || 0;
    return {
        pts: unit.pts + char.pts,
        W: unit.W, sv: unit.sv, inv, fnp,
        sWs: mergedSWs.length ? mergedSWs : null,
        mWs: mergedMWs.length ? mergedMWs : null,
        ew2: { m: 1, W: char.W, sv: char.sv, inv: char.inv, fnp: char.fnp },
        charLabel: char.name,
        buffs: char.buffs,
        eApMod,
    };
}
