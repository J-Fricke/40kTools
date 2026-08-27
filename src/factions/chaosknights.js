// ─── FACTION: CHAOS KNIGHTS ────────────────────────────────────────────────────
// Last updated: Faction Pack v1.1 (legal 2026-07-22); MFM v1.3 (legal 2026-08-26)
// MFM v1.3 pts deltas: Cerastus Atrapos ▼-10, Cerastus Lancer 1st ▼-10, Knight Despoiler
// 1st ▼-20/2nd+ ▼-10 (+ battle cannon wargear ▼-5, unmodeled loadout), Knight Rampager
// ▼-10 both tiers, War Dog Brigand ▼-5, War Dog Karnivore ▼-10 (pts10 = pre-v1.3 value).
// Also: Houndpack Lance + Hunting Warpack lost their UNIQUE tag (no calc effect).
// Faction Pack v1.2 (legal from 2026-08-26) republishes 9 Imperial Armour datasheets in full -
// all 9 (Asterius, Porphyrion, Cerastus Lancer/Castigator/Acheron/Atrapos, Questoris Magaera/Styrix,
// War Dog Moirax) were ALREADY coded here under other ids; none are new units. Its 3 flagged
// datasheet corrections (Abominant, Desecrator, Ruinator - see comments at each) already matched
// the coded weapon profiles. Its 4 fully-rewritten detachments (Bastions of Tyranny, Hunting
// Warpack, Iconoclast Fiefdom, Helhunt Lance) are annotated below; only Helhunt Lance's Merciless
// Fusillade stratagem yielded a clean always-on numeric buff worth modeling.
// inv5+ on most units is ranged attacks only — modeled as inv:5 (approx overestimates melee survivability)
// Cerastus Lancer: inv4 vs ALL attacks; Atrapos/Magaera/Styrix: inv5 vs all attacks
// Torrent weapons: shots × 6/5 to compensate for engine's 5/6 base hp (torrent = auto-hit)
// Rampager Bloodlust: DEV on charge → separate _c rows
// Desecrator laser destructor: DEVASTATING WOUNDS: MONSTER/VEHICLE only → devmv tag
// Fellbore: ANTI-MONSTER 2+ ANTI-VEHICLE 2+ → av3+am3
// Huntsman ability: re-roll wound vs MON/VEH → rrwf on all rows (overestimates vs infantry)
// Stalker ability: +1 wound if isolated → w1 (conditional, modeled as always-on)
// Cerastus shock lance LANCE tag (charge bonus): modeled as w1
// Asterius Sunderer of Fortresses: +1S+1D vs VEH → separate _v rows
// Porphyrion Bastion of Firepower: LETHAL HITS when stationary → separate _s rows
// Atrapos Macro-extinction: +1 hit vs MON/VEH — not modeled (per-target bhBonus)
// Melta bonus damage at half range not modeled; base D value used
// D averages: D6=3.5, D3=2, 2D6=7, D6+1=4.5, D6+3=6.5, D6+6=9.5, D6+8=11.5, 3D6=10.5

export const CHARS = {
    none: {name:"None", pts:0, W:0, sv:7, inv:null, fnp:null, sWs:null, mWs:null, buffs:{}, validFor:"all"},
};

