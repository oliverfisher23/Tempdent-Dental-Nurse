import assert from 'node:assert/strict';
import test from 'node:test';
import approvedManifest from './fixtures/fridge-approval/fridge-media.json';
import { FRIDGE_INSPECTIONS as approvedInspections } from './fixtures/fridge-approval/fridge-photos';
import { getInspectionSelection } from '@client/scenes/handover/inspection-selection';

const states = ['closed', 'open'] as const;

test('the viewer selects each approved appliance clip, WebM, poster and clue list', () => {
  assert.equal(Object.keys(approvedManifest).length, 4);

  for (const [unitId, approvedStates] of Object.entries(approvedManifest)) {
    for (const state of states) {
      const selection = getInspectionSelection(unitId, state);
      const approvedMedia = approvedStates[state];

      assert.match(selection.media.src, new RegExp(`/${approvedMedia.video}$`), `${unitId}/${state} MP4`);
      assert.match(selection.media.webmSrc, new RegExp(`/${approvedMedia.webm}$`), `${unitId}/${state} WebM`);
      assert.match(selection.media.poster, new RegExp(`/${approvedMedia.poster}$`), `${unitId}/${state} poster`);
      assert.deepEqual(selection.inspection, approvedInspections[unitId], `${unitId}/${state} inspection`);
      assert.deepEqual(
        selection.visibleClues,
        state === 'open' ? approvedInspections[unitId].clues : [],
        `${unitId}/${state} visible clues`,
      );
    }
  }
});

test('closed and open viewer selections cannot cross appliance or state boundaries', () => {
  const selectedPaths = new Set<string>();

  for (const unitId of Object.keys(approvedManifest)) {
    const closed = getInspectionSelection(unitId, 'closed');
    const open = getInspectionSelection(unitId, 'open');

    assert.notEqual(closed.media.src, open.media.src, `${unitId} switches MP4`);
    assert.notEqual(closed.media.webmSrc, open.media.webmSrc, `${unitId} switches WebM`);
    assert.notEqual(closed.media.poster, open.media.poster, `${unitId} switches poster`);
    assert.equal(closed.visibleClues.length, 0, `${unitId} hides clues while closed`);
    assert.deepEqual(open.visibleClues, approvedInspections[unitId].clues, `${unitId} reveals approved clues`);

    for (const path of [
      closed.media.src,
      closed.media.webmSrc,
      closed.media.poster,
      open.media.src,
      open.media.webmSrc,
      open.media.poster,
    ]) {
      assert.equal(selectedPaths.has(path), false, `duplicate viewer asset selection: ${path}`);
      selectedPaths.add(path);
    }
  }

  assert.equal(selectedPaths.size, 24);
});