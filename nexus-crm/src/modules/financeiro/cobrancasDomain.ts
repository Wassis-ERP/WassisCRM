import { getTable, MOCK_TENANT_ID, MOCK_USER_ID, newId, nowIso } from '../../lib/inMemoryDb'
import type {
  CobrancaCanal,
  CobrancaPrioridade,
  CobrancaStatus,
  Database,
  FinanceiroCobrancaRow,
} from '../../types/database'
import { listFinanceiroParcelas, parcelaStatusEfetivo, type FinanceiroParcela } from './parcelasDomain'

type StageRow = Database['public']['Tables']['pipeline_stages']['Row']
type PipelineRow = Database['public']['Tables']['pipelines']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type AuditInsert = Database['public']['Tables']['audit_logs']['Insert'] & { id: string }

export interface CobrancaDetalhe extends FinanceiroCobrancaRow {
  parcela: FinanceiroParcela
  etapaNome: string
  pipelineId: string
  pipelineNome: string
  responsavelNome: string | null
  responsavelAvatar: string | null
}

export interface CreateCobrancaInput {
  parcelaId: string
  stageId: string
  responsavelId?: string | null
  prioridade?: CobrancaPrioridade | null
  vencimentoFollowup?: string | null
  ultimaCobrancaEm?: string | null
  proximaCobrancaEm?: string | null
  canalPreferencial?: CobrancaCanal | null
  observacoes?: string | null
}

export interface CobrancaMaintenanceInput {
  id: string
  patch: Partial<Pick<FinanceiroCobrancaRow,
    'responsavel_id' | 'prioridade' | 'vencimento_followup' |
    'ultima_cobranca_em' | 'proxima_cobranca_em' | 'canal_preferencial' | 'observacoes'>>
}

export interface CobrancaCommandResult {
  row: FinanceiroCobrancaRow
  changedFields: number
}

const typedRows = <T,>(table: string): T[] => getTable(table) as unknown as T[]
const serialize = (value: unknown): string | null => value == null ? null : typeof value === 'string' ? value : JSON.stringify(value)

function audit(cobrancaId: string, campo: string | null, previous: unknown, next: unknown, action: string): void {
  typedRows<AuditInsert>('audit_logs').push({
    id: newId(), tenant_id: MOCK_TENANT_ID, user_id: MOCK_USER_ID,
    entidade_tipo: 'cobranca', entidade_id: cobrancaId, campo,
    valor_antigo: serialize(previous), valor_novo: serialize(next), acao: action,
    ocorrido_em: nowIso(), origem: 'FRONT_MOCK', ip: null,
    user_agent: `WassisCRM frontend puro · ${action}`,
  })
}

function findStage(stageId: string): { stage: StageRow; pipeline: PipelineRow } {
  const stage = typedRows<StageRow>('pipeline_stages').find((row) => row.id === stageId)
  const pipeline = stage
    ? typedRows<PipelineRow>('pipelines').find((row) => row.id === stage.pipeline_id)
    : undefined
  if (!stage || !pipeline || pipeline.entidade_tipo !== 'cobranca') {
    throw new Error('Selecione uma etapa válida do pipeline de Cobranças.')
  }
  return { stage, pipeline }
}

function ensureBranch(parcela: FinanceiroParcela, branchIds?: readonly string[] | null): void {
  if (branchIds && !branchIds.includes(parcela.filialId)) {
    throw new Error('A parcela não pertence a uma corretora acessível nesta sessão.')
  }
}

function findSource(parcelaId: string, branchIds?: readonly string[] | null): FinanceiroParcela {
  const parcela = listFinanceiroParcelas(branchIds).find((row) => row.id === parcelaId)
  if (!parcela) throw new Error('Parcela não encontrada ou sem permissão de acesso.')
  ensureBranch(parcela, branchIds)
  return parcela
}

