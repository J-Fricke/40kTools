# Grey Knights Recon — match-play quick reference

Fast lookup for in-game decisions. Full research/reasoning lives in
`wtc-warmaster-2026-meta-notes.md` — this file is just the actionable output,
kept lean on purpose. Update as new threats/matchups get analyzed.

Current list (1985pts, 12 units) — see project memory
`project_greyknights_recon_list` for full roster and reasoning.

## Kill-commitment map: scary threats

"Solo" = one unit reliably wipes it alone, no help needed. "2-unit" = commit
both listed units in the same activation window to guarantee the kill. Numbers
are % of the target's total wounds from one unit's full attack — 100%+ means a
reliable one-activation wipe (accounts for wound/save math, not dice variance).

### Trivial — any single unit in the list handles these alone, don't overthink it
- **Daemonette squad** (10-model, T3/no-save/5++) — GMND alone: 192%. Purifying
  Flame chews through these regardless of squad size.
- **Fiends** (T5/no-save/5++, ~24W unit) — GMND alone: 80%, most units clear it.
- **Ork Boyz blob** (T5/5+sv, ~20W unit) — GMND alone: 144%, Crowe+Purifiers: 365%.

### Keeper of Secrets (18W monster, T10/5+/4++) — needs help
- **Cheapest solo:** Crowe+Purifiers + 1CP (Abominus-Class Targets, Sanctic) → 156%
- **Cheapest 2-unit, no CP:** GMND + VenDread (109%) or BTS + VenDread (109%)
  — keeps Crowe+Purifiers and your other GMND free for something else
- **Don't bother:** GMND/BTS + 2×Razorback (98%, falls just short) — Razorback
  pair needs a 3rd contributor or a different partner
- **Never spend Abominus-Class Targets on GMND** — its own Surge of Wrath
  already rerolls wounds vs Monster/Vehicle, the stratagem barely moves the
  needle (77%→80%). Spend it on BTS or Crowe+Purifiers instead.

### Bloodcrusher unit (24W, T7/3+/5++) — usually easier than it looks
- **Solves itself:** Crowe+Purifiers alone, no CP → 136%
- **Cheapest 2-unit if Crowe+Purifiers is busy:** GMND + VenDread (105%) or
  BTS + VenDread (107%)
- **Don't bother:** anything + 2×Razorback alone (94-96%, falls short) unless
  paired with 3×Interceptor instead (117%, works)

### General pattern
- **VenDread's real job vs hard targets is as the "top-up" piece** — turns a
  borderline ~77% single unit into a reliable kill when paired with GMND or
  BTS. That's arguably more valuable than its solo output.
- **2×Razorback alone never closes out either hard target** paired with just
  one other unit — treat their damage as a bonus contribution, not a closer.
- **Immaterial Interdiction has zero kill-boosting tools** — all of its
  stratagems/enhancements are Interceptor-Squad-only (mobility/action-economy:
  Echojump, Blades from the Beyond, By Thought Alone, Responsive Displacement).
  Don't look there for extra lethality on GMND/BTS/Purifiers.

## Disposition cheat sheet (which Recon mission depends on THEIR disposition)

| Opponent's disposition | We play | Notes |
|---|---|---|
| Take and Hold | Reconnaissance Sweep (3+ quarters + kills) | Cross-event GK win rate for Recon overall: 67% (n=12, small but real) |
| Purge the Foe | Triangulation (positional action, not kills) | Community-favorable matchup |
| Priority Assets | Search and Scour | |
| Disruption | Surveil the Foe | Rarely seen at the top of fields (1/55 in the WTC sample) |
| Reconnaissance (mirror) | Gather Intel | Dark Angels (Lion El'Jonson speed force) is the dominant real archetype here |

## Known meta archetypes to expect (from WTC Warmaster GT 2026 + cross-event survey)

- **Ork Take-and-Hold**: Ghazghkull + ~60-90 cheap bodies (Boyz/Gretchin/
  Squighogs), Big Mek Dakkarigs + Lootas for shooting. Killing them isn't the
  problem — their sheer unit count contesting objectives everywhere at once is.
- **Dark Angels Reconnaissance**: Azrael + Lion El'Jonson + Sammael/Ravenwing
  Command, 5-6 fast vehicles (Land Speeder/Vengeance), Deathwing/Ravenwing
  Black Knights, cheap Scout squads. Our mirror-matchup opponent.
- **Chaos Daemons Priority Assets (Slaanesh)**: Contorted Epitome, 5-7x
  Daemonette squads, 3x Fiends, 1-2x Keeper of Secrets, Tormentbringer. Fast
  melee-monster army — losses to this archetype are a positioning/sequencing
  issue (don't get caught out of position), not a lethality issue.
- **Chaos Daemons Purge the Foe (Khorne)**: Bloodcrushers (recurring across
  multiple top lists), Skarbrand/Be'lakor, Skull Cannons, Flesh Hounds.

## Game log — does it kill? (predicted vs actual)

Every percentage above is a falsifiable prediction, not a guarantee — this
tracks real games against them so we can spot if the model's systematically
off somewhere, not just anecdotally remember "that one time it didn't work."

Log format: `date | opponent/threat faced | commitment made | predicted | actual result | notes`

<!-- Add rows below as games happen. Example:
2026-08-25 | Keeper of Secrets | GMND + VenDread | 109%, should wipe | killed it, 2W left over | matches prediction
2026-08-25 | Bloodcrusher unit (6-model) | Crowe+Purifiers solo | 136%, should wipe | unit survived on 1 model | rolled badly on saves, not a model issue - variance not systematic
-->

