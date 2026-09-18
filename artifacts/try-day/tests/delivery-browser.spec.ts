import { expect, test } from '@playwright/test';
import { DELIVERY, DeliveryHarness } from '../e2e/delivery-harness';
import { deliveries, expectedMessage, expectedReport, fishFindings } from '../e2e/delivery-data';

test('delivery corrections, explicit reporting and frozen sign-off', async ({ page, baseURL }, testInfo) => {
  const d = new DeliveryHarness(page, baseURL!, testInfo.project.name === 'desktop-keyboard');
  await d.start();
  const app = d.app;
  const sign = () => d.button('Sign the note');
  const next = () => app.getByTestId('next-job');
  const unsent = { radioedMarcus: false, reportSentSnapshot: '' };
  const unsigned = { signed: false, signature: '' };
  const assertDraft = async () => {
    await expect(next()).toHaveCount(0);
    expect((await d.progress()).completed).toEqual(['take-the-handover']);
    await d.assertIsolated();
  };

  await test.step('draft fixture, keyboard navigation and no premature disclosure', async () => {
    if (d.keyboard) {
      await d.nav('Order sheet').focus();
      await page.keyboard.press('Tab');
      await expect(d.nav('Compare amounts')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(app.locator('#delivery-workspace-heading')).toBeFocused();
    }
    await d.go('Report to Terence');
    await expect(d.button('Send report')).toBeDisabled();
    for (const radio of await app.getByRole('radio').all()) await expect(radio).toBeDisabled();
    await expect(app.locator('#report-context-heading')).toHaveCount(0);
    await expect(app.locator('#terence-reply-heading')).toHaveCount(0);

    await d.go('Compare amounts');
    await d.select(app.getByLabel('Item to report', { exact: true }), 'salmon');
    await d.fill(app.locator('#delivery-missing'), '8'); // Deliberately confuse accepted and missing.
    await d.select(app.locator('#delivery-proposed-line'), 'salmon');
    await d.fill(app.locator('#delivery-proposed-amount'), '4');
    await d.activate(d.button('Check comparison'));
    await expect(app.getByRole('alert')).toContainText('Finish the physical checks');
    await expect(app.getByRole('region', { name: 'What has come up' })).toHaveCount(0);
    await expect(d.button('Work it through')).toHaveCount(0);
    await d.saved({ contextRevealed: false, missingAmount: '8', noteAmendedTo: '4', ...unsent, ...unsigned });
    await d.go('Fish supplier note');
    await expect(sign()).toBeDisabled();
    await assertDraft();
  });

  for (const [index, line] of deliveries.entries()) {
    await test.step(`inspect and record ${line.item}`, async () => {
      await d.go('Order sheet');
      const row = d.row(line.id);
      await d.activate(row.getByRole('button', { name: `Open ${line.item}`, exact: true }));
      const quantity = row.getByLabel(`Quantity for ${line.item} (${line.unit})`, { exact: true });
      const temperature = row.locator(`#temp-${line.id}`);
      const check = row.getByRole('button', { name: 'Check your decisions', exact: true });

      if (line.id === 'salmon') {
        await d.fill(quantity, '12');
        await d.fill(temperature, '99');
        await d.activate(row.getByRole('radio', { name: 'Matches both', exact: true }));
        await d.activate(row.getByRole('radio', { name: 'All here', exact: true }));
        await d.activate(row.getByRole('button', { name: 'Refuse', exact: true }));
        await d.activate(check);
        await expect(row).toContainText('Inspect and count or weigh this item.');
        await expect(row).toContainText('Take the temperature of this item.');
        await d.saved({ lines: { salmon: { counted: false, probed: false } }, contextRevealed: false });
        // Typing every field must still not substitute for physical inspection.
        await d.go('Compare amounts');
        await d.activate(d.button('Check comparison'));
        await expect(app.getByRole('alert')).toContainText('Finish the physical checks');
        await d.go('Order sheet');
      }

      const measure = row.getByRole('button', { name: line.unit === 'kg' ? 'Weigh it' : 'Count them', exact: true });
      await d.activate(measure);
      await expect(measure).toBeDisabled();
      await expect(row.getByText('Wait for it to settle', { exact: true })).toBeVisible();
      await d.saved({ lines: { [line.id]: { counted: true } } });
      await expect(row.locator('[aria-live]').first()).toContainText(`${line.amount} ${line.unit}`);
      // Measurement never transcribes the learner's answer.
      await expect(quantity).toHaveValue(line.id === 'salmon' ? '12' : '');
      if (line.temperature !== undefined) {
        await d.activate(row.getByRole('button', { name: 'Take the temperature', exact: true }));
        await expect(row.getByText('Wait for it to settle', { exact: true })).toBeVisible();
        await d.saved({ lines: { [line.id]: { probed: true } } });
        await expect(row.getByText(`${line.temperature}°C`, { exact: true })).toBeVisible();
        await expect(temperature).toHaveValue(line.id === 'salmon' ? '99' : '');
        if (line.id === 'salmon') {
          await d.activate(check);
          await expect(row).toContainText("That matches the supplier's note. Compare it with your scales.");
          await expect(row).toContainText('Write the temperature shown after it settles.');
        }
        await d.fill(temperature, line.temperature);
      } else {
        await expect(temperature).toHaveCount(0);
        await expect(row.getByRole('button', { name: 'Take the temperature' })).toHaveCount(0);
      }
      await d.fill(quantity, line.id === 'shallots' ? '10' : line.amount);
      await d.activate(row.getByRole('radio', { name: line.id === 'salmon' ? 'Differs from both' : 'Matches both', exact: true }));
      await d.activate(row.getByRole('radio', { name: line.id === 'salmon' ? 'Short' : 'All here', exact: true }));

      if (line.id === 'sea-bass') {
        await d.activate(row.getByRole('button', { name: 'Inspect fish condition', exact: true }));
        for (const [findingIndex, finding] of fishFindings.entries()) {
          await expect(row.getByRole('radiogroup', { name: 'Which evidence supports accepting the whole fish?' })).toHaveCount(0);
          const findingButton = row.getByRole('button', { name: finding.label, exact: true });
          await d.activate(findingButton);
          await expect(row.getByRole('status').filter({ hasText: finding.finding })).toBeVisible();
          await d.saved({ fishChecks: { [finding.id]: true } });
          expect(Object.values((await d.progress()).tasks[DELIVERY].fishChecks).filter(Boolean)).toHaveLength(findingIndex + 1);
        }
        await d.activate(row.locator('#fish-reason-quantity-only'));
        await d.activate(check);
        await expect(row).toContainText('Use the fish findings and your saved temperature to choose the reason for your decision.');
        await d.activate(row.locator('#fish-reason-condition-and-temperature'));
      }

      await d.activate(row.getByRole('button', { name: `Accept ${line.id === 'shallots' ? '10' : line.amount} ${line.unit}`, exact: true }));
      await d.activate(check);
      if (line.id === 'shallots') {
        await expect(row).toContainText('The bag weight is in kilos. The order asks you to count sacks.');
        await d.fill(quantity, line.amount);
        await d.saved({ lines: { shallots: { arrived: '2', acceptedAmount: '10' } } });
        await expect(row).toContainText('Quantity changed. Re-confirm acceptance.');
        await d.activate(row.getByRole('button', { name: 'Confirm 2 sacks', exact: true }));
      }
      await expect(row).toContainText('The checks and decisions for this item match your evidence.');
      await d.saved({
        lines: { [line.id]: {
          counted: true, arrived: line.amount, probed: line.temperature !== undefined,
          temperature: line.temperature ?? '', comparison: line.id === 'salmon' ? 'differs-both' : 'matches-both',
          status: line.id === 'salmon' ? 'short' : 'arrived', acceptance: 'accept', acceptedAmount: line.amount,
        } },
        contextRevealed: false, ...unsigned, ...unsent,
      });
      await expect(app.getByText(`${index + 1}/10 quantities checked`, { exact: false })).toBeVisible();
    });
  }

  await test.step('all inspections and the unfinished draft survive reload', async () => {
    await expect(app.getByText('10/10 quantities checked · 6/6 temperatures taken · 4/4 fish findings inspected', { exact: true })).toBeVisible();
    const before = (await d.progress()).tasks[DELIVERY];
    await d.reload();
    expect((await d.progress()).tasks[DELIVERY]).toEqual(before);
    await assertDraft();
    await d.go('Compare amounts');
    await expect(app.locator('#delivery-missing')).toHaveValue('8');
    await expect(app.locator('#delivery-proposed-amount')).toHaveValue('4');
    await expect(app.getByRole('region', { name: 'What has come up' })).toHaveCount(0);
    await d.activate(d.button('Check comparison'));
    await expect(app.getByRole('region', { name: 'What has come up' })).toBeVisible();
    await d.saved({ contextRevealed: true, missingAmount: '8', noteAmendedTo: '4', ...unsent, ...unsigned });
  });

  await test.step('wrong report, source navigation, correction and explicit resend', async () => {
    await d.go('Report to Terence');
    await d.select(app.getByLabel('Affected product', { exact: true }), 'cream');
    await d.activate(app.getByRole('radio', { name: "Tonight's launch", exact: true }));
    await d.activate(app.getByRole('radio', { name: 'No follow-up needed', exact: true }));
    await expect(app.locator('#terence-reply-heading')).toHaveCount(0);
    await d.saved({ reportAttempted: false, ...unsent });
    await d.activate(d.button('Send report'));
    const errors = app.getByRole('region', { name: 'Terence needs you to check these details' });
    for (const message of [
      'Choose the product with the discrepancy.',
      'The missing amount is not the amount accepted.',
      'Choose the service affected by the shortage.',
      'Choose the follow-up this shortage needs.',
    ]) await expect(errors).toContainText(message);
    await d.saved({ reportAttempted: true, ...unsent });
    await d.select(app.locator('#report-product'), 'salmon');
    await d.activate(app.getByRole('radio', { name: "Tomorrow's lunch", exact: true }));
    await d.activate(app.getByRole('radio', { name: 'Contact the supplier', exact: true }));
    await d.activate(errors.getByRole('listitem').filter({ hasText: 'The missing amount is not the amount accepted.' }).getByRole('button', { name: 'Check the source' }));
    await expect(app.locator('#delivery-workspace-heading')).toHaveText('Compare amounts');
    await expect(app.locator('#delivery-workspace-heading')).toBeFocused();
    await d.fill(app.locator('#delivery-missing'), '4');
    await d.go('Report to Terence');
    await expect(app.getByRole('region', { name: 'Message preview' })).toContainText(expectedMessage);
    await expect(app.locator('#sent-heading')).toHaveCount(0);
    await d.saved(unsent); // Correcting the draft does not send it.
    await d.activate(d.button('Resend report'));
    await d.saved({ radioedMarcus: true, reportAttempted: true });
    expect(JSON.parse((await d.progress()).tasks[DELIVERY].reportSentSnapshot)).toEqual(expectedReport);
    await expect(app.getByRole('region', { name: 'Message sent', exact: true })).toContainText(expectedMessage);
    await d.activate(d.button('Close report'));
    await expect(d.nav('Order sheet')).toHaveAttribute('aria-current', 'page');
    await assertDraft();
  });

  await test.step('show the actual amendment, then invalidate initials and signatures on edits', async () => {
    await d.go('Fish supplier note');
    // These assertions check rendered paperwork, not just the editor's value.
    const crossed = app.locator('.line-through');
    await expect(crossed).toHaveCount(1);
    await expect(crossed).toHaveText('12 kg');
    await expect(crossed.locator('..')).toContainText('4 kg');
    await expect(sign()).toBeDisabled();
    await d.activate(app.getByRole('region', { name: 'Fish supplier note', exact: true }).getByRole('button', { name: 'Review before signing', exact: true }));
    await expect(app.getByRole('region', { name: 'Check these before signing' })).toContainText('Amend the note to the amount you accepted, not the amount missing.');
    await d.activate(d.button('Use my accepted amount'));
    await expect(app.locator('#amended-amount')).toHaveValue('8');
    await expect(crossed.locator('..')).toContainText('8 kg');
    await d.activate(d.button('Initial amendment'));
    await expect(app.locator('#amendment-initials')).toHaveValue('LD');
    await expect(crossed.locator('..')).toContainText('8 kg(LD)');
    await d.activate(sign());
    await d.saved({ signed: true, signature: 'LD', amendmentInitials: 'LD' });
    await expect(next()).toBeVisible();
    expect((await d.progress()).completed).toEqual(['take-the-handover']); // Note != task sign-off.

    await d.select(app.locator('#affected-fish'), 'sea-bass');
    await d.saved({ ...unsigned, amendmentInitials: '', radioedMarcus: true });
    await expect(app.getByRole('status').filter({ hasText: 'The note changed after you signed it.' })).toBeVisible();
    await expect(crossed).toHaveText('10 fish');
    await expect(crossed.locator('..')).toContainText('8 fish');
    await expect(sign()).toBeDisabled();
    await d.select(app.locator('#affected-fish'), 'salmon');
    await d.activate(d.button('Initial amendment'));
    await d.activate(sign());
    await d.fill(app.locator('#amended-amount'), '7');
    await d.saved({ ...unsigned, amendmentInitials: '' });
    await expect(app.locator('#amendment-initials')).toHaveValue('');
    await d.fill(app.locator('#amended-amount'), '8');
    await expect(sign()).toBeDisabled();
    await d.saved({ ...unsigned, amendmentInitials: '' }); // Repair does not re-initial or re-sign.
    await d.activate(d.button('Initial amendment'));
    await d.activate(sign());
    await d.capture(testInfo, 'signed-amended-note');
  });

  await test.step('saved quantity edits invalidate the report, acceptance, initials and signature', async () => {
    await d.go('Order sheet');
    const salmon = d.row('salmon');
    await d.activate(salmon.getByRole('button', { name: 'Open Salmon fillet, skin on', exact: true }));
    await d.fill(salmon.locator('#qty-salmon'), '7');
    await d.saved({ ...unsent, ...unsigned, lines: { salmon: { arrived: '7', acceptedAmount: '8' } } });
    await expect(salmon).toContainText('Quantity changed. Re-confirm acceptance.');
    await d.activate(salmon.getByRole('button', { name: 'Accept 7 kg', exact: true }));
    await d.saved({ amendmentInitials: '', lines: { salmon: { acceptedAmount: '7' } } });
    await d.fill(salmon.locator('#qty-salmon'), '8');
    await d.saved({ lines: { salmon: { arrived: '8', acceptedAmount: '7' } }, ...unsent, ...unsigned });
    await d.activate(salmon.getByRole('button', { name: 'Confirm 8 kg', exact: true }));
    await d.saved({ lines: { salmon: { acceptedAmount: '8' } }, amendmentInitials: '', ...unsent, ...unsigned });
    const before = (await d.progress()).tasks[DELIVERY];
    await d.reload();
    expect((await d.progress()).tasks[DELIVERY]).toEqual(before);
    await d.go('Fish supplier note');
    await expect(sign()).toBeDisabled();
    await expect(app.locator('#amendment-initials')).toHaveValue('');
    await d.go('Report to Terence');
    await expect(app.getByRole('region', { name: 'Message preview' })).toContainText(expectedMessage);
    await expect(app.locator('#sent-heading')).toHaveCount(0);
    await d.activate(d.button('Resend report'));
    await d.saved({ radioedMarcus: true });
    await d.activate(app.getByRole('radio', { name: "Tonight's launch", exact: true }));
    await d.saved(unsent);
    await d.activate(app.getByRole('radio', { name: "Tomorrow's lunch", exact: true }));
    await d.saved(unsent);
    await expect(app.locator('#sent-heading')).toHaveCount(0);
    await d.activate(d.button('Resend report'));
    await d.saved({ radioedMarcus: true });
    expect(JSON.parse((await d.progress()).tasks[DELIVERY].reportSentSnapshot)).toEqual(expectedReport);
    await d.go('Fish supplier note');
    await d.activate(d.button('Initial amendment'));
    await d.activate(sign());
    await d.saved({ signed: true, signature: 'LD', amendmentInitials: 'LD' });
    const signed = (await d.progress()).tasks[DELIVERY];
    await d.reload();
    expect((await d.progress()).tasks[DELIVERY]).toEqual(signed);
    await expect(next()).toBeVisible();
    await expect(sign()).toHaveCount(0);
    expect((await d.progress()).completed).toEqual(['take-the-handover']);
    await d.assertIsolated();
  });

  await test.step('explicit task sign-off, browser Back and reload keep the task read-only', async () => {
    const signed = (await d.progress()).tasks[DELIVERY];
    await d.activate(next());
    await expect.poll(() => new URL(app.url()).pathname).toContain('/task/chill-the-event-batch');
    await expect.poll(async () => (await d.progress()).completed).toEqual(['take-the-handover', DELIVERY]);
    expect(new URL(app.url()).searchParams.get('testMode')).toBe('1');
    // Navigate the browser history, not a designer fixture that would reset work.
    await app.evaluate(() => history.back());
    await expect(app.getByRole('heading', { name: "You've signed this off", exact: true })).toBeVisible();
    await d.reload();
    await expect(app.getByRole('heading', { name: "You've signed this off", exact: true })).toBeVisible();
    await expect(app.getByTestId('step-guide')).toHaveCount(0);
    await expect(app.getByRole('button', { name: 'Open Salmon fillet, skin on', exact: true })).toHaveCount(0);
    await expect(d.button('Open your notebook')).toHaveCount(0);
    await expect(d.button('Open the job card')).toHaveCount(0);
    const frozenButton = app.locator('main [inert] button').first();
    await expect(frozenButton.locator('xpath=ancestor::*[@inert]')).toHaveCount(1);
    // Attempt a real pointer action; inert content and blocker must reject it.
    await expect(frozenButton.click({ trial: true, timeout: 500 })).rejects.toThrow();
    await frozenButton.evaluate((node) => node.focus());
    expect(await frozenButton.evaluate((node) => node === document.activeElement)).toBe(false);
    await page.keyboard.press('Space');
    expect((await d.progress()).tasks[DELIVERY]).toEqual(signed);
    await d.assertIsolated();
    await d.capture(testInfo, 'frozen-delivery-after-reload');
  });
});