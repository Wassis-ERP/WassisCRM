import { createContext } from 'react'
import type { Proposal, ProposalStatus } from '../types/proposta'
import type { Database } from '../types/database'
import type { ProposalWorkflowStage } from './propostasWorkflow'
import type { DerivedDocumentInput } from './contractOperations'

export type { Proposal, ProposalStatus, ProposalType } from '../types/proposta'

export interface PropostasContextType {
  proposals: Proposal[]
  proposalStages: ProposalWorkflowStage[]
  setProposalStatus: (id: string, status: ProposalStatus) => void
  refuseProposal: (id: string, reason?: string) => boolean
  updatePolicy: (id: string, patch: Database['public']['Tables']['apolices']['Update']) => number
  updateDocument: (id: string, patch: Database['public']['Tables']['propostas']['Update']) => number
  createDerivedDocument: (input: Omit<DerivedDocumentInput, 'responsibleId'>) => string
  createRenewalOpportunity: (policyId: string) => string
  transmitRenewalOpportunity: (opportunityId: string) => { policyId: string; documentId: string }
  issueContractDocument: (documentId: string) => void
  markPolicyNotRenewed: (policyId: string, reason: string) => void
  refreshProposals: () => void
}

export const PropostasContext = createContext<PropostasContextType | undefined>(undefined)
