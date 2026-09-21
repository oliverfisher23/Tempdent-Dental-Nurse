import { test } from '@playwright/test';
import { verifyFridgeMedia } from './fridge-round-verification.mjs';

test('starts from the overnight log and completes all four appliances', async ({ page }) => {
  // Each Playwright test gets a fresh browser context, so this is a clean
  // first-visit session with no saved progress.
  await page.goto('/task/take-the-handover?testMode=1');
  await page.getByTestId('continue-inline').click();
  await page.getByRole('textbox', { name: 'What should we call you?' }).fill('Fridge round check');
  await page.getByRole('button', { name: 'Start simulation' }).click();

  const closeJobCard = page.getByRole('button', { name: 'Close the job card' });
  if (await closeJobCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    await closeJobCard.click();
  }

  const overnightLog = page.getByTestId('handover-log');
  await overnightLog.waitFor();
  await overnightLog.getByRole('heading', { name: 'Overnight log', exact: true }).waitFor();
  await page.getByTestId('start-fridge-round').click();

  await verifyFridgeMedia(page);
});