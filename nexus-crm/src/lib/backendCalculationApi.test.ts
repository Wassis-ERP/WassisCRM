import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptySpecialization } from '../modules/comercial/calculationForm'
import type { CalculationAggregate, CalculationCreateInput } from '../modules/comercial/calculationDomain'
import type { SaveCommercialPresentationInput } from '../modules/comercial/commercialPresentationDomain'
import type { CalculoExecucaoRow, CalculoRow } from '../types/database'
import type { BackendPresentationAggregate, BackendQuoteAggregate } from './calculationHttpContracts'
import {
  cancelBackendManualExecution, createBackendCalculation, createBackendManualExecution, getBackendCalculation,
  getBackendCalculationContext, getBackendCalculationExecution, getBackendQuote, listBackendCalculations, recordBackendManualQuote,
  retryBackendManualExecution, saveBackendPresentation, type ManualQuoteHttpInput,
} from './backendCalculationApi'

const { request } = vi.hoisted(() => ({ request: vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>() }))
vi.mock('./backendApi', () => ({ requestAuthenticatedBackendJson: request }))
const opportunity = '11111111-1111-1111-1111-111111111111'
const insurer = '33333333-3333-3333-3333-333333333333', line = '44444444-4444-4444-4444-444444444444'
const calculationId = '55555555-5555-5555-5555-555555555555', executionId = '66666666-6666-6666-6666-666666666666'
const quoteId = '77777777-7777-7777-7777-777777777777', presentationId = '88888888-8888-8888-8888-888888888888'
const otherId = '99999999-9999-9999-9999-999999999999', time = '2026-10-12T12:00:00Z'
const header: CalculoRow = {
  id: calculationId, oportunidade_id: opportunity, ramo_id: line, segurado_id: null, seguradora_anterior_id: insurer,
  origem: 'MANUAL', comissao_sugerida_pct: null, rotulo_versao: 'V1 · Auto', tipo_seguro: 'RENOVACAO_OUTRA', bonus: 0,
  qtd_sinistros: null, qtd_sinistros_perda_parcial: null, transferiu_titularidade: null,
  vigencia_inicio: '2026-10-12', vigencia_fim: '2027-10-12', vigencia_fim_anterior: '2026-10-12',
  numero_apolice_anterior: 'Anterior fixture', codigo_identificacao_anterior: null, status_apolice_anterior: null,
  nota_interna: null, criado_em: time,
}
function aggregate(): CalculationAggregate {
  const risk = createEmptySpecialization('AUTO')
  if (risk.forma !== 'AUTO') throw new Error('Fixture Auto inválida.')
  return { calculation: { ...header }, specialization: { forma: 'AUTO', data: { ...risk.data, calculo_id: calculationId, chassi_remarcado: null } }, coverages: [] }
}
const execution: CalculoExecucaoRow = {
  id: executionId, calculo_id: calculationId, seguradora_id: insurer, reexecucao_de_id: null, tentativa: 1, motor: 'MANUAL',
  comissao_pct_aplicada: 0, comissao_origem: 'SOBRESCRITA', status: 'CONCLUIDA', pendencia_codigo: null, pendencia_mensagem: null,
  erro_codigo: null, erro_mensagem_segura: null, referencia_externa: null, iniciada_em: time, concluida_em: time, criada_em: time,
}
const manual: ManualQuoteHttpInput = {
  numero_cotacao_seguradora: null, premio_total: 0, premio_liquido: null, iof: 0, adicional_fracionamento: null,
  comissao_valor: null, validade: null, link_proposta: null, mensagem_seguradora: null, restricoes: null,
  observacao_interna: null, coverages: [], installments: [],
}
const quote: BackendQuoteAggregate = {
  execution, quote: { ...manual, id: quoteId, execucao_id: executionId, status: 'APRESENTADA', recebida_em: time, aprovada_em: null, descartada_motivo: null },
  coverages: [], installments: [],
}
function presentation(revision = 1): BackendPresentationAggregate {
  return {
    presentation: { id: presentationId, oportunidade_id: opportunity, criado_por_id: null, cotacao_escolhida_id: quoteId,
      titulo: null, layout: 'VERTICAL', criterio_ordenacao: 'MANUAL', exibir_percentual_fipe: true, exibir_vantagens: true,
      exibir_legenda: true, exibir_observacoes: true, exibir_comissao: false, observacoes_comerciais: null,
      status: 'GERADA', criado_em: time, atualizado_em: time, gerada_em: time, escolhida_em: time },
    items: [{ id: otherId, apresentacao_id: presentationId, cotacao_id: quoteId, parcelamento_id: null, ordem: 10,
      recomendada: false, titulo_comercial: null, vantagens_texto: null, observacao_comercial: null }],
    revision, results: [{ result: quote, calculation: header, insurerName: 'Seguradora fixture' }],
  }
}
const saveInput: SaveCommercialPresentationInput = { opportunityId: opportunity, layout: 'VERTICAL', ordering: 'MANUAL',
  showFipe: true, showAdvantages: true, showLegend: true, showNotes: true, showCommission: false, status: 'GERADA',
  selectedQuoteId: quoteId, createdById: otherId, items: [{ quoteId }] }

