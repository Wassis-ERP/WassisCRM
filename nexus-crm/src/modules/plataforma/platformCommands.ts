import { getTable, newId } from '../../lib/inMemoryDb'
import { platformDefaults } from '../../types/platformRows'
import type { PerfilRow, ProfileFilialRow, ProfileRow, RolePermissionRow } from '../../types/platformRows'
import { canonicalPlatformRow, isActiveLink, isActiveProfile, validatePlatformRow } from './platformDomain'

export function activeProfileLinks(profileId: string): ProfileFilialRow[] {
  const profile = getTable('profiles').find(p => p.id === profileId) as ProfileRow | undefined
  if (!profile || !isActiveProfile(profile)) return []
  return (getTable('profile_filiais') as ProfileFilialRow[]).filter(v => {
    const branch = getTable('filiais').find(b => b.id === v.filial_id)
    const role = getTable('perfis').find(p => p.id === v.perfil_id)
    return v.profile_id === profileId && isActiveLink(v) && branch?.ativo === true && role?.ativo === true && branch.tenant_id === profile.tenant_id && role.tenant_id === profile.tenant_id
  })
}

export function saveProfileBranchAccess(input: {
  profileId: string; tenantId: string; filialId: string; perfilId: string
  principal?: boolean; ativo?: boolean; data_inicio?: string | null; data_fim?: string | null
}): ProfileFilialRow {
  const profile = getTable('profiles').find(p => p.id === input.profileId)
  if (!profile || profile.tenant_id !== input.tenantId) throw new Error('Usuário não pertence ao grupo ativo.')
  const table = getTable('profile_filiais')
  const existing = table.find(v => v.profile_id === input.profileId && v.filial_id === input.filialId)
  const row = canonicalPlatformRow('profile_filiais', {
    ...platformDefaults.profile_filiais, ...existing,
    id: existing?.id ?? newId(), profile_id: input.profileId, filial_id: input.filialId, perfil_id: input.perfilId,
    ativo: input.ativo ?? existing?.ativo ?? true,
    principal: input.principal ?? existing?.principal ?? false,
    data_inicio: input.data_inicio === undefined ? existing?.data_inicio ?? null : input.data_inicio,
    data_fim: input.data_fim === undefined ? existing?.data_fim ?? null : input.data_fim,
  })
  if (row.ativo !== true) row.principal = false
  validatePlatformRow('profile_filiais', row, getTable)
  if (row.principal && !isActiveLink(row as ProfileFilialRow)) throw new Error('A corretora principal precisa ter acesso vigente.')
  if (row.principal) table.filter(v => v.profile_id === input.profileId && v.id !== row.id).forEach(v => { v.principal = false })
  if (existing) Object.assign(existing, row)
  else table.push(row)
  return row as ProfileFilialRow
}

export function createCustomProfile(tenantId: string, nome: string, modules: readonly string[]): PerfilRow {
  const profile: PerfilRow = { ...platformDefaults.perfis, id: newId(), tenant_id: tenantId, nome: nome.trim(), ativo: true, sistema: false, ordem: getTable('perfis').length }
  validatePlatformRow('perfis', profile, getTable)
  const permissions: RolePermissionRow[] = [...new Set(modules)].map(modulo => ({
    ...platformDefaults.role_permissions, id: newId(), perfil_id: profile.id, modulo, escopo: 'CORRETORA',
    can_read: false, can_create: false, can_update: false, can_delete: false, can_export: false, can_manage: false,
  }))
  const tables = (table: string) => table === 'perfis' ? [...getTable(table), profile] : getTable(table)
  permissions.forEach(p => validatePlatformRow('role_permissions', p, tables))
  getTable('perfis').push(profile); getTable('role_permissions').push(...permissions)
  return profile
}

export function saveCompanyContact(input: {
  id?: string; tenantId: string; pjId: string; pfId: string | null; cargo?: string | null
  principal?: boolean; nome?: string | null; departamento?: string | null; email?: string | null
  telefone?: string | null; celular?: string | null; ativo?: boolean; observacoes?: string | null
}) {
  const table = getTable('pessoa_contato')
  const existing = input.id ? table.find(r => r.id === input.id) : undefined
  if (input.id && !existing) throw new Error('Contato não encontrado.')
  if (existing && existing.pj_id !== input.pjId) throw new Error('O contato deve permanecer vinculado à empresa de origem.')
  const pj = getTable('segurados').find(p => p.id === input.pjId)
  if (!pj || pj.tenant_id !== input.tenantId) throw new Error('Empresa não pertence ao grupo ativo.')
  const row = canonicalPlatformRow('pessoa_contato', {
    ...platformDefaults.pessoa_contato, ...existing, id: input.id ?? newId(), pj_id: input.pjId, pf_id: input.pfId,
    ativo: input.ativo ?? existing?.ativo ?? true, principal: input.principal ?? existing?.principal ?? false,
    ...Object.fromEntries(['nome', 'cargo', 'departamento', 'email', 'telefone', 'celular', 'observacoes'].filter(key => Object.hasOwn(input, key)).map(key => [key, input[key as keyof typeof input] || null])),
  })
  if (!row.ativo) row.principal = false
  validatePlatformRow('pessoa_contato', row, getTable)
  if (row.pf_id && table.some(r => r.id !== row.id && r.pj_id === row.pj_id && r.pf_id === row.pf_id && r.ativo !== false)) throw new Error('Esta pessoa já é contato da empresa.')
  if (row.principal) table.filter(r => r.id !== row.id && r.pj_id === row.pj_id).forEach(r => { r.principal = false })
  if (existing) Object.assign(existing, row); else table.push(row)
  return row
}
