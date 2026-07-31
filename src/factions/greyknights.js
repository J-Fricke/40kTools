// ─── FACTION: GREY KNIGHTS ────────────────────────────────────────────────────
// Army rule: Gate of Infinity (deep strike redeployment) — positional, no calc effect.
// Psychic weapons treated as standard for damage calc purposes.
// Force Edge (BTS only): +1 AP on melee vs non-MON/VEH → hard-coded AP-3 on BTS melee rows.
// Attuned Onslaught (Paladins): +1D after charge → separate "charged" rows with D3.
// Sanctity of Purpose (Purifiers): rrw1 on all attacks → encoded on all weapon tags.
// Storm bolters at 4 shots/model (Rapid Fire 2 at engagement range).
// D averages: D6=3.5, D6+1=4.5, D3=2, D3+1=2.5.

export const CHARS = {
    none:  {name:"None",                  pts:0,   W:0, sv:7, inv:null, fnp:null, sWs:null,  mWs:null, buffs:{}, validFor:"all"},
    bc:    {name:"Brother-Captain",       pts:95,  W:6, sv:2, inv:4,   fnp:null,
        sWs:[[4,2,4,0,1,{}]],
        mWs:[[4,2,6,-2,2,{}]],
        buffs:{let:1}, validFor:["bts","pal"]},      // Hammerhand: unit melee gains Lethal Hits
    champ: {name:"Brotherhood Champion", pts:70,  W:4, sv:2, inv:4,   fnp:null,
        sWs:[[4,2,4,0,1,{}]],
        mWs:[[5,2,6,-2,2,{}]],                        // Nemesis force weapon [PRECISION]
        buffs:{}, validFor:["ss","purg"]},
    chap:  {name:"Brotherhood Chaplain", pts:65,  W:5, sv:2, inv:4,   fnp:null,
        sWs:[[4,3,4,0,1,{}]],                         // storm bolter (3+ BS)
        mWs:[[5,2,6,-1,2,{}]],                        // Crozius arcanum
        buffs:{}, validFor:["bts","pal"]},
    lib:   {name:"Brotherhood Librarian",pts:100, W:5, sv:2, inv:4,   fnp:null,
        sWs:[[6.5,3,8,-2,2,{}]],                      // Vortex of Doom [BLAST]: D6+3=6.5 avg shots
        mWs:[[4,2,6,-1,2,{}]],                        // Nemesis force weapon (AP-1 for Librarian)
        buffs:{unitFnp:6}, validFor:["bts","pal"]},  // Sanctic Hood: FNP4+ vs psychic (approx FNP6+)
    tech:  {name:"Brotherhood Techmarine",pts:70, W:4, sv:2, inv:null, fnp:null,
        sWs:[[3,2,5,-1,2,{}]],                        // forge bolter
        mWs:[[4,3,6,-2,2,{}],[1,3,8,-2,2,{}]],        // Omnissian axe + servo-arm (D3=2 avg)
        buffs:{}, validFor:["ss","purg","pur"]},
    crowe: {name:"Castellan Crowe",      pts:100, W:5, sv:2, inv:4,   fnp:null,
        sWs:[[3,2,4,-2,1,{ai:1}],[4,2,4,0,1,{}]],    // Purifying Flame (ai:ANTI-INF 2+) + storm bolter
        mWs:[[5,2,6,-2,2,{dev:1}]],                   // Black Blade of Antwyr [DEVASTATING WOUNDS]
        buffs:{}, validFor:["pur"]},                  // also grants +1A to unit PF (hard to model)
    gm:    {name:"Grand Master",         pts:95,  W:7, sv:2, inv:4,   fnp:null,
        sWs:[[4,2,4,0,1,{}]],
        mWs:[[5,2,6,-2,2,{}]],
        buffs:{}, validFor:["bts","pal"]},             // Might of Titan: once/battle +3A+3S (not modeled)
    voldus:{name:"Grand Master Voldus",  pts:140, W:7, sv:2, inv:4,   fnp:null,
        sWs:[[2.5,2,12,-2,2,{dev:1}],[4,2,4,0,1,{}]],// Searing Purity D3+1=2.5 avg [DEV] + storm bolter
        mWs:[[5,2,10,-2,3,{}]],                       // Malleus Argyrum
        buffs:{}, validFor:["bts","pal"]},             // Sanctuary: -1 hit vs unit (durability, not modeled)
};

