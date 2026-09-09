# Work: Re-architect BSData integration

## Source

- Story: `stories/bsdata-verbatim-rearchitecture.md`
- Plan: `plans/bsdata-verbatim-rearchitecture.md`

## Execution note

Running **P1 (discovery) only**, then a **hard stop** at S1 for Joshua to
review `DISCOVERY.md` and give the go-ahead for the later lanes (which will
likely be split into their own Story/Plan pairs per Joshua's 2026-09-08
note). Nothing past P1 executes without that go-ahead.

## Task status

| Task | Status | Owner | Notes |
|---|---|---|---|
| P1 Discovery | DONE, S1 reviewed | main session | 2026-09-08/09 |
| **Story A — BSData ingester** | **IN PROGRESS** | main session | `plans/bsdata-ingester.md` |
| A1 scaffold + resolution + typedef | DONE | main session | 2026-09-09, smoke-tested |
| A2 unit meta | DONE | — | after A1 |
| A3 weapons + normalizer | DONE | — | after A1 |
| A4 constraint evaluator | DONE | — | after A1 |
| A5 wargear tree | DONE | — | after A3 |
| A6 integrate + report | DONE | — | after A2,A3,A5 |
| A7 validation harness | DONE — 9/9 | — | after A4,A6 |
| A8 clean the sync report | DONE — R9 bar met | — | after A7; stop at S-A3 |
| Stories B–E | NOT STARTED | — | B blocked on S-A3 |

Branch: `impl-bsdata-ingester` (off `story-bsdata-ingester` + merged
`p1-bsdata-discovery` for the fixtures/cache).

## Log

### 2026-09-08 — P1 start

- Branch `p1-bsdata-discovery` off `story-bsdata-rearchitecture`.
- BSData/wh40k-11e repo listed: ~45 JSON files. In-scope faction
  catalogues ≈ 30 (excludes Adeptus/Chaos Titanicus, Library - Titans,
  Astartes Heresy Legends, Unaligned Forces, the Warhammer 40,000.json
  game-system file).
- Space Marine chapter supplements (Black Templars, Blood Angels, …, Grey
  Knights, Ultramarines, …) are thin catalogues that link into
  `Imperium - Space Marines.json`; Chaos Knights real data is in
  `Chaos - Chaos Knights Library.json` not the thin file — the
  thin/library split is itself part of what P1 must map.

### 2026-09-08 — P1 done, hard stop at S1

- `scripts/bsdata-import/v2/discover.mjs` — analysis tool (not shipped).
  Produces `DISCOVERY.md` (raw census), `census.json`, `fixtures/` (15
  bundles), `FINDINGS.md` (interpretation + Plan deltas).
- 34 catalogues, 1344 units analysed.
- **Headline: the Plan holds — no exotic wargear structures.** Every tree
  is a recursive `{min,max}` group; a per-node evaluator suffices, no
  constraint solver. That risk is retired.
- Notable findings (full list in FINDINGS.md):
  - keyword mess is *formatting* (casing/separators/Ork ALL-CAPS), ~40 real
    keywords under ~157 raw strings → dictionary needs a normalizer.
  - weapon "modes" (`➤` Aimed/Point-Blank, strike/sweep) → model a weapon as
    `{modes:[...]}`; folds in #26.
  - invuln = sometimes a Unit char, sometimes an ability; FNP = always an
    ability. Ingester parses both.
  - per-size points: 279 units, via a pts-type-id modifier + count condition.
  - 494 mandatory groups lack `defaultSelectionEntryId` → P3 fallback chain.
  - `roster`/`force`-scoped constraints = list legality → ignore by design.
  - ~25k `set:hidden when <cond>` modifiers → **open decision for Joshua**:
    show conditionally-hidden real wargear (recommended) vs. evaluate
    sub-faction/detachment gating.
  - SM chapter files are thin; datasheets in the SM library.
- `.cache/` (47 MB of catalogues) gitignored; re-fetch with `--fetch`.
- **Nothing past P1 proceeds without Joshua's S1 go-ahead.**

### 2026-09-09 — A1 done (S-A1: resolution API + typedef published)

New modules in `scripts/bsdata-import/v2/`:
- **`catalogues.mjs`** — `CATALOGUES` (34 factions, file + library deps),
  `loadFaction(key) -> {key, spec, catalogue, index}`, `makeIndex([cats])`,
  `fixtureIndex(bundle)` (for A7). `index` API: `entry(id)`, `group(id)`,
  `profile(id)`, `rule(id)`, `deref(id)`, `catalogueName`, `catalogueId`.
- **`resolve.mjs`** — `chars(profile)`, `resolveProfiles/weaponProfiles/
  abilityProfiles/unitProfiles(node, idx)`, `entryLinkQty(link)`,
  `children(node, idx, skip)` → `{node, viaLink}` (resolves entryLinks,
  threads `_qty`/`_linkConstraints`/`_linkModifiers`), `walk(node, idx,
  skip)`, `rawLimits(node)` → `{min, max}` (max Infinity).
- **`filter.mjs`** — `isCruft(node)`, `intraUnitHideModifiers(node)`
  (the ~15 real "hide X if Y"), `CRUFT_NAME`.
- **`emit.mjs`** — `slug(str)`, `uniqueId(base, taken)`, `writeJson(path,
  obj)` / `stableStringify(obj)` (recursive key sort, stable).
- **`src/core/model/unitRecord.js`** — JSDoc typedefs: `UnitRecord`,
  `WargearNode`, `Weapon`, `WeaponMode`, `NormKeyword`, `SyncReport`.
  **This is the S2 contract** — no renames after S-A2.

Smoke test passed: faction load + SM-chapter→library merge (BT: 306
entries), cross-catalogue deref (20/20 BT unit links), `isCruft` on
Crusade/Daemons-toggle/real-group, emit determinism, slug/uniqueId.

Serialisation note: `max: Infinity` → `null` in JSON; consumers treat
`null` max as unlimited.

Next: A2 (meta), A3 (weapons), A4 (constraint eval) — independent.

### 2026-09-09 — Story A done (S-A3)

Reworked at S-A2 per Joshua: the ingester now keeps RAW BSData
characteristics (weapon A/BS/S/AP/D/Range as strings, stats as strings,
keywords UPPERCASE-verbatim) — dice-averaging / skill mapping / keyword
semantics are Story B's. `scripts/bsdata-import/v2/DATA-MAPPING.md` is the
field-by-field BSData→UnitRecord diff + what's dropped. S-A2 signed off.

Final: 1342 units / 34 factions, 0 parse failures, deterministic, harness
9/9. `src/core/data/*.json` (~10 MB, pretty-printed; build minifies) +
`_sync-report.json` committed. Old pipeline + `npm run build` untouched.

**S2 contract frozen:** `src/core/model/unitRecord.js` — no field renames
without a coordination note.

Next: Story B (keyword dictionary + combat engine). Blocked only on Joshua
choosing whether to merge the PR stack (#38→#41) to main first.
