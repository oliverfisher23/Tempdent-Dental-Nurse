import type {
  AccessibilityCopy,
  BriefingVideo,
  InteractionPattern,
  MediaCopy,
  PatternCopy,
  TaskDeviceAdvice,
  WelcomeCopy,
  Workplace,
} from '@shell/lib/client';

import map from '@client/assets/map.svg';
import receptionPhoto from '@client/assets/places/reception.jpg';
import surgeryPhoto from '@client/assets/places/surgery2.jpg';
import deconPhoto from '@client/assets/places/decon.jpg';
import stockPhoto from '@client/assets/places/stock.jpg';
import priyaPortrait from '@client/assets/people/priya.jpg';
import reidPortrait from '@client/assets/people/reid.jpg';
import joannePortrait from '@client/assets/people/joanne.jpg';
import samPortrait from '@client/assets/people/sam.jpg';

export const MENTOR_ID = "mentor";

export const WORKPLACE: Workplace = {
  places: {
    reception: {
      id: 'reception',
      name: 'Reception and waiting room',
      description: 'Bright front room off the street with a reception desk and a row of chairs.',
      map: { x: 20, y: 80 },
      backdrop: receptionPhoto,
      ambience: { cutoff: 420, gain: 0.05 },
    },
    surgery2: {
      id: 'surgery2',
      name: 'Surgery 2',
      description: 'A compact clinical room with a dental chair and work surface.',
      map: { x: 40, y: 50 },
      backdrop: surgeryPhoto,
      ambience: { cutoff: 900, gain: 0.07 },
    },
    decon: {
      id: 'decon',
      name: 'Decontamination room',
      description: 'A narrow room laid out dirty-to-clean with sinks and an autoclave.',
      map: { x: 80, y: 20 },
      backdrop: deconPhoto,
      ambience: { cutoff: 1100, gain: 0.06 },
    },
    stock: {
      id: 'stock',
      name: 'Stock room',
      description: 'A small room off the corridor with shelving and lockable cupboards.',
      map: { x: 60, y: 50 },
      backdrop: stockPhoto,
      ambience: { cutoff: 260, gain: 0.025 },
    },
  },
  map: {
    image: map,
    alt: 'Bramley Road Dental Practice map',
    crossing: { x: 50, y: 50 },
  },
  taskRoutes: {
    setup: {
      start: 'surgery2',
      places: ['surgery2'],
      light: 'morning',
      whatIsHere: { surgery2: 'Morning checks and tray set-up' },
    },
    welcome: {
      start: 'reception',
      places: ['reception', 'surgery2'],
      light: 'morning',
      whatIsHere: { reception: 'Welcome Amira', surgery2: 'Bring Amira in' },
    },
    filling: {
      start: 'surgery2',
      places: ['surgery2'],
      light: 'morning',
      whatIsHere: { surgery2: 'Support Dr Reid with the filling' },
    },
    reset: {
      start: 'surgery2',
      places: ['surgery2', 'reception'],
      light: 'morning',
      whatIsHere: { surgery2: 'Notes, aftercare, then the reset', reception: 'Recall note for Sam' },
    },
    change: {
      start: 'decon',
      places: ['decon', 'surgery2', 'stock'],
      light: 'midday',
      whatIsHere: { decon: 'Inspection lamp and autoclave', surgery2: 'Set up for Mr Nowak', stock: 'The delivery' },
    },
    close: {
      start: 'reception',
      places: ['reception', 'surgery2'],
      light: 'afternoon',
      whatIsHere: { reception: 'Welcome Graham', surgery2: 'Support examination and close down' },
    },
  },
  people: [
    {
      id: MENTOR_ID,
      speaker: 'Priya',
      name: 'Priya Nair',
      role: 'Senior Dental Nurse',
      portrait: priyaPortrait,
    },
    {
      id: 'dentist',
      speaker: 'Dr Reid',
      name: 'Dr Hannah Reid',
      role: 'Dentist',
      portrait: reidPortrait,
    },
    {
      id: 'manager',
      speaker: 'Joanne',
      name: 'Joanne Whitfield',
      role: 'Practice Manager',
      portrait: joannePortrait,
    },
    {
      id: 'receptionist',
      speaker: 'Sam',
      name: 'Sam Leigh',
      role: 'Receptionist',
      portrait: samPortrait,
    },
    {
      id: 'amira',
      speaker: 'Amira',
      name: 'Amira Hassan',
      role: 'Patient (10)',
      portrait: null,
    },
    {
      id: 'karim',
      speaker: 'Karim',
      name: 'Karim Hassan',
      role: 'Amira\'s dad',
      portrait: null,
    },
    {
      id: 'graham',
      speaker: 'Graham',
      name: 'Graham Ellis',
      role: 'Patient (54)',
      portrait: null,
    },
    {
      id: 'tutor',
      speaker: 'Nadia',
      name: 'Nadia Brooks',
      role: 'Tutor Assessor',
      portrait: null,
    },
  ],
};

