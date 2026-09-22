import { mkdirSync } from 'node:fs';
import {
  spec, startTask, tap, taps, openCloseUp, confirm, done, carryOn,
  judged, decision, option, feedback, shot, expect,
} from './harness.mjs';

mkdirSync('/tmp/shots', { recursive: true });

async function expectRight(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be judged right`);
}

async function moveToTray(page, decisionId, optionId) {
  await tap(page, decisionId, optionId);
  await page.getByRole('heading', { name: 'Tray', exact: true }).locator('..').click();
}

async function playFilling(page) {
  await tap(page, 'la', 'pass');
  expect(await judged(page, 'la') === 'wrong', 'the unsafe local anaesthetic answer should be wrong');
  expect(await decision(page, 'la').getAttribute('data-state') === 'wrong', 'la should expose its wrong state');
  expect(await feedback(page, 'la').isVisible(), 'wrong-answer feedback should be visible');
  await page.locator('[data-testid=change-la]').click();
  await tap(page, 'la', 'leave');
  await expectRight(page, 'la');
  await carryOn(page);

  await shot(page, 'filling-suction-1280x720');
  await tap(page, 'suction', 'near');
  await expectRight(page, 'suction');
  await carryOn(page);

  await openCloseUp(page, 'next');
  await shot(page, 'filling-next-items-1280x720');
  await taps(page, 'next', ['etchant', 'bond', 'composite', 'paper']);
  expect(await decision(page, 'next').last().getAttribute('data-state') === 'right', 'next-item order should be right');
  await done(page);
  await expectRight(page, 'next');
  await carryOn(page);

  await tap(page, 'transfer', 'chin');
  await expectRight(page, 'transfer');
  await carryOn(page);

  await tap(page, 'signal', 'say');
  await expectRight(page, 'signal');
  await carryOn(page);

  await tap(page, 'restart', 'clear');
  await expectRight(page, 'restart');
  await carryOn(page);

  await openCloseUp(page, 'light');
  await moveToTray(page, 'light', 'sleeved');
  await moveToTray(page, 'light', 'shield');
  await confirm(page, 'light');
  expect(await decision(page, 'light').last().getAttribute('data-state') === 'right', 'light tray should be right');
  await done(page);
  await expectRight(page, 'light');
  await carryOn(page);
}

spec('filling content and presentations', async (browser) => {
  const desktop = await startTask(browser, 3);
  await playFilling(desktop.page);
  expect(desktop.errors.length === 0, `desktop browser errors: ${desktop.errors.join('; ')}`);
  await desktop.context.close();

  const mobile = await startTask(browser, 3, { viewport: { width: 390, height: 844 } });
  await tap(mobile.page, 'la', 'leave');
  await expectRight(mobile.page, 'la');
  await carryOn(mobile.page);
  await shot(mobile.page, 'filling-suction-390x844');
  await tap(mobile.page, 'suction', 'near');
  await expectRight(mobile.page, 'suction');
  await carryOn(mobile.page);
  await openCloseUp(mobile.page, 'next');
  await shot(mobile.page, 'filling-next-items-390x844');
  expect(await option(mobile.page, 'next', 'etchant').isVisible(), 'mobile close-up options should not be clipped');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join('; ')}`);
  await mobile.context.close();
});