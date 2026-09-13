import { getBackendSessionSnapshot, requestAuthenticatedBackendJson } from './backendApi'
import type { Database, Json } from '../types/database'
import { platformDefaults } from '../types/platformRows'
import { listBackendCatalog } from './backendLookups'

type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoInsert = Database['public']['Tables']['segurados']['Insert']
type SeguradoUpdate = Database['public']['Tables']['segurados']['Update']
type OportunidadeRow = Database['public']['Tables']['oportunidades']['Row']
type OportunidadeInsert = Database['public']['Tables']['oportunidades']['Insert']
type OportunidadeUpdate = Database['public']['Tables']['oportunidades']['Update']

export const usesBackendDomainData = import.meta.env.VITE_DATA_MODE === 'backend'

export interface BackendInsuredPerson {
  [key: string]: unknown
  socialName?: string | null
  identityDocument?: string | null
  municipalRegistration?: string | null
  economicActivity?: string | null
  profession?: string | null
  monthlyIncome?: number | null
  driverLicenseNumber?: string | null
  driverLicenseCategory?: string | null
  driverLicenseExpirationDate?: string | null
  mobilePhoneNumber?: string | null
  secondaryPhoneNumber?: string | null
  whatsAppNumber?: string | null
  country?: string | null
  lgpdAuthorizedAtUtc?: string | null
  importOrigin?: string | null
  id: string
  officeBranchId: string | null
  name: string
  personType: string
  status: string
  documentNumber: string | null
  email: string | null
  phoneNumber: string | null
  birthDateUtc: string | null
  tradeName: string | null
  gender: string | null
  maritalStatus: string | null
  companySize: string | null
  cnae: string | null
  website: string | null
  postalCode: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  producerId: string | null
  managerId: string | null
  chatwootId: string | null
  lgpdAuthorized: boolean
  createdBy: string | null
  createdAtUtc: string
  updatedAtUtc: string
}

export interface BackendOpportunity {
  [key: string]: unknown
  originPolicyId?: string | null
  leadName?: string | null
  leadDocumentNumber?: string | null
  leadEmail?: string | null
  leadPhoneNumber?: string | null
  title?: string | null
  description?: string | null
  priority?: string | null
  estimatedPremiumAmount?: number | null
  estimatedCommissionAmount?: number | null
  estimatedCommissionPercentage?: number | null
  openedOn?: string | null
  expectedCloseDate?: string | null
  wonAtUtc?: string | null
  lostAtUtc?: string | null
  lossReasonNotes?: string | null
  campaign?: string | null
  internalNotes?: string | null
  id: string
  officeBranchId: string | null
  name: string
  responsibleId: string
  insuredPersonId: string | null
  pipelineId: string | null
  stageId: string | null
  insuranceLineId: string | null
  insurerId: string | null
  originId: string | null
  lossReasonId: string | null
  status: string
  businessType: string | null
  contactType: boolean | null
  netPremium: number | null
  commissionPercentage: number | null
  agencyPercentage: number | null
  productionAmount: number | null
  validityStartUtc: string | null
  validityEndUtc: string | null
  nextFollowUpUtc: string | null
  concludedAtUtc: string | null
  referrer: string | null
  notes: string | null
  metadata: Json
  createdAtUtc: string
  updatedAtUtc: string
}

function requireId(value: string | null | undefined, label: string): string {
  if (!value?.trim()) throw new Error(label + ' não informado pela integração.')
  return value
}

const resolveTenant = (tenantId: string | null) => requireId(tenantId ?? getBackendSessionSnapshot()?.tenantId, 'Grupo')

