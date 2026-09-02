// ─── WARGEAR SLOT EXTRACTION ────────────────────────────────────────────────
// Walks a unit's full selectionEntries/selectionEntryGroups tree (including
// entryLinks that reference the catalogue's sharedSelectionEntries) and finds
// every group that represents a real wargear choice. Two distinct BSData
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
import { resolveEntry, hasWeaponProfile, directWeaponEntries } from "./weaponHelpers.mjs";
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
    const resolved = children.map(c => ({ ...c, weapons: directWeaponEntries(c.entry, catalogue) }));
    if (resolved.some(c => c.weapons.length === 0)) return null;
    const base = resolved.find(c => !/ with /i.test(c.name)) || resolved[0];
    const alternates = resolved.filter(c => c !== base);
    if (!alternates.length) return null;
    return {
        id: group.id, label: group.name, pick: { min: 0, max: alternates.length },
        choices: alternates.map(c => ({ id: c.entry.id, label: c.name, entries: c.weapons })),
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
            const allWeapons = children.length > 0 && children.every(c => hasWeaponProfile(c.entry));
            const variantSlot = !allWeapons ? namedVariantSlot(group, children, catalogue) : null;
            if (allWeapons) {
                slots.push({
                    id: group.id, label: group.name,
                    pick: ownCap || getConstraints(group),
                    choices: children.map(c => ({ id: c.entry.id, label: c.name, entry: c.entry })),
                });
            } else if (variantSlot) {
                slots.push(variantSlot);
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
            // Skipped for a matched variantSlot - each variant's own weapons are
            // already fully captured, walking further would only produce noise.
            // No cap carried here - a found group's own nested subgroups have their
            // own real constraints, unrelated to any ancestor variant's cap.
            if (!variantSlot) walk(group);
        }
        // Also walk direct child selectionEntries/entryLinks (non-group) in case
        // a weapon slot hangs directly off a model entry without an intermediate group.
        for (const c of resolveChildren(node, catalogue)) {
            if (!hasWeaponProfile(c.entry)) walk(c.entry, getVariantCap(c.entry));
        }
    }
    walk(unitEntry);
    return { slots, warnings };
}
