import { describe, expect, it } from 'vitest'
import type { Proposal } from '../../types/proposta'
import { validateDocumentDraft, type DocumentDraft } from './apoliceOverviewCore'

const proposal = (patch: Partial<Proposal> = {}): Proposal => ({
  id: 'documento-1',
  entityType: 'proposta',
  insured: 'Segurado Teste',
  branch: 'Automóvel',
  status: 'Em Análise',
  proposalType: 'Proposta',
  producer: { name: 'Produtor Teste' },
  insurer: 'Seguradora Teste',
  ...patch,
})

const draft = (patch: Partial<DocumentDraft> = {}): DocumentDraft => ({
  numero_proposta: 'PROP-1', numero_endosso: '1', numero_fatura: 'FAT-1', stage_id: 'stage-1',
  endosso_subtipo_id: '', cancelamento_motivo_id: '', data_transmissao: '',
  data_recebimento_seguradora: '', data_aceitacao: '', data_recusa: '', motivo_recusa: '',
  data_emissao: '', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31',
  premio_total: '100', premio_liquido: '90', forma_pagamento: '', periodicidade_pagamento: '',
  qtd_parcelas: '1', primeira_parcela_vencimento: '', primeira_parcela_valor: '',
  competencia_inicio: '', competencia_fim: '', ...patch,
})

describe('validação da edição documental 2.2f', () => {
  it('exige subtipo para endosso e aceita prêmio negativo', () => {
    const document = proposal({ proposalType: 'Endosso' })
    expect(validateDocumentDraft(document, draft({ endosso_subtipo_id: '', premio_total: '-120.40' }))).toContain('subtipo')
    expect(validateDocumentDraft(document, draft({ endosso_subtipo_id: 'subtipo-1', premio_total: '-120.40' }))).toBeNull()
  })

  it('exige motivo no cancelamento', () => {
    expect(validateDocumentDraft(proposal({ proposalType: 'Cancelamento' }), draft({ cancelamento_motivo_id: '' }))).toContain('motivo')
  })

  it('valida competência completa e ordenada para fatura', () => {
    const document = proposal({ proposalType: 'Fatura' })
    expect(validateDocumentDraft(document, draft({ competencia_inicio: '', competencia_fim: '' }))).toContain('competência')
    expect(validateDocumentDraft(document, draft({ competencia_inicio: '2026-07-31', competencia_fim: '2026-07-01' }))).toContain('anterior')
  })

  it('impede apagar o número oficial emitido', () => {
    const document = proposal({ status: 'Proposta Emitida' })
    expect(validateDocumentDraft(document, draft({ numero_proposta: '' }))).toContain('não pode ser apagado')
  })
})
