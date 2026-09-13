import { useContext } from 'react'
import { PropostasContext } from './propostasCore'
import type { PropostasContextType } from './propostasCore'
import { usesBackendData } from '../lib/dataMode'

const pending = (): never => { throw new Error('Integração de propostas e apólices pendente.') }
const unavailable: PropostasContextType = {
  proposals: [], proposalStages: [], setProposalStatus: pending, refuseProposal: pending,
  updatePolicy: pending, updateDocument: pending, createDerivedDocument: pending,
  createRenewalOpportunity: pending, transmitRenewalOpportunity: pending,
  issueContractDocument: pending, markPolicyNotRenewed: pending, refreshProposals: pending,
}

export const usePropostas = () => {
  const context = useContext(PropostasContext)
  if (usesBackendData) return unavailable
  if (!context) throw new Error('usePropostas must be used within a PropostasProvider')
  return context
}
