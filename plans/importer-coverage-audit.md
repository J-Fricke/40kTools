# Plan: Importer coverage audit + named-variant slot fix

## Status

Complete

## Source Story

`stories/importer-coverage-audit.md`

## Objective

Close the specific, root-caused named-model-variant gap (GitHub issue #1)
and build a durable, re-runnable coverage-audit signal into the importer
itself (issue #6), so future BSData shape gaps surface automatically on
the next `sync.mjs` run instead of requiring manual UI testing to find.

## Story Requirements Covered

| Requirement | Plan Coverage |
|---|---|
| R1 (revised) - baseline | Superseded: baseline is each unit's own raw BSData tree (read live during `extractSlots.mjs`'s walk), not the old hand-authored data. |
| R2 (revised) - comparison | `extractSlots.mjs`'s walk itself flags any 2+-child group that matched neither recognized shape and produced no slot - the comparison IS the extraction, not a separate pass. |
| R3 - human-readable report | `convertFaction.mjs` folds warnings into the same `gaps` array `sync.mjs` already prints/reports; `KNOWN_GAPS.md` documents the current list. |
| R4 - re-runnable, offline | Runs as part of every `sync.mjs` run (which does need network, to fetch BSData - but the audit logic itself needs no extra fetch beyond what sync already does). |

## Current-System Notes

`extractSlots.mjs` recognized one BSData shape (Paladin Squad: base model +
separate weapon-swap group) before this work. Investigation of Custodian
Guard's raw tree found a second, equally common shape: named,
already-fully-built model variants as siblings of the squad-size container,
with no inner swap group at all.

## Proposed Approach

1. Extract `resolveEntry`/`hasWeaponProfile`/`directWeaponEntries` into a
   new `weaponHelpers.mjs` shared by `extractSlots.mjs` and
   `extractBase.mjs` (they previously had a one-way dependency that would
   have become circular).
2. Add `namedVariantSlot()` to `extractSlots.mjs`: detect a group of 2+
   `type:"model"` children each resolving their own weapons directly:
   pick the "no ' with ' in the name" variant as base (mirroring
   `extractBase.mjs`'s existing heuristic), synthesize a slot from the
   rest.
3. Extend `buildFamily.mjs`'s choice resolution to accept `choice.entries`
   (plural - a variant can bundle more than one weapon-bearing upgrade)
   alongside the existing single `choice.entry`.
4. Add a `warnings` return value to `extractSlots.mjs`: any 2+-child group
   that matched neither shape and produced no slot beneath it. Thread into
   `convertFaction.mjs`'s existing `gaps` array.
5. Re-run `sync.mjs`, verify against real numbers (Paladin Squad math
   unchanged, Custodian Guard now has real slots), commit.

## Affected Areas

- `scripts/bsdata-import/weaponHelpers.mjs` - new, shared helpers.
- `scripts/bsdata-import/extractSlots.mjs` - `namedVariantSlot()`, `warnings` output.
- `scripts/bsdata-import/extractBase.mjs` - now imports shared helpers instead of local copies.
- `scripts/bsdata-import/buildFamily.mjs` - handles `choice.entries` (plural).
- `scripts/bsdata-import/convertFaction.mjs` - consumes `{slots, warnings}`, folds warnings into `gaps`.
- `src/core/composableData/*.json` - regenerated via `sync.mjs`.

## Data / API / State Changes

`extractSlots()`'s return type changed from `Array` to `{slots, warnings}`.
Only caller (`convertFaction.mjs`) updated; verified no other call sites
via `grep -rn "extractSlots" scripts/ src/`.

## Compatibility / Migration Considerations

None - this is a build-time import tool, not shipped app code. Composable
JSON output regenerated and verified numerically equivalent for units that
already worked (Paladin Squad, GMND, Hearthkyn Warriors spot-checked).

# Execution Graph

Single-lane, sequential (one person, one file set, no parallelism needed
or attempted - small enough not to warrant subagent decomposition).

# Tasks

### P1 — Shared helpers extraction

**Type:** Independent
**Files:** `scripts/bsdata-import/weaponHelpers.mjs` (new), `extractBase.mjs`
**Status:** COMPLETE

### P2 — namedVariantSlot() + extractSlots.mjs rewrite

**Type:** Depends on P1
**Files:** `scripts/bsdata-import/extractSlots.mjs`
**Status:** COMPLETE
**Verification:** re-ran `sync.mjs`, Custodian Guard's raw JSON inspected directly - correct base/choice split, correct pick counts.

### P3 — buildFamily.mjs choice.entries support

**Type:** Depends on P2
**Files:** `scripts/bsdata-import/buildFamily.mjs`
**Status:** COMPLETE
**Verification:** Custodian Guard's generated sWs/mWs cross-checked against the raw weapon profiles directly (found and resolved an apparent anomaly - Sentinel Blade genuinely has both a melee AND ranged profile in the real data, confirmed not a bug).

### P4 — Coverage-warning signal

**Type:** Depends on P2
**Files:** `scripts/bsdata-import/extractSlots.mjs`, `convertFaction.mjs`
**Status:** COMPLETE
**Verification:** re-ran `sync.mjs`, produced 21 warnings across all 4 factions - a real, previously-undetected set of units, none hardcoded.

### P5 — Full regression verification

**Type:** Final verification, depends on P1-P4
**Status:** COMPLETE
**Verification:** `npx vite build` clean; numeric sanity script (Paladin Squad, GMND, Hearthkyn Warriors) produced identical output to before this change; gap count went from 48 (before) to 69 (48 unchanged fallback gaps + 21 new coverage warnings, zero regressions).

# Testing / Verification Strategy

- Repository health: `npx vite build` (clean).
- Data correctness: standalone `node` script (outside Vite, since Node
  needs explicit JSON import attributes Vite doesn't require) directly
  calling `resolveBuild`/`buildCombo`/`getDetBuff`/`calcWs` - the exact
  functions the UI calls - against known units, comparing before/after.
- Manual raw-data cross-check: Custodian Guard's generated weapons traced
  back to the exact raw BSData characteristics that produced them.

# Acceptance-Criteria Verification

| Story Acceptance Criterion | Verification Method |
|---|---|
| Re-discovers known-suspect units without hardcoding | `namedVariantSlot()` is a general shape-detector; ran against Custodian Guard, Allarus, etc. via the normal `sync.mjs` path with no unit-specific code |
| Covers all 74 units | `sync.mjs` runs every uid in every faction's `nameMap`, unconditionally |
| Distinguishes flagged vs. fine | `gaps` array only contains flagged units; the other ~53 units print nothing |
| Deterministic, no live-network reliance for the audit logic itself | The audit runs inside the same walk `sync.mjs` already does per run; re-running against the same fetched data is deterministic |
| Human-readable report | `KNOWN_GAPS.md` updated with the current warning list; `sync.mjs`'s console output already prints each one |

# Risks

- **Risk:** `namedVariantSlot()`'s heuristics (the "no ' with ' in the
  name" base-picking rule, requiring ALL children to be `type:"model"`
  with non-empty direct weapons) could misfire on a unit shaped
  differently than Custodian Guard/Paladin.
  - **Mitigation:** the new `warnings` signal catches exactly this failure
    mode going forward - a unit that doesn't fit either shape now reports
    itself instead of silently returning nothing.

# Open Technical Questions

- The 21 units now flagged by the coverage-warning mechanism represent a
  THIRD BSData shape (single-model "named weapon-combo" swaps, plus a
  couple of squads - Cthonian Beserks notably - with deeper nesting than
  either recognized shape handles). Not fixed in this Plan - explicitly
  left as follow-up (see `KNOWN_GAPS.md`), since rushing a third
  shape-detector without the same care taken for the first two risks
  producing wrong data, not just missing data.

# Execution Instructions

Already executed - see `work/importer-coverage-audit.work.md` for the
record. Re-running `sync.mjs` after any future extraction change will
show whether the current 21-item warning list shrinks or grows.
