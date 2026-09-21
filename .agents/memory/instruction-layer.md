---
name: Instruction layer and overlay stack
description: Where the try-day app may talk about its own controls, and the rule for stacked overlays sharing Escape and focus.
---

- COPY.md rule 4 ("describe the kitchen, not the software") has one agreed exception: the instruction layer. The "How this works" tiles and cards, the "How" line of every workspace opener, and the step guide instruction may name the gesture and its button alternative. Dialogue, feedback and labels still may not.
  **Why:** a client review found learners could not tell what to do on the chart, chiller, waste and probe screens, and the guide described controls that did not exist. The client asked for explicit control instructions.
  **How to apply:** one sentence, name only controls on the screen right now, never reveal an answer, keep the words in the task's content file. Every workspace gets a three-part opener (what, how on this screen, done-when with a live count) and every disabled or locked control gets a visible one-line reason.
- Overlays inside the kitchen (close-ups, map, notebook, job card, small modals) share one stack; only the topmost answers Escape and Tab. Any new overlay must register with it, and any Escape handler must check it is on top.
  **Why:** the step guide sits inside the parents' focus traps, so a help card can open above the map, notebook or job card; a review found one Escape closing both layers when a handler skipped the check.
- Hotspot labels show briefly on arrival, but the reason under a locked spot waits for hover, focus or a tap, and labels near either edge hang from the spot's side.
  **Why:** on a 390 px phone the arrival labels plus reasons overlapped and ran off the left edge of the room.
