import { FACTIONS } from "../../src/core/registry.js";

// For each uid, build {modelCount: basePts} from our own already-verified
// src/factions/*.js data - NOT from BSData's costs field (see project memory
// for why: our own MFM-tracked ingestion is the trusted source for points,
// BSData is only trusted for weapon profiles/option structure).
// Base cost per size = the CHEAPEST sku at that (uid, m) pair, since any
// pricier sku at the same size just has extra wargear baked in.
export function ourSizeTiers(factionKey) {
    const fd = FACTIONS[factionKey];
    const tiers = {}; // uid -> {m: pts}
    for (const u of fd.units) {
        if (!tiers[u.uid]) tiers[u.uid] = {};
        if (tiers[u.uid][u.m] == null || u.pts < tiers[u.uid][u.m]) tiers[u.uid][u.m] = u.pts;
    }
    return tiers;
}
