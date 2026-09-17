# Marriott Sous Chef Try Day

An interactive day-in-the-life web simulation for students: one shift (06:45–15:00) as a trainee sous chef in the main kitchen of the Courtyard by Marriott Sandy Park, Exeter, built to the Springpod `try-day-app` mechanic (id `mar-try-day`).

## Run & Operate

- `pnpm --filter @workspace/try-day run dev` — run the try-day web app (workflow `artifacts/try-day: web`, binds `PORT`)
- `pnpm --filter @workspace/try-day run typecheck` — typecheck the web app only
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
- `artifacts/try-day/src/assets/` — `be-logo.svg` (the "Be | Marriott Bonvoy" lock-up), `sous-chef.webp` (intro photo; rights unconfirmed by client).
- `artifacts/try-day/src/index.css` — theme tokens (brand palette as HSL variables).
- `BUILD_BRIEF.md` — framing, brand rules and per-task interaction design used for the first build.
- `attached_assets/` — original spec, brand tokens markdown and the People Brand style guide PDF.

## Architecture decisions

- Frontend-only v1. Progress is saved to localStorage under `springpod:mar-try-day:v1` so a student can leave and come back; "start again" clears it.
- Content and rules are separated from UI: `content/` holds data, `lib/simulation.ts` decides what counts as done, pages only render. Change a reading, a quantity or a done-when rule in those files, not in components.
- Done-when checks validate against the simulated truth (probe readings within 0.3 °C, weights within 0.15 kg, counted quantities and line statuses against what actually arrived, allergen rows against the recipe cards, the evening-board note naming the guest and the dish) so the forms cannot be filled with anything at all.
- A completed task is frozen: revisiting it (browser Back, typed URL) shows it read-only with a link to the current task, so finished paperwork cannot be undone after `task:complete` has been posted.
- The task shell shows the spec's `doneWhen` and `complication` text verbatim; the per-clause ticks under it are progress indicators derived in `simulation.ts`, and `complicationRevealed()` decides when the complication box appears.
- Gate type is `complete`: finishing all five tasks completes the section. On each task completion and on day completion the app posts `{ source: "springpod", format, mechanic: "try-day-app", id: "mar-try-day", event: "task:complete" | "gate:complete", ... }` to `window.parent`. The host contract is assumed (the Springpod App Registry was unreachable when built); confirm before integration.
- Role label follows the spec ("Trainee sous chef, main kitchen"). The user's first message said "Executive Sous Chef"; swap in one place if they want that.

## Product

- Intro: morning brief, the people, the workplace and shift rhythm, student name entry (initials reused on every form), continue/start again.
- Five tasks in order, each locked until the previous is done: take the handover and walk the fridges; check the delivery in; chill the batch for tonight; check tonight's dietary list; weigh the waste and hand the kitchen on. Each has real forms, Marcus's dialogue, a complication, and a live done-when checklist.
- Close of day: spec copy, recap drawn from the student's own entries, "Be curious. Be purposeful. Be you.", completed-section state.

## User preferences

- Locale en-GB (spelling, 24-hour times, °C, kilos). Spec copy verbatim. Calm, practical, warm register; no gamification, no scores, no emojis.

## Gotchas

- Brand rules from the People Brand guide: cream page, Bonvoy Black text, coral used sparingly; the logo lock-up goes on cream/white only, never recoloured or below 18 px high; only the approved "Be ___." lines (curious / purposeful / you).
- Ridley Grotesk is Marriott's licensed typeface and is not available here; the app uses a system sans stack.
- The intro photo's rights are unconfirmed by the client (see TODO in the intro page).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