export const WELCOME_COPY: WelcomeCopy = {
  title: "A day as a dental nurse",
  // Shown beside the wordmark, so it carries the descriptor rather than repeating the name.
  subtitle: "Recruitment & Training",
  shortBrief: "Tempdent is a specialist dental recruitment agency and training provider. Step into a realistic, supportive apprentice dental-nurse shift.",
  launchButton: 'Open the try day',
  inlineButton: 'Continue here',
  startButton: 'Start',
  launchHint: 'The experience works best when it fills your screen.',
  launchHintFramed: 'Continue to the briefing.',
  returnButton: 'Return to the welcome',
  close: 'Close',
  briefingTitle: 'Your briefing',
  briefing: 'You are an apprentice dental nurse. Follow your mentor before, during and after appointments to understand the role.',
  instructions: [
    'Work through the task in order.',
    'Use the information in the workplace before making a decision.',
    'Check your work before signing off.',
  ],
  controls: 'Use Tab to move through controls and Enter or Space to choose.',
  fullBrief: 'Read the full brief',
  shift: 'Shift',
  nameLabel: 'What should we call you?',
  nameHelp: 'Your name stays on this device and is used on your work.',
  namePlaceholder: 'Your name',
  start: 'Start the try day',
  welcomeBack: (name) => `Welcome back, ${name}.`,
  completed: 'You have completed this try day.',
  resume: (time, title) => `Continue at ${time}: ${title}.`,
  resumeFallback: 'Continue where you left off.',
  continue: 'Continue',
  readClose: 'Read the close',
  reset: 'Start again',
  resetWarning: 'Starting again removes the progress saved on this device.',
  confirmReset: 'Remove my progress',
  cancelReset: 'Keep my progress',
  mentorRole: 'Senior Dental Nurse & Mentor',
};

export const ACCESSIBILITY_COPY: AccessibilityCopy = {
  skip: 'Skip to the main activity',
  deviceTitle: 'Choose a comfortable setup',
  recommendation: 'A larger screen is recommended, but the try day also works with touch and keyboard controls.',
  taskAdvice: 'Advice for each task',
  currentAdvice: 'Controls for this task',
  controlsTitle: 'Keyboard and touch controls',
  controls: ['Use Tab to move between controls.', 'Use Enter or Space to activate a control.', 'Use Escape to close an open panel.'],
  localProgress: 'Progress is saved on this device.',
  films: 'Briefing films include written transcripts.',
};

export const MEDIA_COPY: MediaCopy = {
  open: 'Open task briefing',
  openMain: 'Open mentor briefing',
  eyebrow: 'Briefing film',
  pendingTitle: 'Film pending',
  placeholderLabel: 'Film placeholder',
  placeholderHint: 'The approved film will appear here. Use the transcript for now.',
  pendingDescription: 'This briefing film has not been supplied.',
  releaseNote: 'Replace this placeholder when the approved film is ready.',
  transcript: 'Transcript',
  transcriptHint: 'Written alternative',
  duration: (text) => `Duration ${text}`,
  close: 'Close',
};

export const PATTERN_COPY: PatternCopy = {
  briefingTitle: 'How this works',
  briefingIntro: 'Every task also includes instructions beside the work.',
  howLink: 'How do I do this?',
  cardEyebrow: 'Control guide',
  thisStep: 'This step',
  onThisScreen: 'On this screen',
  doneWhen: 'Done when',
  keyboardLabel: 'Keyboard',
  close: 'Close',
};