export function listFinanceiroCobrancas(branchIds?: readonly string[] | null): CobrancaDetalhe[] {
  const parcelas = listFinanceiroParcelas(branchIds)
  const stages = typedRows<StageRow>('pipeline_stages')
  const pipelines = typedRows<PipelineRow>('pipelines')
  const profiles = typedRows<ProfileRow>('profiles')

  return typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas').flatMap((row): CobrancaDetalhe[] => {
    const parcela = parcelas.find((item) => item.id === row.parcela_id)
    const stage = stages.find((item) => item.id === row.stage_id)
    const pipeline = stage ? pipelines.find((item) => item.id === stage.pipeline_id) : undefined
    if (!parcela || !stage || !pipeline || pipeline.entidade_tipo !== 'cobranca') return []
    const profile = row.responsavel_id ? profiles.find((item) => item.id === row.responsavel_id) : undefined
    return [{
      ...row,
      parcela,
      etapaNome: stage.nome,
      pipelineId: pipeline.id,
      pipelineNome: pipeline.nome,
      responsavelNome: profile?.full_name ?? null,
      responsavelAvatar: profile?.avatar_url ?? null,
    }]
  }).sort((a, b) => (a.proxima_cobranca_em ?? a.vencimento_followup ?? '').localeCompare(b.proxima_cobranca_em ?? b.vencimento_followup ?? ''))
}

export function getFinanceiroCobranca(id: string, branchIds?: readonly string[] | null): CobrancaDetalhe | null {
  return listFinanceiroCobrancas(branchIds).find((row) => row.id === id) ?? null
}

export function listParcelasElegiveisCobranca(branchIds?: readonly string[] | null): FinanceiroParcela[] {
  const activeIds = new Set(
    typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas')
      .filter((row) => row.status === 'ATIVA')
      .map((row) => row.parcela_id),
  )
  return listFinanceiroParcelas(branchIds).filter((row) => row.statusEfetivo === 'vencida' && !activeIds.has(row.id))
}

export function listCobrancaResponsaveis(): Array<Pick<ProfileRow, 'id' | 'full_name' | 'email' | 'avatar_url'>> {
  return typedRows<ProfileRow>('profiles')
    .map(({ id, full_name, email, avatar_url }) => ({ id, full_name, email, avatar_url }))
    .sort((a, b) => (a.full_name ?? a.email ?? '').localeCompare(b.full_name ?? b.email ?? '', 'pt-BR'))
}

export function createFinanceiroCobranca(input: CreateCobrancaInput, branchIds?: readonly string[] | null): FinanceiroCobrancaRow {
  const parcela = findSource(input.parcelaId, branchIds)
  if (parcela.statusEfetivo !== 'vencida') throw new Error('A cobrança só pode ser aberta para parcela efetivamente vencida.')
  if (typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas').some((row) => row.parcela_id === parcela.id && row.status === 'ATIVA')) {
    throw new Error('Esta parcela já possui uma cobrança ativa.')
  }
  findStage(input.stageId)
  const row: FinanceiroCobrancaRow = {
    id: newId(), parcela_id: parcela.id, stage_id: input.stageId,
    responsavel_id: input.responsavelId ?? MOCK_USER_ID,
    data_abertura: nowIso().slice(0, 10), vencimento_followup: input.vencimentoFollowup ?? null,
    status: 'ATIVA', prioridade: input.prioridade ?? 'MEDIA',
    ultima_cobranca_em: input.ultimaCobrancaEm ?? null,
    proxima_cobranca_em: input.proximaCobrancaEm ?? null,
    canal_preferencial: input.canalPreferencial ?? 'WHATSAPP',
    observacoes: input.observacoes?.trim() || null,
    encerrada_em: null, motivo_encerramento: null,
  }
  const table = typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas')
  const audits = typedRows<AuditInsert>('audit_logs')
  const auditLength = audits.length
  try {
    table.push(row)
    audit(row.id, null, null, row, 'ABRIR_COBRANCA')
    return row
  } catch (error) {
    table.splice(table.findIndex((item) => item.id === row.id), 1)
    audits.splice(auditLength)
    throw error
  }
}

