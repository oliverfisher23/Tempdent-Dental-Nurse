import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRIDGE_INSPECTIONS as approvedInspections } from '../fixtures/fridge-approval/fridge-photos';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const mediaDir = path.join(projectRoot, 'src/assets/kitchen/inspections/videos');
const fixtureDir = path.join(projectRoot, 'tests/fixtures/fridge-approval');
const manifestFile = 'src/content/fridge-media.json';
const inspectionsFile = 'src/content/fridge-photos.ts';
const approvalFile = 'src/assets/kitchen/inspections/APPROVAL.md';
const mediaFields = ['video', 'webm', 'poster'] as const;

export type Manifest = Record<string, Record<string, {
  video: string; webm: string; poster: string; source: string;
}>>;
export type Inspections = typeof approvedInspections;
export type MediaFingerprints = Record<string, { sha256: string; decodedSha256: string }>;
export interface ApprovalSnapshot {
  manifest: Manifest;
  inspections: Inspections;
  sourceHashes: { manifest: string; inspections: string };
  files: MediaFingerprints;
}
export interface CurrentContent {
  manifestSource: string;
  inspectionsSource: string;
  inspections: Inspections;
  // Tests redirect individual files to temporary mutations, never edit shipped assets.
  mediaPath?: (filename: string) => string;
}
export interface ReviewIssue {
  kind: 'content-change' | 'source-only-change' | 'technical-media-change' | 'media-review' | 'missing-media' | 'invalid-source';
  material: string;
  detail: string;
}

export const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

export function inventoryHash(files: MediaFingerprints): string {
  return sha256(Object.keys(files).sort().map(name => `${files[name].sha256}  ${name}\n`).join(''));
}

/** Diagnostic only: every byte mismatch still fails, including identical decoded media. */
export function decodedFingerprint(filename: string): string {
  const options = { encoding: 'utf8' as const, timeout: 30_000, maxBuffer: 2 * 1024 * 1024 };
  const probe = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', filename,
  ], options)) as { streams: { codec_type: string }[] };
  // Hash every decoded RGB frame, dimensions, aspect ratio and presentation timing.
  // Retain stream types so added audio/streams cannot look like a video-only re-encode.
  const frames = execFileSync('ffmpeg', [
    '-v', 'error', '-i', filename, '-map', '0:v:0', '-an', '-sn', '-dn',
    '-fps_mode', 'passthrough', '-c:v', 'rawvideo', '-pix_fmt', 'rgb24',
    '-f', 'framehash', '-hash', 'sha256', '-',
  ], options).split('\n').filter(line => !line.startsWith('#software:')).join('\n');
  assert.match(frames, /^\d+,/m, `No decoded frames in ${filename}`);
  return sha256(JSON.stringify(probe.streams) + '\n' + frames);
}

export async function loadApprovedSnapshot(): Promise<ApprovalSnapshot> {
  const [approval, manifestSource, inspectionsSource, mediaSource] = await Promise.all([
    readFile(path.join(projectRoot, approvalFile), 'utf8'),
    readFile(path.join(fixtureDir, 'fridge-media.json'), 'utf8'),
    readFile(path.join(fixtureDir, 'fridge-photos.ts'), 'utf8'),
    readFile(path.join(fixtureDir, 'media-fingerprints.json'), 'utf8'),
  ]);
  const recordedHash = (label: string) => {
    const row = approval.split('\n').find(line => line.startsWith(`| ${label} |`));
    const hash = row?.match(/`([a-f0-9]{64})` \|$/)?.[1];
    assert.ok(hash, `Missing approved fingerprint for ${label} in ${approvalFile}; human review required.`);
    return hash;
  };
  const sourceHashes = {
    manifest: recordedHash('`' + manifestFile + '`'),
    inspections: recordedHash('`' + inspectionsFile + '`'),
  };
  assert.equal(sha256(manifestSource), sourceHashes.manifest, 'Manifest fixture no longer matches APPROVAL.md; do not auto-refresh it.');
  assert.equal(sha256(inspectionsSource), sourceHashes.inspections, 'Clue fixture no longer matches APPROVAL.md; do not auto-refresh it.');
  const files: MediaFingerprints = JSON.parse(mediaSource);
  assert.equal(inventoryHash(files), recordedHash('Combined inventory of the 42 mapped MP4, WebM and WebP files'),
    'Media fixture no longer matches APPROVAL.md; do not auto-refresh it.');
  const manifest: Manifest = JSON.parse(manifestSource);
  const mapped = Object.values(manifest).flatMap(states => Object.values(states).flatMap(state => mediaFields.map(field => state[field])));
  assert.equal(mapped.length, 42);
  assert.deepEqual(Object.keys(files).sort(), [...mapped].sort(), 'Fixture must cover exactly the approved media inventory.');
  for (const [name, file] of Object.entries(files)) {
    assert.match(file.decodedSha256, /^[a-f0-9]{64}$/, `Missing diagnostic fingerprint for ${name}`);
  }
  return { manifest, inspections: approvedInspections, sourceHashes, files };
}

export async function readCurrentContent(inspections: Inspections): Promise<CurrentContent> {
  const [manifestSource, inspectionsSource] = await Promise.all([
    readFile(path.join(projectRoot, manifestFile), 'utf8'),
    readFile(path.join(projectRoot, inspectionsFile), 'utf8'),
  ]);
  return { manifestSource, inspectionsSource, inspections };
}

