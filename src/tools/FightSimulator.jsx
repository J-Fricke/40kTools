import { useMemo, useEffect } from "react";
import { calcWs } from "../core/engine.js";
import { FACTIONS, FACTION_KEYS } from "../core/registry.js";
import { buildCombo } from "../core/combo.js";
import { getDetBuff, applyBuff } from "../core/buffs.js";
import { usePersistedState, serializeWithSets, deserializeWithSets } from "../hooks/usePersistedState.js";
import { C, Btn } from "../components/ui.jsx";
import FactionConfigPanel from "../components/FactionConfigPanel.jsx";

// Each faction module now exports DEFENSE (per-uid Toughness/Vehicle/Monster,
// sourced from the real datasheets in ref/) - see the DEFENSE export at the
// top of each src/factions/*.js file. This lets a unit act as a TARGET, which
// nothing before Fight Simulator ever needed.
const emptySide = faction => ({
    faction, unitId: null, charKey: "none",
    activeDets: new Set(), detOpts: {},
});

const DEFAULT_STATE = {
    sideA: emptySide("greyknights"),
    sideB: emptySide("custodes"),
    inclShoot: true,
    inclMelee: true,
};

const toggleInSet = (set, item) => { const n = new Set(set); n.has(item) ? n.delete(item) : n.add(item); return n; };

function resolveSide(side, { inclShoot, inclMelee }) {
    const fd = FACTIONS[side.faction];
    const unit = side.unitId ? fd.units.find(u => u.id === side.unitId) : null;
    if (!unit) return null;
    const char = fd.chars[side.charKey] || fd.chars.none;
    const combo = buildCombo(unit, char);
    const buff = getDetBuff(unit, side.charKey, { activeDets: side.activeDets, detOpts: side.detOpts, DETACHMENTS: fd.dets });
    const bh = (side.faction === "votann") ? 1 : 0; // Votann YP assumed active, same default as the Evaluator
    const unitBh = bh + buff.bhBonus;
    const sWs = inclShoot ? applyBuff(combo.sWs, buff, true) : null;
    const mWs = inclMelee ? applyBuff(combo.mWs, buff, false) : null;
    const pts = combo.pts + buff.enhancementPts;
    const totalWounds = unit.m * combo.W;
    const def = fd.defense[unit.uid] || { T: 6, veh: false, mon: false };
    const target = { T: def.T, sv: combo.sv, inv: combo.inv, fnp: combo.fnp, veh: def.veh, mon: def.mon };
    const keyword = def.veh ? "Vehicle" : def.mon ? "Monster" : "Infantry";
    return { unit, combo, buff, unitBh, sWs, mWs, pts, totalWounds, target, def, keyword, label: `${unit.unit}${char.name !== "None" ? ` +${char.name}` : ""} — ${unit.label}` };
}

function dmgPerRound(attacker, defenderTarget, bh) {
    const s = attacker.sWs ? calcWs(attacker.sWs, defenderTarget, bh) : 0;
    const m = attacker.mWs ? calcWs(attacker.mWs, defenderTarget, bh) : 0;
    return s + m;
}

function SidePanel({ label, side, onChange, dpCap = 3 }) {
    const fd = FACTIONS[side.faction];
    const setSide = patch => onChange({ ...side, ...patch });
    return (
        <div style={{ flex: "1 1 380px", minWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: C.tx }}>{label}</span>
                <select value={side.faction} onChange={e => onChange(emptySide(e.target.value))}
                    style={{ fontSize: 11, padding: "2px 6px", background: C.bg3, color: C.tx, border: `1px solid ${C.bdr2}`, borderRadius: 3, cursor: "pointer" }}>
                    {FACTION_KEYS.map(f => <option key={f} value={f}>{FACTIONS[f].label}</option>)}
                </select>
            </div>
            <FactionConfigPanel
                faction={side.faction} fd={fd} singleSelect
                visibleIds={side.unitId ? new Set([side.unitId]) : new Set()}
                onToggleVisible={rawId => setSide({ unitId: rawId, charKey: "none" })}
                onToggleUidGroup={() => {}}
                charSel={{ [side.unitId]: new Set([side.charKey]) }}
                onToggleChar={(rawId, ck) => setSide({ charKey: ck })}
                activeDets={side.activeDets}
                onToggleDet={detId => setSide({ activeDets: toggleInSet(side.activeDets, detId) })}
                onClearDets={() => setSide({ activeDets: new Set() })}
                dpCap={dpCap}
                detOpts={side.detOpts}
                onSetDetOpt={(detId, optKey) => setSide({ detOpts: { ...side.detOpts, [detId]: optKey } })}
            />
        </div>
    );
}

