import type { ProposalStatus } from '../types/proposta'

interface WorkflowPipeline {
  id: string
  entidade_tipo: string | null
  filial_id: string | null
  ativo: boolean | null
}

interface WorkflowStage {
  id: string
  pipeline_id: string
  nome: string | null
  cor: string | null
  ordem: number | null
  finaliza_com_sucesso: boolean | null
  finaliza_com_perda: boolean | null
  ativo: boolean | null
}

interface WorkflowDocument {
  id: string
  apolice_id: string
  tipo: string | null
  stage_id: string
  data_recusa: string | null
  motivo_recusa: string | null
}

interface WorkflowPolicy {
  id: string
  status: string | null
}

export interface ProposalWorkflowTables {
  activeBranchId: string | null
  pipelines: WorkflowPipeline[]
  stages: WorkflowStage[]
  documents: WorkflowDocument[]
  policies: WorkflowPolicy[]
}

export interface ProposalWorkflowStage {
  id: string
  name: ProposalStatus
  color: string
  order: number
  isSuccess: boolean
  isLoss: boolean
}

const stageStatus: Record<string, ProposalStatus> = {
  'Aguardando proposta': 'Pendente',
  'Em análise': 'Em Análise',
  Emitida: 'Proposta Emitida',
  Recusada: 'Recusada',
}

const statusStage: Partial<Record<ProposalStatus, string>> = {
  Pendente: 'Aguardando proposta',
  'Em Análise': 'Em análise',
  'Proposta Emitida': 'Emitida',
  Vigente: 'Emitida',
  Recusada: 'Recusada',
}

function activeProposalPipelines(tables: ProposalWorkflowTables): WorkflowPipeline[] {
  return tables.pipelines
    .filter((pipeline) =>
      pipeline.entidade_tipo === 'proposta' &&
      pipeline.ativo !== false &&
      (pipeline.filial_id === null || tables.activeBranchId === null || pipeline.filial_id === tables.activeBranchId),
    )
    .sort((a, b) => {
      const aCurrent = tables.activeBranchId !== null && a.filial_id === tables.activeBranchId
      const bCurrent = tables.activeBranchId !== null && b.filial_id === tables.activeBranchId
      return Number(bCurrent) - Number(aCurrent)
    })
}

function findStageByName(tables: ProposalWorkflowTables, name: string): WorkflowStage | undefined {
  for (const pipeline of activeProposalPipelines(tables)) {
    const stage = tables.stages.find((item) =>
      item.nome === name &&
      item.ativo !== false &&
      item.pipeline_id === pipeline.id,
    )
    if (stage) return stage
  }
  return undefined
}

export function proposalStatusFromStageName(name: string | null | undefined): ProposalStatus {
  return name ? stageStatus[name] ?? 'Pendente' : 'Pendente'
}

export function getProposalWorkflowStages(tables: ProposalWorkflowTables): ProposalWorkflowStage[] {
  const stagesByStatus = new Map<ProposalStatus, ProposalWorkflowStage>()
  for (const pipeline of activeProposalPipelines(tables)) {
    for (const stage of tables.stages.filter((item) => item.ativo !== false && item.pipeline_id === pipeline.id)) {
      const name = proposalStatusFromStageName(stage.nome)
      if (stagesByStatus.has(name)) continue
      stagesByStatus.set(name, {
        id: stage.id,
        name,
        color: stage.cor ?? 'bg-slate-400',
        order: stage.ordem ?? 0,
        isSuccess: stage.finaliza_com_sucesso === true,
        isLoss: stage.finaliza_com_perda === true,
      })
    }
  }
  return Array.from(stagesByStatus.values()).sort((a, b) => a.order - b.order)
}

export function moveProposalToStatus(
  tables: ProposalWorkflowTables,
  documentId: string,
  status: ProposalStatus,
): boolean {
  const stageName = statusStage[status]
  if (!stageName || status === 'Recusada') return false
  const stage = findStageByName(tables, stageName)
  const document = tables.documents.find((item) => item.id === documentId)
  if (!stage || !document) return false
  document.stage_id = stage.id
  return true
}

export function refuseProposalDocument(
  tables: ProposalWorkflowTables,
  documentId: string,
  options: { reason?: string; refusedAt?: string } = {},
): { changed: boolean; policyRefused: boolean } {
  const proposalPipelineIds = new Set(activeProposalPipelines(tables).map((pipeline) => pipeline.id))
  const refusedStage = findStageByName(tables, 'Recusada')
    ?? tables.stages.find((stage) =>
      stage.finaliza_com_perda === true &&
      stage.ativo !== false &&
      proposalPipelineIds.has(stage.pipeline_id),
    )
  const document = tables.documents.find((item) => item.id === documentId)
  const policy = document
    ? tables.policies.find((item) => item.id === document.apolice_id)
    : undefined
  if (!refusedStage || !document || !policy) return { changed: false, policyRefused: false }

  document.stage_id = refusedStage.id
  document.data_recusa = options.refusedAt ?? new Date().toISOString().slice(0, 10)
  document.motivo_recusa = options.reason?.trim() || null

  const refusesPolicy =
    (document.tipo === 'NOVA' || document.tipo === 'RENOVACAO') &&
    policy.status === 'EM_EMISSAO'
  if (refusesPolicy) policy.status = 'RECUSADA'

  return { changed: true, policyRefused: refusesPolicy }
}
