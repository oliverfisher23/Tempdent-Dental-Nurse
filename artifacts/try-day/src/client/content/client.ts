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

import hero from '@client/assets/hero.svg';
import map from '@client/assets/map.svg';
import mentor from '@client/assets/mentor.svg';

export const MENTOR_ID = "mentor";

export const WORKPLACE: Workplace = {
  places: {
    reception: {
      id: 'reception',
      name: 'Reception and waiting room',
      description: 'Bright front room off the street with a reception desk and a row of chairs.',
      map: { x: 20, y: 80 },
      backdrop: hero,
    },
    surgery2: {
      id: 'surgery2',
      name: 'Surgery 2',
      description: 'A compact clinical room with a dental chair and work surface.',
      map: { x: 40, y: 50 },
      backdrop: hero,
    },
    decon: {
      id: 'decon',
      name: 'Decontamination room',
      description: 'A narrow room laid out dirty-to-clean with sinks and an autoclave.',
      map: { x: 80, y: 20 },
      backdrop: hero,
    },
    stock: {
      id: 'stock',
      name: 'Stock room',
      description: 'A small room off the corridor with shelving and lockable cupboards.',
      map: { x: 60, y: 50 },
      backdrop: hero,
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
      portrait: mentor,
    },
    {
      id: 'dentist',
      speaker: 'Dr Reid',
      name: 'Dr Hannah Reid',
      role: 'Dentist',
      portrait: null,
    },
    {
      id: 'manager',
      speaker: 'Joanne',
      name: 'Joanne Whitfield',
      role: 'Practice Manager',
      portrait: null,
    },
    {
      id: 'receptionist',
      speaker: 'Sam',
      name: 'Sam Leigh',
      role: 'Receptionist',
      portrait: null,
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
  title: "Dental Nurse Try Day",
  // Shown beside the wordmark, so it carries the descriptor rather than repeating the name.
  subtitle: "Recruitment & Training",
  shortBrief: "REVIEW PROTOTYPE: Not clinically approved. All clinical details are pending SME validation and are simulated only, not real-world instructions. Tempdent is a specialist dental recruitment agency and training provider. Step into a realistic, supportive apprentice dental-nurse shift.",
  launchButton: 'Open the try day',
  inlineButton: 'Continue here',
  startButton: 'Start',
  launchHint: 'The experience works best when it fills your screen.',
  launchHintFramed: 'Continue to the briefing.',
  returnButton: 'Return to the welcome',
  close: 'Close',
  briefingTitle: 'Your briefing',
  briefing: 'REVIEW PROTOTYPE: Not clinically approved. You are an apprentice dental nurse. Follow your mentor before, during and after appointments to understand the role.',
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
  setup: { title: 'Set up', interaction: 'Choose one labelled button.', advice: 'Choose items to mark them done.' },
  welcome: { title: 'Welcome', interaction: 'Choose one labelled button.', advice: 'Select conversation options.' },
  filling: { title: 'Filling', interaction: 'Choose one labelled button.', advice: 'Hand over instruments in time.' },
  reset: { title: 'Reset', interaction: 'Choose one labelled button.', advice: 'Complete list in order.' },
  change: { title: 'Change', interaction: 'Choose one labelled button.', advice: 'Prioritise tasks.' },
  close: { title: 'Close', interaction: 'Choose one labelled button.', advice: 'Log notes and finish.' },
};

export const BRIEFING_VIDEOS: Record<string, BriefingVideo> = {
  main: {
    id: 'main',
    title: 'Mentor briefing',
    duration: '00:00',
    filename: 'main-briefing.mp4',
    transcript: ['Morning. I’m Priya, senior dental nurse here — I’m your mentor, so today you’re with me, 08:15 to half five. Here’s the list. Six patients this morning for Dr Reid, four this afternoon. First in is Amira — ten years old, first filling, coming with her dad. Before anyone sits in that chair the surgery has to be clean, working and stocked, the emergency kit checked, and a tray ready for her. Then we look after Amira, then we reset, then we go again. You don’t need to know any of the kit yet — I’ll show you as we go, and if you’re not sure about anything, ask. That’s not a weakness in this job. It’s the job.'],
  },
  setup: { id: 'setup', title: 'Task briefing', duration: '00:00', filename: 'task.mp4', transcript: ['Set up the surgery for the morning.'] },
  welcome: { id: 'welcome', title: 'Task briefing', duration: '00:00', filename: 'task.mp4', transcript: ['Welcome Amira and her dad.'] },
  filling: { id: 'filling', title: 'Task briefing', duration: '00:00', filename: 'task.mp4', transcript: ['Support the filling.'] },
  reset: { id: 'reset', title: 'Task briefing', duration: '00:00', filename: 'task.mp4', transcript: ['The job isn’t finished — notes, aftercare and reset.'] },
  change: { id: 'change', title: 'Task briefing', duration: '00:00', filename: 'task.mp4', transcript: ['The morning changes.'] },
  close: { id: 'close', title: 'Task briefing', duration: '00:00', filename: 'task.mp4', transcript: ['Graham’s first visit in ten years — and closing the day.'] },
};

export const TASK_BRIEFING_VIDEO: Record<string, string> = {
  setup: 'setup',
  welcome: 'welcome',
  filling: 'filling',
  reset: 'reset',
  change: 'change',
  close: 'close',
};

/** Shown on every clinical card until Tempdent's subject-matter expert signs the content off. */
export const DRAFT_NOTICE = 'Review prototype: draft content, pending clinical (SME) validation. Simulated only.';

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