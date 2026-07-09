/**
 * Tipos das 4 guias padrão de detalhe (Tarefas, Campos personalizados,
 * Anexos e logs, Observações). Entity-agnostic — qualquer módulo (Segurados,
 * Oportunidades, Sinistros…) reutiliza estes contratos.
 *
 * O app é frontend-puro (BFF), mas estas coleções já são lidas/escritas no mock
 * in-memory usando o contrato polimórfico `entidade_tipo + entidade_id`.
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
  tamanhoBytes?: number
  data?: string
  autor?: string
  descricao?: string
}

export type LogTipo =
  | 'nota'
  | 'anexo'
  | 'oportunidade'
  | 'cadastro'
  | 'sistema'
  | 'audit_log'

export interface LogEntry {
  id: string
  quando: string
  titulo: string
  detalhe?: string
  autor?: string
  tipo: LogTipo
  origem?: 'atividade' | 'audit_log' | 'anexo'
}

export interface Observacao {
  id: string
  texto: string
  autor?: string
  data: string
  pinned: boolean
}

export interface MentionCandidate {
  id: string
  nome: string
  email?: string | null
}

export interface ResolvedMention {
  profileId: string
  marcador: string
}

/** Conjunto de coleções de uma entidade, exposto por `useEntityTabsState`. */
export interface EntityTabsData {
  tarefas: Tarefa[]
  campos: CampoPersonalizado[]
  anexos: Anexo[]
  logs: LogEntry[]
  observacoes: Observacao[]
  mentionCandidates: MentionCandidate[]
}
