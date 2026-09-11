import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable } from './inMemoryDb'
import { supabase } from './supabase'
import { platformDefaults } from '../types/platformRows'
import type { Database } from '../types/database'
import { buildCreateSeguradoInput, mapSeguradoRowToView } from './seguradoMapper'
import { simulateReceiptGrade, validateReceiptGrade, type ReceiptGrade, type ReceiptGradeEvent } from './receiptGradeDomain'
import { resolveScopedCatalog } from '../contexts/contractCatalogCore'
import { buildCampoValorPayload } from '../hooks/useCamposPersonalizados'
import { buildRecebimentoGradeUpdatePayload, buildRepasseRegraUpdatePayload, type CampoDefinicaoRow, type RecebimentoGradeInput, type RepasseRegraInput } from '../hooks/useLookupsAdmin'
import { getManualLookups } from '../components/propostas/cadastro-manual/cadastroManualDomain'
import { getImportLookups } from '../components/propostas/importacao/importacaoDomain'

const names = ['segurados', 'ramos', 'seguradoras', 'produtores', 'recebimento_grades', 'recebimento_grade_parcelas', 'endosso_subtipos', 'coberturas_catalogo']
let snapshot: Record<string, Record<string, unknown>[]>
beforeEach(() => { snapshot = Object.fromEntries(names.map(name => [name, structuredClone(getTable(name))])) })
afterEach(() => { for (const name of names) getTable(name).splice(0, getTable(name).length, ...snapshot[name]) })

describe('leitura incompleta e autoria validada', () => {
  it('preserva desconhecido para tipo, status, consentimento e datas da pessoa', () => {
    const row: Database['public']['Tables']['segurados']['Row'] = { ...platformDefaults.segurados, id: 'incompleto', tenant_id: 'mock-tenant-id', filial_id: 'mock-branch-id', tipo: null, nome: null, status: null, lgpd_autorizado: null, created_at: null, updated_at: null }
    expect(mapSeguradoRowToView(row)).toMatchObject({ nome: '', tipo: null, status: null, lgpdAutorizado: null, createdAt: undefined, updatedAt: undefined })
    expect(() => buildCreateSeguradoInput({ nome: 'Pessoa', tipo: null, status: 'Prospecto' })).toThrow('Tipo')
    expect(() => buildCreateSeguradoInput({ nome: 'Pessoa', tipo: 'PF', status: null })).toThrow('Status')
  })

  it('recusa limpar tipo/status obrigatório do fluxo sem publicar a alteração', async () => {
    const row = getTable('segurados')[0]
    const result = await supabase.from('segurados').update({ tipo: null, status: null }).eq('id', row.id)
    expect(result.error).not.toBeNull()
    expect(getTable('segurados')[0].tipo).toBe(row.tipo)
    expect(row.tipo).not.toBeNull()
  })

  it('nomes nulos não quebram os lookups de cadastro manual e importação', () => {
    for (const table of names) for (const row of getTable(table)) if ('nome' in row) row.nome = null
    expect(() => getManualLookups()).not.toThrow()
    expect(() => getImportLookups()).not.toThrow()
    expect(getManualLookups().insurers.every(row => typeof row.label === 'string')).toBe(true)
  })

  it('não seleciona catálogo sem nome ou sem ativação confirmada', () => {
    expect(resolveScopedCatalog([{ id: 'a', nome: null, ativo: true, filial_id: null, ramo_id: null }, { id: 'b', nome: 'Válido', ativo: null, filial_id: null, ramo_id: null }], null, null)).toEqual([])
  })

  it.each(['nome', 'tipo', 'qtd_parcelas', 'considera_iof', 'considera_adicional_fracionamento', 'vitalicio'] as const)('grade com %s desconhecido não gera valores', field => {
    const grade = { ...(getTable('recebimento_grades')[0] as ReceiptGrade), [field]: null }
    const events = getTable('recebimento_grade_parcelas').filter(row => row.grade_id === grade.id) as ReceiptGradeEvent[]
    expect(validateReceiptGrade(grade, events).applicable).toBe(false)
    expect(() => simulateReceiptGrade(grade, events, { totalPremium: 1000, netPremium: 900, commissionPct: 10, agencyCommissionPct: 0, installmentCount: 1, firstDueDate: '2026-09-11' })).toThrow()
  })

  it('evento sem número ou tipo de comissão é recusado antes da simulação', () => {
    const grade = getTable('recebimento_grades')[0] as ReceiptGrade
    const events = getTable('recebimento_grade_parcelas').filter(row => row.grade_id === grade.id).map(row => ({ ...row, numero: null, tipo_comissao: null })) as ReceiptGradeEvent[]
    const issues = validateReceiptGrade(grade, events).issues.map(issue => issue.code)
    expect(issues).toContain('INVALID_EVENT_NUMBER')
    expect(issues).toContain('COMMISSION_TYPE_REQUIRED')
  })

  it('builders continuam exigindo decisões financeiras na escrita', () => {
    const grade = { ...getTable('recebimento_grades')[0], tipo: null, observacoes: '' } as RecebimentoGradeInput
    expect(() => buildRecebimentoGradeUpdatePayload(grade)).toThrow('Complete')
    const rule = { ...getTable('repasse_regras')[0], base: null, observacoes: '', inicio_vigencia: '', fim_vigencia: '' } as RepasseRegraInput
    expect(() => buildRepasseRegraUpdatePayload(rule)).toThrow('Complete')
  })

  it('definição EAV sem tipo não vira texto por fallback', () => {
    const definition = { ...getTable('campo_definicoes')[0], tipo_dado: null } as CampoDefinicaoRow
    expect(() => buildCampoValorPayload(definition, 'pessoa', 'texto')).toThrow('Complete')
  })
})
