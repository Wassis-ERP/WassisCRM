import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCanonicalPresentationSelection, projectBackendCommercialPresentationWorkspace, readBackendCommercialPresentationWorkspace } from './backendCommercialPresentationData'
import { canonicalCalculationFixture, canonicalExecutionFixture, canonicalIds as ids, canonicalPresentationFixture, canonicalQuoteFixture } from '../testUtils/canonicalCalculationFixtures'

const { request } = vi.hoisted(() => ({ request: vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>() }))
vi.mock('./backendApi', () => ({ requestAuthenticatedBackendJson: request }))

describe('dados canônicos do comparativo', () => {
  beforeEach(() => { request.mockReset() })
  it('alinha resultados de duas versões e mantém diferença null/zero, ordem e revisão', () => {
    const second = canonicalCalculationFixture({ id: ids.secondCalculation, rotulo_versao: 'Segunda versão' }).calculation
    const secondQuote = canonicalQuoteFixture(canonicalExecutionFixture({ id: ids.secondExecution, calculo_id: second.id }), ids.secondQuote)
    secondQuote.coverages[0].franquia_valor = null
    const selected = canonicalPresentationFixture(7)
    selected.results.push({ result: secondQuote, calculation: second, insurerName: 'Histórica fixture' })
    selected.items.push({ ...selected.items[0], id: ids.secondQuote, cotacao_id: secondQuote.quote.id, ordem: 20 })
    const workspace = projectBackendCommercialPresentationWorkspace(ids.opportunity, [], [], [], selected)
    expect(workspace.revision).toBe(7)
    expect(workspace.items.map(row => row.candidate.calculation.id)).toEqual([ids.calculation, ids.secondCalculation])
    expect(workspace.comparison[0].differs).toBe(true)
    expect(workspace.comparison[0].cells.map(cell => cell.coverage?.franquia_valor)).toEqual([0, null])
    expect(workspace.items[0].candidate.quote.comissao_valor).toBeNull()
    expect(workspace.items[1].candidate.insurerName).toBe('Histórica fixture')
    expect(workspace.items[1].candidate.primaryInstallment).toBeNull()
  })

  it('sem apresentação mostra candidatos reais, sem montar IDs/itens fictícios', () => {
    const workspace = projectBackendCommercialPresentationWorkspace(ids.opportunity, [canonicalCalculationFixture().calculation], [canonicalQuoteFixture()], [], null)
    expect(workspace.presentation).toBeNull(); expect(workspace.revision).toBeNull()
    expect(workspace.items).toEqual([]); expect(workspace.candidates[0].insurerName).toBe('Seguradora não informada')
    expect(workspace.candidates[0].quote.premio_total).toBe(0)
  })

  it('recusa apresentação e cotação de outra oportunidade', () => {
    const foreign = canonicalPresentationFixture(); foreign.presentation.oportunidade_id = ids.other
    expect(() => projectBackendCommercialPresentationWorkspace(ids.opportunity, [], [], [], foreign)).toThrow('não pertence')
    expect(() => projectBackendCommercialPresentationWorkspace(ids.opportunity,
      [canonicalCalculationFixture({ oportunidade_id: ids.other }).calculation], [canonicalQuoteFixture()], [], null)).toThrow('pedido válido')
  })

  it('lê a apresentação persistida por ID com AbortSignal, sem catálogo administrativo', async () => {
    request.mockImplementation(async path => {
      if (path === `/api/apresentacoes/${ids.presentation}`) return canonicalPresentationFixture(4)
      const items = path.includes('/cotacoes?') ? [canonicalQuoteFixture()] : path.includes('/calculos?') ? [canonicalCalculationFixture()] : []
      return { items, page: 1, pageSize: 100, totalCount: items.length, hasMore: false }
    })
    const signal = new AbortController().signal
    const result = await readBackendCommercialPresentationWorkspace(ids.opportunity, ids.presentation, signal)
    expect(result.presentation?.id).toBe(ids.presentation); expect(result.revision).toBe(4)
    expect(result.items).toHaveLength(1)
    expect(request.mock.calls.every(([path, init]) => !path.includes('/core/') && init?.signal === signal)).toBe(true)
  })
  it('não associa coberturas sem catálogo só porque seguradoras usam o mesmo código', () => {
    const selected = canonicalPresentationFixture()
    const second = canonicalQuoteFixture(canonicalExecutionFixture({ id: ids.secondExecution }), ids.secondQuote)
    selected.results[0].result.coverages[0].cobertura_id = null
    second.coverages[0].cobertura_id = null
    selected.results.push({ result: second, calculation: canonicalCalculationFixture().calculation, insurerName: 'Outra seguradora' })
    selected.items.push({ ...selected.items[0], id: ids.secondQuote, cotacao_id: ids.secondQuote, ordem: 20 })
    const workspace = projectBackendCommercialPresentationWorkspace(ids.opportunity, [], [], [], selected)
    expect(workspace.comparison).toHaveLength(2)
    expect(workspace.comparison.every(row => row.cells.filter(cell => cell.coverage !== null).length === 1)).toBe(true)
  })
  it('remove seleção preservando a revisão carregada e sem aprovar a cotação', () => {
    const selected = canonicalPresentationFixture(7)
    const workspace = projectBackendCommercialPresentationWorkspace(ids.opportunity, [], [], [], selected)
    const command = buildCanonicalPresentationSelection(workspace, ids.quote)
    expect(command.expectedRevision).toBe(7)
    expect(command.input).toMatchObject({ status: 'RASCUNHO', selectedQuoteId: null, items: [] })
    expect(workspace.items).toHaveLength(1)
    expect(selected.results[0].result.quote.status).toBe('APRESENTADA')
    expect(() => buildCanonicalPresentationSelection({ ...workspace, revision: null }, ids.quote)).toThrow('revisão')
  })
  it('limita a seleção a cinco e aceita remover uma opção sem alterar o snapshot original', () => {
    const workspace = projectBackendCommercialPresentationWorkspace(ids.opportunity, [canonicalCalculationFixture().calculation], [canonicalQuoteFixture()], [], null)
    const candidate = workspace.candidates[0]
    const selected = canonicalPresentationFixture()
    selected.presentation.cotacao_escolhida_id = null
    workspace.presentation = selected.presentation; workspace.revision = selected.revision
    const quoteId = (index: number) => `eeeeeeee-eeee-eeee-eeee-${String(index + 1).padStart(12, '0')}`
    workspace.items = Array.from({ length: 5 }, (_, index) => {
      const id = quoteId(index), executionId = `ffffffff-ffff-ffff-ffff-${String(index + 1).padStart(12, '0')}`
      return {
        item: { ...selected.items[0], id, cotacao_id: id, ordem: (index + 1) * 10 },
        candidate: { ...candidate, execution: { ...candidate.execution, id: executionId, seguradora_id: id },
          quote: { ...candidate.quote, id, execucao_id: executionId },
          coverages: candidate.coverages.map(row => ({ ...row, id, cotacao_id: id })) },
      }
    })
    workspace.candidates.push(...workspace.items.map(row => row.candidate))
    expect(() => buildCanonicalPresentationSelection(workspace, ids.quote)).toThrow('máximo 5')
    expect(buildCanonicalPresentationSelection(workspace, quoteId(0)).input.items).toHaveLength(4)
    expect(workspace.items).toHaveLength(5)
  })
})
