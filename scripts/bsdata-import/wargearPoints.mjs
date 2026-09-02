// ─── WARGEAR POINT COSTS ────────────────────────────────────────────────────
// Real, MFM v1.3-verified per-choice wargear point costs. Most GK/Custodes/
// Votann/Chaos Knights wargear options are genuinely free in the current
// ruleset (10th/11th edition moved almost everything to flat per-model-count
// pricing) - this table lists only the confirmed exceptions, each one
// traced directly to a "per <weapon>: N pts" line in that faction's own
// ref/*-mfm-v1.3.txt "WARGEAR OPTIONS" section, NOT BSData's `costs` field
// (same rationale as ourSizeTiers.mjs - our own MFM-verified source, not a
// third party's). See GitHub issue #4.
//
// Sanity-checked against a real trap: the old hand-authored data showed
// point variation for a couple of units (e.g. Nemesis Dreadknight 195 vs
// 210) that turned out to be the MFM's unrelated "3rd+ copy of this unit in
// your army costs more" battle-size tax, not a wargear cost at all - don't
// trust apparent point variation in old data without tracing it back to an
// actual "WARGEAR OPTIONS" section.
//
// `match`: case-insensitive substring tested against a slot choice's label.
// BSData's weapon names don't always match the MFM's short phrasing exactly
// (e.g. MFM says "Heavy psycannon", BSData may label the choice differently
// depending on faction) - substring match on the distinctive part of the
// name is more robust than requiring an exact string.
export const WARGEAR_POINTS = {
    greyknights: {
        bts: [{ match: "psycannon", ptsDelta: 5 }],
        gmndk: [{ match: "sublimator", ptsDelta: 15 }, { match: "heavy psycannon", ptsDelta: 15 }],
        ndk: [{ match: "heavy psycannon", ptsDelta: 15 }],
        pal: [{ match: "psycannon", ptsDelta: 5 }],
        purg: [{ match: "psycannon", ptsDelta: 5 }],
    },
    custodes: {
        cal: [{ match: "twin arachnus heavy blaze cannon", ptsDelta: 15 }],
        // vn (Venatari Custodians): MFM v1.3 says "per Venatari lance: 5pts",
        // but ref/custodes-datasheets.txt's own rules text says the lance IS
        // the free base weapon ("Every model is equipped with: Venatari
        // lance") and the optional swap is TO a kinetic destroyer + tarsus
        // buckler, with no cost stated for that swap. Those two sources
        // point opposite directions - either a newer errata/dataslate
        // flipped which weapon is free (this datasheet source may predate
        // that), or the MFM line means something this app's schema can't
        // represent yet (a cost to KEEP the base weapon, not a slot choice
        // at all). Deliberately not applying a possibly-backwards cost -
        // needs a human check against a current datasheet before wiring in.
    },
    votann: {
        // No "WARGEAR OPTIONS" section appears anywhere in
        // ref/votann-mfm-v1.3.txt - every Votann wargear choice is free.
    },
    chaosknights: {
        // Knight Despoiler (desp) genuinely has costed wargear per the MFM
        // (gatling cannon 25pts, battle cannon 10pts) - NOT wired here yet.
        // desp's own extracted wargear slots are still wrong (its real
        // "Replace reaper chainsword"/"Replace warpstrike claw" choice
        // groups are among the units flagged by the coverage-warning
        // mechanism, see KNOWN_GAPS.md) - wiring points onto the current,
        // incorrect choices would be actively misleading. Revisit once
        // desp's extraction itself is fixed (part of issue #1's remaining
        // third-shape backlog), not before.
    },
};

// applyWargearPoints: mutates `family` in place, setting ptsDelta on any
// slot choice whose label matches a rule for this faction+uid. A no-op for
// every unit not listed above (the overwhelming majority - ptsDelta stays
// at its correct default of 0/undefined for genuinely free wargear).
export function applyWargearPoints(factionKey, uid, family) {
    const rules = WARGEAR_POINTS[factionKey]?.[uid];
    if (!rules || !rules.length) return;
    for (const slot of family.slots || []) {
        for (const choice of slot.choices || []) {
            const rule = rules.find(r => choice.label.toLowerCase().includes(r.match.toLowerCase()));
            if (rule) choice.ptsDelta = rule.ptsDelta;
        }
    }
}
