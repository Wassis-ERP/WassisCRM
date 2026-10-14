import { test, expect, type Page } from '@playwright/test'

const branch = '44444444-4444-4444-4444-444444444444'
const line = '77777777-7777-7777-7777-777777777777'
const insurer = (index: number) => `99999999-9999-9999-9999-${String(index).padStart(12, '0')}`
test.use({ actionTimeout: 15_000 })

async function assertDesktop(page: Page, name: string) {
  while (await page.getByRole('button', { name: 'Fechar aviso', exact: true }).count()) {
    await page.getByRole('button', { name: 'Fechar aviso', exact: true }).first().click()
  }
  expect(await page.evaluate(() => ({ zoom: devicePixelRatio, overflow: document.documentElement.scrollWidth > innerWidth }))).toEqual({ zoom: 1, overflow: false })
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: true, animations: 'disabled' })
}

async function saveComparison(page: Page) {
  const response = page.waitForResponse(response => ['POST', 'PUT'].includes(response.request().method())
    && /\/apresentacoes(?:\/[^/]+)?$/.test(new URL(response.url()).pathname), { timeout: 20_000 })
  await page.getByRole('button', { name: 'Salvar comparativo', exact: true }).click()
  expect((await response).ok()).toBe(true)
  await expect(page.getByRole('button', { name: 'Salvar comparativo', exact: true })).toBeDisabled()
}

