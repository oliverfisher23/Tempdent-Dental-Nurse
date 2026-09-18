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

For failure testing, distinguish video requests from Vite's asset-import modules.

**Why:** Broad MP4/WebM URL blocking before navigation also blocks the JavaScript
modules that export asset URLs, so the app can fail to mount before playback is
even attempted. That is not evidence of a broken video fallback.

**How to apply:** Inject a media failure only after the app mounts, or target the
browser's media resource type rather than every URL containing a video extension.