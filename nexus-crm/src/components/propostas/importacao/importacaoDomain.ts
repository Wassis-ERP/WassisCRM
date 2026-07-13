import type { Database } from '../../../types/database'
import {
  getTable,
  materializeDocumentAgendas,
  MOCK_TENANT_ID,
  MOCK_USER_ID,
  newId,
  nowIso,
} from '../../../lib/inMemoryDb'
import type {
  AgendaPreview,
  ImportDocumentKind,
  ImportFileDraft,
  ImportLookups,
  ImportProposalType,
  ImportResult,
} from './importacaoTypes'
import { compatibleReceiptGrades } from '../../../lib/receiptGradeDomain'

type PolicyRow = Database['public']['Tables']['apolices']['Row']
type PolicyInsert = Database['public']['Tables']['apolices']['Insert']
type ProposalInsert = Database['public']['Tables']['propostas']['Insert']
type InsuredRow = Database['public']['Tables']['segurados']['Row']
type InsurerRow = Database['public']['Tables']['seguradoras']['Row']
type BranchRow = Database['public']['Tables']['ramos']['Row']
type GradeRow = Database['public']['Tables']['recebimento_grades']['Row']
type GradeInstallmentRow = Database['public']['Tables']['recebimento_grade_parcelas']['Row']
type TransferRuleRow = Database['public']['Tables']['repasse_regras']['Row']
type EndorsementSubtypeRow = Database['public']['Tables']['endosso_subtipos']['Row']

interface NamedRow { id: string; nome: string; ativo?: boolean; filial_id?: string | null }
interface BranchOfficeRow { id: string; fantasia?: string | null; nome?: string | null; ativo?: boolean }
interface FileMetadata { name: string; size: number; type: string }

const rows = <T>(table: string) => getTable(table) as T[]
const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const numeric = (value: string) => Number(value.replace(',', '.'))

function detectKind(fileName: string): ImportDocumentKind {
  const name = normalized(fileName)
  if (name.includes('cancel')) return 'CANCELAMENTO'
  if (name.includes('fatura')) return 'FATURA'
  if (name.includes('endosso')) return 'ENDOSSO'
  if (name.includes('apolice')) return 'APOLICE'
  return 'PROPOSTA'
}

function proposalType(kind: ImportDocumentKind, fileName: string): ImportProposalType | null {
  if (kind === 'ENDOSSO') return 'ENDOSSO'
  if (kind === 'APOLICE' || kind === 'PROPOSTA') {
    return normalized(fileName).includes('renov') ? 'RENOVACAO' : 'NOVA'
  }
  return null
}

function stableSuffix(fileName: string): string {
  let value = 0
  for (const character of fileName) value = (value * 31 + character.charCodeAt(0)) % 100000
  return String(value).padStart(5, '0')
}

export function getImportLookups(): ImportLookups {
  const insureds = rows<InsuredRow>('segurados').filter((row) => row.status === 'Ativo')
  const policies = rows<PolicyRow>('apolices')
  const insurers = rows<InsurerRow>('seguradoras').filter((row) => row.ativo)
  const branches = rows<BranchRow>('ramos').filter((row) => row.ativo)
  const producers = rows<NamedRow>('produtores').filter((row) => row.ativo !== false)
  const branchOffices = rows<BranchOfficeRow>('filiais').filter((row) => row.ativo !== false)
  const subtypes = rows<EndorsementSubtypeRow>('endosso_subtipos').filter((row) => row.ativo)
  const grades = rows<GradeRow>('recebimento_grades').filter((row) => row.ativo)

  return {
    insureds: insureds.map((row) => ({ id: row.id, label: row.nome, detail: row.cpf_cnpj ?? undefined })),
    branchOffices: branchOffices.map((row) => ({ id: row.id, label: row.fantasia ?? row.nome ?? 'Corretora' })),
    insurers: insurers.map((row) => ({ id: row.id, label: row.nome })),
    branches: branches.map((row) => ({ id: row.id, label: row.nome, detail: row.risk_type })),
    producers: producers.map((row) => ({ id: row.id, label: row.nome })),
    policies: policies.map((row) => {
      const insured = insureds.find((item) => item.id === row.segurado_id)
      return { id: row.id, label: row.numero_apolice ?? 'Contrato em emissão', detail: insured?.nome }
    }),
    endorsementSubtypes: subtypes.map((row) => ({ id: row.id, label: row.nome, detail: row.natureza_canonica })),
    grades: grades.map((row) => ({ id: row.id, label: row.nome, detail: `${row.qtd_parcelas} evento(s)` })),
  }
}

