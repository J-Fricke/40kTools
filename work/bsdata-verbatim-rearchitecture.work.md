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
| P1 Discovery | DONE (awaiting S1 review) | main session | 2026-09-08 |
| S1 review | PENDING JOSHUA | — | read `scripts/bsdata-import/v2/FINDINGS.md` |
| P2–P10 | NOT STARTED | — | blocked on S1 |

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
