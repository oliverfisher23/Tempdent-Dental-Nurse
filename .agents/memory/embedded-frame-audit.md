---
name: Embedded (LMS iframe) constraints
description: What the try-day app must hold to inside a sandboxed cross-site iframe (Springpod linked app), and how to check it.
---
Rule: the whole day must complete inside `<iframe sandbox="allow-scripts allow-same-origin allow-forms">` with no `allow=` policy, at 360×640, 768×480 and 1280×800; nothing is read from the URL and nothing is expected back from the host. The one outbound `gate:complete` must carry `completedTasks`.

**Why:** Springpod Studio and the learner hub embed the stored address exactly and never post in. The Sep 2026 embed audit found two 480px-high blockers that every taller run had passed: a bottom-anchored question bar covered the controls behind it, and a fixed pixel min-height on a paper pushed its signature below the frame with no scroller able to reach it.

**How to apply:**
- Anything anchored to the bottom of the stage is capped as a percentage of the stage and scrolls internally; paper minimum heights are `min(px, svh)`, never a bare px value.
- `document.fullscreenEnabled` is false in that sandbox: controls that can only expand must not render; harnesses enter through whichever welcome control exists.
- Storage inside the frame may or may not be partitioned from a direct visit; assume neither.
- `VIEWPORT=768x480` is the canary learner run for frame-height regressions; run it with `360x640` and the keyboard run before publishing layout changes.
- Iframe-only facts (message origin/source, storage, fullscreen) need a parent page on a different host from the built app, and the app frame reloaded from inside the frame, not a top-level reload.
