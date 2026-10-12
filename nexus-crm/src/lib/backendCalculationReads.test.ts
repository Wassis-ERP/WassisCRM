import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptySpecialization } from '../modules/comercial/calculationForm'
import type { CalculationAggregate } from '../modules/comercial/calculationDomain'
import type { CalculoExecucaoRow } from '../types/database'
import type { BackendPage, BackendQuoteAggregate } from './calculationHttpContracts'
import {
  getBackendCalculation, listBackendCalculations, listBackendCalculationCoverages,
  listBackendCalculationExecutions, listBackendCalculationInsurers, listBackendOpportunityQuotes,
} from './backendCalculationApi'
import { readBackendCalculationItems, readBackendCalculationExecutionWorkspace, readCalculationPages } from './backendCalculationReads'

vi.mock('./backendCalculationApi', () => ({
  getBackendCalculation: vi.fn(), listBackendCalculations: vi.fn(), listBackendCalculationCoverages: vi.fn(),
  listBackendCalculationExecutions: vi.fn(), listBackendCalculationInsurers: vi.fn(), listBackendOpportunityQuotes: vi.fn(),
}))

function page<T>(items: T[], current = 1, total = items.length): BackendPage<T> {
  return { items, page: current, pageSize: 100, totalCount: total, hasMore: current * 100 < total }
}
function calculation(): CalculationAggregate {
  const risk = createEmptySpecialization('AUTO')
  if (risk.forma !== 'AUTO') throw new Error('Fixture Auto inválida.')
  return {
    calculation: {
      id: 'calculation', oportunidade_id: 'opportunity', ramo_id: 'line', segurado_id: null, seguradora_anterior_id: null,
      origem: 'MANUAL', comissao_sugerida_pct: null, rotulo_versao: 'Auto · ABC1D23', tipo_seguro: 'NOVO', bonus: null,
      qtd_sinistros: null, qtd_sinistros_perda_parcial: null, transferiu_titularidade: null,
      vigencia_inicio: '2026-10-12', vigencia_fim: '2027-10-12', vigencia_fim_anterior: null, numero_apolice_anterior: null,
      codigo_identificacao_anterior: null, status_apolice_anterior: null, nota_interna: null, criado_em: '2026-10-12T12:00:00Z',
    },
    specialization: { forma: 'AUTO', data: { ...risk.data, calculo_id: 'calculation', marca: 'Marca fixture', placa: 'ABC1D23' } },
    coverages: [],
  }
}
const first: CalculoExecucaoRow = {
  id: 'execution-1', calculo_id: 'calculation', seguradora_id: 'insurer', reexecucao_de_id: null, tentativa: 1,
  motor: 'MANUAL', comissao_pct_aplicada: null, comissao_origem: 'PADRAO_CALCULO', status: 'CONCLUIDA',
  pendencia_codigo: null, pendencia_mensagem: null, erro_codigo: null, erro_mensagem_segura: null,
  referencia_externa: null, iniciada_em: '2026-10-12T12:00:00Z', concluida_em: '2026-10-12T12:01:00Z', criada_em: '2026-10-12T12:00:00Z',
}
function result(execution = first, premium: number | null = 0): BackendQuoteAggregate {
  return {
    execution, quote: {
      id: `quote-${execution.id}`, execucao_id: execution.id, numero_cotacao_seguradora: null,
      premio_total: premium, premio_liquido: null, iof: null, adicional_fracionamento: null, comissao_valor: null,
      validade: null, status: 'APRESENTADA', link_proposta: null, mensagem_seguradora: null, restricoes: null,
      recebida_em: execution.concluida_em, aprovada_em: null, descartada_motivo: null, observacao_interna: null,
    },
    coverages: [{ id: `cover-${execution.id}`, cotacao_id: `quote-${execution.id}`, cobertura_id: 'inactive-coverage',
      chave_resultado: 'casco', codigo_externo: null, nome_informado: 'Casco informado na cotação', incluida: true,
      limite_aceito: null, percentual_fipe_aceito: 0, franquia_tipo: null, franquia_valor: null, premio: null,
      carencia_dias: null, participacao_obrigatoria_pct: null, clausula_texto: null, observacao_seguradora: null, ordem: 10 }],
    installments: [],
  }
}

