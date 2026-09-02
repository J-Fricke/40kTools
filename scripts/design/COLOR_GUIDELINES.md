# Color guidelines

Written 2026-09-02 after a real bug hunt: several colors across the app -
detachment description text, control-bar labels, and about a third of
Chaos Knights' unit accent colors - had been unreadable for a while before
anyone caught it, because they'd only ever been eyeballed against one
screen/theme setting, not actually measured. This doc exists so the next
color anyone adds doesn't repeat that.

## The rule

**Every text/foreground color needs a contrast ratio of at least 4.5:1**
(WCAG AA, normal text) against every background it can actually render on
in this app. Check it with the script, don't eyeball it:

```
node scripts/design/checkContrast.mjs '#your-hex' '#background-hex'
```

Or audit every faction's `UC` (unit color) export at once:

```
node scripts/design/checkContrast.mjs
```

3:1 is the WCAG floor for *large or bold-only* text (≥18pt, or ≥14pt bold).
Almost everything in this app's dense tables is small - default to 4.5:1
unless you're specifically styling something large.

## Where this app's colors actually render

A color doesn't just need to survive against one flat page background.
Check it against every real spot it lands on, which for this app's dark
theme means at minimum:

- `C.bg` / `C.bg2` (`src/components/ui.jsx`) - the two alternating table-row
  backgrounds most text sits on.
- `C.bg3` - control bars, cards, dropdowns.
- `C.ambBg` - the active-detachment-card background. This one bit hardest:
  a color that looked fine on `bg3` dropped to 1.2:1 here.
- Any `heat()` overlay (`ui.jsx`) a badge or value might render on top of -
  `heat()`'s red zone blends toward `rgba(248,113,113,...)`, so a text
  color that's *itself* close to that RGB will nearly vanish at high heat
  intensity, even though it reads fine at low heat. Check against the
  overlay's max-intensity blended color, not just the raw page background.

## Two mistakes already made once - don't repeat them

**Lightening a dark background does not reliably fix a dark foreground
color.** It's counter-intuitive but was measured directly: moving this
app's near-black background toward mid-grey made MORE unit colors fail
contrast, not fewer, because the foreground colors were themselves too
dark/low-luminance - the luminance gap between two dark colors shrinks
before it grows as one of them lightens. If a color reads as unreadable,
check whether the COLOR needs brightening before assuming the background
does.

**A shared color TOKEN can hide a systemic problem behind one-off-looking
symptoms.** The detachment-text/control-bar-label issue wasn't 20 separate
bad color choices - it was two theme tokens (`C.dim`, `C.vdim` in
`ui.jsx`) used in 46 places for real body text. Fixing the token fixed
every call site at once. Before patching an individual `color: C.something`
usage, check whether the token itself is the actual problem - if so, fix it
there, not at the call site.

## Pick tints over pure/dark saturated hues on this dark theme

This app's background is near-black (`#060e1c`). A "pure" or dark
saturated color (deep red, dark navy, dark forest green, dark brown) sits
close to that background in luminance no matter how distinct its hue is -
hue alone doesn't buy you contrast against a dark background, lightness
does. When picking a new categorical color (a new unit's accent color, a
new status indicator, etc.):

- Lean toward a lighter tint of the hue you want, not the fully-saturated
  "pure" version - think pastel-leaning-vivid, not jewel-tone-dark.
- If you want a genuinely dark/muted color for some other reason (a
  disabled state, a background fill), that's fine - just don't also use it
  as small foreground text on this background.
- After picking a color, run it through `checkContrast.mjs` before
  committing to it. This should be as automatic as running the build.

## Distinctness between colors is a separate concern from contrast

Passing 4.5:1 against the background says nothing about whether two
DIFFERENT colors (e.g. two different units' accent colors) are
distinguishable from EACH OTHER. Chaos Knights currently has several
same-hue-family clusters (multiple reds, multiple blues, multiple teals,
multiple oranges - see GitHub issue #16) that all individually pass
contrast but read as near-duplicates side by side. That's a real, separate
problem from background contrast, and needs its own pairwise-distance
check (Euclidean RGB distance, or ideally a perceptual metric like
CIEDE2000) rather than the luminance-ratio check this doc covers. Not
solved yet - flag it rather than silently duplicate a hue if you're adding
a new categorical color to a faction that already has many.
