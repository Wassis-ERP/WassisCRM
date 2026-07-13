/* =========================================================================
 * Tipos de Proposta / Apólice (modo frontend puro, estado em memória)
 *
 * Compartilhado entre o Painel (`PropostasPage`) e a aba "Apólices" da página
 * de detalhe do segurado. O vínculo com o segurado é feito por `seguradoId`.
 * ========================================================================= */

export type ProposalStatus =
  | 'Em Análise'
  | 'Pendente'
  | 'Pendência Resolvida'
  | 'Proposta Emitida'
  | 'Vigente'
  | 'Renovada'
  | 'Cancelada'
  | 'Recusada'
  | 'Não renovada'

export type PolicyContractStatus =
  | 'Em emissão'
  | 'Vigente'
  | 'Renovada'
  | 'Não renovada'
  | 'Cancelada'
  | 'Recusada'

export type ProposalType =
  | 'Proposta'
  | 'Renovação'
  | 'Endosso'
  | 'Cancelamento'
  | 'Fatura'

export type ProposalEntityType = 'proposta' | 'apolice'

export type EndorsementMovementType =
  | 'alteracao_dados'
  | 'inclusao_item'
  | 'exclusao_item'
  | 'substituicao_item'
  | 'alteracao_cobertura'
  | 'alteracao_importancia_segurada'
  | 'alteracao_clausula'

export interface Proposal {
  id: string
  /** Ponte transitória do mock achatado: distingue documento de contrato. */
  entityType: ProposalEntityType
  /** Quando documento, aponta para a apólice-mãe sem duplicar seu estado contratual. */
  apoliceId?: string
  /** Vínculo com o segurado dono da proposta/apólice (chave do filtro na aba "Apólices"). */
  seguradoId?: string
  insuredDocument?: string
  insuredCity?: string
  insuredState?: string
  insuredEmail?: string
  insuredPhone?: string
  insured: string
  branch: string
  branchId?: string
  status: ProposalStatus
  currentStatus?: PolicyContractStatus
  proposalType: ProposalType
  producer: { name: string; avatarUrl?: string }
  producerId?: string
  insurer: string
  insurerId?: string
  stageId?: string
  policyNumber?: string
  proposalNumber?: string
  endorsementNumber?: string
  invoiceNumber?: string
  controlNumber?: string
  insurerProtocol?: string
  endorsementMovement?: EndorsementMovementType
  endorsementSubtypeId?: string
  endorsementSubtype?: string
  cancellationReasonId?: string
  cancellationReason?: string
  transmissionDate?: string
  insurerReceiptDate?: string
  acceptanceDate?: string
  refusalDate?: string
  refusalReason?: string
  issueDate?: string
  vigenciaInicial?: string // ISO
  vigenciaFinal?: string // ISO
  totalPremium?: number
  netPremium?: number
  iof?: number
  installmentAdditional?: number
  paymentMethod?: string
  paymentFrequency?: string
  installmentCount?: number
  firstInstallmentDueDate?: string
  firstInstallmentValue?: number
  commissionPercent?: number
  agencyCommissionPercent?: number
  competenceStart?: string
  competenceEnd?: string
  notes?: string
  isMonthly?: boolean
  isRenewable?: boolean
  allowsEndorsement?: boolean
  renewedFromId?: string
  insuredItems?: string[]
  details?: { model?: string; brand?: string; year?: string; plate?: string; chassis?: string }
}
