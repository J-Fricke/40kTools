# Story: Systematic coverage audit of the BSData importer

## Status

Complete (see `work/importer-coverage-audit.work.md`) - R1/R2 superseded
during planning discussion: comparing against the OLD hand-authored data
(an imprecise proxy) was replaced with comparing against each unit's own
RAW BSData tree directly (ground truth, already provably readable - see
the Custodian Guard investigation), built directly into `extractSlots.mjs`
as a `warnings` output rather than a separate script.

## Summary

The BSData->composable importer (`scripts/bsdata-import/`) converted all 74
units across the 4 tracked factions with zero hard failures, but hands-on
testing of the resulting Unit Builder (in Fight Simulator) found real,
silent option losses one unit at a time - Custodian Guard, Purifier Squad,
and Einhyr Hearthguard all turned out to have fewer wargear options in the
generated `src/core/composableData/*.json` than the unit actually has in
the real game. Two of these (Custodian Guard's pattern, affecting 21 units)
are already root-caused and tracked as GitHub issue #1. This Story is about
finding out whether there are MORE units like this that haven't been hit
yet, without relying on the user to discover them by clicking through the
UI one at a time.

## Problem

The importer's correctness was validated against one unit shape (Paladin
Squad) and declared done once all 74 units converted without throwing an
error. "Converted without erroring" and "converted with all the real
options" turned out to be different claims - a unit can silently end up
with fewer slots/choices than the real game allows, and nothing in the
pipeline flags that as a problem, because there's no automated check
comparing the *richness* of what came out to what should have come out.
The user explicitly said manual unit-by-unit testing to find these is "too
hard" and asked for it to stop.

## User / Product Context

Solo hobbyist project (Joshua), tracking 4 factions (Grey Knights,
Adeptus Custodes, Leagues of Votann, Chaos Knights) for his own army-list
evaluation tools. He is the only user and the only tester. He does not want
to be the QA process for the importer - if there's a way to check coverage
programmatically before he touches the UI again, that's strongly preferred
over him finding gaps by hand.

## Desired Outcome

A repeatable, scriptable check that, for every one of the 74 composable
units, flags whether its generated wargear data (`slots`/`choices` in
`src/core/composableData/*.json`) looks meaningfully thinner than what the
unit had before the BSData conversion (the old hand-authored loadout rows
in `src/factions/*.js`). Running it produces a clear list of "these units
are suspect, go look at them" rather than requiring anyone to manually
click through the Unit Builder to notice something's missing.

