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
  | 'alteracao'
  | 'cancelamento'
  | 'inclusao_item'
  | 'exclusao_item'
  | 'substituicao_item'
  | 'sem_movimento'
  | 'acrescimo'
  | 'restituicao'

export interface Proposal {
  id: string
  /** Ponte transitória do mock achatado: distingue documento de contrato. */
  entityType: ProposalEntityType
  /** Quando documento, aponta para a apólice-mãe sem duplicar seu estado contratual. */
  apoliceId?: string
  /** Vínculo com o segurado dono da proposta/apólice (chave do filtro na aba "Apólices"). */
  seguradoId?: string
  insured: string
  branch: string
  status: ProposalStatus
  currentStatus?: PolicyContractStatus
  proposalType: ProposalType
  producer: { name: string; avatarUrl?: string }
  insurer: string
  policyNumber?: string
  proposalNumber?: string
  endorsementNumber?: string
  invoiceNumber?: string
  controlNumber?: string
  insurerProtocol?: string
  endorsementMovement?: EndorsementMovementType
  transmissionDate?: string
  issueDate?: string
  effectDate?: string
  vigenciaInicial?: string // ISO
  vigenciaFinal?: string // ISO
  totalPremium?: number
  netPremium?: number
  additionalPremium?: number
  refundPremium?: number
  competenceStart?: string
  competenceEnd?: string
  notes?: string
  isMonthly?: boolean
  details?: { model?: string; brand?: string; year?: string; plate?: string; chassis?: string }
}
