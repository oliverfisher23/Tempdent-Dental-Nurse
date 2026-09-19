---
name: Stage scroll shift
description: Why a scene stage can jump upward (nav and header vanish, backdrop strip at the bottom) and how scroll-to-control code must be written in the try-day scenes.
---

- An `overflow: hidden` stage whose backdrop is transform-scaled (the camera zoom) has scrollable
  overflow, so it is still a scroll container: `scrollIntoView`, browser focus scrolling (Tab to a
  control below the fold) and Playwright's `click()` all scroll it, shifting the whole stage with no
  way for the learner to scroll back. Use `overflow-clip` on stage roots (the kitchen frame and the
  chill scene root do) and scroll only the nearest `overflow-y: auto` scroller (`@/lib/scroll.ts`).
- **Why:** the chiller "you have to scroll to find the probe" complaint was partly this: arriving with
  the cycle running scrolled the stage ~120 px and hid the workspace nav.
- **How to apply:** never call `element.scrollIntoView` inside a scene; any new stage root with a
  transformed backdrop gets `overflow-clip`, not `overflow-hidden`.
- Harness note: a shifted stage in a headless capture may be Playwright's own scroll-into-view on
  `click()`, not the app. Check the root's `scrollTop` before blaming app code; with `overflow-clip` it
  stays 0.
