---
name: Short-viewport variant
description: The `short:` Tailwind variant for laptop windows with little height; threshold, why, and what not to try again.
---
Rule: compact layouts for low windows use the custom variant `short:` = `(min-width: 40rem) and (max-height: 44rem)` (declared in the artifact's index.css), never ad-hoc `max-h` media queries or JS height checks.

**Why:** a reviewer on a laptop could not see the Task 1 thermometer or the Task 4 chart without scrolling. 44rem (704px) keeps 1366×768 on the full layout while a browser with its chrome on a 768px laptop (~650px of viewport) and 1280×620 go compact. The min-width keeps phones on their own stacked layouts.

**How to apply:** trim the instruction layer first (opener eyebrow to sr-only, one-line guide bar, smaller headings, tighter gaps); never remove information that only exists there. A one-row opener at `short:` was tried and reverted: the sentence wrapped to four lines inside the 576px clipboard column. `VIEWPORT=1280x620 pnpm run test:learner-run` writes screenshots to `test-results/learner-run-1280x620/` for checking.