test('cálculo, tentativa manual e comparativo persistem pelo BE canônico', async ({ page, context }) => {
  test.setTimeout(180_000)
  const base = process.env.WASSIS_E2E_URL ?? 'http://localhost:3011'
  const api = process.env.WASSIS_E2E_API_URL ?? 'http://127.0.0.1:5087'
  for (const url of [base, api]) if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Use somente o ambiente descartável local.')
  const errors: string[] = []
  const external: string[] = []
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (![new URL(base).origin, new URL(api).origin].includes(url.origin)) {
      external.push(`${url.origin}${url.pathname}`)
      await route.abort()
    } else await route.continue()
  })
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base)
  await page.getByPlaceholder('seu@email.com').fill('user0@example.invalid')
  await page.getByPlaceholder('••••••••', { exact: true }).fill('local-integration-fixture-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Segurados', exact: true })).toBeVisible({ timeout: 15_000 })
  const csrfResponse = await page.request.get(`${api}/api/identity/csrf`)
  expect(csrfResponse.ok()).toBe(true)
  const csrf = (await csrfResponse.json() as { token: string }).token
  const headers = { 'X-CSRF-TOKEN': csrf, 'X-Office-Branch-Id': branch }
  const created = await page.request.post(`${api}/api/oportunidades`, { headers, data: {
    officeBranchId: branch, name: `Cálculo sintético ${Date.now()}`, title: 'Jornada canônica sintética',
    leadName: 'Lead sintético', pipelineId: '55555555-5555-5555-5555-555555555555',
    stageId: '66666666-6666-6666-6666-666666666666', insuranceLineId: line, status: 'pending', metadata: {},
  } })
  expect(created.ok()).toBe(true)
  const opportunity = (await created.json() as { id: string }).id
  const path = `/oportunidades/${opportunity}`
  const calendar = await page.request.get(`${api}/api/oportunidades/${opportunity}/calculos/contexto?ramoId=${line}`, { headers })
  expect(calendar.ok()).toBe(true)
  const calendarData = await calendar.json() as { branchDate: string; timeZone: string }
  await page.goto(`${base}${path}/calculos/novo`)
  await expect(page.getByRole('heading', { name: 'Novo cálculo', exact: true })).toBeVisible()
  await expect(page.getByLabel('Início da vigência', { exact: false })).toHaveValue(calendarData.branchDate)
  await expect(page.getByText(`Calendário da corretora · ${calendarData.timeZone}`, { exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Zero km', exact: true })).toHaveValue('')
  await page.getByRole('combobox', { name: 'Zero km', exact: true }).selectOption('nao')
  await page.getByRole('combobox', { name: 'Alienado', exact: true }).selectOption('sim')
  await page.getByLabel('Casco — percentual FIPE (%)', { exact: true }).fill('0')
  await assertDesktop(page, 'calculo-editor-desktop')
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(true)
  const calculationResponse = page.waitForResponse(response => response.request().method() === 'POST' && /\/calculos$/.test(new URL(response.url()).pathname), { timeout: 20_000 })
  await page.getByRole('button', { name: 'Salvar cálculo', exact: true }).first().click()
  const savedCalculationResponse = await calculationResponse
  expect(savedCalculationResponse.status()).toBe(201)
  const calculation = await savedCalculationResponse.json() as { calculation: { id: string }; specialization: { data: { zero_km: boolean | null; alienado: boolean | null; kit_gas: boolean | null } }; coverages: { percentual_fipe_solicitado: number | null }[] }
  expect(calculation.specialization.data).toMatchObject({ zero_km: false, alienado: true, kit_gas: null })
  expect(calculation.coverages[0].percentual_fipe_solicitado).toBe(0)
  const calculationPath = `${path}/calculos/${calculation.calculation.id}`
  await expect(page).toHaveURL(`${base}${calculationPath}`)
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Zero km', exact: true })).toHaveValue('nao')
  await expect(page.getByRole('combobox', { name: 'Kit gás', exact: true })).toHaveValue('')
  await expect(page.getByLabel('Casco — percentual FIPE (%)', { exact: true })).toHaveValue('0')

  await page.goto(`${base}${calculationPath}/cotacoes/nova`)
  await page.getByRole('combobox', { name: 'Seguradora', exact: true }).selectOption(insurer(1))
  await expect(page.getByLabel('Comissão (%)', { exact: false })).toHaveValue('')
  await page.getByRole('button', { name: 'Preparar tentativa manual', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Tentativa 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar tentativa', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar tentativa', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'cancelada' })).toBeVisible()
  await page.getByLabel('Comissão (%)', { exact: false }).fill('0')
  const retryResponse = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/reexecutar'))
  await page.getByRole('button', { name: 'Preparar nova tentativa', exact: true }).click()
  const retry = await (await retryResponse).json() as { id: string }
  await expect(page.getByRole('status').filter({ hasText: 'Tentativa 2' })).toBeVisible()
  await page.goto(`${base}${calculationPath}/cotacoes/nova?tentativa=${retry.id}`)
  await expect(page.getByLabel('Comissão (%)', { exact: false })).toHaveValue('0')
  await expect(page.getByRole('status').filter({ hasText: 'Tentativa 2' })).toBeVisible()
  await page.getByLabel('Prêmio total (R$)', { exact: true }).fill('0')
  await page.getByRole('combobox', { name: 'Casco sintético', exact: true }).selectOption('true')
  await page.getByLabel('Casco sintético — Limite (R$)', { exact: true }).fill('0')
  await page.getByRole('combobox', { name: 'Danos materiais sintéticos', exact: true }).selectOption('false')
  await expect(page.getByText('Parcelamento não informado.', { exact: true })).toBeVisible()
  await assertDesktop(page, 'cotacao-manual-desktop')
  const writes: { key: string | null; body: string | null }[] = []
  await page.route('**/api/execucoes/*/cotacao-manual', async route => {
    writes.push({ key: route.request().headers()['idempotency-key'] ?? null, body: route.request().postData() })
    const response = await route.fetch()
    expect(response.ok()).toBe(true)
    if (writes.length === 1) await route.abort('failed') // Lost acknowledgement after the real transaction commits.
    else await route.fulfill({ response })
  })
  await page.locator('form.manual-quote-page').evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit() })
  await expect(page.getByRole('alert')).toContainText('Os dados enviados foram preservados')
  expect(writes).toHaveLength(1)
  await expect(page.getByLabel('Prêmio total (R$)', { exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page).toHaveURL(`${base}${calculationPath}`)
  expect(writes).toHaveLength(2)
  expect(writes[1]).toEqual(writes[0])
  await page.unroute('**/api/execucoes/*/cotacao-manual')
  await page.reload()
  await expect(page.getByText('Seguradora sintética 1', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Danos materiais sintéticos · Não incluída', { exact: true })).toBeVisible()
  const quoteResponse = await page.request.get(`${api}/api/oportunidades/${opportunity}/cotacoes?page=1&pageSize=100`, { headers })
  const result = await quoteResponse.json() as { items: { quote: { premio_total: number; premio_liquido: number | null; comissao_valor: number | null }; execution: { comissao_pct_aplicada: number | null; comissao_origem: string }; coverages: { incluida: boolean | null; limite_aceito: number | null }[]; installments: unknown[] }[] }
  expect(result.items).toHaveLength(1)
  expect(result.items[0]).toMatchObject({ quote: { premio_total: 0, premio_liquido: null, comissao_valor: null }, execution: { comissao_pct_aplicada: 0, comissao_origem: 'SOBRESCRITA' }, installments: [] })
  expect(result.items[0].coverages.map(row => row.incluida)).toEqual(expect.arrayContaining([true, false]))

  for (let index = 2; index <= 6; index++) {
    await page.goto(`${base}${calculationPath}/cotacoes/nova`)
    await page.getByRole('combobox', { name: 'Seguradora', exact: true }).selectOption(insurer(index))
    await page.getByLabel('Prêmio total (R$)', { exact: true }).fill(String(index * 100))
    await page.getByRole('button', { name: 'Registrar cotação', exact: true }).click()
    await expect(page).toHaveURL(`${base}${calculationPath}`)
  }
  await page.getByRole('button', { name: 'Abrir comparativo', exact: true }).first().click()
  await expect(page).toHaveURL(`${base}${path}/apresentacao`)
  const choices = page.getByRole('checkbox')
  await expect(choices).toHaveCount(6)
  for (let index = 0; index < 5; index++) await choices.nth(index).check()
  await choices.nth(5).click()
  await expect(choices.nth(5)).not.toBeChecked()
  await expect(page.getByText('O comparativo aceita no máximo 5 cotações.', { exact: true })).toBeVisible()
  await saveComparison(page)
  await page.reload()
  for (let index = 0; index < 5; index++) await expect(choices.nth(index)).toBeChecked()
  await choices.nth(0).uncheck()
  await saveComparison(page)
  await page.reload()
  await expect(choices.nth(0)).not.toBeChecked()
  await assertDesktop(page, 'comparativo-desktop')

  const other = await context.newPage()
  await other.setViewportSize({ width: 1440, height: 900 })
  await other.goto(`${base}${path}/apresentacao`)
  await expect(other.getByRole('checkbox')).toHaveCount(6)
  await other.getByRole('checkbox').nth(5).check()
  await choices.nth(0).check()
  await saveComparison(page)
  await other.getByRole('button', { name: 'Salvar comparativo', exact: true }).click()
  await expect(other.getByRole('alert').filter({ hasText: 'Revisão desatualizada' })).toBeVisible()
  await expect(other.getByRole('checkbox').nth(5)).toBeChecked() // Local decision is retained until explicit reload.
  await assertDesktop(other, 'comparativo-conflito-desktop')
  await other.getByRole('button', { name: 'Recarregar revisão', exact: true }).click()
  await other.getByRole('dialog').getByRole('button', { name: 'Recarregar revisão', exact: true }).click()
  await expect(other.getByRole('alert').filter({ hasText: 'Revisão desatualizada' })).toHaveCount(0)
  await expect(other.getByRole('checkbox').nth(0)).toBeChecked()
  await expect(other.getByRole('checkbox').nth(5)).not.toBeChecked()
  await other.close()
  expect(errors).toEqual([])
  expect(external).toEqual([])
})
