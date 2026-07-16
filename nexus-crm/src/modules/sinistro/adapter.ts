import { MOCK_TENANT_ID, MOCK_USER_ID } from '../../lib/inMemoryDb'
import { supabase } from '../../lib/supabase'
import type {
  Database,
  SinistroRow,
  SinistroStatus,
} from '../../types/database'
import type { CardStatus, KanbanCard, ModuleAdapter } from '../types'
import { SinistroCard } from './Card'

type SeguradoCard = Pick<Database['public']['Tables']['segurados']['Row'], 'id' | 'nome' | 'filial_id'>
type LookupCard = { id: string; nome: string }
type ProfileCard = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name' | 'avatar_url'>

type SinistroCardRow = SinistroRow & {
  apolices: {
    id: string
    numero_apolice: string | null
    segurados: SeguradoCard | null
    ramos: LookupCard | null
    seguradoras: LookupCard | null
  } | null
  profiles: ProfileCard | null
}

export function sinistroStatusToCardStatus(status: SinistroStatus | null): CardStatus {
  if (status === 'encerrado_com_indenizacao') return 'won'
  if (status === 'encerrado_sem_indenizacao' || status === 'cancelado') return 'lost'
  return 'pending'
}

function statusLabel(status: SinistroStatus | null): string {
  const labels: Record<SinistroStatus, string> = {
    aberto: 'Aberto',
    encerrado_sem_indenizacao: 'Encerrado sem indenização',
    encerrado_com_indenizacao: 'Encerrado com indenização',
    reaberto: 'Reaberto',
    cancelado: 'Cancelado',
  }
  return status ? labels[status] : 'Aberto'
}

function statusTone(status: SinistroStatus | null): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'encerrado_com_indenizacao') return 'success'
  if (status === 'encerrado_sem_indenizacao' || status === 'cancelado') return 'danger'
  if (status === 'reaberto') return 'warning'
  return 'info'
}

export function mapSinistroToKanbanCard(row: SinistroCardRow, pipelineId: string): KanbanCard {
  const apolice = row.apolices
  const valorIndenizado = row.valor_indenizado == null ? null : Number(row.valor_indenizado)
  const valorEstimado = row.valor_estimado == null ? null : Number(row.valor_estimado)

  return {
    id: row.id,
    pipelineId,
    stageId: row.stage_id,
    status: sinistroStatusToCardStatus(row.status),
    title: apolice?.segurados?.nome ?? row.numero_sinistro ?? 'Sinistro',
    subtitle: row.numero_sinistro
      ? `Sinistro ${row.numero_sinistro}`
      : row.numero_aviso
        ? `Aviso ${row.numero_aviso}`
        : 'Aviso sem número',
    responsavelId: row.responsavel_id,
    responsavelName: row.profiles?.full_name ?? undefined,
    responsavelAvatar: row.profiles?.avatar_url ?? undefined,
    primaryValue: valorIndenizado ?? valorEstimado,
    primaryValueLabel: valorIndenizado != null ? 'Indenizado' : 'Estimado',
    dueDate: row.data_ocorrencia,
    tags: [
      apolice?.ramos?.nome ? { label: apolice.ramos.nome, tone: 'default' as const } : null,
      apolice?.seguradoras?.nome ? { label: apolice.seguradoras.nome, tone: 'info' as const } : null,
      { label: statusLabel(row.status), tone: statusTone(row.status) },
    ].filter((tag): tag is NonNullable<typeof tag> => tag != null),
    concludedAt: row.data_conclusao,
    raw: {
      ...row,
      ramos: apolice?.ramos ?? null,
    },
  }
}

async function updateSinistroStageWithAudit(cardId: string, toStageId: string): Promise<void> {
  const currentResult = await supabase
    .from('sinistros')
    .select('id, stage_id')
    .eq('id', cardId)
    .single()
  if (currentResult.error) throw currentResult.error

  const current = currentResult.data as unknown as Pick<SinistroRow, 'id' | 'stage_id'>
  if (current.stage_id === toStageId) return

  const updateResult = await supabase
    .from('sinistros')
    .update({ stage_id: toStageId })
    .eq('id', cardId)
  if (updateResult.error) throw updateResult.error

  const auditResult = await supabase.from('audit_logs').insert({
    tenant_id: MOCK_TENANT_ID,
    user_id: MOCK_USER_ID,
    entidade_tipo: 'sinistro',
    entidade_id: cardId,
    campo: 'stage_id',
    valor_antigo: current.stage_id,
    valor_novo: toStageId,
    acao: 'UPDATE',
    ocorrido_em: new Date().toISOString(),
    origem: 'FRONT_MOCK',
    ip: null,
    user_agent: 'WassisCRM mock',
  })

  if (auditResult.error) {
    await supabase.from('sinistros').update({ stage_id: current.stage_id }).eq('id', cardId)
    throw auditResult.error
  }
}

/**
 * Adapter contratual de Sinistros. O pipeline nao e persistido no registro:
 * os cards sao selecionados pelas etapas pertencentes ao funil ativo.
 */
export const sinistroAdapter: ModuleAdapter = {
  module: 'sinistro',

  async fetchCards({ pipelineId, includeConcluded, filialId }) {
    const stagesResult = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipelineId)
      .eq('ativo', true)
    if (stagesResult.error) throw stagesResult.error

    const stageIds = ((stagesResult.data ?? []) as Array<{ id: string }>).map((stage) => stage.id)
    if (stageIds.length === 0) return []

    const cardsResult = await supabase
      .from('sinistros')
      .select(`
        *,
        apolices:apolice_id (
          id,
          numero_apolice,
          segurados:segurado_id ( id, nome, filial_id ),
          ramos:ramo_id ( id, nome ),
          seguradoras:seguradora_id ( id, nome )
        ),
        profiles:responsavel_id ( id, full_name, avatar_url )
      `)
      .in('stage_id', stageIds)
      .order('data_ocorrencia', { ascending: false, nullsFirst: false })
    if (cardsResult.error) throw cardsResult.error

    return ((cardsResult.data ?? []) as unknown as SinistroCardRow[])
      .filter((row) => !filialId || row.apolices?.segurados?.filial_id === filialId)
      .map((row) => mapSinistroToKanbanCard(row, pipelineId))
      .filter((card) => includeConcluded || card.status === 'pending')
  },

  async updateStage({ cardId, toStageId }) {
    await updateSinistroStageWithAudit(cardId, toStageId)
  },

  async conclude() {
    throw new Error('A conclusao contratual de Sinistro sera disponibilizada no recorte 4.1c.')
  },

  CardComponent: SinistroCard,
  availableFilters: ['search', 'ramo', 'produtor'],
  createRoute: (pipelineId) => `/sinistros/novo?pipeline=${encodeURIComponent(pipelineId)}`,
  createLabel: 'Novo Sinistro',
  detailRoute: (id) => `/sinistros/${id}`,
}
