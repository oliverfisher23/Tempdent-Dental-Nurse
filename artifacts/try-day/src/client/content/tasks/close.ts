import type { TaskContent } from './types';
import grahamWaiting from '@client/assets/people/states/graham-waiting.jpg';
import grahamGuarded from '@client/assets/people/states/graham-guarded.jpg';
import grahamEasing from '@client/assets/people/states/graham-easing.jpg';
import grahamBreathing from '@client/assets/people/states/graham-breathing.jpg';
import grahamRelieved from '@client/assets/people/states/graham-relieved.jpg';
import grahamOutside from '@client/assets/people/states/graham-outside.jpg';
import grahamTalking from '@client/assets/people/states/graham-talking.jpg';

const GRAHAM_STATES = {
  waiting: { image: grahamWaiting, alt: 'Graham sits rigidly at the edge of a waiting-room chair.' },
  guarded: { image: grahamGuarded, alt: 'Graham sits upright with his arms folded.' },
  easing: { image: grahamEasing, alt: 'Graham uncrosses his arms and begins to relax.' },
  breathing: { image: grahamBreathing, alt: 'Graham closes his eyes and breathes slowly.' },
  relieved: { image: grahamRelieved, alt: 'Graham looks relieved after the examination.' },
  outside: { image: grahamOutside, alt: 'Graham takes a private moment in the corridor.' },
  talking: { image: grahamTalking, alt: 'Graham talks openly from the dental chair.' },
};

