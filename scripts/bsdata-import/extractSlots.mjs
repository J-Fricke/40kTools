// ─── WARGEAR SLOT EXTRACTION ────────────────────────────────────────────────
// Walks a unit's full selectionEntries/selectionEntryGroups tree (including
// entryLinks that reference the catalogue's sharedSelectionEntries) and finds
// every group that represents a real wargear choice - a selectionEntryGroup
// whose every resolved child is a weapon-only entry (has a Ranged/Melee
// Weapons profile, not a "model" sub-entry). Groups whose children are model
// variants (e.g. Paladin Squad's "3-9 Paladins" - the squad-size container)
// are deliberately NOT treated as wargear slots; they're walked into instead,
// since the real wargear choices usually live nested inside one specific
// model variant (e.g. "Paladin with Heavy Weapon" has its own "Heavy Weapon"
// swap group one level down).
export function resolveEntry(catalogue, targetId) {
    return catalogue.sharedSelectionEntries.find(e => e.id === targetId)
        || catalogue.sharedSelectionEntryGroups?.find(e => e.id === targetId);
}

function hasWeaponProfile(entry) {
    return (entry.profiles || []).some(p => p.typeName === "Ranged Weapons" || p.typeName === "Melee Weapons");
}

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

// extractSlots: returns [{ id, label, pick:{min,max}, choices:[{id,label,entry}] }]
// for every wargear slot found anywhere in the unit's tree (recursive).
export function extractSlots(unitEntry, catalogue) {
    const slots = [];
    const visited = new Set();
    function walk(node, ownCap) {
        if (!node || (node.id && visited.has(node.id))) return;
        if (node.id) visited.add(node.id);
        for (const group of node.selectionEntryGroups || []) {
            const children = resolveChildren(group, catalogue);
            const allWeapons = children.length > 0 && children.every(c => hasWeaponProfile(c.entry));
            if (allWeapons) {
                slots.push({
                    id: group.id, label: group.name,
                    pick: ownCap || getConstraints(group),
                    choices: children.map(c => ({ id: c.entry.id, label: c.name, entry: c.entry })),
                });
            } else {
                // Not a wargear slot itself (e.g. a squad-size/model-variant group,
                // or a Leader/Enhancement group) - walk into each child instead,
                // since the real weapon slot is often nested inside one variant,
                // carrying down that variant's own cap (if any) for it to use.
                for (const c of children) walk(c.entry, getVariantCap(c.entry));
            }
            // A group's direct children being fixed/weapon items doesn't rule out
            // it ALSO having its own nested subgroups with the real choices (e.g.
            // GMND's "Wargear" group has a direct fixed Fragstorm grenade launcher
            // link AND separate "Dreadfists"/"Ranged Weapons" subgroups) - always
            // walk into nested subgroups regardless of how the group itself classified.
            // No cap carried here - a found group's own nested subgroups have their
            // own real constraints, unrelated to any ancestor variant's cap.
            walk(group);
        }
        // Also walk direct child selectionEntries/entryLinks (non-group) in case
        // a weapon slot hangs directly off a model entry without an intermediate group.
        for (const c of resolveChildren(node, catalogue)) {
            if (!hasWeaponProfile(c.entry)) walk(c.entry, getVariantCap(c.entry));
        }
    }
    walk(unitEntry);
    return slots;
}
