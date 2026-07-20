import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import type {
  ComissaoBaixaConciliacaoRow,
  ComissaoBaixaRow,
  ComissaoRow,
  RepasseReciboItemRow,
  RepasseReciboRow,
  RepasseRow,
} from '../../types/database'
import { reverseCommissionReceipt } from './comissoesDomain'
import {
  createReceiptExcel,
  createReceiptPdf,
  createRepasseReportExcel,
  createRepasseReportPdf,
} from './financialExports'
import {
  cancelRepasseReceipt,
  filterFinanceiroRepasses,
  getRepasseReceipt,
  groupRepasseReceipts,
  issueRepasseReceipts,
  listFinanceiroRepasses,
  snapshotRepasseState,
  type RepasseFilters,
} from './repasseDomain'
import { canSubmitRepasseReceipt } from './repasseReceiptValidation'

const TABLES = [
  'repasses', 'repasse_recibos', 'repasse_recibo_itens', 'audit_logs',
  'comissao_baixas', 'comissao_baixa_conciliacoes', 'comissoes',
] as const

const typedRows = <T,>(table: string): T[] => getTable(table) as unknown as T[]
let snapshots: Map<string, Array<Record<string, unknown>>>
let sequence = 0

beforeEach(() => {
  snapshots = new Map(TABLES.map((table) => [table, typedRows<Record<string, unknown>>(table).map((row) => ({ ...row }))]))
})

afterEach(() => {
  snapshots.forEach((rows, table) => {
    const target = typedRows<Record<string, unknown>>(table)
    target.splice(0, target.length, ...rows)
  })
})

function addRepasse(options: {
  propostaId?: string
  beneficiarioId?: string
  status?: RepasseRow['status']
  valor?: number
  comissaoId?: string | null
  regraId?: string | null
} = {}): RepasseRow {
  sequence += 1
  const row: RepasseRow = {
    id: `test-repasse-${sequence}`, proposta_id: options.propostaId ?? 'mock-proposta-viaforte-original',
    comissao_id: options.comissaoId ?? null, beneficiario_id: options.beneficiarioId ?? 'mock-produtor-interno',
    regra_id: options.regraId === undefined ? `test-regra-${sequence}` : options.regraId,
    numero: 800 + sequence, papel_beneficiario: 'PRODUTOR', base: 'COMISSAO', percentual: 30,
    valor_previsto: options.valor ?? 125.5, valor_pago: null, valor_diferenca: null,
    status: options.status ?? 'LIBERADO', previsto_em: '2026-07-10', liberado_em: '2026-07-15',
    pago_em: null, forma_pagamento: null, comprovante_referencia: null, observacoes: null,
  }
  typedRows<RepasseRow>('repasses').push(row)
  return row
}

function command(ids: string[], key = `test-emissao-${sequence}-12345`) {
  return {
    repasseIds: ids, dataPagamento: '2026-07-16' as const,
    formaPagamento: 'TRANSFERENCIA_BANCARIA' as const,
    comprovanteReferencia: 'TED-001', observacoes: 'Pagamento conferido',
    chaveIdempotencia: key,
  }
}

