import { createContext } from 'react'

export interface Permissions {
  dashboard: { view: boolean }
  segurados: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  oportunidades: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  configuracoes: { view: boolean; edit: boolean }
}

export interface Produtor {
  id: string
  nome: string
  email: string
  telefone: string
  status: 'Ativo' | 'Inativo'
  permissions: Permissions
}

export interface FunnelStep {
  id: string
  name: string
  color: string
}

export interface Pipeline {
  id: string
  name: string
  type: 'venda' | 'pos-venda'
  steps: FunnelStep[]
}

export interface SettingsContextType {
  produtores: Produtor[]
  pipelines: Pipeline[]
  ramos: string[]
  seguradoras: string[]
  origens: string[]
  motivosPerda: string[]
  addProdutor: (p: Omit<Produtor, 'id'>) => void
  updateProdutor: (id: string, p: Partial<Produtor>) => void
  removeProdutor: (id: string) => void
  addPipeline: (p: Omit<Pipeline, 'id'>) => void
  updatePipeline: (id: string, p: Partial<Pipeline>) => void
  removePipeline: (id: string) => void
  addRamo: (ramo: string) => void
  removeRamo: (ramo: string) => void
  addSeguradora: (s: string) => void
  removeSeguradora: (s: string) => void
  addOrigem: (o: string) => void
  removeOrigem: (o: string) => void
  addMotivoPerda: (m: string) => void
  removeMotivoPerda: (m: string) => void
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const defaultPermissions: Permissions = {
  dashboard: { view: true },
  segurados: { view: true, create: true, edit: true, delete: false },
  oportunidades: { view: true, create: true, edit: true, delete: true },
  configuracoes: { view: true, edit: false },
}

