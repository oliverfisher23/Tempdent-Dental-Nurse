---
name: On-stage panel and panel slot
description: Why the stage panel drops to the foot of the stage while the learner works on the photograph, and why stage layers render their status/finish controls into the panel slot.
---
Rule: while a decision is worked on the photograph itself (hotspots being picked, or a `find`/`path`/`controls` layer editing), the panel is "on stage": `bottom-3`, to the right of the mentor chip, pointer-events through it, and on a stage under 320px high only the prompt's second sentence onwards (the guide bar directly above already states the first). Stage layers portal their status line and finish button into `panelSlot` instead of drawing them at the photo box's bottom.

**Why:** at 390x480 the shell header plus the stacked guide bar leave a ~215px stage. A panel at `bottom-[4.25rem]` with the full prompt left ~48px of room and pins clipped under the stage top; anything a layer drew at the photo box's bottom edge (the path's Finish button, the find counter) sat behind the panel. The mentor chip at bottom-left otherwise covers the panel text.

**How to apply:** new stage layers must use `panelSlot` when present (fall back to the photo only when it is null). Do not put controls at the foot of the photo box. The `frame` browser spec measures each spot against the stage and panel boxes at 390x480 and 800x480; measure the stage afresh per spot because the guide bar's height changes between steps.
