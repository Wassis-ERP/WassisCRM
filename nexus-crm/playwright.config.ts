import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  testIgnore: '**/production-bootstrap.pw.ts',
  outputDir: './.screens/e2e',
  workers: 1,
  timeout: 120_000,
  use: { trace: 'off', screenshot: 'only-on-failure' },
})
