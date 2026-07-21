import { describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import type { ComissaoExtratoRow } from '../../types/database'
import {
  filterFinanceiroExtratos,
  getFinanceiroExtratoDetail,
  listFinanceiroExtratos,
  type ExtratoFilters,
} from './extratosDomain'

const EMPTY_FILTERS: ExtratoFilters = {
  busca: '', filialId: '', seguradoraId: '', origem: '', formato: '',
  processamento: '', conciliacao: '', periodoDe: '', periodoAte: '',
}

describe('extratosDomain', () => {
  it('projeta cabeçalho, itens e diferença sem fundir os fatos', () => {
    const rows = listFinanceiroExtratos(null)
    const row = rows.find((candidate) => candidate.id === 'mock-extrato-comissao-porto-jul-2026')

    expect(row).toBeDefined()
    expect(row?.quantidade_itens).toBe(2)
    expect(row?.somaItensLiquido).toBe(row?.valor_liquido_total)
    expect(row?.diferencaTotalizacao).toBe(0)
    expect(row?.totalizacaoCompativel).toBe(true)
    expect(row?.contagens).toMatchObject({ prontos: 1, semVinculo: 1, ocorrenciasAbertas: 1 })
  })

  it('respeita o escopo de corretoras acessíveis e os filtros operacionais', () => {
    const extract = (getTable('comissao_extratos') as unknown as ComissaoExtratoRow[])[0]
    expect(extract).toBeDefined()

    expect(listFinanceiroExtratos(['filial-sem-acesso'])).toHaveLength(0)
    const scoped = listFinanceiroExtratos([extract.filial_id])
    expect(scoped.length).toBeGreaterThan(0)
    expect(filterFinanceiroExtratos(scoped, {
      ...EMPTY_FILTERS,
      busca: 'porto',
      processamento: 'NORMALIZADO',
      periodoDe: '2026-07-01',
      periodoAte: '2026-07-31',
    })).toContainEqual(expect.objectContaining({ id: extract.id }))
  })

  it('compõe detalhe e deep links apenas quando a comissão foi resolvida', () => {
    const detail = getFinanceiroExtratoDetail('mock-extrato-comissao-porto-jul-2026', null)

    expect(detail?.itens).toHaveLength(2)
    expect(detail?.conciliacoes).toHaveLength(1)
    expect(detail?.ocorrencias).toHaveLength(1)
    expect(detail?.conciliacoes[0].link).toMatchObject({
      comissaoId: expect.any(String),
      propostaId: expect.any(String),
      apoliceId: 'mock-apolice-viaforte',
      seguradoId: expect.any(String),
    })
    expect(getFinanceiroExtratoDetail('mock-extrato-comissao-porto-jul-2026', ['filial-sem-acesso'])).toBeNull()
  })
})
