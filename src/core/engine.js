// ─── COMBAT MATH (army-agnostic) ─────────────────────────────────────────────
// Weapon arrays: [shots, skill, S, AP, D, tags]
// tags: { sustained, let, conv, con, tl, rrw1, rrwf, dev, devmv, av3, am3, ai, sowf, fe }
// sustained = Sustained Hits N (magnitude, not a boolean): 1 for "Sustained
//        Hits 1", 2 for "Sustained Hits 2" or "Sustained Hits D3" (D3
//        averages to 2, so those two collapse to the same value - they were
//        never mechanically distinct in this engine, just named differently)
// ai   = ANTI-INFANTRY 2+: all hits auto-wound vs non-VEH/non-MON targets
// sowf = conditional rrwf (full wound reroll) applied only when target is VEH or MON
// devmv = DEVASTATING WOUNDS: MONSTER/VEHICLE only (e.g. Desecrator laser destructor)
// fe   = Force Edge: AP value already includes a +1 AP bonus that does NOT apply
//        vs MONSTER/VEHICLE targets (excluded by the ability text) - reverted here
// w1mv = conditional w1 (+1 to Wound roll) applied only vs MONSTER/VEHICLE
//        (e.g. Sanctic Spearhead's Abominus-Class Targets stratagem)
// Target: { T, sv, inv, fnp, veh, mon }

function wt(s,t){if(s>=t*2)return 2;if(s>t)return 3;if(s===t)return 4;if(s*2<=t)return 6;return 5;}

export function calcW(shots,skill,s,ap,d,tags,tgt,bh=1){
    if(!shots)return 0;
    const isInf=!tgt.veh&&!tgt.mon;
    const hp=Math.min((7-Math.max(2,skill-bh))/6,5/6);
    const cp=tags.conv?(3/6):tags.ch5?(2/6):(tags.ai&&isInf)?Math.min(hp,5/6):1/6;
    let h=shots*hp;
    if(tags.sustained)h+=shots*cp*tags.sustained;
    let wp=Math.min((7-wt(s,tgt.T))/6,5/6);
    if(tags.w1||(tags.w1mv&&(tgt.veh||tgt.mon)))wp=Math.min((7-Math.max(2,wt(s,tgt.T)-1))/6,5/6);
    if(tags.av3&&tgt.veh)wp=Math.max(wp,4/6);if(tags.am3&&tgt.mon)wp=Math.max(wp,4/6);
    if(tags.tl)wp=Math.min(wp+(1-wp)*wp,5/6);if(tags.rrw1)wp=Math.min(wp*7/6,5/6);
    if(tags.rrwf||(tags.sowf&&(tgt.veh||tgt.mon)))wp=Math.min(1-(1-wp)*(1-wp),5/6);
    let w=(tags.let||tags.conv||tags.con||(tags.ai&&isInf))?(shots*cp+(h-shots*cp)*wp):h*wp;
    let mort=0,nw=w;
    if(tags.dev||(tags.devmv&&(tgt.veh||tgt.mon))){mort=h/6;nw=h*Math.max(0,wp-1/6);}
    const effAp=(tags.fe&&(tgt.veh||tgt.mon))?ap+1:ap;
    const ms=tgt.sv-effAp,es=tgt.inv?Math.min(ms,tgt.inv):ms,sp=es<=6?(7-Math.max(es,2))/6:0;
    let out=(mort+nw*(1-sp))*d;
    if(tgt.fnp)out*=(1-(7-tgt.fnp)/6);
    return out;
}

export function calcWs(ws,tgt,bh){
    return(ws||[]).reduce((a,w)=>a+calcW(w[0],w[1],w[2],w[3],w[4],w[5]||{},tgt,bh),0);
}

// eAp: enemy AP modifier applied to save (e.g. -1 means saves are harder)
export function ewCalc(tw,sv,inv,fnp,eAp=0){
    const svMod=sv-eAp;
    const es=inv?Math.min(svMod,inv):svMod,sp=es<=6?(7-Math.max(es,2))/6:0;
    let e=tw/((1-sp)*.5);if(fnp)e/=(1-(7-fnp)/6);return e;
}
