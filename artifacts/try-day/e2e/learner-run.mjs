// Full learner run: welcome -> briefing -> Tasks 1-5 -> close of day, using
// only controls a learner can see. No designer harness, no seeded fixtures.
//
//   pnpm --filter @workspace/try-day run test:learner-run                  # against the preview (http://localhost:80)
//   BASE=http://127.0.0.1:4174 pnpm --filter @workspace/try-day run test:learner-run
//   pnpm --filter @workspace/try-day run test:learner-run -- --from=task3   # resume from a saved stage state
//   VIEWPORT=phone pnpm --filter @workspace/try-day run test:learner-run   # 390x844, touch input for the hold gestures
//   VIEWPORT=1280x620 pnpm --filter @workspace/try-day run test:learner-run # any WxH, e.g. a short laptop window; output dir gets the size as a suffix
//   INPUT=keyboard pnpm --filter @workspace/try-day run test:learner-run   # every control operated by focus + Enter/Space
//
// Wrong answers are tried first at a few points (a wrong acceptance, an early
// review, a wrong weight) to confirm the kitchen does not accept them; the
// feedback text is recorded as an "info" finding so the wording can be read.
//
// Runs through tsx because it shares e2e/delivery-data.ts with the delivery suite.
// Saves browser state after every successful stage to test-results/learner-run/state-<stage>.json,
// screenshots to test-results/learner-run/<nn>-<name>.png, and always writes qa-log.json
// (console errors, page errors, failed requests, timings, findings).
//
// Exit code: 1 when any stage throws, on any page error or console error, on any
// failed request other than a media fetch the app itself aborted, or on a
// "major" finding. "minor" and "info" findings are QA observations only.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { verifyFridgeMedia } from './fridge-round-verification.mjs';
import { deliveries, fishFindings } from './delivery-data.ts';

const BASE = (process.env.BASE ?? 'http://localhost:80').replace(/\/$/, '');
const FROM = (process.argv.find((a) => a.startsWith('--from=')) ?? '--from=welcome').slice(7);
const PHONE = process.env.VIEWPORT === 'phone';
const SIZE = /^(\d+)x(\d+)$/.exec(process.env.VIEWPORT ?? '');
const DESKTOP = SIZE ? { width: Number(SIZE[1]), height: Number(SIZE[2]) } : { width: 1366, height: 768 };
const KEYBOARD = process.env.INPUT === 'keyboard';
const OUT = path.resolve(import.meta.dirname, `../test-results/learner-run${PHONE ? '-phone' : SIZE ? `-${SIZE[1]}x${SIZE[2]}` : ''}${KEYBOARD ? '-keyboard' : ''}`);
const STAGES = ['welcome', 'task1', 'task2', 'task3', 'task4', 'task5', 'close'];
const NAME = 'QA Learner';
mkdirSync(OUT, { recursive: true });

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined);

const log = { consoleErrors: [], consoleWarnings: [], pageErrors: [], failedRequests: [], findings: [], timings: {} };
let shot = 0;
const finding = (severity, text) => { log.findings.push({ severity, text }); console.log(`  [${severity}] ${text}`); };

const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const startIndex = STAGES.indexOf(FROM);
if (startIndex < 0) throw new Error(`unknown stage ${FROM}`);
const storageState = startIndex > 0 ? path.join(OUT, `state-${STAGES[startIndex - 1]}.json`) : undefined;
const context = await browser.newContext({
  storageState,
  ...(PHONE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: DESKTOP }),
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);
page.on('console', (m) => {
  const text = `${m.text()} (${m.location().url}:${m.location().lineNumber})`;
  if (m.type() === 'error') log.consoleErrors.push(text);
  else if (m.type() === 'warning') log.consoleWarnings.push(text);
});
page.on('pageerror', (e) => log.pageErrors.push(e.message));
page.on('response', (r) => { if (r.status() >= 400) log.failedRequests.push(`${r.status()} ${r.url()}`); });
page.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) log.failedRequests.push(`FAILED ${r.failure()?.errorText} ${r.url()}`); });
// Requests the fridge round blocks on purpose (one opening clip, to exercise the fallback): their failures are expected.
const deliberatelyBlockedUrls = [];

