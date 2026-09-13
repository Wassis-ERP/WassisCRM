import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  outputDir: './.screens/e2e',
  workers: 1,
  use: { trace: 'off', screenshot: 'only-on-failure' },
})
