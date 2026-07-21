import type {
  ApoliceItemRow,
  Database,
  SinistroEnvolvidoRow,
  SinistroRow,
  SinistroTipo,
} from '../../types/database'

type ApoliceRow = Database['public']['Tables']['apolices']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']

export const SINISTRO_MAINTENANCE_FIELDS = [
  'responsavel_id',
  'numero_sinistro',
  'numero_aviso',
  'protocolo_seguradora',
  'cobertura_codigo',
  'cobertura_nome',
  'data_ocorrencia',
  'data_aviso',
  'data_registro_aviso',
  'tipo_sinistro',
  'causa',
  'descricao',
  'local_ocorrencia',
  'valor_estimado',
  'valor_pendente',
  'regulador_nome',
  'oficina_nome',
  'observacoes',
] as const satisfies readonly (keyof SinistroRow)[]

export type SinistroMaintenanceField = (typeof SINISTRO_MAINTENANCE_FIELDS)[number]
export type SinistroMaintenancePatch = Partial<Pick<SinistroRow, SinistroMaintenanceField>>
export type SinistroEnvolvidoMaintenanceDraft = Omit<SinistroEnvolvidoRow, 'id' | 'sinistro_id' | 'valor_indenizado'> & {
  id?: string
}

export type SinistroMaintenanceInput = {
  sinistroId: string
  patch: SinistroMaintenancePatch
  envolvidos: SinistroEnvolvidoMaintenanceDraft[]
}

export type SinistroMaintenanceStore = {
  apolices: ApoliceRow[]
  apoliceItens: ApoliceItemRow[]
  profiles: ProfileRow[]
  sinistros: SinistroRow[]
  envolvidos: SinistroEnvolvidoRow[]
  auditLogs: AuditLogRow[]
}

export type SinistroMaintenanceContext = {
  tenantId: string
  sessionUserId: string | null
  now: () => string
  newId: () => string
}

export type SinistroMaintenanceResult = {
  sinistro: SinistroRow
  envolvidos: SinistroEnvolvidoRow[]
  auditLogs: AuditLogRow[]
  changedFields: number
  insertedEnvolvidos: number
  updatedEnvolvidos: number
  removedEnvolvidos: number
}

const INVOLVIDO_FIELDS = [
  'apolice_item_id',
  'tipo',
  'nome',
  'cpf_cnpj',
  'email',
  'telefone',
  'placa',
  'seguradora_terceiro',
  'apolice_terceiro',
  'tipo_dano',
  'valor_reclamado',
  'responsavel_pelo_evento',
  'observacoes',
] as const satisfies readonly (keyof SinistroEnvolvidoRow)[]

function cloneRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }))
}

function restoreRows<T>(target: T[], snapshot: T[]): void {
  target.splice(0, target.length, ...snapshot)
}

function textOrNull(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function auditValue(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'boolean') return value ? 'sim' : 'não'
  return String(value)
}

function finiteNonNegative(value: number | null): boolean {
  return value == null || (Number.isFinite(value) && value >= 0)
}

function normalizePatch(patch: SinistroMaintenancePatch): SinistroMaintenancePatch {
  const normalized: SinistroMaintenancePatch = {}
  SINISTRO_MAINTENANCE_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(patch, field)) return
    const value = patch[field]
    if (typeof value === 'string' && !['data_ocorrencia', 'data_aviso', 'data_registro_aviso'].includes(field)) {
      Object.assign(normalized, { [field]: textOrNull(value) })
      return
    }
    Object.assign(normalized, { [field]: value ?? null })
  })
  return normalized
}

function normalizeEnvolvido(
  draft: SinistroEnvolvidoMaintenanceDraft,
  sinistroId: string,
  id: string,
): SinistroEnvolvidoRow {
  const terceiro = draft.tipo === 'TERCEIRO'
  return {
    id,
    sinistro_id: sinistroId,
    apolice_item_id: terceiro ? null : draft.apolice_item_id ?? null,
    tipo: draft.tipo,
    nome: textOrNull(draft.nome),
    cpf_cnpj: textOrNull(draft.cpf_cnpj),
    email: textOrNull(draft.email),
    telefone: textOrNull(draft.telefone),
    placa: textOrNull(draft.placa),
    seguradora_terceiro: terceiro ? textOrNull(draft.seguradora_terceiro) : null,
    apolice_terceiro: terceiro ? textOrNull(draft.apolice_terceiro) : null,
    tipo_dano: textOrNull(draft.tipo_dano),
    valor_reclamado: draft.valor_reclamado ?? null,
    valor_indenizado: null,
    responsavel_pelo_evento: draft.responsavel_pelo_evento ?? null,
    observacoes: textOrNull(draft.observacoes),
  }
}

