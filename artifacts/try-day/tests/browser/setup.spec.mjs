import {
  spec, startTask, tap, openCloseUp, confirm, done, judged, feedback, shot, expect,
} from './harness.mjs';

const wipe = ['headrest', 'light', 'delivery', 'aspirator', 'spittoon', 'surfaces', 'handles'];
const kit = ['oxygen', 'aed', 'adrenaline', 'aspirin', 'glucagon'];
const tray = ['exam', 'aspirator', 'anaesthetic', 'bond', 'composite', 'matrix', 'light', 'finish', 'bib'];

async function right(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be right`);
}

async function hold(page) {
  const control = page.getByRole('button', { name: /Hold the tap|Hold to flush/ }).last();
  await control.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Finish hold' }).focus();
  await page.keyboard.press('Enter');
}

const touch = (page, id, spot) => page.locator(`[data-testid=touch-${id}-${spot}]`).click();

/** The handwash as what the hands touch: wash, towel, tap through the towel, PPE tap-through, gloves last. */
async function wash(page, id, { first = [], wear = [] } = {}) {
  await openCloseUp(page, id);
  for (const spot of first) await touch(page, id, spot);
  await shot(page, `setup-v2-${id}-arrive`);
  await hold(page);
  await touch(page, id, 'towel');
  await touch(page, id, 'tap');
  await touch(page, id, 'ppe');
  for (const item of wear) await page.getByRole('button', { name: `${item} on` }).click();
  await touch(page, id, 'gloves');
  await right(page, id);
  await done(page);
}

async function move(page, id, zone = 'tray') {
  await tap(page, 'tray', id);
  await page.locator(`[data-drop-zone=tray-${zone}]`).click();
}

spec('setup V2 task', async (browser) => {
  const { page, context, errors } = await startTask(browser, 1);
  const pace = page.locator('[data-testid=own-pace]');
  if (await pace.getAttribute('aria-checked') !== 'true') await pace.click();

  await openCloseUp(page, 'mirror');
  await tap(page, 'mirror', 'watch');
  await right(page, 'mirror');

  // Gloves before the wash: recorded and judged, not refused; the world line plays and the route restarts.
  await openCloseUp(page, 'handwash');
  await touch(page, 'handwash', 'gloves');
  expect(await judged(page, 'handwash') === 'wrong', 'gloves first should be wrong');
  expect((await page.locator('[data-testid=feedback-sheet-handwash]').textContent()).includes('what touches what'), 'gloves-first feedback should be shown');
  await page.locator('[data-testid=restart-handwash]').click();
  expect(await page.locator('[data-testid=route-handwash]').count() === 0, 'start again should clear the route');
  await hold(page);
  await touch(page, 'handwash', 'tap');
  expect((await page.locator('[data-testid=hands-handwash]').getAttribute('data-marks')) !== '0', 'tap off by hand should mark the hands');
  // Dirty hands can be washed again; the touch stays on the record for the judge.
  await hold(page);
  expect((await page.locator('[data-testid=hands-handwash]').getAttribute('data-marks')) === '0', 'a second wash should clean the hands');
  await touch(page, 'handwash', 'towel');
  await touch(page, 'handwash', 'tap');
  await touch(page, 'handwash', 'ppe');
  for (const item of ['Apron', 'Mask', 'Visor']) await page.getByRole('button', { name: `${item} on` }).click();
  await touch(page, 'handwash', 'gloves');
  expect(await judged(page, 'handwash') === 'wrong', 'tap off by hand should be wrong');
  await done(page);
  // The stage's Try again clears the answer from outside the close-up: the route starts afresh.
  await feedback(page, 'handwash').waitFor({ state: 'visible' });
  await page.locator('[data-testid=change-handwash]').click();
  // The real press-and-hold at natural pace, by keyboard: Space held to the end of the compressed clock.
  await pace.click();
  expect(await pace.getAttribute('aria-checked') === 'false', 'own pace should be off');
  await openCloseUp(page, 'handwash');
  expect(await page.locator('[data-testid=route-handwash]').count() === 0, 'try again should clear the recorded route');
  await page.getByRole('button', { name: 'Hold the tap' }).focus();
  await page.keyboard.down(' ');
  await page.waitForTimeout(600);
  await page.keyboard.up(' ');
  expect((await page.locator('[data-testid=hands-status-handwash]').textContent()).includes('start again'), 'an early release should say so');
  await page.keyboard.down(' ');
  await page.waitForTimeout(5400);
  await page.keyboard.up(' ');
  expect((await page.locator('[data-testid=hands-status-handwash]').textContent()).includes('still wet'), 'the full hold should wash the hands');
  await touch(page, 'handwash', 'towel');
  await touch(page, 'handwash', 'tap');
  await touch(page, 'handwash', 'ppe');
  for (const item of ['Apron', 'Mask', 'Visor']) await page.getByRole('button', { name: `${item} on` }).click();
  await touch(page, 'handwash', 'gloves');
  await right(page, 'handwash');
  await shot(page, 'setup-v2-handwash');
  await done(page);
  await pace.click();
  expect(await pace.getAttribute('aria-checked') === 'true', 'own pace should be back on');

  for (const id of ['light', 'cup', 'sharps', 'bin']) await tap(page, 'faults', id);
  await right(page, 'faults');

  // Keyboard route for the continuous wipe: focus each zone and press Enter.
  for (const id of wipe) {
    const zone = page.locator(`[data-testid=option-wipe-${id}]`);
    await zone.focus();
    await page.keyboard.press('Enter');
  }
  await confirm(page, 'wipe');
  await right(page, 'wipe');
  await shot(page, 'setup-v2-desktop');

  await openCloseUp(page, 'flush');
  await tap(page, 'flush', 'short');
  let control = page.getByRole('button', { name: 'Hold to flush' }).last();
  await control.click(); await page.getByRole('button', { name: 'Finish hold' }).click();
  expect(await judged(page, 'flush') === 'wrong', 'short first flush should be wrong');
  await done(page);
  await feedback(page, 'flush').waitFor({ state: 'visible' });
  expect(await feedback(page, 'flush').isVisible(), 'wrong flush feedback should be visible');
  await page.locator('[data-testid=change-flush]').click();
  await openCloseUp(page, 'flush');
  await tap(page, 'flush', 'two');
  control = page.getByRole('button', { name: 'Hold to flush' }).last();
  await control.click(); await page.getByRole('button', { name: 'Finish hold' }).click();
  await right(page, 'flush');

  await openCloseUp(page, 'kit');
  for (const id of kit) await tap(page, 'kit', id);
  await confirm(page, 'kit');
  await right(page, 'kit');
  await done(page);

  await tap(page, 'glucagon', 'report');
  await right(page, 'glucagon');
  await wash(page, 'fresh', { first: ['used'], wear: ['Apron'] });

  await openCloseUp(page, 'tray');
  await page.getByRole('button', { name: 'Turn over examination pouch' }).click();
  await move(page, 'exam', 'decon');
  await move(page, 'exam');
  for (const id of tray.slice(1)) await move(page, id);
  await confirm(page, 'tray');
  await right(page, 'tray');
  await right(page, 'pouch');
  await done(page);

  await openCloseUp(page, 'initials');
  await page.getByLabel('Your initials').fill('LD');
  await confirm(page, 'initials');
  await right(page, 'initials');
  expect(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  await context.close();

  const mobile = await startTask(browser, 1, { viewport: { width: 390, height: 844 } });
  await shot(mobile.page, 'setup-v2-mobile');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join(' | ')}`);
  await mobile.context.close();
});