---
name: Storyboard-driven task content
description: Rules for turning a try-day storyboard into decision content (evidence per clause, feedback tone, ordering, shell merge constraints).
---

- Every done-when clause needs a decision that actually tests it. Never assert a step in a prompt's context ("Fresh handwash done...") when the storyboard lists it as evidence; add a choice for it instead.
  **Why:** code review flagged that the evaluator trusts each decision wholesale, so an asserted step signs the clause off with no learner action.
  **How to apply:** when a storyboard row's evidence names several items (three batch numbers, a three-way sort), the decision must cover all of them, e.g. a checklist across all packages or a follow-up choice for the leftovers.
- Wrong feedback coaches the principle; it must not list the order or name the option. Lines quoted verbatim from the storyboard are the storyboard author's call and stay as written, flagged in the report.
  **Why:** the learner can retry, so listing the answer turns the retry into copying.
- Sequence options are never listed in their correct order (a test enforces it); shuffle by hand in the content file so the list still reads sensibly.
- Shell constraint: the shell's saved-progress merge keeps the default when array-ness differs, so set answers default to `[]`, choice answers to `null`. Bump `config.version` when the answer shape changes.
- Rendered behaviour is only covered by the Playwright harness (no jsdom runner in the package); keep the harness scripts under `/tmp` recreatable from the pattern in `browser-capture-harness.md`.
