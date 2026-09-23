import type { TaskContent } from './types';
import trayCardPicture from '@client/assets/closeups/tray-card.jpg';
import stockDeliveryBackdrop from '@client/assets/places/stock-delivery.jpg';
import aspiratorImage from '@client/assets/items/aspirator.png';
import bibImage from '@client/assets/items/bib.png';
import deliveryBoxImage from '@client/assets/items/delivery-box.png';
import excavatorImage from '@client/assets/items/excavator.png';
import mirrorImage from '@client/assets/items/mirror.png';
import plasticImage from '@client/assets/items/plastic.png';
import pouchBrokenImage from '@client/assets/items/pouch-broken.png';
import pouchSealedImage from '@client/assets/items/pouch-sealed.png';
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
      opening: {
        text: 'Look along the dirty and clean sides, the inspection lamp and the autoclave before you continue the cycle.',
        speaker: 'Priya',
      },
      debrief: {
        speaker: 'Priya',
        text: "Three things at once, and you told me first, did the surgery, moved the box and came back for the load in time. That's prioritising. The only bit you should never do alone is the checking-in — and you didn't.", // TBC SME
      },
      decisions: [
        {
          id: 'inspect',
          kind: 'checklist',
          prompt: 'Sort all six instruments under the lamp.',
          context: 'Look at each finding, then move each instrument to Forward to autoclave, Back to cleaning or Set aside.',
          options: [
            { id: 'mirror:forward', label: 'Mouth mirror → Forward to autoclave' },
            { id: 'probe_debris:back', label: 'Probe with debris → Back to cleaning' },
            { id: 'tweezers_ok:forward', label: 'Clean tweezers → Forward to autoclave' },
            { id: 'excavator:forward', label: 'Excavator → Forward to autoclave' },
            { id: 'tweezers_bent:aside', label: 'Bent tweezers → Set aside' },
            { id: 'plastic:forward', label: 'Flat plastic → Forward to autoclave' },
            { id: 'mirror:back', label: 'Mouth mirror → Back to cleaning' },
            { id: 'mirror:aside', label: 'Mouth mirror → Set aside' },
            { id: 'probe_debris:forward', label: 'Probe with debris → Forward to autoclave' },
            { id: 'probe_debris:aside', label: 'Probe with debris → Set aside' },
            { id: 'tweezers_ok:back', label: 'Clean tweezers → Back to cleaning' },
            { id: 'tweezers_ok:aside', label: 'Clean tweezers → Set aside' },
            { id: 'excavator:back', label: 'Excavator → Back to cleaning' },
            { id: 'excavator:aside', label: 'Excavator → Set aside' },
            { id: 'tweezers_bent:forward', label: 'Bent tweezers → Forward to autoclave' },
            { id: 'tweezers_bent:back', label: 'Bent tweezers → Back to cleaning' },
            { id: 'plastic:back', label: 'Flat plastic → Back to cleaning' },
            { id: 'plastic:aside', label: 'Flat plastic → Set aside' },
          ],
          correct: ['mirror:forward', 'probe_debris:back', 'tweezers_ok:forward', 'excavator:forward', 'tweezers_bent:aside', 'plastic:forward'],
          clause: 'Six instruments sorted as V1',
          feedback: {
            speaker: 'Priya',
            right: 'Four forward. Only clean and undamaged goes in the autoclave.',
            wrong: "Sterilising doesn't clean, and it doesn't mend. Look at each one again and ask whether steam can reach every surface, and whether it will do its job on a patient.",
          },
          present: {
            kind: 'zones',
            title: 'Under the lamp',
            open: 'Sort the instruments',
            items: {
              mirror: { label: 'Mouth mirror', image: mirrorImage, finding: 'Clean, bright, no residue' },
              probe_debris: { label: 'Probe', image: probeImage, finding: 'Debris packed in the hinge' },
              tweezers_ok: { label: 'Tweezers', image: tweezersImage, finding: 'Clean, tips meet, no marks' },
              excavator: { label: 'Excavator', image: excavatorImage, finding: 'Clean; edge intact' },
              tweezers_bent: { label: 'Tweezers', image: tweezersBentImage, finding: 'One tip bent; tips do not meet' },
              plastic: { label: 'Flat plastic', image: plasticImage, finding: 'Clean, no residue' },
              broken_pouch: { label: 'Broken-seal pouch', image: pouchBrokenImage },
            },
            zones: {
              forward: { label: 'Forward to autoclave', note: 'Clean and undamaged' },
              back: { label: 'Back to cleaning', note: 'Needs cleaning again' },
              aside: { label: 'Set aside', note: 'Damaged; report it' },
            },
          },
        },
        {
          id: 'autoclave',
          kind: 'checklist',
          prompt: 'Load the autoclave, add the process indicator and begin the log.',
          after: 'inspect',
          options: [
            { id: 'tray-one', label: 'First tray, spaced' },
            { id: 'tray-two', label: 'Second tray, spaced' },
            { id: 'indicator', label: 'Process indicator in' },
            { id: 'log', label: 'Log line: stamped date and time, cycle number and initials' },
            { id: 'overlap', label: 'Both trays overlapping to fit the chamber' },
          ],
          correct: ['tray-one', 'tray-two', 'indicator', 'log'],
          clause: 'Autoclave loaded with spaced trays and the log started',
          feedback: {
            speaker: 'Priya',
            right: 'Spaced so the steam reaches everything, indicator in, and the log started while you remember. Twenty minutes on the clock.',
            wrong: "Give them room — steam has to reach every surface.", // TBC SME
          },
          present: {
            kind: 'autoclave',
            title: 'Load the autoclave',
            open: 'Load the autoclave',
            door: 'Shut the door and start',
            items: {
              'tray-one': { image: pouchSealedImage, note: 'Keep this tray clear of the other' },
              'tray-two': { image: pouchSealedImage, note: 'Keep this tray clear of the other' },
              overlap: { image: pouchSealedImage, note: 'The trays overlap, leaving no room for steam' },
            },
          },
          revealsComplication: true,
        },
        {
          id: 'plan',
          kind: 'sequence',
          prompt: "Lay out the morning's jobs on Joanne's board.",
          context: '10:20 is cancelled. Mr Nowak is coming at 10:40 in pain. The delivery is blocking the corridor.',
          after: 'autoclave',
          options: [
            ...['now', 'next', 'later', 'ask'].map((column) => ({ id: `corridor:${column}`, label: 'Move the delivery out of the corridor — ask Sam' })),
            ...['now', 'next', 'later', 'ask'].map((column) => ({ id: `priya:${column}`, label: 'Tell Priya and ask what Dr Reid needs' })),
            ...['now', 'next', 'later', 'ask'].map((column) => ({ id: `checkin:${column}`, label: 'Check the delivery in with Priya' })),
            ...['now', 'next', 'later', 'ask'].map((column) => ({ id: `load:${column}`, label: 'Pouch the autoclave load within the hour' })),
            ...['now', 'next', 'later', 'ask'].map((column) => ({ id: `surgery:${column}`, label: 'Set up Surgery 2 for 10:40' })),
          ],
          correct: ['priya:now', 'surgery:next', 'checkin:later', 'load:later', 'corridor:ask'],
          clause: 'Plan board has Priya first, surgery before delivery, the load within the hour and a named request for help',
          feedback: {
            speaker: 'Joanne',
            right: "Surgery first, box second, Sam's got the checking-in with you later. Good. Go.", // TBC SME
            wrong: "Think about the patient, a safe ready surgery and what is blocking people. Tell me before you start, keep the load within its hour, and ask for help with a job someone else can safely do.",
          },
          present: {
            kind: 'board',
            title: "Joanne's plan board",
            open: 'Plan the morning',
            columns: [
              { id: 'now', label: 'Now' },
              { id: 'next', label: 'Next' },
              { id: 'later', label: 'Later' },
              { id: 'ask', label: 'Ask' },
            ],
            ask: 'Name who you are asking',
          },
        },
        {
          id: 'message',
          kind: 'choice',
          prompt: 'Message Priya before you start. Which message do you send?',
          after: 'plan',
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
          id: 'printout',
          kind: 'choice',
          prompt: 'The cycle finished twenty minutes ago. What do you do with the load?',
          after: 'delivery',
          blockedBy: {
            decision: 'delivery',
            aside: { speaker: 'Priya', text: 'Finish making the corridor safe and flag the delivery before you come back to the load.' },
          },
          options: [
            { id: 'now', label: 'Pouch and label it now: it is cool, dry and within the hour' },
            { id: 'later', label: 'Leave it on the rack until after lunch. You are busy' },
            { id: 'again', label: 'Run the completed load through another cycle' },
          ],
          correct: 'now',
          clause: 'Printout read and the load chosen for pouching within the hour',
          feedback: {
            speaker: 'Priya',
            right: "Cool, dry, within the hour, labelled and logged. That's a load I can put in the cabinet.",
            wrong: "Cool first, and check they're dry before you pouch. But within the hour: if the day runs away with you, that load is the thing you come back for. Past the hour it goes back through, an hour's work. Put it on your list before you leave the room.",
          },
          present: {
            kind: 'printout',
            title: 'Autoclave cycle printout',
            open: 'Read the printout',
            document: {
              title: 'AUTOCLAVE CYCLE REPORT',
              rows: [
                { label: 'Cycle', value: 'Wrapped instruments' },
                { label: 'Time at temperature', value: '3 min 30 sec' },
                { label: 'Pressure', value: '2.1 bar' },
                { label: 'End time', value: '10:34' },
                { label: 'Time now', value: '10:54' },
              ],
              footer: 'CYCLE COMPLETE',
            },
          },
        },
        {
          id: 'labels',
          kind: 'checklist',
          prompt: 'Complete the pouch label and put the checked load into clean storage.',
          after: 'printout',
          options: [
            { id: 'expiry', label: 'EXP: Expiry from cycle card' },
            { id: 'today', label: "Today's date as the expiry date" },
            { id: 'endtime', label: 'Cycle end time 10:34 as the expiry date' },
            { id: 'initials', label: 'BY: Your initials' },
            { id: 'cabinet', label: 'STORE: Checked; clean cabinet; log complete' },
          ],
          correct: ['expiry', 'initials', 'cabinet'],
          clause: 'Load labelled, checked, stored and log completed',
          feedback: {
            speaker: 'Priya',
            right: "Cool, dry, within the hour, labelled and logged. That's a load I can put in the cabinet.",
            wrong: 'Use the expiry rule on the cycle card and your initials. The load only goes into clean storage after my check, with the log complete.',
          },
          present: {
            kind: 'labels',
            title: 'Label and store the load',
            open: 'Write the labels',
            packages: [{
              id: 'load',
              name: 'Sterile pouch and load record',
              image: pouchSealedImage,
              fields: [
                { optionId: 'expiry', field: 'EXP', value: 'Expiry from cycle card' },
                { optionId: 'today', field: 'EXP', value: "Today's date" },
                { optionId: 'endtime', field: 'EXP', value: '10:34' },
                { optionId: 'initials', field: 'BY', value: 'Your initials' },
                { optionId: 'cabinet', field: 'STORE', value: 'Checked; clean cabinet; log complete' },
              ],
            }],
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
      decisions: [{
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
        clause: 'Surgery 2 ready for 10:40 with the examination tray and drugs box in reach',
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
          images: { exam: mirrorImage, rolls: rollsImage, aspirator: aspiratorImage, threeinone: threeInOneImage, bib: bibImage, la: syringeImage },
        },
      }],
    },
    {
      place: 'stock',
      backdrop: stockDeliveryBackdrop,
      people: ['manager'],
      eyebrow: 'Stock room',
      title: 'The delivery',
      intro: 'The box is safely on the stock-room bench. Check the delivery note without putting anything away.',
      decisions: [{
        id: 'delivery',
        kind: 'checklist',
        prompt: 'Flag the lines that must be checked in and stored with Priya.',
        after: 'examtray',
        options: [
          { id: 'gloves', label: 'Nitrile gloves' },
          { id: 'wipes', label: 'Surface wipes' },
          { id: 'rolls', label: 'Cotton rolls' },
          { id: 'anaesthetic', label: 'Local anaesthetic cartridges' },
          { id: 'concentrate', label: 'Disinfectant concentrate' },
        ],
        correct: ['anaesthetic', 'concentrate'],
        clause: 'Box in the stock room with the two supervised-storage items flagged',
        noticed: {
          value: 'Local anaesthetic cartridges and disinfectant concentrate flagged for checking in with Priya.',
          when: 'right',
        },
        feedback: {
          speaker: 'Priya',
          right: "Corridor clear, nothing put away unsupervised. We'll check it in together after Mr Nowak.",
          wrong: "Anaesthetic and chemical concentrate each follow the practice's storage rules. Flag anything you have not been shown how to check in; do not put it away unsupervised.",
        },
        present: {
          kind: 'flags',
          title: 'Delivery note',
          open: 'Check the delivery',
          picture: deliveryBoxImage,
          flag: 'Needs Priya',
          lines: [
            { id: 'gloves', item: 'Nitrile gloves', ordered: '3 boxes', delivered: '3 boxes', note: 'General stock' },
            { id: 'wipes', item: 'Surface wipes', ordered: '6 tubs', delivered: '6 tubs', note: 'General stock' },
            { id: 'rolls', item: 'Cotton rolls', ordered: '4 bags', delivered: '4 bags', note: 'General stock' },
            { id: 'anaesthetic', item: 'Local anaesthetic cartridges', ordered: '2 boxes', delivered: '2 boxes', note: 'Quantity, batch, expiry and secure storage' },
            { id: 'concentrate', item: 'Disinfectant concentrate', ordered: '1 bottle', delivered: '1 bottle', note: 'Hazard-labelled; chemicals storage' },
          ],
        },
      }],
    },
  ],
};