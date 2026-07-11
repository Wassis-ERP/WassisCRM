import { afterEach, describe, expect, it } from 'vitest'
import { getTable } from '../lib/inMemoryDb'
import { persistAuditedUpdate } from './propostasAudit'

const policyId = 'test-policy-audit-2-2f'

afterEach(() => {
  const policies = getTable('apolices')
  policies.splice(0, policies.length, ...policies.filter((row) => row.id !== policyId))
  const logs = getTable('audit_logs')
  logs.splice(0, logs.length, ...logs.filter((row) => row.entidade_id !== policyId))
})

describe('edição auditada 2.2f', () => {
  it('altera somente o diff e gera um audit_log por campo', () => {
    getTable('apolices').push({ id: policyId, status: 'VIGENTE', premio_total: 100 })

    const count = persistAuditedUpdate('apolices', 'apolice', policyId, {
      status: 'VIGENTE',
      premio_total: 80,
      premio_liquido: 70,
    })

    const logs = getTable('audit_logs').filter((row) => row.entidade_id === policyId)
    expect(count).toBe(2)
    expect(logs.map((row) => row.campo)).toEqual(['premio_total', 'premio_liquido'])
    expect(logs.every((row) => row.acao === 'UPDATE' && row.origem === 'FRONT_MOCK')).toBe(true)
  })
})
