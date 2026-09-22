# try-day-app

> **Day document for the built experience:** the JSON below is the day document the
> art'otel sous chef TRY day app runs on (`artifacts/try-day/src/content/mechanic.json`,
> as built on 22 September 2026). The task ids are the five the app reports in its
> completion message; titles, times and places are the ones on its job cards. Task
> wording is the client-signed copy, reproduced verbatim. It is authored en-GB content
> for this experience; it does not claim employer intelligence approval. Open points for
> the content owner are listed under "Provenance and open points".
>
> Keep the complete structure, keys, literals and array invariants. On import, the server binds `config.id` and `config.gate.id` to the cast id.

## This is the day document

TRY is one activity: a full working day in the role, done by hand as exactly 5 tasks.
Write `frame` (who the learner is today, where, the shift, two or three named people, the morning brief, the close of day, the tone)
and `tasks` (5 tasks in time order — each with a kebab-case `id`, a 24-hour `time`, a `place`, a short `title`, the `situation`, the hands-on `job`, the `materials` the learner handles, the `interaction`, what `doneWhen` looks like, `whatHappensNext`, and an optional `complication`).

- The day runs 30–40 minutes for learners aged 14–18 who have never been in this workplace; plain en-GB words, no jargon without a gloss.
- Every task is something the learner does, with materials they use; `doneWhen` is observable, never a mark.
- No scores, points, grades, verdicts, right answers or "well done" anywhere in the document.
- Media for materials are attached in Studio after import, never referenced here.
- The app reports `{"completedTasks":[...]}` with every task `id` exactly once when the day is done; that is all it records.

## Authoring focus

Write one believable shift: a morning brief, five hands-on tasks in time order with the materials the learner actually handles, two or three named colleagues, and a close of day. Each task says what done looks like and where the day goes next; none of them says how well it went. Use only supported role, workplace and process information.

Preserve the current full schema and runtime behaviour. Guidance cannot
change interaction timing, gates or evidence formats through copy alone.

### Review consideration — not an approved runtime change

The day app is the single TRY position (Ollie, 15 September 2026). It completes when every authored task is finished and records nothing else; it must not be extended with native evidence, scores or verdicts. Media for materials are attached in Studio and travel in the pack's approved assets, never embedded in the document.

The full AI pack includes guidance for the optional activity-scoped visual
brief, Studio/app responsibilities and human approval. A saved brief is a
distinct build input, never gameplay, employer intelligence or approval.
Missing detailed behaviour cards must be obtained rather than invented.

## Provenance and open points

- Source: `src/content/mechanic.json` in the app, byte for byte; the app renders `morningBrief`
  (the briefing page), `closeOfDay` (the end-of-day page), `shift`, and each task's `situation`,
  `job`, `complication`, `doneWhen`, `interaction` and `whatHappensNext` (the job card).
  `frame.people` is not shown to learners.
- Completion: the app posts `gate:complete` with `completedTasks` listing these five ids once, in
  this order, when the fifth task is signed off (see `EMBEDDING.md`). It records nothing else.
- One correction made while completing this document: `frame.people` carried Terence twice (a
  leftover from an earlier rename). The second Terence entry was removed; the first, the mentor
  entry, is unchanged.
- Open points, left as signed for the content owner to decide:
  1. Task 4 `situation` and `doneWhen` say three late additions on tables 3, 6 and 9. The built
     exercise has two: table 3 (a severe tree-nut and peanut allergy) and table 6 (vegetarian).
     The job card therefore promises one more guest than the function sheet shows.
  2. Task 4 `job` says "choose safe dishes". The built exercise, by the agreed dietary decision
     register, records an ingredient-based proposal and a preparation check that stays pending
     for Terence; it never confirms a dish as safe to serve.
  3. Task 5 `doneWhen` says the waste rows are "weighed correctly"; the pack asks for `doneWhen`
     to be observable, never a mark. "Carry the weight from the scales" would say the same thing.
  4. `closeOfDay` tells the learner what they did well ("checked the fridge properly"). The pack
     asks the close not to say how well it went; the current line was reviewed on 22 September
     2026, so any change is the owner's call.
- Media for the materials (fridge photographs and door clips, paperwork images) are attached in
  Studio, not referenced here.

