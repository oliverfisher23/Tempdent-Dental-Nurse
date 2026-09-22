import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

/**
 * Every picture under src/client/assets is listed in media-fingerprints.json
 * with its hash. A new, changed or deleted file fails until the manifest is
 * updated on purpose (UPDATE_MEDIA_FINGERPRINTS=1), so a placeholder cannot be
 * swapped for unapproved artwork without the change showing in review, and a
 * picture cannot silently go missing from the build. The manifest also records
 * whether each file is approved artwork or a placeholder awaiting the employer.
 */
const ROOT = new URL('../', import.meta.url).pathname;
const ASSETS = join(ROOT, 'src/client/assets');
const MANIFEST = join(ROOT, 'src/client/content/media-fingerprints.json');
const SIZE_BUDGET = 260 * 1024;

interface Entry { sha256: string; bytes: number; status: 'approved' | 'placeholder' }
type Manifest = Record<string, Entry>;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function fingerprint(): Manifest {
  const previous: Manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const next: Manifest = {};
  for (const file of walk(ASSETS).sort()) {
    const key = relative(ASSETS, file);
    const bytes = readFileSync(file);
    next[key] = { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, status: previous[key]?.status ?? 'placeholder' };
  }
  return next;
}

test('every client picture is fingerprinted, present and within its size budget', () => {
  const actual = fingerprint();
  if (process.env.UPDATE_MEDIA_FINGERPRINTS) writeFileSync(MANIFEST, `${JSON.stringify(actual, null, 2)}\n`);
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const listed = Object.keys(manifest).sort();
  assert.deepEqual(Object.keys(actual).sort(), listed, 'assets on disk differ from media-fingerprints.json (run with UPDATE_MEDIA_FINGERPRINTS=1 to accept)');
  for (const key of listed) {
    assert.equal(actual[key].sha256, manifest[key].sha256, `${key} has changed since it was fingerprinted`);
    assert.ok(actual[key].bytes <= SIZE_BUDGET, `${key} is ${Math.round(actual[key].bytes / 1024)} KB, over the ${SIZE_BUDGET / 1024} KB budget`);
    assert.ok(['approved', 'placeholder'].includes(manifest[key].status), `${key} has no approval status`);
  }
});

test('every client picture is referenced from client code, and only from there', () => {
  const sources = walk(join(ROOT, 'src')).filter((file) => /\.(tsx?|css|json)$/.test(file) && !file.endsWith('media-fingerprints.json'));
  const text = new Map(sources.map((file) => [file, readFileSync(file, 'utf8')]));
  for (const file of walk(ASSETS)) {
    const key = relative(ASSETS, file);
    const users = [...text.entries()].filter(([, body]) => body.includes(key)).map(([path]) => relative(ROOT, path));
    assert.ok(users.length > 0, `${key} is not referenced anywhere`);
    const outside = users.filter((path) => !path.startsWith('src/client/'));
    assert.deepEqual(outside, [], `${key} is referenced outside the client`);
  }
});
