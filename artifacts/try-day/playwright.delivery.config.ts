import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const baseURL = process.env.DELIVERY_BASE_URL
  ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/` : 'http://localhost:80/');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined);

// Use the managed preview workflow, never start a second Vite service.
export default defineConfig({
  testDir: './tests',
  testMatch: 'delivery-browser.spec.ts',
  outputDir: './test-results/delivery',
  timeout: 180_000,
  expect: { timeout: 8_000 },
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report/delivery', open: 'never' }],
  ],
  use: {
    baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`,
    browserName: 'chromium',
    launchOptions: { executablePath, args: ['--no-sandbox'] },
    reducedMotion: 'reduce',
    actionTimeout: 8_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-keyboard', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});