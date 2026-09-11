import { getTable, nowIso } from '../../lib/inMemoryDb'
import type { CalculoExecucaoRow, CalculoRow, CotacaoRow, CotacaoParcelamentoRow, Database } from '../../types/database'

type Insured = Database['public']['Tables']['segurados']['Row']
type Opportunity = Database['public']['Tables']['oportunidades']['Row']
type Proposal = Database['public']['Tables']['propostas']['Row']
const rows = <T>(name: string) => getTable(name) as unknown as T[]

export function getQuoteProposalOrigin(quoteId: string) {
  const quote = rows<CotacaoRow>('cotacoes').find((row) => row.id === quoteId)
  const execution = rows<CalculoExecucaoRow>('calculo_execucoes').find((row) => row.id === quote?.execucao_id)
  const calculation = rows<CalculoRow>('calculos').find((row) => row.id === execution?.calculo_id)
  const opportunity = rows<Opportunity>('oportunidades').find((row) => row.id === calculation?.oportunidade_id)
  if (!quote || !execution || !calculation || !opportunity) throw new Error('Cotação de origem não encontrada. Volte ao comparativo.')
  const insured = rows<Insured>('segurados').find((row) => row.id === (calculation.segurado_id ?? opportunity.segurado_id))
  const proposal = rows<Proposal>('propostas').find((row) => row.cotacao_id === quote.id)
  const selectedPayment = getTable('apresentacao_cotacoes').find((row) => row.cotacao_id === quote.id)?.parcelamento_id
  const payments = rows<CotacaoParcelamentoRow>('cotacao_parcelamentos').filter((row) => row.cotacao_id === quote.id)
  const payment = payments.find((row) => row.id === selectedPayment) ?? payments.find((row) => row.principal) ?? payments[0]
  return { quote, execution, calculation, opportunity, insured, proposal, payment }
}

export type QuoteOriginContext = {
  quoteId?: string; insuredId: string; insurerId: string; branchId: string; branchOfficeId: string
}

export function validateQuoteProposalOrigin(context: QuoteOriginContext): string[] {
  if (!context.quoteId) return []
  try {
    const origin = getQuoteProposalOrigin(context.quoteId)
    if (origin.proposal) return ['Esta cotação já está vinculada a uma proposta. Abra o documento existente.']
    const calculationIds = new Set(rows<CalculoRow>('calculos').filter((row) => row.oportunidade_id === origin.opportunity.id).map((row) => row.id))
    const executionIds = new Set(rows<CalculoExecucaoRow>('calculo_execucoes').filter((row) => calculationIds.has(row.calculo_id)).map((row) => row.id))
    const quoteIds = new Set(rows<CotacaoRow>('cotacoes').filter((row) => executionIds.has(row.execucao_id)).map((row) => row.id))
    if (rows<Proposal>('propostas').some((row) => row.cotacao_id && quoteIds.has(row.cotacao_id) && getTable('apolices').some((policy) => policy.id === row.apolice_id && policy.status !== 'RECUSADA'))) return ['A oportunidade já possui uma proposta ou contrato vinculado a outra cotação. Consulte o documento existente.']
    if (origin.execution.status !== 'CONCLUIDA' || !['APRESENTADA', 'APROVADA'].includes(origin.quote.status ?? '')) return ['Somente cotação apresentada ou aprovada pode originar proposta.']
    if (origin.quote.validade && origin.quote.validade < nowIso().slice(0, 10)) return ['A cotação venceu. Registre ou calcule um novo resultado antes de criar a proposta.']
    if (!origin.insured) return ['Qualifique o cotado antes de criar a proposta.']
    if (!origin.calculation.tipo_seguro) return ['Revise o tipo de seguro do cálculo antes de criar a proposta.']
    if (origin.calculation.tipo_seguro === 'RENOVACAO_PROPRIA' && !getTable('apolices').some((row) => row.id === origin.opportunity.apolice_origem_id)) return ['A renovação própria precisa de uma apólice anterior válida.']
    if (origin.insured.id !== context.insuredId || origin.execution.seguradora_id !== context.insurerId || origin.calculation.ramo_id !== context.branchId) return ['Segurado, seguradora e ramo devem corresponder à cotação de origem.']
    if (origin.insured.filial_id !== context.branchOfficeId || origin.opportunity.filial_id !== context.branchOfficeId || origin.insured.tenant_id !== origin.opportunity.tenant_id) return ['A cotação e o segurado devem pertencer à mesma corretora e grupo.']
    return []
  } catch (error) { return [error instanceof Error ? error.message : 'Cotação de origem inválida.'] }
}

export function quoteProposalDefaults(quoteId: string) {
  const origin = getQuoteProposalOrigin(quoteId)
  const number = (value: number | null | undefined) => value == null ? '' : String(value)
  return {
    quoteId,
    insuredId: origin.insured?.id ?? '', branchOfficeId: origin.insured?.filial_id ?? '',
    insurerId: origin.execution.seguradora_id, branchId: origin.calculation.ramo_id,
    producerId: origin.insured?.produtor_id ?? '',
    coverageStart: origin.calculation.vigencia_inicio ?? '', coverageEnd: origin.calculation.vigencia_fim ?? '',
    totalPremium: number(origin.quote.premio_total), netPremium: number(origin.quote.premio_liquido),
    commissionPct: number(origin.execution.comissao_pct_aplicada),
    paymentMethod: origin.payment?.forma_pagamento ?? '',
    installmentCount: number(origin.payment?.quantidade_parcelas),
    firstDueDate: origin.payment?.primeiro_vencimento ?? '',
  }
}

// Called only as the final step of the document transaction; the quotation stays immutable except for its lifecycle.
export function approveQuoteProposalOrigin(quoteId: string | undefined, proposalId: string) {
  if (!quoteId) return
  const { quote } = getQuoteProposalOrigin(quoteId)
  const proposal = rows<Proposal>('propostas').find((row) => row.id === proposalId)
  if (!proposal || proposal.cotacao_id !== quoteId) throw new Error('Proposta sem vínculo com a cotação de origem.')
  quote.status = 'APROVADA'
  quote.aprovada_em = nowIso()
}

export function quoteProposalContract(quoteId: string | undefined) {
  if (!quoteId) return { type: 'NOVA' as const, renewedFromId: null }
  const { calculation, opportunity } = getQuoteProposalOrigin(quoteId)
  return {
    type: calculation.tipo_seguro === 'NOVO' ? 'NOVA' as const : 'RENOVACAO' as const,
    renewedFromId: calculation.tipo_seguro === 'RENOVACAO_PROPRIA' ? opportunity.apolice_origem_id : null,
  }
}