describe('leitura conectada de cálculos', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getBackendCalculation).mockResolvedValue(calculation())
    vi.mocked(listBackendCalculationExecutions).mockResolvedValue(page([first]))
    vi.mocked(listBackendOpportunityQuotes).mockResolvedValue(page([result()]))
    vi.mocked(listBackendCalculationInsurers).mockResolvedValue(page([]))
    vi.mocked(listBackendCalculationCoverages).mockResolvedValue(page([]))
  })

  it('carrega todas as páginas, sem descartar a segunda nem repetir registros', async () => {
    const rows = Array.from({ length: 103 }, (_, index) => ({ id: `row-${index}` }))
    const load = vi.fn(async (options: { page?: number }) => page(rows.slice(((options.page ?? 1) - 1) * 100, (options.page ?? 1) * 100), options.page, rows.length))
    expect(await readCalculationPages(load, row => row.id)).toEqual(rows)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('recusa total alterado, página curta e duplicidade, em vez de devolver histórico parcial', async () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({ id: String(index) }))
    const changed = vi.fn().mockResolvedValueOnce(page(rows, 1, 101)).mockResolvedValueOnce(page([{ id: '100' }], 2, 102))
    await expect(readCalculationPages(changed, (row: { id: string }) => row.id)).rejects.toThrow('mudou durante')
    await expect(readCalculationPages(async () => page(rows.slice(0, 99), 1, 100), row => row.id)).rejects.toThrow('mudou durante')
    const duplicate = [...rows.slice(0, 99), rows[0]]
    await expect(readCalculationPages(async () => page(duplicate), row => row.id)).rejects.toThrow('repetiu um registro')
  })

  it('limita a leitura completa a vinte páginas e não retorna as linhas parciais', async () => {
    const load = vi.fn(async (options: { page?: number }) => page(Array.from({ length: 100 }, (_, index) => ({ id: `${options.page}-${index}` })), options.page, 2001))
    await expect(readCalculationPages(load, row => row.id)).rejects.toThrow('excede o limite')
    expect(load).toHaveBeenCalledTimes(20)
  })

  it('propaga cancelamento e não inicia nova página depois de abortar', async () => {
    const controller = new AbortController()
    const load = vi.fn(async (options: { signal?: AbortSignal }) => {
      expect(options.signal).toBe(controller.signal)
      controller.abort()
      return page([{ id: 'one' }])
    })
    await expect(readCalculationPages(load, row => row.id, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(load).toHaveBeenCalledTimes(1)
    await expect(readCalculationPages(load, row => row.id, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('projeta pedido remoto com risco, datas e comissão desconhecida sem inventar pessoa do mock', async () => {
    const older = calculation(), newer = calculation()
    newer.calculation = { ...newer.calculation, id: 'newer', segurado_id: 'other-person', criado_em: '2026-10-12T13:00:00Z', comissao_sugerida_pct: 0 }
    vi.mocked(listBackendCalculations).mockResolvedValue(page([older, newer]))
    const items = await readBackendCalculationItems('opportunity')
    expect(items.map(item => item.id)).toEqual(['newer', 'calculation'])
    expect(items[0]).toMatchObject({ suggestedCommission: 0, insuredName: 'Segurado cadastrado' })
    expect(items[1]).toMatchObject({ suggestedCommission: null, insuredName: 'Lead', validityEnd: '2027-10-12', riskSummary: 'Marca fixture · ABC1D23' })
  })

  it('mantém cotação anterior quando retry fica aberto, mesmo sem seguradora/cobertura no catálogo ativo', async () => {
    const retry: CalculoExecucaoRow = { ...first, id: 'execution-2', reexecucao_de_id: first.id, tentativa: 2, status: 'AGUARDANDO', iniciada_em: null, concluida_em: null }
    vi.mocked(listBackendCalculationExecutions).mockResolvedValue(page([first, retry]))
    const controller = new AbortController()
    const workspace = await readBackendCalculationExecutionWorkspace('calculation', 'PREMIO', controller.signal)
    expect(workspace.executionCount).toBe(2)
    expect(workspace.latestExecutions.map(view => view.execution.id)).toEqual(['execution-2'])
    expect(workspace.results).toHaveLength(1)
    expect(workspace.results[0]).toMatchObject({ isLatest: false, insurerName: 'Seguradora não informada', franchiseValue: null, quote: { premio_total: 0, comissao_valor: null }, execution: { comissao_pct_aplicada: null } })
    expect(workspace.results[0].coverages[0]).toMatchObject({ name: 'Casco informado na cotação', percentual_fipe_aceito: 0 })
    expect(workspace.results[0].primaryInstallment).toBeNull()
    expect(getBackendCalculation).toHaveBeenCalledWith('calculation', controller.signal)
    expect(listBackendCalculationInsurers).toHaveBeenCalledWith('opportunity', expect.objectContaining({ signal: controller.signal }))
    expect(listBackendCalculationCoverages).toHaveBeenCalledWith('opportunity', 'line', expect.objectContaining({ signal: controller.signal }))
  })

  it('separa cotações de outro pedido da mesma oportunidade e ordena prêmio zero antes dos demais', async () => {
    const second = { ...first, id: 'execution-other-insurer', seguradora_id: 'insurer-2' }
    const otherCalculation = { ...first, id: 'execution-other-calculation', calculo_id: 'other-calculation' }
    vi.mocked(listBackendCalculationExecutions).mockResolvedValue(page([first, second]))
    vi.mocked(listBackendOpportunityQuotes).mockResolvedValue(page([result(second, 500), result(first), result(otherCalculation, 100)]))
    const workspace = await readBackendCalculationExecutionWorkspace('calculation', 'PREMIO')
    expect(workspace.results.map(view => view.execution.id)).toEqual([first.id, second.id])
  })

  it('não apresenta snapshots de execução incompatíveis ou resultados concluídos ausentes', async () => {
    vi.mocked(listBackendOpportunityQuotes).mockResolvedValue(page([result({ ...first, comissao_pct_aplicada: 0 })]))
    await expect(readBackendCalculationExecutionWorkspace('calculation', 'RETORNO')).rejects.toThrow('mudaram durante')
    vi.mocked(listBackendOpportunityQuotes).mockResolvedValue(page([]))
    await expect(readBackendCalculationExecutionWorkspace('calculation', 'RETORNO')).rejects.toThrow('não foi retornado')
  })

  it('propaga falha de autorização dos lookups comerciais sem substituir por memória', async () => {
    vi.mocked(listBackendCalculationInsurers).mockRejectedValue(new Error('HTTP 403'))
    await expect(readBackendCalculationExecutionWorkspace('calculation', 'RETORNO')).rejects.toThrow('HTTP 403')
  })
})
