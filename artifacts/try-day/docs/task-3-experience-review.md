# Task 3 experience review

## Scope

Reviewed the Task 3 portioning, tray loading, probe placement, timed readings, cooling record and 90-minute decision. Protected task wording, internal IDs, saved task fields, the 13.5 kg quantity, authored readings, the 56 mm / 48 mm comparison and existing completion checks were not changed.

## Interaction review

| Activity | Before | After |
| --- | --- | --- |
| Portion planning | Tray depth and pan weight were mostly separate visual readings; trays became very narrow on phones. | A live “kg moved” summary, percentage bar, selected-tray capacity and plain depth feedback keep the 13.5 kg plan in view. Trays use two columns on the smallest layout. |
| Adding and returning food | A hold control was prominent; scoop controls existed but were less clearly explained. | The hold action is labelled as adding beef, and its text explicitly identifies the 0.5 kg press-button alternative. Return remains reversible. Controls are at least 44 px high where practical. |
| Loading shelves | Drag and drop was the only obvious way to load, space and remove trays. | A labelled native shelf selector is available for every trolley tray, alongside a clearly named return button for every loaded tray. Loaded quantity and spacing feedback are announced. Drag remains optional. |
| Placing the probe | The probe and cut-through targets depended on drag behaviour. | Every tray has a button that opens the cut-through view, and every probe position is also a 44 px button. The visual drag interaction remains available. |
| Measuring depth | The ruler depended on drag behaviour. | A named button measures the fullest tray; the ruler remains available as an optional direct manipulation. |
| Timed readings | The display changed visually after a hold. The input label was screen-reader-only. | A settled temperature is written as assertive status text, and the reading input has a visible label plus associated error text. Existing exact-reading validation is unchanged. |
| Cooling evidence | The live comparison was a small table that could require horizontal scrolling. | Phones receive readable comparison cards; larger screens retain the table. Both explain that the authored 56 mm / 48 mm evidence is not a prediction from the student’s arbitrary practice fills. |
| Final record | Mobile rows stayed table-shaped and a notebook button could copy a practical answer into the form. | Rows become readable stacked sections on small screens, with visible input labels. A saved notebook value is shown as reference but is not copied into the practical answer. |
| 90-minute explanation | Selection changed Terence’s dialogue, but the selected state had limited local feedback. | Choices expose pressed state, remain visible at 90 minutes, and provide immediate case-specific feedback without adding a new safety claim or changing the required choice. |
| Navigation and motion | Work-area tabs were small, locked reasons appeared on hover, and several camera/door transitions lasted 400–900 ms. | Tabs are 44 px, keyboard states and locked reasons are exposed, current work is identified, headings stay visible, and transitions are 150–200 ms with reduced-motion handling. Guide actions still navigate to work without carrying it out. |

## Checks run

- Read `COPY.md` and the project try-day memory before editing.
- Inspected the Task 3 state evaluator and scenario constants to confirm the existing gates and authored evidence.
- Ran the project TypeScript check. It could not complete because unrelated in-progress files in the closing and delivery activities currently contain JSX parse errors.
- Ran a Task-3-only TypeScript check using a temporary config. No Task 3 errors were reported; the check stopped on an unrelated existing error in `src/components/kitchen/kitchen-context.tsx` (“Not all code paths return a value”).
- Reviewed the owned-file diff and confirmed no package, workflow, shared model, guide or UI primitive was edited.
- Browser and workflow checks were intentionally not run, as requested.

## Remaining limitations

- The shared `HoldToRead` implementation remains outside this task’s ownership. Task 3 provides textual settled output and existing keyboard handling, but any further change to the shared control must be reviewed by its owner.
- The shared drag-and-drop implementation remains available but was not changed. Every Task 3 outcome that used it now has a button or native-select route.
- Employer approval of new food-safety teaching, captions, observations or service clearance was not inferred. This review only clarifies the supplied scenario and recorded comparison.
- This is a task-specific accessibility and interaction review, not a WCAG certification.