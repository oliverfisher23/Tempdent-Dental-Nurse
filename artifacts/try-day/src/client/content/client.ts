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

export const TASK_ID = "draft-task";
export const PLACE_ID = "workplace";
export const MENTOR_ID = "mentor";

export const WORKPLACE: Workplace = {
  places: {
    [PLACE_ID]: {
      id: PLACE_ID,
      name: 'DRAFT workplace',
      description: 'DRAFT: Describe this place.',
      map: { x: 50, y: 50 },
      backdrop: hero,
    },
  },
  map: {
    image: map,
    alt: 'DRAFT workplace map',
    crossing: { x: 50, y: 50 },
  },
  taskRoutes: {
    [TASK_ID]: {
      start: PLACE_ID,
      places: [PLACE_ID],
      light: 'morning',
      whatIsHere: { [PLACE_ID]: 'DRAFT placeholder task' },
    },
  },
  people: [
    {
      id: MENTOR_ID,
      speaker: 'DRAFT mentor',
      name: 'DRAFT mentor',
      role: 'DRAFT mentor role',
      portrait: mentor,
    },
  ],
};

export const WELCOME_COPY: WelcomeCopy = {
  title: "Dental Nurse Try Day",
  subtitle: "TempDent",
  shortBrief: "TempDent DRAFT: Introduce the role and workplace in one short paragraph.",
  launchButton: 'Open the try day',
  inlineButton: 'Continue here',
  startButton: 'Start',
  launchHint: 'The experience works best when it fills your screen.',
  launchHintFramed: 'Continue to the briefing.',
  returnButton: 'Return to the welcome',
  close: 'Close',
  briefingTitle: 'Your DRAFT briefing',
  briefing: 'DRAFT: Explain what the learner will practise during this try day.',
  instructions: [
    'Work through the task in order.',
    'Use the information in the workplace before making a decision.',
    'Check your work before signing off.',
  ],
  controls: 'Use Tab to move through controls and Enter or Space to choose.',
  fullBrief: 'Read the full DRAFT brief',
  shift: 'Shift',
  nameLabel: 'What should we call you?',
  nameHelp: 'Your name stays on this device and is used on your work.',
  namePlaceholder: 'Your name',
  start: 'Start the try day',
  welcomeBack: (name) => `Welcome back, ${name}.`,
  completed: 'You have completed this DRAFT try day.',
  resume: (time, title) => `Continue at ${time}: ${title}.`,
  resumeFallback: 'Continue where you left off.',
  continue: 'Continue',
  readClose: 'Read the close',
  reset: 'Start again',
  resetWarning: 'Starting again removes the progress saved on this device.',
  confirmReset: 'Remove my progress',
  cancelReset: 'Keep my progress',
  mentorRole: 'DRAFT mentor role',
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
  placeholderLabel: 'DRAFT film placeholder',
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
  [TASK_ID]: {
    title: 'DRAFT task',
    interaction: 'Choose one labelled button.',
    advice: 'Choose “Mark placeholder complete” to exercise the scaffold done-when check.',
  },
};

export const BRIEFING_VIDEOS: Record<string, BriefingVideo> = {
  main: {
    id: 'main',
    title: 'DRAFT mentor briefing',
    duration: '00:00',
    filename: 'draft-main-briefing.mp4',
    transcript: ['DRAFT: Add the approved opening briefing transcript.'],
  },
  [TASK_ID]: {
    id: TASK_ID,
    title: 'DRAFT task briefing',
    duration: '00:00',
    filename: 'draft-task-briefing.mp4',
    transcript: ['DRAFT: Add the approved task briefing transcript.'],
  },
};

export const TASK_BRIEFING_VIDEO: Record<string, string> = {
  [TASK_ID]: TASK_ID,
};