if (KEYBOARD) {
  // Every click or check becomes focus + key press. A control that cannot take focus,
  // or does nothing on Enter/Space, is a keyboard-accessibility bug: it is recorded
  // as a major finding and the mouse is used so the rest of the run still runs.
  const proto = Object.getPrototypeOf(page.locator('body'));
  const mouseClick = proto.click;
  const keyFor = (locator) => locator.evaluate((el) => {
    const role = el.getAttribute('role');
    const type = el instanceof HTMLInputElement ? el.type : '';
    return ['radio', 'checkbox', 'switch'].includes(role ?? type) ? 'Space' : 'Enter';
  });
  const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)).catch(() => false);
  const focusOn = async (locator) => {
    // The kitchen moves focus itself right after some choices (a selected tub, a returned
    // sheet), which can land between our focus() and the check; a real learner tabs after
    // that move, so focus is tried a few times before the control is called unreachable.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await locator.focus().then(() => true, () => false) && await hasFocus(locator)) return true;
      await locator.page().waitForTimeout(150);
    }
    return false;
  };
  const describe = async (locator) => (await locator.evaluate((el) => el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 60) || el.id || el.tagName).catch(() => String(locator)));
  // This checks that each control can take focus and responds to its key. It does not
  // check tab order; typing (fill) and native selects are keyboard input already.
  proto.click = async function (options) {
    if (await focusOn(this)) {
      await this.page().keyboard.press(await keyFor(this));
      return;
    }
    finding('major', `Keyboard: "${await describe(this)}" cannot take focus; used the mouse.`);
    await mouseClick.call(this, options);
  };
  proto.check = async function (options) {
    if (await this.isChecked().catch(() => false)) return;
    if (await focusOn(this)) {
      await this.page().keyboard.press('Space');
      if (await this.isChecked().catch(() => false)) return;
      finding('major', `Keyboard: Space does not tick "${await describe(this)}"; used the mouse.`);
    } else finding('major', `Keyboard: "${await describe(this)}" cannot take focus; used the mouse.`);
    await mouseClick.call(this, options);
  };
}

