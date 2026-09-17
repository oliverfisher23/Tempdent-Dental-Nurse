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
