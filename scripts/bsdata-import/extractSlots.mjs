// ─── WARGEAR SLOT EXTRACTION ────────────────────────────────────────────────
// Walks a unit's full selectionEntries/selectionEntryGroups tree (including
// entryLinks that reference the catalogue's sharedSelectionEntries) and finds
// every group that represents a real wargear choice. Three distinct BSData
// shapes are recognized:
//
//  1. A base model plus a separate "swap group" (Paladin Squad: pick 1 of
//     Incinerator/Psycannon/Psilencer for a model) - a selectionEntryGroup
//     whose every resolved child is a weapon-only entry.
//  2. Named, already-fully-built model variants as direct siblings of a
//     squad-size container (Custodian Guard: "(Guardian Spear)" vs
//     "(Sentinel Blade & Praesidium Shield)" vs "(Vexilla, Praesidium
//     Shield & Misericordia)") - there's no inner "pick 1 of N" group,
//     because building the squad IS choosing the mix of variants. See
//     namedVariantSlot() below.
//  3. Named "combo" choices for a single model - each choice bundles 2+
//     weapon-linked sub-items with no direct profile of its own (Venerable
//     Dreadnought: "Storm bolter and Dreadnought combat weapon" vs "Heavy
//     flamer and Dreadnought combat weapon") - not a full model variant,
//     just a named package of weapons. See comboChoiceSlot() below.
import { resolveEntry, hasWeaponProfile, directWeaponEntries, resolveChoiceWeapons, resolveProfiles } from "./weaponHelpers.mjs";
export { resolveEntry } from "./weaponHelpers.mjs";

// Resolves one selectionEntries/entryLinks array into a flat list of real
// entries (following entryLinks to their shared target).
function resolveChildren(node, catalogue) {
    const out = [];
    for (const e of node.selectionEntries || []) out.push({ entry: e, name: e.name });
    for (const link of node.entryLinks || []) {
        if (link.type !== "selectionEntry") continue;
        const target = resolveEntry(catalogue, link.targetId);
        if (target) out.push({ entry: target, name: link.name || target.name });
    }
    return out;
}

function getConstraints(group) {
    const min = (group.constraints || []).find(c => c.type === "min");
    const max = (group.constraints || []).find(c => c.type === "max");
    return { min: min ? min.value : 0, max: max ? max.value : 1 };
}

// A model-variant entry (e.g. "Paladin with Heavy Weapon") caps how many of
// that variant can exist in the squad via its OWN "selections"/scope:"parent"
// constraint (max=2, out of the 3-9 squad-size group) - not to be confused
// with its inner weapon-swap group's constraint (min=1/max=1, meaning "if
// this model exists, it picks exactly 1 of these 3 weapons"). The real "how
// many models total may take this option" figure is the variant's own cap,
// so a slot found immediately inside a variant node should use that instead
// of its own group's always-1-per-model constraint.
function getVariantCap(node) {
    const cs = (node.constraints || []).filter(c => c.field === "selections" && c.scope === "parent");
    const max = cs.find(c => c.type === "max");
    if (!max) return null;
    const min = cs.find(c => c.type === "min");
    return { min: min ? min.value : 0, max: max.value };
}

