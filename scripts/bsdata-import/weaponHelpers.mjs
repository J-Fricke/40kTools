// ─── SHARED RAW-ENTRY HELPERS ───────────────────────────────────────────────
// Small helpers for reading raw BSData entries, used by both extractSlots.mjs
// and extractBase.mjs. Pulled out here (rather than one importing from the
// other) once extractSlots needed extractBase's own "does this entry carry
// weapon profiles directly" check, to avoid a circular import between them.
export function resolveEntry(catalogue, targetId) {
    return catalogue.sharedSelectionEntries.find(e => e.id === targetId)
        || catalogue.sharedSelectionEntryGroups?.find(e => e.id === targetId);
}

export function hasWeaponProfile(entry) {
    return (entry.profiles || []).some(p => p.typeName === "Ranged Weapons" || p.typeName === "Melee Weapons");
}

// All of a node's own DIRECT weapon-bearing entries (a selectionEntries
// child with a weapon profile, or an entryLink resolving to one) - does not
// recurse into further nesting.
export function directWeaponEntries(node, catalogue) {
    const out = [];
    for (const e of node.selectionEntries || []) if (hasWeaponProfile(e)) out.push(e);
    for (const link of node.entryLinks || []) {
        if (link.type !== "selectionEntry") continue;
        const target = resolveEntry(catalogue, link.targetId);
        if (target && hasWeaponProfile(target)) out.push(target);
    }
    return out;
}
