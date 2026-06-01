/**
 * Estado de sessão das 4 guias padrão (Tarefas, Campos, Anexos/Logs,
 * Observações) para uma entidade qualquer, identificada por `entityId`.
 *
 * O app é frontend-puro (BFF): não há persistência. As coleções começam vazias
 * e vivem num store de módulo (Map por entidade), de modo que sobrevivem à troca
 * de guias e ao remount da página dentro da mesma sessão, zerando só no reload.
 *
 * Quando existir backend, troque este hook por hooks de dados reais (React Query
 * + adapter, como `useSegurados`) mantendo a mesma forma de retorno — as guias de
 * UI em `components/detail/tabs/` não precisam mudar.
 */
import { useCallback, useState } from 'react'
import { newId } from '../../lib/inMemoryDb'
import type {
  Anexo,
  CampoPersonalizado,
  EntityTabsData,
  LogEntry,
  Observacao,
  Tarefa,
} from './types'

const EMPTY: EntityTabsData = {
  tarefas: [],
  campos: [],
  anexos: [],
  logs: [],
  observacoes: [],
}

const store = new Map<string, EntityTabsData>()

function read(entityId: string): EntityTabsData {
  return store.get(entityId) ?? EMPTY
}

export interface EntityTabsApi extends EntityTabsData {
  addTarefa: (t: Omit<Tarefa, 'id'>) => void
  toggleTarefa: (id: string) => void
  addCampo: (c: Omit<CampoPersonalizado, 'id'>) => void
  addAnexo: (a: Omit<Anexo, 'id'>) => void
  addLog: (l: Omit<LogEntry, 'id'>) => void
  addObservacao: (o: Omit<Observacao, 'id'>) => void
  togglePin: (id: string) => void
}

export function useEntityTabsState(entityId: string | undefined): EntityTabsApi {
  const key = entityId ?? '__none__'
  const [data, setData] = useState<EntityTabsData>(() => read(key))

  const commit = useCallback(
    (next: EntityTabsData) => {
      store.set(key, next)
      setData(next)
    },
    [key],
  )

  const addTarefa = useCallback(
    (t: Omit<Tarefa, 'id'>) =>
      commit({ ...read(key), tarefas: [{ ...t, id: newId() }, ...read(key).tarefas] }),
    [key, commit],
  )

  const toggleTarefa = useCallback(
    (id: string) => {
      const cur = read(key)
      commit({
        ...cur,
        tarefas: cur.tarefas.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'Concluída' ? 'Pendente' : 'Concluída' }
            : t,
        ),
      })
    },
    [key, commit],
  )

  const addCampo = useCallback(
    (c: Omit<CampoPersonalizado, 'id'>) =>
      commit({ ...read(key), campos: [...read(key).campos, { ...c, id: newId() }] }),
    [key, commit],
  )

  const addAnexo = useCallback(
    (a: Omit<Anexo, 'id'>) =>
      commit({ ...read(key), anexos: [{ ...a, id: newId() }, ...read(key).anexos] }),
    [key, commit],
  )

  const addLog = useCallback(
    (l: Omit<LogEntry, 'id'>) =>
      commit({ ...read(key), logs: [{ ...l, id: newId() }, ...read(key).logs] }),
    [key, commit],
  )

  const addObservacao = useCallback(
    (o: Omit<Observacao, 'id'>) =>
      commit({ ...read(key), observacoes: [{ ...o, id: newId() }, ...read(key).observacoes] }),
    [key, commit],
  )

  const togglePin = useCallback(
    (id: string) => {
      const cur = read(key)
      commit({
        ...cur,
        observacoes: cur.observacoes.map((o) =>
          o.id === id ? { ...o, pinned: !o.pinned } : o,
        ),
      })
    },
    [key, commit],
  )

  return {
    ...data,
    addTarefa,
    toggleTarefa,
    addCampo,
    addAnexo,
    addLog,
    addObservacao,
    togglePin,
  }
}
