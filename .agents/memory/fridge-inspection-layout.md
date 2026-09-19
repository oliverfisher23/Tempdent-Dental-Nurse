---
name: Fridge inspection layout
description: Why the fridge inspection picture is a height-sized 9:16 column with a width-and-height media query, and what must not change.
---

Rule: the fridge footage is 720x1280 portrait and clue markers are placed by percentage inside the frame, so the picture is never cropped (no object-cover). Beside the check panel the media column takes its width from its height (`aspect-ratio` on the full-height column), and the panel gets the rest. The switch to side-by-side uses the `beside` custom variant in `src/index.css` (min-width and min-height together), not `sm:` alone.

**Why:** a width-only breakpoint gave a 100–200px-tall stage in short landscape windows and a frame under 120px wide; stacking there is the lesser evil. Earlier layouts that put the picture in a flex-1 area beside a fixed 400–500px panel left the frame at ~150px wide with black bars, which is what the user complained about.

**How to apply:** keep the frame flush with its column (any letterbox is filled by the blurred poster, never flat black); keep marker centres clamped by their radius so the 94% x clues stay whole; keep the motion toggle icon-only in the bottom-left corner (no clue sits there) and show the playback status text in the panel via `onStatus`, not under the picture. The e2e round walk counts `button[aria-pressed]` inside the inspection as clues, so never add `aria-pressed` to the motion toggle.
