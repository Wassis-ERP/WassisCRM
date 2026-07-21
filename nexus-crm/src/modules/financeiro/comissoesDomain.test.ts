import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable, newId } from '../../lib/inMemoryDb'
import type { ComissaoBaixaRow, ComissaoRow, RepasseRow } from '../../types/database'
import {
  filterFinanceiroComissoes,
  listFinanceiroComissoes,
  registerManualCommissionReceipt,
  reverseCommissionReceipt,
  type BaixaManualCommand,
  type ComissaoFilters,
  type FinanceiroComissao,
} from './comissoesDomain'

const touchedTables = [
  'comissoes', 'comissao_extratos', 'comissao_extrato_itens', 'comissao_conciliacoes',
  'comissao_conciliacao_ocorrencias', 'comissao_baixas', 'comissao_baixa_conciliacoes',
  'repasses', 'audit_logs',
] as const

let snapshots: Map<string, ReturnType<typeof getTable>>

beforeEach(() => {
  snapshots = new Map(touchedTables.map((table) => [table, getTable(table).map((row) => ({ ...row }))]))
})

afterEach(() => {
  snapshots.forEach((rows, table) => getTable(table).splice(0, getTable(table).length, ...rows.map((row) => ({ ...row }))))
})

function targetCommission(predicate?: (row: FinanceiroComissao) => boolean): FinanceiroComissao {
  const row = listFinanceiroComissoes(null).find((candidate) =>
    candidate.statusOperacional !== 'CANCELADA'
    && Math.abs(candidate.saldo) > 0.01
    && (predicate ? predicate(candidate) : true),
  )
  if (!row) throw new Error('A massa de teste não possui comissão elegível.')
  return row
}

function commandFor(row: FinanceiroComissao, overrides: Partial<BaixaManualCommand> = {}): BaixaManualCommand {
  return {
    filialId: row.filialId,
    seguradoraId: row.seguradoraId ?? '',
    competencia: row.competencia_inicio ?? '2026-07-01',
    dataEfetiva: '2026-07-15',
    identificacaoExterna: `MANUAL-${newId()}`,
    chaveIdempotencia: `teste-baixa-${newId()}`,
    items: [{
      comissaoId: row.id,
      valorBruto: row.saldo,
      valorDescontos: 0,
      valorEfetivo: row.saldo,
    }],
    ...overrides,
  }
}

