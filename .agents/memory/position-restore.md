---
name: Position restore after reload
description: How a reload returns learners to their room and workspace, and the traps around it (mount reset, save-before-restore race, actions that do learner work).
---
Saved positions are navigation metadata only (room + last reported workspace action per task). They are advisory: anything malformed falls back to the task's start room.

**Rules**
- The kitchen provider must not reset the room on mount (only when the task id actually changes), or a restored room is undone immediately.
- Keep the saved workspace until the scene reports it open again; a save that runs before the scene re-opens it writes "nothing open" and loses the restore on the next reload. Time the wait out (a few seconds) so a scene that refuses to re-open does not block saving.
- Never re-send an action whose handler does the learner's work. Task 1's round action opens a fridge door, so Task 1 restores the room only.
- The step guide's own pending-action path is the way to re-open a workspace; it fires once the room is on screen and auto-clears if unhandled.

**Why:** the learner run reported reloads mid-Task 2 and late Task 3 dropping learners back at the pass; guidance may simplify navigation but must not perform practical steps.

**How to apply:** when adding a scene or workspace, make sure it reports itself through the workspace-open hook and that its guide action handler is idempotent and does nothing that counts as assessed work. Browser checks that reload mid-task should expect the workspace to come back by itself (the close-handover verification no longer re-clicks the hotspot).
