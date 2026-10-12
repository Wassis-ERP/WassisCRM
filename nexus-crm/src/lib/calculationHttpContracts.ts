import type { CalculationAggregate } from '../modules/comercial/calculationDomain'
import type {
  ApresentacaoComercialRow, ApresentacaoCotacaoRow, CalcAutoRow, CalculoRow,
  CalculoCoberturaRow, CalculoExecucaoRow, CotacaoRow, CotacaoCoberturaRow,
  CotacaoParcelamentoRow, Database,
} from '../types/database'

export type BackendQuoteAggregate = {
  quote: CotacaoRow
  execution: CalculoExecucaoRow
  coverages: CotacaoCoberturaRow[]
  installments: CotacaoParcelamentoRow[]
}
export type BackendPresentationAggregate = {
  presentation: ApresentacaoComercialRow
  items: ApresentacaoCotacaoRow[]
  revision: number
  results: Array<{ result: BackendQuoteAggregate; calculation: CalculoRow; insurerName: string }>
}
export type BackendPage<T> = { items: T[]; page: number; pageSize: number; totalCount: number; hasMore: boolean }
export type BackendInsurerOption = Pick<Database['public']['Tables']['seguradoras']['Row'], 'id' | 'tenant_id'> & { nome: string }
export type BackendCoverageOption = Database['public']['Tables']['coberturas_catalogo']['Row']
export type BackendCalculationContext = {
  opportunityId: string; insuranceBranchId: string | null; insuredPersonId: string | null
  leadName: string | null; branchId: string; timeZone: string; branchDate: string
  sourcePolicy: null | { id: string; insuranceBranchId: string; insuredPersonId: string; insurerId: string | null; number: string | null; coverageEndsOn: string | null; status: string | null }
}

