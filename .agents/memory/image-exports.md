---
name: Image exports
description: Lessons from turning client photographs into web assets with ImageMagick in this workspace.
---

- Always pass `-strip` when writing WebP with ImageMagick. **Why:** the camera EXIF/XMP block (~100 KB) is
  copied into every derivative otherwise, so a 512 px avatar came out at 120 KB instead of 17 KB. The client
  photos carry no ICC profile (plain sRGB), so stripping loses nothing visible.
- `identify -format '%[profiles]'` is not a valid property in the installed build; check for leftover
  metadata with `%[EXIF:*]%[XMP:*]` (an empty string means clean).
- Keep crop geometries in a JSON manifest next to the content and express them in auto-oriented source
  pixels, so a re-run after `-auto-orient` reproduces the same framing (portrait.JPG is stored landscape).
- Photos of real fridge readouts must be blurred before they become backdrops, or learners can read them as
  temperature evidence that contradicts the exercise's clues.
