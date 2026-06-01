import React, { useState } from 'react'
import { PropostasContext } from './propostasCore'
import type { Proposal, ProposalStatus } from '../types/proposta'

/**
 * Store frontend puro de propostas/apólices, em memória (zera a cada reload).
 * Inicia vazio: itens passam a existir quando criados no Painel e aparecem
 * automaticamente na aba "Apólices" do segurado (filtrados por `seguradoId`).
 */
export const PropostasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proposals, setProposals] = useState<Proposal[]>([])

  const addProposal: (p: Omit<Proposal, 'id'> & { id?: string }) => void = (p) =>
    setProposals(prev => [...prev, { ...p, id: p.id ?? crypto.randomUUID() } as Proposal])

  const updateProposal = (id: string, patch: Partial<Proposal>) =>
    setProposals(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))

  const setProposalStatus = (id: string, status: ProposalStatus) =>
    setProposals(prev => prev.map(p => (p.id === id ? { ...p, status } : p)))

  const removeProposal = (id: string) =>
    setProposals(prev => prev.filter(p => p.id !== id))

  return (
    <PropostasContext.Provider value={{ proposals, addProposal, updateProposal, setProposalStatus, removeProposal }}>
      {children}
    </PropostasContext.Provider>
  )
}
