import { describe, expect, it } from 'vitest'
import { presentationCoverage, presentationDate, presentationMoney, presentationPayment } from './commercialPresentationFormat'
import type { CotacaoCoberturaRow, CotacaoParcelamentoRow } from '../../types/database'

const coverage: CotacaoCoberturaRow = {
  id: 'coverage', cotacao_id: 'quote', cobertura_id: null, chave_resultado: 'casco',
  codigo_externo: null, nome_informado: 'Casco', incluida: true,
  limite_aceito: null, percentual_fipe_aceito: 110, franquia_tipo: null,
  franquia_valor: 0, premio: null, carencia_dias: 30,
  participacao_obrigatoria_pct: 10, clausula_texto: 'Condição específica',
  observacao_seguradora: null, ordem: 1,
}

describe('conteúdo da apresentação impressa', () => {
  it('oculta FIPE também nas coberturas e preserva carência, participação e cláusulas', () => {
    const text = presentationCoverage(coverage, false)
    expect(text).not.toContain('FIPE')
    expect(text).toContain('Carência 30 dias')
    expect(text).toContain('Participação obrigatória 10%')
    expect(text).toContain('Condição específica')
    expect(presentationCoverage({ ...coverage, incluida: false })).toBe('Não incluída')
  })
  it('distingue valor desconhecido de zero e não desloca datas por fuso', () => {
    expect(presentationMoney(null)).toBe('Não informado')
    expect(presentationMoney(0)).toContain('0,00')
    expect(presentationDate('2026-09-10')).toBe('10/09/2026')
  })
  it('mostra entrada, total e juros sem recalcular o retorno da seguradora', () => {
    const installment: CotacaoParcelamentoRow = {
      id: 'payment', cotacao_id: 'quote', codigo_opcao: '6X', forma_pagamento: 'BOLETO',
      quantidade_parcelas: 6, valor_entrada: 100, valor_parcela: 200, valor_total: 1300,
      juros_pct: 2, adicional_fracionamento: null, primeiro_vencimento: null, principal: true, ordem: 1,
    }
    const text = presentationPayment(installment)
    expect(text).toContain('6x de')
    expect(text).toContain('Entrada')
    expect(text).toContain('1.300,00')
    expect(text).toContain('Juros 2%')
  })
})
