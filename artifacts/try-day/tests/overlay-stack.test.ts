import test from 'node:test';
import assert from 'node:assert/strict';
import { isTopOverlay, popOverlay, pushOverlay } from '../src/components/kitchen/overlay-stack';

// Plain objects stand in for the overlay roots; the stack only compares identity.
const root = () => ({} as unknown as HTMLElement);

test('only the most recently opened overlay is on top, and closing it hands back to the one below', () => {
  const closeUp = root();
  const helpCard = root();
  pushOverlay(closeUp);
  assert.equal(isTopOverlay(closeUp), true);

  pushOverlay(helpCard);
  assert.equal(isTopOverlay(helpCard), true, 'the card opened over the close-up answers Escape');
  assert.equal(isTopOverlay(closeUp), false, 'the close-up underneath must ignore that same Escape');

  popOverlay(helpCard);
  assert.equal(isTopOverlay(closeUp), true, 'the next Escape reaches the close-up');
  popOverlay(closeUp);
  assert.equal(isTopOverlay(closeUp), false);
  assert.equal(isTopOverlay(null), false);
});

test('registering the same overlay twice does not make it count twice', () => {
  const map = root();
  const card = root();
  pushOverlay(map);
  pushOverlay(map);
  pushOverlay(card);
  popOverlay(card);
  popOverlay(map);
  assert.equal(isTopOverlay(map), false, 'one pop removes it entirely');
});
