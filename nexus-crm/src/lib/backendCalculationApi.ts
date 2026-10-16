import { requestAuthenticatedBackendJson } from './backendApi'
import {
  decodeCalculation, decodeCalculationContext, decodeCoverageOption, decodeExecution,
  decodeInsurer, decodePage, decodePresentation, decodeQuote, isCalculationId,
} from './calculationHttpContracts'
import type { CalculationCreateInput } from '../modules/comercial/calculationDomain'
import type { SaveCommercialPresentationInput } from '../modules/comercial/commercialPresentationDomain'
import type { CotacaoRow, CotacaoCoberturaRow, CotacaoParcelamentoRow } from '../types/database'

export type ManualQuoteHttpInput = Omit<CotacaoRow, 'id' | 'execucao_id' | 'status' | 'recebida_em' | 'aprovada_em' | 'descartada_motivo'> & {
  coverages: Array<Omit<CotacaoCoberturaRow, 'id' | 'cotacao_id'>>
  installments: Array<Omit<CotacaoParcelamentoRow, 'id' | 'cotacao_id'>>
}
export type CalculationPageOptions = { page?: number; pageSize?: number; search?: string; signal?: AbortSignal }
const id = (value: string) => {
  if (!isCalculationId(value)) throw new Error('Identificador de cálculo inválido.')
  return encodeURIComponent(value.toLowerCase())
}
const sameId = (left: string | null, right: string | null) => left?.toLowerCase() === right?.toLowerCase()
const scope = <T>(value: T, valid: boolean): T => {
  if (!valid) throw new Error('O backend retornou um registro de outro contexto de cálculo.')
  return value
}
function write(key: string, method: 'POST' | 'PUT', body?: object): RequestInit {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(key)) throw new Error('Chave de idempotência inválida.')
  return { method, headers: { 'Idempotency-Key': key }, ...(body ? { body: JSON.stringify(body) } : {}) }
}
function pageQuery(options: CalculationPageOptions, extra?: Record<string, string>) {
  const page = options.page ?? 1, pageSize = options.pageSize ?? 50
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100 || (options.search?.length ?? 0) > 100) throw new Error('Paginação ou busca inválida.')
  return new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(options.search !== undefined ? { search: options.search } : {}), ...extra }).toString()
}
async function paged<T>(path: string, decode: (value: unknown) => T, options: CalculationPageOptions, extra?: Record<string, string>) {
  const result = decodePage(await requestAuthenticatedBackendJson<unknown>(`${path}?${pageQuery(options, extra)}`, { signal: options.signal }), decode)
  return scope(result, result.page === (options.page ?? 1) && result.pageSize === (options.pageSize ?? 50))
}
export async function getBackendCalculation(calculationId: string, signal?: AbortSignal) {
  const result = decodeCalculation(await requestAuthenticatedBackendJson<unknown>(`/api/calculos/${id(calculationId)}`, { signal }))
  return scope(result, sameId(result.calculation.id, calculationId))
}
export async function listBackendCalculations(opportunityId: string, options: CalculationPageOptions = {}) {
  const result = await paged(`/api/oportunidades/${id(opportunityId)}/calculos`, decodeCalculation, options)
  return scope(result, result.items.every(item => sameId(item.calculation.oportunidade_id, opportunityId)))
}
export async function createBackendCalculation(input: CalculationCreateInput, key: string) {
  if (input.specialization.forma !== 'AUTO') throw new Error('Somente cálculo Auto está disponível no ambiente conectado.')
  assertFiniteNumbers(input)
  // Rótulos e IDs técnicos pertencem ao servidor; nunca editar um snapshot existente.
  const risk = { ...input.specialization.data }
  Reflect.deleteProperty(risk, 'calculo_id')
  const body = {
    oportunidade_id: input.oportunidade_id, ramo_id: input.ramo_id, segurado_id: input.segurado_id,
    seguradora_anterior_id: input.seguradora_anterior_id, origem: input.origem, comissao_sugerida_pct: input.comissao_sugerida_pct,
    tipo_seguro: input.tipo_seguro, bonus: input.bonus, qtd_sinistros: input.qtd_sinistros,
    qtd_sinistros_perda_parcial: input.qtd_sinistros_perda_parcial, transferiu_titularidade: input.transferiu_titularidade,
    vigencia_inicio: input.vigencia_inicio, vigencia_fim: input.vigencia_fim, vigencia_fim_anterior: input.vigencia_fim_anterior,
    numero_apolice_anterior: input.numero_apolice_anterior, codigo_identificacao_anterior: input.codigo_identificacao_anterior,
    status_apolice_anterior: input.status_apolice_anterior, nota_interna: input.nota_interna,
    specialization: { forma: 'AUTO', data: risk },
    coverages: input.coverages.map(c => ({ cobertura_id: c.cobertura_id, selecionada: c.selecionada,
      limite_solicitado: c.limite_solicitado, percentual_fipe_solicitado: c.percentual_fipe_solicitado,
      franquia_tipo_solicitado: c.franquia_tipo_solicitado, opcao_solicitada: c.opcao_solicitada,
      quantidade_solicitada: c.quantidade_solicitada, observacao_transmitida: c.observacao_transmitida })),
  }
  const result = decodeCalculation(await requestAuthenticatedBackendJson<unknown>(`/api/oportunidades/${id(input.oportunidade_id)}/calculos`, write(key, 'POST', body)))
  return scope(result, sameId(result.calculation.oportunidade_id, input.oportunidade_id) && sameId(result.calculation.ramo_id, input.ramo_id))
}
export async function listBackendCalculationInsurers(opportunityId: string, options: CalculationPageOptions = {}, includeReferencedInactive = false) {
  return paged(`/api/oportunidades/${id(opportunityId)}/calculos/lookups/seguradoras`, decodeInsurer, options,
    includeReferencedInactive ? { includeReferencedInactive: 'true' } : undefined)
}
export async function listBackendCalculationCoverages(opportunityId: string, insuranceBranchId: string, options: CalculationPageOptions = {}) {
  id(insuranceBranchId)
  const result = await paged(`/api/oportunidades/${id(opportunityId)}/calculos/lookups/coberturas`, decodeCoverageOption, options, { ramoId: insuranceBranchId })
  return scope(result, result.items.every(c => sameId(c.ramo_id, insuranceBranchId)))
}
export async function getBackendCalculationContext(opportunityId: string, insuranceBranchId?: string, signal?: AbortSignal) {
  const query = insuranceBranchId ? `?ramoId=${id(insuranceBranchId)}` : ''
  const result = decodeCalculationContext(await requestAuthenticatedBackendJson<unknown>(`/api/oportunidades/${id(opportunityId)}/calculos/contexto${query}`, { signal }))
  return scope(result, sameId(result.opportunityId, opportunityId) && (!insuranceBranchId || sameId(result.insuranceBranchId, insuranceBranchId)))
}
export async function listBackendCalculationExecutions(calculationId: string, options: CalculationPageOptions = {}) {
  const result = await paged(`/api/calculos/${id(calculationId)}/execucoes`, decodeExecution, options)
  return scope(result, result.items.every(e => sameId(e.calculo_id, calculationId)))
}
export async function getBackendCalculationExecution(executionId: string, signal?: AbortSignal) {
  const result = decodeExecution(await requestAuthenticatedBackendJson<unknown>(`/api/execucoes/${id(executionId)}`, { signal }))
  return scope(result, sameId(result.id, executionId))
}
export async function createBackendManualExecution(calculationId: string, insurerId: string, key: string, commissionOverride: number | null = null) {
  id(insurerId); commission(commissionOverride)
  const result = decodeExecution(await requestAuthenticatedBackendJson<unknown>(`/api/calculos/${id(calculationId)}/execucoes`, write(key, 'POST', {
    seguradora_id: insurerId, motor: 'MANUAL', comissao_pct_sobrescrita: commissionOverride,
  })))
  return scope(result, sameId(result.calculo_id, calculationId) && sameId(result.seguradora_id, insurerId) && result.motor === 'MANUAL')
}
function commission(value: number | null) {
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) throw new Error('Comissão deve ficar entre 0% e 100%.')
}
export async function retryBackendManualExecution(executionId: string, key: string, commissionOverride: number | null = null) {
  commission(commissionOverride)
  const result = decodeExecution(await requestAuthenticatedBackendJson<unknown>(`/api/execucoes/${id(executionId)}/reexecutar`, write(key, 'POST', { comissao_pct_sobrescrita: commissionOverride })))
  return scope(result, sameId(result.reexecucao_de_id, executionId) && !sameId(result.id, executionId) && result.motor === 'MANUAL')
}
export async function cancelBackendManualExecution(executionId: string, key: string) {
  const result = decodeExecution(await requestAuthenticatedBackendJson<unknown>(`/api/execucoes/${id(executionId)}/cancelar`, write(key, 'POST')))
  return scope(result, sameId(result.id, executionId) && result.status === 'CANCELADA')
}
export async function recordBackendManualQuote(executionId: string, input: ManualQuoteHttpInput, key: string) {
  if (input.premio_total === null || !Number.isFinite(input.premio_total) || input.premio_total < 0) throw new Error('Informe um prêmio total válido, inclusive zero.')
  assertFiniteNumbers(input)
  const result = decodeQuote(await requestAuthenticatedBackendJson<unknown>(`/api/execucoes/${id(executionId)}/cotacao-manual`, write(key, 'POST', input)))
  return scope(result, sameId(result.execution.id, executionId) && result.execution.motor === 'MANUAL')
}
function assertFiniteNumbers(value: unknown): void {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Os valores numéricos devem ser finitos.')
  if (value && typeof value === 'object') Object.values(value).forEach(assertFiniteNumbers)
}
export async function getBackendQuote(quoteId: string, signal?: AbortSignal) {
  const result = decodeQuote(await requestAuthenticatedBackendJson<unknown>(`/api/cotacoes/${id(quoteId)}`, { signal }))
  return scope(result, sameId(result.quote.id, quoteId))
}
export async function listBackendOpportunityQuotes(opportunityId: string, options: CalculationPageOptions = {}) {
  return paged(`/api/oportunidades/${id(opportunityId)}/cotacoes`, decodeQuote, options)
}
export async function getBackendPresentation(presentationId: string, signal?: AbortSignal) {
  const result = decodePresentation(await requestAuthenticatedBackendJson<unknown>(`/api/apresentacoes/${id(presentationId)}`, { signal }))
  return scope(result, sameId(result.presentation.id, presentationId))
}
export async function listBackendPresentations(opportunityId: string, options: CalculationPageOptions = {}) {
  const result = await paged(`/api/oportunidades/${id(opportunityId)}/apresentacoes`, decodePresentation, options)
  return scope(result, result.items.every(p => sameId(p.presentation.oportunidade_id, opportunityId)))
}
export async function saveBackendPresentation(input: SaveCommercialPresentationInput, key: string, expectedRevision?: number) {
  id(input.opportunityId)
  if (input.presentationId ? !Number.isSafeInteger(expectedRevision) || Number(expectedRevision) < 1 : expectedRevision !== undefined) throw new Error('Releia a revisão da apresentação antes de salvar.')
  if (input.items.length > 5 || new Set(input.items.map(i => i.quoteId)).size !== input.items.length) throw new Error('Selecione até cinco cotações distintas.')
  // Opportunity identity is immutable on the server. Validate it before PUT, rather than after an unintended write.
  if (input.presentationId) {
    const current = await getBackendPresentation(input.presentationId)
    if (!sameId(current.presentation.oportunidade_id, input.opportunityId)) throw new Error('Releia a apresentação antes de salvar.')
  }
  const body = {
    cotacao_escolhida_id: input.selectedQuoteId ?? null, titulo: input.title ?? null, layout: input.layout,
    criterio_ordenacao: input.ordering, exibir_percentual_fipe: input.showFipe, exibir_vantagens: input.showAdvantages,
    exibir_legenda: input.showLegend, exibir_observacoes: input.showNotes, exibir_comissao: input.showCommission,
    observacoes_comerciais: input.commercialNotes ?? null, status: input.status, expectedRevision: expectedRevision ?? null,
    items: input.items.map(i => ({ cotacao_id: i.quoteId, parcelamento_id: i.installmentId ?? null, recomendada: i.recommended ?? false,
      titulo_comercial: i.commercialTitle ?? null, vantagens_texto: i.advantagesText ?? null, observacao_comercial: i.commercialNote ?? null })),
  }
  const path = input.presentationId ? `/api/apresentacoes/${id(input.presentationId)}` : `/api/oportunidades/${id(input.opportunityId)}/apresentacoes`
  const result = decodePresentation(await requestAuthenticatedBackendJson<unknown>(path, write(key, input.presentationId ? 'PUT' : 'POST', body)))
  return scope(result, sameId(result.presentation.oportunidade_id, input.opportunityId) && (!input.presentationId || sameId(result.presentation.id, input.presentationId)))
}
