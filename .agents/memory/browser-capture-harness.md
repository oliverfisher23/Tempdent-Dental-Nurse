---
name: Browser capture harness
description: Lessons from driving the try-day app headlessly (CDP/Playwright) for screenshots and UX facts.
---

- Hide the learning-designer test panel with CSS; never remove its node. **Why:** React owns it and a
  later re-render throws when the node is gone, taking the page down mid-capture.
- On phone widths the Replit dev banner overlaps the header, so close it before clicking header tools,
  and prefer aria-label selectors to positional clicks.
- CDP touch/mobile emulation does not turn on `pointer: coarse`, so touch-target sizes measured that way
  reflect the desktop branch of any pointer-media CSS; verify on a real device or force the media query.
- A black stage is not necessarily slowness: a task route whose start place has no registered scene renders
  nothing there. Check `TASK_ROUTES` against the page's `scenes` before blaming load time.
