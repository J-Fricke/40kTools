import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { C } from "./components/ui.jsx";
import FactionUnitEvaluator from "./tools/FactionUnitEvaluator.jsx";
import FightSimulator from "./tools/FightSimulator.jsx";

// ─── TOOL LOADER ────────────────────────────────────────────────────────────
// The suite's entry point: a persistent nav bar plus whichever tool is routed
// to. Adding tool #3 later means adding one NAV_ITEMS entry and one <Route> -
// nothing here needs to change shape to grow.
const NAV_ITEMS = [
    { to: "/evaluator", label: "Faction Unit Evaluator" },
    { to: "/fight-simulator", label: "Fight Simulator" },
];

function Nav() {
    return (
        <nav style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 14px",
            background: C.bg3, borderBottom: `1px solid ${C.bdr2}`, flexShrink: 0,
            fontFamily: "'Courier New',monospace"
        }}>
            <span style={{ fontSize: 9, color: C.amb, letterSpacing: ".3em", textTransform: "uppercase", marginRight: 12 }}>⚙ Kinhost Analytics</span>
            {NAV_ITEMS.map(item => (
                <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                    fontSize: 11, padding: "4px 10px", borderRadius: 4, textDecoration: "none",
                    color: isActive ? C.bg : C.sub, background: isActive ? C.amb : "transparent", fontWeight: isActive ? 700 : 400,
                })}>{item.label}</NavLink>
            ))}
        </nav>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
                <Nav />
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/evaluator" replace />} />
                        <Route path="/evaluator" element={<FactionUnitEvaluator />} />
                        <Route path="/fight-simulator" element={<FightSimulator />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}
