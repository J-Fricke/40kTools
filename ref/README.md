# ref/ — reference data conventions

`ref/` holds the raw game-data corpus the app's faction files
(`src/factions/*.js`) and Claude sessions are built/checked against: GW
rulebooks, faction packs, datasheets, and points data, transcribed to plain
text. It is **not** where research output, tournament-meta analysis, or
strategy write-ups go — those live in `ref/findings/` (see below), kept
separate so the two don't get mixed together as the corpus grows.

## Naming convention

`<faction>-<content-type>[-vX.Y].txt`

Content-type suffixes in use:

- **`-datasheets.txt`** — full unit datasheet text (stats/wargear/abilities)
  for a faction. Includes opponent factions we don't play but need for
  matchup research (e.g. `orks-datasheets.txt`, `chaos-daemons-datasheets.txt`),
  not just our four tracked factions.
- **`-faction-vX.Y.txt`** — the GW Faction Pack for a faction: detachments,
  stratagems, enhancements, rules updates/FAQs. This is the **current**
  naming pattern going forward.
- **`-mfm-vX.Y.txt`** — Munitorum Field Manual excerpt for a faction:
  points values only.
- Non-faction-specific shared rules: `core-rules.txt`, `primary-missions.txt`,
  `event-companion-v1.1.txt`, `universalrules-update-v1.0.txt`.

Versions (`vX.Y`) are read from the document's own internal header text
("Legal for matched play from..."), never from download date.

**Known inconsistency, not yet cleaned up**: a few older files still use a
`-<edition>th-detach.txt` pattern (e.g. `custodes-10th-detach.txt`,
`chaos-knights-10th-detach.txt`, `greyknights-11th-detach.txt`) instead of
the current `-faction-vX.Y.txt` pattern — same content type, older naming,
left as-is rather than renamed without being asked. Also:
`greyknights-11th-faction-pack.txt` is a superseded v1.0 Faction Pack sitting
alongside its v1.1 replacement (`greyknights-faction-v1.1.txt`) — per the
archive rule below it's a candidate to move to `ref/archive/`, flagged here
rather than moved unprompted.

## Subdirectories

- **`ref/ingest/`** (gitignored except `.gitkeep`) — raw source material
  (PDFs, images, pasted text) not yet transcribed into a proper `.txt` file
  here. Also used by the tournament-meta scrapers as a scratch download
  location for raw list text (`ref/ingest/lists/<event>/`).
- **`ref/archive/`** (gitignored except `.gitkeep`) — raw source material
  that *has* been transcribed already, kept around for reference/re-checking
  rather than re-downloading, but not itself committed.
- **`ref/findings/`** — tournament-meta research and strategy output: event
  deep-dives, the cross-event synthesis, matchplay references, community
  notes. Distinct from everything above because it's *our own analysis*,
  not GW source material — see `ref/findings/wtc-warmaster-2026-meta-notes.md`
  for the format these follow.

## Adding or updating a faction

1. Transcribe new source material into `ref/` using the naming convention
   above (prefer `-faction-vX.Y.txt` / `-mfm-vX.Y.txt` for new files).
2. If a file replaces an older version, move the old one to `ref/archive/`
   rather than deleting it or leaving both in `ref/` unlabeled.
3. Before doing a fresh web lookup for rules content, check whether it's
   already here — this corpus exists specifically so repeated web fetches
   for the same rules text aren't necessary.
4. Faction/unit data actually used by the app lives in `src/factions/*.js`,
   not here — `ref/` is the source-of-truth text these are checked against,
   not consumed directly by the app at runtime.
