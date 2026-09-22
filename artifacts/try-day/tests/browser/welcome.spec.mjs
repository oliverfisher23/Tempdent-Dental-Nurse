import {
  spec, startTask, tap, taps, openCloseUp, confirm, done, carryOn,
  judged, decision, feedback, shot, expect, goTo } from './harness.mjs';

const settle = ['coat', 'sit', 'chair', 'bib', 'glasses'];
const notes = ['antibiotics', 'inhaler'];

async function expectRight(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be right`);
}

const goToSurgery = (page) => goTo(page, 'surgery2');

async function reachNotes(page) {
  await tap(page, 'greet', 'named');
  await expectRight(page, 'greet');
  await carryOn(page);
  await goToSurgery(page);
  await taps(page, 'settle', settle);
  await expectRight(page, 'settle');
  await carryOn(page);
  await tap(page, 'pause', 'pause');
  await expectRight(page, 'pause');
  await carryOn(page);
}

spec('welcome task', async (browser) => {
  const { page, context, errors } = await startTask(browser, 2);

  await tap(page, 'greet', 'across_room');
  expect(await judged(page, 'greet') === 'wrong', 'announcing the treatment should be wrong');
  expect(await feedback(page, 'greet').isVisible(), 'wrong feedback should be visible');
  expect(await decision(page, 'greet').first().getAttribute('data-state') === 'wrong', 'wrong feedback state should be exposed');
  await page.locator('[data-testid=change-greet]').click();
  await tap(page, 'greet', 'named');
  await expectRight(page, 'greet');
  await carryOn(page);
  await goToSurgery(page);

  await shot(page, 'welcome-settle-desktop');
  await taps(page, 'settle', settle);
  await expectRight(page, 'settle');
  await carryOn(page);

  await tap(page, 'pause', 'pause');
  await expectRight(page, 'pause');
  await carryOn(page);

  await openCloseUp(page, 'notes');
  await taps(page, 'notes', notes);
  await confirm(page, 'notes');
  await done(page);
  await expectRight(page, 'notes');
  await carryOn(page);

  await tap(page, 'antibiotics', 'tell');
  await expectRight(page, 'antibiotics');
  await carryOn(page);

  await tap(page, 'hurt', 'together');
  await expectRight(page, 'hurt');
  await carryOn(page);

  await tap(page, 'white', 'refer');
  await expectRight(page, 'white');
  expect(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  await context.close();

  const mobile = await startTask(browser, 2, { viewport: { width: 390, height: 844 } });
  await reachNotes(mobile.page);
  await openCloseUp(mobile.page, 'notes');
  await shot(mobile.page, 'welcome-notes-mobile');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join(' | ')}`);
  await mobile.context.close();
});