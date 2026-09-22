# Dental Nurse Try Day

A blank Springpod try-day client scaffold for TempDent. All employer content is marked DRAFT and must be replaced and approved before delivery.

## Run & operate

- `pnpm --filter @workspace/try-day run dev` — run the web app.
- `pnpm --filter @workspace/try-day run typecheck` — typecheck the web app.
- `cd artifacts/try-day && node --import tsx --test tests/*.test.ts` — run the retained unit tests.
- `pnpm --filter @workspace/try-day run new-client -- --id <client-id> --name "<Employer>" --title "<Try day title>" --confirm` — cut another blank client from this template.
- No database or environment variables are required.

## Template version

- Shell version: `1.0.0` from `artifacts/try-day/src/shell/VERSION`.
- Client id: `tempdent-try-day`.
- Saved progress key: `springpod:tempdent-try-day:v1`.
- Sound preference key: `springpod:tempdent-try-day:sound-muted`.

## Stack

- pnpm workspaces, TypeScript, Vite, React, Tailwind and shadcn/ui.
- Frontend-only; learner progress stays in localStorage.

## Where things live

- `artifacts/try-day/src/` follows one dependency direction: `client -> shell -> kit`.
  - `src/shell/` — the generic try-day runner: welcome and briefing, the frame around every task (`shell/frame/`: `KitchenFrame`, `KitchenProvider`/`useKitchen`, map, step guide, notepad, dialogue, close-ups; API in its `README.md`), the close, the designer test panel, `lib/day.ts` (the `DayDocument`/`DaySpec` shape, generic `Progress`, `createDayRuntime`, localStorage persistence, host `postMessage`), `lib/client.ts` (the `TryClient` contract and `assertValidClient`, run once by `TryClientProvider` so a client missing a page, route, film or mentor fails on load with every gap listed) and `lib/progress-store.tsx` (`ProgressProvider`, `useProgress<TS>()`). Shell components read client data only through `useClient()` at render time, never by import. The `kitchen-*` file names and the `kitchenAudio` identifier are legacy; renaming them is a template follow-up.
  - `src/kit/` — reusable pieces with no knowledge of a try day: shadcn `ui/`, `lib/audio.ts` (one AudioContext, ambience bed per place as a `ToneSpec`, generated sounds; the mute key, opening tone and recorded loop URL all come from the client's `configure()` call), `lib/utils.ts`, hooks, and the instrument components (dial and analogue thermometers, kitchen scale, paper surfaces, check feedback).
  - `src/client/` — the replaceable employer client. The generated version contains one DRAFT task, one place, one mentor, placeholder pictures and placeholder briefing transcripts.
  - `src/client/content/mechanic.json` — the client day document and signed-off task copy once approved.
  - `src/client/lib/simulation.ts` — task state and done-when evaluation.
  - `src/client/theme.css` — employer theme tokens.

## Client scaffold

- Replace every DRAFT string and placeholder asset before delivery.
- Keep one checklist item per clause in each task's `doneWhen`.
- Add task pages, workplace routes, device advice and briefing entries together; the client contract rejects missing entries at startup.
- Briefing entries intentionally have transcripts but no `src` until approved films are supplied.
- No recorded ambience loop is configured.
- Completed tasks remain frozen and task completion is posted to the embedding host.

## Boundaries

- Do not import `src/client/` from `src/shell/` or `src/kit/`.
- Do not put employer names, task ids, assets or copy into the shell or kit.
- Keep locale-specific copy and employer facts in the client.
