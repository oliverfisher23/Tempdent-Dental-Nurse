---
name: Fridge door playback
description: Why the Task 1 fridge footage is one mounted picture per appliance with a preloaded opening clip, and the traps that made "Open the fridge" stutter before.
---

Rule: the fridge picture stays mounted for the whole visit to an appliance (shut, opening, open). The opening clip is committed and preloaded while the door is still shut, parked on its first frame behind a still that is that same frame; the interior loop is committed as soon as the door starts moving and takes over shortly before the opening clip ends, under a short crossfade. Only the loop fades in and the finished clip fades out; the opening clip is never faded in over the still.

**Why:** the user asked for the door to start shut, move only on click, and hand over smoothly. Remounting the media per door phase and posting every still from mid-clip gave a half-open door before the click, a jump back to a shut door once the clip arrived, and a visible gap before the loop. The shipped clips make an early handover safe: each opening clip ends on the same interior the loop starts from (near-identical frames).

**How to apply:**
- Never reload a clip that is already fetching or buffered; `load()` discards the preload and turns the click back into a cold fetch. The guard lives with the playback helper in `src/lib/`.
- The closed-door stills are the clips' first frames. Regenerating stills changes approved media bytes: update the approval fixture and the inventory row in the media APPROVAL record together, with a dated presentation note, never silently.
- The loading message must not flash during the handover; it is for a loop that is genuinely slow, so it is delayed, and the clipboard status line keeps a minimum height so a late message does not shift the layout.
- Timings measured with per-frame Playwright screenshots overstate fade lag (headless rendering slows under capture). Keep a generous margin before releasing the finished clip rather than tuning to a screenshot timeline.
- The fridge-round browser check covers the contract: buffered-and-parked while shut, playing at full opacity on click, handover before the clip ends, released afterwards, plus a paused learner and a clip that cannot load. Keep those modes when editing the round.
