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
  TASK_ID,
  WELCOME_COPY,
  WORKPLACE,
} from '@client/content/client';
import ClosePage from '@client/pages/close';
import DraftTaskPage from '@client/pages/task';
import logo from '@client/assets/logo.svg';
import hero from '@client/assets/hero.svg';
import mentor from '@client/assets/mentor.svg';

kitchenAudio.configure({
  muteKey: "springpod:tempdent-try-day:sound-muted",
});

export const tryClient: TryClient<TaskStates> = {
  day,
  brand: {
    name: "TempDent",
    logo,
    logoAlt: "TempDent DRAFT logo",
    documentTitle: "Dental Nurse Try Day",
  },
  mentor: {
    name: 'DRAFT mentor',
    personId: MENTOR_ID,
    photo: mentor,
    photoAlt: 'DRAFT mentor portrait',
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
  taskPages: { [TASK_ID]: DraftTaskPage },
  ClosePage,
};
