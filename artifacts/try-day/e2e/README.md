# Complete fridge round browser check

Run from the workspace root:

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

Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. When that
is unset, Replit's `/repl/tools/bin/chromium` is used when present; otherwise
the installed Playwright Chromium is used. Traces and screenshots for failures
are written to `test-results/fridge-round/` (git-ignored).