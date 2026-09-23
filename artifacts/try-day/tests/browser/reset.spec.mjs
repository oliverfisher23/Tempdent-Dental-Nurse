import {
  spec, startTask, tap, taps, openCloseUp, confirm, done,
  judged, feedback, shot, expect, goTo,
} from './harness.mjs';

async function right(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be judged right`);
}

async function stickByKeyboard(page, labelId) {
  const label = page.locator(`[data-testid=option-batch-${labelId}]`);
  await label.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
}

spec('reset V2 task', async (browser) => {
  const { page, context, errors } = await startTask(browser, 4);
  const pace = page.locator('[data-testid=own-pace]');
  if (await pace.getAttribute('aria-checked') !== 'true') await pace.click();

  await taps(page, 'care', ['rinse', 'mirror', 'glasses', 'bib']);
  await confirm(page, 'care');
  await right(page, 'care');

  // Keyboard route for the chair press-and-hold.
  await openCloseUp(page, 'chair-up');
  let chair = page.getByRole('button', { name: 'Hold chair up slowly', exact: true }).last();
  await chair.focus();
  await page.keyboard.press('Enter');
  chair = page.getByRole('button', { name: 'Finish hold', exact: true });
  await chair.focus();
  await page.keyboard.press('Enter');
  await right(page, 'chair-up');

  // One coached wrong answer and the shared Try again route.
  await tap(page, 'praise', 'not_bad');
  expect(await judged(page, 'praise') === 'wrong', 'generic reassurance should be wrong');
  await feedback(page, 'praise').waitFor({ state: 'visible' });
  await page.locator('[data-testid=change-praise]').click();
  await tap(page, 'praise', 'specific');
  await right(page, 'praise');

  await openCloseUp(page, 'batch');
  // Keyboard lift and keyboard place for all three peel-and-stick labels.
  await stickByKeyboard(page, 'la_lot');
  await stickByKeyboard(page, 'comp_lot');
  await stickByKeyboard(page, 'bond_lot');
  await confirm(page, 'batch');
  await right(page, 'batch');

  await openCloseUp(page, 'dictation');
  await taps(page, 'dictation', ['restoration', 'la', 'signal', 'aftercare', 'recall6']);
  await confirm(page, 'dictation');
  await right(page, 'dictation');

  await tap(page, 'aftercare-eat', 'numb');
  await right(page, 'aftercare-eat');
  await tap(page, 'aftercare-numb', 'bite');
  await right(page, 'aftercare-numb');
  await tap(page, 'aftercare-pain', 'high');
  await right(page, 'aftercare-pain');

  await goTo(page, 'reception');
  await tap(page, 'recall', 'six_months');
  await right(page, 'recall');

  await goTo(page, 'surgery2');
  await tap(page, 'sharps', 'reid');
  await right(page, 'sharps');
  await tap(page, 'sam', 'honest');
  await right(page, 'sam');

  await openCloseUp(page, 'reset');
  for (const id of ['ppe', 'instruments', 'waste', 'gloves_off', 'box', 'doff']) {
    await page.locator(`[data-testid=option-reset-${id}]`).click();
  }
  await page.locator('[data-testid=option-reset-wipe]').click();
  for (const zone of ['headrest', 'light', 'delivery', 'spittoon', 'surfaces', 'handles']) {
    const target = page.locator(`[data-testid=wipe-zone-reset-${zone}]`);
    await target.focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('[data-testid=finish-wipe-reset]').click();

  // At your pace turns each timed hold into an explicit start/finish keyboard control.
  for (const id of ['flush', 'aspirator']) {
    const control = page.locator(`[data-testid=option-reset-${id}]`);
    await control.focus();
    await page.keyboard.press('Enter');
    await control.focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('[data-testid=option-reset-tray]').click();
  await shot(page, 'reset-v2-desktop');
  await confirm(page, 'reset');
  await right(page, 'reset');

  expect(await page.locator('[data-testid=debrief-surgery2]').isVisible(), 'scene debrief should show at sign-off');
  expect(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  await context.close();

  const mobile = await startTask(browser, 4, { viewport: { width: 390, height: 844 } });
  await shot(mobile.page, 'reset-v2-mobile');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join(' | ')}`);
  await mobile.context.close();
});