import { useState, type ReactNode } from 'react'
import {
  getTable,
  materializeDocumentAgendas,
  MOCK_TENANT_ID,
  MOCK_USER_ID,
  newId,
  nowIso,
} from '../lib/inMemoryDb'
import type { Database } from '../types/database'
import type {
  EndorsementMovementType,
  PolicyContractStatus,
  Proposal,
  ProposalStatus,
  ProposalType,
} from '../types/proposta'
import { PropostasContext } from './propostasCore'
import { persistAuditedUpdate } from './propostasAudit'
import { useAuth } from '../hooks/useAuth'
import {
  getProposalWorkflowStages,
  moveProposalToStatus,
  proposalStatusFromStageName,
  refuseProposalDocument,
  type ProposalWorkflowTables,
} from './propostasWorkflow'
import {
  createDerivedDocument as persistDerivedDocument,
  createRenewalOpportunity as persistRenewalOpportunity,
  issueContractDocument as persistDocumentIssue,
  markPolicyNotRenewed as persistNotRenewed,
  transmitRenewalOpportunity as persistRenewalTransmission,
  type ContractTables,
  type DerivedDocumentInput,
} from './contractOperations'

type ApoliceRow = Database['public']['Tables']['apolices']['Row']
type PropostaRow = Database['public']['Tables']['propostas']['Row']

const pendingDocumentEffects = new Map<string, NonNullable<DerivedDocumentInput['endorsementEffect']>>()

const auditValue = (value: unknown): string | null =>
  value === null || value === undefined || value === '' ? null : String(value)

function contractTables(): ContractTables {
  return {
    policies: getTable('apolices') as unknown as ContractTables['policies'],
    documents: getTable('propostas') as unknown as ContractTables['documents'],
    opportunities: getTable('oportunidades') as unknown as ContractTables['opportunities'],
    branches: getTable('ramos') as unknown as ContractTables['branches'],
    pipelines: getTable('pipelines') as unknown as ContractTables['pipelines'],
    stages: getTable('pipeline_stages') as unknown as ContractTables['stages'],
    subtypes: getTable('endosso_subtipos') as unknown as ContractTables['subtypes'],
    cancellationReasons: getTable('cancelamento_motivos') as unknown as ContractTables['cancellationReasons'],
    items: getTable('apolice_itens') as unknown as ContractTables['items'],
    coverages: getTable('item_coberturas') as unknown as ContractTables['coverages'],
    specializations: [
      getTable('item_veiculo') as unknown as ContractTables['specializations'][number],
      getTable('item_imovel') as unknown as ContractTables['specializations'][number],
      getTable('item_empresa') as unknown as ContractTables['specializations'][number],
      getTable('item_vida') as unknown as ContractTables['specializations'][number],
    ],
    financialFacts: [
      getTable('parcelas') as unknown as ContractTables['financialFacts'][number],
      getTable('comissoes') as unknown as ContractTables['financialFacts'][number],
      getTable('repasses') as unknown as ContractTables['financialFacts'][number],
    ],
    auditLogs: getTable('audit_logs') as unknown as ContractTables['auditLogs'],
    pendingEffects: pendingDocumentEffects,
  }
}

function operationServices() {
  return {
    makeId: (scope: string) => `${scope}:${newId()}`,
    today: () => new Date().toISOString().slice(0, 10),
    materialize: materializeDocumentAgendas,
    audit: (
      entityType: 'apolice' | 'proposta' | 'oportunidade',
      entityId: string,
      field: string,
      previous: unknown,
      next: unknown,
    ) => getTable('audit_logs').push({
      id: newId(),
      tenant_id: MOCK_TENANT_ID,
      user_id: MOCK_USER_ID,
      entidade_tipo: entityType,
      entidade_id: entityId,
      campo: field,
      valor_antigo: auditValue(previous),
      valor_novo: auditValue(next),
      acao: field === 'criacao' ? 'INSERT' : 'UPDATE',
      ocorrido_em: nowIso(),
      origem: 'FRONT_MOCK',
      ip: null,
      user_agent: 'WassisCRM mock',
    }),
  }
}

