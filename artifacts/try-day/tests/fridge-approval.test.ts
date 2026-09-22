import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { before } from 'node:test';
import { FRIDGE_INSPECTIONS } from '@client/content/fridge-photos';
import {
  checkFridgeApproval,
  formatReviewIssues,
  loadApprovedSnapshot,
  mediaDir,
  readCurrentContent,
  type ApprovalSnapshot,
  type CurrentContent,
  type ReviewIssue,
} from './support/fridge-approval';

let approved: ApprovalSnapshot;

before(async () => {
  approved = await loadApprovedSnapshot();
});

function redirect(current: CurrentContent, replacements: Record<string, string>): CurrentContent {
  return {
    ...current,
    mediaPath: filename => replacements[filename] ?? path.join(mediaDir, filename),
  };
}

function oneIssue(
  issues: ReviewIssue[],
  kind: ReviewIssue['kind'],
  material: string,
): ReviewIssue {
  const matches = issues.filter(issue => issue.kind === kind && issue.material === material);
  assert.equal(matches.length, 1, formatReviewIssues(issues));
  return matches[0];
}

test('the approved current set and frozen 24-file inventory pass unchanged', async () => {
  assert.equal(Object.keys(approved.files).length, 24);
  assert.match(approved.sourceHashes.manifest, /^[a-f0-9]{64}$/);
  assert.match(approved.sourceHashes.inspections, /^[a-f0-9]{64}$/);

  const current = await readCurrentContent(FRIDGE_INSPECTIONS);
  const issues = await checkFridgeApproval(current, approved);
  assert.deepEqual(issues, [], formatReviewIssues(issues));
});

test('a same-filename MP4 substitution identifies the exact state and replacement', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'fridge-substitution-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const substituted = path.join(directory, 'walk-in-open.mp4');
  await copyFile(path.join(mediaDir, 'fish-open.mp4'), substituted);

  const current = redirect(
    await readCurrentContent(FRIDGE_INSPECTIONS),
    { 'walk-in-open.mp4': substituted },
  );
  const issues = await checkFridgeApproval(current, approved);
  const issue = oneIssue(issues, 'media-review', 'walk-in/open/video: walk-in-open.mp4');
  assert.match(issue.detail, /Bytes match another approved asset: fish-open\.mp4/);
  assert.match(issue.detail, /substituted clip\/poster and its clue pairing/);
});