export const UNITS = [
    // ── Brotherhood Terminator Squad ────────────────────────────────────────────
    // Force Edge: AP-3 on melee vs non-MON/VEH (hard-coded; AP-2 base vs MON/VEH)
    {id:"bts5",  uid:"bts", unit:"Brotherhood Terminator Squad", pts:175, pts10:185, m:5,  W:3, sv:2, inv:4, fnp:null,
        label:"5m storm bolter / NF weapon (Force Edge AP-3)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[20,3,6,-3,2,{}]]},
    {id:"bts10", uid:"bts", unit:"Brotherhood Terminator Squad", pts:385, pts10:375, m:10, W:3, sv:2, inv:4, fnp:null,
        label:"10m storm bolter / NF weapon (Force Edge AP-3)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[40,3,6,-3,2,{}]]},

    // ── Strike Squad ────────────────────────────────────────────────────────────
    {id:"ss5",   uid:"ss",  unit:"Strike Squad", pts:120, pts10:120, m:5,  W:2, sv:2, inv:null, fnp:null,
        label:"5m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"ss10",  uid:"ss",  unit:"Strike Squad", pts:240, pts10:240, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[30,3,6,-2,2,{}]]},

    // ── Paladin Squad (2+ BS/WS, Terminator) ────────────────────────────────────
    // Attuned Onslaught: +1D after charge → "charged" rows use D3 instead of D2
    {id:"pal5",  uid:"pal", unit:"Paladin Squad", pts:230, pts10:225, m:5,  W:3, sv:2, inv:4, fnp:null,
        label:"5m storm bolter / NF weapon (base D2)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[20,2,4,0,1,{}]],
        mWs:[[20,2,6,-2,2,{}]]},
    {id:"pal5c", uid:"pal", unit:"Paladin Squad", pts:230, pts10:225, m:5,  W:3, sv:2, inv:4, fnp:null,
        label:"5m charged: Attuned Onslaught (D2→D3)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[20,2,4,0,1,{}]],
        mWs:[[20,2,6,-2,3,{}]]},                     // +1D after charge: D2→D3 fixed
    {id:"pal10", uid:"pal", unit:"Paladin Squad", pts:465, pts10:450, m:10, W:3, sv:2, inv:4, fnp:null,
        label:"10m storm bolter / NF weapon (base D2)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[40,2,4,0,1,{}]],
        mWs:[[40,2,6,-2,2,{}]]},

    // ── Interceptor Squad (FLY, M12", no characters) ───────────────────────────
    {id:"int5",  uid:"int", unit:"Interceptor Squad", pts:135, pts10:125, m:5,  W:2, sv:2, inv:null, fnp:null,
        label:"5m storm bolter / NF weapon",
        chars:["none"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"int10", uid:"int", unit:"Interceptor Squad", pts:260, pts10:250, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m storm bolter / NF weapon",
        chars:["none"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[30,3,6,-2,2,{}]]},

    // ── Purgation Squad ─────────────────────────────────────────────────────────
    {id:"purg5",  uid:"purg", unit:"Purgation Squad", pts:120, pts10:115, m:5,  W:2, sv:2, inv:null, fnp:null,
        label:"5m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"purg5p", uid:"purg", unit:"Purgation Squad", pts:140, pts10:135, m:5,  W:2, sv:2, inv:null, fnp:null,
        label:"5m 4× psycannon (3 shots, S8 AP-1 D2)",
        chars:["none","champ","tech"],
        sWs:[[12,3,8,-1,2,{}],[4,3,4,0,1,{}]],       // 4 psycannons + 1 storm bolter
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"purg10", uid:"purg", unit:"Purgation Squad", pts:220, pts10:220, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[30,3,6,-2,2,{}]]},

    // ── Purifier Squad (Sanctity of Purpose: rrw1 on all attacks) ───────────────
    // Purifying Flame [ANTI-INFANTRY 2+, IGNORES COVER]: 1 shot/model → ai:1 tag
    {id:"pur5",  uid:"pur", unit:"Purifier Squad", pts:140, pts10:125, m:5,  W:2, sv:2, inv:null, fnp:null,
        label:"5m Purifying Flame + storm bolter (rrw1)",
        chars:["none","tech","crowe"],
        sWs:[[5,3,4,-2,1,{ai:1,rrw1:1}],[20,3,4,0,1,{rrw1:1}]],
        mWs:[[15,3,6,-2,2,{rrw1:1}]]},
    {id:"pur10", uid:"pur", unit:"Purifier Squad", pts:270, pts10:250, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m Purifying Flame + storm bolter (rrw1)",
        chars:["none","tech","crowe"],
        sWs:[[10,3,4,-2,1,{ai:1,rrw1:1}],[40,3,4,0,1,{rrw1:1}]],
        mWs:[[30,3,6,-2,2,{rrw1:1}]]},

    // ── Nemesis Dreadknight (Vehicle, Walker, no characters) ────────────────────
    // Indomitable Spirit: shoot+charge after advancing/falling back (positional, no calc effect)
    {id:"ndk_ps", uid:"ndk", unit:"Nemesis Dreadknight", pts:195, pts10:210, m:1, W:13, sv:2, inv:4, fnp:null,
        label:"heavy psycannon + greatsword",
        chars:["none"],
        sWs:[[6,3,10,-2,3,{}]],                       // heavy psycannon [PSYCHIC]
        mWs:[[5,2,10,-2,3.5,{}],[10,2,5,-1,1,{}]]},  // greatsword strike (D6=3.5) + sweep
    {id:"ndk_gi", uid:"ndk", unit:"Nemesis Dreadknight", pts:195, pts10:210, m:1, W:13, sv:2, inv:4, fnp:null,
        label:"gatling psilencer + greatsword",
        chars:["none"],
        sWs:[[12,3,6,0,1,{sh1:1}]],                  // gatling psilencer [PSYCHIC, SH1]
        mWs:[[5,2,10,-2,3.5,{}],[10,2,5,-1,1,{}]]},

    // ── Grand Master in Nemesis Dreadknight ────────────────────────────────────
    // Surge of Wrath vs MON/VEH: re-roll hit, wound AND damage (rrwf partially models wound re-rolls)
    // "vs MON/VEH" rows note: hit+damage re-rolls not modeled, rrwf is wound only
    {id:"gmndk_s",uid:"gmndk",unit:"Grand Master in NDK", pts:215, pts10:225, m:1, W:13, sv:2, inv:4, fnp:null,
        label:"heavy psycannon + greatsword (standard)",
        chars:["none"],
        sWs:[[6,3,10,-2,3,{}]],
        mWs:[[5,2,10,-2,3.5,{}],[10,2,5,-1,1,{}]]},
    {id:"gmndk_v",uid:"gmndk",unit:"Grand Master in NDK", pts:215, pts10:225, m:1, W:13, sv:2, inv:4, fnp:null,
        label:"vs MON/VEH: Surge of Wrath (rrwf wound; hit+dmg rerolls not modeled)",
        chars:["none"],
        sWs:[[6,3,10,-2,3,{rrwf:1}]],
        mWs:[[5,2,10,-2,3.5,{rrwf:1}],[10,2,5,-1,1,{rrwf:1}]]},
    {id:"gmndk_h",uid:"gmndk",unit:"Grand Master in NDK", pts:215, pts10:225, m:1, W:13, sv:2, inv:4, fnp:null,
        label:"daemon greathammer (anti-vehicle/fortification)",
        chars:["none"],
        sWs:[[6,3,10,-2,3,{}]],
        mWs:[[5,3,14,-3,4.5,{}]]},                   // Nemesis daemon greathammer (D6+1=4.5)

    // ── Venerable Dreadnought (Vehicle, Walker, Character) ───────────────────────
    // Guidance of the Ancients: +1 hit for all GK vs chosen target (army-wide aura, not modeled)
    {id:"vd",    uid:"vd",  unit:"Venerable Dreadnought", pts:130, pts10:140, m:1, W:8, sv:2, inv:null, fnp:null,
        label:"assault cannon [DEV] + DCW",
        chars:["none"],
        sWs:[[6,3,6,0,1,{dev:1}]],                   // assault cannon [DEVASTATING WOUNDS]
        mWs:[[5,3,12,-2,3,{}]]},                      // dreadnought combat weapon

    // ── Stormraven Gunship (Vehicle, Transport, M14") ────────────────────────────
    // Armoured Resilience: -1 damage per attack (not modeled — significant for durability)
    // 11th ed: M changed to 14", AIRCRAFT keyword removed → can be charged
    // Default: 2× stormstrike + twin assault cannon [DEV+TL] + typhoon
    {id:"sr_ac", uid:"sr",  unit:"Stormraven Gunship", pts:280, pts10:280, m:1, W:14, sv:3, inv:null, fnp:null,
        label:"twin assault cannon [DEV+TL] + typhoon krak + 2× stormstrike",
        chars:["none"],
        sWs:[[6,3,6,0,1,{dev:1,tl:1}],[2,3,9,-2,3.5,{}],[2,3,10,-3,5.5,{}]],
        mWs:[[6,4,8,0,1,{}]]},
    {id:"sr_lc", uid:"sr",  unit:"Stormraven Gunship", pts:280, pts10:280, m:1, W:14, sv:3, inv:null, fnp:null,
        label:"twin lascannon [TL] + twin multi-melta [TL, melta rng] + 2× stormstrike",
        chars:["none"],
        sWs:[[1,3,12,-3,4.5,{tl:1}],[2,3,9,-4,5.5,{tl:1}],[2,3,10,-3,5.5,{}]],
        mWs:[[6,4,8,0,1,{}]]},
];

export const DETACHMENTS = [
    // ── 10th Edition Codex Detachments ──────────────────────────────────────────
    {id:"bs",   dp:2, name:"Brotherhood Strike",     disp:"Purge the Foe",
        desc:"Fury of Titan: After deep striking, until end of turn re-roll hit 1s AND wound 1s. Approx: bhBonus:1 + rrw1 for all units.",
        affects:{all:true, bhBonus:1, rrw1:true}},
    {id:"hc",   dp:1, name:"Hallowed Conclave",      disp:"Priority Assets",
        desc:"Duty Before All: TERMINATOR units can shoot and declare charges in turns they Fell Back.",
        affects:null},
    {id:"ban",  dp:2, name:"Banishers",              disp:"Purge the Foe",
        desc:"Channelled Force: Each Fight phase choose — psychic melee weapons gain SH1 OR Lethal Hits (Leadership test required, ~72% pass).",
        options:[
            {key:"sh1m", label:"SH1 psychic melee",   affects:{all:true, sh1m:true}},
            {key:"letm", label:"Lethal psychic melee", affects:{all:true, letm:true}},
        ]},
    {id:"ssp",  dp:1, name:"Sanctic Spearhead",      disp:"Purge the Foe",
        desc:"Mailed Fist: VEHICLE units advancing gain +6\" move and ranged weapons get ASSAULT until end of turn.",
        affects:null},
    {id:"aug",  dp:1, name:"Augurium Task Force",    disp:"Recon",
        desc:"Prescient Redeployment: Gate of Infinity redeployment at start of Movement phase. Positional only.",
        affects:null},
    // ── Faction Pack 11th Edition Detachments ────────────────────────────────────
    {id:"wbt",  dp:2, name:"Warpbane Task Force",    disp:"Take and Hold",
        desc:"Hallowed Ground: All GK re-roll hit 1s. Purifiers or any unit in HG zone get full hit re-rolls (approx same at 3+ skill). Strat SANCTIFIED KILL ZONE adds rrw1 while wholly in HG.",
        affects:{all:true, bhBonus:1}},
    {id:"aa",   dp:1, name:"Argent Assault",          disp:"Priority Assets",
        desc:"Dauntless Champions: PALADIN SQUAD attacks +1 to wound when attack S < target T. Modeled as wBonus:1 (conditional — more accurate when S < T).",
        affects:{uids:["pal"], wBonus:1}},
    {id:"fop",  dp:1, name:"Fires of Purgation",      disp:"Purge the Foe",
        desc:"Searing Soulflame: Units pinned by Purgation Squad take battle-shock with -1 modifier. Enhancements: Precognicient Volleys (snap shots 5+), Boons of Deimos (+2S ranged).",
        affects:null},
    {id:"ii",   dp:1, name:"Immaterial Interdiction", disp:"Recon",
        desc:"Echojump: After shooting, Interceptor Squad can make D6+1\" surge move. Enhancements: Predestined Coordinates (ingress turn 1), Astral Overlap (Stealth).",
        affects:null},
];

export const UC = {
    bts:"#94a3b8", ss:"#60a5fa",  pal:"#fbbf24", int:"#c084fc",
    purg:"#34d399", pur:"#22d3ee", ndk:"#f87171", gmndk:"#fb923c",
    vd:"#a78bfa",  sr:"#2dd4bf",
};