```json
{
  "format": "springpod-mechanic",
  "version": 1,
  "mechanicId": "try-day-app",
  "config": {
    "mechanic": "try-day-app",
    "version": 1,
    "id": "mar-try-day",
    "employer": "art'otel",
    "locale": "en-GB",
    "frame": {
      "role": "Trainee sous chef, art'otel Hoxton",
      "workplace": "art'otel Hoxton: The main kitchen, events kitchen, and walk-in fridges off the back corridor",
      "shift": {
        "start": "06:45",
        "end": "15:00",
        "rhythm": "Breakfast is already running when you arrive, so the first hour is checks and paperwork around a busy kitchen. The room turns towards tonight's product launch for one hundred guests. Early afternoon is the quiet stretch for cleaning down, weighing, counting, and writing things up, and the evening brigade comes on at three."
      },
      "people": [
        {
          "name": "Terence",
          "role": "Executive sous chef, art'otel Hoxton",
          "note": "Your mentor for the day. He runs the kitchen day to day, asks how you think, and steps in when a decision could make someone poorly."
        },
        {
          "name": "Yvie",
          "role": "Events",
          "note": "Looks after events and brings the client's request list in and out throughout the day."
        }
      ],
      "morningBrief": "Hello, my name's Terence, and I'm the executive sous chef here at art'otel Hoxton, so I run the kitchen day to day. We've got a product launch event tonight for one hundred guests, while maintaining proper hotel service. Yvie looks after events and will be in and out with the client's request list. You have five jobs displayed in order: Take the handover, check the delivery, chill the beef batch, complete the dietary list, and hand the kitchen over. Do not guess: Take readings, make notes with the time and your initials, and ask if you are unsure.",
      "closeOfDay": "That's you finished with your tasks. You checked the fridge properly, did not sign off on salmon that had not arrived, kept the beef in the chiller until it was ready, checked allergens before serving a nut-allergic guest, and left the evening team a handover they can use to serve our guests. Anyone can learn to cook; what matters is checking properly, explaining decisions, and leaving records people can trust.",
      "tone": "Calm, practical, and warm: The register of a good chef showing someone the ropes on a normal working day."
    },
    "tasks": [
      {
        "id": "take-the-handover",
        "time": "06:45",
        "place": "Main kitchen, by the walk-in fridges",
        "title": "Take the handover and walk the fridges",
        "situation": "The overnight log says larder fridge 2 was found open at four this morning, for an unknown length of time. Some of tonight's prep may have been affected.",
        "job": "Read all the notes, then open every fridge, look inside, and read its thermometer once the needle settles. Write what you actually see with the time and your initials.",
        "materials": [
          {
            "name": "Overnight log",
            "description": "Four timed entries between 22:00 and 06:30: The deep clean, a delivery left in the corridor, a fridge door found ajar at 04:10, and the breakfast set-up."
          },
          {
            "name": "Temperature board and fridge thermometers",
            "description": "A paper chart on the wall with a row for every fridge and freezer, a column for the reading, and a space for the time and your initials; and the dial thermometer hanging in each fridge, which you wipe and read once the needle has settled."
          }
        ],
        "interaction": "In person with the night porter, who is keen to get off, and with Terence, who walks the fridges beside you and points out larder fridge 2.",
        "doneWhen": "Every fridge row carries a reading, a time, and your initials, and larder fridge 2 has a note next to it.",
        "whatHappensNext": "The produce and fish delivery arrives at the back door at 08:30."
      },
      {
        "id": "check-the-delivery-in",
        "time": "08:30",
        "place": "The goods-in door, the back entrance where deliveries come in",
        "title": "Check the new delivery",
        "situation": "Most of the delivery is for tonight's product launch. The driver is in a hurry, but you sign for what is on the trolley, not what is on the note.",
        "job": "Count and weigh what arrived, probe chilled boxes, inspect the fish's eyes and gills, smell it, and press it. Flag anything short or not right before signing.",
        "materials": [
          {
            "name": "Order sheet",
            "description": "What was ordered for today, line by line, with a column for what actually arrived and a column for the temperature of anything that should have come in cold."
          },
          {
            "name": "Delivery note",
            "description": "The supplier's own list of what they say they have sent, which does not always match the order sheet, and which you sign for what you accept rather than for what it claims."
          }
        ],
        "interaction": "In person with the driver, who is in a hurry, and on the kitchen radio to Terence when support is needed.",
        "doneWhen": "Every line on the order sheet is marked as arrived, short, or refused; every chilled line is marked with a temperature, and you've signed for what you accepted.",
        "whatHappensNext": "The short line goes on a list for Terence to take up with the supplier, and everything else is put away in the order it will be used.",
        "complication": "Four kilos of salmon is missing. Radio Terence before signing; tonight's launch does not use it, but tomorrow's lunch does."
      },
      {
        "id": "chill-the-event-batch",
        "time": "10:45",
        "place": "Main kitchen, at the bench and the blast chiller",
        "title": "Chill the batch for tonight",
        "situation": "The main course for tonight's one hundred guests is beef shin: Twenty-seven kilos. It must be cooled quickly, held cold, and recorded.",
        "job": "Split the beef with Terence, spreading it no more than fifty millimetres deep. Space trays in the chiller, probe the thickest part of the fullest tray without touching metal, and record a reading at each time on the chill record.",
        "materials": [
          {
            "name": "Prep sheet",
            "description": "This morning's cooking: The weight of the batch, how many trays it goes into, and how deep each tray is filled."
          },
          {
            "name": "Chill record and probe",
            "description": "A form with four boxes for the readings and the time each was taken, the two lines the kitchen works to, 8°C, which is the temperature chilled food has to be held at, and a higher line above which a batch does not go to service at all, and a space at the bottom for two signatures; and the probe, which goes into the food rather than against the metal of the tray."
          }
        ],
        "interaction": "Terence, who pans the second half of the batch at the bench next to you and reads his own tray while you read yours.",
        "doneWhen": "The chill readings are recorded with their times, trays are spaced in the chiller, and the beef is under 8°C before it goes in the walk-in.",
        "whatHappensNext": "Once the batch is down it goes into the walk-in, ready for the evening team to bring back up to temperature before service.",
        "complication": "At ninety minutes your tray is still above 8°C while Terence's shallower tray is below it. Keep the batch in the chiller, continue logging, and measure the depths."
      },
      {
        "id": "check-the-dietary-list",
        "time": "12:30",
        "place": "Main kitchen, at the pass, then the events kitchen",
        "title": "Check tonight's dietary list",
        "situation": "Yvie brings the final guest list for tonight's one-hundred-guest product launch. Three late additions are on tables 3, 6, and 9, including a nut allergy.",
        "job": "Build the allergen chart from the recipe cards first. Check every dish and all fourteen allergens, then choose safe dishes for the three additions and put dish, name, and table on the events board.",
        "materials": [
          {
            "name": "Function sheet",
            "description": "Tonight's product launch: One hundred guests, the timings, the table plan, and the list of guests who have told the hotel there is something they cannot eat."
          },
          {
            "name": "Allergen chart and the evening board",
            "description": "A grid with tonight's dishes down the side and, across the top, the fourteen things that have to be declared by law because people can be allergic to them; and the whiteboard the evening team read when they come on at three."
          }
        ],
        "interaction": "In person with Yvie, who needs an answer before she prints the table plan, and with Terence, who reads the chart through with you before it goes up on the board.",
        "doneWhen": "Every dish on the allergen chart is marked against all fourteen allergens, each of the three added guests has a dish written against their name, and the changes are up on the evening board.",
        "whatHappensNext": "Yvie prints the table plan with the dietary notes on it, and the evening team pick the changes up when they come on at three.",
        "complication": "The frangipane contains almonds mixed through it, not just on top. It cannot be adapted; choose another dessert and write it on the board."
      },
      {
        "id": "hand-the-kitchen-on",
        "time": "14:30",
        "place": "Main kitchen, at the pass",
        "title": "Weigh the waste and hand the kitchen on",
        "situation": "The evening team are about to take over and serve one hundred guests. Waste needs weighing, the handover needs completing, and Terence will review the chill record with you.",
        "job": "Weigh all three tubs. Put the rice and melon from larder 2 under spoilage, complete and walk through the handover covering salmon, larder 2, and table 3, then talk Terence through the beef chill record and sign it together.",
        "materials": [
          {
            "name": "Waste sheet",
            "description": "A form with three rows: Trimmings from preparing food, food that went off before it was used, and food that came back from plates. Each row takes a weight in kilos."
          },
          {
            "name": "Handover sheet",
            "description": "What is prepared, what is short, what is in the walk-in for tonight, and a line for the one thing you would keep an eye on."
          }
        ],
        "interaction": "In person with Terence, who reads the chill record and asks what you would do with the trays next time, and with the evening team, who take the handover sheet from you and ask their own questions.",
        "doneWhen": "All three waste rows are weighed correctly, the handover is filled in and delivered, and the chill record has both signatures.",
        "whatHappensNext": "The day closes."
      }
    ],
    "gate": {
      "type": "complete",
      "id": "mar-try-day",
      "label": "Finish every task in the day to complete this section"
    }
  }
}
```
# try-day-app

