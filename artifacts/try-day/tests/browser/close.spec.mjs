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

async function playClose(page, screenshotSuffix) {
  await tap(page, 'approach', 'door');
  expect(await judged(page, 'approach') === 'wrong', 'the deliberate wrong answer should be judged wrong');
  expect(await decision(page, 'approach').getAttribute('data-state') === 'wrong', 'wrong feedback should have data-state wrong');
  expect(await feedback(page, 'approach').isVisible(), 'wrong feedback should be visible');
  await page.locator('[data-testid=change-approach]').click();
  await tap(page, 'approach', 'beside');
  expect(await judged(page, 'approach') === 'right', 'changing the answer should work');
  await carryOn(page);

  await goTo(page, 'surgery2');
  await taps(page, 'offers', ['upright', 'signal', 'explain']);
  await confirm(page, 'offers');
  expect(await judged(page, 'offers') === 'right', 'offers should be right');
  await carryOn(page);

  await answerSpeech(page, 'howbad', 'courage');
  await answerSpeech(page, 'minute', 'let_go');
  await answerSpeech(page, 'distress', 'tell');
  await answerSpeech(page, 'note', 'factual');
  await answerSpeech(page, 'slip', 'complete');

  await shot(page, `close-closedown-${screenshotSuffix}`);
  await taps(page, 'closedown', ['instruments', 'wipe', 'flush', 'sheets', 'off']);
  expect(await judged(page, 'closedown') === 'right', 'closedown should be right');
  await carryOn(page);

  await openCloseUp(page, 'handover');
  await shot(page, `close-handover-${screenshotSuffix}`);
  await taps(page, 'handover', ['tray', 'glucagon', 'delivery', 'graham']);
  await confirm(page, 'handover');
  await finishCloseUp(page, 'handover');
}

spec('close task', async (browser) => {
  const desktop = await startTask(browser, 6);
  await playClose(desktop.page, '1280x720');
  expect(desktop.errors.length === 0, `desktop browser errors: ${desktop.errors.join('; ')}`);
  await desktop.context.close();

  const mobile = await startTask(browser, 6, { viewport: { width: 390, height: 844 } });
  await playClose(mobile.page, '390x844');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join('; ')}`);
  await mobile.context.close();
});