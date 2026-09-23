import { mkdirSync } from 'node:fs';
import {
  spec, startTask, tap, openCloseUp, judged, decision, feedback, shot, expect,
} from './harness.mjs';

mkdirSync('/tmp/shots', { recursive: true });

async function expectRight(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be judged right`);
}

async function liftAndPlace(page, item, zone = 'next-hand') {
  await page.locator(`[data-testid=option-next-${item}]`).click();
  await page.locator(`[data-drop-zone=${zone}]`).click();
}

async function passWithKeyboard(page, item) {
  const control = page.locator(`[data-testid=option-next-${item}]`);
  await control.focus();
  await control.press('Space');
  await control.press('Enter');
}

async function playSegment(page) {
  await openCloseUp(page, 'next');
  await shot(page, 'filling-four-hands-desktop');

  await page.locator('[data-testid=option-next-suction]').click();
  await page.locator('[data-drop-zone=next-near]').click();
  await page.getByRole('button', { name: 'Start the segment', exact: true }).click();

  // Keyboard route: lift Etchant with Space and place it in Dr Reid's hand with Enter.
  await passWithKeyboard(page, 'etchant');
  await liftAndPlace(page, 'bond');
  await liftAndPlace(page, 'composite');

  expect(await page.getByText('Amira lifts her hand from the armrest.').isVisible(), 'Amira’s signal should be visible');
  await page.locator('[data-testid=paced-speak-up]').click();
  await liftAndPlace(page, 'matrix');

  await liftAndPlace(page, 'light');
  await page.getByRole('button', { name: 'Hold up the orange shield', exact: true }).click();
  await liftAndPlace(page, 'paper');

  expect(await page.locator('[data-testid=paced-debrief]').isVisible(), 'paced debrief should be visible');
  await page.getByRole('button', { name: 'Finish segment', exact: true }).click();
  await expectRight(page, 'next');
  await expectRight(page, 'suction');
  await expectRight(page, 'transfer');
  await expectRight(page, 'signal');
  await expectRight(page, 'light');
}

spec('filling V2 paced segment and sign-off', async (browser) => {
  const desktop = await startTask(browser, 3);
  await tap(desktop.page, 'la', 'pass');
  expect(await judged(desktop.page, 'la') === 'wrong', 'unsafe local anaesthetic answer should be wrong');
  expect(await decision(desktop.page, 'la').getAttribute('data-state') === 'wrong', 'la should expose its wrong state');
  expect(await feedback(desktop.page, 'la').isVisible(), 'wrong feedback should be visible');
  await desktop.page.locator('[data-testid=change-la]').click();
  await tap(desktop.page, 'la', 'leave');
  await expectRight(desktop.page, 'la');

  const pace = desktop.page.locator('[data-testid=own-pace]');
  if ((await pace.getAttribute('aria-checked')) !== 'true') await pace.click();
  await playSegment(desktop.page);

  await tap(desktop.page, 'restart', 'clear');
  await expectRight(desktop.page, 'restart');
  await desktop.page.getByText(/Bite's good/).waitFor({ state: 'visible' });
  await shot(desktop.page, 'filling-sign-off-desktop');
  expect(desktop.errors.length === 0, `desktop browser errors: ${desktop.errors.join('; ')}`);
  await desktop.context.close();

  const mobile = await startTask(browser, 3, { viewport: { width: 390, height: 844 } });
  await tap(mobile.page, 'la', 'leave');
  const mobilePace = mobile.page.locator('[data-testid=own-pace]');
  if ((await mobilePace.getAttribute('aria-checked')) !== 'true') await mobilePace.click();
  await openCloseUp(mobile.page, 'next');
  await mobile.page.locator('[data-testid=option-next-suction]').click();
  await mobile.page.locator('[data-drop-zone=next-near]').click();
  await shot(mobile.page, 'filling-four-hands-390x844');
  expect(await mobile.page.getByRole('button', { name: 'Start the segment', exact: true }).isVisible(), 'mobile close-up controls should remain reachable');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join('; ')}`);
  await mobile.context.close();
});