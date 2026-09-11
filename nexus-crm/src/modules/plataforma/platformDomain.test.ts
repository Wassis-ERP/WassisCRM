import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import { supabase } from '../../lib/supabase'
import { platformColumns, platformDefaults } from '../../types/platformRows'
import type { ProfileFilialRow, ProfileRow, RolePermissionRow } from '../../types/platformRows'
import { allowsPermission, isActiveLink } from './platformDomain'
import { activeProfileLinks, createCustomProfile, saveCompanyContact, saveProfileBranchAccess } from './platformCommands'

const tables = Object.keys(platformColumns)
let snapshot: Record<string, Record<string, unknown>[]>
beforeEach(() => { snapshot = Object.fromEntries(tables.map(t => [t, structuredClone(getTable(t))])) })
afterEach(() => { for (const t of tables) getTable(t).splice(0, getTable(t).length, ...snapshot[t]) })
const tenant = 'mock-tenant-id'
const user = 'mock-user-id'
const branch = 'mock-branch-id'
const center = 'mock-branch-centro'

describe('contrato e comandos da plataforma', () => {
  it('semeia as nove entidades apenas com colunas canônicas, incluindo valores desconhecidos', () => {
    for (const [table, columns] of Object.entries(platformColumns)) {
      for (const row of getTable(table)) expect(Object.keys(row).sort()).toEqual([...columns].sort())
    }
    expect(getTable('tenants')[0]).toMatchObject({ razao_social: 'Wassis Dev', nome_fantasia: null })
    expect(getTable('profiles')[0]).toMatchObject({ nome_completo: 'Dev Wassis', ativo: true, status: 'ATIVO' })
  })

  it('recusa FKs ausentes e corretora de outro grupo antes de inserir', async () => {
    const length = getTable('segurados').length
    const base = { nome: 'Prospecto sem documento', tipo: 'PF', status: 'Prospecto', filial_id: branch }
    const missing = await supabase.from('segurados').insert(base)
    expect(missing.error?.message).toContain('tenant_id')
    getTable('tenants').push({ ...platformDefaults.tenants, id: 'other-tenant' })
    const wrong = await supabase.from('segurados').insert({ ...base, tenant_id: 'other-tenant' })
    expect(wrong.error?.message).toContain('mesmo grupo')
    expect(getTable('segurados')).toHaveLength(length)
    const valid = await supabase.from('segurados').insert({ ...base, tenant_id: tenant }).select().single()
    expect(valid.error).toBeNull()
    expect(valid.data).toMatchObject({ tenant_id: tenant, filial_id: branch, profissao: null })
  })

  it('preserva dados opcionais e não modifica lote quando uma escrita falha', async () => {
    const produtor = getTable('produtores')[0]
    const oldRate = produtor.percentual_repasse_padrao
    await supabase.from('produtores').update({ favorecido_nome: 'Favorecido distinto', percentual_imposto: 0 }).eq('id', produtor.id)
    await supabase.from('produtores').update({ nome: 'Nome atualizado' }).eq('id', produtor.id)
    expect(produtor).toMatchObject({ favorecido_nome: 'Favorecido distinto', percentual_imposto: 0, percentual_repasse_padrao: oldRate })
    const before = structuredClone(getTable('produtores'))
    const result = await supabase.from('produtores').update({ percentual_imposto: 101 })
    expect(result.error?.message).toContain('entre 0 e 100')
    expect(getTable('produtores')).toEqual(before)
  })

  it('valida período antes de trocar a principal e preserva vínculo inativado', () => {
    const role = String(getTable('perfis').find(r => r.nome === 'Master')!.id)
    const before = structuredClone(getTable('profile_filiais'))
    expect(() => saveProfileBranchAccess({ tenantId: tenant, profileId: user, filialId: center, perfilId: role, principal: true, data_inicio: '2026-09-12', data_fim: '2026-09-11' })).toThrow('posterior')
    expect(getTable('profile_filiais')).toEqual(before)
    const row = saveProfileBranchAccess({ tenantId: tenant, profileId: user, filialId: center, perfilId: role, ativo: false })
    expect(row.ativo).toBe(false)
    expect(getTable('profile_filiais').find(v => v.id === row.id)).toBeDefined()
    expect(activeProfileLinks(user).map(v => v.filial_id)).toEqual([branch])
    saveProfileBranchAccess({ tenantId: tenant, profileId: user, filialId: center, perfilId: role, ativo: true })
    expect(activeProfileLinks(user)).toHaveLength(2)
    getTable('profiles').find(p => p.id === user)!.ativo = false
    expect(activeProfileLinks(user)).toEqual([])
  })

  it('não publica a primeira alteração de upsert quando outra linha do lote é inválida', async () => {
    const original = structuredClone(getTable('produtores')[0])
    const result = await supabase.from('produtores').upsert([
      { id: original.id, nome: 'Não deve persistir' },
      { id: 'invalid-producer', tenant_id: tenant, nome: 'Inválido', percentual_imposto: 110 },
    ])
    expect(result.error?.message).toContain('entre 0 e 100')
    expect(getTable('produtores').find(p => p.id === original.id)).toEqual(original)
    expect(getTable('produtores').some(p => p.id === 'invalid-producer')).toBe(false)
  })

  it('cria perfil com seis ações independentes e bloqueia nome duplicado sem linhas órfãs', () => {
    const profile = createCustomProfile(tenant, 'Atendimento novo', ['segurados', 'comercial'])
    const permissions = getTable('role_permissions').filter(p => p.perfil_id === profile.id)
    expect(permissions).toHaveLength(2)
    expect(permissions[0]).toMatchObject({ escopo: 'CORRETORA', can_read: false, can_export: false, can_manage: false })
    const count = getTable('role_permissions').length
    expect(() => createCustomProfile(tenant, ' atendimento NOVO ', ['segurados'])).toThrow('Já existe')
    expect(getTable('role_permissions')).toHaveLength(count)
  })

  it('cadastra contato sem PF, edita e preserva principal quando outro contato é inválido', () => {
    const pj = getTable('segurados').find(p => p.tipo === 'PJ' && p.filial_id === branch)!
    expect(pj).toBeDefined()
    const first = saveCompanyContact({ tenantId: tenant, pjId: String(pj.id), pfId: null, nome: 'Compras', email: 'compras@example.com', principal: true })
    expect(first).toMatchObject({ pf_id: null, nome: 'Compras', principal: true })
    expect(() => saveCompanyContact({ tenantId: tenant, pjId: String(pj.id), pfId: 'inexistente', principal: true })).toThrow('Vínculo inválido')
    expect(getTable('pessoa_contato').find(c => c.id === first.id)?.principal).toBe(true)
    const edited = saveCompanyContact({ id: String(first.id), tenantId: tenant, pjId: String(pj.id), pfId: null, nome: 'Compras e contratos' })
    expect(edited.email).toBe('compras@example.com')
    const otherPF = getTable('segurados').find(p => p.tipo === 'PF' && p.filial_id === center)!
    expect(() => saveCompanyContact({ tenantId: tenant, pjId: String(pj.id), pfId: String(otherPF.id) })).toThrow('mesma corretora')
  })
})

