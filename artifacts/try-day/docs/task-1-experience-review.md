# Task 1 experience review

## Scope checked

Reviewed the active focused fridge round, overnight log, inspection and final board; the unused legacy pass/corridor scenes; and compatibility behaviour for previously saved rows and finished work. Protected mechanic wording, task IDs, stored row fields, reading truth checks and completion gates were not changed.

## Interaction changes

- Before: the round moved appliance by appliance with little orientation. After: a horizontally scrollable appliance list shows current, checked and waiting states. Current and checked appliances are reachable with native buttons by keyboard or touch; future appliances remain orientation-only.
- Before: taking a reading depended on holding a control. After: one keyboard/touch activation starts a timed settling reading, with visible and announced settling/settled states. The learner still writes the measured number; it is not filled into the board.
- Before: successful probing revealed a number without comparison feedback. After: the result is compared with the appliance's supplied limit and prompts the learner to use inspected evidence when explaining a discrepancy.
- Before: inspection markers revealed isolated findings. After: revealed findings are announced, the number checked is visible, and the learner is explicitly asked to turn those findings into their own note. Revealing findings is not a new completion gate.
- Before: initials could be copied into a newly probed row. After: the learner enters their own initials. Existing stored initials remain untouched.
- Before: controls and transitions varied in size and duration. After: Task 1's key controls use practical 44px minimum targets and 200ms transitions with reduced-motion variants. Form errors are associated with the relevant field, announced assertively and move focus to the field that needs attention.
- The final board supports labelled recheck controls on desktop and mobile. Finished work receives explicit disabled controls in addition to the shell/store freeze.

## Supplied fridge films

`attached_assets/VIDEOS_1789733068766.zip` contains 14 five-second, portrait H.264 clips: two for each of the seven appliances. Every clip has an AAC audio stream. The archive contains no VTT/SRT sidecars and ffprobe found no embedded subtitle stream. No approved audio transcript was supplied, so captions or a transcript were not invented.

The films remain outside the app asset tree in a ZIP and the workspace lists film approval as pending. Task 1 therefore still uses the existing inspection images; no supplied film was replaced, modified or presented as approved. Before release, the employer/content owner must identify the approved clip(s), confirm whether the audio is meaningful, supply/approve captions or a transcript where needed, and place approved files in a served asset location.

## Checks actually run

- Read `COPY.md`, project memory, protected Task 1 mechanic wording, Task 1 truth helpers and all Task 1 scene paths.
- Ran `git diff --check` during implementation and inspected the changed JSX.
- Inspected the supplied archive listing and used ffprobe on the 14 real MP4 files for duration, dimensions, audio and subtitle streams.
- Ran the project TypeScript check. It could not reach Task 1 because unrelated in-progress JSX errors exist in `src/components/scenes/close/pass.tsx`; those files were not changed.
- Parsed the eight changed Task 1 TypeScript/TSX files independently with the TypeScript compiler API; no syntax errors were reported. `git diff --check` also passed.
- No browser, workflow or package command was run.

## Remaining limitations

- Film selection, approval, serving and caption/transcript approval remain blocked as described above.
- The legacy `PassScene` and `CorridorScene` files are not imported by the current Task 1 page. They retain older interactions, but cannot be reached by active or saved progress; current saved rows are handled by the focused round and valid legacy rows remain recognised as saved.
- Inspection-marker history is intentionally session-local and does not add stored fields or alter old answers. Returning to an already checked appliance starts a fresh visual inspection while preserving its board entry.
- Automated type validation is pending resolution of the unrelated closing-scene parse error. This review is not a WCAG certification.