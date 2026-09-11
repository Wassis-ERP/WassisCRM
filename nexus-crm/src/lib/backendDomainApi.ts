import { getBackendSessionSnapshot, requestAuthenticatedBackendJson } from './backendApi'
import type { Database, Json } from '../types/database'
import { platformDefaults } from '../types/platformRows'
import { getTable } from './inMemoryDb'

type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoInsert = Database['public']['Tables']['segurados']['Insert']
type SeguradoUpdate = Database['public']['Tables']['segurados']['Update']
type OportunidadeRow = Database['public']['Tables']['oportunidades']['Row']
type OportunidadeInsert = Database['public']['Tables']['oportunidades']['Insert']
type OportunidadeUpdate = Database['public']['Tables']['oportunidades']['Update']

export const usesBackendDomainData = import.meta.env.VITE_DATA_MODE === 'backend'

export interface BackendInsuredPerson {
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

const unsupportedInsuredFields = ['nome_social', 'rg_ie', 'inscricao_municipal', 'atividade_economica', 'profissao', 'renda_mensal', 'cnh_numero', 'cnh_categoria', 'cnh_vencimento', 'celular', 'telefone2', 'whatsapp', 'pais', 'lgpd_autorizado_em', 'origem_importacao'] as const

function rejectUnsupported<T extends object>(source: T, fields: readonly (keyof T)[]) {
  const pending = fields.filter(key => source[key] != null && source[key] !== '')
  if (pending.length) throw new Error('A integração atual ainda não permite salvar estes campos: ' + pending.join(', ') + '. Nenhum dado foi enviado.')
}

export function mapInsuredPerson(source: BackendInsuredPerson, tenantId: string | null): SeguradoRow {
  return {
    ...platformDefaults.segurados,
    id: source.id,
    tenant_id: resolveTenant(tenantId),
    filial_id: requireId(source.officeBranchId, 'Corretora'),
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
    created_at: source.createdAtUtc,
    updated_at: source.updatedAtUtc,
  }
}

function insuredRequest(source: SeguradoInsert | SeguradoRow) {
  rejectUnsupported(source, unsupportedInsuredFields)
  if (!source.nome?.trim() || !source.tipo || !source.status) throw new Error('Informe nome, tipo e status antes de salvar.')
  if (source.lgpd_autorizado == null) throw new Error('Informe a decisão de autorização LGPD antes de salvar.')
  requireId(source.filial_id, 'Corretora')
  return {
    officeBranchId: source.filial_id ?? null,
    name: source.nome,
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

// O DTO HTTP legado fica nesta fronteira; não reintroduz colunas antigas no DBML.
export function mapOpportunity(source: BackendOpportunity, tenantId: string | null): OportunidadeRow {
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
    apolice_origem_id: typeof metadata.apoliceOrigemId === 'string' ? metadata.apoliceOrigemId : null,
    lead_nome: source.insuredPersonId ? null : source.name,
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
    data_abertura: source.createdAtUtc?.slice(0, 10) ?? null,
    data_fechamento_prevista: null,
    ganha_em: source.status === 'won' ? source.concludedAtUtc : null,
    perdida_em: source.status === 'lost' ? source.concludedAtUtc : null,
    motivo_perda_observacao: null,
    campanha: null,
    observacoes: null,
  }
}

function opportunityRequest(source: OportunidadeInsert | OportunidadeRow, previous?: BackendOpportunity) {
  if (previous && source.data_abertura !== undefined && source.data_abertura !== previous.createdAtUtc?.slice(0, 10)) {
    throw new Error('A data de abertura é definida pela integração e não pode ser alterada.')
  }
  rejectUnsupported(source, ['lead_documento', 'lead_email', 'lead_telefone', 'prioridade', 'valor_comissao_estimada', 'data_fechamento_prevista', 'motivo_perda_observacao', 'campanha', 'observacoes'])
  if (!source.segurado_id && source.titulo && source.lead_nome && source.titulo !== source.lead_nome && (!previous || source.lead_nome !== previous.name)) {
    throw new Error('A integração atual usa um único nome para o lead e o título. Informe o mesmo valor nos dois campos.')
  }
  const previousMetadata = metadataObject(previous?.metadata ?? null)
  const previousOrigin = typeof previousMetadata.apoliceOrigemId === 'string' ? previousMetadata.apoliceOrigemId : null
  if (source.apolice_origem_id !== undefined && source.apolice_origem_id !== previousOrigin) {
    throw new Error('O vínculo de renovação aguarda atualização da integração para o contrato v3.1.')
  }
  const stage = getTable('pipeline_stages').find(row => row.id === source.stage_id)
  const pipelineId = typeof stage?.pipeline_id === 'string' ? stage.pipeline_id : source.stage_id === previous?.stageId ? previous?.pipelineId : null
  const name = source.titulo?.trim() || source.lead_nome?.trim() || previous?.name
  if (!name) throw new Error('Informe o título da oportunidade antes de salvar.')
  return {
    officeBranchId: requireId(source.filial_id, 'Corretora'),
    name,
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
    body: JSON.stringify(opportunityRequest(input)),
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
    body: JSON.stringify(opportunityRequest({ ...current, ...patch }, previous)),
  })
  return mapOpportunity(response, tenantId)
}

export async function moveBackendOpportunityStage(id: string, stageId: string): Promise<void> {
  await requestAuthenticatedBackendJson<BackendOpportunity>(`/api/oportunidades/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stageId }),
  })
}
