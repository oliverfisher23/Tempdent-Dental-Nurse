import type { TaskContent } from './types';
import fieldDry from '@client/assets/closeups/field-dry.jpg';
import fieldPooling from '@client/assets/closeups/field-pooling.jpg';
import fieldFlooded from '@client/assets/closeups/field-flooded.jpg';
import amiraBraced from '@client/assets/people/states/amira-braced.jpg';
import amiraHandUp from '@client/assets/people/states/amira-hand-up.jpg';
import amiraSettled from '@client/assets/people/states/amira-settled.jpg';
import reidWorking from '@client/assets/people/states/reid-working.jpg';
import reidLookingUp from '@client/assets/people/states/reid-looking-up.jpg';
import reidWaiting from '@client/assets/people/states/reid-waiting.jpg';
import reidNod from '@client/assets/people/states/reid-nod.jpg';
import bondImage from '@client/assets/items/bond.png';
import compositeImage from '@client/assets/items/composite.png';
import matrixImage from '@client/assets/items/matrix.png';
import curingLightImage from '@client/assets/items/curing-light.png';
import shieldImage from '@client/assets/items/glasses.png';
import forcepsImage from '@client/assets/items/forceps.png';
import paperImage from '@client/assets/items/plastic.png';

export const FILLING_TASK: TaskContent = {
  id: 'filling',
  dialogue: {
    speaker: 'Dr Reid',
    text: "Right, Amira, hand up and I stop. You're on suction and you're on Amira. Watch her face more than you watch me.",
  },
  signOff: {
    speaker: 'Dr Reid',
    text: "Bite's good. Amira, you were brilliant, and the hand signal did exactly what it's meant to. Thanks, you were ahead of me on the light.",
  },
  scenes: [
    {
      place: 'surgery2',
      people: ['dentist', 'amira'],
      eyebrow: 'Surgery 2',
      title: 'Support the filling',
      intro: 'Keep the field clear, have the next thing ready before Dr Reid asks for it, and be her eyes on Amira. Nothing here is yours to decide; everything here is yours to notice.',
      opening: {
        speaker: 'Dr Reid',
        text: 'Dr Reid has explained the filling and agreed the hand-up signal. Dad is on the stool by the door where Amira can see him. The tray you set up is beside you.',
        seconds: 6,
      },
      cast: {
        dentist: {
          name: 'Dr Reid',
          initial: 'working',
          states: {
            working: { image: reidWorking, alt: 'Dr Reid’s gloved hands are working over the field.' },
            looking: { image: reidLookingUp, alt: 'Dr Reid’s open gloved hand is ready to receive an item.' },
            waiting: { image: reidWaiting, alt: 'Dr Reid’s gloved hands are paused safely over the field.' },
            nod: { image: reidNod, alt: 'Dr Reid gives a clear thumbs-up beside the field.' },
          },
        },
        amira: {
          name: 'Amira',
          initial: 'braced',
          states: {
            braced: { image: amiraBraced, alt: 'Amira is gripping both chair armrests.' },
            handUp: { image: amiraHandUp, alt: 'Amira has lifted one hand from the armrest.' },
            settled: { image: amiraSettled, alt: 'Amira is settled with her shoulders lowered.' },
          },
        },
      },
      // TBC SME
      debrief: {
        speaker: 'Priya',
        text: "You spoke up the second her hand moved. That's the one I'd have wanted.",
      },
      decisions: [
        {
          id: 'la',
          kind: 'choice',
          prompt: 'Dr Reid reaches for the local anaesthetic. Do you pick it up to help?',
          options: [
            { id: 'pass', label: 'Yes. Pass her the syringe handle first', reaction: { person: 'dentist', state: 'waiting', text: 'Dr Reid pauses with her hands safely away from the offered syringe.' } },
            { id: 'load', label: 'Yes. Load the cartridge and needle so it is ready', reaction: { person: 'dentist', state: 'waiting', text: 'Dr Reid pauses while the unsafe offer is corrected.' } },
            { id: 'leave', label: 'No. The syringe and needle are hers, tray to sharps box. Have the cotton rolls ready instead', reaction: { person: 'dentist', state: 'working', text: 'Dr Reid keeps control of the local anaesthetic while you remain ready on suction.' } },
          ],
          correct: 'leave',
          clause: 'Local anaesthetic and needle left to Dr Reid',
          feedback: {
            speaker: 'Priya',
            right: "Proactive is having the next thing ready, not doing her job. That needle is hers from the tray to the sharps box.",
            wrong: "Being ahead of Dr Reid never means touching the needle. That's hers from the tray to the sharps box. Proactive is having the next thing ready, not doing her job.",
          },
          present: { kind: 'speech' },
        },
        {
          id: 'next',
          kind: 'sequence',
          prompt: 'Keep the field clear, read Dr Reid’s tells and pass each item she asks for.',
          context: 'The treatment-stage strip is available to read before you start. During treatment, follow Dr Reid’s named cues rather than making a clinical decision.',
          options: [
            { id: 'paper', label: 'Articulating paper' },
            { id: 'composite', label: 'Composite' },
            { id: 'etchant', label: 'Etchant' },
            { id: 'light', label: 'Sleeved curing light' },
            { id: 'matrix', label: 'Matrix band' },
            { id: 'bond', label: 'Bonding agent' },
          ],
          // TBC SME (Q1)
          correct: ['etchant', 'bond', 'composite', 'matrix', 'light', 'paper'],
          clause: 'All six named items passed in Dr Reid’s cue order',
          feedback: {
            speaker: 'Priya',
            right: 'You stayed with Dr Reid’s rhythm and passed what she named.',
            wrong: 'Watch her open hand and listen to the item she names. Put an unsuitable item back and respond to the cue in front of you.',
          },
          present: {
            kind: 'paced',
            title: 'Four hands',
            open: 'Join Dr Reid',
            picture: fieldDry,
            segment: {
              decisions: ['next', 'suction', 'transfer', 'signal', 'light'],
              seconds: 90,
              tellSeconds: 2,
              // TBC SME
              before: "From here it's her rhythm, not yours. Watch her hands; the tell comes before the ask. And watch Amira — if her hand goes up, you say so before I do.",
              // TBC SME
              early: 'Ahead of me — good.',
              // TBC SME
              wrongItem: 'Not that one — bond.',
              // TBC SME
              debrief: {
                none: "I didn't look up once. That's four-handed dentistry, and you've been here three weeks.",
                some: 'Twice I had to look up. Next time, watch my hand rather than the tray — it tells you first.',
                more: "I had to look up a few times, and that's fine — nobody gets the rhythm in week three. Play it again and watch my hand, not the tray.",
                after: "You spoke up the second her hand moved. That's the one I'd have wanted.",
              },
              items: {
                etchant: { label: 'Etchant', image: bondImage },
                bond: { label: 'Bonding agent', image: bondImage },
                composite: { label: 'Composite', image: compositeImage },
                matrix: { label: 'Matrix band', image: matrixImage },
                light: { label: 'Sleeved curing light', image: curingLightImage },
                shield: { label: 'Orange shield', image: shieldImage },
                paper: { label: 'Articulating paper', image: paperImage },
                forceps: { label: 'Extraction forceps', image: forcepsImage },
                bare: { label: 'Unsleeved curing light', image: curingLightImage },
              },
              // TBC SME (Q1)
              cues: [
                { decision: 'next', option: 'etchant', label: 'Etch.', at: 12, tell: 'Dr Reid glances towards the tray.', cue: 'Etch.', offer: ['forceps', 'etchant', 'composite'] },
                { decision: 'next', option: 'bond', label: 'Bond.', at: 24, tell: 'Dr Reid opens her hand below Amira’s chin.', cue: 'Bond.', offer: ['composite', 'bond', 'forceps'] },
                { decision: 'next', option: 'composite', label: 'Composite.', at: 36, tell: 'Dr Reid’s open hand turns towards the tray.', cue: 'Composite.', offer: ['matrix', 'composite', 'bond'], sound: 'handpiece' },
                { decision: 'next', option: 'matrix', label: 'Band.', at: 50, tell: 'Dr Reid pauses with her hand open.', cue: 'Band.', offer: ['paper', 'matrix', 'forceps'] },
                { decision: 'next', option: 'light', label: 'Light.', at: 66, tell: 'Dr Reid looks towards the curing light.', cue: 'Light.', offer: ['bare', 'light', 'forceps'], sound: 'curing-light' },
                { decision: 'next', option: 'paper', label: 'Paper.', at: 82, tell: 'Dr Reid opens her hand once more.', cue: 'Paper.', offer: ['matrix', 'paper', 'forceps'] },
              ],
              speakUp: { decision: 'signal', option: 'say', missedOption: 'carry_on', at: 44, window: 3, label: 'Speak up' },
              live: {
                decision: 'suction',
                label: 'Suction tip',
                zones: {
                  front: { x: 20, y: 62, hint: 'Front of mouth' },
                  mirror: { x: 72, y: 44, hint: 'Across mirror' },
                  near: { x: 46, y: 67, hint: 'Near the tooth' },
                },
              },
              field: {
                image: fieldDry,
                alt: 'Close-up of the working field.',
                states: {
                  near: { image: fieldDry, alt: 'The field is clear and dry, with the mirror unobstructed.' },
                  front: { image: fieldPooling, alt: 'Water is pooling at the back while the suction sits too far forward.' },
                  mirror: { image: fieldFlooded, alt: 'Spray floods the field and the mirror is obscured.' },
                },
              },
              // TBC SME
              fetch: {
                item: 'matrix',
                label: 'Fetch a band from the drawer',
                aside: "That's why the tray is built before she sits down. Ten seconds for you, a lifetime for Amira.",
              },
            },
          },
        },
        {
          id: 'suction',
          kind: 'choice',
          prompt: 'Dr Reid starts to remove the decay. Where do you hold the suction?',
          options: [
            { id: 'front', label: 'Resting at the front of the mouth, out of the way', reaction: { person: 'dentist', state: 'waiting', text: 'Dr Reid pauses while water pools at the back.' } },
            { id: 'mirror', label: 'Right over the tooth, in front of the mirror, to catch everything', reaction: { person: 'dentist', state: 'looking', text: 'Dr Reid looks up because the suction obscures her mirror.' } },
            { id: 'near', label: 'Near the tooth, clearing the spray and holding the cheek away, without blocking the mirror', reaction: { person: 'dentist', state: 'nod', text: 'Dr Reid nods as the field clears.' } },
          ],
          correct: 'near',
          clause: 'Suction placed near the tooth, cheek held clear, mirror unobstructed',
          feedback: {
            speaker: 'Priya',
            right: 'Two jobs with that tip, both done: the water is going, and Dr Reid can see.',
            wrong: "You've two jobs with that tip: clear the water so Amira isn't swallowing it, and keep the cheek and tongue out of the way. Keep the mirror's view clear.",
          },
          after: 'next',
          present: { kind: 'speech' },
        },
        {
          id: 'transfer',
          kind: 'choice',
          prompt: 'How did each item reach Dr Reid’s hand?',
          options: [
            { id: 'face', label: 'Straight across, over Amira\'s face, so Dr Reid can see it coming', reaction: { person: 'dentist', state: 'waiting', text: 'Dr Reid pauses the unsafe pass.' } },
            { id: 'tray', label: 'Put it down on the tray for Dr Reid to pick up', reaction: { person: 'dentist', state: 'looking', text: 'Dr Reid has to look away from the field towards the tray.' } },
            { id: 'chin', label: 'Below Amira\'s chin, handle towards Dr Reid\'s hand, out of Amira\'s sight', reaction: { person: 'dentist', state: 'nod', text: 'Dr Reid receives the item below Amira’s chin without looking away.' } },
          ],
          correct: 'chin',
          clause: 'Instrument passed below the chin, handle first',
          feedback: {
            speaker: 'Priya',
            right: 'Below the chin, handle first, and she never had to look away from the tooth.',
            wrong: "Nothing passes over the patient's face. Keep the pass below the chin, handle towards Dr Reid's hand, so she can stay with the tooth.",
          },
          after: 'next',
          present: { kind: 'speech' },
          revealsComplication: true,
        },
        {
          id: 'signal',
          kind: 'choice',
          prompt: "The handpiece is running and water is collecting. Amira's hand lifts from the armrest. What do you do?",
          options: [
            { id: 'still', label: 'Tell Amira to keep still, it is nearly done', reaction: { person: 'amira', state: 'handUp', text: 'Amira keeps her agreed stop-signal hand raised.' } },
            { id: 'carry_on', label: 'Carry on with the suction. Dr Reid will see it', reaction: { person: 'amira', state: 'handUp', text: 'Amira keeps her agreed stop-signal hand raised.' } },
            { id: 'ask', label: 'Ask Amira what is wrong while the handpiece runs', reaction: { person: 'amira', state: 'handUp', text: 'Amira keeps her hand raised while the handpiece is still running.' } },
            { id: 'say', label: 'Say it out loud, now: "Dr Reid, Amira\'s hand is up."', reaction: { person: 'amira', state: 'settled', text: 'Amira settles as Dr Reid honours her stop signal.' } },
          ],
          correct: 'say',
          clause: 'Hand signal reported to Dr Reid immediately',
          feedback: {
            speaker: 'Dr Reid',
            right: "Stopping. Amira, what is it? Okay. Suction to the back for me. Amira, well done for telling us.",
            wrong: "I need you to be my eyes on Amira. If her hand goes up, you tell me before I've seen it. The signal only works if it's honoured instantly. If a child learns it doesn't work, we lose her for every appointment after this.",
          },
          noticed: { value: 'Amira used her agreed hand-up stop signal during treatment.', when: 'answered' },
          after: 'next',
          present: { kind: 'speech' },
        },
        {
          id: 'light',
          kind: 'checklist',
          prompt: 'Dr Reid says "light". Tick what you pick up.',
          options: [
            { id: 'sleeved', label: 'The curing light with its barrier sleeve on' },
            { id: 'bare', label: 'The curing light without the sleeve. It is quicker' },
            { id: 'shield', label: 'The orange shield' },
            { id: 'glasses', label: 'A spare pair of safety glasses for Dr Reid' },
          ],
          correct: ['sleeved', 'shield'],
          clause: 'Curing light passed sleeved, with the shield',
          feedback: {
            speaker: 'Priya',
            right: 'Sleeved, and the shield up. Nobody looks straight at that blue light.',
            wrong: "Protect the light from contamination and protect everyone's eyes before it runs. Dr Reid waits until both are in place.",
          },
          after: 'next',
          present: { kind: 'speech' },
        },
        {
          id: 'restart',
          kind: 'choice',
          prompt: 'Dr Reid has stopped. Amira says the water was going down her throat. What now?',
          after: 'next',
          options: [
            { id: 'clear', label: 'Move the suction to the back to clear the pooled water, tell Amira "well done for telling us", and wait for Dr Reid to decide when to restart' },
            { id: 'restart', label: 'Tell Dr Reid it is fine to carry on, the water is gone' },
            { id: 'swallow', label: 'Take the suction out and tell Amira to swallow and sit up' },
          ],
          correct: 'clear',
          clause: 'After the stop: suction adjusted, Amira reassured, restart left to Dr Reid',
          feedback: {
            speaker: 'Dr Reid',
            right: 'Ready when you are, Amira. Not before.',
            wrong: "Clear the water, one line to Amira, and then it's my call when we go again, after I've checked with her. You don't decide whether we continue.",
          },
          present: { kind: 'speech' },
        },
      ],
    },
  ],
};