---
name: Touches route and hold lifecycle
description: Decisions behind Task 1's "what touches what" handwash close-up and the shared press-and-hold hook; pitfalls found in review.
---

## Route semantics (agreed with the user, September 2026)

- The handwash is a `sequence` recorded as what the hands touch, in order; content judges the whole route on the gloves commit.
- Dirty touches (phone, tunic, tap by hand) are recorded and marked on the hands picture, never refused. A wash undoes the marks but stays on the record, so a rewash after a dirty touch is allowed and still judged wrong.
- Harmless touches before the wash (towel, tunic, phone) play a line and are not recorded; gloves/PPE before the wash are recorded. The same spot touched twice running is one touch.
- A wash while gloved washes the gloves: `washed` stays false (otherwise the tap is locked after the gloves come off).
- A wrong verdict shows the hands as they were before the commit ("the gloves stay in the box"), not gloved.
- **Why:** exact-order judging plus "never refuse" would otherwise fail learners for a second towel or punish them for a recovery wash.

## Hold hook pitfalls

- Close-ups stay mounted when shut: pass `!isOpen` (and answered/frozen) into `disabled` and cancel the running hold there, or a timer completes invisibly and the water loop never stops.
- Own pace must turn the *same* control into a start/finish toggle; a second same-named toggle beside the press-and-hold meant the first button failed instantly on release.
- Reset progress on every start (a completed hold left `progress` full, so a quick release after "Start again" completed at once) and capture the pointer so a release away from the button ends the hold.

## Percent-spot photographs

- Spots are percentages of the image, so the container must keep the aspect ratio: cap height via `max-width = maxHeight * 1.6`, never `object-cover` crop.
- Decorative label chips over spot buttons need `pointer-events-none`; a neighbour's chip intercepted clicks near the bottom edge.
- On a short screen render the verdict above the photograph and scroll the sheet to the top on commit, otherwise the learner commits from the bottom and never sees Priya's line.
