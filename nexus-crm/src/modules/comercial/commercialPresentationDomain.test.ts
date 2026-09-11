import { describe, expect, it } from 'vitest'
import type {
  CalculoExecucaoRow,
  CalculoRow,
  CotacaoCoberturaRow,
  CotacaoParcelamentoRow,
  CotacaoRow,
} from '../../types/database'
import {
  alignCommercialPresentationCoverages,
  getCommercialPresentationWorkspace,
  saveCommercialPresentationAtomic,
  toggleCommercialPresentationQuoteAtomic,
  type CommercialPresentationDependencies,
  type CommercialPresentationStore,
} from './commercialPresentationDomain'

function calculation(id: string, opportunityId: string, label: string): CalculoRow {
  return {
    id,
    oportunidade_id: opportunityId,
    ramo_id: 'ramo-auto',
    segurado_id: 'segurado-1',
    seguradora_anterior_id: null,
    origem: 'MANUAL',
    comissao_sugerida_pct: 20,
    rotulo_versao: label,
    tipo_seguro: 'NOVO',
    bonus: null,
    qtd_sinistros: null,
    qtd_sinistros_perda_parcial: null,
    transferiu_titularidade: null,
    vigencia_inicio: '2026-07-22',
    vigencia_fim: '2027-07-22',
    vigencia_fim_anterior: null,
    numero_apolice_anterior: null,
    codigo_identificacao_anterior: null,
    status_apolice_anterior: null,
    nota_interna: null,
    criado_em: '2026-07-22T12:00:00.000Z',
  }
}

function execution(id: string, calculationId: string, insurerId: string): CalculoExecucaoRow {
  return {
    id,
    calculo_id: calculationId,
    seguradora_id: insurerId,
    reexecucao_de_id: null,
    tentativa: 1,
    motor: 'PROPRIO',
    comissao_pct_aplicada: 20,
    comissao_origem: 'PADRAO_CALCULO',
    status: 'CONCLUIDA',
    pendencia_codigo: null,
    pendencia_mensagem: null,
    erro_codigo: null,
    erro_mensagem_segura: null,
    referencia_externa: `SIM-${id}`,
    iniciada_em: '2026-07-22T12:00:00.000Z',
    concluida_em: '2026-07-22T12:00:01.000Z',
    criada_em: '2026-07-22T12:00:00.000Z',
  }
}

function quote(id: string, executionId: string, premium: number): CotacaoRow {
  return {
    id,
    execucao_id: executionId,
    numero_cotacao_seguradora: `COT-${id}`,
    premio_total: premium,
    premio_liquido: premium * 0.93,
    iof: premium * 0.07,
    adicional_fracionamento: 0,
    comissao_valor: premium * 0.186,
    validade: '2026-08-06',
    status: 'APRESENTADA',
    link_proposta: null,
    mensagem_seguradora: null,
    restricoes: null,
    recebida_em: '2026-07-22T12:00:01.000Z',
    aprovada_em: null,
    descartada_motivo: null,
    observacao_interna: null,
  }
}

function coverage(
  id: string,
  quoteId: string,
  coverageId: string,
  name: string,
  franchise: number | null,
  limit: number | null,
  fipe: number | null,
  order: number,
): CotacaoCoberturaRow {
  return {
    id,
    cotacao_id: quoteId,
    cobertura_id: coverageId,
    chave_resultado: coverageId,
    codigo_externo: null,
    nome_informado: name,
    incluida: true,
    limite_aceito: limit,
    percentual_fipe_aceito: fipe,
    franquia_tipo: franchise === null ? null : 'NORMAL',
    franquia_valor: franchise,
    premio: null,
    carencia_dias: 0,
    participacao_obrigatoria_pct: null,
    clausula_texto: null,
    observacao_seguradora: null,
    ordem: order,
  }
}

function installment(id: string, quoteId: string, installments: number, total: number): CotacaoParcelamentoRow {
  return {
    id,
    cotacao_id: quoteId,
    codigo_opcao: `${installments}X`,
    forma_pagamento: installments === 1 ? 'PIX' : 'CARTAO_CREDITO',
    quantidade_parcelas: installments,
    valor_entrada: installments === 1 ? total : null,
    valor_parcela: total / installments,
    valor_total: total,
    juros_pct: 0,
    adicional_fracionamento: 0,
    primeiro_vencimento: '2026-07-29',
    principal: installments === 1,
    ordem: installments,
  }
}

