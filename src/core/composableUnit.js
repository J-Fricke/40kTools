// ─── COMPOSABLE UNIT SCHEMA ─────────────────────────────────────────────────
// The data shape the Unit Builder configures against, replacing the old
// pre-baked-SKU rows (one full row per loadout combination) in
// src/factions/*.js UNITS arrays. Populated by the BSData importer
// (scripts/bsdata-import/), not hand-authored - see that directory's README
// once it exists for the import/sync workflow.
//
// Why this shape and not BattleScribe's full constraint model verbatim:
// BSData's real constraint engine (min/max per scope, shared/child selection
// rules, nested groups) is general enough to express arbitrary army-building
// legality rules, which is more than this tool needs. The overwhelming
// majority of real 40k wargear patterns collapse into one of:
//   1. Fixed loadout, no choice at all.
//   2. "This model's X can be replaced with 1 of: Y, Z" - an exclusive choice
//      on a single model.
//   3. "For every N models, up to M can take X instead of the default" - a
//      repeatable per-N-models slot (Paladin Squad's Heavy Weapon option).
// `slots` below captures all three with one shape: a slot has a pick-count
// range and a list of named choices, each choice being a weapon-array delta
// plus a points delta. Points deltas come from our own MFM-verified data,
// NOT from BSData's `costs` field - see the importer for why.
//
// export shape per unit family (one entry per uid, e.g. "pal"):
// {
//   uid: "pal", unit: "Paladin Squad", faction: "greyknights",
//   models: { min: 4, max: 10 },        // squad size range
//   base: {
//     sv: 2, inv: 4, fnp: null, W: 3,
//     sWs: [...],                        // weapons every model has, no choice needed
//     mWs: [...],
//   },
//   slots: [
//     {
//       id: "heavy_weapon", label: "Heavy Weapon",
//       perModels: 5,                    // this slot's pick count scales with squad size (1 per 5 models)
//       pick: { min: 0, max: 2 },        // at 10 models: up to 2 can be swapped
//       choices: [
//         { id: "psycannon", label: "Psycannon", sWs: [[...]], ptsDelta: 5 },
//         { id: "incinerator", label: "Incinerator", sWs: [[...]], ptsDelta: 0 },
//         { id: "psilencer", label: "Psilencer", sWs: [[...]], ptsDelta: 0 },
//       ],
//     },
//   ],
//   chars: ["none", "bc", "chap", ...],  // unchanged from today's convention
// }
//
// resolveBuild: given a unit family definition and a chosen configuration
// (model count + chosen choice ids per slot), produce the same {pts, W, sv,
// inv, fnp, sWs, mWs} shape buildCombo() already expects - so the rest of the
// pipeline (getDetBuff, applyBuff, calcWs) doesn't need to know a unit was
// ever composable in the first place.
export function resolveBuild(family, { modelCount, slotChoices }) {
    let sWs = [...(family.base.sWs || [])];
    let mWs = [...(family.base.mWs || [])];
    let ptsDelta = 0;
    for (const slot of family.slots || []) {
        const chosen = (slotChoices?.[slot.id] || []);
        for (const choiceId of chosen) {
            const choice = slot.choices.find(c => c.id === choiceId);
            if (!choice) continue;
            if (choice.sWs) sWs = [...sWs, ...choice.sWs];
            if (choice.mWs) mWs = [...mWs, ...choice.mWs];
            ptsDelta += choice.ptsDelta || 0;
        }
    }
    return {
        m: modelCount, W: family.base.W, sv: family.base.sv, inv: family.base.inv, fnp: family.base.fnp,
        sWs, mWs, ptsDelta,
    };
}
