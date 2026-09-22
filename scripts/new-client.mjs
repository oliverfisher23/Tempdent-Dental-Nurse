#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OWN_CLIENT_ID = 'mar-try-day';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const APP = path.join(ROOT, 'artifacts', 'try-day');

const DELETE_PATHS = [
  'attached_assets',
  'docs',
  'BUILD_BRIEF.md',
  'artifacts/try-day/docs',
  'artifacts/try-day/exports',
  'artifacts/try-day/public/audio',
  'artifacts/try-day/screenshots',
  'artifacts/try-day/e2e',
  'artifacts/try-day/PHOTOGRAPHY-SHOT-LIST.md',
  'artifacts/try-day/EXPERIENCE-FLOW.md',
  'artifacts/try-day/COPY.md',
  'artifacts/try-day/playwright.delivery.config.ts',
  'artifacts/try-day/tsconfig.delivery-tests.json',
  'artifacts/try-day/scripts',
  'artifacts/try-day/tests/asset-orphans.test.ts',
  'artifacts/try-day/tests/delivery-browser.spec.ts',
  'artifacts/try-day/tests/delivery-workflow.test.ts',
  'artifacts/try-day/tests/dietary-menu-first.test.ts',
  'artifacts/try-day/tests/fridge-approval.test.ts',
  'artifacts/try-day/tests/fridge-media-assets.test.ts',
  'artifacts/try-day/tests/fridge-viewer-approval.test.ts',
  'artifacts/try-day/tests/handover-media-regressions.test.ts',
  'artifacts/try-day/tests/inspection-playback.test.ts',
  'artifacts/try-day/tests/kitchen-photos-assets.test.ts',
  'artifacts/try-day/tests/redesign-regressions.test.ts',
  'artifacts/try-day/tests/fixtures',
  'artifacts/try-day/tests/support/fridge-approval.ts',
  '.agents/memory/try-day-content.md',
  '.agents/memory/dietary-review-boundaries.md',
  '.agents/memory/fridge-inspection-layout.md',
  '.agents/memory/dial-thermometer-round.md',
  '.agents/memory/image-exports.md',
  '.agents/memory/orphaned-asset-check.md',
  '.agents/memory/fridge-door-playback.md',
];

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Usage: pnpm --filter @workspace/try-day run new-client -- ' +
      '--id <client-id> --name "<Employer>" --title "<Try day title>" --confirm',
  );
  process.exit(1);
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--confirm') {
      values.confirm = true;
      continue;
    }
    if (arg === '--id' || arg === '--name' || arg === '--title') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) usage(`${arg} needs a value.`);
      values[arg.slice(2)] = value.trim();
      index += 1;
      continue;
    }
    usage(`Unknown option "${arg}".`);
  }
  return values;
}

function js(value) {
  return JSON.stringify(value);
}

