# Stage engine

`StageScene` renders one task scene over its pannable 1.6:1 place photograph.
Content owns prompts, answer keys and outcomes; the engine only presents them.
`isAnswered` and `isCorrect` remain the only judges.

## Presentations and interaction props

- `speech` and legacy `hotspots` are rendered by the stage.
- Close-ups are registered in `INTERACTIONS` and open from `open-<id>` or the
  guide. Stage presentations (`find`, `path`, `controls`) are registered in
  `STAGE_LAYERS` and are mounted while their decision is current or rail-focused.
- Every registered component receives `InteractionProps`: `taskId`, `decision`,
  `presentation`, `answer`, the whole task `answers`, `onAnswer`,
  `onAnswerOther(decisionId, answer)`, `memory`, `ownPace`, `frozen`, `isOpen`
  and `onClose`.
- A close-up guide uses `presentation.open`. A stage layer uses
  `guideLabel ?? 'Look'`; `find` has the `tap` pattern and `path`/`controls`
  have the `drag` pattern.
- Spots that come from a content map (`path` zones, `controls`, the turnaround's
  controls and wipe zones) are rendered through `inReadingOrder` (`interactions/layout.ts`),
  left to right then top to bottom, so DOM order never repeats a routine's expected order.
- A stage layer also receives `panelSlot`: an element inside the stage panel,
  under the prompt. The layer portals its status line and finish control there
  (the find counter, the path's Finish button, a controls aside) so nothing
  sits behind the panel. Without a slot it draws them on the photograph.

## Panel placement

While the learner works on the photograph (hotspots being picked or a stage
layer editing), the panel is "on stage": it drops to the foot of the stage,
sits to the right of the mentor chip, lets pointer events through except in
its slot, and on a stage under 320px high shrinks to the prompt's second
sentence onwards (the guide bar above already states the first). Otherwise it
sits above the chip at `bottom-[4.25rem]`.

## Sounds and captions

World sounds (`lib/sounds.ts`: running water, wipe, flush, chair, autoclave,
door, handpiece, curing light, pouch, box lid, cue) are placeholder files and
every one has a caption. `SoundCaptions` (`sound-captions.tsx`) is mounted
first inside the stage and shows the bracketed caption in an `aria-live`
line, whether or not sound is on, under the rail header on a narrow stage
and top-centre on a wide one. A `hold` presentation may name a `sound` to
loop while the hold runs.

## V2 scene flow

Right answers are silent by default. The engine plays the confirmation sound,
closes an open close-up, advances to the next decision and marks the rail row
`right`. The row's `why-<id>` button expands the authored right feedback inline.
There is no feedback panel and no Carry on button. `silent: false` opts a
decision back into the V1 right-feedback panel and Carry on flow.

A wrong answer keeps `feedback-<id>` in the panel with `role=status`. Try again
(`change-<id>`) clears the answer with `blankAnswer`; Leave it for now
(`carry-<id>`) keeps it and advances. Signed-off (`frozen`) tasks display their
saved outcomes but have no editable controls. When every scene decision is
right, `debrief-<place>` shows the scene debrief. Task sign-off remains owned by
`TaskPage`.

An authored `opening` starts the scene in look mode if no scene answer exists
and the session marker has not been written. `opening-<place>` acknowledges it;
otherwise its timer uses `seconds ?? 6`. At your pace disables the timer. The
photo remains pannable and the guide says the opening's first sentence with
“Have a look round”.

`noticed` writes one notepad entry, deduped by its decision ref, when its
`answered`/`right` condition holds and removes that entry if an editable answer
later stops meeting the condition. The expanded rail also has `note-input` and
`note-add` for unassessed notes. `blockedBy` replaces controls with the authored
`aside-<id>` status until its blocker is right. The current-decision rule keeps
the blocker ahead of the blocked step.

`scene.cast` renders `cast-<person>` portrait/state cards. Reactions are resolved
from chosen options in scene content order (last reaction wins); each card
exposes `data-state` and its one-line state text is an `aria-live=polite`
region. The rail header's `own-pace` switch is bound to `useOwnPace()`.

## Stable browser contract

- `decision-<id>` with `data-state=open|right|wrong`
- `rail-<id>`, also with answer state
- `option-<decisionId>-<optionId>`, `confirm-<id>`, `restart-<id>`, `open-<id>`
- `feedback-<id>`, `change-<id>`, `carry-<id>`, `why-<id>`
- `opening-<place>`, `debrief-<place>`, `aside-<id>`
- `cast-<person>` with `data-state`, `own-pace`, `note-input`, `note-add`
- `[data-drop-zone=<decisionId>-<zone>]`

The photo canvas reserves room for its bottom panel and keyboard focus scrolls
the photo scroller, not the page. Pins and stage spots stay inside x 8–92 and
y 15–75. All controls must remain reachable at 390×480 and 800×480.