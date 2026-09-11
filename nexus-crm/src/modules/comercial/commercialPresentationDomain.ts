import type {
  ApresentacaoComercialRow,
  ApresentacaoCotacaoRow,
  ApresentacaoCriterioOrdenacao,
  ApresentacaoLayout,
  ApresentacaoStatus,
  CalculoExecucaoRow,
  CalculoRow,
  CotacaoCoberturaRow,
  CotacaoParcelamentoRow,
  CotacaoRow,
  Database,
} from '../../types/database'

type OpportunityRow = Database['public']['Tables']['oportunidades']['Row']
type InsurerRow = Database['public']['Tables']['seguradoras']['Row']
type CoverageCatalogRow = Database['public']['Tables']['coberturas_catalogo']['Row']
type ProposalRow = Database['public']['Tables']['propostas']['Row']

export const MAX_PRESENTATION_QUOTES = 5

export type CommercialPresentationStore = {
  opportunities: OpportunityRow[]
  calculations: CalculoRow[]
  executions: CalculoExecucaoRow[]
  insurers: InsurerRow[]
  coverageCatalog: CoverageCatalogRow[]
  quotes: CotacaoRow[]
  quoteCoverages: CotacaoCoberturaRow[]
  quoteInstallments: CotacaoParcelamentoRow[]
  presentations: ApresentacaoComercialRow[]
  presentationQuotes: ApresentacaoCotacaoRow[]
  proposals: ProposalRow[]
}

export type CommercialPresentationDependencies = {
  now: () => string
  newId: () => string
}

export type CommercialPresentationCoverage = CotacaoCoberturaRow & {
  comparisonKey: string
  name: string
}

export type CommercialPresentationCandidate = {
  quote: CotacaoRow
  execution: CalculoExecucaoRow
  calculation: CalculoRow
  insurerName: string
  insurerShortName: string
  profileLabel: string
  coverages: CommercialPresentationCoverage[]
  installments: CotacaoParcelamentoRow[]
  primaryInstallment: CotacaoParcelamentoRow | null
  franchiseValue: number | null
}

export type CommercialPresentationComparisonCell = {
  candidate: CommercialPresentationCandidate
  coverage: CommercialPresentationCoverage | null
}

export type CommercialPresentationComparisonRow = {
  key: string
  name: string
  differs: boolean
  cells: CommercialPresentationComparisonCell[]
}

export type CommercialPresentationItemView = {
  item: ApresentacaoCotacaoRow
  candidate: CommercialPresentationCandidate
}

export type CommercialPresentationWorkspace = {
  presentation: ApresentacaoComercialRow | null
  items: CommercialPresentationItemView[]
  candidates: CommercialPresentationCandidate[]
  comparison: CommercialPresentationComparisonRow[]
}

export type CommercialPresentationItemInput = {
  quoteId: string
  installmentId?: string | null
  recommended?: boolean
  commercialTitle?: string | null
  advantagesText?: string | null
  commercialNote?: string | null
}

export type SaveCommercialPresentationInput = {
  presentationId?: string
  opportunityId: string
  createdById?: string | null
  selectedQuoteId?: string | null
  title?: string | null
  layout: ApresentacaoLayout
  ordering: ApresentacaoCriterioOrdenacao
  showFipe: boolean
  showAdvantages: boolean
  showLegend: boolean
  showNotes: boolean
  showCommission: boolean
  commercialNotes?: string | null
  status: ApresentacaoStatus
  items: CommercialPresentationItemInput[]
}

function requireOpportunity(store: CommercialPresentationStore, opportunityId: string): OpportunityRow {
  const opportunity = store.opportunities.find((row) => row.id === opportunityId)
  if (!opportunity) throw new Error('Oportunidade não encontrada.')
  return opportunity
}

function comparisonKey(coverage: CotacaoCoberturaRow): string {
  if (coverage.cobertura_id) return `catalogo:${coverage.cobertura_id}`
  return `retorno:${coverage.chave_resultado.trim().toLocaleLowerCase('pt-BR')}`
}

function quoteOpportunityId(store: CommercialPresentationStore, quoteId: string): string {
  const quote = store.quotes.find((row) => row.id === quoteId)
  const execution = quote ? store.executions.find((row) => row.id === quote.execucao_id) : null
  const calculation = execution ? store.calculations.find((row) => row.id === execution.calculo_id) : null
  if (!quote || !execution || !calculation) throw new Error('Cotação sem vínculo completo com o cálculo.')
  return calculation.oportunidade_id
}