function store(): CommercialPresentationStore {
  return {
    opportunities: [
      { id: 'opp-1', tenant_id: 'tenant-1' },
      { id: 'opp-2', tenant_id: 'tenant-1' },
    ] as CommercialPresentationStore['opportunities'],
    calculations: [
      calculation('calc-a', 'opp-1', 'João · 100% FIPE'),
      calculation('calc-b', 'opp-1', 'João · 110% FIPE'),
      calculation('calc-other', 'opp-2', 'Outra oportunidade'),
    ],
    executions: [
      execution('exec-1', 'calc-a', 'insurer-1'),
      execution('exec-2', 'calc-b', 'insurer-2'),
      execution('exec-3', 'calc-a', 'insurer-3'),
      execution('exec-4', 'calc-b', 'insurer-4'),
      execution('exec-5', 'calc-a', 'insurer-1'),
      execution('exec-6', 'calc-b', 'insurer-2'),
      execution('exec-other', 'calc-other', 'insurer-1'),
    ],
    insurers: [
      { id: 'insurer-1', nome: 'Porto Seguro', nome_curto: 'Porto' },
      { id: 'insurer-2', nome: 'Tokio Marine', nome_curto: 'Tokio' },
      { id: 'insurer-3', nome: 'SulAmérica', nome_curto: 'SulAmérica' },
      { id: 'insurer-4', nome: 'Allianz', nome_curto: 'Allianz' },
    ] as CommercialPresentationStore['insurers'],
    coverageCatalog: [
      { id: 'casco', nome: 'Casco' },
      { id: 'vidros', nome: 'Vidros' },
    ] as CommercialPresentationStore['coverageCatalog'],
    quotes: [
      quote('q1', 'exec-1', 1_100),
      quote('q2', 'exec-2', 900),
      quote('q3', 'exec-3', 1_250),
      quote('q4', 'exec-4', 980),
      quote('q5', 'exec-5', 1050),
      quote('q6', 'exec-6', 1200),
      quote('q-other', 'exec-other', 800),
    ],
    quoteCoverages: [
      coverage('q1-casco', 'q1', 'casco', 'Casco', 2_000, null, 100, 10),
      coverage('q1-vidros', 'q1', 'vidros', 'Vidros', null, 15_000, null, 20),
      coverage('q2-casco', 'q2', 'casco', 'Casco', 1_800, null, 110, 10),
      coverage('q3-casco', 'q3', 'casco', 'Casco', 2_500, null, 100, 10),
      coverage('q3-vidros', 'q3', 'vidros', 'Vidros', null, 10_000, null, 20),
      coverage('q4-casco', 'q4', 'casco', 'Casco', 1_950, null, 110, 10),
      coverage('other-casco', 'q-other', 'casco', 'Casco', 1_700, null, 100, 10),
    ],
    quoteInstallments: [
      installment('q1-pix', 'q1', 1, 1_100),
      installment('q1-card', 'q1', 6, 1_100),
      installment('q2-pix', 'q2', 1, 900),
      installment('q3-pix', 'q3', 1, 1_250),
      installment('q4-pix', 'q4', 1, 980),
      installment('other-pix', 'q-other', 1, 800),
    ],
    presentations: [],
    presentationQuotes: [],
    proposals: [{ id: 'proposal-1', cotacao_id: null } as CommercialPresentationStore['proposals'][number]],
  }
}

function dependencies(): CommercialPresentationDependencies {
  let sequence = 0
  let clock = Date.parse('2026-07-22T15:00:00.000Z')
  return {
    newId: () => `generated-${++sequence}`,
    now: () => {
      clock += 1_000
      return new Date(clock).toISOString()
    },
  }
}

