---
name: Vite import.meta.glob guard
description: Why a typeof guard around import.meta.glob breaks asset URLs in the browser, and the pattern that works for modules shared with Node tests.
---
Never guard `import.meta.glob(...)` with `typeof import.meta.glob === 'function'`.

**Why:** Vite rewrites the call expression at transform time but never defines `import.meta.glob` at runtime, so the guard is always false in the browser and every URL silently falls back. Broken media then shows as alt text over the UI, which reviewers report as layout bugs rather than missing assets.

**How to apply:** when a module using `import.meta.glob` must also load under tsx/Node tests, call the glob unconditionally inside try/catch and use a repository-relative fallback only when the call throws. Decide "bundled or not" from whether the glob returned entries.

Diagnosing it: a `DEMUXER_ERROR_COULD_NOT_OPEN` media error with a `currentSrc` that serves `text/html` is an asset-URL bug, not a codec problem. Node unit tests stay green throughout, so the in-repo browser command `pnpm --filter @workspace/try-day run test:fridge-round` is the canary: it requires the opening clip to genuinely play, so a still-image fallback that skips to the open door fails rather than passes. Serve media over HTTP for playback checks — the bundled `/repl/tools/bin/chromium` rejects `file://` media with a URL safety check.
