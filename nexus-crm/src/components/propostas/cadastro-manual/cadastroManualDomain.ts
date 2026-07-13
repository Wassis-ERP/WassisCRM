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
  ManualAgendaPreview,
  ManualCreateResult,
  ManualDocumentDraft,
  ManualItemDetails,
  ManualItemDraft,
  ManualLookups,
} from './cadastroManualTypes'
import { compatibleReceiptGrades } from '../../../lib/receiptGradeDomain'

type PolicyInsert = Database['public']['Tables']['apolices']['Insert']
type ProposalInsert = Database['public']['Tables']['propostas']['Insert']
type PolicyItemInsert = Database['public']['Tables']['apolice_itens']['Insert']
type VehicleInsert = Database['public']['Tables']['item_veiculo']['Insert']
type PropertyInsert = Database['public']['Tables']['item_imovel']['Insert']
type CompanyInsert = Database['public']['Tables']['item_empresa']['Insert']
type LifeInsert = Database['public']['Tables']['item_vida']['Insert']
type CoverageInsert = Database['public']['Tables']['item_coberturas']['Insert']
type InsuredRow = Database['public']['Tables']['segurados']['Row']
type InsurerRow = Database['public']['Tables']['seguradoras']['Row']
type BranchRow = Database['public']['Tables']['ramos']['Row']
type GradeRow = Database['public']['Tables']['recebimento_grades']['Row']
type GradeInstallmentRow = Database['public']['Tables']['recebimento_grade_parcelas']['Row']
type TransferRuleRow = Database['public']['Tables']['repasse_regras']['Row']
type CoverageCatalogRow = Database['public']['Tables']['coberturas_catalogo']['Row']

interface NamedRow { id: string; nome: string; ativo?: boolean; filial_id?: string | null }
interface BranchOfficeRow { id: string; fantasia?: string | null; nome?: string | null; ativo?: boolean }
interface ResponsibleRow { id: string; nome?: string | null; full_name?: string | null }
interface PipelineRow { id: string; entidade_tipo: string }
interface PipelineStageRow { id: string; pipeline_id: string; nome: string }

const rows = <T>(table: string) => getTable(table) as T[]
const numeric = (value: string): number => Number(value.replace(',', '.'))
const nullable = (value: string): string | null => value.trim() || null

export function getManualLookups(): ManualLookups {
  const insureds = rows<InsuredRow>('segurados').filter((row) => row.status === 'Ativo')
  const insurers = rows<InsurerRow>('seguradoras').filter((row) => row.ativo)
  const branches = rows<BranchRow>('ramos').filter((row) => row.ativo)
  const coverages = rows<CoverageCatalogRow>('coberturas_catalogo').filter((row) => row.ativo)

  return {
    insureds: insureds.map((row) => ({ id: row.id, label: row.nome, detail: row.cpf_cnpj ?? undefined })),
    branchOffices: rows<BranchOfficeRow>('filiais')
      .filter((row) => row.ativo !== false)
      .map((row) => ({ id: row.id, label: row.fantasia ?? row.nome ?? 'Corretora' })),
    insurers: insurers.map((row) => ({ id: row.id, label: row.nome })),
    branches: branches.map((row) => ({
      id: row.id,
      label: row.nome,
      detail: row.grupo_operacional ?? undefined,
      riskType: row.risk_type ?? 'DIVERSOS',
      requiresItems: row.exige_item !== false,
    })),
    producers: rows<NamedRow>('produtores')
      .filter((row) => row.ativo !== false)
      .map((row) => ({ id: row.id, label: row.nome })),
    responsibles: rows<ResponsibleRow>('profiles')
      .map((row) => ({ id: row.id, label: row.full_name ?? row.nome ?? 'Usuário' })),
    grades: rows<GradeRow>('recebimento_grades')
      .filter((row) => row.ativo)
      .map((row) => ({ id: row.id, label: row.nome, detail: `${row.qtd_parcelas} evento(s)` })),
    coverages: coverages.map((row) => ({
      id: row.id,
      label: row.nome,
      detail: row.codigo ?? undefined,
      branchId: row.ramo_id,
      defaultCapital: row.capital_lmi_padrao,
    })),
  }
}

export function createEmptyItem(): ManualItemDraft {
  const details: ManualItemDetails = {
    marca: '', modelo: '', placa: '', chassi: '', cep: '', endereco: '', cidade: '', uf: '',
    cnpjRisco: '', razaoSocialRisco: '', atividade: '', nomeGrupo: '', numeroVidas: '', capitalIndividual: '',
  }
  return {
    id: newId(), description: '', externalIdentifier: '', riskValue: '', addressSummary: '', details, coverages: [],
  }
}

