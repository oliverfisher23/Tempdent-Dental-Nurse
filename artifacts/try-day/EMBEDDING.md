# Embedding the learner experience

The welcome, briefing and simulation are one self-contained app. Internal navigation
stays inside the iframe; the app does not open a new tab, navigate the top window,
or read or modify the LMS page.

## Recommended LMS iframe

Use the app's real published URL in place of `APP_URL`:

```html
<iframe
  src="APP_URL"
  title="art'otel Sous Chef Try Day"
  width="100%"
  height="640"
  style="display:block;border:0"
  sandbox="allow-scripts allow-same-origin"
  allow="fullscreen"
  allowfullscreen
></iframe>
```

- Serve the app on a different origin from the LMS when using both `allow-scripts`
  and `allow-same-origin`. Scripts are required for the simulation; the origin
  permission enables its existing browser-based progress storage.
- The compact welcome is designed to work inside the LMS. **Expand experience**
  opens the briefing and requests native fullscreen from that user gesture.
- Fullscreen depends on the browser, the iframe permissions, and any inherited
  `Permissions-Policy` restrictions in the LMS. Nested embedding must permit it
  at every level. The app cannot grant itself permissions.
- If fullscreen is unsupported or refused, the briefing and Start control remain
  usable inside the existing iframe. The app explains the limitation rather than
  opening a popup or attempting to escape the sandbox.
- Escape or **Exit expanded view** exits native fullscreen without resetting
  progress. A size control remains available during the simulation.
- Give the embedded app a useful height (640px recommended; smaller views scroll
  within the iframe). Browser fullscreen is not required to complete the tasks.

The existing Springpod completion messages are unchanged. The receiving LMS should
validate `event.origin` against the published app origin and verify `event.source`
is this iframe's `contentWindow`. No new fullscreen messaging contract is assumed,
and this change does not add SCORM or LTI integration.