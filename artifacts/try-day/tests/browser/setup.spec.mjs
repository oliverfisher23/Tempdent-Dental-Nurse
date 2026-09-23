import {
  spec, startTask, tap, openCloseUp, confirm, done, judged, feedback, shot, expect,
} from './harness.mjs';

const wipe = ['headrest', 'light', 'delivery', 'aspirator', 'spittoon', 'surfaces', 'handles'];
const kit = ['oxygen', 'aed', 'adrenaline', 'aspirin', 'glucagon'];
const tray = ['exam', 'aspirator', 'anaesthetic', 'bond', 'composite', 'matrix', 'light', 'finish', 'bib'];

async function right(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be right`);
}

async function hold(page, id) {
  await openCloseUp(page, id);
  const control = page.getByRole('button', { name: /Hold the tap|Hold to flush/ }).last();
  await control.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Finish hold' }).focus();
  await page.keyboard.press('Enter');
  await right(page, id);
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

  await hold(page, 'handwash');

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
  await hold(page, 'fresh');

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