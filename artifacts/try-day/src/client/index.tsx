/**
 * The art'otel Hoxton sous chef try day, as one object the shell can run.
 *
 * Everything the shell needs to know about this kitchen is gathered here: the
 * day document and its progress model, the brand, the mentor, the workplace,
 * the copy for the welcome and the frame, the briefing films, and the page for
 * each task. Nothing in src/shell or src/kit imports from src/client; this file
 * is where the two halves meet (see src/main.tsx).
 */

import type { TryClient } from '@shell/lib/client';
import { kitchenAudio } from '@kit/lib/audio';

import { day, type TaskStates } from './lib/simulation';
import { WORKPLACE, PLACES, TERENCE_PERSON_ID } from './content/kitchen';
import { WELCOME_COPY } from './content/welcome';
import { ACCESSIBILITY_COPY, TASK_DEVICE_ADVICE } from './content/experience-accessibility';
import { MEDIA_ACCESSIBILITY_COPY } from './content/accessibility-media';
import { INTERACTION_PATTERNS, PATTERN_COPY } from './content/interaction-patterns';
import { BRIEFING_VIDEOS, TASK_BRIEFING_VIDEO } from './content/briefing-videos';

import Close from './pages/close';
import HandoverTask from './pages/tasks/take-the-handover';
import DeliveryTask from './pages/tasks/check-the-delivery-in';
import ChillTask from './pages/tasks/chill-the-event-batch';
import DietaryTask from './pages/tasks/check-the-dietary-list';
import HandoverKitchenTask from './pages/tasks/hand-the-kitchen-on';

import logoImg from '@client/assets/artotel-logo.png';
import heroWide from '@client/assets/kitchen/photos/kitchen-line.webp';
import heroPhone from '@client/assets/kitchen/photos/kitchen-line-phone.webp';
// Two sizes so the browser shows the circle close to 1:1 instead of shrinking a large export.
import terenceBriefing from '@client/assets/kitchen/photos/terence-briefing.webp';
import terenceBriefing2x from '@client/assets/kitchen/photos/terence-briefing-2x.webp';

/**
 * The saved sound choice is keyed per client so two try days on one device do
 * not share it. This value predates the shell split and must not change, or
 * returning learners lose their mute setting.
 */
const SOUND_MUTED_KEY = 'springpod:mar-try-day:sound-muted';

kitchenAudio.configure({
  muteKey: SOUND_MUTED_KEY,
  ambience: PLACES.pass.ambience,
  // The recorded kitchen loop in public/audio, served from the app's base path.
  ambienceLoop: `${import.meta.env.BASE_URL}audio/kitchen-ambience.mp3`,
});

export const kitchenClient: TryClient<TaskStates> = {
  day,
  brand: {
    name: "art'otel Hoxton",
    logo: logoImg,
    logoAlt: "art'otel",
    documentTitle: "art'otel Sous Chef Try Day",
  },
  mentor: {
    name: 'Terence',
    personId: TERENCE_PERSON_ID,
    photo: terenceBriefing,
    photo2x: terenceBriefing2x,
    photoAlt: "Terence, executive sous chef at art'otel Hoxton",
  },
  workplace: WORKPLACE,
  welcome: {
    copy: WELCOME_COPY,
    hero: { wide: heroWide, phone: heroPhone },
  },
  copy: {
    accessibility: ACCESSIBILITY_COPY,
    media: MEDIA_ACCESSIBILITY_COPY,
    patterns: PATTERN_COPY,
  },
  taskDeviceAdvice: TASK_DEVICE_ADVICE,
  interactionPatterns: INTERACTION_PATTERNS,
  briefingVideos: BRIEFING_VIDEOS,
  mainBriefingVideo: 'main',
  taskBriefingVideo: TASK_BRIEFING_VIDEO,
  taskPages: {
    'take-the-handover': HandoverTask,
    'check-the-delivery-in': DeliveryTask,
    'chill-the-event-batch': ChillTask,
    'check-the-dietary-list': DietaryTask,
    'hand-the-kitchen-on': HandoverKitchenTask,
  },
  ClosePage: Close,
};
