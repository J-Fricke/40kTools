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
// `base.sWs`/`base.mWs` weapon arrays are PER MODEL (one model's storm bolter,
// one model's melee weapon, etc.) - the engine's calcWs() expects a unit-total
// shots count, so resolveBuild scales each entry by how many models are still
// on the base loadout before handing it off.
//
// A base entry is normally a plain weapon array `[shots,skill,S,AP,D,tags]`.
// For a single-model unit with 2+ independent hardpoints lumped into the
// same base.sWs/mWs array (e.g. Knight Despoiler's melee array holding
// reaper chainsword + warpstrike claw + titanic feet all at once, for its
// one model), an entry can instead be `{weapon: [...], hardpoint: slotId}` -
// tagging it as belonging to a specific slot. Swapping that slot removes
// ONLY this one entry, leaving the rest of the array untouched, instead of
// the array-wide "scale by remaining models" treatment below wiping every
// hardpoint at once whenever any one of them gets swapped (see GitHub issue
// #22 for how that was found and why it's wrong for these units).
function scaleWeapons(ws, n) {
    if (!ws || n <= 0) return [];
    return ws.map(([shots, skill, s, ap, d, tags]) => [shots * n, skill, s, ap, d, tags]);
}

// Splits a base.sWs/mWs array into untagged entries (plain weapon arrays,
// subject to the usual model-count scaling) and hardpoint-tagged entries
// (objects, resolved separately - see resolveHardpointEntries below).
function splitBaseEntries(entries) {
    const untagged = [], tagged = [];
    for (const e of entries || []) (Array.isArray(e) ? untagged : tagged).push(e);
    return { untagged, tagged };
}

// A hardpoint-tagged entry represents 1 model's worth of that specific
// weapon - scaled by however many models did NOT pick a choice in the
// entry's owning slot (same "models stepped out of the base loadout"
// logic as the untagged case, just counted per-hardpoint instead of across
// the whole category). For a single-model unit this collapses to "present
// at full value, or removed entirely" (modelCount=1 minus 0-or-1 selected),
// but the same formula scales correctly for a multi-model squad too.
function resolveHardpointEntries(tagged, modelCount, slotSelectionCounts) {
    const out = [];
    for (const e of tagged) {
        const selected = slotSelectionCounts.get(e.hardpoint) || 0;
        out.push(...scaleWeapons([e.weapon], Math.max(0, modelCount - selected)));
    }
    return out;
}

// resolveBuild: given a unit family definition and a chosen configuration
// (model count + chosen choice ids per slot), produce the same {pts, W, sv,
// inv, fnp, sWs, mWs} shape buildCombo() already expects - so the rest of the
// pipeline (getDetBuff, applyBuff, calcWs) doesn't need to know a unit was
// ever composable in the first place.
//
// Slot choices follow GW's overwhelmingly-common wargear pattern - "N of this
// unit's models can replace their default weapon with 1 of: A/B/C" - so each
// selected choice id is treated as 1 model stepping out of the base loadout
// to take the choice's weapon(s) instead. Ranged and melee are tracked
// separately: a choice that only carries a ranged weapon (the overwhelmingly
// common case - basic gun swapped for a special/heavy weapon) only steps that
// model out of the base RANGED count, leaving its base melee weapon (e.g. a
// Paladin's Nemesis force weapon) untouched - and symmetrically for a
// melee-only choice. A choice carrying both steps the model out of both.
//
// A slot can override that per-choice inference with its own explicit
// `replaces: {sWs, mWs}` (see scripts/bsdata-import/extractSlots.mjs's
// comboChoiceSlot()) for cases the inference gets wrong: a mandatory
// hardpoint (e.g. Knight Despoiler's "Replace reaper chainsword") that
// ALWAYS has some weapon by default, where the replacement can change
// category entirely (melee chainsword swapped for a ranged-only combo still
// has to remove 1 model's worth of base melee, which the chosen choice's
// own sWs/mWs alone can't signal) - or the opposite, an optional pure add-on
// mount (Despoiler's separate "Carapace weapon") that should never reduce
// base at all even though its choices happen to share a category with it.
export function resolveBuild(family, { modelCount, slotChoices }) {
    const sWsSplit = splitBaseEntries(family.base.sWs);
    const mWsSplit = splitBaseEntries(family.base.mWs);
    // A slot with a hardpoint-tagged entry in a category handles that
    // category's reduction itself (resolveHardpointEntries, precisely
    // scoped to just that entry) - it must NOT also count toward the old
    // blanket per-choice modelsSwapped* counters below, or an unrelated
    // untagged entry in the same category (e.g. Hearthkyn Warriors' other
    // sWs weapon, nothing to do with its hardpoint-tagged Autoch-pattern
    // bolter) would get wrongly reduced too by a slot that was never
    // meant to touch it.
    const hardpointSlots = { sWs: new Set(), mWs: new Set() };
    for (const e of sWsSplit.tagged) hardpointSlots.sWs.add(e.hardpoint);
    for (const e of mWsSplit.tagged) hardpointSlots.mWs.add(e.hardpoint);

    let modelsSwappedRanged = 0, modelsSwappedMelee = 0;
    const slotSelectionCounts = new Map();
    for (const slot of family.slots || []) {
        const chosen = slotChoices?.[slot.id] || [];
        if (chosen.length) slotSelectionCounts.set(slot.id, chosen.length);
        for (const choiceId of chosen) {
            const choice = slot.choices.find(c => c.id === choiceId);
            if (!choice) continue;
            if (slot.replaces) {
                if (slot.replaces.sWs && !hardpointSlots.sWs.has(slot.id)) modelsSwappedRanged++;
                if (slot.replaces.mWs && !hardpointSlots.mWs.has(slot.id)) modelsSwappedMelee++;
            } else {
                if (choice.sWs && !hardpointSlots.sWs.has(slot.id)) modelsSwappedRanged++;
                if (choice.mWs && !hardpointSlots.mWs.has(slot.id)) modelsSwappedMelee++;
            }
        }
    }
    let sWs = [
        ...scaleWeapons(sWsSplit.untagged, Math.max(0, modelCount - modelsSwappedRanged)),
        ...resolveHardpointEntries(sWsSplit.tagged, modelCount, slotSelectionCounts),
    ];
    let mWs = [
        ...scaleWeapons(mWsSplit.untagged, Math.max(0, modelCount - modelsSwappedMelee)),
        ...resolveHardpointEntries(mWsSplit.tagged, modelCount, slotSelectionCounts),
    ];
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

// describeLoadout: a short human-readable summary of a chosen configuration,
// for table/list display (e.g. "5 models, +1 Psycannon") - lists only the
// non-empty slot choices, since "fixed loadout" units and an all-default
// configuration would otherwise show nothing useful.
export function describeLoadout(family, { modelCount, slotChoices }) {
    const parts = [`${modelCount} model${modelCount === 1 ? "" : "s"}`];
    for (const slot of family.slots || []) {
        const chosen = (slotChoices?.[slot.id] || []);
        for (const choiceId of chosen) {
            const choice = slot.choices.find(c => c.id === choiceId);
            if (choice) parts.push(`+${choice.label}`);
        }
    }
    return parts.join(", ");
}
