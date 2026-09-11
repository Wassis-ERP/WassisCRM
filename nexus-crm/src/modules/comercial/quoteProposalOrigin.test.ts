import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import { createManualQuote, manualQuoteCoverageOptions, type ManualQuoteInput } from './manualQuoteDomain'
import { applyQuoteToManualDraft, createManualDraft, createManualInsuranceDocument } from '../../components/propostas/cadastro-manual/cadastroManualDomain'
import { applyQuoteToImportDraft, createImportDraft, importDocument } from '../../components/propostas/importacao/importacaoDomain'
import { getQuoteProposalOrigin } from './quoteProposalOrigin'

const tables = ['apolices', 'propostas', 'apolice_itens', 'item_veiculo', 'item_imovel', 'item_empresa', 'item_vida', 'item_coberturas', 'parcelas', 'comissoes', 'repasses', 'anexos', 'audit_logs', 'cotacoes', 'calculo_execucoes', 'cotacao_coberturas', 'cotacao_parcelamentos', 'pipeline_stages']
let snapshots: { name: string; rows: ReturnType<typeof getTable> }[] = []
beforeEach(() => { snapshots = tables.map((name) => ({ name, rows: structuredClone(getTable(name)) })) })
afterEach(() => { snapshots.forEach(({ name, rows }) => getTable(name).splice(0, getTable(name).length, ...rows)) })

function input(): ManualQuoteInput {
  const calculationId = 'mock-calculo-joao-auto-basico'
  const insurer = getTable('seguradoras').find((row) => row.nome === 'Porto Seguro')
  const coverage = manualQuoteCoverageOptions(calculationId)[0]
  return {
    calculationId, insurerId: String(insurer?.id), number: 'MANUAL-QA-001',
    premium: 2400, netPremium: 2200, iof: 200, commissionPct: 20, validity: '2099-12-31',
    restrictions: 'Vistoria necessária', message: 'Condição recebida manualmente',
    coverages: [{ ...coverage, incluida: true, limite_aceito: 100000, franquia_valor: 3000 }],
    payments: [{ codigo_opcao: 'PIX', forma_pagamento: 'PIX', quantidade_parcelas: 1, valor_entrada: null, valor_parcela: 2400, valor_total: 2400, juros_pct: 0, adicional_fracionamento: 0, primeiro_vencimento: '2099-01-01', principal: true, ordem: 1 }],
  }
}

describe('cotação manual e ponte comercial → proposta', () => {
  it('registra execução MANUAL e resultado normalizado sem alterar o pedido', () => {
    const calculations = structuredClone(getTable('calculos'))
    const quote = createManualQuote(input())
    expect(getTable('calculo_execucoes').find((row) => row.id === quote.execucao_id)).toMatchObject({ motor: 'MANUAL', status: 'CONCLUIDA' })
    expect(getTable('cotacao_coberturas').filter((row) => row.cotacao_id === quote.id)).toHaveLength(1)
    expect(getTable('cotacao_parcelamentos').filter((row) => row.cotacao_id === quote.id)).toHaveLength(1)
    expect(getTable('calculos')).toEqual(calculations)
    expect(() => createManualQuote(input())).toThrow('já foi registrada')
  })
  it('rejeita valores inválidos antes de persistir execução ou resultado', () => {
    const before = getTable('calculo_execucoes').length
    expect(() => createManualQuote({ ...input(), netPremium: 5000 })).toThrow('prêmio')
    expect(getTable('calculo_execucoes')).toHaveLength(before)
  })
  it('cria proposta manual com vínculo único e preserva cotação e itens', () => {
    const data = input()
    data.coverages[0] = { ...data.coverages[0], franquia_valor: 0, carencia_dias: 30, participacao_obrigatoria_pct: 10 }
    const quote = createManualQuote(data)
    const draft = applyQuoteToManualDraft(createManualDraft(), quote.id)
    const result = createManualInsuranceDocument(draft)
    expect(getTable('propostas').find((row) => row.id === result.proposalId)).toMatchObject({ cotacao_id: quote.id, tipo: 'NOVA' })
    expect(getTable('apolices').find((row) => row.id === result.policyId)).toMatchObject({ status: 'EM_EMISSAO' })
    expect(getTable('apolice_itens').filter((row) => row.apolice_id === result.policyId)).toHaveLength(1)
    expect(getTable('item_coberturas').find((row) => row.incluido_por_proposta_id === result.proposalId)).toMatchObject({ franquia_valor: 0, carencia_dias: 30, participacao_obrigatoria_pct: 10 })
    expect(quote.status).toBe('APROVADA')
    const before = getTable('propostas').length
    expect(() => createManualInsuranceDocument(draft)).toThrow('já está vinculada')
    expect(getTable('propostas')).toHaveLength(before)
  })
  it('bloqueia segunda proposta ativa na oportunidade e permite nova tentativa após recusa', () => {
    const first = createManualQuote(input())
    const result = createManualInsuranceDocument(applyQuoteToManualDraft(createManualDraft(), first.id))
    const second = createManualQuote({ ...input(), number: 'MANUAL-QA-002' })
    const secondDraft = applyQuoteToManualDraft(createManualDraft(), second.id)
    expect(() => createManualInsuranceDocument(secondDraft)).toThrow('outra cotação')
    const policy = getTable('apolices').find((row) => row.id === result.policyId)!
    policy.status = 'RECUSADA'
    expect(createManualInsuranceDocument(secondDraft).proposalId).toBeTruthy()
  })
  it('importa proposta com a mesma ponte e bloqueia segundo arquivo para a mesma cotação', () => {
    const quote = createManualQuote(input())
    const draft = applyQuoteToImportDraft(createImportDraft({ name: 'proposta_comercial.pdf', size: 1000, type: 'application/pdf' }), quote.id)
    const result = importDocument(draft)
    expect(result.status).toBe('IMPORTADO')
    expect(getTable('propostas').find((row) => row.id === result.proposalId)?.cotacao_id).toBe(quote.id)
    expect(getTable('anexos').find((row) => row.entidade_id === result.proposalId)?.origem).toBe('IMPORTACAO_ASSISTIDA')
    expect(getTable('apolice_itens').filter((row) => row.apolice_id === result.policyId)).toHaveLength(1)
    expect(getQuoteProposalOrigin(quote.id).quote.status).toBe('APROVADA')
    expect(importDocument({ ...draft, fileName: 'outra_proposta.pdf' }).status).toBe('ERRO')
  })
  it('não deixa registros parciais quando falta etapa ou há divergência de vínculo', () => {
    const quote = createManualQuote(input())
    const draft = applyQuoteToImportDraft(createImportDraft({ name: 'proposta_invalida.pdf', size: 1100, type: 'application/pdf' }), quote.id)
    const before = getTable('apolices').length
    expect(importDocument({ ...draft, insuredId: 'outro-segurado' }).status).toBe('ERRO')
    getTable('pipeline_stages').splice(0)
    expect(importDocument(draft).status).toBe('ERRO')
    expect(getTable('apolices')).toHaveLength(before)
    expect(getQuoteProposalOrigin(quote.id).quote.status).toBe('APRESENTADA')
  })
})
