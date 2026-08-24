# Edmonton Wargaming Open 2026 — meta deep dive (13 of 74 players submitted lists)

Working notes for the GK Recon list competitiveness question, same goal and
method as `wtc-warmaster-2026-meta-notes.md`. Event: Edmonton Wargaming Open
2026, event ID `283fa34a4c01749ba6`
(https://listhammer.info/events/283fa34a4c01749ba6), 2026-08-22–23, 74
players, played entirely under MFM v1.2. Source data: fetched via
`scripts/scrapers/listhammer.py event 283fa34a4c01749ba6`, saved to
`ref/ingest/lists/Edmonton-Wargaming-Open-2026-283fa34a4c01749ba6/`.

**Note on the name**: "Edmonton Wargaming Open" also appears in the original
cross-event GK win-rate aggregate in `wtc-warmaster-2026-meta-notes.md`, but
that check never recorded an event ID, and this instance is dated this past
weekend (2026-08-22–23) - almost certainly a different date's running of a
recurring series, not the same event re-pulled, but this couldn't be
directly confirmed by ID. Worth keeping in mind if the aggregate table is
ever reconciled against event IDs.

**Methodology: winner-skewed sample, same pattern as Newport/Upkeep.** Only
13 of 74 players submitted lists (18%), and every submitted list has 4+
wins (min record 4-1). Treat these numbers as comparable to Warmaster's
top-tier-only slice (27%/27%/27%/16%/2%, n=55), not its full-field numbers.
n=13 is the smallest sample in this survey - read everything below as a
single extra data point, not a standalone finding.

## Disposition frequency (13 lists, winner-skewed - see methodology above)

| Disposition | Count | % |
|---|---|---|
| Take and Hold | 7 | 54% |
| Reconnaissance | 3 | 23% |
| Disruption | 2 | 15% |
| Priority Assets | 1 | 8% |
| Purge the Foe | 0 | 0% |

Take and Hold is unusually high here (54% vs Warmaster's top-tier 27%) and
Purge the Foe is entirely absent - but n=13 makes this easy to over-read;
treat as noise-prone rather than a real signal on its own.

## Reconnaissance (3 lists)

- **Dark Angels (Darkflight Pursuit \| Company of Hunters), 4-1, x2** — the
  same detachment pairing identified as dominant at Warmaster (5/6 lists,
  40% of the top tier in the full-field breakdown). Both entries here went
  4-1, a solid result reinforcing the archetype's strength - unlike HUXLEYS
  OPEN, where the same shell only managed 3-3 and 2-2
  (`huxleys-open-2026-meta-notes.md`). Two data points now on each side:
  this and Warmaster support the archetype, HUXLEYS OPEN tempers it.
- **Necrons (Cursed Legion \| Skyshroud Spearhead), 4-1)** — no comparison
  point elsewhere in this survey yet.

No Grey Knights entries at this event.

## See also

- `wtc-warmaster-2026-meta-notes.md` — the original full-field deep dive.
- `huxleys-open-2026-meta-notes.md` — a second genuinely representative
  full-field sample from this same post-v1.2 window.
- `warhammer-open-newport-2026-meta-notes.md`,
  `upkeep-games-gt-i-2026-meta-notes.md`,
  `smite-club-open-2026-meta-notes.md` — other winner-skewed samples from
  the same window.
- `40k-v1.2-meta-competitive-thoughts.md` — the rolling cross-event
  synthesis (pending a refresh to fold this event in).
