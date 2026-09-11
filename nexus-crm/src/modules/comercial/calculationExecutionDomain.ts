import type {
  CalculoCoberturaRow,
  CalculoExecucaoRow,
  CalculoRow,
  CotacaoCoberturaRow,
  CotacaoParcelamentoRow,
  CotacaoRow,
  Database,
} from '../../types/database'

type InsurerRow = Database['public']['Tables']['seguradoras']['Row']
type CoverageCatalogRow = Database['public']['Tables']['coberturas_catalogo']['Row']
type OpportunityRow = Database['public']['Tables']['oportunidades']['Row']

export type CalculationExecutionSort = 'RETORNO' | 'PREMIO' | 'FRANQUIA'

export type CalculationExecutionStore = {
  opportunities: OpportunityRow[]
  calculations: CalculoRow[]
  insurers: InsurerRow[]
  requestedCoverages: CalculoCoberturaRow[]
  coverageCatalog: CoverageCatalogRow[]
  executions: CalculoExecucaoRow[]
  quotes: CotacaoRow[]
  quoteCoverages: CotacaoCoberturaRow[]
  quoteInstallments: CotacaoParcelamentoRow[]
}

export type CalculationExecutionDependencies = {
  now: () => string
  newId: () => string
}

export type InsurerExecutionSelection = {
  insurerId: string
  commissionOverridePct?: number | null
}

export type StartCalculationExecutionsInput = {
  calculationId: string
  defaultCommissionPct: number
  insurers: InsurerExecutionSelection[]
}

export type StartRecalculationInput = {
  executionId: string
  commissionPct?: number
}

export type CalculationExecutionCoverageView = CotacaoCoberturaRow & {
  name: string
}

export type CalculationExecutionView = {
  execution: CalculoExecucaoRow
  insurerName: string
  insurerShortName: string
  insurerCode: string
  quote: CotacaoRow | null
  coverages: CalculationExecutionCoverageView[]
  installments: CotacaoParcelamentoRow[]
  primaryInstallment: CotacaoParcelamentoRow | null
  responseTimeMs: number | null
  franchiseValue: number | null
  isLatest: boolean
}

export type CalculationExecutionWorkspace = {
  latestExecutions: CalculationExecutionView[]
  results: CalculationExecutionView[]
  executionCount: number
}

type SuccessScenario = {
  kind: 'SUCCESS'
  premium: number
  franchise: number
  restriction: string | null
  message: string
}

type PendingScenario = {
  kind: 'PENDING'
  code: string
  message: string
}

type ErrorScenario = {
  kind: 'ERROR'
  code: string
  message: string
}

type SimulationScenario = SuccessScenario | PendingScenario | ErrorScenario

const BASE_SCENARIOS: Record<string, SimulationScenario> = {
  porto: {
    kind: 'SUCCESS',
    premium: 2148.73,
    franchise: 3840,
    restriction: null,
    message: 'Perfil aceito para contratação digital.',
  },
  bradesco: {
    kind: 'PENDING',
    code: 'CONDUTOR_TEMPO_HABILITACAO',
    message: 'Informe o tempo de habilitação do condutor para concluir esta cotação.',
  },
  allianz: {
    kind: 'ERROR',
    code: 'SERVICO_TEMPORARIAMENTE_INDISPONIVEL',
    message: 'A seguradora não respondeu nesta tentativa. Recalcule para tentar novamente.',
  },
  sulamerica: {
    kind: 'SUCCESS',
    premium: 2294.9,
    franchise: 3100,
    restriction: 'Vistoria prévia sujeita à análise da seguradora.',
    message: 'Cotação apresentada com vistoria prévia.',
  },
  tokio: {
    kind: 'SUCCESS',
    premium: 2059.42,
    franchise: 4290,
    restriction: null,
    message: 'Cotação disponível para revisão comercial.',
  },
}

const FALLBACK_SCENARIO: ErrorScenario = {
  kind: 'ERROR',
  code: 'CENARIO_NAO_CONFIGURADO',
  message: 'Esta seguradora ainda não possui cenário de demonstração configurado.',
}

function requireFiniteNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} deve ser um número maior ou igual a zero.`)
}

function getInsurer(store: CalculationExecutionStore, insurerId: string, requireActive = false): InsurerRow {
  const insurer = store.insurers.find((row) => row.id === insurerId)
  if (!insurer || (requireActive && !insurer.ativo)) throw new Error('Seguradora indisponível para o cálculo.')
  return insurer
}

function validateInsurerForCalculation(store: CalculationExecutionStore, calculation: CalculoRow, insurerId: string): InsurerRow {
  const opportunity = store.opportunities.find((row) => row.id === calculation.oportunidade_id)
  if (!opportunity) throw new Error('Oportunidade do cálculo não encontrada.')
  const insurer = getInsurer(store, insurerId, true)
  if (insurer.tenant_id !== opportunity.tenant_id) throw new Error('A seguradora precisa pertencer ao mesmo grupo da oportunidade.')
  return insurer
}

function insurerCode(insurer: InsurerRow): string {
  return (insurer.codigo_interno || insurer.nome_curto || insurer.nome || '').trim().toLocaleLowerCase('pt-BR')
}

function nextAttempt(store: CalculationExecutionStore, calculationId: string, insurerId: string): number {
  return store.executions
    .filter((row) => row.calculo_id === calculationId && row.seguradora_id === insurerId)
    .reduce((highest, row) => Math.max(highest, row.tentativa), 0) + 1
}

function newExecution(
  store: CalculationExecutionStore,
  calculationId: string,
  insurerId: string,
  commissionPct: number,
  commissionOrigin: CalculoExecucaoRow['comissao_origem'],
  reexecutionOfId: string | null,
  dependencies: CalculationExecutionDependencies,
): CalculoExecucaoRow {
  return {
    id: dependencies.newId(),
    calculo_id: calculationId,
    seguradora_id: insurerId,
    reexecucao_de_id: reexecutionOfId,
    tentativa: nextAttempt(store, calculationId, insurerId),
    motor: 'PROPRIO',
    comissao_pct_aplicada: commissionPct,
    comissao_origem: commissionOrigin,
    status: 'AGUARDANDO',
    pendencia_codigo: null,
    pendencia_mensagem: null,
    erro_codigo: null,
    erro_mensagem_segura: null,
    referencia_externa: null,
    iniciada_em: null,
    concluida_em: null,
    criada_em: dependencies.now(),
  }
}

export function startCalculationExecutionsAtomic(
  store: CalculationExecutionStore,
  input: StartCalculationExecutionsInput,
  dependencies: CalculationExecutionDependencies,
): CalculoExecucaoRow[] {
  const calculation = store.calculations.find((row) => row.id === input.calculationId)
  if (!calculation) throw new Error('Cálculo não encontrado.')
  if (input.insurers.length === 0) throw new Error('Selecione ao menos uma seguradora.')
  requireFiniteNonNegative(input.defaultCommissionPct, 'Comissão padrão')

  const uniqueInsurers = new Set<string>()
  input.insurers.forEach((selection) => {
    if (uniqueInsurers.has(selection.insurerId)) throw new Error('A mesma seguradora não pode ser executada duas vezes no lote.')
    uniqueInsurers.add(selection.insurerId)
    validateInsurerForCalculation(store, calculation, selection.insurerId)
    if (selection.commissionOverridePct !== null && selection.commissionOverridePct !== undefined) {
      requireFiniteNonNegative(selection.commissionOverridePct, 'Comissão da seguradora')
    }
  })

  const previousDefault = calculation.comissao_sugerida_pct
  const initialLength = store.executions.length
  try {
    calculation.comissao_sugerida_pct = input.defaultCommissionPct
    const rows = input.insurers.map((selection) => {
      const commissionOverride = selection.commissionOverridePct
      const hasOverride = commissionOverride !== null && commissionOverride !== undefined
      const previousExecution = store.executions
        .filter((row) => row.calculo_id === input.calculationId && row.seguradora_id === selection.insurerId)
        .sort((a, b) => b.tentativa - a.tentativa)[0]
      const row = newExecution(
        store,
        input.calculationId,
        selection.insurerId,
        hasOverride ? commissionOverride : input.defaultCommissionPct,
        hasOverride ? 'SOBRESCRITA' : 'PADRAO_CALCULO',
        previousExecution?.id ?? null,
        dependencies,
      )
      store.executions.push(row)
      return row
    })
    return rows
  } catch (error) {
    calculation.comissao_sugerida_pct = previousDefault
    store.executions.splice(initialLength)
    throw error
  }
}

export function startRecalculationAtomic(
  store: CalculationExecutionStore,
  input: StartRecalculationInput,
  dependencies: CalculationExecutionDependencies,
): CalculoExecucaoRow {
  const source = store.executions.find((row) => row.id === input.executionId)
  if (!source) throw new Error('Execução de origem não encontrada.')
  const calculation = store.calculations.find((row) => row.id === source.calculo_id)
  if (!calculation) throw new Error('Cálculo não encontrado.')
  validateInsurerForCalculation(store, calculation, source.seguradora_id)

  const commission = input.commissionPct ?? source.comissao_pct_aplicada ?? calculation.comissao_sugerida_pct ?? 0
  requireFiniteNonNegative(commission, 'Comissão da seguradora')
  const origin = commission === calculation.comissao_sugerida_pct ? 'PADRAO_CALCULO' : 'SOBRESCRITA'
  const row = newExecution(store, source.calculo_id, source.seguradora_id, commission, origin, source.id, dependencies)
  store.executions.push(row)
  return row
}

export function markCalculationExecutionRunning(
  store: CalculationExecutionStore,
  executionId: string,
  dependencies: Pick<CalculationExecutionDependencies, 'now'>,
): CalculoExecucaoRow {
  const execution = store.executions.find((row) => row.id === executionId)
  if (!execution) throw new Error('Execução não encontrada.')
  if (execution.status !== 'AGUARDANDO') throw new Error('Somente uma execução aguardando pode ser iniciada.')
  execution.status = 'EM_EXECUCAO'
  execution.iniciada_em = dependencies.now()
  return execution
}

function scenarioFor(insurer: InsurerRow, attempt: number): SimulationScenario {
  const code = insurerCode(insurer)
  if (code === 'allianz' && attempt > 1) {
    return {
      kind: 'SUCCESS',
      premium: 2198.16,
      franchise: 3620,
      restriction: null,
      message: 'Serviço restabelecido; cotação concluída na nova tentativa.',
    }
  }
  const scenario = BASE_SCENARIOS[code] ?? FALLBACK_SCENARIO
  if (scenario.kind !== 'SUCCESS' || attempt === 1) return scenario
  return {
    ...scenario,
    premium: Math.round(scenario.premium * 0.98 * 100) / 100,
    franchise: Math.round(scenario.franchise * 0.75 * 100) / 100,
    message: 'Nova tentativa concluída com franquia reduzida; o resultado anterior foi preservado.',
  }
}

function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
}

function addDays(dateTime: string, days: number): string {
  const date = new Date(dateTime)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function createQuoteCoverages(
  store: CalculationExecutionStore,
  execution: CalculoExecucaoRow,
  quoteId: string,
  scenario: SuccessScenario,
  dependencies: CalculationExecutionDependencies,
): CotacaoCoberturaRow[] {
  const requested = store.requestedCoverages.filter((row) => row.calculo_id === execution.calculo_id && row.selecionada !== false)
  const insurer = getInsurer(store, execution.seguradora_id)
  const insurerScenarioCode = insurerCode(insurer)
  const returned = insurerScenarioCode === 'tokio' && requested.length > 1 ? requested.slice(0, -1) : requested
  const source = returned.length > 0 ? returned : [null]
  return source.map((coverage, index) => {
    const catalog = coverage ? store.coverageCatalog.find((row) => row.id === coverage.cobertura_id) : null
    const resultCode = catalog?.codigo || `cobertura-${index + 1}`
    const isMain = catalog?.codigo?.toLocaleLowerCase('pt-BR') === 'casco' || index === 0
    return {
      id: dependencies.newId(),
      cotacao_id: quoteId,
      cobertura_id: coverage?.cobertura_id ?? null,
      chave_resultado: resultCode,
      codigo_externo: `SIM-${resultCode.toUpperCase()}`,
      nome_informado: catalog?.nome ?? 'Proteção principal',
      incluida: true,
      limite_aceito: coverage?.limite_solicitado !== null && coverage?.limite_solicitado !== undefined
        ? roundMoney(coverage.limite_solicitado * (insurerScenarioCode === 'sulamerica' ? 1.1 : 1))
        : catalog?.capital_lmi_padrao ?? null,
      percentual_fipe_aceito: coverage?.percentual_fipe_solicitado ?? (isMain ? 100 : null),
      franquia_tipo: isMain ? (execution.tentativa > 1 ? 'REDUZIDA' : 'NORMAL') : null,
      franquia_valor: isMain ? scenario.franchise : null,
      premio: roundMoney(scenario.premium * (isMain ? (source.length === 1 ? 1 : 0.68) : 0.32 / Math.max(1, source.length - 1))),
      carencia_dias: catalog?.carencia_dias ?? 0,
      participacao_obrigatoria_pct: null,
      clausula_texto: isMain ? 'Cobertura sujeita às condições gerais da seguradora.' : null,
      observacao_seguradora: null,
      ordem: (index + 1) * 10,
    }
  })
}

function createQuoteInstallments(
  quoteId: string,
  premium: number,
  receivedAt: string,
  dependencies: CalculationExecutionDependencies,
): CotacaoParcelamentoRow[] {
  return [
    {
      id: dependencies.newId(),
      cotacao_id: quoteId,
      codigo_opcao: 'PIX-1X',
      forma_pagamento: 'PIX',
      quantidade_parcelas: 1,
      valor_entrada: premium,
      valor_parcela: premium,
      valor_total: premium,
      juros_pct: 0,
      adicional_fracionamento: 0,
      primeiro_vencimento: addDays(receivedAt, 7),
      principal: true,
      ordem: 10,
    },
    {
      id: dependencies.newId(),
      cotacao_id: quoteId,
      codigo_opcao: 'CARTAO-6X',
      forma_pagamento: 'CARTAO_CREDITO',
      quantidade_parcelas: 6,
      valor_entrada: null,
      valor_parcela: roundMoney(premium / 6),
      valor_total: premium,
      juros_pct: 0,
      adicional_fracionamento: 0,
      primeiro_vencimento: addDays(receivedAt, 7),
      principal: false,
      ordem: 20,
    },
    {
      id: dependencies.newId(),
      cotacao_id: quoteId,
      codigo_opcao: 'BOLETO-10X',
      forma_pagamento: 'BOLETO',
      quantidade_parcelas: 10,
      valor_entrada: null,
      valor_parcela: roundMoney(premium * 1.035 / 10),
      valor_total: roundMoney(premium * 1.035),
      juros_pct: 3.5,
      adicional_fracionamento: roundMoney(premium * 0.035),
      primeiro_vencimento: addDays(receivedAt, 10),
      principal: false,
      ordem: 30,
    },
  ]
}

export function completeCalculationExecutionSimulationAtomic(
  store: CalculationExecutionStore,
  executionId: string,
  dependencies: CalculationExecutionDependencies,
): CalculoExecucaoRow {
  const execution = store.executions.find((row) => row.id === executionId)
  if (!execution) throw new Error('Execução não encontrada.')
  if (execution.status !== 'EM_EXECUCAO') throw new Error('Somente uma execução em andamento pode ser concluída.')
  if (store.quotes.some((row) => row.execucao_id === execution.id)) throw new Error('A execução já possui uma cotação.')
  const insurer = getInsurer(store, execution.seguradora_id)
  const scenario = scenarioFor(insurer, execution.tentativa)
  const quoteLength = store.quotes.length
  const coverageLength = store.quoteCoverages.length
  const installmentLength = store.quoteInstallments.length
  const previous = { ...execution }

  try {
    const finishedAt = dependencies.now()
    execution.concluida_em = finishedAt
    execution.referencia_externa = `SIM-${insurerCode(insurer).toUpperCase()}-${stableHash(execution.calculo_id)}-${execution.tentativa}`
    if (scenario.kind === 'PENDING') {
      execution.status = 'PENDENTE_DADOS'
      execution.pendencia_codigo = scenario.code
      execution.pendencia_mensagem = scenario.message
      return execution
    }
    if (scenario.kind === 'ERROR') {
      execution.status = 'ERRO'
      execution.erro_codigo = scenario.code
      execution.erro_mensagem_segura = scenario.message
      return execution
    }

    const quoteId = dependencies.newId()
    const liquidPremium = roundMoney(scenario.premium * 0.93)
    const commissionPct = execution.comissao_pct_aplicada ?? 0
    const quote: CotacaoRow = {
      id: quoteId,
      execucao_id: execution.id,
      numero_cotacao_seguradora: execution.referencia_externa,
      premio_total: scenario.premium,
      premio_liquido: liquidPremium,
      iof: roundMoney(scenario.premium - liquidPremium),
      adicional_fracionamento: 0,
      comissao_valor: roundMoney(liquidPremium * commissionPct / 100),
      validade: addDays(finishedAt, 15),
      status: 'APRESENTADA',
      link_proposta: null,
      mensagem_seguradora: scenario.message,
      restricoes: scenario.restriction,
      recebida_em: finishedAt,
      aprovada_em: null,
      descartada_motivo: null,
      observacao_interna: 'Resultado determinístico gerado exclusivamente pelo mock frontend.',
    }
    store.quotes.push(quote)
    store.quoteCoverages.push(...createQuoteCoverages(store, execution, quoteId, scenario, dependencies))
    store.quoteInstallments.push(...createQuoteInstallments(quoteId, scenario.premium, finishedAt, dependencies))
    execution.status = 'CONCLUIDA'
    return execution
  } catch (error) {
    Object.assign(execution, previous)
    store.quotes.splice(quoteLength)
    store.quoteCoverages.splice(coverageLength)
    store.quoteInstallments.splice(installmentLength)
    throw error
  }
}

export function getCalculationExecutionSimulationDelay(
  store: CalculationExecutionStore,
  executionId: string,
): number {
  const execution = store.executions.find((row) => row.id === executionId)
  if (!execution) throw new Error('Execução não encontrada.')
  const insurer = getInsurer(store, execution.seguradora_id)
  const code = insurerCode(insurer)
  const base = ({ porto: 520, bradesco: 780, allianz: 640, sulamerica: 920, tokio: 700 } as Record<string, number>)[code] ?? 600
  return base + Math.min(execution.tentativa - 1, 3) * 120
}

function responseTime(execution: CalculoExecucaoRow): number | null {
  if (!execution.iniciada_em || !execution.concluida_em) return null
  const start = Date.parse(execution.iniciada_em)
  const end = Date.parse(execution.concluida_em)
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : null
}

function numericSort(a: number | null, b: number | null): number {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return a - b
}

export function getCalculationExecutionWorkspace(
  store: CalculationExecutionStore,
  calculationId: string,
  sort: CalculationExecutionSort = 'RETORNO',
): CalculationExecutionWorkspace {
  if (!store.calculations.some((row) => row.id === calculationId)) throw new Error('Cálculo não encontrado.')
  const executions = store.executions.filter((row) => row.calculo_id === calculationId)
  const highestAttemptByInsurer = new Map<string, number>()
  executions.forEach((row) => highestAttemptByInsurer.set(row.seguradora_id, Math.max(highestAttemptByInsurer.get(row.seguradora_id) ?? 0, row.tentativa)))

  const views = executions.map((execution): CalculationExecutionView => {
    const insurer = getInsurer(store, execution.seguradora_id)
    const quote = store.quotes.find((row) => row.execucao_id === execution.id) ?? null
    const coverages = quote
      ? store.quoteCoverages
        .filter((row) => row.cotacao_id === quote.id)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((row) => ({
          ...row,
          name: row.cobertura_id
            ? store.coverageCatalog.find((catalog) => catalog.id === row.cobertura_id)?.nome ?? row.nome_informado ?? row.chave_resultado
            : row.nome_informado ?? row.chave_resultado,
        }))
      : []
    const installments = quote
      ? store.quoteInstallments.filter((row) => row.cotacao_id === quote.id).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      : []
    return {
      execution,
      insurerName: insurer.nome ?? 'Não informado',
      insurerShortName: insurer.nome_curto || insurer.nome || 'Seguradora não informada',
      insurerCode: insurerCode(insurer),
      quote,
      coverages,
      installments,
      primaryInstallment: installments.find((row) => row.principal) ?? installments[0] ?? null,
      responseTimeMs: responseTime(execution),
      franchiseValue: coverages.find((row) => row.franquia_valor !== null)?.franquia_valor ?? null,
      isLatest: execution.tentativa === highestAttemptByInsurer.get(execution.seguradora_id),
    }
  })

  const latestExecutions = views
    .filter((view) => view.isLatest)
    .sort((a, b) => a.insurerName.localeCompare(b.insurerName, 'pt-BR'))
  const results = views.filter((view) => view.quote).sort((a, b) => {
    const comparison = sort === 'PREMIO'
      ? numericSort(a.quote?.premio_total ?? null, b.quote?.premio_total ?? null)
      : sort === 'FRANQUIA'
        ? numericSort(a.franchiseValue, b.franchiseValue)
        : numericSort(a.responseTimeMs, b.responseTimeMs)
    return comparison || b.execution.tentativa - a.execution.tentativa || a.insurerName.localeCompare(b.insurerName, 'pt-BR')
  })
  return { latestExecutions, results, executionCount: executions.length }
}