export const INTERACTION_PATTERNS: Record<InteractionPattern['id'], InteractionPattern> = {
  tap: { id: 'tap', title: 'Choose', summary: 'Choose a labelled control.', steps: ['Find the labelled control.', 'Choose it once.'], keyboard: 'Focus the control and press Enter or Space.', onBriefing: true },
  drag: { id: 'drag', title: 'Move', summary: 'Move an item to a labelled target.', steps: ['Choose the item.', 'Move it to the target.'], keyboard: 'Use the control’s keyboard alternative.', onBriefing: false },
  hold: { id: 'hold', title: 'Hold', summary: 'Hold a control until the action settles.', steps: ['Press and hold.', 'Release when the result appears.'], keyboard: 'Hold Enter or Space.', onBriefing: false },
  list: { id: 'list', title: 'Complete a list', summary: 'Work through each labelled row.', steps: ['Read each row.', 'Record your decision.'], keyboard: 'Use Tab to move between rows.', onBriefing: true },
  explore: { id: 'explore', title: 'Inspect', summary: 'Open labelled details before deciding.', steps: ['Choose a detail.', 'Read what it reveals.'], keyboard: 'Focus a detail and press Enter or Space.', onBriefing: true },
};

export const TASK_DEVICE_ADVICE: Record<string, TaskDeviceAdvice> = {
  setup: { title: 'Set up', interaction: 'Tap surfaces on the photo in order.', advice: 'Then open the emergency kit and the tray.' },
  welcome: { title: 'Welcome', interaction: 'Answer in the speech panel.', advice: 'Use calm, honest words and stay within your role.' },
  filling: { title: 'Filling', interaction: 'Pick what you hand over.', advice: 'Choose where you hold the suction and watch Amira.' },
  reset: { title: 'Reset', interaction: 'Read the labels and tick the notes.', advice: 'Then reset the room in order.' },
  change: { title: 'Change', interaction: 'Sort the instruments.', advice: 'Then put the morning’s jobs in order.' },
  close: { title: 'Close', interaction: 'Talk Graham through the visit.', advice: 'Then close the room and hand over.' },
};

