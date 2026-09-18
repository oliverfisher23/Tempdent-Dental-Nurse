import assert from 'node:assert/strict';

/**
 * Browser-level fridge coverage. Accepts a Playwright Page so the caller can
 * choose its browser/binary and preview URL without a production dependency.
 * Start in an empty Task 1 designer session, after reading the overnight log.
 * Uses real pointer/keyboard input, never synthetic pointer capture events.
 */
export async function verifyFridgeMedia(page) {
  const units = [
    ['walk-in', '3.4'], ['larder-1', '2.8'], ['larder-2', '8.6'],
    ['fish', '1.2'], ['dairy', '4.1'], ['freezer-1', '-20.5'], ['freezer-2', '-19.0'],
  ];
  const video = page.getByTestId('inspection-video');
  const assertMedia = async (unit, state, plays = true) => {
    await page.waitForFunction(({ unit, state, plays }) => {
      const v = document.querySelector('[data-testid="inspection-video"]');
      if (!v) return false;
      const correctPoster = v.poster.includes(`${unit}-${state}`);
      return correctPoster && (!plays || (
        v.currentSrc.includes(`${unit}-${state}`) && !v.paused && v.currentTime > 0
      ));
    }, { unit, state, plays });
    assert.equal(await video.count(), 1);
    const properties = await video.evaluate(v => ({
      muted: v.muted, loop: v.loop, inline: v.playsInline, controls: v.controls,
      portrait: v.videoHeight === 1280 && v.videoWidth === 720,
    }));
    assert.equal(properties.muted, true);
    assert.equal(properties.loop, true);
    assert.equal(properties.inline, true);
    assert.equal(properties.controls, false);
    if (plays) assert.equal(properties.portrait, true);
    const frame = await page.getByTestId('inspection-media-frame').boundingBox();
    assert.ok(frame && Math.abs(frame.width / frame.height - 9 / 16) < 0.001);
  };

  for (const [index, [unit, reading]] of units.entries()) {
    await page.waitForSelector(`[data-testid="fridge-inspection"][data-unit-id="${unit}"]`);
    await page.waitForSelector('[data-testid="fridge-inspection"][data-door-phase="closed"]');
    assert.ok((await page.getByTestId('inspection-poster').getAttribute('src')).includes(`${unit}-closed`));
    assert.equal(await video.count(), 0, 'a closed door is a still, not an opening clip on repeat');
    await page.getByTestId('open-fridge').click();
    if (index !== 1) {
      await page.waitForFunction(unit => {
        const v = document.querySelector('[data-testid="inspection-video"]');
        return v?.currentSrc.includes(`${unit}-closed`) && !v.loop && !v.paused && v.currentTime > 0;
      }, unit);
    }
    await page.waitForSelector('[data-testid="fridge-inspection"][data-door-phase="open"]');
    if (index === 1) {
      assert.equal(await video.getAttribute('src'), null, 'pause choice survives opening the next appliance');
      await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
    }
    await assertMedia(unit, 'open');
    const clues = page.locator('[data-testid="fridge-inspection"] button[aria-pressed]');
    assert.equal(await clues.count(), 2);
    for (const clue of await clues.all()) {
      await clue.click();
      assert.equal(await clue.getAttribute('aria-pressed'), 'true');
    }
    if (index === 0) {
      // One actual wrap is enough to establish looping without time-driven progression.
      await video.evaluate(v => { v.currentTime = v.duration - 0.15; });
      await page.waitForFunction(() => {
        const v = document.querySelector('[data-testid="inspection-video"]');
        return v.currentTime < 1 && !v.paused;
      });
      assert.equal(await page.getByTestId('fridge-inspection').getAttribute('data-unit-id'), unit);
      await page.getByTestId('inspection-motion').focus();
      await page.keyboard.press('Space');
      assert.equal(await video.evaluate(v => v.paused), true);
    }
    const probe = page.getByRole('button', { name: /Take the temperature/ });
    await probe.scrollIntoViewIfNeeded();
    // The incoming interface starts a settling reading with a deliberate click.
    await probe.click();
    await page.getByTestId('probe-display').waitFor({ timeout: 15000 });
    await page.getByTestId('reading-input').fill(index === 0 ? '99' : reading);
    await page.getByTestId('initials-input').fill(index === 0 ? '' : 'LD');
    if (index === 0) {
      await page.getByTestId('close-fridge').click();
      await page.getByText('Have another look at the probe and write that number.', { exact: true }).waitFor();
      await page.getByTestId('reading-input').fill(reading);
      await page.getByTestId('close-fridge').click();
      await page.getByText("Don't forget your initials.", { exact: true }).waitFor();
      await page.getByTestId('initials-input').fill('LD');
    }
    if (unit === 'larder-2') {
      await page.getByTestId('close-fridge').click();
      await page.getByText('Check inside the fridge, then write what you found and what you did.', { exact: true }).waitFor();
      await page.getByTestId('corrective-note').fill('Moved rice and melon into larder one and kept the door shut.');
    }
    const openVideo = await video.elementHandle();
    await page.getByTestId('close-fridge').click();
    await page.waitForFunction(previous => {
      const inspection = document.querySelector('[data-testid="fridge-inspection"]');
      return !inspection || inspection.getAttribute('data-unit-id') !== previous;
    }, unit);
    assert.equal(await openVideo.evaluate(v => v.paused && !v.hasAttribute('src')), true);
    await openVideo.dispose();
  }
  await page.getByRole('heading', { name: 'Temperature board', exact: true }).waitFor();
}