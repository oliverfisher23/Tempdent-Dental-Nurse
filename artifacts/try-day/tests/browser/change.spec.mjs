import {
  spec,
  startTask,
  tap,
  taps,
  openCloseUp,
  confirm,
  done,
  carryOn,
  judged,
  decision,
  feedback,
  shot,
  expect, goTo } from './harness.mjs';

async function finishCloseUp(page, id) {
  const dialog = page.locator('[role=dialog]').first();
  if (await dialog.isVisible()) await done(page);
  expect(await judged(page, id) === 'right', `${id} should be right`);
  await carryOn(page);
}

async function answerSpeech(page, id, answer) {
  await tap(page, id, answer);
  expect(await judged(page, id) === 'right', `${id} should be right`);
  await carryOn(page);
}

async function playChange(page, screenshotSuffix) {
  await openCloseUp(page, 'inspect');
  await shot(page, `change-inspect-${screenshotSuffix}`);
  await taps(page, 'inspect', ['mirror', 'tweezers_ok', 'excavator', 'plastic']);
  await confirm(page, 'inspect');
  await finishCloseUp(page, 'inspect');

  await tap(page, 'others', 'both_forward');
  expect(await judged(page, 'others') === 'wrong', 'the deliberate wrong answer should be judged wrong');
  expect(await decision(page, 'others').getAttribute('data-state') === 'wrong', 'wrong feedback should have data-state wrong');
  expect(await feedback(page, 'others').isVisible(), 'wrong feedback should be visible');
  await page.locator('[data-testid=change-others]').click();
  await tap(page, 'others', 'sort');
  expect(await judged(page, 'others') === 'right', 'changing the answer should work');
  await carryOn(page);

  await answerSpeech(page, 'autoclave', 'spaced');

  await openCloseUp(page, 'rank');
  await taps(page, 'rank', ['priya', 'surgery', 'corridor', 'checkin']);
  await finishCloseUp(page, 'rank');

  await answerSpeech(page, 'help', 'box');
  await answerSpeech(page, 'message', 'short');

  await goTo(page, 'surgery2');
  await openCloseUp(page, 'examtray');
  // The tray is tap-to-lift, tap-the-tray-to-place.
  for (const item of ['exam', 'rolls', 'aspirator', 'threeinone', 'bib', 'drugs']) {
    await tap(page, 'examtray', item);
    await page.locator('[data-drop-zone=examtray-tray]').click();
  }
  await confirm(page, 'examtray');
  await finishCloseUp(page, 'examtray');

  await goTo(page, 'stock');
  await answerSpeech(page, 'delivery', 'shelf');

  // The load is gated on the delivery, so the learner goes back to decon for it.
  await goTo(page, 'decon');
  await shot(page, `change-load-${screenshotSuffix}`);
  await tap(page, 'load', 'cool');
  expect(await judged(page, 'load') === 'right', 'load should be right');
  await carryOn(page);

}

spec('change task', async (browser) => {
  const desktop = await startTask(browser, 5);
  await playChange(desktop.page, '1280x720');
  expect(desktop.errors.length === 0, `desktop browser errors: ${desktop.errors.join('; ')}`);
  await desktop.context.close();

  const mobile = await startTask(browser, 5, { viewport: { width: 390, height: 844 } });
  await playChange(mobile.page, '390x844');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join('; ')}`);
  await mobile.context.close();
});