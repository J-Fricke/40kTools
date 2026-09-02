# Work: Importer coverage audit + named-variant slot fix

## Metadata

**Plan:** `plans/importer-coverage-audit.md`
**Story:** `stories/importer-coverage-audit.md`
**Started:** 2026-09-01
**Master Agent:** Claude Code session (Sonnet 5), branch `importer-coverage-audit`
**Status:** COMPLETE

## Execution Summary

Single-session, single-agent execution (no subagent decomposition - the
work was small and tightly sequential, one person reading raw BSData trees
to verify each step). Closed GitHub issue #1's root cause (12 of the
originally-listed 21 units were real gaps, now fixed; the other 9 turned
out to be legitimately fixed-loadout on individual inspection) and built
the coverage-audit mechanism from issue #6 directly into `extractSlots.mjs`
rather than as a separate script, since it could use live raw-BSData
ground truth instead of the old data as an imprecise proxy.

## Task Board

| Task | Status | Depends On | Notes |
|---|---|---|---|
| P1 | COMPLETE | — | weaponHelpers.mjs extraction |
| P2 | COMPLETE | P1 | namedVariantSlot() |
| P3 | COMPLETE | P2 | buildFamily.mjs choice.entries |
| P4 | COMPLETE | P2 | coverage warnings |
| P5 | COMPLETE | P1-P4 | full verification |

# Task Logs

## P1 — Shared helpers extraction

**Status:** COMPLETE

### Files Changed

- `scripts/bsdata-import/weaponHelpers.mjs` — new: `resolveEntry`, `hasWeaponProfile`, `directWeaponEntries`
- `scripts/bsdata-import/extractBase.mjs` — now imports from weaponHelpers instead of local copies

### Verification

- `npx vite build` — PASS (not directly affected, confirms no import breakage elsewhere)

---

## P2 — namedVariantSlot() + extractSlots.mjs

**Status:** COMPLETE

### Files Changed

- `scripts/bsdata-import/extractSlots.mjs` — added `namedVariantSlot()`, wired into `walk()`'s else-branch

### Verification

- Re-ran `sync.mjs` against freshly-fetched BSData for all 4 factions
- Inspected Custodian Guard's generated JSON directly: base = Guardian
  Spear variant, 1 slot with 2 alternates (Sentinel Blade, Vexilla
  variant), pick 0-2 — matches the real datasheet's structure
- 21 -> 9 units with zero slots after this change (12 real fixes)

### Outputs for Downstream Tasks

- `namedVariantSlot()` choices carry `entries` (plural) instead of the
  original shape's single `entry` — P3 depends on this.

---

## P3 — buildFamily.mjs choice.entries support

**Status:** COMPLETE

### Files Changed

- `scripts/bsdata-import/buildFamily.mjs` — choice resolution now accepts `entries` or `entry`

### Verification

- Custodian Guard's generated sWs/mWs traced back to the exact raw
  characteristics: found an apparent anomaly (Sentinel Blade choice has
  an sWs entry identical to the base Guardian Spear's), investigated the
  raw JSON directly, confirmed real (Sentinel Blade genuinely has both a
  melee AND ranged profile in BSData) — not a bug, documented in this file
  so it isn't re-investigated as a false alarm later.

---

## P4 — Coverage-warning signal

**Status:** COMPLETE

### Files Changed

- `scripts/bsdata-import/extractSlots.mjs` — `warnings` output
- `scripts/bsdata-import/convertFaction.mjs` — folds warnings into `gaps`

### Verification

- Re-ran `sync.mjs`: 48 -> 69 total gaps (21 new warnings, 0 lost/changed
  from the pre-existing 48)
- Confirmed the 21 flagged units are real (spot-checked Cthonian Beserks'
  raw tree — genuinely has an unresolved weapon choice, not a false
  positive)

### Outputs for Downstream Tasks

- 21 units now have a documented, specific reason they're incomplete
  (`KNOWN_GAPS.md`, "Coverage-audit mechanism" section) — ready for
  individual review in a future pass, not blocking anything today.

---

## P5 — Full regression verification

**Status:** COMPLETE

### Verification

- `npx vite build` — PASS, clean, no errors
- Numeric sanity script (`sanity_check.mjs`, calls `resolveBuild`/
  `buildCombo`/`getDetBuff`/`calcWs` directly, the same functions the UI
  uses): Paladin Squad, GMND, Hearthkyn Warriors all produced IDENTICAL
  output before/after this change — zero regression on previously-working
  units.

# Deviations From Plan

| Task | Planned (Story R1/R2) | Actual | Reason |
|---|---|---|---|
| R1/R2 | Compare generated data against OLD hand-authored `src/factions/*.js` data as a coverage baseline | Compare against each unit's own RAW BSData tree, live, during extraction itself | User pushed back mid-Story-review: the old data is itself an imprecise proxy (it predates the current wargear model), while the raw BSData tree is provably readable ground truth (demonstrated on Custodian Guard) — a strictly better baseline, and cheaper to implement (no separate script/baseline-extraction step needed, it's a byproduct of the walk `extractSlots.mjs` already does) |

# Final Verification

## Story Acceptance Criteria

| Criterion | Result | Evidence |
|---|---|---|
| Re-discovers Custodian Guard/Purifier/etc. without hardcoding | PASS | `namedVariantSlot()` is unit-agnostic; fixed 12 units it was never told about by name |
| Covers all 74 units | PASS | Runs across every uid in every faction's nameMap unconditionally |
| Distinguishes flagged vs. fine | PASS | `gaps` array only lists flagged units |
| Deterministic | PASS | Same BSData fetch, same output, run twice |
| Human-readable report | PASS | `KNOWN_GAPS.md` + `sync.mjs` console output |

## Repository Checks

- [x] Build passes (`npx vite build`)
- [x] No unrelated user changes overwritten (worked on a dedicated branch, `importer-coverage-audit`)
- [x] Story acceptance criteria reviewed

# Final State

**Status:** COMPLETE

## Implemented

- Named-model-variant BSData shape recognized (`namedVariantSlot()`), fixing 12 of the 21 units in GitHub issue #1.
- A live coverage-audit signal built into `extractSlots.mjs`/`convertFaction.mjs`, fulfilling GitHub issue #6's goal without a separate script.

## Not Completed

- The 21 newly-flagged units (a third BSData shape — single-model named-weapon-combo swaps, plus deeper-nested squad cases like Cthonian Beserks) — deliberately left for individual review rather than rushed, per the Plan's stated risk mitigation.
- GitHub issues #1 and #6 not yet updated/closed on GitHub itself — pending.

## Remaining Risks / Follow-ups

- `namedVariantSlot()`'s heuristics could still misfire on a unit shaped differently than what's been seen so far — mitigated by the warnings signal catching that case automatically on the next sync.
- The 9 units that turned out to be legitimately fixed-loadout (originally miscounted as part of issue #1's 21) mean that issue's original list was itself imprecise — worth remembering the pattern-matched list was a starting hypothesis, not a verified inventory, next time a similar count is quoted.

## Final Commits

- Pending (this file written before the commit — see git log after this Work file lands).

## Master Agent Closeout

Real, verified progress on both issues #1 and #6 in one pass, without
introducing new mechanical debt (the coverage-warning system means the
NEXT unrecognized shape reports itself automatically rather than requiring
another round of manual UI testing to discover, which was the whole point
of this Story).
