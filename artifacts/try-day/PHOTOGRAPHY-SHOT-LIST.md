# art’otel Sous Chef Try Day — Photography Shot List

## Purpose

This document lists the photography needed to replace the generated imagery in the art’otel Sous Chef Try Day with real, brand-appropriate photography. The first photographs have now arrived; the [delivery status](#delivery-status-19-september-2026) below records what is in use and what is still outstanding.

The images should feel cultured, confident and contemporary while remaining clear enough to support the learning activities. All operational practices shown in the photographs must be accurate.

## Delivery status (19 September 2026)

Five photographs from the art’otel Hoxton kitchen were received on 19 September 2026 and are in the app. Each is exported as WebP into `src/assets/kitchen/photos/`; the crops are recorded in `src/content/kitchen-photos.json` and `scripts/prepare-kitchen-photos.mjs` regenerates the exports from the archive in `attached_assets/`. The uncropped originals stay out of `src/`.

| Received photograph | What it shows | Where it is used |
|---|---|---|
| `portrait.JPG` | Terence, head and shoulders, in the restaurant | Dialogue avatar and the briefing-screen mentor circle (`terence-square.webp`, `terence-briefing.webp`, `terence-briefing-2x.webp`) |
| `MP_02868.JPG` | Wide view down the kitchen line, Terence cooking at the far range | Welcome hero, 16:9 on larger screens and a 3:4 crop on phones (`kitchen-line.webp`, `kitchen-line-phone.webp`) |
| `MP_03055.JPG` | Terence plating at the pass under the heat lamps | The pass backdrop (`pass.webp`) |
| `MP_03045.JPG` | Terence opening a fridge drawer of raw meat trays | The fridges backdrop (`fridges.webp`); both fridge readouts are blurred so the photograph cannot be read as temperature evidence |
| `MP_02917.JPG` | Terence cooking at the induction hob, close angle | The prep bench backdrop (`bench.webp`) |

The generated pictures these replaced (the pass, corridor and bench scenes and the character portraits) have been removed from the repository.

Still outstanding:

- **Goods-in area** (essential): the back door still uses the illustrated backdrop `src/assets/kitchen/scene-goods-in.jpg`.
- **Events kitchen** (essential): still uses the illustrated backdrop `src/assets/kitchen/scene-events.jpg`.
- The rest of Terence’s working set, Yvie, the supporting characters, the event-space coverage, the delivery ingredients, the contextual details and the briefing films. Yvie, the night porter, the driver and the evening team currently appear with a generic icon in dialogue.

The fridge and freezer inspections (section 4) were supplied separately as short video clips rather than photographs; see the note in that section.

## General production requirements

- Capture high-resolution master files that support desktop, tablet and mobile crops.
- Leave clear negative space for interface copy and controls.
- Keep important people and objects away from the outer edges.
- Avoid visible supplier or product branding unless it has been approved.
- Make sure food handling, storage, uniforms and kitchen practices are correct.
- Use consistent lighting and colour treatment across each related image set.
- Obtain the necessary model, location and usage releases.
- Retain uncropped master files alongside the final exports.

---

## 1. Main locations — essential

These photographs provide the full-screen backgrounds used throughout the experience.

| Photograph | Content | Required crops | Status |
|---|---|---|---|
| Kitchen pass hero | A strong view across the pass in an art’otel kitchen, with room for welcome copy and a chef portrait | 16:9 landscape, square and mobile portrait | Received: `MP_03055.JPG` is the pass backdrop; `MP_02868.JPG` (the kitchen line) is the welcome hero in landscape and phone crops |
| Kitchen corridor and fridges | Back corridor showing the fridge row, walk-in entrance and temperature-recording area | Landscape and square | Received: `MP_03045.JPG`, landscape only, fridge readouts blurred |
| Goods-in area | Delivery entrance with trolleys, checking bench and scales | Landscape and square | Outstanding: illustrated backdrop still in use |
| Preparation bench | Stainless-steel bench beside the blast chiller, staged with shallow food trays | Landscape and square | Received: `MP_02917.JPG`, landscape only |
| Events kitchen | Events preparation area with a visible position for the evening or allergen board | Landscape, square and portrait-safe | Outstanding: illustrated backdrop still in use |

### Composition notes

- Each photograph should include a clear area for interface overlays.
- Avoid putting critical visual information directly behind likely text positions.
- Capture wider than the intended crop so the image can adapt to different screens.
- Do not rely on writing inside a photograph to communicate required learning information.

---

## 2. Staff photography — essential

For every featured staff member, capture:

- A square head-and-shoulders portrait
- A vertical three-quarter or full-length portrait
- Natural working photographs in the relevant location
- Clean separation from the background where possible

### Terence — highest priority

Terence is the executive sous chef at art’otel Hoxton, the learner’s guide and
the essential featured chef. He appears throughout the experience and should be
photographed in the real kitchen and product-launch event space.

Required:

- Friendly square portrait (received: `portrait.JPG`)
- In the product-launch event space
- Three-quarter standing portrait in chef’s uniform
- At the kitchen pass (received: `MP_03055.JPG`)
- Inspecting a fridge (received: `MP_03045.JPG`, opening a fridge drawer)
- Checking a delivery
- Working at the preparation bench (received: `MP_02917.JPG`, cooking at the induction hob)
- Reviewing kitchen paperwork, with space for the learner’s implied position

The four photographs marked received, plus the kitchen-line hero `MP_02868.JPG`, make up the delivery of 19 September 2026. The other items are outstanding.

### Yvie — optional

Yvie looks after events and brings the client’s request list and final guest list.
Her photography is useful but not essential.

Required:

- Square portrait
- Three-quarter standing portrait
- At the pass holding the function sheet
- Reviewing an allergen chart or events board

Terence should also be captured reviewing the chill record and handing over to
the evening team; these are part of his working set above.

---

## 3. Event-space coverage — essential

The product launch is for 100 guests. Capture the event area and the kitchen
spaces that support it, with wide compositions that leave room for interface copy:

- Event area / product-launch space
- Kitchen pass heroes (wide capture)
- Kitchen corridor and fridges (wide capture)
- Goods-in area (wide capture)
- Preparation bench (wide capture)
- Events kitchen (wide capture)

Capture both an empty, clean setup and a lightly populated service-ready setup
where permitted. Do not show identifiable guest information or unapproved brands.

Status: the wide captures of the pass, the fridges and the bench were received on
19 September 2026 (see the delivery status above). The event area, goods-in area
and events kitchen are outstanding.

---

## 4. Fridge and freezer inspections — essential

These photographs serve as interactive evidence. Each unit therefore needs its own clear image.

Status: this set was supplied as 14 short video clips (a door-opening and an
interior clip for each of the seven units) rather than as photographs, and was
approved for learner use as simulation illustrations on 18 September 2026. The
clips and the approval record live in `src/assets/kitchen/inspections/`. Still
photographs are not needed for this section unless the clips are replaced.

1. Closed fridge door
2. Walk-in fridge interior
3. Larder fridge 1
4. Larder fridge 2
5. Fish fridge
6. Dairy fridge
7. Freezer 1
8. Freezer 2

### Requirements for each unit

- Square 1:1 composition
- Consistent camera height and angle
- Full, unobstructed view of the relevant interior
- Realistic stock levels
- Correct separation and storage of food
- Relevant labels and surfaces visible
- Clear areas for interactive markers
- No unapproved product branding

For **Larder fridge 2**, also capture an open-door or door-seal detail that supports the overnight “door found ajar” scenario. The food should not look visibly spoiled; the recorded temperature is the evidence.

---

## 5. Delivery ingredients — recommended

These images appear as smaller evidence cards in the goods-in activity.

1. Salmon or fish delivery box
2. Sea bass
3. Smoked haddock
4. Chicken
5. Cream
6. Butter
7. Spinach
8. Shallots
9. Lemons
10. Parsley

### Recommended setup

- Square 1:1 composition
- Product shown in its delivery crate or container
- Neutral, consistent background
- Clear view of quality and condition
- Matching camera angle and lighting across the series
- No supplier branding unless approved

The full ingredient set can be completed in one controlled tabletop session.

Status: outstanding. The goods-in activity currently shows the illustrated crate
pictures under `src/assets/kitchen/`. A set of sourced stock photographs
(credited in the `sources.json` files under `src/assets/delivery-photos/`) is
held for the goods-in redesign, which is not wired into the app yet.

---

## 6. Contextual detail shots — recommended

Capture these while the locations and staff are already available:

- Open fridge interior
- Open freezer interior
- Walk-in shelving
- Fish box close-up
- Probe thermometer in use
- Temperature being recorded
- Food trays entering the blast chiller
- Delivery trolley at the back door
- Chef checking a delivery note
- Function sheet at the pass
- Kitchen and events staff discussing allergens
- Evening team arriving for handover
- Waste being weighed
- Completed chill record being reviewed

These photographs can support future screens, responsive crops, promotional materials and supporting content.

---

## 7. Supporting characters — optional

Status: outstanding. The night porter, the driver and the evening team speak
with a generic person icon in the dialogue bar; the earlier generated portraits
have been removed and the app switches to a photograph as soon as one is set
on the person entry in `src/content/kitchen.ts`.

### Night porter

- Square portrait
- Three-quarter portrait
- At the pass or near the fridge corridor
- Early-morning or overnight visual treatment

### Delivery driver

- Square portrait
- Three-quarter portrait
- With a trolley or delivery vehicle at goods-in

### Evening team

- Small group arriving in chef whites
- Listening to the kitchen handover
- Working in the background during the closing scene

---

## 8. Items that should remain designed graphics

The following elements communicate navigation, data or learner actions and should not be replaced with photography:

- art’otel logo and favicon
- Interactive kitchen map
- Temperature forms and kitchen records
- Allergen chart
- Function sheet
- Handover and waste forms
- Hotspot markers
- Gauges and signature controls
- Interface icons
- Progress indicators

Real photography may provide context around these elements, but the functional information should remain part of the interface.

---

## 9. Filming deliverables — essential

Status: outstanding. No briefing films have been received; the briefing screen
uses Terence’s photograph from `portrait.JPG` in the meantime.

Record seven separate clips for the learner briefing stages:

1. Main briefing — approximately 50 seconds
2. Task 1: handover and fridges — approximately 20 seconds
3. Task 2: delivery — approximately 25 seconds
4. Task 3: chill the batch — approximately 25 seconds
5. Task 4: dietary list — approximately 25 seconds
6. Task 5: waste and handover — approximately 25 seconds
7. Close — approximately 35 seconds

### Video production requirements

- 16:9 landscape, 1920 × 1080 minimum
- H.264 MP4 masters, with web-ready exports supplied separately if needed
- Clean spoken audio, recorded as a discrete microphone track where possible
- No background music, added sound effects or distracting kitchen noise
- Consistent eyeline, framing, lighting and wardrobe across all seven clips
- At least 3 seconds of clean handles before and after each performance
- A verbatim caption file (WebVTT preferred) and a plain-text transcript
- Canonical names and roles: **Terence**, executive sous chef; **Yvie**, events
- The art’otel Hoxton kitchen and event space where practical
- A slate or filename clearly identifying each briefing stage

Suggested filenames:

```text
01-terence-briefing.mp4
02-terence-handover-fridges.mp4
03-terence-delivery.mp4
04-terence-chill-batch.mp4
05-terence-dietary-list.mp4
06-terence-waste-handover.mp4
07-terence-close.mp4
```

## 10. Recommended shoot totals

### Minimum viable shoot

- 5 location masters
- 1 essential Terence staff portrait set
- 1 optional Yvie staff portrait set
- 8 fridge and freezer inspection images
- 10 ingredient images

**Approximately 26 core setups**, with multiple crops and variations captured from each.

### Full shoot

Add:

- 2 supporting-character portrait sets
- Evening-team group photography
- 10–15 contextual detail shots
- Additional working variations of Terence and, if available, Yvie

**Approximately 40–45 final photographs.**

---

## Suggested delivery structure

```text
photography/
├── 01-locations/
├── 02-terence/
├── 03-yvie/
├── 04-event-space/
├── 05-supporting-characters/
├── 06-fridge-inspections/
├── 07-delivery-ingredients/
├── 08-contextual-details/
├── 09-video/
├── masters/
└── releases/
```

For each selected photograph, supply:

- Original high-resolution master
- 16:9 landscape export where required
- Square 1:1 export where required
- Mobile portrait export where required
- Web-ready JPG or WebP version
- Short descriptive filename
- Alt-text suggestion
