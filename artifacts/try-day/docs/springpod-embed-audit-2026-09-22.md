# Springpod linked-app embed audit — art'otel Sous Chef Try Day

Audited 22 September 2026 against the Springpod "linked app" brief (sandboxed, cross-origin
iframe; no parameters in, one completion message out).

- Linked address: `https://marriott-sous-chef-try-day-fable-test.replit.app/`
- Deployment: Replit Autoscale (`.replit`: `deploymentTarget = "autoscale"`), static build served
  by `pnpm run serve`.
- Code audited: working tree at the time of this report. Production is running the build published
  at 08:32 UTC today (`last-modified` header), which is the same content **without** the fixes in
  section 3. Everything in this report marked "after fix" needs the next publish to reach learners.

Evidence sources referenced below:

- `embed-check`: a scratch Playwright script (deleted after the audit) that loaded the production
  build inside `<iframe sandbox="allow-scripts allow-same-origin allow-forms">` on a different
  site (parent `127.0.0.1:5056`, app `localhost:4173`), captured messages at the parent, and
  measured layout at the three frame sizes. Output kept in `docs/springpod-embed-audit/`.
- `learner-run`: the existing end-to-end harness (`e2e/learner-run.mjs`) that plays the whole day,
  run against the production build at 1280x800 with axe-core (`AXE=1`), keyboard-only
  (`INPUT=keyboard`), 768x480 and 360x640 (`VIEWPORT=…`). Screenshots and `qa-log.json` under
  `test-results/learner-run-*/`.
- `curl`: run from this workspace against the published address.

## 1. Summary

**Yes, with fixes.** The address frames cleanly (200, `text/html`, no `X-Frame-Options`, no CSP),
the app needs nothing from the URL or the host, the completion envelope is accepted shape 1 and is
posted from the app's own top-level window, and the day completes with keyboard alone with no
serious or critical axe findings.

Three things had to change, and they are fixed in the working tree but **not yet published**:

1. `gate:complete` did not carry `completedTasks` (brief C4). Added; that is the only change to the
   envelope, and it is an added field, not a changed one.
2. In a 480px-high frame Task 3 could not be finished: the answered question bar covered the tray
   controls, and the chill record's signature sat below the bottom of the frame with no way to
   scroll to it (brief B3). Both fixed with height caps.
3. The welcome offered **Expand experience** first; inside Springpod's sandbox there is no
   Fullscreen API, so that button could only apologise, and at 480px the inline route was below the
   fold. Inside the sandbox the welcome now shows one **Open the briefing** button on the first
   screen (brief B1/B3).

Two items stay UNKNOWN because they cannot be verified from here: the cold-start time of the
Autoscale deployment after a long idle (A4), and a byte-for-byte match of task ids/titles/times
against the copy of the day document held in Studio (E1) — the Springpod App Registry connection was
unreachable during the audit, so the ids are listed for the designer to compare.

## 2. Checklist

### A. Reachability and framing

| # | Item | Result | Evidence | Fix |
|---|------|--------|----------|-----|
| A1 | `curl -sI` 200, `text/html`, no `x-frame-options`, no `frame-ancestors` | **PASS** | Header dump in section 6: `HTTP/2 200`, `content-type: text/html; charset=utf-8`, no `x-frame-options`, no `content-security-policy`. No auth wall: curl sends no cookies and still gets 200. The `set-cookie: GAESA` is Google Frontend infrastructure affinity, not a gate (the page is served without it). | — |
| A2 | No redirect to another origin or path | **PASS** | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}'`: `/` → 200, no redirect; `/index.html` → 200; `/close` → 200; `/task/take-the-handover` → 200. Plain `http://` does not answer at all (000), so nothing bounces through a different scheme; `www.` does not resolve. Final URL equals the request URL in every case. | — |
| A3 | Works with no query string or fragment; no required URL reads | **PASS** | The only reads: `src/lib/simulation.ts:725` (`URLSearchParams(window.location.search).get('testMode') === '1'`, an opt-in test switch) and `src/App.tsx:79-83` (keeps that same switch on internal navigation). Neither is needed to run; `document.referrer` and `location.hash` are never read. embed-check loaded the bare address inside the frame and reached the welcome. | — |
| A4 | Stable public address; cold start under ~3 s | **PASS / cold start UNKNOWN** | Autoscale keeps the same `*.replit.app` URL across publishes; it is not a `.replit.dev` development domain. Warm responses measured three times: TTFB 0.18–0.23 s, HTML 1,173 bytes, main bundle 966 KB. The deployment had been receiving traffic all morning, so a true cold start after a long idle could not be measured; Replit's documentation says Autoscale scales to zero when idle and the first request after a quiet period can take a few seconds, so a first-period-after-lunch learner may sit over the 3 s line. | Proposal P1 |
| A5 | Every asset HTTPS, cross-site loadable, no mixed content | **PASS** | Network origins recorded by embed-check across load, brief and reload: the app origin; `https://fonts.googleapis.com/css2` (stylesheet, from `src/index.css:1`); `https://fonts.gstatic.com/...woff2` (two font files, served with `access-control-allow-origin: *`). Nothing else. The ambience track `audio/kitchen-ambience.mp3` is fetched from the app origin after the first user gesture (`src/lib/audio.ts:252-253`). No API calls exist. | — |