function svg({ label, detail, width, height, background = '#e8e5df', foreground = '#242424' }) {
  const safeLabel = label.replace(/[&<>"']/g, '');
  const safeDetail = detail.replace(/[&<>"']/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${safeLabel}</title>
  <desc id="desc">${safeDetail}</desc>
  <rect width="${width}" height="${height}" fill="${background}"/>
  <path d="M0 ${Math.round(height * 0.72)} L${Math.round(width * 0.36)} ${Math.round(height * 0.38)} L${Math.round(width * 0.62)} ${Math.round(height * 0.62)} L${width} ${Math.round(height * 0.24)} V${height} H0Z" fill="#d3cec4"/>
  <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.1)}" width="${Math.round(width * 0.84)}" height="${Math.round(height * 0.8)}" rx="12" fill="none" stroke="${foreground}" stroke-width="3" stroke-dasharray="12 10"/>
  <text x="50%" y="47%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(18, Math.round(width / 24))}" font-weight="700" fill="${foreground}">${safeLabel}</text>
  <text x="50%" y="57%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(12, Math.round(width / 48))}" fill="${foreground}">${safeDetail}</text>
</svg>
`;
}

async function write(relativePath, contents) {
  const destination = path.join(ROOT, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}

function removeWorkflowChecks(source) {
  const targets = new Set(['fridge-round', 'learner-run', 'delivery-browser', 'delivery-browser-check']);
  return source
    .replace(
      /\[\[workflows\.workflow\]\][\s\S]*?(?=\n\[\[workflows\.workflow\]\]|\n\[agent\]|$)/g,
      (block) => {
        const name = block.match(/^name = "([^"]+)"/m)?.[1];
        if (name && targets.has(name)) return '';
        if (name !== 'Project') return block;
        return block.replace(
          /\n\[\[workflows\.workflow\.tasks\]\]\ntask = "workflow\.run"\nargs = "(?:fridge-round|learner-run|delivery-browser|delivery-browser-check)"\n/g,
          '',
        );
      },
    )
    .replace(/\n{3,}/g, '\n\n');
}

function rewriteMemoryIndex(source) {
  const removed = new Set(DELETE_PATHS.filter((item) => item.startsWith('.agents/memory/')).map((item) => path.basename(item)));
  return source
    .split('\n')
    .filter((line) => {
      const linked = line.match(/\]\(([^)]+)\)/)?.[1];
      return !linked || !removed.has(linked);
    })
    .join('\n')
    .replace(/\n+$/, '\n');
}

function replitMarkdown({ id, name, title, shellVersion, shellLine, kitLine }) {
  return `# ${title}

A blank Springpod try-day client scaffold for ${name}. All employer content is marked DRAFT and must be replaced and approved before delivery.

## Run & operate

- \`pnpm --filter @workspace/try-day run dev\` — run the web app.
- \`pnpm --filter @workspace/try-day run typecheck\` — typecheck the web app.
- \`cd artifacts/try-day && node --import tsx --test tests/*.test.ts\` — run the retained unit tests.
- \`pnpm --filter @workspace/try-day run new-client -- --id <client-id> --name "<Employer>" --title "<Try day title>" --confirm\` — cut another blank client from this template.
- No database or environment variables are required.

## Template version

- Shell version: \`${shellVersion}\` from \`artifacts/try-day/src/shell/VERSION\`.
- Client id: \`${id}\`.
- Saved progress key: \`springpod:${id}:v1\`.
- Sound preference key: \`springpod:${id}:sound-muted\`.

## Stack

- pnpm workspaces, TypeScript, Vite, React, Tailwind and shadcn/ui.
- Frontend-only; learner progress stays in localStorage.

## Where things live

- \`artifacts/try-day/src/\` follows one dependency direction: \`client -> shell -> kit\`.
${shellLine}
${kitLine}
  - \`src/client/\` — the replaceable employer client. The generated version contains one DRAFT task, one place, one mentor, placeholder pictures and placeholder briefing transcripts.
  - \`src/client/content/mechanic.json\` — the client day document and signed-off task copy once approved.
  - \`src/client/lib/simulation.ts\` — task state and done-when evaluation.
  - \`src/client/theme.css\` — employer theme tokens.

## Client scaffold

- Replace every DRAFT string and placeholder asset before delivery.
- Keep one checklist item per clause in each task's \`doneWhen\`.
- Add task pages, workplace routes, device advice and briefing entries together; the client contract rejects missing entries at startup.
- Briefing entries intentionally have transcripts but no \`src\` until approved films are supplied.
- No recorded ambience loop is configured.
- Completed tasks remain frozen and task completion is posted to the embedding host.

## Boundaries

- Do not import \`src/client/\` from \`src/shell/\` or \`src/kit/\`.
- Do not put employer names, task ids, assets or copy into the shell or kit.
- Keep locale-specific copy and employer facts in the client.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id || !args.name || !args.title) usage('All of --id, --name and --title are required.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.id)) {
    usage('--id must be lower-case kebab-case (letters, numbers and single hyphens).');
  }
  if (args.id === OWN_CLIENT_ID) {
    usage(`Refusing to overwrite the source kitchen client id "${OWN_CLIENT_ID}". Choose a new client id.`);
  }

  const packagePath = path.join(APP, 'package.json');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  const mechanic = JSON.parse(await readFile(path.join(APP, 'src/client/content/mechanic.json'), 'utf8'));
  if (mechanic?.config?.id !== OWN_CLIENT_ID) {
    usage(`Expected the source template id "${OWN_CLIENT_ID}", found "${mechanic?.config?.id ?? 'unknown'}".`);
  }

  console.log('This will replace the current employer client and delete:');
  console.log('  artifacts/try-day/src/client/');
  for (const item of DELETE_PATHS) console.log(`  ${item}`);
  console.log('It will also remove the fridge-round, learner-run and delivery-browser commands/workflows.');

  if (!args.confirm) {
    console.error('\nRefusing to continue without --confirm. Nothing was changed.');
    process.exit(1);
  }

  const shellVersion = (await readFile(path.join(APP, 'src/shell/VERSION'), 'utf8')).trim();
  const existingReplit = await readFile(path.join(ROOT, 'replit.md'), 'utf8');
  const shellLine =
    existingReplit.split('\n').find((line) => line.startsWith('  - `src/shell/`')) ??
    '  - `src/shell/` — the reusable try-day runner and task frame.';
  const kitLine =
    existingReplit.split('\n').find((line) => line.startsWith('  - `src/kit/`')) ??
    '  - `src/kit/` — reusable controls, UI primitives and sound.';

  await rm(path.join(APP, 'src/client'), { recursive: true, force: true });
  for (const item of DELETE_PATHS) await rm(path.join(ROOT, item), { recursive: true, force: true });

  const taskId = 'draft-task';
  const placeId = 'workplace';
  const mentorId = 'mentor';

  await write(
    'artifacts/try-day/src/client/content/mechanic.json',
    `${JSON.stringify(
      {
        format: 'springpod-mechanic',
        version: 1,
        mechanicId: 'try-day-app',
        config: {
          mechanic: 'try-day-app',
          version: 1,
          id: args.id,
          employer: args.name,
          locale: 'en-GB',
          frame: {
            role: 'DRAFT learner role',
            workplace: `DRAFT workplace at ${args.name}`,
            shift: {
              start: '09:00',
              end: '17:00',
              rhythm: 'DRAFT: Describe how the working day changes from start to finish.',
            },
            people: [
              {
                name: 'DRAFT mentor',
                role: 'DRAFT mentor role',
                note: 'DRAFT: Explain how this person supports the learner.',
              },
            ],
            morningBrief: 'DRAFT: Add the approved opening briefing for this try day.',
            closeOfDay: 'DRAFT: Add the approved close-of-day message.',
            tone: 'DRAFT: Describe the employer voice and register.',
          },
          tasks: [
            {
              id: taskId,
              time: '09:00',
              place: 'DRAFT workplace',
              title: 'DRAFT task',
              situation: 'DRAFT: Explain what is happening when this task begins.',
              job: 'DRAFT: State what the learner needs to do.',
              materials: [
                {
                  name: 'DRAFT material',
                  description: 'DRAFT: Describe the information or equipment the learner uses.',
                },
              ],
              interaction: 'DRAFT: Describe who the learner works with.',
              doneWhen: 'The learner marks the placeholder task as complete.',
              whatHappensNext: 'The placeholder day closes.',
            },
          ],
          gate: {
            type: 'complete',
            id: args.id,
            label: 'Finish every task in the day to complete this section',
          },
        },
      },
      null,
      2,
    )}\n`,
  );

  await write(
    'artifacts/try-day/src/client/assets/logo.svg',
    svg({ label: args.name, detail: 'DRAFT logo', width: 720, height: 180, background: '#242424', foreground: '#f7f5f0' }),
  );
  await write(
    'artifacts/try-day/src/client/assets/hero.svg',
    svg({ label: titleCase(args.title), detail: 'DRAFT hero picture', width: 1600, height: 1000 }),
  );
  await write(
    'artifacts/try-day/src/client/assets/map.svg',
    svg({ label: 'Workplace map', detail: 'DRAFT map picture', width: 1200, height: 1200, background: '#f3efe7' }),
  );
  await write(
    'artifacts/try-day/src/client/assets/mentor.svg',
    svg({ label: 'Mentor', detail: 'DRAFT mentor picture', width: 640, height: 640, background: '#ddd8ce' }),
  );

  await write(
    'artifacts/try-day/src/client/content/client.ts',
    `import type {
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

export const TASK_ID = ${js(taskId)};
export const PLACE_ID = ${js(placeId)};
export const MENTOR_ID = ${js(mentorId)};

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
  title: ${js(args.title)},
  subtitle: ${js(args.name)},
  shortBrief: ${js(`${args.name} DRAFT: Introduce the role and workplace in one short paragraph.`)},
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
  welcomeBack: (name) => \`Welcome back, \${name}.\`,
  completed: 'You have completed this DRAFT try day.',
  resume: (time, title) => \`Continue at \${time}: \${title}.\`,
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
  duration: (text) => \`Duration \${text}\`,
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
`,
  );

  await write(
    'artifacts/try-day/src/client/lib/simulation.ts',
    `import mechanic from '@client/content/mechanic.json';
import {
  createDayRuntime,
  initialsFromName,
  type DayRuntime,
  type Evaluation,
  type Progress,
  type ProgressModel,
  type TaskId,
} from '@shell/lib/day';

export const TASK_ID = mechanic.config.tasks[0].id;

export interface DraftTaskState {
  complete: boolean;
}

export interface TaskStates extends Record<string, unknown> {
  [TASK_ID]: DraftTaskState;
}

export function initialTaskStates(): TaskStates {
  return { [TASK_ID]: { complete: false } };
}

export function evaluateTask(id: TaskId, tasks: TaskStates): Evaluation {
  if (id !== TASK_ID) throw new Error(\`Unknown task: \${id}\`);
  const met = tasks[TASK_ID].complete;
  return {
    done: met,
    checklist: [{ id: 'placeholder', label: 'Placeholder task marked complete', met }],
  };
}

export function testProgress(
  target: TaskId | null | undefined,
  initial: () => Progress<TaskStates>,
): Progress<TaskStates> {
  const progress = initial();
  const knownTarget = target === TASK_ID;
  const finished = target === null;
  return {
    ...progress,
    studentName: target === undefined ? '' : 'Learning Designer',
    initials: target === undefined ? '' : initialsFromName('Learning Designer'),
    startedAt: target === undefined ? null : new Date().toISOString(),
    tasks: { [TASK_ID]: { complete: finished } },
    completed: finished ? [TASK_ID] : [],
    completedAt: finished ? new Date().toISOString() : null,
    clock: mechanic.config.tasks[0].time,
    ...(knownTarget ? {} : {}),
  };
}

export const model: ProgressModel<TaskStates> = {
  initialTaskStates,
  evaluateTask,
  complicationRevealed: () => false,
  testProgress: (target, initial) =>
    testProgress(target === null ? null : target === TASK_ID ? TASK_ID : undefined, initial),
};

export const day: DayRuntime<TaskStates> = createDayRuntime(mechanic, model);
export const STORAGE_KEY = day.spec.STORAGE_KEY;
`,
  );

  await write(
    'artifacts/try-day/src/client/lib/progress.ts',
    `import { useProgress as useShellProgress } from '@shell/lib/progress-store';
import type { TaskStates } from './simulation';

export function useProgress() {
  return useShellProgress<TaskStates>();
}
`,
  );

  await write(
    'artifacts/try-day/src/client/pages/task.tsx',
    `import { PLACE_ID } from '@client/content/client';
import { useProgress } from '@client/lib/progress';
import { TASK_ID } from '@client/lib/simulation';
import { Button } from '@kit/ui/button';
import { KitchenFrame } from '@shell/frame/kitchen-frame';
import hero from '@client/assets/hero.svg';

export default function DraftTaskPage() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks[TASK_ID];
  const frozen = progress.completed.includes(TASK_ID);

  return (
    <KitchenFrame
      id={TASK_ID}
      dialogue={{ speaker: 'DRAFT mentor', text: 'DRAFT: Add the approved mentor guidance for this task.' }}
      scenes={{
        [PLACE_ID]: (
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-zinc-900 px-6 py-12 text-foreground">
            <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden="true" />
            <div className="relative w-full max-w-xl border border-border border-t-4 border-t-primary bg-background p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">DRAFT task scaffold</p>
              <h1 className="mt-2 text-3xl font-bold">Replace this task</h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                This control proves the client state, done-when check and task sign-off path are connected.
              </p>
              <Button
                className="mt-6 w-full"
                disabled={frozen || state.complete}
                onClick={() => updateTask(TASK_ID, (previous) => ({ ...previous, complete: true }))}
              >
                {state.complete ? 'Placeholder complete' : 'Mark placeholder complete'}
              </Button>
            </div>
          </section>
        ),
      }}
    />
  );
}
`,
  );

  await write(
    'artifacts/try-day/src/client/pages/close.tsx',
    `import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useProgress } from '@client/lib/progress';
import { Button } from '@kit/ui/button';

export default function ClosePage() {
  const { dayComplete, progress, reset, currentTaskId } = useProgress();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!dayComplete) setLocation(currentTaskId ? \`/task/\${currentTaskId}\` : '/');
  }, [currentTaskId, dayComplete, setLocation]);

  if (!dayComplete) return null;

  return (
    <main id="main-activity" tabIndex={-1} className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-2xl border border-border border-t-4 border-t-primary bg-card p-8 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">DRAFT close</p>
        <h1 className="mt-3 text-4xl font-bold">Placeholder day complete, {progress.studentName.split(' ')[0]}.</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Replace this page with the approved recap and close-of-day message.
        </p>
        <Button
          className="mt-8"
          variant="outline"
          onClick={() => {
            reset();
            setLocation('/');
          }}
        >
          Start again
        </Button>
      </section>
    </main>
  );
}
`,
  );

  await write(
    'artifacts/try-day/src/client/index.tsx',
    `import type { TryClient } from '@shell/lib/client';
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
  muteKey: ${js(`springpod:${args.id}:sound-muted`)},
});

export const tryClient: TryClient<TaskStates> = {
  day,
  brand: {
    name: ${js(args.name)},
    logo,
    logoAlt: ${js(`${args.name} DRAFT logo`)},
    documentTitle: ${js(args.title)},
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
`,
  );

  await write(
    'artifacts/try-day/src/client/theme.css',
    `:root {
  --background: 40 20% 98%;
  --foreground: 220 10% 16%;
  --border: 35 12% 82%;
  --input: 35 12% 82%;
  --ring: 208 54% 34%;
  --card: 0 0% 100%;
  --card-foreground: 220 10% 16%;
  --card-border: 35 12% 82%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 10% 16%;
  --popover-border: 35 12% 82%;
  --primary: 208 54% 34%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 12% 20%;
  --secondary-foreground: 0 0% 100%;
  --muted: 36 18% 93%;
  --muted-foreground: 220 7% 42%;
  --accent: 36 18% 93%;
  --accent-foreground: 220 10% 16%;
  --destructive: 0 68% 42%;
  --destructive-foreground: 0 0% 100%;
  --sidebar: 40 20% 97%;
  --sidebar-foreground: 220 10% 16%;
  --sidebar-border: 35 12% 82%;
  --app-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --app-font-serif: ui-serif, Georgia, Cambria, "Times New Roman", serif;
  --app-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --radius: 0.375rem;
}

.dark {
  --background: 220 12% 12%;
  --foreground: 40 20% 96%;
  --border: 220 8% 28%;
  --input: 220 8% 28%;
  --ring: 203 55% 62%;
  --card: 220 11% 16%;
  --card-foreground: 40 20% 96%;
  --card-border: 220 8% 28%;
  --popover: 220 11% 16%;
  --popover-foreground: 40 20% 96%;
  --popover-border: 220 8% 28%;
  --primary: 203 55% 62%;
  --primary-foreground: 220 12% 12%;
  --secondary: 40 20% 94%;
  --secondary-foreground: 220 12% 12%;
  --muted: 220 9% 22%;
  --muted-foreground: 220 8% 70%;
  --accent: 220 9% 22%;
  --accent-foreground: 40 20% 96%;
  --destructive: 0 58% 50%;
  --destructive-foreground: 0 0% 100%;
}
`,
  );

  await write(
    'artifacts/try-day/src/main.tsx',
    `import { createRoot } from 'react-dom/client';

import App from '@shell/app/App';
import { ErrorBoundary } from '@shell/app/error-boundary';
import { tryClient } from '@client/index';

import './index.css';

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App client={tryClient} />
  </ErrorBoundary>,
);
`,
  );

  await write(
    'artifacts/try-day/tests/day-runtime.test.ts',
    `import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { day, STORAGE_KEY, TASK_ID } from '@client/lib/simulation';
import { clientProblems } from '@shell/lib/client';

test('the generated client uses its own storage key', () => {
  assert.equal(STORAGE_KEY, ${js(`springpod:${args.id}:v1`)});
  assert.equal(day.spec.STORAGE_KEY, STORAGE_KEY);
});

test('designer fixtures preserve blank, finished and in-progress meanings', () => {
  const blank = day.testProgress(undefined);
  assert.deepEqual(blank.completed, []);
  assert.equal(blank.completedAt, null);

  const finished = day.testProgress(null);
  assert.deepEqual(finished.completed, [TASK_ID]);
  assert.ok(finished.completedAt);

  const running = day.testProgress(TASK_ID);
  assert.deepEqual(running.completed, []);
  assert.equal(running.clock, day.spec.getTask(TASK_ID).time);
  assert.equal(running.completedAt, null);

  const unknown = day.testProgress('not-a-task');
  assert.deepEqual(unknown.completed, []);
  assert.equal(unknown.completedAt, null);
});

register('./support/asset-loader.mjs', import.meta.url);

test('the generated client has every entry the shell looks up', async () => {
  const {
    WORKPLACE,
    MENTOR_ID,
    BRIEFING_VIDEOS,
    TASK_BRIEFING_VIDEO,
    TASK_DEVICE_ADVICE,
  } = await import('@client/content/client');
  const Page = () => null;
  const client = {
    day,
    workplace: WORKPLACE,
    mentor: { name: 'DRAFT mentor', personId: MENTOR_ID, photo: '', photoAlt: '' },
    taskPages: { [TASK_ID]: Page },
    taskDeviceAdvice: TASK_DEVICE_ADVICE,
    briefingVideos: BRIEFING_VIDEOS,
    mainBriefingVideo: 'main',
    taskBriefingVideo: TASK_BRIEFING_VIDEO,
  } as unknown as Parameters<typeof clientProblems>[0];
  assert.deepEqual(clientProblems(client), []);
});
`,
  );

  await write(
    'artifacts/try-day/tests/dial-reading.test.ts',
    `import assert from 'node:assert/strict';
import test from 'node:test';
import { dialAngle, dialReading, dialZones } from '@kit/dial-scale';

test('the reusable dial maps -30 to +30 over 270 degrees with zero at the top', () => {
  assert.equal(dialAngle(-30), -135);
  assert.equal(dialAngle(0), 0);
  assert.equal(dialAngle(30), 135);
  assert.equal(dialAngle(45), 135, 'clamped at the end of the scale');
  assert.equal(dialReading(3.4), '3.5');
  assert.equal(dialReading(-20.5), '-20.5');
  assert.equal(dialReading(4.1), '4');
});

test('dial zones can represent positive and negative safe limits', () => {
  const positive = dialZones(2);
  assert.deepEqual(positive.find((zone) => zone.tone === 'safe'), { from: 0, to: 2, tone: 'safe' });
  assert.equal(positive.find((zone) => zone.tone === 'warm')?.from, 2);
  assert.deepEqual(dialZones(-18), [
    { from: -30, to: -18, tone: 'safe' },
    { from: -18, to: 30, tone: 'warm' },
  ]);
});
`,
  );

  packageJson.scripts = {
    ...packageJson.scripts,
    'new-client': 'node ../../scripts/new-client.mjs',
  };
  for (const script of ['test:fridge-round', 'test:delivery:browser', 'test:learner-run', 'typecheck:delivery:browser']) {
    delete packageJson.scripts[script];
  }
  delete packageJson.devDependencies['@playwright/test'];
  delete packageJson.devDependencies['axe-core'];
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const workflowPath = path.join(ROOT, '.replit');
  await writeFile(workflowPath, removeWorkflowChecks(await readFile(workflowPath, 'utf8')));

  const memoryIndexPath = path.join(ROOT, '.agents/memory/MEMORY.md');
  await writeFile(memoryIndexPath, rewriteMemoryIndex(await readFile(memoryIndexPath, 'utf8')));

  await write(
    'replit.md',
    replitMarkdown({
      id: args.id,
      name: args.name,
      title: args.title,
      shellVersion,
      shellLine,
      kitLine,
    }),
  );

  console.log(`\nCreated blank client "${args.id}" for ${args.name}.`);
  console.log(`Shell version: ${shellVersion}`);
  console.log('Next: replace every DRAFT string and placeholder asset.');
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

await main();