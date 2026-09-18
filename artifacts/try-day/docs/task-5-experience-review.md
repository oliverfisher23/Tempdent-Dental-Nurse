# Task 5 experience review

## Scope

Reviewed the waste weighing, discrepancy correction, handover composition, evening-team exchange and cooling-record reflection in Task 5. Protected task wording, IDs, saved state and completion gates were not changed.

## Interactions: before and after

- **Waste weighing:** Previously, the animated display had no explicit accessible settled state, bin controls relied heavily on visual styling, and weight fields had no associated labels or discrepancy message. It now announces settling/settled status, exposes pressed and weighed states, labels every field, uses decimal keyboards on mobile, and gives immediate match/mismatch feedback without filling an answer.
- **Waste judgement:** Previously, the follow-up form disappeared after saving and described the proposal as “logged”. It can now be reviewed and revised, asks what evidence should be found before acting, and states that the action is proposed rather than completed.
- **Handover evidence:** Previously, facts, scenario information and proposed actions appeared in one hints-and-evidence rail, while hint buttons inserted text into the learner’s form. Evidence provenance is now explicit and prompts are read-only review questions; learners still compose every required topic themselves.
- **Prioritisation:** Previously, timing buttons had little feedback and small targets. They now have grouped semantics, pressed states, 44px targets, named responsibility fields, evidence-led timing feedback and a persistent pending-action message. Sensible choices remain possible; required topics are unchanged.
- **Evening-team exchange:** Previously, the exchange used generic error feedback and acceptance copy could imply the kitchen was ready. It now moves focus safely to the questions, announces errors and saved answers, and explicitly keeps the delivery, fridge check, and dietary preparation/service checks pending.
- **Cooling reflection and signatures:** Terence’s protected question and both-signature gate remain. The review now explains what the signature confirms, provides announced answer feedback, removes a fabricated initials fallback, and avoids implying service clearance.
- **Mobile and motion:** Close-ups now use a single readable scroll region on small screens, responsive cards and full-width controls. New 200ms transitions use `motion-safe`, so reduced-motion users do not receive them.

## Checks actually run

- `git diff --check` on owned Task 5 files: passed.
- `pnpm typecheck`: Task 5 changes passed parsing/type analysis; the project check remains blocked by an existing shared-file error at `src/components/kitchen/kitchen-context.tsx:96` (`TS7030`, not all code paths return a value). That file was outside this task’s ownership and was not edited.
- Browser and workflow tests were not run, as requested.

## Remaining limitations and employer review

- The employer still needs to approve the closing handover prompts and completion checks, including the cooling comparison teaching and the scope of Terence’s sign-off.
- Pending delivery, fridge, dietary preparation and service checks remain intentionally unconfirmed. The interface does not claim they happened.
- Shared `CloseUp`, frame, progress-store and completion-model behaviour were not changed. The existing store/final-frame implementation remains responsible for freezing completed work.
- This is a task-specific accessibility review, not a claim of WCAG certification. Keyboard, screen-reader and touch behaviour should be covered in the main integrated browser test.