export const UNITS = [
    // ── ABHORRENT KNIGHTS — T11, W26, sv3+, inv5 (ranged only) ──────────────

    // Knight Abominant — 355/370
    // Balemace: Extra Attacks = sh1 (crit→extra attack). Electroscourge: SH1 native.
    // Faction Pack v1.2 datasheet correction (Volkite Combustor → [12,3,12,0,3,{dev:1}]) already
    // matches the row below - no change needed. Warp Storms ability (AOE mortal wounds to nearby
    // enemies at end of Movement phase) not modeled.
    {id:"abom",       uid:"abom",    unit:"Knight Abominant",        label:"",                           pts:355, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[12,3,12,0,3,{dev:1}],[3,3,5,0,1,{}]],
        mWs:[[9,3,10,-2,3,{sh1:1}],[3,3,8,-1,2,{sh1:1}]]},

    // Knight Desecrator — 355/370
    // Faction Pack v1.2 datasheet correction (Desecrator Laser Destructor → [3,2,18,-4,6.5,{devmv:1}])
    // already matches the row below - no change needed. Obsessive Ruthlessness ability (ignore BS/hit/
    // wound modifiers vs MON/VEH) not modeled.
    {id:"desc_rc",    uid:"desc",    unit:"Knight Desecrator",       label:"Reaper Chainsword",          pts:355, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[3,2,18,-4,6.5,{devmv:1}],[3,2,5,0,1,{}]],
        mWs:[[12,3,9,-3,2,{}]]},
    {id:"desc_wc",    uid:"desc",    unit:"Knight Desecrator",       label:"Warpstrike Claw",            pts:355, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[3,2,18,-4,6.5,{devmv:1}],[3,2,5,0,1,{}]],
        mWs:[[4,3,20,-3,8,{}],[8,3,10,-2,3,{}]]},

    // Knight Despoiler — MFM v1.3: 1st ▼-20 → 360 (was 380), 2nd+ ▼-10 → 390 (was 400);
    // gatling variant unchanged wargear cost (+25) = 385. Despoiler battle cannon wargear
    // also ▼-5 → 10pts (was 15) but that loadout isn't separately modeled here.
    // Base: meltagun + reaper chainsword arm + warpstrike claw arm + titanic feet
    // Optimal melee: WC strike + RC sweep + titanic feet (different weapons, all usable)
    {id:"desp",       uid:"desp",    unit:"Knight Despoiler",        label:"Base (meltagun)",            pts:360, pts10:380, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[1,3,9,-4,3.5,{}]],
        mWs:[[4,3,20,-3,8,{}],[12,3,9,-3,2,{}],[4,4,8,-1,2,{}]]},
    // Gatling variant: RC arm replaced with gatling+darkflamer (lose RC melee, keep WC+feet)
    {id:"desp_gc",    uid:"desp",    unit:"Knight Despoiler",        label:"Gatling Cannon (+25pts)",    pts:385, pts10:405, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[18,3,6,-2,2,{}],[4.2,3,5,-1,1,{}]],
        mWs:[[4,3,20,-3,8,{}],[4,4,8,-1,2,{}]]},

    // Knight Rampager — MFM v1.3: 1st-2nd ▼-10 → 355 (was 365), 3rd+ ▼-10 → 370 (was 380)
    // all melee have SH1 native (WS 2+); Bloodlust: melee gains DEV after a charge move → _c rows
    {id:"ramp_rc",    uid:"ramp",    unit:"Knight Rampager",         label:"Chainsword",                 pts:355, pts10:365, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[3,3,5,0,1,{}]],
        mWs:[[18,2,9,-3,2,{sh1:1}]]},
    {id:"ramp_wc",    uid:"ramp",    unit:"Knight Rampager",         label:"Warp Claw",                  pts:355, pts10:365, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[3,3,5,0,1,{}]],
        mWs:[[6,2,20,-3,8,{sh1:1}],[12,2,9,-3,2,{sh1:1}]]},
    {id:"ramp_c",     uid:"ramp",    unit:"Knight Rampager",         label:"Charged (Bloodlust +DEV)",   pts:355, pts10:365, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[3,3,5,0,1,{}]],
        mWs:[[6,2,20,-3,8,{sh1:1,dev:1}],[12,2,9,-3,2,{sh1:1,dev:1}]]},

    // Knight Ruinator — 340/355
    // Darkflame lance: torrent 9.5 shots × 6/5 = 11.4
    // Faction Pack v1.2 datasheet corrections (Darkflame Lance → [11.4,3,8,-1,2,{}], Terrorpulse
    // Missiles → [9.5,3,8,-2,2,{}]) already match the rows below - no change needed.
    {id:"ruin",       uid:"ruin",    unit:"Knight Ruinator",         label:"",                           pts:340, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[11.4,3,8,-1,2,{}],[9.5,3,8,-2,2,{}]],
        mWs:[[4,3,14,-3,6,{av3:1,am3:1}],[10,3,9,-2,2,{}]]},

    // Knight Tyrant — T12, W28, sv3+, inv5 (ranged only) — 400/420
    {id:"tyrant",     uid:"tyrant",  unit:"Knight Tyrant",           label:"Volcano Lance",              pts:400, pts10:null, m:1, W:28, sv:3, inv:5, fnp:null,
        sWs:[[2,3,20,-5,11.5,{}],[6.5,3,9,-4,2,{}],[1,3,12,-6,4.5,{dev:1}],[2,3,9,-4,3.5,{tl:1}]],
        mWs:[[4,4,8,-1,2,{}]]},
    {id:"tyrant_df",  uid:"tyrant",  unit:"Knight Tyrant",           label:"Darkflame Cannon",           pts:400, pts10:null, m:1, W:28, sv:3, inv:5, fnp:null,
        sWs:[[12.6,3,8,-1,2,{}],[2,3,24,-6,12,{dev:1}],[1,3,12,-6,4.5,{dev:1}],[2,3,9,-4,3.5,{tl:1}]],
        mWs:[[4,4,8,-1,2,{}]]},

    // ── CERASTUS KNIGHTS — T11, W28, sv3+ ────────────────────────────────────

    // Cerastus Knight Acheron — 370/385 — inv5 ranged only
    {id:"ach",        uid:"ach",     unit:"Cerastus Acheron",        label:"",                           pts:370, pts10:null, m:1, W:28, sv:3, inv:5, fnp:null,
        sWs:[[8.4,3,8,-1,2,{}],[3,3,5,-1,2,{sh1:1,tl:1}]],
        mWs:[[12,3,9,-3,2,{}]]},

    // Cerastus Knight Atrapos — MFM v1.3: 1st ▼-10 → 385 (was 395) — inv5 ALL attacks (no asterisk on sheet)
    {id:"atra",       uid:"atra",    unit:"Cerastus Atrapos",        label:"",                           pts:385, pts10:395, m:1, W:28, sv:3, inv:5, fnp:null,
        sWs:[[7,3,7,-1,2,{sh1:1}],[3.5,3,14,-3,4,{sh1:1}],[2,3,16,-4,4.5,{}]],
        mWs:[[6,3,14,-3,4,{sh1:1}]]},

    // Cerastus Knight Castigator — 370/385 — inv5 ranged only
    {id:"casti",      uid:"casti",   unit:"Cerastus Castigator",     label:"",                           pts:370, pts10:null, m:1, W:28, sv:3, inv:5, fnp:null,
        sWs:[[18,3,6,-2,2,{tl:1}]],
        mWs:[[12,3,9,-3,2,{}]]},

    // Cerastus Knight Lancer — MFM v1.3: 1st ▼-10 → 385 (was 395), 2nd+ 415 unchanged — inv4 ALL attacks
    {id:"lanc",       uid:"lanc",    unit:"Cerastus Lancer",         label:"Sweep",                      pts:385, pts10:395, m:1, W:28, sv:3, inv:4, fnp:null,
        sWs:[[6,3,6,0,2,{sh2:1}]],
        mWs:[[10,2,10,-2,3,{}]]},
    {id:"lanc_s",     uid:"lanc",    unit:"Cerastus Lancer",         label:"Strike (Lance = w1)",        pts:385, pts10:395, m:1, W:28, sv:3, inv:4, fnp:null,
        sWs:[[6,3,6,0,2,{sh2:1}]],
        mWs:[[5,2,20,-3,8,{w1:1}]]},

    // ── QUESTORIS KNIGHTS — T11, W26, sv3+, inv5 ALL attacks ─────────────────

    // Questoris Knight Magaera — 375/390
    // Rad cleanser torrent D6=3.5 × 6/5 = 4.2 shots
    {id:"mag_rc",     uid:"mag",     unit:"Questoris Magaera",       label:"Reaper Chainsword",          pts:375, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[12,3,9,0,2,{sh2:1}],[2,3,8,-3,2,{}],[4.2,3,2,0,1,{ai:1,tl:1}]],
        mWs:[[12,3,9,-3,2,{}]]},
    {id:"mag_hk",     uid:"mag",     unit:"Questoris Magaera",       label:"Siege Claw + Rad Cleanser",  pts:375, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[12,3,9,0,2,{sh2:1}],[2,3,8,-3,2,{}],[4.2,3,2,0,1,{ai:1,tl:1}]],
        mWs:[[4,3,20,-3,8,{}],[8,3,10,-2,3,{}]]},

    // Questoris Knight Styrix — 365/380 — inv5 ALL attacks
    {id:"sty_rc",     uid:"sty",     unit:"Questoris Styrix",        label:"Reaper Chainsword",          pts:365, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[12,3,12,0,3,{dev:1}],[3,3,6,-1,2,{av3:1}],[4.2,3,2,0,1,{ai:1,tl:1}]],
        mWs:[[12,3,9,-3,2,{}]]},
    {id:"sty_hk",     uid:"sty",     unit:"Questoris Styrix",        label:"Siege Claw + Rad Cleanser",  pts:365, pts10:null, m:1, W:26, sv:3, inv:5, fnp:null,
        sWs:[[12,3,12,0,3,{dev:1}],[3,3,6,-1,2,{av3:1}],[4.2,3,2,0,1,{ai:1,tl:1}]],
        mWs:[[4,3,20,-3,8,{}],[8,3,10,-2,3,{}]]},

    // ── ACASTUS KNIGHTS — T13, W30, sv2+, inv5 (ranged only) ─────────────────

    // Acastus Knight Asterius — 785/860
    // 2× volkite culverin = 12 shots; karacnos = D6+3=6.5; 2× twin conv beam = 6 shots conv+shd3+tl
    // Sunderer of Fortresses: +1S+1D vs VEH → _v rows
    {id:"aster",      uid:"aster",   unit:"Acastus Asterius",        label:"",                           pts:785, pts10:null, m:1, W:30, sv:2, inv:5, fnp:null,
        sWs:[[12,3,6,0,2,{dev:1}],[6.5,3,6,-1,1,{ai:1}],[6,3,16,-2,3.5,{conv:1,shd3:1,tl:1}]],
        mWs:[[6,4,10,-1,2,{}]]},
    {id:"aster_v",    uid:"aster",   unit:"Acastus Asterius",        label:"vs Vehicle (Sunderer +1S+1D)",pts:785, pts10:null, m:1, W:30, sv:2, inv:5, fnp:null,
        sWs:[[12,3,7,0,3,{dev:1}],[6.5,3,7,-1,2,{ai:1}],[6,3,17,-2,4.5,{conv:1,shd3:1,tl:1}]],
        mWs:[[6,4,11,-1,3,{}]]},

    // Acastus Knight Porphyrion — 725/800
    // Default: 2× autocannon (4 total shots) + ironstorm (D6+6=9.5) + helios (6 total) + 2× lascannon (2 total) + 2× twin magna las (7 total TL)
    // Bastion of Firepower: [LETHAL HITS] when stationary → _s rows
    {id:"porf",       uid:"porf",    unit:"Acastus Porphyrion",      label:"Moving",                     pts:725, pts10:null, m:1, W:30, sv:2, inv:5, fnp:null,
        sWs:[[4,3,9,-1,3,{}],[9.5,3,5,0,1,{}],[6,3,10,-2,3.5,{}],[2,3,12,-3,4.5,{}],[7,3,18,-4,9.5,{tl:1}]],
        mWs:[[6,4,10,-1,2,{}]]},
    {id:"porf_s",     uid:"porf",    unit:"Acastus Porphyrion",      label:"Stationary (Lethal Hits)",   pts:725, pts10:null, m:1, W:30, sv:2, inv:5, fnp:null,
        sWs:[[4,3,9,-1,3,{let:1}],[9.5,3,5,0,1,{let:1}],[6,3,10,-2,3.5,{let:1}],[2,3,12,-3,4.5,{let:1}],[7,3,18,-4,9.5,{tl:1,let:1}]],
        mWs:[[6,4,10,-1,2,{}]]},

    // ── WAR DOGS — T9, W14, sv3+, inv5 (ranged only) ─────────────────────────

    // MFM v1.3: ▼-5 → 135 (was 140)
    {id:"brigand",    uid:"brigand", unit:"War Dog Brigand",         label:"Chaincannon + Meltaspear",   pts:135, pts10:140, m:1, W:14, sv:3, inv:5, fnp:null,
        sWs:[[12,3,6,-1,1,{}],[2,3,12,-4,3.5,{}]],
        mWs:[[4,3,6,0,1,{}]]},

    {id:"exec",       uid:"exec",    unit:"War Dog Executioner",     label:"2× Autocannon + Melta",      pts:130, pts10:null, m:1, W:14, sv:3, inv:5, fnp:null,
        sWs:[[8,3,9,-1,3,{}],[1,3,9,-4,3.5,{}]],
        mWs:[[4,3,6,0,1,{}]]},

    // Huntsman: re-roll wound vs MON/VEH → rrwf on all rows (overestimates vs infantry)
    {id:"huntsman",   uid:"huntsman",unit:"War Dog Huntsman",        label:"Meltaspear (rrwf approx)",   pts:135, pts10:null, m:1, W:14, sv:3, inv:5, fnp:null,
        sWs:[[2,3,12,-4,3.5,{rrwf:1}]],
        mWs:[[4,3,10,-3,3,{rrwf:1}],[8,3,8,-2,1,{rrwf:1}]]},

    // Karnivore: all melee SH1 native. MFM v1.3: ▼-10 → 145 (was 155)
    {id:"karnivore",  uid:"karnivore",unit:"War Dog Karnivore",      label:"Slaughterclaw + Chaintalon", pts:145, pts10:155, m:1, W:14, sv:3, inv:5, fnp:null,
        sWs:[[3,3,5,0,1,{}]],
        mWs:[[6,3,12,-3,5.5,{sh1:1}],[12,3,8,-2,1,{sh1:1}]]},

    // Stalker: +1 wound if isolated → w1 (conditional, modeled always-on)
    {id:"stalker",    uid:"stalker", unit:"War Dog Stalker",         label:"Chaincannon + Slaughterclaw",pts:135, pts10:null, m:1, W:14, sv:3, inv:5, fnp:null,
        sWs:[[12,3,6,-1,1,{w1:1}],[2,3,12,-4,3.5,{w1:1}]],
        mWs:[[4,3,12,-3,5.5,{w1:1}],[4,3,10,-3,3,{w1:1}]]},

    // Moirax — T10, W12, sv3+, inv5 (ranged only) — 150/160
    {id:"moirax_gv",  uid:"moirax",  unit:"War Dog Moirax",          label:"Grav Pulsar + Volkite",      pts:150, pts10:null, m:1, W:12, sv:3, inv:5, fnp:null,
        sWs:[[3.5,3,7,-1,2,{av3:1}],[4,3,8,0,2,{dev:1}]],
        mWs:[[4,3,6,0,1,{}]]},
    {id:"moirax_lc",  uid:"moirax",  unit:"War Dog Moirax",          label:"Lightning Lock + Conv Beam", pts:150, pts10:null, m:1, W:12, sv:3, inv:5, fnp:null,
        sWs:[[6,3,8,0,1,{sh2:1}],[1,3,10,-2,3,{conv:1,shd3:1}]],
        mWs:[[4,3,6,0,1,{}]]},
    {id:"moirax_sc",  uid:"moirax",  unit:"War Dog Moirax",          label:"Siege Claw melee",           pts:150, pts10:null, m:1, W:12, sv:3, inv:5, fnp:null,
        sWs:[[3.5,3,7,-1,2,{av3:1}],[4,3,8,0,2,{dev:1}]],
        mWs:[[4,3,12,-3,5.5,{}]]},
];

