import { useState, useMemo, useEffect } from "react";
import { calcWs, ewCalc } from "./engine.js";
import { TARGETS } from "./targets.js";
import { CHARS as V_CHARS, UNITS as V_UNITS, DETACHMENTS as V_DETS, UC as V_UC } from "./factions/votann.js";
import { CHARS as C_CHARS, UNITS as C_UNITS, DETACHMENTS as C_DETS, UC as C_UC } from "./factions/custodes.js";
import { CHARS as GK_CHARS, UNITS as GK_UNITS, DETACHMENTS as GK_DETS, UC as GK_UC } from "./factions/greyknights.js";
import { CHARS as CK_CHARS, UNITS as CK_UNITS, DETACHMENTS as CK_DETS, UC as CK_UC } from "./factions/chaosknights.js";

const FACTIONS = {
    votann:       {label:"Leagues of Votann", units:V_UNITS,  chars:V_CHARS,  dets:V_DETS,  uc:V_UC},
    custodes:     {label:"Adeptus Custodes",  units:C_UNITS,  chars:C_CHARS,  dets:C_DETS,  uc:C_UC},
    greyknights:  {label:"Grey Knights",      units:GK_UNITS, chars:GK_CHARS, dets:GK_DETS, uc:GK_UC},
    chaosknights: {label:"Chaos Knights",     units:CK_UNITS, chars:CK_CHARS, dets:CK_DETS, uc:CK_UC},
};

// ─── UI ───────────────────────────────────────────────────────────────────────
const C={bg:"#060e1c",bg2:"#0a1525",bg3:"#0d1f35",bdr:"#1e293b",bdr2:"#2d4266",
    tx:"#f1f5f9",sub:"#cbd5e1",dim:"#94a3b8",vdim:"#475569",
    amb:"#fbbf24",ambBg:"#78350f",bl:"#60a5fa",blBg:"#1e3a5f",
    grn:"#34d399",pur:"#c084fc"};