> **Day document for the built experience:** the JSON below is the day document the
> art'otel sous chef TRY day app runs on (`artifacts/try-day/src/content/mechanic.json`,
> as built on 22 September 2026). The task ids are the five the app reports in its
> completion message; titles, times and places are the ones on its job cards. Task
> wording is the client-signed copy, reproduced verbatim. It is authored en-GB content
> for this experience; it does not claim employer intelligence approval. Open points for
> the content owner are listed under "Provenance and open points".
>
> Keep the complete structure, keys, literals and array invariants. On import, the server binds `config.id` and `config.gate.id` to the cast id.

## This is the day document

TRY is one activity: a full working day in the role, done by hand as exactly 5 tasks.
Write `frame` (who the learner is today, where, the shift, two or three named people, the morning brief, the close of day, the tone)
and `tasks` (5 tasks in time order — each with a kebab-case `id`, a 24-hour `time`, a `place`, a short `title`, the `situation`, the hands-on `job`, the `materials` the learner handles, the `interaction`, what `doneWhen` looks like, `whatHappensNext`, and an optional `complication`).

- The day runs 30–40 minutes for learners aged 14–18 who have never been in this workplace; plain en-GB words, no jargon without a gloss.
- Every task is something the learner does, with materials they use; `doneWhen` is observable, never a mark.
- No scores, points, grades, verdicts, right answers or "well done" anywhere in the document.
- Media for materials are attached in Studio after import, never referenced here.
- The app reports `{"completedTasks":[...]}` with every task `id` exactly once when the day is done; that is all it records.

## Authoring focus

Write one believable shift: a morning brief, five hands-on tasks in time order with the materials the learner actually handles, two or three named colleagues, and a close of day. Each task says what done looks like and where the day goes next; none of them says how well it went. Use only supported role, workplace and process information.

Preserve the current full schema and runtime behaviour. Guidance cannot
change interaction timing, gates or evidence formats through copy alone.

### Review consideration — not an approved runtime change

The day app is the single TRY position (Ollie, 15 September 2026). It completes when every authored task is finished and records nothing else; it must not be extended with native evidence, scores or verdicts. Media for materials are attached in Studio and travel in the pack's approved assets, never embedded in the document.

The full AI pack includes guidance for the optional activity-scoped visual
brief, Studio/app responsibilities and human approval. A saved brief is a
distinct build input, never gameplay, employer intelligence or approval.
Missing detailed behaviour cards must be obtained rather than invented.

## Provenance and open points

- Source: `src/content/mechanic.json` in the app, byte for byte; the app renders `morningBrief`
  (the briefing page), `closeOfDay` (the end-of-day page), `shift`, and each task's `situation`,
  `job`, `complication`, `doneWhen`, `interaction` and `whatHappensNext` (the job card).
  `frame.people` is not shown to learners.
- Completion: the app posts `gate:complete` with `completedTasks` listing these five ids once, in
  this order, when the fifth task is signed off (see `EMBEDDING.md`). It records nothing else.
- One correction made while completing this document: `frame.people` carried Terence twice (a
  leftover from an earlier rename). The second Terence entry was removed; the first, the mentor
  entry, is unchanged.
- Open points, left as signed for the content owner to decide:
  1. Task 4 `situation` and `doneWhen` say three late additions on tables 3, 6 and 9. The built
     exercise has two: table 3 (a severe tree-nut and peanut allergy) and table 6 (vegetarian).
     The job card therefore promises one more guest than the function sheet shows.
  2. Task 4 `job` says "choose safe dishes". The built exercise, by the agreed dietary decision
     register, records an ingredient-based proposal and a preparation check that stays pending
     for Terence; it never confirms a dish as safe to serve.
  3. Task 5 `doneWhen` says the waste rows are "weighed correctly"; the pack asks for `doneWhen`
     to be observable, never a mark. "Carry the weight from the scales" would say the same thing.
  4. `closeOfDay` tells the learner what they did well ("checked the fridge properly"). The pack
     asks the close not to say how well it went; the current line was reviewed on 22 September
     2026, so any change is the owner's call.
- Media for the materials (fridge photographs and door clips, paperwork images) are attached in
  Studio, not referenced here.

