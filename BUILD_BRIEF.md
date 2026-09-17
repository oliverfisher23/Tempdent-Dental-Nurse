# Marriott "Try Day" — Sous chef day-in-the-life simulation

Build brief written before moving into the project. The source of truth for all content is
`attached_assets/Pasted--format-springpod-mechanic-version-1-mechanicId-try-day_1789658059338.txt`
(springpod-mechanic v1, mechanicId `try-day-app`, id `mar-try-day`). Use its copy verbatim for
morning brief, task situation/job/materials/interaction/doneWhen/whatHappensNext/complication and
close of day. Do not paraphrase the spec's wording; the client has signed off on that register.

## Framing decisions
- Role label follows the spec: "Trainee sous chef, main kitchen" (the user's message said
  "Executive Sous Chef"; flagged to the user, easy to swap in one constant if they want it).
- Employer: Marriott International, using the "Be" People Brand (employer brand). Marriott Bonvoy
  lock-up needs the Bonvoy logo asset from the client; not in hand.
- Locale en-GB throughout (spelling, 24h times, °C, kilos).
- Scoreless. Gate type is `complete`: finishing all five tasks completes the section.
  On completion: persist to localStorage and `window.parent.postMessage({ source: "springpod",
  mechanic: "try-day-app", id: "mar-try-day", event: "gate:complete" }, "*")` (assumed host
  contract; confirm with Springpod App Registry when reachable).
- Progress persists in localStorage so a student can leave and come back; "start again" available.

## Brand tokens (from the Be People Brand Style Guide, June 2023)
- White #FFFFFF, Bonvoy Black #1C1C1C (body copy), Bonvoy Coral #FF9662 (floods, headline accents)
- Cream #F9F6F4 (page background), Brown #523B30, Dark Blue #45595C (section floods, chrome),
  Blue #8FA1A3, Green #B2C4B5
- Type: Ridley Grotesk is licensed to Marriott, not us. Use a system sans stack
  (`Calibri, "Segoe UI", -apple-system, Helvetica Neue, Arial, sans-serif`), headlines Bold,
  sentence case. Monospace accent for times/readings (`ui-monospace, SFMono-Regular, Menlo`).
- Logo: `attached_assets/logo_1789658094610.svg` ("Be" wordmark with TM, 257x72). Show it in
  Coral on cream/white/black, never smaller than 18px high, clearspace = height of the "e".
  Never alter the shape.
- Photo: `attached_assets/soux-chef_1789658094610.webp` on the intro screen only. Rights not
  confirmed by client (noted in tokens file); leave a TODO comment.
- Visual language from the guide: lots of negative space, cream pages with dark-blue floods for
  section headers, coral used sparingly, candid photography, "Be curious. Be purposeful. Be you."
  style three-line lockups (only approved extensions, each ending with a full stop).
- Voice: "older cousin doling out career advice": informal, plain, candid, warm. Spec tone:
  "Calm, practical and warm: the register of a good chef showing someone the ropes."

## Interaction design per task (the mini-activities)
Shell: a shift clock (06:45 -> 15:00), the place line, the people present, Marcus's short lines
of dialogue as the student works, a "materials" panel that opens the paper forms, and a
"done when" checklist that ticks live. Move on only when doneWhen is met.

1. take-the-handover (06:45): read the four overnight log entries; temperature board with a row
   per unit (Walk-in fridge, Larder fridge 1, Larder fridge 2 [the 04:10 door-ajar one], Fish
   fridge, Dairy fridge, Freezer 1, Freezer 2). Click "probe" on a unit -> animated reading;
   type reading, time auto-filled from the shift clock, initials typed once and reused.
   Larder fridge 2 reads warm (about 9°C vs 5°C target). Done when every row has reading, time
   and initials, and a note is written against Larder fridge 2.
2. check-the-delivery-in (08:30): order sheet of ~9 lines, three trolleys. For each line enter
   arrived quantity (counting by clicking the boxes), probe chilled lines, mark Arrived / Short /
   Refused. Fish inspection step: eyes, gills, smell cues. Complication: salmon ordered 12 kg,
   arrived 8 kg; driver says never loaded. Radio Marcus (dialogue). Sign the delivery note for
   what was taken (amend the salmon line before signing). Done when every line is marked, every
   chilled line has a temperature, and the note is signed with the amendment.
3. chill-the-event-batch (10:45): prep sheet says batch weight, tray count, fill depth (50 mm).
   Portion: choose fill depth per tray; load the blast chiller grid leaving a gap between trays;
   probe the thickest part (not the tray metal). Simulated timeline: readings at 0/30/60/90 min.
   Complication at 90 min: your tray above 8°C, Marcus's below. Correct choice: keep it in the
   chiller and keep logging; get the ruler out -> your tray was filled deeper than the sheet.
   Extra reading at 120 min brings it under. Done when four readings with times are on the chill
   record and the trays are in with space between them.
4. check-the-dietary-list (12:30): function sheet (90 covers, timings, three added guests, one
   with a nut allergy). Recipe cards for tonight's dishes (starter, main, vegetarian main,
   dessert, plus an alternative dessert available from the pastry fridge). Allergen chart: dishes
   x the 14 UK declared allergens, tick from the recipe cards, with gentle checking. Assign each
   added guest a dish; the dessert has nuts through it so the nut-allergic guest's table needs the
   alternative written on the evening board. Done when the chart is complete, each added guest
   has a dish, and the board carries the changes.
5. hand-the-kitchen-on (14:30): weigh three bins (trimmings, spoilage, plate waste) on a scale
   and write the kilos; fill the handover sheet (prepared / short / in the walk-in / one thing to
   watch) with prompts that draw on the day; Elena reads the chill record and asks what you would
   do with the trays next time (reflective choice); both sign. Close of day copy, then the
   "Be curious. Be purposeful. Be you." close and a completed-section state.

## Tech
- Vite + React + TypeScript single-page app, no backend needed for v1. Content lives in
  `src/content/mechanic.json` (the spec, copied as-is) plus `src/content/activities.ts` for the
  interactive data (fridge units, order lines, recipes, allergens). Keep components per task.
- Mobile-friendly (students on laptops and phones), keyboard-accessible forms, reduced-motion safe.
