---
name: Try-day content conventions
description: Non-obvious rules for the Marriott try-day simulation: spec copy, brand assets, completion contract, host integration.
---

- The spec (`mechanic.json`) task wording is client-signed. Do not paraphrase jobs, `doneWhen` or complications; wrap UI labels around them instead. Employer/workplace branding may change when the user explicitly rebrands the experience.
  **Why:** Springpod/Marriott approved that register; edits would need re-approval. A review round flagged paraphrased done-when labels as a defect.
  **How to apply:** new copy goes in `activities.ts` (dialogue, labels), never by editing the spec strings.
- Completion contract: a task in `completed` is frozen read-only (browser Back cannot undo signed-off paperwork), tasks unlock strictly in order, and done-when checks validate against the simulated truth (readings, weights, quantities, allergen rows, board note content), not just "field is non-empty".
  **Why:** the gate posts `gate:complete` to the host; anything that lets a student bypass or later invalidate a task breaks that contract.
  **How to apply:** put any new rule in `lib/simulation.ts`, keep pages render-only, and make sure every wrong turn has a way back (a review found an unrecoverable tray placement once).
- art'otel is the current brand. The supplied logo is the white mark on a black rectangle; preserve that treatment rather than recolouring it.
  **Why:** the user supplied the 2026 art'otel guidelines and explicitly replaced the previous Marriott/Be branding.
  **How to apply:** use black/white with a restrained vivid-red accent, editorial serif headings, clear sans body copy, left alignment, and the voice principles “Clever. Cultured. Clear.”
- Keep the existing internal mechanic/gate IDs when changing visible branding.
  **Why:** those IDs are used for saved progress and host completion messages; changing them would be an integration migration, not a visual rebrand.
  **How to apply:** update visible employer, workplace, metadata and assets while preserving storage/event identifiers unless a migration is explicitly requested.
- The current scenario is art'otel Hoxton preparing a product launch for 100 guests. Terence is the executive sous chef/mentor; Yvie handles events.
  **Why:** the filming script supplied on 2026-09-18 supersedes the earlier wedding scenario and Marcus/Sarah/Elena character framing.
  **How to apply:** use Terence and Yvie in all visible copy. Preserve legacy internal person IDs and progress keys until an explicit data migration is planned.
- Host integration (`postMessage` with `gate:complete`) is an assumed contract; the Springpod App Registry MCP server was unreachable when built (Sept 2026). Confirm the event shape before the client embeds the iframe.
  **Why:** no host capability handshake has been verified. Do not invent an LMS resize/launch message or use top-window navigation as a fullscreen substitute.
  **How to apply:** use user-initiated browser fullscreen when permitted; retain a usable in-frame path when unavailable. Keep host permissions under LMS control.
- Verification approach that worked: drive each task end to end with playwright-core (chromium at `/repl/tools/bin/chromium`, `--no-sandbox`) against the running dev server, seeding localStorage to reach later tasks. Screenshots alone missed wiring bugs.
- For timed interactions, keep the input held until the UI reports completion rather than assuming a short fixed delay.
  **Why:** early releases once produced matching mouse and keyboard failures that looked like broken probe wiring, but the control was correctly rejecting incomplete measurements.
  **How to apply:** await the settled state or enabled reading field before releasing; verify early release separately as an expected negative case.
- The frozen-task contract is enforced in the progress store itself (task updates, jots and unjots for a completed task are no-ops) and the finished scene is made `inert`; do not rely on overlay z-index or hidden buttons to protect signed-off paperwork.
  **Why:** a review found the read-only blocker shared `z-40` with the HUD, so the map and notepad still worked and late timers could rewrite a completed task.
  **How to apply:** any new write path in the store must check `prev.completed` first; any new overlay/HUD control must be hidden when `finished`.
- Portaled workspaces must reserve the entire navigation area, including the responsive step guide, not assume a fixed header height or add a margin to a full-height overlay.
  **Why:** the previous overlay approach clipped paperwork controls; reserving only the header also covers the student's next-step control.
  **How to apply:** keep the guide visible above paperwork and include it in keyboard navigation when a workspace is open.
- Playwright screenshots taken straight after opening a framer-motion overlay or crossfading a scene capture the mid-fade frame and look translucent or empty; wait about 600 ms (2–4 s after a walk) before judging a screenshot as a bug.
- Parallel subagents must never share a file: two agents "fixing" `scenes/chill/bench.tsx` at once re-introduced a bad import twice. Give each agent one task's folders only and keep framework files for the main agent. An agent given a whole-frame rebuild in one go ran out of context and ended without a report; scope one surface per run.
- Renaming a visible button label (sentence-case sweeps included) breaks the e2e scripts in `/tmp/e2e/task{1..5}-kitchen.mjs`, which select by accessible name; update them in the same change.

- Copy rules live in `artifacts/try-day/COPY.md`; the user's complaint was that labels read "very AI-generated" ("what does walk to goods-in mean"). Kitchen words get a plain gloss the first time; the student's tool is a "notebook", never "notepad"/"jot".
  **How to apply:** hand COPY.md to any subagent doing UI text, and tell it to change label *content* in the content files, not to hard-code strings in components (one agent replaced a `c.label` loop with an inline ternary, dropping the reasoning from a decision's options).
- E2E lesson: a Playwright `div:has-text("Name") >> button` selector matches the outermost container and can click the wrong row while the run "passes". Give repeated controls unique accessible names ("Poached pear for Priya Nair"), select by role + name, and assert the outcome (URL / stored state), never just "no exception". The scripts live in `/tmp/e2e` and vanish with the container.
- A scene that works on desktop can still hide a control on a phone (the HUD column sits over the top-right of the stage; a hotspot there was unreachable for a whole round while desktop tests passed). Run every e2e pass at both viewports.
- Distinguish navigating to the work from doing the work. Guide students directly to the next workspace, but leave the measuring, pouring, decisions and signatures to them.
  **Why:** the user wanted less click-through activity, then found the immersive version too difficult to navigate. Hiding where to go is not the intended learning challenge.
  **How to apply:** preserve practical interactions and validation while removing mandatory map searches, repeated paperwork trips and automatic tool interruptions.
- Keep the fridge round focused on one appliance: measure and write its final record together, then deliberately close it before moving on. Use task-relevant photorealistic contents.
  **Why:** the user explicitly approved this alternative to visiting all appliances first and transferring notebook readings later; the full-screen fridge is the intended focus.
  **How to apply:** keep the notebook optional, never advance on a probe result alone or fill in the learner's reading, and assemble the final board from saved checks without repeat transcription.
- Fridge notes should come from inspecting clickable details in the appliance, not from a static block that gives the answer away.
  **Why:** the user wants Task 1 to feel interactive and asked for context learners can reveal before writing their notes.
  **How to apply:** use short, conversational findings; let the learner turn those findings into their own note rather than auto-filling it.
- A planned learning complication must not require violating the task's own preparation instruction. Capacity and authored comparison evidence need joint employer approval, not an isolated numerical correction.
  **Why:** preserving a scripted cooling complication is not justification for teaching contradictory preparation; fixed example readings are not physical predictions for arbitrary learner choices.
  **How to apply:** when redesigning the chill activity, agree the tray supply/capacity, whole-batch accounting and comparison scenario together before changing content or validation.