export const BRIEFING_VIDEOS: Record<string, BriefingVideo> = {
  main: {
    id: 'main',
    title: 'Mentor briefing',
    duration: '00:00',
    filename: 'main-briefing.mp4',
    transcript: ['Morning. I’m Priya, senior dental nurse here — I’m your mentor, so today you’re with me, 08:15 to half five. Here’s the list. Six patients this morning for Dr Reid, four this afternoon. First in is Amira — ten years old, first filling, coming with her dad. Before anyone sits in that chair the surgery has to be clean, working and stocked, the emergency kit checked, and a tray ready for her. Then we look after Amira, then we reset, then we go again. You don’t need to know any of the kit yet — I’ll show you as we go, and if you’re not sure about anything, ask. That’s not a weakness in this job. It’s the job.'],
  },
  setup: {
    id: 'setup',
    title: 'Task briefing',
    duration: '00:00',
    filename: 'task.mp4',
    transcript: [
      'Morning. Surgery 2 was cleaned last night, but nothing has been checked or set up for today. Amira, our first patient, is due at nine for her first filling.',
      'Prepare yourself, wipe the surgery down in the right order and flush the water lines. Then check the emergency equipment and set up Amira’s tray, using the guides and ticking the sheets as you go.',
      'Good set-up work is careful and methodical. Read every label, check every pouch and report anything that does not look right rather than signing it off.',
      'There may be something in the emergency kit that needs attention. I am here if you are unsure, but I want you to notice it and tell me.',
    ],
  },
  welcome: {
    id: 'welcome',
    title: 'Task briefing',
    duration: '00:00',
    filename: 'task.mp4',
    transcript: [
      'Amira and her dad, Karim, are waiting at reception. She is ten, this is her first filling and she did not sleep much last night. You bring them through; I will be right behind you.',
      'Greet Amira by name, include her dad and settle her into the surgery. Speak to her directly, use calm, honest words and give her small choices so she keeps a sense of control.',
      'Open her notes and listen carefully to anything Karim tells you. Record useful information and pass clinical questions to Dr Reid rather than trying to answer outside your role.',
      'Watch Amira as the appointment begins. She may show you how she is feeling before she can put it into words.',
    ],
  },
  filling: {
    id: 'filling',
    title: 'Task briefing',
    duration: '00:00',
    filename: 'task.mp4',
    transcript: [
      'I have explained the filling and agreed a hand-up stop signal with Amira. Her dad is where she can see him, and the tray is ready beside you.',
      'Work with me through the procedure. Keep the field clear with the suction, use the procedure strip to anticipate the next item and pass instruments safely below Amira’s chin.',
      'A strong dental nurse watches the patient as closely as the procedure. Keep an eye on Amira’s face, breathing and hands, and tell me immediately if she signals or looks uncomfortable.',
      'The pace may change once the handpiece starts. Stay within your role, keep looking up and speak up straight away.',
    ],
  },
  reset: {
    id: 'reset',
    title: 'Task briefing',
    duration: '00:00',
    filename: 'task.mp4',
    transcript: [
      'Do not relax yet. The filling is finished, but Amira is still numb, her dad needs the approved aftercare and Dr Reid needs the notes completed with the right batch numbers.',
      'Look after Amira first. Then read the packaging carefully, record the notes, take her family back to reception with the recall note and return to reset Surgery 2.',
      'Good work here stays accurate under pressure. Follow every infection-control step in order, close the used instruments in the transport box and never guess a number or skip a check.',
      'The next patient is already waiting, so the clock will feel tight. That does not change which safety steps must be completed.',
    ],
  },
  change: {
    id: 'change',
    title: 'Task briefing',
    duration: '00:00',
    filename: 'task.mp4',
    transcript: [
      'The morning has changed. You are at the inspection lamp when I arrive: the 10:20 has cancelled, Mr Nowak is coming at 10:40 in severe pain, and a delivery is blocking the corridor.',
      'Finish the decontamination step you are on safely. Then tell me what comes first, what can wait and what help you need while you get Surgery 2 ready.',
      'I am looking for clear priorities and communication, not clinical guesses. Sort the instruments properly, keep the infection-control cycle moving and make sure Priya knows what has changed.',
      'There is more than one urgent-looking job here. Keep the patient, a safe surgery and the blocked corridor in view, and ask for help rather than abandoning a step.',
    ],
  },
  close: {
    id: 'close',
    title: 'Task briefing',
    duration: '00:00',
    filename: 'task.mp4',
    transcript: [
      'Graham is our last patient. He has not seen a dentist in more than ten years, he wants to talk first and he has asked for a nurse to collect him quietly. You take the lead; I am right here.',
      'Bring him in at his pace and help him stay in control. Explain what will happen in plain words, support him without judgement and tell Dr Reid if you notice his distress changing.',
      'Record Dr Reid’s notes factually and respectfully. Once Graham is looked after, complete the end-of-session close-down and leave a handover the next nurse can use.',
      'Getting through the door is a big step for Graham. He may need the appointment to pause, so listen to what he asks for and do not rush him.',
    ],
  },
};

export const TASK_BRIEFING_VIDEO: Record<string, string> = {
  setup: 'setup',
  welcome: 'welcome',
  filling: 'filling',
  reset: 'reset',
  change: 'change',
  close: 'close',
};

export const PLACEHOLDER_IMAGERY_NOTICE = 'Pictures are placeholders until Tempdent photography is supplied.';

/** The close-of-day page. The mentor's own words come from the day document (FRAME.closeOfDay). */
export const CLOSE_COPY = {
  eyebrow: 'Shift Complete',
  title: (firstName: string) => `Great work today, ${firstName || 'Apprentice'}.`,
  // Storyboard: a short message from the Tutor Assessor about protected learning time and the one-to-one (TBC).
  tutorHeading: 'Message from Nadia Brooks, Tutor Assessor',
  tutorMessage:
    "Don't forget to log your protected apprenticeship time for today's shift on Bud. See you at our one-to-one next week!",
  restart: 'Start a new shift',
};