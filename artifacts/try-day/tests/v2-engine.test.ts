import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';
import type { Progress } from '@shell/lib/day';
import type { TaskStates } from '@client/lib/simulation';

register('./support/asset-loader.mjs', import.meta.url);

const { TASKS, correctAnswer } = await import('@client/content/tasks');
const { dayMemory, noticed, pouchSetAside, trayMissing } = await import('@client/lib/consequences');
const { currentDecision } = await import('@client/scenes/current');
const { readOwnPace } = await import('@client/lib/pace');

function progress(setup: Record<string, string | string[] | null> = {}, notepad: Progress<TaskStates>['notepad'] = []) {
  return {
    version: 1 as const, studentName: '', initials: '', startedAt: null, completed: [],
    tasks: { setup, welcome: {}, filling: {}, reset: {}, change: {}, close: {} } as TaskStates,
    completedAt: null, clock: '08:30', notepad, positions: {},
  };
}

test('day consequences derive tray, pouch and noticed entries', () => {
  const tray = TASKS.setup.scenes.flatMap((scene) => scene.decisions).find((decision) => decision.id === 'tray')!;
  const full = correctAnswer(tray) as string[];
  assert.deepEqual(trayMissing(progress({ tray: full })), []);
  assert.deepEqual(trayMissing(progress({ tray: full.filter((id) => id !== 'matrix') })), ['matrix']);
  assert.deepEqual(trayMissing(progress()), []);
  assert.equal(pouchSetAside(progress({ pouch: 'aside' })), true);
  assert.equal(pouchSetAside(progress({ pouch: 'use' })), false);
  const entries = [
    { id: '1', taskId: 'setup', at: '08:30', label: 'Noticed', value: 'Seal broken' },
    { id: '2', taskId: 'setup', at: '08:31', label: 'Note', value: 'Remember this' },
  ];
  assert.deepEqual(noticed(progress({}, entries)), [entries[0]]);
  assert.equal(dayMemory(progress({}, entries)).noticed.length, 1);
});

test('currentDecision keeps a blocker current before a blocked decision', () => {
  const blocker = {
    id: 'first', kind: 'choice' as const, prompt: 'First', options: [{ id: 'yes', label: 'Yes' }],
    correct: 'yes', clause: 'First', feedback: { speaker: 'Priya', right: 'Yes', wrong: 'No' },
  };
  const blocked = {
    ...blocker, id: 'second', prompt: 'Second', clause: 'Second',
    blockedBy: { decision: 'first', aside: { speaker: 'Priya', text: 'Do the first thing first.' } },
  };
  const task = { id: 'test', dialogue: { speaker: 'Priya', text: 'Test' }, scenes: [{ place: 'room', eyebrow: '', title: 'Room', intro: '', decisions: [blocker, blocked] }] };
  assert.equal(currentDecision(task, {})?.decision.id, 'first');
  assert.equal(currentDecision(task, { first: 'yes' })?.decision.id, 'second');
});

test('readOwnPace reads stored values and defaults without storage', () => {
  const previous = globalThis.window;
  const values = new Map<string, string>();
  globalThis.window = {
    localStorage: { getItem: (key: string) => values.get(key) ?? null },
    matchMedia: () => ({ matches: false }),
  } as unknown as Window & typeof globalThis;
  values.set('springpod:tempdent-try-day:own-pace', '1');
  assert.equal(readOwnPace(), true);
  values.set('springpod:tempdent-try-day:own-pace', '0');
  assert.equal(readOwnPace(), false);
  globalThis.window = {
    matchMedia: () => ({ matches: false }),
  } as unknown as Window & typeof globalThis;
  assert.equal(readOwnPace(), false);
  globalThis.window = previous;
});