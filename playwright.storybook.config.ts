import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/font-setup.ts',
  testDir: './tests/storybook',
  outputDir: './test-results/storybook',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:6006',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port 6006 --strictPort',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: !process.env.CI,
  },
});
