# Client Try Day — Experience Storyboard V2: Tempdent · Apprentice Dental Nurse

## Interaction redesign for sign-off

> **About this draft (V2, 23 September 2026).** V1 (22 September 2026) was signed off for its content: the shift, the people, the six tasks, the facts inside them, the decisions, the feedback and the completion criteria. V2 does not reopen that content. It changes **how the learner does each task**. A learning-design review of the V1 build found that the day asks the learner to do three things forty-nine times: pick a sentence (28 times), tick the right items (11) or tap steps in the right order (8), each followed by the same verdict panel and a "Carry on" button. The rooms are photographs behind the work rather than places the work happens in. V2 replaces that single loop with mechanics that fit each task's real skill, cuts the number of verdict panels from 49 to 6, and makes the room, the patient and the clock react to what the learner does.
>
> Everything in V1 that is not mentioned here stands as signed off: Sections 1–7 (purpose, employer, tone, shift, people, map), every task's Sections B (learning purpose), C (materials) and J (accuracy), all approved facts and wording, and all **TBC** flags for the Tempdent SME. Where V2 changes a task, this document restates Sections D–H in full so that each task can be read on its own. Where a V2 mechanic needs a clinical answer that V1 did not need, it is listed under the task's **K. Questions for Tempdent**, and again in the sign-off list at the end.
>
> Nothing in V2 has been built. Building starts on written sign-off of this document, in the phases set out in Part 3.

---

## Part 1 — What changes and why

### 1.1 What the V1 build feels like to play

| Measure | V1 build |
|---|---|
| Decisions across the six tasks | 49 |
| Distinct things the learner does | 3 (pick a sentence, tick items, tap steps in order) |
| Taps to complete the day with no mistakes | 131 actions + 49 "Carry on" = about 180 |
| Verdict panels (mentor text after a decision) | 49, one per decision, right or wrong |
| Moments where the room, the patient or a colleague visibly reacts | 0 |
| Moments where a decision made earlier in the day matters later | 0 |
| Changes of tempo | 0 (every decision is untimed and self-paced) |

The learner reads the prompt, taps, reads Priya's verdict, taps "Carry on", 49 times. The photographs of Surgery 2, the decontamination room and reception do not change when the learner wipes, loads, settles or resets. Amira and Graham exist only as lines of text. Dr Reid never reacts except through a verdict. The clock in the header never presses on anyone. The result reads as a well-dressed quiz, and the two tasks that carry Tempdent's strongest message (that this is a patient-facing, people-first role) are the most quiz-like: 14 of the 16 decisions in Tasks 2 and 6 are multiple choice.

Specific problems the redesign answers:

- **Long sequences become labour.** Wipe (7 taps), tray (10), reset (10): the learner has shown the principle by the third tap; the rest is data entry.
- **Asserted steps.** "Uniform, hair, handwash, PPE, gloves" is five taps to say "yes, I know".
- **Right answers cost a panel and a tap.** About 30 of the 131 taps dismiss praise.
- **The role's signature skill is absent.** Four-handed dentistry is anticipation and rhythm. Task 3 asks the learner to tap four items in order from a list.
- **Watching the patient is told, not practised.** V1 says "watching the patient is the job" four times; the learner never has to notice anything that the prompt has not already announced.

### 1.2 Six shared changes (apply to every task)

| # | Change | What the learner experiences | What it replaces |
|---|---|---|---|
| S1 | **The room answers first.** A right action is confirmed by the world: the surface comes up clean, the light comes on, Amira's shoulders drop, Dr Reid nods, the autoclave display reads the cycle. A short sound marks it. There is no text panel and no "Carry on". A wrong action still gets Priya's one-line reason immediately, kindly, with a retry (V1 rule, unchanged). Each scene ends with one short **debrief** from Priya or Dr Reid (two or three lines: one thing done well, one to watch). A "Why did that work?" link under any completed step opens the V1 "right" feedback for learners who want it. | 49 verdict panels → 6 debriefs plus wrong-only asides |
| S2 | **One gesture for a routine.** Ordered routines of five or more steps are done as one continuous action: a wipe path dragged across the surfaces, instruments lifted onto the tray in one sweep, a flush held down. The routine is judged once at the end, as V1 already does for sequences. Keyboard and switch users step through the same routine with Tab and Enter; nothing is lost. | Tap-one-at-a-time sequences of 7–10 cards |
| S3 | **The notebook writes itself.** Things the learner notices or decides go into the notebook automatically as time-stamped "Noticed" entries: the expired glucagon, the broken seal, Amira's signal, the two delivery items flagged, Graham's minute outside. The learner can add a one-line note of their own at any time (never assessed). Task 6's handover is written *from* this notebook. | A notebook that holds reference cards only |
| S4 | **The day remembers.** Three light-touch consequences, all recoverable: the tray built in Task 1 is the tray passed from in Task 3 (a missing matrix band means Dr Reid waits while the learner fetches one); the broken-seal pouch set aside in Task 1 is on the dirty side in Task 5 ("that's yours from this morning"); the glucagon and the delivery reappear as handover lines in Task 6 only if the learner's notebook holds them. | Six tasks that do not know about each other |
| S5 | **Two tempos.** One paced segment (Task 3, "four hands", about 90 seconds) and one clock segment (Task 4, the turnaround with the 09:40 waiting). Everything else stays untimed. Both have an **"at your pace"** setting, on by default for keyboard, switch and screen-reader users and available to everyone from the sound/settings control: Dr Reid waits for the learner and the waiting-time clock pauses. Speed never changes what is judged; the debrief lines simply describe what happened. | A day with no tempo, apart from two "time-limited" choices |
| S6 | **Look before you act.** Each task opens with twenty to thirty seconds of looking before the first action: the surgery as last night left it, Amira in the waiting room, the corridor with the box in it. "Read the room, watch the patient" becomes something the learner does, not something Priya says. | Tasks that open on the first prompt |

### 1.3 How V2 keeps V1's rules

- **One source of truth.** Every decision still has a defined acceptable answer in the content, and the evaluation of that answer is what the scene shows. A patient's reaction, a nod or a surface coming up clean is the *presentation* of the content's right/wrong outcome, authored per option in the content. Scenes never judge on their own.
- **No self-attested completion.** Nothing is completed by ticking "done"; every completion clause is evidenced by an action the experience recorded.
- **No hints about order.** Gesture routines never show the expected order; they judge the order the learner chose. Pin labels name places and actions, not steps.
- **Teach as well as test.** Every item still explains itself when tapped; "ask Priya" is always available; the first mistake still costs nothing visible.
- **Within an apprentice's role.** No mechanic asks the learner to make a clinical decision. The paced segment passes items Dr Reid names; the learner never chooses treatment. Local anaesthetic stays in the clinician's hands.
- **Accessibility.** Every drag has a tap-lift/tap-place alternative (already built); every paced element has "at your pace"; every sound has a caption; states of a person are described in text for screen readers ("Amira is holding the armrests").

### 1.4 The redesign in one table

| Task | V1 | V2 | Verbs the learner uses |
|---|---|---|---|
| 1 Set up | 9 decisions, 32 taps: order cards, tap 7 surfaces, choose, tick kit, tick 10 tray items | 8 decisions, about 24 actions: spot what's wrong with you in the mirror, hold the handwash, find four things wrong in the room, wipe in one path, hold the flush, read five labels and decide about one, build the tray and set the bad pouch aside | spot, notice, sweep, hold, read, decide, place |
| 2 Welcome Amira | 7 decisions, all multiple choice or card order | 7 moments, one conversation: Amira and Karim visibly react to every line; the chair, bib and glasses are real controls; the light moment is the test of watching | greet, settle, watch, pause, record, answer, pass on |
| 3 Support the filling | 7 decisions: 5 multiple choice, an ordered list, a tick list | 7 decisions, four of them inside a 90-second paced segment: position the suction live, pass what Dr Reid needs before she asks, speak up when Amira's hand lifts | position, anticipate, pass, speak up, wait |
| 4 Notes, aftercare, reset | 8 decisions: order cards, tick, choose, order 10 cards | 9 decisions, one clock: bring Amira up slowly, stick the batch labels, answer Karim's three questions, tell Sam how long, reset the room against the clock with the safety rules judged at the door | settle, stick, record, explain, hand over, prioritise, reset |
| 5 The morning changes | 9 decisions: tick, choose, order 4 cards, choose, tick | 8 decisions, one plan board: sort six instruments three ways, load the autoclave, plan the morning on a board with an "Ask" column, flag the two items in the delivery, read the cycle printout | sort, load, plan, ask, message, flag, read, label |
| 6 Graham and close-down | 9 decisions: 7 multiple choice, order cards, tick | 8 decisions: where you sit is one of them, Graham reacts to every line, the same "Speak up" control as Task 3 when his breathing changes, the handover is written from your own notebook | approach, offer, hold back, speak up, record, close, hand over |