function candidateFromQuote(store: CommercialPresentationStore, quote: CotacaoRow): CommercialPresentationCandidate {
  const execution = store.executions.find((row) => row.id === quote.execucao_id)
  const calculation = execution ? store.calculations.find((row) => row.id === execution.calculo_id) : null
  const insurer = execution ? store.insurers.find((row) => row.id === execution.seguradora_id) : null
  if (!execution || !calculation || !insurer) throw new Error('Cotação sem execução, versão ou seguradora válida.')

  const coverages = store.quoteCoverages
    .filter((row) => row.cotacao_id === quote.id)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((row): CommercialPresentationCoverage => ({
      ...row,
      comparisonKey: comparisonKey(row),
      name: row.cobertura_id
        ? store.coverageCatalog.find((coverage) => coverage.id === row.cobertura_id)?.nome
          ?? row.nome_informado
          ?? row.chave_resultado
        : row.nome_informado ?? row.chave_resultado,
    }))
  const installments = store.quoteInstallments
    .filter((row) => row.cotacao_id === quote.id)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))

  return {
    quote,
    execution,
    calculation,
    insurerName: insurer.nome ?? 'Não informado',
    insurerShortName: insurer.nome_curto || insurer.nome || 'Seguradora não informada',
    profileLabel: calculation.rotulo_versao || `Versão de ${calculation.criado_em?.slice(0, 10) ?? 'cálculo'}`,
    coverages,
    installments,
    primaryInstallment: installments.find((row) => row.principal) ?? installments[0] ?? null,
    franchiseValue: coverages.find((row) => row.franquia_valor !== null)?.franquia_valor ?? null,
  }
}

export function listCommercialPresentationCandidates(
  store: CommercialPresentationStore,
  opportunityId: string,
): CommercialPresentationCandidate[] {
  requireOpportunity(store, opportunityId)
  const calculationIds = new Set(store.calculations
    .filter((row) => row.oportunidade_id === opportunityId)
    .map((row) => row.id))
  const sequenceByCalculation = new Map(Array.from(calculationIds).map((calculationId, index) => [calculationId, index + 1]))
  const executionIds = new Set(store.executions
    .filter((row) => calculationIds.has(row.calculo_id))
    .map((row) => row.id))
  return store.quotes
    .filter((row) => executionIds.has(row.execucao_id))
    .map((row) => candidateFromQuote(store, row))
    .map((candidate) => ({
      ...candidate,
      profileLabel: `Versão ${sequenceByCalculation.get(candidate.calculation.id) ?? 1} · ${candidate.profileLabel}`,
    }))
    .sort((a, b) => {
      const profile = a.profileLabel.localeCompare(b.profileLabel, 'pt-BR')
      if (profile) return profile
      return a.insurerName.localeCompare(b.insurerName, 'pt-BR')
    })
}

function coverageSignature(coverage: CommercialPresentationCoverage | null): string {
  if (!coverage) return 'AUSENTE'
  return JSON.stringify([
    coverage.incluida,
    coverage.limite_aceito,
    coverage.percentual_fipe_aceito,
    coverage.franquia_tipo,
    coverage.franquia_valor,
    coverage.carencia_dias,
    coverage.participacao_obrigatoria_pct,
    coverage.clausula_texto,
    coverage.observacao_seguradora,
  ])
}

export function alignCommercialPresentationCoverages(
  candidates: CommercialPresentationCandidate[],
): CommercialPresentationComparisonRow[] {
  const orderedKeys: string[] = []
  const names = new Map<string, string>()
  candidates.forEach((candidate) => candidate.coverages.forEach((coverage) => {
    if (!names.has(coverage.comparisonKey)) orderedKeys.push(coverage.comparisonKey)
    names.set(coverage.comparisonKey, coverage.name)
  }))

  return orderedKeys.map((key) => {
    const cells = candidates.map((candidate) => ({
      candidate,
      coverage: candidate.coverages.find((coverage) => coverage.comparisonKey === key) ?? null,
    }))
    return {
      key,
      name: names.get(key) ?? key,
      differs: new Set(cells.map((cell) => coverageSignature(cell.coverage))).size > 1,
      cells,
    }
  })
}

function latestPresentation(
  store: CommercialPresentationStore,
  opportunityId: string,
  presentationId?: string,
): ApresentacaoComercialRow | null {
  if (presentationId) {
    const presentation = store.presentations.find((row) => row.id === presentationId)
    if (!presentation || presentation.oportunidade_id !== opportunityId) throw new Error('Apresentação não encontrada nesta oportunidade.')
    return presentation
  }
  return store.presentations
    .filter((row) => row.oportunidade_id === opportunityId)
    .sort((a, b) => (b.atualizado_em ?? b.criado_em ?? '').localeCompare(a.atualizado_em ?? a.criado_em ?? ''))[0]
    ?? null
}

