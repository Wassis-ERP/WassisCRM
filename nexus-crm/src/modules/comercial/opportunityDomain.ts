import type { Database } from '../../types/database'
import type { KanbanCard, PipelineStageRow } from '../types'

export type OpportunityRow = Database['public']['Tables']['oportunidades']['Row']
export type OpportunityInsert = Database['public']['Tables']['oportunidades']['Insert']
export type OpportunityUpdate = Database['public']['Tables']['oportunidades']['Update']

export interface OpportunityCreateInput {
  stageId: string
  seguradoId?: string | null
  apoliceOrigemId?: string | null
  ramoId?: string | null
  origemId?: string | null
  titulo?: string | null
  descricao?: string | null
  prioridade?: string | null
  leadNome?: string | null
  leadDocumento?: string | null
  leadEmail?: string | null
  leadTelefone?: string | null
  dataFechamentoPrevista?: string | null
  campanha?: string | null
}

export interface OpportunityCreateContext {
  tenantId: string
  filialId: string
  responsavelId: string | null
  dataAbertura: string
}

export interface OpportunityJoin {
  segurado?: { id: string; nome: string; cpf_cnpj?: string | null; telefone?: string | null; email?: string | null } | null
  ramo?: { id: string; nome: string; risk_type?: string | null; grupo_operacional?: string | null; forma_calculo?: string | null } | null
  origem?: { id: string; nome: string } | null
  motivoPerda?: { id: string; nome: string } | null
  responsavel?: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export type OpportunityViewStatus = 'pending' | 'won' | 'lost'

export function deriveOpportunityStatus(row: OpportunityRow): OpportunityViewStatus {
  if (row.ganha_em) return 'won'
  if (row.perdida_em) return 'lost'
  return 'pending'
}

const textOrNull = (value?: string | null) => value?.trim() || null

export function buildOpportunityInsert(
  input: OpportunityCreateInput,
  context: OpportunityCreateContext,
): OpportunityInsert {
  if (!input.seguradoId && !textOrNull(input.leadNome)) {
    throw new Error('Informe o nome do lead ou selecione um segurado')
  }
  return {
    tenant_id: context.tenantId,
    filial_id: context.filialId,
    stage_id: input.stageId,
    responsavel_id: context.responsavelId,
    segurado_id: input.seguradoId ?? null,
    apolice_origem_id: input.apoliceOrigemId ?? null,
    ramo_id: input.ramoId ?? null,
    origem_id: input.origemId ?? null,
    motivo_perda_id: null,
    lead_nome: input.seguradoId ? null : textOrNull(input.leadNome),
    lead_documento: input.seguradoId ? null : textOrNull(input.leadDocumento)?.replace(/\D+/g, '') ?? null,
    lead_email: input.seguradoId ? null : textOrNull(input.leadEmail),
    lead_telefone: input.seguradoId ? null : textOrNull(input.leadTelefone),
    titulo: textOrNull(input.titulo),
    descricao: textOrNull(input.descricao),
    prioridade: textOrNull(input.prioridade),
    valor_premio_estimado: null,
    valor_comissao_estimada: null,
    comissao_estimada_pct: null,
    agenciamento_pct: null,
    data_abertura: context.dataAbertura,
    data_fechamento_prevista: input.dataFechamentoPrevista ?? null,
    ganha_em: null,
    perdida_em: null,
    motivo_perda_observacao: null,
    campanha: textOrNull(input.campanha),
    observacoes: null,
  }
}

export function buildOpportunityQualificationPatch(seguradoId: string): OpportunityUpdate {
  const normalized = seguradoId.trim()
  if (!normalized) throw new Error('Selecione um segurado para qualificar o lead')
  return { segurado_id: normalized }
}

export function opportunityTitle(row: OpportunityRow, join: OpportunityJoin): string {
  return row.titulo?.trim() || join.segurado?.nome?.trim() || row.lead_nome?.trim() || 'Oportunidade'
}

export function opportunityCustomerLabel(row: OpportunityRow, join: OpportunityJoin): string {
  return join.segurado?.nome?.trim() || row.lead_nome?.trim() || 'Lead sem nome'
}

export function pipelineIdFromStage(stage: PipelineStageRow | undefined): string | null {
  return stage?.pipeline_id ?? null
}

export function mapOpportunityToKanbanCard(
  row: OpportunityRow,
  join: OpportunityJoin,
  stage: PipelineStageRow | undefined,
): KanbanCard {
  const status = deriveOpportunityStatus(row)
  const title = opportunityTitle(row, join)
  const customer = opportunityCustomerLabel(row, join)
  const ramo = join.ramo?.nome?.trim()
  const origem = join.origem?.nome?.trim()

  return {
    id: row.id,
    pipelineId: pipelineIdFromStage(stage),
    stageId: row.stage_id,
    status,
    title,
    subtitle: customer !== title ? customer : ramo ?? undefined,
    responsavelId: row.responsavel_id,
    responsavelName: join.responsavel?.full_name ?? undefined,
    responsavelAvatar: join.responsavel?.avatar_url ?? undefined,
    primaryValue: row.valor_premio_estimado,
    primaryValueLabel: 'Prêmio estimado',
    dueDate: row.data_fechamento_prevista,
    tags: [
      ramo ? { label: ramo, tone: 'default' as const } : null,
      { label: row.segurado_id ? 'Segurado' : 'Lead', tone: row.segurado_id ? 'success' as const : 'warning' as const },
      row.prioridade ? { label: row.prioridade, tone: 'info' as const } : null,
      origem ? { label: origem, tone: 'default' as const } : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null),
    concludedAt: row.ganha_em ?? row.perdida_em,
    raw: {
      ...row,
      segurados: join.segurado ?? null,
      ramos: join.ramo ?? null,
      origens: join.origem ?? null,
      motivos_perda: join.motivoPerda ?? null,
      profiles: join.responsavel ?? null,
      pipeline_stage: stage ?? null,
    },
  }
}

export function buildOpportunityConclusionPatch(
  status: Exclude<OpportunityViewStatus, 'pending'>,
  now: string,
  motivoPerdaId?: string | null,
  observacao?: string,
): OpportunityUpdate {
  if (status === 'won') {
    return {
      ganha_em: now,
      perdida_em: null,
      motivo_perda_id: null,
      motivo_perda_observacao: null,
    }
  }
  return {
    ganha_em: null,
    perdida_em: now,
    motivo_perda_id: motivoPerdaId ?? null,
    motivo_perda_observacao: observacao?.trim() || null,
  }
}

export function buildOpportunityReopenPatch(): OpportunityUpdate {
  return {
    ganha_em: null,
    perdida_em: null,
    motivo_perda_id: null,
    motivo_perda_observacao: null,
  }
}
