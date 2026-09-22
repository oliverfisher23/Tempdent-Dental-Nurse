import {
  spec, startTask, tap, taps, openCloseUp, confirm, done, carryOn,
  judged, decision, feedback, shot, expect,
} from './harness.mjs';

const prep = ['uniform', 'hair', 'handwash', 'ppe', 'gloves'];
const wipe = ['headrest', 'light', 'delivery', 'aspirator', 'spittoon', 'surfaces', 'handles'];
const kit = ['oxygen', 'aed', 'adrenaline', 'aspirin'];
const tray = ['exam', 'aspirator', 'anaesthetic', 'bond', 'composite', 'matrix', 'light', 'finish', 'bib'];

async function expectRight(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be right`);
}

async function finishCloseUp(page, id) {
  await done(page);
  await expectRight(page, id);
  await carryOn(page);
}

async function moveToTray(page, optionId) {
  await tap(page, 'tray', optionId);
  await page.locator('[data-drop-zone=tray-tray]').click();
}

spec('setup task', async (browser) => {
  const { page, context, errors } = await startTask(browser, 1);

  await openCloseUp(page, 'prep');
  await taps(page, 'prep', prep);
  await finishCloseUp(page, 'prep');

  await shot(page, 'setup-wipe-desktop');
  await taps(page, 'wipe', wipe);
  await expectRight(page, 'wipe');
  await carryOn(page);

  await tap(page, 'flush', 'short');
  expect(await judged(page, 'flush') === 'wrong', 'the short flush should be wrong');
  expect(await feedback(page, 'flush').isVisible(), 'wrong feedback should be visible');
  expect(await decision(page, 'flush').first().getAttribute('data-state') === 'wrong', 'wrong feedback state should be exposed');
  await page.locator('[data-testid=change-flush]').click();
  await tap(page, 'flush', 'two');
  await expectRight(page, 'flush');
  await carryOn(page);

  await tap(page, 'signoff', 'initials');
  await expectRight(page, 'signoff');
  await carryOn(page);

  await openCloseUp(page, 'kit');
  await taps(page, 'kit', kit);
  await confirm(page, 'kit');
  await finishCloseUp(page, 'kit');

  await tap(page, 'glucagon', 'report');
  await expectRight(page, 'glucagon');
  await carryOn(page);

  await tap(page, 'fresh', 'wash_fresh');
  await expectRight(page, 'fresh');
  await carryOn(page);

  await openCloseUp(page, 'tray');
  for (const optionId of tray) await moveToTray(page, optionId);
  await confirm(page, 'tray');
  await finishCloseUp(page, 'tray');

  await tap(page, 'pouch', 'aside');
  await expectRight(page, 'pouch');
  expect(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  await context.close();

  const mobile = await startTask(browser, 1, { viewport: { width: 390, height: 844 } });
  await openCloseUp(mobile.page, 'prep');
  await taps(mobile.page, 'prep', prep);
  await finishCloseUp(mobile.page, 'prep');
  await taps(mobile.page, 'wipe', wipe);
  await expectRight(mobile.page, 'wipe');
  await carryOn(mobile.page);
  await tap(mobile.page, 'flush', 'two');
  await expectRight(mobile.page, 'flush');
  await carryOn(mobile.page);
  await tap(mobile.page, 'signoff', 'initials');
  await expectRight(mobile.page, 'signoff');
  await carryOn(mobile.page);
  await openCloseUp(mobile.page, 'kit');
  await shot(mobile.page, 'setup-kit-mobile');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join(' | ')}`);
  await mobile.context.close();
});