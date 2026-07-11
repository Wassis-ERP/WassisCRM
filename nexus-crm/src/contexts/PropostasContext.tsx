import { useState, type ReactNode } from 'react'
import { getTable } from '../lib/inMemoryDb'
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

type ApoliceRow = Database['public']['Tables']['apolices']['Row']
type PropostaRow = Database['public']['Tables']['propostas']['Row']

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

const stageStatus: Record<string, ProposalStatus> = {
  'Aguardando proposta': 'Pendente',
  'Em análise': 'Em Análise',
  Emitida: 'Proposta Emitida',
  Recusada: 'Recusada',
}

const policyProposalStatus: Record<PolicyContractStatus, ProposalStatus> = {
  'Em emissão': 'Pendente',
  Vigente: 'Proposta Emitida',
  Renovada: 'Renovada',
  'Não renovada': 'Não renovada',
  Cancelada: 'Cancelada',
  Recusada: 'Recusada',
}

const statusStage: Partial<Record<ProposalStatus, string>> = {
  Pendente: 'Aguardando proposta',
  'Pendência Resolvida': 'Aguardando proposta',
  'Em Análise': 'Em análise',
  'Proposta Emitida': 'Emitida',
  Vigente: 'Emitida',
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
      status: stageStatus[text(stage?.nome, '')] ?? 'Pendente',
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
      competenceStart: document.competencia_inicio ?? undefined,
      competenceEnd: document.competencia_fim ?? undefined,
      notes: document.observacoes ?? undefined,
      isMonthly: branch?.is_monthly === true,
    }
  })

  return [...policiesProjection, ...documentsProjection]
}

export function PropostasProvider({ children }: { children: ReactNode }) {
  const [, setRevision] = useState(0)
  const proposals = buildProjection()

  const setProposalStatus = (id: string, status: ProposalStatus) => {
    const stageName = statusStage[status]
    if (!stageName) return
    const proposalPipelineIds = new Set(
      getTable('pipelines')
        .filter((item) => item.entidade_tipo === 'proposta')
        .map((item) => item.id),
    )
    const stage = getTable('pipeline_stages').find(
      (item) => item.nome === stageName && proposalPipelineIds.has(item.pipeline_id),
    )
    const document = getTable('propostas').find((item) => item.id === id)
    if (!stage || !document) return
    document.stage_id = stage.id
    setRevision((current) => current + 1)
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

  return (
    <PropostasContext.Provider value={{ proposals, setProposalStatus, updatePolicy, updateDocument }}>
      {children}
    </PropostasContext.Provider>
  )
}
