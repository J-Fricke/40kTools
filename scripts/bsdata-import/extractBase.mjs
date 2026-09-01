import { resolveEntry } from "./extractSlots.mjs";

function hasWeaponProfile(entry) {
    return (entry.profiles || []).some(p => p.typeName === "Ranged Weapons" || p.typeName === "Melee Weapons");
}

function directWeaponEntries(node, catalogue) {
    const out = [];
    for (const e of node.selectionEntries || []) if (hasWeaponProfile(e)) out.push(e);
    for (const link of node.entryLinks || []) {
        if (link.type !== "selectionEntry") continue;
        const target = resolveEntry(catalogue, link.targetId);
        if (target && hasWeaponProfile(target)) out.push(target);
    }
    return out;
}

// extractBase: finds the unit's fixed (no-choice) base weapons.
//  - Single-model units (vehicles, characters): weapons hang directly off
//    the unit entry itself.
//  - Multi-model squads: BattleScribe represents the squad as a pool of named
//    MODEL variants (e.g. "Paladin" / "Paladin with Ancient's Banner" /
//    "Paladin with Heavy Weapon") rather than one base + orthogonal slots -
//    a more general shape than this app's schema assumes. Heuristic used
//    here: within the squad-size group, the variant whose name does NOT
//    contain " with " is the plain/base model (matches the naming pattern
//    GW/BSData use consistently for this squad shape) - its own weapons are
//    the base loadout. Known limitation: units that don't follow this naming
//    pattern won't be detected correctly and need manual review.
export function extractBase(unitEntry, catalogue) {
    const direct = directWeaponEntries(unitEntry, catalogue);
    if (direct.length) return { weapons: direct, note: null };

    for (const group of unitEntry.selectionEntryGroups || []) {
        const modelEntries = (group.selectionEntries || []).filter(e => e.type === "model");
        if (!modelEntries.length) continue;
        const base = modelEntries.find(e => !/ with /i.test(e.name)) || modelEntries[0];
        const weapons = directWeaponEntries(base, catalogue);
        if (weapons.length) return { weapons, note: `base model: "${base.name}" (heuristic: no " with " in name)` };
    }
    return { weapons: [], note: "no base weapons found - needs manual review" };
}