const policyStatus: Record<string, PolicyContractStatus> = {
  EM_EMISSAO: 'Em emissão',
  ATIVA: 'Vigente',
  VIGENTE: 'Vigente',
  RENOVADA: 'Renovada',
  NAO_RENOVADA: 'Não renovada',
  CANCELADA: 'Cancelada',
  RECUSADA: 'Recusada',
}

const proposalType: Record<string, ProposalType> = {
  NOVA: 'Proposta',
  RENOVACAO: 'Renovação',
  ENDOSSO: 'Endosso',
  CANCELAMENTO: 'Cancelamento',
  FATURA: 'Fatura',
}

const policyProposalStatus: Record<PolicyContractStatus, ProposalStatus> = {
  'Em emissão': 'Pendente',
  Vigente: 'Proposta Emitida',
  Renovada: 'Renovada',
  'Não renovada': 'Não renovada',
  Cancelada: 'Cancelada',
  Recusada: 'Recusada',
}

const movementType: Record<string, EndorsementMovementType> = {
  ALTERACAO_DADOS: 'alteracao_dados',
  INCLUSAO_ITEM: 'inclusao_item',
  EXCLUSAO_ITEM: 'exclusao_item',
  SUBSTITUICAO_ITEM: 'substituicao_item',
  ALTERACAO_COBERTURA: 'alteracao_cobertura',
  ALTERACAO_IMPORTANCIA_SEGURADA: 'alteracao_importancia_segurada',
  ALTERACAO_CLAUSULA: 'alteracao_clausula',
}

const text = (value: unknown, fallback = 'Não informado') =>
  typeof value === 'string' && value.trim() ? value : fallback