// Detects shape 2 (see file header): a group whose children are ALL
// `type:"model"` entries, each resolving to its own weapon-bearing entries
// directly (no further nested choice - see extractBase.mjs's own "no ' with
// ' in the name" base-picking heuristic, mirrored here so the two stay in
// sync). One variant becomes the family's base (excluded from the slot -
// extractBase.mjs picks the same one as the unit's fixed loadout); every
// OTHER variant becomes a slot choice, its own weapon-bearing entries carried
// as `entries` (plural - a variant can bundle more than one, e.g. Custodian
// Guard's banner-bearer variant has both a Vexilla AND a Misericordia as
// separate upgrade entries) rather than the single `entry` a real BSData
// swap-group choice carries. Returns null if this isn't the shape (fewer
// than 2 variants, a non-model child present, or a variant with no weapons
// of its own to compare against).
function namedVariantSlot(group, children, catalogue) {
    if (children.length < 2 || !children.every(c => c.entry.type === "model")) return null;
    // A variant with its OWN nested selectionEntryGroups (e.g. Paladin's
    // "Paladin with Heavy Weapon", which links a shared Nemesis force
    // weapon directly AND nests a real "Heavy Weapon" swap-group one level
    // deeper) is NOT this shape - it's Paladin's original shape, where the
    // real choice lives nested inside one specific variant, not spread
    // across fully-resolved siblings. Bail so the normal recursive walk
    // finds that nested group instead of this synthesizing a slot from
    // each variant's shared/incomplete direct weapons.
    if (children.some(c => (c.entry.selectionEntryGroups || []).length > 0)) return null;
    const resolved = children.map(c => ({ ...c, weapons: resolveChoiceWeapons(c.entry, catalogue) }));
    if (resolved.some(c => c.weapons.length === 0)) return null;
    const base = resolved.find(c => !/ with /i.test(c.name)) || resolved[0];
    const alternates = resolved.filter(c => c !== base);
    if (!alternates.length) return null;
    return {
        id: group.id, label: group.name, pick: { min: 0, max: alternates.length },
        choices: alternates.map(c => ({ id: c.entry.id, label: c.name, entries: c.weapons })),
    };
}

// Detects shape 3: a group whose children are named "combo" choices - each
// one a bundle of 2+ weapon-linked sub-items with no direct profile of its
// own (e.g. Venerable Dreadnought's "Storm Bolter and Dreadnought Combat
// Weapon" group: "Storm bolter and Dreadnought combat weapon" vs "Heavy
// flamer and Dreadnought combat weapon", each an `upgrade` entry bundling a
// ranged AND a melee weapon together, not a single weapon and not a full
// model variant). Unlike namedVariantSlot(), there's no "base" choice to
// exclude here - the group's own min/max constraint already describes the
// real pick range (e.g. "exactly 1 of these 2 combos"), and
// composableUnit.js's resolveBuild() already handles a combo choice
// replacing BOTH a model's base ranged and melee weapon correctly (it
// reduces the base ranged/melee counts independently based on which arrays
// a choice carries - the same mechanism that makes Custodian Guard's
// Vexilla+Misericordia bundle work).
function comboChoiceSlot(group, children, catalogue) {
    if (children.length < 2) return null;
    if (children.some(c => (c.entry.selectionEntryGroups || []).length > 0)) return null;
    const resolved = children.map(c => ({ ...c, weapons: resolveChoiceWeapons(c.entry, catalogue) }));
    // A choice with zero weapons is a pure-ability option (e.g. Hekaton Land
    // Fortress' "Wargear" group mixes the real "Hekaton warhead" weapon with
    // an ability-only "Pan spectral scanner" alternative) - this app's
    // schema can't represent an ability choice, so drop it rather than
    // reject the whole group over one option it was never going to expose
    // anyway. Only bail entirely when NONE of the choices have a weapon
    // (a pure-ability group, e.g. Votann's "Crest"/"Enhancements" - out of
    // scope, not a bug, correctly produces no slot).
    const withWeapons = resolved.filter(c => c.weapons.length > 0);
    if (!withWeapons.length) return null;
    const pick = getConstraints(group);
    // A mandatory pick (min>=1, e.g. Knight Despoiler's "Replace reaper
    // chainsword") represents an occupied hardpoint that ALWAYS has some
    // weapon by default - picking ANY option swaps out whatever was there,
    // regardless of whether the CHOSEN option itself is ranged or melee
    // (e.g. swapping the melee reaper chainsword for a ranged-only gatling
    // combo still needs to remove 1 model's worth of base MELEE, which
    // composableUnit.js's default per-choice-category logic can't see -
    // it only reduces whatever category the chosen option adds). `replaces`
    // says explicitly which base categories this hardpoint occupies (the
    // union across all its choices, since any of them could be what's
    // "already there"), letting resolveBuild() reduce by that instead.
    // An optional pick (min:0, e.g. Despoiler's separate "Carapace weapon"
    // mount) is a genuine ADD-ON, not a replacement - explicitly declaring
    // `replaces: {sWs:false, mWs:false}` here (rather than leaving it
    // undefined) opts these slots OUT of the default per-choice reduction
    // too, so choosing one doesn't wrongly zero out an unrelated base
    // weapon just because they happen to share a category.
    const categoriesOf = entries => {
        const types = entries.flatMap(e => resolveProfiles(e, catalogue).map(p => p.typeName));
        return { sWs: types.includes("Ranged Weapons"), mWs: types.includes("Melee Weapons") };
    };
    const replaces = pick.min >= 1
        ? withWeapons.reduce((acc, c) => {
            const cat = categoriesOf(c.weapons);
            return { sWs: acc.sWs || cat.sWs, mWs: acc.mWs || cat.mWs };
        }, { sWs: false, mWs: false })
        : { sWs: false, mWs: false };
    return {
        id: group.id, label: group.name, pick, replaces,
        choices: withWeapons.map(c => ({ id: c.entry.id, label: c.name, entries: c.weapons })),
    };
}

