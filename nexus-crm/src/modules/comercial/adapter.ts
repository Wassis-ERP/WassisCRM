import { listBackendInsuredPeople, listBackendOpportunities, updateBackendOpportunity, usesBackendDomainData } from '../../lib/backendDomainApi'
import { getTable } from '../../lib/inMemoryDb'
import { supabase } from '../../lib/supabase'
import { genericUpdateStage } from '../shared'
import { normalizePipelineStageRow, type ModuleAdapter, type PipelineStageDbRow } from '../types'
import { ComercialCard } from './Card'
import {
  buildOpportunityConclusionPatch,
  mapOpportunityToKanbanCard,
  type OpportunityJoin,
  type OpportunityRow,
} from './opportunityDomain'

type OpportunitySelectRow = OpportunityRow & {
  segurados?: OpportunityJoin['segurado']
  ramos?: OpportunityJoin['ramo']
  origens?: OpportunityJoin['origem']
  motivos_perda?: OpportunityJoin['motivoPerda']
}

/** Adapter comercial reconciliado: pipeline deriva da etapa e status deriva dos fatos de conclusão. */
export const comercialAdapter: ModuleAdapter = {
  module: 'comercial',

  async fetchCards({ pipelineId, tenantId, includeConcluded, filialId }) {
    const [stagesResult, profilesResult] = await Promise.all([
      supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .eq('ativo', true)
        .order('ordem', { ascending: true }),
      supabase.from('profiles').select('id, nome_completo, avatar_url'),
    ])
    if (stagesResult.error) throw stagesResult.error
    if (profilesResult.error) throw profilesResult.error

    const stages = ((stagesResult.data ?? []) as PipelineStageDbRow[]).map(normalizePipelineStageRow)
    const stageById = new Map(stages.map((stage) => [stage.id, stage]))
    const profileById = new Map(
      ((profilesResult.data ?? []) as Array<{ id: string; nome_completo: string | null; avatar_url: string | null }>).map(
        (profile) => [profile.id, profile],
      ),
    )

    if (usesBackendDomainData) {
      const [opportunities, insuredPeople] = await Promise.all([
        listBackendOpportunities({ pipelineId, status: includeConcluded ? null : 'pending', officeBranchId: filialId }, tenantId),
        listBackendInsuredPeople(tenantId, filialId),
      ])
      const insuredById = new Map(insuredPeople.map(row => [row.id, row]))
      const lookup = <T,>(table: string, id: string | null): T | null =>
        (getTable(table).find(row => row.id === id) as T | undefined) ?? null
      return opportunities.map(row => mapOpportunityToKanbanCard(row, {
        segurado: row.segurado_id ? insuredById.get(row.segurado_id) ?? null : null,
        ramo: lookup<OpportunityJoin['ramo']>('ramos', row.ramo_id),
        origem: lookup<OpportunityJoin['origem']>('origens', row.origem_id),
        motivoPerda: lookup<OpportunityJoin['motivoPerda']>('motivos_perda', row.motivo_perda_id),
        responsavel: row.responsavel_id ? profileById.get(row.responsavel_id) ?? null : null,
      }, stageById.get(row.stage_id)))
        .map(card => ({ ...card, pipelineId: card.pipelineId ?? pipelineId }))
        .filter(card => includeConcluded || card.status === 'pending')
    }

    let builder = supabase
      .from('oportunidades')
      .select(`
        *,
        segurados:segurado_id ( id, nome, cpf_cnpj, telefone, email ),
        ramos:ramo_id ( id, nome, risk_type, grupo_operacional, forma_calculo ),
        origens:origem_id ( id, nome ),
        motivos_perda:motivo_perda_id ( id, nome )
      `)

    if (filialId) builder = builder.eq('filial_id', filialId)

    const { data, error } = await builder.order('data_abertura', { ascending: false })
    if (error) throw error

    return ((data ?? []) as unknown as OpportunitySelectRow[])
      .filter((row) => stageById.has(row.stage_id))
      .map((row) => mapOpportunityToKanbanCard(
        row,
        {
          segurado: row.segurados ?? null,
          ramo: row.ramos ?? null,
          origem: row.origens ?? null,
          motivoPerda: row.motivos_perda ?? null,
          responsavel: row.responsavel_id ? profileById.get(row.responsavel_id) ?? null : null,
        },
        stageById.get(row.stage_id),
      ))
      .filter((card) => includeConcluded || card.status === 'pending')
  },

  async updateStage(args) {
    await genericUpdateStage('comercial', args.cardId, args.toStageId)
  },

  async conclude(args) {
    const patch = buildOpportunityConclusionPatch(
      args.payload.status,
      new Date().toISOString(),
      args.payload.motivoPerdaId,
      args.payload.observacao,
    )
    if (usesBackendDomainData) {
      await updateBackendOpportunity(args.cardId, patch, null)
      return
    }
    const { error } = await supabase.from('oportunidades').update(patch).eq('id', args.cardId)
    if (error) throw error
  },

  CardComponent: ComercialCard,
  availableFilters: ['search', 'ramo', 'origem', 'produtor'],
}