export function hasManualItemContent(item: ManualItemDraft): boolean {
  return Boolean(
    item.description.trim()
    || item.externalIdentifier.trim()
    || item.riskValue.trim()
    || item.addressSummary.trim()
    || Object.values(item.details).some((value) => value.trim())
    || item.coverages.length,
  )
}

export function createManualDraft(): ManualDocumentDraft {
  const lookups = getManualLookups()
  const insured = rows<InsuredRow>('segurados').find((row) => row.id === lookups.insureds[0]?.id)
  const branch = lookups.branches[0]
  const insurer = lookups.insurers[0]
  const producerId = insured?.produtor_id ?? lookups.producers[0]?.id ?? ''
  const grade = compatibleReceiptGrades(
    rows<GradeRow>('recebimento_grades'),
    rows<GradeInstallmentRow>('recebimento_grade_parcelas'),
    insurer?.id ?? '',
    branch?.id ?? '',
  )[0]
  const today = new Date().toISOString().slice(0, 10)
  const end = new Date(`${today}T12:00:00`)
  end.setFullYear(end.getFullYear() + 1)

  return {
    mode: 'PROPOSTA', insuredId: insured?.id ?? '', branchOfficeId: insured?.filial_id ?? '',
    insurerId: insurer?.id ?? '', branchId: branch?.id ?? '', producerId,
    responsibleId: lookups.responsibles[0]?.id ?? MOCK_USER_ID, proposalNumber: '', policyNumber: '',
    controlNumber: '', insurerProtocol: '', transmissionDate: today, issueDate: '', documentReceiptDate: '',
    coverageStart: today, coverageEnd: end.toISOString().slice(0, 10), totalPremium: '0', netPremium: '0',
    iof: '0', fractionationFee: '0', paymentMethod: 'BOLETO', paymentFrequency: 'MENSAL', installmentCount: '1',
    firstDueDate: today, commissionPct: String(grade?.percentual_default ?? 20), agencyCommissionPct: '0', gradeId: grade?.id ?? '',
    contractType: 'INDIVIDUAL', policyType: 'NORMAL', susepProcess: '', stipulatorName: '', notes: '',
    attachment: null, items: branch?.requiresItems ? [createEmptyItem()] : [],
  }
}

export function applyManualInsuredDefaults(draft: ManualDocumentDraft, insuredId: string): ManualDocumentDraft {
  const insured = rows<InsuredRow>('segurados').find((row) => row.id === insuredId)
  return {
    ...draft,
    insuredId,
    branchOfficeId: insured?.filial_id ?? '',
    producerId: insured?.produtor_id ?? draft.producerId,
  }
}

export function suggestManualGrade(draft: ManualDocumentDraft): string {
  return compatibleReceiptGrades(
    rows<GradeRow>('recebimento_grades'),
    rows<GradeInstallmentRow>('recebimento_grade_parcelas'),
    draft.insurerId,
    draft.branchId,
  )[0]?.id ?? ''
}

function proposalStage(mode: ManualDocumentDraft['mode']): string | undefined {
  const pipelineIds = new Set(rows<PipelineRow>('pipelines')
    .filter((row) => row.entidade_tipo === 'proposta').map((row) => row.id))
  const expected = mode === 'APOLICE' ? 'Emitida' : 'Em análise'
  return rows<PipelineStageRow>('pipeline_stages')
    .find((row) => pipelineIds.has(row.pipeline_id) && row.nome === expected)?.id
}

