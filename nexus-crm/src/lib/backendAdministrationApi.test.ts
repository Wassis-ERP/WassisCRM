import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestAuthenticatedBackendJson } from './backendApi'
import { createAdministrationBranch, listAdministrationAccessProfiles, listAdministrationPermissions } from './backendAdministrationApi'
import { platformDefaults } from '../types/platformRows'

vi.mock('./backendApi', () => ({ requestAuthenticatedBackendJson: vi.fn() }))

const request = vi.mocked(requestAuthenticatedBackendJson)

describe('backendAdministrationApi', () => {
  beforeEach(() => request.mockReset())

  it('falha fechado quando o backend devolve escopo de permissão desconhecido', async () => {
    request.mockResolvedValueOnce([{
      id: 'permission-1', accessProfileId: 'profile-1', module: 'segurados', scope: 'INVALIDO',
      canRead: true, canCreate: false, canUpdate: true, canDelete: false, canExport: false, canManage: false,
    }])

    await expect(listAdministrationPermissions()).rejects.toThrow('Escopo de permissão inválido')
  })

  it('preserva o tenant do perfil e as seis ações independentes', async () => {
    request.mockResolvedValueOnce([{ id: 'profile-1', tenantId: 'tenant-1', name: 'Financeiro',
      description: null, isSystem: false, accessLevel: 'OPERACIONAL', order: 2, isActive: true }])
    request.mockResolvedValueOnce([{ id: 'permission-1', accessProfileId: 'profile-1', module: 'financeiro',
      scope: 'PROPRIO', canRead: true, canCreate: false, canUpdate: false,
      canDelete: false, canExport: true, canManage: false }])

    await expect(listAdministrationAccessProfiles()).resolves.toMatchObject([{
      tenant_id: 'tenant-1', nome: 'Financeiro', nivel_acesso: 'OPERACIONAL',
    }])
    await expect(listAdministrationPermissions()).resolves.toEqual([{
      id: 'permission-1', perfil_id: 'profile-1', modulo: 'financeiro', escopo: 'PROPRIO',
      can_read: true, can_create: false, can_update: false, can_delete: false,
      can_export: true, can_manage: false,
    }])
  })

  it('traduz uma corretora para o contrato administrativo sem perder os campos fiscais', async () => {
    request.mockResolvedValueOnce({
      id: 'branch-1', tenantId: 'tenant-1', parentBranchId: null, legalName: 'Corretora Teste', tradeName: 'Teste',
      documentNumber: '12345678000199', susep: '123', taxPercentage: 6, lgpdAccepted: true,
      lgpdAcceptedAt: null, manager: null, managerId: null, contact: null, website: null, email: null,
      phone: null, mobile: null, secondaryPhone: null, stateRegistration: 'ISENTO', municipalRegistration: null,
      taxRegime: 'SIMPLES', issPercentage: 2, brokerageCode: null, externalCode: null, ibgeCityCode: null,
      country: 'Brasil', businessHours: null, notes: null, postalCode: '01001000', address: 'Praça da Sé',
      number: '1', complement: null, district: 'Sé', city: 'São Paulo', state: 'SP', isActive: true,
    })
    const branch = {
      ...platformDefaults.filiais,
      razao_social: 'Corretora Teste', fantasia: 'Teste', cnpj_cpf: '12.345.678/0001-99',
      susep: '123', percentual_imposto: 6, lgpd_aceito: true,
      inscricao_estadual: 'ISENTO', regime_tributario: 'SIMPLES', percentual_iss: 2,
      pais: 'Brasil', cep: '01001-000', endereco: 'Praça da Sé', numero: '1', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP', ativo: true,
    }

    const result = await createAdministrationBranch(branch)

    expect(result).toMatchObject({ id: 'branch-1', tenant_id: 'tenant-1', razao_social: 'Corretora Teste', percentual_iss: 2 })
    expect(request).toHaveBeenCalledWith('/api/administration/branches', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse((request.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({ legalName: 'Corretora Teste', stateRegistration: 'ISENTO', issPercentage: 2 })
  })
})