describe('comparativo e apresentação comercial', () => {
  it('seleciona cinco resultados entre versões e bloqueia a sexta sem mutação', () => {
    const data = store()
    const deps = dependencies()
    toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q1', 'user-1', deps)
    toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q2', 'user-1', deps)
    const workspace = toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q3', 'user-1', deps)

    expect(workspace.items.map((row) => row.candidate.profileLabel)).toEqual([
      'Versão 1 · João · 100% FIPE',
      'Versão 2 · João · 110% FIPE',
      'Versão 1 · João · 100% FIPE',
    ])
    toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q4', 'user-1', deps)
    toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q5', 'user-1', deps)
    const before = structuredClone(data)
    expect(() => toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q6', 'user-1', deps)).toThrow('no máximo 5')
    expect(data).toEqual(before)
    expect(() => toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q-other', 'user-1', deps)).toThrow('oportunidade')
    expect(data.presentationQuotes).toHaveLength(5)
    toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q2', 'user-1', deps)
    const replaced = toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q6', 'user-1', deps)
    expect(replaced.items.map(({ item }) => item.cotacao_id)).toEqual(['q1', 'q3', 'q4', 'q5', 'q6'])
  })

  it('alinha coberturas equivalentes e explicita ausência, limite e franquia divergentes', () => {
    const data = store()
    const deps = dependencies()
    toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q1', 'user-1', deps)
    const workspace = toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q2', 'user-1', deps)
    const comparison = alignCommercialPresentationCoverages(workspace.items.map((row) => row.candidate))

    expect(comparison.find((row) => row.name === 'Casco')).toMatchObject({ differs: true })
    expect(comparison.find((row) => row.name === 'Casco')?.cells.map((cell) => cell.coverage?.franquia_valor)).toEqual([2_000, 1_800])
    expect(comparison.find((row) => row.name === 'Vidros')?.cells.map((cell) => cell.coverage?.limite_aceito ?? null)).toEqual([15_000, null])
    expect(comparison.find((row) => row.name === 'Vidros')?.differs).toBe(true)
  })

  it('salva e reabre snapshot normalizado sem alterar cotações nem criar proposta', () => {
    const data = store()
    const deps = dependencies()
    toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q1', 'user-1', deps)
    const selection = toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q2', 'user-1', deps)
    const quotesBefore = JSON.stringify(data.quotes)
    const proposalsBefore = JSON.stringify(data.proposals)

    const saved = saveCommercialPresentationAtomic(data, {
      presentationId: selection.presentation?.id,
      opportunityId: 'opp-1',
      createdById: 'user-1',
      selectedQuoteId: 'q2',
      title: 'Proteção para o Honda City',
      layout: 'HORIZONTAL',
      ordering: 'PREMIO',
      showFipe: true,
      showAdvantages: true,
      showLegend: true,
      showNotes: true,
      showCommission: false,
      commercialNotes: 'Condições válidas até a data indicada.',
      status: 'GERADA',
      items: [
        { quoteId: 'q1', installmentId: 'q1-card', recommended: true, advantagesText: 'Assistência completa.' },
        { quoteId: 'q2', installmentId: 'q2-pix', commercialTitle: 'Melhor custo total.' },
      ],
    }, deps)
    const reopened = getCommercialPresentationWorkspace(data, 'opp-1', saved.presentation?.id)

    expect(reopened.presentation).toMatchObject({
      titulo: 'Proteção para o Honda City',
      layout: 'HORIZONTAL',
      criterio_ordenacao: 'PREMIO',
      cotacao_escolhida_id: 'q2',
      status: 'GERADA',
    })
    expect(reopened.items.map((row) => row.item.cotacao_id)).toEqual(['q2', 'q1'])
    expect(reopened.items.find((row) => row.item.cotacao_id === 'q1')?.item).toMatchObject({
      parcelamento_id: 'q1-card',
      recomendada: true,
      vantagens_texto: 'Assistência completa.',
    })
    expect(JSON.stringify(data.quotes)).toBe(quotesBefore)
    expect(JSON.stringify(data.proposals)).toBe(proposalsBefore)
  })

  it('rejeita parcelamento de outra cotação e preserva o rascunho anterior', () => {
    const data = store()
    const deps = dependencies()
    const selection = toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q1', 'user-1', deps)
    const presentationsBefore = JSON.stringify(data.presentations)
    const itemsBefore = JSON.stringify(data.presentationQuotes)

    expect(() => saveCommercialPresentationAtomic(data, {
      presentationId: selection.presentation?.id,
      opportunityId: 'opp-1',
      layout: 'VERTICAL',
      ordering: 'MANUAL',
      showFipe: true,
      showAdvantages: true,
      showLegend: true,
      showNotes: true,
      showCommission: false,
      status: 'RASCUNHO',
      items: [{ quoteId: 'q1', installmentId: 'q2-pix' }],
    }, deps)).toThrow('parcelamento')
    expect(JSON.stringify(data.presentations)).toBe(presentationsBefore)
    expect(JSON.stringify(data.presentationQuotes)).toBe(itemsBefore)
  })

  it('remove seleção e limpa a escolha do cliente sem tocar a cotação', () => {
    const data = store()
    const deps = dependencies()
    const selected = toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q1', 'user-1', deps)
    saveCommercialPresentationAtomic(data, {
      presentationId: selected.presentation?.id,
      opportunityId: 'opp-1',
      selectedQuoteId: 'q1',
      layout: 'HORIZONTAL',
      ordering: 'MANUAL',
      showFipe: true,
      showAdvantages: true,
      showLegend: true,
      showNotes: true,
      showCommission: false,
      status: 'RASCUNHO',
      items: [{ quoteId: 'q1' }],
    }, deps)
    const quoteBefore = JSON.stringify(data.quotes[0])
    const empty = toggleCommercialPresentationQuoteAtomic(data, 'opp-1', 'q1', 'user-1', deps)

    expect(empty.items).toHaveLength(0)
    expect(empty.presentation?.cotacao_escolhida_id).toBeNull()
    expect(JSON.stringify(data.quotes[0])).toBe(quoteBefore)
  })
})
