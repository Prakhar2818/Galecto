// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFile: 'playwright-report.html' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
    timeout: 30000,
  },
  projects: [
    {
      name: 'API Tests',
      testMatch: /api\.spec\.js/,
      use: {
        baseURL: 'http://localhost',
      },
    },
    {
      name: 'UI Tests',
      testMatch: /ui\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
  ],
  webServer: {
    command: 'npm run dev:all',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  },
});