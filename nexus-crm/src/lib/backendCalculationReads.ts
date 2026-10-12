import {
  getBackendCalculation, listBackendCalculations, listBackendCalculationCoverages,
  listBackendCalculationExecutions, listBackendCalculationInsurers, listBackendOpportunityQuotes,
  type CalculationPageOptions,
} from './backendCalculationApi'
import type { BackendPage } from './calculationHttpContracts'
import { projectCalculationListItem } from '../modules/comercial/calculationDomain'
import { getCalculationExecutionWorkspace, type CalculationExecutionSort } from '../modules/comercial/calculationExecutionDomain'

const PAGE_SIZE = 100
const MAX_PAGES = 20

/** Existing screens consume a complete collection: reject truncation instead of hiding history. */
export async function readCalculationPages<T>(
  load: (options: CalculationPageOptions) => Promise<BackendPage<T>>,
  key: (item: T) => string,
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [], seen = new Set<string>()
  let total: number | undefined
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    signal?.throwIfAborted()
    const result = await load({ page, pageSize: PAGE_SIZE, signal })
    signal?.throwIfAborted()
    total ??= result.totalCount
    if (result.page !== page || result.pageSize !== PAGE_SIZE || total !== result.totalCount
      || result.items.length !== Math.min(PAGE_SIZE, Math.max(0, total - items.length))
      || result.hasMore !== (page * PAGE_SIZE < total)) {
      throw new Error('A lista de cálculo mudou durante a leitura. Recarregue para obter o histórico completo.')
    }
    for (const item of result.items) {
      const identity = key(item).toLowerCase()
      if (seen.has(identity)) throw new Error('O backend repetiu um registro na lista de cálculo. Recarregue o histórico.')
      seen.add(identity)
      items.push(item)
    }
    if (!result.hasMore) return items
  }
  throw new Error('O histórico excede o limite desta tela. Nenhuma lista parcial foi apresentada.')
}

export async function readBackendCalculationItems(opportunityId: string, signal?: AbortSignal) {
  const aggregates = await readCalculationPages(options => listBackendCalculations(opportunityId, options), item => item.calculation.id, signal)
  return aggregates.map(aggregate => projectCalculationListItem(aggregate, {
    lineName: 'Auto',
    // The canonical list does not disclose a person directory; never borrow a mock name.
    insuredName: aggregate.calculation.segurado_id ? 'Segurado cadastrado' : 'Lead',
  })).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id.localeCompare(a.id))
}

export async function readBackendCalculationExecutionWorkspace(
  calculationId: string,
  sort: CalculationExecutionSort,
  signal?: AbortSignal,
) {
  const aggregate = await getBackendCalculation(calculationId, signal)
  const calculation = aggregate.calculation
  const [executions, quotes, insurers, coverageCatalog] = await Promise.all([
    readCalculationPages(options => listBackendCalculationExecutions(calculation.id, options), item => item.id, signal),
    readCalculationPages(options => listBackendOpportunityQuotes(calculation.oportunidade_id, options), item => item.quote.id, signal),
    readCalculationPages(options => listBackendCalculationInsurers(calculation.oportunidade_id, options), item => item.id, signal),
    readCalculationPages(options => listBackendCalculationCoverages(calculation.oportunidade_id, calculation.ramo_id, options), item => item.id, signal),
  ])
  const executionById = new Map(executions.map(execution => [execution.id, execution]))
  const results = quotes.filter(result => result.execution.calculo_id === calculation.id)
  for (const result of results) {
    const execution = executionById.get(result.execution.id)
    if (!execution || execution.status !== 'CONCLUIDA'
      || (Object.keys(execution) as Array<keyof typeof execution>).some(field => execution[field] !== result.execution[field])) {
      throw new Error('As execuções mudaram durante a leitura. Recarregue os resultados do pedido.')
    }
  }
  if (executions.some(execution => execution.status === 'CONCLUIDA' && !results.some(result => result.execution.id === execution.id))) {
    throw new Error('Um resultado concluído não foi retornado. Recarregue o histórico completo do pedido.')
  }
  return getCalculationExecutionWorkspace({
    calculations: [calculation], executions, insurers, coverageCatalog,
    quotes: results.map(result => result.quote),
    quoteCoverages: results.flatMap(result => result.coverages),
    quoteInstallments: results.flatMap(result => result.installments),
  }, calculation.id, sort)
}
