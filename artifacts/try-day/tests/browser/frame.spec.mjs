import { spec, startTask, tap, openCloseUp, confirm, judged, decision, shot, expect, settled } from './harness.mjs';

// The try day runs inside an embedded frame that can be as small as 390x480. Every
// spot on the photograph (V2 find faults and wipe-path zones) must be reachable by
// keyboard and sit fully inside the frame above the panel.
const faults = ['light', 'cup', 'sharps', 'bin'];
const wipe = ['headrest', 'light', 'delivery', 'aspirator', 'spittoon', 'surfaces', 'handles'];

async function right(page, id) {
  expect(await judged(page, id) === 'right', `${id} should be right`);
}

/** The handwash route by keyboard alone: the hold, then every touch by focus and Enter, inside the frame. */
async function washByKeyboard(page, id, viewport) {
  await openCloseUp(page, id);
  const control = page.getByRole('button', { name: /Hold the tap/ }).last();
  await control.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Finish hold' }).focus();
  await page.keyboard.press('Enter');
  const press = async (locator, label) => {
    await locator.focus();
    await page.waitForTimeout(100);
    const box = await locator.boundingBox();
    expect(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height,
      `${label} sits inside the ${viewport.width}x${viewport.height} frame when focused`);
    await page.keyboard.press('Enter');
  };
  for (const spot of ['towel', 'tap', 'ppe']) await press(page.locator(`[data-testid=touch-${id}-${spot}]`), `touch ${spot}`);
  for (const item of ['Apron', 'Mask', 'Visor']) await press(page.getByRole('button', { name: `${item} on` }), `${item} on`);
  await press(page.locator(`[data-testid=touch-${id}-gloves]`), 'touch gloves');
  await right(page, id);
}

async function checkSpot(page, locator, decisionId, label, viewport) {
  // The guide bar's height changes between steps, so measure the stage afresh for every spot.
  await settled(page);
  await page.waitForTimeout(250);
  await locator.focus();
  await page.waitForTimeout(150);
  const stageBox = await page.locator('[data-testid=scene-surgery2]').boundingBox();
  const spotBox = await locator.boundingBox();
  const panelBox = await decision(page, decisionId).boundingBox();
  expect(spotBox && panelBox && spotBox.y >= stageBox.y - 1 && spotBox.y + spotBox.height <= panelBox.y + 1,
    `${label} sits fully above the panel at ${viewport.width}x${viewport.height} (spot bottom ${spotBox && Math.round(spotBox.y + spotBox.height)}, panel top ${panelBox && Math.round(panelBox.y)})`);
  expect(spotBox && spotBox.x >= stageBox.x - 1 && spotBox.x + spotBox.width <= stageBox.x + stageBox.width + 1,
    `${label} is inside the frame horizontally at ${viewport.width}x${viewport.height}`);
}

async function playFrame(page, viewport) {
  const pace = page.locator('[data-testid=own-pace]');
  if (await pace.getAttribute('aria-checked') !== 'true') await pace.click();

  await openCloseUp(page, 'mirror');
  await tap(page, 'mirror', 'watch');
  await right(page, 'mirror');
  await washByKeyboard(page, 'handwash', viewport);

  const stage = page.locator('[data-testid=scene-surgery2]');
  const stageBox = await stage.boundingBox();
  expect(stageBox && stageBox.height <= viewport.height, 'the stage fits inside the frame');

  // The four walk-in faults on the room photograph.
  for (const id of faults) {
    const spot = page.locator(`[data-testid=option-faults-${id}]`).first();
    await checkSpot(page, spot, 'faults', `fault ${id}`, viewport);
    await shot(page, `frame-fault-${id}-${viewport.width}x${viewport.height}`);
    await page.keyboard.press('Enter');
  }
  await right(page, 'faults');

  // The wipe path's zones by keyboard: focus each zone, Enter, then lift off.
  for (const id of wipe) {
    const zone = page.locator(`[data-testid=option-wipe-${id}]`).first();
    await checkSpot(page, zone, 'wipe', `zone ${id}`, viewport);
    await shot(page, `frame-wipe-${id}-${viewport.width}x${viewport.height}`);
    await page.keyboard.press('Enter');
  }
  await confirm(page, 'wipe');
  await right(page, 'wipe');
}

spec('embedded frame sizes', async (browser) => {
  for (const viewport of [{ width: 390, height: 480 }, { width: 800, height: 480 }]) {
    const { page, context, errors } = await startTask(browser, 1, { viewport });
    await playFrame(page, viewport);
    expect(errors.length === 0, `browser errors at ${viewport.width}x${viewport.height}: ${errors.join('; ')}`);
    await context.close();
  }
});
