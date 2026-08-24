# ref/ — reference data conventions

`ref/` holds the raw game-data corpus the app's faction files
(`src/factions/*.js`) and Claude sessions are built/checked against: GW
rulebooks, faction packs, datasheets, and points data, transcribed to plain
text. Research output, tournament-meta analysis, and strategy write-ups have
their own home in `ref/findings/` (see below), keeping the GW source corpus
and our own analysis as two separate, growing collections.

## Naming convention

`<faction>-<content-type>[-vX.Y].txt`

Content-type suffixes in use:

- **`-datasheets.txt`** — full unit datasheet text (stats/wargear/abilities)
  for a faction. Covers every faction worth matchup research, including
  opponent factions (e.g. `orks-datasheets.txt`, `chaos-daemons-datasheets.txt`),
  alongside our four tracked factions.
- **`-faction-vX.Y.txt`** — the GW Faction Pack for a faction: detachments,
  stratagems, enhancements, rules updates/FAQs. This is the **current**
  naming pattern going forward.
- **`-mfm-vX.Y.txt`** — Munitorum Field Manual excerpt for a faction:
  points values only.
- Non-faction-specific shared rules: `core-rules.txt`, `primary-missions.txt`,
  `event-companion-v1.1.txt`, `universalrules-update-v1.0.txt`.

Versions (`vX.Y`) always come from the document's own internal header text
("Legal for matched play from..."), independent of whenever it happened to
be downloaded.

**Known naming drift, flagged for a future cleanup pass**: a few older files
still use a `-<edition>th-detach.txt` pattern (e.g. `custodes-10th-detach.txt`,
`chaos-knights-10th-detach.txt`, `greyknights-11th-detach.txt`) — same
content type as `-faction-vX.Y.txt`, just from before that pattern was
adopted; left as a decision for you to make on renaming, not something to
change silently. Similarly, `greyknights-11th-faction-pack.txt` is a
superseded v1.0 Faction Pack sitting alongside its v1.1 replacement
(`greyknights-faction-v1.1.txt`) — per the archive rule below, a candidate
to move to `ref/archive/`, surfaced here for you to decide on rather than
moved on my own.

## Subdirectories

- **`ref/ingest/`** (gitignored except `.gitkeep`) — raw source material
  (PDFs, images, pasted text) awaiting transcription into a proper `.txt`
  file here. Also doubles as the tournament-meta scrapers' scratch download
  location for raw list text (`ref/ingest/lists/<event>/`).
- **`ref/archive/`** (gitignored except `.gitkeep`) — raw source material
  that's already been transcribed, kept around for reference and
  re-checking so it's available locally instead of needing a re-download.
- **`ref/findings/`** — tournament-meta research and strategy output: event
  deep-dives, the cross-event synthesis, matchplay references, community
  notes. This is our own analysis built on top of the GW source material
  above, kept in its own directory — see
  `ref/findings/wtc-warmaster-2026-meta-notes.md` for the format these
  follow.

## Adding or updating a faction

1. Transcribe new source material into `ref/` using the naming convention
   above (prefer `-faction-vX.Y.txt` / `-mfm-vX.Y.txt` for new files).
2. When a file replaces an older version, move the old one to
   `ref/archive/` to keep only the current version visible in `ref/` itself.
3. Before doing a fresh web lookup for rules content, check here first —
   this corpus exists specifically to make repeated web fetches for the
   same rules text unnecessary.
4. The app itself reads faction/unit data from `src/factions/*.js` at
   runtime; `ref/` is the source-of-truth text those files get checked and
   updated against during development.