export function getInsuredDefaults(insuredId: string): Pick<ImportFileDraft, 'branchOfficeId' | 'producerId'> {
  const insured = rows<InsuredRow>('segurados').find((row) => row.id === insuredId)
  return {
    branchOfficeId: insured?.filial_id ?? '',
    producerId: insured?.produtor_id ?? '',
  }
}

export function getPolicyDefaults(policyId: string): Pick<ImportFileDraft, 'insuredId' | 'branchOfficeId' | 'insurerId' | 'branchId' | 'producerId' | 'policyNumber'> {
  const policy = rows<PolicyRow>('apolices').find((row) => row.id === policyId)
  const insured = rows<InsuredRow>('segurados').find((row) => row.id === policy?.segurado_id)
  return {
    insuredId: policy?.segurado_id ?? '',
    branchOfficeId: insured?.filial_id ?? '',
    insurerId: policy?.seguradora_id ?? '',
    branchId: policy?.ramo_id ?? '',
    producerId: policy?.produtor_id ?? insured?.produtor_id ?? '',
    policyNumber: policy?.numero_apolice ?? '',
  }
}

export function createImportDraft(file: FileMetadata): ImportFileDraft {
  const kind = detectKind(file.name)
  const type = proposalType(kind, file.name)
  const insureds = rows<InsuredRow>('segurados').filter((row) => row.status === 'Ativo')
  const policies = rows<PolicyRow>('apolices')
  const insurers = rows<InsurerRow>('seguradoras').filter((row) => row.ativo)
  const branches = rows<BranchRow>('ramos').filter((row) => row.ativo)
  const producers = rows<NamedRow>('produtores').filter((row) => row.ativo !== false)
  const subtypes = rows<EndorsementSubtypeRow>('endosso_subtipos').filter((row) => row.ativo)
  const requestedPolicy = kind === 'ENDOSSO'
    ? policies.find((row) => row.id === 'mock-apolice-viaforte') ?? policies.find((row) => row.status === 'VIGENTE')
    : undefined
  const insured = insureds.find((row) => row.id === requestedPolicy?.segurado_id) ?? insureds[0]
  const insurer = insurers.find((row) => row.id === requestedPolicy?.seguradora_id) ?? insurers[0]
  const branch = branches.find((row) => row.id === requestedPolicy?.ramo_id) ?? branches[0]
  const producerId = requestedPolicy?.produtor_id ?? insured?.produtor_id ?? producers[0]?.id ?? ''
  const grade = compatibleReceiptGrades(
    rows<GradeRow>('recebimento_grades'),
    rows<GradeInstallmentRow>('recebimento_grade_parcelas'),
    insurer?.id ?? '',
    branch?.id ?? '',
  )[0]
  const suffix = stableSuffix(file.name)
  const unsupported = type === null
  const official = kind !== 'PROPOSTA'

  return {
    id: newId(),
    fileName: file.name,
    size: file.size,
    mimeType: file.type || 'application/pdf',
    kind,
    proposalType: type,
    status: unsupported ? 'NAO_SUPORTADO' : 'LIDO',
    message: unsupported ? `${kind === 'FATURA' ? 'Fatura' : 'Cancelamento'} fora do recorte atual.` : null,
    insuredId: insured?.id ?? '',
    branchOfficeId: insured?.filial_id ?? '',
    insurerId: insurer?.id ?? '',
    branchId: branch?.id ?? '',
    producerId,
    policyId: requestedPolicy?.id ?? '',
    endorsementSubtypeId: kind === 'ENDOSSO' ? subtypes[0]?.id ?? '' : '',
    gradeId: grade?.id ?? '',
    proposalNumber: kind === 'PROPOSTA' ? `PROP-IMP-${suffix}` : '',
    policyNumber: kind === 'APOLICE' ? `AP-IMP-${suffix}` : requestedPolicy?.numero_apolice ?? '',
    endorsementNumber: kind === 'ENDOSSO' ? `END-IMP-${suffix}` : '',
    issueDate: official ? '2026-07-11' : '',
    coverageStart: '2026-07-11',
    coverageEnd: '2027-07-11',
    totalPremium: kind === 'ENDOSSO' ? '420.00' : '2480.00',
    netPremium: kind === 'ENDOSSO' ? '385.00' : '2260.00',
    commissionPct: String(grade?.percentual_default ?? 20),
    agencyCommissionPct: '0',
    installmentCount: kind === 'ENDOSSO' ? '1' : '4',
    firstDueDate: '2026-07-20',
    paymentMethod: 'BOLETO',
  }
}

