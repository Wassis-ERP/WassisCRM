import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import type { ParcelaRow } from '../../types/database'
import {
  confirmParcelaPayments,
  filterFinanceiroParcelas,
  listFinanceiroParcelas,
  parcelaStatusEfetivo,
  reverseParcelaPayments,
  type FinanceiroParcela,
  type ParcelaFilters,
} from './parcelasDomain'

const table = () => getTable('parcelas') as unknown as ParcelaRow[]
let snapshots: ParcelaRow[]
let auditLength: number

beforeEach(() => {
  snapshots = table().map((row) => ({ ...row }))
  auditLength = getTable('audit_logs').length
})

afterEach(() => {
  table().splice(0, table().length, ...snapshots.map((row) => ({ ...row })))
  getTable('audit_logs').splice(auditLength)
})

describe('parcelasDomain', () => {
  it('deriva vencimento sem sobrescrever os demais estados', () => {
    const base = snapshots.find((row) => row.status === 'em_aberto')
    expect(base).toBeDefined()
    expect(parcelaStatusEfetivo({ ...base!, vencimento: '2026-01-01', status: 'em_aberto' }, '2026-07-14')).toBe('vencida')
    expect(parcelaStatusEfetivo({ ...base!, vencimento: '2026-01-01', status: 'cancelada' }, '2026-07-14')).toBe('cancelada')
    expect(parcelaStatusEfetivo({ ...base!, vencimento: '2026-01-01', status: 'estornada' }, '2026-07-14')).toBe('estornada')
  })

  it('confirma e desfaz pagamento preservando o valor previsto e auditando', () => {
    const row = table().find((item) => ['em_aberto', 'vencida'].includes(parcelaStatusEfetivo(item)))
    expect(row).toBeDefined()
    const expected = row!.valor
    const beforeAudit = getTable('audit_logs').length

    confirmParcelaPayments({ ids: [row!.id], dataPagamento: '2026-07-14', valorPago: 123.45 })
    expect(row).toMatchObject({ status: 'paga', data_pagamento: '2026-07-14', data_baixa: '2026-07-14', valor_pago: 123.45, valor: expected })

    reverseParcelaPayments([row!.id])
    expect(row!.valor).toBe(expected)
    expect(row!.valor_pago).toBeNull()
    expect(row!.data_pagamento).toBeNull()
    expect(getTable('audit_logs')).toHaveLength(beforeAudit + 2)
  })

  it('rejeita lote misto sem alteracao parcial', () => {
    const eligible = table().find((item) => ['em_aberto', 'vencida'].includes(parcelaStatusEfetivo(item)))
    const paid = table().find((item) => item.status === 'paga')
    expect(eligible).toBeDefined()
    expect(paid).toBeDefined()
    const previous = { ...eligible! }

    expect(() => confirmParcelaPayments({ ids: [eligible!.id, paid!.id], dataPagamento: '2026-07-14' })).toThrow(/lote contém/i)
    expect(eligible).toEqual(previous)
  })

  it('filtra a leitura composta por origem, vencimento e status', () => {
    const rows = listFinanceiroParcelas(null)
    const target = rows.find((row) => row.statusEfetivo === 'paga') ?? rows[0]
    expect(target).toBeDefined()
    const filters: ParcelaFilters = {
      filialId: target.filialId,
      seguradoId: target.seguradoId,
      seguradoraId: target.seguradoraId ?? '',
      ramoId: target.ramoId ?? '',
      documento: target.documentoReferencia,
      vencimentoDe: target.vencimento ?? '',
      vencimentoAte: target.vencimento ?? '',
      status: target.statusEfetivo,
    }
    const filtered = filterFinanceiroParcelas(rows, filters)
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((row) => row.seguradoId === target.seguradoId && row.statusEfetivo === target.statusEfetivo)).toBe(true)
  })

  it('mantem o contrato do vazio por filtro', () => {
    const rows = listFinanceiroParcelas(null)
    const filters: ParcelaFilters = {
      filialId: '', seguradoId: '', seguradoraId: '', ramoId: '',
      documento: 'documento-inexistente', vencimentoDe: '', vencimentoAte: '', status: '',
    }
    expect(filterFinanceiroParcelas(rows as FinanceiroParcela[], filters)).toEqual([])
  })
})
