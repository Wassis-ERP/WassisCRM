import {
  getBackendPresentation, listBackendCalculations, listBackendCalculationInsurers,
  listBackendOpportunityQuotes, listBackendPresentations,
} from './backendCalculationApi'
import { readCalculationPages } from './backendCalculationReads'
import type { BackendPresentationAggregate, BackendQuoteAggregate, BackendInsurerOption } from './calculationHttpContracts'
import {
  alignCommercialPresentationCoverages, commercialCoverageComparisonKey, MAX_PRESENTATION_QUOTES,
  type CommercialPresentationCandidate, type CommercialPresentationWorkspace,
} from '../modules/comercial/commercialPresentationDomain'
import type { CalculoRow } from '../types/database'
import type { SaveCanonicalPresentationCommand } from './canonicalCalculationCommands'

export type CanonicalCommercialPresentationWorkspace = CommercialPresentationWorkspace & { opportunityId: string; revision: number | null }
const sameId = (left: string, right: string) => left.toLowerCase() === right.toLowerCase()

export function projectBackendCommercialPresentationWorkspace(
  opportunityId: string,
  calculations: CalculoRow[],
  results: BackendQuoteAggregate[],
  insurers: BackendInsurerOption[],
  selected: BackendPresentationAggregate | null,
): CanonicalCommercialPresentationWorkspace {
  if (selected && !sameId(selected.presentation.oportunidade_id, opportunityId)) throw new Error('A apresentação não pertence à oportunidade aberta.')
  const headers = new Map(calculations.map(calculation => [calculation.id, calculation]))
  const quotes = new Map(results.map(result => [result.quote.id, result]))
  const names = new Map(insurers.map(insurer => [insurer.id, insurer.nome]))
  selected?.results.forEach(row => {
    headers.set(row.calculation.id, row.calculation)
    quotes.set(row.result.quote.id, row.result)
    names.set(row.result.execution.seguradora_id, row.insurerName)
  })
  const candidates = [...quotes.values()].map((result): CommercialPresentationCandidate => {
    const calculation = headers.get(result.execution.calculo_id)
    if (!calculation || !sameId(calculation.oportunidade_id, opportunityId) || result.quote.execucao_id !== result.execution.id) {
      throw new Error('A cotação não possui um pedido válido nesta oportunidade.')
    }
    const insurerName = names.get(result.execution.seguradora_id) ?? 'Seguradora não informada'
    const coverages = [...result.coverages].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map(coverage => ({
      ...coverage,
      comparisonKey: commercialCoverageComparisonKey(coverage),
      name: coverage.nome_informado ?? coverage.chave_resultado,
    }))
    const installments = [...result.installments].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    return {
      calculation, execution: result.execution, quote: result.quote, insurerName, insurerShortName: insurerName,
      profileLabel: calculation.rotulo_versao || `Versão de ${calculation.criado_em?.slice(0, 10) ?? 'cálculo'}`,
      coverages, installments, primaryInstallment: installments.find(row => row.principal) ?? installments[0] ?? null,
      franchiseValue: coverages.find(row => row.franquia_valor !== null)?.franquia_valor ?? null,
    }
  }).sort((a, b) => a.profileLabel.localeCompare(b.profileLabel, 'pt-BR') || a.insurerName.localeCompare(b.insurerName, 'pt-BR'))
  const byQuote = new Map(candidates.map(candidate => [candidate.quote.id, candidate]))
  const items = [...(selected?.items ?? [])].sort((a, b) => a.ordem - b.ordem).map(item => {
    const candidate = byQuote.get(item.cotacao_id)
    if (!candidate) throw new Error('Uma cotação selecionada não foi retornada no comparativo.')
    return { item, candidate }
  })
  return { opportunityId, presentation: selected?.presentation ?? null, revision: selected?.revision ?? null, candidates, items,
    comparison: alignCommercialPresentationCoverages(items.map(row => row.candidate)) }
}

/** Build a toggle from the loaded snapshot; never fetch a newer revision to overwrite an old editor. */
export function buildCanonicalPresentationSelection(workspace: CanonicalCommercialPresentationWorkspace, quoteId: string): SaveCanonicalPresentationCommand {
  const candidate = workspace.candidates.find(row => sameId(row.quote.id, quoteId))
  if (!candidate || !sameId(candidate.calculation.oportunidade_id, workspace.opportunityId)) throw new Error('A cotação não pertence à oportunidade aberta.')
  const presentation = workspace.presentation
  if (presentation && (!sameId(presentation.oportunidade_id, workspace.opportunityId) || workspace.revision === null)) throw new Error('Releia a revisão da apresentação antes de alterar a seleção.')
  const items = workspace.items.map(({ item }) => ({ quoteId: item.cotacao_id, installmentId: item.parcelamento_id,
    recommended: item.recomendada ?? false, commercialTitle: item.titulo_comercial,
    advantagesText: item.vantagens_texto, commercialNote: item.observacao_comercial }))
  const selected = items.findIndex(item => sameId(item.quoteId, quoteId))
  if (selected >= 0) items.splice(selected, 1)
  else {
    if (items.length >= MAX_PRESENTATION_QUOTES) throw new Error(`O comparativo aceita no máximo ${MAX_PRESENTATION_QUOTES} cotações.`)
    items.push({ quoteId: candidate.quote.id, installmentId: candidate.primaryInstallment?.id ?? null,
      recommended: false, commercialTitle: null, advantagesText: null, commercialNote: null })
  }
  return {
    expectedRevision: presentation ? workspace.revision ?? undefined : undefined,
    input: {
      opportunityId: workspace.opportunityId, presentationId: presentation?.id,
      selectedQuoteId: presentation?.cotacao_escolhida_id && items.some(item => sameId(item.quoteId, presentation.cotacao_escolhida_id!))
        ? presentation.cotacao_escolhida_id : null,
      title: presentation?.titulo ?? null, layout: presentation?.layout ?? 'HORIZONTAL', ordering: 'MANUAL',
      showFipe: presentation?.exibir_percentual_fipe ?? true, showAdvantages: presentation?.exibir_vantagens ?? true,
      showLegend: presentation?.exibir_legenda ?? true, showNotes: presentation?.exibir_observacoes ?? true,
      showCommission: presentation?.exibir_comissao ?? false, commercialNotes: presentation?.observacoes_comerciais ?? null,
      status: 'RASCUNHO', items,
    },
  }
}

export async function readBackendCommercialPresentationWorkspace(opportunityId: string, presentationId?: string, signal?: AbortSignal) {
  const [calculations, quotes, insurers, presentations] = await Promise.all([
    readCalculationPages(options => listBackendCalculations(opportunityId, options), row => row.calculation.id, signal),
    readCalculationPages(options => listBackendOpportunityQuotes(opportunityId, options), row => row.quote.id, signal),
    readCalculationPages(options => listBackendCalculationInsurers(opportunityId, options, true), row => row.id, signal),
    presentationId ? getBackendPresentation(presentationId, signal).then(result => [result])
      : readCalculationPages(options => listBackendPresentations(opportunityId, options), row => row.presentation.id, signal),
  ])
  const selected = [...presentations].sort((a, b) => (b.presentation.criado_em ?? '').localeCompare(a.presentation.criado_em ?? '')
    || b.presentation.id.localeCompare(a.presentation.id))[0] ?? null
  return projectBackendCommercialPresentationWorkspace(opportunityId, calculations.map(row => row.calculation), quotes, insurers, selected)
}
