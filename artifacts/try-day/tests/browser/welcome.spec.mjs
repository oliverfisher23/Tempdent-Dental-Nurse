import {
  spec, startTask, tap, taps, openCloseUp, confirm, done,
  judged, feedback, shot, expect, goTo,
} from './harness.mjs';

async function settleAmira(page, keyboardChair = false) {
  await tap(page, 'settle', 'coat');
  await tap(page, 'settle', 'sit');
  const chair = page.locator('[data-testid=option-settle-chair]');
  if (keyboardChair) {
    await chair.focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(1100);
    await page.keyboard.up('Space');
  } else {
    await chair.dispatchEvent('pointerdown', { pointerId: 1, button: 0 });
    await page.waitForTimeout(1100);
    await chair.dispatchEvent('pointerup', { pointerId: 1, button: 0 });
  }
  expect(await page.getByRole('status').filter({ hasText: 'Tell her before it moves' }).isVisible(), 'moving the chair first should trigger the explain line');
  await chair.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(1100);
  await page.keyboard.up('Space');
  await tap(page, 'settle', 'bib');
  await tap(page, 'settle', 'glasses');
  await confirm(page, 'settle');
  expect(await judged(page, 'settle') === 'right', 'settle controls should preserve the V1 sequence key');
}

async function playWelcome(page) {
  await tap(page, 'greet', 'across_room');
  expect(await judged(page, 'greet') === 'wrong', 'announcing treatment should be wrong');
  expect(await feedback(page, 'greet').isVisible(), 'wrong feedback should be visible');
  await page.locator('[data-testid=change-greet]').click();
  await tap(page, 'greet', 'named');
  expect(await judged(page, 'greet') === 'right', 'the private greeting should be right');

  await goTo(page, 'surgery2');
  await settleAmira(page, true);
  await tap(page, 'pause', 'pause');
  await openCloseUp(page, 'notes');
  await taps(page, 'notes', ['antibiotics', 'inhaler']);
  await confirm(page, 'notes');
  await done(page);
  await tap(page, 'antibiotics', 'tell');
  await tap(page, 'hurt', 'together');
  await tap(page, 'white', 'refer');
  await page.locator('[data-testid=debrief-surgery2]').waitFor({ state: 'visible' });
}

spec('welcome V2 people, controls and sign-off', async (browser) => {
  const desktop = await startTask(browser, 2);
  await desktop.page.evaluate(() => {
    sessionStorage.setItem('springpod:tempdent-try-day:opening:welcome:reception', '1');
    sessionStorage.setItem('springpod:tempdent-try-day:opening:welcome:surgery2', '1');
  });
  await desktop.page.reload({ waitUntil: 'networkidle' });
  await playWelcome(desktop.page);
  await shot(desktop.page, 'welcome-sign-off-desktop');
  expect(desktop.errors.length === 0, `desktop browser errors: ${desktop.errors.join(' | ')}`);
  await desktop.context.close();

  const mobile = await startTask(browser, 2, { viewport: { width: 390, height: 844 } });
  await mobile.page.evaluate(() => {
    sessionStorage.setItem('springpod:tempdent-try-day:opening:welcome:reception', '1');
    sessionStorage.setItem('springpod:tempdent-try-day:opening:welcome:surgery2', '1');
  });
  await mobile.page.reload({ waitUntil: 'networkidle' });
  await tap(mobile.page, 'greet', 'named');
  await goTo(mobile.page, 'surgery2');
  await shot(mobile.page, 'welcome-controls-390x844');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join(' | ')}`);
  await mobile.context.close();
});