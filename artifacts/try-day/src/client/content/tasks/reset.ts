import type { TaskContent } from './types';
import packagesPicture from '@client/assets/closeups/packages.jpg';
import afterPatientBackdrop from '@client/assets/places/surgery2-after-patient.jpg';
import amiraSettled from '@client/assets/people/states/amira-settled.jpg';
import amiraThumbsUp from '@client/assets/people/states/amira-thumbs-up.jpg';
import karimWorried from '@client/assets/people/states/karim-worried.jpg';
import karimReassured from '@client/assets/people/states/karim-reassured.jpg';
import karimAsking from '@client/assets/people/states/karim-asking.jpg';
import karimLeaving from '@client/assets/people/states/karim-leaving.jpg';

const AMIRA_STATES = {
  settled: { image: amiraSettled, alt: 'Amira sits settled after treatment.' },
  'thumbs-up': { image: amiraThumbsUp, alt: 'Amira is proud and gives a thumbs-up.' },
};
const KARIM_STATES = {
  worried: { image: karimWorried, alt: 'Karim looks concerned beside Amira.' },
  reassured: { image: karimReassured, alt: 'Karim looks visibly reassured.' },
  asking: { image: karimAsking, alt: 'Karim leans forward to ask a question.' },
  leaving: { image: karimLeaving, alt: 'Karim turns towards the surgery door.' },
};

