---
name: Stage photo box and hotspots
description: Decisions behind the hands-on stage (hotspot pins on room photographs) that the code does not explain, plus the traps the browser specs hit.
---
# Stage photo box and hotspots

- Hotspot x/y are percentages of the 1.6:1 place photograph inside a pannable cover box, not of the stage.
  **Why:** fixed cover positioning put pins off-screen on phones (only ~40% of the width shows) and cropped ~13% top/bottom on 16:9 desktops.
  **How to apply:** authors keep pins inside y 15-75 and x 8-92, >= 7% apart; presentation.test enforces range, distance and hint length.
- The scroller canvas must reserve panel-height space below the photo (plus scroll-padding), and keyboard focus must scroll only the scroller.
  **Why:** in a 390x480 or 800x480 embedded frame the stage is ~230px high and the opaque panel covered the lower pins with no scroll range; the architect review failed the build on it. frame.spec.mjs tabs through every pin and asserts it sits above the panel.
- Pin label = short `hint`; full option text is the accessible name and the panel's running log. Long option sentences as pin labels overlapped into unreadable paragraphs at 390px.
- Presence portraits were dropped on purpose (square AI portraits floating on the photo looked pasted); people in the room are listed inside the expanded rail instead.
- Anything that classifies the answer (kit statuses, bench outcome, label ticks) must hide while the learner is on "Change answer"; presentation facts (label values, findings) stay.
- Browser specs: the guide action both walks to a room and opens its close-up, so openers may already be gone; tray items are tap-to-lift then tap `[data-drop-zone=<decisionId>-tray]`; `spec()` chains sequentially because seven Chromiums at once time out page.goto in this container.
