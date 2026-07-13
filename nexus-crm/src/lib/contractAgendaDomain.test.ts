import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Database } from '../types/database'
import { applyDocumentAgendas, getTable, previewDocumentAgendas } from './inMemoryDb'
import { simulateReceiptGrade, validateReceiptGrade } from './receiptGradeDomain'

const touched = ['propostas', 'parcelas', 'comissoes', 'repasses', 'audit_logs'] as const
let snapshots = new Map<string, Array<Record<string, unknown>>>()

beforeEach(() => {
  snapshots = new Map(touched.map((table) => [table, getTable(table).map((row) => ({ ...row }))]))
})

afterEach(() => {
  snapshots.forEach((rows, table) => getTable(table).splice(0, getTable(table).length, ...rows))
})

describe('fechamento das grades de recebimento', () => {
  it('valida e simula uma grade íntegra sem materializar fatos', () => {
    type Grade = Database['public']['Tables']['recebimento_grades']['Row']
    type Event = Database['public']['Tables']['recebimento_grade_parcelas']['Row']
    const grades = getTable('recebimento_grades') as unknown as Grade[]
    const events = getTable('recebimento_grade_parcelas') as unknown as Event[]
    const grade = grades.find((row) => row.nome === 'Porto Auto - antecipado 3x')
    expect(grade).toBeDefined()
    if (!grade) return
    const gradeEvents = events.filter((row) => row.grade_id === grade.id)
    expect(validateReceiptGrade(grade, gradeEvents, grades).applicable).toBe(true)

    const factsBefore = getTable('comissoes').length
    const simulation = simulateReceiptGrade(grade, gradeEvents, {
      totalPremium: 1000,
      netPremium: 900,
      commissionPct: 20,
      agencyCommissionPct: 0,
      installmentCount: 10,
      firstDueDate: '2026-07-10',
    })
    expect(simulation.map((row) => row.expectedValue)).toEqual([90, 54, 36])
    expect(simulation.reduce((sum, row) => sum + row.expectedValue, 0)).toBe(180)
    expect(getTable('comissoes')).toHaveLength(factsBefore)
  })

  it('bloqueia grade finita incompleta', () => {
    type Grade = Database['public']['Tables']['recebimento_grades']['Row']
    type Event = Database['public']['Tables']['recebimento_grade_parcelas']['Row']
    const grade = (getTable('recebimento_grades') as unknown as Grade[]).find((row) => row.nome === 'Porto Auto - antecipado 3x')
    expect(grade).toBeDefined()
    if (!grade) return
    const events = (getTable('recebimento_grade_parcelas') as unknown as Event[]).filter((row) => row.grade_id === grade.id).slice(0, 2)
    const validation = validateReceiptGrade(grade, events)
    expect(validation.applicable).toBe(false)
    expect(validation.issues.some((issue) => issue.code === 'FINITE_COUNT_MISMATCH')).toBe(true)
  })
})

describe('geração consolidada das agendas', () => {
  it('corrige o caso Rafael coletivamente e permanece idempotente', () => {
    const initial = previewDocumentAgendas('mock-proposta-rafael')
    expect(initial.compatibleGrades).toHaveLength(1)
    const gradeId = initial.compatibleGrades[0].id
    const preview = previewDocumentAgendas('mock-proposta-rafael', gradeId)
    expect(preview.diagnosis.installments.state).toBe('DIVERGENTE')
    expect(preview.diagnosis.commissions.state).toBe('VAZIA')
    expect(preview.installments.map((row) => row.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(preview.commissions).toHaveLength(3)
    expect(preview.transfers).toHaveLength(3)

    const applied = applyDocumentAgendas('mock-proposta-rafael', gradeId, 'REPLACE_PENDING')
    expect(applied.cancelled.installments).toBe(1)
    expect(applied.created).toEqual({ installments: 10, commissions: 3, transfers: 3 })
    const complete = previewDocumentAgendas('mock-proposta-rafael', gradeId)
    expect(complete.diagnosis.installments.state).toBe('COMPLETA')
    expect(complete.diagnosis.commissions.state).toBe('COMPLETA')
    expect(complete.diagnosis.transfers.state).toBe('COMPLETA')

    const repeated = applyDocumentAgendas('mock-proposta-rafael', gradeId, 'COMPLETE_MISSING')
    expect(repeated.created).toEqual({ installments: 0, commissions: 0, transfers: 0 })
  })

  it('protege fatos já processados contra regeneração', () => {
    const installment = getTable('parcelas').find((row) => row.id === 'mock-parcela-rafael-manual-10')
    expect(installment).toBeDefined()
    if (!installment) return
    installment.valor_pago = 150
    const gradeId = previewDocumentAgendas('mock-proposta-rafael').compatibleGrades[0].id
    const preview = previewDocumentAgendas('mock-proposta-rafael', gradeId)
    expect(preview.diagnosis.installments.state).toBe('BLOQUEADA')
    expect(() => applyDocumentAgendas('mock-proposta-rafael', gradeId, 'REPLACE_PENDING')).toThrow(/Reverta a operação financeira/)
  })
})
