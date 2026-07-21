import type { Database, SinistroEnvolvidoRow, SinistroRow, SinistroStatus } from '../../types/database'

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']

export type SinistroOperationalAction =
  | 'CONCLUIR_SEM_INDENIZACAO'
  | 'CONCLUIR_COM_INDENIZACAO'
  | 'NEGAR'
  | 'CANCELAR'
  | 'REABRIR'

export type SinistroOperationalInput = {
  sinistroId: string
  action: SinistroOperationalAction
  data_documentacao_completa?: string | null
  data_liquidacao_financeira?: string | null
  data_conclusao?: string | null
  valor_indenizado?: number | null
  valor_despesas_regulacao?: number | null
  valor_salvado?: number | null
  data_salvado?: string | null
  valor_ressarcimento?: number | null
  data_ressarcimento?: string | null
  negativa_motivo?: string | null
}

export type SinistroOperationalStore = {
  sinistros: SinistroRow[]
  envolvidos: SinistroEnvolvidoRow[]
  auditLogs: AuditLogRow[]
}

export type SinistroOperationalContext = {
  tenantId: string
  sessionUserId: string | null
  now: () => string
  newId: () => string
}

export type SinistroOperationalResult = {
  sinistro: SinistroRow
  auditLogs: AuditLogRow[]
  changedFields: number
}

const ACTIVE_STATUSES: SinistroStatus[] = ['aberto', 'reaberto']
const FINAL_STATUSES: SinistroStatus[] = [
  'encerrado_sem_indenizacao',
  'encerrado_com_indenizacao',
  'cancelado',
]

type FinalFieldName =
  | 'data_documentacao_completa'
  | 'data_liquidacao_financeira'
  | 'data_conclusao'
  | 'valor_indenizado'
  | 'valor_despesas_regulacao'
  | 'valor_salvado'
  | 'data_salvado'
  | 'valor_ressarcimento'
  | 'data_ressarcimento'
  | 'negativa_motivo'
type OperationalPatch = Partial<Pick<SinistroRow, FinalFieldName | 'status'>>

function cloneRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }))
}

function restoreRows<T>(target: T[], snapshot: T[]): void {
  target.splice(0, target.length, ...snapshot)
}

function auditValue(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value)
}

function textOrNull(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function numberOrNull(value: number | null | undefined): number | null {
  return value == null ? null : value
}

function ensureFiniteNonNegative(value: number | null, label: string): void {
  if (value != null && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`${label} deve ser finito e maior ou igual a zero.`)
  }
}

