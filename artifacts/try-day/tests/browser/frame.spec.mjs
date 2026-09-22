import { spec, startTask, taps, openCloseUp, done, carryOn, judged, decision, shot, expect } from './harness.mjs';

// The try day runs inside an embedded frame that can be as small as 390x480. Every
// pin on the photograph must be reachable by keyboard and visible above the panel.
const prep = ['uniform', 'hair', 'handwash', 'ppe', 'gloves'];
const wipe = ['headrest', 'light', 'delivery', 'aspirator', 'spittoon', 'surfaces', 'handles'];

async function tabToPin(page, id) {
  const pin = page.locator(`[data-testid=option-wipe-${id}] button`).first();
  for (let presses = 0; presses < 40; presses += 1) {
    if (await pin.evaluate((el) => el === document.activeElement)) return pin;
    await page.keyboard.press('Tab');
  }
  throw new Error(`could not reach pin ${id} by keyboard`);
}

async function playFrame(page, viewport) {
  await openCloseUp(page, 'prep');
  await taps(page, 'prep', prep);
  await done(page);
  expect(await judged(page, 'prep') === 'right', 'prep should be right');
  await carryOn(page);

  const stage = page.locator('[data-testid=scene-surgery2]');
  const stageBox = await stage.boundingBox();
  expect(stageBox && stageBox.height <= viewport.height, 'the stage fits inside the frame');

  // Focus the first pin, then tab through every one and check it is visible above the panel.
  await page.locator('[data-testid=option-wipe-headrest] button').first().focus();
  for (const id of wipe) {
    const pin = await tabToPin(page, id);
    const pinBox = await pin.boundingBox();
    const panelBox = await decision(page, 'wipe').boundingBox();
    expect(pinBox && panelBox && pinBox.y >= stageBox.y && pinBox.y + pinBox.height <= panelBox.y + 1, `pin ${id} sits fully above the panel at ${viewport.width}x${viewport.height} (pin bottom ${pinBox && Math.round(pinBox.y + pinBox.height)}, panel top ${panelBox && Math.round(panelBox.y)})`);
    expect(pinBox && pinBox.x >= stageBox.x - 1 && pinBox.x + pinBox.width <= stageBox.x + stageBox.width + 1, `pin ${id} is inside the frame horizontally`);
    await shot(page, `frame-wipe-${id}-${viewport.width}x${viewport.height}`);
    await page.keyboard.press('Enter');
  }
  expect(await judged(page, 'wipe') === 'right', 'the wipe tapped in order by keyboard should be right');
}

spec('embedded frame sizes', async (browser) => {
  for (const viewport of [{ width: 390, height: 480 }, { width: 800, height: 480 }]) {
    const { page, context, errors } = await startTask(browser, 1, { viewport });
    await playFrame(page, viewport);
    expect(errors.length === 0, `browser errors at ${viewport.width}x${viewport.height}: ${errors.join('; ')}`);
    await context.close();
  }
});
