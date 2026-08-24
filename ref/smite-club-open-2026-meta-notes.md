# Smite Club Open 2026 — meta deep dive (23 of 130 players submitted lists)

Working notes for the GK Recon list competitiveness question, same goal and
method as `wtc-warmaster-2026-meta-notes.md`. Event: Smite Club Open 2026 -
40K Worlds Qualifier & Fundraiser, event ID `e9c14b77bb6d7540ac`
(https://listhammer.info/events/e9c14b77bb6d7540ac), 2026-08-22–24, 130
players, played entirely under MFM v1.2. Source data: fetched via
`scripts/scrapers/listhammer.py event e9c14b77bb6d7540ac`, saved to
`ref/ingest/lists/Smite-Club-Open-2026---40K-Worlds-Qualifier-Fundraiser-e9c14b77bb6d7540ac/`.

**Methodology: winner-skewed sample, same pattern as Newport/Upkeep.** Only
23 of 130 players submitted lists (18%), and the record distribution
confirms this isn't representative of the whole field: every submitted list
has 4+ wins (min record 4-1). Treat these numbers as comparable to
Warmaster's top-tier-only slice (27%/27%/27%/16%/2% across Take and
Hold/Priority Assets/Reconnaissance/Purge the Foe/Disruption, n=55), not its
full-field numbers.

## Disposition frequency (23 lists, winner-skewed - see methodology above)

| Disposition | Count | % |
|---|---|---|
| Take and Hold | 10 | 43% |
| Purge the Foe | 5 | 22% |
| Reconnaissance | 3 | 13% |
| Priority Assets | 3 | 13% |
| Disruption | 2 | 9% |

Compared to Warmaster's top-tier numbers: Take and Hold runs notably higher
(43% vs 27%), Priority Assets notably lower (13% vs 27%), Purge the Foe
higher (22% vs 16%), Reconnaissance lower (13% vs 27%). Small sample (n=23),
one data point among several now showing real event-to-event variance.

## Reconnaissance (3 lists)

- **T'au (Kauyon, 6-0)** — Experimental Prototype Cadre \| Kauyon, the exact
  same detachment pairing as Upkeep's own 6-0 T'au Reconnaissance result
  (`upkeep-games-gt-i-2026-meta-notes.md`). Two independent 6-0-class
  results with the identical shell across two different events is a real
  repeated signal, not a coincidence worth ignoring - T'au Kauyon looks like
  a genuine strong Reconnaissance archetype, distinct from the Dark
  Angels/Imperium-speed-force pattern.
- **Emperor's Children (Frenzied Host \| Carnival of Excess, 4-2)** — same
  detachment pairing as Upkeep's Emperor's Children Reconnaissance entry
  (also 4-2). Second echo of the Keeper of Secrets + Daemonettes + Defiler
  boogeyman trio's parent shell, though composition wasn't re-verified here
  (not individually read).
- **Chaos Space Marines (Renegade Raiders, 5-1)** — no comparison point
  elsewhere in this survey yet.

## Grey Knights (1 entry)

5-1, Banishers \| Argent Assault, Priority Assets — a **good** result with
this exact detachment/disposition pairing, contrasting with HUXLEYS OPEN's
1-4 result running the same combo (`huxleys-open-2026-meta-notes.md`).
Consistent with the Warmaster-era finding that Banishers|Argent Assault
results are "wildly inconsistent" rather than reliably strong or weak.

## See also

- `wtc-warmaster-2026-meta-notes.md` — the original full-field deep dive.
- `huxleys-open-2026-meta-notes.md` — a second genuinely representative
  full-field sample from this same post-v1.2 window.
- `warhammer-open-newport-2026-meta-notes.md`,
  `upkeep-games-gt-i-2026-meta-notes.md`,
  `edmonton-wargaming-open-2026-meta-notes.md` — other winner-skewed
  samples from the same window.
- `40k-v1.2-meta-competitive-thoughts.md` — the rolling cross-event
  synthesis (pending a refresh to fold this event in).
