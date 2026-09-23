import type { TaskContent } from './types';
import type { TouchPoster, TouchSpot } from './presentation';
import emergencyKitPicture from '@client/assets/closeups/emergency-kit.jpg';
import trayCardPicture from '@client/assets/closeups/tray-card.jpg';
import mirrorReady from '@client/assets/closeups/mirror-ready.jpg';
import mirrorWatch from '@client/assets/closeups/mirror-watch.jpg';
import mirrorHair from '@client/assets/closeups/mirror-hair.jpg';
import mirrorRing from '@client/assets/closeups/mirror-ring.jpg';
import sinkStation from '@client/assets/closeups/sink-station.jpg';
import handsClean from '@client/assets/closeups/hands-clean.jpg';
import lastNight from '@client/assets/places/surgery2-last-night.jpg';
import aspiratorImage from '@client/assets/items/aspirator.png';
import bibImage from '@client/assets/items/bib.png';
import bondImage from '@client/assets/items/bond.png';
import compositeImage from '@client/assets/items/composite.png';
import curingLightImage from '@client/assets/items/curing-light.png';
import matrixImage from '@client/assets/items/matrix.png';
import mirrorImage from '@client/assets/items/mirror.png';
import plasticImage from '@client/assets/items/plastic.png';
import syringeImage from '@client/assets/items/syringe.png';
import pouchSealed from '@client/assets/items/pouch-sealed.png';
import pouchBroken from '@client/assets/items/pouch-broken.png';
import forcepsImage from '@client/assets/items/forceps.png';
import glovesBox from '@client/assets/items/gloves-box.png';
import wipesImage from '@client/assets/items/wipes.png';

// The 12-step poster above the sink: ten steps light while the tap is held, the last two when the hands do them.
const HANDWASH_POSTER: TouchPoster = {
  hold: ['Wet hands', 'Apply soap', 'Palm to palm', 'Backs of hands', 'Between fingers', 'Backs of fingers', 'Thumbs', 'Fingertips', 'Wrists', 'Rinse'],
  then: [{ label: 'Dry', lit: ['towel', 'tunic'] }, { label: 'Turn tap off', lit: ['tap_towel', 'tap_hand'] }],
};

// What clean hands can touch at the sink, shared by both handwashes. Positions are percentages of
// closeups/sink-station.jpg; marks are percentages of closeups/hands-clean.jpg. World lines TBC SME.
const SINK_SPOTS: Record<string, TouchSpot> = {
  tap: {
    x: 68, y: 36, label: 'Tap', records: 'tap_hand', withTowel: 'tap_towel', dirty: true, marks: [{ x: 62, y: 66 }], stopsSound: 'water-run',
    line: 'Dirty hands turned that tap on. Clean ones have just touched it.', // TBC SME
    lineWithTowel: 'Tap off with the towel, towel in the bin.', // TBC SME
  },
  towel: {
    x: 61, y: 12, label: 'Paper towels', records: 'towel', holds: true, dries: true,
    beforeWash: 'Nothing to dry yet.', line: 'Single use. Pat dry, wrists too.', // TBC SME
  },
  tunic: {
    x: 7, y: 50, label: 'Your tunic', records: 'tunic', dirty: true, dries: true, marks: [{ x: 40, y: 58 }, { x: 64, y: 60 }],
    beforeWash: "A tunic isn't a towel.", line: 'That tunic came in on the bus with you.', // TBC SME
  },
  phone: {
    x: 76, y: 91, label: 'Your phone', records: 'phone', dirty: true, marks: [{ x: 46, y: 84 }, { x: 60, y: 84 }],
    beforeWash: 'Nothing new. Away it goes.', line: 'A phone goes everywhere you do, and it is never clean.', // TBC SME
  },
};
const GLOVES_SPOT: TouchSpot = { x: 88, y: 76, label: 'Gloves box', records: 'gloves' };