describe('escopos e vigência na simulação de permissão', () => {
  const profile: ProfileRow = { ...platformDefaults.profiles, id: 'u', tenant_id: 't', ativo: true, status: 'ATIVO' }
  const links: ProfileFilialRow[] = ['a','b'].map(filial_id => ({ ...platformDefaults.profile_filiais, id: filial_id, profile_id: 'u', filial_id, perfil_id: filial_id, ativo: true }))
  const permission: RolePermissionRow = { ...platformDefaults.role_permissions, id: 'p', perfil_id: 'a', modulo: 'segurados', escopo: 'CORRETORA', can_read: true, can_update: true, can_export: false, can_manage: true }
  const base = { profile, links, permissions: [permission], activeBranchId: 'a', module: 'segurados', action: 'update' as const }
  it('não empresta permissão de uma corretora para outra em Todas as corretoras', () => {
    expect(allowsPermission(base)).toBe(true)
    expect(allowsPermission({ ...base, activeBranchId: null, context: { filialId: 'b' } })).toBe(false)
    expect(allowsPermission({ ...base, permissions: [{ ...permission, escopo: 'GRUPO' }], context: { filialId: 'b' } })).toBe(true)
    expect(allowsPermission({ ...base, permissions: [{ ...permission, escopo: 'GRUPO' }], context: { filialId: 'c' } })).toBe(false)
    expect(allowsPermission({ ...base, action: 'export' })).toBe(false)
  })
  it('próprio exige responsabilidade explícita para escrita e não infere dono', () => {
    const own = { ...base, permissions: [{ ...permission, escopo: 'PROPRIO' as const }] }
    expect(allowsPermission(own)).toBe(false)
    expect(allowsPermission({ ...own, action: 'read' })).toBe(true)
    expect(allowsPermission({ ...own, context: { filialId: 'a', responsibleProfileIds: ['u'] } })).toBe(true)
    expect(allowsPermission({ ...own, context: { filialId: 'a', responsibleProfileIds: ['someone'] } })).toBe(false)
  })
  it('usa limites inclusivos e nega usuário inativo, vínculo expirado e estado desconhecido', () => {
    expect(isActiveLink({ ativo: true, data_inicio: '2026-09-11', data_fim: '2026-09-11' }, '2026-09-11')).toBe(true)
    expect(allowsPermission({ ...base, links: [{ ...links[0], data_fim: '2026-09-10' }], day: '2026-09-11' })).toBe(false)
    expect(allowsPermission({ ...base, profile: { ...profile, ativo: false } })).toBe(false)
    expect(allowsPermission({ ...base, links: [{ ...links[0], ativo: null }] })).toBe(false)
  })
})
