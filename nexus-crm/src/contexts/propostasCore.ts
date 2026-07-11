import { createContext } from 'react'
import type { Proposal, ProposalStatus } from '../types/proposta'
import type { Database } from '../types/database'

export type { Proposal, ProposalStatus, ProposalType } from '../types/proposta'

export interface PropostasContextType {
  proposals: Proposal[]
  setProposalStatus: (id: string, status: ProposalStatus) => void
  updatePolicy: (id: string, patch: Database['public']['Tables']['apolices']['Update']) => number
  updateDocument: (id: string, patch: Database['public']['Tables']['propostas']['Update']) => number
}

export const PropostasContext = createContext<PropostasContextType | undefined>(undefined)
