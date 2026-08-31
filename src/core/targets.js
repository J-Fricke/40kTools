// ─── SHARED TARGET PROFILES (army-agnostic) ──────────────────────────────────
// Used by the evaluator across all factions. "std" = generic toughness/save
// bands; "meta" = real datasheet stats for specific units worth checking
// against (competitive monsters/vehicles/elites/hordes).
export const TARGETS=[
    {key:"light", grp:"std", label:"Light",  sub:"T3 5+sv",    T:3, sv:5,inv:null,fnp:null,veh:false,mon:false,scoreExclude:true},
    {key:"meq",   grp:"std", label:"MEQ",    sub:"T4 3+sv",    T:4, sv:3,inv:null,fnp:null,veh:false,mon:false},
    {key:"t5inf", grp:"std", label:"T5 Inf", sub:"T5 3+sv",    T:5, sv:3,inv:null,fnp:null,veh:false,mon:false},
    {key:"t6inf", grp:"std", label:"T6 Inf", sub:"T6 3+sv",    T:6, sv:3,inv:null,fnp:null,veh:false,mon:false},
    {key:"teq",   grp:"std", label:"TEQ",    sub:"T5 2+/4++",  T:5, sv:2,inv:4,  fnp:null,veh:false,mon:false},
    {key:"veh",   grp:"std", label:"Veh",    sub:"T9 3+sv",    T:9, sv:3,inv:null,fnp:null,veh:true, mon:false},
    {key:"tank",  grp:"std", label:"Tank",   sub:"T12 2+sv",   T:12,sv:2,inv:null,fnp:null,veh:true, mon:false},
    {key:"ctan",   grp:"meta",label:"C'tan",  sub:"T12 2+/4++", T:12,sv:2,inv:4,fnp:null,veh:false,mon:true, wounds:18},
    {key:"defiler",grp:"meta",label:"Defiler",sub:"T11 5++ 18W", T:11,sv:2,inv:5,fnp:null,veh:true, mon:false,wounds:18},
    {key:"riptide",grp:"meta",label:"Riptide",sub:"T8 3+/5++",  T:8, sv:3,inv:5,fnp:null,veh:false,mon:true, wounds:14},
    {key:"cust",   grp:"meta",label:"Cust",   sub:"T6 2+/4++",  T:6, sv:2,inv:4,fnp:null,veh:false,mon:false,wounds:15},
    // Allarus Custodians, 6-model max size (T7 sv2+/inv4+ ALL attacks, 4W/model = 24W total)
    {key:"allarus",grp:"meta",label:"Allarus", sub:"T7 2+/4++ 24W",T:7, sv:2,inv:4,fnp:null,veh:false,mon:false,wounds:24},
    {key:"poss",   grp:"meta",label:"Poss",   sub:"T6 3+/5++",  T:6, sv:3,inv:5,fnp:null,veh:false,mon:false,wounds:30},
    {key:"necron", grp:"meta",label:"Necron", sub:"T4 4+/4++",  T:4, sv:4,inv:4,fnp:null,veh:false,mon:false,wounds:20},
    {key:"rubric", grp:"meta",label:"Rubric", sub:"T4 3+/5++",  T:4, sv:3,inv:5,fnp:null,veh:false,mon:false,wounds:20},
    {key:"bcrush", grp:"meta",label:"B'crusher",sub:"T7 3+/5++", T:7, sv:3,inv:5,fnp:null,veh:false,mon:false,wounds:24},
    {key:"keeper",grp:"meta",label:"Keeper",   sub:"T10 5+/4++ 18W",T:10,sv:5,inv:4,fnp:null,veh:false,mon:true, wounds:18},
    {key:"fiends",grp:"meta",label:"Fiends",   sub:"T5 -/5++ 24W", T:5, sv:7,inv:5,fnp:null,veh:false,mon:false,wounds:24},
    // Magnus the Red: real Sv2+ matters here (unlike Keeper/LoC's bad armor
    // saves, which never beat their own 4++ in this engine's math). Unearthly
    // Power lets him pick ONE Crimson King ability per battle round; if he
    // picks Impossible Form that round, non-psychic attacks vs him get -1
    // Damage - opponent's choice, not permanent, so NOT modeled here (this
    // profile is his baseline; a real kill attempt could be softer some
    // rounds if he calls Impossible Form). Full caveat lives in `title`,
    // shown on hover instead of cluttering the column header.
    {key:"magnus",grp:"meta",label:"Magnus",   sub:"T11 2+/4++ 16W", title:"Baseline profile - Magnus can pick Impossible Form (-1 Damage vs non-psychic attacks) some rounds, not modeled here",T:11,sv:2,inv:4,fnp:null,veh:false,mon:true, wounds:16},
];
