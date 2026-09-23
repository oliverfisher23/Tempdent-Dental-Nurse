import {
  spec, startTask, tap, openCloseUp, confirm, done,
  judged, feedback, shot, expect, goTo,
} from './harness.mjs';

async function chooseOffer(page, id) {
  await tap(page, 'offers', id);
}

async function hold(page, id) {
  const control = page.locator(`[data-testid=option-closedown-${id}]`);
  await control.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(1100);
  await page.keyboard.up('Space');
}

async function reachHandover(page) {
  await tap(page, 'position', 'beside');
  await tap(page, 'approach', 'door');
  expect(await judged(page, 'approach') === 'wrong', 'the deliberate wrong opening line should be wrong');
  expect(await feedback(page, 'approach').isVisible(), 'wrong feedback should be visible');
  await page.locator('[data-testid=change-approach]').click();
  await tap(page, 'approach', 'beside');
  await goTo(page, 'surgery2');

  await openCloseUp(page, 'offers');
  await chooseOffer(page, 'upright');
  await chooseOffer(page, 'signal');
  await chooseOffer(page, 'explain');
  await confirm(page, 'offers');
  await done(page);
  await tap(page, 'howbad', 'courage');
  await tap(page, 'minute', 'let_go');

  const ownPace = page.locator('[data-testid=own-pace]');
  if (await ownPace.getAttribute('aria-checked') === 'false') await ownPace.click();
  await openCloseUp(page, 'distress');
  await page.locator('[data-testid=paced-speak-up]').click();
  expect(await judged(page, 'distress') === 'right', 'Speak up should commit the calm response');
  const pacedDialog = page.locator('[role=dialog]');
  if (await pacedDialog.isVisible().catch(() => false)) {
    await pacedDialog.getByRole('button', { name: /close watch graham/i }).click();
  }
  await tap(page, 'note', 'factual');
  await tap(page, 'slip', 'complete');

  await tap(page, 'closedown', 'unit');
  await tap(page, 'closedown', 'light');
  await hold(page, 'chair');
  await hold(page, 'disinfectant');
  await confirm(page, 'closedown');
  expect(await judged(page, 'closedown') === 'right', 'door commit should judge the room state');
  await openCloseUp(page, 'handover');
  for (const id of ['tray', 'glucagon', 'delivery', 'minute', 'slip', 'child-first']) {
    const line = page.locator(`[data-testid=option-handover-${id}]`).first();
    await line.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await page.locator(`[data-testid=option-handover-${id}][data-chosen=true]`).waitFor({ state: 'visible' });
  }
  await confirm(page, 'handover');
  await done(page);
  expect(await judged(page, 'handover') === 'right', 'the notebook handover should be right');
  await page.locator('[data-testid=debrief-surgery2]').waitFor({ state: 'visible' });
}

spec('close V2 people, offers, paced moment and handover', async (browser) => {
  const desktop = await startTask(browser, 6);
  await desktop.page.evaluate(() => {
    sessionStorage.setItem('springpod:tempdent-try-day:opening:close:reception', '1');
    sessionStorage.setItem('springpod:tempdent-try-day:opening:close:surgery2', '1');
  });
  await desktop.page.reload({ waitUntil: 'networkidle' });
  await reachHandover(desktop.page);
  await shot(desktop.page, 'close-handover-desktop');
  expect(desktop.errors.length === 0, `desktop browser errors: ${desktop.errors.join(' | ')}`);
  await desktop.context.close();

  const mobile = await startTask(browser, 6, { viewport: { width: 390, height: 844 } });
  await mobile.page.evaluate(() => {
    sessionStorage.setItem('springpod:tempdent-try-day:opening:close:reception', '1');
    sessionStorage.setItem('springpod:tempdent-try-day:opening:close:surgery2', '1');
  });
  await mobile.page.reload({ waitUntil: 'networkidle' });
  await tap(mobile.page, 'position', 'beside');
  await tap(mobile.page, 'approach', 'beside');
  await goTo(mobile.page, 'surgery2');
  await openCloseUp(mobile.page, 'offers');
  await shot(mobile.page, 'close-offers-390x844');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join(' | ')}`);
  await mobile.context.close();
});