import { useState, useEffect, useRef } from "react";

// ─── LOCALSTORAGE-BACKED STATE ──────────────────────────────────────────────
// Generic persisted-state hook: reads `key` from localStorage on mount (falling
// back to defaultValue if absent/invalid), and writes back on every change.
// Values containing Sets/Maps need custom serialize/deserialize since JSON
// doesn't know about them - pass those in via options.
//
// Chosen over cookies deliberately: this app has no server, nothing here is
// ever transmitted anywhere, so localStorage (same-origin, ~5-10MB, simple
// get/set) is the right tool rather than a mechanism built for client->server
// transmission. See project_40ktools_suite_architecture memory for the fuller
// reasoning.
export function usePersistedState(key, defaultValue, { serialize, deserialize } = {}) {
    const ser = serialize || JSON.stringify;
    const deser = deserialize || JSON.parse;
    const loadedRef = useRef(false);

    const [state, setState] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw == null) return defaultValue;
            return deser(raw);
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        // Skip the very first render's write-back so we don't immediately
        // re-serialize what we just deserialized (harmless, but pointless).
        if (!loadedRef.current) { loadedRef.current = true; return; }
        try { localStorage.setItem(key, ser(state)); } catch { /* storage unavailable/full - fail quietly, in-memory state still works */ }
    }, [state, key]);

    const reset = () => {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
        setState(defaultValue);
    };

    return [state, setState, reset];
}

// Helpers for the Set<->Array conversion needed when a persisted blob contains
// Sets (vis, activeDets-per-faction, etc.) - JSON.stringify/parse don't handle
// Sets natively, so state that contains them should use these as the
// serialize/deserialize pair instead of the JSON.stringify/parse default.
export function serializeWithSets(state) {
    return JSON.stringify(state, (_k, v) => (v instanceof Set ? { __set: [...v] } : v));
}
export function deserializeWithSets(raw) {
    return JSON.parse(raw, (_k, v) => (v && typeof v === "object" && v.__set ? new Set(v.__set) : v));
}