function differences(before: unknown, after: unknown, material: string): ReviewIssue[] {
  if (Object.is(before, after)) return [];
  if (before && after && typeof before === 'object' && typeof after === 'object' &&
      Array.isArray(before) === Array.isArray(after)) {
    const a = before as Record<string, unknown>;
    const b = after as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
      .flatMap(key => differences(a[key], b[key], `${material}/${key}`));
  }
  const show = (value: unknown) => value === undefined ? '(absent)' : JSON.stringify(value);
  return [{ kind: 'content-change', material, detail: `Approved: ${show(before)}; current: ${show(after)}.` }];
}

// Stable clue IDs make a finding change actionable rather than just "source hash changed".
function inspectionView(inspections: Inspections) {
  return Object.fromEntries(Object.entries(inspections).map(([id, inspection]) => [id, {
    ...inspection,
    clueOrder: inspection.clues.map(clue => clue.id),
    clues: Object.fromEntries(inspection.clues.map(clue => [clue.id, clue])),
  }]));
}

export async function checkFridgeApproval(current: CurrentContent, approved: ApprovalSnapshot): Promise<ReviewIssue[]> {
  let manifest: Manifest;
  try {
    manifest = JSON.parse(current.manifestSource);
    assert.ok(manifest && typeof manifest === 'object' && !Array.isArray(manifest));
    for (const states of Object.values(manifest)) {
      assert.ok(states && typeof states === 'object' && !Array.isArray(states));
      for (const state of Object.values(states)) {
        assert.ok(state && typeof state === 'object');
        for (const field of [...mediaFields, 'source'] as const) assert.equal(typeof state[field], 'string');
      }
    }
  } catch (error) {
    return [{ kind: 'invalid-source', material: manifestFile, detail: `Cannot inspect manifest: ${String(error)}` }];
  }
  const manifestChanges = differences(approved.manifest, manifest, 'mapping');
  const clueChanges = differences(inspectionView(approved.inspections), inspectionView(current.inspections), 'inspection');
  const issues = [...manifestChanges, ...clueChanges];
  for (const [name, source, hash, changes] of [
    [manifestFile, current.manifestSource, approved.sourceHashes.manifest, manifestChanges],
    [inspectionsFile, current.inspectionsSource, approved.sourceHashes.inspections, clueChanges],
  ] as const) {
    if (sha256(source) !== hash && changes.length === 0) issues.push({
      kind: 'source-only-change', material: name,
      detail: 'File bytes changed but exported content is unchanged. Review code/formatting separately from findings.',
    });
  }

  for (const [appliance, states] of Object.entries(manifest)) {
    for (const [state, media] of Object.entries(states)) {
      for (const field of mediaFields) {
        const name = media[field];
        const material = `${appliance}/${state}/${field}: ${name}`;
        if (!name || path.basename(name) !== name || /[/\\]/.test(name)) {
          issues.push({ kind: 'invalid-source', material, detail: 'Expected a filename inside inspections/videos.' });
          continue;
        }
        const filename = current.mediaPath?.(name) ?? path.join(mediaDir, name);
        let hash: string;
        try {
          hash = sha256(await readFile(filename));
        } catch (error) {
          issues.push({ kind: 'missing-media', material, detail: `Cannot read mapped asset: ${String(error)}` });
          continue;
        }
        const original = approved.files[name];
        if (original?.sha256 === hash) continue;
        const hashes = `Approved SHA-256: ${original?.sha256 ?? '(not in approved inventory)'}; current: ${hash}.`;
        const replacement = Object.entries(approved.files).find(([other, file]) => other !== name && file.sha256 === hash);
        if (replacement) {
          issues.push({ kind: 'media-review', material, detail: `${hashes} Bytes match another approved asset: ${replacement[0]}. Review this substituted clip/poster and its clue pairing.` });
          continue;
        }
        if (!original) {
          issues.push({ kind: 'media-review', material, detail: `${hashes} New filename is not covered by the recorded snapshot.` });
          continue;
        }
        try {
          const identical = decodedFingerprint(filename) === original.decodedSha256;
          issues.push({
            kind: identical ? 'technical-media-change' : 'media-review', material,
            detail: `${hashes} ${identical
              ? 'Decoded frames, timing and stream types match. Candidate technical-only re-encode/remux; human confirmation still required.'
              : 'Decoded presentation differs. This may be changed content OR a lossy re-encode; compare with the approved clip/poster before deciding on sign-off.'}`,
          });
        } catch (error) {
          issues.push({ kind: 'media-review', material, detail: `${hashes} Unable to compare decoded presentation (file or FFmpeg problem): ${String(error)}` });
        }
      }
    }
  }
  return issues;
}

export function formatReviewIssues(issues: ReviewIssue[]): string {
  return [
    'Fridge approval snapshot diverged; human review required. The earlier sign-off does not automatically cover these changes.',
    ...issues.map(issue => `[${issue.kind}] ${issue.material}\n  ${issue.detail}`),
    'Compare affected material with APPROVAL.md. Record the content owner’s decision before deliberately updating a baseline.',
    'This check grants no rights clearance, renews no approval and authorises no publishing or learner-rule changes.',
  ].join('\n');
}