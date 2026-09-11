import { platformColumns, platformDefaults, platformRequired } from '../../types/platformRows'
import type { ProfileFilialRow, ProfileRow, RolePermissionRow } from '../../types/platformRows'

export type PlatformTable = keyof typeof platformColumns
type RecordRow = Record<string, unknown>
type Tables = (name: string) => readonly RecordRow[]
export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'export' | 'manage'
export type PermissionScope = NonNullable<RolePermissionRow['escopo']>
export type PermissionContext = { filialId: string; responsibleProfileIds?: readonly string[] }

export function opportunityPermissionContext(row?: { filial_id: string; responsavel_id: string | null }): PermissionContext | undefined {
  return row ? { filialId: row.filial_id, responsibleProfileIds: row.responsavel_id ? [row.responsavel_id] : [] } : undefined
}

export function isPlatformTable(name: string): name is PlatformTable {
  return Object.hasOwn(platformColumns, name)
}

/** A fronteira do mock preserva só colunas canônicas, com NULL explícito. */
export function canonicalPlatformRow(table: PlatformTable, input: RecordRow): RecordRow {
  const defaults: RecordRow = platformDefaults[table]
  return Object.fromEntries(platformColumns[table].map(key => [key, input[key] === undefined ? defaults[key] ?? null : input[key]]))
}

