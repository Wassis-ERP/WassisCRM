import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/production-bootstrap.pw.ts',
  outputDir: './.screens/production-smoke',
  workers: 1,
  use: { trace: 'off', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
