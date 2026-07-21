import { describe, expect, it } from 'vitest'
import {
  buildExtratoIdempotencyKey,
  buildExtratoItemIdempotencyKey,
  classifyConciliation,
  hasConciliationDuplicate,
} from './conciliacaoContract'
import { getTable } from '../../lib/inMemoryDb'
import type { ComissaoConciliacaoRow, ComissaoRow } from '../../types/database'

describe('contrato de extratos e conciliacao', () => {
  it('gera chaves deterministicas para arquivo e item', () => {
    expect(buildExtratoIdempotencyKey({
      filialId: 'Filial SP', seguradoraId: 'Porto Seguro', arquivoHash: 'ABC-123',
    })).toBe('filial-sp|porto-seguro|abc-123')
    expect(buildExtratoItemIdempotencyKey({
      extratoId: 'Extrato 1', identificacaoExterna: 'Linha 001',
    })).toBe('extrato-1|linha-001')
  })

  it('exige identidade idempotente suficiente', () => {
    expect(() => buildExtratoIdempotencyKey({ filialId: 'f1', seguradoraId: 's1' })).toThrow()
    expect(() => buildExtratoItemIdempotencyKey({ extratoId: 'e1' })).toThrow()
  })

  it('classifica associacao exata sem ocorrencia', () => {
    expect(classifyConciliation({ candidateCount: 1, expectedValue: 125.45, informedValue: 125.45 })).toEqual({
      itemStatus: 'CONCILIADO', associationType: 'EXATA', occurrences: [], difference: 0,
    })
  })

  it('representa recebimento parcial sem forcar 1:1', () => {
    expect(classifyConciliation({
      candidateCount: 1, expectedValue: 200, informedValue: 80, allocatedValue: 80,
    })).toEqual({
      itemStatus: 'PARCIAL', associationType: 'PARCIAL',
      occurrences: ['VALOR_DIVERGENTE'], difference: -120,
    })
  })

  it('separa ambiguidade, ausencia e divergencia', () => {
    expect(classifyConciliation({ candidateCount: 2 }).itemStatus).toBe('AMBIGUO')
    expect(classifyConciliation({ candidateCount: 0 }).itemStatus).toBe('NAO_ENCONTRADO')
    expect(classifyConciliation({ candidateCount: 1, expectedValue: 100, informedValue: 95 })).toMatchObject({
      itemStatus: 'DIVERGENTE', associationType: 'SUGERIDA', occurrences: ['VALOR_DIVERGENTE'],
    })
  })

  it('mantem selecao manual explicita mesmo com diferenca', () => {
    expect(classifyConciliation({
      candidateCount: 0, expectedValue: 100, informedValue: 95, manual: true,
    })).toMatchObject({ itemStatus: 'DIVERGENTE', associationType: 'MANUAL' })
  })

  it('bloqueia repeticao pelo par item-comissao ou pela chave', () => {
    const existing = [{ item_id: 'item-1', comissao_id: 'comissao-1', chave_idempotencia: 'item-1|comissao-1' }]
    expect(hasConciliationDuplicate(existing, {
      item_id: 'item-1', comissao_id: 'comissao-1', chave_idempotencia: 'outra-chave',
    })).toBe(true)
    expect(hasConciliationDuplicate(existing, {
      item_id: 'item-2', comissao_id: 'comissao-2', chave_idempotencia: 'item-1|comissao-1',
    })).toBe(true)
    expect(hasConciliationDuplicate(existing, {
      item_id: 'item-2', comissao_id: 'comissao-2', chave_idempotencia: 'item-2|comissao-2',
    })).toBe(false)
    expect(hasConciliationDuplicate(existing, {
      item_id: 'item-1', comissao_id: 'comissao-2', chave_idempotencia: 'item-1|comissao-2',
    })).toBe(false)
    expect(hasConciliationDuplicate(existing, {
      item_id: 'item-2', comissao_id: 'comissao-1', chave_idempotencia: 'item-2|comissao-1',
    })).toBe(false)
  })

  it('prova a associacao sem executar baixa na massa minima', () => {
    const commissions = getTable('comissoes') as unknown as ComissaoRow[]
    const reconciliations = getTable('comissao_conciliacoes') as unknown as ComissaoConciliacaoRow[]
    const reconciliation = reconciliations.find((row) => row.id === 'mock-conciliacao-exata')
    const commission = commissions.find((row) => row.id === reconciliation?.comissao_id)

    expect(reconciliation).toMatchObject({ tipo_associacao: 'EXATA', status: 'CONFIRMADA' })
    expect(commission).toMatchObject({ status: 'PREVISTA', valor_recebido: null, recebida_em: null })
  })
})
