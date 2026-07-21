import type {
  ApoliceRow,
  Database,
  PosVendaRow,
} from '../../types/database'

type SeguradoRow = Pick<
  Database['public']['Tables']['segurados']['Row'],
  'id' | 'filial_id' | 'nome'
>
type RamoRow = Pick<
  Database['public']['Tables']['ramos']['Row'],
  'id' | 'nome' | 'is_monthly'
>
type ProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'tenant_id'>
type PipelineRow = Pick<
  Database['public']['Tables']['pipelines']['Row'],
  'id' | 'nome' | 'entidade_tipo' | 'ativo' | 'filial_id'
>
type StageRow = Pick<
  Database['public']['Tables']['pipeline_stages']['Row'],
  'id' | 'pipeline_id' | 'ordem' | 'ativo'
>
type AtividadeRow = Database['public']['Tables']['atividades']['Row']
type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']

export type PosVendaProcesso = 'ONBOARDING' | 'ACOMPANHAMENTO_MENSAL' | 'GERAL'
export type PosVendaFailurePoint = 'after-record' | 'after-activity' | 'audit'

export interface PosVendaStore {
  apolices: ApoliceRow[]
  segurados: SeguradoRow[]
  ramos: RamoRow[]
  pipelines: PipelineRow[]
  stages: StageRow[]
  profiles: ProfileRow[]
  posVendas: PosVendaRow[]
  atividades: AtividadeRow[]
  auditLogs: AuditLogRow[]
}

export interface PosVendaContext {
  tenantId: string
  filialId?: string | null
  sessionUserId: string | null
  pipelineId: string
  now: () => string
  newId: () => string
  failAt?: PosVendaFailurePoint
}

export interface PosVendaCreateInput {
  apoliceId: string
  responsavelId?: string | null
  prioridade?: string | null
  assunto: string
  descricao?: string | null
  dataAbertura?: string | null
  dataConclusaoPrevista?: string | null
  motivoPendencia?: string | null
  observacoes?: string | null
}

export type PosVendaMutableField =
  | 'responsavel_id'
  | 'prioridade'
  | 'assunto'
  | 'descricao'
  | 'data_conclusao_prevista'
  | 'motivo_pendencia'
  | 'resultado'
  | 'observacoes'

export interface PosVendaMaintenanceInput {
  id: string
  patch: Partial<Pick<PosVendaRow, PosVendaMutableField>>
}

export interface PosVendaCreationResult {
  posVenda: PosVendaRow
  processo: PosVendaProcesso
  atividade: AtividadeRow | null
  auditCount: number
}

export interface PosVendaMaintenanceResult {
  posVenda: PosVendaRow
  changedFields: number
  auditCount: number
}

const MAINTENANCE_FIELDS: PosVendaMutableField[] = [
  'responsavel_id',
  'prioridade',
  'assunto',
  'descricao',
  'data_conclusao_prevista',
  'motivo_pendencia',
  'resultado',
  'observacoes',
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function nullableText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10)
}

function nextMonth(date: string): string {
  const parsed = new Date(`${date}T12:00:00`)
  parsed.setMonth(parsed.getMonth() + 1)
  return parsed.toISOString().slice(0, 10)
}

function restore<T>(target: T[], snapshot: T[]): void {
  target.splice(0, target.length, ...snapshot)
}

function snapshot<T>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }))
}

function auditValue(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value)
}

function appendAudit(
  store: PosVendaStore,
  context: PosVendaContext,
  entityId: string,
  action: 'INSERT' | 'UPDATE',
  field: string,
  previous: unknown,
  next: unknown,
): void {
  if (context.failAt === 'audit') throw new Error('Falha simulada de auditoria.')
  store.auditLogs.push({
    id: context.newId(),
    tenant_id: context.tenantId,
    user_id: context.sessionUserId,
    entidade_tipo: 'pos_venda',
    entidade_id: entityId,
    campo: field,
    valor_antigo: auditValue(previous),
    valor_novo: auditValue(next),
    acao: action,
    ocorrido_em: context.now(),
    origem: 'FRONT_MOCK',
    ip: null,
    user_agent: 'WassisCRM mock',
  })
}

