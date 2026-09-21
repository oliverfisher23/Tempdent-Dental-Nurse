import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { FRIDGE_INSPECTIONS } from '../src/content/fridge-photos';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mediaDir = path.join(projectRoot, 'src/assets/kitchen/inspections/videos');
const manifestPath = path.join(projectRoot, 'src/content/fridge-media.json');
const applianceIds = ['walk-in', 'larder-2', 'fish', 'freezer-1'] as const;
const expectedSources = {
  'walk-in': ['VIDEOS/Walk in fridge/7eb44cb6-f7e5-417b-abdb-bd148939a82a.mp4', 'VIDEOS/Walk in fridge/fc1f60bd-e556-431d-ad97-93c790b2f502.mp4'],
  'larder-2': ['VIDEOS/Larder fridge 2/ace56ee9-3aa9-43e7-a50f-aeeae8a07d1b.mp4', 'VIDEOS/Larder fridge 2/54d61ed4-9310-4cf8-80b9-249bf44765b1.mp4'],
  fish: ['VIDEOS/Fish fridge/6e3167ae-52d6-4b20-8a5a-378686cb3ec3.mp4', 'VIDEOS/Fish fridge/f5546038-06b0-407e-9154-3bb926b9e2b2.mp4'],
  'freezer-1': ['VIDEOS/Freezer 1/b0ba4ff8-8c13-49df-a8be-989690cd8465.mp4', 'VIDEOS/Freezer 1/9785aff9-b9ab-47cb-bce4-7cc577c7bea6.mp4'],
} as const;

type MediaManifest = Record<string, Record<'closed' | 'open', {
  video: string;
  webm: string;
  poster: string;
  source: string;
}>>;

async function readManifest(): Promise<MediaManifest> {
  return JSON.parse(await readFile(manifestPath, 'utf8')) as MediaManifest;
}

test('manifest maps exactly four appliance IDs and both expected source states', async () => {
  const manifest = await readManifest();
  assert.deepEqual(Object.keys(manifest), [...applianceIds]);
  for (const id of applianceIds) {
    assert.deepEqual(Object.keys(manifest[id]), ['closed', 'open']);
    assert.equal(manifest[id].closed.source, expectedSources[id][0]);
    assert.equal(manifest[id].open.source, expectedSources[id][1]);
    for (const state of ['closed', 'open'] as const) {
      assert.equal(manifest[id][state].video, `${id}-${state}.mp4`);
      assert.equal(manifest[id][state].webm, `${id}-${state}.webm`);
      assert.equal(manifest[id][state].poster, `${id}-${state}.webp`);
    }
  }
});

test('all mapped assets exist with silent portrait H.264 and VP9 video alternatives', async () => {
  const manifest = await readManifest();
  for (const id of applianceIds) {
    for (const state of ['closed', 'open'] as const) {
      const media = manifest[id][state];
      await Promise.all([
        access(path.join(mediaDir, media.video)),
        access(path.join(mediaDir, media.webm)),
        access(path.join(mediaDir, media.poster)),
      ]);
      for (const [basename, codec] of [[media.video, 'h264'], [media.webm, 'vp9']] as const) {
        const probe = JSON.parse(execFileSync('ffprobe', [
          '-v', 'error',
          '-show_entries', 'stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate',
          '-of', 'json',
          path.join(mediaDir, basename),
        ], { encoding: 'utf8' })) as { streams: Array<Record<string, unknown>> };
        assert.equal(probe.streams.length, 1, `${basename} must contain video only`);
        assert.equal(probe.streams[0].codec_name, codec, basename);
        assert.equal(probe.streams[0].codec_type, 'video', basename);
        assert.equal(probe.streams[0].width, 720, basename);
        assert.equal(probe.streams[0].height, 1280, basename);
        assert.equal(probe.streams[0].pix_fmt, 'yuv420p', basename);
        assert.equal(probe.streams[0].avg_frame_rate, '24/1', basename);
      }
    }
  }
});

test('inspection metadata covers every mapping and clues stay within portrait coordinates', () => {
  assert.deepEqual(Object.keys(FRIDGE_INSPECTIONS), [...applianceIds]);
  for (const id of applianceIds) {
    const inspection = FRIDGE_INSPECTIONS[id];
    assert.ok(inspection.alt);
    assert.ok(inspection.contents);
    assert.ok(inspection.clues.length);
    for (const clue of inspection.clues) {
      assert.ok(clue.x >= 0 && clue.x <= 100, `${id}/${clue.id} x`);
      assert.ok(clue.y >= 0 && clue.y <= 100, `${id}/${clue.id} y`);
    }
  }
});