export function validateImportDraft(draft: ImportFileDraft): string[] {
  const errors: string[] = []
  if (!draft.proposalType) errors.push('Tipo de documento fora do escopo atual.')
  if (!draft.insuredId) errors.push('Selecione o segurado.')
  if (!draft.branchOfficeId) errors.push('Resolva a corretora do segurado.')
  if (!draft.insurerId) errors.push('Selecione a seguradora.')
  if (!draft.branchId) errors.push('Selecione o ramo.')
  if (!draft.producerId) errors.push('Selecione o produtor principal.')
  if (draft.kind === 'ENDOSSO' && !draft.policyId) errors.push('Selecione a apólice-mãe do endosso.')
  if (draft.kind === 'ENDOSSO' && !draft.endorsementSubtypeId) errors.push('Selecione o subtipo do endosso.')
  if (draft.kind === 'APOLICE' && !draft.policyNumber.trim()) errors.push('Informe o número da apólice.')
  if (draft.kind === 'ENDOSSO' && !draft.endorsementNumber.trim()) errors.push('Informe o número do endosso.')
  if (draft.kind !== 'PROPOSTA' && !draft.issueDate) errors.push('Informe a data de emissão.')
  if (!draft.coverageStart || !draft.coverageEnd) errors.push('Informe a vigência do documento.')
  if (draft.coverageStart && draft.coverageEnd && draft.coverageEnd < draft.coverageStart) errors.push('A vigência final deve ser posterior à inicial.')
  if (!Number.isFinite(numeric(draft.totalPremium))) errors.push('Informe um prêmio total válido.')
  if (!Number.isFinite(numeric(draft.netPremium))) errors.push('Informe um prêmio líquido válido.')
  const commission = numeric(draft.commissionPct)
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) errors.push('A comissão deve ficar entre 0% e 100%.')
  const agencyCommission = numeric(draft.agencyCommissionPct)
  if (!Number.isFinite(agencyCommission) || agencyCommission < 0) errors.push('O agenciamento deve ser igual ou maior que 0%.')
  if (!Number.isInteger(numeric(draft.installmentCount)) || numeric(draft.installmentCount) < 1) errors.push('Informe uma quantidade de parcelas válida.')
  if (draft.kind !== 'PROPOSTA' && !draft.gradeId) errors.push('Selecione uma grade de recebimento compatível para gerar as agendas.')
  const insured = rows<InsuredRow>('segurados').find((row) => row.id === draft.insuredId)
  if (insured?.filial_id && insured.filial_id !== draft.branchOfficeId) errors.push('A corretora deve ser a mesma do segurado.')
  return errors
}