export function getCommercialPresentationWorkspace(
  store: CommercialPresentationStore,
  opportunityId: string,
  presentationId?: string,
): CommercialPresentationWorkspace {
  requireOpportunity(store, opportunityId)
  const candidates = listCommercialPresentationCandidates(store, opportunityId)
  const candidateByQuote = new Map(candidates.map((candidate) => [candidate.quote.id, candidate]))
  const presentation = latestPresentation(store, opportunityId, presentationId)
  const items = presentation
    ? store.presentationQuotes
      .filter((row) => row.apresentacao_id === presentation.id)
      .sort((a, b) => a.ordem - b.ordem)
      .map((item): CommercialPresentationItemView => {
        const candidate = candidateByQuote.get(item.cotacao_id)
        if (!candidate) throw new Error('A apresentação referencia uma cotação indisponível nesta oportunidade.')
        return { item, candidate }
      })
    : []
  return {
    presentation,
    items,
    candidates,
    comparison: alignCommercialPresentationCoverages(items.map((row) => row.candidate)),
  }
}

function normalizedText(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function numericSort(a: number | null, b: number | null): number {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return a - b
}

function orderItems(
  items: CommercialPresentationItemInput[],
  candidates: Map<string, CommercialPresentationCandidate>,
  ordering: ApresentacaoCriterioOrdenacao,
): CommercialPresentationItemInput[] {
  const ordered = [...items]
  if (ordering === 'MANUAL') return ordered
  return ordered.sort((a, b) => {
    const candidateA = candidates.get(a.quoteId)
    const candidateB = candidates.get(b.quoteId)
    if (!candidateA || !candidateB) return 0
    if (ordering === 'RECOMENDACAO') {
      const recommended = Number(Boolean(b.recommended)) - Number(Boolean(a.recommended))
      return recommended || numericSort(candidateA.quote.premio_total, candidateB.quote.premio_total)
    }
    if (ordering === 'PREMIO') return numericSort(candidateA.quote.premio_total, candidateB.quote.premio_total)
    return numericSort(candidateA.franchiseValue, candidateB.franchiseValue)
  })
}

export function saveCommercialPresentationAtomic(
  store: CommercialPresentationStore,
  input: SaveCommercialPresentationInput,
  dependencies: CommercialPresentationDependencies,
): CommercialPresentationWorkspace {
  requireOpportunity(store, input.opportunityId)
  if (input.items.length > MAX_PRESENTATION_QUOTES) throw new Error(`O comparativo aceita no máximo ${MAX_PRESENTATION_QUOTES} cotações.`)
  if (input.status === 'GERADA' && input.items.length === 0) throw new Error('Selecione ao menos uma cotação antes de gerar a apresentação.')

  const uniqueQuotes = new Set(input.items.map((item) => item.quoteId))
  if (uniqueQuotes.size !== input.items.length) throw new Error('A mesma cotação não pode aparecer duas vezes na apresentação.')
  input.items.forEach((item) => {
    if (quoteOpportunityId(store, item.quoteId) !== input.opportunityId) {
      throw new Error('Todas as cotações precisam pertencer à mesma oportunidade.')
    }
    if (item.installmentId) {
      const installment = store.quoteInstallments.find((row) => row.id === item.installmentId)
      if (!installment || installment.cotacao_id !== item.quoteId) throw new Error('O parcelamento escolhido precisa pertencer à cotação.')
    }
  })
  if (input.selectedQuoteId && !uniqueQuotes.has(input.selectedQuoteId)) {
    throw new Error('A escolha do cliente precisa ser uma cotação da apresentação.')
  }

  const presentationBefore = store.presentations.map((row) => ({ ...row }))
  const itemsBefore = store.presentationQuotes.map((row) => ({ ...row }))
  try {
    const existing = input.presentationId
      ? latestPresentation(store, input.opportunityId, input.presentationId)
      : latestPresentation(store, input.opportunityId)
    const now = dependencies.now()
    const presentationId = existing?.id ?? dependencies.newId()
    const row: ApresentacaoComercialRow = {
      id: presentationId,
      oportunidade_id: input.opportunityId,
      criado_por_id: existing?.criado_por_id ?? input.createdById ?? null,
      cotacao_escolhida_id: input.selectedQuoteId ?? null,
      titulo: normalizedText(input.title) ?? 'Comparativo comercial',
      layout: input.layout,
      criterio_ordenacao: input.ordering,
      exibir_percentual_fipe: input.showFipe,
      exibir_vantagens: input.showAdvantages,
      exibir_legenda: input.showLegend,
      exibir_observacoes: input.showNotes,
      exibir_comissao: input.showCommission,
      observacoes_comerciais: normalizedText(input.commercialNotes),
      status: input.status,
      criado_em: existing?.criado_em ?? now,
      atualizado_em: now,
      gerada_em: input.status === 'GERADA' ? now : null,
      escolhida_em: input.selectedQuoteId
        ? existing?.cotacao_escolhida_id === input.selectedQuoteId && existing.escolhida_em
          ? existing.escolhida_em
          : now
        : null,
    }
    if (existing) Object.assign(existing, row)
    else store.presentations.push(row)

    const candidates = new Map(listCommercialPresentationCandidates(store, input.opportunityId)
      .map((candidate) => [candidate.quote.id, candidate]))
    const orderedItems = orderItems(input.items, candidates, input.ordering)
    const existingItems = new Map(store.presentationQuotes
      .filter((item) => item.apresentacao_id === presentationId)
      .map((item) => [item.cotacao_id, item]))
    const nextItems = orderedItems.map((item, index): ApresentacaoCotacaoRow => {
      const candidate = candidates.get(item.quoteId)
      if (!candidate) throw new Error('Cotação indisponível para a apresentação.')
      return {
        id: existingItems.get(item.quoteId)?.id ?? dependencies.newId(),
        apresentacao_id: presentationId,
        cotacao_id: item.quoteId,
        parcelamento_id: item.installmentId
          ?? candidate.primaryInstallment?.id
          ?? null,
        ordem: (index + 1) * 10,
        recomendada: item.recommended ?? false,
        titulo_comercial: normalizedText(item.commercialTitle),
        vantagens_texto: normalizedText(item.advantagesText),
        observacao_comercial: normalizedText(item.commercialNote),
      }
    })
    store.presentationQuotes.splice(
      0,
      store.presentationQuotes.length,
      ...store.presentationQuotes.filter((item) => item.apresentacao_id !== presentationId),
      ...nextItems,
    )
    return getCommercialPresentationWorkspace(store, input.opportunityId, presentationId)
  } catch (error) {
    store.presentations.splice(0, store.presentations.length, ...presentationBefore)
    store.presentationQuotes.splice(0, store.presentationQuotes.length, ...itemsBefore)
    throw error
  }
}

export function toggleCommercialPresentationQuoteAtomic(
  store: CommercialPresentationStore,
  opportunityId: string,
  quoteId: string,
  createdById: string | null,
  dependencies: CommercialPresentationDependencies,
): CommercialPresentationWorkspace {
  if (quoteOpportunityId(store, quoteId) !== opportunityId) {
    throw new Error('A cotação precisa pertencer à oportunidade aberta.')
  }
  const workspace = getCommercialPresentationWorkspace(store, opportunityId)
  const selected = workspace.items.map((row): CommercialPresentationItemInput => ({
    quoteId: row.item.cotacao_id,
    installmentId: row.item.parcelamento_id,
    recommended: row.item.recomendada ?? false,
    commercialTitle: row.item.titulo_comercial,
    advantagesText: row.item.vantagens_texto,
    commercialNote: row.item.observacao_comercial,
  }))
  const selectedIndex = selected.findIndex((item) => item.quoteId === quoteId)
  if (selectedIndex >= 0) selected.splice(selectedIndex, 1)
  else {
    if (selected.length >= MAX_PRESENTATION_QUOTES) throw new Error(`O comparativo aceita no máximo ${MAX_PRESENTATION_QUOTES} cotações. Remova uma opção antes de adicionar outra.`)
    selected.push({ quoteId })
  }

  const presentation = workspace.presentation
  return saveCommercialPresentationAtomic(store, {
    presentationId: presentation?.id,
    opportunityId,
    createdById,
    selectedQuoteId: presentation?.cotacao_escolhida_id && presentation.cotacao_escolhida_id !== quoteId
      ? presentation.cotacao_escolhida_id
      : null,
    title: presentation?.titulo,
    layout: presentation?.layout ?? 'HORIZONTAL',
    ordering: 'MANUAL',
    showFipe: presentation?.exibir_percentual_fipe ?? true,
    showAdvantages: presentation?.exibir_vantagens ?? true,
    showLegend: presentation?.exibir_legenda ?? true,
    showNotes: presentation?.exibir_observacoes ?? true,
    showCommission: presentation?.exibir_comissao ?? false,
    commercialNotes: presentation?.observacoes_comerciais,
    status: 'RASCUNHO',
    items: selected,
  }, dependencies)
}
