import type {
  ApoliceItemRow,
  CancelamentoMotivoRow,
  EndossoSubtipoRow,
  ItemCoberturaRow,
} from '../types/database'

export type DerivedDocumentType = 'ENDOSSO' | 'CANCELAMENTO' | 'FATURA'
export type EndorsementNature =
  | 'ALTERACAO_DADOS'
  | 'INCLUSAO_ITEM'
  | 'EXCLUSAO_ITEM'
  | 'SUBSTITUICAO_ITEM'
  | 'ALTERACAO_COBERTURA'
  | 'ALTERACAO_IMPORTANCIA_SEGURADA'
  | 'ALTERACAO_CLAUSULA'

export interface ContractPolicyRow {
  id: string
  segurado_id: string
  seguradora_id: string | null
  ramo_id: string | null
  status: string | null
  renovada_de_id: string | null
  produtor_id: string | null
  numero_apolice: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  premio_total: number | null
  premio_liquido: number | null
  motivo_status: string | null
  observacoes: string | null
  data_emissao?: string | null
}

export interface ContractDocumentRow {
  id: string
  apolice_id: string
  tipo: string | null
  cotacao_id: string | null
  stage_id: string
  responsavel_id: string | null
  recebimento_grade_id: string | null
  endosso_subtipo_id: string | null
  cancelamento_motivo_id: string | null
  numero_proposta: string | null
  numero_endosso: string | null
  numero_fatura: string | null
  tipo_movimento_endosso: string | null
  data_transmissao: string | null
  data_emissao: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  premio_total: number | null
  premio_liquido: number | null
  forma_pagamento: string | null
  periodicidade_pagamento: string | null
  qtd_parcelas: number | null
  primeira_parcela_vencimento: string | null
  primeira_parcela_valor: number | null
  comissao_pct: number | null
  agenciamento_pct: number | null
  competencia_inicio: string | null
  competencia_fim: string | null
  motivo_recusa?: string | null
  observacoes: string | null
}

