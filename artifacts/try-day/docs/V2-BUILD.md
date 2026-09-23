# V2 build brief (engine and task owners read this first)

Source of truth for *what* is built: `docs/Tempdent_TRY-Day_Storyboard_Dental-Nurse_V2_interaction-redesign.md`
(Part 1 shared changes S1–S6, Part 2 per task, Part 3 phasing). V1 content, feedback lines and
answer keys stay unless Part 2 says "changed", "merged" or "new". Lines marked **TBC** are kept
as written and flagged in code comments as `// TBC SME` (never invent replacements).

## Non-negotiable rules (from V1, still in force)

1. `src/shell/` and `src/kit/` are not edited. Everything V2 lives in `src/client/` and `tests/`.
2. Content judges, scenes present. `isCorrect`/`isAnswered` in `content/tasks/index.ts` are the only
   judges. A presentation may *validate a gesture* (a hold released early has no answer yet) but
   never decides right/wrong itself; it commits an answer and renders the content's outcome.
3. No self-attested completion: no "done" toggles; every answer is an action the experience recorded.
4. Never show or hint the expected order of a routine. Wrong feedback coaches, never lists the answer.
5. British English, V1 register, no emojis, no clinical decisions for the apprentice.
6. Saved progress: choice answers default to `null`, set/order answers to `[]`; a returning learner's
   old record must load (extra keys are harmless; see `.agents/memory/saved-progress-migrations.md`).
   Bump `config.version` in `content/mechanic.json` once at the end of the V2 build (the answer shapes of
   several decisions change) — the T1 owner does this.
7. Everything works by keyboard and at 390×480 / 800×480 inside the embedded frame: no fullscreen-only
   controls, close-ups scroll internally, every drag has tap-lift/tap-place, every hold has a
   keyboard route (Space/Enter held, or a "Hold" toggle button), every timed thing honours "at your pace".
8. Every new picture is an AI placeholder recorded in `content/media-fingerprints.json` with status
   `placeholder` (`UPDATE_MEDIA_FINGERPRINTS=1 node --import tsx --test tests/media-assets.test.ts`
   then set the status by hand). Text inside pictures is unreliable: labels, printouts, notes and boards
   are HTML.
9. Test ids stay stable for the browser specs: `decision-<id>` (with `data-state`), `option-<decisionId>-<optionId>`,
   `confirm-<id>`, `change-<id>`, `restart-<id>`, `feedback-<id>`, `open-<id>`, `rail-<id>`, `why-<id>`,
   `debrief-<place>`, `aside-<id>`, drop zones `[data-drop-zone=<decisionId>-<zone>]`.
10. Instruction layer: the guide bar (content/guides or `lib/guide.ts`) is the single statement of the
    current step; the opener's How text lives in the scene content. No second "next" buttons.

## Engine contract (owned by the engine core; task owners build against it)

### Content (`content/tasks/types.ts`, `presentation.ts`)

- `TaskScene.opening?: { text: string; speaker?: string; seconds?: number }` — S6 look-before-you-act.
  The scene opens with the room, the guide says "Have a look round" and the opening line sits in the
  panel; the first decision's controls appear after `seconds` (default 6, 0 with "at your pace" off? no:
  the learner can always tap "I've had a look" sooner) — nothing is judged.
- `TaskScene.debrief?: Line` — S1 scene debrief shown in the panel once every decision in the scene is right.
- `Decision.noticed?: { value: string; label?: string; when?: 'answered' | 'right' }` — S3: jot once into the
  shell notepad (`jot({ taskId, label: label ?? 'Noticed', value, ref: { decision: id } })`, deduped by ref).
- `Decision.blockedBy?: { decision: string; aside: Line }` — a world rule: while the named decision is not yet
  right, any attempt to start this one shows `aside` (`data-testid=aside-<id>`) and the controls stay shut.
- `Decision.silent?: false` — S1 default is silent right answers; set `silent: false` only where V1's right
  line must still appear as a panel (none expected).
- `DecisionOption.reaction?: { person: string; state: string; text: string }` — people states: answering with
  this option puts `person` into `state` (a still + screen-reader `text`). `TaskScene.people` lists who is
  in the room; `content/people.ts` maps `person -> state -> { image, alt }` and each person's default state.
- New presentations are in `presentation.ts` (documented inline). Decision kinds stay `choice | checklist | sequence`.

### Stage engine (`scenes/stage-scene.tsx` and friends)

- S1: a right answer plays `kitchenAudio.play('confirm')`, marks the rail step done and shows a
  **Why did that work?** link (`why-<id>`) that expands `feedback.right`. No panel, no "Carry on".
  A wrong answer shows the speaker's `feedback.wrong` in the panel (`feedback-<id>`) with **Try again**
  (clears the answer; `change-<id>`) and **Leave it for now** (advances; keeps V1 freedom). `frozen` as V1.
- S6 opening as above; S3 jots; `blockedBy` asides; people states rendered from `content/people.ts`
  as a portrait card with visible state text (also `aria-live`), one per person in `scene.people`.
- Two registries in `scenes/interactions/index.ts`: `INTERACTIONS` (close-ups: open from the panel button /
  guide, `useWorkspaceOpen`; `paced` is one of these) and `STAGE_LAYERS` (presentations drawn on the photo box
  and in the panel: `find`, `path`, `controls`). Both receive `InteractionProps<K>`; stage layers also get `panelSlot`.