function ensureDate(value: string | null, label: string): void {
  if (value == null) return
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${label} deve ser uma data válida.`)
  }
}

function ensureNotBefore(value: string | null, reference: string | null, message: string): void {
  if (value && reference && value < reference) throw new Error(message)
}

function ensureNotAfter(value: string | null, reference: string | null, message: string): void {
  if (value && reference && value > reference) throw new Error(message)
}

export function getSinistroOperationalActions(status: SinistroStatus | null): SinistroOperationalAction[] {
  if (status && ACTIVE_STATUSES.includes(status)) {
    return ['CONCLUIR_SEM_INDENIZACAO', 'CONCLUIR_COM_INDENIZACAO', 'NEGAR', 'CANCELAR']
  }
  if (status && FINAL_STATUSES.includes(status)) return ['REABRIR']
  return []
}

function validateEligibility(status: SinistroStatus | null, action: SinistroOperationalAction): void {
  if (!status) throw new Error('O Sinistro não possui status operacional válido.')
  if (!getSinistroOperationalActions(status).includes(action)) {
    throw new Error('A transição não é permitida para o status atual do Sinistro.')
  }
}

function normalizedFinalFields(input: SinistroOperationalInput): Pick<OperationalPatch, FinalFieldName> {
  return {
    data_documentacao_completa: textOrNull(input.data_documentacao_completa),
    data_liquidacao_financeira: textOrNull(input.data_liquidacao_financeira),
    data_conclusao: textOrNull(input.data_conclusao),
    valor_indenizado: numberOrNull(input.valor_indenizado),
    valor_despesas_regulacao: numberOrNull(input.valor_despesas_regulacao),
    valor_salvado: numberOrNull(input.valor_salvado),
    data_salvado: textOrNull(input.data_salvado),
    valor_ressarcimento: numberOrNull(input.valor_ressarcimento),
    data_ressarcimento: textOrNull(input.data_ressarcimento),
    negativa_motivo: textOrNull(input.negativa_motivo),
  }
}

function validateCommonFinalFields(sinistro: SinistroRow, fields: Pick<OperationalPatch, FinalFieldName>): void {
  if (!fields.data_conclusao) throw new Error('Informe a data de conclusão.')
  ensureDate(fields.data_conclusao, 'A data de conclusão')
  ensureDate(fields.data_documentacao_completa ?? null, 'A data da documentação completa')
  ensureDate(fields.data_liquidacao_financeira ?? null, 'A data da liquidação financeira')
  ensureDate(fields.data_salvado ?? null, 'A data do salvado')
  ensureDate(fields.data_ressarcimento ?? null, 'A data do ressarcimento')

  ensureNotBefore(fields.data_conclusao, sinistro.data_ocorrencia, 'A conclusão não pode anteceder a ocorrência.')
  ensureNotBefore(fields.data_documentacao_completa ?? null, sinistro.data_ocorrencia, 'A documentação completa não pode anteceder a ocorrência.')
  ensureNotBefore(fields.data_salvado ?? null, sinistro.data_ocorrencia, 'A data do salvado não pode anteceder a ocorrência.')
  ensureNotBefore(fields.data_ressarcimento ?? null, sinistro.data_ocorrencia, 'A data do ressarcimento não pode anteceder a ocorrência.')
  ensureNotAfter(fields.data_documentacao_completa ?? null, fields.data_conclusao, 'A documentação completa não pode ser posterior à conclusão.')
  ensureNotAfter(fields.data_salvado ?? null, fields.data_conclusao, 'A data do salvado não pode ser posterior à conclusão.')
  ensureNotAfter(fields.data_ressarcimento ?? null, fields.data_conclusao, 'A data do ressarcimento não pode ser posterior à conclusão.')

  ensureFiniteNonNegative(fields.valor_indenizado ?? null, 'O valor indenizado')
  ensureFiniteNonNegative(fields.valor_despesas_regulacao ?? null, 'O valor das despesas de regulação')
  ensureFiniteNonNegative(fields.valor_salvado ?? null, 'O valor do salvado')
  ensureFiniteNonNegative(fields.valor_ressarcimento ?? null, 'O valor do ressarcimento')

  if ((fields.valor_salvado ?? 0) > 0 && !fields.data_salvado) {
    throw new Error('Informe a data do salvado quando houver valor de salvado.')
  }
  if ((fields.valor_ressarcimento ?? 0) > 0 && !fields.data_ressarcimento) {
    throw new Error('Informe a data do ressarcimento quando houver valor de ressarcimento.')
  }
}

function buildPatch(sinistro: SinistroRow, input: SinistroOperationalInput): OperationalPatch {
  if (input.action === 'REABRIR') return { status: 'reaberto' }

  const fields = normalizedFinalFields(input)
  validateCommonFinalFields(sinistro, fields)

  if (input.action === 'CANCELAR') {
    return { status: 'cancelado', data_conclusao: fields.data_conclusao }
  }

  if (input.action === 'CONCLUIR_COM_INDENIZACAO') {
    const documentationDate = fields.data_documentacao_completa
    const financialSettlementDate = fields.data_liquidacao_financeira
    if (!documentationDate) throw new Error('Informe a data da documentação completa.')
    if (!financialSettlementDate) throw new Error('Informe a data da liquidação financeira.')
    if (fields.valor_indenizado == null || fields.valor_indenizado <= 0) {
      throw new Error('A conclusão com indenização exige valor indenizado maior que zero.')
    }
    ensureNotBefore(
      financialSettlementDate,
      documentationDate,
      'A liquidação financeira não pode anteceder a documentação completa.',
    )
    ensureNotAfter(
      financialSettlementDate,
      fields.data_conclusao ?? null,
      'A liquidação financeira não pode ser posterior à conclusão.',
    )
    return {
      ...fields,
      status: 'encerrado_com_indenizacao',
      negativa_motivo: null,
    }
  }

  if (fields.data_liquidacao_financeira) {
    throw new Error('Sinistro sem indenização não pode registrar liquidação financeira.')
  }
  if (fields.valor_indenizado != null && fields.valor_indenizado !== 0) {
    throw new Error('Sinistro sem indenização deve manter valor indenizado igual a zero.')
  }

  if (input.action === 'NEGAR') {
    if (!fields.negativa_motivo) throw new Error('Informe o motivo da negativa.')
    return {
      ...fields,
      status: 'encerrado_sem_indenizacao',
      valor_indenizado: 0,
      data_liquidacao_financeira: null,
    }
  }

  return {
    ...fields,
    status: 'encerrado_sem_indenizacao',
    valor_indenizado: 0,
    data_liquidacao_financeira: null,
    negativa_motivo: null,
  }
}

function makeAudit(
  context: SinistroOperationalContext,
  sinistroId: string,
  field: string,
  previous: unknown,
  next: unknown,
): AuditLogRow {
  return {
    id: context.newId(),
    tenant_id: context.tenantId,
    user_id: context.sessionUserId,
    entidade_tipo: 'sinistro',
    entidade_id: sinistroId,
    campo: field,
    valor_antigo: auditValue(previous),
    valor_novo: auditValue(next),
    acao: 'UPDATE',
    ocorrido_em: context.now(),
    origem: 'FRONT_MOCK',
    ip: null,
    user_agent: 'WassisCRM mock',
  }
}

export function executeSinistroOperationalCommandAtomic(
  store: SinistroOperationalStore,
  input: SinistroOperationalInput,
  context: SinistroOperationalContext,
): SinistroOperationalResult {
  const snapshots = {
    sinistros: cloneRows(store.sinistros),
    envolvidos: cloneRows(store.envolvidos),
    auditLogs: cloneRows(store.auditLogs),
  }

  try {
    const sinistro = store.sinistros.find((row) => row.id === input.sinistroId)
    if (!sinistro) throw new Error('Sinistro não encontrado.')
    validateEligibility(sinistro.status, input.action)
    if (!store.envolvidos.some((row) => row.sinistro_id === sinistro.id && row.tipo === 'SEGURADO')) {
      throw new Error('Todo Sinistro deve manter ao menos um envolvido Segurado.')
    }

    const apoliceId = sinistro.apolice_id
    const stageId = sinistro.stage_id
    const patch = buildPatch(sinistro, input)
    const audits = Object.entries(patch)
      .filter(([field, value]) => sinistro[field as keyof SinistroRow] !== value)
      .map(([field, value]) => makeAudit(context, sinistro.id, field, sinistro[field as keyof SinistroRow], value))

    if (audits.length === 0) throw new Error('O comando não produz alteração no Sinistro.')
    Object.assign(sinistro, patch)
    if (sinistro.apolice_id !== apoliceId || sinistro.stage_id !== stageId) {
      throw new Error('A operação não pode alterar a apólice ou a etapa do Sinistro.')
    }
    store.auditLogs.push(...audits)

    return { sinistro, auditLogs: audits, changedFields: audits.length }
  } catch (error) {
    restoreRows(store.sinistros, snapshots.sinistros)
    restoreRows(store.envolvidos, snapshots.envolvidos)
    restoreRows(store.auditLogs, snapshots.auditLogs)
    throw error
  }
}
