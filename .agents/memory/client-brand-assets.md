---
name: Client brand assets
description: What the shell does with a client's logo and theme, and the traps when applying an employer's brand guidelines.
---

- The shell shows `brand.logo` only on dark surfaces (the `bg-foreground` header and launch box, a black
  box in the task HUD). A positive/colour wordmark is invisible there: hand the shell the client's
  reverse (white) mark. **Why:** applying Tempdent's positive logo would have blanked its dark-blue half.
- A usable reverse can be derived from the master's alpha channel when only the positive is supplied:
  `magick master.png -trim +repage -channel RGB -fill white -colorize 100 +channel -resize 800x out.png`.
  Say so to the client and ask for the official reverse artwork.
- The shell sizes the logo by height (`h-4`..`h-8`, 16-32px). A wide wordmark (Tempdent is 3.2:1) renders
  50-105px wide, under the usual 100px brand minimum in the HUD and launch box. Only a shell change fixes
  that; it was flagged to the user, not changed, since the shell stays client-agnostic.
- Brand primaries are often below 4.5:1 on white (Tempdent Aqua is 2.97:1). The theme's `--primary` is
  also used for small text (eyebrow labels, links), so the primary must pass text contrast: sample a
  darker stop of the brand's own gradient or use its dark swatch, and keep the flat colour for
  decoration and the focus ring. Check `text-foreground/70` labels too: a foreground lighter than about
  25% lightness drops them under 4.5:1.
- `--secondary` is the launch hero backdrop with a hard-coded white title, and the primary button sits
  on it: secondary must stay dark and differ visibly from primary. The dark scheme should follow the
  same rule (the template's light dark-mode secondary would hide the title).
- The brand font is self-hosted from a `@fontsource` package imported at the top of `theme.css`; the
  package is a per-client devDependency that the new-client script does not remove.
- `tests/` are excluded from the artifact's typecheck, so a wrong test import (a `vitest` import in a
  `node --test` suite) only shows when the unit-tests workflow runs. Run the tests, not just typecheck,
  after a subagent edits them.
