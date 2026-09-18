import assert from 'node:assert/strict';
import test from 'node:test';
import {
  inspectionVideoSource,
  shouldCompleteInspectionOnce,
  shouldPlayInspection,
  startInspectionPlayback,
} from '../src/lib/inspection-playback';

test('selects one supported encoding, preferring original H.264 without fetching both', () => {
  const media = { src: 'unit-open.mp4', webmSrc: 'unit-open.webm' };
  assert.equal(inspectionVideoSource(media, { canPlayType: () => 'probably' }), media.src);
  assert.equal(inspectionVideoSource(media, { canPlayType: () => '' }), media.webmSrc);
});

test('motion plays only for the visible, active current scene', () => {
  const allowed = { motionEnabled: true, active: true, visible: true, inView: true };
  assert.equal(shouldPlayInspection(allowed), true);
  for (const flag of Object.keys(allowed)) {
    assert.equal(shouldPlayInspection({ ...allowed, [flag]: false }), false, flag);
  }
});

test('stopping a state pauses it and ignores its late playback rejection', async () => {
  let reject!: (reason?: unknown) => void;
  let pauses = 0;
  let blocked = 0;
  const player = fakePlayer(() => new Promise<void>((_, fail) => { reject = fail; }));
  const stop = startInspectionPlayback({
    ...player,
    pause: () => { pauses++; },
  }, {
    onFailure: () => { blocked++; },
  });
  player.fire('canplay');
  stop();
  reject(new Error('state changed'));
  await Promise.resolve();
  assert.equal(pauses, 1);
  assert.equal(blocked, 0);
});

test('loads first, waits for canplay, and then starts one playback attempt', () => {
  const calls: string[] = [];
  const player = fakePlayer(() => {
    calls.push('play');
    return Promise.resolve();
  }, () => calls.push('load'));
  const stop = startInspectionPlayback(player, { onFailure: () => {} });
  assert.deepEqual(calls, ['load']);
  player.fire('canplay');
  player.fire('canplay');
  assert.deepEqual(calls, ['load', 'play']);
  stop();
});

test('an inactive or still policy never requests playback', () => {
  const allowed = { motionEnabled: true, active: true, visible: true, inView: true };
  assert.equal(shouldPlayInspection({ ...allowed, motionEnabled: false }), false);
  assert.equal(shouldPlayInspection({ ...allowed, active: false }), false);
});

test('once completion skips unavailable motion but never completes while hidden or inactive', () => {
  const conditions = {
    playback: 'once' as const,
    motionEnabled: false,
    active: true,
    visible: true,
    inView: true,
    unavailable: false,
    ended: false,
  };
  assert.equal(shouldCompleteInspectionOnce(conditions), true);
  assert.equal(shouldCompleteInspectionOnce({ ...conditions, active: false }), false);
  assert.equal(shouldCompleteInspectionOnce({ ...conditions, visible: false }), false);
  assert.equal(shouldCompleteInspectionOnce({ ...conditions, inView: false }), false);
  assert.equal(shouldCompleteInspectionOnce({
    ...conditions,
    playback: 'loop',
    ended: true,
  }), false);
});

test('autoplay rejection reports a play failure while abort is cancellation', async () => {
  const failures: string[] = [];
  const blocked = fakePlayer(() => Promise.reject(new Error('autoplay blocked')));
  const stopBlocked = startInspectionPlayback(blocked, {
    onFailure: reason => failures.push(reason),
  });
  blocked.fire('canplay');
  await Promise.resolve();
  assert.deepEqual(failures, ['play']);
  stopBlocked();

  const aborted = fakePlayer(() => Promise.reject(new DOMException('superseded', 'AbortError')));
  const stopAborted = startInspectionPlayback(aborted, {
    onFailure: reason => failures.push(reason),
  });
  aborted.fire('canplay');
  await Promise.resolve();
  assert.deepEqual(failures, ['play']);
  stopAborted();
});

test('load errors expose the bounded still-image fallback', () => {
  const failures: string[] = [];
  const player = fakePlayer(() => Promise.resolve());
  const stop = startInspectionPlayback(player, {
    onFailure: reason => failures.push(reason),
  });
  player.fire('error');
  assert.deepEqual(failures, ['load']);
  stop();
});

function fakePlayer(play: () => Promise<void>, load: () => void = () => {}) {
  const listeners = new Map<string, Set<EventListener>>();
  return {
    readyState: 0,
    play,
    pause: () => {},
    load,
    addEventListener(type: string, listener: EventListener) {
      const group = listeners.get(type) ?? new Set<EventListener>();
      group.add(listener);
      listeners.set(type, group);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    fire(type: string) {
      for (const listener of listeners.get(type) ?? []) listener(new Event(type));
    },
  };
}