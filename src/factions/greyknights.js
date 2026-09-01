// ─── FACTION: GREY KNIGHTS ────────────────────────────────────────────────────
// Last updated: Faction Pack v1.1 (legal 2026-08-03); MFM v1.3 (legal 2026-08-26)
// Acronym: GMND (Grand Master Nemesis Dreadknight — K is part of Dreadknight)
// Army rule: Gate of Infinity (deep strike redeployment) — positional, no calc effect.
// Psychic weapons treated as standard for damage calc purposes.
// Force Edge (BTS only): +1 AP on melee vs non-MON/VEH → hard-coded AP-3 on BTS melee rows.
// Attuned Onslaught (Paladins): +1D after charge → separate "charged" rows with D3.
// Sanctity of Purpose (Purifiers): rrw1 on all attacks → encoded on all weapon tags.
// Storm bolters at 4 shots/model (Rapid Fire 2 at engagement range).
// pts = 1st–2nd unit cost (MFM tiered); 3rd+ costs noted in comments.
// D averages: D6=3.5, D6+1=4.5, D3=2, D3+1=2.5.

export const CHARS = {
    none:  {name:"None",                   pts:0,   W:0, sv:7, inv:null, fnp:null, sWs:null,  mWs:null, buffs:{}, validFor:"all"},
    bc:    {name:"Brother-Captain",        pts:95,  W:6, sv:2, inv:4,   fnp:null,
        sWs:[[4,2,4,0,1,{}]],
        mWs:[[4,2,6,-2,2,{}]],
        buffs:{let:1}, validFor:["bts","pal"]},
    champ: {name:"Brotherhood Champion",  pts:70,  W:4, sv:2, inv:4,   fnp:null,
        sWs:[[4,2,4,0,1,{}]],
        mWs:[[5,2,6,-2,2,{}]],
        buffs:{}, validFor:["ss","purg"]},
    chap:  {name:"Brotherhood Chaplain",  pts:65,  W:5, sv:2, inv:4,   fnp:null,
        sWs:[[4,3,4,0,1,{}]],
        mWs:[[5,2,6,-1,2,{}]],
        buffs:{}, validFor:["bts","pal"]},
    lib:   {name:"Brotherhood Librarian", pts:90,  W:5, sv:2, inv:4,   fnp:null, // 2nd+ unit: 100pts
        sWs:[[6.5,3,8,-2,2,{}]],
        mWs:[[4,2,6,-1,2,{}]],
        buffs:{unitFnp:6}, validFor:["bts","pal"]},
    tech:  {name:"Brotherhood Techmarine",pts:70,  W:4, sv:2, inv:null, fnp:null,
        sWs:[[3,2,5,-1,2,{}]],
        mWs:[[4,3,6,-2,2,{}],[1,3,8,-2,2,{}]],
        buffs:{}, validFor:["ss","purg","pur"]},
    crowe: {name:"Castellan Crowe",       pts:100, W:5, sv:2, inv:4,   fnp:null,
        sWs:[[3,2,4,-2,1,{ai:1}],[4,2,4,0,1,{}]],
        mWs:[[5,2,6,-2,2,{dev:1}]],
        // Champion of the Order of Purifiers: +1A to Purifying Flame (tag ai) for every model in the unit
        buffs:{pfBonus:1}, validFor:["pur"]},
    gm:    {name:"Grand Master",          pts:95,  W:7, sv:2, inv:4,   fnp:null,
        sWs:[[4,2,4,0,1,{}]],
        mWs:[[5,2,6,-2,2,{}]],
        buffs:{}, validFor:["bts","pal"]},
    voldus:{name:"Grand Master Voldus",   pts:125, W:7, sv:2, inv:4,   fnp:null, // MFM: ▼-15pts
        sWs:[[2.5,2,12,-2,2,{dev:1}],[4,2,4,0,1,{}]],
        mWs:[[5,2,10,-2,3,{}]],
        buffs:{}, validFor:["bts","pal"]},
};

