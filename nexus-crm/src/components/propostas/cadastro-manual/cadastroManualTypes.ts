export type ManualDocumentMode = 'PROPOSTA' | 'APOLICE'

export interface ManualCoverageDraft {
  id: string
  catalogId: string
  capital: string
  deductible: string
  premium: string
}

export interface ManualItemDetails {
  marca: string
  modelo: string
  placa: string
  chassi: string
  cep: string
  endereco: string
  cidade: string
  uf: string
  cnpjRisco: string
  razaoSocialRisco: string
  atividade: string
  nomeGrupo: string
  numeroVidas: string
  capitalIndividual: string
}

export interface ManualItemDraft {
  id: string
  description: string
  externalIdentifier: string
  riskValue: string
  addressSummary: string
  details: ManualItemDetails
  coverages: ManualCoverageDraft[]
}

export interface ManualDocumentDraft {
  mode: ManualDocumentMode
  insuredId: string
  branchOfficeId: string
  insurerId: string
  branchId: string
  producerId: string
  responsibleId: string
  proposalNumber: string
  policyNumber: string
  controlNumber: string
  insurerProtocol: string
  transmissionDate: string
  issueDate: string
  documentReceiptDate: string
  coverageStart: string
  coverageEnd: string
  totalPremium: string
  netPremium: string
  iof: string
  fractionationFee: string
  paymentMethod: string
  paymentFrequency: string
  installmentCount: string
  firstDueDate: string
  commissionPct: string
  agencyCommissionPct: string
  gradeId: string
  contractType: string
  policyType: string
  susepProcess: string
  stipulatorName: string
  notes: string
  attachment: {
    name: string
    type: string
    size: number
  } | null
  items: ManualItemDraft[]
}

export interface ManualLookupOption {
  id: string
  label: string
  detail?: string
}

export interface ManualBranchOption extends ManualLookupOption {
  riskType: string
  requiresItems: boolean
}

export interface ManualCoverageOption extends ManualLookupOption {
  branchId: string
  defaultCapital: number | null
}

export interface ManualLookups {
  insureds: ManualLookupOption[]
  branchOffices: ManualLookupOption[]
  insurers: ManualLookupOption[]
  branches: ManualBranchOption[]
  producers: ManualLookupOption[]
  responsibles: ManualLookupOption[]
  grades: ManualLookupOption[]
  coverages: ManualCoverageOption[]
}

export interface ManualAgendaPreview {
  installments: number
  commissionEvents: number
  commissionAmount: number
  transferAmount: number | null
  gradeName: string
  transferRule: string
  willMaterialize: boolean
}

export interface ManualCreateResult {
  policyId: string
  proposalId: string
  agendas: {
    parcelas: number
    comissoes: number
    repasses: number
  }
}
