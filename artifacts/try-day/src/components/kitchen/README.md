# Kitchen Framework API

This directory contains the interactive framework for tasks.

## Key Components

### `<KitchenFrame id={taskId} scenes={{...}} dialogue={line} />`
Replaces `TaskShell`. Provides the full screen layout, HUD, map overlay, notepad drawer, and dialogue system.
- `id`: The TaskId being run.
- `scenes`: A map of PlaceId to ReactNode (the scene for that place). The frame manages crossfading between them.
- `dialogue`: The current `Line` of dialogue to show in the speech bubble, or `null`.

### `useKitchen()`
Hook to interact with the kitchen world (must be used inside components rendered within KitchenFrame).
- `place`: Current `PlaceId`.
- `goTo(to: PlaceId)`: Walk to a new place. Plays footsteps, advances the clock, animates the map, and crossfades.
- `route`: Valid places for this task.
- `travelling`: boolean; true while the walking animation is happening.

### `<Hotspot x={percent} y={percentage} label="..." onClick={...} />`
A clickable object in a scene.
- `state`: `'todo' | 'active' | 'done' | 'locked'`. Use 'active' for the thing they should click right now (pulses).

### `<CloseUp isOpen={boolean} onClose={...} title="...">`
A portal-based dialog wrapper for full-screen or focused interactions (like reading a clipboard or filling a form). It handles backdrop clicks, the Escape key, focus trapping, and provides a built-in top-right close button. Render your `Paper` components inside this.

### Paper Surfaces
Use these wrappers for forms inside `CloseUp` components:
- `<Clipboard>`, `<Whiteboard>`, `<Notepaper>`, `<Sheet>`
Use `.kitchen-input` on `<Input>` elements to match the handwriting style.

## State & Rules
- **DO NOT put simulation rules in UI.** All `evaluate*` logic stays in `lib/simulation.ts`.
- Update task state via `useProgress().updateTask(id, prev => next)`.
- Advance clock manually for time-consuming actions: `useProgress().advanceClock(minutes)`.

## Sound
- Sound is unlocked automatically by the Intro page before tasks start.
- `kitchenAudio.play('tap')` is built into `<Hotspot>`, but use it for custom buttons too.
- `kitchenAudio.play('write')`, `kitchenAudio.play('page')`, `kitchenAudio.play('door')` etc. when interacting.
- `kitchenAudio.duck(true/false)` is handled automatically by the `<Speech>` component.

## Notepad
- Use `useProgress().jot({ taskId, label, value, ref })` to add a note.
- The `ref` object (e.g. `{ unitId: 'larder-2' }`) helps forms pull data from notes.
- Use `useNotepad().entryFor(key, value)` to lookup notes.