export const UNITS = [
    // ── Brotherhood Terminator Squad ────────────────────────────────────────────
    // Force Edge: AP-3 melee vs non-MON/VEH. No 1st/2nd/3rd+ tiering for this unit (unlike Paladin Squad).
    // MFM v1.1 size breaks: 4m=140, 5m=175, 8m=300, 10m=360 (▼-15).
    // Psycannons: +5pts each (up to 4 per squad, UPDATED requisition removed).
    {id:"bts4",  uid:"bts", unit:"Brotherhood Terminator Squad", pts:140, m:4,  W:3, sv:2, inv:4, fnp:null, hidden:true,
        label:"4m storm bolter / NF weapon (Force Edge AP-3, AP-2 vs MON/VEH)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[16,3,4,0,1,{}]],
        mWs:[[16,3,6,-3,2,{fe:1}]]},
    {id:"bts5",  uid:"bts", unit:"Brotherhood Terminator Squad", pts:175, m:5,  W:3, sv:2, inv:4, fnp:null, hidden:true,
        label:"5m storm bolter / NF weapon (Force Edge AP-3, AP-2 vs MON/VEH)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[20,3,6,-3,2,{fe:1}]]},
    {id:"bts8",  uid:"bts", unit:"Brotherhood Terminator Squad", pts:300, m:8,  W:3, sv:2, inv:4, fnp:null,
        label:"8m storm bolter / NF weapon (Force Edge AP-3, AP-2 vs MON/VEH)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[32,3,4,0,1,{}]],
        mWs:[[32,3,6,-3,2,{fe:1}]]},
    {id:"bts10", uid:"bts", unit:"Brotherhood Terminator Squad", pts:360, m:10, W:3, sv:2, inv:4, fnp:null,
        label:"10m storm bolter / NF weapon (Force Edge AP-3, AP-2 vs MON/VEH)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[40,3,6,-3,2,{fe:1}]]},

    // ── Strike Squad ────────────────────────────────────────────────────────────
    // MFM: 5m ▼-5pts → 115, 10m ▼-10pts → 230.
    // Per 5m: 1 can swap storm bolter + NFW for psycannon + CCW (free). CCW: 3A WS3+ S4 AP0 D1.
    {id:"ss5",   uid:"ss",  unit:"Strike Squad", pts:115, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true,
        label:"5m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"ss5p",  uid:"ss",  unit:"Strike Squad", pts:115, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true,
        label:"5m 1× psycannon (S8 AP-1 D2 3sh) + 4× storm bolter",
        chars:["none","champ","tech"],
        sWs:[[16,3,4,0,1,{}],[3,3,8,-1,2,{}]],
        mWs:[[12,3,6,-2,2,{}],[3,3,4,0,1,{}]]},
    {id:"ss10",  uid:"ss",  unit:"Strike Squad", pts:230, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[30,3,6,-2,2,{}]]},
    {id:"ss10p", uid:"ss",  unit:"Strike Squad", pts:230, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m 2× psycannon (S8 AP-1 D2 3sh) + 8× storm bolter",
        chars:["none","champ","tech"],
        sWs:[[32,3,4,0,1,{}],[6,3,8,-1,2,{}]],
        mWs:[[24,3,6,-2,2,{}],[6,3,4,0,1,{}]]},

    // ── Paladin Squad (2+ BS/WS, Terminator) ────────────────────────────────────
    // Attuned Onslaught: +1D after charge → "charged" rows use D3.
    // MFM v1.3 1st-2nd size breaks: 4m=170, 5m=215, 8m=360, 10m=460 (▲+10). 3rd+: 4m=210 (▲+25), 5m=255 (▲+25), 8m=400 (▲+25), 10m=500 (▲+35).
    // +5pts per psycannon (not modeled in base rows).
    {id:"pal4",  uid:"pal", unit:"Paladin Squad", pts:170, m:4,  W:3, sv:2, inv:4, fnp:null, hidden:true,
        label:"4m storm bolter / NF weapon (base D2)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[16,2,4,0,1,{}]],
        mWs:[[16,2,6,-2,2,{}]]},
    {id:"pal4c", uid:"pal", unit:"Paladin Squad", pts:170, m:4,  W:3, sv:2, inv:4, fnp:null, hidden:true,
        label:"4m charged: Attuned Onslaught (D2→D3)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[16,2,4,0,1,{}]],
        mWs:[[16,2,6,-2,3,{}]]},
    {id:"pal5",  uid:"pal", unit:"Paladin Squad", pts:215, m:5,  W:3, sv:2, inv:4, fnp:null, hidden:true,
        label:"5m storm bolter / NF weapon (base D2)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[20,2,4,0,1,{}]],
        mWs:[[20,2,6,-2,2,{}]]},
    {id:"pal5c", uid:"pal", unit:"Paladin Squad", pts:215, m:5,  W:3, sv:2, inv:4, fnp:null, hidden:true,
        label:"5m charged: Attuned Onslaught (D2→D3)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[20,2,4,0,1,{}]],
        mWs:[[20,2,6,-2,3,{}]]},
    {id:"pal8",  uid:"pal", unit:"Paladin Squad", pts:360, m:8,  W:3, sv:2, inv:4, fnp:null,
        label:"8m storm bolter / NF weapon (base D2)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[32,2,4,0,1,{}]],
        mWs:[[32,2,6,-2,2,{}]]},
    {id:"pal8c", uid:"pal", unit:"Paladin Squad", pts:360, m:8,  W:3, sv:2, inv:4, fnp:null,
        label:"8m charged: Attuned Onslaught (D2→D3)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[32,2,4,0,1,{}]],
        mWs:[[32,2,6,-2,3,{}]]},
    {id:"pal10", uid:"pal", unit:"Paladin Squad", pts:460, m:10, W:3, sv:2, inv:4, fnp:null, // MFM v1.3: ▲+10
        label:"10m storm bolter / NF weapon (base D2)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[40,2,4,0,1,{}]],
        mWs:[[40,2,6,-2,2,{}]]},
    {id:"pal10c", uid:"pal", unit:"Paladin Squad", pts:460, m:10, W:3, sv:2, inv:4, fnp:null, // MFM v1.3: ▲+10
        label:"10m charged: Attuned Onslaught (D2→D3)",
        chars:["none","bc","chap","lib","gm","voldus"],
        sWs:[[40,2,4,0,1,{}]],
        mWs:[[40,2,6,-2,3,{}]]},

    // ── Interceptor Squad (FLY, M12", no characters) ───────────────────────────
    // 1st-2nd: 5m=125, 10m=250. 3rd+: 5m=135, 10m=260.
    // Per 5m: 1 can swap storm bolter + NFW for psycannon/psilencer/incinerator + CCW (free). CCW: 3A WS3+ S4 AP0 D1.
    {id:"int5",  uid:"int", unit:"Interceptor Squad", pts:125, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true,
        label:"5m storm bolter / NF weapon",
        chars:["none"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"int5p", uid:"int", unit:"Interceptor Squad", pts:125, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true,
        label:"5m 1× psycannon (S8 AP-1 D2 3sh) + 4× storm bolter",
        chars:["none"],
        sWs:[[16,3,4,0,1,{}],[3,3,8,-1,2,{}]],
        mWs:[[12,3,6,-2,2,{}],[3,3,4,0,1,{}]]},
    {id:"int10", uid:"int", unit:"Interceptor Squad", pts:250, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m storm bolter / NF weapon",
        chars:["none"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[30,3,6,-2,2,{}]]},
    {id:"int10p",uid:"int", unit:"Interceptor Squad", pts:250, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m 2× psycannon (S8 AP-1 D2 3sh) + 8× storm bolter",
        chars:["none"],
        sWs:[[32,3,4,0,1,{}],[6,3,8,-1,2,{}]],
        mWs:[[24,3,6,-2,2,{}],[6,3,4,0,1,{}]]},

    // ── Purgation Squad ─────────────────────────────────────────────────────────
    // MFM v1.3: 1st-2nd: 5m=105 (▼-5), 10m=210 (▼-10). 3rd+: 5m=115 (▼-5), 10m=220 (▼-10). +5pts per psycannon (4 max = +20).
    {id:"purg5",  uid:"purg", unit:"Purgation Squad", pts:105, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true,
        label:"5m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[20,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"purg5p", uid:"purg", unit:"Purgation Squad", pts:125, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true, // 105 + 4×5pts psycannon
        label:"5m 4× psycannon (S8 AP-1 D2, 3 shots each)",
        chars:["none","champ","tech"],
        sWs:[[12,3,8,-1,2,{}],[4,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"purg5sl", uid:"purg", unit:"Purgation Squad", pts:105, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true, // free upgrade
        label:"5m 4× psilencer (S5 AP0 D1 SH1)",
        chars:["none","champ","tech"],
        sWs:[[24,3,5,0,1,{sustained:1}],[4,3,4,0,1,{}]],
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"purg5i",  uid:"purg", unit:"Purgation Squad", pts:105, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true, // free upgrade
        label:"5m 4× incinerator (torrent S6 AP-1 D1, 12\")",
        chars:["none","champ","tech"],
        sWs:[[16.8,2,6,-1,1,{}],[4,3,4,0,1,{}]],                // 4×D6(3.5)×6/5 torrent correction
        mWs:[[15,3,6,-2,2,{}]]},
    {id:"purg10", uid:"purg", unit:"Purgation Squad", pts:210, m:10, W:2, sv:2, inv:null, fnp:null, hidden:true,
        label:"10m storm bolter / NF weapon",
        chars:["none","champ","tech"],
        sWs:[[40,3,4,0,1,{}]],
        mWs:[[30,3,6,-2,2,{}]]},

    // ── Purifier Squad (Sanctity of Purpose: rrw1 on all attacks) ───────────────
    // Purifying Flame [ANTI-INFANTRY 2+, IGNORES COVER]: 1 shot/model.
    // 1st-2nd: 5m=130, 10m=260. 3rd+: 5m=140, 10m=270. MFM v1.3: per-Psycannon wargear cost removed (was +5pts, now free) - not separately modeled here (no psycannon loadout SKU exists for this unit).
    {id:"pur5",  uid:"pur", unit:"Purifier Squad", pts:130, m:5,  W:2, sv:2, inv:null, fnp:null, hidden:true,
        label:"5m Purifying Flame + storm bolter (rrw1)",
        chars:["none","tech","crowe"],
        sWs:[[5,3,4,-2,1,{ai:1,rrw1:1}],[20,3,4,0,1,{rrw1:1}]],
        mWs:[[15,3,6,-2,2,{rrw1:1}]]},
    {id:"pur10", uid:"pur", unit:"Purifier Squad", pts:260, m:10, W:2, sv:2, inv:null, fnp:null,
        label:"10m Purifying Flame + storm bolter (rrw1)",
        chars:["none","tech","crowe"],
        sWs:[[10,3,4,-2,1,{ai:1,rrw1:1}],[40,3,4,0,1,{rrw1:1}]],
        mWs:[[30,3,6,-2,2,{rrw1:1}]]},

    // ── Nemesis Dreadknight (Vehicle, Walker) ────────────────────────────────────
    // Indomitable Spirit: shoot+charge after advancing/falling back — positional, no calc effect.
    // Ranged: pick 2 (no duplicates) from {psilencer(free), incinerator(free),
    // heavy psycannon(+15pts)} - no sublimator option, that's GMND-only. A
    // single ranged weapon is never worth taking over a pair (same points or
    // +15 either way), so only the 3 pairs are modeled, not the 3 singles.
    // Melee wargear (free swap from base dreadfists): greatsword(GS, 2+ WS,
    // dual strike/sweep profile) or greathammer(GH, 3+ WS but much higher
    // S/AP/D) - no mace/flail option for plain NDK, those are GMND-only.
    // Note: GH actually outdamages GS per point across every target tested
    // here despite the worse WS, even with no Surge of Wrath (NDK doesn't
    // have that ability) - both shown by default, not just GS.
    // 1st-2nd/3rd+ pts: psl+inc 195/210, psl+hpc & inc+hpc 210/225.
    {id:"ndk_pi_gs",  uid:"ndk", unit:"Nemesis Dreadknight", pts:195, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=210
        label:"psl+inc+GS",
        chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1}],[7,1,6,-1,1,{}]],
        mWs:[[5,2,10,-2,3.5,{}],[10,2,5,-1,1,{}]]},
    {id:"ndk_pi_gh",  uid:"ndk", unit:"Nemesis Dreadknight", pts:195, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=210
        label:"psl+inc+GH",
        chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1}],[7,1,6,-1,1,{}]],
        mWs:[[5,3,14,-3,4.5,{}]]},
    {id:"ndk_ph_gs",  uid:"ndk", unit:"Nemesis Dreadknight", pts:210, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=225
        label:"psl+hpc+GS",
        chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1}],[6,3,10,-2,3,{}]],
        mWs:[[5,2,10,-2,3.5,{}],[10,2,5,-1,1,{}]]},
    {id:"ndk_ph_gh",  uid:"ndk", unit:"Nemesis Dreadknight", pts:210, m:1, W:13, sv:2, inv:4, fnp:null, // 3rd+=225
        label:"psl+hpc+GH",
        chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1}],[6,3,10,-2,3,{}]],
        mWs:[[5,3,14,-3,4.5,{}]]},
    {id:"ndk_ih_gs",  uid:"ndk", unit:"Nemesis Dreadknight", pts:210, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=225
        label:"inc+hpc+GS",
        chars:["none"],
        sWs:[[7,1,6,-1,1,{}],[6,3,10,-2,3,{}]],
        mWs:[[5,2,10,-2,3.5,{}],[10,2,5,-1,1,{}]]},
    {id:"ndk_ih_gh",  uid:"ndk", unit:"Nemesis Dreadknight", pts:210, m:1, W:13, sv:2, inv:4, fnp:null, // 3rd+=225
        label:"inc+hpc+GH",
        chars:["none"],
        sWs:[[7,1,6,-1,1,{}],[6,3,10,-2,3,{}]],
        mWs:[[5,3,14,-3,4.5,{}]]},

    // ── Grand Master in Nemesis Dreadknight (GMND) ──────────────────────────────
    // Surge of Wrath vs MON/VEH: re-roll hit + wound + damage (rrwf models wound only).
    // 1st-2nd: 200pts base. 3rd+: 215pts base. pts listed = base + wargear.
    // Ranged (up to 2, no duplicates): psilencer free, incinerator free, psycannon +15, sublimator +15.
    //   Gatling psilencer: 24" 12sh BS3+ S6 AP0 D1 SH1 (base model only).
    //   Heavy incinerator: [TORRENT] 12" 2D6 auto-hit S6 AP-1 D1; stored as avg 7sh skill=1.
    //   Heavy psycannon: 24" 6sh BS3+ S10 AP-2 D3. Sublimator: TL S9 AP-4 D6 melta4 at 18"; at 9" D=D6+4=7.5.
    // Melee: greatsword (strike 5A S10 AP-2 D6 / sweep 10A S5 AP-1 D1), greathammer (5A S14 AP-3 D6+1),
    //        nemesis flail (10A S5 AP-1 D2), nemesis mace (5A S6 AP-3 D3 anti-char 2+ precision).
    // ── Ranged loadouts: pick 2 (no duplicates) from {psilencer(free),
    // incinerator(free), heavy psycannon(+15pts), sublimator(+15pts)} - 6
    // combinations, 3 of which include sublimator and therefore also split
    // by engagement range (★ = within melta range, 9": sublimator deals
    // D6+4=7.5 avg instead of D6+1=3.5 avg). 9 distinct ranged loadouts
    // total, each paired with one of 4 melee weapons: H=Nemesis daemon
    // greathammer, SW=Nemesis greatsword, M=Nemesis mace, F=Nemesis flail.
    // 9 x 4 = 36 entries. H/SW shown by default; M/F hidden - toggle on to
    // compare.
    // sowf = Surge of Wrath: auto-applies rrwf (wound reroll) when target is VEH or MON.

    // psilencer + incinerator (200pts 1st-2nd, 215pts 3rd+) - base, no paid ranged weapon
    {id:"gmndk_pi_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:200, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=215
        label:"psl+inc+H", chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_pi_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:200, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=215
        label:"psl+inc+S", chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_pi_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:200, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=215
        label:"psl+inc+M", chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_pi_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:200, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=215
        label:"psl+inc+F", chars:["none"],
        sWs:[[12,3,6,0,1,{sustained:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // hpc + incinerator (215pts 1st-2nd, 230pts 3rd+)
    {id:"gmndk_hi_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+inc+H", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_hi_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+inc+S", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_hi_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+inc+M", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_hi_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+inc+F", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // hpc + psilencer (215pts 1st-2nd, 230pts 3rd+)
    {id:"gmndk_hp_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+psl+H", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_hp_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+psl+S", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_hp_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+psl+M", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_hp_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"hpc+psl+F", chars:["none"],
        sWs:[[6,3,10,-2,3,{sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // sub + incinerator, normal range (215pts 1st-2nd, 230pts 3rd+)
    {id:"gmndk_ui_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+inc+H", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_ui_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+inc+S", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_ui_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+inc+M", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_ui_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+inc+F", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // sub★ + incinerator, melta range (215pts 1st-2nd, 230pts 3rd+)
    {id:"gmndk_uix_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+inc+H", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_uix_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+inc+S", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_uix_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+inc+M", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_uix_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+inc+F", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[7,1,6,-1,1,{sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // sub + psilencer, normal range (215pts 1st-2nd, 230pts 3rd+)
    {id:"gmndk_up_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+psl+H", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_up_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+psl+S", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_up_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+psl+M", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_up_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub+psl+F", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // sub★ + psilencer, melta range (215pts 1st-2nd, 230pts 3rd+)
    {id:"gmndk_upx_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+psl+H", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_upx_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+psl+S", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_upx_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+psl+M", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_upx_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:215, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=230
        label:"sub★+psl+F", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[12,3,6,0,1,{sustained:1,sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // sub + hpc, normal range (230pts 1st-2nd, 245pts 3rd+)
    {id:"gmndk_uh_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, // 3rd+=245
        label:"sub+hpc+H", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_uh_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=245
        label:"sub+hpc+S", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_uh_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=245
        label:"sub+hpc+M", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_uh_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=245
        label:"sub+hpc+F", chars:["none"],
        sWs:[[2,3,9,-4,3.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // sub★ + hpc, melta range (230pts 1st-2nd, 245pts 3rd+)
    {id:"gmndk_uhx_h",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, // 3rd+=245
        label:"sub★+hpc+H", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[5,3,14,-3,4.5,{sowf:1}]]},
    {id:"gmndk_uhx_s", uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=245
        label:"sub★+hpc+S", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[5,2,10,-2,3.5,{sowf:1}],[10,2,5,-1,1,{sowf:1}]]},
    {id:"gmndk_uhx_m",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=245
        label:"sub★+hpc+M", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[5,2,6,-3,2,{sowf:1}]]},
    {id:"gmndk_uhx_f",  uid:"gmndk", unit:"Grand Master in Nemesis Dreadknight (GMND)", pts:230, m:1, W:13, sv:2, inv:4, fnp:null, hidden:true, // 3rd+=245
        label:"sub★+hpc+F", chars:["none"],
        sWs:[[2,3,9,-4,7.5,{tl:1,sowf:1}],[6,3,10,-2,3,{sowf:1}]],
        mWs:[[10,2,5,-1,2,{sowf:1}]]},

    // ── Venerable Dreadnought (Vehicle, Walker, Character) ───────────────────────
    // Guidance of the Ancients: +1 hit for all GK vs chosen target — not modeled.
    // 1st-2nd: 130pts. 3rd+: 140pts.
    {id:"vd",    uid:"vd",  unit:"Venerable Dreadnought", pts:130, m:1, W:8, sv:2, inv:null, fnp:null,
        label:"assault cannon [DEV] + heavy flamer + DCW",
        chars:["none"],
        sWs:[[6,3,6,0,1,{dev:1}],[3.5,1,5,-1,1,{}]],
        mWs:[[5,3,12,-2,3,{}]]},
    {id:"vd_sb", uid:"vd",  unit:"Venerable Dreadnought", pts:130, m:1, W:8, sv:2, inv:null, fnp:null, hidden:true,
        label:"assault cannon [DEV] + storm bolter + DCW",
        chars:["none"],
        sWs:[[6,3,6,0,1,{dev:1}],[4,3,4,0,1,{}]],
        mWs:[[5,3,12,-2,3,{}]]},

    // ── Stormraven Gunship (Vehicle, Transport, M14") ────────────────────────────
    // Armoured Resilience: -1 damage per attack — not modeled.
    // 11th ed: M14", AIRCRAFT removed → can be charged.
    // 1st: 280pts. 2nd+: 300pts.
    {id:"sr_ac", uid:"sr",  unit:"Stormraven Gunship", pts:280, m:1, W:14, sv:3, inv:null, fnp:null, hidden:true,
        label:"twin assault cannon [DEV+TL] + typhoon krak + 2× stormstrike",
        chars:["none"],
        sWs:[[6,3,6,0,1,{dev:1,tl:1}],[2,3,9,-2,3.5,{}],[2,3,10,-3,5.5,{}]],
        mWs:[[6,4,8,0,1,{}]]},
    {id:"sr_lc", uid:"sr",  unit:"Stormraven Gunship", pts:280, m:1, W:14, sv:3, inv:null, fnp:null, hidden:true,
        label:"twin lascannon [TL] + twin multi-melta [TL] + 2× stormstrike",
        chars:["none"],
        sWs:[[1,3,12,-3,4.5,{tl:1}],[2,3,9,-4,5.5,{tl:1}],[2,3,10,-3,5.5,{}]],
        mWs:[[6,4,8,0,1,{}]]},

    // ── Rhino (Vehicle, Transport, Dedicated Transport) ───────────────────────────
    // Truesilver Aegis: FNP6+ vs mortals for nearby GK units — not modeled.
    // 1st-3rd: 70pts. 4th+: 80pts.
    {id:"rhino", uid:"rhino", unit:"Rhino", pts:70, m:1, W:10, sv:3, inv:null, fnp:null, hidden:true,
        label:"storm bolter + armoured tracks",
        chars:["none"],
        sWs:[[4,3,4,0,1,{}]],
        mWs:[[3,4,6,0,1,{}]]},

    // ── Razorback (Vehicle, Transport, Dedicated Transport) ───────────────────────
    // Fire Focus: +1 AP for disembarked units shooting the same target this turn — not modeled.
    // 1st-3rd: 75pts. 4th+: 85pts. Twin lascannon swap (shown) is a free wargear option.
    {id:"razorback", uid:"razorback", unit:"Razorback", pts:75, m:1, W:10, sv:3, inv:null, fnp:null, hidden:true,
        label:"twin lascannon + storm bolter + armoured tracks",
        chars:["none"],
        sWs:[[1,3,12,-3,4.5,{}],[4,3,4,0,1,{}]],
        mWs:[[3,4,6,0,1,{}]]},

    // ── Land Raider Redeemer (Vehicle, Transport) ─────────────────────────────────
    // Assault Ramp: unit disembarking after a normal move can still charge — not modeled.
    // MFM v1.3: 1st ▲+10 → 260pts. 2nd+ ▲+10 → 280pts. Default loadout incl. free hunter-killer/multi-melta/storm bolter options.
    {id:"lrr", uid:"lrr", unit:"Land Raider Redeemer", pts:260, m:1, W:16, sv:2, inv:null, fnp:null,
        label:"2× flamestorm + twin assault cannon [DEV+TL] + multi-melta + storm bolter",
        chars:["none"],
        sWs:[[13,1,6,-2,2,{}],[6,3,6,0,1,{dev:1,tl:1}],[2,3,9,-4,5.5,{}],[4,3,4,0,1,{}]],
        mWs:[[6,4,8,0,1,{}]]},
];

export const DETACHMENTS = [
    // ── 10th Edition Codex Detachments ──────────────────────────────────────────
    {id:"bs",  dp:2, name:"Brotherhood Strike",  disp:"Purge the Foe",
        desc:"Fury of Titan: After deep striking, until end of turn re-roll hit 1s AND wound 1s.",
        affects:{all:true, bhBonus:1, rrw1:true}},
    {id:"hc",  dp:2, name:"Hallowed Conclave",   disp:"Take and Hold", // MFM: ▲1DP→2DP
        desc:"Duty Before All: TERMINATOR units can shoot and charge after Falling Back.",
        affects:null},
    {id:"ban", dp:2, name:"Banishers",            disp:"Disruption", // MFM: disp updated
        desc:"Channelled Force: Each Fight phase — psychic melee gains SH1 OR Lethal Hits (~72% Ld pass).",
        options:[
            {key:"sh1m", label:"SH1 psychic melee",   affects:{all:true, sh1m:true}},
            {key:"letm", label:"Lethal psychic melee", affects:{all:true, letm:true}},
        ]},
    {id:"ssp", dp:2, name:"Sanctic Spearhead",   disp:"Priority Assets", // MFM: ▲1DP→2DP
        desc:"Mailed Fist: VEHICLE units advancing gain +6\" move and ranged weapons get ASSAULT (positional, no calc effect).",
        affects:null,
        stratagems:[
            {key:"abominus", name:"Abominus-Class Targets", cp:1,
                desc:"+1 to Wound vs MONSTER/VEHICLE (assume available when needed to secure a kill)",
                affects:{all:true, w1mv:true}},
        ]},
    {id:"aug", dp:2, name:"Augurium Task Force",  disp:"Reconnaissance", // MFM: ▲1DP→2DP, disp updated
        desc:"Prescient Redeployment: Gate of Infinity redeployment at start of Movement phase.",
        affects:null},
    // ── 11th Edition Faction Pack Detachments ────────────────────────────────────
    {id:"wbt", dp:3, name:"Warpbane Task Force",  disp:"Take and Hold", // MFM: ▲2DP→3DP
        desc:"Hallowed Ground: All GK re-roll hit 1s. Strat SANCTIFIED KILL ZONE adds rrw1 in zone.",
        affects:{all:true, bhBonus:1}},
    {id:"aa",  dp:1, name:"Argent Assault",        disp:"Priority Assets",
        desc:"Dauntless Champions: PALADIN SQUAD +1 to wound when attack S < target T.",
        affects:{uids:["pal"], wBonus:1}},
    {id:"fop", dp:1, name:"Fires of Purgation",    disp:"Disruption", // MFM: disp updated
        desc:"Searing Soulflame: Units pinned by Purgation take battle-shock at -1. Enhancements: Precognicient Volleys (+10pts), Boons of Deimos (+20pts).",
        affects:null},
    {id:"ii",  dp:1, name:"Immaterial Interdiction",disp:"Reconnaissance", // MFM: disp updated
        desc:"Echojump: After shooting, Interceptor Squad makes D6+1\" surge move. Enhancements: Predestined Coordinates (+10pts, ingress turn 1), Astral Overlap (+10pts, Stealth).",
        affects:null},
];

// Per-uid Toughness/Vehicle/Monster, for use as a TARGET (e.g. Fight Simulator).
// Sourced from ref/greyknights-10th-datasheets.txt - unit rows above only ever
// needed defensive save stats for themselves as an ATTACKER, never their own T.
export const DEFENSE = {
    bts:{T:5,veh:false,mon:false}, ss:{T:4,veh:false,mon:false},
    pal:{T:5,veh:false,mon:false}, int:{T:4,veh:false,mon:false},
    purg:{T:4,veh:false,mon:false}, pur:{T:4,veh:false,mon:false},
    ndk:{T:8,veh:true,mon:false}, gmndk:{T:8,veh:true,mon:false},
    vd:{T:9,veh:true,mon:false}, sr:{T:10,veh:true,mon:false},
    rhino:{T:9,veh:true,mon:false}, razorback:{T:9,veh:true,mon:false},
    lrr:{T:12,veh:true,mon:false},
};

export const UC = {
    bts:"#94a3b8", ss:"#60a5fa",  pal:"#fbbf24", int:"#c084fc",
    purg:"#34d399", pur:"#22d3ee", ndk:"#f87171", gmndk:"#fb923c",
    vd:"#a78bfa",  sr:"#2dd4bf",
};
