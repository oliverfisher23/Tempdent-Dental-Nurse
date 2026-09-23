---
name: Reading order and gesture refusals
description: Spots from content maps render in reading order (DOM order leaks routine order otherwise); which presentation-level refusals are allowed and why.
---
Rule 1: any spots rendered from a content `Record` (path zones, controls, turnaround controls/wipe zones) go through `inReadingOrder` (left to right, then top to bottom). Content authors naturally list a routine's steps in their expected order, and DOM order is what Tab and a screen reader follow. `tests/v2-invariants.test.ts` asserts the rendered order differs from the answer order.

Rule 2: a presentation may refuse an *incomplete* gesture (hold released early, wipe path that missed zones) but must not refuse a *wrong* answer, except where the storyboard specifies the world reaction (peel-and-stick label lifts off with the V1 line). Such an exception must mirror the content key exactly and be pinned by a test (`accepts` == `correct`).

**Why:** the architect review of the V2 build found the turnaround wipe judging its own order in the component (with an order hint in the aside) and controls listed in the exact answer order. Both slipped past the browser specs because those play the right order.

**How to apply:** when adding a presentation with its own map, sort for rendering, keep judging in `content/tasks/index.ts`, and add the new kind to the invariants test.
