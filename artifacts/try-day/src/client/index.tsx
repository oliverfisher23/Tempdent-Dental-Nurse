import type { TryClient } from '@shell/lib/client';
import { kitchenAudio } from '@kit/lib/audio';
import { day, type TaskStates } from '@client/lib/simulation';
import {
  ACCESSIBILITY_COPY,
  BRIEFING_VIDEOS,
  INTERACTION_PATTERNS,
  MEDIA_COPY,
  MENTOR_ID,
  PATTERN_COPY,
  TASK_BRIEFING_VIDEO,
  TASK_DEVICE_ADVICE,
  WELCOME_COPY,
  WORKPLACE,
} from '@client/content/client';
import ClosePage from '@client/pages/close';
import SetupTaskPage from '@client/pages/setup';
import WelcomeTaskPage from '@client/pages/welcome';
import FillingTaskPage from '@client/pages/filling';
import ResetTaskPage from '@client/pages/reset';
import ChangeTaskPage from '@client/pages/change';
import CloseTaskPage from '@client/pages/close-task';

// The shell places the logo on its dark bars, so this is the reverse (white)
// wordmark, derived from the supplied master's alpha channel.
import logo from '@client/assets/tempdent-logo-reverse.png';
import hero from '@client/assets/hero.svg';
import mentor from '@client/assets/mentor.svg';

kitchenAudio.configure({
  muteKey: "springpod:tempdent-try-day:sound-muted",
});

export const tryClient: TryClient<TaskStates> = {
  day,
  brand: {
    name: "Tempdent",
    logo,
    logoAlt: "Tempdent logo",
    documentTitle: "Dental Nurse Try Day",
  },
  mentor: {
    name: 'Priya Nair',
    personId: MENTOR_ID,
    photo: mentor,
    photoAlt: 'Priya Nair portrait',
  },
  workplace: WORKPLACE,
  welcome: {
    copy: WELCOME_COPY,
    hero: { wide: hero, phone: hero },
  },
  copy: {
    accessibility: ACCESSIBILITY_COPY,
    media: MEDIA_COPY,
    patterns: PATTERN_COPY,
  },
  taskDeviceAdvice: TASK_DEVICE_ADVICE,
  interactionPatterns: INTERACTION_PATTERNS,
  briefingVideos: BRIEFING_VIDEOS,
  mainBriefingVideo: 'main',
  taskBriefingVideo: TASK_BRIEFING_VIDEO,
  taskPages: {
    setup: SetupTaskPage,
    welcome: WelcomeTaskPage,
    filling: FillingTaskPage,
    reset: ResetTaskPage,
    change: ChangeTaskPage,
    close: CloseTaskPage,
  },
  ClosePage,
};