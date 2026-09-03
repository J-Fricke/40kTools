// ─── HARDPOINT TAGGING ──────────────────────────────────────────────────────
// Tags specific base.sWs/mWs entries with which slot they belong to, so
// composableUnit.js's resolveBuild() can remove exactly that one entry when
// the slot is swapped, instead of scaling the WHOLE category array (which
// wipes every hardpoint on a unit at once, even ones that weren't touched -
// see GitHub issue #22 for how this was found and confirmed).
//
// Each unit's own base is checked NUMERICALLY, not assumed - a multi-entry
// base is only actually broken if selecting a slot's choice doesn't already
// re-supply the untouched portion of what gets reduced (many multi-model
// squads' choices DO re-include the shared/untouched weapon exactly,
// self-compensating correctly with no tagging needed at all - confirmed for
// Purifier Squad, Allarus Custodians, Hernkyn Pioneers while investigating
// this; Hearthkyn Warriors did NOT self-compensate and needed a real tag).
// Only add an entry here after verifying the untagged behavior is actually
// wrong for that specific unit, the same way hk was verified below.
//
// `weapon`: the exact base weapon array to tag (matched by value - fragile
// if the underlying data regenerates with different rounding, but this is
// hand-verified per entry, not derived, so a mismatch fails loudly via the
// console.warn in applyHardpointTags rather than silently doing nothing).
// `slotLabel`: looked up against the unit's own extracted slots to find the
// real slot id (BSData GUIDs, unstable to hardcode directly).
export const HARDPOINT_MAP = {
    greyknights: {
        // Venerable Dreadnought: ref/greyknights-10th-datasheets.txt confirms
        // "equipped with: assault cannon; storm bolter; Dreadnought combat
        // weapon" - three separate hardpoints. The assault cannon swaps via
        // the "Assault Cannon" slot; the storm bolter + DCW swap together via
        // the "Storm Bolter and Dreadnought Combat Weapon" combo slot. Without
        // tagging, picking the Assault Cannon slot wiped the untouched storm
        // bolter too (the exact failure GitHub issue #22 was opened on), and
        // picking the combo slot wiped the untouched assault cannon.
        vd: [
            { category: "sWs", weapon: [6, 3, 6, 0, 1, { dev: 1 }], slotLabel: "Assault Cannon" },
            { category: "sWs", weapon: [4, 3, 4, 0, 1, {}], slotLabel: "Storm Bolter and Dreadnought Combat Weapon" },
            { category: "mWs", weapon: [5, 3, 12, -2, 3, {}], slotLabel: "Storm Bolter and Dreadnought Combat Weapon" },
        ],
        // Razorback: base is the datasheet default twin heavy bolter (see
        // src/factions/greyknights.js). It swaps via the "Twin Heavy Bolter"
        // slot; tagging it there keeps the optional "Wargear" add-ons (storm
        // bolter, hunter-killer missile) from wrongly reducing the main gun -
        // resolveBuild's blanket per-choice reduction skips hardpoint-tagged
        // base entries entirely.
        razorback: [
            { category: "sWs", weapon: [3, 3, 5, -1, 2, { sustained: 1, tl: 1 }], slotLabel: "Twin Heavy Bolter" },
        ],
    },
    votann: {
        // Hearthkyn Warriors: base.sWs[1] ([2,4,4,0,1,{}]) is the
        // Autoch-pattern bolter, matched exactly by the "Weapon" slot's own
        // "Autoch-pattern bolter" choice - confirmed the untagged behavior
        // wrongly reduced BOTH base sWs entries when swapping to Ion
        // blaster/Theyn's pistol, when only this one (not the other,
        // unrelated sWs[0] entry) should change.
        hk: [{ category: "sWs", weapon: [2, 4, 4, 0, 1, {}], slotLabel: "Weapon" }],
    },
    chaosknights: {
        // Knight Despoiler: ref/chaos-knights-datasheets.txt confirms "This
        // model is equipped with: daemonbreath meltagun; reaper chainsword;
        // titanic feet; warpstrike claw" - all 4 simultaneously, matching
        // the 3 lumped mWs entries + 1 sWs entry exactly (hand-authored data
        // picked one representative profile per dual-profile melee weapon -
        // Warpstrike claw's strike, Reaper chainsword's sweep - a pre-existing
        // simplification, not something introduced fixing this).
        desp: [
            { category: "mWs", weapon: [4, 3, 20, -3, 8, {}], slotLabel: "Replace warpstrike claw" },
            { category: "mWs", weapon: [12, 3, 9, -3, 2, {}], slotLabel: "Replace reaper chainsword" },
            { category: "mWs", weapon: [4, 4, 8, -1, 2, {}], slotLabel: "Wargear" },
            // Also tag the meltagun to "Shoulder weapon" - without this,
            // "Replace reaper chainsword"/"Replace warpstrike claw" (both
            // mandatory, both offering ranged options in their own choice
            // sets, so both claim replaces.sWs too) would wrongly wipe the
            // untagged meltagun whenever EITHER arm gets swapped, even
            // though neither arm has anything to do with the shoulder mount.
            { category: "sWs", weapon: [1, 3, 9, -4, 3.5, {}], slotLabel: "Shoulder weapon" },
        ],
        // Knight Tyrant: hand-authored base corrected in src/factions/chaosknights.js
        // (see the comment there) to include the twin desecrator cannon
        // (was missing) and the real gheiststrike quantity (was 1, is 2).
        // 2× twin daemonbreath meltagun + titanic feet stay untagged - the
        // real rules give no way to remove them at all (see KNOWN_GAPS.md's
        // "always-included siblings" note - Tyrant's own "Wargear" group
        // correctly produces no slot for them anymore).
        tyrant: [
            { category: "sWs", weapon: [2, 3, 20, -5, 11.5, {}], slotLabel: "Main weapons" },
            { category: "sWs", weapon: [6.5, 3, 9, -4, 2, {}], slotLabel: "Main weapons" },
            { category: "sWs", weapon: [2, 3, 12, -6, 4.5, { dev: 1 }], slotLabel: "Carapace weapons" },
            { category: "sWs", weapon: [3.5, 3, 6, 0, 1, { tl: 1 }], slotLabel: "Carapace weapons" },
        ],
    },
};

export function applyHardpointTags(factionKey, uid, family) {
    const rules = HARDPOINT_MAP[factionKey]?.[uid];
    if (!rules) return;
    for (const rule of rules) {
        const slot = family.slots.find(s => s.label === rule.slotLabel);
        if (!slot) { console.warn(`  [hardpointMap] slot "${rule.slotLabel}" not found for ${factionKey}/${uid}`); continue; }
        const arr = family.base[rule.category];
        const idx = arr.findIndex(w => Array.isArray(w) && JSON.stringify(w) === JSON.stringify(rule.weapon));
        if (idx === -1) { console.warn(`  [hardpointMap] weapon ${JSON.stringify(rule.weapon)} not found in base.${rule.category} for ${factionKey}/${uid}`); continue; }
        arr[idx] = { weapon: arr[idx], hardpoint: slot.id };
    }
}