export interface ContractOpportunityRow {
  id: string
  nome: string
  tenant_id: string | null
  filial_id: string | null
  segurado_id: string | null
  ramo_id: string | null
  apolice_origem_id: string | null
  responsavel_id: string
  pipeline_id: string | null
  stage_id: string | null
  status: string
  tipo_negocio: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

interface ContractBranchRow {
  id: string
  risk_type: string | null
  is_monthly: boolean | null
  renovavel: boolean | null
  permite_endosso: boolean | null
}

interface ContractPipelineRow {
  id: string
  entidade_tipo: string | null
  filial_id: string | null
  ativo: boolean | null
}

interface ContractStageRow {
  id: string
  pipeline_id: string
  nome: string | null
  ativo: boolean | null
}

export interface ContractSpecializationRow {
  apolice_item_id: string
  [field: string]: unknown
}

export interface ContractAuxiliaryRow {
  id?: string
  [field: string]: unknown
}

export interface EndorsementEffect {
  itemId?: string
  coverageId?: string
  description?: string
  externalIdentifier?: string
  riskValue?: number | null
  coverageCapital?: number | null
  coveragePremium?: number | null
}

export interface ContractTables {
  policies: ContractPolicyRow[]
  documents: ContractDocumentRow[]
  opportunities: ContractOpportunityRow[]
  branches: ContractBranchRow[]
  pipelines: ContractPipelineRow[]
  stages: ContractStageRow[]
  subtypes: EndossoSubtipoRow[]
  cancellationReasons: CancelamentoMotivoRow[]
  items: ApoliceItemRow[]
  coverages: ItemCoberturaRow[]
  specializations: ContractSpecializationRow[][]
  financialFacts: ContractAuxiliaryRow[][]
  auditLogs: ContractAuxiliaryRow[]
  pendingEffects: Map<string, EndorsementEffect>
}

interface OperationServices {
  makeId: (scope: string) => string
  today: () => string
  materialize: (documentId: string, dueDate: string, invoiceNumber?: string) => void
  audit?: (
    entityType: 'apolice' | 'proposta' | 'oportunidade',
    entityId: string,
    field: string,
    previous: unknown,
    next: unknown,
  ) => void
}

export interface DerivedDocumentInput {
  policyId: string
  type: DerivedDocumentType
  responsibleId: string
  issued: boolean
  officialNumber: string
  endorsementSubtypeId?: string
  cancellationReasonId?: string
  effectiveDate?: string
  competenceStart?: string
  competenceEnd?: string
  totalPremium?: number | null
  netPremium?: number | null
  paymentMethod?: string
  paymentFrequency?: string
  installmentCount?: number | null
  firstInstallmentDueDate?: string
  firstInstallmentValue?: number | null
  commissionPercent?: number | null
  agencyCommissionPercent?: number | null
  receiptGradeId?: string | null
  notes?: string
  endorsementEffect?: EndorsementEffect
}

export interface RenewalOpportunityInput {
  policyId: string
  tenantId: string
  filialId: string | null
  responsibleId: string
}

export interface RenewalTransmissionInput {
  opportunityId: string
  responsibleId: string
  effectiveStart?: string
  effectiveEnd?: string
}

export interface IssueDocumentInput {
  documentId: string
  issuedAt?: string
}

export class ContractOperationError extends Error {}

function requireValue(value: string | null | undefined, message: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new ContractOperationError(message)
  return normalized
}

function stageFor(tables: ContractTables, name: string, entityType: string, filialId?: string | null): string {
  const pipelines = tables.pipelines.filter((pipeline) =>
    pipeline.entidade_tipo === entityType &&
    pipeline.ativo !== false &&
    (pipeline.filial_id === null || !filialId || pipeline.filial_id === filialId),
  )
  const scoped = pipelines.sort((a, b) => Number(b.filial_id === filialId) - Number(a.filial_id === filialId))
  for (const pipeline of scoped) {
    const stage = tables.stages.find((candidate) =>
      candidate.pipeline_id === pipeline.id && candidate.nome === name && candidate.ativo !== false,
    )
    if (stage) return stage.id
  }
  throw new ContractOperationError(`A etapa ${name} não está configurada para este fluxo.`)
}

function replaceArray<T>(target: T[], snapshot: T[]): void {
  target.splice(0, target.length, ...snapshot)
}

function transactional<T>(tables: ContractTables, operation: () => T): T {
  const policies = tables.policies.map((row) => ({ ...row }))
  const documents = tables.documents.map((row) => ({ ...row }))
  const opportunities = tables.opportunities.map((row) => ({ ...row }))
  const items = tables.items.map((row) => ({ ...row }))
  const coverages = tables.coverages.map((row) => ({ ...row }))
  const specializations = tables.specializations.map((rows) => rows.map((row) => ({ ...row })))
  const financialFacts = tables.financialFacts.map((rows) => rows.map((row) => ({ ...row })))
  const auditLogs = tables.auditLogs.map((row) => ({ ...row }))
  const pending = new Map(tables.pendingEffects)
  try {
    return operation()
  } catch (error) {
    replaceArray(tables.policies, policies)
    replaceArray(tables.documents, documents)
    replaceArray(tables.opportunities, opportunities)
    replaceArray(tables.items, items)
    replaceArray(tables.coverages, coverages)
    tables.specializations.forEach((rows, index) => replaceArray(rows, specializations[index] ?? []))
    tables.financialFacts.forEach((rows, index) => replaceArray(rows, financialFacts[index] ?? []))
    replaceArray(tables.auditLogs, auditLogs)
    tables.pendingEffects.clear()
    pending.forEach((value, key) => tables.pendingEffects.set(key, value))
    throw error
  }
}

function cloneSpecializations(tables: ContractTables, sourceItemId: string | undefined, targetItemId: string): void {
  let copied = false
  tables.specializations.forEach((rows) => {
    const source = sourceItemId ? rows.find((row) => row.apolice_item_id === sourceItemId) : undefined
    if (!source) return
    rows.push({ ...source, apolice_item_id: targetItemId })
    copied = true
  })
  if (!copied && !sourceItemId) {
    const riskType = tables.items.find((item) => item.id === targetItemId)?.risk_type
    const index = riskType === 'VEICULO' ? 0 : riskType === 'IMOVEL' ? 1 : riskType === 'EMPRESA' ? 2 : riskType === 'VIDA' ? 3 : -1
    if (index >= 0) tables.specializations[index]?.push({ apolice_item_id: targetItemId })
  }
}

function auditChange(
  services: OperationServices,
  entityType: 'apolice' | 'proposta' | 'oportunidade',
  entityId: string,
  field: string,
  row: Record<string, unknown>,
  next: unknown,
): void {
  const previous = row[field]
  if (Object.is(previous, next)) return
  row[field] = next
  services.audit?.(entityType, entityId, field, previous, next)
}

function activePolicy(tables: ContractTables, id: string): ContractPolicyRow {
  const policy = tables.policies.find((row) => row.id === id)
  if (!policy) throw new ContractOperationError('Apólice não encontrada.')
  return policy
}

function branchFor(tables: ContractTables, policy: ContractPolicyRow): ContractBranchRow {
  const branch = tables.branches.find((row) => row.id === policy.ramo_id)
  if (!branch) throw new ContractOperationError('Ramo da apólice não encontrado.')
  return branch
}

function validatePolicyForDerived(policy: ContractPolicyRow): void {
  if (policy.status !== 'VIGENTE') {
    throw new ContractOperationError('Somente apólices vigentes aceitam novos documentos derivados.')
  }
}

function validateDates(start?: string, end?: string): void {
  if (start && end && end < start) {
    throw new ContractOperationError('A data final não pode ser anterior à data inicial.')
  }
}

function isOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

function nextItemNumber(tables: ContractTables, policyId: string): number {
  return Math.max(0, ...tables.items.filter((item) => item.apolice_id === policyId).map((item) => item.numero_item ?? 0)) + 1
}

function effectEndorsement(
  tables: ContractTables,
  document: ContractDocumentRow,
  nature: EndorsementNature,
  effect: EndorsementEffect | undefined,
  services: OperationServices,
): void {
  if (nature === 'ALTERACAO_DADOS' || nature === 'ALTERACAO_CLAUSULA') return
  if (!effect) throw new ContractOperationError('Informe a movimentação de itens ou coberturas do endosso.')

  const currentItem = effect.itemId
    ? tables.items.find((item) => item.id === effect.itemId && item.apolice_id === document.apolice_id && !item.excluido_por_proposta_id)
    : undefined

  if (nature !== 'INCLUSAO_ITEM' && !currentItem) {
    throw new ContractOperationError('Selecione um item vigente desta apólice.')
  }

  if (nature === 'EXCLUSAO_ITEM' && currentItem) {
    currentItem.excluido_por_proposta_id = document.id
    currentItem.status = 'historico'
    return
  }

  if (nature === 'INCLUSAO_ITEM' || nature === 'SUBSTITUICAO_ITEM') {
    const description = requireValue(effect.description, 'Informe a descrição do novo item.')
    if (nature === 'SUBSTITUICAO_ITEM' && currentItem) {
      currentItem.excluido_por_proposta_id = document.id
      currentItem.status = 'historico'
    }
    const source = currentItem
    const newItemId = services.makeId('item')
    tables.items.push({
      id: newItemId,
      apolice_id: document.apolice_id,
      risk_type: source?.risk_type ?? branchFor(tables, activePolicy(tables, document.apolice_id)).risk_type,
      incluido_por_proposta_id: document.id,
      excluido_por_proposta_id: null,
      numero_item: nextItemNumber(tables, document.apolice_id),
      descricao: description,
      identificador_externo: effect.externalIdentifier?.trim() || null,
      valor_risco: effect.riskValue ?? source?.valor_risco ?? null,
      endereco_risco_resumo: source?.endereco_risco_resumo ?? null,
      status: 'vigente',
      observacoes: source?.observacoes ?? null,
    })
    cloneSpecializations(tables, source?.id, newItemId)
    if (source) {
      tables.coverages
        .filter((coverage) => coverage.apolice_item_id === source.id && !coverage.excluido_por_proposta_id)
        .forEach((coverage) => {
          tables.coverages.push({
            ...coverage,
            id: services.makeId('coverage'),
            apolice_item_id: newItemId,
            incluido_por_proposta_id: document.id,
            excluido_por_proposta_id: null,
          })
        })
    }
    return
  }

  const coverage = tables.coverages.find((row) =>
    row.id === effect.coverageId &&
    row.apolice_item_id === currentItem?.id &&
    !row.excluido_por_proposta_id,
  )
  if (!coverage) throw new ContractOperationError('Selecione uma cobertura vigente do item.')
  coverage.excluido_por_proposta_id = document.id
  tables.coverages.push({
    ...coverage,
    id: services.makeId('coverage'),
    incluido_por_proposta_id: document.id,
    excluido_por_proposta_id: null,
    capital_lmi: effect.coverageCapital ?? coverage.capital_lmi,
    premio: effect.coveragePremium ?? coverage.premio,
    premio_liquido: effect.coveragePremium ?? coverage.premio_liquido,
    vigencia_inicio: document.vigencia_inicio,
  })
}

function applyDocumentEffect(
  tables: ContractTables,
  document: ContractDocumentRow,
  services: OperationServices,
): void {
  const policy = activePolicy(tables, document.apolice_id)
  if (document.tipo === 'ENDOSSO') {
    const subtype = tables.subtypes.find((row) => row.id === document.endosso_subtipo_id)
    if (!subtype) throw new ContractOperationError('Subtipo do endosso não encontrado.')
    effectEndorsement(
      tables,
      document,
      subtype.natureza_canonica as EndorsementNature,
      tables.pendingEffects.get(document.id),
      services,
    )
  }
  if (document.tipo === 'CANCELAMENTO') {
    const reason = tables.cancellationReasons.find((row) => row.id === document.cancelamento_motivo_id)
    auditChange(services, 'apolice', policy.id, 'status', policy as unknown as Record<string, unknown>, 'CANCELADA')
    auditChange(services, 'apolice', policy.id, 'motivo_status', policy as unknown as Record<string, unknown>, reason?.nome ?? null)
  }
  if (document.tipo === 'RENOVACAO') {
    if (!policy.renovada_de_id || policy.renovada_de_id === policy.id) {
      throw new ContractOperationError('A renovação não possui uma apólice anterior válida.')
    }
    const previous = activePolicy(tables, policy.renovada_de_id)
    auditChange(services, 'apolice', policy.id, 'status', policy as unknown as Record<string, unknown>, 'VIGENTE')
    auditChange(services, 'apolice', previous.id, 'status', previous as unknown as Record<string, unknown>, 'RENOVADA')
  }

  const dueDate = document.primeira_parcela_vencimento
    ?? document.competencia_inicio
    ?? document.vigencia_inicio
    ?? services.today()
  services.materialize(document.id, dueDate, document.numero_fatura ?? undefined)
  tables.pendingEffects.delete(document.id)
}

function validateDerivedInput(
  tables: ContractTables,
  policy: ContractPolicyRow,
  branch: ContractBranchRow,
  input: DerivedDocumentInput,
): { officialNumber: string; subtype?: EndossoSubtipoRow; reason?: CancelamentoMotivoRow } {
  validatePolicyForDerived(policy)
  validateDates(input.effectiveDate, undefined)
  const officialNumber = input.issued || input.type === 'FATURA'
    ? requireValue(input.officialNumber, 'Informe o número oficial do documento.')
    : input.officialNumber.trim()

  if (input.type === 'ENDOSSO') {
    if (!branch.permite_endosso) throw new ContractOperationError('Este ramo não permite endosso.')
    const subtype = tables.subtypes.find((row) =>
      row.id === input.endorsementSubtypeId &&
      row.ativo &&
      (!row.ramo_id || row.ramo_id === policy.ramo_id),
    )
    if (!subtype) throw new ContractOperationError('Selecione um subtipo de endosso ativo para este ramo.')
    requireValue(input.effectiveDate, 'Informe o início dos efeitos do endosso.')
    return { officialNumber, subtype }
  }

  if (input.type === 'CANCELAMENTO') {
    const reason = tables.cancellationReasons.find((row) =>
      row.id === input.cancellationReasonId &&
      row.ativo &&
      (!row.ramo_id || row.ramo_id === policy.ramo_id),
    )
    if (!reason) throw new ContractOperationError('Selecione um motivo de cancelamento ativo para este ramo.')
    requireValue(input.effectiveDate, 'Informe o início dos efeitos do cancelamento.')
    return { officialNumber, reason }
  }

  if (!branch.is_monthly) throw new ContractOperationError('Faturas estão disponíveis somente para ramos mensais.')
  const competenceStart = requireValue(input.competenceStart, 'Informe o início da competência.')
  const competenceEnd = requireValue(input.competenceEnd, 'Informe o fim da competência.')
  validateDates(competenceStart, competenceEnd)
  const duplicate = tables.documents.some((document) =>
    document.apolice_id === policy.id &&
    document.tipo === 'FATURA' &&
    (document.numero_fatura?.toLocaleLowerCase('pt-BR') === officialNumber.toLocaleLowerCase('pt-BR') ||
      Boolean(document.competencia_inicio && document.competencia_fim && isOverlap(
        competenceStart,
        competenceEnd,
        document.competencia_inicio,
        document.competencia_fim,
      ))),
  )
  if (duplicate) throw new ContractOperationError('Já existe uma fatura com este número ou competência sobreposta.')
  return { officialNumber }
}

export function createDerivedDocument(
  tables: ContractTables,
  input: DerivedDocumentInput,
  services: OperationServices,
): ContractDocumentRow {
  const policy = activePolicy(tables, input.policyId)
  const branch = branchFor(tables, policy)
  const validated = validateDerivedInput(tables, policy, branch, input)
  const stageId = stageFor(tables, input.issued ? 'Emitida' : 'Em análise', 'proposta')

  return transactional(tables, () => {
    const document: ContractDocumentRow = {
      id: services.makeId('document'),
      apolice_id: policy.id,
      tipo: input.type,
      cotacao_id: null,
      stage_id: stageId,
      responsavel_id: input.responsibleId,
      recebimento_grade_id: input.receiptGradeId ?? null,
      endosso_subtipo_id: validated.subtype?.id ?? null,
      cancelamento_motivo_id: validated.reason?.id ?? null,
      numero_proposta: input.type === 'CANCELAMENTO' ? validated.officialNumber : null,
      numero_endosso: input.type === 'ENDOSSO' ? validated.officialNumber : null,
      numero_fatura: input.type === 'FATURA' ? validated.officialNumber : null,
      tipo_movimento_endosso: validated.subtype?.natureza_canonica ?? null,
      data_transmissao: services.today(),
      data_emissao: input.issued ? services.today() : null,
      vigencia_inicio: input.effectiveDate?.trim() || null,
      vigencia_fim: null,
      premio_total: input.totalPremium ?? null,
      premio_liquido: input.netPremium ?? input.totalPremium ?? null,
      forma_pagamento: input.paymentMethod?.trim() || null,
      periodicidade_pagamento: input.paymentFrequency?.trim() || null,
      qtd_parcelas: input.type === 'FATURA' ? 1 : input.installmentCount ?? null,
      primeira_parcela_vencimento: input.firstInstallmentDueDate?.trim() || null,
      primeira_parcela_valor: input.firstInstallmentValue ?? null,
      comissao_pct: input.commissionPercent ?? null,
      agenciamento_pct: input.agencyCommissionPercent ?? null,
      competencia_inicio: input.competenceStart?.trim() || null,
      competencia_fim: input.competenceEnd?.trim() || null,
      observacoes: input.notes?.trim() || null,
    }
    tables.documents.push(document)
    if (input.type === 'ENDOSSO' && input.endorsementEffect) {
      tables.pendingEffects.set(document.id, input.endorsementEffect)
    }
    services.audit?.('proposta', document.id, 'criacao', null, input.type)
    if (input.issued) applyDocumentEffect(tables, document, services)
    return document
  })
}

export function issueContractDocument(
  tables: ContractTables,
  input: IssueDocumentInput,
  services: OperationServices,
): ContractDocumentRow {
  const document = tables.documents.find((row) => row.id === input.documentId)
  if (!document) throw new ContractOperationError('Documento não encontrado.')
  if (!['RENOVACAO', 'ENDOSSO', 'CANCELAMENTO', 'FATURA'].includes(document.tipo ?? '')) {
    throw new ContractOperationError('Este documento não pertence ao ciclo da 2.7.')
  }
  if (document.data_emissao) throw new ContractOperationError('O documento já foi efetivado.')

  if (document.tipo === 'ENDOSSO') requireValue(document.numero_endosso, 'Informe o número do endosso.')
  if (document.tipo === 'CANCELAMENTO') requireValue(document.numero_proposta, 'Informe o número do cancelamento.')
  if (document.tipo === 'FATURA') requireValue(document.numero_fatura, 'Informe o número da fatura.')
  if (document.tipo === 'RENOVACAO') requireValue(document.numero_proposta, 'Informe o número da proposta de renovação.')
  if (document.tipo === 'RENOVACAO') {
    const policy = activePolicy(tables, document.apolice_id)
    requireValue(policy.numero_apolice, 'Informe o número da nova apólice antes de efetivar a renovação.')
  }

  return transactional(tables, () => {
    const emittedStage = stageFor(tables, 'Emitida', 'proposta')
    auditChange(services, 'proposta', document.id, 'stage_id', document as unknown as Record<string, unknown>, emittedStage)
    auditChange(services, 'proposta', document.id, 'data_emissao', document as unknown as Record<string, unknown>, input.issuedAt ?? services.today())
    applyDocumentEffect(tables, document, services)
    return document
  })
}

export function createRenewalOpportunity(
  tables: ContractTables,
  input: RenewalOpportunityInput,
  services: OperationServices,
): ContractOpportunityRow {
  const policy = activePolicy(tables, input.policyId)
  const branch = branchFor(tables, policy)
  if (!branch.renovavel) throw new ContractOperationError('Este ramo não permite renovação.')
  if (policy.status !== 'VIGENTE') throw new ContractOperationError('Somente apólices vigentes podem iniciar renovação.')
  const existing = tables.opportunities.find((row) => row.apolice_origem_id === policy.id && row.status === 'pending')
  if (existing) throw new ContractOperationError('Já existe uma oportunidade de renovação ativa para esta apólice.')

  const pipeline = tables.pipelines.find((row) =>
    row.entidade_tipo === 'oportunidade' &&
    row.ativo !== false &&
    (row.filial_id === null || row.filial_id === input.filialId),
  )
  if (!pipeline) throw new ContractOperationError('Pipeline comercial não configurado.')
  const stageId = stageFor(tables, 'Prospecção', 'oportunidade', input.filialId)

  const opportunity: ContractOpportunityRow = {
    id: services.makeId('opportunity'),
    nome: `Renovação · ${policy.numero_apolice ?? policy.id}`,
    tenant_id: input.tenantId,
    filial_id: input.filialId,
    segurado_id: policy.segurado_id,
    ramo_id: policy.ramo_id,
    apolice_origem_id: policy.id,
    responsavel_id: input.responsibleId,
    pipeline_id: pipeline.id,
    stage_id: stageId,
    status: 'pending',
    tipo_negocio: 'renovacao',
    vigencia_inicio: policy.vigencia_fim,
    vigencia_fim: null,
    observacoes: `Renovação originada da apólice ${policy.numero_apolice ?? policy.id}.`,
    created_at: `${services.today()}T12:00:00.000Z`,
    updated_at: `${services.today()}T12:00:00.000Z`,
  }
  tables.opportunities.push(opportunity)
  services.audit?.('oportunidade', opportunity.id, 'criacao', null, policy.id)
  return opportunity
}

export function transmitRenewalOpportunity(
  tables: ContractTables,
  input: RenewalTransmissionInput,
  services: OperationServices,
): { policy: ContractPolicyRow; document: ContractDocumentRow } {
  const opportunity = tables.opportunities.find((row) => row.id === input.opportunityId)
  if (!opportunity || !opportunity.apolice_origem_id || opportunity.tipo_negocio !== 'renovacao') {
    throw new ContractOperationError('Oportunidade de renovação não encontrada.')
  }
  if (opportunity.status !== 'pending') throw new ContractOperationError('A oportunidade já foi concluída.')
  const previous = activePolicy(tables, opportunity.apolice_origem_id)
  const duplicate = tables.policies.some((row) => row.renovada_de_id === previous.id && row.status !== 'RECUSADA')
  if (duplicate) throw new ContractOperationError('Esta oportunidade já possui uma apólice sucessora ativa.')
  validateDates(input.effectiveStart, input.effectiveEnd)

  return transactional(tables, () => {
    const policyId = services.makeId('policy')
    const documentId = services.makeId('document')
    const policy: ContractPolicyRow = {
      id: policyId,
      segurado_id: previous.segurado_id,
      seguradora_id: previous.seguradora_id,
      ramo_id: previous.ramo_id,
      status: 'EM_EMISSAO',
      renovada_de_id: previous.id,
      produtor_id: previous.produtor_id,
      numero_apolice: null,
      vigencia_inicio: input.effectiveStart ?? previous.vigencia_fim,
      vigencia_fim: input.effectiveEnd ?? null,
      premio_total: null,
      premio_liquido: null,
      motivo_status: null,
      observacoes: `Renovação da apólice ${previous.numero_apolice ?? previous.id}.`,
      data_emissao: null,
    }
    const document: ContractDocumentRow = {
      id: documentId,
      apolice_id: policyId,
      tipo: 'RENOVACAO',
      cotacao_id: null,
      stage_id: stageFor(tables, 'Em análise', 'proposta'),
      responsavel_id: input.responsibleId,
      recebimento_grade_id: null,
      endosso_subtipo_id: null,
      cancelamento_motivo_id: null,
      numero_proposta: null,
      numero_endosso: null,
      numero_fatura: null,
      tipo_movimento_endosso: null,
      data_transmissao: services.today(),
      data_emissao: null,
      vigencia_inicio: policy.vigencia_inicio,
      vigencia_fim: policy.vigencia_fim,
      premio_total: null,
      premio_liquido: null,
      forma_pagamento: null,
      periodicidade_pagamento: null,
      qtd_parcelas: null,
      primeira_parcela_vencimento: null,
      primeira_parcela_valor: null,
      comissao_pct: null,
      agenciamento_pct: null,
      competencia_inicio: null,
      competencia_fim: null,
      observacoes: null,
    }
    tables.policies.push(policy)
    tables.documents.push(document)

    const currentItems = tables.items.filter((item) => item.apolice_id === previous.id && !item.excluido_por_proposta_id)
    currentItems.forEach((item) => {
      const newItemId = services.makeId('item')
      tables.items.push({
        ...item,
        id: newItemId,
        apolice_id: policy.id,
        incluido_por_proposta_id: document.id,
        excluido_por_proposta_id: null,
        status: 'vigente',
      })
      cloneSpecializations(tables, item.id, newItemId)
      tables.coverages
        .filter((coverage) => coverage.apolice_item_id === item.id && !coverage.excluido_por_proposta_id)
        .forEach((coverage) => tables.coverages.push({
          ...coverage,
          id: services.makeId('coverage'),
          apolice_item_id: newItemId,
          incluido_por_proposta_id: document.id,
          excluido_por_proposta_id: null,
        }))
    })

    auditChange(services, 'oportunidade', opportunity.id, 'status', opportunity as unknown as Record<string, unknown>, 'won')
    services.audit?.('apolice', policy.id, 'criacao', null, previous.id)
    services.audit?.('proposta', document.id, 'criacao', null, 'RENOVACAO')
    return { policy, document }
  })
}

export function markPolicyNotRenewed(
  tables: ContractTables,
  policyId: string,
  reason: string,
  services: OperationServices,
): ContractPolicyRow {
  const policy = activePolicy(tables, policyId)
  if (policy.status !== 'VIGENTE') throw new ContractOperationError('Somente apólices vigentes podem ser marcadas como não renovadas.')
  const normalizedReason = requireValue(reason, 'Informe o motivo da não renovação.')
  auditChange(services, 'apolice', policy.id, 'status', policy as unknown as Record<string, unknown>, 'NAO_RENOVADA')
  auditChange(services, 'apolice', policy.id, 'motivo_status', policy as unknown as Record<string, unknown>, normalizedReason)
  return policy
}
