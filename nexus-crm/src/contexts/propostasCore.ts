import { createContext } from 'react'
import type { Proposal, ProposalStatus } from '../types/proposta'

export type { Proposal, ProposalStatus, ProposalType } from '../types/proposta'

export interface PropostasContextType {
  proposals: Proposal[]
  addProposal: (p: Omit<Proposal, 'id'> & { id?: string }) => void
  updateProposal: (id: string, patch: Partial<Proposal>) => void
  setProposalStatus: (id: string, status: ProposalStatus) => void
  removeProposal: (id: string) => void
}

export const PropostasContext = createContext<PropostasContextType | undefined>(undefined)