// Storyboard Task 6. Clinical detail is draft, pending SME validation.
export const CLOSE_TASK: TaskContent = {
  id: 'close',
  dialogue: {
    speaker: 'Priya',
    text: "This one's yours. He asked to be collected, he wants to talk first, and he hasn't been in a chair for ten years. Slow down, use his name, and give him the controls. I'm right here.",
  },
  signOff: {
    speaker: 'Priya',
    text: "Aspirator's had its disinfectant, sheets are signed, and that's a handover I could actually use tomorrow. That's your day.",
  },
  scenes: [
    {
      place: 'reception',
      people: ['graham', 'receptionist'],
      eyebrow: 'Waiting room',
      title: 'Collect Graham',
      intro: 'Graham Ellis (54) is a new patient. His notes: extremely anxious, no dentist in over ten years, bad experience as a teenager, asked for a nurse to come and get him, wants to talk first. Sam says he has been here 15 minutes and stepped outside once.',
      // TBC SME
      opening: { speaker: 'Priya', text: 'He asked to be collected. Think about where you stand before you think about what you say.', seconds: 5 },
      cast: { graham: { initial: 'waiting', states: GRAHAM_STATES } },
      decisions: [
        {
          id: 'position',
          kind: 'choice',
          prompt: 'Where do you go before you speak to Graham?',
          options: [
            { id: 'front', label: 'Stand directly in front of him', reaction: { person: 'graham', state: 'guarded', text: 'Graham looks up, still guarded.' } },
            { id: 'beside', label: 'Sit in the chair beside him', reaction: { person: 'graham', state: 'easing', text: 'Graham turns towards you and begins to ease.' } },
            { id: 'door', label: 'Stay at the surgery door', reaction: { person: 'graham', state: 'waiting', text: 'Graham stays rigid on the edge of his chair.' } },
          ],
          correct: 'beside',
          clause: 'Graham approached from the chair beside him',
          feedback: {
            speaker: 'Priya',
            right: 'You went to him rather than calling him across the room.',
            wrong: "He asked to be collected because being called is part of what frightens him. Go to him. Low voice, his name, and the one thing he needs to hear: that he's in control of what happens. And never mention the gap. He knows exactly how long it's been.",
          },
          present: {
            kind: 'hotspots',
            spots: {
              front: { x: 55, y: 55, hint: 'In front' },
              beside: { x: 28, y: 62, hint: 'Chair beside him' },
              door: { x: 88, y: 52, hint: 'Surgery door' },
            },
          },
        },
        {
          id: 'approach',
          kind: 'choice',
          prompt: 'How do you approach Graham?',
          after: 'position',
          options: [
            { id: 'door', label: 'From the surgery door: "Graham Ellis? New patient exam?"', reaction: { person: 'graham', state: 'waiting', text: 'Graham stays braced at being called across the room.' } },
            { id: 'beside', label: 'Sit beside him, quietly: "Graham? I\'m one of the dental nurses. There\'s no rush at all. When you\'re ready, we\'ll go through and just have a chat with Dr Reid first. Nothing happens today that you haven\'t agreed to."', reaction: { person: 'graham', state: 'easing', text: 'Graham looks up and his shoulders begin to lower.' } },
            { id: 'brisk', label: 'Standing in front of him: "Come on, it\'s only a check-up."', reaction: { person: 'graham', state: 'guarded', text: 'Graham folds his arms and stays guarded.' } },
            { id: 'gap', label: 'Sit beside him: "Ten years is a long time! Don\'t worry, we see it all the time."', reaction: { person: 'graham', state: 'guarded', text: 'Graham stiffens when the gap is mentioned.' } },
          ],
          correct: 'beside',
          clause: 'Graham approached by name, with a line that gives him control',
          feedback: {
            speaker: 'Priya',
            right: 'Low voice, his name, and the one thing he needed to hear: that he is in control of what happens.',
            wrong: "He asked to be collected because being called is part of what frightens him. Go to him. Low voice, his name, and the one thing he needs to hear: that he's in control of what happens. And never mention the gap. He knows exactly how long it's been.",
          },
          present: { kind: 'speech' },
        },
      ],
    },
    {
      place: 'surgery2',
      people: ['graham', 'dentist'],
      eyebrow: 'Surgery 2',
      title: "Graham's examination, then close down",
      intro: 'Graham is in the surgery, sitting forward in the chair. Dr Reid waits for you to settle him. The plain-words examination card is on the worktop.',
      opening: { speaker: 'Priya', text: "Slow down, use his name, and give him the controls. I'm right here.", seconds: 5 },
      cast: { graham: { initial: 'guarded', states: GRAHAM_STATES } },
      // TBC SME
      debrief: { speaker: 'Priya', text: "He said nobody had ever asked him where he wanted to sit. You did. And the handover's the one thing you'll do today that tomorrow's team will actually read." },
      decisions: [
        {
          id: 'offers',
          kind: 'checklist',
          prompt: 'Respond to Graham at each of the three moments.',
          after: 'approach',
          options: [
            { id: 'upright', label: 'The chair stays upright to start', reaction: { person: 'graham', state: 'easing', text: 'Graham eases as the chair stays upright.' } },
            { id: 'long_time', label: '"It\'s been a long time!"', reaction: { person: 'graham', state: 'guarded', text: 'Graham stiffens when the time away is mentioned.' } },
            { id: 'signal', label: 'Agree the hand-up stop signal', reaction: { person: 'graham', state: 'easing', text: 'Graham practises the stop signal.' } },
            { id: 'nothing_to_worry', label: '"You\'ve nothing to worry about"', reaction: { person: 'graham', state: 'guarded', text: 'Graham stays guarded after the reassurance.' } },
            { id: 'explain', label: 'Explain the exam in plain words: a small mirror, a thin instrument, counting and noting, and any X-rays only with his agreement', reaction: { person: 'graham', state: 'talking', text: 'Graham asks questions as the examination is explained.' } },
            { id: 'guess', label: '"You\'ll probably only need a couple of fillings"', reaction: { person: 'graham', state: 'guarded', text: 'Graham folds his arms at the clinical guess.' } },
          ],
          correct: ['upright', 'signal', 'explain'],
          clause: 'Three appropriate things offered before the exam: control and information',
          feedback: {
            speaker: 'Priya',
            right: 'Control and information. That is what calms people.',
            wrong: "Never mention the time away, he's counting it already. You can't promise there's nothing to worry about, and you certainly can't guess what he'll need. You don't know, and he knows you don't. Offer him control and information. That's what calms people.",
          },
          present: {
            kind: 'offers',
            title: 'Three offers',
            open: 'Talk with Graham',
            moments: [
              // TBC SME
              { id: 'chair', line: "Do I have to lie back? I don't like lying back.", optionIds: ['upright', 'nothing_to_worry'] },
              { id: 'signal', line: 'What if I need you to stop?', optionIds: ['signal', 'long_time'] },
              { id: 'exam', line: "I don't even know what she's going to do.", optionIds: ['explain', 'guess', 'nothing_to_worry'] },
            ],
          },
        },
        {
          id: 'howbad',
          kind: 'choice',
          prompt: 'Graham says: "I know they\'re a mess. Go on, tell me how bad it is."',
          after: 'offers',
          options: [
            { id: 'not_bad', label: '"Oh, they\'re not that bad."', reaction: { person: 'graham', state: 'guarded', text: 'Graham stays guarded by the false reassurance.' } },
            { id: 'courage', label: '"You\'ve done the hard part, you\'re here. Dr Reid will have a look and talk you through what she sees, and we go at your pace."', reaction: { person: 'graham', state: 'easing', text: 'Graham uncrosses his arms as his courage is acknowledged.' } },
            { id: 'ten_years', label: '"Well, ten years is a long time."', reaction: { person: 'graham', state: 'guarded', text: 'Graham stiffens at the reference to ten years.' } },
            { id: 'silence', label: 'Say nothing and carry on setting up', reaction: { person: 'graham', state: 'guarded', text: 'Graham waits without an answer.' } },
          ],
          correct: 'courage',
          clause: "Graham's question answered without judgement or false reassurance",
          feedback: {
            speaker: 'Priya',
            right: 'You acknowledged the courage and handed the assessment to the dentist. Exactly that.',
            wrong: "Two traps. You don't know how his teeth are, so don't reassure him about them; that's Dr Reid's to say. And never, ever comment on the gap. Acknowledge the courage and hand the assessment to the dentist.",
          },
          present: { kind: 'speech' },
          revealsComplication: true,
        },
        {
          id: 'minute',
          kind: 'choice',
          prompt: 'As Dr Reid reaches for the mirror, Graham sits up: "Sorry. I need a minute outside." He stands. What do you do?',
          after: 'howbad',
          options: [
            { id: 'persuade', label: '"You\'re nearly there, let\'s just get it done." Stay between him and the door', reaction: { person: 'graham', state: 'guarded', text: 'Graham stands, blocked from the door.' } },
            { id: 'follow', label: 'Follow him out to talk him back in', reaction: { person: 'graham', state: 'outside', text: 'Graham cannot take the private minute he asked for.' } },
            // TBC SME
            { id: 'let_go', label: 'Let him go. Tell him the door is open, nobody minds, and to come back when he is ready. Tell Dr Reid. When he returns, thank him for coming back', reaction: { person: 'graham', state: 'easing', text: 'Graham says, “Sorry about that.” You say, “Thank you for coming back in. Where do you want to start?”' } },
          ],
          correct: 'let_go',
          clause: 'Graham given his minute, the door left open, Dr Reid told',
          feedback: {
            speaker: 'Priya',
            right: 'He said a minute; you gave him the minute. And "thank you for coming back", not "are you okay now?".',
            wrong: "Let him go. He said a minute, give him the minute. The door's open, and when he comes back you'll say thank you, not 'are you okay now?'.",
          },
          noticed: { value: 'Graham needed a minute outside; came back', when: 'right' },
          present: { kind: 'speech' },
        },
        {
          id: 'distress',
          kind: 'choice',
          prompt: 'Graham is back and the exam is under way. His grip tightens and his breathing quickens. What do you do?',
          after: 'minute',
          options: [
            { id: 'relax', label: '"Nearly done, just relax."', reaction: { person: 'graham', state: 'guarded', text: 'Graham grips the armrest more tightly.' } },
            { id: 'tell', label: 'Tell Dr Reid quietly and suggest a pause, then a calm line to Graham', reaction: { person: 'graham', state: 'easing', text: 'Dr Reid pauses and Graham begins to ease.' } },
            { id: 'carry_on', label: 'Carry on. Stopping will only make it longer', reaction: { person: 'graham', state: 'guarded', text: 'Graham continues breathing quickly.' } },
            { id: 'breathe', label: 'Ask him to breathe with you and tell Dr Reid', reaction: { person: 'graham', state: 'breathing', text: 'Dr Reid pauses and Graham breathes slowly with you.' } },
          ],
          correct: ['tell', 'breathe'],
          clause: "Graham's distress during the exam reported to Dr Reid",
          feedback: {
            speaker: 'Priya',
            right: 'You said it, she paused, he breathed. Same rule as Amira this morning, different patient.',
            wrong: "'Just relax' has never relaxed anyone. You're the one watching him. Say it to Dr Reid, she pauses, he breathes. Same rule as Amira this morning, different patient.",
          },
          present: {
            kind: 'paced',
            title: 'Watch Graham',
            open: 'Watch the examination',
            segment: {
              decisions: ['distress'],
              seconds: 12,
              tellSeconds: 3,
              cues: [],
              speakUp: { decision: 'distress', option: 'breathe', at: 6, window: 6, label: 'Speak up' },
            },
          },
        },
        {
          id: 'note',
          kind: 'choice',
          prompt: 'Dr Reid dictates: "Full charting done. Patient anxious; managed well with two pauses. Options discussed." Which anxiety note do you write?',
          after: 'distress',
          options: [
            { id: 'judgemental', label: '"Very nervous, hadn\'t been in ten years, teeth in a bad way."', reaction: { person: 'graham', state: 'guarded', text: 'The note judges Graham rather than recording what helps.' } },
            { id: 'factual', label: '"Patient anxious. Prefers to be collected by a nurse, to talk before treatment, chair upright to start, hand-up signal agreed. Two pauses during exam, coped well."', reaction: { person: 'graham', state: 'relieved', text: 'The record captures what will help Graham next time.' } },
            { id: 'fine', label: '"Fine."', reaction: { person: 'graham', state: 'guarded', text: 'The note gives the next nurse nothing useful.' } },
          ],
          correct: 'factual',
          clause: 'The factual, respectful note is on the record',
          feedback: {
            speaker: 'Priya',
            right: 'The next nurse who meets Graham will read that and know exactly what helps him.',
            wrong: "The next nurse who meets Graham will read this. Tell them what helps him: collected, talk first, chair up, signal agreed, two pauses, coped. Not what you think of his teeth. That's not yours to write, and he'd be mortified to read it.",
          },
          present: { kind: 'speech' },
        },
        {
          id: 'slip',
          kind: 'choice',
          prompt: 'Dr Reid: "Next visit: hygiene appointment and treatment plan discussion, forty minutes, nurse to collect from the waiting room. Recall to be set at the next visit." Fill in the booking slip for Sam.',
          after: 'note',
          options: [
            { id: 'short', label: 'Twenty minutes, check-up. Recall six months', reaction: { person: 'graham', state: 'guarded', text: 'The booking does not preserve what Graham needs.' } },
            { id: 'complete', label: 'Forty minutes, hygiene and treatment plan discussion. Nurse to collect from the waiting room. Recall to be set next visit', reaction: { person: 'graham', state: 'relieved', text: 'Graham’s next visit keeps the support that helped today.' } },
            { id: 'label', label: 'Forty minutes, hygiene and treatment plan. Note: difficult patient', reaction: { person: 'graham', state: 'guarded', text: 'The booking labels Graham instead of giving an instruction.' } },
          ],
          correct: 'complete',
          clause: 'Booking slip complete and passed to Sam',
          feedback: {
            speaker: 'Priya',
            right: 'Same nurse, same way, next time. Sam can book that.',
            wrong: "The slip is Dr Reid's words for Sam: forty minutes, what it's for, and that he's collected. 'Difficult' is a label, not an instruction. And the recall is set next time, not by you.",
          },
          noticed: { value: 'Graham next visit: forty minutes, nurse to collect, talk first, chair upright', when: 'right' },
          present: { kind: 'speech' },
        },
        {
          id: 'closedown',
          kind: 'checklist',
          prompt: 'Graham has gone. Close Surgery 2 for the day, then commit the room at the door.',
          context: 'Priya: "Aspirator gets its disinfectant tonight, sheets signed. Same order as this morning."',
          after: 'slip',
          options: [
            { id: 'water', label: 'Flush the aspirator with water, as between patients' },
            { id: 'unit', label: 'Clear and close down the delivery unit and log off the computer' },
            { id: 'disinfectant', label: 'Flush the water lines, and flush the aspirator with disinfectant solution' },
            { id: 'chair', label: 'Lower the chair for the closed room' },
            { id: 'light', label: 'Turn off the operating light' },
          ],
          correct: ['disinfectant', 'chair', 'light', 'unit'],
          clause: 'Close-down rules held at the door, with disinfectant through the aspirator',
          feedback: {
            speaker: 'Priya',
            right: 'Water between patients, disinfectant at the end of the session. The aspirator lines have had a full day through them.',
            wrong: "Water between patients, disinfectant at the end of the session; the aspirator lines have had a full day through them. Dirty out first, then clean, then flush, then the sheets, and the lights go off last. Go again.",
          },
          present: {
            kind: 'controls',
            start: 'Close the room and judge it at the door.',
            guideLabel: 'Close the room',
            controls: {
              water: { label: 'Aspirator: water', spot: { x: 75, y: 69 }, kind: 'action' },
              disinfectant: { label: 'Aspirator: disinfectant', spot: { x: 84, y: 60 }, kind: 'hold', seconds: 1 },
              chair: { label: 'Chair up or down', spot: { x: 50, y: 70 }, kind: 'hold', seconds: 1 },
              light: { label: 'Operating light', spot: { x: 55, y: 20 }, kind: 'toggle', states: ['Light on', 'Light off'] },
              unit: { label: 'Delivery unit', spot: { x: 88, y: 40 }, kind: 'toggle', states: ['Unit on', 'Unit off'] },
            },
            commit: { label: 'Check at the door', spot: { x: 12, y: 67 } },
          },
        },
        {
          id: 'handover',
          kind: 'checklist',
          prompt: 'Write your handover for the next nurse from what your notebook holds.',
          context: "Tomorrow's list: 09:00 composite filling, adult, Dr Reid; 10:20 child's first visit. The template asks: what's ready, what's outstanding, what to watch.",
          after: 'closedown',
          options: [
            { id: 'tray', label: "Tomorrow's first patient is a composite filling at 09:00; tray to set up" },
            { id: 'glucagon', label: 'Glucagon replacement: ordered this morning, check it has arrived' },
            { id: 'delivery', label: 'Delivery on the stock room bench, anaesthetic and concentrate still to check in with Priya' },
            { id: 'minute', label: 'Graham needed a minute outside and came back' },
            { id: 'slip', label: 'Graham next visit: forty minutes, nurse to collect, talk first, chair upright' },
            { id: 'child-first', label: "10:20 child's first visit: allow time and watch for anxiety" },
            { id: 'sam-busy', label: 'Sam very busy on reception' },
            { id: 'amira-cried', label: 'Amira cried when the light came on' },
            { id: 'pouch', label: 'Broken-seal pouch was set aside this morning' },
            { id: 'hurt', label: 'Agreed the hand-up signal with Amira' },
          ],
          correct: ['tray', 'glucagon', 'delivery', 'minute', 'slip', 'child-first'],
          clause: 'Handover names what is ready, outstanding and to watch, with nothing that does not belong',
          feedback: {
            speaker: 'Priya',
            right: "What's ready, what's outstanding, what to watch. Whoever opens up tomorrow can act on every line of that.",
            // TBC SME
            wrong: "A handover is for the person who wasn't here. If they can't act on it, it isn't one. What's ready, what's outstanding, what to watch, and the glucagon from this morning is exactly the kind of thing that gets lost if it isn't written down. Would the next nurse do anything with that? Then it isn't handover — and one of those isn't yours to pass on.",
          },
          present: {
            kind: 'handover',
            title: 'Handover',
            open: 'Write the handover',
            sheet: 'For the next nurse',
            fixed: ['tray', 'child-first'],
            distractors: {
              // TBC SME
              'sam-busy': 'Sam very busy on reception',
              'amira-cried': 'Amira cried when the light came on',
            },
          },
        },
      ],
    },
  ],
};