// Storyboard Task 4. Clinical detail is draft, pending SME validation.
export const RESET_TASK: TaskContent = {
  id: 'reset',
  dialogue: {
    speaker: 'Priya',
    text: "Patient first, she's still numb and she's still ten. Then the notes while it's fresh. Then dad. Then this room, in order, no matter who's waiting.", // kept
  },
  signOff: {
    speaker: 'Priya',
    text: "Notes done, dad knows what to watch for, room's reset and the sheet says so. That's a full appointment, start to finish. Most people only ever see the middle bit.", // kept
  },
  scenes: [
    {
      place: 'surgery2',
      backdrop: afterPatientBackdrop,
      people: ['amira', 'karim', 'dentist'],
      eyebrow: 'Surgery 2',
      title: 'Notes, aftercare and reset',
      intro: 'Amira is still in the chair with a numb cheek. Dr Reid is talking to her dad and needs the notes finishing with the batch numbers. Sam has messaged: the 09:40 check-up has arrived.', // kept
      cast: {
        amira: { initial: 'settled', states: AMIRA_STATES },
        karim: { initial: 'worried', states: KARIM_STATES },
      },
      debrief: {
        speaker: 'Priya',
        // TBC SME
        text: "Notes right, dad knows what to do tonight, room turned round in six minutes without a shortcut. That's the whole appointment, not just the filling.",
      },
      decisions: [
        {
          id: 'care',
          kind: 'checklist',
          prompt: 'Look after Amira as the treatment ends. Use the room controls before bringing the chair up.',
          options: [
            { id: 'glasses', label: 'Glasses off' }, // kept
            { id: 'rinse', label: 'Mouthwash and a tissue' }, // kept
            { id: 'bib', label: 'Bib off' }, // kept
            { id: 'mirror', label: 'Offer her the mirror, if she wants to look' }, // kept
            { id: 'quick', label: 'Bring the chair straight up with a quick press' }, // changed: plausible Section D mistake
          ],
          correct: ['rinse', 'mirror', 'glasses', 'bib'], // changed: the V1 chair step is judged by the following hold
          clause: "Amira's mouth rinsed, mirror offered, and bib and glasses removed",
          feedback: {
            speaker: 'Priya',
            right: 'Rinse, mirror, glasses, bib, then up slowly. And you praised the thing she actually did well, not "see, that wasn\'t so bad".', // kept
            wrong: "She's had a mouthful of water and filling dust, and she's been lying flat for half an hour. Deal with the mouth before anything comes off, and sitting up is the slow bit at the end. Go again.", // kept
          },
          present: {
            kind: 'controls',
            start: 'Bring Amira up slowly using the room controls.',
            guideLabel: 'Bring Amira up',
            controls: {
              rinse: { label: 'Mouthwash cup', spot: { x: 42, y: 62 }, kind: 'action' },
              mirror: { label: 'Hand mirror', spot: { x: 84, y: 56 }, kind: 'action' },
              glasses: { label: 'Glasses', spot: { x: 70, y: 43 }, kind: 'action' },
              bib: { label: 'Bib', spot: { x: 57, y: 67 }, kind: 'action' },
              quick: { label: 'Quick chair-up', spot: { x: 48, y: 73 }, kind: 'action' },
            },
            commit: { label: 'Ready to bring chair up', spot: { x: 90, y: 68 } },
          },
        },
        {
          id: 'chair-up',
          kind: 'choice',
          prompt: 'Bring Amira up slowly.',
          after: 'care',
          options: [
            { id: 'sit', label: 'Help her sit up slowly', reaction: { person: 'amira', state: 'thumbs-up', text: 'Amira sits up slowly and looks proud.' } }, // kept
            { id: 'quick', label: 'Bring the chair straight up with a quick press' },
          ],
          correct: 'sit',
          clause: 'Amira brought upright with a slow chair hold',
          feedback: {
            speaker: 'Priya',
            right: 'Rinse, mirror, glasses, bib, then up slowly.', // kept from V1
            // TBC SME
            wrong: "Slowly — she's been flat for forty minutes and she's ten.",
          },
          present: {
            kind: 'hold',
            title: 'Bring the chair up',
            open: 'Bring the chair up',
            control: 'Hold chair up slowly',
            seconds: 3,
            commits: 'sit',
            early: "Slowly — she's been flat for forty minutes and she's ten.", // TBC SME
            distractor: { optionId: 'quick', label: 'Quick chair-up' },
            sound: 'chair',
          },
        },
        {
          id: 'praise',
          kind: 'choice',
          // TBC SME
          prompt: '"Did I do it right? The hand thing?"',
          after: 'chair-up',
          options: [
            { id: 'specific', label: '"You used the signal exactly right."', reaction: { person: 'amira', state: 'thumbs-up', text: 'Amira relaxes and gives a proud thumbs-up.' } },
            { id: 'not_bad', label: '"See, that wasn\'t so bad."', reaction: { person: 'amira', state: 'settled', text: 'Amira looks down, unsure.' } },
            { id: 'fine', label: '"You were fine."', reaction: { person: 'amira', state: 'settled', text: 'Amira waits for an answer about her signal.' } },
          ],
          correct: 'specific',
          clause: 'Amira praised for using her hand signal',
          feedback: {
            speaker: 'Priya',
            right: 'You praised the thing she actually did well, not "see, that wasn\'t so bad".', // kept from V1
            wrong: 'Praise the thing she actually did well: she used the signal exactly right.', // kept from V1 principle
          },
          present: { kind: 'speech' },
        },
        {
          id: 'batch',
          kind: 'checklist',
          prompt: 'Dr Reid dictates: "Record the batches." Peel the right label from each package and stick it in the matching notes field.', // changed
          context: 'Anaesthetic box: REF 22-0913. LOT 4471B. EXP 03/2027. Composite syringe: REF CP-A2. LOT C0882. Bonding agent bottle: LOT B5510. EXP 11/2026.', // kept
          options: [
            { id: 'la_ref', label: 'Anaesthetic: REF 22-0913' }, // kept
            { id: 'la_lot', label: 'Anaesthetic: LOT 4471B' }, // kept
            { id: 'la_exp', label: 'Anaesthetic: EXP 03/2027' }, // kept
            { id: 'comp_ref', label: 'Composite: REF CP-A2' }, // kept
            { id: 'comp_lot', label: 'Composite: LOT C0882' }, // kept
            { id: 'bond_lot', label: 'Bonding agent: LOT B5510' }, // kept
            { id: 'bond_exp', label: 'Bonding agent: EXP 11/2026' }, // kept
          ],
          correct: ['la_lot', 'comp_lot', 'bond_lot'], // kept
          clause: 'Batch numbers for the anaesthetic, composite and bonding agent recorded from the packaging, not the product code or expiry', // kept
          feedback: {
            speaker: 'Priya',
            right: 'Three lot numbers, one per package. If any of those is ever recalled, that is the number the manufacturer asks for.', // kept
            wrong: "Batch or lot, that's the one that tells us which production run this came from. If there's ever a recall, that's the number the manufacturer asks for. Expiry goes in its own field; the product code isn't ours to record.", // kept
          },
          present: {
            kind: 'stick',
            title: 'Record the batches',
            open: 'Stick the batch labels',
            picture: packagesPicture,
            labels: [
              { id: 'la_ref', item: 'Anaesthetic', fields: [{ field: 'REF', value: '22-0913' }] },
              { id: 'la_lot', item: 'Anaesthetic', fields: [{ field: 'LOT', value: '4471B' }] },
              { id: 'la_exp', item: 'Anaesthetic', fields: [{ field: 'EXP', value: '03/2027' }] },
              { id: 'comp_ref', item: 'Composite', fields: [{ field: 'REF', value: 'CP-A2' }] },
              { id: 'comp_lot', item: 'Composite', fields: [{ field: 'LOT', value: 'C0882' }] },
              { id: 'bond_lot', item: 'Bonding agent', fields: [{ field: 'LOT', value: 'B5510' }] },
              { id: 'bond_exp', item: 'Bonding agent', fields: [{ field: 'EXP', value: '11/2026' }] },
            ],
            fields: [
              { id: 'anaesthetic', label: 'Anaesthetic batch', accepts: 'la_lot' },
              { id: 'composite', label: 'Composite batch', accepts: 'comp_lot' },
              { id: 'bonding', label: 'Bonding agent batch', accepts: 'bond_lot' },
            ],
          },
        },
        {
          id: 'dictation',
          kind: 'checklist',
          prompt: "Tick everything from Dr Reid's dictation that goes into the notes.", // kept
          context: 'Dr Reid: "Composite restoration completed, lower left back tooth. Local anaesthetic given, record the batch. Patient tolerated well; hand signal used once, water at the back. Aftercare to dad. Recall six months."', // kept
          after: 'batch',
          options: [
            { id: 'restoration', label: 'Composite restoration completed, lower left back tooth' }, // kept
            { id: 'la', label: 'Local anaesthetic given, with the batch number' }, // kept
            { id: 'signal', label: 'Tolerated well; hand signal used once, water at the back' }, // kept
            { id: 'aftercare', label: 'Aftercare given to dad' }, // kept
            { id: 'recall6', label: 'Recall six months' }, // kept
            { id: 'recall2', label: 'Recall two weeks to check the filling' }, // kept
            { id: 'opinion', label: "Nurse's view: went fine, no follow-up needed" }, // kept
          ],
          correct: ['restoration', 'la', 'signal', 'aftercare', 'recall6'], // kept
          clause: 'Notes carry the dictation points and a six-month recall', // kept
          feedback: {
            speaker: 'Priya',
            right: "That's the record. What Dr Reid said, in her words, and the recall she decided.", // kept
            wrong: "The notes are what Dr Reid dictated, nothing added and nothing left out. The recall interval is her decision; you record it, you don't change it or add your own view.", // kept
          },
          present: { kind: 'paper', paper: 'notepaper', title: 'Clinical notes', open: 'Write the notes', heading: 'Amira - 09:00' }, // kept
        },
        {
          id: 'aftercare-eat',
          kind: 'choice',
          // TBC SME
          prompt: '"Can she eat when we get home?"',
          options: [
            { id: 'eat_now', label: 'She can eat straight away', reaction: { person: 'karim', state: 'worried', text: 'Karim looks worried by the advice.' } }, // kept
            { id: 'numb', label: 'No eating or hot drinks until the feeling comes back', reaction: { person: 'karim', state: 'reassured', text: 'Karim nods, reassured.' } }, // kept
          ],
          correct: 'numb', // kept from V1 answer set
          clause: 'Karim told when Amira can eat and drink',
          feedback: {
            speaker: 'Priya',
            right: "Those three, in plain words. If dad asks anything that isn't on the card, 'ask Dr Reid' is the right answer.", // kept
            wrong: "Two of those aren't true and one's a booking Dr Reid hasn't asked for. Aftercare is only ever what the dentist has said and what's on the card. If dad asks something not on it, 'ask Dr Reid' is the right answer.", // kept
          },
          present: { kind: 'speech' },
        },
        {
          id: 'aftercare-numb',
          kind: 'choice',
          // TBC SME
          prompt: '"It feels funny, she says — is that normal?"',
          after: 'aftercare-eat',
          options: [
            { id: 'brush', label: "Don't brush that side for a week", reaction: { person: 'karim', state: 'worried', text: 'Karim looks unsure about changing her brushing.' } }, // kept
            { id: 'bite', label: "Watch that she doesn't bite or chew her numb lip or cheek", reaction: { person: 'karim', state: 'reassured', text: 'Karim understands what to watch while she is numb.' } }, // kept
          ],
          correct: 'bite', // kept from V1 answer set
          clause: "Karim told to watch Amira's numb lip and cheek",
          feedback: {
            speaker: 'Priya',
            right: "Those three, in plain words. If dad asks anything that isn't on the card, 'ask Dr Reid' is the right answer.", // kept
            wrong: "Aftercare is only ever what the dentist has said and what's on the card. If dad asks something not on it, 'ask Dr Reid' is the right answer.", // kept
          },
          present: { kind: 'speech' },
        },
        {
          id: 'aftercare-pain',
          kind: 'choice',
          // TBC SME
          prompt: '"What if it hurts tonight?"',
          after: 'aftercare-numb',
          options: [
            { id: 'two_weeks', label: 'Come back in two weeks for a check', reaction: { person: 'karim', state: 'asking', text: 'Karim still needs to know when to call.' } }, // kept
            { id: 'high', label: 'If the filling feels high when she bites, ring us', reaction: { person: 'karim', state: 'leaving', text: 'Karim is reassured and ready to leave.' } }, // kept
          ],
          correct: 'high', // kept from V1 answer set
          clause: 'Karim told when to ring the practice',
          feedback: {
            speaker: 'Priya',
            right: "Those three, in plain words. If dad asks anything that isn't on the card, 'ask Dr Reid' is the right answer.", // kept
            wrong: "Aftercare is only ever what the dentist has said and what's on the card. If dad asks something not on it, 'ask Dr Reid' is the right answer.", // kept
          },
          present: { kind: 'speech' },
        },
        {
          id: 'sharps',
          kind: 'choice',
          prompt: 'Back in the surgery. The tray has the used instruments, but you cannot see the needle or the matrix band. What do you do?', // kept
          after: 'recall',
          options: [
            { id: 'search', label: 'Search the tray and the bib for the needle so you can put it in the sharps box' }, // kept
            { id: 'box', label: 'Assume they are among the instruments and put everything in the transport box' }, // kept
            { id: 'reid', label: 'Nothing. Dr Reid put them straight into the sharps container. You never handle a used needle' }, // kept
          ],
          correct: 'reid', // kept
          clause: 'Sharps left where Dr Reid put them, never handled', // kept
          feedback: {
            speaker: 'Priya',
            right: "Needle and matrix band went straight from Dr Reid's hand into the sharps box. That's hers, every time.", // kept
            wrong: "Needle and matrix band went straight from Dr Reid's hand into the sharps box, that's hers, every time. You never handle a used needle, and you never go looking for one.", // kept
          },
          present: { kind: 'speech' },
          revealsComplication: true,
        },
        {
          id: 'sam',
          kind: 'choice',
          prompt: 'A message from Sam: "09:40 has been waiting 10 mins. How long?" What do you reply?', // kept
          after: 'sharps',
          options: [
            { id: 'honest', label: '"Five minutes. Resetting now."' }, // kept
            { id: 'quick', label: '"Two minutes." Then skip the flush to make it true' }, // kept
            { id: 'ignore', label: "Don't reply. Every second counts" }, // kept
          ],
          correct: 'honest', // kept
          clause: 'Sam told how long, honestly, with no step skipped to make it true', // kept
          feedback: {
            speaker: 'Priya',
            right: "Good. She's got a patient asking her, and now she can answer him.", // kept
            wrong: "Tell Sam how long, honestly. She's got a patient asking her. And nobody in this practice will ever ask you to skip an infection control step to save time. If they did, you'd say no and tell me.", // kept
          },
          present: { kind: 'speech' },
        },
        {
          id: 'reset',
          kind: 'sequence',
          prompt: 'Reset Surgery 2 for the 09:40, then open the door for Priya to check the room.',
          context: 'The 09:40 is waiting. The clock never changes what is judged.',
          after: 'sam',
          options: [
            { id: 'wipe', label: 'Wipe surfaces from the top of the chair to the spittoon, then dirty zone to clean zone, and allow contact time' }, // kept
            { id: 'ppe', label: 'PPE on: gloves, apron, visor and mask' }, // kept
            { id: 'box', label: 'Clean gloves on, wipe every outside surface of the transport box' }, // kept
            { id: 'flush', label: 'Flush the water lines and handpiece tubing for 20 to 30 seconds' }, // kept
            { id: 'instruments', label: 'Used instruments into the rigid, closed transport box' }, // kept
            { id: 'doff', label: 'PPE off into clinical waste, wash or sanitise hands' }, // kept
            { id: 'tray', label: 'New tray for the 09:40 and complete the surgery check sheet' }, // kept
            { id: 'waste', label: 'Single-use items into clinical waste' }, // kept
            { id: 'aspirator', label: 'Flush the aspirator with water' }, // kept
            { id: 'gloves_off', label: 'Contaminated gloves off, into clinical waste' }, // kept
          ],
          // TBC SME (Q2): the safety pairs may become the only fixed part; until confirmed, keep the V1 full order.
          correct: ['ppe', 'instruments', 'waste', 'gloves_off', 'box', 'doff', 'wipe', 'flush', 'aspirator', 'tray'], // kept
          clause: 'Surgery 2 reset in order, no step skipped, check sheet completed', // kept
          feedback: {
            speaker: 'Priya',
            // TBC SME
            right: "Box wiped, lines flushed, sheet done — with someone waiting. That's the job on a normal Tuesday. Go and get the 09:40.",
            // TBC SME
            wrong: "Stop. [rule line]. Late is uncomfortable. A shortcut is something else.\n\nGloves off before you touch the outside of that box, otherwise the box is as dirty as what's in it. Dirty things leave first, then you clean, then you flush, and the tray and the sheet come last. Go again.", // V1 line kept after the new door line
          },
          present: {
            kind: 'turnaround',
            title: 'Turn around Surgery 2',
            open: 'Reset the room',
            picture: afterPatientBackdrop,
            start: 'Reset the room. Priya checks the routine when you open the door.',
            guideLabel: 'Reset the room',
            clockLabel: '09:40 has been waiting',
            controls: {
              ppe: { label: 'PPE station', spot: { x: 18, y: 31 }, kind: 'action', sound: 'tap' },
              instruments: { label: 'Close transport box', spot: { x: 76, y: 58 }, kind: 'action', sound: 'box-lid' },
              waste: { label: 'Clinical waste', spot: { x: 10, y: 72 }, kind: 'action', sound: 'tap' },
              gloves_off: { label: 'Gloves off', spot: { x: 30, y: 70 }, kind: 'action', sound: 'tap' },
              box: { label: 'Wipe transport box', spot: { x: 87, y: 66 }, kind: 'action', sound: 'wipe' },
              doff: { label: 'PPE off, clean hands', spot: { x: 20, y: 55 }, kind: 'action', sound: 'water-run' },
              flush: { label: 'Hold water-line flush', spot: { x: 84, y: 43 }, kind: 'hold', seconds: 1, sound: 'flush' },
              aspirator: { label: 'Hold aspirator flush', spot: { x: 69, y: 63 }, kind: 'hold', seconds: 1, sound: 'flush' },
              tray: { label: 'Fresh tray and check sheet', spot: { x: 89, y: 25 }, kind: 'action', sound: 'tap' },
            },
            wipe: {
              optionId: 'wipe',
              finish: 'Finish wipe path',
              zones: {
                headrest: { x: 30, y: 62, hint: 'Chair top' },
                light: { x: 55, y: 18, hint: 'Light' },
                delivery: { x: 82, y: 52, hint: 'Delivery unit' },
                spittoon: { x: 43, y: 61, hint: 'Spittoon' },
                surfaces: { x: 23, y: 46, hint: 'Work surfaces' },
                handles: { x: 11, y: 58, hint: 'Handles' },
              },
            },
            commit: { label: 'Open door for Priya', spot: { x: 9, y: 65 } },
          },
        },
      ],
    },
    {
      place: 'reception',
      people: ['amira', 'karim', 'receptionist'],
      eyebrow: 'Reception',
      title: 'Hand over to Sam',
      intro: 'You walk Amira and her dad out. Sam needs the recall note for the front desk.', // kept
      cast: {
        amira: { initial: 'thumbs-up', states: AMIRA_STATES },
        karim: { initial: 'leaving', states: KARIM_STATES },
      },
      decisions: [{
        id: 'recall',
        kind: 'choice',
        prompt: 'Fill in the recall slip for Sam.', // kept
        after: 'aftercare-pain',
        options: [
          { id: 'two_weeks', label: 'Two weeks, check the filling. Note: first filling' }, // kept
          { id: 'six_months', label: 'Six months, check-up. Note: nervous, went well with the hand signal', reaction: { person: 'karim', state: 'leaving', text: 'Karim and Amira are ready to leave.' } }, // kept
          { id: 'difficult', label: 'Six months, check-up. Note: difficult child, allow extra time' }, // kept
        ],
        correct: 'six_months', // kept
        clause: 'Recall note handed to reception with the interval Dr Reid set', // kept
        feedback: {
          speaker: 'Priya',
          right: "Six months, as Dr Reid said, and the note tells whoever sees her next what actually worked.", // kept
          wrong: "The interval is Dr Reid's: six months. And the note is for the next nurse who meets her. 'Nervous, went well with the hand signal' tells them what to do. Anything else is either wrong or unkind.", // kept
        },
        present: { kind: 'speech' },
      }],
    },
  ],
};