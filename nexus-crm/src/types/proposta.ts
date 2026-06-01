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
  | 'Endossada'
  | 'Cancelada'
  | 'Recusada'
  | 'Não renovada'

export type ProposalType = 'Proposta' | 'Renovação' | 'Endosso'

export interface Proposal {
  id: string
  /** Vínculo com o segurado dono da proposta/apólice (chave do filtro na aba "Apólices"). */
  seguradoId?: string
  insured: string
  branch: string
  status: ProposalStatus
  currentStatus?: ProposalStatus
  proposalType: ProposalType
  producer: { name: string; avatarUrl?: string }
  insurer: string
  policyNumber?: string
  vigenciaInicial?: string // ISO
  vigenciaFinal?: string // ISO
  details?: { model?: string; brand?: string; year?: string; plate?: string; chassis?: string }
}
