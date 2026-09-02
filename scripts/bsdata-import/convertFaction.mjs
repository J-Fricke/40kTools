import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { extractSlots, resolveEntry } from "./extractSlots.mjs";
import { extractBase } from "./extractBase.mjs";
import { buildFamily } from "./buildFamily.mjs";
import { ourSizeTiers } from "./ourSizeTiers.mjs";
import { FACTIONS } from "../../src/core/registry.js";

const ADMIN = new Set(["Detachment", "Show/Hide Options", "Order of Battle"]);

// convertFaction: runs the full BSData->composable pipeline for one faction.
// `nameMap`: {uid: "BSData unit name"} - the one thing that has to be hand-
// verified per faction (BSData's naming doesn't always match ours 1:1).
// Falls back to our own existing sWs/mWs for any unit whose base weapons
// BSData doesn't resolve cleanly - see KNOWN_GAPS.md, logged not blocked.
export function convertFaction({ factionKey, bsdataFile, nameMap, _preloaded }) {
    const data = _preloaded || JSON.parse(readFileSync(bsdataFile, "utf8"));
    const cat = data.catalogue;
    const tiers = ourSizeTiers(factionKey);
    const fd = FACTIONS[factionKey];

    const results = {}, gaps = [], notFound = [];
    for (const [uid, name] of Object.entries(nameMap)) {
        const link = (cat.entryLinks || []).find(l => l.name === name && l.type === "selectionEntry" && !ADMIN.has(l.name));
        if (!link) { notFound.push(`${uid} (${name})`); continue; }
        const entry = resolveEntry(cat, link.targetId);
        const { slots, warnings } = extractSlots(entry, cat);
        for (const w of warnings) gaps.push(`${uid} (${name}): COVERAGE WARNING - ${w}`);
        const base = extractBase(entry, cat);
        const refUnit = fd.units.find(u => u.uid === uid);
        const def = { sv: refUnit.sv, inv: refUnit.inv, fnp: refUnit.fnp, W: refUnit.W };

        let baseProfiles = base.weapons.flatMap(w => w.profiles || []);
        let fallbackSWs, fallbackMWs;
        if (!baseProfiles.length) {
            const cheapest = fd.units.filter(u => u.uid === uid).sort((a, b) => a.pts - b.pts)[0];
            fallbackSWs = cheapest?.sWs || []; fallbackMWs = cheapest?.mWs || [];
            gaps.push(`${uid} (${name}): base weapons from our own data, not BSData - needs individual review`);
        }
        try {
            const family = buildFamily({
                uid, unit: name, faction: factionKey,
                sizeTiers: tiers[uid] || {}, baseProfiles, slots, ...def,
                chars: refUnit.chars,
            });
            if (fallbackSWs) { family.base.sWs = fallbackSWs; family.base.mWs = fallbackMWs; }
            results[uid] = family;
        } catch (err) {
            gaps.push(`${uid} (${name}): CONVERSION FAILED - ${err.message}`);
        }
    }
    return { results, gaps, notFound };
}