- `InteractionProps` gains `answers` (the whole task record), `onAnswerOther(decisionId, answer)` for a
  presentation that drives a linked decision (the tray's "Back to decon" zone answers `pouch`), `memory`
  (the day's consequences, `lib/consequences.ts`) and `ownPace` (`lib/pace.ts`).
- `lib/pace.ts`: `useOwnPace(): [boolean, (v: boolean) => void]`; default on when
  `prefers-reduced-motion: reduce` or the first input of the session is a keyboard event; stored under
  `springpod:tempdent-try-day:own-pace`. The stage shows an **At your pace** switch in the rail header.
- `lib/consequences.ts`: pure functions over `Progress<TaskStates>`: `trayMissing(progress): string[]`
  (Task 1 `tray` answer vs its answer key), `pouchSetAside(progress): boolean` (Task 1 `pouch` answered `aside`),
  `noticed(progress): NotepadEntry[]` (label `Noticed`). Task ids and these decision ids are fixed:
  setup: `tray` (option `matrix`), `pouch` (correct `aside`), `glucagon` (correct `report`).

### Ownership (parallel work; do not edit another owner's files)

| Owner | Files |
|---|---|
| engine-core | `scenes/stage-scene.tsx`, `scenes/current.ts`, `scenes/interactions/{types,index}.ts` (registry plumbing), `lib/{pace,consequences,guide}.ts`, `content/people.ts`, `content/tasks/types.ts`, `scenes/README.md`, `tests/v2-engine.test.ts` |
| task-1 | `content/tasks/setup.ts`, `scenes/interactions/{reflection,find,hold,path,initials}.tsx`, tray zone + kit read-gate changes in `tray.tsx`/`kit.tsx`, `tests/browser/setup.spec.mjs`, `tests/v2-setup.test.ts`, mechanic version bump |
| task-3 | `content/tasks/filling.ts`, `scenes/interactions/{paced,field}.tsx`, `tests/browser/filling.spec.mjs`, `tests/v2-filling.test.ts` |
| task-2-6 | `content/tasks/{welcome,close}.ts`, `scenes/interactions/{controls,offers,handover}.tsx`, people stills wiring, `tests/browser/{welcome,close}.spec.mjs`, `tests/v2-people.test.ts` |
| task-5 | `content/tasks/change.ts`, `scenes/interactions/{zones,autoclave,board,flags,printout}.tsx`, `tests/browser/change.spec.mjs`, `tests/v2-change.test.ts` |
| task-4 (after task-1 and task-2-6) | `content/tasks/reset.ts`, `scenes/interactions/{stick,turnaround}.tsx`, `tests/browser/reset.spec.mjs`, `tests/v2-reset.test.ts` |
| media | `src/client/assets/**` new stills, `content/media-fingerprints.json`, `docs/media-log.md` |

Shared files (`presentation.ts` union, `interactions/index.ts` registry lines, `tests/presentation.test.ts` ALLOWED map,
`content/client.ts` pattern copy): each owner edits only the lines for their own kinds, with `Edit`, never a rewrite.

### Verification per owner

`pnpm --filter @workspace/try-day run typecheck` (ignore errors in files you do not own while others are mid-flight,
re-run clean at the end), `cd artifacts/try-day && node --import tsx --test tests/*.test.ts`, and only your own
browser spec: `cd artifacts/try-day && BASE_URL=http://127.0.0.1:80 node tests/browser/run.mjs <name>` (run.mjs
takes spec names; the dev server workflow `artifacts/try-day: web` is already running; use `?testMode=1`).
Browser specs follow `tests/browser/harness.mjs` and `.agents/memory/browser-capture-harness.md`.

## Build status (23 September 2026)

Phases A–E are built and verified: typecheck, the node suite (`tests/*.test.ts`) and the browser
suite (`tests/browser/run.mjs`: setup, welcome, filling, reset, change, close, frame) pass.

- Every V2 presentation is registered; `hold` may name a `sound` that loops while the hold runs, and
  `paced` accepts `cues: []` for a speak-up-only segment.
- World sounds (`lib/sounds.ts`) are generated placeholders with a caption each; the stage's
  caption line (`scenes/sound-captions.tsx`) shows them whether or not sound is on.
- Stage layers receive `panelSlot` for their status and finish controls; the on-stage panel drops to
  the foot of the stage so the room stays usable at 390×480 (see `scenes/README.md`).
- Spots drawn from a content map (`path` zones, `controls`, the turnaround) render in reading order
  (`interactions/layout.ts`), never in the map's order, so Tab and screen-reader order cannot leak a
  routine's expected order (`tests/v2-invariants.test.ts`).
- Gesture-level refusals the storyboard asks for, kept deliberately narrow: a peel-and-stick label that
  does not belong to its field lifts off with the V1 line (T4 step 2; the fields' `accepts` must equal the
  content answer key, tested) and the turnaround's wipe only counts once every zone is covered (its order is
  not judged there: Task 1 assesses the wipe order, the door check judges the reset). The paced segment's
  in-moment reactions (Dr Reid looking up at a wrong or late pass) read the cue's asked item; every verdict
  still comes from the content keys of the linked decisions.
- Open items: SME questions Q1–Q7 in the storyboard (Task 4's reset keeps V1 full-order judging
  pending Q2); `// TBC SME` copy; Tempdent photography and recordings to replace every placeholder
  (`docs/media-log.md`); `right`/`wrong` sound files are mapped but the confirm still uses the kit's
  generated tone.