test('a changed finding reports appliance, clue ID, and old and new text', async () => {
  const inspections = structuredClone(FRIDGE_INSPECTIONS);
  const oldFinding = inspections['walk-in'].clues[0].finding;
  const newFinding = 'The produce has been moved and now needs a fresh inspection.';
  inspections['walk-in'].clues[0].finding = newFinding;

  const current = await readCurrentContent(inspections);
  current.inspectionsSource = current.inspectionsSource.replace(oldFinding, newFinding);
  const issues = await checkFridgeApproval(current, approved);
  const issue = oneIssue(issues, 'content-change', 'inspection/walk-in/clues/produce/finding');
  assert.match(issue.detail, new RegExp(oldFinding.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(issue.detail, new RegExp(newFinding));
});

test('a source mapping change fails even when mapped media bytes are untouched', async () => {
  const current = await readCurrentContent(FRIDGE_INSPECTIONS);
  const manifest = JSON.parse(current.manifestSource) as ApprovalSnapshot['manifest'];
  const oldSource = manifest.fish.open.source;
  const newSource = 'VIDEOS/Fish fridge/review-required.mp4';
  manifest.fish.open.source = newSource;
  current.manifestSource = JSON.stringify(manifest, null, 2) + '\n';

  const issues = await checkFridgeApproval(current, approved);
  const issue = oneIssue(issues, 'content-change', 'mapping/fish/open/source');
  assert.match(issue.detail, new RegExp(oldSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(issue.detail, new RegExp(newSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(issues.some(candidate => candidate.kind === 'media-review'), false);
});

test('renaming a clue is reported as deletion and addition within its appliance pairing', async () => {
  const inspections = structuredClone(FRIDGE_INSPECTIONS);
  inspections.fish.clues[0].id = 'replacement-fish-check';

  const current = await readCurrentContent(inspections);
  const issues = await checkFridgeApproval(current, approved);
  const removed = oneIssue(issues, 'content-change', 'inspection/fish/clues/fish-trays');
  const added = oneIssue(issues, 'content-change', 'inspection/fish/clues/replacement-fish-check');
  oneIssue(issues, 'content-change', 'inspection/fish/clueOrder/0');
  assert.match(removed.detail, /current: \(absent\)/);
  assert.match(added.detail, /Approved: \(absent\)/);
});

test('lossless and lossy re-encodes remain failures with different review classifications', {
  timeout: 120_000,
}, async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'fridge-reencode-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = path.join(mediaDir, 'walk-in-open.mp4');
  const lossless = path.join(directory, 'walk-in-open-lossless.mp4');
  const lossy = path.join(directory, 'walk-in-open-lossy.mp4');

  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', input, '-map', '0:v:0', '-an',
    '-c:v', 'libx264', '-threads', '2', '-crf', '0', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
    lossless,
  ], { timeout: 60_000 });
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', input, '-map', '0:v:0', '-an',
    '-c:v', 'libx264', '-threads', '2', '-crf', '34', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
    lossy,
  ], { timeout: 60_000 });

  const base = await readCurrentContent(FRIDGE_INSPECTIONS);
  const losslessIssues = await checkFridgeApproval(
    redirect(base, { 'walk-in-open.mp4': lossless }),
    approved,
  );
  const technical = oneIssue(
    losslessIssues,
    'technical-media-change',
    'walk-in/open/video: walk-in-open.mp4',
  );
  assert.match(technical.detail, /technical-only re-encode\/remux/);
  assert.match(technical.detail, /human confirmation still required/);
  assert.match(formatReviewIssues(losslessIssues), /human review required/);

  const lossyIssues = await checkFridgeApproval(
    redirect(base, { 'walk-in-open.mp4': lossy }),
    approved,
  );
  const uncertain = oneIssue(lossyIssues, 'media-review', 'walk-in/open/video: walk-in-open.mp4');
  assert.match(uncertain.detail, /may be changed content OR a lossy re-encode/);
  assert.match(uncertain.detail, /compare with the approved clip\/poster before deciding/);
  assert.doesNotMatch(uncertain.detail, /new footage/i);
});

test('changed WebM and poster assets and a missing file are all detected', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'fridge-derived-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const changedWebm = path.join(directory, 'walk-in-open.webm');
  const changedPoster = path.join(directory, 'walk-in-open.webp');
  const missingMp4 = path.join(directory, 'missing.mp4');
  await Promise.all([
    copyFile(path.join(mediaDir, 'fish-open.webm'), changedWebm),
    copyFile(path.join(mediaDir, 'fish-open.webp'), changedPoster),
  ]);

  const current = redirect(await readCurrentContent(FRIDGE_INSPECTIONS), {
    'walk-in-open.webm': changedWebm,
    'walk-in-open.webp': changedPoster,
    'freezer-1-closed.mp4': missingMp4,
  });
  const issues = await checkFridgeApproval(current, approved);
  assert.match(
    oneIssue(issues, 'media-review', 'walk-in/open/webm: walk-in-open.webm').detail,
    /fish-open\.webm/,
  );
  assert.match(
    oneIssue(issues, 'media-review', 'walk-in/open/poster: walk-in-open.webp').detail,
    /fish-open\.webp/,
  );
  assert.match(
    oneIssue(issues, 'missing-media', 'freezer-1/closed/video: freezer-1-closed.mp4').detail,
    /Cannot read mapped asset/,
  );
});

test('formatting-only source edits are classified separately from content changes', async () => {
  const current = await readCurrentContent(FRIDGE_INSPECTIONS);
  current.inspectionsSource += '\n';

  const issues = await checkFridgeApproval(current, approved);
  const issue = oneIssue(
    issues,
    'source-only-change',
    'src/client/content/fridge-photos.ts',
  );
  assert.match(issue.detail, /exported content is unchanged/);
  assert.equal(issues.some(candidate => candidate.kind === 'content-change'), false);
});