```json
{
  "format": "springpod-mechanic",
  "version": 1,
  "mechanicId": "try-day-app",
  "config": {
    "mechanic": "try-day-app",
    "version": 1,
    "id": "mar-try-day",
    "employer": "art'otel",
    "locale": "en-GB",
    "frame": {
      "role": "Trainee sous chef, art'otel Hoxton",
      "workplace": "art'otel Hoxton: The main kitchen, events kitchen, and walk-in fridges off the back corridor",
      "shift": {
        "start": "06:45",
        "end": "15:00",
        "rhythm": "Breakfast is already running when you arrive, so the first hour is checks and paperwork around a busy kitchen. The room turns towards tonight's product launch for one hundred guests. Early afternoon is the quiet stretch for cleaning down, weighing, counting, and writing things up, and the evening brigade comes on at three."
      },
      "people": [
        {
          "name": "Terence",
          "role": "Executive sous chef, art'otel Hoxton",
          "note": "Your mentor for the day. He runs the kitchen day to day, asks how you think, and steps in when a decision could make someone poorly."
        },
        {
          "name": "Yvie",
          "role": "Events",
          "note": "Looks after events and brings the client's request list in and out throughout the day."
        }
      ],
      "morningBrief": "Hello, my name's Terence, and I'm the executive sous chef here at art'otel Hoxton, so I run the kitchen day to day. We've got a product launch event tonight for one hundred guests, while maintaining proper hotel service. Yvie looks after events and will be in and out with the client's request list. You have five jobs displayed in order: Take the handover, check the delivery, chill the beef batch, complete the dietary list, and hand the kitchen over. Do not guess: Take readings, make notes with the time and your initials, and ask if you are unsure.",
      "closeOfDay": "That's you finished with your tasks. You checked the fridge properly, did not sign off on salmon that had not arrived, kept the beef in the chiller until it was ready, checked allergens before serving a nut-allergic guest, and left the evening team a handover they can use to serve our guests. Anyone can learn to cook; what matters is checking properly, explaining decisions, and leaving records people can trust.",
      "tone": "Calm, practical, and warm: The register of a good chef showing someone the ropes on a normal working day."
    },
    "tasks": [
      {
        "id": "take-the-handover",
        "time": "06:45",
        "place": "Main kitchen, by the walk-in fridges",
        "title": "Take the handover and walk the fridges",
        "situation": "The overnight log says larder fridge 2 was found open at four this morning, for an unknown length of time. Some of tonight's prep may have been affected.",
        "job": "Read all the notes, then open every fridge, look inside, and read its thermometer once the needle settles. Write what you actually see with the time and your initials.",
        "materials": [
          {
            "name": "Overnight log",
            "description": "Four timed entries between 22:00 and 06:30: The deep clean, a delivery left in the corridor, a fridge door found ajar at 04:10, and the breakfast set-up."
          },
          {
            "name": "Temperature board and fridge thermometers",
            "description": "A paper chart on the wall with a row for every fridge and freezer, a column for the reading, and a space for the time and your initials; and the dial thermometer hanging in each fridge, which you wipe and read once the needle has settled."
          }
        ],
        "interaction": "In person with the night porter, who is keen to get off, and with Terence, who walks the fridges beside you and points out larder fridge 2.",
        "doneWhen": "Every fridge row carries a reading, a time, and your initials, and larder fridge 2 has a note next to it.",
        "whatHappensNext": "The produce and fish delivery arrives at the back door at 08:30."
      },
      {
        "id": "check-the-delivery-in",
        "time": "08:30",
        "place": "The goods-in door, the back entrance where deliveries come in",
        "title": "Check the new delivery",
        "situation": "Most of the delivery is for tonight's product launch. The driver is in a hurry, but you sign for what is on the trolley, not what is on the note.",
        "job": "Count and weigh what arrived, probe chilled boxes, inspect the fish's eyes and gills, smell it, and press it. Flag anything short or not right before signing.",
        "materials": [
          {
            "name": "Order sheet",
            "description": "What was ordered for today, line by line, with a column for what actually arrived and a column for the temperature of anything that should have come in cold."
          },
          {
            "name": "Delivery note",
            "description": "The supplier's own list of what they say they have sent, which does not always match the order sheet, and which you sign for what you accept rather than for what it claims."
          }
        ],
        "interaction": "In person with the driver, who is in a hurry, and on the kitchen radio to Terence when support is needed.",
        "doneWhen": "Every line on the order sheet is marked as arrived, short, or refused; every chilled line is marked with a temperature, and you've signed for what you accepted.",
        "whatHappensNext": "The short line goes on a list for Terence to take up with the supplier, and everything else is put away in the order it will be used.",
        "complication": "Four kilos of salmon is missing. Radio Terence before signing; tonight's launch does not use it, but tomorrow's lunch does."
      },
      {
        "id": "chill-the-event-batch",
        "time": "10:45",
        "place": "Main kitchen, at the bench and the blast chiller",
        "title": "Chill the batch for tonight",
        "situation": "The main course for tonight's one hundred guests is beef shin: Twenty-seven kilos. It must be cooled quickly, held cold, and recorded.",
        "job": "Split the beef with Terence, spreading it no more than fifty millimetres deep. Space trays in the chiller, probe the thickest part of the fullest tray without touching metal, and record a reading at each time on the chill record.",
        "materials": [
          {
            "name": "Prep sheet",
            "description": "This morning's cooking: The weight of the batch, how many trays it goes into, and how deep each tray is filled."
          },
          {
            "name": "Chill record and probe",
            "description": "A form with four boxes for the readings and the time each was taken, the two lines the kitchen works to, 8°C, which is the temperature chilled food has to be held at, and a higher line above which a batch does not go to service at all, and a space at the bottom for two signatures; and the probe, which goes into the food rather than against the metal of the tray."
          }
        ],
        "interaction": "Terence, who pans the second half of the batch at the bench next to you and reads his own tray while you read yours.",
        "doneWhen": "The chill readings are recorded with their times, trays are spaced in the chiller, and the beef is under 8°C before it goes in the walk-in.",
        "whatHappensNext": "Once the batch is down it goes into the walk-in, ready for the evening team to bring back up to temperature before service.",
        "complication": "At ninety minutes your tray is still above 8°C while Terence's shallower tray is below it. Keep the batch in the chiller, continue logging, and measure the depths."
      },
      {
        "id": "check-the-dietary-list",
        "time": "12:30",
        "place": "Main kitchen, at the pass, then the events kitchen",
        "title": "Check tonight's dietary list",
        "situation": "Yvie brings the final guest list for tonight's one-hundred-guest product launch. Three late additions are on tables 3, 6, and 9, including a nut allergy.",
        "job": "Build the allergen chart from the recipe cards first. Check every dish and all fourteen allergens, then choose safe dishes for the three additions and put dish, name, and table on the events board.",
        "materials": [
          {
            "name": "Function sheet",
            "description": "Tonight's product launch: One hundred guests, the timings, the table plan, and the list of guests who have told the hotel there is something they cannot eat."
          },
          {
            "name": "Allergen chart and the evening board",
            "description": "A grid with tonight's dishes down the side and, across the top, the fourteen things that have to be declared by law because people can be allergic to them; and the whiteboard the evening team read when they come on at three."
          }
        ],
        "interaction": "In person with Yvie, who needs an answer before she prints the table plan, and with Terence, who reads the chart through with you before it goes up on the board.",
        "doneWhen": "Every dish on the allergen chart is marked against all fourteen allergens, each of the three added guests has a dish written against their name, and the changes are up on the evening board.",
        "whatHappensNext": "Yvie prints the table plan with the dietary notes on it, and the evening team pick the changes up when they come on at three.",
        "complication": "The frangipane contains almonds mixed through it, not just on top. It cannot be adapted; choose another dessert and write it on the board."
      },
      {
        "id": "hand-the-kitchen-on",
        "time": "14:30",
        "place": "Main kitchen, at the pass",
        "title": "Weigh the waste and hand the kitchen on",
        "situation": "The evening team are about to take over and serve one hundred guests. Waste needs weighing, the handover needs completing, and Terence will review the chill record with you.",
        "job": "Weigh all three tubs. Put the rice and melon from larder 2 under spoilage, complete and walk through the handover covering salmon, larder 2, and table 3, then talk Terence through the beef chill record and sign it together.",
        "materials": [
          {
            "name": "Waste sheet",
            "description": "A form with three rows: Trimmings from preparing food, food that went off before it was used, and food that came back from plates. Each row takes a weight in kilos."
          },
          {
            "name": "Handover sheet",
            "description": "What is prepared, what is short, what is in the walk-in for tonight, and a line for the one thing you would keep an eye on."
          }
        ],
        "interaction": "In person with Terence, who reads the chill record and asks what you would do with the trays next time, and with the evening team, who take the handover sheet from you and ask their own questions.",
        "doneWhen": "All three waste rows are weighed correctly, the handover is filled in and delivered, and the chill record has both signatures.",
        "whatHappensNext": "The day closes."
      }
    ],
    "gate": {
      "type": "complete",
      "id": "mar-try-day",
      "label": "Finish every task in the day to complete this section"
    }
  }
}
```
# try-day-app

