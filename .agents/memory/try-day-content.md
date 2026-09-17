---
name: Try-day content conventions
description: Non-obvious rules for the Marriott try-day simulation: spec copy, brand assets, completion contract, host integration.
---

- The spec (`mechanic.json`) wording is client-signed. Do not paraphrase it even when it reads oddly; wrap UI labels around it instead. The shell renders `doneWhen` and `complication` verbatim and uses per-clause checklist labels only as progress ticks underneath.
  **Why:** Springpod/Marriott approved that register; edits would need re-approval. A review round flagged paraphrased done-when labels as a defect.
  **How to apply:** new copy goes in `activities.ts` (dialogue, labels), never by editing the spec strings.
- Completion contract: a task in `completed` is frozen read-only (browser Back cannot undo signed-off paperwork), tasks unlock strictly in order, and done-when checks validate against the simulated truth (readings, weights, quantities, allergen rows, board note content), not just "field is non-empty".
  **Why:** the gate posts `gate:complete` to the host; anything that lets a student bypass or later invalidate a task breaks that contract.
  **How to apply:** put any new rule in `lib/simulation.ts`, keep pages render-only, and make sure every wrong turn has a way back (a review found an unrecoverable tray placement once).
- The "Be" logo SVG the client supplied is the full "Be | Marriott Bonvoy" lock-up (coral script + black wordmark). It only works on light backgrounds and must never be recoloured (no `invert`/`brightness` filters).
  **Why:** People Brand guide rules; the first design pass inverted it on the dark-blue close page and had to be redone.
  **How to apply:** on dark floods, put the logo in a cream header strip; ask the client for a reversed version if one is ever needed.
- Host integration (`postMessage` with `gate:complete`) is an assumed contract; the Springpod App Registry MCP server was unreachable when built (Sept 2026). Confirm the event shape before the client embeds the iframe.
- Verification approach that worked: drive each task end to end with playwright-core (chromium at `/repl/tools/bin/chromium`, `--no-sandbox`) against the running dev server, seeding localStorage to reach later tasks. Screenshots alone missed wiring bugs.
- The frozen-task contract is enforced in the progress store itself (task updates, jots and unjots for a completed task are no-ops) and the finished scene is made `inert`; do not rely on overlay z-index or hidden buttons to protect signed-off paperwork.
  **Why:** a review found the read-only blocker shared `z-40` with the HUD, so the map and notepad still worked and late timers could rewrite a completed task.
  **How to apply:** any new write path in the store must check `prev.completed` first; any new overlay/HUD control must be hidden when `finished`.
- Overlays portaled to `document.body` must sit below the fixed 56 px header with `top-14 bottom-0`, not `inset-0` plus a margin (that overflows the viewport and clips the bottom of the paper, e.g. the fridge "Jot it down" button).
- Playwright screenshots taken straight after opening a framer-motion overlay or crossfading a scene capture the mid-fade frame and look translucent or empty; wait about 600 ms (2–4 s after a walk) before judging a screenshot as a bug.
- Parallel subagents must never share a file: two agents "fixing" `scenes/chill/bench.tsx` at once re-introduced a bad import twice. Give each agent one task's folders only and keep framework files for the main agent. An agent given a whole-frame rebuild in one go ran out of context and ended without a report; scope one surface per run.
- Renaming a visible button label (sentence-case sweeps included) breaks the e2e scripts in `/tmp/e2e/task{1..5}-kitchen.mjs`, which select by accessible name; update them in the same change.

