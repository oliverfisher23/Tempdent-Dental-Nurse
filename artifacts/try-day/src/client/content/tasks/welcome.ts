import type { TaskContent } from './types';
import amiraListening from '@client/assets/people/states/amira-listening.jpg';
import amiraBraced from '@client/assets/people/states/amira-braced.jpg';
import amiraWary from '@client/assets/people/states/amira-wary.jpg';
import amiraSettled from '@client/assets/people/states/amira-settled.jpg';
import amiraTears from '@client/assets/people/states/amira-tears.jpg';
import amiraHandUp from '@client/assets/people/states/amira-hand-up.jpg';
import amiraThumbsUp from '@client/assets/people/states/amira-thumbs-up.jpg';
import karimWorried from '@client/assets/people/states/karim-worried.jpg';
import karimReassured from '@client/assets/people/states/karim-reassured.jpg';
import karimAsking from '@client/assets/people/states/karim-asking.jpg';
import karimLeaving from '@client/assets/people/states/karim-leaving.jpg';
import receptionPatientOne from '@client/assets/people/states/reception-patient-1.jpg';
import receptionPatientTwo from '@client/assets/people/states/reception-patient-2.jpg';

// Background waiting-room stills are reserved for the reception scene compositor.
export const WELCOME_BACKGROUND_STILLS = [receptionPatientOne, receptionPatientTwo];

const AMIRA_STATES = {
  listening: { image: amiraListening, alt: 'Amira listens beside her dad.' },
  braced: { image: amiraBraced, alt: 'Amira grips both chair armrests.' },
  wary: { image: amiraWary, alt: 'Amira watches the light cautiously.' },
  settled: { image: amiraSettled, alt: 'Amira relaxes in her protective glasses.' },
  tears: { image: amiraTears, alt: 'Amira is still, with tears in her eyes.' },
  'hand-up': { image: amiraHandUp, alt: 'Amira raises her hand as her stop signal.' },
  'thumbs-up': { image: amiraThumbsUp, alt: 'Amira relaxes and gives a thumbs-up.' },
};
const KARIM_STATES = {
  worried: { image: karimWorried, alt: 'Karim looks concerned beside Amira.' },
  reassured: { image: karimReassured, alt: 'Karim looks visibly reassured.' },
  asking: { image: karimAsking, alt: 'Karim leans forward to ask a question.' },
  leaving: { image: karimLeaving, alt: 'Karim turns towards the surgery door.' },
};