This is a diagnostic tool, not a guarantee of 100% correctness - a
unit that passes the check can still have subtler issues (that's what
issue #6's downstream fixes and the individual per-unit reviews in issues
#2/#8 are for). The goal is to stop *silent, structural* option loss from
going unnoticed, the specific failure mode already proven to exist twice.

## Requirements

### R1 — Baseline extraction from old hand-authored data

For each uid in each faction, derive a coverage baseline from the OLD
`src/factions/*.js` UNITS array: how many distinct loadout rows existed for
that uid, and (where derivable) how many distinct weapon profiles appeared
across those rows for a given model count. This is the "what we used to be
able to represent" signal, not a claim that the old data was itself
complete against the real rules.

### R2 — Coverage comparison against the new composable data

For each uid, compare the baseline from R1 against the new
`src/core/composableData/*.json` family's `slots`/`choices`: number of
slots, number of choices per slot, number of distinct weapon profiles
reachable across all choices. Flag a unit as suspect when the new data
looks structurally thinner (e.g. zero slots where the old data had
multiple distinct loadout rows implying real options existed, or
materially fewer distinct weapon profiles reachable).

### R3 — Human-readable report

Produce output (console and/or a markdown file under
`scripts/bsdata-import/`) listing every flagged unit, the faction, the
uid, and a short "why flagged" reason (e.g. "0 slots, old data had 6
loadout rows"), sorted so the worst offenders are easy to spot first.

### R4 — Re-runnable, not one-off

The check should be a script (`scripts/bsdata-import/`, following the
existing pipeline's conventions) that can be re-run after any future
`sync.mjs` run or importer fix, not a one-time manual analysis. It should
not require network access (it should not need to re-fetch BSData) - it
only needs the two data sources already on disk (`src/factions/*.js` and
`src/core/composableData/*.json`).

## Acceptance Criteria

- [ ] Running the script (a single `node` command) against the current
      repo state re-discovers Custodian Guard, Purifier Squad/Interceptor
      Squad/Purgation Squad, and the other units already logged in issue #1
      as suspect, without those units being hardcoded into the script.
- [ ] The script covers all 74 units across all 4 factions, not a subset.
- [ ] The output clearly distinguishes "flagged, needs a look" from
      "looks fine" - not just a wall of every unit's raw numbers.
- [ ] Running it twice in a row (no code changes between runs) produces
      identical output (deterministic, no reliance on live network/BSData
      fetch).
- [ ] A markdown or console report exists that a human can read in a few
      minutes to get the full list of suspect units, without needing to
      open the JSON files themselves.

## Edge Cases / Failure Modes

- A unit with only ONE real loadout in the actual game (no wargear options
  at all) will legitimately have 0 slots in both old and new data - the
  check must not flag these as suspect (e.g. some fixed-loadout characters).
- A unit already known-fallback (issue #2's 26 units, using our own
  hand-authored base weapons because BSData's base-weapon extraction
  failed) may have 0 or low slots for a different, already-tracked reason -
  the report should distinguish "known fallback, separately tracked" from
  "newly discovered thin coverage" where practical, so the report isn't
  dominated by already-known issues from #2.
- A unit whose old hand-authored data was itself already incomplete
  (never modeled some real option) won't be caught by this check, since
  the baseline itself is imperfect - that's a known limitation, not a bug
  in the check (see Non-Goals).

## Constraints

- Must not require a fresh BSData fetch (offline-runnable against files
  already in the repo).
- Should follow the existing `scripts/bsdata-import/` code conventions
  (plain `.mjs`, ES modules, no new dependencies) rather than introducing
  a new tool or framework.

## Non-Goals

- This Story does NOT fix any of the flagged units - that's issue #1 (the
  named-model-variant pattern) and follow-up work. This is detection only.
- This Story does NOT attempt to verify correctness against the *real*
  paper datasheets - it only compares two data sources already in this
  repo. A unit that passes this check can still be wrong against the real
  rules (that's issue #8's scope).
- Not building a general "data quality framework" - a single-purpose
  script for this one comparison is sufficient.

## Existing Behavior

Today there is no automated coverage check at all. `scripts/bsdata-import/sync.mjs`
reports conversion *failures* (`gaps`/`notFound` arrays, written to console
and cross-referenced by hand into `KNOWN_GAPS.md`), but a unit that
"succeeds" with silently fewer options than it should have produces no
signal whatsoever today.

## Examples / Scenarios

### Scenario 1

**Given:** Custodian Guard's old hand-authored data had 6 distinct loadout
rows (representing different weapon mixes) for various model counts.
**When:** The coverage script runs against the current composable data,
where Custodian Guard resolved to `slots: []`.
**Then:** Custodian Guard appears in the flagged report with a reason like
"0 slots generated; old data implied real loadout variation (6 rows)."

### Scenario 2

**Given:** Paladin Squad's composable data has 2 real slots with several
choices each, matching what hands-on testing already confirmed works
correctly.
**When:** The coverage script runs.
**Then:** Paladin Squad does NOT appear in the flagged list.

## Open Questions

- None - baseline/comparison heuristic is intentionally approximate (see
  Non-Goals); exact thresholds for "meaningfully thinner" are a planning
  concern, not a product one.

## Notes

Directly requested by the user after three units in a row (Custodian
Guard, Purifier Squad, Hearthkyn/Hearthguard) turned out to have missing
options during manual testing, prompting "yeah this is too hard to test
with this broken." This Story is the "systematic audit pass" option from
that conversation, chosen over "revert Fight Simulator to the old picker."
See GitHub issue #6 (https://github.com/J-Fricke/40kTools/issues/6) and
`scripts/bsdata-import/KNOWN_GAPS.md` for full background. Related issues:
#1 (root cause for Custodian Guard's specific pattern - already understood,
not this Story's job to fix), #2 (base-weapon fallback units - a
different, already-tracked reason some units have thin data).
