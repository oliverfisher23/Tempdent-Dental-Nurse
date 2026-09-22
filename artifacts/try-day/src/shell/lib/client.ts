/**
 * What a client (an employer's try day) hands the shell.
 *
 * The shell renders the welcome, the briefing, the frame around every task (map,
 * step guide, notepad, dialogue), the close and the designer panel from this one
 * object. Everything specific to a workplace, its people, its pictures and its
 * words lives on the client side of this contract. Ids are plain strings here;
 * each client narrows them to its own unions in its own code.
 */

import type { ComponentType } from 'react';
import type { DayRuntime, TaskId } from './day';
import type { ToneSpec } from '@kit/lib/audio';

export type PlaceId = string;

export interface Place {
  id: PlaceId;
  /** Name as someone who works there would say it. */
  name: string;
  /** One line for the map tooltip and for screen readers. */
  description: string;
  /** Where the marker sits on the map, as percentages of width and height. */
  map: { x: number; y: number };
  /** The close-up backdrop the student stands in. */
  backdrop: string;
  /** The room's ambient bed, when sound is on. Silence when left out. */
  ambience?: ToneSpec;
}

export type DayLight = 'dawn' | 'morning' | 'midday' | 'afternoon';

export interface TaskRoute {
  /** Where the student is standing when the task opens. */
  start: PlaceId;
  /** Every place that has something to do in this task, in the order the work runs. */
  places: PlaceId[];
  /** The light in the workplace at this point in the day. */
  light: DayLight;
  /** What is waiting at each place, for the map tooltip. */
  whatIsHere: Partial<Record<PlaceId, string>>;
  /**
   * Whether a reload re-opens the workspace the learner had open (default true). Set
   * false for a task whose scene resumes from its saved records by itself, where
   * re-sending the action would open something the learner has not opened.
   */
  restoresWorkspace?: boolean;
}

export interface Person {
  id: string;
  /** The speaker name used in dialogue lines. */
  speaker: string;
  name: string;
  role: string;
  portrait: string | null;
}

/** One spoken line in a scene; the shell looks the speaker up among the client's people. */
export interface Line {
  speaker: string;
  text: string;
}

export interface Workplace {
  /** Every place, in the order its pin is offered on the map. */
  places: Record<PlaceId, Place>;
  map: {
    image: string;
    /** What the map picture shows, for screen readers. */
    alt: string;
    /** A waypoint in the open floor; walks between places route through it. */
    crossing: { x: number; y: number };
  };
  taskRoutes: Record<TaskId, TaskRoute>;
  people: Person[];
}

/** The ways of doing things the kit implements; the client supplies the words for each. */
export type InteractionPatternId = 'tap' | 'drag' | 'hold' | 'list' | 'explore';

export interface InteractionPattern {
  id: InteractionPatternId;
  /** Two to four words, the same everywhere. */
  title: string;
  /** One sentence for the tile. */
  summary: string;
  /** Two or three short lines for the card. */
  steps: string[];
  /** One line for keyboard users, shown on the card only. */
  keyboard?: string;
  /** Show this one on the briefing page before the shift starts. */
  onBriefing: boolean;
}

export type BriefingVideoId = string;

export interface BriefingVideo {
  id: BriefingVideoId;
  title: string;
  duration: string;
  /** The file the filmed briefing will be delivered as. */
  filename: string;
  /** Where the finished film is served from, once it exists. Left out while it is a placeholder. */
  src?: string;
  /** Optional still shown before playback, and in place of the film while it is a placeholder. */
  poster?: string;
  transcript: string[];
}

export interface Brand {
  /** The employer's name as it appears on screen. */
  name: string;
  logo: string;
  logoAlt: string;
  /** The browser tab title for the welcome page; task pages prefix it with the task. */
  documentTitle: string;
}

export interface Mentor {
  name: string;
  /** The person id in the workplace's people list. */
  personId: string;
  photo: string;
  photo2x?: string;
  photoAlt: string;
}

export interface WelcomeCopy {
  title: string;
  subtitle: string;
  shortBrief: string;
  launchButton: string;
  inlineButton: string;
  startButton: string;
  launchHint: string;
  launchHintFramed: string;
  returnButton: string;
  close: string;
  briefingTitle: string;
  briefing: string;
  instructions: string[];
  controls: string;
  fullBrief: string;
  shift: string;
  nameLabel: string;
  nameHelp: string;
  namePlaceholder: string;
  start: string;
  welcomeBack: (name: string) => string;
  completed: string;
  resume: (time: string, title: string) => string;
  resumeFallback: string;
  continue: string;
  readClose: string;
  reset: string;
  resetWarning: string;
  confirmReset: string;
  cancelReset: string;
  mentorRole: string;
}

