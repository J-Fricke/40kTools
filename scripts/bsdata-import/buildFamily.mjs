import { profileToWeapon } from "./profileToWeapon.mjs";
import { diceAverage } from "./keywordMap.mjs";
import { resolveProfiles } from "./weaponHelpers.mjs";

// Resolves a raw BSData weapon profile into this app's [shots, skill, S, AP, D, tags]
// array. Torrent weapons (BS/WS "N/A") always use skill:2 - not the unit's real
// BS - because the engine's hp formula already hits its ceiling (5/6) at skill 2,
// which is what makes the existing shots×6/5 torrent correction work out to
// "effectively always hits." This matches every existing hand-authored torrent
// row in src/factions/*.js (incinerators etc. are always coded with skill:2).
function resolveWeaponArray(profile) {
    const w = profileToWeapon(profile);
    if (w.unrecognized.length) {
        console.warn(`  [unrecognized keyword] ${w.name}: ${w.unrecognized.join(", ")}`);
    }
    let shots = diceAverage(w.rawShots);
    shots = shots * w.shotMultiplier + w.extraShots;
    // A choice can bundle "N copies of this weapon" (see weaponHelpers.mjs's
    // entryLinkQty) - profile._qty carries that through from the entryLink
    // that pointed at this profile, multiplying total shots for N mounts.
    if (profile._qty) shots *= profile._qty;
    const skill = w.skillRaw === "N/A" ? 2 : Number(w.skillRaw.replace("+", ""));
    return { array: [shots, skill, w.s, w.ap, Number(w.dRaw.match(/^-?\d+(\.\d+)?$/) ? w.dRaw : diceAverage(w.dRaw)), w.tags], isMelee: w.isMelee, name: w.name };
}

// buildFamily: given a unit's base weapons (fixed, no-choice) and the slots
// extracted by extractSlots(), produces a composableUnit.js-shaped family
// definition. `sizeTiers` (uid -> {modelCount: pts}) comes from OUR OWN
// MFM-verified data, not BSData - see project memory for why.
export function buildFamily({ uid, unit, faction, sizeTiers, baseProfiles, slots, sv, inv, fnp, W, chars, catalogue }) {
    const base = { sv, inv, fnp, W, sWs: [], mWs: [] };
    for (const p of baseProfiles) {
        const { array, isMelee } = resolveWeaponArray(p);
        (isMelee ? base.mWs : base.sWs).push(array);
    }
    const resolvedSlots = slots.map(slot => ({
        id: slot.id, label: slot.label, pick: slot.pick,
        // `replaces` (see extractSlots.mjs's comboChoiceSlot()) overrides
        // composableUnit.js's default per-choice-category inference - only
        // set on slots that need it, so most slots keep the default.
        ...(slot.replaces ? { replaces: slot.replaces } : {}),
        choices: slot.choices.map(c => {
            // A real BSData swap-group choice (Paladin-shape) carries one `entry`;
            // a synthesized named-model-variant choice (Custodian Guard-shape,
            // see extractSlots.mjs's namedVariantSlot()) carries `entries`
            // (plural) since a variant can bundle more than one weapon-bearing
            // upgrade (e.g. Vexilla + Misericordia together). Each entry's
            // profile might be embedded directly OR shared via infoLinks into
            // the catalogue's sharedProfiles (see weaponHelpers.mjs's
            // resolveProfiles) - resolve both the same way.
            const sourceEntries = c.entries || (c.entry ? [c.entry] : []);
            const weaponProfiles = sourceEntries.flatMap(e =>
                resolveProfiles(e, catalogue).filter(p => p.typeName === "Ranged Weapons" || p.typeName === "Melee Weapons"));
            const sWs = [], mWs = [];
            for (const p of weaponProfiles) {
                const { array, isMelee } = resolveWeaponArray(p);
                (isMelee ? mWs : sWs).push(array);
            }
            return { id: c.id, label: c.label, sWs: sWs.length ? sWs : undefined, mWs: mWs.length ? mWs : undefined };
        }),
    }));
    return { uid, unit, faction, models: sizeTiers, base, slots: resolvedSlots, chars: chars || ["none"] };
}