export default function FightSimulator() {
    const [state, setState, reset] = usePersistedState(
        "40ktools.fightsim", DEFAULT_STATE,
        { serialize: serializeWithSets, deserialize: deserializeWithSets }
    );
    const { sideA, sideB, inclShoot, inclMelee } = state;
    const update = patch => setState(prev => ({ ...prev, ...patch }));
    const toggleShoot = () => { if (inclShoot && !inclMelee) return; update({ inclShoot: !inclShoot }); };
    const toggleMelee = () => { if (inclMelee && !inclShoot) return; update({ inclMelee: !inclMelee }); };

    useEffect(() => { document.title = "Fight Simulator · 40kTools"; }, []);

    const resolvedA = useMemo(() => resolveSide(sideA, { inclShoot, inclMelee }), [sideA, inclShoot, inclMelee]);
    const resolvedB = useMemo(() => resolveSide(sideB, { inclShoot, inclMelee }), [sideB, inclShoot, inclMelee]);

    let result = null;
    if (resolvedA && resolvedB) {
        const dmgAtoB = dmgPerRound(resolvedA, resolvedB.target, resolvedA.unitBh);
        const dmgBtoA = dmgPerRound(resolvedB, resolvedA.target, resolvedB.unitBh);
        const roundsAKillsB = dmgAtoB > 0 ? resolvedB.totalWounds / dmgAtoB : Infinity;
        const roundsBKillsA = dmgBtoA > 0 ? resolvedA.totalWounds / dmgBtoA : Infinity;
        const winner = roundsAKillsB === roundsBKillsA ? "tie" : (roundsAKillsB < roundsBKillsA ? "A" : "B");
        result = { dmgAtoB, dmgBtoA, roundsAKillsB, roundsBKillsA, winner };
    }

    const fmtR = v => v === Infinity ? "—" : v.toFixed(2);

    return (
        <div style={{ fontFamily: "'Courier New',monospace", background: C.bg, minHeight: "100%", color: C.tx, fontSize: 12 }}>
            <div style={{ padding: "10px 14px 4px" }}>
                <h1 style={{ fontSize: 15, fontWeight: 900, margin: "2px 0", letterSpacing: "-.02em" }}>Fight Simulator</h1>
            </div>

            <div style={{ padding: "6px 14px 8px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", borderBottom: `1px solid ${C.bdr}` }}>
                <div><div style={{ fontSize: 9, color: C.vdim, marginBottom: 3, textTransform: "uppercase" }}>Phase</div>
                    <div style={{ display: "flex", gap: 3 }}>
                        <Btn on={inclShoot} click={toggleShoot} col={C.bl} disabled={inclShoot && !inclMelee}>Shooting</Btn>
                        <Btn on={inclMelee} click={toggleMelee} col={C.grn} disabled={inclMelee && !inclShoot}>Melee</Btn>
                    </div></div>
                <button onClick={reset} style={{ fontSize: 10, background: "none", border: `1px solid ${C.bdr2}`, color: C.dim, cursor: "pointer", padding: "3px 8px", borderRadius: 3 }}>Reset</button>
            </div>

            <div style={{ padding: "10px 14px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <SidePanel label="Side A" side={sideA} onChange={s => update({ sideA: s })} />
                <SidePanel label="Side B" side={sideB} onChange={s => update({ sideB: s })} />
            </div>

            <div style={{ padding: "10px 14px" }}>
                {!result && <div style={{ color: C.vdim, fontSize: 11 }}>Pick a unit for both sides to see the matchup.</div>}
                {result && (
                    <div style={{ border: `1px solid ${C.bdr2}`, borderRadius: 5, background: C.bg2, padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
                            <div>
                                <div style={{ fontSize: 10, color: C.dim }}>Side A — {resolvedA.label} ({resolvedA.pts}pts, {resolvedA.totalWounds}W, T{resolvedA.def.T} {resolvedA.keyword})</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: result.winner === "A" ? C.grn : C.tx }}>
                                    {result.dmgAtoB.toFixed(2)} dmg/round to Side B → kills it in {fmtR(result.roundsAKillsB)} rounds
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: C.dim }}>Side B — {resolvedB.label} ({resolvedB.pts}pts, {resolvedB.totalWounds}W, T{resolvedB.def.T} {resolvedB.keyword})</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: result.winner === "B" ? C.grn : C.tx }}>
                                    {result.dmgBtoA.toFixed(2)} dmg/round to Side A → kills it in {fmtR(result.roundsBKillsA)} rounds
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: C.amb }}>
                            {result.winner === "tie" ? "Even trade — both sides kill each other at the same rate." :
                                `${result.winner === "A" ? "Side A" : "Side B"} wins — kills the opponent first.`}
                        </div>
                    </div>
                )}
                <div style={{ marginTop: 10, fontSize: 9, color: C.vdim, lineHeight: 1.6 }}>
                    "Rounds to kill" = total wounds ÷ expected damage per round - a time-to-kill approximation,
                    not a full dice simulation. It ignores who charges/strikes first, assumes output stays
                    constant as models die, and (for units with an attached character) only tracks the base
                    unit's own wound pool, not the character's separately.
                </div>
            </div>
        </div>
    );
}