describe('adapter HTTP canônico de cálculo', () => {
  beforeEach(() => { request.mockReset() })
  it('preserva bônus zero e valores desconhecidos e descarta campos fora do contrato', async () => {
    const source = aggregate(); request.mockResolvedValue({ ...source, calculation: { ...source.calculation, credencial: 'extra-fixture' } })
    const result = await getBackendCalculation(calculationId)
    expect(result.calculation.bonus).toBe(0); expect(result.specialization.data).toHaveProperty('chassi_remarcado', null)
    expect(result.calculation).not.toHaveProperty('credencial')
  })
  it('recusa ID de risco divergente e rota manipulada, sem fallback em memória', async () => {
    const source = aggregate(); request.mockResolvedValue({ ...source, specialization: { forma: 'AUTO', data: { ...source.specialization.data, calculo_id: otherId } } })
    await expect(getBackendCalculation(calculationId)).rejects.toThrow('contrato')
    request.mockReset(); await expect(getBackendCalculation('../segurados')).rejects.toThrow('Identificador')
    expect(request).not.toHaveBeenCalled()
  })
  it('aceita UUID com letras maiúsculas sem confundir a resposta canônica', async () => {
    const lower = 'abcdef01-abcd-abcd-abcd-abcdef012345', source = aggregate()
    source.calculation.id = lower
    source.specialization.data.calculo_id = lower
    request.mockResolvedValue(source)
    expect((await getBackendCalculation(lower.toUpperCase())).calculation.id).toBe(lower)
    expect(request.mock.calls[0][0]).toBe(`/api/calculos/${lower}`)
  })
  it('exige paginação consistente e oportunidade correspondente; repassa cancelamento', async () => {
    const controller = new AbortController()
    request.mockResolvedValue({ items: [aggregate()], page: 1, pageSize: 1, totalCount: 1, hasMore: false })
    expect((await listBackendCalculations(opportunity, { pageSize: 1, signal: controller.signal })).totalCount).toBe(1)
    expect(request.mock.calls[0][1]?.signal).toBe(controller.signal)
    request.mockResolvedValue({ items: [], page: 1, pageSize: 1, totalCount: 3, hasMore: true })
    await expect(listBackendCalculations(opportunity, { pageSize: 1 })).rejects.toThrow('contrato')
    request.mockResolvedValue({ items: [aggregate()], page: 1, pageSize: 1, totalCount: 1, hasMore: false })
    await expect(listBackendCalculations(otherId, { pageSize: 1 })).rejects.toThrow('outro contexto')
  })
  it('cria Auto com chave explícita e sem rótulo técnico enviado pelo cliente', async () => {
    const source = aggregate()
    const input: CalculationCreateInput = { ...source.calculation, origem: 'MANUAL', tipo_seguro: 'RENOVACAO_OUTRA', specialization: source.specialization, coverages: [] }
    request.mockResolvedValue(source)
    await createBackendCalculation(input, 'stable-key'); await createBackendCalculation(input, 'stable-key')
    const init = request.mock.calls[0][1]
    expect(init?.method).toBe('POST'); expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('stable-key')
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('rotulo_versao')
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('id')
    expect(JSON.parse(String(init?.body)).specialization.data).not.toHaveProperty('calculo_id')
    expect(request.mock.calls[1][1]?.body).toBe(init?.body)
    request.mockReset()
    await expect(createBackendCalculation({ ...input, specialization: createEmptySpecialization('VIDA') }, 'key')).rejects.toThrow('Auto')
    expect(request).not.toHaveBeenCalled()
  })
  it('mantém comissão zero explícita, vínculos de reexecução e cancelamento', async () => {
    request.mockResolvedValue({ ...execution, status: 'AGUARDANDO', iniciada_em: null, concluida_em: null })
    await createBackendManualExecution(calculationId, insurer, 'execution-key', 0)
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toMatchObject({ motor: 'MANUAL', comissao_pct_sobrescrita: 0 })
    request.mockResolvedValue({ ...execution, id: otherId, tentativa: 2, reexecucao_de_id: executionId, status: 'AGUARDANDO' })
    expect((await retryBackendManualExecution(executionId, 'retry-key')).id).toBe(otherId)
    request.mockResolvedValue({ ...execution, status: 'CANCELADA' })
    expect((await cancelBackendManualExecution(executionId, 'cancel-key')).status).toBe('CANCELADA')
  })
  it('grava resultado zero sem inventar prêmio líquido e recusa NaN antes do HTTP', async () => {
    request.mockResolvedValue(quote)
    expect((await recordBackendManualQuote(executionId, manual, 'quote-key')).quote.premio_liquido).toBeNull()
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toMatchObject({ premio_total: 0, premio_liquido: null })
    request.mockReset()
    await expect(recordBackendManualQuote(executionId, { ...manual, premio_liquido: NaN }, 'quote-key')).rejects.toThrow('finitos')
    expect(request).not.toHaveBeenCalled()
  })
  it('recusa resultado ligado a outra execução ou parcelamento de outra cotação', async () => {
    request.mockResolvedValue({ ...quote, execution: { ...execution, id: otherId } })
    await expect(getBackendQuote(quoteId)).rejects.toThrow('contrato')
    const source = presentation(); source.items[0].parcelamento_id = otherId
    request.mockResolvedValue(source)
    await expect(saveBackendPresentation(saveInput, 'presentation-key')).rejects.toThrow('contrato')
  })
  it('traduz apresentação para campos canônicos e ignora autoria enviada pelo cliente', async () => {
    request.mockResolvedValue(presentation())
    await saveBackendPresentation(saveInput, 'presentation-key')
    const body: Record<string, unknown> = JSON.parse(String(request.mock.calls[0][1]?.body))
    expect(body).toMatchObject({ criterio_ordenacao: 'MANUAL', cotacao_escolhida_id: quoteId, expectedRevision: null, items: [{ cotacao_id: quoteId, parcelamento_id: null }] })
    expect(body).not.toHaveProperty('criado_por_id')
  })
  it('verifica oportunidade e revisão antes de editar e encaminha revisão no PUT', async () => {
    const input = { ...saveInput, presentationId }
    await expect(saveBackendPresentation(input, 'edit-key')).rejects.toThrow('revisão')
    expect(request).not.toHaveBeenCalled()
    request.mockResolvedValueOnce(presentation()).mockResolvedValueOnce(presentation(2))
    expect((await saveBackendPresentation(input, 'edit-key', 1)).revision).toBe(2)
    expect(request.mock.calls[0][1]?.method).toBeUndefined()
    expect(request.mock.calls[1][1]?.method).toBe('PUT')
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toHaveProperty('expectedRevision', 1)
    request.mockReset(); request.mockResolvedValue(presentation())
    await expect(saveBackendPresentation({ ...input, opportunityId: otherId }, 'edit-key', 1)).rejects.toThrow('Releia')
    expect(request).toHaveBeenCalledTimes(1)
  })
  it('recebe calendário do backend e recusa vigência de calendário inválida', async () => {
    const context = { opportunityId: opportunity, insuranceBranchId: line, insuredPersonId: null, leadName: null,
      branchId: otherId, timeZone: 'America/Sao_Paulo', branchDate: '2028-02-29', sourcePolicy: null }
    request.mockResolvedValue(context)
    expect((await getBackendCalculationContext(opportunity, line)).branchDate).toBe('2028-02-29')
    request.mockResolvedValue({ ...context, branchDate: '2027-02-29' })
    await expect(getBackendCalculationContext(opportunity, line)).rejects.toThrow('contrato')
  })
  it('lê tentativa por ID e recusa uma execução de outro contexto', async () => {
    request.mockResolvedValue(execution)
    expect((await getBackendCalculationExecution(executionId)).comissao_pct_aplicada).toBe(0)
    expect(request.mock.calls[0][0]).toBe(`/api/execucoes/${executionId}`)
    request.mockResolvedValue({ ...execution, id: otherId })
    await expect(getBackendCalculationExecution(executionId)).rejects.toThrow('outro contexto')
  })
  it('permite replay de PUT com a revisão original após perda da resposta', async () => {
    request.mockResolvedValueOnce(presentation(2)).mockResolvedValueOnce(presentation(2))
    const result = await saveBackendPresentation({ ...saveInput, presentationId }, 'recover-key', 1)
    expect(result.revision).toBe(2)
    expect(request.mock.calls[1][1]?.method).toBe('PUT')
    expect(request.mock.calls[1][1]?.headers).toEqual({ 'Idempotency-Key': 'recover-key' })
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toHaveProperty('expectedRevision', 1)
  })
  it('delega edição obsoleta ao servidor e nunca adota a revisão mais nova silenciosamente', async () => {
    request.mockResolvedValueOnce(presentation(2)).mockRejectedValueOnce(new Error('HTTP 409'))
    await expect(saveBackendPresentation({ ...saveInput, presentationId }, 'stale-key', 1)).rejects.toThrow('HTTP 409')
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toHaveProperty('expectedRevision', 1)
  })
})