export function maintainFinanceiroCobranca(input: CobrancaMaintenanceInput): CobrancaCommandResult {
  const row = typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas').find((item) => item.id === input.id)
  if (!row) throw new Error('Cobrança não encontrada.')
  if (row.status !== 'ATIVA') throw new Error('Somente cobranças ativas podem ser editadas.')
  const previous = { ...row }
  const audits = typedRows<AuditInsert>('audit_logs')
  const auditLength = audits.length
  const changes = Object.entries(input.patch).filter(([key, value]) => previous[key as keyof FinanceiroCobrancaRow] !== value)
  try {
    changes.forEach(([key, value]) => {
      const field = key as keyof FinanceiroCobrancaRow
      const oldValue = row[field]
      Object.assign(row, { [field]: typeof value === 'string' && value.trim() === '' ? null : value })
      audit(row.id, key, oldValue, row[field], 'ATUALIZAR_COBRANCA')
    })
    return { row, changedFields: changes.length }
  } catch (error) {
    Object.assign(row, previous)
    audits.splice(auditLength)
    throw error
  }
}

export function moveFinanceiroCobrancaStage(id: string, toStageId: string): CobrancaCommandResult {
  const row = typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas').find((item) => item.id === id)
  if (!row) throw new Error('Cobrança não encontrada.')
  if (row.status !== 'ATIVA') throw new Error('Cobrança encerrada não pode mudar de etapa.')
  const current = findStage(row.stage_id)
  const target = findStage(toStageId)
  if (current.pipeline.id !== target.pipeline.id) throw new Error('A etapa de destino pertence a outro pipeline.')
  if (row.stage_id === toStageId) return { row, changedFields: 0 }
  const previous = row.stage_id
  row.stage_id = toStageId
  audit(row.id, 'stage_id', previous, toStageId, 'MOVER_ETAPA_COBRANCA')
  return { row, changedFields: 1 }
}

export function closeFinanceiroCobranca(id: string, status: Exclude<CobrancaStatus, 'ATIVA'>, reason?: string): CobrancaCommandResult {
  const row = typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas').find((item) => item.id === id)
  if (!row) throw new Error('Cobrança não encontrada.')
  if (row.status !== 'ATIVA') throw new Error('A cobrança já está encerrada.')
  const parcela = findSource(row.parcela_id)
  if (status === 'QUITADA' && parcelaStatusEfetivo(parcela) !== 'paga') {
    throw new Error('Confirme primeiro o pagamento da parcela no Financeiro.')
  }
  const trimmedReason = reason?.trim() || null
  if (status === 'CANCELADA' && !trimmedReason) throw new Error('Informe o motivo do cancelamento.')
  const previous = { ...row }
  Object.assign(row, { status, encerrada_em: nowIso(), motivo_encerramento: trimmedReason })
  audit(row.id, 'encerramento', previous, row, status === 'QUITADA' ? 'QUITAR_COBRANCA' : 'CANCELAR_COBRANCA')
  return { row, changedFields: 3 }
}

export function reopenFinanceiroCobranca(id: string): CobrancaCommandResult {
  const table = typedRows<FinanceiroCobrancaRow>('financeiro_cobrancas')
  const row = table.find((item) => item.id === id)
  if (!row) throw new Error('Cobrança não encontrada.')
  if (row.status === 'ATIVA') throw new Error('A cobrança já está ativa.')
  const parcela = findSource(row.parcela_id)
  if (parcela.statusEfetivo !== 'vencida') throw new Error('A cobrança só pode ser reaberta quando a parcela estiver vencida.')
  if (table.some((item) => item.id !== row.id && item.parcela_id === row.parcela_id && item.status === 'ATIVA')) {
    throw new Error('Esta parcela já possui outra cobrança ativa.')
  }
  const previous = { ...row }
  Object.assign(row, { status: 'ATIVA' as const, encerrada_em: null, motivo_encerramento: null })
  audit(row.id, 'reabertura', previous, row, 'REABRIR_COBRANCA')
  return { row, changedFields: 3 }
}
