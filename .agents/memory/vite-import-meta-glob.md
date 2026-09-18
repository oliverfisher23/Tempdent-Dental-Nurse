---
name: Vite import.meta.glob guard
description: Why a typeof guard around import.meta.glob breaks asset URLs in the browser, and the pattern that works for modules shared with Node tests.
---
Never guard `import.meta.glob(...)` with `typeof import.meta.glob === 'function'`.

**Why:** Vite rewrites the call expression at transform time but never defines `import.meta.glob` at runtime, so the guard is always false in the browser and every URL silently falls back. Broken media then shows as alt text over the UI, which reviewers report as layout bugs rather than missing assets.

**How to apply:** when a module using `import.meta.glob` must also load under tsx/Node tests, call the glob unconditionally inside try/catch and use a repository-relative fallback only when the call throws. Decide "bundled or not" from whether the glob returned entries.
