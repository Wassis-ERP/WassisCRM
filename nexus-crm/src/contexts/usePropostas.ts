import { useContext } from 'react'
import { PropostasContext } from './propostasCore'

export const usePropostas = () => {
  const context = useContext(PropostasContext)
  if (!context) throw new Error('usePropostas must be used within a PropostasProvider')
  return context
}