function localDay(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isActiveLink(link: Pick<ProfileFilialRow, 'ativo' | 'data_inicio' | 'data_fim'>, day = localDay()): boolean {
  return link.ativo === true && validDate(link.data_inicio) && validDate(link.data_fim) && (!link.data_inicio || link.data_inicio <= day) && (!link.data_fim || link.data_fim >= day)
}

export function isActiveProfile(profile: Pick<ProfileRow, 'ativo' | 'status'>): boolean {
  return profile.ativo === true && profile.status === 'ATIVO'
}

export function allowsPermission(input: {
  profile: Pick<ProfileRow, 'id' | 'ativo' | 'status'> | undefined
  links: readonly ProfileFilialRow[]
  permissions: readonly RolePermissionRow[]
  activeBranchId: string | null
  module: string
  action: PermissionAction
  context?: PermissionContext
  day?: string
}): boolean {
  const { profile, permissions, action, context, activeBranchId } = input
  if (!profile || !isActiveProfile(profile)) return false
  const links = input.links.filter(v => v.profile_id === profile.id && isActiveLink(v, input.day))
  const target = context?.filialId ?? activeBranchId
  if (target && !links.some(v => v.filial_id === target)) return false
  return links.some(link => permissions.some(permission => {
    if (permission.perfil_id !== link.perfil_id || permission.modulo !== input.module || permission[`can_${action}`] !== true) return false
    if (!permission.escopo) return false
    if (permission.escopo !== 'GRUPO' && target && link.filial_id !== target) return false
    if (permission.escopo === 'PROPRIO') {
      if (!context) return action === 'read' || (action === 'create' && !!target)
      return context.responsibleProfileIds?.includes(profile.id) === true
    }
    // Sem corretora ou registro, a união serve somente à navegação/criação contextual.
    if (!target && permission.escopo === 'CORRETORA' && !['read', 'manage'].includes(action)) return false
    return true
  }))
}

function requireRow(tables: Tables, name: string, id: unknown): RecordRow {
  const row = tables(name).find(r => r.id === id)
  if (!row) throw new Error(`Vínculo inválido: ${name}.`)
  return row
}

function sameTenant(parent: RecordRow, candidate: RecordRow): void {
  if (parent.tenant_id !== candidate.tenant_id) throw new Error('O vínculo deve pertencer ao mesmo grupo.')
}

function validDate(value: unknown): boolean {
  if (value == null || value === '') return true
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** Validação de domínio do mock; a implementação transacional real pertence ao backend. */
export function validatePlatformRow(table: PlatformTable, row: RecordRow, tables: Tables): void {
  for (const key of platformRequired[table]) {
    if (typeof row[key] !== 'string' || !(row[key] as string).trim()) throw new Error(`${table}.${key} é obrigatório.`)
  }
  if ('tenant_id' in row) requireRow(tables, 'tenants', row.tenant_id)
  for (const [key, value] of Object.entries(row)) {
    if (value != null && ['percentual_imposto', 'percentual_iss', 'percentual_repasse_padrao'].includes(key) && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) throw new Error('Percentual deve estar entre 0 e 100.')
  }
  if (table === 'profiles' && !['ATIVO', 'INATIVO'].includes(String(row.status))) throw new Error('Informe o estado do usuário.')
  if (table === 'segurados') {
    if (!['PF', 'PJ'].includes(String(row.tipo))) throw new Error('Informe o tipo de pessoa.')
    if (!['Ativo', 'Inativo', 'Prospecto'].includes(String(row.status))) throw new Error('Informe o status da pessoa.')
    const branch = requireRow(tables, 'filiais', row.filial_id)
    sameTenant(branch, row)
    if (branch.ativo !== true) throw new Error('A corretora está inativa.')
    if (typeof row.nome !== 'string' || !row.nome.trim()) throw new Error('Nome é obrigatório.')
    for (const key of ['produtor_id', 'gerente_id']) if (row[key]) sameTenant(requireRow(tables, 'produtores', row[key]), row)
  }
  if (table === 'produtores') {
    if (!String(row.nome ?? '').trim()) throw new Error('Nome do produtor é obrigatório.')
    if (row.profile_id) {
      sameTenant(requireRow(tables, 'profiles', row.profile_id), row)
      if (tables(table).some(r => r.id !== row.id && r.profile_id === row.profile_id)) throw new Error('Este usuário já está vinculado a um produtor.')
    }
    if (row.descontar_imposto === true && row.percentual_imposto == null) throw new Error('Informe o percentual de imposto do produtor.')
  }
  if (table === 'perfis') {
    if (!String(row.nome ?? '').trim()) throw new Error('Nome do perfil é obrigatório.')
    if (tables(table).some(r => r.id !== row.id && r.tenant_id === row.tenant_id && r.ativo === true && String(r.nome).trim().toLocaleLowerCase('pt-BR') === String(row.nome).trim().toLocaleLowerCase('pt-BR'))) throw new Error('Já existe um perfil ativo com esse nome.')
  }
  if (table === 'profile_filiais') {
    const profile = requireRow(tables, 'profiles', row.profile_id)
    const branch = requireRow(tables, 'filiais', row.filial_id)
    const role = requireRow(tables, 'perfis', row.perfil_id)
    sameTenant(branch, profile); sameTenant(role, profile)
    if (row.ativo === true && (branch.ativo !== true || role.ativo !== true)) throw new Error('Corretora e perfil devem estar ativos.')
    if (!validDate(row.data_inicio) || !validDate(row.data_fim)) throw new Error('Informe datas válidas para o acesso.')
    if (row.data_inicio && row.data_fim && String(row.data_inicio) > String(row.data_fim)) throw new Error('O fim do acesso deve ser igual ou posterior ao início.')
    if (tables(table).some(r => r.id !== row.id && r.profile_id === row.profile_id && r.filial_id === row.filial_id)) throw new Error('Já existe vínculo para esta corretora.')
  }
  if (table === 'role_permissions') {
    requireRow(tables, 'perfis', row.perfil_id)
    if (!['GRUPO','CORRETORA','PROPRIO'].includes(String(row.escopo))) throw new Error('Selecione o escopo da permissão.')
    if (!String(row.modulo ?? '').trim()) throw new Error('Módulo é obrigatório.')
    if (tables(table).some(r => r.id !== row.id && r.perfil_id === row.perfil_id && r.modulo === row.modulo)) throw new Error('Permissão já cadastrada para este módulo.')
  }
  if (table === 'pessoa_contato') {
    const pj = requireRow(tables, 'segurados', row.pj_id)
    if (pj.tipo !== 'PJ') throw new Error('Contato empresarial deve pertencer a uma pessoa jurídica.')
    if (row.pf_id) {
      const pf = requireRow(tables, 'segurados', row.pf_id)
      if (pf.tipo !== 'PF' || pf.filial_id !== pj.filial_id || pf.tenant_id !== pj.tenant_id) throw new Error('A pessoa física deve pertencer à mesma corretora da empresa.')
    } else if (!String(row.nome ?? '').trim()) throw new Error('Nome é obrigatório para contato sem pessoa física vinculada.')
  }
}
