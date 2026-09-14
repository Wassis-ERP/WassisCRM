import { requestAuthenticatedBackendJson } from './backendApi'
import type { Filial, FilialInput, Perfil, ProfileFilial } from '../types/platform'
import type { RolePermissionRow } from '../types/platformRows'

export interface BackendAdministrationUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  status: string
  isActive: boolean
  invitationStatus: string | null
  invitationSentAt: string | null
  lastAccessAt: string | null
  branchCount: number
  primaryAccessProfile: string | null
}

export interface AdministrationOrganization {
  id: string
  legalName: string | null
  tradeName: string | null
  documentNumber: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  website: string | null
  timeZone: string | null
  defaultCurrency: string | null
  status: string | null
  isActive: boolean
}

export interface AdministrationStatistics {
  activeBranches: number
  activeUsers: number
  inactiveUsers: number
  pendingInvitations: number
  insuredPeople: number
  openOpportunities: number
  wonOpportunities: number
  lostOpportunities: number
}

interface BackendAccessProfile {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  accessLevel: string | null
  order: number | null
  isActive: boolean
}

interface BackendPermission {
  id: string
  accessProfileId: string
  module: string
  scope: string
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canExport: boolean
  canManage: boolean
}

interface BackendBranchAccess {
  id: string
  userId: string
  branchId: string
  accessProfileId: string
  isPrimary: boolean
  isActive: boolean
  startsOn: string | null
  endsOn: string | null
}

interface BackendAdministrationBranch {
  id: string; tenantId: string; parentBranchId: string | null; legalName: string | null; tradeName: string | null
  documentNumber: string | null; susep: string | null; taxPercentage: number | null; lgpdAccepted: boolean
  lgpdAcceptedAt: string | null; manager: string | null; managerId: string | null; contact: string | null
  website: string | null; email: string | null; phone: string | null; mobile: string | null; secondaryPhone: string | null
  stateRegistration: string | null; municipalRegistration: string | null; taxRegime: string | null; issPercentage: number | null
  brokerageCode: string | null; externalCode: string | null; ibgeCityCode: string | null; country: string | null
  businessHours: string | null; notes: string | null; postalCode: string | null; address: string | null
  number: string | null; complement: string | null; district: string | null; city: string | null; state: string | null; isActive: boolean
}

const toPerfil = (row: BackendAccessProfile): Perfil => ({
  id: row.id,
  tenant_id: '',
  nome: row.name,
  descricao: row.description,
  sistema: row.isSystem,
  nivel_acesso: row.accessLevel,
  ordem: row.order,
  ativo: row.isActive,
})

const toPermission = (row: BackendPermission): RolePermissionRow => ({
  id: row.id,
  perfil_id: row.accessProfileId,
  modulo: row.module,
  escopo: row.scope === 'GRUPO' || row.scope === 'PROPRIO' ? row.scope : 'CORRETORA',
  can_read: row.canRead,
  can_create: row.canCreate,
  can_update: row.canUpdate,
  can_delete: row.canDelete,
  can_export: row.canExport,
  can_manage: row.canManage,
})

const toBranchAccess = (row: BackendBranchAccess): ProfileFilial => ({
  id: row.id,
  profile_id: row.userId,
  filial_id: row.branchId,
  perfil_id: row.accessProfileId,
  principal: row.isPrimary,
  ativo: row.isActive,
  data_inicio: row.startsOn,
  data_fim: row.endsOn,
})

const toBranch = (row: BackendAdministrationBranch): Filial => ({
  id: row.id, tenant_id: row.tenantId, matriz_id: row.parentBranchId,
  razao_social: row.legalName, fantasia: row.tradeName, cnpj_cpf: row.documentNumber,
  susep: row.susep, percentual_imposto: row.taxPercentage, lgpd_aceito: row.lgpdAccepted,
  lgpd_aceito_em: row.lgpdAcceptedAt, gerente: row.manager, gerente_id: row.managerId,
  contato: row.contact, home_page: row.website, email: row.email, telefone: row.phone,
  celular: row.mobile, telefone2: row.secondaryPhone, inscricao_estadual: row.stateRegistration,
  inscricao_municipal: row.municipalRegistration, regime_tributario: row.taxRegime,
  percentual_iss: row.issPercentage, codigo_corretora: row.brokerageCode,
  codigo_externo: row.externalCode, municipio_ibge: row.ibgeCityCode, pais: row.country,
  horario_atendimento: row.businessHours, observacoes: row.notes, cep: row.postalCode,
  endereco: row.address, numero: row.number, complemento: row.complement, bairro: row.district,
  cidade: row.city, uf: row.state, ativo: row.isActive,
})

const branchPayload = (branch: FilialInput) => ({
  parentBranchId: branch.matriz_id, legalName: branch.razao_social, tradeName: branch.fantasia,
  documentNumber: branch.cnpj_cpf, susep: branch.susep, taxPercentage: branch.percentual_imposto,
  lgpdAccepted: branch.lgpd_aceito === true, lgpdAcceptedAt: branch.lgpd_aceito_em,
  manager: branch.gerente, managerId: branch.gerente_id, contact: branch.contato,
  website: branch.home_page, email: branch.email, phone: branch.telefone, mobile: branch.celular,
  secondaryPhone: branch.telefone2, stateRegistration: branch.inscricao_estadual,
  municipalRegistration: branch.inscricao_municipal, taxRegime: branch.regime_tributario,
  issPercentage: branch.percentual_iss, brokerageCode: branch.codigo_corretora,
  externalCode: branch.codigo_externo, ibgeCityCode: branch.municipio_ibge, country: branch.pais,
  businessHours: branch.horario_atendimento, notes: branch.observacoes, postalCode: branch.cep,
  address: branch.endereco, number: branch.numero, complement: branch.complemento,
  district: branch.bairro, city: branch.cidade, state: branch.uf, isActive: branch.ativo !== false,
})