export function previewImportAgendas(draft: ImportFileDraft): AgendaPreview {
  const grade = rows<GradeRow>('recebimento_grades').find((row) => row.id === draft.gradeId)
  const events = grade
    ? rows<{ grade_id: string; ativo: boolean }>('recebimento_grade_parcelas').filter((row) => row.grade_id === grade.id && row.ativo).length
    : 1
  const total = Number.isFinite(numeric(draft.totalPremium)) ? numeric(draft.totalPremium) : 0
  const net = Number.isFinite(numeric(draft.netPremium)) ? numeric(draft.netPremium) : total
  const commission = Number.isFinite(numeric(draft.commissionPct)) ? numeric(draft.commissionPct) : 0
  const insured = rows<InsuredRow>('segurados').find((row) => row.id === draft.insuredId)
  const rules = rows<TransferRuleRow>('repasse_regras')
    .filter((row) => row.ativo
      && row.papel === 'PRODUTOR'
      && (!row.filial_id || row.filial_id === insured?.filial_id)
      && (!row.produtor_id || row.produtor_id === draft.producerId)
      && (!row.ramo_id || row.ramo_id === draft.branchId)
      && (!row.tipo_documento || row.tipo_documento === draft.proposalType))
    .sort((a, b) => b.prioridade - a.prioridade)
  const rule = rules[0]
  const commissionAmount = total * commission / 100
  const transferAmount = rule
    ? (rule.base === 'PREMIO_LIQUIDO' ? net : commissionAmount) * Number(rule.percentual ?? 0) / 100
    : null

  return {
    installmentCount: Math.max(1, numeric(draft.installmentCount) || 1),
    commissionEvents: events,
    commissionAmount,
    transferAmount,
    gradeName: grade?.nome ?? 'Agenda manual',
    transferRule: rule ? `Regra ${rule.papel} · prioridade ${rule.prioridade}` : 'Sem regra aplicável',
  }
}

function findProposalStage(name: string): string | undefined {
  const pipelineIds = new Set(rows<{ id: string; entidade_tipo: string }>('pipelines')
    .filter((row) => row.entidade_tipo === 'proposta').map((row) => row.id))
  return rows<{ id: string; pipeline_id: string; nome: string }>('pipeline_stages')
    .find((row) => pipelineIds.has(row.pipeline_id) && row.nome === name)?.id
}

