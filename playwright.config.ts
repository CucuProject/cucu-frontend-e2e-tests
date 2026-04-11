import { defineConfig, devices } from '@playwright/test';

// Get environment from process.env (default: staging)
const ENV = process.env.TEST_ENV || 'staging';

// Base URLs for different environments
const BASE_URLS: Record<string, string> = {
  local: 'http://localhost:4000',
  staging: 'https://staging.cucu.app',
  production: 'https://cucu.app',
};

const baseURL = BASE_URLS[ENV] || BASE_URLS.staging;

console.log(`🚀 Running tests on environment: ${ENV}`);
console.log(`📍 Base URL: ${baseURL}`);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,  // Run tests sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30000,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['list'],
  ],
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
  ],
});
