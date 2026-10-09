import { test, expect } from '@playwright/test'

// This tests the compiled, deployable bundle, not Vite's development transform.
// The identity response is synthetic; the real FE/BE journey is segurados.pw.ts.
test('bundle de produção inicia com Auth0 e consulta somente o BE configurado', async ({ page }) => {
  const baseUrl = 'http://127.0.0.1:4173'
  const apiOrigin = new URL(process.env.WASSIS_PRODUCTION_SMOKE_API_URL ?? 'https://localhost:54269').origin
  const errors: string[] = []
  const apiRequests: string[] = []
  const unexpected: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === new URL(baseUrl).origin) return route.continue()
    if (url.origin === apiOrigin && url.pathname === '/api/identity/me') {
      apiRequests.push(url.pathname)
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    }
    unexpected.push(`${url.origin}${url.pathname}`)
    await route.abort()
  })
  await page.goto(baseUrl)
  await expect(page.getByRole('button', { name: 'Entrar com a conta corporativa' })).toBeVisible()
  await expect(page.getByPlaceholder('••••••••', { exact: true })).toHaveCount(0)
  expect(apiRequests).toContain('/api/identity/me')
  expect(unexpected).toEqual([])
  expect(errors).toEqual([])
})
