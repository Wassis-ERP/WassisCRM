import { afterEach, describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import {
  cancelParcelas, createComissao, createParcela, createRepasse, saveCoverage,
  saveItem, updateComissoes, updateParcelas, updateRepasses,
} from './contractTabOperations'

const createdIds = new Set<string>()

afterEach(() => {
  ;['parcelas', 'comissoes', 'repasses', 'item_coberturas', 'apolice_itens'].forEach((table) => {
    const values = getTable(table) as unknown as Array<{ id: string }>
    for (let index = values.length - 1; index >= 0; index -= 1) {
      if (createdIds.has(values[index].id)) values.splice(index, 1)
    }
  })
  const vehicles = getTable('item_veiculo') as unknown as Array<{ apolice_item_id: string }>
  for (let index = vehicles.length - 1; index >= 0; index -= 1) {
    if (createdIds.has(vehicles[index].apolice_item_id)) vehicles.splice(index, 1)
  }
  const audits = getTable('audit_logs') as unknown as Array<{ entidade_id: string }>
  for (let index = audits.length - 1; index >= 0; index -= 1) {
    if (createdIds.has(audits[index].entidade_id)) audits.splice(index, 1)
  }
  createdIds.clear()
})

describe('operações produtivas nas guias do contrato', () => {
  it('altera múltiplas parcelas e preserva em bloqueio as já liquidadas', () => {
    const first = createParcela({ propostaId: 'mock-proposta-viaforte-original', numero: 91, vencimento: '2026-11-10', valor: 100, valorLiquido: 100, formaPagamento: 'PIX', observacoes: null })
    const second = createParcela({ propostaId: 'mock-proposta-viaforte-original', numero: 92, vencimento: '2026-12-10', valor: 100, valorLiquido: 100, formaPagamento: 'PIX', observacoes: null })
    createdIds.add(first.id); createdIds.add(second.id)

    const updated = updateParcelas([first.id, second.id], { forma_pagamento: 'BOLETO', observacoes: 'Alteração coletiva' })
    expect(updated.eligible).toHaveLength(2)
    expect(first.forma_pagamento).toBe('BOLETO')
    expect(second.observacoes).toBe('Alteração coletiva')

    second.status = 'paga'; second.valor_pago = 100
    const cancelled = cancelParcelas([first.id, second.id], 'Ajuste solicitado pela seguradora')
    expect(cancelled.eligible).toEqual([first.id])
    expect(cancelled.blocked).toEqual([second.id])
    expect(first.status).toBe('cancelada')
    expect(first.observacoes).toContain('Ajuste solicitado')
    expect(second.status).toBe('paga')
  })

  it('cria e altera comissão e repasse com tipos separados', () => {
    const commission = createComissao({ propostaId: 'mock-proposta-viaforte-original', numero: 93, tipoComissao: 'ADICIONAL', percentual: 5, baseCalculo: 1000, valorPrevisto: 50, previstaEm: '2026-10-10', observacoes: null })
    const transfer = createRepasse({ propostaId: 'mock-proposta-viaforte-original', numero: 93, beneficiarioId: 'mock-produtor-interno', papelBeneficiario: 'PRODUTOR', base: 'COMISSAO', percentual: 35, valorPrevisto: 17.5, previstoEm: '2026-10-10', observacoes: null })
    createdIds.add(commission.id); createdIds.add(transfer.id)

    expect(updateComissoes([commission.id], { tipo_comissao: 'RESTITUICAO', valor_previsto: -50 }).blocked).toHaveLength(0)
    expect(updateRepasses([transfer.id], { valor_previsto: -17.5 }).blocked).toHaveLength(0)
    expect(commission.tipo_comissao).toBe('RESTITUICAO')
    expect(transfer.valor_previsto).toBe(-17.5)
  })

  it('persiste somente campos mapeados do item e versiona cobertura', () => {
    const item = saveItem({ apoliceId: 'mock-apolice-viaforte', propostaId: 'mock-proposta-viaforte-original', riskType: 'VEICULO', numeroItem: 99, descricao: 'Veículo de teste', identificadorExterno: 'TESTE-99', valorRisco: 50000, enderecoRiscoResumo: null, observacoes: null, specialization: { marca: 'Marca teste', modelo: 'Modelo teste', qtd_portas: 4 } })
    createdIds.add(item.id)
    const vehicle = (getTable('item_veiculo') as unknown as Array<Record<string, unknown>>).find((row) => row.apolice_item_id === item.id)
    expect(vehicle?.marca).toBe('Marca teste')
    expect(vehicle).not.toHaveProperty('qtd_portas')

    const first = saveCoverage({ itemId: item.id, propostaId: 'mock-proposta-viaforte-original', coberturaId: null, capitalLmi: 50000, franquiaValor: 1000, franquiaTipo: 'FIXA', premio: 500, premioLiquido: 450, carenciaDias: null, participacaoObrigatoriaPct: null, vigenciaInicio: '2026-01-01', vigenciaFim: '2026-12-31', observacoes: null })
    createdIds.add(first.id)
    const second = saveCoverage({ id: first.id, itemId: item.id, propostaId: 'mock-proposta-viaforte-original', coberturaId: null, capitalLmi: 60000, franquiaValor: 1000, franquiaTipo: 'FIXA', premio: 550, premioLiquido: 500, carenciaDias: null, participacaoObrigatoriaPct: null, vigenciaInicio: '2026-01-01', vigenciaFim: '2026-12-31', observacoes: 'Correção' })
    createdIds.add(second.id)
    expect(first.excluido_por_proposta_id).toBe('mock-proposta-viaforte-original')
    expect(second.capital_lmi).toBe(60000)
  })
})
