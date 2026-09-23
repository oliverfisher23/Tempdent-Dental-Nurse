import {
  spec,
  startTask,
  tap,
  taps,
  openCloseUp,
  confirm,
  judged,
  feedback,
  shot,
  expect,
  goTo,
} from './harness.mjs';

async function liftAndPlace(page, item, zone) {
  await page.locator(`[data-drag-item="${item}"]`).click();
  const target = page.locator(`[data-drop-zone="${zone}"]`);
  await target.waitFor({ state: 'visible' });
  await page.waitForFunction((selector) => document.querySelector(selector)?.getAttribute('data-can-drop') === 'true', `[data-drop-zone="${zone}"]`);
  await target.click();
}

async function sortInstruments(page, keyboardFirst = false) {
  await openCloseUp(page, 'inspect');
  await shot(page, keyboardFirst ? 'change-zones-desktop' : 'change-zones-390x844');
  if (keyboardFirst) {
    const mirror = page.locator('[data-drag-item=mirror]');
    await mirror.focus();
    await mirror.press('Space');
    await mirror.press('Enter');
  } else {
    await liftAndPlace(page, 'mirror', 'inspect-forward');
  }
  for (const [item, zone] of [
    ['probe_debris', 'back'],
    ['tweezers_ok', 'forward'],
    ['excavator', 'forward'],
    ['tweezers_bent', 'aside'],
    ['plastic', 'forward'],
  ]) await liftAndPlace(page, item, `inspect-${zone}`);
  await confirm(page, 'inspect');
  expect(await judged(page, 'inspect') === 'right', 'instrument zones should be right');
}

async function loadAutoclave(page) {
  await openCloseUp(page, 'autoclave');
  await liftAndPlace(page, 'tray-one', 'autoclave-chamber');
  await liftAndPlace(page, 'tray-two', 'autoclave-chamber');
  await taps(page, 'autoclave', ['indicator', 'log']);
  await confirm(page, 'autoclave');
  expect(await judged(page, 'autoclave') === 'right', 'autoclave load should be right');
}

async function planMorning(page) {
  await openCloseUp(page, 'plan');
  for (const [job, column] of [
    ['priya', 'now'],
    ['surgery', 'next'],
    ['corridor', 'ask'],
    ['checkin', 'later'],
    ['load', 'later'],
  ]) await liftAndPlace(page, job, `plan-${column}`);
  await confirm(page, 'plan');
  expect(await judged(page, 'plan') === 'right', 'plan board should be right');
}

async function buildTray(page) {
  await goTo(page, 'surgery2');
  await openCloseUp(page, 'examtray');
  for (const item of ['exam', 'rolls', 'aspirator', 'threeinone', 'bib', 'drugs']) {
    await tap(page, 'examtray', item);
    await page.locator('[data-drop-zone=examtray-tray]').click();
  }
  await confirm(page, 'examtray');
  expect(await judged(page, 'examtray') === 'right', 'exam tray should be right');
}

async function checkDelivery(page) {
  await goTo(page, 'stock');
  await openCloseUp(page, 'delivery');
  await tap(page, 'delivery', 'anaesthetic');
  await confirm(page, 'delivery');
  expect(await judged(page, 'delivery') === 'wrong', 'one flag should be the deliberate wrong answer');
  await page.getByRole('button', { name: /close delivery note/i }).click();
  await page.locator('[role=dialog]').waitFor({ state: 'hidden' });
  await feedback(page, 'delivery').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await openCloseUp(page, 'delivery');
  await tap(page, 'delivery', 'anaesthetic');
  await taps(page, 'delivery', ['concentrate']);
  await confirm(page, 'delivery');
  expect(await judged(page, 'delivery') === 'right', 'both supervised-storage flags should be right');
}

async function finishLoad(page) {
  await goTo(page, 'decon');
  await openCloseUp(page, 'printout');
  await tap(page, 'printout', 'now');
  expect(await judged(page, 'printout') === 'right', 'printout decision should be right');
  await openCloseUp(page, 'labels');
  await taps(page, 'labels', ['expiry', 'initials', 'cabinet']);
  await confirm(page, 'labels');
  expect(await judged(page, 'labels') === 'right', 'labels should be right');
  for (const id of ['inspect', 'autoclave', 'plan', 'message', 'printout', 'labels']) {
    expect(await judged(page, id) === 'right', `${id} should remain right at sign-off`);
  }
  await page.getByText("Room's ready, corridor's clear, and you told Priya before you started.", { exact: false }).waitFor({ state: 'visible' });
}

async function playChange(page, keyboardFirst) {
  await sortInstruments(page, keyboardFirst);
  await loadAutoclave(page);
  await planMorning(page);
  await tap(page, 'message', 'short');
  expect(await judged(page, 'message') === 'right', 'message should be right');
  await buildTray(page);
  await checkDelivery(page);
  await finishLoad(page);
}

spec('change V2 plan board and sign-off', async (browser) => {
  const desktop = await startTask(browser, 5);
  await playChange(desktop.page, true);
  await shot(desktop.page, 'change-sign-off-desktop');
  expect(desktop.errors.length === 0, `desktop browser errors: ${desktop.errors.join('; ')}`);
  await desktop.context.close();

  const mobile = await startTask(browser, 5, { viewport: { width: 390, height: 844 } });
  await playChange(mobile.page, false);
  await shot(mobile.page, 'change-sign-off-390x844');
  expect(mobile.errors.length === 0, `mobile browser errors: ${mobile.errors.join('; ')}`);
  await mobile.context.close();
});