import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { day, STORAGE_KEY, TASK_ID } from '@client/lib/simulation';
import { clientProblems } from '@shell/lib/client';

test('the generated client uses its own storage key', () => {
  assert.equal(STORAGE_KEY, "springpod:tempdent-try-day:v1");
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