function heat(v,lo,hi){
    if(hi===lo)return"transparent";
    const t=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));
    if(t<.33)return`rgba(96,165,250,${.08+t*.3})`;
    if(t<.66)return`rgba(251,191,36,${.1+(t-.33)*.4})`;
    return`rgba(248,113,113,${.15+(t-.66)*.6})`;
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App(){
    const [faction,setFaction]=useState("votann");
    const fd=FACTIONS[faction];
    const UNITS=fd.units, CHARS=fd.chars, DETACHMENTS=fd.dets, UC=fd.uc;

    const changeFaction=f=>{
        const d=FACTIONS[f];
        setFaction(f);
        setVis(new Set(d.units.filter(u=>!u.hidden).map(u=>u.id)));
        setCharSel(()=>{const s={};d.units.forEach(u=>s[u.id]=new Set(["none"]));return s;});
        setActiveDets(new Set());
        setDetOpts({});
    };

    useEffect(()=>{document.title=`${fd.label} · Unit Evaluator`;},[faction]);

    const uids=useMemo(()=>[...new Set(UNITS.map(u=>u.uid))],[faction]);
    const allIds=useMemo(()=>new Set(UNITS.map(u=>u.id)),[faction]);

    const [vis,setVis]=useState(()=>new Set(V_UNITS.filter(u=>!u.hidden).map(u=>u.id)));
    const [tgrp,setTgrp]=useState("meta");
    const [yp,setYp]=useState(true);
    const [inclShoot,setInclShoot]=useState(true);
    const [inclMelee,setInclMelee]=useState(true);
    const [sort,setSort]=useState({k:"ctan",d:1});
    const [killPctSort,setKillPctSort]=useState(true);
    const [doHeat,setDoHeat]=useState(true);
    const [showOldPts,setShowOldPts]=useState(true);
    const [showCfg,setShowCfg]=useState(false);
    const [activeDets,setActiveDets]=useState(new Set());
    const [detOpts,setDetOpts]=useState({});
    const [showDets,setShowDets]=useState(false);
    const [enemyAp,setEnemyAp]=useState(0);

    // charSel: {id -> Set<charKey>}, "none" = base unit, other keys = unit+char variants
    const [charSel,setCharSel]=useState(()=>{
        const s={};V_UNITS.forEach(u=>s[u.id]=new Set(["none"]));return s;
    });

    const dpSpent=useMemo(()=>[...activeDets].reduce((a,id)=>{
        const d=DETACHMENTS.find(d=>d.id===id);return a+(d?d.dp:0);
    },0),[activeDets]);

    const toggleDet=id=>{
        const det=DETACHMENTS.find(d=>d.id===id);if(!det)return;
        setActiveDets(p=>{
            const n=new Set(p);
            if(n.has(id)){n.delete(id);}
            else if(dpSpent+det.dp<=3){n.add(id);}
            return n;
        });
    };

    const bh=yp?1:0;
    const tgts=TARGETS.filter(t=>t.grp===tgrp);

    // Build effective unit+char combo for a given unit row
    const buildCombo=(unit,char)=>{
        if(!char||char.name==="None")return{
            pts:unit.pts, W:unit.W, sv:unit.sv, inv:unit.inv, fnp:unit.fnp,
            sWs:unit.sWs, mWs:unit.mWs, ew2:null, charLabel:null, buffs:{}
        };
        // Apply char buff to unit shoot/melee weapons
        let unitSWs=char.buffs.let
            ?(unit.sWs||[]).map(w=>[w[0],w[1],w[2],w[3],w[4],{...w[5],let:1}])
            :(unit.sWs||[]);
        if(char.buffs.pfBonus)unitSWs=unitSWs.map(w=>
            w[5]&&w[5].ai?[w[0]+unit.m*char.buffs.pfBonus,w[1],w[2],w[3],w[4],w[5]]:w);
        const unitMWs=char.buffs.sh1m
            ?(unit.mWs||[]).map(w=>[w[0],w[1],w[2],w[3],w[4],{...w[5],sh1:1}])
            :(unit.mWs||[]);
        const mergedSWs=[...unitSWs,...(char.sWs||[])];
        const mergedMWs=[...unitMWs,...(char.mWs||[])];
        const fnp=char.buffs.unitFnp||unit.fnp;
        const inv=char.buffs.unitInv?Math.min(unit.inv||99,char.buffs.unitInv):unit.inv;
        const eApMod=char.buffs.eApMod||0;
        return{
            pts:unit.pts+char.pts,
            W:unit.W, sv:unit.sv, inv, fnp,
            sWs:mergedSWs.length?mergedSWs:null,
            mWs:mergedMWs.length?mergedMWs:null,
            ew2:{m:1,W:char.W,sv:char.sv,inv:char.inv,fnp:char.fnp},
            charLabel:char.name,
            buffs:char.buffs,
            eApMod,
        };
    };

    const getDetBuff=(unit,charKey)=>{
        let bhBonus=0,rrw1=false,rrw1Shoot=false,ap1=false,kahlW=0,enhancementPts=0,wBonus=0,ap1m=false,ch5m=false,sh1m=false,letm=false,sh1g=false,letg=false;
        for(const id of activeDets){
            const det=DETACHMENTS.find(d=>d.id===id);
            if(!det)continue;
            let a=det.affects;
            if(det.options){
                const optKey=detOpts[id]||(det.options[0]&&det.options[0].key);
                const opt=det.options.find(o=>o.key===optKey);
                a=opt?opt.affects:null;
            }
            if(!a)continue;
            const matchUnit=a.all||(a.uids&&a.uids.includes(unit.uid));
            if(!matchUnit)continue;
            if(a.bhBonus)bhBonus+=a.bhBonus;
            if(a.wBonus)wBonus+=a.wBonus;
            if(a.rrw1)rrw1=true;
            if(a.rrw1Shoot)rrw1Shoot=true;
            if(a.ap1uids&&a.ap1uids.includes(unit.uid))ap1=true;
            if(a.ap1chars&&a.ap1chars.includes(charKey))ap1=true;
            if(a.ap1m)ap1m=true;
            if(a.ch5m)ch5m=true;
            if(a.sh1m)sh1m=true;
            if(a.letm)letm=true;
            if(a.sh1g)sh1g=true;
            if(a.letg)letg=true;
        }
        // Ironskein (10pts enhancement): +2W to Kâhl when HGC or Hearthband active
        if(charKey==="kahl"&&(activeDets.has("hg_covenant")||activeDets.has("hearthband"))){
            kahlW=2;
            enhancementPts+=10;
        }
        return{bhBonus,rrw1,rrw1Shoot,ap1,kahlW,enhancementPts,wBonus,ap1m,ch5m,sh1m,letm,sh1g,letg};
    };

    const applyBuff=(ws,buff,isShooting)=>{
        const useRrw1=buff.rrw1||(isShooting&&buff.rrw1Shoot);
        const useAp1=buff.ap1||(!isShooting&&buff.ap1m);
        const useCh5=!isShooting&&buff.ch5m;
        const useSh1=buff.sh1g||(!isShooting&&buff.sh1m);
        const useLet=buff.letg||(!isShooting&&buff.letm);
        if(!ws||(!useRrw1&&!useAp1&&!buff.wBonus&&!useCh5&&!useSh1&&!useLet))return ws;
        return ws.map(w=>{
            const[shots,skill,s,ap,d,tags]=w;
            return[shots,skill,s,useAp1?ap-1:ap,d,{...tags,
                rrw1:useRrw1?1:(tags.rrw1||0),
                w1:buff.wBonus>0?1:(tags.w1||0),
                ch5:useCh5?1:(tags.ch5||0),
                sh1:useSh1?1:(tags.sh1||0),
                let:useLet?1:(tags.let||0),
            }];
        });
    };

    const toggleId=id=>setVis(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
    const toggleUid=uid=>{
        const ids=UNITS.filter(u=>u.uid===uid).map(u=>u.id);
        const allV=ids.every(id=>vis.has(id));
        setVis(p=>{const n=new Set(p);ids.forEach(id=>allV?n.delete(id):n.add(id));return n;});
    };
    const toggleShoot=()=>{if(inclShoot&&!inclMelee)return;setInclShoot(p=>!p);};
    const toggleMelee=()=>{if(inclMelee&&!inclShoot)return;setInclMelee(p=>!p);};

    const rows=useMemo(()=>UNITS.flatMap(unit=>{
        const selectedChars=[...(charSel[unit.id]||new Set(["none"]))];
        return selectedChars.map(charKey=>{
            const char=CHARS[charKey];
            const combo=buildCombo(unit,char);
            const buff=getDetBuff(unit,charKey);
            const unitBh=bh+buff.bhBonus;
            const sWs=applyBuff(combo.sWs,buff,true);
            const mWs=applyBuff(combo.mWs,buff,false);
            const effectivePts=combo.pts+buff.enhancementPts;
            const effectivePts10=unit.pts10?(unit.pts10+(charKey!=="none"?combo.pts-unit.pts:0)+buff.enhancementPts):null;
            const vals={};const rawVals={};const vals10={};
            tgts.forEach(t=>{
                const s=inclShoot?calcWs(sWs,t,unitBh):0;
                const m=inclMelee?calcWs(mWs,t,unitBh):0;
                const raw=s+m;
                rawVals[t.key]=raw;
                vals[t.key]=raw/effectivePts*100;
                vals10[t.key]=effectivePts10?raw/effectivePts10*100:null;
            });
            const ew2=combo.ew2&&buff.kahlW>0
                ?{...combo.ew2,W:combo.ew2.W+buff.kahlW}
                :combo.ew2;
            const eApUnit=enemyAp+(combo.eApMod||0);
            const ew=ewCalc(unit.m*combo.W,combo.sv,combo.inv,combo.fnp,eApUnit)
                +(ew2?ewCalc(ew2.m*ew2.W,ew2.sv,ew2.inv,ew2.fnp,eApUnit):0);
            const scoreTgts=tgts.filter(t=>!t.scoreExclude);
            const arr=scoreTgts.map(t=>vals[t.key]);
            const arr10=scoreTgts.map(t=>vals10[t.key]);
            const ewpt=ew/effectivePts;
            const ewpt10=effectivePts10?ew/effectivePts10:null;
            const avgDpt=arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;
            const avgDpt10=arr10.length&&effectivePts10?arr10.reduce((a,b)=>a+b,0)/arr10.length:null;
            return{
                ...unit,
                id:`${unit.id}::${charKey}`,
                baseId:unit.id,
                pts:effectivePts,
                charLabel:combo.charLabel,
                vals,vals10,rawVals,ew,
                ewpt,ewpt10,avgDpt,avgDpt10,
            };
        });
    }),[tgts,yp,inclShoot,inclMelee,activeDets,detOpts,enemyAp,charSel]);

    const rng=useMemo(()=>{
        const r={ewpt:[Infinity,-Infinity],avgDpt:[Infinity,-Infinity],composite:[Infinity,-Infinity],
                 ewpt10:[Infinity,-Infinity],avgDpt10:[Infinity,-Infinity],composite10:[Infinity,-Infinity]};
        tgts.forEach(t=>{r[t.key]=[Infinity,-Infinity];});
        rows.forEach(row=>{
            tgts.forEach(t=>{const v=row.vals[t.key];
                r[t.key][0]=Math.min(r[t.key][0],v);r[t.key][1]=Math.max(r[t.key][1],v);});
            r.ewpt[0]=Math.min(r.ewpt[0],row.ewpt);r.ewpt[1]=Math.max(r.ewpt[1],row.ewpt);
            r.avgDpt[0]=Math.min(r.avgDpt[0],row.avgDpt);r.avgDpt[1]=Math.max(r.avgDpt[1],row.avgDpt);
            if(row.ewpt10!=null){r.ewpt10[0]=Math.min(r.ewpt10[0],row.ewpt10);r.ewpt10[1]=Math.max(r.ewpt10[1],row.ewpt10);}
            if(row.avgDpt10!=null){r.avgDpt10[0]=Math.min(r.avgDpt10[0],row.avgDpt10);r.avgDpt10[1]=Math.max(r.avgDpt10[1],row.avgDpt10);}
        });
        const composites=new Map(),composites10=new Map();
        rows.forEach(row=>{
            const ne=r.ewpt[1]>r.ewpt[0]?(row.ewpt-r.ewpt[0])/(r.ewpt[1]-r.ewpt[0]):0;
            const nd=r.avgDpt[1]>r.avgDpt[0]?(row.avgDpt-r.avgDpt[0])/(r.avgDpt[1]-r.avgDpt[0]):0;
            const c=Math.round((nd*.65+ne*.35)*100);
            composites.set(row.id,c);
            r.composite[0]=Math.min(r.composite[0],c);
            r.composite[1]=Math.max(r.composite[1],c);
            if(row.ewpt10!=null&&row.avgDpt10!=null){
                const ne10=r.ewpt10[1]>r.ewpt10[0]?(row.ewpt10-r.ewpt10[0])/(r.ewpt10[1]-r.ewpt10[0]):0;
                const nd10=r.avgDpt10[1]>r.avgDpt10[0]?(row.avgDpt10-r.avgDpt10[0])/(r.avgDpt10[1]-r.avgDpt10[0]):0;
                const c10=Math.round((nd10*.65+ne10*.35)*100);
                composites10.set(row.id,c10);
                r.composite10[0]=Math.min(r.composite10[0],c10);
                r.composite10[1]=Math.max(r.composite10[1],c10);
            }
        });
        return{...r,composites,composites10};
    },[rows,tgts]);

    const filtered=rows.filter(r=>vis.has(r.baseId));
    const sorted=[...filtered].sort((a,b)=>{
        const k=sort.k;
        const getV=(r)=>{
            if(k==="ewpt")return r.ewpt;
            if(k==="avgDpt")return r.avgDpt;
            if(k==="pts")return r.pts;
            if(k==="m")return r.m;
            if(k==="composite")return rng?.composites?.get(r.id)||0;
            if(k==="unit"||k==="label")return 0;
            if(killPctSort){const t=tgts.find(t=>t.key===k);if(t?.wounds)return(r.rawVals[k]||0)/t.wounds*100;}
            return(r.vals&&r.vals[k])||0;
        };
        const va=getV(a),vb=getV(b);
        const round2=v=>Math.round(v*100)/100;
        const primary=(round2(vb)-round2(va))*sort.d;
        if(primary!==0)return primary;
        if(k==="ewpt")return(round2(b.avgDpt)-round2(a.avgDpt))*sort.d;
        return(round2(b.ewpt)-round2(a.ewpt))*sort.d;
    });

    const clkSort=k=>setSort(p=>({k,d:p.k===k&&p.d===1?-1:1}));
    const fmt=v=>v<.005?"—":v<10?v.toFixed(2):v.toFixed(1);

    const Btn=({on,click,children,col,disabled})=>(
        <button onClick={click} disabled={disabled} style={{padding:"3px 8px",fontSize:10,borderRadius:3,border:"1px solid",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,
            borderColor:on?(col||C.amb):C.bdr,background:on?`${col||C.amb}22`:"transparent",color:on?(col||C.amb):C.dim}}>{children}</button>
    );
    const Th=({k,lbl,sub,left})=>(
        <th onClick={()=>clkSort(k)} style={{padding:"5px 7px",cursor:"pointer",whiteSpace:"nowrap",
            background:sort.k===k?C.bg3:C.bg2,borderBottom:`2px solid ${sort.k===k?C.bl:C.bdr}`,
            color:sort.k===k?C.bl:C.sub,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",
            userSelect:"none",position:"sticky",top:0,zIndex:2,textAlign:left?"left":"right"}}>
            <div>{lbl}{sort.k===k?(sort.d===1?" ↓":" ↑"):""}</div>
            {sub&&<div style={{fontSize:8,color:C.vdim}}>{sub}</div>}
        </th>
    );

    const phaseLabel=inclShoot&&inclMelee?"Shoot + Melee":inclShoot?"Shoot only":"Melee only";

    return(
        <div style={{fontFamily:"'Courier New',monospace",background:C.bg,minHeight:"100vh",color:C.tx,display:"flex",flexDirection:"column",fontSize:12}}>
            <div style={{padding:"10px 14px 4px",flexShrink:0}}>
                <div style={{fontSize:9,color:C.amb,letterSpacing:".3em",textTransform:"uppercase"}}>⚙ Kinhost Analytics v15</div>
                <h1 style={{fontSize:15,fontWeight:900,margin:"2px 0",letterSpacing:"-.02em"}}>{fd.label} · Unit Evaluator
                    <span style={{fontSize:11,fontWeight:400,color:C.dim,marginLeft:10}}>{phaseLabel}</span>
                </h1>
            </div>

            {/* ── CONTROL BAR ── */}
            <div style={{padding:"6px 14px 8px",display:"flex",flexWrap:"wrap",gap:8,flexShrink:0,borderBottom:`1px solid ${C.bdr}`}}>
                <div><div style={{fontSize:9,color:C.vdim,marginBottom:3,textTransform:"uppercase"}}>Faction</div>
                    <select value={faction} onChange={e=>changeFaction(e.target.value)}
                        style={{fontSize:11,padding:"2px 6px",background:C.bg3,color:C.tx,border:`1px solid ${C.bdr2}`,borderRadius:3,cursor:"pointer",height:24}}>
                        {Object.entries(FACTIONS).map(([k,f])=>(
                            <option key={k} value={k}>{f.label}</option>
                        ))}
                    </select></div>
                <div><div style={{fontSize:9,color:C.vdim,marginBottom:3,textTransform:"uppercase"}}>Targets</div>
                    <div style={{display:"flex",gap:3}}>
                        <Btn on={tgrp==="std"} click={()=>setTgrp("std")}>Standard</Btn>
                        <Btn on={tgrp==="meta"} click={()=>setTgrp("meta")}>Meta</Btn>
                    </div></div>
                {faction==="votann"&&<div><div style={{fontSize:9,color:C.vdim,marginBottom:3,textTransform:"uppercase"}}>Yield Points</div>
                    <div style={{display:"flex",gap:3}}>
                        <Btn on={yp} click={()=>setYp(true)}>+1 Hit</Btn>
                        <Btn on={!yp} click={()=>setYp(false)}>No YP</Btn>
                    </div></div>}
                <div><div style={{fontSize:9,color:C.vdim,marginBottom:3,textTransform:"uppercase"}}>Phase</div>
                    <div style={{display:"flex",gap:3}}>
                        <Btn on={inclShoot} click={toggleShoot} col={C.bl} disabled={inclShoot&&!inclMelee}>Shooting</Btn>
                        <Btn on={inclMelee} click={toggleMelee} col={C.grn} disabled={inclMelee&&!inclShoot}>Melee</Btn>
                    </div></div>
                <div><div style={{fontSize:9,color:C.vdim,marginBottom:3,textTransform:"uppercase"}}>Enemy AP <span style={{color:C.vdim}}>(EW/pt)</span></div>
                    <div style={{display:"flex",gap:3}}>
                        {[0,-1,-2,-3].map(ap=>(
                            <Btn key={ap} on={enemyAp===ap} click={()=>setEnemyAp(ap)} col={C.grn}>AP{ap}</Btn>
                        ))}
                    </div></div>
                <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"flex-end",paddingBottom:1}}>
                    <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:10,color:C.dim}}>
                        <input type="checkbox" checked={doHeat} onChange={e=>setDoHeat(e.target.checked)} style={{accentColor:C.amb}}/>Heat
                    </label>
                    {faction==="votann"&&<label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:10,color:C.dim}}>
                        <input type="checkbox" checked={showOldPts} onChange={e=>setShowOldPts(e.target.checked)} style={{accentColor:C.vdim}}/>10th pts
                    </label>}
                    {tgrp==="meta"&&<label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontSize:10,color:killPctSort?C.grn:C.dim}}>
                        <input type="checkbox" checked={killPctSort} onChange={e=>setKillPctSort(e.target.checked)} style={{accentColor:C.grn}}/>Kill%
                    </label>}
                    <Btn on={showCfg} click={()=>setShowCfg(p=>!p)} col={C.pur}>{showCfg?"▲ Hide":"▼ Loadouts"}</Btn>
                    <Btn on={showDets} click={()=>setShowDets(p=>!p)} col={C.amb}>{showDets?"▲ Hide":"▼ Detachments"}{dpSpent>0&&<span style={{marginLeft:4,background:C.amb,color:C.bg,borderRadius:3,padding:"0 4px",fontSize:9}}>{dpSpent}/3 DP</span>}</Btn>
                </div>
            </div>

        {/* ── DETACHMENTS PANEL ── */}
        {showDets&&(
            <div style={{padding:"8px 14px 10px",borderBottom:`1px solid ${C.bdr}`,background:C.bg2}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>Detachment Points</span>
                    <div style={{display:"flex",gap:3}}>
                        {[1,2,3].map(n=>(
                            <div key={n} style={{width:18,height:18,borderRadius:3,border:`1px solid ${dpSpent>=n?C.amb:C.bdr2}`,background:dpSpent>=n?C.ambBg:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:dpSpent>=n?C.amb:C.vdim}}>{n}</div>
                        ))}
                    </div>
                    <span style={{fontSize:9,color:dpSpent===3?C.amb:C.dim}}>{dpSpent}/3 DP spent</span>
                    {dpSpent>0&&<button onClick={()=>setActiveDets(new Set())} style={{fontSize:9,background:"none",border:`1px solid ${C.bdr2}`,color:C.dim,cursor:"pointer",padding:"1px 6px",borderRadius:3}}>Clear</button>}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {DETACHMENTS.map(det=>{
                        const active=activeDets.has(det.id);
                        const canAdd=!active&&(dpSpent+det.dp<=3);
                        const disabled=!active&&!canAdd;
                        return(
                            <div key={det.id} onClick={()=>!disabled&&toggleDet(det.id)}
                                 style={{cursor:disabled?"not-allowed":"pointer",border:`1px solid ${active?C.amb:disabled?C.bdr:C.bdr2}`,borderRadius:4,padding:"5px 8px",background:active?C.ambBg:C.bg3,opacity:disabled?0.4:1,minWidth:180,maxWidth:260}}>
                                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                                    <span style={{fontSize:9,background:active?C.amb:C.bdr2,color:active?C.bg:C.sub,borderRadius:2,padding:"1px 4px",fontWeight:700}}>{det.dp}DP</span>
                                    <span style={{fontSize:10,fontWeight:700,color:active?C.amb:C.tx}}>{det.name}</span>
                                    {(det.affects||det.options)&&<span style={{fontSize:8,color:C.grn,marginLeft:"auto"}}>+calc</span>}
                                </div>
                                <div style={{fontSize:8,color:C.vdim,marginBottom:2,letterSpacing:".05em",textTransform:"uppercase"}}>{det.disp}</div>
                                <div style={{fontSize:9,color:C.vdim,lineHeight:1.3}}>{det.desc}</div>
                                {det.options&&active&&(
                                    <div onClick={e=>e.stopPropagation()} style={{marginTop:5,display:"flex",gap:3}}>
                                        {det.options.map(opt=>{
                                            const sel=(detOpts[det.id]||det.options[0].key)===opt.key;
                                            return(
                                                <button key={opt.key} onClick={()=>setDetOpts(p=>({...p,[det.id]:opt.key}))}
                                                    style={{fontSize:8,padding:"2px 6px",borderRadius:2,cursor:"pointer",
                                                        border:`1px solid ${sel?C.grn:C.bdr2}`,
                                                        background:sel?`${C.grn}22`:"transparent",
                                                        color:sel?C.grn:C.vdim}}>
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* ── LOADOUTS PANEL ── */}
        {showCfg&&(
            <div style={{padding:"8px 14px 10px",borderBottom:`1px solid ${C.bdr}`,background:C.bg2,maxHeight:280,overflowY:"auto"}}>
                <div style={{fontSize:9,color:C.dim,marginBottom:6,textTransform:"uppercase"}}>Loadouts · Character</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:14}}>
                    {uids.map(uid=>{
                        const ul=UNITS.filter(u=>u.uid===uid),uc=UC[uid]||C.dim;
                        const allV=ul.every(u=>vis.has(u.id)),someV=ul.some(u=>vis.has(u.id));
                        return(
                            <div key={uid} style={{minWidth:220}}>
                                <label style={{display:"flex",alignItems:"center",gap:5,marginBottom:4,cursor:"pointer"}}>
                                    <input type="checkbox" checked={allV} ref={el=>{if(el)el.indeterminate=!allV&&someV;}} onChange={()=>toggleUid(uid)} style={{accentColor:uc}}/>
                                    <span style={{fontSize:11,fontWeight:700,color:uc}}>{ul[0].unit}</span>
                                </label>
                                {ul.map(u=>{
                                    const sel=charSel[u.id]||new Set(["none"]);
                                    const hasChars=u.chars&&u.chars.length>1;
                                    return(
                                        <div key={u.id} style={{paddingLeft:16,marginBottom:4}}>
                                            <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                                                <input type="checkbox" checked={vis.has(u.id)} onChange={()=>toggleId(u.id)} style={{accentColor:uc,width:11,height:11}}/>
                                                <span style={{fontSize:10,color:vis.has(u.id)?C.sub:C.vdim}}>
                                                    {u.label}
                                                    <span style={{color:C.vdim}}> {u.pts}pt</span>
                                                    {u.sWs&&u.mWs&&<span style={{color:C.bl,marginLeft:3}}>S+M</span>}
                                                    {u.sWs&&!u.mWs&&<span style={{color:C.bl,marginLeft:3}}>S</span>}
                                                    {!u.sWs&&u.mWs&&<span style={{color:C.grn,marginLeft:3}}>M</span>}
                                                </span>
                                            </label>
                                            {hasChars&&(
                                                <div style={{paddingLeft:16,marginTop:2,display:"flex",flexWrap:"wrap",gap:3}}>
                                                    {u.chars.map(ck=>{
                                                        const ch=CHARS[ck];if(!ch)return null;
                                                        const on=sel.has(ck);
                                                        return(
                                                            <button key={ck} onClick={()=>setCharSel(p=>{
                                                                const cur=new Set(p[u.id]||["none"]);
                                                                if(cur.has(ck))cur.delete(ck);else cur.add(ck);
                                                                return{...p,[u.id]:cur};
                                                            })}
                                                                style={{fontSize:9,padding:"2px 6px",borderRadius:3,cursor:"pointer",
                                                                    border:`1px solid ${on?C.pur:C.bdr2}`,
                                                                    background:on?`${C.pur}22`:"transparent",
                                                                    color:on?C.pur:C.vdim}}>
                                                                {ck==="none"?"Base":`+${ch.name}${ch.pts>0?` (${ch.pts}pt)`:""}`}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* ── TABLE ── */}
        <div style={{flex:1,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr>
                    <Th k="unit" lbl="Unit" left/>
                    <Th k="label" lbl="Loadout" left/>
                    <Th k="pts" lbl="Pts"/>
                    <Th k="m" lbl="Mdl"/>
                    {tgts.map(t=><Th key={t.key} k={t.key} lbl={t.label} sub={t.sub}/>)}
                    <Th k="composite" lbl="Score" sub="65%dmg+35%dur"/>
                    <Th k="ewpt" lbl="EW/pt" sub="dur/cost"/>
                    <Th k="avgDpt" lbl="Avg D/pt" sub="excl. Light"/>
                </tr></thead>
                <tbody>
                {sorted.map((row,ri)=>{
                    const uc=UC[row.uid]||C.dim,isC=!!row.charLabel;
                    const showOldRow=showOldPts&&!row.charLabel&&row.pts10&&row.pts10!==row.pts;
                    const oldCol=(o,n)=>o>n?'#f87171':'#4ade80';
                    return(
                        <tr key={row.id} style={{background:isC?`${uc}0a`:(ri%2===0?C.bg:C.bg2),borderBottom:`1px solid ${C.bdr}`}}>
                            <td style={{padding:"5px 8px",color:uc,fontWeight:700,fontSize:10,borderLeft:`2px solid ${uc}`,whiteSpace:"nowrap"}}>
                                {row.unit}{isC&&<div style={{fontSize:8,color:C.pur}}>+{row.charLabel}</div>}
                            </td>
                            <td style={{padding:"5px 8px",color:C.tx,whiteSpace:"nowrap",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis"}}>{row.label}</td>
                            <td style={{padding:"5px 7px",textAlign:"right",color:C.amb,fontWeight:700}}>
                                {row.pts}{showOldPts&&!row.charLabel&&row.pts10!=null&&row.pts10!==row.pts&&<span style={{fontSize:9,color:C.dim,marginLeft:3}}>({row.pts10})</span>}
                            </td>
                            <td style={{padding:"5px 7px",textAlign:"right",color:C.sub}}>{row.m}</td>
                            {tgts.map(t=>{
                                const v=row.vals[t.key];
                                const pct=t.wounds?Math.round(row.rawVals[t.key]/t.wounds*100):null;
                                const pctStr=pct===null?null:pct>999?'>999%':`${pct}%`;
                                const pctCol=pct===null?null:pct>=150?'#c084fc':pct>=75?'#4ade80':pct>=50?'#fb923c':'#f87171';
                                const v10=row.vals10[t.key];
                                return <td key={t.key} style={{padding:"5px 7px",textAlign:"right",background:doHeat?heat(v,rng[t.key][0],rng[t.key][1]):"transparent",color:C.tx,fontVariantNumeric:"tabular-nums"}}>
                                    <div>{fmt(v)}{pctStr&&<span style={{fontSize:9,fontWeight:700,color:pctCol,marginLeft:3}}>({pctStr})</span>}</div>
                                    {showOldRow&&v10!=null&&<div style={{fontSize:8,color:oldCol(v10,v)}}>{fmt(v10)}</div>}
                                </td>;
                            })}
                            <td style={{padding:"5px 7px",textAlign:"right",background:doHeat?heat(rng.composites?.get(row.id)||0,rng.composite[0],rng.composite[1]):"transparent",color:C.tx,fontWeight:700,borderLeft:`1px solid ${C.bdr2}`}}>
                                {rng.composites?.get(row.id)||0}
                                {showOldRow&&rng.composites10?.get(row.id)!=null&&<div style={{fontSize:8,color:oldCol(rng.composites10.get(row.id),rng.composites.get(row.id)||0)}}>{rng.composites10.get(row.id)}</div>}
                            </td>
                            <td style={{padding:"5px 7px",textAlign:"right",background:doHeat?heat(row.ewpt,rng.ewpt[0],rng.ewpt[1]):"transparent",color:C.tx}}>
                                {row.ewpt.toFixed(3)}
                                {showOldRow&&row.ewpt10!=null&&<div style={{fontSize:8,color:oldCol(row.ewpt10,row.ewpt)}}>{row.ewpt10.toFixed(3)}</div>}
                            </td>
                            <td style={{padding:"5px 7px",textAlign:"right",fontWeight:700,background:doHeat?heat(row.avgDpt,rng.avgDpt[0],rng.avgDpt[1]):"rgba(251,191,36,.04)",color:C.tx}}>
                                {fmt(row.avgDpt)}
                                {showOldRow&&row.avgDpt10!=null&&<div style={{fontSize:8,color:oldCol(row.avgDpt10,row.avgDpt)}}>{fmt(row.avgDpt10)}</div>}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
            {sorted.length===0&&<div style={{padding:40,textAlign:"center",color:C.vdim}}>No loadouts visible — open Loadouts panel</div>}
        </div>

        <div style={{padding:"5px 14px 8px",fontSize:9,color:C.vdim,flexShrink:0,borderTop:`1px solid ${C.bdr}`,lineHeight:1.6}}>
            Click headers to sort · Heat: blue=low amber=mid red=high
            · Score = 65% normalized AvgD/pt + 35% EW/pt × 100
            · Avg D/pt excl. Light · Meta tab shows % wounds removed (coloured by threshold)
            · Points verified Jun 2026 · v15: dynamic character radio, clean data layer, army-agnostic engine
        </div>
    </div>
    );
}
