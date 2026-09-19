import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * Every picture and clip under `src/assets/` must be named by something under
 * `src/`: an import in a `.ts`/`.tsx` module, or a filename in one of the JSON
 * manifests that `import.meta.glob` resolves (the fridge clips). Sixteen
 * generated pictures (about 2 MB) once sat unused for two days after the client
 * photographs and the fridge clips replaced them, and only a manual grep found
 * them. This check names the orphan so whoever swaps an asset deletes the old
 * one in the same change.
 *
 * Being named is a weaker claim than being shipped: `content/delivery-photos.ts`
 * imports `src/assets/delivery-photos/` and is itself not reachable from the
 * app. Reachability is a separate check; this one only catches files nothing
 * mentions at all.
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(projectRoot, 'src');
const assetsDir = path.join(srcDir, 'assets');

/** Notes and licence records that live beside the media are not media. */
function isDocumentation(file: string): boolean {
  return path.extname(file) === '.md' || path.basename(file) === 'sources.json';
}

/** Where a reference counts: code and manifests under src/, not files beside the media. */
function isReferenceSource(file: string): boolean {
  return /\.(ts|tsx|json)$/.test(file) && !file.startsWith(assetsDir + path.sep);
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return files.flat().sort();
}

/** Assets whose basename appears in none of the reference texts. */
function findOrphans(assets: string[], referenceTexts: string[]): string[] {
  return assets.filter(asset => {
    const basename = path.basename(asset);
    return !referenceTexts.some(text => text.includes(basename));
  });
}

function describeOrphans(orphans: string[]): string {
  const files = orphans.map(file => path.relative(projectRoot, file));
  const one = files.length === 1;
  return [
    `${one ? 'This file is' : 'These files are'} under src/assets/ but no .ts, .tsx or .json file under src/ (outside src/assets/) names ${one ? 'it' : 'them'}:`,
    ...files.map(file => `  - ${file}`),
    `Delete ${one ? 'it' : 'each one'}, or import it (or list it in the manifest that import.meta.glob resolves) so the app uses it.`,
  ].join('\n');
}

test('every file under src/assets/ is named by a module or manifest under src/', async () => {
  const assets = (await walk(assetsDir)).filter(file => !isDocumentation(file));
  assert.ok(assets.length > 0, 'src/assets/ has pictures or clips to check');

  const referenceFiles = (await walk(srcDir)).filter(isReferenceSource);
  const referenceTexts = await Promise.all(referenceFiles.map(file => readFile(file, 'utf8')));

  const orphans = findOrphans(assets, referenceTexts);
  assert.deepEqual(orphans.map(file => path.relative(projectRoot, file)), [], describeOrphans(orphans));
});

test('the check names a file nothing mentions and accepts imports and manifest filenames', () => {
  const assets = [
    'src/assets/kitchen/backdrop-old.jpg',
    'src/assets/kitchen/backdrop.jpg',
    'src/assets/kitchen/inspections/videos/walk-in-open.mp4',
  ];
  const references = [
    "import backdrop from '@/assets/kitchen/backdrop.jpg';",
    '{ "walk-in": { "open": { "video": "walk-in-open.mp4" } } }',
  ];
  assert.deepEqual(findOrphans(assets, references), ['src/assets/kitchen/backdrop-old.jpg']);
  const message = describeOrphans([path.join(projectRoot, assets[0])]);
  assert.match(message, /src\/assets\/kitchen\/backdrop-old\.jpg/);
  assert.match(message, /Delete it, or import it/);
});
