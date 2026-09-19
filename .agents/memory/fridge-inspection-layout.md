---
name: Fridge inspection layout
description: The stage-and-clipboard layout of the fridge inspection screen, why the picture width is measured rather than derived by CSS, and what must not change.
---

Rule: the fridge footage is 720x1280 portrait and clue markers are placed by percentage inside the frame, so the picture is never cropped (no object-cover on the frame). Beside the check (the `beside` custom variant in `src/index.css`, min-width and min-height together, not `sm:` alone) the screen is a stage: the full-height picture on the left, a slim numbered unit rail above a content-sized clipboard card (max 36rem) on the right, the pair centred over a blurred bleed of the same poster. Phones and short windows stack rail, picture, panel.

**Why:** the user rejected the split screen (a portrait strip beside a mostly empty full-height panel). Earlier attempts at putting the picture in a flex-1 area beside a fixed 400–500px panel left the frame ~150px wide with black bars; a width-only breakpoint gave a 100–200px-tall stage in short landscape windows.

**How to apply:**
- The picture column width is measured in the view (stage content box, `useLayoutEffect` + ResizeObserver) and passed as a CSS variable to the grid track: `min(height*9/16, width - gap - 320px clipboard minimum)`, floor 160px. Grid auto tracks cannot size a height-derived item, and the rail must stay first in DOM (keyboard order rail, clue markers, form) while sitting in the right column, so it is a grid with explicit areas, not flex.
- The media component measures its slot in `useLayoutEffect` too: it remounts on every door phase and appliance change, so a passive effect flashes the default size each time.
- Keep the frame flush with its column; letterbox is the blurred bleed (the stage's own when beside, the media component's when stacked), never flat black. Round the frame through the img/video elements, not `overflow-hidden`, so markers and focus rings at the edge are not clipped.
- Keep marker centres clamped by their radius (the 94% x clues stay whole); keep the motion toggle icon-only bottom-left with no `aria-pressed` (the e2e round walk counts `button[aria-pressed]` inside the inspection as clues); show the playback status via `onStatus` in the clipboard, not under the picture.
- The Done footer is sticky inside the scrolling clipboard only once the reading is taken (before that the dial is the action); the clipboard has `scroll-padding-block` so a focused field never lands under it. The error live region stays rendered while empty.
- Screens 768px tall are the tight case: the dial must be fully visible next to the reading field with the footer pinned. Check 1366x768 and 1024x600 before calling the layout done.
