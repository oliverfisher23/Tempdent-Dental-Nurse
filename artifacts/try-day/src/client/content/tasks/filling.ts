import type { TaskContent } from './types';

// Storyboard Task 3. Clinical detail is draft, pending SME validation.
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
      eyebrow: 'Surgery 2',
      title: 'Support the filling',
      intro: 'Dr Reid has explained the filling and agreed the hand-up signal. Dad is on the stool by the door where Amira can see him. The tray you set up is beside you. The strip on the wall reads: numb the tooth, keep it dry, remove the decay, etch, bond, place the composite in layers with the band on first, set it with the blue light, check the bite and polish.',
      decisions: [
        {
          id: 'la',
          kind: 'choice',
          prompt: 'Dr Reid reaches for the local anaesthetic. Do you pick it up to help?',
          options: [
            { id: 'pass', label: 'Yes. Pass her the syringe handle first' },
            { id: 'load', label: 'Yes. Load the cartridge and needle so it is ready' },
            { id: 'leave', label: 'No. The syringe and needle are hers, tray to sharps box. Have the cotton rolls ready instead' },
          ],
          correct: 'leave',
          clause: 'Local anaesthetic and needle left to Dr Reid',
          feedback: {
            speaker: 'Priya',
            right: "Proactive is having the next thing ready, not doing her job. That needle is hers from the tray to the sharps box.",
            wrong: "Being ahead of Dr Reid never means touching the needle. That's hers from the tray to the sharps box. Proactive is having the next thing ready, not doing her job.",
          },
        },
        {
          id: 'suction',
          kind: 'choice',
          prompt: 'Dr Reid starts to remove the decay. Where do you hold the suction?',
          context: 'The handpiece sprays water. Amira is lying back with her mouth open.',
          options: [
            { id: 'front', label: 'Resting at the front of the mouth, out of the way' },
            { id: 'mirror', label: 'Right over the tooth, in front of the mirror, to catch everything' },
            { id: 'near', label: 'Near the tooth, clearing the spray and holding the cheek away, without blocking the mirror' },
          ],
          correct: 'near',
          clause: 'Suction placed near the tooth, cheek held clear, mirror unobstructed',
          feedback: {
            speaker: 'Priya',
            right: 'Two jobs with that tip, both done: the water is going, and Dr Reid can see.',
            wrong: "You've two jobs with that tip: clear the water so Amira isn't swallowing it, and keep the cheek and tongue out of the way. Both happen near the tooth, and never between Dr Reid's mirror and what she's looking at.",
          },
        },
        {
          id: 'next',
          kind: 'sequence',
          prompt: 'Have the next item ready before Dr Reid asks. Tap the four items in the order she will need them.',
          context: 'Dr Reid, as she works: "Decay\'s out." "Etch is rinsed off." "Band\'s on." "Last layer\'s set."',
          options: [
            { id: 'composite', label: 'Composite' },
            { id: 'etchant', label: 'Etchant' },
            { id: 'paper', label: 'Articulating paper' },
            { id: 'light', label: 'Curing light' },
            { id: 'bond', label: 'Bonding agent' },
            { id: 'forceps', label: 'Extraction forceps' },
          ],
          correct: ['etchant', 'bond', 'composite', 'paper'],
          clause: 'All four next-item prompts answered in order',
          feedback: {
            speaker: 'Priya',
            right: 'Etch, bond, composite, then the paper to check the bite. You were ahead of her.',
            wrong: "Bond before composite, the filling's got nothing to hold on to otherwise. Look at the strip on the wall: what's just finished, then what's next? It's there so you don't have to remember it yet. Go again.",
          },
        },
        {
          id: 'transfer',
          kind: 'choice',
          prompt: 'Dr Reid holds her hand out without looking away from the tooth. How do you pass the instrument?',
          options: [
            { id: 'face', label: 'Straight across, over Amira\'s face, so Dr Reid can see it coming' },
            { id: 'tray', label: 'Put it down on the tray for Dr Reid to pick up' },
            { id: 'chin', label: 'Below Amira\'s chin, handle towards Dr Reid\'s hand, out of Amira\'s sight' },
          ],
          correct: 'chin',
          clause: 'Instrument passed below the chin, handle first',
          feedback: {
            speaker: 'Priya',
            right: 'Below the chin, handle first, and she never had to look away from the tooth.',
            wrong: "Nothing passes over the patient's face. She'll flinch, and if it slipped it would land on her. Below the chin, handle towards Dr Reid's hand, and she never has to look away from the tooth.",
          },
          revealsComplication: true,
        },
        {
          id: 'signal',
          kind: 'choice',
          prompt: "The handpiece is running and water is collecting. Amira's hand lifts from the armrest. What do you do?",
          after: 'transfer',
          options: [
            { id: 'still', label: 'Tell Amira to keep still, it is nearly done' },
            { id: 'carry_on', label: 'Carry on with the suction. Dr Reid will see it' },
            { id: 'ask', label: 'Ask Amira what is wrong while the handpiece runs' },
            { id: 'say', label: 'Say it out loud, now: "Dr Reid, Amira\'s hand is up."' },
          ],
          correct: 'say',
          clause: 'Hand signal reported to Dr Reid immediately',
          feedback: {
            speaker: 'Dr Reid',
            right: "Stopping. Amira, what is it? Okay. Suction to the back for me. Amira, well done for telling us.",
            wrong: "I need you to be my eyes on Amira. If her hand goes up, you tell me before I've seen it. The signal only works if it's honoured instantly. If a child learns it doesn't work, we lose her for every appointment after this.",
          },
        },
        {
          id: 'restart',
          kind: 'choice',
          prompt: 'Dr Reid has stopped. Amira says the water was going down her throat. What now?',
          after: 'signal',
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
            wrong: "Sleeve every time, it's been in someone else's mouth otherwise. And the shield's for your eyes and Amira's dad's as much as anyone's. Nobody looks straight at that blue light.",
          },
        },
      ],
    },
  ],
};
