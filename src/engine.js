// ─── COMBAT MATH (army-agnostic) ─────────────────────────────────────────────
// Weapon arrays: [shots, skill, S, AP, D, tags]
// tags: { sh1, sh2, shd3, let, conv, con, tl, rrw1, dev, av3, am3, ai }
// ai = ANTI-INFANTRY 2+: all hits auto-wound vs non-VEH/non-MON targets
// Target: { T, sv, inv, fnp, veh, mon }

function wt(s,t){if(s>=t*2)return 2;if(s>t)return 3;if(s===t)return 4;if(s*2<=t)return 6;return 5;}

export function calcW(shots,skill,s,ap,d,tags,tgt,bh=1){
    if(!shots)return 0;
    const isInf=!tgt.veh&&!tgt.mon;
    const hp=Math.min((7-Math.max(2,skill-bh))/6,5/6);
    const cp=tags.conv?(3/6):tags.ch5?(2/6):(tags.ai&&isInf)?Math.min(hp,5/6):1/6;
    let h=shots*hp;
    if(tags.sh1)h+=shots*cp;if(tags.sh2)h+=shots*cp*2;if(tags.shd3)h+=shots*cp*2;
    let wp=Math.min((7-wt(s,tgt.T))/6,5/6);
    if(tags.w1)wp=Math.min((7-Math.max(2,wt(s,tgt.T)-1))/6,5/6);
    if(tags.av3&&tgt.veh)wp=Math.max(wp,4/6);if(tags.am3&&tgt.mon)wp=Math.max(wp,4/6);
    if(tags.tl)wp=Math.min(wp+(1-wp)*wp,5/6);if(tags.rrw1)wp=Math.min(wp*7/6,5/6);if(tags.rrwf)wp=Math.min(1-(1-wp)*(1-wp),5/6);
    let w=(tags.let||tags.conv||tags.con||(tags.ai&&isInf))?(shots*cp+(h-shots*cp)*wp):h*wp;
    let mort=0,nw=w;
    if(tags.dev){mort=h/6;nw=h*Math.max(0,wp-1/6);}
    const ms=tgt.sv-ap,es=tgt.inv?Math.min(ms,tgt.inv):ms,sp=es<=6?(7-Math.max(es,2))/6:0;
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
