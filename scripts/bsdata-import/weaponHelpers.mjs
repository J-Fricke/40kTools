// ─── SHARED RAW-ENTRY HELPERS ───────────────────────────────────────────────
// Small helpers for reading raw BSData entries, used by both extractSlots.mjs
// and extractBase.mjs. Pulled out here (rather than one importing from the
// other) once extractSlots needed extractBase's own "does this entry carry
// weapon profiles directly" check, to avoid a circular import between them.
export function resolveEntry(catalogue, targetId) {
    return catalogue.sharedSelectionEntries.find(e => e.id === targetId)
        || catalogue.sharedSelectionEntryGroups?.find(e => e.id === targetId);
}

// A weapon's stat block can be attached to an entry two different ways:
// embedded directly (`entry.profiles`), or shared - defined once in the
// catalogue's own `sharedProfiles` array and referenced via `entry.infoLinks`
// (type:"profile"), which is how many single-use-per-unit weapons (no reuse
// across other entries) still end up authored (found investigating Cthonian
// Beserks' "Concussion maul", which had zero embedded profile and only an
// infoLink - the real characteristics were sitting in `sharedProfiles` the
// whole time). Both shapes carry the exact same {typeName, characteristics}
// structure once resolved, so downstream code (profileToWeapon.mjs etc.)
// doesn't need to know which source a profile came from.
export function resolveProfiles(entry, catalogue) {
    const embedded = entry.profiles || [];
    const linked = (entry.infoLinks || [])
        .filter(l => l.type === "profile")
        .map(l => (catalogue.sharedProfiles || []).find(p => p.id === l.targetId))
        .filter(Boolean);
    const all = [...embedded, ...linked];
    // Carry a quantity multiplier (see directWeaponEntries' _qty) from the
    // entry onto its own resolved profiles, so buildFamily.mjs's weapon-array
    // resolution can multiply shots by it further downstream.
    return entry._qty ? all.map(p => ({ ...p, _qty: entry._qty })) : all;
}

// An entryLink can carry its own "N copies of this weapon" constraint
// (a min===max>1 "selections"/scope:"parent" constraint on the LINK itself,
// not the resolved target) - found on Knight Tyrant's "2 Gheiststrike
// missile launchers and 1 twin desecrator cannon" combo choice, where the
// Gheiststrike link has min:2/max:2. Without reading this, a "2 of weapon
// X, 1 of weapon Y" choice resolves both at ×1, silently under-counting.
function entryLinkQty(link) {
    const cs = (link.constraints || []).filter(c => c.field === "selections" && c.scope === "parent");
    const min = cs.find(c => c.type === "min"), max = cs.find(c => c.type === "max");
    return (min && max && min.value === max.value && min.value > 1) ? min.value : 1;
}

export function hasWeaponProfile(entry, catalogue) {
    return resolveProfiles(entry, catalogue).some(p => p.typeName === "Ranged Weapons" || p.typeName === "Melee Weapons");
}

// All of a node's own DIRECT weapon-bearing entries (a selectionEntries
// child with a weapon profile, or an entryLink resolving to one) - does not
// recurse into further nesting.
export function directWeaponEntries(node, catalogue) {
    const out = [];
    for (const e of node.selectionEntries || []) if (hasWeaponProfile(e, catalogue)) out.push(e);
    for (const link of node.entryLinks || []) {
        if (link.type !== "selectionEntry") continue;
        const target = resolveEntry(catalogue, link.targetId);
        if (target && hasWeaponProfile(target, catalogue)) {
            const qty = entryLinkQty(link);
            out.push(qty > 1 ? { ...target, _qty: qty } : target);
        }
    }
    return out;
}

// A slot choice can be shaped two ways: a WRAPPER bundling other
// weapon-linked sub-items (directWeaponEntries applies - e.g. "Storm bolter
// and Dreadnought combat weapon" upgrade entry linking to two separate
// weapons), or the weapon itself, directly (e.g. a plain "Reaper
// chainsword" entryLink sitting as a sibling of wrapper entries in the same
// choice group - found in Knight Despoiler's "Replace reaper chainsword"
// group, which mixes both shapes). directWeaponEntries alone only finds the
// first shape (it looks at the node's OWN children, and a bare weapon entry
// has none); this resolves either shape uniformly.
export function resolveChoiceWeapons(entry, catalogue) {
    if (hasWeaponProfile(entry, catalogue)) return [entry];
    return directWeaponEntries(entry, catalogue);
}
