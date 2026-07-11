import type {
  EndorsementMovementType,
  Proposal,
  ProposalStatus,
} from '../../types/proposta'

export const PROPOSAL_PIPELINE_STATUSES: readonly ProposalStatus[] = [
  'Em Análise',
  'Pendente',
  'Pendência Resolvida',
  'Proposta Emitida',
]

const proposalPipelineStatusSet = new Set<ProposalStatus>(PROPOSAL_PIPELINE_STATUSES)

export type PolicyOperationalStatus =
  | 'Endosso em tramitação'
  | 'Documento do endosso pendente'
  | 'Cancelamento em tramitação'
  | 'Fatura pendente'

export type DocumentFinancialEffect =
  | 'Sem movimento'
  | 'Acréscimo'
  | 'Restituição'
  | 'A apurar'

export interface DocumentTreeRow {
  document: Proposal
  typeLabel: string
  movementLabel?: string
  financialEffect: DocumentFinancialEffect
  documentNumber: string
  summary: string
  previewBeforeAfter?: DocumentChangePreview
}

export interface DocumentChangePreview {
  beforeLabel: string
  afterLabel: string
  fields: Array<{
    label: string
    before?: string
    after?: string
  }>
}

export interface PolicyTreeRow {
  policy: Proposal
  operationalStatus?: PolicyOperationalStatus
  documents: DocumentTreeRow[]
  regularDocuments: DocumentTreeRow[]
  invoices: DocumentTreeRow[]
}

const MOVEMENT_LABELS: Record<EndorsementMovementType, string> = {
  alteracao_dados: 'Alteração de dados',
  inclusao_item: 'Inclusão',
  exclusao_item: 'Exclusão',
  substituicao_item: 'Substituição',
  alteracao_cobertura: 'Alteração de cobertura',
  alteracao_importancia_segurada: 'Alteração de importância segurada',
  alteracao_clausula: 'Alteração de cláusula',
}

export function isPipelineProposal(record: Proposal): boolean {
  return record.entityType === 'proposta' && proposalPipelineStatusSet.has(record.status)
}

export function getPolicyOperationalStatus(
  policyId: string,
  records: readonly Proposal[],
): PolicyOperationalStatus | undefined {
  const linkedDocuments = records.filter(
    (record) =>
      record.entityType === 'proposta' &&
      record.apoliceId === policyId &&
      record.status !== 'Recusada' &&
      record.status !== 'Cancelada',
  )

  if (linkedDocuments.some(
    (record) => record.proposalType === 'Cancelamento' && isPipelineProposal(record),
  )) {
    return 'Cancelamento em tramitação'
  }

  const linkedEndorsements = records.filter(
    (record) =>
      record.entityType === 'proposta' &&
      record.proposalType === 'Endosso' &&
      record.apoliceId === policyId &&
      record.status !== 'Recusada' &&
      record.status !== 'Cancelada',
  )

  if (linkedEndorsements.some(
    (record) => record.status === 'Proposta Emitida' && !record.endorsementNumber,
  )) {
    return 'Documento do endosso pendente'
  }

  if (linkedEndorsements.some(
    (record) => record.status !== 'Proposta Emitida' && isPipelineProposal(record),
  )) {
    return 'Endosso em tramitação'
  }

  if (linkedDocuments.some(
    (record) => record.proposalType === 'Fatura' && isPipelineProposal(record),
  )) {
    return 'Fatura pendente'
  }

  return undefined
}

export function getMovementLabel(record: Proposal): string | undefined {
  if (record.proposalType === 'Cancelamento') return 'Cancelamento'
  if (record.proposalType !== 'Endosso' || !record.endorsementMovement) return undefined
  return MOVEMENT_LABELS[record.endorsementMovement]
}

export function getDocumentFinancialEffect(record: Proposal): DocumentFinancialEffect {
  if ((record.totalPremium ?? 0) > 0) return 'Acréscimo'
  if ((record.totalPremium ?? 0) < 0) return 'Restituição'
  if (record.totalPremium === 0) return 'Sem movimento'
  if (
    record.proposalType === 'Endosso' ||
    record.proposalType === 'Cancelamento'
  ) {
    return 'A apurar'
  }
  return 'Sem movimento'
}

export function getDocumentNumber(record: Proposal): string {
  return record.invoiceNumber
    ?? record.endorsementNumber
    ?? record.proposalNumber
    ?? record.controlNumber
    ?? record.insurerProtocol
    ?? 'Sem número'
}

export function getDocumentSummary(record: Proposal): string {
  if (record.notes) return record.notes
  const movementLabel = getMovementLabel(record)
  if (movementLabel) return movementLabel
  if (record.proposalType === 'Fatura') return 'Fatura por competência'
  if (record.proposalType === 'Renovação') return 'Documento de renovação'
  return 'Documento contratual'
}

function getDocumentSortDate(record: Proposal): string {
  return (record.proposalType === 'Fatura' ? record.competenceEnd : record.vigenciaInicial)
    ?? record.issueDate
    ?? record.transmissionDate
    ?? ''
}

