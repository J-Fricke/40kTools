// ─── SYNC WITH BSData ───────────────────────────────────────────────────────
// Re-run this any time to refresh wargear/option data from BSData/wh40k-11e
// (fetched fresh from GitHub each run - "keep our data in sync with current
// on the repo", per the explicit ask). Downloads the four factions' JSON
// (plus Chaos Knights' separate "Library" catalogue - its real unit data
// lives there, not in the thin top-level file, see extractSlots.mjs), runs
// the full conversion pipeline, and writes the result to
// src/core/composableData/<faction>.json - the committed data the Unit
// Builder actually reads at runtime, NOT re-fetched by the app itself.
//
// Usage: node scripts/bsdata-import/sync.mjs
//
// After running, check the console output for "gaps" and cross-reference
// against KNOWN_GAPS.md - re-run doesn't auto-update that file, it's meant
// to be read and edited by a human alongside this.
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { convertFaction } from "./convertFaction.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(REPO_ROOT, "src", "core", "composableData");
const RAW = "https://raw.githubusercontent.com/BSData/wh40k-11e/main/";

async function fetchJson(filename) {
    const res = await fetch(RAW + encodeURIComponent(filename));
    if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
    return res.json();
}

const NAME_MAPS = {
    greyknights: {
        bts: "Brotherhood Terminator Squad", ss: "Strike Squad", pal: "Paladin Squad",
        int: "Interceptor Squad", purg: "Purgation Squad", pur: "Purifier Squad",
        ndk: "Nemesis Dreadknight", gmndk: "Grand Master in Nemesis Dreadknight",
        vd: "Venerable Dreadnought", sr: "Stormraven Gunship", rhino: "Rhino",
        razorback: "Razorback", lrr: "Land Raider Redeemer",
    },
    custodes: {
        cg: "Custodian Guard", cw: "Custodian Wardens", al: "Allarus Custodians",
        sag: "Sagittarum Custodians", vp: "Vertus Praetors", vn: "Venatari Custodians",
        ag: "Agamatus Custodians", aq: "Aquilon Custodians",
        cgs: "Custodian Guard with Adrasite and Pyrithite spears",
        cal: "Caladius Grav-tank", pal: "Pallas Grav-attack", cor: "Coronus Grav-carrier",
        vcd: "Venerable Contemptor Dreadnought", ach: "Contemptor-Achillus Dreadnought",
        gal: "Contemptor-Galatus Dreadnought", tel: "Telemon Heavy Dreadnought",
        vlr: "Venerable Land Raider", pro: "Prosecutors", vig: "Vigilators", wit: "Witchseekers",
        bc: "Blade Champion", sc: "Shield-Captain",
        sca: "Shield-Captain in Allarus Terminator Armour",
        scb: "Shield-Captain on Dawneagle Jetbike",
        tj: "Trajann Valoris", val: "Valerian",
    },
    votann: {
        hk: "Hearthkyn Warriors", hg: "Einhyr Hearthguard", bs: "Cthonian Beserks",
        tk: "Brôkhyr Thunderkyn", sv: "Ironkin Steeljacks with Heavy Volkanite Disintegrators",
        sm: "Ironkin Steeljacks with Melee Weapons", ya: "Hernkyn Yaegirs",
        pi: "Hernkyn Pioneers", es: "Cthonian Earthshakers", hf: "Hekaton Land Fortress",
        sg: "Sagitaur", kd: "Kapricus Defenders", bu: "Buri Aegnirssen",
        ch: "Einhyr Champion", ak: "Arkanyst Evaluator",
    },
    chaosknights: {
        abom: "Knight Abominant", desc: "Knight Desecrator", desp: "Knight Despoiler",
        ramp: "Knight Rampager", ruin: "Knight Ruinator", tyrant: "Knight Tyrant",
        ach: "Chaos Cerastus Knight Acheron", atra: "Chaos Cerastus Knight Atrapos",
        casti: "Chaos Cerastus Knight Castigator", lanc: "Chaos Cerastus Knight Lancer",
        mag: "Chaos Questoris Knight Magaera", sty: "Chaos Questoris Knight Styrix",
        aster: "Chaos Acastus Knight Asterius", porf: "Chaos Acastus Knight Porphyrion",
        brigand: "War Dog Brigand", exec: "War Dog Executioner", huntsman: "War Dog Huntsman",
        karnivore: "War Dog Karnivore", stalker: "War Dog Stalker", moirax: "War Dog Moirax",
    },
};

const FILES = {
    greyknights: "Imperium - Grey Knights.json",
    custodes: "Imperium - Adeptus Custodes.json",
    votann: "Leagues of Votann.json",
    chaosknights: "Chaos - Chaos Knights Library.json", // NOT "Chaos - Chaos Knights.json" - see extractSlots.mjs
};

async function main() {
    mkdirSync(OUT_DIR, { recursive: true });
    let totalGaps = 0;
    for (const [factionKey, filename] of Object.entries(FILES)) {
        console.log(`\nFetching ${filename}...`);
        const bsdata = await fetchJson(filename);
        const { results, gaps, notFound } = convertFaction({
            factionKey, bsdataFile: null, nameMap: NAME_MAPS[factionKey], _preloaded: bsdata,
        });
        const total = Object.keys(NAME_MAPS[factionKey]).length;
        console.log(`${factionKey}: ${Object.keys(results).length}/${total} converted`);
        if (notFound.length) console.log(`  NOT FOUND (name mismatch, needs fixing): ${notFound.join(", ")}`);
        gaps.forEach(g => console.log(`  - gap: ${g}`));
        totalGaps += gaps.length;
        writeFileSync(join(OUT_DIR, `${factionKey}.json`), JSON.stringify(results, null, 2));
    }
    console.log(`\nDone. ${totalGaps} total gaps flagged - cross-reference against KNOWN_GAPS.md.`);
}

main().catch(err => { console.error(err); process.exit(1); });