// extractSlots: returns { slots, warnings }.
// slots: [{ id, label, pick:{min,max}, choices:[{id,label,entry|entries}] }]
// for every wargear slot found anywhere in the unit's tree (recursive).
// warnings: coverage-audit signal - a group with 2+ children that matched
// NEITHER recognized shape and produced no slot anywhere beneath it. That's
// exactly the structural signature Custodian Guard had before namedVariantSlot()
// was added (a real BSData shape our extraction hadn't learned yet) - so a
// warning here means "possible third shape, needs a human look," not a
// guaranteed bug. See scripts/bsdata-import/auditCoverage.mjs, which surfaces
// these across all 74 units in one report.
export function extractSlots(unitEntry, catalogue) {
    const slots = [];
    const warnings = [];
    const visited = new Set();
    function walk(node, ownCap) {
        if (!node || (node.id && visited.has(node.id))) return;
        if (node.id) visited.add(node.id);
        for (const group of node.selectionEntryGroups || []) {
            const children = resolveChildren(group, catalogue);
            const allWeapons = children.length > 0 && children.every(c => hasWeaponProfile(c.entry, catalogue));
            const variantSlot = !allWeapons ? namedVariantSlot(group, children, catalogue) : null;
            const comboSlot = !allWeapons && !variantSlot ? comboChoiceSlot(group, children, catalogue) : null;
            const matchedSlot = variantSlot || comboSlot;
            if (allWeapons) {
                slots.push({
                    id: group.id, label: group.name,
                    pick: ownCap || getConstraints(group),
                    choices: children.map(c => ({ id: c.entry.id, label: c.name, entry: c.entry })),
                });
            } else if (matchedSlot) {
                slots.push(matchedSlot);
            } else {
                // Not a wargear slot itself (e.g. a squad-size/model-variant group,
                // or a Leader/Enhancement group) - walk into each child instead,
                // since the real weapon slot is often nested inside one variant,
                // carrying down that variant's own cap (if any) for it to use.
                const slotsBefore = slots.length;
                for (const c of children) walk(c.entry, getVariantCap(c.entry));
                if (children.length > 1 && slots.length === slotsBefore) {
                    warnings.push(`Group "${group.name}" (${children.length} children: ${children.map(c => c.name).join(", ")}) produced no wargear slot anywhere beneath it - possible unrecognized BSData shape.`);
                }
            }
            // A group's direct children being fixed/weapon items doesn't rule out
            // it ALSO having its own nested subgroups with the real choices (e.g.
            // GMND's "Wargear" group has a direct fixed Fragstorm grenade launcher
            // link AND separate "Dreadfists"/"Ranged Weapons" subgroups) - always
            // walk into nested subgroups regardless of how the group itself classified.
            // Skipped for a matched variantSlot/comboSlot - each choice's own
            // weapons are already fully captured, walking further would only
            // produce noise. No cap carried here - a found group's own nested
            // subgroups have their own real constraints, unrelated to any
            // ancestor variant's cap.
            if (!matchedSlot) walk(group);
        }
        // Also walk direct child selectionEntries/entryLinks (non-group) in case
        // a weapon slot hangs directly off a model entry without an intermediate group.
        for (const c of resolveChildren(node, catalogue)) {
            if (!hasWeaponProfile(c.entry, catalogue)) walk(c.entry, getVariantCap(c.entry));
        }
    }
    walk(unitEntry);
    return { slots, warnings };
}
