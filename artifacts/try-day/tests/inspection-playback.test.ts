import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectionVideoSource, shouldPlayInspection, startInspectionPlayback } from '../src/lib/inspection-playback';

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
  const stop = startInspectionPlayback({
    play: () => new Promise<void>((_, fail) => { reject = fail; }),
    pause: () => { pauses++; },
  }, () => { blocked++; });
  stop();
  reject(new Error('state changed'));
  await Promise.resolve();
  assert.equal(pauses, 1);
  assert.equal(blocked, 0);
});

test('autoplay rejection exposes a usable still-image fallback', async () => {
  let blocked = 0;
  startInspectionPlayback({
    play: () => Promise.reject(new Error('autoplay blocked')),
    pause: () => {},
  }, () => { blocked++; })();
  await Promise.resolve();
  assert.equal(blocked, 0, 'an unmounted video cannot set fallback state');
  startInspectionPlayback({
    play: () => Promise.reject(new Error('autoplay blocked')),
    pause: () => {},
  }, () => { blocked++; });
  await Promise.resolve();
  assert.equal(blocked, 1);
});

test('a synchronous playback failure also exposes the fallback', () => {
  let blocked = false;
  startInspectionPlayback({
    play: () => { throw new Error('unsupported'); },
    pause: () => {},
  }, () => { blocked = true; });
  assert.equal(blocked, true);
});