function buildProjection(): Proposal[] {
  const policies = getTable('apolices') as ApoliceRow[]
  const documents = getTable('propostas') as PropostaRow[]
  const insureds = getTable('segurados')
  const insurers = getTable('seguradoras')
  const branches = getTable('ramos')
  const producers = getTable('produtores')
  const stages = getTable('pipeline_stages')
  const endorsementSubtypes = getTable('endosso_subtipos')
  const cancellationReasons = getTable('cancelamento_motivos')
  const policyItems = getTable('apolice_itens')

  const policiesProjection: Proposal[] = policies.map((policy) => {
    const branch = branches.find((item) => item.id === policy.ramo_id)
    const insured = insureds.find((item) => item.id === policy.segurado_id)
    const currentStatus = policyStatus[policy.status ?? ''] ?? 'Em emissão'
    return {
      id: policy.id,
      entityType: 'apolice',
      seguradoId: policy.segurado_id,
      insured: text(insured?.nome),
      insuredDocument: insured?.cpf_cnpj ?? undefined,
      insuredCity: insured?.cidade ?? undefined,
      insuredState: insured?.estado ?? undefined,
      insuredEmail: insured?.email ?? undefined,
      insuredPhone: insured?.telefone ?? undefined,
      branch: text(branch?.nome),
      branchId: policy.ramo_id ?? undefined,
      status: policyProposalStatus[currentStatus],
      currentStatus,
      proposalType: 'Proposta',
      producer: { name: text(producers.find((item) => item.id === policy.produtor_id)?.nome) },
      producerId: policy.produtor_id ?? undefined,
      insurer: text(insurers.find((item) => item.id === policy.seguradora_id)?.nome),
      insurerId: policy.seguradora_id ?? undefined,
      policyNumber: policy.numero_apolice ?? undefined,
      controlNumber: policy.numero_controle_documento ?? undefined,
      issueDate: policy.data_emissao ?? undefined,
      vigenciaInicial: policy.vigencia_inicio ?? undefined,
      vigenciaFinal: policy.vigencia_fim ?? undefined,
      totalPremium: policy.premio_total ?? undefined,
      netPremium: policy.premio_liquido ?? undefined,
      iof: policy.iof ?? undefined,
      installmentAdditional: policy.adicional_fracionamento ?? undefined,
      paymentFrequency: policy.periodicidade_pagamento ?? undefined,
      notes: policy.observacoes ?? undefined,
      isMonthly: branch?.is_monthly === true,
      isRenewable: branch?.renovavel === true,
      allowsEndorsement: branch?.permite_endosso === true,
      renewedFromId: policy.renovada_de_id ?? undefined,
    }
  })

  const documentsProjection: Proposal[] = documents.map((document) => {
    const policy = policies.find((item) => item.id === document.apolice_id)
    const branch = branches.find((item) => item.id === policy?.ramo_id)
    const stage = stages.find((item) => item.id === document.stage_id)
    const rawMovement = document.tipo_movimento_endosso ?? ''
    const insured = insureds.find((item) => item.id === policy?.segurado_id)
    const subtype = endorsementSubtypes.find((item) => item.id === document.endosso_subtipo_id)
    const cancellationReason = cancellationReasons.find((item) => item.id === document.cancelamento_motivo_id)
    const allPolicyItems = policyItems.filter((item) => item.apolice_id === document.apolice_id)
    const affectedItems = allPolicyItems.filter(
      (item) =>
        item.incluido_por_proposta_id === document.id ||
        item.excluido_por_proposta_id === document.id,
    )
    const visibleItems = affectedItems.length > 0
      ? affectedItems
      : allPolicyItems.filter((item) => item.status !== 'historico')
    return {
      id: document.id,
      entityType: 'proposta',
      apoliceId: document.apolice_id,
      seguradoId: policy?.segurado_id,
      insured: text(insured?.nome),
      insuredDocument: insured?.cpf_cnpj ?? undefined,
      insuredCity: insured?.cidade ?? undefined,
      insuredState: insured?.estado ?? undefined,
      insuredEmail: insured?.email ?? undefined,
      insuredPhone: insured?.telefone ?? undefined,
      branch: text(branch?.nome),
      branchId: policy?.ramo_id ?? undefined,
      status: proposalStatusFromStageName(stage?.nome),
      proposalType: proposalType[document.tipo ?? ''] ?? 'Proposta',
      producer: { name: text(producers.find((item) => item.id === policy?.produtor_id)?.nome) },
      producerId: policy?.produtor_id ?? undefined,
      insurer: text(insurers.find((item) => item.id === policy?.seguradora_id)?.nome),
      insurerId: policy?.seguradora_id ?? undefined,
      stageId: document.stage_id,
      policyNumber: policy?.numero_apolice ?? undefined,
      proposalNumber: document.numero_proposta ?? undefined,
      endorsementNumber: document.numero_endosso ?? undefined,
      invoiceNumber: document.numero_fatura ?? undefined,
      controlNumber: document.numero_controle_documento ?? undefined,
      insurerProtocol: document.protocolo_seguradora ?? undefined,
      endorsementMovement: movementType[rawMovement] ?? undefined,
      endorsementSubtypeId: document.endosso_subtipo_id ?? undefined,
      endorsementSubtype: subtype?.nome ?? undefined,
      cancellationReasonId: document.cancelamento_motivo_id ?? undefined,
      cancellationReason: cancellationReason?.nome ?? undefined,
      transmissionDate: document.data_transmissao ?? undefined,
      insurerReceiptDate: document.data_recebimento_seguradora ?? undefined,
      acceptanceDate: document.data_aceitacao ?? undefined,
      refusalDate: document.data_recusa ?? undefined,
      refusalReason: document.motivo_recusa ?? undefined,
      issueDate: document.data_emissao ?? undefined,
      vigenciaInicial: document.vigencia_inicio ?? policy?.vigencia_inicio ?? undefined,
      vigenciaFinal: document.vigencia_fim ?? policy?.vigencia_fim ?? undefined,
      totalPremium: document.premio_total ?? undefined,
      netPremium: document.premio_liquido ?? undefined,
      iof: document.iof ?? undefined,
      installmentAdditional: document.adicional_fracionamento ?? undefined,
      paymentMethod: document.forma_pagamento ?? undefined,
      paymentFrequency: document.periodicidade_pagamento ?? undefined,
      installmentCount: document.qtd_parcelas ?? undefined,
      firstInstallmentDueDate: document.primeira_parcela_vencimento ?? undefined,
      firstInstallmentValue: document.primeira_parcela_valor ?? undefined,
      commissionPercent: document.comissao_pct ?? undefined,
      agencyCommissionPercent: document.agenciamento_pct ?? undefined,
      competenceStart: document.competencia_inicio ?? undefined,
      competenceEnd: document.competencia_fim ?? undefined,
      notes: document.observacoes ?? undefined,
      isMonthly: branch?.is_monthly === true,
      isRenewable: branch?.renovavel === true,
      allowsEndorsement: branch?.permite_endosso === true,
      renewedFromId: policy?.renovada_de_id ?? undefined,
      insuredItems: visibleItems.map((item) =>
        text(item.descricao, item.numero_item ? `Item ${item.numero_item}` : 'Item segurado'),
      ),
    }
  })

  return [...policiesProjection, ...documentsProjection]
}

