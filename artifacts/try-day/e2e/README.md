# Browser checks

All commands run from the workspace root.

## Full learner run (QA)

```sh
pnpm --filter @workspace/try-day run test:learner-run
pnpm --filter @workspace/try-day run test:learner-run -- --from=task3   # resume a stage
VIEWPORT=phone pnpm --filter @workspace/try-day run test:learner-run   # 390x844, touch
INPUT=keyboard pnpm --filter @workspace/try-day run test:learner-run   # every control by focus + Enter/Space
```

Drives the whole experience the way a learner would: welcome, briefing, name,
Tasks 1 to 5, close of day, then a return visit. It uses only controls a learner
can see (no designer harness, no seeded fixtures) and reloads the page mid-task
to check saved progress. It targets the running web workflow (`BASE` defaults to
`http://localhost:80`). Output goes to `test-results/learner-run/` (or
`learner-run-phone/`): a screenshot per stage, a saved browser state per stage
for `--from=<stage>`, and `qa-log.json` with console errors, page errors, failed
requests, timings and any findings. The command exits non-zero when a stage
fails, on any page or console error, on any failed request other than a media
fetch the app itself aborted, or on a "major" finding; "minor" and "info"
findings are QA observations only. The phone run uses touch input for the
hold-to-read gestures. The keyboard run operates every control by focusing it
and pressing Enter or Space (Space held for the hold-to-read); a control that
cannot take focus or ignores the key is a "major" finding. At a few points the
run tries a wrong answer first (accepting the cream that must be refused,
reviewing with Terence before any row is reviewed, a wrong waste weight) and
records the kitchen's feedback as "info". Reloads mid-Task 2, 3 and 4 check
that the learner is put back at the workspace they were in.

## Before a merge

`typecheck`, `unit-tests`, `fridge-round` and `learner-run` are registered as
validation checks in the workspace, so they can be run together before a task
is merged. `learner-run` needs the web workflow to be up; the others do not.

## Complete fridge round

```sh
pnpm --filter @workspace/try-day run test:fridge-round
```

This starts an isolated Vite server, opens a clean Task 1 session at the
overnight log, and completes all four appliances through the real browser
flow. A failure names the appliance and the state being checked.

This command is intentionally separate from the fast approval snapshot
regression. The snapshot protects approved content and media bytes; this check
protects navigation, playback, clue interaction, form completion, and cleanup.
Unlike the delivery browser suite (`test:delivery:browser`, which targets the
running web workflow), this check does not need the preview to be up: it starts
its own Vite server on port 4174 at the root path and stops it afterwards.

## Task 5 closing handover

`close-handover-verification.mjs` exports `verifyCloseHandover(page, { base, phone })`
for a caller-supplied Playwright page. It starts from the designer harness at
Task 5 and covers the approved closing-handover decisions on desktop and phone.

## Browser binary

Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. When that
is unset, Replit's `/repl/tools/bin/chromium` is used when present; otherwise
the installed Playwright Chromium is used. Traces and screenshots for failures
are written to `test-results/` (git-ignored).
