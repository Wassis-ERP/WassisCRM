import { requestAuthenticatedBackendJson, getBackendSessionSnapshot } from './backendApi'
import type { Database } from '../types/database'

type Catalog = 'ramos' | 'origens' | 'seguradoras' | 'motivos_perda' | 'produtores' | 'perfis' | 'pipelines' | 'pipeline_stages'
type Row<K extends Catalog> = Database['public']['Tables'][K]['Row']

export async function listBackendBranches(): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
  const data = await requestAuthenticatedBackendJson<unknown>('/api/core/branches')
  if (!Array.isArray(data) || data.some(row => !row || typeof row.id !== 'string' || typeof row.isActive !== 'boolean' || (row.name !== null && typeof row.name !== 'string'))) throw new Error('Lista de corretoras inválida.')
  return data.map(row => ({ id: row.id, name: row.name ?? 'Corretora sem nome', isActive: row.isActive }))
}

// Read-only allowlist matching the existing scoped catalog endpoint. No table writes.
export async function listBackendCatalog<K extends Catalog>(catalog: K): Promise<Row<K>[]> {
  const data = await requestAuthenticatedBackendJson<unknown>(`/api/core/catalogs/${catalog}?activeOnly=true`)
  if (!Array.isArray(data) || data.some(row => !row || typeof row !== 'object' || typeof row.id !== 'string'
    || (row.nome != null && typeof row.nome !== 'string') || (row.ativo != null && typeof row.ativo !== 'boolean')
    || (row.ordem != null && typeof row.ordem !== 'number')
    || (row.pipeline_id != null && typeof row.pipeline_id !== 'string')
    || (row.finaliza_com_sucesso != null && typeof row.finaliza_com_sucesso !== 'boolean')
    || (row.finaliza_com_perda != null && typeof row.finaliza_com_perda !== 'boolean')))
    throw new Error('O backend retornou um catálogo inválido.')
  return data as Row<K>[]
}

// Until a directory endpoint exists, only the authenticated identity is selectable.
export function currentIdentityProfile() {
  const user = getBackendSessionSnapshot()
  return user ? [{ id: user.userId, nome_completo: user.username, avatar_url: null }] : []
}
