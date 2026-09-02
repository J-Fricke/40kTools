import { useMemo, useEffect, useState } from "react";
import { calcWs, ewCalc } from "../core/engine.js";
import { TARGETS } from "../core/targets.js";
import { FACTIONS, FACTION_KEYS } from "../core/registry.js";
import { COMPOSABLE } from "../core/composableRegistry.js";
import { resolveBuild, describeLoadout } from "../core/composableUnit.js";
import { buildCombo } from "../core/combo.js";
import { getDetBuff, applyBuff } from "../core/buffs.js";
import { usePersistedState, serializeWithSets, deserializeWithSets } from "../hooks/usePersistedState.js";
import { C, Btn, heat, CollapsibleRow } from "../components/ui.jsx";
import ComposableFactionPicker from "../components/ComposableFactionPicker.jsx";

const toggleInSet = (set, item) => { const n = new Set(set); n.has(item) ? n.delete(item) : n.add(item); return n; };
const newEntryId = () => `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_STATE = {
    compareList: [],          // [{id, faction, uid, modelCount, slotChoices, charKey}]
    draftByFaction: {},       // faction -> {uid: {modelCount, slotChoices, charKey}}
    activeDetsByFaction: {},  // faction -> Set<detId> - shared across every added instance of that faction
    detOptsByFaction: {},     // faction -> {detId: optKey}
    tgrp: "meta",
    yp: true,
    inclShoot: true,
    inclMelee: true,
    // Default sort: best against the hardest-to-remove meta target (leftmost
    // in TARGETS - see the ordering comment there) rather than a hardcoded
    // key, so this stays correct if that ordering ever changes.
    sort: { k: TARGETS.find(t => t.grp === "meta")?.key || "ctan", d: 1 },
    killPctSort: true,
    doHeat: true,
    showFactions: true,
    enemyAp: 0,
};

export default function FactionUnitEvaluator() {
    const [state, setState, reset] = usePersistedState(
        "40ktools.evaluator.v2", DEFAULT_STATE,
        { serialize: serializeWithSets, deserialize: deserializeWithSets }
    );
    const {
        compareList, draftByFaction, activeDetsByFaction, detOptsByFaction,
        tgrp, yp, inclShoot, inclMelee, sort, killPctSort, doHeat, enemyAp,
    } = state;
    const showFactions = state.showFactions;

    const update = patch => setState(prev => ({ ...prev, ...patch }));

    useEffect(() => { document.title = "Faction Unit Evaluator · 40kTools"; }, []);

    // A faction contributes table rows once it has at least one compare-list
    // entry - there's no separate "filter" concept, the faction accordion
    // below both configures units AND implicitly determines what's in the table.
    const activeFactions = FACTION_KEYS.filter(f => compareList.some(e => e.faction === f));

    // Faction accordion rows: open only if they already have an entry, same
    // convention the old picker used.
    const [expandedFactions, setExpandedFactions] = useState(() => new Set(activeFactions));
    const toggleFactionExpanded = f => setExpandedFactions(p => toggleInSet(p, f));

    const setDraft = (faction, uid, draft) => {
        const facDrafts = draftByFaction[faction] || {};
        update({ draftByFaction: { ...draftByFaction, [faction]: { ...facDrafts, [uid]: draft } } });
    };
    const addToCompareList = (faction, uid, draft) => {
        update({ compareList: [...compareList, { id: newEntryId(), faction, uid, ...draft }] });
    };
    const removeFromCompareList = id => update({ compareList: compareList.filter(e => e.id !== id) });

    const toggleDet = (faction, detId) => {
        const cur = activeDetsByFaction[faction] || new Set();
        update({ activeDetsByFaction: { ...activeDetsByFaction, [faction]: toggleInSet(cur, detId) } });
    };
    const clearDets = faction => update({ activeDetsByFaction: { ...activeDetsByFaction, [faction]: new Set() } });
    const setDetOpt = (faction, detId, optKey) => {
        const cur = detOptsByFaction[faction] || {};
        update({ detOptsByFaction: { ...detOptsByFaction, [faction]: { ...cur, [detId]: optKey } } });
    };

    const toggleShoot = () => { if (inclShoot && !inclMelee) return; update({ inclShoot: !inclShoot }); };
    const toggleMelee = () => { if (inclMelee && !inclShoot) return; update({ inclMelee: !inclMelee }); };

    const tgts = TARGETS.filter(t => t.grp === tgrp);
    const bhFor = faction => (yp && faction === "votann") ? 1 : 0;

    const rows = useMemo(() => compareList.map(entry => {
        const { faction, uid, modelCount, slotChoices, charKey } = entry;
        const fd = FACTIONS[faction];
        const family = COMPOSABLE[faction]?.[uid];
        if (!family) return null; // stale entry (e.g. composable data changed) - skip rather than crash
        const activeDets = activeDetsByFaction[faction] || new Set();
        const detOpts = detOptsByFaction[faction] || {};
        const bh = bhFor(faction);

        const built = resolveBuild(family, { modelCount, slotChoices });
        const basePts = family.models[modelCount] ?? 0;
        const asUnit = { pts: basePts + built.ptsDelta, W: built.W, sv: built.sv, inv: built.inv, fnp: built.fnp, sWs: built.sWs, mWs: built.mWs, m: modelCount, uid };
        const char = fd.chars[charKey] || fd.chars.none;
        const combo = buildCombo(asUnit, char);
        const buff = getDetBuff(asUnit, charKey, { activeDets, detOpts, DETACHMENTS: fd.dets });
        const unitBh = bh + buff.bhBonus;
        const sWs = applyBuff(combo.sWs, buff, true);
        const mWs = applyBuff(combo.mWs, buff, false);
        const effectivePts = combo.pts + buff.enhancementPts;

        const vals = {}, rawVals = {};
        tgts.forEach(t => {
            const s = inclShoot ? calcWs(sWs, t, unitBh) : 0;
            const m = inclMelee ? calcWs(mWs, t, unitBh) : 0;
            const raw = s + m;
            rawVals[t.key] = raw;
            vals[t.key] = raw / effectivePts * 100;
        });
        const ew2 = combo.ew2 && buff.kahlW > 0 ? { ...combo.ew2, W: combo.ew2.W + buff.kahlW } : combo.ew2;
        const eApUnit = enemyAp + (combo.eApMod || 0);
        const ew = ewCalc(modelCount * combo.W, combo.sv, combo.inv, combo.fnp, eApUnit)
            + (ew2 ? ewCalc(ew2.m * ew2.W, ew2.sv, ew2.inv, ew2.fnp, eApUnit) : 0);
        const scoreTgts = tgts.filter(t => !t.scoreExclude);
        const arr = scoreTgts.map(t => vals[t.key]);
        const ewpt = ew / effectivePts;
        const avgDpt = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        return {
            id: entry.id, faction, uid, unit: family.unit, m: modelCount,
            uc: fd.uc[uid] || C.dim,
            pts: effectivePts,
            label: describeLoadout(family, { modelCount, slotChoices }),
            charLabel: combo.charLabel,
            vals, rawVals, ew, ewpt, avgDpt,
        };
    }).filter(Boolean), [compareList, tgrp, yp, inclShoot, inclMelee, activeDetsByFaction, detOptsByFaction, enemyAp]);

    const rng = useMemo(() => {
        const r = { ewpt: [Infinity, -Infinity], avgDpt: [Infinity, -Infinity], composite: [Infinity, -Infinity] };
        tgts.forEach(t => { r[t.key] = [Infinity, -Infinity]; });
        rows.forEach(row => {
            tgts.forEach(t => {
                const v = row.vals[t.key];
                r[t.key][0] = Math.min(r[t.key][0], v); r[t.key][1] = Math.max(r[t.key][1], v);
            });
            r.ewpt[0] = Math.min(r.ewpt[0], row.ewpt); r.ewpt[1] = Math.max(r.ewpt[1], row.ewpt);
            r.avgDpt[0] = Math.min(r.avgDpt[0], row.avgDpt); r.avgDpt[1] = Math.max(r.avgDpt[1], row.avgDpt);
        });
        const composites = new Map();
        rows.forEach(row => {
            const ne = r.ewpt[1] > r.ewpt[0] ? (row.ewpt - r.ewpt[0]) / (r.ewpt[1] - r.ewpt[0]) : 0;
            const nd = r.avgDpt[1] > r.avgDpt[0] ? (row.avgDpt - r.avgDpt[0]) / (r.avgDpt[1] - r.avgDpt[0]) : 0;
            const c = Math.round((nd * .65 + ne * .35) * 100);
            composites.set(row.id, c);
            r.composite[0] = Math.min(r.composite[0], c); r.composite[1] = Math.max(r.composite[1], c);
        });
        return { ...r, composites };
    }, [rows, tgts]);

    const sorted = [...rows].sort((a, b) => {
        const k = sort.k;
        const getV = (r) => {
            if (k === "ewpt") return r.ewpt;
            if (k === "avgDpt") return r.avgDpt;
            if (k === "pts") return r.pts;
            if (k === "m") return r.m;
            if (k === "composite") return rng?.composites?.get(r.id) || 0;
            if (k === "unit" || k === "label") return 0;
            if (killPctSort) { const t = tgts.find(t => t.key === k); if (t?.wounds) return (r.rawVals[k] || 0) / t.wounds * 100; }
            return (r.vals && r.vals[k]) || 0;
        };
        const va = getV(a), vb = getV(b);
        const round2 = v => Math.round(v * 100) / 100;
        const primary = (round2(vb) - round2(va)) * sort.d;
        if (primary !== 0) return primary;
        if (k === "ewpt") return (round2(b.avgDpt) - round2(a.avgDpt)) * sort.d;
        return (round2(b.ewpt) - round2(a.ewpt)) * sort.d;
    });

    const clkSort = k => update({ sort: { k, d: sort.k === k && sort.d === 1 ? -1 : 1 } });
    const fmt = v => v < .005 ? "—" : v < 10 ? v.toFixed(2) : v.toFixed(1);

    const Th = ({ k, lbl, sub, left, title }) => (
        <th onClick={() => clkSort(k)} title={title} style={{
            padding: "5px 7px", cursor: "pointer", whiteSpace: "nowrap",
            background: sort.k === k ? C.bg3 : C.bg2, borderBottom: `2px solid ${sort.k === k ? C.bl : C.bdr}`,
            color: sort.k === k ? C.bl : C.sub, fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em",
            userSelect: "none", position: "sticky", top: 0, zIndex: 2, textAlign: left ? "left" : "right"
        }}>
            <div>{lbl}{sort.k === k ? (sort.d === 1 ? " ↓" : " ↑") : ""}</div>
            {sub && <div style={{ fontSize: 8, color: C.vdim }}>{sub}</div>}
        </th>
    );

    const phaseLabel = inclShoot && inclMelee ? "Shoot + Melee" : inclShoot ? "Shoot only" : "Melee only";
    const votannActive = activeFactions.includes("votann");

    return (
        <div style={{ fontFamily: "'Courier New',monospace", background: C.bg, minHeight: "100%", color: C.tx, display: "flex", flexDirection: "column", fontSize: 12 }}>
            <div style={{ padding: "10px 14px 4px", flexShrink: 0 }}>
                <h1 style={{ fontSize: 15, fontWeight: 900, margin: "2px 0", letterSpacing: "-.02em" }}>Faction Unit Evaluator
                    <span style={{ fontSize: 11, fontWeight: 400, color: C.dim, marginLeft: 10 }}>{phaseLabel}</span>
                </h1>
            </div>

            {/* ── CONTROL BAR ── */}
            <div style={{ padding: "6px 14px 8px", display: "flex", flexWrap: "wrap", gap: 8, flexShrink: 0, borderBottom: `1px solid ${C.bdr}` }}>
                <div><div style={{ fontSize: 9, color: C.vdim, marginBottom: 3, textTransform: "uppercase" }}>Targets</div>
                    <div style={{ display: "flex", gap: 3 }}>
                        <Btn on={tgrp === "std"} click={() => update({ tgrp: "std" })}>Standard</Btn>
                        <Btn on={tgrp === "meta"} click={() => update({ tgrp: "meta" })}>Meta</Btn>
                    </div></div>
                {votannActive && <div><div style={{ fontSize: 9, color: C.vdim, marginBottom: 3, textTransform: "uppercase" }}>Votann Yield Points</div>
                    <div style={{ display: "flex", gap: 3 }}>
                        <Btn on={yp} click={() => update({ yp: true })}>+1 Hit</Btn>
                        <Btn on={!yp} click={() => update({ yp: false })}>No YP</Btn>
                    </div></div>}
                <div><div style={{ fontSize: 9, color: C.vdim, marginBottom: 3, textTransform: "uppercase" }}>Phase</div>
                    <div style={{ display: "flex", gap: 3 }}>
                        <Btn on={inclShoot} click={toggleShoot} col={C.bl} disabled={inclShoot && !inclMelee}>Shooting</Btn>
                        <Btn on={inclMelee} click={toggleMelee} col={C.grn} disabled={inclMelee && !inclShoot}>Melee</Btn>
                    </div></div>
                <div><div style={{ fontSize: 9, color: C.vdim, marginBottom: 3, textTransform: "uppercase" }}>Enemy AP <span style={{ color: C.vdim }}>(EW/pt)</span></div>
                    <div style={{ display: "flex", gap: 3 }}>
                        {[0, -1, -2, -3].map(ap => (
                            <Btn key={ap} on={enemyAp === ap} click={() => update({ enemyAp: ap })} col={C.grn}>AP{ap}</Btn>
                        ))}
                    </div></div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "flex-end", paddingBottom: 1 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: C.dim }}>
                        <input type="checkbox" checked={doHeat} onChange={e => update({ doHeat: e.target.checked })} style={{ accentColor: C.amb }} />Heat
                    </label>
                    {tgrp === "meta" && <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: killPctSort ? C.grn : C.dim }}>
                        <input type="checkbox" checked={killPctSort} onChange={e => update({ killPctSort: e.target.checked })} style={{ accentColor: C.grn }} />Kill%
                    </label>}
                    <Btn on={showFactions} click={() => update({ showFactions: !showFactions })} col={C.pur}>{showFactions ? "▲ Hide Factions" : "▼ Show Factions"}</Btn>
                    <button onClick={reset} title="Reset all Evaluator settings to defaults"
                        style={{ fontSize: 10, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "3px 8px", borderRadius: 3 }}>Reset</button>
                </div>
            </div>

            {/* ── FACTION ACCORDION: browse units by opening a faction's own row -
                configure each via the Unit Builder, "Add to compare list" adds a
                row to the table below. The whole section can still be hidden
                entirely (not just each row collapsed) via the Hide/Show Factions
                button above, to reclaim full table height. ── */}
            {showFactions && <>
                <div style={{ padding: "4px 14px 0", display: "flex", alignItems: "center", gap: 8, background: C.bg2, borderTop: `1px solid ${C.bdr}` }}>
                    <span style={{ fontSize: 9, color: C.vdim, textTransform: "uppercase" }}>Factions</span>
                    <button onClick={() => setExpandedFactions(new Set(FACTION_KEYS))}
                        style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Expand all</button>
                    <button onClick={() => setExpandedFactions(new Set())}
                        style={{ fontSize: 9, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "1px 6px", borderRadius: 3 }}>Collapse all</button>
                </div>
                <div className="scroll-visible" style={{ padding: "4px 14px 8px", borderBottom: `1px solid ${C.bdr}`, background: C.bg2, maxHeight: 460, overflowY: "auto" }}>
                    {FACTION_KEYS.map(f => {
                        const fd = FACTIONS[f];
                        const entryCount = compareList.filter(e => e.faction === f).length;
                        const fDp = [...(activeDetsByFaction[f] || [])].reduce((a, id) => {
                            const d = fd.dets.find(d => d.id === id); return a + (d ? d.dp : 0);
                        }, 0);
                        return (
                            <CollapsibleRow key={f} isOpen={expandedFactions.has(f)} onToggle={() => toggleFactionExpanded(f)} indent={8}
                                header={<>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: entryCount > 0 ? C.tx : C.sub }}>{fd.label}</span>
                                    <span style={{ fontSize: 9, color: C.vdim }}>{Object.keys(COMPOSABLE[f] || {}).length} units</span>
                                    {entryCount > 0 && <span style={{ fontSize: 9, color: C.grn }}>{entryCount} in list</span>}
                                    {fDp > 0 && <span style={{ fontSize: 9, background: C.amb, color: C.bg, borderRadius: 3, padding: "0 4px" }}>{fDp}DP</span>}
                                </>}>
                                <ComposableFactionPicker
                                    faction={f} fd={fd}
                                    draftByUid={draftByFaction[f] || {}}
                                    onSetDraft={(uid, draft) => setDraft(f, uid, draft)}
                                    onAdd={(uid, draft) => addToCompareList(f, uid, draft)}
                                    activeDets={activeDetsByFaction[f] || new Set()}
                                    onToggleDet={detId => toggleDet(f, detId)}
                                    onClearDets={() => clearDets(f)}
                                    detOpts={detOptsByFaction[f] || {}}
                                    onSetDetOpt={(detId, optKey) => setDetOpt(f, detId, optKey)}
                                />
                            </CollapsibleRow>
                        );
                    })}
                </div>
            </>}

            {/* ── TABLE ── */}
            <div className="scroll-visible" style={{ flex: 1, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr>
                        <Th k="unit" lbl="Unit" left />
                        <Th k="label" lbl="Loadout" left />
                        <Th k="pts" lbl="Pts" />
                        <Th k="m" lbl="Mdl" />
                        {tgts.map(t => <Th key={t.key} k={t.key} lbl={t.label} sub={t.sub} title={t.title} />)}
                        <Th k="composite" lbl="Score" sub="65%dmg+35%dur" />
                        <Th k="ewpt" lbl="EW/pt" sub="dur/cost" />
                        <Th k="avgDpt" lbl="Avg D/pt" sub="excl. Light" />
                    </tr></thead>
                    <tbody>
                        {sorted.map((row, ri) => {
                            const uc = row.uc, isC = !!row.charLabel;
                            return (
                                <tr key={row.id} style={{ background: isC ? `${uc}0a` : (ri % 2 === 0 ? C.bg : C.bg2), borderBottom: `1px solid ${C.bdr}` }}>
                                    <td style={{ padding: "5px 8px", color: uc, fontWeight: 700, fontSize: 10, borderLeft: `2px solid ${uc}`, whiteSpace: "nowrap" }}>
                                        <button onClick={() => removeFromCompareList(row.id)} title="Remove from compare list"
                                            style={{ fontSize: 9, background: "none", border: "none", color: C.vdim, cursor: "pointer", marginRight: 5, padding: 0 }}>✕</button>
                                        {row.unit}{isC && <div style={{ fontSize: 8, color: C.pur }}>+{row.charLabel}</div>}
                                        <div style={{ fontSize: 8, color: C.vdim }}>{FACTIONS[row.faction].label}</div>
                                    </td>
                                    <td style={{ padding: "5px 8px", color: C.tx, whiteSpace: "nowrap", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{row.label}</td>
                                    <td style={{ padding: "5px 7px", textAlign: "right", color: C.amb, fontWeight: 700 }}>{row.pts}</td>
                                    <td style={{ padding: "5px 7px", textAlign: "right", color: C.sub }}>{row.m}</td>
                                    {tgts.map(t => {
                                        const v = row.vals[t.key];
                                        const pct = t.wounds ? Math.round(row.rawVals[t.key] / t.wounds * 100) : null;
                                        const pctStr = pct === null ? null : pct > 999 ? '>999%' : `${pct}%`;
                                        const pctCol = pct === null ? null : pct >= 150 ? '#c084fc' : pct >= 75 ? '#4ade80' : pct >= 50 ? '#fb923c' : '#f87171';
                                        return <td key={t.key} style={{ padding: "5px 7px", textAlign: "right", background: doHeat ? heat(v, rng[t.key][0], rng[t.key][1]) : "transparent", color: C.tx, fontVariantNumeric: "tabular-nums" }}>
                                            <div>{fmt(v)}{pctStr && <span style={{ fontSize: 9, fontWeight: 700, color: pctCol, marginLeft: 3 }}>({pctStr})</span>}</div>
                                        </td>;
                                    })}
                                    <td style={{ padding: "5px 7px", textAlign: "right", background: doHeat ? heat(rng.composites?.get(row.id) || 0, rng.composite[0], rng.composite[1]) : "transparent", color: C.tx, fontWeight: 700, borderLeft: `1px solid ${C.bdr2}` }}>
                                        {rng.composites?.get(row.id) || 0}
                                    </td>
                                    <td style={{ padding: "5px 7px", textAlign: "right", background: doHeat ? heat(row.ewpt, rng.ewpt[0], rng.ewpt[1]) : "transparent", color: C.tx }}>
                                        {row.ewpt.toFixed(3)}
                                    </td>
                                    <td style={{ padding: "5px 7px", textAlign: "right", fontWeight: 700, background: doHeat ? heat(row.avgDpt, rng.avgDpt[0], rng.avgDpt[1]) : "rgba(251,191,36,.04)", color: C.tx }}>
                                        {fmt(row.avgDpt)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {sorted.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.vdim }}>No units in the compare list — open a faction above, configure a unit, and add it</div>}
            </div>

            <div style={{ padding: "5px 14px 8px", fontSize: 9, color: C.vdim, flexShrink: 0, borderTop: `1px solid ${C.bdr}`, lineHeight: 1.6 }}>
                Click headers to sort · Heat: blue=low amber=mid red=high
                · Score = 65% normalized AvgD/pt + 35% EW/pt × 100
                · Avg D/pt excl. Light · Meta tab shows % wounds removed (coloured by threshold)
                · Settings persist locally per-browser · Reset clears this tool back to defaults
            </div>
        </div>
    );
}
