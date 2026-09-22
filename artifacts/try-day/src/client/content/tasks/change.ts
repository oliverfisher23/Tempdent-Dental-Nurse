import type { TaskContent } from './types';
import trayCardPicture from '@client/assets/closeups/tray-card.jpg';
import aspiratorImage from '@client/assets/items/aspirator.png';
import bibImage from '@client/assets/items/bib.png';
import excavatorImage from '@client/assets/items/excavator.png';
import mirrorImage from '@client/assets/items/mirror.png';
import plasticImage from '@client/assets/items/plastic.png';
import probeImage from '@client/assets/items/probe.png';
import rollsImage from '@client/assets/items/rolls.png';
import syringeImage from '@client/assets/items/syringe.png';
import threeInOneImage from '@client/assets/items/three-in-one.png';
import tweezersBentImage from '@client/assets/items/tweezers-bent.png';
import tweezersImage from '@client/assets/items/tweezers.png';

// Storyboard Task 5. Clinical detail is draft, pending SME validation.
export const CHANGE_TASK: TaskContent = {
  id: 'change',
  dialogue: {
    speaker: 'Joanne',
    text: "Sorry, three things. 10:20's cancelled. Mr Nowak's coming at 10:40 in a lot of pain, Dr Reid wants Surgery 2 with an exam tray and the drugs box in reach. And there's a delivery in the corridor that Sam's about to fall over. What are you doing first, and what do you need from me?",
  },
  signOff: {
    speaker: 'Joanne',
    text: "Room's ready, corridor's clear, and you told Priya before you started. That's all I needed. Delivery's on the bench for you two after Mr Nowak.",
  },
  scenes: [
    {
      place: 'decon',
      people: ['manager'],
      eyebrow: 'Decontamination room',
      title: 'The morning changes',
      intro: "Amira's instruments have been scrubbed and rinsed, and you are at the inspection lamp. Priya has been called next door to Surgery 1; she stays in touch by message and will check your load before it is stored. The cycle card on the wall: PPE and heavy-duty gloves, scrub under the waterline below 45°C, rinse, inspect, autoclave spaced on trays with indicators, cool covered, pouch dry within an hour, label with expiry and initials, store.",
      decisions: [
        {
          id: 'inspect',
          kind: 'checklist',
          prompt: 'Six instruments are under the lamp. Tick the ones that go forward to the autoclave.',
          context: 'Under magnification: four are clean and undamaged, one probe has debris in the hinge, one pair of tweezers has a bent tip.',
          options: [
            { id: 'mirror', label: 'Mouth mirror: clean' },
            { id: 'probe_debris', label: 'Probe: debris in the hinge' },
            { id: 'tweezers_ok', label: 'Tweezers: clean' },
            { id: 'excavator', label: 'Excavator: clean' },
            { id: 'tweezers_bent', label: 'Tweezers: bent tip' },
            { id: 'plastic', label: 'Flat plastic: clean' },
          ],
          correct: ['mirror', 'tweezers_ok', 'excavator', 'plastic'],
          clause: 'Four clean, undamaged instruments go forward to the autoclave',
          feedback: {
            speaker: 'Priya',
            right: 'Four forward. Only clean and undamaged goes in the autoclave.',
            wrong: "Sterilising doesn't clean, and it doesn't mend. Look at each one again and ask whether steam can reach every surface, and whether it will do its job on a patient.",
          },
          present: {
            kind: 'bench',
            title: 'Under the lamp',
            open: 'Inspect the instruments',
            items: {
              mirror: { image: mirrorImage, finding: 'Clean, bright, no residue' },
              probe_debris: { image: probeImage, finding: 'Debris packed in the hinge' },
              tweezers_ok: { image: tweezersImage, finding: 'Clean, tips meet, no marks' },
              excavator: { image: excavatorImage, finding: 'Clean; edge intact' },
              tweezers_bent: { image: tweezersBentImage, finding: 'One tip bent; tips do not meet' },
              plastic: { image: plasticImage, finding: 'Clean, no residue' },
            },
          },
        },
        {
          id: 'others',
          kind: 'choice',
          prompt: 'And the other two: the probe with debris in the hinge, and the tweezers with the bent tip?',
          after: 'inspect',
          options: [
            { id: 'sort', label: 'Probe back through cleaning; bent tweezers set aside as damaged and reported' },
            { id: 'both_forward', label: 'Both forward. The autoclave will deal with them' },
            { id: 'both_aside', label: 'Both set aside as damaged' },
            { id: 'swap', label: 'Probe set aside as damaged; bent tweezers back through cleaning' },
          ],
          correct: 'sort',
          clause: 'Debris goes back to cleaning and the damaged instrument is set aside',
          feedback: {
            speaker: 'Priya',
            right: "Right. If there's debris on it, steam can't reach what's underneath, so it isn't sterile whatever the indicator says. And a bent tip doesn't get better in the autoclave.",
            wrong: "Separate the two problems. One of them can be fixed by doing a step again; the other can't be fixed here at all. Sort them by that.",
          },
          present: { kind: 'speech' },
        },
        {
          id: 'autoclave',
          kind: 'choice',
          prompt: 'Load the autoclave and start the cycle. How?',
          after: 'inspect',
          options: [
            { id: 'spaced', label: 'Trays spaced apart, process indicator in, start the cycle, and write the log line now: date, time, cycle number, initials' },
            { id: 'tight', label: 'Pack the trays tightly so everything fits one cycle, start it, and log it later' },
            { id: 'log_later', label: 'Start the cycle now and fill in the log when the load comes out' },
          ],
          correct: 'spaced',
          clause: 'Autoclave started with spaced trays and the log begun',
          feedback: {
            speaker: 'Priya',
            right: 'Spaced so the steam reaches everything, indicator in, and the log started while you remember. Twenty minutes on the clock.',
            wrong: "Space between the trays or the steam can't reach every surface, and the log is written when you start, not when you remember. The log is the proof the cycle happened.",
          },
          present: { kind: 'speech' },
          revealsComplication: true,
        },
        {
          id: 'rank',
          kind: 'sequence',
          prompt: 'Answer Joanne. Tap the four jobs in the order you will do them.',
          context: 'The updated day list: 10:20 struck through. 10:40 Mr N, EMERGENCY, pain, exam, Dr Reid.',
          after: 'autoclave',
          options: [
            { id: 'corridor', label: 'Move the delivery out of the corridor to the stock room, unopened' },
            { id: 'surgery', label: 'Set up Surgery 2 for 10:40' },
            { id: 'checkin', label: 'Check the delivery in properly' },
            { id: 'priya', label: 'Tell Priya and ask what Dr Reid needs' },
          ],
          correct: ['priya', 'surgery', 'corridor', 'checkin'],
          clause: 'The four jobs ranked: tell Priya, surgery, corridor, then check the delivery in',
          feedback: {
            speaker: 'Priya',
            right: "Patient in pain, surgery ready, safety. And you told me first. The box can wait; blocking the corridor can't.",
            wrong: "Patient in pain, surgery ready, safety, that's the order. But before you set anything up for an emergency, thirty seconds to tell me and ask what Dr Reid wants saves you ten minutes doing the wrong thing. The box can wait. Blocking the corridor can't. Go again.",
          },
          present: {
            kind: 'order',
            title: 'Your morning',
            open: 'Put the jobs in order',
            slotsLabel: 'Do first to last',
          },
        },
        {
          id: 'help',
          kind: 'choice',
          prompt: 'Joanne asked what you need from her. What do you ask for help with?',
          after: 'rank',
          options: [
            { id: 'box', label: 'The delivery: could she or Sam get it out of the corridor while you set up Surgery 2' },
            { id: 'surgery', label: 'Surgery 2: could she set it up while you deal with the box' },
            { id: 'nothing', label: 'Nothing. You can do all four yourself' },
          ],
          correct: 'box',
          clause: 'One request for help made, for the job someone else can safely do',
          feedback: {
            speaker: 'Priya',
            right: 'Anyone can move a box. Only the nurse sets up the surgery. Good call.',
            wrong: "Ask for help with the job anyone can do, not the one that's yours. The surgery set-up is the nurse's; the box isn't. And doing all four yourself is how the corridor stays blocked.",
          },
          present: { kind: 'speech' },
        },
        {
          id: 'message',
          kind: 'choice',
          prompt: 'Message Priya before you start. Which message do you send?',
          after: 'help',
          options: [
            { id: 'guess', label: '"Emergency at 10:40, sounds like an extraction. Setting Surgery 2 up with forceps and the anaesthetic so Dr Reid is ready."' },
            { id: 'short', label: '"Emergency 10:40, Dr Reid wants Surgery 2 with an exam tray and the drugs box in reach. Doing that now. Anything else she wants for him?"' },
            { id: 'none', label: 'No message. She is busy and will be back soon' },
          ],
          correct: 'short',
          clause: 'Priya told what changed, what you are doing first, and asked one question, with no clinical guess',
          feedback: {
            speaker: 'Priya',
            right: "Perfect is short: what changed, what you're doing, one question. Nothing else she wants. Go.",
            wrong: "Don't guess what Dr Reid wants for him. She asked for an exam tray and the drugs box. That's what he gets; she decides the rest when she's looked. And I need to know: what changed, what you're doing first, one question.",
          },
          present: { kind: 'speech' },
        },
        {
          id: 'load',
          kind: 'choice',
          prompt: 'Back in decon. The cycle finished twenty minutes ago. What do you do with the load?',
          after: 'delivery',
          options: [
            { id: 'hot', label: 'Pouch it straight away while it is hot, so it is done before Mr Nowak arrives' },
            { id: 'later', label: 'Leave it on the rack until after lunch. You are busy' },
            { id: 'cool', label: 'Cooling rack under the clean tray holder, covered. Once cool and dry, and within the hour, pouch, label with expiry date and initials, have Priya check it, store it and complete the log' },
          ],
          correct: 'cool',
          clause: 'Load pouched dry within the hour, labelled, checked by Priya, stored, log completed',
          feedback: {
            speaker: 'Priya',
            right: "Cool, dry, within the hour, labelled and logged. That's a load I can put in the cabinet.",
            wrong: "Cool first, and check they're dry before you pouch. But within the hour: if the day runs away with you, that load is the thing you come back for. Past the hour it goes back through, an hour's work. Put it on your list before you leave the room.",
          },
          present: {
            kind: 'hotspots',
            spots: {
              hot: { x: 59.0, y: 34.0, hint: 'Pouch it hot' },
              later: { x: 86.0, y: 72.0, hint: 'Leave it out' },
              cool: { x: 66.0, y: 60.0, hint: 'Cooling rack' },
            },
          },
        },
      ],
    },
    {
      place: 'surgery2',
      people: [],
      eyebrow: 'Surgery 2',
      title: 'Ready for Mr Nowak',
      intro: 'Dr Reid asked for an examination tray and the emergency drugs box within reach. The exam tray guide is on the worktop.',
      decisions: [
        {
          id: 'examtray',
          kind: 'checklist',
          prompt: 'Set up Surgery 2 for 10:40. Tick what you put out.',
          after: 'message',
          options: [
            { id: 'exam', label: 'Mouth mirror, probe and tweezers (sterile pouch)' },
            { id: 'rolls', label: 'Cotton wool rolls' },
            { id: 'aspirator', label: 'Saliva ejector and aspirator tips' },
            { id: 'threeinone', label: '3-in-1 tip' },
            { id: 'bib', label: 'Bib and safety glasses' },
            { id: 'drugs', label: 'Emergency drugs box moved within reach' },
            { id: 'forceps', label: 'Extraction forceps, in case it needs to come out' },
            { id: 'la', label: 'Local anaesthetic drawn up ready' },
          ],
          correct: ['exam', 'rolls', 'aspirator', 'threeinone', 'bib', 'drugs'],
          clause: 'Surgery 2 set up with the examination tray and the drugs box within reach, nothing guessed',
          feedback: {
            speaker: 'Priya',
            right: "That's what Dr Reid asked for, and nothing she didn't. She decides the rest when she's looked.",
            wrong: "Don't guess what Dr Reid wants for him. She asked for an exam tray and the drugs box. That's what he gets; she decides the rest when she's looked. Check the tray against the guide.",
          },
          present: {
            kind: 'tray',
            title: 'Exam tray for 10:40',
            open: 'Set up the tray',
            picture: trayCardPicture,
            shelf: 'Cupboard',
            images: {
              exam: mirrorImage,
              rolls: rollsImage,
              aspirator: aspiratorImage,
              threeinone: threeInOneImage,
              bib: bibImage,
              la: syringeImage,
            },
          },
        },
      ],
    },
    {
      place: 'stock',
      people: ['manager'],
      eyebrow: 'Stock room',
      title: 'The delivery',
      intro: 'The delivery note lists gloves, wipes, cotton rolls, a box of local anaesthetic cartridges and a bottle of disinfectant concentrate.',
      decisions: [
        {
          id: 'delivery',
          kind: 'choice',
          prompt: 'The box is out of the corridor. What do you do with it now?',
          after: 'examtray',
          options: [
            { id: 'unpack', label: 'Unpack it straight into the Surgery 2 cupboard so everything is to hand' },
            { id: 'shelf', label: 'Leave it sealed on the stock room shelf, and flag the anaesthetic and the concentrate to check in with Priya later' },
            { id: 'corridor', label: 'Put it back by reception until Priya is free to deal with it' },
          ],
          correct: 'shelf',
          clause: 'Delivery in the stock room, corridor clear, anaesthetic and concentrate flagged for checking in',
          feedback: {
            speaker: 'Priya',
            right: "Corridor clear, nothing put away unsupervised. We'll check it in together after Mr Nowak.",
            wrong: "Anaesthetic gets checked against the order, quantity, batch, expiry, and goes where this practice keeps it, recorded in. That's a job we do together until you've been shown. Same with the concentrate, that's a chemicals cupboard item, not a shelf. And the corridor stays clear.",
          },
          present: { kind: 'speech' },
        },
      ],
    },
  ],
};