### B. Behaviour inside the sandbox

| # | Item | Result | Evidence | Fix |
|---|------|--------|----------|-----|
| B1 | Sandbox-hostile calls | **PASS (after fix)** | Grep over `src` for `window.open`, `target="_blank"`, `alert(`, `confirm(`, `prompt(`, `print(`, `top.location`, `parent.location`, `download=`, `navigator.share`, `getUserMedia`, `geolocation`, Clipboard API: no hits (every "clipboard" match is the kitchen clipboard prop). The day has no outbound links. `requestFullscreen` is used only in `src/lib/experience-viewport.tsx:22,42,49`, always from a click, wrapped in try/catch, and now gated on `document.fullscreenEnabled` (`FULLSCREEN_AVAILABLE`, line 21): where it is false the size control renders nothing (`src/components/experience-size-control.tsx:10`) and the welcome shows the inline button only (`src/components/welcome/LaunchView.tsx:68-105`). embed-check inside the sandbox: `fullscreenEnabled === false`, zero `expand-experience` buttons at all three sizes. | Fix 4 |
| B2 | Media: no autoplay with sound, controls, captions/transcript | **PASS with a caveat** | Sound: the WebAudio ambience and UI sounds only start after `kitchenAudio.unlock()` from a user gesture, with a persistent mute in the header (`src/lib/audio.ts`). Briefing videos open from a button in a modal with `controls` (`src/components/briefing-video-modal.tsx:47`) and a written transcript in a `<details>` (`lines 54-61`); every video in `src/content/briefing-videos.ts` is currently a placeholder with no `src`, so the transcript is what plays. Fridge-door clips are `muted playsInline` and `aria-hidden` background footage with a play/pause control (`src/components/scenes/handover/inspection-media.tsx:390-396`). Caveat: no `<track kind="captions">` — when real briefing footage arrives it needs captions, not only the transcript. | Proposal P3 |
| B3 | Layout at 360x640, 768x480, 1280x800; no clipping, no horizontal scroll, no `100vh` | **PASS (after fix)** | `100vh` appears nowhere in `src`; the app uses `dvh`/`svh` (8 uses). embed-check, inside the sandboxed frame: welcome `scrollWidth == clientWidth` at all three sizes; start button bottom at 586/442/730 px, i.e. on the first screen; brief scrolls inside the frame (`scrollHeight` 1840/1368/1156 against the frame height). learner-run whole day: 360x640 passed on the production build; 768x480 failed twice at Task 3 (`13-task3-FAILED.png`: answered question bar covering the trays; `14-task3-FAILED.png`: signature box below the frame, "element is outside of the viewport" after `scrollIntoView`) and passes after Fixes 6 and 7 (`test-results/learner-run-768x480/qa-log.json` → `passed: true`). 1280x800 passed. | Fixes 5, 6, 7 |
| B4 | Whole day by keyboard; no trap; nothing depends on Escape reaching the host | **PASS** | learner-run `INPUT=keyboard` (every action is focus + key) completes welcome → Task 1–5 → close, `passed: true`. Escape is handled inside the app (dialogue bar `onKeyDown` with `stopPropagation`, close-ups' own keydown listeners) and the harness checks the ninety-minute question can be dismissed with Escape and brought back from its chip. Focus traps release on close (`useFocusTrap(..., 'hud')` cycles the HUD, see `src/components/kitchen/close-up.tsx:45`). | — |
| B5 | Inbound message listener | **PASS** | Grep for `addEventListener('message'` and `onmessage` in `src`: none. The app never reads a host message. | — |
| B6 | No third-party login/cookies/consent banner; storage partitioning assumptions | **PASS** | No login, no consent banner, no third-party script; the only cookie seen is the infrastructure `GAESA` cookie on the app's own responses. Storage: one key, `springpod:mar-try-day:v1` in `localStorage` (`src/lib/simulation.ts:721`), plus a mute flag and a per-session motion preference. The app never reads storage from another origin or expects the top-level visit to share the frame's day; a first load inside the frame starts clean. embed-check: `localStorage` writable inside the sandbox; no page errors in the frame. The test browser did not partition (a top-level tab saw the frame's day), which is a Chromium-for-testing setting, not something the app relies on either way. | — |

### C. The completion signal

| # | Item | Result | Evidence | Fix |
|---|------|--------|----------|-----|
| C1 | Accepted envelope, posted with `window.parent.postMessage` from the top-level window; nothing personal | **PASS** | `src/lib/simulation.ts:892-903` `notifyHost`: builds `{ source: 'springpod', format: 'springpod-mechanic', mechanic, id, event, ... }` and calls `window.parent.postMessage(message, '*')`. The app has no nested iframes and no workers. embed-check captured the message at the parent with `event.source === frame.contentWindow` and `event.origin` equal to the app origin. Payload fields: `source, format, mechanic, id, event, completedAt, completedTasks` — the learner's name (kept in the saved state) is not in it (`studentName` string absent from the serialised message). | — |
| C2 | Fires only when all five tasks are done; never on partial day or mid-day refresh | **PASS** | `src/lib/progress-store.tsx:160-179` `completeTask`: refuses out-of-order completion, requires the task's own evaluation to be `done`, then posts `task:complete`; `gate:complete` only when `isDayComplete(next)` (all of `TASK_ORDER` in `completed`). The on-load re-post (`lines 91-95`) requires `isDayComplete(progress) && progress.completedAt`. embed-check: zero messages on first load with clean storage; learner-run mid-task reloads (Task 2, Task 4) produce none. | — |
| C3 | Re-post on load when the saved day is complete | **PASS (after fix)** | Added `src/lib/progress-store.tsx:91-95`. embed-check seeded a finished day into the frame's storage and reloaded the frame only: one `gate:complete` arrived at the parent (section 6). | Fix 2 |
| C4 | `completedTasks` lists every authored id once; ids match Studio; `completedAt` ISO-8601 | **PASS (after fix) / Studio match UNKNOWN** | Added in `notifyHost` (`src/lib/simulation.ts:900`): `completedTasks: TASK_ORDER` on `gate:complete` only. Captured list: `take-the-handover, check-the-delivery-in, chill-the-event-batch, check-the-dietary-list, hand-the-kitchen-on` — five ids, each once, in the day's order, identical to `src/content/mechanic.json` (`id` at lines 42, 63, 85, 107, 129). `completedAt` round-trips through `new Date(x).toISOString()` unchanged. The App Registry connection was down during the audit, so the ids could not be read back from Studio. | Fix 1 |
| C5 | Plain JSON within limits; one real message dumped | **PASS** | Captured message: 295 bytes serialised, depth 3, 13 nodes, 7 keys, `JSON.stringify(JSON.parse(x)) === x`; strings, arrays and one object only. Verbatim in section 6. | — |
| C6 | No acknowledgement wait | **PASS** | `notifyHost` returns `void`; there is no message listener, no pending state, no spinner tied to the host. The close page renders from local progress alone. | — |

### D. Progress and resume

| # | Item | Result | Evidence | Fix |
|---|------|--------|----------|-----|
| D1 | Saved after every task and step; refresh returns to the right place; brief not repeated | **PASS** | `ProgressProvider` writes the whole record on every change (`src/lib/progress-store.tsx:80-86`), including in-task workspace position. learner-run reload checks: "After a reload mid-Task 2 the learner returns straight to the working order sheet", "After a reload mid-Task 4 the learner returns straight to the allergen chart" (all four viewports). A returning learner lands on the briefing's *Welcome back* state with **Continue**, not the video brief. | — |
| D2 | First run on a clean profile is clean | **PASS** | Every learner-run starts from a fresh context: `unexpectedConsoleErrors: []`, `pageErrors: []`, `unexpectedRequests: []` in each `qa-log.json`; embed-check first load: no errors, no messages. | — |
| D3 | Visible "start the day again" from the brief and from the end of the day; clears everything | **PASS** | Brief: **Start again** for a returning learner (`src/content/welcome.ts:32`, `src/components/welcome/BriefingView.tsx:51-55` → `reset()` after a confirmation). End of day: **Start the day again** in an `AlertDialog` ("Clear this completed shift?") (`src/pages/close.tsx:44-47, 151-157`). `reset()` calls `clearProgress()` (removes the one progress key) and reinstates `initialProgress()`; the only things left behind are the mute flag and the session-scoped motion preference, which hold no learner work. | — |
| D4 | Storage failure degrades to a day that does not resume | **PASS (after fix)** | `loadProgress` already caught read errors (`src/lib/simulation.ts:731-739`). `saveProgress`/`clearProgress` now run through `withStorage` (`lines 845-869`): one `console.warn`, no throw. The mute preference read in the audio module constructor and its write are now guarded too (`src/lib/audio.ts:42-49`, `setMuted`), which removes the last unguarded access that ran at module load. | Fixes 3, 8 |

### E. Content contract

| # | Item | Result | Evidence | Fix |
|---|------|--------|----------|-----|
| E1 | Brief → five tasks in authored order → close; ids/titles/times/places match Studio's day document | **PASS in-repo / Studio match UNKNOWN** | Routes: welcome → briefing → `/task/:id` in `TASK_ORDER` → `/close`; `completeTask` enforces the order. Day document in the app (`src/content/mechanic.json`): `take-the-handover` 06:45 "Take the handover and walk the fridges", Main kitchen, by the walk-in fridges; `check-the-delivery-in` 08:30 "Check the new delivery", the goods-in door; `chill-the-event-batch` 10:45 "Chill the batch for tonight", main kitchen bench and blast chiller; `check-the-dietary-list` 12:30 "Check tonight's dietary list", the pass then the events kitchen; `hand-the-kitchen-on` 14:30 "Weigh the waste and hand the kitchen on", the pass. The Studio copy could not be read (registry unreachable). | Designer to compare |
| E2 | No scores, marks, grades, %, pass/fail, right/wrong, verdicts, rankings | **PASS** | Grep over `src/content` and components for `score|grade|points|%|leaderboard|rank`: no learner-facing hits. "marks" = allergen chart marks; "pass" = the kitchen pass; "correct"/"wrong" appear only as in-the-moment feedback on a reading ("This does not match the scales. Read them again") and internal flags (`correct: true` in `close-exchange.ts`, waste `tone: 'right' | 'wrong'`) that never render as a verdict. The close page shows the learner's own handover, no result. | — |
| E3 | Only authored materials; no invented employer facts | **PASS** | All copy derives from `src/content/*` built from the day document; grep for salary, wage, per hour, pension, holiday allowance: none. People (Terence, the evening team), places and policies are those in `mechanic.json`. | — |
| E4 | en-GB, addressed to "you", no placeholders | **PASS** | `index.html:2` `<html lang="en-GB">`; grep for `[ ]`, `TODO`, `lorem`, `TBC` in `src/content` and components: none. Copy addresses "you" throughout (see `COPY.md`). | — |
| E5 | WCAG 2.2 AA contrast, visible focus, labels, alt text, reduced motion | **PASS** | learner-run `AXE=1` at 1280x800: 27 screens scanned with axe-core (WCAG 2.x AA rule set incl. colour contrast), **0 serious or critical violations** (`qa-log.json` → `"axe": []`). Keyboard run passes with visible `focus-visible` rings. All 22 `<img>` elements carry `alt` (decorative ones `alt="" aria-hidden`). Reduced motion: 63 uses of `useReducedMotion` / `motion-safe:` / `motion-reduce:`, and the fridge footage has a pause control that is remembered. | — |
| E6 | No personal data collected, no free text sent to a server, no analytics/tag manager; list every request | **PASS** | The learner's name is asked for the handover and kept only in the frame's `localStorage`; nothing is ever sent anywhere — the app has no server calls. Complete request list (embed-check, load → brief → reload): `GET /` (document), `/assets/index-*.js`, `/assets/index-*.css`, images under `/assets/` and `/images/`, `https://fonts.googleapis.com/css2?...` (stylesheet), two `https://fonts.gstatic.com/s/.../*.woff2` (font), and after the first gesture `GET /audio/kitchen-ambience.mp3`. No analytics, no tag manager, no third-party cookie. Google Fonts sets no cookies. | Proposal P4 (self-host fonts) |

### F. Engagement tracking

See section 5.

## 3. Fixes made during the audit

All are additive or degrade-only; task ids and the published address are unchanged. Typecheck 0
errors, 89/89 unit tests pass, learner-run passes at 1280x800 (axe), keyboard, 768x480 and 360x640,
and the fridge-round browser check passes, all against the production build of this tree.

| # | File | Change | Why it is safe |
|---|------|--------|----------------|
| 1 | `src/lib/simulation.ts` (`GateEvent`, `notifyHost`) | `gate:complete` now carries `completedTasks: TASK_ORDER` (the five authored ids, once, in order). `task:complete` is unchanged. | The brief's C4 requires the field; this is the report saying exactly why the envelope changed. Added field only — shape 1 still matches, existing keys untouched, message stays under 300 bytes. |
| 2 | `src/lib/progress-store.tsx` | On mount, if the saved day is already complete and has `completedAt`, post `gate:complete` once more. | Brief C3 recommendation. The host accepts one completion per launch and ignores repeats; the app posts nothing new for partial days. |
| 3 | `src/lib/simulation.ts` (`withStorage`) | `saveProgress`/`clearProgress` catch storage errors and warn once. | Brief D4. Before, a blocked `localStorage.setItem` would have thrown inside a React effect on every state change. Reads were already guarded. |
| 4 | `src/lib/experience-viewport.tsx`, `src/components/experience-size-control.tsx`, `src/components/welcome/LaunchView.tsx`, `src/content/welcome.ts` | Expose `fullscreenAvailable` (from `document.fullscreenEnabled`). When false: the size control renders nothing and the welcome shows a single **Open the briefing** button (new copy `startButton`, `launchHintFramed`) instead of **Expand experience** + outline inline button. | Brief B1: inside `sandbox` without `allow=fullscreen` the expand button could only fail. Where fullscreen is available nothing changes. |
| 5 | `src/components/welcome/LaunchView.tsx` | `short:` (wide, under 44rem high) spacing and type sizes so the welcome CTA sits on the first screen of a 480px-high frame. | CSS only; measured start-button bottom 442px in a 480px frame (was 670px `scrollHeight`, CTA below the fold). |
| 6 | `src/components/kitchen/dialogue-bar.tsx` | The mentor/question bar is capped at 60% of the stage height and scrolls internally. | Brief B3: in a 480px frame the answered question (three chips + reply) covered every control behind it, so Task 3 could not continue (`13-task3-FAILED.png`). On taller frames the cap never engages. |
| 7 | `src/components/kitchen/paper.tsx` | Paper/clipboard minimum height `400px` → `min(400px, 55svh)`. | Brief B3: the fixed 400px pushed the chill record's signature below a 480px frame with no scroller able to reach it (`14-task3-FAILED.png`). Content taller than the paper still scrolls inside it as before; at ≥728px viewports the value is unchanged. |
| 8 | `src/lib/audio.ts` | Mute preference read/write wrapped in try/catch. | Brief D4: the constructor ran `localStorage.getItem` at module load, so a browser with storage blocked would have failed before React mounted. |
| 9 | `e2e/fridge-round-verification.mjs`, `e2e/learner-run.mjs` | The deliberately blocked clip pattern accepts hashed production asset names; the learner run enters the briefing through whichever welcome control exists (expand where fullscreen is available, otherwise the inline button). | Test-only; lets the browser checks run against the built bundle and in a browser without the Fullscreen API, which is how this audit exercised the app. |
| 10 | `EMBEDDING.md` | Documents the Springpod frame, the message with `completedTasks`, the re-post, and storage partitioning. | Documentation. |

Not fixed by the audit and worth knowing: production is the pre-audit build. Publishing the current
tree is what turns the "after fix" rows into PASS for learners.

## 4. Proposals with estimates

| # | Proposal | Why | Estimate |
|---|----------|-----|----------|
| P1 | Change the deployment type from Autoscale to Replit **Static** hosting (the app is a static bundle with no API calls). Replit's docs: Publishing → Adjust settings → Deployment type, the linked domain stays; add `[[deployment.rewrites]]` `from = "/*"` → `to = "/index.html"` so `/task/...` and `/close` keep resolving. | Static hosting has no instance to wake, so the documented Autoscale cold start disappears and A4 closes. The address must not change (a new address is a new linked app to Springpod), so confirm the domain in the Domains section before and after, and re-run the A1/A2 header checks. | 0.5 day including the re-run of the framing and browser checks. |
| P2 | App-side anonymous telemetry (section 5). | Per-task reach, completion, time and abandonment are invisible to Springpod for a linked app. | 2–3 days (see section 5). |
| P3 | Captions for the briefing videos when real footage replaces the placeholders: WebVTT `<track kind="captions">` per video, plus a check in the content build that every video with a `src` has a track. | Brief B2 asks for captions or a transcript; today the transcript suffices because no video has a source yet. | 0.5 day of code; captions authoring per video is content work. |
| P4 | Self-host the two Google Fonts (Playfair Display, Plus Jakarta Sans) in `public/fonts`. | Removes the only third-party origin from the request list and any dependency on `fonts.gstatic.com` being reachable from a school network. | 0.5 day. |
| P5 | Verified-release route on the Springpod TRY SDK (section 5). | Per-learner progress saved server-side, validated `completedTasks`. | 6–9 days, see section 5. |

## 5. Engagement position

**What is measured now.** Nothing by the app. There are no analytics calls, no beacons, no
`fetch` to any endpoint, and no tag manager (E6 request list). Springpod sees, per learner, one
`gate:complete` for the whole day with the app's `completedAt` and, once the current tree is
published, `completedTasks`; plus whatever the learner hub's own reporter records around the frame
(opened, time on the activity, completed). Neither side can see which task a learner is on, how long
each task takes, or where they abandon the day.

**What the app-side proposal (P2) would add.** Anonymous, aggregate events posted by the app itself:

- Events: `day:opened`, `task:reached`, `task:completed`, `day:completed`, each with `taskId`,
  seconds since the previous event, and a device class (`phone`/`tablet`/`desktop` from the
  viewport, plus `framed: true|false`). Abandonment falls out of the last event seen per visit.
- Identity: none. A per-visit random id held in memory only (regenerated on reload) so events from
  one visit can be grouped; no cookie, no `localStorage` id, no fingerprinting, nothing that survives
  the visit or crosses sites. Learner names never leave the browser, as now.
- Transport: `navigator.sendBeacon` to a small collector route on this project's existing API
  artifact (`artifacts/api-server`), same first-party deployment, HTTPS, CORS limited to the app
  origin. Failures are ignored; the day never waits on it.
- Storage and reading: one append-only Postgres table (event, task id, seconds, device class,
  visit id, received-at) with a daily aggregate view; a read-only page on the API artifact behind a
  shared staff link, or a CSV export, for Springpod staff. Retention 12 months of raw events.
- Estimate: 2–3 days (collector + table 1 day, app events + tests 0.5 day, staff view/export 1 day,
  privacy note in `EMBEDDING.md` 0.5 day).

**What the verified-release route (P5) would add.** Building on Studio's TRY starter SDK
(`src/try-sdk.js`: `springpod-try:*` handshake — `init` from the host with `activityId`, `releaseId`,
`sourceHash`, `nonce`, `mode`, saved state; `ready`, `save`, `submit`, `resize`, `error` from the
app; `ack` back) moves per-learner progress into Springpod's persistence, lets the hub restore a
learner's saved state on any device (no more per-browser storage), and validates the final
`{ "completedTasks": [...] }` against the authored day. Work for this app:

- Replace the `localStorage` progress store with the SDK's `save`/restore contract, keeping the
  local copy only as an in-visit cache: 2 days (the store is already a single record with a
  versioned migration path, `src/lib/simulation.ts`).
- Replace `notifyHost` with `ready`/`submit`/`error`, honour `mode` (preview vs learner) and the
  `resize` message for the host's fixed-height frame: 1 day.
- Content-addressed release: build to `/<sha256>/index.html` with `springpod-try.json` beside it,
  hash the bundle in CI, and adjust the Vite base path per release: 1–2 days.
- Re-run the whole browser regression against the release URL and in Studio preview: 1 day.
- Contingency for SDK questions: 1–2 days. Total 6–9 days.

What is lost: the app can no longer be redeployed in place. Every change (copy, a fix like the ones
in section 3) becomes a new immutable release that the designer re-approves in Studio, and
completions recorded against the previous release do not carry over. Day-to-day iteration slows
from "publish" to "release, re-link, re-approve".

**Recommendation.** Publish the fixes in section 3 and embed as a linked app now; that satisfies
the brief. If per-task engagement is wanted this term, do P2: it is small, first-party, anonymous
and reversible, and it answers the "where do learners drop off" question without touching the
Springpod contract. Move to the verified-release route (P5) only when Springpod needs cross-device
resume or server-validated completion, and plan it for a point when the content is stable, because
the release model is designed to stop in-place change.

## 6. Verbatim evidence

### One real completion message

Captured by the parent page in embed-check (production build served at `http://localhost:4173`,
loaded in `<iframe sandbox="allow-scripts allow-same-origin allow-forms">` from `http://127.0.0.1:5056`).
`event.origin` was `http://localhost:4173`; `event.source === iframe.contentWindow` was `true`.
`event.data`, exactly as received:

```json
{
  "source": "springpod",
  "format": "springpod-mechanic",
  "mechanic": "try-day-app",
  "id": "mar-try-day",
  "event": "gate:complete",
  "completedAt": "2026-09-22T08:31:53.896Z",
  "completedTasks": [
    "take-the-handover",
    "check-the-delivery-in",
    "chill-the-event-batch",
    "check-the-dietary-list",
    "hand-the-kitchen-on"
  ]
}
```

This is the on-load re-post for a finished day (Fix 2); the first-time post is built by the same
`notifyHost` call with the same fields. On the published address `event.origin` will be
`https://marriott-sous-chef-try-day-fable-test.replit.app`.

### `curl -sI` header dump

```
$ curl -sI https://marriott-sous-chef-try-day-fable-test.replit.app/
HTTP/2 200 
accept-ranges: bytes
alt-svc: h3=":443"; ma=2592000
cache-control: private
content-type: text/html; charset=utf-8
date: Tue, 22 Sep 2026 09:24:20 GMT
expires: Tue, 22 Sep 2026 09:24:20 GMT
last-modified: Tue, 22 Sep 2026 08:32:59 GMT
server: Google Frontend
set-cookie: GAESA=CpwBMDBhNDFlOGMxZGQ3OGQzY2E3N2UyZjhiNDM2ZmY1MmYzY2M0ZTJhMDkzNTkxYTIyNjYwOTYwMWIwNDIxNGUzMDkxZjk3ODkyMWIyMmFiMzRiY2FiYjA1OTczODNhZDRhODM1ODRkNzNhOWI4YTBhNDY1N2VlYmI0ZDA2MGM2ZTRjODJhNzI3OGQ2ZmNlNjZmN2U0ZGIyZGY0ZThkEPvmuMOMNA; expires=Thu, 22-Oct-2026 09:24:20 GMT; path=/
strict-transport-security: max-age=63072000; includeSubDomains
via: 1.1 google
x-cloud-trace-context: 8e8b9f169d6e71bbd964e2840c82e935
content-length: 1173
```

Redirect check (same session):

```
GET /                          -> 200  redirect=[]
GET /index.html                -> 200  redirect=[]
GET /task/take-the-handover    -> 200  redirect=[]
GET /close                     -> 200  redirect=[]
GET http://…replit.app/        -> no response (HTTPS only)
GET https://www.…replit.app/   -> does not resolve
```
