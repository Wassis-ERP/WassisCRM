import { getTable, newId, nowIso } from '../../lib/inMemoryDb'
import type { CalculoRow, CalculoExecucaoRow, CotacaoRow, CotacaoCoberturaRow, CotacaoParcelamentoRow, Database } from '../../types/database'

export type ManualQuoteCoverage = Omit<CotacaoCoberturaRow, 'id' | 'cotacao_id'>
export type ManualQuotePayment = Omit<CotacaoParcelamentoRow, 'id' | 'cotacao_id'>
export type ManualQuoteInput = {
  calculationId: string; insurerId: string; number: string
  premium: number; netPremium: number; iof: number | null; commissionPct: number
  validity: string; restrictions: string; message: string
  coverages: ManualQuoteCoverage[]; payments: ManualQuotePayment[]
}
const rows = <T>(table: string) => getTable(table) as unknown as T[]

export function createManualQuote(input: ManualQuoteInput): CotacaoRow {
  const calculation = rows<CalculoRow>('calculos').find((row) => row.id === input.calculationId)
  if (!calculation) throw new Error('Cálculo não encontrado.')
  const opportunity = getTable('oportunidades').find((row) => row.id === calculation.oportunidade_id)
  const insurer = getTable('seguradoras').find((row) => row.id === input.insurerId && row.ativo !== false)
  if (!opportunity || !insurer || insurer.tenant_id !== opportunity.tenant_id) throw new Error('Selecione uma seguradora ativa do mesmo grupo.')
  if (!input.number.trim()) throw new Error('Informe o número da cotação da seguradora.')
  const money = (value: number | null) => value === null || (Number.isFinite(value) && value >= 0)
  if (![input.premium, input.netPremium, input.iof, input.commissionPct].every(money) || input.commissionPct > 100 || input.netPremium > input.premium) throw new Error('Revise prêmio total, prêmio líquido e comissão (0% a 100%).')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.validity) || Number.isNaN(Date.parse(input.validity)) || input.validity < nowIso().slice(0, 10)) throw new Error('Informe uma validade igual ou posterior à data atual.')
  if (!input.coverages.some((row) => row.incluida === true)) throw new Error('Informe ao menos uma cobertura incluída no retorno da seguradora.')
  if (new Set(input.coverages.map((row) => row.chave_resultado.trim())).size !== input.coverages.length) throw new Error('Não repita a mesma cobertura.')
  for (const coverage of input.coverages) {
    if (!coverage.chave_resultado.trim()) throw new Error('Identifique todas as coberturas.')
    if (coverage.cobertura_id && !getTable('coberturas_catalogo').some((row) => row.id === coverage.cobertura_id && row.ramo_id === calculation.ramo_id)) throw new Error('A cobertura precisa pertencer ao ramo do cálculo.')
    if (![coverage.limite_aceito, coverage.percentual_fipe_aceito, coverage.franquia_valor, coverage.premio, coverage.carencia_dias, coverage.participacao_obrigatoria_pct].every(money)) throw new Error('Os valores das coberturas devem ser positivos ou zero.')
    if (coverage.carencia_dias !== null && !Number.isInteger(coverage.carencia_dias)) throw new Error('A carência deve ser informada em dias inteiros.')
    if (coverage.participacao_obrigatoria_pct !== null && coverage.participacao_obrigatoria_pct > 100) throw new Error('A participação obrigatória deve ficar entre 0% e 100%.')
  }
  if (!input.payments.length || new Set(input.payments.map((row) => row.codigo_opcao.trim())).size !== input.payments.length) throw new Error('Informe opções de pagamento sem códigos repetidos.')
  if (input.payments.filter((row) => row.principal).length > 1) throw new Error('Selecione somente um pagamento principal.')
  for (const payment of input.payments) {
    if (!payment.codigo_opcao.trim() || !payment.forma_pagamento || !Number.isInteger(payment.quantidade_parcelas) || payment.quantidade_parcelas < 1 || ![payment.valor_entrada, payment.valor_parcela, payment.valor_total, payment.juros_pct, payment.adicional_fracionamento].every(money)) throw new Error('Revise as opções de pagamento e a quantidade de parcelas.')
  }
  const executions = rows<CalculoExecucaoRow>('calculo_execucoes')
  const previous = executions.filter((row) => row.calculo_id === calculation.id && row.seguradora_id === input.insurerId)
  const quotes = rows<CotacaoRow>('cotacoes')
  if (quotes.some((row) => previous.some((execution) => execution.id === row.execucao_id) && row.numero_cotacao_seguradora === input.number.trim())) throw new Error('Esta cotação já foi registrada para esta seguradora e versão.')
  const now = nowIso()
  const execution: CalculoExecucaoRow = {
    id: newId(), calculo_id: calculation.id, seguradora_id: input.insurerId,
    reexecucao_de_id: null, tentativa: Math.max(0, ...previous.map((row) => row.tentativa)) + 1,
    motor: 'MANUAL', comissao_pct_aplicada: input.commissionPct,
    comissao_origem: input.commissionPct === calculation.comissao_sugerida_pct ? 'PADRAO_CALCULO' : 'SOBRESCRITA',
    status: 'CONCLUIDA', pendencia_codigo: null, pendencia_mensagem: null,
    erro_codigo: null, erro_mensagem_segura: null, referencia_externa: null,
    iniciada_em: now, concluida_em: now, criada_em: now,
  }
  const quote: CotacaoRow = {
    id: newId(), execucao_id: execution.id, numero_cotacao_seguradora: input.number.trim(),
    premio_total: input.premium, premio_liquido: input.netPremium, iof: input.iof,
    adicional_fracionamento: null, comissao_valor: Math.round(input.netPremium * input.commissionPct) / 100,
    validade: input.validity, status: 'APRESENTADA', link_proposta: null,
    mensagem_seguradora: input.message.trim() || null, restricoes: input.restrictions.trim() || null,
    recebida_em: now, aprovada_em: null, descartada_motivo: null, observacao_interna: null,
  }
  const coverages = input.coverages.map((row): CotacaoCoberturaRow => ({ ...row, id: newId(), cotacao_id: quote.id }))
  const payments = input.payments.map((row, index): CotacaoParcelamentoRow => ({ ...row, principal: input.payments.some((option) => option.principal) ? row.principal : index === 0, id: newId(), cotacao_id: quote.id }))
  executions.push(execution)
  quotes.push(quote)
  rows<CotacaoCoberturaRow>('cotacao_coberturas').push(...coverages)
  rows<CotacaoParcelamentoRow>('cotacao_parcelamentos').push(...payments)
  return quote
}

export function manualQuoteCoverageOptions(calculationId: string): ManualQuoteCoverage[] {
  const calculation = rows<CalculoRow>('calculos').find((row) => row.id === calculationId)
  const catalog = rows<Database['public']['Tables']['coberturas_catalogo']['Row']>('coberturas_catalogo')
  return catalog.filter((row) => row.ramo_id === calculation?.ramo_id && row.ativo !== false).map((row, index) => ({
    cobertura_id: row.id, chave_resultado: row.id, codigo_externo: null, nome_informado: row.nome,
    incluida: false, limite_aceito: null, percentual_fipe_aceito: null, franquia_tipo: null,
    franquia_valor: null, premio: null, carencia_dias: null, participacao_obrigatoria_pct: null,
    clausula_texto: null, observacao_seguradora: null, ordem: index + 1,
  }))
}
