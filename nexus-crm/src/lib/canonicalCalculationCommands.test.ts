import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCanonicalCalculationCommandSession } from './canonicalCalculationCommands'
import type { ManualQuoteHttpInput } from './backendCalculationApi'
import { canonicalCalculationFixture, canonicalExecutionFixture, canonicalIds as ids, canonicalQuoteFixture } from '../testUtils/canonicalCalculationFixtures'

const { request } = vi.hoisted(() => ({ request: vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>() }))
vi.mock('./backendApi', () => ({ requestAuthenticatedBackendJson: request }))
const manual: ManualQuoteHttpInput = {
  numero_cotacao_seguradora: null, premio_total: 0, premio_liquido: null, iof: 0, adicional_fracionamento: null,
  comissao_valor: null, validade: null, link_proposta: null, mensagem_seguradora: null, restricoes: null,
  observacao_interna: null, coverages: [], installments: [],
}
const command = { opportunityId: ids.opportunity, calculationId: ids.calculation, executionId: ids.execution, quote: manual }

describe('comandos canônicos conectados', () => {
  beforeEach(() => { request.mockReset() })

  it('recupera resultado manual depois de perda da resposta, mantendo chave e valores oficiais desconhecidos', async () => {
    const keys: unknown[] = []
    request.mockImplementation(async (path, init) => {
      if (path === `/api/execucoes/${ids.execution}`) return keys.length ? canonicalExecutionFixture()
        : canonicalExecutionFixture({ status: 'AGUARDANDO', iniciada_em: null, concluida_em: null })
      if (path === `/api/calculos/${ids.calculation}`) return canonicalCalculationFixture()
      if (path === `/api/execucoes/${ids.execution}/cotacao-manual`) {
        keys.push(init?.headers)
        if (keys.length === 1) throw new Error('Resposta perdida depois de gravar')
        const saved = canonicalQuoteFixture()
        saved.coverages = []; saved.quote.iof = 0
        return saved
      }
      throw new Error('Endpoint inesperado')
    })
    const session = createCanonicalCalculationCommandSession()
    await expect(session.recordManualQuote(command, 'branch/user')).rejects.toThrow('Resposta perdida')
    const result = await session.recordManualQuote(command, 'branch/user')
    expect(result.quote.id).toBe(ids.quote); expect(keys[1]).toEqual(keys[0])
    const posts = request.mock.calls.filter(([, init]) => init?.method === 'POST')
    expect(posts).toHaveLength(2)
    const body: Record<string, unknown> = JSON.parse(String(posts[1][1]?.body))
    expect(body).toMatchObject({ premio_total: 0, premio_liquido: null, comissao_valor: null, validade: null })
    expect(result.execution.comissao_pct_aplicada).toBeNull()
  })

  it('recusa tentativa/pedido de outra oportunidade antes de gravar o resultado', async () => {
    request.mockResolvedValueOnce(canonicalExecutionFixture({ calculo_id: ids.other }))
    await expect(createCanonicalCalculationCommandSession().recordManualQuote(command, 'scope')).rejects.toThrow('não pertence ao pedido')
    expect(request.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
    request.mockReset()
    request.mockResolvedValueOnce(canonicalExecutionFixture()).mockResolvedValueOnce(canonicalCalculationFixture({ oportunidade_id: ids.other }))
    await expect(createCanonicalCalculationCommandSession().recordManualQuote(command, 'scope')).rejects.toThrow('não pertence à oportunidade')
    expect(request.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('prepara somente MANUAL e distingue comissão desconhecida de sobrescrita zero', async () => {
    request.mockResolvedValueOnce(canonicalExecutionFixture({ status: 'AGUARDANDO', iniciada_em: null, concluida_em: null }))
      .mockResolvedValueOnce(canonicalExecutionFixture({ status: 'AGUARDANDO', iniciada_em: null, concluida_em: null, comissao_pct_aplicada: 0, comissao_origem: 'SOBRESCRITA' }))
    const session = createCanonicalCalculationCommandSession()
    await session.createManualExecution({ calculationId: ids.calculation, insurerId: ids.insurer, commissionOverridePct: null }, 'scope')
    await session.createManualExecution({ calculationId: ids.calculation, insurerId: ids.insurer, commissionOverridePct: 0 }, 'scope')
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toMatchObject({ motor: 'MANUAL', comissao_pct_sobrescrita: null })
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toMatchObject({ motor: 'MANUAL', comissao_pct_sobrescrita: 0 })
    expect(request.mock.calls[0][1]?.headers).not.toEqual(request.mock.calls[1][1]?.headers)
  })
})
