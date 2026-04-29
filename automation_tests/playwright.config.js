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
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      cwd: '../frontend',
      url: frontendOrigin,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
