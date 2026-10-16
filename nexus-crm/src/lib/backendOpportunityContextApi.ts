import { requestAuthenticatedBackendJson } from './backendApi'
import { isCalculationId } from './calculationHttpContracts'
import type { Database } from '../types/database'

type OpportunityRow = Database['public']['Tables']['oportunidades']['Row']
type ReferenceLabel = { id: string; nome: string | null }
type BranchLabel = Pick<Database['public']['Tables']['ramos']['Row'], 'id' | 'nome' | 'risk_type' | 'grupo_operacional' | 'forma_calculo'>
type StageLabel = Database['public']['Tables']['pipeline_stages']['Row']
export type OpportunityContextReferences = Pick<OpportunityRow, 'id' | 'ramo_id' | 'origem_id' | 'motivo_perda_id' | 'stage_id'>
export type BackendOpportunityReadContext = {
  opportunityId: string; insuranceBranch: BranchLabel | null; origin: ReferenceLabel | null
  lossReason: ReferenceLabel | null; stage: StageLabel | null
}

const failure = () => new Error('O backend retornou referências comerciais incompatíveis com a oportunidade.')
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw failure()
  return value as Record<string, unknown>
}
function id(value: unknown): string {
  if (!isCalculationId(value)) throw failure()
  return (value as string).toLowerCase()
}
function text(value: unknown): string | null {
  if (value !== null && typeof value !== 'string') throw failure()
  return value as string | null
}
function flag(value: unknown): boolean | null {
  if (value !== null && typeof value !== 'boolean') throw failure()
  return value as boolean | null
}
function number(value: unknown, whole = false): number | null {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || whole && !Number.isSafeInteger(value))) throw failure()
  return value as number | null
}
function optional<T>(value: unknown, decode: (value: unknown) => T): T | null { return value === null ? null : decode(value) }
function label(value: unknown): ReferenceLabel {
  const row = record(value)
  return { id: id(row.id), nome: text(row.nome) }
}
function branch(value: unknown): BranchLabel {
  const row = record(value)
  return { ...label(row), risk_type: text(row.risk_type), grupo_operacional: text(row.grupo_operacional), forma_calculo: text(row.forma_calculo) }
}
function stage(value: unknown): StageLabel {
  const row = record(value)
  return {
    ...label(row), pipeline_id: id(row.pipeline_id), codigo: text(row.codigo), tipo_stage: text(row.tipo_stage), cor: text(row.cor),
    ordem: number(row.ordem, true), probabilidade: number(row.probabilidade), sla_dias: number(row.sla_dias, true),
    finaliza_com_sucesso: flag(row.finaliza_com_sucesso), finaliza_com_perda: flag(row.finaliza_com_perda), ativo: flag(row.ativo),
  }
}
function matches(label: ReferenceLabel | null, reference: string | null) { return !label || label.id === reference?.toLowerCase() }

export async function getBackendOpportunityReadContext(opportunity: OpportunityContextReferences, signal?: AbortSignal): Promise<BackendOpportunityReadContext> {
  const opportunityId = id(opportunity.id)
  const raw = record(await requestAuthenticatedBackendJson<unknown>(`/api/oportunidades/${opportunityId}/contexto-comercial`, { signal }))
  const result: BackendOpportunityReadContext = {
    opportunityId: id(raw.opportunityId), insuranceBranch: optional(raw.insuranceBranch, branch),
    origin: optional(raw.origin, label), lossReason: optional(raw.lossReason, label), stage: optional(raw.stage, stage),
  }
  if (result.opportunityId !== opportunityId || !matches(result.insuranceBranch, opportunity.ramo_id)
    || !matches(result.origin, opportunity.origem_id) || !matches(result.lossReason, opportunity.motivo_perda_id)
    || !matches(result.stage, opportunity.stage_id)) throw failure()
  return result
}