export function inferPosVendaProcesso(pipelineName: string | null): PosVendaProcesso {
  const name = normalize(pipelineName ?? '')
  if (name.includes('mensal')) return 'ACOMPANHAMENTO_MENSAL'
  if (name.includes('onboarding')) return 'ONBOARDING'
  return 'GERAL'
}

export function validatePosVendaEligibility(
  apolice: ApoliceRow,
  ramo: RamoRow | undefined,
  processo: PosVendaProcesso,
): void {
  if (apolice.status !== 'VIGENTE') {
    throw new Error('Somente Apólices vigentes podem iniciar este Pós-venda.')
  }
  if (!ramo) throw new Error('A Apólice precisa ter um ramo válido.')
  if (processo === 'ACOMPANHAMENTO_MENSAL' && !ramo.is_monthly) {
    throw new Error('Acompanhamento mensal é permitido somente para ramos faturáveis.')
  }
}

function resolveCreation(
  store: PosVendaStore,
  input: PosVendaCreateInput,
  context: PosVendaContext,
) {
  const apolice = store.apolices.find((row) => row.id === input.apoliceId)
  if (!apolice) throw new Error('Selecione uma Apólice válida.')

  const segurado = store.segurados.find((row) => row.id === apolice.segurado_id)
  if (!segurado) throw new Error('A Apólice precisa ter um segurado válido.')
  if (context.filialId && segurado.filial_id !== context.filialId) {
    throw new Error('A Apólice não pertence à corretora ativa.')
  }

  const pipeline = store.pipelines.find((row) => row.id === context.pipelineId)
  if (!pipeline || !pipeline.ativo || pipeline.entidade_tipo !== 'pos_venda') {
    throw new Error('O funil de Pós-venda não está disponível.')
  }
  if (pipeline.filial_id && context.filialId && pipeline.filial_id !== context.filialId) {
    throw new Error('O funil não pertence à corretora ativa.')
  }

  const stage = store.stages
    .filter((row) => row.pipeline_id === pipeline.id && row.ativo)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))[0]
  if (!stage) throw new Error('O funil precisa ter uma etapa inicial ativa.')

  const responsavelId = input.responsavelId ?? context.sessionUserId
  if (responsavelId) {
    const profile = store.profiles.find((row) => row.id === responsavelId)
    if (!profile || (profile.tenant_id && profile.tenant_id !== context.tenantId)) {
      throw new Error('Selecione um responsável válido.')
    }
  }

  const assunto = nullableText(input.assunto)
  if (!assunto) throw new Error('Informe o assunto do Pós-venda.')

  const processo = inferPosVendaProcesso(pipeline.nome)
  const ramo = apolice.ramo_id ? store.ramos.find((row) => row.id === apolice.ramo_id) : undefined
  validatePosVendaEligibility(apolice, ramo, processo)

  return { apolice, segurado, pipeline, stage, responsavelId, assunto, processo }
}

function buildInitialActivity(
  context: PosVendaContext,
  posVenda: PosVendaRow,
  processo: PosVendaProcesso,
  seguradoNome: string,
): AtividadeRow | null {
  if (processo === 'GERAL') return null
  const openingDate = posVenda.data_abertura ?? dateOnly(context.now())
  const isMonthly = processo === 'ACOMPANHAMENTO_MENSAL'
  return {
    id: context.newId(),
    tenant_id: context.tenantId,
    filial_id: context.filialId ?? null,
    responsavel_id: posVenda.responsavel_id,
    entidade_tipo: 'pos_venda',
    entidade_id: posVenda.id,
    tipo: isMonthly ? 'followup' : 'tarefa',
    titulo: isMonthly ? 'Acompanhamento mensal do contrato' : 'Onboarding do segurado',
    descricao: isMonthly
      ? `Realizar acompanhamento mensal do contrato de ${seguradoNome}.`
      : `Orientar ${seguradoNome} após a emissão da Apólice.`,
    status: 'pendente',
    prioridade: posVenda.prioridade ?? 'media',
    vencimento: posVenda.data_conclusao_prevista ?? (isMonthly ? nextMonth(openingDate) : openingDate),
    concluida_em: null,
    fixada_em: null,
    canal: null,
    origem: 'pos_venda',
    lembrete_em: null,
    recorrente: isMonthly,
    observacoes: null,
  }
}