export const listAdministrationUsers = () =>
  requestAuthenticatedBackendJson<BackendAdministrationUser[]>('/api/administration/users')

export const inviteAdministrationUser = (name: string, email: string) =>
  requestAuthenticatedBackendJson<BackendAdministrationUser>('/api/administration/users', {
    method: 'POST', body: JSON.stringify({ name, email }),
  })

export const setAdministrationUserStatus = (userId: string, isActive: boolean) =>
  requestAuthenticatedBackendJson<{ userId: string; isActive: boolean }>(`/api/administration/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH', body: JSON.stringify({ isActive }),
  })

export async function listAdministrationUserBranches(userId: string): Promise<ProfileFilial[]> {
  const rows = await requestAuthenticatedBackendJson<BackendBranchAccess[]>(`/api/administration/users/${encodeURIComponent(userId)}/branches`)
  return rows.map(toBranchAccess)
}

export async function saveAdministrationUserBranch(input: {
  userId: string
  branchId: string
  accessProfileId: string
  isPrimary?: boolean
  isActive?: boolean
  startsOn?: string | null
  endsOn?: string | null
}): Promise<ProfileFilial> {
  const row = await requestAuthenticatedBackendJson<BackendBranchAccess>(
    `/api/administration/users/${encodeURIComponent(input.userId)}/branches/${encodeURIComponent(input.branchId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        accessProfileId: input.accessProfileId,
        isPrimary: input.isPrimary === true,
        isActive: input.isActive !== false,
        startsOn: input.startsOn ?? null,
        endsOn: input.endsOn ?? null,
      }),
    },
  )
  return toBranchAccess(row)
}

export async function listAdministrationAccessProfiles(): Promise<Perfil[]> {
  return (await requestAuthenticatedBackendJson<BackendAccessProfile[]>('/api/administration/access-profiles')).map(toPerfil)
}

export async function createAdministrationAccessProfile(name: string): Promise<Perfil> {
  return toPerfil(await requestAuthenticatedBackendJson<BackendAccessProfile>('/api/administration/access-profiles', {
    method: 'POST', body: JSON.stringify({ name, description: null, accessLevel: 'OPERACIONAL' }),
  }))
}

export async function updateAdministrationAccessProfile(profile: Perfil): Promise<Perfil> {
  return toPerfil(await requestAuthenticatedBackendJson<BackendAccessProfile>(`/api/administration/access-profiles/${encodeURIComponent(profile.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: profile.nome,
      description: profile.descricao,
      accessLevel: profile.nivel_acesso,
      isActive: profile.ativo !== false,
    }),
  }))
}

export async function listAdministrationPermissions(): Promise<RolePermissionRow[]> {
  return (await requestAuthenticatedBackendJson<BackendPermission[]>('/api/administration/permissions')).map(toPermission)
}

export async function updateAdministrationPermission(permission: RolePermissionRow): Promise<RolePermissionRow> {
  return toPermission(await requestAuthenticatedBackendJson<BackendPermission>(`/api/administration/permissions/${encodeURIComponent(permission.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      scope: permission.escopo,
      canRead: permission.can_read === true,
      canCreate: permission.can_create === true,
      canUpdate: permission.can_update === true,
      canDelete: permission.can_delete === true,
      canExport: permission.can_export === true,
      canManage: permission.can_manage === true,
    }),
  }))
}

export const getAdministrationOrganization = () =>
  requestAuthenticatedBackendJson<AdministrationOrganization>('/api/administration/organization')

export const updateAdministrationOrganization = (organization: Omit<AdministrationOrganization, 'id' | 'status' | 'isActive'>) =>
  requestAuthenticatedBackendJson<AdministrationOrganization>('/api/administration/organization', {
    method: 'PUT', body: JSON.stringify(organization),
  })

export const getAdministrationStatistics = () =>
  requestAuthenticatedBackendJson<AdministrationStatistics>('/api/administration/statistics')

export async function listAdministrationBranches(): Promise<Filial[]> {
  return (await requestAuthenticatedBackendJson<BackendAdministrationBranch[]>('/api/administration/branches')).map(toBranch)
}

export async function createAdministrationBranch(branch: FilialInput): Promise<Filial> {
  return toBranch(await requestAuthenticatedBackendJson<BackendAdministrationBranch>('/api/administration/branches', {
    method: 'POST', body: JSON.stringify(branchPayload(branch)),
  }))
}

export async function updateAdministrationBranch(id: string, branch: FilialInput): Promise<Filial> {
  return toBranch(await requestAuthenticatedBackendJson<BackendAdministrationBranch>(`/api/administration/branches/${encodeURIComponent(id)}`, {
    method: 'PUT', body: JSON.stringify(branchPayload(branch)),
  }))
}