Decisions barely fall (49 to 47); the change is in the verbs (3 → 15), the verdict panels (49 → 6) and the number of moments where something other than a text panel answers the learner (0 → every decision).

---
## Part 2 — Task storyboards (V2)

Each task restates Sections D–H in full. Sections A, B, C, I and J are as V1 unless a change is listed. "Kept" means the V1 decision and its feedback are unchanged; "changed" means the same decision in a new form; "new" and "merged" are marked.

---

## Task 1: Set up the surgery for the morning

### A. Story setup — changes only

- **Situation (addition):** The learner walks into Surgery 2 before Priya says anything. The room is as last night's close-down left it: the light still positioned over the chair and switched on, a used rinse cup on the delivery unit, the sharps container lid open, the clinical waste bin overfull. Priya's introduction follows the learner's first look round.
- **Learner's job (V2 wording):** Get yourself ready, notice what is wrong with the room before you touch it, then get Surgery 2 clean, working, safe and stocked for the morning: wipe it in the right order, flush the water lines, check the emergency equipment and drugs, and build the tray for Amira's filling. Initial the check sheets as you go.

### D. Learner steps

| Step | What the learner needs to do | Information they use | Interaction (V2) | Correct/acceptable outcome |
|---:|---|---|---|---|
| 1 | **Mirror check.** Get yourself ready at the PPE station. Something about you is not right for the surgery. | The mirror above the sink; Priya's one line: "Have a look at yourself first." | A close-up of the learner's reflection (uniform, hands, hair, badge; no face needed — shoulders down). One thing is wrong, drawn at random from three: a watch on the wrist, hair down over the collar, a ring. Tap what is wrong; it is put right in the mirror. | The item is found and put right. A wrong tap ("the badge") gets Priya's one-line reason and another go. |
| 2 | **Handwash, then PPE.** Wash your hands the 12-step way, then put on your PPE. | 12-step poster; PPE station | Press and hold the tap: the poster's twelve steps light up one by one while the learner holds (about eight seconds, compressed). The PPE goes on in one tap-through with gloves last, shown, not tested. If the learner reaches for the gloves box before the tap, Priya's V1 line plays and the gloves box stays shut. | Handwash held to the end, then PPE. Letting go early restarts the count with "all twelve — start again." |
| 3 | **Walk-in inspection.** Look round the room before you touch anything. Four things are not right. | The surgery as last night left it; the surgery check sheet on its clipboard | Free look round the photograph (pan). Tap anything that is not right. Four are there: light on over the chair, used cup on the delivery unit, sharps container lid open, waste bin overfull. Each tap fixes it in the picture (light off and parked, cup binned, lid closed, bin bagged) and the matching check-sheet line initials itself. A tap on something that is fine gets a neutral "That's as it should be" with no penalty. A counter shows "4 to find" so the learner knows when they have finished looking. | All four found. If the learner tries to start wiping with things still wrong, Priya: "Before you wipe: what's still not right in here?" |
| 4 | **Wipe the surgery.** Wipe the chair and then the hard surfaces in the right order. | Priya's explanation of the order; the surgery | One continuous gesture: touch the surface you start on and drag a path across the seven surfaces (headrest and top of the chair, light and handles, delivery unit and handpiece holders, aspirator hoses, spittoon, work surfaces and equipment, cupboard and door handles). Each surface the path crosses comes up visibly clean with a short glow for the contact time. Judged once when the learner lifts off. | Chair from its highest point down, spittoon last on the chair, hard surfaces after the chair. A wrong path gets Priya's V1 line and the surfaces reset for another go. |
| 5 | **Flush the water lines.** First flush of the day. | Priya: "This is the first flush of the day." | Choose 20–30 seconds / 2 minutes / 5 minutes, then hold the flush button. Water runs (sound), the header clock advances in compressed time, the check-sheet line fills. | 2 minutes. 20–30 seconds gets the V1 line (that is the between-patients flush). |
| 6 | **Emergency equipment.** Open the box, read every label, check the oxygen and the AED, and deal with what you find. | Medical emergency equipment check sheet; the drugs box; oxygen gauge; AED indicator | Close-up of the open box (built). Each item zooms when tapped and its check-sheet line initials itself once it has been read; nothing can be ticked without being opened. The glucagon reads last month. When the sheet is complete, the decision: **tell Priya now / tick it and move on / swap it from the stock room.** | Glucagon flagged on the sheet and reported before continuing. The other two get the V1 feedback. The report goes into the notebook as "Noticed 08:31: glucagon out of date, told Priya." |
| 7 | **Fresh hands, then the tray.** Read the day list, wash and glove again, then build the tray for the 09:00 composite filling from the laminated card, checking every pouch. | Day list; tray set-up card; instrument cupboard | The sink is the way to the cupboard: opening the cupboard before a fresh handwash gets Priya's line and the cupboard stays shut (this replaces V1's "before you open the cupboard, what do you do?" question). Tray building is the existing tap-lift, tap-place (drag on pointer). Every item explains itself on a long press. One examination set has a broken seal, visible when the pouch is turned over (a second tap): the tray has a second drop zone, **"Back to decon"**. The extraction forceps stay as the distractor. | Tray matches the card; forceps left in the cupboard; the broken-seal pouch is in the decon zone, not on the tray (replaces V1's multiple-choice "what do you do with the pouch"). The notebook records "Noticed 08:47: pouch with broken seal set aside." |
| 8 | **Initial the sheets.** | Both check sheets | Type your initials once; they are stamped on every line you completed. | Initials present on both sheets. (Replaces V1's multiple-choice "how do you record it".) |

### E. Decisions and feedback

| Decision or question | Status | Acceptable answer(s) | Common plausible mistake | Feedback after mistake |
|---|---|---|---|---|
| What is wrong with you in the mirror? | New | The randomised item (watch / hair / ring) | Tapping the badge or the tunic | "Badge is fine. Look at your hands and your collar. Anything that can carry what you touched on the bus into a patient's mouth comes off or goes up." (**TBC**) |
| Handwash or PPE first? | Kept (V1 form: order cards) | Handwash, held to the twelfth step, then PPE, gloves last | Reaching for the gloves first; letting go of the tap early | V1 line unchanged; early release: "All twelve. It takes as long as it takes — start again." (**TBC**) |
| What is not right in the room? | New | Light on, cup on the unit, sharps lid open, bin overfull | Starting to wipe with items still wrong | "Before you wipe: what's still not right in here? Look at the unit." (**TBC**) |
| Where do you start wiping, and where do you finish? | Changed (one path instead of seven taps) | Chair from the top, spittoon last on the chair, then hard surfaces | Spittoon first; surfaces before the chair | V1 line unchanged |
| How long is the first flush? | Kept | 2 minutes | 20–30 seconds | V1 line unchanged |
| The glucagon is out of date: what do you do? | Kept | Flag and tell Priya now | Tick and move on; swap it yourself | V1 line unchanged |
| Fresh handwash before the cupboard | Changed (world rule instead of a question) | Wash and glove, then open | Opening the cupboard in the gloves you wiped in | "Those gloves have just done the spittoon. Fresh hands before anything goes near a tray." (**TBC**) |
| What goes on the tray, and what happens to the broken-seal pouch? | Merged (V1 tray + V1 pouch question) | Tray matches the card; pouch to "Back to decon" | Pouch on the tray; forceps on the tray; matrix band left off | V1 lines unchanged; the matrix band's "tap to learn" text unchanged |

### F. Completion criteria

| Done-when clause | Evidence saved by the experience | Can the learner revise it before sign-off? |
|---|---|---|
| The learner is correctly presented (mirror item put right), has completed the held handwash and put on PPE before entering, and has washed and gloved again before opening the instrument cupboard | Mirror fix, handwash hold completed twice, cupboard-open timestamp after the second hold | Yes |
| All four walk-in faults are found and fixed before the wipe begins | Fault log | No (once fixed they stay fixed) |
| The wipe path runs chair-top to spittoon, then hard surfaces, and the 2-minute flush has been held to the end | Wipe path and flush duration | Yes |
| Every emergency item has been read, the glucagon is flagged and reported to Priya, and both sheets carry the learner's initials | Sheet state, report event, initials | No (once reported it stays reported) |
| The tray matches the card and the broken-seal pouch is in the "Back to decon" zone | Tray state | Yes |

### G. Complication or change

As V1 (the expired glucagon, triggered by reading the labels in Step 6; Priya's recovery line if the learner ticks and moves on). Addition: the walk-in faults in Step 3 are the task's opening "look before you act" moment (S6) rather than a complication.

### H. Dialogue — additions to V1

| Moment | Speaker | Line (all **TBC**) |
|---|---|---|
| First look round | Priya | "Don't touch anything yet. Have a look round first — last night's close-down was in a hurry. What isn't right?" |
| Mirror check | Priya | "Have a look at yourself first. Anything you'd not want in a patient's mouth?" |
| After the wipe path | Priya (debrief, if right) | "Top to bottom, spittoon last, surfaces after. That's the habit — you'll do it forty times a week." |
| Broken seal set aside | Priya | "Good. That one goes back through decon — you'll probably meet it again later." |
| Task debrief | Priya | "Four things spotted before you touched a wipe, sheets initialled, tray matches the card, and you caught that date. That's a proper set-up. Dr Reid's in at ten to nine." |

### I. Media — additions

- Surgery 2 "as left last night" variant of the existing surgery photograph (light on and positioned over the chair, cup on the unit, sharps lid open, bin overfull), plus the four "fixed" overlays. Placeholder until Tempdent photography.
- Mirror close-up (learner's shoulders and hands only; three variants: watch, hair down, ring; and the corrected state).
- Surface "dull → clean" overlays for the seven wipe surfaces (can be built as image masks over the existing photograph).
- Sounds: tap running, wipe pass, flush, box lid, pouch turn (generated, no talent needed).

### K. Questions for Tempdent

1. Is a randomised presentation fault (watch / hair / ring) acceptable, and are these the three the SME would choose? (Nails and lanyards are alternatives.)
2. Are the four walk-in faults realistic for a surgery after a rushed close-down, and is "sharps lid open" acceptable to show?
3. The handwash is compressed to about eight seconds on screen. Is showing the twelve steps lighting in sequence acceptable without teaching each step?

---
## Task 2: Welcome Amira and her dad

### The mechanic: a person who reacts

Amira has a visible state throughout the task: **braced** (small in the chair, holding the armrests or her dad's sleeve), **wary** (watching, not yet settled) and **settled** (feet swinging, looking at the glasses). Karim has two: **worried** and **reassured**. Every line the learner chooses moves one or both of them, and that movement is the feedback. A poor line gets Priya's quiet aside immediately (V1 feedback, unchanged) and a retry; a good line gets nothing but the change in Amira. The scene's goal is stated once and shown in the rail: **"Amira is in the chair, bib and glasses on, and settled, before Dr Reid comes in."** Priya's debrief comes at the end of the scene, not after each line.

Screen readers hear the state as text ("Amira is holding the armrests and looking at the floor"). The three states are three stills per location (waiting room chair; dental chair), not animation.

### A. Story setup — changes only

- **Situation (addition):** The learner sees Amira and Karim in the waiting room for a few seconds before Sam speaks: Amira braced on the chair edge, Karim's hand on her back, a room with three other patients in it.

### D. Learner steps

| Step | What the learner needs to do | Information they use | Interaction (V2) | Correct/acceptable outcome |
|---:|---|---|---|---|
| 1 | **Collect Amira and her dad.** Choose how you greet them. | The waiting room; the "please tell us if you are anxious" sign | Four greetings (V1). The room reacts: announcing the treatment across the room makes the other patients look up and Amira shrink; the good greeting brings her eyes up to you. | V1 acceptable answer. Amira moves braced → wary. |
| 2 | **Settle Amira in.** Get her coat off, into the chair, bib and glasses on, with dad where she can see him. | The surgery; the glasses rack; the chair controls | Real controls on the photograph rather than sequence cards: the coat hook, the chair (invites her to sit), the chair controls, the bib, the glasses rack, the dad's stool. Order is free except two rules judged in the world: touching the chair controls before you have explained them makes Amira grab the armrests (Priya's aside); the glasses rack lets *her* choose the colour (she picks, the learner does not). | Coat hung, Amira seated, controls explained before the chair moves, bib on, glasses chosen by Amira, Karim on the stool in her eyeline. Amira wary → settled if all rules held. |
| 3 | **The light comes on.** Dr Reid comes in and the light swings over. Amira's eyes fill and she grips the armrests. | Amira's state | The V1 pause decision, presented as what you do next: pause, crouch to her level, give her something to control / put the bib on and keep going / tell her it's fine. Amira's state and Karim's face answer the choice; Priya steps in as V1 if the learner pushes on. | V1 acceptable answer. Amira back to settled; Dr Reid's line: "Take your time, Amira." |
| 4 | **Medical history.** Record what dad says while Dr Reid asks the questions. | Notes close-up (built); Karim's three lines | Kept: tick what to record on the notes page. Karim's three lines are heard/captioned, not printed as a list. | V1 acceptable answer (antibiotics recorded; inhaler noted; "didn't sleep" not recorded as medical). |
| 5 | **The antibiotics.** What do you do about them? | The notes | Kept (three options). If the learner "says it aloud to Dr Reid", Dr Reid answers on screen ("Finished last week? That's fine — thank you"), which is the confirmation. | V1 acceptable answer. |
| 6 | **"Is it going to hurt?"** Amira asks quietly. | Amira's state | Kept (four options). A pain promise briefly settles Amira and makes Karim look at you; the honest line with the stop signal settles them both. Naming the signal writes "Agreed the hand-up signal with Amira" into the notebook (S3; used in Task 3). | V1 acceptable answer. |
| 7 | **"Can she have the white filling?"** Karim asks. | Which questions are the dentist's | Kept (options as V1). Passing it warmly brings Dr Reid's answer on screen; guessing or brushing him off moves Karim to worried. | V1 acceptable answer. |

### E. Decisions and feedback

| Decision or question | Status | Acceptable answer(s) | Common plausible mistake | Feedback after mistake |
|---|---|---|---|---|
| How do you greet them? | Kept | V1 | V1 | V1 lines; plus the room's reaction |
| Explain before the chair moves; let Amira choose the glasses | Changed (world rules instead of card order) | Controls explained first; Amira picks | Reclining without a word; picking the glasses for her | "Tell her before it moves — a chair that tilts on its own is frightening at ten. And the glasses are hers to pick; it's the one thing in here she gets to decide." (**TBC**) |
| Amira's eyes fill when the light comes on | Kept | V1 | V1 | V1 lines |
| What do you record from the medical history? | Kept | V1 | V1 | V1 lines |
| What do you do about the antibiotics? | Kept | V1 | V1 | V1 lines |
| "Is it going to hurt?" | Kept | V1 | V1 | V1 lines |
| "Can she have the white filling?" | Kept | V1 | V1 | V1 lines |

### F. Completion criteria

| Done-when clause | Evidence saved by the experience | Can the learner revise it before sign-off? |
|---|---|---|
| Amira greeted by name without the treatment announced across the room | Greeting choice | Yes |
| Amira seated with bib and glasses on, controls explained before the chair moved, glasses chosen by Amira, Karim in her eyeline | Room state and event order | Yes |
| The learner paused when Amira's eyes filled (or Priya's step-in was answered correctly) | Pause choice | Yes |
| The notes carry the antibiotics and the inhaler, and the antibiotics were said aloud to Dr Reid | Notes state | Yes |
| Both questions answered as V1 | Choices | Yes |
| Amira's state is "settled" when Dr Reid picks up the mirror | State log | Yes (any wrong line can be retried) |

### G. Complication or change

As V1: the light comes on, Amira's eyes fill, Priya steps in if the learner pushes on. In V2 the moment is shown (Amira's state changes, Karim looks at the learner) before any prompt appears; the prompt follows only if the learner does nothing for a few seconds or reaches for the bib.

### H. Dialogue — additions to V1

| Moment | Speaker | Line (all **TBC**) |
|---|---|---|
| Scene goal, as Amira sits | Priya (quietly) | "Before Dr Reid comes in, I want her settled — bib, glasses, dad where she can see him. Take your time." |
| Chair moved without warning | Priya (aside) | "Tell her before it moves. Go on." |
| Amira chooses the glasses | Amira | "Purple." |
| Passing the white-filling question | Dr Reid | "Good question, Mr Hassan — yes, it's a white filling today, I'll show you the shade." |
| Scene debrief | Priya | "She walked in holding her dad's sleeve and she's sitting there swinging her feet. That's you. One thing to keep: when her eyes filled, that was the moment — you stop, every time." |

### I. Media — additions

- Amira: three stills in the waiting room (braced, wary, settled) and three in the dental chair, plus one with glasses on. Karim: worried and reassured, in both locations. Placeholder AI stills until Tempdent talent; consistent character design across Tasks 2–4.
- Three other waiting-room patients (background, non-identifiable) who "look up" in one variant.
- Sounds: chair motor, bib clip, glasses rack.

### K. Questions for Tempdent

1. Is showing a ten-year-old's eyes filling acceptable in stills, or should distress be shown only through posture (armrests, sleeve)?
2. Does "Amira picks the glasses colour" match what the SME would coach (giving the child a choice), and is "purple" fine as the line?
3. Should Dr Reid's on-screen answers to passed questions be shown, or should the learner only see that the question reached her?

---

## Task 3: Support the filling

### The mechanic: four hands, ninety seconds

The centre of the task is a paced segment. Dr Reid works in real time; her requests come as short audio cues with captions ("Etch." "Bond." "Composite." "Band." "Light." "Paper."). The learner has the tray from Task 1 at the bottom of the screen and Amira in the chair. Each request is preceded by a **two-second tell**: Dr Reid's hand opens, or she glances at the tray. Passing the right item during the tell is early ("you were ahead of me": a nod); passing on the request is fine; passing the wrong item, or nothing, makes Dr Reid look up and wait. The pass itself is a gesture: drag the item to Dr Reid's open hand, below Amira's chin, handle first. A path across Amira's face gets Priya's aside once, then the segment carries on. In the middle of the segment, while the handpiece runs, Amira's hand lifts from the armrest. A **Speak up** control is on screen throughout the segment (and returns in Task 6); pressing it says "Dr Reid — Amira's hand is up" and Dr Reid stops.

There is no score. At the end, Dr Reid's debrief line depends on how often she had to look up (never / once or twice / more), and the learner may replay the segment. **"At your pace"** makes every cue wait for the learner and removes the tell, so keyboard, switch and screen-reader users play the same segment as a turn-based one. With the tray from Task 1 missing the matrix band, "Band." is answered by fetching one from the cupboard while Dr Reid waits (S4), and Priya's aside names the cost.

### A. Story setup — changes only

- **Learner's job (V2 wording):** Keep the field clear, have the next thing ready before Dr Reid asks for it, and be her eyes on Amira. Nothing here is yours to decide; everything here is yours to notice.

### D. Learner steps

| Step | What the learner needs to do | Information they use | Interaction (V2) | Correct/acceptable outcome |
|---:|---|---|---|---|
| 1 | **The local anaesthetic.** Dr Reid reaches for it. Do you pick it up to help? | Priya's guidance on the clinician's items | Kept (three options). Right answer: Dr Reid picks it up herself; the learner's hands stay on the suction and the tray. | V1 acceptable answer (no). |
| 2 | **Position the suction.** Dr Reid starts to remove the decay. | The field close-up; Priya's tip | Live: drag the suction tip on a close-up of the field (near the tooth / across the mirror / at the front of the mouth). Where it sits wrong, spray and water visibly pool; where it sits right, the field clears and Dr Reid says "That's it." Judged when she says so. | V1 acceptable answer: near the tooth, clearing spray, cheek held clear, mirror unobstructed. |
| 3 | **Four hands (paced segment).** Have the next item ready before she asks: etchant, bonding agent, composite, matrix band, curing light with its sleeve and the orange shield, articulating paper. | The "what happens in a filling" strip (readable before the segment starts); tray labels; the tells | As described above. Six passes, one interruption (Step 4), one two-part pass (Step 5). | All six items passed in the order asked; hand-signal answered; light passed sleeved with the shield in hand. |
| 4 | **Amira's hand lifts** while the handpiece is running (inside the segment). | Amira's hand and face | Press **Speak up** before Dr Reid notices (about three seconds; "at your pace": before the next cue). Dr Reid stops. Then a choice of what happens next: wait for Dr Reid to check with Amira and restart / tell Amira to keep still / restart the suction yourself. | Speak up pressed; V1 acceptable answer for the restart. If missed, Dr Reid sees it herself and says her V1 line; the moment goes into the notebook as a learning point. |
| 5 | **"Light."** Pass the curing light and protect everyone's eyes (inside the segment). | Tray | Two-part pass: the light (only the sleeved one is on the tray; the unsleeved one is a distractor in the drawer) and then the orange shield, which the learner holds up. Missing the shield: Dr Reid pauses with the light in her hand — "Shield?" | Sleeved light passed; shield up before the light runs. |
| 6 | **Debrief.** | | Dr Reid's line by band, then Priya's one line. "Play it again" offered once. | |

### E. Decisions and feedback

| Decision or question | Status | Acceptable answer(s) | Common plausible mistake | Feedback after mistake |
|---|---|---|---|---|
| Do you pick up the local anaesthetic? | Kept | V1 (no) | V1 | V1 lines |
| Where do you hold the suction? | Changed (drag instead of three pictures) | V1 | V1 | V1 lines, spoken while the water pools |
| What does Dr Reid need next? (six passes) | Changed (paced passes instead of an ordered list) | Etchant → bonding agent → composite → matrix band → sleeved light with shield → articulating paper (**TBC** SME: V1 has the band before the composite in the tray card and after it in the strip; the SME's order stands) | Composite before bonding; unsleeved light; forceps | Item explains itself in one line as it goes back; Dr Reid: "Not yet — bond first." (**TBC**) |
| How do you pass it? | Changed (gesture instead of three options) | Below the chin, handle first, out of Amira's line of sight | Across Amira's face; putting it on the tray for Dr Reid to pick up | V1 line, once; after that the pass simply counts as a look-up |
| Amira's hand lifts | Changed (Speak up control instead of a four-option timed choice) | Speak up at once | Carrying on; telling Amira to keep still | V1 Dr Reid line ("I need you to be my eyes on Amira…") |
| What happens after Dr Reid stops? | Kept | V1 | V1 | V1 lines |
| The light | Changed (two-part pass instead of tick list) | Sleeved light, shield up | Unsleeved light; no shield | V1 lines |

### F. Completion criteria

| Done-when clause | Evidence saved by the experience | Can the learner revise it before sign-off? |
|---|---|---|
| The local anaesthetic was left to Dr Reid | Choice | Yes |
| The suction was positioned where the field cleared | Final tip position | Yes |
| All six items reached Dr Reid in the order she asked, with the light sleeved and the shield up | Segment log (item, cue, early/on request/late) | Yes (replay) |
| The learner spoke up when Amira's hand lifted, or answered Dr Reid's step-in correctly | Speak up timestamp | Yes (replay) |
| Dr Reid's restart was left to her | Choice | Yes |

### G. Complication or change

As V1 (Amira's hand, the pooled water, Dr Reid's stop and check). Addition (S4): if the matrix band was left off the Task 1 tray, "Band." cannot be answered from the tray; the learner fetches one from the cupboard, Dr Reid waits, and Priya's aside is: "That's why the tray is built before she sits down. Ten seconds for you, a lifetime for Amira." (**TBC**)

### H. Dialogue — additions to V1

| Moment | Speaker | Line (all **TBC**) |
|---|---|---|
| Before the segment | Priya | "From here it's her rhythm, not yours. Watch her hands; the tell comes before the ask. And watch Amira — if her hand goes up, you say so before I do." |
| Early pass | Dr Reid | "Ahead of me — good." |
| Wrong item | Dr Reid | "Not that one — bond." |
| Debrief, never looked up | Dr Reid | "I didn't look up once. That's four-handed dentistry, and you've been here three weeks." |
| Debrief, once or twice | Dr Reid | "Twice I had to look up. Next time, watch my hand rather than the tray — it tells you first." |
| Debrief, more | Dr Reid | "I had to look up a few times, and that's fine — nobody gets the rhythm in week three. Play it again and watch my hand, not the tray." |
| Priya, after | Priya | "You spoke up the second her hand moved. That's the one I'd have wanted." |

### I. Media — additions

- Field close-up (mouth, mirror, handpiece, suction) with three water/spray states. Placeholder illustration until clinical photography; SME to approve what is shown.
- Dr Reid's hands: open-hand tell, receiving, working, "looking up" (four stills or short loops). Placeholder.
- Amira in the chair: hand on armrest, hand lifting, reassured (three stills).
- Six cue lines for Dr Reid as audio: placeholder synthetic voice with captions until talent is recorded; captions are the accessible form either way.
- Sounds: handpiece, suction, curing light beep, water.

### K. Questions for Tempdent

1. Would an apprentice three weeks in pass materials during a filling, or should the segment be framed as "Priya passes, you shadow and call the item" for the first half and "your turn" for the second? (V1's known uncertainty about the apprentice's stage applies most here.)
2. Is a paced segment with a two-second tell acceptable for the 14–18 audience, given the "at your pace" setting?
3. Should Dr Reid's debrief mention how many times she looked up, or only what to watch next time?
4. The exact order of passes in a composite filling (etch, bond, band, composite, light, paper) needs the SME's word; V1 is inconsistent between the tray card and the strip.

---
## Task 4: The job isn't finished — notes, aftercare and reset

### The mechanic: a turnaround against the clock

The second half of the task is the day's clock segment. Sam's message arrives as the reset starts; the header clock runs and a small line under it reads "09:40 has been waiting 10 min" and counts. The room shows everything Amira's appointment left behind. The learner resets it with real controls (S2), not ten ordered cards. The order is judged **at the door**: when the learner opens the door for the next patient, Priya checks the safety rules, and any rule broken sends the learner back to that step with her V1 line. The clock never ends the task and never changes what is judged; it exists so that the learner feels the pull to skip and chooses not to. "At your pace" pauses it.

### D. Learner steps

| Step | What the learner needs to do | Information they use | Interaction (V2) | Correct/acceptable outcome |
|---:|---|---|---|---|
| 1 | **Bring Amira up.** Look after her as the treatment ends. | Priya's routine; the chair controls | Real controls: mouthwash cup, the hand mirror (offered; Amira decides), glasses, bib, chair-up. Chair-up is press-and-hold: a quick tap brings her up fast and Priya's aside plays ("Slowly — she's been flat for forty minutes"). Then one thing to say to her (three lines). | Mouthwash, glasses and bib off, chair held up slowly; the specific praise line (V1). Amira settled → proud (a fourth still). |
| 2 | **The batch numbers.** Record the batches from the three packages. | Three packages (close-up, built); notes page | **Peel and stick:** each package shows its label; the learner drags the batch number (not the product code, not the expiry) onto the matching field on the notes page. A wrong number sticks briefly and lifts off with the V1 explanation. | Three correct batch numbers in the right fields. |
| 3 | **Dr Reid's dictation.** Tick what goes into the notes. | Dictation (audio with captions); notes page | Kept: the notes close-up. | V1 acceptable answer (recall 6 months, hand-signal note, and the rest of the dictation; distractors left out). |
| 4 | **Aftercare with Karim.** | Aftercare card | A short conversation instead of "choose three of six": Karim asks three things ("Can she eat when we get home?", "It feels funny, she says — is that normal?", "What if it hurts tonight?"). Each answer is a choice of two or three lines drawn from the V1 six; Karim's face answers. | The three approved statements, one per question; the V1 distractors get the V1 feedback. |
| 5 | **Reception.** Walk them out and hand Sam the recall. | Recall slip | Kept: fill the slip (interval, type, note) and hand it over in one tap; Sam's line confirms. | V1 acceptable answer. |
| 6 | **The sharps.** Back in the surgery: the tray has the used instruments and you cannot see the needle. | The tray close-up | Kept (three options), triggered by touching the tray before the sharps are dealt with. | V1 acceptable answer. |
| 7 | **Sam's message.** "09:40 has been waiting 10 mins. How long?" | The message; the room | Kept (three options). The clock line starts counting when the message arrives. | V1 acceptable answer ("Five minutes — resetting now"). |
| 8 | **The turnaround.** Reset Surgery 2 for the 09:40. | The room; the reset routine card (readable, not shown as steps) | Real controls: PPE station (must be first thing touched), transport box (instruments into it, lid closed, box wiped with clean gloves before it leaves through the door), wipe path (same gesture as Task 1, between-patients order), flush (hold; the 20–30 second option), aspirator flush (hold), clinical waste and bib, fresh tray from the cupboard, check sheet initials. When the learner opens the door, Priya checks. | Every safety rule held: PPE before anything is touched; sharps dealt with before the tray moves; box wiped before it leaves; flush held; aspirator flushed; sheet initialled last. Priya's door check passes and the 09:40 comes through. |

### E. Decisions and feedback

| Decision or question | Status | Acceptable answer(s) | Common plausible mistake | Feedback after mistake |
|---|---|---|---|---|
| End-of-treatment care | Changed (controls and a hold instead of card order) | Held chair-up, glasses and bib off first, mouthwash offered | Quick chair-up; bib left on | "Slowly — she's been flat for forty minutes and she's ten." (**TBC**) |
| What do you say to Amira? | Kept | Specific praise (V1) | "See, that wasn't so bad" | V1 line |
| Which number is the batch? | Changed (drag instead of type/tick) | Batch numbers | Product code or expiry | V1 line |
| What goes into the notes from the dictation? | Kept | V1 | V1 | V1 lines |
| Karim's three questions | Changed (conversation instead of 3-of-6) | The three approved statements | The V1 distractors | V1 lines |
| Recall slip | Kept | V1 | V1 | V1 lines |
| The sharps | Kept | V1 | V1 | V1 lines |
| What do you tell Sam? | Kept | V1 | V1 | V1 lines |
| The reset | Changed (rules judged at the door instead of one order of ten cards) | See Step 8; **TBC** SME whether only the safety pairs are fixed or the full V1 order is mandatory (question K1) | Skipping the flush; box out unwiped; sheet before the flush | V1 door line: "Did the lines get their thirty seconds? Then we're not ready." Plus per rule: "The box doesn't leave until it's been wiped — clean gloves, then it goes." (**TBC**) |

### F. Completion criteria

| Done-when clause | Evidence saved by the experience | Can the learner revise it before sign-off? |
|---|---|---|
| Amira brought up slowly with bib and glasses off, and the praise line chosen | Hold duration, room state, choice | Yes |
| Three batch numbers stuck in the right fields and the dictation ticked as V1 | Notes state | Yes |
| Karim's three questions answered with the approved statements | Choices | Yes |
| Recall slip completed and handed to Sam | Slip state | Yes |
| The sharps question and Sam's message answered as V1 | Choices | Yes |
| Every reset rule held when the door was opened (PPE first, sharps first, box wiped before leaving, flush held, aspirator flushed, sheet initialled) | Rule log at the door check | Yes (Priya sends the learner back to the step) |

### G. Complication or change

As V1 (Sam's message, the clock, Priya's door check). Change: the clock is a visible line under the header clock, pauses under "at your pace", and is never used in judging.

### H. Dialogue — additions to V1

| Moment | Speaker | Line (all **TBC**) |
|---|---|---|
| Amira sits up | Amira | "Did I do it right? The hand thing?" |
| Karim, first question | Karim | "Can she eat when we get home?" |
| At the door, all rules held | Priya | "Box wiped, lines flushed, sheet done — with someone waiting. That's the job on a normal Tuesday. Go and get the 09:40." |
| At the door, a rule broken | Priya | "Stop. [rule line]. Late is uncomfortable. A shortcut is something else." |
| Scene debrief | Priya | "Notes right, dad knows what to do tonight, room turned round in six minutes without a shortcut. That's the whole appointment, not just the filling." |

### I. Media — additions

- Surgery 2 "after Amira" variant: used tray, bib, cup, transport box open; and the "reset" state. Placeholder.
- Amira "proud" still; Karim "relieved" still.
- Package labels exist (built); notes page with sticky fields (built, extended).
- Sounds: chair motor (slow), sticker peel, transport box lid, door.

### K. Questions for Tempdent

1. **Is the full ten-step reset order mandatory, or are the safety pairs the fixed part** (PPE before touching; sharps before the tray moves; box wiped before it leaves; flush before the sheet)? V2 judges the pairs and lets the learner choose the rest of the order. If the SME wants the full order, V2 judges the full order at the door instead.
2. Is 20–30 seconds the between-patients flush for the aspirator as well as the water lines, and should both be held separately?
3. Karim's three questions are invented to carry the three approved aftercare statements. SME to confirm they are the questions a parent asks.

---

## Task 5: The morning changes

### The mechanic: a plan you can see

Joanne's three changes arrive at once. Instead of ranking four cards and then choosing what to ask help with, the learner lays the morning out on a **plan board**: cards for the jobs (tell Priya and ask what Dr Reid needs; Surgery 2 ready for 10:40; move the box out of the corridor; check the delivery in; pouch the autoclave load within the hour) go into columns **Now / Next / Later / Ask**. Putting a card in "Ask" names who (Joanne, Sam, Priya). The board is judged once, and it stays visible in the notebook for the rest of the task with the cards ticking off as they are done, so the plan is a thing the learner follows, not an answer they gave.

### D. Learner steps

| Step | What the learner needs to do | Information they use | Interaction (V2) | Correct/acceptable outcome |
|---:|---|---|---|---|
| 1 | **Under the lamp.** Decide what happens to each of the six instruments. | Cycle card; lamp view (built) | The inspection bench with three zones instead of a tick list and a follow-up question: **Forward to autoclave / Back to cleaning / Set aside**. Look closer (magnify) is kept. On the dirty side, the broken-seal pouch from Task 1 sits in the drop-off box with Priya's line (S4). | Four forward; the probe with debris back; the bent tweezers set aside. (Merges V1's tick list and "and the other two?" question.) |
| 2 | **Load and start the autoclave.** | Cycle card; the autoclave | Drag the two trays into the chamber; overlapping trays get Priya's line and slide apart; tap the process indicator; press start; the display begins the cycle; write the log line (initials; date and time are stamped). | Trays spaced, indicator in, cycle running, log started. |
| 3 | **Joanne's board.** Priya has been called away; Joanne arrives with the changes. Plan the morning. | Joanne's briefing; day list; the corridor | The plan board. | Tell Priya in **Now**; Surgery 2 in **Now** or **Next**; move the box in **Next**; check the delivery in **Later**; autoclave load in **Later** (a reminder is set for the hour); at least one card in **Ask** with a name (box or checking-in, to Joanne or Sam). Wrong: Surgery 2 in Later; check-in before the surgery; nothing asked. |
| 4 | **Message Priya.** | Message thread | Kept (three messages) in the phone view. | V1 acceptable answer. |
| 5 | **Surgery 2 for Mr Nowak.** Build the exam tray and bring the drugs box within reach. | Exam tray guide; the surgery | Kept: the tray close-up (built). The drugs box is one tap in the room (it moves to the worktop by the chair). | Exam tray matches the guide; drugs box in reach. |
| 6 | **The delivery.** Move the box and flag what needs supervised storage. | Delivery note (close-up, new) | Drag the box from the corridor to the stock-room bench (not into the surgery). The delivery note lists five items; the learner flags the two that are not put away unsupervised (local anaesthetic cartridges, disinfectant concentrate). The flags go into the notebook. | Box in the stock room, corridor clear, two items flagged, nothing put away. (Replaces V1's three-option question.) |
| 7 | **Back in decon: the printout.** The cycle finished twenty minutes ago. | Autoclave printout (close-up, new); cycle card | Read the printout (cycle type, time at temperature, pressure, "cycle complete", end time) and decide: pouch and label now / leave it on the rack / run it again. | Pouch and label now (within the hour). V1 feedback for the other two. **TBC** SME whether an apprentice reads the printout or only checks the indicator (K2). |
| 8 | **Pouch, label, store.** | Labels close-up (built) | Write the expiry date and initials on the label (the date field offers three dates; V1 rule), place the pouches in the clean cabinet; the log line completes. | Labelled with the right expiry and initials; stored; log complete. |

### E. Decisions and feedback

| Decision or question | Status | Acceptable answer(s) | Common plausible mistake | Feedback after mistake |
|---|---|---|---|---|
| What happens to each instrument? | Merged (V1 tick + question) | Four forward, debris back, bent aside | Debris forward; bent forward | V1 lines |
| Loading the autoclave | Changed (drag instead of a three-option question) | Spaced trays, indicator, start, log | Overlapping trays; no indicator | V1 line; "Give them room — steam has to reach every surface." (**TBC**) |
| The plan board | Merged (V1 rank + ask-for-help) | As Step 3 | Surgery 2 in Later; nothing in Ask | V1 lines; "Nothing in Ask? You've got three jobs and one pair of hands. Sam will take the box." (**TBC**) |
| Which message to Priya? | Kept | V1 | V1 | V1 lines |
| Exam tray and drugs box | Kept | V1 | V1 | V1 lines |
| The delivery | Changed (drag and flag instead of a question) | Box to the stock room; LA and concentrate flagged | Box into the surgery; putting the LA away | V1 line |
| The load, twenty minutes after the cycle | Changed (read the printout first) | Pouch now | Leave it; run it again | V1 lines |
| Label and store | Kept (built) | V1 | V1 | V1 lines |

### F. Completion criteria

| Done-when clause | Evidence saved by the experience | Can the learner revise it before sign-off? |
|---|---|---|
| Six instruments sorted as V1 | Bench zones | Yes |
| Autoclave loaded with spaced trays and the log started | Chamber state, log | Yes |
| The plan board has Tell Priya in Now, Surgery 2 before the delivery, the load within the hour, and at least one card in Ask | Board state | Yes, until the first job is done |
| Message sent as V1 | Choice | Yes |
| Surgery 2 ready for 10:40 with the drugs box in reach | Tray and room state | Yes |
| Box in the stock room with the two items flagged | Box position, flags | Yes |
| Printout read and the load pouched, labelled and stored within the hour, log complete | Close-up opened, label state, log | Yes |

### G. Complication or change

As V1 (the whole task is the complication; the consequences if the surgery is not ready, the load is left, or the corridor stays blocked). Addition: the plan board's reminder for the load fires at the hour; if the learner is elsewhere, Priya's message: "Your load's at fifty minutes."

### H. Dialogue — additions to V1

| Moment | Speaker | Line (all **TBC**) |
|---|---|---|
| Dirty side, Task 1's pouch | Priya (note on the box) | "Your broken-seal set from this morning — goes through with the rest." |
| Board complete | Joanne | "Surgery first, box second, Sam's got the checking-in with you later. Good. Go." |
| Printout | Priya (card by the autoclave) | "Read the printout before you touch the load: cycle complete, time at temperature, and how long it's been sitting." |
| Scene debrief | Priya | "Three things at once, and you told me first, did the surgery, moved the box and came back for the load in time. That's prioritising. The only bit you should never do alone is the checking-in — and you didn't." |

### I. Media — additions

- Plan board (UI, no photography). Delivery note and autoclave printout as HTML documents (text is unreliable in generated images). Stock-room bench variant with the box on it.
- Autoclave display states (idle, running, complete). Placeholder.
- Sounds: autoclave door and cycle hum, printer, box slide.

### K. Questions for Tempdent

1. Are the plan board's columns and the "Ask" rule (at least one job delegated) consistent with how Tempdent wants proactivity framed — asking is right, not a weakness?
2. Would an apprentice read the autoclave printout, or only the process indicator and the log? What does the printout show in the practices Tempdent works with?
3. Which two delivery items should be flagged for supervised storage (V1 says local anaesthetic and concentrate)?

---
## Task 6: Graham's first visit in ten years — and closing the day

### The mechanic: a person who reacts, and a handover from your own notebook

Graham uses the same state mechanic as Amira: **braced** (coat on, on the edge of the chair, arms folded), **wary** and **steadier**. Where the learner stands is a decision (a position on the photograph), not only what they say. When his breathing changes during the exam, the **Speak up** control from Task 3 is on screen again, so the habit transfers. The day ends with the handover: the learner's notebook (its "Noticed" entries from the whole day and tomorrow's day list) is on the left, the handover sheet on the right, and the learner drags across what the next nurse needs. What goes in the handover is decided by what the learner noticed today.

### D. Learner steps

| Step | What the learner needs to do | Information they use | Interaction (V2) | Correct/acceptable outcome |
|---:|---|---|---|---|
| 1 | **Look first.** Graham in the waiting room, coat on, on the edge of the chair. | Patient card ("nurse to collect", "wants to talk first") | Twenty seconds before anything is asked (S6). | |
| 2 | **Approach.** Where do you go, and what do you say? | Communication guide: anxious adults | Tap a position on the photograph: the chair beside him / standing in front of him / the door. Then one of four opening lines (V1). Graham reacts to both: being called from the door keeps him braced; sitting beside him and the V1 line move him to wary. | V1 acceptable answer. |
| 3 | **In the surgery: what you offer.** | Guide; "the examination in plain words" card | Three moments instead of "choose three of six": Graham says "Do I have to lie back?" (offer: chair upright to start / "you'll be fine lying back"); he goes quiet (offer: agree the stop signal / "it's been a long time!"); he says "I don't even know what she's going to do" (offer: explain the exam in plain words / "you'll probably only need a couple of fillings" / "you've nothing to worry about"). Graham's state answers each. | The three V1 offers; the minimisers and the clinical guess get the V1 feedback. Graham wary → steadier. |
| 4 | **"Tell me how bad it is."** | Guide | Kept (four options). | V1 acceptable answer. |
| 5 | **"I need a minute outside."** Graham stands. | Guide | Kept (three options) but the room shows it: he leaves, the door stays open, the header clock advances three minutes, he comes back. Following him or persuading him gets Priya's V1 line. | V1 acceptable answer. The notebook records "Noticed 16:41: Graham needed a minute outside; came back." |
| 6 | **During the exam.** His grip tightens and his breathing quickens. | Graham's hands and chest | **Speak up** (as Task 3) before Dr Reid notices, then one line to Graham (three options: breathe with me / "nearly done, just relax" / say nothing). Dr Reid pauses. | Speak up pressed; the calm line. V1 consequences if missed. |
| 7 | **Notes and booking.** | Dictation; note options (a)/(b)/(c); booking slip | Kept, on one notes close-up: choose the note, fill the slip (40 minutes, hygiene and treatment plan, nurse to collect), hand it to Sam. | V1 acceptable answer: (b); slip complete. |
| 8 | **Close the surgery.** | Close-down card (readable); the room | Real controls, as Task 4's reset, with the end-of-session differences: aspirator gets **disinfectant** (a choice at the aspirator: water / disinfectant), lines flushed, wipe path, bins, chair down and light off, computer logged off, lights. Judged at the door. | All end-of-session rules held; aspirator disinfectant (V1 decision kept, in the world). |
| 9 | **Handover.** Write it from your notebook. | Notebook "Noticed" entries; tomorrow's day list; handover template (What's ready / What's outstanding / What to watch) | Drag entries from the notebook onto the three sections of the handover sheet. The notebook holds what the learner noticed today (glucagon reported; broken-seal pouch; Amira's signal; delivery items flagged; Graham's minute; Graham's next-visit needs) plus tomorrow's list, and two entries that do not belong in a handover ("Sam very busy on reception", "Amira cried when the light came on"). | Handover names: tomorrow's first patient and tray (ready); glucagon replacement status and the delivery checked in (outstanding); Graham's next-visit needs and the 10:20 child's first visit (watch). The two entries that do not belong stay out. If the learner's notebook lacks the glucagon (they never reported it), the handover cannot name it and Priya's debrief says so. |

### E. Decisions and feedback

| Decision or question | Status | Acceptable answer(s) | Common plausible mistake | Feedback after mistake |
|---|---|---|---|---|
| Where do you go, and what do you say? | Changed (position plus line) | Beside him; V1 line | The door; the V1 mistakes | V1 line |
| What you offer, across three moments | Changed (conversation instead of 3-of-6) | Chair upright; stop signal; exam in plain words | Minimisers; the clinical guess | V1 line, split across the three moments |
| "Tell me how bad it is" | Kept | V1 | V1 | V1 line |
| "I need a minute" | Kept | V1 | V1 | V1 line |
| Breathing changes during the exam | Changed (Speak up plus a line) | Speak up; breathe with me | "Just relax"; carry on | V1 line |
| Which note do you write? | Kept | (b) | (a), (c) | V1 line |
| The aspirator at the end of the session | Kept (in the world) | Disinfectant | Water | V1 line |
| What goes in the handover? | Changed (drag from the notebook) | The four V1 items, plus the 10:20 first-visit child | "All fine"; the two entries that do not belong | V1 line; for the two that do not belong: "Would the next nurse do anything with that? Then it isn't handover — and one of those isn't yours to pass on." (**TBC**) |

### F. Completion criteria

| Done-when clause | Evidence saved by the experience | Can the learner revise it before sign-off? |
|---|---|---|
| Graham approached beside him, by name, with the V1 opening line | Position and line | Yes |
| The three offers made across the three moments | Choices | Yes |
| "How bad is it" and "I need a minute" answered as V1 | Choices | Yes |
| The learner spoke up when Graham's breathing changed, or answered Dr Reid's step-in correctly | Speak up timestamp | Yes (the scene can be replayed) |
| Note (b) on the record and the slip complete | Notes state | Yes |
| Close-down rules held at the door, aspirator on disinfectant | Rule log | Yes |
| The handover names what is ready, what is outstanding and what to watch, from the learner's own notebook, with nothing that does not belong | Handover sheet | Yes |

### G. Complication or change

As V1 (Graham's minute outside, after "how bad is it"). In V2 he stands and leaves before any prompt appears; the choice is what the learner does while he is gone.

### H. Dialogue — additions to V1

| Moment | Speaker | Line (all **TBC**) |
|---|---|---|
| Waiting room, before the approach | Priya (quietly, from the corridor) | "He asked to be collected. Think about where you stand before you think about what you say." |
| "Do I have to lie back?" | Graham | "Do I have to lie back? I don't like lying back." |
| Graham returns | Graham | "Sorry about that." |
| If the learner thanks him | Learner (chosen line) | "Thank you for coming back in. Where do you want to start?" |
| Handover, glucagon missing from the notebook | Priya | "Nothing about the glucagon? You found it this morning — and it isn't in the book, so it isn't in the handover, so tomorrow's nurse doesn't know. That's how things get lost. Write down what you notice." |
| Scene debrief | Priya | "He said nobody had ever asked him where he wanted to sit. You did. And the handover's the one thing you'll do today that tomorrow's team will actually read." |

### I. Media — additions

- Graham: three stills in the waiting room (braced, wary, steadier) and three in the chair; standing at the door. Placeholder AI stills; consistent character.
- Handover screen (UI). Notebook "Noticed" entries (UI).
- Sounds: door, coat, chair, computer log-off.

### K. Questions for Tempdent

1. Is "where you stand" a fair thing to assess for an anxious adult (beside, not in front, not from the door), and is that what the SME coaches?
2. The two handover entries that do not belong ("Sam very busy", "Amira cried") are there to teach what a handover is not. Are they fair, and is naming a child's distress in a note the right example of what not to pass on?
3. Should the learner's own free-text notebook notes be shown in the handover drag list (unassessed), so a learner who wrote "check glucagon order" can use it?

---

## Welcome and close-of-day screens

- **Welcome (Section 8):** unchanged, with two additions to "What should learners know before starting?": "Some moments run at Dr Reid's pace. If you'd rather everything waited for you, turn on *At your pace* — nothing is marked differently." and "Your notebook keeps what you notice through the day. You'll need it at the end."
- **Close of day (Section 9):** unchanged reflection journey (Tempdent's seven steps and the patient-centred reflection). One addition, taken from V1's "ideas to explore": the notebook's "Noticed" list is shown before the reflection as **"What you noticed today"** (the learner's own entries, unscored), which gives the reflection questions something concrete to sit on.

---
## Part 3 — What building V2 involves

### 3.1 Change log against V1: what needs whose sign-off

| Change | Type | Who signs off |
|---|---|---|
| S1 The room answers first; six debriefs; "Why did that work?" link | Presentation only (every V1 feedback line is kept and still reachable) | Springpod learning design |
| S2 Gesture routines (wipe path, tray sweep, holds) | Presentation only (same answers, same judging) | Springpod |
| S3 Notebook auto-entries | Presentation plus new copy (entry wording) | Springpod; SME to confirm nothing recorded is inappropriate |
| S4 Consequences (tray → Task 3; pouch → Task 5; notebook → handover) | New content (three Priya lines) | SME for the lines; Springpod for the mechanic |
| S5 Two tempos and "at your pace" | Presentation; accessibility decision | Springpod; Tempdent to confirm for the 14–18 audience |
| S6 Look before you act | Presentation plus new scene states | Springpod |
| T1 mirror check, walk-in faults | **New content** (faults, feedback) | SME |
| T1 fresh-hands rule, initials, pouch drop zone | Presentation (V1 questions become world rules) | Springpod |
| T2 Amira and Karim states; chair rules | Presentation plus two new Priya lines | Springpod; SME for the lines |
| T3 paced segment, Speak up, pass gesture | Presentation of V1 decisions; **the order of passes needs the SME's word** | SME (order and stage of apprentice); Tempdent (pace) |
| T4 chair-up hold, peel-and-stick labels | Presentation | Springpod |
| T4 Karim's three questions | **New content** (questions; the answers are V1's) | SME |
| T4 reset judged by safety rules at the door | **Judging change** if only the pairs are fixed | SME (question T4-K1) |
| T5 bench zones, autoclave load, plan board, delivery flags | Presentation of V1 decisions | Springpod |
| T5 autoclave printout | **New material** | SME |
| T6 position as a decision; three offer moments; Speak up | Presentation | Springpod; SME for the three Graham lines |
| T6 handover from the notebook, two non-handover entries | **New content** | SME |

### 3.2 Media and assets to produce (all placeholders until Tempdent photography and talent)

| Asset | Count | Route |
|---|---|---|
| Room state variants (Surgery 2 as left last night; after Amira; reset; stock room with box) | 4 photographs + about 12 overlays | Generated from the existing placeholder set for consistency; masks for the clean/dirty surfaces |
| People states: Amira (7), Karim (4), Graham (7), Dr Reid's hands (4), background patients (2) | 24 stills | Generated, one character sheet each, then approved via the media manifest as today |
| Mirror close-up variants | 4 | Generated |
| Field close-up with three water states | 3 | Illustrated; SME to approve |
| Documents (delivery note, autoclave printout, handover, plan board, notes fields) | 5 | HTML, not images |
| Sounds (taps, water, wipe, chair, autoclave, door, handpiece, curing light, cues) | about 20 | Generated; captions for every cue |
| Dr Reid cue lines and the six debriefs | 6 cues + 6 debriefs + about 25 new lines | Captions now; synthetic placeholder voice optional; talent later |
| Films | none new | Briefing films remain as V1 (TBC) |

### 3.3 Engine work and phasing

The existing engine has choice/speech, checklist, sequence, hotspot, tray and paper close-ups, the notebook, the guide bar and the media manifest. V2 adds nine interaction patterns. Estimated effort is for the engine plus the first task that uses each pattern; reuse in a second task is small.

| Pattern | Used in | Size |
|---|---|---|
| Find (a set of faults on a photograph, counter, fix overlays) | T1 | M |
| Path (one drag across ordered zones, judged once) | T1 wipe, T4 reset wipe, T6 close-down | M |
| Hold (press and hold with a compressed clock and a poster/timer) | T1 handwash and flush, T4 chair-up and flushes, T6 | S |
| Room controls with door-check rules | T2 settle, T4 reset, T6 close-down | L |
| People states (per-option reactions authored in content; stills; screen-reader text) | T2, T4, T6 | M |
| Paced segment (cue timeline, tells, pass gesture, Speak up, at-your-pace, replay) | T3, T6 (Speak up only) | L |
| Peel-and-stick / flag / bench zones (drag to fields and zones) | T4 labels, T5 delivery, T5 bench | S–M |
| Plan board (columns, named Ask, reminder) | T5 | M |
| Notebook auto-entries, consequences store, handover drag | all, T6 | M |

Suggested order, each phase playable and testable on its own:

1. **Phase A — the day feels different (about a week):** S1 (silent right answers, debriefs, "Why did that work?"), S3 notebook entries, S6 opening looks, Hold and Path patterns, T1 rebuilt end to end. Cuts about 40 taps and shows the new register.
2. **Phase B — the signature moment (about a week):** the T3 paced segment with Speak up and at-your-pace; the field close-up; consequences store (tray → T3).
3. **Phase C — people who react (about a week):** people states; T2 and T6 conversations; the room controls for T2's settling.
4. **Phase D — clock, board and handover (about a week):** T4 turnaround with door-check rules; T5 bench, board, delivery and printout; T6 close-down and the notebook handover; remaining consequences.
5. **Phase E — media approval and browser specs:** all new stills through the approval manifest; specs for each new pattern at 390×480, 800×480 and desktop; audio and caption pass.

Estimates assume the SME questions below are answered before the phase that needs them (T3's order and stage before Phase B; T4's reset rule before Phase D).

### 3.4 Sign-off list

**Springpod learning design (this document):**

1. The six shared changes (1.2) and the rule that scenes present, content judges (1.3).
2. Per task: Sections D–F as written, and the debrief lines as placeholders pending the SME.
3. The phasing in 3.3, with Phase A starting on sign-off.

**Tempdent SME (Lisa Quinlivan-Fox, TBC) — questions that change what is built:**

| # | Question | Task | Needed before |
|---|---|---|---|
| Q1 | Order of passes in a simple composite filling (etch, bond, band, composite, light, articulating paper) and whether a week-three apprentice passes or shadows | T3 | Phase B |
| Q2 | Is the full ten-step between-patients order mandatory, or are the safety pairs the fixed part? | T4 | Phase D |
| Q3 | The three walk-in faults and the three presentation faults: realistic and acceptable to show? | T1 | Phase A |
| Q4 | Karim's three aftercare questions and Graham's three opening lines | T4, T6 | Phase C/D |
| Q5 | Does an apprentice read the autoclave printout; what does it show? | T5 | Phase D |
| Q6 | Handover: the four items plus the 10:20 first-visit child; and the two entries that do not belong | T6 | Phase D |
| Q7 | Showing a child's tears and an adult leaving the room in stills | T2, T6 | Phase C |

**Tempdent (programme):**

- Paced and clock segments for the 14–18 audience, with "at your pace" as described.
- Dr Reid's debrief naming how often she looked up (or not).
- The notebook's "What you noticed today" list on the close-of-day screen.

### 3.5 Approval status

| Item | Status |
|---|---|
| V1 content (facts, people, decisions, feedback, criteria) | Signed off 22 September 2026 |
| V2 interaction design (this document) | Draft for sign-off, 23 September 2026 |
| New copy marked **TBC** in Sections H | Awaiting SME |
| Build | Phases A–E built 23 September 2026 against this draft; SME questions Q1–Q7 open, TBC copy flagged `// TBC SME` in content, all new pictures and sounds AI placeholders (see `docs/media-log.md`, `docs/V2-BUILD.md`) |
