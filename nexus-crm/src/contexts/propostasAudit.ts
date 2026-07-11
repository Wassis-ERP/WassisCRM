import { getTable, MOCK_TENANT_ID, MOCK_USER_ID, newId, nowIso } from '../lib/inMemoryDb'

function auditValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

export function persistAuditedUpdate(
  tableName: 'apolices' | 'propostas',
  entityType: 'apolice' | 'proposta',
  id: string,
  patch: Record<string, unknown>,
): number {
  const row = getTable(tableName).find((item) => item.id === id)
  if (!row) return 0

  const changed = Object.entries(patch).filter(([field, next]) => !Object.is(row[field], next))
  if (changed.length === 0) return 0

  changed.forEach(([field, next]) => {
    const previous = row[field]
    row[field] = next
    getTable('audit_logs').push({
      id: newId(), tenant_id: MOCK_TENANT_ID, user_id: MOCK_USER_ID,
      entidade_tipo: entityType, entidade_id: id, campo: field,
      valor_antigo: auditValue(previous), valor_novo: auditValue(next),
      acao: 'UPDATE', ocorrido_em: nowIso(), origem: 'FRONT_MOCK',
      ip: null, user_agent: 'WassisCRM mock',
    })
  })
  return changed.length
}