export function importDocument(draft: ImportFileDraft): ImportResult {
  const errors = validateImportDraft(draft)
  if (errors.length) return { fileId: draft.id, status: 'ERRO', message: errors[0] }
  const duplicate = rows<{ nome_arquivo: string; tamanho_bytes: number | null }>('anexos')
    .some((row) => row.nome_arquivo === draft.fileName && row.tamanho_bytes === draft.size)
  if (duplicate) return { fileId: draft.id, status: 'ERRO', message: 'Arquivo já importado nesta sessão.' }

  const policies = rows<PolicyInsert & { id: string }>('apolices')
  const proposals = rows<ProposalInsert & { id: string }>('propostas')
  const isOfficial = draft.kind === 'APOLICE' || draft.kind === 'ENDOSSO'
  let policy = draft.policyId ? policies.find((row) => row.id === draft.policyId) : undefined
  if (!policy) {
    policy = {
      id: newId(),
      segurado_id: draft.insuredId,
      seguradora_id: draft.insurerId,
      ramo_id: draft.branchId,
      produtor_id: draft.producerId,
      status: draft.kind === 'APOLICE' ? 'VIGENTE' : 'EM_EMISSAO',
      numero_apolice: draft.kind === 'APOLICE' ? draft.policyNumber.trim() : null,
      vigencia_inicio: draft.coverageStart,
      vigencia_fim: draft.coverageEnd,
      data_emissao: draft.issueDate || null,
      premio_total: numeric(draft.totalPremium),
      premio_liquido: numeric(draft.netPremium),
      renovada_de_id: null,
    }
    policies.push(policy)
  } else if (draft.kind === 'APOLICE') {
    Object.assign(policy, {
      seguradora_id: draft.insurerId,
      ramo_id: draft.branchId,
      produtor_id: draft.producerId,
      status: 'VIGENTE',
      numero_apolice: draft.policyNumber.trim(),
      vigencia_inicio: draft.coverageStart,
      vigencia_fim: draft.coverageEnd,
      data_emissao: draft.issueDate,
      premio_total: numeric(draft.totalPremium),
      premio_liquido: numeric(draft.netPremium),
    })
  }

  const stageId = findProposalStage(isOfficial ? 'Emitida' : 'Em análise')
  if (!stageId) return { fileId: draft.id, status: 'ERRO', message: 'Etapa do funil de propostas não encontrada.' }
  const proposalId = newId()
  const subtype = rows<EndorsementSubtypeRow>('endosso_subtipos').find((row) => row.id === draft.endorsementSubtypeId)
  const proposal: ProposalInsert & { id: string } = {
    id: proposalId,
    apolice_id: policy.id,
    stage_id: stageId,
    tipo: draft.proposalType,
    responsavel_id: MOCK_USER_ID,
    recebimento_grade_id: draft.gradeId || null,
    endosso_subtipo_id: draft.kind === 'ENDOSSO' ? draft.endorsementSubtypeId : null,
    cancelamento_motivo_id: null,
    numero_proposta: draft.proposalNumber.trim() || null,
    numero_endosso: draft.endorsementNumber.trim() || null,
    tipo_movimento_endosso: draft.kind === 'ENDOSSO' ? subtype?.natureza_canonica ?? null : null,
    data_emissao: draft.issueDate || null,
    vigencia_inicio: draft.coverageStart,
    vigencia_fim: draft.coverageEnd,
    premio_total: numeric(draft.totalPremium),
    premio_liquido: numeric(draft.netPremium),
    forma_pagamento: draft.paymentMethod,
    qtd_parcelas: numeric(draft.installmentCount),
    primeira_parcela_vencimento: draft.firstDueDate || null,
    primeira_parcela_valor: numeric(draft.totalPremium) / numeric(draft.installmentCount),
    comissao_pct: numeric(draft.commissionPct),
    agenciamento_pct: numeric(draft.agencyCommissionPct),
  }
  proposals.push(proposal)

  getTable('anexos').push({
    id: newId(),
    tenant_id: MOCK_TENANT_ID,
    filial_id: draft.branchOfficeId,
    entidade_tipo: 'proposta',
    entidade_id: proposalId,
    nome_arquivo: draft.fileName,
    mime_type: draft.mimeType,
    tamanho_bytes: draft.size,
    categoria: 'DOCUMENTO_CONTRATUAL',
    descricao: `${draft.kind} importado pelo wizard assistido.`,
    origem: 'IMPORTACAO_ASSISTIDA',
    status: 'DISPONIVEL',
    url_armazenamento: null,
    hash_sha256: null,
    anexado_em: nowIso(),
  })
  getTable('audit_logs').push({
    id: newId(),
    tenant_id: MOCK_TENANT_ID,
    entidade_tipo: 'proposta',
    entidade_id: proposalId,
    acao: 'CREATE_IMPORTACAO',
    campo: null,
    valor_antigo: null,
    valor_novo: draft.fileName,
    user_id: MOCK_USER_ID,
    ocorrido_em: nowIso(),
    user_agent: 'FRONT_MOCK',
  })

  if (isOfficial) materializeDocumentAgendas(proposalId, draft.firstDueDate || draft.coverageStart)

  return {
    fileId: draft.id,
    status: 'IMPORTADO',
    message: isOfficial ? 'Documento e agendas materializados.' : 'Proposta importada em tramitação.',
    policyId: policy.id,
    proposalId,
  }
}