> **Day document for the built experience:** the JSON below is the day document the
> art'otel sous chef TRY day app runs on (`artifacts/try-day/src/content/mechanic.json`,
> as built on 22 September 2026). The task ids are the five the app reports in its
> completion message; titles, times and places are the ones on its job cards. Task
> wording is the client-signed copy, reproduced verbatim. It is authored en-GB content
> for this experience; it does not claim employer intelligence approval. Open points for
> the content owner are listed under "Provenance and open points".
>
> Keep the complete structure, keys, literals and array invariants. On import, the server binds `config.id` and `config.gate.id` to the cast id.

## This is the day document

TRY is one activity: a full working day in the role, done by hand as exactly 5 tasks.
Write `frame` (who the learner is today, where, the shift, two or three named people, the morning brief, the close of day, the tone)
and `tasks` (5 tasks in time order — each with a kebab-case `id`, a 24-hour `time`, a `place`, a short `title`, the `situation`, the hands-on `job`, the `materials` the learner handles, the `interaction`, what `doneWhen` looks like, `whatHappensNext`, and an optional `complication`).

- The day runs 30–40 minutes for learners aged 14–18 who have never been in this workplace; plain en-GB words, no jargon without a gloss.
- Every task is something the learner does, with materials they use; `doneWhen` is observable, never a mark.
- No scores, points, grades, verdicts, right answers or "well done" anywhere in the document.
- Media for materials are attached in Studio after import, never referenced here.
- The app reports `{"completedTasks":[...]}` with every task `id` exactly once when the day is done; that is all it records.

## Authoring focus

Write one believable shift: a morning brief, five hands-on tasks in time order with the materials the learner actually handles, two or three named colleagues, and a close of day. Each task says what done looks like and where the day goes next; none of them says how well it went. Use only supported role, workplace and process information.

Preserve the current full schema and runtime behaviour. Guidance cannot
change interaction timing, gates or evidence formats through copy alone.

### Review consideration — not an approved runtime change

The day app is the single TRY position (Ollie, 15 September 2026). It completes when every authored task is finished and records nothing else; it must not be extended with native evidence, scores or verdicts. Media for materials are attached in Studio and travel in the pack's approved assets, never embedded in the document.

The full AI pack includes guidance for the optional activity-scoped visual
brief, Studio/app responsibilities and human approval. A saved brief is a
distinct build input, never gameplay, employer intelligence or approval.
Missing detailed behaviour cards must be obtained rather than invented.

## Provenance and open points

- Source: `src/content/mechanic.json` in the app, byte for byte; the app renders `morningBrief`
  (the briefing page), `closeOfDay` (the end-of-day page), `shift`, and each task's `situation`,
  `job`, `complication`, `doneWhen`, `interaction` and `whatHappensNext` (the job card).
  `frame.people` is not shown to learners.
- Completion: the app posts `gate:complete` with `completedTasks` listing these five ids once, in
  this order, when the fifth task is signed off (see `EMBEDDING.md`). It records nothing else.
- One correction made while completing this document: `frame.people` carried Terence twice (a
  leftover from an earlier rename). The second Terence entry was removed; the first, the mentor
  entry, is unchanged.
- Open points, left as signed for the content owner to decide:
  1. Task 4 `situation` and `doneWhen` say three late additions on tables 3, 6 and 9. The built
     exercise has two: table 3 (a severe tree-nut and peanut allergy) and table 6 (vegetarian).
     The job card therefore promises one more guest than the function sheet shows.
  2. Task 4 `job` says "choose safe dishes". The built exercise, by the agreed dietary decision
     register, records an ingredient-based proposal and a preparation check that stays pending
     for Terence; it never confirms a dish as safe to serve.
  3. Task 5 `doneWhen` says the waste rows are "weighed correctly"; the pack asks for `doneWhen`
     to be observable, never a mark. "Carry the weight from the scales" would say the same thing.
  4. `closeOfDay` tells the learner what they did well ("checked the fridge properly"). The pack
     asks the close not to say how well it went; the current line was reviewed on 22 September
     2026, so any change is the owner's call.
- Media for the materials (fridge photographs and door clips, paperwork images) are attached in
  Studio, not referenced here.

