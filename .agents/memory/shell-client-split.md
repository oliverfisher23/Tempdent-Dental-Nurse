---
name: Shell / kit / client split
description: The template boundary in artifacts/try-day (client -> shell -> kit), how the shell reaches client data, and the traps hit while inverting the dependency.
---

**Rule:** `src/client/` may import `@shell/*` and `@kit/*`; `src/shell/` may import `@kit/*` only; `src/kit/` imports neither. Shell components read client data through `useClient()` at render time, never at module evaluation. `src/main.tsx` and `src/index.css` are the only composition roots. `tests/boundary.test.ts` enforces imports and scans shell and kit for kitchen proper nouns, task ids and asset paths.

**Why:** Each new client (next: TempDent dental nurse) is a remix of this project with `src/client/` replaced wholesale and shell/kit pulled forward unchanged. Anything kitchen-specific left in shell or kit breaks the next client's build or ships kitchen sound/alt text into a dental surgery.

**How to apply:**
- New shell needs (a label, a picture, a URL, a tone) go on the `TryClient` contract in `shell/lib/client.ts` and are supplied from `client/index.tsx`, not hard-coded. Leaks found by review after the first pass: the ambience loop URL in the audio kit and the map alt text; comments count too (the boundary scan reads whole files).
- `TryClientProvider` runs `assertValidClient` once per client object; extend `clientProblems` when the shell starts looking something new up by id.
- The designer fixture target is tri-state: `undefined` = blank day, `null` = every task complete, id = that task in progress. Any wrapper between the store and the client model must preserve all three (the first wrapper collapsed `undefined` into `null` and the Briefing/Reset controls seeded a finished day; `tests/day-runtime.test.ts` guards it).
- Content modules under `src/client/content/` import their own pictures, so node tests that need them must `register('./support/asset-loader.mjs', import.meta.url)` before a dynamic import. `src/client/index.tsx` itself cannot be loaded under node (pages, CSS); mirror its lookups from the same content instead.
- CSS: the Google Fonts `@import` must be the first statement in the final bundle, so `index.css` imports `client/theme.css` before `shell/styles/base.css`; Tailwind v4 resolves `@apply` in theme.css even though `tailwindcss` is imported later. Verify with a `PORT=… BASE_PATH=/ pnpm run build` and check the head of the emitted CSS.
- `git stash` while the move is uncommitted turns staged renames into add + unstaged delete pairs; run `git add -A` afterwards or the diff stops showing renames. Avoid stashing mid-refactor.
- Deferred to the template pass: renaming `kitchen-*` shell files, `Kitchen*` components and `kitchenAudio`; pre-existing dead exports (`PLACE_ORDER`, `YVIE_PERSON_ID`, `MECHANIC`).
