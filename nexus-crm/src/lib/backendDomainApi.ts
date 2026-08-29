import { requestAuthenticatedBackendJson } from './backendApi'
import type { Database, Json } from '../types/database'

type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoInsert = Database['public']['Tables']['segurados']['Insert']
type SeguradoUpdate = Database['public']['Tables']['segurados']['Update']
type OportunidadeRow = Database['public']['Tables']['oportunidades']['Row']
type OportunidadeInsert = Database['public']['Tables']['oportunidades']['Insert']
type OportunidadeUpdate = Database['public']['Tables']['oportunidades']['Update']

export const usesBackendDomainData = import.meta.env.VITE_DATA_MODE === 'backend'

interface BackendInsuredPerson {
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

interface BackendOpportunity {
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

function mapInsuredPerson(source: BackendInsuredPerson, tenantId: string | null): SeguradoRow {
  return {
    id: source.id,
    tenant_id: tenantId,
    filial_id: source.officeBranchId,
    nome: source.name,
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
    created_by: source.createdBy,
    created_at: source.createdAtUtc,
    updated_at: source.updatedAtUtc,
  }
}

function insuredRequest(source: SeguradoInsert | SeguradoRow) {
  return {
    officeBranchId: source.filial_id ?? null,
    name: source.nome,
    personType: source.tipo ?? 'PF',
    status: source.status ?? 'Ativo',
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
    lgpdAuthorized: source.lgpd_autorizado ?? false,
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
    .sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
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
  const current = await getBackendInsuredPerson(id, tenantId)
  const response = await requestAuthenticatedBackendJson<BackendInsuredPerson>(`/api/segurados/${id}`, {
    method: 'PUT',
    body: JSON.stringify(insuredRequest({ ...current, ...patch })),
  })
  return mapInsuredPerson(response, tenantId)
}

function metadataObject(metadata: Json): Record<string, Json | undefined> {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? { ...metadata }
    : {}
}

function mapOpportunity(source: BackendOpportunity, tenantId: string | null): OportunidadeRow {
  const metadata = metadataObject(source.metadata)
  return {
    id: source.id,
    tenant_id: tenantId,
    filial_id: source.officeBranchId,
    nome: source.name,
    responsavel_id: source.responsibleId,
    segurado_id: source.insuredPersonId,
    pipeline_id: source.pipelineId,
    stage_id: source.stageId,
    ramo_id: source.insuranceLineId,
    seguradora_id: source.insurerId,
    origem_id: source.originId,
    motivo_perda_id: source.lossReasonId,
    apolice_origem_id: typeof metadata.apoliceOrigemId === 'string' ? metadata.apoliceOrigemId : null,
    status: source.status as OportunidadeRow['status'],
    tipo_negocio: source.businessType as OportunidadeRow['tipo_negocio'],
    tipo_contato: source.contactType,
    premio_liquido: source.netPremium,
    comissao_percentual: source.commissionPercentage,
    agenciamento: source.agencyPercentage,
    producao: source.productionAmount,
    vigencia_inicio: source.validityStartUtc,
    vigencia_fim: source.validityEndUtc,
    proximo_followup: source.nextFollowUpUtc,
    concluded_at: source.concludedAtUtc,
    indicador: source.referrer,
    observacoes: source.notes,
    metadata: source.metadata,
    created_at: source.createdAtUtc,
    updated_at: source.updatedAtUtc,
    lead_nome: null,
    lead_documento: null,
    lead_email: null,
    lead_telefone: null,
    titulo: source.name,
    descricao: source.notes,
    prioridade: null,
    valor_premio_estimado: source.netPremium,
    valor_comissao_estimada: null,
    comissao_estimada_pct: source.commissionPercentage,
    agenciamento_pct: source.agencyPercentage,
    data_abertura: source.createdAtUtc,
    data_fechamento_prevista: source.validityEndUtc,
    ganha_em: source.status === 'won' ? source.concludedAtUtc : null,
    perdida_em: source.status === 'lost' ? source.concludedAtUtc : null,
    motivo_perda_observacao: null,
    campanha: null,
  }
}

function opportunityRequest(source: OportunidadeInsert | OportunidadeRow) {
  const metadata = metadataObject(source.metadata ?? {})
  if (source.apolice_origem_id) metadata.apoliceOrigemId = source.apolice_origem_id

  return {
    officeBranchId: source.filial_id ?? null,
    name: source.nome,
    responsibleId: source.responsavel_id,
    insuredPersonId: source.segurado_id ?? null,
    pipelineId: source.pipeline_id ?? null,
    stageId: source.stage_id ?? null,
    insuranceLineId: source.ramo_id ?? null,
    insurerId: source.seguradora_id ?? null,
    originId: source.origem_id ?? null,
    lossReasonId: source.motivo_perda_id ?? null,
    status: source.status ?? 'pending',
    businessType: source.tipo_negocio ?? null,
    contactType: source.tipo_contato ?? null,
    netPremium: source.premio_liquido ?? null,
    commissionPercentage: source.comissao_percentual ?? null,
    agencyPercentage: source.agenciamento ?? null,
    productionAmount: source.producao ?? null,
    validityStartUtc: source.vigencia_inicio ?? null,
    validityEndUtc: source.vigencia_fim ?? null,
    nextFollowUpUtc: source.proximo_followup ?? null,
    concludedAtUtc: source.concluded_at ?? null,
    referrer: source.indicador ?? null,
    notes: source.observacoes ?? null,
    metadata,
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
    body: JSON.stringify(opportunityRequest(input)),
  })
  return mapOpportunity(response, tenantId)
}

export async function updateBackendOpportunity(
  id: string,
  patch: OportunidadeUpdate,
  tenantId: string | null,
): Promise<OportunidadeRow> {
  const current = await getBackendOpportunity(id, tenantId)
  const response = await requestAuthenticatedBackendJson<BackendOpportunity>(`/api/oportunidades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(opportunityRequest({ ...current, ...patch })),
  })
  return mapOpportunity(response, tenantId)
}

export async function moveBackendOpportunityStage(id: string, stageId: string): Promise<void> {
  await requestAuthenticatedBackendJson<BackendOpportunity>(`/api/oportunidades/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stageId }),
  })
}