function involvedSnapshot(row: SinistroEnvolvidoRow): string {
  return INVOLVIDO_FIELDS
    .map((field) => `${field}=${auditValue(row[field]) ?? 'vazio'}`)
    .join(' | ')
}

function sameInvolved(left: SinistroEnvolvidoRow, right: SinistroEnvolvidoRow): boolean {
  return INVOLVIDO_FIELDS.every((field) => left[field] === right[field])
}

function validateEnvolvido(row: SinistroEnvolvidoRow, apoliceId: string, items: ApoliceItemRow[]): void {
  if (row.tipo !== 'SEGURADO' && row.tipo !== 'TERCEIRO') throw new Error('Tipo de envolvido inválido.')
  if (!row.nome) throw new Error('Informe o nome de cada envolvido.')
  if (row.tipo === 'TERCEIRO' && row.apolice_item_id) {
    throw new Error('Terceiros não podem ser vinculados a itens da apólice.')
  }
  if (row.tipo === 'SEGURADO' && row.apolice_item_id) {
    const item = items.find((candidate) => candidate.id === row.apolice_item_id)
    if (!item || item.apolice_id !== apoliceId) throw new Error('O item do segurado não pertence à apólice do Sinistro.')
  }
  const document = (row.cpf_cnpj ?? '').replace(/\D+/g, '')
  if (document && document.length !== 11 && document.length !== 14) {
    throw new Error('Informe um CPF ou CNPJ válido para o envolvido.')
  }
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    throw new Error('Informe um e-mail válido para o envolvido.')
  }
  if (!finiteNonNegative(row.valor_reclamado)) {
    throw new Error('O valor reclamado do envolvido deve ser maior ou igual a zero.')
  }
}

function makeAudit(
  context: SinistroMaintenanceContext,
  sinistroId: string,
  field: string,
  previous: string | null,
  next: string | null,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
): AuditLogRow {
  return {
    id: context.newId(),
    tenant_id: context.tenantId,
    user_id: context.sessionUserId,
    entidade_tipo: 'sinistro',
    entidade_id: sinistroId,
    campo: field,
    valor_antigo: previous,
    valor_novo: next,
    acao: action,
    ocorrido_em: context.now(),
    origem: 'FRONT_MOCK',
    ip: null,
    user_agent: 'WassisCRM mock',
  }
}

