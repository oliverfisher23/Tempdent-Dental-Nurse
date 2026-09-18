---
name: Test command execution
description: A pnpm/tsx argument-handling quirk that can silently skip execution in this environment.
---

Use `--tsconfig=<path>` rather than the space-separated form when running tsx
through `pnpm --filter ... exec`, and confirm that an actual test summary was
printed.

**Why:** A space-separated tsconfig option repeatedly returned exit code zero
without executing an eval script or producing its output here. The same script
ran normally without that option and with the equals form. An empty successful
command is not evidence that verification happened.

**How to apply:** For test or diagnostic invocations, require real output
(test counts or an explicit result), not just the exit code. This is a tooling
observation, not a reason to loosen checks or assume a future version has the
same behaviour.