export const DETACHMENTS = [
    // Faction Pack v1.2: Storm of Darkness / Imperious Advance stratagem wording updated, no calc effect.
    {id:"tl_ck",  name:"Traitoris Lance",                   dp:2, affects:null},
    // Faction Pack v1.2: Claimed for the Dark Gods stratagem timing + Mirror of Fates enhancement wording
    // updated, no calc effect. Malefic Surge rule reworded to a reactive per-attack defensive choice
    // (5+ invuln OR FNP6+ when targeted) - not modeled (static inv/fnp fields can't represent a
    // reactive per-attack choice).
    {id:"lod",    name:"Lords of Dread",                     dp:2, affects:null},
    {id:"il",     name:"Infernal Lance (Diabolic Power)",    dp:3, options:[
        {key:"il_let", label:"Lethal Hits",      affects:{all:true, letg:true}},
        {key:"il_sh1", label:"Sustained Hits 1", affects:{all:true, sh1g:true}},
    ]},
    // MFM v1.3: UNIQUE tag removed (rules-shape change, no calc effect - not modeled here)
    {id:"hpl",    name:"Houndpack Lance (Marked Prey)",      dp:2,
        affects:{uids:["brigand","exec","huntsman","karnivore","stalker","moirax"], sh1g:true}},
    // Faction Pack v1.2 full rewrite - Masters of the Pack: a Titanic unit's own War Dog-affecting
    // Aura also affects itself when 2+ friendly War Dog models are in that aura's range (conditional
    // on positioning + having a War Dog aura, not modeled). Merciless Fusillade stratagem grants
    // SUSTAINED HITS 1 to a Titanic unit + up to 2 War Dog units all targeting the same enemy for a
    // phase - modeled below as an always-on stratagem per house convention (see Sanctic Spearhead in
    // greyknights.js): assumes CP is always available to use it.
    {id:"hhl",    name:"Helhunt Lance (Masters of the Pack)", dp:2, affects:null,
        stratagems:[
            {key:"merciless_fusillade", name:"Merciless Fusillade", cp:1,
                desc:"SUSTAINED HITS 1 for a Titanic unit + up to 2 War Dog units, all focused on one target (assume available when it matters)",
                affects:{all:true, sh1g:true}},
        ]},
    // Faction Pack v1.2 full rewrite - Annihilate the Unworthy: friendly KNIGHT TYRANT attacks vs a
    // battle-shocked unit get +1 to hit (conditional on enemy battle-shock state, not modeled).
    {id:"bot",    name:"Bastions of Tyranny (Annihilate the Unworthy)", dp:1, affects:null},
    // Faction Pack v1.2 full rewrite - Scenting Fear: once/round, mark a visible enemy unit within 12"
    // of a War Dog for +6" detection range (utility, not a damage/to-hit buff - not modeled).
    // MFM v1.3: UNIQUE tag removed (rules-shape change, no calc effect - not modeled here)
    {id:"hw",     name:"Hunting Warpack (Scenting Fear)",    dp:1, affects:null},
    // Faction Pack v1.2 full rewrite - Wretched Thralls: lets you include CSM DAMNED units (≤500pts)
    // that re-roll Leadership - an army-composition rule, out of scope for this per-unit calc tool.
    {id:"icf",    name:"Iconoclast Fiefdom (Wretched Thralls)", dp:1, affects:null},
];

export const UC = {
    abom:      "#dc2626",
    desc:      "#b91c1c",
    desp:      "#92400e",
    ramp:      "#991b1b",
    ruin:      "#7c3aed",
    tyrant:    "#1d4ed8",
    ach:       "#b45309",
    atra:      "#064e3b",
    casti:     "#1e40af",
    lanc:      "#6d28d9",
    mag:       "#be185d",
    sty:       "#0f766e",
    aster:     "#7f1d1d",
    porf:      "#312e81",
    brigand:   "#78350f",
    exec:      "#065f46",
    huntsman:  "#1e3a8a",
    karnivore: "#7c2d12",
    stalker:   "#374151",
    moirax:    "#4c1d95",
};