export function validateManualDraft(draft: ManualDocumentDraft): string[] {
  const errors: string[] = []
  if (!draft.insuredId) errors.push('Selecione o segurado.')
  if (!draft.branchOfficeId) errors.push('O segurado precisa estar vinculado a uma corretora.')
  if (!draft.insurerId) errors.push('Selecione a seguradora.')
  if (!draft.branchId) errors.push('Selecione o ramo.')
  if (!draft.producerId) errors.push('Selecione o produtor principal.')
  if (!proposalStage(draft.mode)) errors.push('Etapa do funil de propostas não encontrada.')
  if (!draft.coverageStart || !draft.coverageEnd) errors.push('Informe a vigência.')
  if (draft.coverageStart && draft.coverageEnd && draft.coverageEnd < draft.coverageStart) errors.push('A vigência final deve ser posterior à inicial.')
  for (const [value, label] of [[draft.totalPremium, 'prêmio total'], [draft.netPremium, 'prêmio líquido']] as const) {
    if (!Number.isFinite(numeric(value))) errors.push(`Informe um ${label} válido.`)
  }
  const commission = numeric(draft.commissionPct)
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) errors.push('A comissão deve ficar entre 0% e 100%.')
  const agencyCommission = numeric(draft.agencyCommissionPct)
  if (!Number.isFinite(agencyCommission) || agencyCommission < 0) errors.push('O agenciamento deve ser um percentual igual ou maior que zero.')
  const installments = numeric(draft.installmentCount)
  if (!Number.isInteger(installments) || installments < 1) errors.push('Informe uma quantidade de parcelas válida.')
  if (!draft.firstDueDate) errors.push('Informe o primeiro vencimento.')
  if (draft.mode === 'APOLICE' && !draft.gradeId) errors.push('Selecione uma grade de recebimento compatível para gerar as agendas.')

  const insured = rows<InsuredRow>('segurados').find((row) => row.id === draft.insuredId)
  if (insured?.filial_id !== draft.branchOfficeId) errors.push('A corretora deve ser derivada do segurado selecionado.')

  if (draft.mode === 'APOLICE') {
    if (!draft.policyNumber.trim()) errors.push('Informe o número da apólice.')
    if (!draft.issueDate) errors.push('Informe a data de emissão.')
    const duplicate = rows<Database['public']['Tables']['apolices']['Row']>('apolices').some((row) =>
      row.segurado_id === draft.insuredId && row.seguradora_id === draft.insurerId
      && row.numero_apolice?.trim().toLowerCase() === draft.policyNumber.trim().toLowerCase())
    if (duplicate) errors.push('Já existe uma apólice com este número para o segurado e a seguradora.')
  }

  draft.items.forEach((item, index) => {
    if (!hasManualItemContent(item)) return
    if (!item.description.trim()) errors.push(`Informe a descrição do item ${index + 1}.`)
    item.coverages.forEach((coverage) => {
      if (!coverage.catalogId) errors.push(`Selecione a cobertura do item ${index + 1}.`)
      if (coverage.capital && !Number.isFinite(numeric(coverage.capital))) errors.push(`Informe um capital válido no item ${index + 1}.`)
    })
  })
  return errors
}

export function previewManualAgendas(draft: ManualDocumentDraft): ManualAgendaPreview {
  const grade = rows<GradeRow>('recebimento_grades').find((row) => row.id === draft.gradeId)
  const gradeEvents = grade
    ? rows<GradeInstallmentRow>('recebimento_grade_parcelas')
      .filter((row) => row.grade_id === grade.id && row.ativo)
    : []
  const commissionEvents = gradeEvents.length || 1
  const total = Number.isFinite(numeric(draft.totalPremium)) ? numeric(draft.totalPremium) : 0
  const net = Number.isFinite(numeric(draft.netPremium)) ? numeric(draft.netPremium) : total
  const commissionPct = Number.isFinite(numeric(draft.commissionPct)) ? numeric(draft.commissionPct) : 0
  const agencyCommissionPct = Number.isFinite(numeric(draft.agencyCommissionPct)) ? numeric(draft.agencyCommissionPct) : 0
  const commissionTotal = total * commissionPct / 100
  const commissionAmount = gradeEvents.length
    ? gradeEvents.reduce((sum, event) => {
      const percentage = Number(event.percentual ?? (
        event.tipo_comissao === 'AGENCIAMENTO' ? agencyCommissionPct : commissionPct
      ))
      const base = event.percentual_sobre === 'COMISSAO_TOTAL'
        ? commissionTotal
        : event.percentual_sobre === 'PARCELA'
          ? net / Math.max(1, numeric(draft.installmentCount) || 1)
          : grade?.base_calculo === 'PREMIO_LIQUIDO' ? net : total
      return sum + base * percentage / 100
    }, 0)
    : commissionTotal
  const rules = rows<TransferRuleRow>('repasse_regras')
    .filter((row) => row.ativo && row.papel === 'PRODUTOR'
      && (!row.filial_id || row.filial_id === draft.branchOfficeId)
      && (!row.produtor_id || row.produtor_id === draft.producerId)
      && (!row.ramo_id || row.ramo_id === draft.branchId)
      && (!row.tipo_documento || row.tipo_documento === 'NOVA'))
    .sort((a, b) => b.prioridade - a.prioridade)
  const rule = rules[0]
  const transferAmount = rule
    ? (rule.base === 'PREMIO_LIQUIDO' ? net : commissionAmount) * Number(rule.percentual ?? 0) / 100
    : null

  return {
    installments: Math.max(1, numeric(draft.installmentCount) || 1),
    commissionEvents: Math.max(1, commissionEvents),
    commissionAmount,
    transferAmount,
    gradeName: grade?.nome ?? 'Agenda manual',
    transferRule: rule ? `Regra ${rule.papel} · prioridade ${rule.prioridade}` : 'Sem regra aplicável',
    willMaterialize: draft.mode === 'APOLICE',
  }
}