// AXE=1 runs an axe-core scan at every screenshot. Serious and critical violations are listed
// under `axe` in the QA log (deduplicated by rule and element) and each one fails the run.
const AXE = process.env.AXE === '1';
const axeSource = AXE ? readFileSync(path.resolve(import.meta.dirname, '../node_modules/axe-core/axe.min.js'), 'utf8') : null;
const axeSeen = new Set();
log.axe = [];
const axeScan = async (name) => {
  if (!axeSource) return;
  try {
    // Text still fading in reads as washed out, so wait for entrance animations (staggered
    // ones included) to finish before scanning. Looping animations are left alone.
    await page.waitForTimeout(300);
    await page.evaluate(() => Promise.race([
      Promise.all(document.getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]));
    await page.waitForTimeout(400);
    await page.evaluate(axeSource);
    // While a true modal is open the page behind it is out of reach, so only the modal is scanned.
    const results = await page.evaluate(() => window.axe.run(document.querySelector('[role="dialog"][aria-modal="true"]') ?? document, { resultTypes: ['violations'] }));
    for (const violation of results.violations) {
      if (!['serious', 'critical'].includes(violation.impact)) continue;
      for (const node of violation.nodes) {
        const key = `${violation.id}|${node.target.join(' ')}`;
        if (axeSeen.has(key)) continue;
        axeSeen.add(key);
        const entry = { screen: name, rule: violation.id, impact: violation.impact, target: node.target.join(' '), summary: node.failureSummary?.split('\n').slice(0, 2).join(' ') ?? violation.help };
        log.axe.push(entry);
        finding('major', `axe ${violation.impact} on ${name}: ${violation.id} at ${entry.target}. ${entry.summary}`);
      }
    }
  } catch (error) {
    finding('major', `axe scan failed on ${name}: ${error.message.split('\n')[0]}`);
  }
};
// Hotspots and workspace controls live in the room (the main region). The step guide above it
// now names the same outcome as the hotspot it points at, so room lookups are scoped here.
const room = page.getByRole('main');
const snap = async (name) => {
  shot += 1;
  await page.screenshot({ path: path.join(OUT, `${String(shot).padStart(2, '0')}-${name}.png`) });
  await axeScan(name);
};
const saveState = async (stage) => context.storageState({ path: path.join(OUT, `state-${stage}.json`) });
// A close-up must be announced by the title the learner can see, not a subsection or a fallback.
const expectDialogNamed = async (name, what) => {
  const named = await page.getByRole('dialog', { name, exact: true }).isVisible({ timeout: 3000 }).catch(() => false);
  if (!named) finding('major', `The ${what} close-up is not announced as "${name}" (its accessible name is wrong or missing).`);
};
const timed = async (stage, fn) => {
  if (STAGES.indexOf(stage) < startIndex) return;
  console.log(`\n== ${stage} ==`);
  const t0 = Date.now();
  try {
    await fn();
  } catch (error) {
    await snap(`${stage}-FAILED`).catch(() => {});
    console.log(`Failed during ${stage}: ${error.message}`);
    throw error;
  } finally {
    log.timings[stage] = Math.round((Date.now() - t0) / 1000);
  }
  // Only a completed stage is worth resuming from.
  await saveState(stage);
};
const byId = (id) => page.locator(`[id="${id}"]`);
const closeJobCard = async () => {
  const close = page.getByRole('button', { name: 'Close the job card' });
  if (await close.isVisible({ timeout: 4000 }).catch(() => false)) await close.click();
};
const nextJob = async (expectedPath) => {
  const next = page.getByTestId('next-job');
  await next.waitFor({ timeout: 20_000 });
  await next.click();
  await page.waitForURL((u) => u.pathname.endsWith(expectedPath), { timeout: 15_000 });
};
const progress = () => page.evaluate(() => {
  const key = Object.keys(localStorage).find((k) => k.startsWith('springpod:') && !k.endsWith('designer-test'));
  return key ? JSON.parse(localStorage.getItem(key)) : null;
});
const cdp = PHONE ? await context.newCDPSession(page) : null;
const holdUntilSettled = async (button) => {
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const settled = page.locator('[data-state="settled"]').first();
  if (KEYBOARD) {
    // Holding Space on the focused button must work like holding the mouse down. A real
    // keyboard auto-repeats keydown while the key is held (every ~33 ms after ~500 ms), and
    // Playwright only sends repeats when down() is called again, so emulate the repeats.
    await button.focus();
    await page.keyboard.down('Space');
    let held = true;
    const repeats = (async () => {
      await page.waitForTimeout(500);
      while (held) { await page.keyboard.down('Space'); await page.waitForTimeout(33); }
    })();
    const ok = await settled.waitFor({ timeout: 15_000 }).then(() => true, () => false);
    held = false;
    await repeats.catch(() => {});
    await page.keyboard.up('Space');
    if (ok) return;
    finding('major', 'Keyboard: holding Space on the hold-to-read button never settles a reading; used the mouse.');
  }
  // A learner on a phone presses and holds with a finger; on a desktop, with the mouse.
  if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  else { await page.mouse.move(x, y); await page.mouse.down(); }
  try {
    await settled.waitFor({ timeout: 15_000 });
  } finally {
    if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    else await page.mouse.up();
  }
};
/** Try a wrong answer: the success text must not appear; whatever feedback shows is recorded. */
const expectRejected = async (scope, successText, label) => {
  const accepted = await scope.getByText(successText).first().isVisible({ timeout: 1500 }).catch(() => false);
  if (accepted) { finding('major', `${label}: the kitchen accepted a wrong answer ("${successText}" appeared).`); return; }
  const feedback = (await scope.locator('[role="alert"], [role="status"], [aria-live]').filter({ hasText: /\S/ }).last().innerText({ timeout: 1500 }).catch(() => '')).trim().replace(/\s+/g, ' ');
  if (!feedback) { finding('minor', `${label}: not accepted, but no feedback was announced to say why.`); return; }
  finding('info', `${label}: not accepted. Feedback: "${feedback.slice(0, 160)}"`);
};

let failure = null;
try {
  // ---------------------------------------------------------------- welcome
  await timed('welcome', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('welcome-launch').waitFor();
    await snap('welcome');
    const briefing = page.getByTestId('welcome-briefing');
    // Where the Fullscreen API exists the welcome leads with Expand experience; a frame without it
    // (the Springpod sandbox, or a browser reporting fullscreenEnabled false) shows the inline button only.
    if (await page.getByTestId('expand-experience').count()) {
      await page.getByTestId('expand-experience').click();
      if (!(await briefing.isVisible({ timeout: 6000 }).catch(() => false))) {
        finding('info', 'Expand experience did not reach the briefing in headless Chromium (fullscreen refused); used Continue in this window instead.');
        await page.getByTestId('continue-inline').click();
        await briefing.waitFor();
      }
    } else {
      finding('info', 'No Fullscreen API here: the welcome offered Open the briefing only.');
      await page.getByTestId('continue-inline').click();
      await briefing.waitFor();
    }
    await snap('briefing');
    // The briefing video must open and close without trapping the learner.
    const video = briefing.getByRole('button', { name: /video|briefing|watch/i }).first();
    if (!(await video.count())) finding('major', 'The briefing has no video control for the learner to open.');
    else {
      await video.click();
      const dialog = page.getByRole('dialog');
      if (await dialog.first().isVisible({ timeout: 4000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        const closed = await dialog.first().waitFor({ state: 'hidden', timeout: 4000 }).then(() => true, () => false);
        if (!closed) {
          finding('minor', 'Escape does not close the briefing video; clicking its close button instead.');
          await dialog.first().getByRole('button', { name: /close/i }).first().click();
          await dialog.first().waitFor({ state: 'hidden', timeout: 4000 });
        }
      } else {
        finding('minor', 'Briefing video button did not open a dialog.');
      }
    }
    await page.locator('input#name').fill(NAME);
    await page.getByTestId('start-simulation').click();
    await page.waitForURL(/\/task\/take-the-handover/);
  });

  // ---------------------------------------------------------------- task 1
  await timed('task1', async () => {
    if (startIndex === STAGES.indexOf('task1')) await page.goto(`${BASE}/task/take-the-handover`, { waitUntil: 'domcontentloaded' });
    await closeJobCard();
    await snap('task1-open');
    const overnightLog = page.getByTestId('handover-log');
    await overnightLog.waitFor();
    await page.getByTestId('start-fridge-round').click();
    const { blockedClipUrls } = await verifyFridgeMedia(page);
    deliberatelyBlockedUrls.push(...blockedClipUrls);
    await snap('task1-board');
    // Reload on the board: the completed round must survive and the task must still be ready.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await closeJobCard();
    const p = await progress();
    const rows = p?.tasks?.['take-the-handover']?.rows ?? p?.tasks?.['take-the-handover'];
    if (!rows) finding('major', 'No saved Task 1 progress found in localStorage after reload.');
    await nextJob('/task/check-the-delivery-in');
  });

  // ---------------------------------------------------------------- task 2
  await timed('task2', async () => {
    if (startIndex === STAGES.indexOf('task2')) await page.goto(`${BASE}/task/check-the-delivery-in`, { waitUntil: 'domcontentloaded' });
    await closeJobCard();
    await snap('task2-pass');
    await room.getByRole('button', { name: /back door/ }).click();
    const heading = page.getByRole('heading', { name: 'Working order sheet', exact: true });
    await heading.waitFor();
    const nav = (name) => page.getByRole('navigation', { name: 'Working order sheet' }).getByRole('button', { name, exact: true });
    const row = (id) => page.locator(`[data-line-id="${id}"]`);
    const button = (name) => page.getByRole('button', { name, exact: true });

    for (const line of deliveries) {
      await nav('Order sheet').click();
      const r = row(line.id);
      await r.getByRole('button', { name: `Open ${lowerFirst(line.item)}`, exact: true }).click();
      const measure = r.getByRole('button', { name: line.unit === 'kg' ? 'Weigh it' : 'Count them', exact: true });
      await measure.click();
      if (line.unit === 'kg') await r.getByTestId('kitchen-scale').and(page.locator('[data-phase="stable"]')).waitFor();
      else await r.locator('[aria-live]').first().filter({ hasText: `${line.amount} ${line.unit}` }).waitFor();
      if (line.temperature !== undefined) {
        await r.getByRole('button', { name: 'Take the temperature', exact: true }).click();
        await r.getByText(`${line.temperature}°C`, { exact: true }).waitFor();
        await r.locator(`#temp-${line.id}`).fill(line.temperature);
      }
      await r.locator(`#qty-${line.id}`).fill(line.amount);
      await r.getByRole('radio', { name: line.id === 'salmon' ? 'Differs from both' : 'Matches both', exact: true }).click();
      await r.getByRole('radio', { name: line.status, exact: true }).click();
      if (line.id === 'sea-bass') {
        await r.getByRole('button', { name: 'Inspect fish condition', exact: true }).click();
        for (const f of fishFindings) {
          await r.getByRole('button', { name: f.label, exact: true }).click();
          await r.getByRole('status').filter({ hasText: f.finding }).waitFor();
        }
        await r.locator('#fish-reason-condition-and-temperature').click();
      }
      const matchText = 'The checks and decisions for this item match your evidence.';
      if (line.acceptance === 'refuse') {
        // Wrong path first: accepting a delivery that must be refused.
        await r.getByRole('button', { name: `Accept ${line.amount} ${line.unit}`, exact: true }).click();
        await r.getByRole('button', { name: 'Check my work', exact: true }).click();
        await expectRejected(r, matchText, `Task 2 accepting the ${lowerFirst(line.item)}`);
      }
      await r.getByRole('button', { name: line.acceptance === 'refuse' ? 'Refuse' : `Accept ${line.amount} ${line.unit}`, exact: true }).click();
      await r.getByRole('button', { name: 'Check my work', exact: true }).click();
      await r.getByText(matchText).waitFor();
      if (line.id === 'salmon') await snap('task2-salmon-row');
    }
    await page.getByText('6/6 quantities checked', { exact: false }).waitFor();

    // Reload mid-task: inspections must survive, and the learner should land back at work.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await closeJobCard();
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      finding('info', 'After a reload mid-Task 2 the learner returns straight to the working order sheet.');
    } else {
      finding('minor', 'After a reload mid-Task 2 the learner is put back at the pass and has to walk to the back door again.');
      await room.getByRole('button', { name: /back door/ }).click();
      await heading.waitFor();
    }
    await page.getByText('6/6 quantities checked', { exact: false }).waitFor();

    await nav('Compare amounts').click();
    await page.getByLabel('Item to report', { exact: true }).selectOption('salmon');
    await page.locator('#delivery-missing').fill('4');
    await page.locator('#delivery-proposed-line').selectOption('salmon');
    await page.locator('#delivery-proposed-amount').fill('8');
    await button('Check comparison').click();
    await page.getByRole('region', { name: 'What has come up' }).waitFor();
    await snap('task2-comparison');

    await nav('Report to Terence').click();
    await page.locator('#report-product').selectOption('salmon');
    await page.getByRole('radio', { name: "Tomorrow's lunch", exact: true }).click();
    await page.getByRole('radio', { name: 'Contact the supplier', exact: true }).click();
    await button('Send report').click();
    await page.getByRole('region', { name: 'Message sent', exact: true }).waitFor();
    await snap('task2-report-sent');
    await button('Close report').click();

    await nav('Delivery note').click();
    await page.getByRole('region', { name: 'Delivery note', exact: true }).getByRole('button', { name: 'Review before signing', exact: true }).click();
    await button('Use my accepted amount').nth(0).click();
    await button('Initial amendment').nth(0).click();
    await button('Use my accepted amount').nth(1).click();
    await page.getByLabel('Record as refused').check();
    await page.locator('#refusal-temperature-cream').fill('7.8');
    await button('Initial amendment').nth(1).click();
    await button('Sign the note').click();
    await snap('task2-signed');
    await nextJob('/task/chill-the-event-batch');
  });

  // ---------------------------------------------------------------- task 3
  await timed('task3', async () => {
    if (startIndex === STAGES.indexOf('task3')) await page.goto(`${BASE}/task/chill-the-event-batch`, { waitUntil: 'domcontentloaded' });
    await closeJobCard();
    await snap('task3-open');
    await room.getByRole('button', { name: 'Portion the beef', exact: true }).click();
    const scoop = page.getByRole('button', { name: 'Scoop 0.5kg' });
    for (const tray of [0, 1, 2]) {
      await page.getByTestId(`tray-${tray}`).click();
      for (let i = 0; i < 8; i++) await scoop.click();
    }
    await page.getByRole('button', { name: 'Ask Terence for another tray' }).click();
    await page.getByTestId('tray-3').click();
    for (let i = 0; i < 3; i++) await scoop.click();
    await page.getByTestId('remaining').filter({ hasText: '0.00 kg' }).waitFor();
    await snap('task3-portioned');
    await page.getByRole('button', { name: 'Take the trays to the chiller' }).click();
    const openChiller = room.getByRole('button', { name: 'Load and run the blast chiller', exact: true });
    if (await openChiller.isVisible({ timeout: 3000 }).catch(() => false) && await openChiller.isEnabled()) await openChiller.click();
    for (const [tray, shelf] of [[0, '1'], [1, '3'], [2, '5'], [3, '7']]) await page.locator(`#tray-${tray}-shelf`).selectOption(shelf);
    await page.getByText('Every tray is loaded with an empty shelf between each one').waitFor();
    await page.getByRole('button', { name: 'Place probe in tray 1' }).click();
    await page.getByRole('dialog', { name: /cut through/ }).waitFor();
    await page.getByRole('button', { name: 'The middle of the beef' }).click();
    await snap('task3-probe');
    const start = page.getByTestId('start');
    await start.waitFor();
    await start.click();

    const readings = [['0', '74.2'], ['60', '19.8'], ['90', '11.2'], ['120', '5.9']];
    for (const [minute, value] of readings) {
      const hold = page.getByRole('button', { name: /Hold to take the temperature/ });
      await hold.waitFor({ timeout: 20_000 });
      await holdUntilSettled(hold);
      await page.locator('#chill-note').fill(value);
      await page.getByRole('button', { name: 'Save reading' }).click();
      await page.getByText(`${minute}-minute reading saved`, { exact: false }).waitFor();
      if (minute === '90') {
        // Terence's question opens itself over the chill record. The learner can put it away with Escape
        // from anywhere in the room, read the record, and bring it back from the chip.
        const answer = page.getByRole('button', { name: 'Leave it in the chiller and take the temperature again at 120 minutes' });
        await answer.waitFor();
        await page.locator('#chill-note').focus().catch(() => {});
        await page.keyboard.press('Escape');
        const chip = page.getByTestId('dialogue-speaker');
        if (await chip.waitFor({ timeout: 2000 }).then(() => true).catch(() => false)) {
          if ((await chip.getAttribute('data-waiting')) !== 'true') finding('minor', 'Task 3: the put-away question chip does not say Terence is waiting for an answer.');
          await chip.focus();
          await page.keyboard.press('Enter');
          await answer.waitFor();
          const focused = await page.evaluate(() => document.activeElement?.closest('[data-testid="dialogue-bar"]') !== null);
          if (!focused) finding('minor', 'Task 3: reopening the put-away question from the keyboard leaves focus outside the question bar.');
          finding('info', 'Task 3: the ninety-minute question can be put away with Escape and brought back from the chip.');
        } else {
          finding('major', 'Task 3: Escape from the room does not put the ninety-minute question away.');
        }
        await answer.click();
        await page.getByRole('button', { name: 'Measure tray 1' }).click();
        await snap('task3-ninety');
      }
      if (minute !== '120') {
        const wait = page.getByTestId('wait');
        await wait.waitFor();
        await wait.click();
      }
    }
    // Reload right before signing: readings and the chiller clock must be kept.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await closeJobCard();
    const openRecord = page.getByTestId('open-record');
    if (!(await openRecord.isVisible({ timeout: 3000 }).catch(() => false))) {
      finding('minor', 'After a reload late in Task 3 the learner is not at the chiller and has to navigate back to it.');
      await room.getByRole('button', { name: 'Load and run the blast chiller', exact: true }).click();
    }
    await openRecord.click();
    await expectDialogNamed('Blast chill record', 'chill record');
    const rec120 = page.locator('#chill-record-120');
    await rec120.waitFor();
    if ((await rec120.inputValue()) !== '5.9') finding('major', `Chill record 120-minute value is "${await rec120.inputValue()}" after reload, expected 5.9.`);
    await page.getByRole('button', { name: 'Type your name instead' }).click();
    await page.locator('input[aria-label="Type your name"]').fill(NAME);
    await page.getByTestId('signed').waitFor();
    await snap('task3-signed');
    await page.keyboard.press('Escape');
    await nextJob('/task/check-the-dietary-list');
  });

  // ---------------------------------------------------------------- task 4
  await timed('task4', async () => {
    if (startIndex === STAGES.indexOf('task4')) await page.goto(`${BASE}/task/check-the-dietary-list`, { waitUntil: 'domcontentloaded' });
    await closeJobCard();
    await snap('task4-pass');
    await room.getByRole('button', { name: /function sheet from Yvie/ }).click();
    await page.getByTestId('function-sheet').waitFor();
    await expectDialogNamed("art'otel Hoxton product launch", 'function sheet');
    await snap('task4-sheet');
    await page.keyboard.press('Escape');
    const sheetClosed = await page.getByTestId('function-sheet').waitFor({ state: 'hidden', timeout: 4000 }).then(() => true, () => false);
    if (!sheetClosed) {
      finding('minor', 'Escape does not close the function sheet; using its close button.');
      await page.getByRole('button', { name: 'Close function sheet' }).click();
      await page.getByTestId('function-sheet').waitFor({ state: 'hidden', timeout: 4000 });
    }
    const chartHotspot = room.getByRole('button', { name: /^Mark the allergen chart/ });
    const chart = page.getByTestId('chart-workspace');
    const openChart = async () => {
      // Closing the function sheet can start the walk to the events kitchen by itself, so the
      // hotspot may appear while the room is still settling; a click that lands mid-arrival is retried.
      for (let attempt = 0; attempt < 3 && !(await chart.isVisible().catch(() => false)); attempt++) {
        if (await chartHotspot.isVisible({ timeout: 2500 }).catch(() => false)) {
          await chartHotspot.click({ timeout: 5000 }).catch(() => {});
        } else if (await page.getByTestId('guide-action').isVisible().catch(() => false)) {
          // Move to the events kitchen with the step guide's own action ("Open the chart").
          await page.getByTestId('guide-action').click();
        }
        await chart.or(chartHotspot).first().waitFor({ timeout: 5000 }).catch(() => {});
      }
      await chart.waitFor();
    };
    await openChart();
    // Wrong path first: reviewing with Terence before any row is reviewed must not move on.
    const earlyReview = page.getByTestId('review-with-terence');
    if ((await earlyReview.count()) === 0) finding('info', 'Task 4 early review: the review button is not offered until the rows are reviewed.');
    else if (await earlyReview.isDisabled()) finding('info', 'Task 4 early review: the review button stays disabled until the rows are reviewed.');
    else {
      await earlyReview.click();
      const movedOn = await page.getByTestId('guide-action').filter({ hasText: /guest/i }).isVisible({ timeout: 1500 }).catch(() => false);
      if (movedOn) finding('major', 'Task 4 early review: the chart moved on to the guest decisions with no row reviewed.');
      else finding('info', 'Task 4 early review: not accepted with no row reviewed.');
    }
    const cell = (name) => page.getByRole('checkbox', { name, exact: true });
    // Dish names as the row headers show them: sentence case as a title, lower case inside a sentence.
    const chartPlan = [
      ['Haddock tart', []],
      ['Beef', ['Celery in the beef']],
      ['Wellington', []],
      ['Frangipane', ['Cereals containing gluten in the frangipane', 'Eggs in the frangipane', 'Milk in the frangipane', 'Nuts (tree nuts) in the frangipane']],
      ['Pear', ['Milk in the pear']],
    ];
    for (const [index, [dish, marks]] of chartPlan.entries()) {
      if (index === 2) {
        // Reload mid-chart: the reviewed rows must survive and the chart should still be open.
        await page.reload({ waitUntil: 'domcontentloaded' });
        await closeJobCard();
        if (await chart.isVisible({ timeout: 4000 }).catch(() => false)) finding('info', 'After a reload mid-Task 4 the learner returns straight to the allergen chart.');
        else { finding('minor', 'After a reload mid-Task 4 the learner has to open the allergen chart again.'); await openChart(); }
        for (const [done] of chartPlan.slice(0, index)) {
          const rowButton = page.getByRole('button', { name: `Selected row: ${done}`, exact: true });
          if (await rowButton.isVisible().catch(() => false)) await rowButton.click();
          else await page.getByRole('tab', { name: done }).click();
          if (!(await cell(`Row reviewed: ${done}`).isChecked())) finding('major', `Task 4: the reviewed ${done} row was lost on reload.`);
        }
      }
      // Desktop: a row header in the matrix. Phone: a dish tab above the recipe card.
      const rowButton = page.getByRole('button', { name: `Selected row: ${dish}`, exact: true });
      if (await rowButton.isVisible().catch(() => false)) await rowButton.click();
      else await page.getByRole('tab', { name: dish }).click();
      for (const name of marks) await cell(name).check();
      await cell(`Row reviewed: ${dish}`).check();
    }
    await page.getByTestId('review-with-terence').click();
    // The step guide is the only forward control: once Terence has reviewed the chart it moves on to the guests.
    const toGuests = page.getByTestId('guide-action').filter({ hasText: /guest/i });
    await toGuests.waitFor();
    await expectDialogNamed('Allergen chart', 'allergen chart');
    await snap('task4-chart');
    await toGuests.click();

    await page.getByTestId('guests-workspace').waitFor();
    const decide = async ({ key, category, action, proposed, evidence, reason }) => {
      await page.getByTestId(`${key}-category-${category}`).click();
      await page.getByTestId(`${key}-action-${action}`).click();
      if (proposed) await byId(`${key}-proposed`).selectOption(proposed);
      for (const e of evidence) await page.getByRole('checkbox', { name: e }).first().check();
      await byId(`${key}-reason`).fill(reason);
      await page.getByTestId(`check-${key}`).click();
      await page.getByTestId(`feedback-${key}`).waitFor();
    };
    await page.getByTestId('guest-tab-priya').click();
    await decide({ key: 'priya:main', category: 'no-conflict', action: 'keep', evidence: [/Beef shin \(Priya Nair main\)/], reason: 'No nuts or peanuts on the beef card. Keep the planned beef.' });
    await decide({ key: 'priya:dessert', category: 'ingredient-conflict', action: 'swap', proposed: 'pear', evidence: [/Ground almonds \(Priya Nair dessert\)/, /Pistachios \(Priya Nair dessert\)/, /^Card note: Made this morning/], reason: 'Ground almonds run through the whole tart and pistachios are on it. Propose the poached pear.' });
    await page.getByTestId('guest-tab-tom').click();
    await decide({ key: 'tom:main', category: 'vegetarian-conflict', action: 'swap', proposed: 'wellington', evidence: [/Beef shin \(Tom Reid main\)/], reason: 'Tom is vegetarian and the main is beef. Propose the Wellington.' });
    await decide({ key: 'tom:dessert', category: 'no-conflict', action: 'keep', evidence: [/Ground almonds \(Tom Reid dessert\)/], reason: 'Nothing on the frangipane card conflicts with a vegetarian diet. Keep it.' });
    if (!(await page.getByTestId('tom-starter-note').count())) finding('minor', "Tom's starter note is not shown on his panel.");
    await snap('task4-guests');
    await page.getByTestId('guide-action').filter({ hasText: /board/i }).click();

    await byId('board-reason-priya:dessert').fill('Severe tree nut and peanut allergy. Almonds through the tart, so pear instead, pending preparation check.');
    await byId('board-reason-tom:main').fill('Vegetarian. Beef swapped to the Wellington.');
    await page.getByTestId('hold-acknowledged').check();
    await page.getByTestId('post-board').click();
    const status = page.getByTestId('prep-status-priya:dessert');
    if (await status.count()) {
      const text = (await status.innerText()).trim();
      if (!/pending/i.test(text) || /safe to serve|cleared/i.test(text)) finding('major', `Priya's dessert shows "${text}" after posting; it must stay a pending preparation check.`);
    } else finding('minor', 'Posted board has no prep-status line for Priya\'s dessert.');
    await snap('task4-board');
    await nextJob('/task/hand-the-kitchen-on');
  });

  // ---------------------------------------------------------------- task 5
  await timed('task5', async () => {
    if (startIndex === STAGES.indexOf('task5')) await page.goto(`${BASE}/task/hand-the-kitchen-on`, { waitUntil: 'domcontentloaded' });
    await closeJobCard();
    await snap('task5-pass');
    await page.getByRole('button', { name: 'Weigh the waste' }).first().click();
    await page.getByRole('heading', { name: 'Weigh the waste' }).waitFor();
    await expectDialogNamed('Weigh the waste', 'waste station');
    for (const [index, [id, kg]] of [['trimmings', '6.4'], ['spoilage', '1.8'], ['plate', '4.2']].entries()) {
      await page.locator('button[aria-label^="Look at the tub"]').nth(index).click();
      await page.getByRole('button', { name: 'Put it on the scales' }).click();
      const input = page.locator(`#waste-${id}-weight`);
      await input.waitFor();
      await page.getByText('The scales have settled').waitFor();
      if (index === 0) {
        // Wrong path first: a weight that is not what the scales show.
        await input.fill('9.9');
        await expectRejected(page, 'This matches the scales.', 'Task 5 wrong waste weight');
      }
      await input.fill(kg);
      await page.getByText('This matches the scales.').first().waitFor();
    }
    await page.getByRole('group', { name: 'Which waste would you look into, and what would you check next?' })
      .getByRole('button', { name: 'Food that went off before it was used' }).click();
    await page.locator('#waste-follow-up-reason').fill('Why the door was open, for how long, and whether the overnight check would have caught it.');
    await snap('task5-waste');
    await page.getByRole('button', { name: 'Write the handover' }).last().click();
    await page.getByRole('heading', { name: 'Kitchen handover' }).waitFor();
    const text = {
      prepared: 'My 4 trays of beef shin (13.5 kg) are on the chill record I signed, last reading 5.9 at 12:45; to the walk-in once down. Frangipane made this morning, poached pear in the pastry fridge. No record seen for the tart or the Wellington.',
      short: 'Salmon: 8 kg came in against 12 ordered, so 4 kg short. Needed for tomorrow lunch, not tonight. Terence said he would ring the supplier before ten; nothing confirmed.',
      watch: 'Larder 2 read 8.6 this morning after the door was found open overnight; rice and melon binned. Needs re-checking before service, not done. Table 3 Priya Nair severe nut allergy: poached pear instead of frangipane, still held for Terence checks.',
      walkIn: 'Walk-in read 3.4 this morning. Beef goes in once it is down. Terence half of the batch not on my record.',
    };
    for (const [id, value] of Object.entries(text)) await page.locator(`#handover-${id}`).fill(value);
    await page.getByRole('button', { name: 'Hand it over' }).click();
    await page.getByRole('alert').filter({ hasText: 'Choose a timing and name who does it' }).waitFor();
    const group = (label) => page.locator('fieldset', { hasText: label });
    await group('Re-check larder fridge 2').getByRole('button', { name: 'Before service', exact: true }).click();
    await page.locator('#responsibility-larder2').fill('Evening sous chef');
    await group('Chase the missing salmon').getByRole('button', { name: 'Later follow-up', exact: true }).click();
    await page.locator('#responsibility-salmon').fill('Terence');
    await group('Pear for table 3').getByRole('button', { name: 'Before service', exact: true }).click();
    await page.locator('#responsibility-table3').fill('Terence and pastry');
    await snap('task5-handover');
    await page.getByRole('button', { name: 'Hand it over' }).click();
    await page.getByTestId('evening-exchange').waitFor();

    await page.getByTestId('exchange-salmon').waitFor();
    await page.getByRole('button', { name: /4 kg\. 8 kg came in against the 12 kg ordered/ }).click();
    await page.getByRole('button', { name: "Tomorrow's lunch. Tonight doesn't use it" }).click();
    await page.getByRole('button', { name: /Terence said he'd ring the supplier before ten/ }).click();
    await page.getByTestId('exchange-larder2').waitFor();
    await page.getByRole('button', { name: /It read 8\.6°C at \d\d:\d\d, above the/ }).click();
    await page.getByRole('button', { name: /It needs re-checking before service/ }).click();
    await page.getByTestId('exchange-table3').waitFor();
    await page.getByRole('button', { name: /Table 3, Priya Nair/ }).click();
    await page.getByRole('button', { name: /Poached pear instead of the frangipane/ }).click();
    await page.getByRole('button', { name: /It's on the events board/ }).click();
    await page.getByTestId('exchange-ready').waitFor();
    await page.getByRole('button', { name: /My 4 trays of beef shin/ }).click();
    await page.getByRole('button', { name: /Frangipane made this morning; poached pear in the pastry fridge/ }).click();
    await page.getByTestId('read-back').waitFor();
    await snap('task5-read-back');
    await page.getByTestId('confirm-read-back').click();
    await page.getByText('Handover delivered').waitFor();
    await page.getByRole('button', { name: 'Go through the chill record with Terence' }).last().click();
    await page.getByRole('heading', { name: 'Review the cooling record with Terence' }).waitFor();
    for (const option of await page.locator('div.space-y-3.flex-1 > button').all()) {
      await option.click();
      if (await page.getByRole('button', { name: 'Ask Terence to sign', disabled: false }).count()) break;
    }
    await page.getByRole('button', { name: 'Ask Terence to sign' }).click();
    await page.getByTestId('mentor-signature').waitFor();
    await snap('task5-signed');
    await page.keyboard.press('Escape');
    await nextJob('/close');
  });

  // ---------------------------------------------------------------- close
  await timed('close', async () => {
    if (startIndex === STAGES.indexOf('close')) await page.goto(`${BASE}/close`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /That's a shift, QA/ }).waitFor();
    await page.getByText('Section complete', { exact: false }).waitFor();
    await snap('close');
    const p = await progress();
    const done = p?.completed ?? [];
    if (done.length !== 5) finding('major', `Close page reached with ${done.length}/5 tasks marked complete: ${done.join(', ')}`);
    // A returning learner must be offered the close of day, not a fresh start.
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('continue-inline').click();
    const resume = page.getByTestId('continue-simulation');
    await resume.waitFor();
    const label = (await resume.innerText()).trim();
    if (!/close of day/i.test(label)) finding('minor', `Returning after completion, the resume button says "${label}" instead of offering the close of day.`);
    await resume.click();
    await page.waitForURL(/\/close/);
    await snap('close-return');
  });

} catch (error) {
  failure = error;
} finally {
  const deliberate = (entry) => deliberatelyBlockedUrls.some((url) => entry.includes(url));
  const expectedAbort = (entry) => /^FAILED net::ERR_ABORTED .*\.mp4$/.test(entry);
  const expectedFailure = (entry) => expectedAbort(entry) || (/^FAILED net::ERR_FAILED /.test(entry) && deliberate(entry));
  const unexpectedRequests = log.failedRequests.filter((entry) => !expectedFailure(entry));
  const unexpectedConsoleErrors = log.consoleErrors.filter((entry) => !(/ERR_FAILED/.test(entry) && deliberate(entry)));
  const majors = log.findings.filter((f) => f.severity === 'major');
  const verdict = {
    passed: !failure && !log.pageErrors.length && !unexpectedConsoleErrors.length && !unexpectedRequests.length && !majors.length,
    failedStage: failure ? failure.message.split('\n')[0] : null,
    unexpectedRequests,
    unexpectedConsoleErrors,
    abortedMediaFetches: log.failedRequests.filter(expectedAbort).length,
    deliberatelyBlockedClipFailures: log.failedRequests.filter((entry) => expectedFailure(entry) && !expectedAbort(entry)).length,
  };
  console.log('\n== QA log ==');
  console.log(JSON.stringify({ verdict, ...log }, null, 2));
  writeFileSync(path.join(OUT, 'qa-log.json'), JSON.stringify({ verdict, ...log }, null, 2));
  await browser.close();
  if (!verdict.passed) process.exitCode = 1;
}