export function mapInsuredPerson(source: BackendInsuredPerson, tenantId: string | null): SeguradoRow {
  if (!source || typeof source.id !== 'string' || typeof source.name !== 'string' || !['PF', 'PJ'].includes(source.personType)
    || !['Ativo', 'Inativo', 'Prospecto'].includes(source.status) || typeof source.lgpdAuthorized !== 'boolean') throw new Error('Cadastro inválido retornado pelo backend.')
  return {
    ...platformDefaults.segurados,
    id: source.id,
    tenant_id: resolveTenant(tenantId),
    filial_id: requireId(source.officeBranchId, 'Corretora'),
    nome: source.name,
    nome_social: source.socialName ?? null,
    rg_ie: source.identityDocument ?? null,
    inscricao_municipal: source.municipalRegistration ?? null,
    atividade_economica: source.economicActivity ?? null,
    profissao: source.profession ?? null,
    renda_mensal: source.monthlyIncome ?? null,
    cnh_numero: source.driverLicenseNumber ?? null,
    cnh_categoria: source.driverLicenseCategory ?? null,
    cnh_vencimento: source.driverLicenseExpirationDate ?? null,
    celular: source.mobilePhoneNumber ?? null,
    telefone2: source.secondaryPhoneNumber ?? null,
    whatsapp: source.whatsAppNumber ?? null,
    pais: source.country ?? null,
    lgpd_autorizado_em: source.lgpdAuthorizedAtUtc ?? null,
    origem_importacao: source.importOrigin ?? null,
    tipo: source.personType as SeguradoRow['tipo'],
    status: source.status as SeguradoRow['status'],
    cpf_cnpj: source.documentNumber,
    email: source.email,
    telefone: source.phoneNumber,
    data_nascimento: source.birthDateUtc?.slice(0, 10) ?? null,
    nome_fantasia: source.tradeName,
    sexo: source.gender as SeguradoRow['sexo'],
    estado_civil: source.maritalStatus as SeguradoRow['estado_civil'],
    porte: source.companySize as SeguradoRow['porte'],
    cnae: source.cnae,
    site: source.website,
    cep: source.postalCode,
    endereco: source.street,
    logradouro: source.street,
    numero: source.number,
    complemento: source.complement,
    bairro: source.neighborhood,
    cidade: source.city,
    estado: source.state,
    observacoes: source.notes,
    produtor_id: source.producerId,
    gerente_id: source.managerId,
    chatwoot_id: source.chatwootId,
    lgpd_autorizado: source.lgpdAuthorized,
    created_at: source.createdAtUtc,
    updated_at: source.updatedAtUtc,
  }
}

function insuredRequest(source: SeguradoInsert | SeguradoRow) {
  if (!source.nome?.trim() || !source.tipo || !source.status) throw new Error('Informe nome, tipo e status antes de salvar.')
  if (source.lgpd_autorizado == null) throw new Error('Informe a decisão de autorização LGPD antes de salvar.')
  requireId(source.filial_id, 'Corretora')
  return {
    officeBranchId: source.filial_id ?? null,
    name: source.nome,
    socialName: source.nome_social ?? null,
    identityDocument: source.rg_ie ?? null,
    municipalRegistration: source.inscricao_municipal ?? null,
    economicActivity: source.atividade_economica ?? null,
    profession: source.profissao ?? null,
    monthlyIncome: source.renda_mensal ?? null,
    driverLicenseNumber: source.cnh_numero ?? null,
    driverLicenseCategory: source.cnh_categoria ?? null,
    driverLicenseExpirationDate: source.cnh_vencimento ?? null,
    mobilePhoneNumber: source.celular ?? null,
    secondaryPhoneNumber: source.telefone2 ?? null,
    whatsAppNumber: source.whatsapp ?? null,
    country: source.pais ?? null,
    lgpdAuthorizedAtUtc: source.lgpd_autorizado_em ?? null,
    importOrigin: source.origem_importacao ?? null,
    personType: source.tipo,
    status: source.status,
    documentNumber: source.cpf_cnpj ?? null,
    email: source.email ?? null,
    phoneNumber: source.telefone ?? null,
    birthDateUtc: source.data_nascimento ?? null,
    tradeName: source.nome_fantasia ?? null,
    gender: source.sexo ?? null,
    maritalStatus: source.estado_civil ?? null,
    companySize: source.porte ?? null,
    cnae: source.cnae ?? null,
    website: source.site ?? null,
    postalCode: source.cep ?? null,
    street: source.logradouro ?? source.endereco ?? null,
    number: source.numero ?? null,
    complement: source.complemento ?? null,
    neighborhood: source.bairro ?? null,
    city: source.cidade ?? null,
    state: source.estado ?? null,
    notes: source.observacoes ?? null,
    producerId: source.produtor_id ?? null,
    managerId: source.gerente_id ?? null,
    chatwootId: source.chatwoot_id ?? null,
    lgpdAuthorized: source.lgpd_autorizado,
  }
}

export async function listBackendInsuredPeople(
  tenantId: string | null,
  officeBranchId?: string | null,
): Promise<SeguradoRow[]> {
  const response = await requestAuthenticatedBackendJson<BackendInsuredPerson[]>('/api/segurados')
  return response
    .map((item) => mapInsuredPerson(item, tenantId))
    .filter((item) => !officeBranchId || item.filial_id === officeBranchId)
    .sort((left, right) => (left.nome ?? '').localeCompare(right.nome ?? '', 'pt-BR'))
}

export async function getBackendInsuredPerson(id: string, tenantId: string | null): Promise<SeguradoRow> {
  const response = await requestAuthenticatedBackendJson<BackendInsuredPerson>(`/api/segurados/${id}`)
  return mapInsuredPerson(response, tenantId)
}

