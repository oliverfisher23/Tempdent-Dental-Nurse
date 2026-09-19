---
name: Orphaned asset check
description: Where a removed picture can survive after the source imports are clean.
---

Rule: removing an image or clip is not finished when nothing in the app imports it. The same file can also live on in tracked export archives, in Library cards presented to the user (their metadata is tracked in the repository), and as a same-named copy inside another artifact such as the design canvas mockups. Regenerate or retire those too, and only then write "removed from the repository" in any document.

**Why:** a clean-up that only cleared the app's imports was rejected twice in review because an earlier "current images" export and a mockup still carried the deleted pictures while the documentation said they were gone.

**How to apply:** grep the whole workspace by basename, list the contents of every tracked archive, and treat the production build's emitted asset list as the truth for what ships; a module can import an asset and itself be unreachable.

The Node suite now fails on any file under the app's `src/assets/` whose filename nothing under `src/` (outside `src/assets/`) mentions — that covers the "nothing imports it" case only. Reachability, the tracked images export, Library cards and mockup copies are still manual checks.
