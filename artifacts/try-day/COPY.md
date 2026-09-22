# Words on screen

How every label, button, hint and title in the try day is written. The spec text
(`content/mechanic.json`: task titles, done-when, complication) is client-signed
and stays exactly as it is. Everything else follows this.

## Who is reading

A 16–18-year-old on a try day who has never stood in a professional kitchen.
Bright, not stupid; unfamiliar with the words, not the ideas. They read labels
the way you read signs in a building you have just walked into.

## Rules

1. **A label says what happens when you click it, in the words you would say out loud.**
   Start with the verb. "Pick up the radio", not "Radio on charger". "Read the overnight log",
   not "Overnight log". "Go to the fridges", not "Fridge corridor".
2. **One kitchen word at a time, and say what it means the first time.**
   "The back door (goods-in, where deliveries come in)". After that just "the back door".
   Words that need a gloss: goods-in, the pass, GN tray, blast chiller, probe, walk-in, covers, function sheet.
3. **Use the plain word for the tool.** "Notebook" (the thing in your pocket), "temperature probe"
   or just "take the temperature", "scales", "clipboard". Never "jot", "log", "capture", "record" as verbs
   for the student's own notes. Say "write it in your notebook", "write it down", "use my note".
4. **Describe the kitchen, not the software.** "Come back in 30 minutes", not "Each wait moves the clock on".
   "Nothing to do here yet", not "Location unavailable". Never mention pins, hotspots, modals, panels, states,
   mechanics or the simulation in dialogue, feedback or labels. The one exception is the instruction layer,
   which is allowed to say how the screen works because the client asked for it: the "How this works" tiles
   and cards (`content/interaction-patterns.ts`), the "How" line of a workspace opener, and the step guide's
   instruction. There, name the gesture and its alternative in plain words ("Drag a tray onto a shelf, or tap
   the tray and then the shelf"), keep it to one sentence, and never let it reveal an answer.
5. **Sentence case for everything the app says.** Titles printed on real paperwork (a form's heading, a
   supplier's delivery note) can be in whatever case a real form would be, but the app's own words are not shouted.
6. **No filler and no trailing dots.** "Read this entry", not "Read entry...". "Look", not "Click to inspect".
   No "please", no exclamation marks, no "simply", no "now", no "successfully".
7. **Short.** Hotspot labels are one to four words. Buttons are one to three. Hints are one sentence.
8. **People speak like people.** Dialogue is in the character's voice, contractions and all, British English,
   kitchen register. No speeches; nobody explains the simulation. Terence tells you what to do and why
   in one breath. Yvie is clear about the event and guest list. The driver wants to leave. The evening team
   needs a useful handover.
9. **The student is "you".** Never "the trainee", "the user", "the learner".

## House style (punctuation)

Agreed with the client's reviewer on 22 September 2026. These apply to every string, including the
client-signed spec text in `content/mechanic.json`, where they are the only edits allowed.

- **Oxford comma.** "Reading, time, and initials", not "reading, time and initials". Lists of two
  ("time and initials") take no comma.
- **Capital after a colon** when a full phrase or sentence follows: "Function sheet says: Nut allergy",
  "Do not guess: Take readings". A colon before a bare number, time or unit name stays as it is
  ("Fridge 2: 7 °C").
- **Single curly quotes ‘ ’ for the name of a control** you are telling the student to press or choose:
  press ‘Put it on the scales’, choose ‘All here’. No double quotes around control names.
- **No em dashes or spaced en dashes** in anything the app says. Use a comma, a colon, brackets or a
  full stop instead. An unspaced en dash is only for ranges (16–18, 22:00–06:30).
- **"Simulation" takes a capital** wherever the word itself appears on screen ("Start the Simulation").
  It still does not belong in dialogue, feedback or labels (rule 4).
- **Item names** (dishes, ingredients, fridges) are sentence case when they stand alone as a title or
  label ("Beef shin", "Walk-in fridge") and lower case mid-sentence ("the beef shin in the walk-in fridge").

## Words we use, and the words we don't

| Say | Not |
| --- | --- |
| notebook, write it down, use my note | notepad, jot, log it, capture, record it |
| take the temperature | probe it, read the probe, read the temp |
| the back door (goods-in) | goods-in on its own |
| the fridges | the fridge corridor, the refrigeration corridor |
| the prep bench | the prep bench and blast chiller |
| the events kitchen | events, the banqueting kitchen |
| job card | the job, task panel, brief |
| map | kitchen map, minimap |
| finished / signed off (paperwork only) | completed, submitted, locked |
| box, crate, sack, tray | line item, SKU, unit |
| all here / short / refused | arrived / short / refused |

## Patterns

- Hotspot on an object: verb + object. "Open the walk-in", "Take the delivery note", "Weigh the waste".
- Hotspot that moves you: "Go to the fridges", "Go to the back door", "Back to the pass".
- Primary button on paperwork: what you are doing to the paper. "Sign the note", "Write the readings up".
- Button that saves something to the notebook: "Write it in your notebook".
- Chip that fills a form field from a note: "Use my note".
- Hint under a disabled button: say what unblocks it, in the world. "Write the 30-minute reading on the
  chill record first." Every disabled or locked control carries one, visibly, not only for screen readers.
- Workspace opener (`components/kitchen/workspace-opener.tsx`), at the top of every workspace, three lines:
  What to do (one imperative sentence), How (the gesture on this screen and its button alternative), Done when
  (what finished looks like, with a live count where there are several items: "0 of 4 trays loaded"). It also
  holds "Watch the task briefing" and "How do I do this?". The opener never names an answer.
- Close-up title: the object's plain name. "Overnight log", "Fridge 2", "Order sheet", "Trolley 1: fish".
- Map: "Where do you want to go?"; pin tooltip says what is waiting there; a pin with nothing to do says
  "Nothing to do here yet".
- Read-only, signed-off task: "You've signed this off. It stays as you left it."
