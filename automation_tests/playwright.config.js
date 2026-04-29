import { defineConfig, devices } from '@playwright/test';

const frontendOrigin = 'http://localhost:9000';
const backendReadyUrl = 'http://localhost:9001/api/todos';

export default defineConfig({
  testDir: './playwright/tests',
  /* Shared DB: parallel runs shuffle project order and shared-state assumptions. */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: frontendOrigin,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    // Adds an artificial delay before Playwright actions (click/type/navigate).
    // This is applied across all tests using this Playwright config.
    // launchOptions: { slowMo: 1000 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: [
    {
      command: 'npm run start',
      cwd: '../backend',
      url: backendReadyUrl,
      // mongodb-memory-server may download binaries on first run; 60s is often too tight.
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      // Avoid MongoDB Atlas (IP whitelist) when Playwright spawns the API. Backend uses mongodb-memory-server.
      env: {
        ...process.env,
        ...(process.env.PLAYWRIGHT_USE_ATLAS === '1' ? {} : { USE_MEMORY_MONGO: '1' }),
      },
    },
    {
      command: 'npm run dev',
      cwd: '../frontend',
      url: frontendOrigin,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
