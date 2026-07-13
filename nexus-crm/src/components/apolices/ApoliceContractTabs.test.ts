import { describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'

describe('contrato da apólice no mock', () => {
  it('preserva item anterior e novo em uma substituição', () => {
    const items = getTable('apolice_itens').filter((item) => item.apolice_id === 'mock-apolice-viaforte')
    const removed = items.find((item) => item.excluido_por_proposta_id === 'mock-proposta-viaforte-endosso-2')
    const included = items.find((item) => item.incluido_por_proposta_id === 'mock-proposta-viaforte-endosso-2')

    expect(removed?.descricao).toContain('Ford Ka')
    expect(included?.descricao).toContain('Volkswagen Fox')
    expect(getTable('item_coberturas').some((coverage) => coverage.apolice_item_id === removed?.id)).toBe(true)
    expect(getTable('item_coberturas').some((coverage) => coverage.apolice_item_id === included?.id)).toBe(true)
  })

  it('materializa agendas únicas por documento e preserva a origem', () => {
    const facts = ['parcelas', 'comissoes', 'repasses'] as const
    facts.forEach((table) => {
      const ids = getTable(table).map((row) => row.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    const junho = 'mock-proposta-aurora-fatura-junho'
    expect(getTable('parcelas').filter((row) => row.proposta_id === junho)).toHaveLength(1)
    expect(getTable('comissoes').filter((row) => row.proposta_id === junho)).toHaveLength(1)
    expect(getTable('repasses').filter((row) => row.proposta_id === junho)).toHaveLength(1)
    expect(getTable('propostas').find((row) => row.id === junho)?.recebimento_grade_id).toBeTruthy()
    expect(getTable('repasses').find((row) => row.proposta_id === junho)?.regra_id).toBeTruthy()
  })

  it('propaga restituição com sinal negativo nas agendas', () => {
    const id = 'mock-proposta-viaforte-endosso-3'
    expect(getTable('propostas').find((row) => row.id === id)?.premio_total).toBeLessThan(0)
    expect(getTable('parcelas').find((row) => row.proposta_id === id)?.valor).toBeLessThan(0)
    expect(getTable('comissoes').find((row) => row.proposta_id === id)?.valor_previsto).toBeLessThan(0)
    expect(getTable('repasses').find((row) => row.proposta_id === id)?.valor_previsto).toBeLessThan(0)
  })

  it('materializa saúde com 300% de agenciamento e 2% vitalício', () => {
    const id = 'mock-proposta-aurora-original'
    const proposal = getTable('propostas').find((row) => row.id === id)
    const commissions = getTable('comissoes').filter((row) => row.proposta_id === id).sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    expect(proposal?.agenciamento_pct).toBe(300)
    expect(proposal?.comissao_pct).toBe(2)
    expect(commissions.map((row) => row.tipo_comissao)).toEqual(['AGENCIAMENTO', 'AGENCIAMENTO', 'AGENCIAMENTO', 'VITALICIA'])
    expect(commissions.map((row) => row.percentual)).toEqual([100, 100, 100, 2])
  })
})