export function createPosVendaAtomic(
  store: PosVendaStore,
  input: PosVendaCreateInput,
  context: PosVendaContext,
): PosVendaCreationResult {
  const posVendaSnapshot = snapshot(store.posVendas)
  const atividadeSnapshot = snapshot(store.atividades)
  const auditSnapshot = snapshot(store.auditLogs)

  try {
    const resolved = resolveCreation(store, input, context)
    const dataAbertura = input.dataAbertura ?? dateOnly(context.now())
    const posVenda: PosVendaRow = {
      id: context.newId(),
      apolice_id: resolved.apolice.id,
      stage_id: resolved.stage.id,
      responsavel_id: resolved.responsavelId,
      tipo_processo: null,
      status: null,
      prioridade: nullableText(input.prioridade) ?? 'media',
      assunto: resolved.assunto,
      descricao: nullableText(input.descricao),
      data_abertura: dataAbertura,
      data_conclusao_prevista: input.dataConclusaoPrevista ?? null,
      data_conclusao: null,
      motivo_pendencia: nullableText(input.motivoPendencia),
      resultado: null,
      observacoes: nullableText(input.observacoes),
    }

    store.posVendas.push(posVenda)
    if (context.failAt === 'after-record') throw new Error('Falha simulada após criar o registro.')

    const atividade = buildInitialActivity(
      context,
      posVenda,
      resolved.processo,
      resolved.segurado.nome ?? 'segurado',
    )
    if (atividade) store.atividades.push(atividade)
    if (context.failAt === 'after-activity') throw new Error('Falha simulada após criar a atividade.')

    const auditFields: Array<keyof PosVendaRow> = [
      'apolice_id',
      'stage_id',
      'responsavel_id',
      'prioridade',
      'assunto',
      'descricao',
      'data_abertura',
      'data_conclusao_prevista',
      'motivo_pendencia',
      'observacoes',
    ]
    auditFields.forEach((field) => appendAudit(store, context, posVenda.id, 'INSERT', field, null, posVenda[field]))
    if (atividade) appendAudit(store, context, posVenda.id, 'INSERT', 'atividade_inicial', null, atividade.titulo)

    return {
      posVenda,
      processo: resolved.processo,
      atividade,
      auditCount: store.auditLogs.length - auditSnapshot.length,
    }
  } catch (error) {
    restore(store.posVendas, posVendaSnapshot)
    restore(store.atividades, atividadeSnapshot)
    restore(store.auditLogs, auditSnapshot)
    throw error
  }
}

