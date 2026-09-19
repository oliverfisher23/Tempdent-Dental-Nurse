import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const port = 4174;
const artifactRoot = path.resolve(import.meta.dirname, '..');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined);

// The complete fridge round starts its own isolated Vite server at the root
// path, so the check does not depend on the preview workflow being up and
// never shares a session with a person using the preview.
export default defineConfig({
  testDir: '.',
  testMatch: 'fridge-round.spec.mjs',
  outputDir: path.join(artifactRoot, 'test-results/fridge-round'),
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    headless: true,
    launchOptions: { executablePath, args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm run dev',
    cwd: artifactRoot,
    env: {
      ...process.env,
      PORT: String(port),
      BASE_PATH: '/',
    },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