function toDocumentTreeRow(document: Proposal): DocumentTreeRow {
  return {
    document,
    typeLabel: document.proposalType,
    movementLabel: getMovementLabel(document),
    financialEffect: getDocumentFinancialEffect(document),
    documentNumber: getDocumentNumber(document),
    summary: getDocumentSummary(document),
  }
}

function sortDocuments(a: Proposal, b: Proposal): number {
  const byDate = getDocumentSortDate(b).localeCompare(getDocumentSortDate(a))
  return byDate || a.id.localeCompare(b.id)
}

function isOfficiallyIssued(record: Proposal): boolean {
  return record.status === 'Proposta Emitida' && Boolean(record.issueDate)
}

function isEffectiveOn(record: Proposal, referenceDate: string): boolean {
  return !record.vigenciaInicial || record.vigenciaInicial <= referenceDate
}

/**
 * Resolve o documento vigente sem depender da ordem acidental do array.
 * Pendencias e recusas nunca substituem um documento oficialmente emitido.
 */
export function getCurrentPolicyDocument(
  row: PolicyTreeRow,
  referenceDate = new Date(),
): Proposal | undefined {
  const reference = referenceDate.toISOString().slice(0, 10)
  const documents = row.documents.map(({ document }) => document)
  const issued = documents.filter(isOfficiallyIssued)

  if (row.policy.isMonthly) {
    const issuedInvoices = issued.filter((document) => document.proposalType === 'Fatura')
    const currentCompetence = issuedInvoices.find((document) =>
      Boolean(
        document.competenceStart &&
        document.competenceEnd &&
        document.competenceStart <= reference &&
        document.competenceEnd >= reference,
      ),
    )
    if (currentCompetence) return currentCompetence

    const latestIssuedInvoice = [...issuedInvoices].sort((a, b) =>
      (b.competenceEnd ?? b.competenceStart ?? '').localeCompare(
        a.competenceEnd ?? a.competenceStart ?? '',
      ),
    )[0]
    if (latestIssuedInvoice) return latestIssuedInvoice
  }

  const latestEffective = issued
    .filter((document) => isEffectiveOn(document, reference))
    .sort(sortDocuments)[0]
  if (latestEffective) return latestEffective

  const canonicalOriginal = documents
    .filter((document) =>
      document.proposalType === 'Proposta' || document.proposalType === 'Renovação',
    )
    .sort((a, b) => getDocumentSortDate(a).localeCompare(getDocumentSortDate(b)))[0]

  return canonicalOriginal ?? [...documents].sort(sortDocuments)[0]
}

/**
 * Compoe a arvore apenas na leitura. Se um filtro encontra um documento filho,
 * o pai e incluido para contexto; se o pai foi encontrado diretamente, todos os
 * seus documentos continuam disponiveis na expansao.
 */
export function buildPolicyTree(
  visibleRecords: readonly Proposal[],
  allRecords: readonly Proposal[] = visibleRecords,
): PolicyTreeRow[] {
  const policiesById = new Map(
    allRecords
      .filter((record) => record.entityType === 'apolice')
      .map((record) => [record.id, record]),
  )
  const visibleIds = new Set(visibleRecords.map((record) => record.id))
  const directlyVisiblePolicyIds = new Set(
    visibleRecords
      .filter((record) => record.entityType === 'apolice')
      .map((record) => record.id),
  )
  const policyIds = new Set(directlyVisiblePolicyIds)

  for (const record of visibleRecords) {
    if (
      record.entityType === 'proposta' &&
      record.apoliceId &&
      policiesById.has(record.apoliceId)
    ) {
      policyIds.add(record.apoliceId)
    }
  }

  return Array.from(policyIds)
    .map((policyId): PolicyTreeRow | undefined => {
      const policy = policiesById.get(policyId)
      if (!policy) return undefined

      const showAllChildren = directlyVisiblePolicyIds.has(policyId)
      const documents = allRecords
        .filter((record) =>
          record.entityType === 'proposta' &&
          record.apoliceId === policyId &&
          (showAllChildren || visibleIds.has(record.id)),
        )
        .sort(sortDocuments)
        .map(toDocumentTreeRow)

      return {
        policy,
        operationalStatus: getPolicyOperationalStatus(policyId, allRecords),
        documents,
        regularDocuments: documents.filter(({ document }) => document.proposalType !== 'Fatura'),
        invoices: documents.filter(({ document }) => document.proposalType === 'Fatura'),
      }
    })
    .filter((row): row is PolicyTreeRow => Boolean(row))
    .sort((a, b) => {
      const byEndDate = (a.policy.vigenciaFinal ?? '').localeCompare(b.policy.vigenciaFinal ?? '')
      return byEndDate || a.policy.insured.localeCompare(b.policy.insured, 'pt-BR')
    })
}

/** IDs controlados pela acao local de expandir/recolher toda a apolice. */
export function getPolicyExpansionIds(row: PolicyTreeRow): string[] {
  return [
    row.policy.id,
    ...row.regularDocuments.map(({ document }) => document.id),
    ...(row.invoices.length > 0 ? [`invoices:${row.policy.id}`] : []),
    ...row.invoices.map(({ document }) => document.id),
  ]
}
