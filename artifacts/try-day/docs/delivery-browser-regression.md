# Delivery browser regression coverage

## Purpose

This is the browser-level regression suite for the delivery workflow. It is
implemented in `tests/delivery-browser.spec.ts`, with the shared setup and
fixture helpers in `e2e/delivery-harness.ts`, and is configured by
`playwright.delivery.config.ts`. Run it from the workspace root with:

```sh
pnpm --filter @workspace/try-day run test:delivery:browser
```

The suite uses the existing `artifacts/try-day` **web** workflow. It does not
start its own `webServer`.

## Environment and projects

`DELIVERY_BASE_URL` may provide a complete development base URL, including any
required prefix. If it is not set, the suite uses `REPLIT_DEV_DOMAIN`; outside
Replit it falls back to the local proxy at `http://localhost:80`.

Chromium can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. When that
is unset, `/repl/tools/bin/chromium` is used when present; otherwise the
installed Playwright Chromium is used. On a non-Replit machine, install that
browser once with:

```sh
pnpm --filter @workspace/try-day exec playwright install chromium
```

Two projects run delivery-only (no unrelated task suites):

| Project | Viewport | Interaction emphasis |
| --- | ---: | --- |
| `desktop-keyboard` | 1440×1000 | Keyboard controls, including `Tab` and `Space` |
| `phone` | 390×844 | Touch controls |

Targeted reruns preserve that scope:

```sh
pnpm --filter @workspace/try-day run test:delivery:browser --project=phone
pnpm --filter @workspace/try-day run test:delivery:browser --project=desktop-keyboard
```

No other activities are rerun by these commands.

## Fixture and state boundaries

Each test uses the shared current fixture from Designer test > Task 2, with
only the previous task seeded. All delivery actions go through the UI.
Session state is read only from `sessionStorage`; the harness performs no
direct state writes. The real iframe host collects completion events. Learner
`localStorage` remains unchanged, and other tasks remain unchanged.

The Designer test toggle opens and collapses the controls. Never use `Close`
as a dismiss button: it seeds a completed-day fixture. Tests await
the real settle timers rather than replacing them with arbitrary immediate
state changes.

## Coverage map

The browser assertions cover:

- all quantity, temperature, and fish-finding entries;
- premature report locking;
- delayed disclosure after the permitted attempts;
- wrong answers followed by corrections;
- send and resend behavior, including the rule that draft corrections never
  auto-send;
- actual note strike-through and amended quantities;
- initials/signature invalidation;
- partial and signed reloads;
- task sign-off and a frozen revisit after sign-off.

This covers the delivery interaction path end to end: entry and correction,
disclosure and reporting, persistence and reload, then final sign-off and
revisit behavior. Expected final screenshots are attached to the relevant
assertions.

One existing navigation limitation is separate from these persistence checks:
reloading a signed-but-unfinished delivery returns to the pass with the
sign-off button, without a way to reopen the note. The suite checks that the
saved signed record survives and can be signed off; restoring access to that
note before final task sign-off is a separate follow-up.

## Failure artifacts and related gates

Failure artifacts are written under `test-results/delivery`, with the HTML
report under `playwright-report/delivery`; both locations are gitignored.
Tracing is `retain-on-failure` and screenshots are captured only on failure.

The existing unit workflow check remains separate:

```sh
pnpm --filter @workspace/scripts exec tsx --tsconfig=../artifacts/try-day/tsconfig.json --test ../artifacts/try-day/tests/delivery-workflow.test.ts
```

Browser coverage does not replace the unit legacy-save gates or employer
content approval. Type-check the browser harness separately with:

```sh
pnpm --filter @workspace/try-day run typecheck:delivery:browser
```