describe('repasseDomain v2.5', () => {
  it('mantém o CTA bloqueado até o checkbox obrigatório ser marcado', () => {
    expect(canSubmitRepasseReceipt(false, '2026-07-16', false)).toBe(false)
    expect(canSubmitRepasseReceipt(true, '', false)).toBe(false)
    expect(canSubmitRepasseReceipt(true, '2026-07-16', true)).toBe(false)
    expect(canSubmitRepasseReceipt(true, '2026-07-16', false)).toBe(true)
  })

  it('lista snapshots, filtra e agrupa por filial, beneficiário e sentido', () => {
    const positive = addRepasse()
    const negative = addRepasse({ valor: -40 })
    const other = addRepasse({ beneficiarioId: 'mock-produtor-externo' })
    const rows = listFinanceiroRepasses(null).filter((row) => [positive.id, negative.id, other.id].includes(row.id))

    expect(rows).toHaveLength(3)
    expect(rows.every((row) => row.elegivel)).toBe(true)
    expect(groupRepasseReceipts(rows)).toHaveLength(3)
    expect(rows.find((row) => row.id === negative.id)?.sentido).toBe('DEBITO')

    const filters: RepasseFilters = {
      filialId: '', beneficiarioId: 'mock-produtor-interno', papel: '', seguradoId: '',
      seguradoraId: '', ramoId: '', documento: '', comissaoId: '', origem: 'REGRA',
      periodo: 'LIBERADO', dataDe: '2026-07-15', dataAte: '2026-07-15', status: 'LIBERADO',
    }
    expect(filterFinanceiroRepasses(rows, filters).map((row) => row.id).sort()).toEqual([negative.id, positive.id].sort())
  })

  it('emite integralmente um recibo por grupo e congela os dados impressos', () => {
    const first = addRepasse({ valor: 120 })
    const second = addRepasse({ valor: 80 })
    const otherBeneficiary = addRepasse({ beneficiarioId: 'mock-produtor-externo', valor: 55 })
    const result = issueRepasseReceipts(command([first.id, second.id, otherBeneficiary.id]))

    expect(result).toMatchObject({ emitidos: 2, idempotentes: 0, falhos: 0 })
    const state = snapshotRepasseState()
    const paid = state.repasses.filter((row) => [first.id, second.id, otherBeneficiary.id].includes(row.id))
    expect(paid.every((row) => row.status === 'PAGO' && row.valor_pago === row.valor_previsto && row.valor_diferenca === 0)).toBe(true)
    expect(state.recibos.filter((row) => result.grupos.some((group) => group.reciboId === row.id))).toHaveLength(2)
    const detail = getRepasseReceipt(result.grupos[0].reciboId!)
    expect(detail?.itens.every((item) => item.documento_referencia_snapshot && item.segurado_nome_snapshot && item.valor_pago_snapshot === item.valor_previsto_snapshot)).toBe(true)
  })

  it('reutiliza retry idempotente e rejeita a mesma chave com conteúdo diferente', () => {
    const first = addRepasse()
    const key = 'retry-emissao-repasse-001'
    const initial = issueRepasseReceipts(command([first.id], key))
    const retry = issueRepasseReceipts(command([first.id], key))
    expect(retry).toMatchObject({ emitidos: 0, idempotentes: 1, falhos: 0 })
    expect(retry.grupos[0].reciboId).toBe(initial.grupos[0].reciboId)

    const second = addRepasse()
    const conflict = issueRepasseReceipts(command([first.id, second.id], key))
    expect(conflict).toMatchObject({ emitidos: 0, idempotentes: 0, falhos: 1 })
    expect(conflict.grupos[0].mensagem).toMatch(/seleção diferente/i)
  })

  it('mantém atomicidade por recibo e explicita resultado parcial entre grupos', () => {
    const eligible = addRepasse({ beneficiarioId: 'mock-produtor-interno' })
    const concurrent = addRepasse({ beneficiarioId: 'mock-produtor-externo', status: 'PREVISTO' })
    const result = issueRepasseReceipts(command([eligible.id, concurrent.id]))

    expect(result).toMatchObject({ emitidos: 1, falhos: 1 })
    expect(typedRows<RepasseRow>('repasses').find((row) => row.id === eligible.id)?.status).toBe('PAGO')
    expect(typedRows<RepasseRow>('repasses').find((row) => row.id === concurrent.id)?.status).toBe('PREVISTO')
    expect(typedRows<RepasseReciboItemRow>('repasse_recibo_itens').some((item) => item.repasse_id === concurrent.id)).toBe(false)
  })

  it('impede segundo recibo ativo para o mesmo repasse', () => {
    const row = addRepasse()
    issueRepasseReceipts(command([row.id], 'primeira-emissao-ativa-001'))
    const duplicate = issueRepasseReceipts(command([row.id], 'segunda-emissao-ativa-002'))
    expect(duplicate).toMatchObject({ emitidos: 0, falhos: 1 })
    expect(typedRows<RepasseReciboItemRow>('repasse_recibo_itens').filter((item) => item.repasse_id === row.id)).toHaveLength(1)
  })

  it('cancela integralmente, preserva recibo/itens e aceita retry idempotente', () => {
    const first = addRepasse({ valor: 100 })
    const second = addRepasse({ valor: 30 })
    const issueResult = issueRepasseReceipts(command([first.id, second.id], 'emissao-para-cancelar-001'))
    const receiptId = issueResult.grupos[0].reciboId!
    const cancelCommand = { reciboId: receiptId, justificativa: 'Pagamento informado na data incorreta.', chaveCancelamento: 'cancelamento-idempotente-001' }
    const cancelled = cancelRepasseReceipt(cancelCommand)
    const retry = cancelRepasseReceipt(cancelCommand)

    expect(cancelled.idempotent).toBe(false)
    expect(retry.idempotent).toBe(true)
    expect(getRepasseReceipt(receiptId)?.recibo.status).toBe('CANCELADO')
    expect(getRepasseReceipt(receiptId)?.itens).toHaveLength(2)
    expect(typedRows<RepasseRow>('repasses').filter((row) => [first.id, second.id].includes(row.id)).every((row) => row.status === 'LIBERADO' && row.valor_pago === null)).toBe(true)
  })

  it('mantém a trava da comissão enquanto o recibo está ativo e a remove após cancelar', () => {
    const commission = typedRows<ComissaoRow>('comissoes')[0]
    expect(commission).toBeTruthy()
    const transfer = addRepasse({ comissaoId: commission.id, valor: 25 })
    const issued = issueRepasseReceipts(command([transfer.id], 'emissao-trava-comissao-001'))
    const original: ComissaoBaixaRow = {
      id: `test-baixa-${sequence}`, comissao_id: commission.id, tipo: 'BAIXA', baixa_origem_id: null,
      origem_tipo: 'MANUAL', data_efetiva: '2026-07-15', valor_efetivo: 1,
      motivo_tipo: 'EXATA', justificativa: null, chave_idempotencia: `test-baixa-key-${sequence}`,
      saldo_apos: 0, status_resultante: 'RECEBIDA', criado_por_id: 'mock-user-id', criado_em: '2026-07-15T12:00:00.000Z',
    }
    typedRows<ComissaoBaixaRow>('comissao_baixas').push(original)
    typedRows<ComissaoBaixaConciliacaoRow>('comissao_baixa_conciliacoes').push({ id: `test-bridge-${sequence}`, baixa_id: original.id, conciliacao_id: `test-conciliacao-${sequence}`, valor_aplicado: 1, criado_em: original.criado_em })

    expect(() => reverseCommissionReceipt({ baixaId: original.id, dataEfetiva: '2026-07-16', justificativa: 'Correção depois do pagamento.', chaveIdempotencia: `estorno-bloqueado-${sequence}` })).toThrow(/repasse pago/i)
    cancelRepasseReceipt({ reciboId: issued.grupos[0].reciboId!, justificativa: 'Pagamento precisa ser refeito.', chaveCancelamento: `cancelar-trava-${sequence}` })
    expect(() => reverseCommissionReceipt({ baixaId: original.id, dataEfetiva: '2026-07-16', justificativa: 'Correção depois do cancelamento.', chaveIdempotencia: `estorno-liberado-${sequence}` })).not.toThrow()
  })

  it('gera relatório sem mutação e reemite PDF/Excel pelo snapshot do recibo', async () => {
    const row = addRepasse({ valor: 88.9 })
    const before = snapshotRepasseState()
    const reportRows = listFinanceiroRepasses(null).filter((item) => item.id === row.id)
    const reportPdf = createRepasseReportPdf(reportRows)
    const reportExcel = createRepasseReportExcel(reportRows)
    expect(reportPdf.blob.type).toBe('application/pdf')
    expect(reportExcel.blob.type).toBe('application/vnd.ms-excel')
    expect(snapshotRepasseState()).toEqual(before)

    const issued = issueRepasseReceipts(command([row.id], 'emissao-exportacao-001'))
    const detail = getRepasseReceipt(issued.grupos[0].reciboId!)!
    const receiptPdf = createReceiptPdf(detail)
    const receiptExcel = createReceiptExcel(detail)
    expect(new TextDecoder('latin1').decode(await receiptPdf.blob.arrayBuffer())).toMatch(/^%PDF-1\.4/)
    expect(new TextDecoder().decode(await receiptExcel.blob.arrayBuffer())).toContain('<Workbook')
    expect(typedRows<RepasseReciboRow>('repasse_recibos')).toContainEqual(expect.objectContaining({ id: detail.recibo.id, status: 'EMITIDO' }))
  })
})
