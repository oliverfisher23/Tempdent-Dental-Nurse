// Shared browser harness for the per-task specs. Run a spec with
//   BASE_URL=http://127.0.0.1:80 node tests/browser/setup.spec.mjs
// or every spec with `node tests/browser/run.mjs`. Specs drive the real app
// through the learning-designer test panel (?testMode=1); nothing is mocked.
// Playwright is provided by the workspace tooling rather than declared here; fall back to its store path.
const { chromium } = await import('playwright').catch(() =>
  import('/home/runner/workspace/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs'),
);

export const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:80';
export const SHOTS = process.env.SHOTS_DIR ?? '/tmp/shots';

export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/repl/tools/bin/chromium', args: ['--no-sandbox'] });
}

/** Open the app in a fresh context, start the day and jump straight to task `n` (1-6). */
export async function startTask(browser, n, { viewport = { width: 1280, height: 720 } } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 500 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${BASE_URL}/?testMode=1`, { waitUntil: 'networkidle' });
  await page.click('[data-testid=continue-inline]');
  await page.fill('#name', 'Spec');
  await page.click('[data-testid=start-simulation]');
  await page.getByRole('button', { name: /designer test/i }).click();
  await page.getByRole('button', { name: `Task ${n}`, exact: true }).click();
  await page.addStyleTag({ content: 'aside[aria-label="Learning designer test controls"]{display:none !important}' });
  await page.locator('[data-testid^=scene-]').first().waitFor({ state: 'visible', timeout: 15000 });
  await settled(page);
  return { page, context, errors };
}

export function expect(condition, message) {
  if (!condition) throw new Error(`Expectation failed: ${message}`);
}

/** The panel for the current decision, e.g. to read data-state. */
export const decision = (page, id) => page.locator(`[data-testid=decision-${id}]`);
export const option = (page, decisionId, optionId) => page.locator(`[data-testid=option-${decisionId}-${optionId}]`).first();
export const feedback = (page, id) => page.locator(`[data-testid=feedback-${id}]`).first();

export async function tap(page, decisionId, optionId) {
  const target = option(page, decisionId, optionId);
  await target.scrollIntoViewIfNeeded();
  await target.click();
}

export async function taps(page, decisionId, optionIds) {
  for (const optionId of optionIds) await tap(page, decisionId, optionId);
}

/** Open a close-up from the panel; following the step guide into a room may already have opened it. */
export async function openCloseUp(page, decisionId) {
  const dialog = page.locator('[role=dialog]').first();
  if (await dialog.isVisible()) return;
  await page.locator(`[data-testid=open-${decisionId}]`).click();
  await dialog.waitFor({ state: 'visible' });
}

/**
 * Walk to another room the way a learner does: the step guide's action button
 * reads "Go to <room>" whenever the current decision is elsewhere.
 */
export async function goTo(page, placeId) {
  await page.locator('[data-testid=guide-action]').click();
  await page.locator(`[data-testid=scene-${placeId}]`).waitFor({ state: 'visible', timeout: 15000 });
  await settled(page);
}

/** The stage has measured itself: the photo box has a size and either a decision panel or a close-up is showing. */
export async function settled(page) {
  await page.waitForFunction(() => {
    const box = document.querySelector('[data-testid=photo-box]');
    const ready = box instanceof HTMLElement && box.offsetWidth > 0;
    const panel = document.querySelector('[data-testid^=decision-], [role=dialog], [data-testid=scene-waiting]');
    return ready && panel !== null;
  }, undefined, { timeout: 15000 });
}

export const confirm = (page, id) => page.locator(`[data-testid=confirm-${id}]`).click();
export const done = (page) => page.getByRole('button', { name: 'Done', exact: true }).first().click();
export const carryOn = (page) => page.getByRole('button', { name: 'Carry on', exact: true }).first().click();

/** Wait for the feedback of a decision and return 'right' | 'wrong'. */
export async function judged(page, id) {
  await feedback(page, id).waitFor({ state: 'visible', timeout: 5000 });
  return decision(page, id).first().getAttribute('data-state');
}

export async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.jpg`, quality: 70 });
}

/**
 * Run a named spec body, reporting pass/fail and closing the browser. Specs are
 * chained so that importing several files (run.mjs) plays them one after another:
 * seven Chromium instances at once starve each other of resources in the container.
 */
let chain = Promise.resolve();
export function spec(name, body) {
  chain = chain.then(() => runSpec(name, body));
  return chain;
}

async function runSpec(name, body) {
  const browser = await launch();
  const started = Date.now();
  try {
    await body(browser);
    console.log(`ok   ${name} (${Math.round((Date.now() - started) / 1000)}s)`);
  } catch (error) {
    console.log(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
