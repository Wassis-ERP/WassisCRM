import { describe, expect, it } from 'vitest'
import type { Database } from '../../types/database'
import type { PipelineStageRow } from '../types'
import {
  buildOpportunityConclusionPatch,
  buildOpportunityInsert,
  buildOpportunityQualificationPatch,
  deriveOpportunityStatus,
  mapOpportunityToKanbanCard,
  opportunityTitle,
} from './opportunityDomain'

type OpportunityRow = Database['public']['Tables']['oportunidades']['Row']

const row: OpportunityRow = {
  id: 'opp-1',
  tenant_id: 'tenant-1',
  filial_id: 'filial-1',
  segurado_id: null,
  ramo_id: 'ramo-1',
  origem_id: 'origem-1',
  apolice_origem_id: null,
  responsavel_id: 'user-1',
  stage_id: 'stage-1',
  motivo_perda_id: null,
  lead_nome: 'Maria Souza',
  lead_documento: null,
  lead_email: 'maria@example.com',
  lead_telefone: '11999999999',
  titulo: 'Seguro do apartamento',
  descricao: null,
  prioridade: 'alta',
  valor_premio_estimado: 1800,
  valor_comissao_estimada: 270,
  comissao_estimada_pct: 15,
  agenciamento_pct: null,
  data_abertura: '2026-07-21',
  data_fechamento_prevista: '2026-08-01',
  ganha_em: null,
  perdida_em: null,
  motivo_perda_observacao: null,
  campanha: null,
  observacoes: null,
}

const stage: PipelineStageRow = {
  id: 'stage-1',
  pipeline_id: 'pipeline-1',
  nome: 'Novo contato',
  codigo: 'NOVO_CONTATO',
  tipo_stage: 'ABERTO',
  cor: '#004FC2',
  ordem: 10,
  probabilidade: 10,
  sla_dias: 2,
  finaliza_com_sucesso: false,
  finaliza_com_perda: false,
  ativo: true,
  name: 'Novo contato',
  color: '#004FC2',
  order: 10,
  is_win_eligible: false,
  is_loss_eligible: false,
}

describe('dominio de oportunidades', () => {
  it('cria lead e oportunidade vinculada sem campos legados', () => {
    const lead = buildOpportunityInsert(
      { stageId: 'stage-1', leadNome: '  Maria Souza  ', leadDocumento: '123.456.789-00', ramoId: 'ramo-1' },
      { tenantId: 'tenant-1', filialId: 'filial-1', responsavelId: 'user-1', dataAbertura: '2026-07-21' },
    )
    expect(lead).toMatchObject({ segurado_id: null, lead_nome: 'Maria Souza', lead_documento: '12345678900' })
    expect(lead).not.toHaveProperty('metadata')
    expect(lead).not.toHaveProperty('pipeline_id')
    expect(lead).not.toHaveProperty('seguradora_id')

    const linked = buildOpportunityInsert(
      { stageId: 'stage-1', seguradoId: 'segurado-1', leadNome: 'não deve persistir' },
      { tenantId: 'tenant-1', filialId: 'filial-1', responsavelId: 'user-1', dataAbertura: '2026-07-21' },
    )
    expect(linked).toMatchObject({ segurado_id: 'segurado-1', lead_nome: null, lead_documento: null })
  })

  it('qualifica o lead somente com segurado valido', () => {
    expect(buildOpportunityQualificationPatch(' segurado-1 ')).toEqual({ segurado_id: 'segurado-1' })
    expect(() => buildOpportunityQualificationPatch(' ')).toThrow('Selecione um segurado')
  })

  it('prioriza titulo, segurado e lead sem depender de nome legado', () => {
    expect(opportunityTitle(row, {})).toBe('Seguro do apartamento')
    expect(opportunityTitle({ ...row, titulo: null }, { segurado: { id: 's1', nome: 'Cliente cadastrado' } })).toBe('Cliente cadastrado')
    expect(opportunityTitle({ ...row, titulo: null }, {})).toBe('Maria Souza')
  })

  it('mapeia stage para pipeline e preserva apenas estimativas no card', () => {
    const card = mapOpportunityToKanbanCard(
      row,
      { ramo: { id: 'ramo-1', nome: 'Residencial' }, origem: { id: 'origem-1', nome: 'Indicação' } },
      stage,
    )
    expect(card).toMatchObject({
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
      status: 'pending',
      title: 'Seguro do apartamento',
      primaryValue: 1800,
      primaryValueLabel: 'Prêmio estimado',
    })
    expect(card.raw).not.toHaveProperty('metadata')
    expect(card.raw).not.toHaveProperty('seguradora_id')
  })

  it('deriva conclusao pelos fatos canonicos e limpa o fato oposto', () => {
    expect(deriveOpportunityStatus({ ...row, ganha_em: '2026-07-21T12:00:00Z' })).toBe('won')
    expect(deriveOpportunityStatus({ ...row, perdida_em: '2026-07-21T12:00:00Z' })).toBe('lost')
    expect(buildOpportunityConclusionPatch('won', '2026-07-21T12:00:00Z')).toEqual({
      ganha_em: '2026-07-21T12:00:00Z',
      perdida_em: null,
      motivo_perda_id: null,
      motivo_perda_observacao: null,
    })
  })
})
