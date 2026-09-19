import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * The client's kitchen photographs ship only as the WebP exports listed in
 * `kitchen-photos.json`. These checks keep the manifest, the files on disk and
 * the places that use them in step, and keep the page weight where it was agreed.
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(projectRoot, 'src/content/kitchen-photos.json');
const MAX_WIDTH = 1920;
const MAX_TOTAL_BYTES = 1024 * 1024;

const expectedSources = {
  'terence-square': 'Images/portrait.JPG',
  'terence-briefing': 'Images/portrait.JPG',
  'terence-briefing-2x': 'Images/portrait.JPG',
  'kitchen-line': 'Images/MP_02868.JPG',
  'kitchen-line-phone': 'Images/MP_02868.JPG',
  pass: 'Images/MP_03055.JPG',
  fridges: 'Images/MP_03045.JPG',
  bench: 'Images/MP_02917.JPG',
} as const;

interface PhotoExport {
  file: string;
  source: string;
  crop: string | null;
  size: string;
  quality: number;
  sharpen?: boolean;
  redact?: string[];
}
interface PhotoManifest {
  archive: string;
  outputDir: string;
  exports: Record<string, PhotoExport>;
}

async function readManifest(): Promise<PhotoManifest> {
  return JSON.parse(await readFile(manifestPath, 'utf8')) as PhotoManifest;
}

function identify(file: string): { width: number; height: number; format: string } {
  const [width, height, format] = execFileSync('magick', ['identify', '-format', '%w %h %m', file], {
    encoding: 'utf8', timeout: 30_000,
  }).trim().split(' ');
  return { width: Number(width), height: Number(height), format };
}

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  }));
  return files.flat();
}

test('manifest maps every export to one of the five supplied photographs', async () => {
  const manifest = await readManifest();
  assert.deepEqual(Object.keys(manifest.exports), Object.keys(expectedSources));
  for (const [key, source] of Object.entries(expectedSources)) {
    const spec = manifest.exports[key];
    assert.equal(spec.source, source);
    assert.doesNotMatch(spec.source, /__MACOSX|\/\._/, `${key} must name the photograph, not a resource fork`);
    assert.match(spec.file, /\.webp$/, `${key} must export WebP`);
    assert.match(spec.size, /^\d+x\d+$/);
    if (spec.crop !== null) assert.match(spec.crop, /^\d+x\d+\+\d+\+\d+$/, `${key} crop is an ImageMagick geometry`);
    for (const region of spec.redact ?? []) assert.match(region, /^\d+x\d+\+\d+\+\d+$/);
  }
  assert.equal(new Set(Object.values(expectedSources)).size, 5, 'all five photographs are used');
  // The fridge readouts in the photo are not evidence for the round: they must stay blurred.
  assert.ok((manifest.exports.fridges.redact ?? []).length >= 2, 'both fridge displays are redacted');
});

test('exports exist as stripped WebP at the manifest size, no wider than 1920px, under 1 MB in total', async () => {
  const manifest = await readManifest();
  const outputDir = path.join(projectRoot, manifest.outputDir);
  let total = 0;
  for (const [key, spec] of Object.entries(manifest.exports)) {
    const file = path.join(outputDir, spec.file);
    const bytes = (await stat(file)).size;
    total += bytes;
    const [width, height] = spec.size.split('x').map(Number);
    assert.ok(width <= MAX_WIDTH, `${key} is wider than ${MAX_WIDTH}px`);
    assert.deepEqual(identify(file), { width, height, format: 'WEBP' }, `${key} dimensions`);
    // A camera JPEG carries ~100 KB of EXIF and XMP; anything left behind shows up as metadata here.
    const metadata = execFileSync('magick', ['identify', '-format', '%[EXIF:*]%[XMP:*]', file], { encoding: 'utf8', timeout: 30_000 }).trim();
    assert.equal(metadata, '', `${key} still carries metadata`);
  }
  assert.ok(total < MAX_TOTAL_BYTES, `exports total ${total} bytes, over the 1 MB budget`);
});

test('every export is used by the app and the legacy PEOPLE ids keep the same portrait', async () => {
  const manifest = await readManifest();
  const files = await sourceFiles(path.join(projectRoot, 'src'));
  const sources = new Map(await Promise.all(files.map(async file => [file, await readFile(file, 'utf8')] as const)));
  for (const [key, spec] of Object.entries(manifest.exports)) {
    const used = [...sources.entries()].filter(([, text]) => text.includes(`${manifest.outputDir.replace(/^src\//, '@/')}/${spec.file}`));
    assert.ok(used.length > 0, `${key} (${spec.file}) is not imported anywhere under src/`);
  }

  const kitchen = sources.get(path.join(projectRoot, 'src/content/kitchen.ts'))!;
  const people = kitchen.match(/^\s*\{ id: '([a-z-]+)',.*portrait: ([^ ,}]+) \},?$/gm)!;
  const portraits = Object.fromEntries(people.map(line => {
    const [, id, portrait] = /id: '([a-z-]+)'.*portrait: ([^ ,}]+)/.exec(line)!;
    return [id, portrait];
  }));
  assert.equal(portraits.marcus, portraits.elena, 'both Terence entries share one portrait');
  assert.notEqual(portraits.marcus, 'null', 'Terence has a photograph');
  for (const id of ['sarah', 'porter', 'driver', 'evening-team']) {
    assert.equal(portraits[id], 'null', `${id} keeps the generic icon`);
  }
});
