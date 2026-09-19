---
name: Restart file rollback
description: After an unexpected container restart, the newest edits may be missing from disk even though the tool reported success.
---

Rule: after any restart (workflows return 502, /tmp scripts vanish, often while task agents are merging), re-check that your most recent edits are still in the files (`git status`, grep for a distinctive token) before building on them.

**Why:** on 2026-09-19 a restart during task merges restored the workspace from a snapshot taken about a minute earlier: two of three edited files kept older changes, the newest edit (a Tailwind custom variant plus class renames) was gone, and only a grep revealed it.

**How to apply:** keep browser-capture and verification helpers reproducible (a heredoc you can re-run), and re-run typecheck after re-applying anything lost.