export function maintainSinistroAtomic(
  store: SinistroMaintenanceStore,
  input: SinistroMaintenanceInput,
  context: SinistroMaintenanceContext,
): SinistroMaintenanceResult {
  const snapshots = {
    sinistros: cloneRows(store.sinistros),
    envolvidos: cloneRows(store.envolvidos),
    auditLogs: cloneRows(store.auditLogs),
  }

  try {
    const sinistro = store.sinistros.find((row) => row.id === input.sinistroId)
    if (!sinistro) throw new Error('Sinistro não encontrado.')
    const apolice = store.apolices.find((row) => row.id === sinistro.apolice_id)
    if (!apolice) throw new Error('A apólice vinculada ao Sinistro não foi encontrada.')

    const patch = normalizePatch(input.patch)
    const resulting = { ...sinistro, ...patch }
    if (!resulting.data_ocorrencia) throw new Error('Informe a data da ocorrência.')
    if (resulting.data_aviso && resulting.data_aviso < resulting.data_ocorrencia) {
      throw new Error('A data do aviso não pode ser anterior à ocorrência.')
    }
    if (resulting.data_registro_aviso && resulting.data_registro_aviso < resulting.data_ocorrencia) {
      throw new Error('O registro do aviso não pode ser anterior à ocorrência.')
    }
    if (apolice.vigencia_inicio && resulting.data_ocorrencia < apolice.vigencia_inicio) {
      throw new Error('A ocorrência é anterior ao início da vigência da apólice.')
    }
    if (apolice.vigencia_fim && resulting.data_ocorrencia > apolice.vigencia_fim) {
      throw new Error('A ocorrência é posterior ao fim da vigência da apólice.')
    }
    if (!finiteNonNegative(resulting.valor_estimado) || !finiteNonNegative(resulting.valor_pendente)) {
      throw new Error('Os valores do Sinistro devem ser finitos e maiores ou iguais a zero.')
    }
    if (
      resulting.valor_estimado != null &&
      resulting.valor_pendente != null &&
      resulting.valor_pendente > resulting.valor_estimado
    ) {
      throw new Error('O valor pendente não pode superar o valor estimado.')
    }
    if (resulting.tipo_sinistro && !(['administrativo', 'judicial'] satisfies SinistroTipo[]).includes(resulting.tipo_sinistro)) {
      throw new Error('Tipo de Sinistro inválido.')
    }
    if (resulting.responsavel_id && !store.profiles.some((profile) => profile.id === resulting.responsavel_id)) {
      throw new Error('Selecione um responsável válido para o Sinistro.')
    }

    const existing = store.envolvidos.filter((row) => row.sinistro_id === sinistro.id)
    const existingById = new Map(existing.map((row) => [row.id, row]))
    const normalized = input.envolvidos.map((draft) => {
      if (draft.id && !existingById.has(draft.id)) throw new Error('Envolvido não pertence ao Sinistro informado.')
      return normalizeEnvolvido(draft, sinistro.id, draft.id ?? context.newId())
    })
    if (!normalized.some((row) => row.tipo === 'SEGURADO')) {
      throw new Error('Não é permitido remover o último envolvido Segurado.')
    }
    normalized.forEach((row) => validateEnvolvido(row, sinistro.apolice_id, store.apoliceItens))

    const audits: AuditLogRow[] = []
    let changedFields = 0
    SINISTRO_MAINTENANCE_FIELDS.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(patch, field) || sinistro[field] === resulting[field]) return
      audits.push(makeAudit(context, sinistro.id, field, auditValue(sinistro[field]), auditValue(resulting[field]), 'UPDATE'))
      Object.assign(sinistro, { [field]: resulting[field] })
      changedFields += 1
    })

    const requestedIds = new Set(normalized.map((row) => row.id))
    const removed = existing.filter((row) => !requestedIds.has(row.id))
    const inserted = normalized.filter((row) => !existingById.has(row.id))
    const updated = normalized.filter((row) => {
      const previous = existingById.get(row.id)
      return previous != null && !sameInvolved(previous, row)
    })

    removed.forEach((row) => {
      audits.push(makeAudit(context, sinistro.id, `envolvido:${row.id}`, involvedSnapshot(row), null, 'DELETE'))
    })
    updated.forEach((row) => {
      const previous = existingById.get(row.id)
      if (!previous) return
      audits.push(makeAudit(context, sinistro.id, `envolvido:${row.id}`, involvedSnapshot(previous), involvedSnapshot(row), 'UPDATE'))
    })
    inserted.forEach((row) => {
      audits.push(makeAudit(context, sinistro.id, `envolvido:${row.id}`, null, involvedSnapshot(row), 'INSERT'))
    })

    const otherInvolved = store.envolvidos.filter((row) => row.sinistro_id !== sinistro.id)
    store.envolvidos.splice(0, store.envolvidos.length, ...otherInvolved, ...normalized)
    store.auditLogs.push(...audits)

    return {
      sinistro,
      envolvidos: normalized,
      auditLogs: audits,
      changedFields,
      insertedEnvolvidos: inserted.length,
      updatedEnvolvidos: updated.length,
      removedEnvolvidos: removed.length,
    }
  } catch (error) {
    restoreRows(store.sinistros, snapshots.sinistros)
    restoreRows(store.envolvidos, snapshots.envolvidos)
    restoreRows(store.auditLogs, snapshots.auditLogs)
    throw error
  }
}