export function maintainPosVendaAtomic(
  store: PosVendaStore,
  input: PosVendaMaintenanceInput,
  context: Omit<PosVendaContext, 'pipelineId' | 'filialId'>,
): PosVendaMaintenanceResult {
  const posVendaSnapshot = snapshot(store.posVendas)
  const auditSnapshot = snapshot(store.auditLogs)

  try {
    const posVenda = store.posVendas.find((row) => row.id === input.id)
    if (!posVenda) throw new Error('Pós-venda não encontrado.')

    const patchKeys = Object.keys(input.patch)
    if (patchKeys.some((key) => !MAINTENANCE_FIELDS.includes(key as PosVendaMutableField))) {
      throw new Error('A mutação contém campo protegido.')
    }

    if (input.patch.responsavel_id) {
      const profile = store.profiles.find((row) => row.id === input.patch.responsavel_id)
      if (!profile || (profile.tenant_id && profile.tenant_id !== context.tenantId)) {
        throw new Error('Selecione um responsável válido.')
      }
    }

    const nextAssunto = input.patch.assunto === undefined ? posVenda.assunto : nullableText(input.patch.assunto)
    if (!nextAssunto) throw new Error('Informe o assunto do Pós-venda.')

    const normalizedPatch: Partial<Pick<PosVendaRow, PosVendaMutableField>> = {
      ...input.patch,
      ...(input.patch.assunto === undefined ? {} : { assunto: nextAssunto }),
      ...(input.patch.prioridade === undefined ? {} : { prioridade: nullableText(input.patch.prioridade) }),
      ...(input.patch.descricao === undefined ? {} : { descricao: nullableText(input.patch.descricao) }),
      ...(input.patch.motivo_pendencia === undefined ? {} : { motivo_pendencia: nullableText(input.patch.motivo_pendencia) }),
      ...(input.patch.resultado === undefined ? {} : { resultado: nullableText(input.patch.resultado) }),
      ...(input.patch.observacoes === undefined ? {} : { observacoes: nullableText(input.patch.observacoes) }),
    }

    const changes = MAINTENANCE_FIELDS
      .filter((field) => Object.prototype.hasOwnProperty.call(normalizedPatch, field))
      .map((field) => ({ field, previous: posVenda[field], next: normalizedPatch[field] ?? null }))
      .filter(({ previous, next }) => previous !== next)

    if (changes.length === 0) return { posVenda, changedFields: 0, auditCount: 0 }

    changes.forEach(({ field, next }) => {
      posVenda[field] = next
    })
    if (context.failAt === 'after-record') throw new Error('Falha simulada após atualizar o registro.')

    changes.forEach(({ field, previous, next }) => appendAudit(
      store,
      { ...context, pipelineId: '' },
      posVenda.id,
      'UPDATE',
      field,
      previous,
      next,
    ))

    return {
      posVenda,
      changedFields: changes.length,
      auditCount: store.auditLogs.length - auditSnapshot.length,
    }
  } catch (error) {
    restore(store.posVendas, posVendaSnapshot)
    restore(store.auditLogs, auditSnapshot)
    throw error
  }
}

export function movePosVendaStageAtomic(
  store: PosVendaStore,
  input: { id: string; toStageId: string },
  context: Omit<PosVendaContext, 'pipelineId' | 'filialId'>,
): PosVendaMaintenanceResult {
  const posVendaSnapshot = snapshot(store.posVendas)
  const auditSnapshot = snapshot(store.auditLogs)

  try {
    const posVenda = store.posVendas.find((row) => row.id === input.id)
    if (!posVenda) throw new Error('Pós-venda não encontrado.')
    if (posVenda.stage_id === input.toStageId) return { posVenda, changedFields: 0, auditCount: 0 }

    const currentStage = store.stages.find((row) => row.id === posVenda.stage_id)
    const nextStage = store.stages.find((row) => row.id === input.toStageId && row.ativo)
    if (!currentStage || !nextStage || currentStage.pipeline_id !== nextStage.pipeline_id) {
      throw new Error('A etapa de destino não pertence ao funil atual.')
    }
    const pipeline = store.pipelines.find((row) => row.id === nextStage.pipeline_id)
    if (!pipeline || !pipeline.ativo || pipeline.entidade_tipo !== 'pos_venda') {
      throw new Error('A etapa de destino não pertence a um funil de Pós-venda ativo.')
    }

    const previous = posVenda.stage_id
    posVenda.stage_id = nextStage.id
    if (context.failAt === 'after-record') throw new Error('Falha simulada após mover a etapa.')
    appendAudit(store, { ...context, pipelineId: '' }, posVenda.id, 'UPDATE', 'stage_id', previous, nextStage.id)

    return {
      posVenda,
      changedFields: 1,
      auditCount: store.auditLogs.length - auditSnapshot.length,
    }
  } catch (error) {
    restore(store.posVendas, posVendaSnapshot)
    restore(store.auditLogs, auditSnapshot)
    throw error
  }
}
