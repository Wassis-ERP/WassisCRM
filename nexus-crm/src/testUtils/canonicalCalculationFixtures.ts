import { createEmptySpecialization } from '../modules/comercial/calculationForm'
import type { CalculationAggregate } from '../modules/comercial/calculationDomain'
import type { BackendPresentationAggregate, BackendQuoteAggregate } from '../lib/calculationHttpContracts'
import type { CalculoExecucaoRow, CalculoRow } from '../types/database'

export const canonicalIds = {
  opportunity: '11111111-1111-1111-1111-111111111111', insurer: '33333333-3333-3333-3333-333333333333',
  line: '44444444-4444-4444-4444-444444444444', calculation: '55555555-5555-5555-5555-555555555555',
  execution: '66666666-6666-6666-6666-666666666666', quote: '77777777-7777-7777-7777-777777777777',
  presentation: '88888888-8888-8888-8888-888888888888', other: '99999999-9999-9999-9999-999999999999',
  secondCalculation: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', secondExecution: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  secondQuote: 'cccccccc-cccc-cccc-cccc-cccccccccccc', coverage: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
}
const time = '2026-10-12T12:00:00Z'
export function canonicalCalculationFixture(patch: Partial<CalculoRow> = {}): CalculationAggregate {
  const calculation: CalculoRow = {
    id: canonicalIds.calculation, oportunidade_id: canonicalIds.opportunity, ramo_id: canonicalIds.line, segurado_id: null,
    seguradora_anterior_id: null, origem: 'MANUAL', comissao_sugerida_pct: null, rotulo_versao: 'Auto · versão fixture',
    tipo_seguro: 'NOVO', bonus: null, qtd_sinistros: null, qtd_sinistros_perda_parcial: null, transferiu_titularidade: null,
    vigencia_inicio: '2026-10-12', vigencia_fim: '2027-10-12', vigencia_fim_anterior: null, numero_apolice_anterior: null,
    codigo_identificacao_anterior: null, status_apolice_anterior: null, nota_interna: null, criado_em: time, ...patch,
  }
  const risk = createEmptySpecialization('AUTO')
  if (risk.forma !== 'AUTO') throw new Error('Fixture Auto inválida.')
  return { calculation, specialization: { forma: 'AUTO', data: { ...risk.data, calculo_id: calculation.id } }, coverages: [] }
}
export function canonicalExecutionFixture(patch: Partial<CalculoExecucaoRow> = {}): CalculoExecucaoRow {
  return {
    id: canonicalIds.execution, calculo_id: canonicalIds.calculation, seguradora_id: canonicalIds.insurer,
    reexecucao_de_id: null, tentativa: 1, motor: 'MANUAL', comissao_pct_aplicada: null, comissao_origem: 'PADRAO_CALCULO',
    status: 'CONCLUIDA', pendencia_codigo: null, pendencia_mensagem: null, erro_codigo: null, erro_mensagem_segura: null,
    referencia_externa: null, iniciada_em: time, concluida_em: time, criada_em: time, ...patch,
  }
}
export function canonicalQuoteFixture(execution = canonicalExecutionFixture(), quoteId = canonicalIds.quote): BackendQuoteAggregate {
  return {
    execution, quote: {
      id: quoteId, execucao_id: execution.id, numero_cotacao_seguradora: null, premio_total: 0, premio_liquido: null,
      iof: null, adicional_fracionamento: null, comissao_valor: null, validade: null, status: 'APRESENTADA',
      link_proposta: null, mensagem_seguradora: null, restricoes: null, recebida_em: time, aprovada_em: null,
      descartada_motivo: null, observacao_interna: null,
    },
    coverages: [{ id: execution.id === canonicalIds.execution ? canonicalIds.coverage : canonicalIds.other, cotacao_id: quoteId, cobertura_id: canonicalIds.coverage,
      chave_resultado: 'casco', codigo_externo: null, nome_informado: 'Casco informado', incluida: true,
      limite_aceito: null, percentual_fipe_aceito: 0, franquia_tipo: null, franquia_valor: 0, premio: null,
      carencia_dias: null, participacao_obrigatoria_pct: null, clausula_texto: null, observacao_seguradora: null, ordem: 10 }],
    installments: [],
  }
}
export function canonicalPresentationFixture(revision = 1): BackendPresentationAggregate {
  return {
    presentation: { id: canonicalIds.presentation, oportunidade_id: canonicalIds.opportunity, criado_por_id: null,
      cotacao_escolhida_id: canonicalIds.quote, titulo: null, layout: 'VERTICAL', criterio_ordenacao: 'MANUAL',
      exibir_percentual_fipe: true, exibir_vantagens: true, exibir_legenda: true, exibir_observacoes: true,
      exibir_comissao: false, observacoes_comerciais: null, status: 'GERADA', criado_em: time,
      atualizado_em: time, gerada_em: time, escolhida_em: time },
    items: [{ id: canonicalIds.other, apresentacao_id: canonicalIds.presentation, cotacao_id: canonicalIds.quote,
      parcelamento_id: null, ordem: 10, recomendada: false, titulo_comercial: null, vantagens_texto: null, observacao_comercial: null }],
    results: [{ result: canonicalQuoteFixture(), calculation: canonicalCalculationFixture().calculation, insurerName: 'Seguradora fixture' }], revision,
  }
}
