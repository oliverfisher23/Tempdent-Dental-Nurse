---
name: Preview video codecs
description: Distinguish browser codec limitations from broken local inspection media.
---

Keep a browser-compatible alternative when supplying H.264 inspection loops, and
select just one supported encoding rather than downloading both.

**Why:** Preview/test browsers may lack proprietary H.264 decoding even when
the supplied files are valid. A working poster fallback does not establish that
normal looping playback works.

**How to apply:** Diagnose `video.error`, `canPlayType`, and the actual browser
binary before changing media URLs or blaming network delivery. Verify real
playback with a supported encoding as well as the still-image failure path.