export function PropostasProvider({ children }: { children: ReactNode }) {
  const { activeBranchId, user } = useAuth()
  const [, setRevision] = useState(0)
  const proposals = buildProjection()

  const workflowTables = (): ProposalWorkflowTables => ({
    activeBranchId,
    pipelines: getTable('pipelines') as unknown as ProposalWorkflowTables['pipelines'],
    stages: getTable('pipeline_stages') as unknown as ProposalWorkflowTables['stages'],
    documents: getTable('propostas') as unknown as ProposalWorkflowTables['documents'],
    policies: getTable('apolices') as unknown as ProposalWorkflowTables['policies'],
  })

  const proposalStages = getProposalWorkflowStages(workflowTables())

  const setProposalStatus = (id: string, status: ProposalStatus) => {
    if (moveProposalToStatus(workflowTables(), id, status)) {
      setRevision((current) => current + 1)
    }
  }

  const refuseProposal = (id: string, reason?: string) => {
    const result = refuseProposalDocument(workflowTables(), id, { reason })
    if (result.changed) setRevision((current) => current + 1)
    return result.changed
  }

  const updatePolicy = (id: string, patch: Database['public']['Tables']['apolices']['Update']) => {
    const count = persistAuditedUpdate('apolices', 'apolice', id, patch)
    if (count) setRevision((current) => current + 1)
    return count
  }

  const updateDocument = (id: string, patch: Database['public']['Tables']['propostas']['Update']) => {
    const count = persistAuditedUpdate('propostas', 'proposta', id, patch)
    if (count) setRevision((current) => current + 1)
    return count
  }

  const createDerivedDocument = (input: Omit<DerivedDocumentInput, 'responsibleId'>) => {
    if (!user) throw new Error('Usuário da sessão não encontrado.')
    const document = persistDerivedDocument(contractTables(), { ...input, responsibleId: user.id }, operationServices())
    setRevision((current) => current + 1)
    return document.id
  }

  const createRenewalOpportunity = (policyId: string) => {
    if (!user) throw new Error('Usuário da sessão não encontrado.')
    const opportunity = persistRenewalOpportunity(contractTables(), {
      policyId,
      tenantId: user.tenantId ?? MOCK_TENANT_ID,
      filialId: activeBranchId,
      responsibleId: user.id,
    }, operationServices())
    setRevision((current) => current + 1)
    return opportunity.id
  }

  const transmitRenewalOpportunity = (opportunityId: string) => {
    if (!user) throw new Error('Usuário da sessão não encontrado.')
    const result = persistRenewalTransmission(contractTables(), {
      opportunityId,
      responsibleId: user.id,
    }, operationServices())
    setRevision((current) => current + 1)
    return { policyId: result.policy.id, documentId: result.document.id }
  }

  const issueContractDocument = (documentId: string) => {
    persistDocumentIssue(contractTables(), { documentId }, operationServices())
    setRevision((current) => current + 1)
  }

  const markPolicyNotRenewed = (policyId: string, reason: string) => {
    persistNotRenewed(contractTables(), policyId, reason, operationServices())
    setRevision((current) => current + 1)
  }

  const refreshProposals = () => setRevision((current) => current + 1)

  return (
    <PropostasContext.Provider value={{
      proposals,
      proposalStages,
      setProposalStatus,
      refuseProposal,
      updatePolicy,
      updateDocument,
      createDerivedDocument,
      createRenewalOpportunity,
      transmitRenewalOpportunity,
      issueContractDocument,
      markPolicyNotRenewed,
      refreshProposals,
    }}>
      {children}
    </PropostasContext.Provider>
  )
}