export interface AccessibilityCopy {
  skip: string;
  deviceTitle: string;
  recommendation: string;
  taskAdvice: string;
  currentAdvice: string;
  controlsTitle: string;
  controls: string[];
  localProgress: string;
  films: string;
}

export interface MediaCopy {
  open: string;
  openMain: string;
  eyebrow: string;
  pendingTitle: string;
  placeholderLabel: string;
  placeholderHint: string;
  pendingDescription: string;
  releaseNote: string;
  transcript: string;
  transcriptHint: string;
  duration: (text: string) => string;
  close: string;
}

export interface PatternCopy {
  briefingTitle: string;
  briefingIntro: string;
  howLink: string;
  cardEyebrow: string;
  thisStep: string;
  onThisScreen: string;
  doneWhen: string;
  keyboardLabel: string;
  close: string;
}

export interface TaskDeviceAdvice {
  title: string;
  interaction: string;
  advice: string;
}

export interface TryClient<TS extends Record<string, unknown> = Record<string, unknown>> {
  day: DayRuntime<TS>;
  brand: Brand;
  mentor: Mentor;
  workplace: Workplace;
  welcome: {
    copy: WelcomeCopy;
    hero: { wide: string; phone: string };
  };
  copy: {
    accessibility: AccessibilityCopy;
    media: MediaCopy;
    patterns: PatternCopy;
  };
  taskDeviceAdvice: Record<TaskId, TaskDeviceAdvice>;
  interactionPatterns: Record<InteractionPatternId, InteractionPattern>;
  briefingVideos: Record<BriefingVideoId, BriefingVideo>;
  /** The mentor's opening briefing, played from the welcome. */
  mainBriefingVideo: BriefingVideoId;
  taskBriefingVideo: Record<TaskId, BriefingVideoId>;
  /** One page per task, keyed by task id; the shell routes /task/:id to it. */
  taskPages: Record<TaskId, ComponentType>;
  ClosePage: ComponentType;
}

export function personForSpeaker(workplace: Workplace, speaker: string): Person | undefined {
  return workplace.people.find((p) => p.speaker === speaker);
}

export function briefingPatterns(client: Pick<TryClient, 'interactionPatterns'>): InteractionPattern[] {
  return Object.values(client.interactionPatterns).filter((p) => p.onBriefing);
}

/**
 * Everything the shell will look up by id while running the day, checked once
 * up front. A remixed client that is missing a page, a route or a film would
 * otherwise fail on the screen that first needs it, half way through a shift.
 */
export function clientProblems(client: TryClient<never> | TryClient): string[] {
  const c = client as TryClient;
  const problems: string[] = [];
  const { TASK_ORDER } = c.day.spec;
  const placeIds = new Set(Object.keys(c.workplace.places));

  for (const id of TASK_ORDER) {
    if (!c.taskPages[id]) problems.push(`task "${id}" has no page in taskPages`);
    if (!c.taskDeviceAdvice[id]) problems.push(`task "${id}" has no entry in taskDeviceAdvice`);
    const video = c.taskBriefingVideo[id];
    if (!video) problems.push(`task "${id}" has no entry in taskBriefingVideo`);
    else if (!c.briefingVideos[video]) problems.push(`task "${id}" names briefing video "${video}", which is not in briefingVideos`);
    const route = c.workplace.taskRoutes[id];
    if (!route) {
      problems.push(`task "${id}" has no route in workplace.taskRoutes`);
      continue;
    }
    for (const place of [route.start, ...route.places]) {
      if (!placeIds.has(place)) problems.push(`task "${id}" routes through place "${place}", which is not in workplace.places`);
    }
  }
  for (const id of Object.keys(c.taskPages)) {
    if (!TASK_ORDER.includes(id)) problems.push(`taskPages has a page for "${id}", which is not a task in the day`);
  }
  if (!c.briefingVideos[c.mainBriefingVideo]) problems.push(`mainBriefingVideo "${c.mainBriefingVideo}" is not in briefingVideos`);
  if (!c.workplace.people.some((p) => p.id === c.mentor.personId)) problems.push(`mentor.personId "${c.mentor.personId}" is not in workplace.people`);
  return problems;
}

/** Throws with every problem at once, so a broken client is fixed in one pass. */
export function assertValidClient(client: TryClient<never> | TryClient): void {
  const problems = clientProblems(client);
  if (problems.length > 0) {
    throw new Error(`This try day is not complete enough to run:\n- ${problems.join('\n- ')}`);
  }
}