export async function createBackendInsuredPerson(
  input: SeguradoInsert,
  tenantId: string | null,
): Promise<SeguradoRow> {
  const response = await requestAuthenticatedBackendJson<BackendInsuredPerson>('/api/segurados', {
    method: 'POST',
    body: JSON.stringify(insuredRequest(input)),
  })
  return mapInsuredPerson(response, tenantId)
}

export async function updateBackendInsuredPerson(
  id: string,
  patch: SeguradoUpdate,
  tenantId: string | null,
): Promise<SeguradoRow> {
  const raw = await requestAuthenticatedBackendJson<BackendInsuredPerson>(`/api/segurados/${id}`)
  const current = mapInsuredPerson(raw, tenantId)
  const response = await requestAuthenticatedBackendJson<BackendInsuredPerson>(`/api/segurados/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...raw, ...insuredRequest({ ...current, ...patch }) }),
  })
  return mapInsuredPerson(response, tenantId)
}

function metadataObject(metadata: Json): Record<string, Json | undefined> {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? { ...metadata }
    : {}
}

// O DTO HTTP legado fica nesta fronteira; não reintroduz colunas antigas no DBML.
export function mapOpportunity(source: BackendOpportunity, tenantId: string | null): OportunidadeRow {
  if (!source || typeof source.id !== 'string' || typeof source.name !== 'string') throw new Error('Oportunidade inválida retornada pelo backend.')
  const metadata = metadataObject(source.metadata)
  if (!['pending', 'won', 'lost'].includes(source.status)) throw new Error('Status da oportunidade não reconhecido pela integração.')
  if (source.status !== 'pending' && !source.concludedAtUtc) throw new Error('Oportunidade concluída sem data informada pela integração.')
  return {
    id: source.id,
    tenant_id: resolveTenant(tenantId),
    filial_id: requireId(source.officeBranchId, 'Corretora'),
    responsavel_id: source.responsibleId,
    segurado_id: source.insuredPersonId,
    stage_id: requireId(source.stageId, 'Etapa'),
    ramo_id: source.insuranceLineId,
    origem_id: source.originId,
    motivo_perda_id: source.lossReasonId,
    apolice_origem_id: source.originPolicyId ?? (typeof metadata.apoliceOrigemId === 'string' ? metadata.apoliceOrigemId : null),
    lead_nome: source.insuredPersonId ? null : source.leadName ?? source.name,
    lead_documento: source.leadDocumentNumber ?? null,
    lead_email: source.leadEmail ?? null,
    lead_telefone: source.leadPhoneNumber ?? null,
    titulo: source.title ?? source.name,
    descricao: source.description ?? source.notes,
    prioridade: source.priority ?? null,
    valor_premio_estimado: source.estimatedPremiumAmount ?? source.netPremium,
    valor_comissao_estimada: source.estimatedCommissionAmount ?? null,
    comissao_estimada_pct: source.estimatedCommissionPercentage ?? source.commissionPercentage,
    agenciamento_pct: source.agencyPercentage,
    data_abertura: source.openedOn ?? source.createdAtUtc?.slice(0, 10) ?? null,
    data_fechamento_prevista: source.expectedCloseDate ?? null,
    ganha_em: source.status === 'won' ? source.wonAtUtc ?? source.concludedAtUtc : null,
    perdida_em: source.status === 'lost' ? source.lostAtUtc ?? source.concludedAtUtc : null,
    motivo_perda_observacao: source.lossReasonNotes ?? null,
    campanha: source.campaign ?? null,
    observacoes: source.internalNotes ?? null,
  }
}

async function opportunityRequest(source: OportunidadeInsert | OportunidadeRow, previous?: BackendOpportunity) {
  const previousMetadata = metadataObject(previous?.metadata ?? null)
  const previousOrigin = previous?.originPolicyId ?? (typeof previousMetadata.apoliceOrigemId === 'string' ? previousMetadata.apoliceOrigemId : null)
  if (source.apolice_origem_id !== undefined && source.apolice_origem_id !== previousOrigin) {
    throw new Error('O vínculo de renovação aguarda atualização da integração para o contrato v3.1.')
  }
  const stage = previous?.stageId === source.stage_id ? null : (await listBackendCatalog('pipeline_stages')).find(row => row.id === source.stage_id)
  const pipelineId = typeof stage?.pipeline_id === 'string' ? stage.pipeline_id : source.stage_id === previous?.stageId ? previous?.pipelineId : null
  const name = source.titulo?.trim() || source.lead_nome?.trim() || previous?.name
  if (!name) throw new Error('Informe o título da oportunidade antes de salvar.')
  return {
    ...previous,
    officeBranchId: requireId(source.filial_id, 'Corretora'),
    name,
    originPolicyId: source.apolice_origem_id ?? null,
    leadName: source.lead_nome ?? null,
    leadDocumentNumber: source.lead_documento ?? null,
    leadEmail: source.lead_email ?? null,
    leadPhoneNumber: source.lead_telefone ?? null,
    title: source.titulo ?? null,
    description: source.descricao ?? null,
    priority: source.prioridade ?? null,
    estimatedPremiumAmount: source.valor_premio_estimado ?? null,
    estimatedCommissionAmount: source.valor_comissao_estimada ?? null,
    estimatedCommissionPercentage: source.comissao_estimada_pct ?? null,
    openedOn: source.data_abertura ?? null,
    expectedCloseDate: source.data_fechamento_prevista ?? null,
    wonAtUtc: source.ganha_em ?? null,
    lostAtUtc: source.perdida_em ?? null,
    lossReasonNotes: source.motivo_perda_observacao ?? null,
    campaign: source.campanha ?? null,
    internalNotes: source.observacoes ?? null,
    responsibleId: source.responsavel_id ?? null,
    insuredPersonId: source.segurado_id ?? null,
    pipelineId: requireId(pipelineId, 'Funil da etapa'),
    stageId: requireId(source.stage_id, 'Etapa'),
    insuranceLineId: source.ramo_id ?? null,
    insurerId: previous?.insurerId ?? null,
    originId: source.origem_id ?? null,
    lossReasonId: source.motivo_perda_id ?? null,
    status: source.ganha_em ? 'won' : source.perdida_em ? 'lost' : 'pending',
    businessType: previous?.businessType ?? null,
    contactType: previous?.contactType ?? null,
    netPremium: source.valor_premio_estimado ?? null,
    commissionPercentage: source.comissao_estimada_pct ?? null,
    agencyPercentage: source.agenciamento_pct ?? null,
    productionAmount: previous?.productionAmount ?? null,
    validityStartUtc: previous?.validityStartUtc ?? null,
    validityEndUtc: previous?.validityEndUtc ?? null,
    nextFollowUpUtc: previous?.nextFollowUpUtc ?? null,
    concludedAtUtc: source.ganha_em ?? source.perdida_em ?? null,
    referrer: previous?.referrer ?? null,
    notes: source.descricao ?? null,
    // Preserva o legado recebido sem escrever novos dados de negócio em JSON.
    metadata: previous?.metadata ?? {},
  }
}

export interface BackendOpportunityFilters {
  pipelineId?: string | null
  stageId?: string | null
  status?: string | null
  officeBranchId?: string | null
}

export async function listBackendOpportunities(
  filters: BackendOpportunityFilters,
  tenantId: string | null,
): Promise<OportunidadeRow[]> {
  const query = new URLSearchParams()
  if (filters.pipelineId) query.set('pipelineId', filters.pipelineId)
  if (filters.stageId) query.set('stageId', filters.stageId)
  if (filters.status) query.set('status', filters.status)
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  const response = await requestAuthenticatedBackendJson<BackendOpportunity[]>(`/api/oportunidades${suffix}`)
  return response
    .map((item) => mapOpportunity(item, tenantId))
    .filter((item) => !filters.officeBranchId || item.filial_id === filters.officeBranchId)
}

export async function getBackendOpportunity(id: string, tenantId: string | null): Promise<OportunidadeRow> {
  const response = await requestAuthenticatedBackendJson<BackendOpportunity>(`/api/oportunidades/${id}`)
  return mapOpportunity(response, tenantId)
}

export async function createBackendOpportunity(
  input: OportunidadeInsert,
  tenantId: string | null,
): Promise<OportunidadeRow> {
  const response = await requestAuthenticatedBackendJson<BackendOpportunity>('/api/oportunidades', {
    method: 'POST',
    body: JSON.stringify(await opportunityRequest(input)),
  })
  return mapOpportunity(response, tenantId)
}

export async function updateBackendOpportunity(
  id: string,
  patch: OportunidadeUpdate,
  tenantId: string | null,
): Promise<OportunidadeRow> {
  const previous = await requestAuthenticatedBackendJson<BackendOpportunity>(`/api/oportunidades/${id}`)
  const current = mapOpportunity(previous, tenantId)
  const response = await requestAuthenticatedBackendJson<BackendOpportunity>(`/api/oportunidades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(await opportunityRequest({ ...current, ...patch }, previous)),
  })
  return mapOpportunity(response, tenantId)
}

export async function moveBackendOpportunityStage(id: string, stageId: string): Promise<void> {
  await requestAuthenticatedBackendJson<BackendOpportunity>(`/api/oportunidades/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stageId }),
  })
}
