import type { CotacaoCoberturaRow, CotacaoParcelamentoRow } from '../../types/database'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function presentationMoney(value: number | null): string {
  return value === null ? 'Não informado' : currency.format(value)
}

export function presentationDate(value: string | null): string {
  if (!value) return 'Não informada'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function presentationPayment(installment: CotacaoParcelamentoRow | null): string {
  if (!installment) return 'Pagamento não informado'
  const form = installment.forma_pagamento.replaceAll('_', ' ').toLocaleLowerCase('pt-BR')
  if (installment.quantidade_parcelas === 1) return `${form} à vista · ${presentationMoney(installment.valor_total ?? installment.valor_parcela)}`
  const parts = [`${installment.quantidade_parcelas}x de ${presentationMoney(installment.valor_parcela)}`, form]
  if (installment.valor_entrada !== null && installment.valor_entrada > 0) parts.push(`Entrada ${presentationMoney(installment.valor_entrada)}`)
  if (installment.valor_total !== null) parts.push(`Total ${presentationMoney(installment.valor_total)}`)
  if (installment.juros_pct !== null) parts.push(installment.juros_pct === 0 ? 'Sem juros' : `Juros ${percent.format(installment.juros_pct)}%`)
  return parts.join(' · ')
}

export function presentationCoverage(coverage: CotacaoCoberturaRow, showFipe = true): string {
  if (coverage.incluida === false) return 'Não incluída'
  const values = [
    showFipe && coverage.percentual_fipe_aceito !== null ? `${percent.format(coverage.percentual_fipe_aceito)}% FIPE` : null,
    coverage.limite_aceito !== null ? `Limite ${currency.format(coverage.limite_aceito)}` : null,
    coverage.franquia_tipo ? `Franquia ${coverage.franquia_tipo.toLocaleLowerCase('pt-BR').replaceAll('_', ' ')}` : null,
    coverage.franquia_valor !== null ? `Franquia ${currency.format(coverage.franquia_valor)}` : null,
    coverage.carencia_dias !== null && coverage.carencia_dias > 0 ? `Carência ${coverage.carencia_dias} dias` : null,
    coverage.participacao_obrigatoria_pct !== null ? `Participação obrigatória ${percent.format(coverage.participacao_obrigatoria_pct)}%` : null,
    coverage.clausula_texto,
    coverage.observacao_seguradora,
  ].filter((value): value is string => Boolean(value))
  return values.length > 0 ? values.join(' · ') : coverage.incluida === true ? 'Incluída' : 'Condição não informada'
}
