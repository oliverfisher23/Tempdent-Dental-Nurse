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
- Task 1 is a focused workspace (log page, then the fridge inspection viewer, then the board review) with no
  room scenes of its own. The fridges photograph (`PLACES.corridor.backdrop`) is only seen faded behind the log
  and board pages, so check it there, not on a map route; the pass photo is visible in Task 2 and Task 5, the
  bench photo in Task 3. Both Task 1 paper pages scroll inside the paper (the clipboard and log book shrink to
  the stage), so a fixed backdrop must sit outside that scroller to stay put.
- To reach a task scene headlessly, open `/?testMode=1`, press "Designer test", then a task button in the
  "Test destinations" nav; session fixtures land you at the task's first step without touching learner storage.
- The try-day web artifact is mounted at the root preview path, so drive it at `http://localhost:80/...`,
  not `/try-day/...`. The prefixed URL still loads the SPA (fallback) but every route 404s and in-app
  navigation drops the prefix, which looks like a broken router. Check the dev server's `BASE_PATH` first.
- If the hidden designer panel must be used mid-run (e.g. to load the Close fixture), remove the hiding
  style tag first: `pointer-events: none` swallows even forced clicks.
- playwright-core is not a workspace dependency; install it in a scratch dir and pass a Page into the
  `e2e/*-verification.mjs` modules, which is why they take a Page rather than launching a browser.
- Kitchen modals and close-ups animate out for a few hundred ms. `isVisible()` straight after Escape or a
  close click still says true, and a click on the closing button dies with "element detached". Assert with
  `waitFor({ state: 'hidden' })` instead, or a QA script logs "Escape does not close X" as a false bug.
- Playwright's `touchscreen` only taps. For a phone-context press-and-hold (the probe/hold-to-read buttons),
  send CDP `Input.dispatchTouchEvent` touchStart, wait for `[data-state="settled"]`, then touchEnd. Mouse
  events still work in a touch context but only prove the layout, not the gesture.
- The job card opens on a task's first visit only; a resumed or reloaded session lands straight in the scene,
  so treat "Close the job card" as optional in any harness.
