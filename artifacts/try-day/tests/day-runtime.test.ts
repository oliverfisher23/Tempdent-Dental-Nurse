import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';
import { day, STORAGE_KEY } from '@client/lib/simulation';
import { clientProblems } from '@shell/lib/client';

// The content module imports its pictures; the loader hands them back as paths.
register('./support/asset-loader.mjs', import.meta.url);

test('the generated client uses its own storage key', () => {
  assert.equal(STORAGE_KEY, "springpod:tempdent-try-day:v2");
  assert.equal(day.spec.STORAGE_KEY, STORAGE_KEY);
});

test('designer fixtures preserve blank, finished and in-progress meanings', () => {
  const blank = day.testProgress(undefined);
  assert.deepEqual(blank.completed, []);
  assert.equal(blank.completedAt, null);

  const finished = day.testProgress(null);
  assert.deepEqual(finished.completed, ['setup', 'welcome', 'filling', 'reset', 'change', 'close']);
  assert.ok(finished.completedAt);

  const running = day.testProgress('setup');
  assert.deepEqual(running.completed, []);
  assert.equal(running.clock, day.spec.getTask('setup').time);
  assert.equal(running.completedAt, null);
  
  const mid = day.testProgress('filling');
  assert.deepEqual(mid.completed, ['setup', 'welcome']);
  assert.equal(mid.clock, day.spec.getTask('filling').time);

  const unknown = day.testProgress('not-a-task');
  assert.deepEqual(unknown.completed, []);
  assert.equal(unknown.completedAt, null);
  assert.equal(unknown.clock, day.spec.getTask('setup').time);
});

test('evaluator correctly processes test fixtures', () => {
  const finished = day.testProgress(null);
  const evaluation = day.model.evaluateTask('setup', finished.tasks);
  assert.equal(evaluation.done, true);
  assert.equal(evaluation.checklist.length, 9);
  assert.equal(evaluation.checklist[0].met, true);
  assert.equal(evaluation.checklist[1].met, true);
});

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
    mentor: { name: 'Priya Nair', personId: MENTOR_ID, photo: '', photoAlt: '' },
    taskPages: {
      setup: Page,
      welcome: Page,
      filling: Page,
      reset: Page,
      change: Page,
      close: Page,
    },
    taskDeviceAdvice: TASK_DEVICE_ADVICE,
    briefingVideos: BRIEFING_VIDEOS,
    mainBriefingVideo: 'main',
    taskBriefingVideo: TASK_BRIEFING_VIDEO,
  } as unknown as Parameters<typeof clientProblems>[0];
  assert.deepEqual(clientProblems(client), []);
});