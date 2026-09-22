# Embedding the learner experience

The welcome, briefing and simulation are one self-contained app. Internal navigation
stays inside the iframe; the app does not open a new tab, navigate the top window,
or read or modify the host page. It reads nothing from the URL (no query string or
fragment is needed) and never listens for messages from the host.

## The Springpod frame (linked app)

Springpod Studio and the learner hub load the stored address exactly, inside

```html
<iframe src="APP_URL" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
```

with no `allow=` permissions policy. Inside that frame:

- There is no Fullscreen API, so the welcome shows one plain **Open the briefing**
  button instead of **Expand experience**, and the in-simulation size control is
  not rendered. Nothing in the day needs fullscreen.
- The frame is the width of the activity column and 75% of the viewport high, with a
  480px minimum. The app is laid out for 360x640, 768x480 and 1280x800 frames: the
  page scrolls inside the frame, papers and the mentor bar cap their own height.
- Progress lives in the app origin's own browser storage. Browsers may partition that
  storage for a cross-site frame, so a day started inside the frame may not be visible
  when the same address is opened directly, and vice versa; the app assumes neither
  sharing nor partitioning. Where storage is blocked altogether the day still runs;
  it simply does not resume.

## Other hosts

Any other LMS may add `allow="fullscreen" allowfullscreen`; the welcome then offers
**Expand experience** (native fullscreen from the user gesture) alongside the inline
route, and Escape or **Exit expanded view** leaves fullscreen without resetting
progress. Serve the app on a different origin from the host when granting both
`allow-scripts` and `allow-same-origin`. Give the frame a useful height (640px
recommended; smaller frames scroll within the iframe).

## Messages to the host

The app posts progress to `window.parent` with `postMessage(message, '*')`, from its
own top-level window, and never waits for a reply. The payload names the day and its
tasks only; the learner's name never leaves the browser.

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

- `task:complete` (with `taskId`) is posted as each task is signed off; hosts may
  ignore it. Springpod does.
- `gate:complete` is posted once, when the fifth task is signed off, and again on
  every later load of a finished day (an idempotent re-post for a learner whose
  first message was lost). `completedTasks` lists every authored task id once, in
  the day's order; `completedAt` is the ISO-8601 time the day was finished.
- Receiving hosts should validate `event.origin` against the published app origin
  and verify `event.source` is this iframe's `contentWindow`. There is no SCORM or
  LTI integration.
