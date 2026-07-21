import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import type { ComissaoRow } from '../../types/database'
import { listFinanceiroComissoes } from './comissoesDomain'
import {
  confirmCommissionImport,
  processCommissionStatementFile,
  refreshImportItem,
  validateImportPreview,
  type CommissionImportPreview,
} from './extratoImportDomain'

const touchedTables = [
  'comissoes', 'comissao_extratos', 'comissao_extrato_itens',
  'comissao_conciliacoes', 'comissao_conciliacao_ocorrencias', 'comissao_baixas',
] as const

let snapshots: Map<string, ReturnType<typeof getTable>>

beforeEach(() => {
  snapshots = new Map(touchedTables.map((table) => [table, getTable(table).map((row) => ({ ...row }))]))
})

afterEach(() => {
  snapshots.forEach((rows, table) => getTable(table).splice(0, getTable(table).length, ...rows.map((row) => ({ ...row }))))
})

function contextWithPendingCommission() {
  const row = listFinanceiroComissoes(null).find((candidate) =>
    candidate.seguradoraId
    && candidate.statusOperacional !== 'CANCELADA'
    && Math.abs(candidate.saldo) > 0.01,
  )
  if (!row?.seguradoraId) throw new Error('Massa sem comissão elegível para importação.')
  return row
}

function pdf(name = 'demonstrativo.pdf') {
  return new File([new TextEncoder().encode('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF')], name, { type: 'application/pdf' })
}

async function preview(): Promise<CommissionImportPreview> {
  const row = contextWithPendingCommission()
  const result = await processCommissionStatementFile({
    file: pdf(),
    branchId: row.filialId,
    insurerId: row.seguradoraId!,
    competence: row.competencia_inicio ?? '2026-07-01',
  })
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      resolutionNote: item.associationKind === 'PARCIAL' ? 'Parcialidade conferida no demonstrativo.' : item.resolutionNote,
    })),
  }
}

describe('extratoImportDomain', () => {
  it('valida o container e devolve prévia tipada sem persistir fatos', async () => {
    const beforeExtracts = getTable('comissao_extratos').length
    const beforeItems = getTable('comissao_extrato_itens').length
    const result = await preview()

    expect(result).toMatchObject({
      format: 'PDF',
      parserIdentifier: 'backend-mock-demonstrativo-comissao',
      parserVersion: '1.0.0',
    })
    expect(result.fileHash).toMatch(/^[a-f0-9]{64}$/)
    expect(result.items.length).toBeGreaterThan(0)
    expect(getTable('comissao_extratos')).toHaveLength(beforeExtracts)
    expect(getTable('comissao_extrato_itens')).toHaveLength(beforeItems)
  })

  it('recusa extensão não suportada, conteúdo vazio e assinatura incompatível', async () => {
    const row = contextWithPendingCommission()
    const base = { branchId: row.filialId, insurerId: row.seguradoraId!, competence: '2026-07-01' }

    await expect(processCommissionStatementFile({ ...base, file: new File(['texto'], 'extrato.csv', { type: 'text/csv' }) })).rejects.toThrow(/formato não suportado/i)
    await expect(processCommissionStatementFile({ ...base, file: new File([], 'extrato.pdf', { type: 'application/pdf' }) })).rejects.toThrow(/vazio/i)
    await expect(processCommissionStatementFile({ ...base, file: new File(['não é pdf'], 'extrato.pdf', { type: 'application/pdf' }) })).rejects.toThrow(/assinatura/i)
  })

  it('exige tratamento explícito para item sem vínculo e divergência', async () => {
    const result = await preview()
    const first = result.items[0]
    const withoutLink = refreshImportItem({ ...first, selectedCommissionId: null }, listFinanceiroComissoes(null))
    const invalid = { ...result, items: [withoutLink] }
    expect(validateImportPreview(invalid, listFinanceiroComissoes(null)))
      .toContainEqual(expect.stringMatching(/escolha uma comissão/i))

    const ignored = { ...withoutLink, ignored: true, resolutionNote: 'Item fora do período conferido.' }
    expect(validateImportPreview({ ...result, items: [ignored], totalizationNote: 'Item descartado após conferência do cabeçalho.' }, listFinanceiroComissoes(null))).toEqual([])
  })

  it('exige justificativa quando o total informado diverge da soma dos itens', async () => {
    const result = await preview()
    const divergent = { ...result, netTotal: result.netTotal + 10 }
    expect(validateImportPreview(divergent, listFinanceiroComissoes(null))[0]).toMatch(/cabeçalho/i)
    expect(validateImportPreview({ ...divergent, totalizationNote: 'Diferença confirmada no demonstrativo.' }, listFinanceiroComissoes(null)))
      .not.toContainEqual(expect.stringMatching(/cabeçalho/i))
  })

  it('confirma extrato, itens, conciliações e ocorrências sem criar baixa', async () => {
    const result = await preview()
    const commissionBefore = (getTable('comissoes') as unknown as ComissaoRow[]).map((row) => ({ ...row }))
    const beforeReceipts = getTable('comissao_baixas').length
    const beforeExtracts = getTable('comissao_extratos').length
    const confirmed = confirmCommissionImport(result)
    const partialCommissionId = result.items.find((item) => item.associationKind === 'PARCIAL')?.selectedCommissionId

    expect(confirmed.idempotent).toBe(false)
    expect(confirmed.reconciliations).toBe(result.items.length)
    if (partialCommissionId) expect(confirmed.commissionIds).not.toContain(partialCommissionId)
    expect(getTable('comissao_extratos')).toHaveLength(beforeExtracts + 1)
    expect(getTable('comissao_extrato_itens').filter((item) => item.extrato_id === confirmed.extractId)).toHaveLength(result.items.length)
    expect(getTable('comissao_baixas')).toHaveLength(beforeReceipts)
    expect(getTable('comissoes')).toEqual(commissionBefore)
  })

  it('reutiliza a confirmação pelo hash sem duplicar o extrato', async () => {
    const result = await preview()
    const first = confirmCommissionImport(result)
    const extractCount = getTable('comissao_extratos').length
    const itemCount = getTable('comissao_extrato_itens').length
    const second = confirmCommissionImport(result)

    expect(second).toMatchObject({ extractId: first.extractId, idempotent: true })
    expect(getTable('comissao_extratos')).toHaveLength(extractCount)
    expect(getTable('comissao_extrato_itens')).toHaveLength(itemCount)
  })
})
