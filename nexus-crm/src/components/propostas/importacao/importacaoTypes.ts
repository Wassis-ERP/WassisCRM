export type ImportDocumentKind = 'PROPOSTA' | 'APOLICE' | 'ENDOSSO' | 'CANCELAMENTO' | 'FATURA'
export type ImportProposalType = 'NOVA' | 'RENOVACAO' | 'ENDOSSO'
export type ImportFileStatus = 'LIDO' | 'REVISAO' | 'NAO_SUPORTADO' | 'IMPORTADO' | 'ERRO'

export interface ImportFileDraft {
  id: string
  fileName: string
  size: number
  mimeType: string
  kind: ImportDocumentKind
  proposalType: ImportProposalType | null
  status: ImportFileStatus
  message: string | null
  insuredId: string
  branchOfficeId: string
  insurerId: string
  branchId: string
  producerId: string
  policyId: string
  endorsementSubtypeId: string
  gradeId: string
  proposalNumber: string
  policyNumber: string
  endorsementNumber: string
  issueDate: string
  coverageStart: string
  coverageEnd: string
  totalPremium: string
  netPremium: string
  commissionPct: string
  agencyCommissionPct: string
  installmentCount: string
  firstDueDate: string
  paymentMethod: string
}

export interface ImportLookupOption {
  id: string
  label: string
  detail?: string
}

export interface ImportLookups {
  insureds: ImportLookupOption[]
  branchOffices: ImportLookupOption[]
  insurers: ImportLookupOption[]
  branches: ImportLookupOption[]
  producers: ImportLookupOption[]
  policies: ImportLookupOption[]
  endorsementSubtypes: ImportLookupOption[]
  grades: ImportLookupOption[]
}

export interface ImportResult {
  fileId: string
  status: 'IMPORTADO' | 'ERRO'
  message: string
  policyId?: string
  proposalId?: string
}

export interface AgendaPreview {
  installmentCount: number
  commissionEvents: number
  commissionAmount: number
  transferAmount: number | null
  gradeName: string
  transferRule: string
}
