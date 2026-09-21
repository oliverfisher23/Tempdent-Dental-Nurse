import assert from 'node:assert/strict';

/**
 * Browser-level coverage for Task 5 (approved closing-handover decisions P1–P5, P7).
 * Accepts a Playwright Page so the caller chooses its browser/binary and preview URL
 * without a production dependency. Start on any page of the app with ?testMode=1.
 * Uses real pointer/keyboard input only.
 */
export async function verifyCloseHandover(page, { base, phone = false, snap = async () => {} } = {}) {
  const hideDesigner = async () => {
    const style = await page.addStyleTag({
      content: '[aria-label="Learning designer test controls"]{opacity:0 !important;pointer-events:none !important}',
    });
    await style.evaluate((el) => el.setAttribute('data-hide-designer', ''));
  };
  const showDesigner = () => page.evaluate(() => document.querySelectorAll('style[data-hide-designer]').forEach((el) => el.remove()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

  await page.goto(`${base}/?testMode=1`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Designer test' }).click();
  await page.getByRole('button', { name: 'Task 5', exact: true }).click();
  await page.waitForURL(/hand-the-kitchen-on/);
  await hideDesigner();
  await page.waitForTimeout(600);
  await snap('01-pass');
  const lockedClipboard = page.getByRole('button', { name: /Write the handover.*Weigh every tub and write each weight first/ });
  await lockedClipboard.focus();
  assert.ok(await page.getByText('Weigh every tub and write each weight first.', { exact: true }).isVisible(), 'locked clipboard shows what unlocks it');

  // P1: inspect, weigh deliberately, write each reading once; nothing prefilled.
  await page.getByRole('button', { name: 'Weigh the waste' }).first().click();
  await page.getByRole('heading', { name: 'Weigh the waste' }).waitFor();
  await page.getByText('You’re here', { exact: true }).waitFor();
  await snap('01-waste-open');
  const bins = [['trimmings', '6.4'], ['spoilage', '1.8'], ['plate', '4.2']];
  for (const [index, [id, kg]] of bins.entries()) {
    await page.locator('button[aria-label^="Look at the tub"]').nth(index).click();
    await page.getByRole('button', { name: 'Put it on the scales' }).click();
    const input = page.locator(`#waste-${id}-weight`);
    await input.waitFor({ timeout: 8000 });
    assert.equal(await input.inputValue(), '', `${id}: reading must not be prefilled`);
    await page.getByText('The scales have settled').waitFor();
    if (index === 0) {
      await snap('02-waste-settled');
      await input.fill('9.9');
      await page.getByText('This does not match the scales').first().waitFor();
      await page.getByRole('button', { name: 'Write it in your notebook' }).click();
      await page.getByRole('button', { name: 'In your notebook' }).waitFor();
    }
    await input.fill(kg);
    await page.getByText('This matches the scales.').first().waitFor();
    if (index === 0) assert.match(await page.getByTestId('opener-count').innerText(), /1 of 3 tubs weighed/, 'waste opener count follows correct rows');
  }
  await page.getByRole('paragraph').filter({ hasText: 'All three rows are weighed and written.' }).waitFor();
  const wasteQuestion = page.getByRole('group', { name: 'Which waste would you look into, and what would you check next?' });
  await wasteQuestion.getByRole('button', { name: 'Food that went off before it was used' }).click();
  await page.getByText('rice and melon binned from larder fridge 2').waitFor();
  await page.locator('#waste-follow-up-reason').fill('Why the door was open and for how long, and whether the overnight check would catch it.');
  await snap('03-waste-done');
  await page.getByRole('button', { name: 'Write the handover' }).last().click();

  // P2: evidence rail labels; prompts only after an attempt.
  await page.getByRole('heading', { name: 'Kitchen handover' }).waitFor();
  for (const label of ['From your signed records', 'From the team', 'Proposed follow-up']) {
    assert.ok(await page.getByText(label, { exact: true }).count(), `evidence group ${label}`);
  }
  assert.ok(await page.getByText('8.6°C at 06:50').count(), 'larder 2 reading comes from the signed board');
  assert.ok(await page.getByText('Look into: Food that went off before it was used.').count(), 'waste follow-up listed as proposed');
  assert.equal(await page.getByText('Check your wording', { exact: true }).count(), 0, 'no prompts before an attempt');
  await snap('04-handover-blank');
  await page.getByRole('button', { name: 'Hand it over' }).click();
  await page.getByRole('alert').filter({ hasText: 'Write something under each heading first.' }).waitFor();
  assert.ok((await page.getByText('Check your wording', { exact: true }).count()) >= 4, 'prompts appear after the first attempt');
  await snap('05-handover-attempted');

  const text = {
    prepared: 'My 4 trays of beef shin (13.5 kg) are on the chill record I signed, last reading 5.9 at 12:45; to the walk-in once down. Frangipane made this morning, poached pear in the pastry fridge. No record seen for the tart or the Wellington.',
    short: 'Salmon: 8 kg came in against 12 ordered, so 4 kg short. Needed for tomorrow lunch, not tonight. Terence said he would ring the supplier before ten; nothing confirmed.',
    watch: 'Larder 2 read 8.6 at 06:50 after the door was found open overnight; rice and melon binned. Needs re-checking before service, not done. Table 3 Priya Nair severe nut allergy: poached pear instead of frangipane, still held for Terence checks.',
    walkIn: 'Walk-in read 3.4 this morning. Beef goes in once it is down. Terence half of the batch not on my record.',
  };
  for (const [id, value] of Object.entries(text)) await page.locator(`#handover-${id}`).fill(value);
  await page.getByRole('button', { name: 'Hand it over' }).click();
  await page.getByRole('alert').filter({ hasText: 'Choose a timing and name who does it' }).waitFor();

  // P3: group with an owner; larder 2 as later first, to trigger the evening team's challenge.
  const group = (label) => page.locator('fieldset', { hasText: label });
  await group('Re-check larder fridge 2').getByRole('button', { name: 'Later follow-up', exact: true }).click();
  await page.locator('#responsibility-larder2').fill('Evening sous chef');
  await group('Chase the missing salmon').getByRole('button', { name: 'Later follow-up', exact: true }).click();
  await page.locator('#responsibility-salmon').fill('Terence');
  await group('Pear for table 3').getByRole('button', { name: 'Before service', exact: true }).click();
  await page.locator('#responsibility-table3').fill('Terence and pastry');
  await page.getByRole('button', { name: 'Hand it over' }).click();

  // P4: finite questions, repair line on an unsupported answer, read-back.
  await page.getByTestId('evening-exchange').waitFor();
  await page.getByText("You've put the larder 2 re-check under later follow-up").waitFor();
  await snap('06-timing-challenge');
  await page.getByRole('button', { name: 'Put it before service' }).click();
  await page.getByTestId('exchange-salmon').waitFor();
  assert.ok(await page.getByText('You wrote under "What is short"').count(), 'quotes the learner heading');
  await snap('07-salmon-question');
  await page.getByRole('button', { name: 'None now. The rest is on its way' }).click();
  await page.getByRole('alert').filter({ hasText: 'Has that happened, or are you asking us to follow it up?' }).waitFor();
  const answerSalmon = async () => {
    await page.getByRole('button', { name: /4 kg\. 8 kg came in against the 12 kg ordered/ }).click();
    await page.getByRole('button', { name: "Tomorrow's lunch. Tonight doesn't use it" }).click();
    await page.getByRole('button', { name: /Terence said he'd ring the supplier before ten/ }).click();
  };
  await answerSalmon();
  await page.getByTestId('exchange-larder2').waitFor();

  // Refresh mid-exchange: the clipboard re-opens by itself, answers kept, resumes on the next open question.
  await page.reload({ waitUntil: 'networkidle' });
  await hideDesigner();
  await page.getByTestId('exchange-larder2').waitFor();
  assert.ok(await page.getByText('Salmon: 4 kg short (8 of 12 kg came in)').count(), 'resolved salmon read-back kept after refresh');
  await page.getByRole('button', { name: /It read 8.6°C at 06:50, above the/ }).click();
  await page.getByRole('button', { name: /It needs re-checking before service/ }).click();
  await page.getByTestId('exchange-table3').waitFor();
  await page.getByRole('button', { name: /Table 3, Priya Nair/ }).click();
  await page.getByRole('button', { name: /Poached pear instead of the frangipane/ }).click();
  await page.getByRole('button', { name: /It's on the events board/ }).click();
  await page.getByTestId('exchange-ready').waitFor();
  await page.getByRole('button', { name: /My 4 trays of beef shin/ }).click();
  await page.getByRole('button', { name: /Frangipane made this morning; poached pear in the pastry fridge/ }).click();
  await page.getByTestId('read-back').waitFor();
  await snap('08-read-back');

  // Editing a heading re-opens only the questions it answers.
  await page.locator('#handover-short').fill(`${text.short} Nothing else.`);
  await page.getByRole('button', { name: 'Hand it over' }).click();
  await page.getByTestId('exchange-salmon').waitFor();
  assert.equal(await page.getByTestId('exchange-larder2').count(), 0, 'larder 2 not asked again');
  assert.ok(await page.getByText('Larder 2: 8.6°C at 06:50').count(), 'larder 2 stays understood');
  await answerSalmon();
  await page.getByTestId('read-back').waitFor();

  // Keyboard: confirm the read-back with Enter.
  await page.getByTestId('confirm-read-back').focus();
  await page.keyboard.press('Enter');
  await page.getByText('Handover delivered').waitFor();
  await snap('09-delivered');
  await page.getByRole('button', { name: 'Go through the chill record with Terence' }).last().click();

  // P7: visible signature. (P6 comparison content is on hold and only clicked through here.)
  await page.getByRole('heading', { name: 'Review the cooling record with Terence' }).waitFor();
  await snap('10-review-open');
  for (const option of await page.locator('div.space-y-3.flex-1 > button').all()) {
    await option.click();
    if (await page.getByRole('button', { name: 'Ask Terence to sign', disabled: false }).count()) break;
  }
  await page.getByRole('button', { name: 'Ask Terence to sign' }).click();
  await page.getByTestId('mentor-signature').waitFor();
  assert.equal((await page.getByTestId('mentor-signature').textContent()).trim(), 'Terence, Executive sous chef');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `review must not overflow horizontally (${overflow}px)`);
  await snap('10-signed');

  // Frozen completed record stays as left.
  await showDesigner();
  await page.getByRole('button', { name: 'Designer test' }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.waitForURL(/\/close/);
  await page.goto(`${base}/task/hand-the-kitchen-on?testMode=1`, { waitUntil: 'networkidle' });
  await hideDesigner();
  await page.getByText("You've signed this off").waitFor();
  await snap('11-frozen');

  const real = errors.filter((e) => !/favicon|404/.test(e));
  assert.deepEqual(real, [], 'no page errors');
  return { phone, errors: real };
}
