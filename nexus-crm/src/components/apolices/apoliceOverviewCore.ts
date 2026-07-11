import type { Proposal } from '../../types/proposta'

export interface DocumentDraft {
  numero_proposta: string
  numero_endosso: string
  numero_fatura: string
  stage_id: string
  endosso_subtipo_id: string
  cancelamento_motivo_id: string
  data_transmissao: string
  data_recebimento_seguradora: string
  data_aceitacao: string
  data_recusa: string
  motivo_recusa: string
  data_emissao: string
  vigencia_inicio: string
  vigencia_fim: string
  premio_total: string
  premio_liquido: string
  forma_pagamento: string
  periodicidade_pagamento: string
  qtd_parcelas: string
  primeira_parcela_vencimento: string
  primeira_parcela_valor: string
  competencia_inicio: string
  competencia_fim: string
}

const parsedNumber = (value: string) => value.trim() === '' ? null : Number(value.replace(',', '.'))

export function validateDocumentDraft(document: Proposal, draft: DocumentDraft): string | null {
  if (document.proposalType === 'Endosso' && !draft.endosso_subtipo_id) return 'Selecione o subtipo do endosso.'
  if (document.proposalType === 'Cancelamento' && !draft.cancelamento_motivo_id) return 'Selecione o motivo do cancelamento.'
  if (document.proposalType === 'Fatura' && (!draft.competencia_inicio || !draft.competencia_fim)) return 'Informe o período completo da competência.'
  if (draft.competencia_inicio && draft.competencia_fim && draft.competencia_fim < draft.competencia_inicio) return 'A competência final não pode ser anterior à inicial.'
  if (draft.vigencia_inicio && draft.vigencia_fim && draft.vigencia_fim < draft.vigencia_inicio) return 'O fim da vigência não pode ser anterior ao início.'
  const officialNumber = document.proposalType === 'Endosso' ? draft.numero_endosso : document.proposalType === 'Fatura' ? draft.numero_fatura : draft.numero_proposta
  if (document.status === 'Proposta Emitida' && !officialNumber.trim()) return 'O número oficial de um documento emitido não pode ser apagado.'
  if ([draft.premio_total, draft.premio_liquido, draft.primeira_parcela_valor].some((value) => value && !Number.isFinite(parsedNumber(value)))) return 'Revise os valores monetários informados.'
  return null
}