```json
{
  "format": "springpod-mechanic",
  "version": 1,
  "mechanicId": "try-day-app",
  "config": {
    "mechanic": "try-day-app",
    "version": 1,
    "id": "mar-try-day",
    "employer": "art'otel",
    "locale": "en-GB",
    "frame": {
      "role": "Trainee sous chef, art'otel Hoxton",
      "workplace": "art'otel Hoxton: The main kitchen, events kitchen, and walk-in fridges off the back corridor",
      "shift": {
        "start": "06:45",
        "end": "15:00",
        "rhythm": "Breakfast is already running when you arrive, so the first hour is checks and paperwork around a busy kitchen. The room turns towards tonight's product launch for one hundred guests. Early afternoon is the quiet stretch for cleaning down, weighing, counting, and writing things up, and the evening brigade comes on at three."
      },
      "people": [
        {
          "name": "Terence",
          "role": "Executive sous chef, art'otel Hoxton",
          "note": "Your mentor for the day. He runs the kitchen day to day, asks how you think, and steps in when a decision could make someone poorly."
        },
        {
          "name": "Yvie",
          "role": "Events",
          "note": "Looks after events and brings the client's request list in and out throughout the day."
        }
      ],
      "morningBrief": "Hello, my name's Terence, and I'm the executive sous chef here at art'otel Hoxton, so I run the kitchen day to day. We've got a product launch event tonight for one hundred guests, while maintaining proper hotel service. Yvie looks after events and will be in and out with the client's request list. You have five jobs displayed in order: Take the handover, check the delivery, chill the beef batch, complete the dietary list, and hand the kitchen over. Do not guess: Take readings, make notes with the time and your initials, and ask if you are unsure.",
      "closeOfDay": "That's you finished with your tasks. You checked the fridge properly, did not sign off on salmon that had not arrived, kept the beef in the chiller until it was ready, checked allergens before serving a nut-allergic guest, and left the evening team a handover they can use to serve our guests. Anyone can learn to cook; what matters is checking properly, explaining decisions, and leaving records people can trust.",
      "tone": "Calm, practical, and warm: The register of a good chef showing someone the ropes on a normal working day."
    },
    "tasks": [
      {
        "id": "take-the-handover",
        "time": "06:45",
        "place": "Main kitchen, by the walk-in fridges",
        "title": "Take the handover and walk the fridges",
        "situation": "The overnight log says larder fridge 2 was found open at four this morning, for an unknown length of time. Some of tonight's prep may have been affected.",
        "job": "Read all the notes, then open every fridge, look inside, and read its thermometer once the needle settles. Write what you actually see with the time and your initials.",
        "materials": [
          {
            "name": "Overnight log",
            "description": "Four timed entries between 22:00 and 06:30: The deep clean, a delivery left in the corridor, a fridge door found ajar at 04:10, and the breakfast set-up."
          },
          {
            "name": "Temperature board and fridge thermometers",
            "description": "A paper chart on the wall with a row for every fridge and freezer, a column for the reading, and a space for the time and your initials; and the dial thermometer hanging in each fridge, which you wipe and read once the needle has settled."
          }
        ],
        "interaction": "In person with the night porter, who is keen to get off, and with Terence, who walks the fridges beside you and points out larder fridge 2.",
        "doneWhen": "Every fridge row carries a reading, a time, and your initials, and larder fridge 2 has a note next to it.",
        "whatHappensNext": "The produce and fish delivery arrives at the back door at 08:30."
      },
      {
        "id": "check-the-delivery-in",
        "time": "08:30",
        "place": "The goods-in door, the back entrance where deliveries come in",
        "title": "Check the new delivery",
        "situation": "Most of the delivery is for tonight's product launch. The driver is in a hurry, but you sign for what is on the trolley, not what is on the note.",
        "job": "Count and weigh what arrived, probe chilled boxes, inspect the fish's eyes and gills, smell it, and press it. Flag anything short or not right before signing.",
        "materials": [
          {
            "name": "Order sheet",
            "description": "What was ordered for today, line by line, with a column for what actually arrived and a column for the temperature of anything that should have come in cold."
          },
          {
            "name": "Delivery note",
            "description": "The supplier's own list of what they say they have sent, which does not always match the order sheet, and which you sign for what you accept rather than for what it claims."
          }
        ],
        "interaction": "In person with the driver, who is in a hurry, and on the kitchen radio to Terence when support is needed.",
        "doneWhen": "Every line on the order sheet is marked as arrived, short, or refused; every chilled line is marked with a temperature, and you've signed for what you accepted.",
        "whatHappensNext": "The short line goes on a list for Terence to take up with the supplier, and everything else is put away in the order it will be used.",
        "complication": "Four kilos of salmon is missing. Radio Terence before signing; tonight's launch does not use it, but tomorrow's lunch does."
      },
      {
        "id": "chill-the-event-batch",
        "time": "10:45",
        "place": "Main kitchen, at the bench and the blast chiller",
        "title": "Chill the batch for tonight",
        "situation": "The main course for tonight's one hundred guests is beef shin: Twenty-seven kilos. It must be cooled quickly, held cold, and recorded.",
        "job": "Split the beef with Terence, spreading it no more than fifty millimetres deep. Space trays in the chiller, probe the thickest part of the fullest tray without touching metal, and record a reading at each time on the chill record.",
        "materials": [
          {
            "name": "Prep sheet",
            "description": "This morning's cooking: The weight of the batch, how many trays it goes into, and how deep each tray is filled."
          },
          {
            "name": "Chill record and probe",
            "description": "A form with four boxes for the readings and the time each was taken, the two lines the kitchen works to, 8°C, which is the temperature chilled food has to be held at, and a higher line above which a batch does not go to service at all, and a space at the bottom for two signatures; and the probe, which goes into the food rather than against the metal of the tray."
          }
        ],
        "interaction": "Terence, who pans the second half of the batch at the bench next to you and reads his own tray while you read yours.",
        "doneWhen": "The chill readings are recorded with their times, trays are spaced in the chiller, and the beef is under 8°C before it goes in the walk-in.",
        "whatHappensNext": "Once the batch is down it goes into the walk-in, ready for the evening team to bring back up to temperature before service.",
        "complication": "At ninety minutes your tray is still above 8°C while Terence's shallower tray is below it. Keep the batch in the chiller, continue logging, and measure the depths."
      },
      {
        "id": "check-the-dietary-list",
        "time": "12:30",
        "place": "Main kitchen, at the pass, then the events kitchen",
        "title": "Check tonight's dietary list",
        "situation": "Yvie brings the final guest list for tonight's one-hundred-guest product launch. Three late additions are on tables 3, 6, and 9, including a nut allergy.",
        "job": "Build the allergen chart from the recipe cards first. Check every dish and all fourteen allergens, then choose safe dishes for the three additions and put dish, name, and table on the events board.",
        "materials": [
          {
            "name": "Function sheet",
            "description": "Tonight's product launch: One hundred guests, the timings, the table plan, and the list of guests who have told the hotel there is something they cannot eat."
          },
          {
            "name": "Allergen chart and the evening board",
            "description": "A grid with tonight's dishes down the side and, across the top, the fourteen things that have to be declared by law because people can be allergic to them; and the whiteboard the evening team read when they come on at three."
          }
        ],
        "interaction": "In person with Yvie, who needs an answer before she prints the table plan, and with Terence, who reads the chart through with you before it goes up on the board.",
        "doneWhen": "Every dish on the allergen chart is marked against all fourteen allergens, each of the three added guests has a dish written against their name, and the changes are up on the evening board.",
        "whatHappensNext": "Yvie prints the table plan with the dietary notes on it, and the evening team pick the changes up when they come on at three.",
        "complication": "The frangipane contains almonds mixed through it, not just on top. It cannot be adapted; choose another dessert and write it on the board."
      },
      {
        "id": "hand-the-kitchen-on",
        "time": "14:30",
        "place": "Main kitchen, at the pass",
        "title": "Weigh the waste and hand the kitchen on",
        "situation": "The evening team are about to take over and serve one hundred guests. Waste needs weighing, the handover needs completing, and Terence will review the chill record with you.",
        "job": "Weigh all three tubs. Put the rice and melon from larder 2 under spoilage, complete and walk through the handover covering salmon, larder 2, and table 3, then talk Terence through the beef chill record and sign it together.",
        "materials": [
          {
            "name": "Waste sheet",
            "description": "A form with three rows: Trimmings from preparing food, food that went off before it was used, and food that came back from plates. Each row takes a weight in kilos."
          },
          {
            "name": "Handover sheet",
            "description": "What is prepared, what is short, what is in the walk-in for tonight, and a line for the one thing you would keep an eye on."
          }
        ],
        "interaction": "In person with Terence, who reads the chill record and asks what you would do with the trays next time, and with the evening team, who take the handover sheet from you and ask their own questions.",
        "doneWhen": "All three waste rows are weighed correctly, the handover is filled in and delivered, and the chill record has both signatures.",
        "whatHappensNext": "The day closes."
      }
    ],
    "gate": {
      "type": "complete",
      "id": "mar-try-day",
      "label": "Finish every task in the day to complete this section"
    }
  }
}
```
# try-day-app