function vehicleRow(itemId: string, details: ManualItemDetails): VehicleInsert {
  return { apolice_item_id: itemId, marca: nullable(details.marca), modelo: nullable(details.modelo), placa: nullable(details.placa), chassi: nullable(details.chassi) }
}

function propertyRow(itemId: string, details: ManualItemDetails): PropertyInsert {
  return { apolice_item_id: itemId, cep: nullable(details.cep), endereco: nullable(details.endereco), cidade: nullable(details.cidade), uf: nullable(details.uf) }
}

function companyRow(itemId: string, details: ManualItemDetails): CompanyInsert {
  return { apolice_item_id: itemId, cnpj_risco: nullable(details.cnpjRisco), razao_social_risco: nullable(details.razaoSocialRisco), atividade: nullable(details.atividade), cep: nullable(details.cep), endereco: nullable(details.endereco), cidade: nullable(details.cidade), uf: nullable(details.uf) }
}

function lifeRow(itemId: string, details: ManualItemDetails): LifeInsert {
  return { apolice_item_id: itemId, nome_grupo: nullable(details.nomeGrupo), n_vidas: numeric(details.numeroVidas) || null, capital_individual: numeric(details.capitalIndividual) || null }
}

export function createManualInsuranceDocument(draft: ManualDocumentDraft): ManualCreateResult {
  const errors = validateManualDraft(draft)
  if (errors.length) throw new Error(errors[0])
  const stageId = proposalStage(draft.mode)
  if (!stageId) throw new Error('Etapa do funil de propostas não encontrada.')

  const touchedTables = ['apolices', 'propostas', 'apolice_itens', 'item_veiculo', 'item_imovel', 'item_empresa', 'item_vida', 'item_coberturas', 'parcelas', 'comissoes', 'repasses', 'anexos', 'audit_logs'] as const
  const lengths = new Map(touchedTables.map((table) => [table, getTable(table).length]))
  const policyId = newId()
  const proposalId = newId()
  const branch = rows<BranchRow>('ramos').find((row) => row.id === draft.branchId)

  try {
    const policy: PolicyInsert & { id: string } = {
      id: policyId,
      segurado_id: draft.insuredId,
      seguradora_id: draft.insurerId,
      ramo_id: draft.branchId,
      produtor_id: draft.producerId,
      status: draft.mode === 'APOLICE' ? 'VIGENTE' : 'EM_EMISSAO',
      numero_apolice: draft.mode === 'APOLICE' ? draft.policyNumber.trim() : null,
      numero_controle_documento: nullable(draft.controlNumber),
      tipo_contratacao: draft.contractType,
      tipo_apolice: draft.policyType,
      processo_susep: nullable(draft.susepProcess),
      estipulante_nome: nullable(draft.stipulatorName),
      vigencia_inicio: draft.coverageStart,
      vigencia_fim: draft.coverageEnd,
      data_emissao: draft.mode === 'APOLICE' ? draft.issueDate : null,
      data_recebimento_documento: draft.mode === 'APOLICE' ? nullable(draft.documentReceiptDate) : null,
      premio_total: numeric(draft.totalPremium),
      premio_liquido: numeric(draft.netPremium),
      iof: numeric(draft.iof) || 0,
      adicional_fracionamento: numeric(draft.fractionationFee) || 0,
      periodicidade_pagamento: draft.paymentFrequency,
      canal_emissao: 'CADASTRO_MANUAL',
      observacoes: nullable(draft.notes),
    }
    rows<PolicyInsert & { id: string }>('apolices').push(policy)

    const proposal: ProposalInsert & { id: string } = {
      id: proposalId,
      apolice_id: policyId,
      stage_id: stageId,
      tipo: 'NOVA',
      responsavel_id: draft.responsibleId || MOCK_USER_ID,
      recebimento_grade_id: draft.gradeId || null,
      numero_proposta: nullable(draft.proposalNumber),
      numero_controle_documento: nullable(draft.controlNumber),
      protocolo_seguradora: nullable(draft.insurerProtocol),
      data_transmissao: nullable(draft.transmissionDate),
      data_emissao: draft.mode === 'APOLICE' ? draft.issueDate : null,
      vigencia_inicio: draft.coverageStart,
      vigencia_fim: draft.coverageEnd,
      premio_total: numeric(draft.totalPremium),
      premio_liquido: numeric(draft.netPremium),
      iof: numeric(draft.iof) || 0,
      adicional_fracionamento: numeric(draft.fractionationFee) || 0,
      forma_pagamento: draft.paymentMethod,
      periodicidade_pagamento: draft.paymentFrequency,
      qtd_parcelas: numeric(draft.installmentCount),
      primeira_parcela_vencimento: draft.firstDueDate,
      primeira_parcela_valor: numeric(draft.totalPremium) / numeric(draft.installmentCount),
      comissao_pct: numeric(draft.commissionPct),
      agenciamento_pct: numeric(draft.agencyCommissionPct),
      observacoes: nullable(draft.notes),
    }
    rows<ProposalInsert & { id: string }>('propostas').push(proposal)

    draft.items.filter(hasManualItemContent).forEach((item, index) => {
      const itemId = newId()
      const policyItem: PolicyItemInsert & { id: string } = {
        id: itemId,
        apolice_id: policyId,
        risk_type: branch?.risk_type ?? 'DIVERSOS',
        incluido_por_proposta_id: proposalId,
        excluido_por_proposta_id: null,
        numero_item: index + 1,
        descricao: item.description.trim(),
        identificador_externo: nullable(item.externalIdentifier),
        valor_risco: numeric(item.riskValue) || null,
        endereco_risco_resumo: nullable(item.addressSummary),
        status: 'vigente',
      }
      rows<PolicyItemInsert & { id: string }>('apolice_itens').push(policyItem)
      if (branch?.risk_type === 'VEICULO') rows<VehicleInsert>('item_veiculo').push(vehicleRow(itemId, item.details))
      if (branch?.risk_type === 'IMOVEL') rows<PropertyInsert>('item_imovel').push(propertyRow(itemId, item.details))
      if (branch?.risk_type === 'EMPRESA') rows<CompanyInsert>('item_empresa').push(companyRow(itemId, item.details))
      if (branch?.risk_type === 'VIDA') rows<LifeInsert>('item_vida').push(lifeRow(itemId, item.details))
      item.coverages.forEach((coverage) => {
        const row: CoverageInsert & { id: string } = {
          id: newId(), apolice_item_id: itemId, cobertura_id: coverage.catalogId,
          incluido_por_proposta_id: proposalId, excluido_por_proposta_id: null,
          capital_lmi: numeric(coverage.capital) || null, franquia_valor: numeric(coverage.deductible) || null,
          premio: numeric(coverage.premium) || null, premio_liquido: numeric(coverage.premium) || null,
          vigencia_inicio: draft.coverageStart, vigencia_fim: draft.coverageEnd,
        }
        rows<CoverageInsert & { id: string }>('item_coberturas').push(row)
      })
    })

    if (draft.attachment) {
      getTable('anexos').push({
        id: newId(), tenant_id: MOCK_TENANT_ID, filial_id: draft.branchOfficeId,
        entidade_tipo: 'proposta', entidade_id: proposalId, nome_arquivo: draft.attachment.name,
        mime_type: draft.attachment.type || 'application/pdf', tamanho_bytes: draft.attachment.size,
        categoria: 'DOCUMENTO_CONTRATUAL', descricao: 'Documento anexado ao cadastro manual.',
        origem: 'CADASTRO_MANUAL', status: 'DISPONIVEL', url_armazenamento: null,
        hash_sha256: null, anexado_em: nowIso(),
      })
    }

    getTable('audit_logs').push({
      id: newId(), tenant_id: MOCK_TENANT_ID, entidade_tipo: 'proposta', entidade_id: proposalId,
      acao: 'CREATE_MANUAL', campo: null, valor_antigo: null,
      valor_novo: draft.mode === 'APOLICE' ? 'APOLICE_EMITIDA' : 'PROPOSTA_EM_TRAMITACAO',
      user_id: MOCK_USER_ID, ocorrido_em: nowIso(), origem: 'CADASTRO_MANUAL', ip: null, user_agent: 'FRONT_MOCK',
    })

    const agendas = draft.mode === 'APOLICE'
      ? materializeDocumentAgendas(proposalId, draft.firstDueDate)
      : { parcelas: 0, comissoes: 0, repasses: 0 }
    return { policyId, proposalId, agendas }
  } catch (error) {
    touchedTables.forEach((table) => getTable(table).splice(lengths.get(table) ?? 0))
    throw error
  }
}
