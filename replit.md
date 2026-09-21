# Marriott Sous Chef Try Day

An interactive day-in-the-life web simulation for students: one shift (06:45–15:00) as a trainee sous chef in the main kitchen of the Courtyard by Marriott Sandy Park, Exeter, built to the Springpod `try-day-app` mechanic (id `mar-try-day`).

This is an LMS-embedded learner experience, not a public marketing site. Keep the landing page focused on a visual welcome, a short briefing and the learner's expand/start flow. See `artifacts/try-day/EMBEDDING.md` for iframe permissions and integration boundaries.

## Run & Operate

- `pnpm --filter @workspace/try-day run dev` — run the try-day web app (workflow `artifacts/try-day: web`, binds `PORT`)
- `pnpm --filter @workspace/try-day run typecheck` — typecheck the web app only
- `pnpm --filter @workspace/try-day run test:delivery:browser` — delivery-only desktop/phone regression against the running web workflow; isolated designer session and iframe host checks. See `artifacts/try-day/docs/delivery-browser-regression.md`.
- `pnpm --filter @workspace/try-day run test:fridge-round` — the complete Task 1 fridge round in a real browser, from the overnight log through all four appliances on the learner’s round; starts its own Vite server on port 4174. Separate from the fast `tests/*.test.ts` regression. See `artifacts/try-day/e2e/README.md`.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run dev` — the scaffold API server (not used by the try-day app in v1)
- No database and no env vars are needed for the try-day app. `DATABASE_URL` is only needed if the scaffold API server is run.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: Vite + React + Tailwind + shadcn/ui, wouter routing, framer-motion
- Scaffold API (unused by v1): Express 5, PostgreSQL + Drizzle, Zod, Orval codegen

## Where things live

- `artifacts/try-day/src/content/mechanic.json` — the client-approved spec, copied verbatim. All narrative copy (morning brief, task situation/job/materials/done-when/complications, close of day) comes from here and must not be paraphrased.
- `artifacts/try-day/src/content/activities.ts` — interactive data: fridge units and true readings, overnight log, order lines and what really arrived, prep sheet and chiller readings, the 14 UK allergens, dishes/recipe cards, function sheet and added guests, waste bins, handover prompts, Elena's question, dialogue lines.
- `artifacts/try-day/src/lib/simulation.ts` — per-task state shapes, initial state, `evaluate*` done-when checks (one checklist item per clause of the spec's `doneWhen`), localStorage persistence, host `postMessage`.
- `artifacts/try-day/src/lib/progress-store.tsx` — `ProgressProvider` / `useProgress()` React store.
- `artifacts/try-day/src/content/kitchen.ts` — the kitchen as a place: `PLACES` (pass, corridor, goods-in, bench, events) with map coordinates and backdrops, `TASK_ROUTES` (where each task starts and which places it uses), `PEOPLE` with portraits, `CRATE_IMAGES`. Task 1 is a focused workspace (no room navigation), so the fridges photograph is shown faded behind its overnight log and board pages via `scenes/handover/fridge-backdrop.tsx`.
- `artifacts/try-day/src/components/kitchen/` — the immersive frame: `KitchenFrame` (HUD, clock, job card, scene crossfade), `KitchenProvider`/`useKitchen` (place, `goTo`, map, notepad), `KitchenMap`, `NotepadDrawer`, `Speech`, `Hotspot`, `CloseUp`, paper surfaces, `SoundToggle`. API in its `README.md`.
- `artifacts/try-day/src/components/scenes/<task>/` — per-task scenes (one component per place); `src/content/scenes/<task>.ts` holds scene-only dialogue and labels.
- `artifacts/try-day/src/lib/audio.ts` — `kitchenAudio`: one AudioContext, ambience bed per place, generated interaction sounds, mute persisted under `springpod:mar-try-day:sound-muted`.
- `artifacts/try-day/src/assets/` — `artotel-logo.png`, `kitchen/` (AI-generated isometric map, the illustrated goods-in and events backdrops that are still waiting for photographs, fish box and crate pictures), `kitchen/photos/` (client photographs of Terence: welcome hero, briefing circle at 1x and 2x, dialogue avatar, pass, fridges and bench backdrops), `kitchen/inspections/videos/` (the supplied fridge clips with their `README.md` and `APPROVAL.md` beside them), `public/audio/kitchen-ambience.mp3`. Every picture and clip under `src/assets/` is imported by live code (only the two inspection notes beside the clips are not); the generated scene pictures and portraits that the photographs replaced, the interior pictures only the retired handover scenes used, and the stock ingredient photos held for a superseded goods-in prototype (one had unconfirmed reuse permission), were deleted on 2026-09-19, so a file that nothing imports should go rather than stay "for reference"; `tests/asset-orphans.test.ts` enforces this by failing the suite and naming any file under `src/assets/` (other than `.md` notes and `sources.json`) whose filename no `.ts`/`.tsx`/`.json` under `src/` outside `src/assets/` mentions. Task 2 has exactly one goods-in scene, `components/scenes/delivery/goods-in.tsx` with `DeliveryRow`; the earlier `GoodsInSceneRedesign` prototype and its `lib/redesign-delivery.ts` checklist are gone (the `DeliveryRedesignState` field stays in `simulation.ts` because saved progress may still carry it). `PHOTOGRAPHY-SHOT-LIST.md` records which shots have arrived and which are outstanding.
- `artifacts/try-day/scripts/prepare-kitchen-photos.mjs` regenerates `kitchen/photos/` from `attached_assets/Images_*.zip` using the crops in `src/content/kitchen-photos.json` (auto-orient, strip metadata, WebP, fridge readouts blurred); `tests/kitchen-photos-assets.test.ts` checks the exports against the manifest. The 4240 px originals stay in `attached_assets/`, never under `src/`.
- `artifacts/try-day/src/index.css` — theme tokens (brand palette as HSL variables).
- `BUILD_BRIEF.md` — framing, brand rules and per-task interaction design used for the first build.
- `artifacts/try-day/docs/` — learning-design review and approval records (e.g. `closing-handover-approval.md`, `dietary-learning-redesign.md`). Keep review documents here, not under `.local/` (gitignored, not preserved between task environments). An approval record is content sign-off only; implementation needs its own assignment.
- `attached_assets/` — original spec, brand tokens markdown and the People Brand style guide PDF, the client photo and video archives, and the platform's `generated_images/` output folder. Downloaded stock pictures do not belong here: the ingredient originals kept for the superseded goods-in prototype were deleted with it on 2026-09-19.
- `artifacts/try-day/exports/artotel-try-day-current-images.zip` — the client-facing "current images" export (README, manifest and every image the production build ships, at project-relative paths). It is built by hand from `public/favicon.*` plus every image under `src/assets/`, so regenerate it and refresh its Library card whenever a shipped picture is added or removed.

## Architecture decisions

- Frontend-only v1. Progress is saved to localStorage under `springpod:mar-try-day:v1` so a student can leave and come back; "start again" clears it.
- Content and rules are separated from UI: `content/` holds data, `lib/simulation.ts` decides what counts as done, pages only render. Change a reading, a quantity or a done-when rule in those files, not in components.
- Done-when checks validate against the simulated truth (probe readings within 0.3 °C, weights within 0.15 kg, counted quantities and line statuses against what actually arrived, allergen rows against the recipe cards, the evening-board note naming the guest and the dish) so the forms cannot be filled with anything at all.
- A completed task is frozen: revisiting it (browser Back, typed URL) shows it read-only with a link to the current task, so finished paperwork cannot be undone after `task:complete` has been posted.
- Immersive presentation (v2): each task is a set of scenes the student stands in (backdrop = atmosphere, interactive objects rendered as real buttons in front), moved between via the kitchen map. Readings, counts and weights are captured at the object into the student's notebook (`progress.notepad`, `jot`) and written up onto the paperwork with "Use my note" chips; the kitchen clock (`progress.clock`) advances with walks, probing and waiting. Generated pictures are never click targets and nothing is pixel-aligned to them.
- Tasks open directly in the room. The persistent step guide opens the next workspace and handles room changes; the map and job card are optional tools, never automatic interruptions. `KitchenProvider` still animates walks through `mapPhase` (`closed | open | walking | entering`); reduced-motion students move directly.
- Navigation guides live in `content/guides/` and only open workspaces via `useKitchenAction`; they must never perform practical work or bypass the completion checks. The step guide remains above close-ups, and its completion button signs off through the same validated store action as the job card.
- Characters drawn in a scene register with `usePresent(personId, bubbleFromPercent)` so the speech bubble drops its own portrait and sits beside them instead of showing the same face twice.
- All words the app says follow `artifacts/try-day/COPY.md` (verb-first labels, one kitchen word at a time with a gloss on first use, "notebook" not "notepad", sentence case, no trailing dots). Spec copy is exempt and stays verbatim.
- The task shell shows the spec's `doneWhen` and `complication` text verbatim; the per-clause ticks under it are progress indicators derived in `simulation.ts`, and `complicationRevealed()` decides when the complication box appears.
- Gate type is `complete`: finishing all five tasks completes the section. On each task completion and on day completion the app posts `{ source: "springpod", format, mechanic: "try-day-app", id: "mar-try-day", event: "task:complete" | "gate:complete", ... }` to `window.parent`. The host contract is assumed (the Springpod App Registry was unreachable when built); confirm before integration.
- Role label follows the spec ("Trainee sous chef, main kitchen"). The user's first message said "Executive Sous Chef"; swap in one place if they want that.

## Product

- Intro: morning brief, the people, the workplace and shift rhythm, student name entry (initials reused on every form), continue/start again.
- Five tasks in order, each locked until the previous is done: take the handover and walk the fridges; check the delivery in; chill the batch for tonight; check tonight's dietary list; weigh the waste and hand the kitchen on. Each is played inside the kitchen: the student stands in a scene (the pass, the fridge corridor, goods-in, the prep bench, the events kitchen), opens the map to walk between places, clicks the things around them (clipboards, fridge doors, crates, the probe, the scales) to open close-ups, jots readings and counts into a pocket notepad, and writes the paperwork up from it. Marcus and the others speak in a bubble; the job card (spec copy, done-when ticks, complication) slides in from the right; the kitchen clock moves with walks, probing and waiting. Ambient kitchen sound and quiet interaction sounds, with a mute control.
- Task 2 has six delivery lines. Salmon is accepted short at 8 kg and reported to Terence. Cream reads 7.8 °C against a 5 °C limit and is refused at 0 accepted. Both lines need separate initialled amendments on the single delivery note before its one signature.
- Tasks 3 and 4 have fixed dead ends worth knowing: the blast-chiller cycle only starts once the trays are spaced and the probe is placed, and each reading must be written on the chill record before the next wait (0, 60, 90 and 120 minutes); the function sheet travels with the student (pocket copy in the events kitchen).
- Task 4 is menu-first (spec: `artifacts/try-day/docs/dietary-learning-redesign.md`, decisions D01–D12): function sheet at the pass (added-guest details locked) → allergen chart with Terence's tart, beef and Wellington rows pre-filled, plus two empty dessert rows, five review confirmations and Terence's review (source → component → mapping → explicit hint ladder, unlimited retries) → guest decisions for Priya and Tom, mains and desserts only (flag / evidence / keep-swap-ask / reason; each course must actually be checked with Terence, recorded in `redesign.courseReviewed`, and any edit clears that check) → evening board with a separate preparation status that is never green. Terence's beef row deliberately starts without celery. Changing a chart row or a decision reopens the board. Tom's starter stays an open item for Terence; nothing in the task is ever "cleared to serve". Later tasks read `guests.priya.dessert === 'pear'`, `boardNote` (plain text) and `dietaryHandoverRecord()`; keep those stable. Legacy signed-off records without `redesign` are shown frozen and never rewritten.
- Close of day: spec copy, recap drawn from the student's own entries, "Be curious. Be purposeful. Be you.", completed-section state.

## User preferences

- Locale en-GB (spelling, 24-hour times, °C, kilos). Spec copy verbatim. Calm, practical, warm register; no gamification, no scores, no emojis.

## Gotchas

- Brand rules from the People Brand guide: cream page, Bonvoy Black text, coral used sparingly; the logo lock-up goes on cream/white only, never recoloured or below 18 px high; only the approved "Be ___." lines (curious / purposeful / you).
- Ridley Grotesk is Marriott's licensed typeface and is not available here; the app uses a system sans stack.
- The intro photo's rights are unconfirmed by the client (see TODO in the intro page).
- Close-ups are portaled to `document.body` and offset below the 56 px header (`top-14 bottom-0`); overlays (close-up, map, notepad, job card) share the `useFocusTrap` hook in `components/kitchen/`. Hide any new HUD control when the task is `finished`; the store already ignores writes to completed tasks.
- End-to-end scripts live outside the repo in `/tmp/e2e/task{1..5}-kitchen.mjs` (playwright-core against the dev server) and select controls by accessible name, so label changes need matching test edits. Because of the opening map shot, a script must wait for the "Close the job card" button (up to ~4 s) before interacting, or click the map to skip the shot.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