> **Day document for the built experience:** the JSON below is the day document the
> art'otel sous chef TRY day app runs on (`artifacts/try-day/src/content/mechanic.json`,
> as built on 22 September 2026). The task ids are the five the app reports in its
> completion message; titles, times and places are the ones on its job cards. Task
> wording is the client-signed copy, reproduced verbatim. It is authored en-GB content
> for this experience; it does not claim employer intelligence approval. Open points for
> the content owner are listed under "Provenance and open points".
>
> Keep the complete structure, keys, literals and array invariants. On import, the server binds `config.id` and `config.gate.id` to the cast id.

## This is the day document

TRY is one activity: a full working day in the role, done by hand as exactly 5 tasks.
Write `frame` (who the learner is today, where, the shift, two or three named people, the morning brief, the close of day, the tone)
and `tasks` (5 tasks in time order — each with a kebab-case `id`, a 24-hour `time`, a `place`, a short `title`, the `situation`, the hands-on `job`, the `materials` the learner handles, the `interaction`, what `doneWhen` looks like, `whatHappensNext`, and an optional `complication`).

- The day runs 30–40 minutes for learners aged 14–18 who have never been in this workplace; plain en-GB words, no jargon without a gloss.
- Every task is something the learner does, with materials they use; `doneWhen` is observable, never a mark.
- No scores, points, grades, verdicts, right answers or "well done" anywhere in the document.
- Media for materials are attached in Studio after import, never referenced here.
- The app reports `{"completedTasks":[...]}` with every task `id` exactly once when the day is done; that is all it records.

## Authoring focus

Write one believable shift: a morning brief, five hands-on tasks in time order with the materials the learner actually handles, two or three named colleagues, and a close of day. Each task says what done looks like and where the day goes next; none of them says how well it went. Use only supported role, workplace and process information.

Preserve the current full schema and runtime behaviour. Guidance cannot
change interaction timing, gates or evidence formats through copy alone.

### Review consideration — not an approved runtime change

The day app is the single TRY position (Ollie, 15 September 2026). It completes when every authored task is finished and records nothing else; it must not be extended with native evidence, scores or verdicts. Media for materials are attached in Studio and travel in the pack's approved assets, never embedded in the document.

The full AI pack includes guidance for the optional activity-scoped visual
brief, Studio/app responsibilities and human approval. A saved brief is a
distinct build input, never gameplay, employer intelligence or approval.
Missing detailed behaviour cards must be obtained rather than invented.

## Provenance and open points

- Source: `src/content/mechanic.json` in the app, byte for byte; the app renders `morningBrief`
  (the briefing page), `closeOfDay` (the end-of-day page), `shift`, and each task's `situation`,
  `job`, `complication`, `doneWhen`, `interaction` and `whatHappensNext` (the job card).
  `frame.people` is not shown to learners.
- Completion: the app posts `gate:complete` with `completedTasks` listing these five ids once, in
  this order, when the fifth task is signed off (see `EMBEDDING.md`). It records nothing else.
- One correction made while completing this document: `frame.people` carried Terence twice (a
  leftover from an earlier rename). The second Terence entry was removed; the first, the mentor
  entry, is unchanged.
- Open points, left as signed for the content owner to decide:
  1. Task 4 `situation` and `doneWhen` say three late additions on tables 3, 6 and 9. The built
     exercise has two: table 3 (a severe tree-nut and peanut allergy) and table 6 (vegetarian).
     The job card therefore promises one more guest than the function sheet shows.
  2. Task 4 `job` says "choose safe dishes". The built exercise, by the agreed dietary decision
     register, records an ingredient-based proposal and a preparation check that stays pending
     for Terence; it never confirms a dish as safe to serve.
  3. Task 5 `doneWhen` says the waste rows are "weighed correctly"; the pack asks for `doneWhen`
     to be observable, never a mark. "Carry the weight from the scales" would say the same thing.
  4. `closeOfDay` tells the learner what they did well ("checked the fridge properly"). The pack
     asks the close not to say how well it went; the current line was reviewed on 22 September
     2026, so any change is the owner's call.
- Media for the materials (fridge photographs and door clips, paperwork images) are attached in
  Studio, not referenced here.