describe('comissoesDomain', () => {
  it('compõe a agenda materializada sem confundir conciliação com baixa', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas > 0)
    expect(row.statusOperacional).toBe('CONCILIADA')
    expect(row.valorConciliado).not.toBe(0)
    expect(row.valorBaixado).toBe(0)
    expect(row.saldo).toBe(row.valor_previsto)
  })

  it('registra baixa manual com origem lógica, conciliação, histórico e liberação do repasse', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas === 0 && candidate.saldo > 0)
    const beforeExtracts = getTable('comissao_extratos').length
    const beforeAudits = getTable('audit_logs').length
    const result = registerManualCommissionReceipt(commandFor(row))
    const commission = (getTable('comissoes') as unknown as ComissaoRow[]).find((candidate) => candidate.id === row.id)
    const receipt = (getTable('comissao_baixas') as unknown as ComissaoBaixaRow[]).find((candidate) => candidate.id === result.baixaIds[0])

    expect(result.idempotent).toBe(false)
    expect(result.extratoId).not.toBeNull()
    expect(getTable('comissao_extratos')).toHaveLength(beforeExtracts + 1)
    expect(getTable('comissao_extrato_itens').some((item) => item.extrato_id === result.extratoId)).toBe(true)
    expect(getTable('comissao_baixa_conciliacoes').some((bridge) => bridge.baixa_id === receipt?.id)).toBe(true)
    expect(receipt).toMatchObject({ tipo: 'BAIXA', motivo_tipo: 'EXATA', origem_tipo: 'MANUAL' })
    expect(commission).toMatchObject({ status: 'RECEBIDA', valor_recebido: row.saldo, valor_diferenca: 0 })
    expect(getTable('audit_logs')).toHaveLength(beforeAudits + 1)
    expect((getTable('repasses') as unknown as RepasseRow[])
      .filter((transfer) => transfer.comissao_id === row.id)
      .every((transfer) => transfer.status !== 'PREVISTO')).toBe(true)
  })

  it('consome uma ou mais conciliações confirmadas sem criar extrato duplicado', () => {
    const row = targetCommission((candidate) => candidate.conciliacaoIds.length > 0 && candidate.saldo > 0)
    const beforeExtracts = getTable('comissao_extratos').length
    const result = registerManualCommissionReceipt(commandFor(row, {
      items: [{
        comissaoId: row.id,
        valorBruto: row.saldo,
        valorDescontos: 0,
        valorEfetivo: row.saldo,
        conciliacaoIds: row.conciliacaoIds,
      }],
    }))
    const bridges = getTable('comissao_baixa_conciliacoes').filter((bridge) => bridge.baixa_id === result.baixaIds[0])

    expect(result.extratoId).toBeNull()
    expect(getTable('comissao_extratos')).toHaveLength(beforeExtracts)
    expect(bridges).toHaveLength(row.conciliacaoIds.length)
  })

  it('impede baixa enquanto houver ocorrência ou sugestão de conciliação pendente', () => {
    const row = targetCommission((candidate) => candidate.conciliacaoIds.length > 0 && candidate.saldo > 0)
    const reconciliation = getTable('comissao_conciliacoes').find((candidate) => candidate.id === row.conciliacaoIds[0])
    if (!reconciliation) throw new Error('Conciliação de teste não encontrada.')
    getTable('comissao_conciliacao_ocorrencias').push({
      id: newId(), item_id: reconciliation.item_id, conciliacao_id: reconciliation.id,
      tipo: 'VALOR_DIVERGENTE', status: 'ABERTA', motivo: 'Diferença ainda não resolvida.',
      valor_esperado: row.saldo, valor_encontrado: row.saldo - 1,
      percentual_esperado: row.percentual, percentual_encontrado: row.percentual,
      competencia_esperada_inicio: row.competencia_inicio, competencia_esperada_fim: row.competencia_fim,
      competencia_encontrada: row.competencia_inicio, resolucao_tipo: null,
      resolucao_observacao: null, identificada_por_id: 'mock-user-id', resolvida_por_id: null,
      identificada_em: '2026-07-15T12:00:00.000Z', resolvida_em: null,
      atualizado_em: '2026-07-15T12:00:00.000Z',
    })

    expect(() => registerManualCommissionReceipt(commandFor(row, {
      items: [{
        comissaoId: row.id, valorBruto: row.saldo, valorDescontos: 0,
        valorEfetivo: row.saldo, conciliacaoIds: row.conciliacaoIds,
      }],
    }))).toThrow(/resolva ocorrências/i)
    expect(getTable('comissao_baixas')).toHaveLength(0)
  })

  it('mantém saldo na mesma comissão após baixa parcial e conclui com uma segunda baixa', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas === 0 && candidate.saldo > 10)
    const firstValue = Math.round(row.saldo * 50) / 100
    registerManualCommissionReceipt(commandFor(row, {
      justificativa: 'Recebimento parcial informado pela seguradora.',
      items: [{ comissaoId: row.id, valorBruto: firstValue, valorDescontos: 0, valorEfetivo: firstValue }],
    }))
    const partial = listFinanceiroComissoes(null).find((candidate) => candidate.id === row.id)
    expect(partial).toMatchObject({ statusOperacional: 'PARCIAL', valorBaixado: firstValue })
    expect(partial?.saldo).toBeCloseTo(row.saldo - firstValue, 2)

    registerManualCommissionReceipt(commandFor(partial!, {
      items: [{ comissaoId: row.id, valorBruto: partial!.saldo, valorDescontos: 0, valorEfetivo: partial!.saldo }],
    }))
    const completed = listFinanceiroComissoes(null).find((candidate) => candidate.id === row.id)
    expect(completed).toMatchObject({ statusOperacional: 'BAIXADA', saldo: 0 })
    expect((getTable('comissao_baixas') as unknown as ComissaoBaixaRow[])
      .filter((event) => event.comissao_id === row.id && event.tipo === 'BAIXA')).toHaveLength(2)
  })

  it('é idempotente e não duplica a mesma baixa', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas === 0 && candidate.saldo > 0)
    const command = commandFor(row)
    const first = registerManualCommissionReceipt(command)
    const count = getTable('comissao_baixas').length
    const repeated = registerManualCommissionReceipt(command)
    expect(repeated).toMatchObject({ baixaIds: first.baixaIds, idempotent: true })
    expect(getTable('comissao_baixas')).toHaveLength(count)
  })

  it('exige justificativa para divergência e preserva a ocorrência resolvida', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas === 0 && candidate.saldo > 0)
    const over = Math.round((row.saldo + 10) * 100) / 100
    const invalid = commandFor(row, {
      items: [{ comissaoId: row.id, valorBruto: over, valorDescontos: 0, valorEfetivo: over }],
    })
    expect(() => registerManualCommissionReceipt(invalid)).toThrow(/exige justificativa/i)
    expect(getTable('comissao_baixas')).toHaveLength(0)

    const result = registerManualCommissionReceipt({ ...invalid, chaveIdempotencia: `teste-divergencia-${newId()}`, justificativa: 'Diferença aceita após conferência do demonstrativo.' })
    expect(result.baixaIds).toHaveLength(1)
    expect(listFinanceiroComissoes(null).find((candidate) => candidate.id === row.id)?.statusOperacional).toBe('DIVERGENTE')
    expect(getTable('comissao_conciliacao_ocorrencias').some((occurrence) => occurrence.status === 'RESOLVIDA' && occurrence.resolucao_tipo === 'DIVERGENCIA_ACEITA')).toBe(true)
  })

  it('trata divergências de percentual e competência sem alterar a agenda contratual', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas === 0 && candidate.saldo > 0 && candidate.percentual !== null)
    const storedCommission = (getTable('comissoes') as unknown as ComissaoRow[]).find((candidate) => candidate.id === row.id)
    if (!storedCommission) throw new Error('Comissão de teste não encontrada.')
    Object.assign(storedCommission, { competencia_inicio: '2026-07-01', competencia_fim: '2026-07-31' })
    const changedPercentage = (row.percentual ?? 0) + 1
    const divergentCompetence = '2000-01-01'
    const invalid = commandFor(row, {
      competencia: divergentCompetence,
      items: [{
        comissaoId: row.id, valorBruto: row.saldo, valorDescontos: 0,
        valorEfetivo: row.saldo, percentualInformado: changedPercentage,
      }],
    })
    expect(() => registerManualCommissionReceipt(invalid)).toThrow(/exige justificativa/i)

    registerManualCommissionReceipt({
      ...invalid, chaveIdempotencia: `teste-percentual-competencia-${newId()}`,
      justificativa: 'Percentual e competência confirmados no demonstrativo.',
    })
    const occurrences = getTable('comissao_conciliacao_ocorrencias')
    const divergentTypes = occurrences.filter((occurrence) => occurrence.competencia_encontrada === divergentCompetence).map((occurrence) => occurrence.tipo)
    expect(divergentTypes).toEqual(expect.arrayContaining(['PERCENTUAL_DIVERGENTE', 'COMPETENCIA_DIVERGENTE']))
    expect((getTable('comissoes') as unknown as ComissaoRow[]).find((candidate) => candidate.id === row.id)?.valor_previsto).toBe(row.valor_previsto)
  })

  it('estorna por evento compensatório, preserva a baixa original e reabre o saldo', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas === 0 && candidate.saldo > 0)
    const result = registerManualCommissionReceipt(commandFor(row))
    const original = (getTable('comissao_baixas') as unknown as ComissaoBaixaRow[]).find((event) => event.id === result.baixaIds[0])
    const reversal = reverseCommissionReceipt({
      baixaId: result.baixaIds[0], dataEfetiva: '2026-07-15',
      justificativa: 'Correção de lançamento operacional.', chaveIdempotencia: `teste-estorno-${newId()}`,
    })
    const current = listFinanceiroComissoes(null).find((candidate) => candidate.id === row.id)

    expect(original).toBeDefined()
    expect(reversal).toMatchObject({ tipo: 'ESTORNO', baixa_origem_id: original?.id, valor_efetivo: -row.saldo })
    expect(current).toMatchObject({ statusOperacional: 'CONCILIADA', valorBaixado: 0, saldo: row.saldo })
  })

  it('bloqueia estorno quando existe repasse pago vinculado', () => {
    const row = targetCommission((candidate) => candidate.conciliacoesConfirmadas === 0 && candidate.saldo > 0)
    const result = registerManualCommissionReceipt(commandFor(row))
    const transfers = getTable('repasses') as unknown as RepasseRow[]
    const linked = transfers.find((transfer) => transfer.comissao_id === row.id)
    if (linked) linked.status = 'PAGO'
    else transfers.push({
      id: newId(), proposta_id: row.proposta_id, comissao_id: row.id, beneficiario_id: 'mock-user-id',
      regra_id: null, numero: 1, papel_beneficiario: 'PRODUTOR', base: 'COMISSAO', percentual: 10,
      valor_previsto: 10, valor_pago: 10, valor_diferenca: 0, status: 'PAGO', previsto_em: '2026-07-15',
      liberado_em: '2026-07-15', pago_em: '2026-07-15', forma_pagamento: null,
      comprovante_referencia: null, observacoes: null,
    })

    expect(() => reverseCommissionReceipt({
      baixaId: result.baixaIds[0], dataEfetiva: '2026-07-15', justificativa: 'Tentativa bloqueada por repasse.',
      chaveIdempotencia: `teste-estorno-bloqueado-${newId()}`,
    })).toThrow(/repasse pago/i)
    expect((getTable('comissao_baixas') as unknown as ComissaoBaixaRow[])
      .filter((event) => event.baixa_origem_id === result.baixaIds[0])).toHaveLength(0)
  })

  it('filtra por contexto, competência, documento, tipo e estado operacional', () => {
    const rows = listFinanceiroComissoes(null)
    const target = rows[0]
    expect(target).toBeDefined()
    const filters: ComissaoFilters = {
      filialId: target.filialId, seguradoId: target.seguradoId,
      seguradoraId: target.seguradoraId ?? '', ramoId: target.ramoId ?? '',
      documento: target.documentoReferencia, competenciaDe: target.competencia_inicio ?? '',
      competenciaAte: target.competencia_inicio ?? '', status: target.statusOperacional,
      tipo: target.tipo_comissao,
    }
    const filtered = filterFinanceiroComissoes(rows, filters)
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((row) => row.filialId === target.filialId && row.statusOperacional === target.statusOperacional)).toBe(true)
  })
})
