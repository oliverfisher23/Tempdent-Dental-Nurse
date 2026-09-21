---
name: Saved progress migrations
description: How learner progress in localStorage survives content changes (fewer units/lines/guests, new pre-filled defaults) and what silently breaks.
---

Rule: when task content changes shape, reason about a learner who saved progress under the old shape, then reloads.

- Extra stored keys are harmless. `loadProgress` merges the stored record over the initial shape key by key, so old rows for removed fridge units, order lines or guests simply stop being read. No cleanup pass is needed for removals.
- New non-empty defaults are NOT harmless. The merge lets a stored empty array or empty record win over a new pre-filled default, so a returning learner gets the old blank state and the new labels describing it ("Filled by Terence" over an empty row). Any new pre-filled default needs an explicit step in `loadProgress` that seeds it only for untouched, not-yet-completed records.
- Completed legacy records stay frozen exactly as signed off. Never seed or re-evaluate them.

**Why:** the client shortened the Simulation (fewer fridge units, delivery lines, chill readings, guests) and Terence's pre-filled allergen rows were the one change that would have regressed returning learners. A code-review round caught it; the tests did not.

**How to apply:** for every content change, add a regression test that writes an old-shape fixture into the fake `window.localStorage`, loads it, and asserts both the seeded default and the frozen completed record. Existing examples live beside the other legacy-save tests in the try-day node suite.

Related delivery lesson: paperwork that offers controls only for the answer-key lines (salmon, cream) leaks the answer. Derive "this line needs an amendment" from the learner's own sheet decisions, prune amendments whose line no longer differs from the claim, and have review reject any leftover amendment on other lines so a stale one cannot be signed over.