type Check = (value: unknown) => boolean
type Shape<T> = { [K in keyof T]-?: Check }
const failure = () => new Error('O backend retornou dados de cálculo incompatíveis com o contrato.')
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw failure()
  return value as Record<string, unknown>
}
const text: Check = value => typeof value === 'string'
const boolean: Check = value => typeof value === 'boolean'
const money: Check = value => typeof value === 'number' && Number.isFinite(value) && value >= 0
const integer: Check = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const positive: Check = value => integer(value) && Number(value) > 0
export const isCalculationId: Check = value => typeof value === 'string' && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value)
export const isCalendarDate: Check = value => {
  if (typeof value !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value
}
const timestamp: Check = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
const nullable = (check: Check): Check => value => value === null || check(value)
const oneOf = (...values: string[]): Check => value => typeof value === 'string' && values.includes(value)
const nText = nullable(text), nMoney = nullable(money), nInteger = nullable(integer), nBoolean = nullable(boolean)
const nId = nullable(isCalculationId), nDate = nullable(isCalendarDate), nTimestamp = nullable(timestamp)
const nSafeLink = nullable(value => {
  if (typeof value !== 'string') return false
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
})

function decodeRow<T extends object>(value: unknown, shape: Shape<T>): T {
  const source = record(value), output: Record<string, unknown> = {}
  for (const key of Object.keys(shape) as Array<keyof T>) {
    const field = String(key)
    if (!Object.hasOwn(source, field) || !shape[key](source[field])) throw failure()
    output[field] = source[field]
  }
  // All required properties are checked by the complete mapped shape; unknown wire properties are discarded.
  return output as T
}
function rows<T>(value: unknown, decode: (value: unknown) => T, limit = 100): T[] {
  if (!Array.isArray(value) || value.length > limit) throw failure()
  return value.map(decode)
}
function unique(values: unknown[]): boolean { return new Set(values).size === values.length }

const calculationShape: Shape<CalculoRow> = {
  id: isCalculationId, oportunidade_id: isCalculationId, ramo_id: isCalculationId, segurado_id: nId, seguradora_anterior_id: nId,
  origem: nullable(oneOf('MANUAL', 'ASSISTIDA', 'IMPORTADA')), comissao_sugerida_pct: nMoney, rotulo_versao: nText,
  tipo_seguro: nullable(oneOf('NOVO', 'RENOVACAO_PROPRIA', 'RENOVACAO_OUTRA')), bonus: nInteger,
  qtd_sinistros: nInteger, qtd_sinistros_perda_parcial: nInteger, transferiu_titularidade: nBoolean,
  vigencia_inicio: nDate, vigencia_fim: nDate, vigencia_fim_anterior: nDate, numero_apolice_anterior: nText,
  codigo_identificacao_anterior: nText, status_apolice_anterior: nText, nota_interna: nText, criado_em: nTimestamp,
}
const autoShape: Shape<CalcAutoRow> = {
  calculo_id: isCalculationId, codigo_fipe: nText, marca: nText, modelo: nText, versao: nText,
  ano_fabricacao: nInteger, ano_modelo: nInteger, placa: nText, chassi: nText, chassi_remarcado: nBoolean,
  renavam: nText, zero_km: nBoolean, combustivel: nText, cambio: nText, categoria: nText, tipo_veiculo: nText,
  uso: nText, cep_pernoite: nText, possui_garagem_residencia: nBoolean, possui_garagem_trabalho: nBoolean,
  possui_garagem_estudo: nBoolean, km_mensal: nInteger, blindado: nBoolean, alienado: nBoolean, rastreador: nBoolean,
  antifurto: nBoolean, kit_gas: nBoolean, condutor_nome: nText, condutor_cpf: nText, condutor_data_nascimento: nDate,
  condutor_sexo: nullable(oneOf('M', 'F')), condutor_estado_civil: nText, condutor_profissao: nText,
  condutor_reside_com_segurado: nBoolean, condutor_tempo_habilitacao: nInteger,
}
const requestedCoverageShape: Shape<CalculoCoberturaRow> = {
  id: isCalculationId, calculo_id: isCalculationId, cobertura_id: isCalculationId, selecionada: nBoolean,
  limite_solicitado: nMoney, percentual_fipe_solicitado: nMoney, franquia_tipo_solicitado: nText,
  opcao_solicitada: nText, quantidade_solicitada: nInteger, observacao_transmitida: nText,
}
export function decodeCalculation(value: unknown): CalculationAggregate {
  const source = record(value), calculation = decodeRow(source.calculation, calculationShape)
  const specialization = record(source.specialization)
  if (specialization.forma !== 'AUTO') throw failure()
  const data = decodeRow(specialization.data, autoShape)
  const coverages = rows(source.coverages, value => decodeRow(value, requestedCoverageShape))
  if (data.calculo_id !== calculation.id || coverages.some(c => c.calculo_id !== calculation.id) || !unique(coverages.map(c => c.cobertura_id))) throw failure()
  return { calculation, specialization: { forma: 'AUTO', data }, coverages }
}
export function decodeExecution(value: unknown): CalculoExecucaoRow {
  return decodeRow<CalculoExecucaoRow>(value, {
    id: isCalculationId, calculo_id: isCalculationId, seguradora_id: isCalculationId, reexecucao_de_id: nId,
    tentativa: positive, motor: oneOf('PROPRIO', 'AGGER', 'MANUAL'), comissao_pct_aplicada: nMoney,
    comissao_origem: oneOf('PADRAO_CALCULO', 'SOBRESCRITA'),
    status: oneOf('AGUARDANDO', 'EM_EXECUCAO', 'CONCLUIDA', 'PENDENTE_DADOS', 'INDISPONIVEL', 'ERRO', 'CANCELADA'),
    pendencia_codigo: nText, pendencia_mensagem: nText, erro_codigo: nText, erro_mensagem_segura: nText,
    referencia_externa: nText, iniciada_em: nTimestamp, concluida_em: nTimestamp, criada_em: timestamp,
  })
}
const quoteShape: Shape<CotacaoRow> = {
  id: isCalculationId, execucao_id: isCalculationId, numero_cotacao_seguradora: nText, premio_total: nMoney,
  premio_liquido: nMoney, iof: nMoney, adicional_fracionamento: nMoney, comissao_valor: nMoney, validade: nDate,
  status: nullable(oneOf('APRESENTADA', 'APROVADA', 'DESCARTADA', 'EXPIRADA', 'RECUSADA')), link_proposta: nSafeLink,
  mensagem_seguradora: nText, restricoes: nText, recebida_em: nTimestamp, aprovada_em: nTimestamp,
  descartada_motivo: nText, observacao_interna: nText,
}
const returnedCoverageShape: Shape<CotacaoCoberturaRow> = {
  id: isCalculationId, cotacao_id: isCalculationId, cobertura_id: nId, chave_resultado: text, codigo_externo: nText,
  nome_informado: nText, incluida: nBoolean, limite_aceito: nMoney, percentual_fipe_aceito: nMoney,
  franquia_tipo: nText, franquia_valor: nMoney, premio: nMoney, carencia_dias: nInteger,
  participacao_obrigatoria_pct: nMoney, clausula_texto: nText, observacao_seguradora: nText, ordem: nInteger,
}
const installmentShape: Shape<CotacaoParcelamentoRow> = {
  id: isCalculationId, cotacao_id: isCalculationId, codigo_opcao: text, forma_pagamento: text, quantidade_parcelas: positive,
  valor_entrada: nMoney, valor_parcela: nMoney, valor_total: nMoney, juros_pct: nMoney, adicional_fracionamento: nMoney,
  primeiro_vencimento: nDate, principal: nBoolean, ordem: nInteger,
}
export function decodeQuote(value: unknown): BackendQuoteAggregate {
  const source = record(value), quote = decodeRow(source.quote, quoteShape), execution = decodeExecution(source.execution)
  const coverages = rows(source.coverages, value => decodeRow(value, returnedCoverageShape))
  const installments = rows(source.installments, value => decodeRow(value, installmentShape))
  if (quote.execucao_id !== execution.id || execution.status !== 'CONCLUIDA' || coverages.some(c => c.cotacao_id !== quote.id)
    || installments.some(p => p.cotacao_id !== quote.id) || !unique(coverages.map(c => c.chave_resultado))
    || !unique(installments.map(p => p.codigo_opcao)) || installments.filter(p => p.principal).length > 1) throw failure()
  return { quote, execution, coverages, installments }
}
const presentationShape: Shape<ApresentacaoComercialRow> = {
  id: isCalculationId, oportunidade_id: isCalculationId, criado_por_id: nId, cotacao_escolhida_id: nId, titulo: nText,
  layout: nullable(oneOf('VERTICAL', 'HORIZONTAL')), criterio_ordenacao: nullable(oneOf('RECOMENDACAO', 'PREMIO', 'FRANQUIA', 'MANUAL')),
  exibir_percentual_fipe: nBoolean, exibir_vantagens: nBoolean, exibir_legenda: nBoolean, exibir_observacoes: nBoolean,
  exibir_comissao: nBoolean, observacoes_comerciais: nText, status: nullable(oneOf('RASCUNHO', 'GERADA')),
  criado_em: nTimestamp, atualizado_em: nTimestamp, gerada_em: nTimestamp, escolhida_em: nTimestamp,
}
const presentationItemShape: Shape<ApresentacaoCotacaoRow> = {
  id: isCalculationId, apresentacao_id: isCalculationId, cotacao_id: isCalculationId, parcelamento_id: nId,
  ordem: positive, recomendada: nBoolean, titulo_comercial: nText, vantagens_texto: nText, observacao_comercial: nText,
}
export function decodePresentation(value: unknown): BackendPresentationAggregate {
  const source = record(value), presentation = decodeRow(source.presentation, presentationShape)
  const items = rows(source.items, value => decodeRow(value, presentationItemShape), 5)
  const results = rows(source.results, value => {
    const raw = record(value), result = decodeQuote(raw.result), calculation = decodeRow(raw.calculation, calculationShape)
    if (!text(raw.insurerName) || result.execution.calculo_id !== calculation.id || calculation.oportunidade_id !== presentation.oportunidade_id) throw failure()
    return { result, calculation, insurerName: raw.insurerName as string }
  }, 5)
  if (!positive(source.revision) || !unique(items.map(i => i.cotacao_id)) || !unique(items.map(i => i.ordem))
    || !unique(results.map(r => r.result.quote.id)) || results.length !== items.length
    || presentation.status === 'GERADA' && items.length === 0
    || presentation.cotacao_escolhida_id !== null && !items.some(i => i.cotacao_id === presentation.cotacao_escolhida_id)) throw failure()
  for (const item of items) {
    const quote = results.find(r => r.result.quote.id === item.cotacao_id)?.result
    if (item.apresentacao_id !== presentation.id || !quote || item.parcelamento_id !== null && !quote.installments.some(p => p.id === item.parcelamento_id)) throw failure()
  }
  return { presentation, items, results, revision: source.revision as number }
}
export function decodePage<T>(value: unknown, decode: (value: unknown) => T): BackendPage<T> {
  const source = record(value)
  if (!positive(source.page) || !positive(source.pageSize) || Number(source.pageSize) > 100 || !integer(source.totalCount) || !boolean(source.hasMore)) throw failure()
  const page = source.page as number, pageSize = source.pageSize as number, totalCount = source.totalCount as number
  const items = rows(source.items, decode, pageSize)
  if (items.length > totalCount || source.hasMore !== (page * pageSize < totalCount) || source.hasMore && items.length === 0) throw failure()
  return { items, page, pageSize, totalCount, hasMore: source.hasMore as boolean }
}
export function decodeInsurer(value: unknown): BackendInsurerOption { return decodeRow<BackendInsurerOption>(value, { id: isCalculationId, tenant_id: isCalculationId, nome: text }) }
export function decodeCoverageOption(value: unknown): BackendCoverageOption {
  return decodeRow<BackendCoverageOption>(value, {
    id: isCalculationId, ramo_id: isCalculationId, codigo: nText, codigo_susep: nText, nome: nText, descricao: nText,
    tipo_cobertura: nText, caracteristica: nText, tipo_risco: nText, modalidade: nText, capital_lmi_padrao: nMoney,
    franquia_padrao: nMoney, carencia_dias: nInteger, obrigatoria: nBoolean, ordem: nInteger, ativo: nBoolean,
  })
}
export function decodeCalculationContext(value: unknown): BackendCalculationContext {
  const source = record(value), context = decodeRow<BackendCalculationContext>(source, {
    opportunityId: isCalculationId, insuranceBranchId: nId, insuredPersonId: nId, leadName: nText,
    branchId: isCalculationId, timeZone: text, branchDate: isCalendarDate,
    sourcePolicy: value => value === null || typeof value === 'object' && !Array.isArray(value),
  })
  if (source.sourcePolicy !== null) context.sourcePolicy = decodeRow<NonNullable<BackendCalculationContext['sourcePolicy']>>(source.sourcePolicy, {
    id: isCalculationId, insuranceBranchId: isCalculationId, insuredPersonId: isCalculationId,
    insurerId: nId, number: nText, coverageEndsOn: nDate, status: nText,
  })
  if (context.sourcePolicy && context.sourcePolicy.insuranceBranchId !== context.insuranceBranchId) throw failure()
  return context
}
