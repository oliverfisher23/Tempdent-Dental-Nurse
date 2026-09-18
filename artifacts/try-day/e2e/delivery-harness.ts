import { expect, type Frame, type Locator, type Page, type TestInfo } from '@playwright/test';
import type { Progress } from '../src/lib/simulation';

export const DELIVERY = 'check-the-delivery-in';
const LEARNER_KEY = 'springpod:mar-try-day:v1';
const TEST_KEY = `${LEARNER_KEY}:designer-test`;

declare global {
  interface Window {
    deliveryHostEvents: unknown[];
    deliveryLearnerAccess: string[];
  }
}

export class DeliveryHarness {
  readonly errors: string[] = [];
  app!: Frame;
  baseline!: Progress;

  constructor(readonly page: Page, readonly baseURL: string, readonly keyboard: boolean) {
    page.on('pageerror', (error) => this.errors.push(error.message));
  }

  async start() {
    const entry = new URL('?testMode=1', this.baseURL).href;
    const host = new URL('__delivery-regression-host', this.baseURL).href;
    // A real parent is essential: a top-level app already suppresses host events
    // even if its test-mode guard breaks. This route exists only in this browser.
    await this.page.route(host, (route) => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <style>html,body{margin:0;width:100%;height:100%}iframe{border:0;width:100%;height:100%;display:block}</style>
        </head><body><script>
        window.deliveryHostEvents=[]; window.deliveryLearnerAccess=[];
        addEventListener('message', event => {
          if (['task:complete','gate:complete'].includes(event.data?.event)) {
            window.deliveryHostEvents.push(event.data);
          }
        });
        </script><iframe title="Delivery regression" name="delivery" src=${JSON.stringify(entry)}></iframe></body></html>`,
    }));
    // Observe real learner-key access without seeding, clearing or suppressing it.
    // The fresh Playwright context, not normal learner storage, owns this run.
    await this.page.addInitScript((learnerKey) => {
      if (window === window.top) return;
      for (const method of ['getItem', 'setItem', 'removeItem', 'clear'] as const) {
        const original = Storage.prototype[method];
        Object.defineProperty(Storage.prototype, method, {
          configurable: true,
          value: function (this: Storage, ...args: string[]) {
            if (this === window.localStorage && (method === 'clear' || args[0] === learnerKey)) {
              window.top!.deliveryLearnerAccess.push(`${method}:${args[0] ?? '*'}`);
            }
            return Reflect.apply(original, this, args);
          },
        });
      }
    }, LEARNER_KEY);
    await this.page.goto(host);
    await expect(this.page.frameLocator('iframe').getByRole('button', { name: 'Designer test', exact: true })).toBeVisible();
    this.app = this.page.frame({ name: 'delivery' })!;
    expect(await this.app.evaluate(() => window.parent !== window)).toBe(true);

    const toggle = this.button('Designer test');
    await this.activate(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The toggle collapses controls. "Close" seeds a completed day: never use it.
    await this.activate(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await this.activate(toggle);
    await this.activate(this.app.getByRole('navigation', { name: 'Test destinations' }).getByRole('button', { name: 'Task 2', exact: true }));
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await this.activate(this.app.getByTestId('guide-action'));
    await expect(this.app.getByRole('heading', { name: 'Working order sheet', exact: true })).toBeVisible();
    await this.go('Order sheet');
    await expect.poll(() => this.progress()).toMatchObject({ completed: ['take-the-handover'], completedAt: null });
    this.baseline = await this.progress();
    expect(this.baseline.tasks[DELIVERY].signed).toBe(false);
    expect(this.baseline.tasks[DELIVERY].contextRevealed).toBe(false);
    expect(Object.values(this.baseline.tasks[DELIVERY].lines).every((line) => !line.counted && !line.probed && line.arrived === '')).toBe(true);
  }

  button(name: string) { return this.app.getByRole('button', { name, exact: true }); }
  row(id: string) { return this.app.locator(`[data-line-id="${id}"]`); }
  nav(name: string) { return this.app.getByRole('navigation', { name: 'Working order sheet' }).getByRole('button', { name, exact: true }); }

  async activate(control: Locator) {
    await expect(control).toBeVisible();
    await expect(control).toBeEnabled();
    if (this.keyboard) {
      await control.focus();
      await expect(control).toBeFocused();
      await control.press('Space');
    } else {
      await control.tap();
    }
  }

  async fill(control: Locator, value: string) {
    if (this.keyboard) {
      await control.focus();
      await control.press('ControlOrMeta+A');
      await control.press('Backspace');
      await control.pressSequentially(value);
    } else {
      await control.fill(value);
    }
    await expect(control).toHaveValue(value);
  }

  async select(control: Locator, value: string) {
    if (this.keyboard) {
      const index = await control.locator('option').evaluateAll((options, value) =>
        options.findIndex((option) => (option as HTMLOptionElement).value === value), value);
      expect(index).toBeGreaterThanOrEqual(0);
      await control.focus();
      await control.press('Home');
      for (let i = 0; i < index; i++) await control.press('ArrowDown');
      await control.press('Enter');
    } else {
      await control.selectOption(value);
    }
    await expect(control).toHaveValue(value);
  }

  async go(name: string) {
    await this.activate(this.nav(name));
    await expect(this.nav(name)).toHaveAttribute('aria-current', 'page');
  }

  async progress(): Promise<Progress> {
    return this.app.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? 'null'), TEST_KEY);
  }

  async saved(expected: Record<string, unknown>) {
    await expect.poll(async () => (await this.progress())?.tasks[DELIVERY]).toMatchObject(expected);
  }

  async reload() {
    // Reload only the child so the parent's event/access audit survives.
    await this.app.goto(this.app.url());
    await expect(this.button('Designer test')).toBeVisible();
    const saved = await this.progress();
    if (saved.completed.includes(DELIVERY)) {
      await expect(this.app.getByRole('heading', { name: "You've signed this off", exact: true })).toBeVisible();
    } else if (!saved.tasks[DELIVERY].signed) {
      // Routes start at the pass, not goods-in. The guide opens the real workspace.
      await this.activate(this.app.getByTestId('guide-action'));
      await expect(this.app.getByRole('heading', { name: 'Working order sheet', exact: true })).toBeVisible();
    }
    expect(new URL(this.app.url()).searchParams.get('testMode')).toBe('1');
  }

  async assertIsolated() {
    const progress = await this.progress();
    for (const id of Object.keys(this.baseline.tasks) as Array<keyof Progress['tasks']>) {
      if (id !== DELIVERY) expect(progress.tasks[id], `${id} must not be exercised or rewritten`).toEqual(this.baseline.tasks[id]);
    }
    expect(progress.completedAt).toBeNull();
    expect(await this.page.evaluate((key) => localStorage.getItem(key), LEARNER_KEY)).toBeNull();
    expect(await this.page.evaluate(() => window.deliveryLearnerAccess)).toEqual([]);
    expect(await this.page.evaluate(() => window.deliveryHostEvents)).toEqual([]);
    expect(this.errors, 'uncaught browser errors').toEqual([]);
  }

  async capture(testInfo: TestInfo, name: string) {
    await testInfo.attach(name, { body: await this.page.screenshot(), contentType: 'image/png' });
  }
}