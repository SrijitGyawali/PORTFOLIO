import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  workers: 1,
  reporter: 'list',
  projects: [
    { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'firefox', testMatch: '**/compatibility.spec.ts', use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: '**/compatibility.spec.ts', use: { browserName: 'webkit' } },
  ],
  use: {
    baseURL: process.env.PORTFOLIO_BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
  },
})
