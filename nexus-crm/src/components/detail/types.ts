/**
 * Tipos das 4 guias padrão de detalhe (Tarefas, Campos personalizados,
 * Anexos e logs, Observações). Entity-agnostic — qualquer módulo (Segurados,
 * Oportunidades, Sinistros…) reutiliza estes contratos.
 *
 * Hoje o app é frontend-puro (BFF) e estas coleções começam vazias, geridas em
 * estado de sessão (ver `useEntityTabsState`). Quando houver persistência, basta
 * trocar a origem dos dados — os componentes de UI não mudam.
 */

export interface Responsavel {
  nome: string
  iniciais?: string
}

export type TarefaStatus = 'Pendente' | 'Atrasada' | 'Concluída'
export type TarefaPrioridade = 'Alta' | 'Média' | 'Baixa'
export type TarefaTipo =
  | 'Ligação'
  | 'E-mail'
  | 'Reunião'
  | 'Documento'
  | 'Follow-up'
  | 'Renovação'

export interface Tarefa {
  id: string
  titulo: string
  tipo: TarefaTipo
  prazo?: string
  status: TarefaStatus
  responsavel?: Responsavel
  prioridade: TarefaPrioridade
}

export type CampoTipo = 'texto' | 'numero' | 'moeda' | 'data' | 'lista' | 'booleano'

export interface CampoPersonalizado {
  id: string
  label: string
  valor: string
  tipo: CampoTipo
}

export type AnexoTipo = 'pdf' | 'img' | 'zip' | 'doc'

export interface Anexo {
  id: string
  nome: string
  tipo: AnexoTipo
  tamanho: string
  data?: string
  autor?: string
}

export type LogTipo =
  | 'nota'
  | 'anexo'
  | 'oportunidade'
  | 'cadastro'
  | 'sistema'

export interface LogEntry {
  id: string
  quando: string
  titulo: string
  detalhe?: string
  autor?: string
  tipo: LogTipo
}

export interface Observacao {
  id: string
  texto: string
  autor?: string
  data: string
  pinned: boolean
}

/** Conjunto de coleções de uma entidade, exposto por `useEntityTabsState`. */
export interface EntityTabsData {
  tarefas: Tarefa[]
  campos: CampoPersonalizado[]
  anexos: Anexo[]
  logs: LogEntry[]
  observacoes: Observacao[]
}
