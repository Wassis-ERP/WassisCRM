import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import type { FinanceiroCobrancaRow, ParcelaRow } from '../../types/database'
import { confirmParcelaPayments, reverseParcelaPayments } from './parcelasDomain'
import {
  closeFinanceiroCobranca,
  createFinanceiroCobranca,
  getFinanceiroCobranca,
  listFinanceiroCobrancas,
  listParcelasElegiveisCobranca,
  maintainFinanceiroCobranca,
  moveFinanceiroCobrancaStage,
  reopenFinanceiroCobranca,
} from './cobrancasDomain'

const cobrancas = () => getTable('financeiro_cobrancas') as unknown as FinanceiroCobrancaRow[]
const parcelas = () => getTable('parcelas') as unknown as ParcelaRow[]
let cobrancaSnapshot: FinanceiroCobrancaRow[]
let parcelaSnapshot: ParcelaRow[]
let auditLength: number

beforeEach(() => {
  cobrancaSnapshot = cobrancas().map((row) => ({ ...row }))
  parcelaSnapshot = parcelas().map((row) => ({ ...row }))
  auditLength = getTable('audit_logs').length
})

afterEach(() => {
  cobrancas().splice(0, cobrancas().length, ...cobrancaSnapshot.map((row) => ({ ...row })))
  parcelas().splice(0, parcelas().length, ...parcelaSnapshot.map((row) => ({ ...row })))
  getTable('audit_logs').splice(auditLength)
})

function stageIds(): string[] {
  const pipeline = getTable('pipelines').find((row) => row.entidade_tipo === 'cobranca')
  return getTable('pipeline_stages')
    .filter((row) => row.pipeline_id === pipeline?.id)
    .sort((a, b) => Number(a.ordem) - Number(b.ordem))
    .map((row) => String(row.id))
}

function createEligible() {
  const parcela = listParcelasElegiveisCobranca(null)[0]
  const stage = stageIds()[0]
  expect(parcela).toBeDefined()
  expect(stage).toBeDefined()
  return createFinanceiroCobranca({ parcelaId: parcela.id, stageId: stage })
}

describe('cobrancasDomain', () => {
  it('projeta cobrança por parcela e deriva pipeline, documento, apólice e segurado', () => {
    const row = listFinanceiroCobrancas(null)[0]
    expect(row).toBeDefined()
    expect(row.parcela.id).toBe(row.parcela_id)
    expect(row.pipelineId).toBeTruthy()
    expect(row.parcela.documentoReferencia).toBeTruthy()
    expect(row.parcela.apoliceId).toBeTruthy()
    expect(row.parcela.seguradoId).toBeTruthy()
    expect(row).not.toHaveProperty('oportunidade_id')
    expect(row).not.toHaveProperty('metadata')
  })

  it('abre somente uma cobrança ativa por parcela vencida e audita a abertura', () => {
    const beforeAudit = getTable('audit_logs').length
    const row = createEligible()
    expect(row.status).toBe('ATIVA')
    expect(getFinanceiroCobranca(row.id, null)?.parcela.statusEfetivo).toBe('vencida')
    expect(() => createFinanceiroCobranca({ parcelaId: row.parcela_id, stageId: row.stage_id })).toThrow(/já possui/i)
    expect(getTable('audit_logs')).toHaveLength(beforeAudit + 1)
  })

  it('rejeita abertura para parcela ainda não vencida sem persistência parcial', () => {
    const future = parcelas().find((row) => row.vencimento && row.vencimento > '2026-07-20' && row.status === 'em_aberto')
    expect(future).toBeDefined()
    const before = cobrancas().length
    expect(() => createFinanceiroCobranca({ parcelaId: future!.id, stageId: stageIds()[0] })).toThrow(/efetivamente vencida/i)
    expect(cobrancas()).toHaveLength(before)
  })

  it('mantém campos tipados, move apenas dentro do pipeline e audita por campo', () => {
    const row = createEligible()
    const beforeAudit = getTable('audit_logs').length
    const maintained = maintainFinanceiroCobranca({ id: row.id, patch: { prioridade: 'URGENTE', canal_preferencial: 'EMAIL', observacoes: 'Contato reforçado.' } })
    expect(maintained.changedFields).toBe(3)
    expect(row).toMatchObject({ prioridade: 'URGENTE', canal_preferencial: 'EMAIL', observacoes: 'Contato reforçado.' })
    const moved = moveFinanceiroCobrancaStage(row.id, stageIds()[1])
    expect(moved.changedFields).toBe(1)
    expect(getTable('audit_logs')).toHaveLength(beforeAudit + 4)
  })

  it('quita somente depois da baixa e reabre após o pagamento ser desfeito', () => {
    const row = createEligible()
    expect(() => closeFinanceiroCobranca(row.id, 'QUITADA')).toThrow(/confirme primeiro/i)
    confirmParcelaPayments({ ids: [row.parcela_id], dataPagamento: '2026-07-20' })
    expect(closeFinanceiroCobranca(row.id, 'QUITADA').row.status).toBe('QUITADA')
    expect(() => reopenFinanceiroCobranca(row.id)).toThrow(/parcela estiver vencida/i)
    reverseParcelaPayments([row.parcela_id])
    expect(reopenFinanceiroCobranca(row.id).row.status).toBe('ATIVA')
  })

  it('exige motivo para cancelar e permite reabertura elegível', () => {
    const row = createEligible()
    expect(() => closeFinanceiroCobranca(row.id, 'CANCELADA')).toThrow(/motivo/i)
    const closed = closeFinanceiroCobranca(row.id, 'CANCELADA', 'Cobrança aberta por engano.')
    expect(closed.row).toMatchObject({ status: 'CANCELADA', motivo_encerramento: 'Cobrança aberta por engano.' })
    expect(reopenFinanceiroCobranca(row.id).row).toMatchObject({ status: 'ATIVA', motivo_encerramento: null, encerrada_em: null })
  })
})
