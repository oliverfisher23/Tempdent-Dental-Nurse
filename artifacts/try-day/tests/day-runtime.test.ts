import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { TASK_ORDER } from '@client/content/activities';
import { day, STORAGE_KEY } from '@client/lib/simulation';

/**
 * The kitchen's day as the shell runs it: the runtime built by createDayRuntime
 * from the client's progress model. The designer panel and the progress store
 * only ever go through this object, so the fixtures it hands back have to mean
 * the same as the client's own testProgress.
 */

test('the storage key the shell derives is the one learners already have progress under', () => {
  assert.equal(STORAGE_KEY, 'springpod:mar-try-day:v1');
  assert.equal(day.spec.STORAGE_KEY, STORAGE_KEY);
});

test('designer fixtures keep their three meanings through the runtime', () => {
  // undefined: the blank day the Briefing and Reset controls ask for.
  const blank = day.testProgress(undefined);
  assert.deepEqual(blank.completed, []);
  assert.equal(blank.completedAt, null);
  assert.equal(blank.clock, day.spec.getTask(TASK_ORDER[0]).time);

  // null: every task complete, for the Close control.
  const finished = day.testProgress(null);
  assert.deepEqual(finished.completed, TASK_ORDER);
  assert.ok(finished.completedAt);

  // a task id: the tasks before it complete, that one in progress.
  const third = day.testProgress(TASK_ORDER[2]);
  assert.deepEqual(third.completed, TASK_ORDER.slice(0, 2));
  assert.equal(third.clock, day.spec.getTask(TASK_ORDER[2]).time);
  assert.equal(third.completedAt, null);

  // an id the day does not have opens a blank day, never a completed one.
  const unknown = day.testProgress('not-a-task');
  assert.deepEqual(unknown.completed, []);
  assert.equal(unknown.completedAt, null);
});

test('the runtime exposes every task the client routes to', () => {
  assert.deepEqual(day.spec.TASK_ORDER, TASK_ORDER);
  for (const id of TASK_ORDER) assert.equal(day.spec.getTask(id).id, id);
});

// The workplace module imports its map and backdrops; in node those resolve to path strings.
register('./support/asset-loader.mjs', import.meta.url);

test('a client missing what the shell looks up by id is refused before the first screen', async () => {
  const { clientProblems } = await import('@shell/lib/client');
  const { WORKPLACE } = await import('@client/content/kitchen');
  const Page = () => null;
  const broken = {
    day,
    workplace: { ...WORKPLACE, taskRoutes: { ...WORKPLACE.taskRoutes, 'chill-the-event-batch': { ...WORKPLACE.taskRoutes['chill-the-event-batch'], places: ['bench', 'walk-in-freezer'] } } },
    mentor: { name: 'Nobody', personId: 'nobody', photo: '', photoAlt: '' },
    taskPages: Object.fromEntries(TASK_ORDER.slice(1).map((id) => [id, Page])),
    taskDeviceAdvice: Object.fromEntries(TASK_ORDER.map((id) => [id, { title: '', interaction: '', advice: '' }])),
    briefingVideos: {},
    mainBriefingVideo: 'main',
    taskBriefingVideo: Object.fromEntries(TASK_ORDER.map((id) => [id, 'main'])),
  } as unknown as Parameters<typeof clientProblems>[0];

  const problems = clientProblems(broken);
  assert.ok(problems.some((p) => p.includes('"take-the-handover" has no page')), problems.join('\n'));
  assert.ok(problems.some((p) => p.includes('"walk-in-freezer"')), problems.join('\n'));
  assert.ok(problems.some((p) => p.includes('mainBriefingVideo "main"')), problems.join('\n'));
  assert.ok(problems.some((p) => p.includes('mentor.personId "nobody"')), problems.join('\n'));
  assert.ok(problems.every((p) => !p.includes('taskDeviceAdvice')), 'complete advice is not reported');
});

test('the kitchen client as built has none of those gaps', async () => {
  // src/client/index.tsx imports pictures and pages, which the node test runner
  // cannot load, so this mirrors the lookups it makes from the same content.
  const { clientProblems } = await import('@shell/lib/client');
  const { WORKPLACE, TERENCE_PERSON_ID } = await import('@client/content/kitchen');
  const { TASK_DEVICE_ADVICE } = await import('@client/content/experience-accessibility');
  const { BRIEFING_VIDEOS, TASK_BRIEFING_VIDEO } = await import('@client/content/briefing-videos');
  const Page = () => null;
  const client = {
    day,
    workplace: WORKPLACE,
    mentor: { name: 'Terence', personId: TERENCE_PERSON_ID, photo: '', photoAlt: '' },
    taskPages: Object.fromEntries(TASK_ORDER.map((id) => [id, Page])),
    taskDeviceAdvice: TASK_DEVICE_ADVICE,
    briefingVideos: BRIEFING_VIDEOS,
    mainBriefingVideo: 'main',
    taskBriefingVideo: TASK_BRIEFING_VIDEO,
  } as unknown as Parameters<typeof clientProblems>[0];
  assert.deepEqual(clientProblems(client), []);
});
