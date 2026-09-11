import { describe, expect, it } from 'vitest'
import type {
  CalculoCoberturaRow,
  CalculoRow,
} from '../../types/database'
import {
  completeCalculationExecutionSimulationAtomic,
  getCalculationExecutionWorkspace,
  markCalculationExecutionRunning,
  startCalculationExecutionsAtomic,
  startRecalculationAtomic,
  type CalculationExecutionDependencies,
  type CalculationExecutionStore,
} from './calculationExecutionDomain'

function calculation(id = 'calc-1'): CalculoRow {
  return {
    id,
    oportunidade_id: 'opp-1',
    ramo_id: 'ramo-auto',
    segurado_id: 'segurado-1',
    seguradora_anterior_id: null,
    origem: 'MANUAL',
    comissao_sugerida_pct: null,
    rotulo_versao: 'Auto · ABC1D23 · Novo',
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

function insurer(id: string, code: string, name: string): CalculationExecutionStore['insurers'][number] {
  return {
    id,
    tenant_id: 'tenant-1',
    nome: name,
    nome_curto: name,
    codigo_interno: code,
    ativo: true,
  } as CalculationExecutionStore['insurers'][number]
}

const requestedCoverage: CalculoCoberturaRow = {
  id: 'requested-casco',
  calculo_id: 'calc-1',
  cobertura_id: 'coverage-casco',
  selecionada: true,
  limite_solicitado: null,
  percentual_fipe_solicitado: 100,
  franquia_tipo_solicitado: 'NORMAL',
  opcao_solicitada: null,
  quantidade_solicitada: null,
  observacao_transmitida: null,
}

function store(): CalculationExecutionStore {
  return {
    opportunities: [{ id: 'opp-1', tenant_id: 'tenant-1' } as CalculationExecutionStore['opportunities'][number]],
    calculations: [calculation(), calculation('calc-2')],
    insurers: [
      insurer('porto', 'porto', 'Porto Seguro'),
      insurer('bradesco', 'bradesco', 'Bradesco Seguros'),
      insurer('allianz', 'allianz', 'Allianz'),
      insurer('sulamerica', 'sulamerica', 'SulAmérica'),
      insurer('tokio', 'tokio', 'Tokio Marine'),
    ],
    requestedCoverages: [requestedCoverage],
    coverageCatalog: [{
      id: 'coverage-casco',
      ramo_id: 'ramo-auto',
      codigo: 'casco',
      nome: 'Casco',
      capital_lmi_padrao: 100000,
      carencia_dias: 0,
    } as CalculationExecutionStore['coverageCatalog'][number]],
    executions: [],
    quotes: [],
    quoteCoverages: [],
    quoteInstallments: [],
  }
}

function dependencies(): CalculationExecutionDependencies {
  let id = 0
  let clock = Date.parse('2026-07-22T12:00:00.000Z')
  return {
    newId: () => `generated-${++id}`,
    now: () => {
      clock += 1000
      return new Date(clock).toISOString()
    },
  }
}

function complete(storeValue: CalculationExecutionStore, executionId: string, deps: CalculationExecutionDependencies) {
  markCalculationExecutionRunning(storeValue, executionId, deps)
  return completeCalculationExecutionSimulationAtomic(storeValue, executionId, deps)
}

describe('execuções e resultados simulados por seguradora', () => {
  it('persiste comissão padrão no cálculo e sobrescritas somente nas execuções indicadas', () => {
    const data = store()
    const rows = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [
        { insurerId: 'porto' },
        { insurerId: 'bradesco', commissionOverridePct: 18.5 },
        { insurerId: 'allianz', commissionOverridePct: 22 },
      ],
    }, dependencies())

    expect(data.calculations[0].comissao_sugerida_pct).toBe(20)
    expect(rows.map((row) => [row.seguradora_id, row.comissao_pct_aplicada, row.comissao_origem])).toEqual([
      ['porto', 20, 'PADRAO_CALCULO'],
      ['bradesco', 18.5, 'SOBRESCRITA'],
      ['allianz', 22, 'SOBRESCRITA'],
    ])
  })

  it('executa todas as seguradoras ou apenas um subconjunto sem duplicar a seleção', () => {
    const data = store()
    const deps = dependencies()
    const subset = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'tokio' }],
    }, deps)
    expect(subset).toHaveLength(1)
    expect(subset[0].seguradora_id).toBe('tokio')

    const before = data.executions.length
    expect(() => startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'porto' }, { insurerId: 'porto' }],
    }, deps)).toThrow('mesma seguradora')
    expect(data.executions).toHaveLength(before)
  })

  it('materializa simultaneamente sucesso, pendência acionável e erro recuperável', () => {
    const data = store()
    const deps = dependencies()
    const rows = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'porto' }, { insurerId: 'bradesco' }, { insurerId: 'allianz' }],
    }, deps)
    rows.forEach((row) => complete(data, row.id, deps))

    expect(rows.map((row) => row.status)).toEqual(['CONCLUIDA', 'PENDENTE_DADOS', 'ERRO'])
    expect(rows[1].pendencia_mensagem).toContain('tempo de habilitação')
    expect(rows[2].erro_mensagem_segura).toContain('Recalcule')
    expect(data.quotes).toHaveLength(1)
  })

  it('ordena resultados por retorno, prêmio e franquia usando somente valores da cotação', () => {
    const data = store()
    const deps = dependencies()
    const rows = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'porto' }, { insurerId: 'sulamerica' }, { insurerId: 'tokio' }],
    }, deps)
    rows.forEach((row) => complete(data, row.id, deps))
    rows[0].iniciada_em = '2026-07-22T12:00:00.000Z'
    rows[0].concluida_em = '2026-07-22T12:00:00.500Z'
    rows[1].iniciada_em = '2026-07-22T12:00:00.000Z'
    rows[1].concluida_em = '2026-07-22T12:00:00.900Z'
    rows[2].iniciada_em = '2026-07-22T12:00:00.000Z'
    rows[2].concluida_em = '2026-07-22T12:00:00.700Z'

    expect(getCalculationExecutionWorkspace(data, 'calc-1', 'RETORNO').results.map((row) => row.insurerCode)).toEqual(['porto', 'tokio', 'sulamerica'])
    expect(getCalculationExecutionWorkspace(data, 'calc-1', 'PREMIO').results.map((row) => row.insurerCode)).toEqual(['tokio', 'porto', 'sulamerica'])
    expect(getCalculationExecutionWorkspace(data, 'calc-1', 'FRANQUIA').results.map((row) => row.insurerCode)).toEqual(['sulamerica', 'porto', 'tokio'])
  })

  it('expõe coberturas e múltiplos parcelamentos normalizados nos detalhes', () => {
    const data = store()
    const deps = dependencies()
    const [row] = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'porto' }],
    }, deps)
    complete(data, row.id, deps)
    const [result] = getCalculationExecutionWorkspace(data, 'calc-1').results

    expect(result.coverages[0]).toMatchObject({ name: 'Casco', franquia_valor: 3840, percentual_fipe_aceito: 100 })
    expect(result.installments).toHaveLength(3)
    expect(result.primaryInstallment).toMatchObject({ forma_pagamento: 'PIX', principal: true })
    expect(result.quote?.execucao_id).toBe(row.id)
  })

  it('produz ausência e limite divergente determinísticos para exercitar o comparativo', () => {
    const data = store()
    const deps = dependencies()
    data.requestedCoverages.push({
      ...requestedCoverage,
      id: 'requested-vidros',
      cobertura_id: 'coverage-vidros',
      limite_solicitado: 50_000,
      percentual_fipe_solicitado: null,
    })
    data.coverageCatalog.push({
      id: 'coverage-vidros',
      ramo_id: 'ramo-auto',
      codigo: 'vidros',
      nome: 'Vidros',
      capital_lmi_padrao: 50_000,
      carencia_dias: 0,
    } as CalculationExecutionStore['coverageCatalog'][number])
    const rows = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'sulamerica' }, { insurerId: 'tokio' }],
    }, deps)
    rows.forEach((row) => complete(data, row.id, deps))
    const results = getCalculationExecutionWorkspace(data, 'calc-1').results
    const sulAmerica = results.find((result) => result.insurerCode === 'sulamerica')
    const tokio = results.find((result) => result.insurerCode === 'tokio')

    expect(sulAmerica?.coverages).toHaveLength(2)
    expect(sulAmerica?.coverages.find((coverage) => coverage.cobertura_id === 'coverage-vidros')?.limite_aceito).toBe(55_000)
    expect(tokio?.coverages.map((coverage) => coverage.cobertura_id)).toEqual(['coverage-casco'])
  })

  it('recalcula com ajuste por seguradora sem sobrescrever o resultado anterior', () => {
    const data = store()
    const deps = dependencies()
    const [first] = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'porto' }],
    }, deps)
    complete(data, first.id, deps)
    const second = startRecalculationAtomic(data, { executionId: first.id, commissionPct: 17.5 }, deps)
    complete(data, second.id, deps)
    const workspace = getCalculationExecutionWorkspace(data, 'calc-1')

    expect(second).toMatchObject({ reexecucao_de_id: first.id, tentativa: 2, comissao_pct_aplicada: 17.5, comissao_origem: 'SOBRESCRITA' })
    expect(workspace.results).toHaveLength(2)
    expect(workspace.results.map((row) => row.franchiseValue).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([2880, 3840])
    expect(data.quotes.map((quote) => quote.execucao_id)).toEqual([first.id, second.id])
  })

  it('recupera erro em nova tentativa e mantém resultados isolados por versão do cálculo', () => {
    const data = store()
    const deps = dependencies()
    const [first] = startCalculationExecutionsAtomic(data, {
      calculationId: 'calc-1',
      defaultCommissionPct: 20,
      insurers: [{ insurerId: 'allianz' }],
    }, deps)
    complete(data, first.id, deps)
    const retry = startRecalculationAtomic(data, { executionId: first.id }, deps)
    complete(data, retry.id, deps)

    expect(first.status).toBe('ERRO')
    expect(retry.status).toBe('CONCLUIDA')
    expect(getCalculationExecutionWorkspace(data, 'calc-1').results).toHaveLength(1)
    expect(getCalculationExecutionWorkspace(data, 'calc-2').results).toHaveLength(0)
  })

  it('gera fixtures estáveis para a mesma combinação de cálculo e seguradora sem rede', () => {
    const firstStore = store()
    const secondStore = store()
    const firstDeps = dependencies()
    const secondDeps = dependencies()
    const [first] = startCalculationExecutionsAtomic(firstStore, { calculationId: 'calc-1', defaultCommissionPct: 20, insurers: [{ insurerId: 'porto' }] }, firstDeps)
    const [second] = startCalculationExecutionsAtomic(secondStore, { calculationId: 'calc-1', defaultCommissionPct: 20, insurers: [{ insurerId: 'porto' }] }, secondDeps)
    complete(firstStore, first.id, firstDeps)
    complete(secondStore, second.id, secondDeps)

    const firstQuote = firstStore.quotes[0]
    const secondQuote = secondStore.quotes[0]
    expect(firstQuote.numero_cotacao_seguradora).toBe(secondQuote.numero_cotacao_seguradora)
    expect(firstQuote.premio_total).toBe(secondQuote.premio_total)
    expect(firstStore.quoteInstallments.map((row) => row.valor_total)).toEqual(secondStore.quoteInstallments.map((row) => row.valor_total))
  })
})