// Storyboard Task 1. Clinical detail is draft, pending SME validation.
export const SETUP_TASK: TaskContent = {
  id: 'setup',
  dialogue: {
    speaker: 'Priya',
    text: "Before anyone sits in that chair, this room has to be clean, working and stocked, and the emergency kit checked. I'll talk you through it once. Then it's yours, and if you're not sure about anything, ask.",
  },
  signOff: {
    speaker: 'Priya',
    // TBC SME
    text: "Four things spotted before you touched a wipe, sheets initialled, tray matches the card, and you caught that date. That's a proper set-up. Dr Reid's in at ten to nine.",
  },
  scenes: [{
    place: 'surgery2',
    eyebrow: 'Surgery 2',
    title: 'Morning set-up',
    intro: "Get yourself ready, notice what is wrong with the room before you touch it, then get Surgery 2 clean, working, safe and stocked for the morning.",
    people: ['mentor'],
    opening: {
      speaker: 'Priya',
      // TBC SME
      text: "Don't touch anything yet. Have a look round first — last night's close-down was in a hurry. What isn't right?",
    },
    debrief: {
      speaker: 'Priya',
      // TBC SME
      text: "Four things spotted before you touched a wipe, sheets initialled, tray matches the card, and you caught that date. That's a proper set-up. Dr Reid's in at ten to nine.",
    },
    decisions: [
      {
        id: 'mirror', kind: 'choice',
        prompt: "Have a look at yourself first. Anything you'd not want in a patient's mouth?", // TBC SME
        options: [
          { id: 'badge', label: 'Badge' }, { id: 'watch', label: 'Watch' }, { id: 'tunic', label: 'Tunic' },
          { id: 'hair', label: 'Hair' }, { id: 'ring', label: 'Ring' },
        ],
        correct: ['watch', 'hair', 'ring'],
        clause: 'Presentation checked and the mirror fault put right',
        feedback: {
          speaker: 'Priya',
          right: 'Ready for the surgery.',
          // TBC SME
          wrong: "Badge is fine. Look at your hands and your collar. Anything that can carry what you touched on the bus into a patient's mouth comes off or goes up.",
        },
        present: {
          kind: 'reflection', title: 'Mirror check', open: 'Check the mirror',
          variants: {
            watch: { image: mirrorWatch, alt: 'A reflection wearing a wristwatch', fixed: mirrorReady, fixedAlt: 'A reflection ready for the surgery' },
            hair: { image: mirrorHair, alt: 'A reflection with hair down', fixed: mirrorReady, fixedAlt: 'A reflection ready for the surgery' },
            ring: { image: mirrorRing, alt: 'A reflection wearing a ring', fixed: mirrorReady, fixedAlt: 'A reflection ready for the surgery' },
          },
          spots: {
            watch: { x: 43, y: 75, hint: 'Wrist' }, hair: { x: 49, y: 16, hint: 'Collar' },
            ring: { x: 49, y: 52, hint: 'Hand' }, badge: { x: 61, y: 23, hint: 'Badge' }, tunic: { x: 50, y: 40, hint: 'Tunic' },
          },
        },
      },
      {
        // The route is recorded as what the hands touch, in order (option ids); the options are listed out of order on purpose.
        id: 'handwash', kind: 'sequence', prompt: 'Wash your hands the 12-step way, then put on your PPE.',
        context: 'The 12-step handwashing poster is above the sink, next to the PPE station.',
        options: [
          { id: 'ppe', label: 'Apron, mask and visor on' }, { id: 'tap_hand', label: 'Tap off with your hand' },
          { id: 'towel', label: 'Dry with a paper towel' }, { id: 'gloves', label: 'Gloves on' },
          { id: 'phone', label: 'Check your phone' }, { id: 'wash', label: 'Wash at the sink, all twelve steps' },
          { id: 'tunic', label: 'Dry your hands on your tunic' }, { id: 'tap_towel', label: 'Tap off with the paper towel' },
        ],
        correct: ['wash', 'towel', 'tap_towel', 'ppe', 'gloves'], clause: 'Handwash completed before PPE, with gloves last',
        feedback: {
          speaker: 'Priya',
          right: 'Clean hands first, then the PPE over them, gloves last. Nothing touches them on the way on.',
          wrong: 'Think about what touches what. Anything you put on after your hands are clean has to go on without touching them, and gloves are the last thing on, not a substitute for washing. Go again.',
        },
        present: {
          kind: 'touches', title: 'Handwash and PPE', open: 'Wash your hands', picture: sinkStation,
          hands: { image: handsClean, alt: 'Your hands, palms up' },
          hold: {
            optionId: 'wash', control: 'Hold the tap', seconds: 5, spot: { x: 68, y: 36 },
            early: 'All twelve. It takes as long as it takes — start again.', // TBC SME
          },
          poster: { ...HANDWASH_POSTER },
          commits: 'gloves',
          spots: { ...SINK_SPOTS, ppe: { x: 89, y: 27, label: 'PPE station', records: 'ppe', tapThrough: ['Apron', 'Mask', 'Visor'] }, gloves: GLOVES_SPOT },
        },
      },
      {
        id: 'faults', kind: 'checklist', prompt: 'Look round the room before you touch anything. Four things are not right.',
        options: [
          { id: 'light', label: 'Operating light left on' }, { id: 'cup', label: 'Used rinse cup' },
          { id: 'sharps', label: 'Sharps container open' }, { id: 'bin', label: 'Clinical waste bin overfull' },
        ],
        correct: ['light', 'cup', 'sharps', 'bin'], clause: 'All four walk-in faults found and fixed',
        feedback: {
          speaker: 'Priya', right: 'You looked before starting the clean.',
          wrong: "Before you wipe: what's still not right in here? Look at the unit.", // TBC SME
        },
        present: {
          kind: 'find', backdrop: lastNight, backdropAlt: 'Surgery 2 as it was left last night', counter: '{n} to find', guideLabel: 'Inspect the room',
          faults: {
            light: { spot: { x: 55, y: 23, hint: 'Light' }, fixed: { x: 47, y: 15, w: 16, h: 16 }, done: 'Light off and parked' },
            cup: { spot: { x: 83, y: 54, hint: 'Cup' }, fixed: { x: 81, y: 50, w: 5, h: 9 }, done: 'Cup binned' },
            sharps: { spot: { x: 92, y: 48, hint: 'Sharps' }, fixed: { x: 89, y: 41, w: 5, h: 13 }, done: 'Sharps container closed' },
            bin: { spot: { x: 15, y: 75, hint: 'Bin' }, fixed: { x: 12, y: 68, w: 8, h: 15 }, done: 'Bin bagged' },
          },
          fine: [
            { spot: { x: 52, y: 68, hint: 'Chair' }, reply: "That's as it should be" },
            { spot: { x: 20, y: 56, hint: 'Sink' }, reply: "That's as it should be" },
            { spot: { x: 28, y: 39, hint: 'Dispenser' }, reply: "That's as it should be" },
          ],
        },
      },
      {
        id: 'wipe', kind: 'sequence', prompt: 'Wipe the surgery down in one continuous path.',
        context: 'Priya: "Top to bottom, cleaner to dirtier. Start with the chair."',
        options: [
          { id: 'spittoon', label: 'Spittoon' }, { id: 'handles', label: 'Door handles, taps and sink' },
          { id: 'headrest', label: 'Headrest and top of the chair' }, { id: 'aspirator', label: 'Aspirator hoses and holders' },
          { id: 'surfaces', label: 'Work surfaces and equipment' }, { id: 'light', label: 'Operating light and handles' },
          { id: 'delivery', label: 'Delivery unit and handpiece holders' },
        ],
        correct: ['headrest', 'light', 'delivery', 'aspirator', 'spittoon', 'surfaces', 'handles'],
        clause: 'Surgery wiped chair first, top to bottom, spittoon last, then hard surfaces',
        feedback: {
          speaker: 'Priya',
          right: "That's it. Chair from the top down, spittoon last, then the hard surfaces. Leave each wipe its contact time before you move on.",
          wrong: "Nearly, but the spittoon's the dirtiest bit of the chair, so it comes last. Top to bottom, cleaner to dirtier, and the surfaces come after the chair. Go again.",
        },
        blockedBy: { decision: 'faults', aside: { speaker: 'Priya', text: "Before you wipe: what's still not right in here? Look at the unit." } }, // TBC SME
        present: {
          kind: 'path', start: 'Start wipe', finish: 'Finish path', guideLabel: 'Wipe the surgery',
          zones: {
            headrest: { x: 28, y: 61, hint: 'Chair top' }, light: { x: 53, y: 25, hint: 'Lamp head' },
            delivery: { x: 80, y: 53, hint: 'Unit tray' }, aspirator: { x: 68, y: 61, hint: 'Hose holders' },
            spittoon: { x: 44, y: 60, hint: 'Rinse bowl' }, surfaces: { x: 24, y: 48, hint: 'Worktop' },
            handles: { x: 11, y: 58, hint: 'Handles' },
          },
        },
      },
      {
        id: 'flush', kind: 'choice', prompt: 'How long do you flush the water lines?', context: 'Priya: "This is the first flush of the day."',
        options: [{ id: 'short', label: '20 to 30 seconds' }, { id: 'two', label: '2 minutes' }, { id: 'five', label: '5 minutes' }],
        correct: 'two', clause: 'Water lines flushed for 2 minutes at the start of the day',
        feedback: {
          speaker: 'Priya', right: 'Two full minutes first thing. That water has sat in the lines all night.',
          wrong: "Twenty to thirty seconds is between patients. First thing, that water has sat in the lines all night, so it's two full minutes to clear it and stop biofilm building up. Five would just waste the morning.",
        },
        present: { kind: 'hold', title: 'Water-line flush', open: 'Flush the lines', control: 'Hold to flush', seconds: 6, commits: 'two', choose: { prompt: 'Choose a duration', optionIds: ['short', 'two', 'five'], secondsById: { short: 3, two: 6, five: 9 } }, clockMinutes: 2 },
      },
      {
        id: 'kit', kind: 'checklist', prompt: 'Open the emergency kit and read every label.',
        context: 'Oxygen gauge in the green. AED indicator green. Adrenaline expires next year. Aspirin expires in eight months. Glucagon expired last month.',
        options: [
          { id: 'oxygen', label: 'Oxygen cylinder: level and tested' }, { id: 'aed', label: 'AED: indicator shows ready' },
          { id: 'adrenaline', label: 'Adrenaline: in date' }, { id: 'aspirin', label: 'Aspirin: in date' }, { id: 'glucagon', label: 'Glucagon: label' },
        ],
        correct: ['oxygen', 'aed', 'adrenaline', 'aspirin', 'glucagon'], clause: 'Every emergency item opened and read',
        feedback: {
          speaker: 'Priya', right: 'Oxygen, AED and two of the three drugs are fine. So what about the third?',
          wrong: 'Have another look at the dates on the drugs box for me. All of them. Only tick a line you have actually checked and found ready.',
        },
        present: {
          kind: 'kit', title: 'Emergency kit check', open: 'Open the kit', picture: emergencyKitPicture,
          items: {
            oxygen: { detail: 'Cylinder full, mask and tubing sealed', status: 'ok' }, aed: { detail: 'Pads in date to 08/2027, battery light green', status: 'ok' },
            adrenaline: { detail: 'Expiry 03/2027', status: 'ok' }, aspirin: { detail: 'Expiry 11/2027', status: 'ok' },
            glucagon: { detail: 'Expired last month', status: 'expired' },
          },
        },
        revealsComplication: true,
      },
      {
        id: 'glucagon', kind: 'choice', prompt: 'The glucagon is out of date. What do you do?', after: 'kit',
        options: [
          { id: 'tick', label: 'Tick it anyway. It is only a few weeks over' },
          { id: 'swap', label: 'Fetch a replacement from the stock room and swap it' },
          { id: 'report', label: 'Flag it on the sheet and tell Priya now, before carrying on' },
        ],
        correct: 'report', clause: 'Expired glucagon flagged on the sheet and reported to Priya',
        feedback: {
          speaker: 'Priya',
          right: "That's exactly why we check every morning. Nobody's touched that box for weeks, which is the point. Write it on the sheet, and I'll ring the order through. Dr Reid needs to know before nine.",
          wrong: "Checking is only half of it. The other half is what you do with what you find. Tell me now, write it on the sheet, and I'll sort a replacement. It's not yours to swap: emergency drugs are checked in and recorded, not taken off a shelf.",
        },
        present: { kind: 'speech' }, noticed: { when: 'right', value: 'glucagon out of date, told Priya' },
      },
      {
        // The same sink, this time arriving in the gloves and apron from the wipe; options listed out of order on purpose.
        id: 'fresh', kind: 'sequence', prompt: 'Wash and glove again before opening the instrument cupboard.',
        options: [
          { id: 'gloves', label: 'Fresh gloves on' }, { id: 'wash', label: 'Wash at the sink, all twelve steps' },
          { id: 'phone', label: 'Check your phone' }, { id: 'ppe_off', label: 'Used gloves and apron off, into clinical waste' },
          { id: 'tap_hand', label: 'Tap off with your hand' }, { id: 'apron', label: 'Fresh apron on' },
          { id: 'tunic', label: 'Dry your hands on your tunic' }, { id: 'towel', label: 'Dry with a paper towel' },
          { id: 'tap_towel', label: 'Tap off with the paper towel' },
        ],
        correct: ['ppe_off', 'wash', 'towel', 'tap_towel', 'apron', 'gloves'], clause: 'A fresh handwash and fresh PPE precede the tray set-up',
        feedback: {
          speaker: 'Priya', right: 'Dirty job done, dirty PPE off, clean hands, clean PPE, then the sterile stuff. That rhythm runs the whole day.',
          wrong: "Those gloves have just cleaned a surgery. Ask yourself what is about to touch sterile pouches, and whether it should be the same pair. Hands are washed between, not just re-covered.",
        },
        present: {
          kind: 'touches', title: 'Fresh hands', open: 'Wash again', picture: sinkStation, startGloved: true,
          hands: { image: handsClean, alt: 'Your hands, palms up' },
          hold: {
            optionId: 'wash', control: 'Hold the tap', seconds: 5, spot: { x: 68, y: 36 },
            early: 'All twelve. It takes as long as it takes — start again.', // TBC SME
            whileGloved: "That's washing the gloves, not your hands.", // TBC SME
          },
          poster: { ...HANDWASH_POSTER },
          commits: 'gloves',
          spots: {
            ...SINK_SPOTS,
            used: { x: 36, y: 68, label: 'Your gloves and apron', records: 'ppe_off', strips: true, line: 'Gloves and apron into the clinical waste, inside out.' }, // TBC SME
            ppe: { x: 89, y: 27, label: 'PPE station', records: 'apron', tapThrough: ['Apron'] },
            gloves: GLOVES_SPOT,
          },
        },
      },
      {
        id: 'tray', kind: 'checklist', prompt: 'Set up the tray for the 09:00 composite filling from the laminated card.', after: 'fresh',
        options: [
          { id: 'exam', label: 'Mouth mirror, probe and tweezers (sterile pouch)' }, { id: 'aspirator', label: 'High-volume aspirator tip and saliva ejector' },
          { id: 'anaesthetic', label: 'Topical gel, with the local anaesthetic left sealed beside the syringe' }, { id: 'bond', label: 'Etchant and bonding agent' },
          { id: 'composite', label: 'Composite and shade guide' }, { id: 'matrix', label: 'Matrix band and holder' },
          { id: 'light', label: 'Curing light with barrier sleeve and orange shield' }, { id: 'finish', label: 'Articulating paper and polishing strips' },
          { id: 'forceps', label: 'Extraction forceps' }, { id: 'bib', label: 'Patient bib and safety glasses' },
        ],
        correct: ['exam', 'aspirator', 'anaesthetic', 'bond', 'composite', 'matrix', 'light', 'finish', 'bib'],
        clause: 'Tray matches the composite filling card, nothing missing and nothing extra',
        feedback: {
          speaker: 'Priya',
          right: "Tray matches the card. The matrix band is the thin metal strip that wraps round the tooth so the filling sets to the right shape. You'll see Dr Reid use it.",
          wrong: 'Check the tray against the card, item by item. Every line on it has a one-line reason for being there, and anything not on it stays in the cupboard, however important it looks. Forceps are for taking a tooth out. Not today.',
        },
        blockedBy: { decision: 'fresh', aside: { speaker: 'Priya', text: 'Those gloves have just done the spittoon. Fresh hands before anything goes near a tray.' } }, // TBC SME
        present: {
          kind: 'tray', title: 'Tray for the 09:00 composite', open: 'Set up the tray', shelf: 'Instrument cupboard', picture: trayCardPicture,
          images: { exam: pouchSealed, aspirator: aspiratorImage, anaesthetic: syringeImage, bond: bondImage, composite: compositeImage, matrix: matrixImage, light: curingLightImage, finish: plasticImage, forceps: forcepsImage, bib: bibImage },
        },
      },
      {
        id: 'pouch', kind: 'choice', prompt: 'Check the examination pouch and put it in the right place.', after: 'tray',
        options: [
          { id: 'use', label: 'Use it. The instruments look clean' }, { id: 'tape', label: 'Tape the seal back down and use it' },
          { id: 'aside', label: 'Set it aside for decontamination, take another pouch and tell Priya' },
        ],
        correct: 'aside', clause: 'Broken-seal pouch set aside and reported',
        feedback: {
          speaker: 'Priya', right: 'Good. It goes back through decontamination, and we know it happened.',
          wrong: "If the seal's broken we can't call it sterile, however clean it looks. Put it to one side so it goes back through decontamination, and take another.",
        },
        noticed: { when: 'right', value: 'pouch with broken seal set aside' },
        present: { kind: 'tray', title: 'Check the pouch', open: 'Return to the tray', shelf: 'Instrument cupboard', picture: pouchBroken },
      },
      {
        id: 'initials', kind: 'choice', prompt: 'Initial both check sheets.',
        options: [{ id: 'ticks', label: 'Tick each line' }, { id: 'initials', label: 'Initial both sheets' }, { id: 'priya', label: 'Leave them for Priya' }],
        correct: 'initials', clause: 'Both check sheets carry the learner’s initials',
        feedback: {
          speaker: 'Priya', right: 'Your initials mean you did the check. If anyone asks in six months, that sheet is the answer.',
          wrong: "A tick on its own tells nobody who did the check. The sheet is only complete when the person who did each line has initialled it, with the date and time. Not me, you did the checks.",
        },
        present: { kind: 'initials', title: 'Initial the check sheets', open: 'Initial the sheets', commits: 'initials', sheets: ['Surgery check sheet', 'Medical emergency equipment check sheet'] },
      },
    ],
  }],
};

// Asset references used by the setup interactions.
void pouchBroken; void glovesBox; void wipesImage;