```json
{
  "format": "springpod-mechanic",
  "version": 1,
  "mechanicId": "try-day-app",
  "config": {
    "mechanic": "try-day-app",
    "version": 1,
    "id": "mar-try-day",
    "employer": "art'otel",
    "locale": "en-GB",
    "frame": {
      "role": "Trainee sous chef, art'otel Hoxton",
      "workplace": "art'otel Hoxton: The main kitchen, events kitchen, and walk-in fridges off the back corridor",
      "shift": {
        "start": "06:45",
        "end": "15:00",
        "rhythm": "Breakfast is already running when you arrive, so the first hour is checks and paperwork around a busy kitchen. The room turns towards tonight's product launch for one hundred guests. Early afternoon is the quiet stretch for cleaning down, weighing, counting, and writing things up, and the evening brigade comes on at three."
      },
      "people": [
        {
          "name": "Terence",
          "role": "Executive sous chef, art'otel Hoxton",
          "note": "Your mentor for the day. He runs the kitchen day to day, asks how you think, and steps in when a decision could make someone poorly."
        },
        {
          "name": "Yvie",
          "role": "Events",
          "note": "Looks after events and brings the client's request list in and out throughout the day."
        }
      ],
      "morningBrief": "Hello, my name's Terence, and I'm the executive sous chef here at art'otel Hoxton, so I run the kitchen day to day. We've got a product launch event tonight for one hundred guests, while maintaining proper hotel service. Yvie looks after events and will be in and out with the client's request list. You have five jobs displayed in order: Take the handover, check the delivery, chill the beef batch, complete the dietary list, and hand the kitchen over. Do not guess: Take readings, make notes with the time and your initials, and ask if you are unsure.",
      "closeOfDay": "That's you finished with your tasks. You checked the fridge properly, did not sign off on salmon that had not arrived, kept the beef in the chiller until it was ready, checked allergens before serving a nut-allergic guest, and left the evening team a handover they can use to serve our guests. Anyone can learn to cook; what matters is checking properly, explaining decisions, and leaving records people can trust.",
      "tone": "Calm, practical, and warm: The register of a good chef showing someone the ropes on a normal working day."
    },
    "tasks": [
      {
        "id": "take-the-handover",
        "time": "06:45",
        "place": "Main kitchen, by the walk-in fridges",
        "title": "Take the handover and walk the fridges",
        "situation": "The overnight log says larder fridge 2 was found open at four this morning, for an unknown length of time. Some of tonight's prep may have been affected.",
        "job": "Read all the notes, then open every fridge, look inside, and read its thermometer once the needle settles. Write what you actually see with the time and your initials.",
        "materials": [
          {
            "name": "Overnight log",
            "description": "Four timed entries between 22:00 and 06:30: The deep clean, a delivery left in the corridor, a fridge door found ajar at 04:10, and the breakfast set-up."
          },
          {
            "name": "Temperature board and fridge thermometers",
            "description": "A paper chart on the wall with a row for every fridge and freezer, a column for the reading, and a space for the time and your initials; and the dial thermometer hanging in each fridge, which you wipe and read once the needle has settled."
          }
        ],
        "interaction": "In person with the night porter, who is keen to get off, and with Terence, who walks the fridges beside you and points out larder fridge 2.",
        "doneWhen": "Every fridge row carries a reading, a time, and your initials, and larder fridge 2 has a note next to it.",
        "whatHappensNext": "The produce and fish delivery arrives at the back door at 08:30."
      },
      {
        "id": "check-the-delivery-in",
        "time": "08:30",
        "place": "The goods-in door, the back entrance where deliveries come in",
        "title": "Check the new delivery",
        "situation": "Most of the delivery is for tonight's product launch. The driver is in a hurry, but you sign for what is on the trolley, not what is on the note.",
        "job": "Count and weigh what arrived, probe chilled boxes, inspect the fish's eyes and gills, smell it, and press it. Flag anything short or not right before signing.",
        "materials": [
          {
            "name": "Order sheet",
            "description": "What was ordered for today, line by line, with a column for what actually arrived and a column for the temperature of anything that should have come in cold."
          },
          {
            "name": "Delivery note",
            "description": "The supplier's own list of what they say they have sent, which does not always match the order sheet, and which you sign for what you accept rather than for what it claims."
          }
        ],
        "interaction": "In person with the driver, who is in a hurry, and on the kitchen radio to Terence when support is needed.",
        "doneWhen": "Every line on the order sheet is marked as arrived, short, or refused; every chilled line is marked with a temperature, and you've signed for what you accepted.",
        "whatHappensNext": "The short line goes on a list for Terence to take up with the supplier, and everything else is put away in the order it will be used.",
        "complication": "Four kilos of salmon is missing. Radio Terence before signing; tonight's launch does not use it, but tomorrow's lunch does."
      },
      {
        "id": "chill-the-event-batch",
        "time": "10:45",
        "place": "Main kitchen, at the bench and the blast chiller",
        "title": "Chill the batch for tonight",
        "situation": "The main course for tonight's one hundred guests is beef shin: Twenty-seven kilos. It must be cooled quickly, held cold, and recorded.",
        "job": "Split the beef with Terence, spreading it no more than fifty millimetres deep. Space trays in the chiller, probe the thickest part of the fullest tray without touching metal, and record a reading at each time on the chill record.",
        "materials": [
          {
            "name": "Prep sheet",
            "description": "This morning's cooking: The weight of the batch, how many trays it goes into, and how deep each tray is filled."
          },
          {
            "name": "Chill record and probe",
            "description": "A form with four boxes for the readings and the time each was taken, the two lines the kitchen works to, 8°C, which is the temperature chilled food has to be held at, and a higher line above which a batch does not go to service at all, and a space at the bottom for two signatures; and the probe, which goes into the food rather than against the metal of the tray."
          }
        ],
        "interaction": "Terence, who pans the second half of the batch at the bench next to you and reads his own tray while you read yours.",
        "doneWhen": "The chill readings are recorded with their times, trays are spaced in the chiller, and the beef is under 8°C before it goes in the walk-in.",
        "whatHappensNext": "Once the batch is down it goes into the walk-in, ready for the evening team to bring back up to temperature before service.",
        "complication": "At ninety minutes your tray is still above 8°C while Terence's shallower tray is below it. Keep the batch in the chiller, continue logging, and measure the depths."
      },
      {
        "id": "check-the-dietary-list",
        "time": "12:30",
        "place": "Main kitchen, at the pass, then the events kitchen",
        "title": "Check tonight's dietary list",
        "situation": "Yvie brings the final guest list for tonight's one-hundred-guest product launch. Three late additions are on tables 3, 6, and 9, including a nut allergy.",
        "job": "Build the allergen chart from the recipe cards first. Check every dish and all fourteen allergens, then choose safe dishes for the three additions and put dish, name, and table on the events board.",
        "materials": [
          {
            "name": "Function sheet",
            "description": "Tonight's product launch: One hundred guests, the timings, the table plan, and the list of guests who have told the hotel there is something they cannot eat."
          },
          {
            "name": "Allergen chart and the evening board",
            "description": "A grid with tonight's dishes down the side and, across the top, the fourteen things that have to be declared by law because people can be allergic to them; and the whiteboard the evening team read when they come on at three."
          }
        ],
        "interaction": "In person with Yvie, who needs an answer before she prints the table plan, and with Terence, who reads the chart through with you before it goes up on the board.",
        "doneWhen": "Every dish on the allergen chart is marked against all fourteen allergens, each of the three added guests has a dish written against their name, and the changes are up on the evening board.",
        "whatHappensNext": "Yvie prints the table plan with the dietary notes on it, and the evening team pick the changes up when they come on at three.",
        "complication": "The frangipane contains almonds mixed through it, not just on top. It cannot be adapted; choose another dessert and write it on the board."
      },
      {
        "id": "hand-the-kitchen-on",
        "time": "14:30",
        "place": "Main kitchen, at the pass",
        "title": "Weigh the waste and hand the kitchen on",
        "situation": "The evening team are about to take over and serve one hundred guests. Waste needs weighing, the handover needs completing, and Terence will review the chill record with you.",
        "job": "Weigh all three tubs. Put the rice and melon from larder 2 under spoilage, complete and walk through the handover covering salmon, larder 2, and table 3, then talk Terence through the beef chill record and sign it together.",
        "materials": [
          {
            "name": "Waste sheet",
            "description": "A form with three rows: Trimmings from preparing food, food that went off before it was used, and food that came back from plates. Each row takes a weight in kilos."
          },
          {
            "name": "Handover sheet",
            "description": "What is prepared, what is short, what is in the walk-in for tonight, and a line for the one thing you would keep an eye on."
          }
        ],
        "interaction": "In person with Terence, who reads the chill record and asks what you would do with the trays next time, and with the evening team, who take the handover sheet from you and ask their own questions.",
        "doneWhen": "All three waste rows are weighed correctly, the handover is filled in and delivered, and the chill record has both signatures.",
        "whatHappensNext": "The day closes."
      }
    ],
    "gate": {
      "type": "complete",
      "id": "mar-try-day",
      "label": "Finish every task in the day to complete this section"
    }
  }
}
```
