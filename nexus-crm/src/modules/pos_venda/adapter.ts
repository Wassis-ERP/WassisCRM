import { MOCK_TENANT_ID, MOCK_USER_ID, movePosVendaStageInMemory } from '../../lib/inMemoryDb'
import { supabase } from '../../lib/supabase'
import type { Database, PosVendaRow } from '../../types/database'
import type { KanbanCard, ModuleAdapter } from '../types'
import { PosVendaCard } from './Card'

type SeguradoCard = Pick<Database['public']['Tables']['segurados']['Row'], 'id' | 'nome' | 'filial_id'>
type LookupCard = { id: string; nome: string }
type ProfileCard = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name' | 'avatar_url'>

type PosVendaCardRow = PosVendaRow & {
  apolices: {
    id: string
    numero_apolice: string | null
    premio_total: number | null
    vigencia_fim: string | null
    segurados: SeguradoCard | null
    ramos: LookupCard | null
    seguradoras: LookupCard | null
  } | null
  profiles: ProfileCard | null
}

export function mapPosVendaToKanbanCard(row: PosVendaCardRow, pipelineId: string): KanbanCard {
  const apolice = row.apolices
  return {
    id: row.id,
    pipelineId,
    stageId: row.stage_id,
    status: 'pending',
    title: apolice?.segurados?.nome ?? row.assunto ?? 'Pós-venda',
    subtitle: row.assunto ?? (apolice?.numero_apolice ? `Apólice ${apolice.numero_apolice}` : 'Apólice vinculada'),
    responsavelId: row.responsavel_id,
    responsavelName: row.profiles?.full_name ?? undefined,
    responsavelAvatar: row.profiles?.avatar_url ?? undefined,
    primaryValue: apolice?.premio_total == null ? null : Number(apolice.premio_total),
    primaryValueLabel: 'Prêmio',
    dueDate: row.data_conclusao_prevista ?? apolice?.vigencia_fim ?? null,
    tags: [
      apolice?.ramos?.nome ? { label: apolice.ramos.nome, tone: 'default' as const } : null,
      apolice?.seguradoras?.nome ? { label: apolice.seguradoras.nome, tone: 'info' as const } : null,
      row.prioridade ? { label: row.prioridade, tone: row.prioridade === 'alta' ? 'warning' as const : 'info' as const } : null,
    ].filter((tag): tag is NonNullable<typeof tag> => tag != null),
    concludedAt: row.data_conclusao,
    raw: { ...row, ramos: apolice?.ramos ?? null },
  }
}

export const posVendaAdapter: ModuleAdapter = {
  module: 'pos_venda',

  async fetchCards({ pipelineId, filialId }) {
    const stagesResult = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipelineId)
      .eq('ativo', true)
    if (stagesResult.error) throw stagesResult.error
    const stageIds = ((stagesResult.data ?? []) as Array<{ id: string }>).map((stage) => stage.id)
    if (stageIds.length === 0) return []

    const cardsResult = await supabase
      .from('pos_vendas')
      .select(`
        *,
        apolices:apolice_id (
          id,
          numero_apolice,
          premio_total,
          vigencia_fim,
          segurados:segurado_id ( id, nome, filial_id ),
          ramos:ramo_id ( id, nome ),
          seguradoras:seguradora_id ( id, nome )
        ),
        profiles:responsavel_id ( id, full_name, avatar_url )
      `)
      .in('stage_id', stageIds)
      .order('data_conclusao_prevista', { ascending: true, nullsFirst: false })
    if (cardsResult.error) throw cardsResult.error

    return ((cardsResult.data ?? []) as unknown as PosVendaCardRow[])
      .filter((row) => !filialId || row.apolices?.segurados?.filial_id === filialId)
      .map((row) => mapPosVendaToKanbanCard(row, pipelineId))
  },

  async updateStage({ cardId, toStageId }) {
    movePosVendaStageInMemory(
      { id: cardId, toStageId },
      { tenantId: MOCK_TENANT_ID, sessionUserId: MOCK_USER_ID },
    )
  },

  async conclude() {
    throw new Error('O contrato v2.4 não define transições de status para Pós-venda.')
  },

  CardComponent: PosVendaCard,
  availableFilters: ['search', 'ramo', 'dataRetorno', 'dataVigencia'],
  createRoute: (pipelineId) => `/pos-venda/novo?pipeline=${encodeURIComponent(pipelineId)}`,
  createLabel: 'Novo Pós-venda',
  detailRoute: (id) => `/pos-venda/${id}`,
}
