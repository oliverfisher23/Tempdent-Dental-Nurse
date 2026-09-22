# Dental Nurse Try Day

A Springpod try-day for TempDent, with content built to the signed-off dental nurse storyboard. Imagery remains placeholder pending TempDent photography, and briefing films are pending supply.

## Run & operate

- `pnpm --filter @workspace/try-day run dev` — run the web app.
- `pnpm --filter @workspace/try-day run typecheck` — typecheck the web app.
- `cd artifacts/try-day && node --import tsx --test tests/*.test.ts` — run the retained unit tests.
- `pnpm --filter @workspace/try-day run new-client -- --id <client-id> --name "<Employer>" --title "<Try day title>" --confirm` — cut another blank client from this template.
- No database or environment variables are required.

## Template version

- Shell version: `1.0.0` from `artifacts/try-day/src/shell/VERSION`.
- Client id: `tempdent-try-day`.
- Saved progress key: `springpod:tempdent-try-day:v2`.
- Sound preference key: `springpod:tempdent-try-day:sound-muted`.

## Stack

- pnpm workspaces, TypeScript, Vite, React, Tailwind and shadcn/ui.
- Frontend-only; learner progress stays in localStorage.

## Where things live

- `artifacts/try-day/src/` follows one dependency direction: `client -> shell -> kit`.
  - `src/shell/` — the generic try-day runner: welcome and briefing, the frame around every task (`shell/frame/`: `KitchenFrame`, `KitchenProvider`/`useKitchen`, map, step guide, notepad, dialogue, close-ups; API in its `README.md`), the close, the designer test panel, `lib/day.ts` (the `DayDocument`/`DaySpec` shape, generic `Progress`, `createDayRuntime`, localStorage persistence, host `postMessage`), `lib/client.ts` (the `TryClient` contract and `assertValidClient`, run once by `TryClientProvider` so a client missing a page, route, film or mentor fails on load with every gap listed) and `lib/progress-store.tsx` (`ProgressProvider`, `useProgress<TS>()`). Shell components read client data only through `useClient()` at render time, never by import. The `kitchen-*` file names and the `kitchenAudio` identifier are legacy; renaming them is a template follow-up.
  - `src/kit/` — reusable pieces with no knowledge of a try day: shadcn `ui/`, `lib/audio.ts` (one AudioContext, ambience bed per place as a `ToneSpec`, generated sounds; the mute key, opening tone and recorded loop URL all come from the client's `configure()` call), `lib/utils.ts`, hooks, and the instrument components (dial and analogue thermometers, kitchen scale, paper surfaces, check feedback).
  - `src/client/` — the replaceable TempDent employer client, with signed-off task content, placeholder pictures and briefing transcripts for films pending supply.
  - `src/client/scenes/README.md` — the stage engine contract for room scenes, speech, hotspots, close-up interactions, answer handling and stable test ids.
  - `src/client/content/mechanic.json` — the client day document and signed-off task copy once approved.
- `src/client/content/tasks/` — one file per task holding its dialogue, scenes and decisions (choice, checklist or sequence), each decision carrying the done-when clause it evidences and the mentor feedback. `index.ts` aggregates them and judges answers. Content is built to the signed-off TempDent storyboard.
  - `src/client/components/task-page.tsx` renders any task through the stage engine (`src/client/scenes/`): each decision carries a `present` (speech panel, hotspots on the room photograph, or a close-up: paper, order, tray, labels, bench, kit) that only changes where the learner works; `content/tasks/index.ts` still judges every answer. Hotspot coordinates are percentages of the 1024x640 place photograph and `hint` is the short pin label (`tests/presentation.test.ts` enforces the rules).
  - `src/client/assets/` — AI placeholder photography (places, portraits, close-ups, item cut-outs) fingerprinted in `content/media-fingerprints.json`; `tests/media-assets.test.ts` fails on any unrecorded change (accept with `UPDATE_MEDIA_FINGERPRINTS=1`), on files over 260 KB and on unreferenced pictures. Only the logo is marked approved.
  - `src/client/lib/simulation.ts` — generic task state (answers keyed by decision id) and done-when evaluation derived from the content. Set answers start as `[]`, not `null`, or the shell's saved-progress merge drops them. Sequence options must not be listed in their correct order (tested).
  - `src/client/theme.css` — employer theme tokens.

## Tests

- `node --import tsx --test tests/*.test.ts` — content, evaluation, presentation, media and boundary tests (the `unit-tests` check).
- `node tests/browser/run.mjs` — one Playwright spec per task (`tests/browser/<task>.spec.mjs`) playing the real app end to end at 1280x720 and 390x844 through the designer test panel; needs the `artifacts/try-day: web` workflow running (the `browser-specs` check). Helpers live in `tests/browser/harness.mjs`.

## Client scaffold

- Replace placeholder imagery when TempDent photography is supplied (re-crop to 1024x640 for places, re-check hotspot coordinates, update the fingerprint manifest and flip each file to `approved`).
- Keep one checklist item per clause in each task's `doneWhen`.
- Add task pages, workplace routes, device advice and briefing entries together; the client contract rejects missing entries at startup.
- Briefing entries intentionally have transcripts but no `src` until approved films are supplied.
- No recorded ambience loop is configured.
- Completed tasks remain frozen and task completion is posted to the embedding host.

## Boundaries

- Do not import `src/client/` from `src/shell/` or `src/kit/`.
- Do not put employer names, task ids, assets or copy into the shell or kit.
- Keep locale-specific copy and employer facts in the client.