// Storyboard Task 2. Clinical detail is draft, pending SME validation.
export const WELCOME_TASK: TaskContent = {
  id: 'welcome',
  dialogue: {
    speaker: 'Priya',
    text: "You bring them through. Say her name, say yours, and bring her dad with her. I'll be right behind you.",
  },
  signOff: {
    speaker: 'Dr Reid',
    text: 'Thanks, antibiotics noted. Amira, shall we agree a signal? Hand up, I stop. Every time.',
  },
  scenes: [
    {
      place: 'reception',
      eyebrow: 'Waiting room',
      title: 'Collect Amira and her dad',
      intro: 'Amira (10) is sitting pressed against her dad, quiet, feet not touching the floor. Karim says quietly that she "didn\'t sleep much". Her notes flag: nervous, first filling, dad attending, mild asthma with a blue inhaler.',
      people: ['amira', 'karim', 'receptionist'],
      opening: { speaker: 'Priya', text: "You bring them through. Say her name, say yours, and bring her dad with her. I'll be right behind you.", seconds: 5 },
      cast: {
        amira: { initial: 'listening', states: AMIRA_STATES },
        karim: { initial: 'worried', states: KARIM_STATES },
      },
      decisions: [
        {
          id: 'greet',
          kind: 'choice',
          prompt: 'How do you greet them?',
          context: 'The waiting room is half full. Collect patients by name, and never announce their treatment across the room.',
          options: [
            { id: 'named', label: '"Amira? Hi, I\'m one of the dental nurses. I\'ll be in the room with you and Dr Reid the whole time. Do you want to bring your dad through with you?"', reaction: { person: 'amira', state: 'wary', text: 'Amira looks up and listens.' } },
            { id: 'dad_first', label: '"Morning, Mr Hassan. And you must be Amira. I\'m one of the dental nurses. Come through together, you can stay with her the whole time."', reaction: { person: 'karim', state: 'reassured', text: 'Karim relaxes as both of them are included.' } },
            { id: 'across_room', label: '"Amira Hassan for the filling?"', reaction: { person: 'amira', state: 'braced', text: 'Amira shrinks back as other patients look up.' } },
            { id: 'no_pain', label: '"Amira? Don\'t worry, it won\'t hurt a bit! Come on through."', reaction: { person: 'karim', state: 'worried', text: 'Karim looks worried by the promise.' } },
          ],
          correct: ['named', 'dad_first'],
          clause: 'Greeting names Amira, introduces you, includes dad and makes no pain promise',
          feedback: {
            speaker: 'Priya',
            right: "Her name, your name, dad included, and nothing promised you can't keep. Good.",
            wrong: "Two things. First, her treatment is nobody else's business: say her name, not what she's here for. Second, never promise it won't hurt. If it does, even a little, she'll stop believing anything you say, and Dr Reid needs her to trust the hand signal.",
          },
          present: { kind: 'speech' },
        },
      ],
    },
    {
      place: 'surgery2',
      eyebrow: 'Surgery 2',
      title: 'Settle Amira in',
      intro: "Dr Reid is reading Amira's notes. The chair is ready with a bib and two colours of safety glasses.",
      people: ['amira', 'karim', 'dentist'],
      // TBC SME
      opening: { speaker: 'Priya', text: 'Before Dr Reid comes in, I want her settled — bib, glasses, dad where she can see him. Take your time.', seconds: 5 },
      cast: {
        amira: { initial: 'wary', states: AMIRA_STATES },
        karim: { initial: 'worried', states: KARIM_STATES },
      },
      // TBC SME
      debrief: { speaker: 'Priya', text: "She walked in holding her dad's sleeve and she's sitting there swinging her feet. That's you. One thing to keep: when her eyes filled, that was the moment — you stop, every time." },
      decisions: [
        {
          id: 'settle',
          kind: 'sequence',
          prompt: 'Settle Amira in the chair. Use the room controls; tell her before the chair moves.',
          options: [
            { id: 'bib', label: 'Put the bib on', reaction: { person: 'amira', state: 'wary', text: 'Amira lets you fasten the bib.' } },
            { id: 'chair', label: 'Tell her the chair is going to move back slowly before it does', reaction: { person: 'amira', state: 'wary', text: 'Amira hears what the chair will do before it moves.' } },
            { id: 'coat', label: 'Show Amira and her dad where to put coats and bags', reaction: { person: 'karim', state: 'reassured', text: 'Karim puts their things safely out of the way.' } },
            // TBC SME
            { id: 'glasses', label: 'Offer the safety glasses and let her choose the colour', reaction: { person: 'amira', state: 'settled', text: 'Amira says, “Purple.” Her shoulders drop.' } },
            { id: 'sit', label: 'Invite Amira to sit, with dad on the stool where she can see him', reaction: { person: 'karim', state: 'reassured', text: 'Karim sits where Amira can see him.' } },
          ],
          correct: ['coat', 'sit', 'chair', 'bib', 'glasses'],
          clause: 'Amira seated with bib and glasses on, controls explained first and Karim in view',
          feedback: {
            speaker: 'Priya',
            right: 'Nothing happened to her without a word first, and she got a choice at the end. That is how you settle a nervous ten-year-old.',
            // TBC SME
            wrong: "Tell her before it moves — a chair that tilts on its own is frightening at ten. And the glasses are hers to pick; it's the one thing in here she gets to decide.",
          },
          present: {
            kind: 'controls',
            start: 'Use the controls in the room. The order is yours to judge.',
            guideLabel: 'Settle Amira',
            controls: {
              coat: { label: 'Coat hook', spot: { x: 10, y: 43 }, kind: 'action' },
              sit: { label: 'Invite Amira to sit', spot: { x: 52, y: 69 }, kind: 'action' },
              // TBC SME
              chair: { label: 'Chair up or down', spot: { x: 42, y: 58 }, kind: 'hold', seconds: 1, explain: 'Tell her before it moves. Go on.' },
              bib: { label: 'Bib', spot: { x: 80, y: 55 }, kind: 'action' },
              glasses: { label: 'Glasses rack', spot: { x: 25, y: 47 }, kind: 'action' },
            },
            commit: { label: 'Ready for Dr Reid', spot: { x: 90, y: 70 } },
          },
          revealsComplication: true,
        },
        {
          id: 'pause',
          kind: 'choice',
          prompt: "The light comes on over the chair. Amira's eyes fill and she grips the armrests. Dad looks at you. What do you do?",
          after: 'settle',
          options: [
            { id: 'push_on', label: 'Keep going with the bib so it is over quicker', reaction: { person: 'amira', state: 'tears', text: 'Amira grips the armrests and her eyes fill.' } },
            { id: 'dad', label: 'Ask dad to reassure her while you carry on', reaction: { person: 'karim', state: 'worried', text: 'Karim looks towards you, still worried.' } },
            { id: 'pause', label: 'Stop, crouch to her eye level and let her pick the glasses. Tell Dr Reid quietly that Amira needs a minute', reaction: { person: 'amira', state: 'settled', text: 'Amira settles again as the room pauses.' } },
          ],
          correct: 'pause',
          clause: "Paused when Amira's eyes filled, and gave her something to control",
          feedback: {
            speaker: 'Priya',
            right: "That was the moment to stop, and you took it. Watching the patient is the job, even before the treatment starts.",
            wrong: "Let's give Amira a second. Amira, which glasses? Go on, you pick. You'd have got there, but the moment her eyes filled was the moment to stop. Watching the patient is the job, even before the treatment starts.",
          },
          present: { kind: 'speech' },
        },
        {
          id: 'notes',
          kind: 'checklist',
          prompt: 'Dr Reid asks the medical history questions. Karim mentions three things. Which go in the notes?',
          context: 'Karim: "She finished a course of antibiotics last week." "Her blue inhaler is in my bag." "She didn\'t sleep much."',
          options: [
            { id: 'antibiotics', label: 'Antibiotics finished last week' },
            { id: 'inhaler', label: 'Reliever inhaler with dad, in his bag' },
            { id: 'sleep', label: 'Did not sleep much last night' },
          ],
          correct: ['antibiotics', 'inhaler'],
          clause: 'The two relevant items from dad recorded in the notes',
          feedback: {
            speaker: 'Priya',
            right: "Dr Reid asks, you write. The inhaler, make sure it's to hand. 'Didn't sleep much' isn't a medical entry, but it does tell you to slow down and keep your voice soft.",
            wrong: "Dr Reid asks, you write. That's how it works with two of us. Anything about her health or her medicines goes in the notes. How she slept isn't a medical entry, but it does tell you to slow down and keep your voice soft.",
          },
          present: { kind: 'paper', paper: 'notepaper', title: 'Medical history', open: 'Write the notes', heading: 'Amira - medical history' },
        },
        {
          id: 'antibiotics',
          kind: 'choice',
          prompt: 'What do you do about the antibiotics?',
          after: 'notes',
          options: [
            { id: 'later', label: 'Write it down and decide later whether it matters', reaction: { person: 'karim', state: 'worried', text: 'Karim waits, unsure whether Dr Reid heard.' } },
            { id: 'tell', label: 'Write it down and say it aloud to Dr Reid now', reaction: { person: 'karim', state: 'reassured', text: 'Karim sees that Dr Reid has heard.' } },
            { id: 'leave', label: 'Leave it. Dr Reid is asking the questions', reaction: { person: 'karim', state: 'worried', text: 'Karim looks concerned that the medicine was not passed on.' } },
          ],
          correct: 'tell',
          clause: 'Antibiotics flagged to Dr Reid, not judged by you',
          feedback: {
            speaker: 'Priya',
            right: 'Dr Reid decides what is clinically relevant. Your job is to make sure she heard it.',
            wrong: "Whether it matters isn't yours to decide, and it isn't yours to sit on either. The antibiotics go in the notes and Dr Reid needs to hear it, now, before anything starts.",
          },
          present: { kind: 'speech' },
        },
        {
          id: 'hurt',
          kind: 'choice',
          prompt: 'Amira asks you quietly: "Is it going to hurt?"',
          options: [
            { id: 'honest', label: '"Dr Reid will make the tooth go to sleep first, so it\'ll feel strange and a bit pushy rather than sore. If anything feels wrong, you put your hand up like this and Dr Reid will stop and check with you."', reaction: { person: 'amira', state: 'hand-up', text: 'Amira practises the hand-up stop signal.' } },
            { id: 'together', label: '"That\'s a really good question. Let\'s ask Dr Reid together, and she\'ll show you how you can tell us to stop."', reaction: { person: 'amira', state: 'settled', text: 'Amira settles as the question is passed to Dr Reid.' } },
            { id: 'promise', label: '"It won\'t hurt at all, promise."', reaction: { person: 'karim', state: 'worried', text: 'Karim looks at you, worried by the promise.' } },
            { id: 'compare', label: '"Loads of kids younger than you don\'t make a fuss."', reaction: { person: 'amira', state: 'tears', text: 'Amira looks down and grips the chair.' } },
          ],
          correct: ['honest', 'together'],
          clause: "Amira's question answered honestly, with the stop signal and no pain promise",
          feedback: {
            speaker: 'Priya',
            right: 'Honest, calm, and she has a way to be in control. That is a promise you can keep.',
            wrong: "Honest, calm, and give her a way to be in control. That's the shape of a good answer. Never promise no pain, and never compare her to other children. If you're not sure what Dr Reid has planned, the best answer is 'let's ask her together'.",
          },
          noticed: { value: 'Agreed the hand-up signal with Amira', when: 'right' },
          present: { kind: 'speech' },
        },
        {
          id: 'white',
          kind: 'choice',
          prompt: 'Karim asks: "Can she have the white filling rather than the silver one?"',
          options: [
            { id: 'yes', label: '"Yes, that should be fine for a back tooth."', reaction: { person: 'karim', state: 'worried', text: 'Karim looks uncertain at the guess.' } },
            { id: 'price', label: '"I think it depends on the price."', reaction: { person: 'karim', state: 'asking', text: 'Karim still needs an answer from Dr Reid.' } },
            // TBC SME
            { id: 'refer', label: '"That\'s one for Dr Reid. She\'ll go through the options with you before anything starts."', reaction: { person: 'karim', state: 'reassured', text: 'Dr Reid says, “Good question, Mr Hassan — yes, it\'s a white filling today, I\'ll show you the shade.”' } },
            { id: 'cold', label: '"You\'ll have to ask the dentist."', reaction: { person: 'karim', state: 'worried', text: 'Karim looks as though the question has been brushed aside.' } },
          ],
          correct: 'refer',
          clause: "Dad's treatment question passed to Dr Reid warmly",
          feedback: {
            speaker: 'Priya',
            right: 'Treatment options are Dr Reid\'s call, and you told him who will answer it and when.',
            wrong: "Treatment options are Dr Reid's call, every time. But you don't have to sound like you're closing a door, and you never guess. Tell him who'll answer it and when.",
          },
          present: { kind: 'speech' },
        },
      ],
    },
  ],
};