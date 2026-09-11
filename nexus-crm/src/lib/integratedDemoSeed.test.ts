import { describe, expect, it } from 'vitest'
import { getTable } from './inMemoryDb'

const rows = (table: string) => getTable(table)
const ids = (table: string) => new Set(rows(table).map((row) => row.id))

describe('massa demo integrada', () => {
  it('oferece volume e variedade para os módulos operacionais', () => {
    expect(rows('segurados').length).toBeGreaterThanOrEqual(14)
    expect(rows('oportunidades').length).toBeGreaterThanOrEqual(11)
    expect(rows('calculos').length).toBeGreaterThanOrEqual(8)
    expect(rows('apolices').length).toBeGreaterThanOrEqual(14)
    expect(rows('propostas').length).toBeGreaterThanOrEqual(20)
    expect(rows('apolice_itens').length).toBeGreaterThanOrEqual(16)
    expect(rows('sinistros').length).toBeGreaterThanOrEqual(5)
    expect(rows('comissao_baixas').length).toBeGreaterThanOrEqual(3)
    expect(rows('repasse_recibos').length).toBeGreaterThanOrEqual(1)
    expect(rows('pessoa_contato').length).toBeGreaterThanOrEqual(2)
    expect(rows('campo_valor_opcoes').length).toBeGreaterThanOrEqual(2)

    expect(ids('oportunidades')).toContain('mock-oportunidade-joao-auto')
    expect(ids('calculos')).toContain('mock-calculo-joao-auto-basico')
    expect(ids('sinistros')).toContain('mock-sinistro-aurora-reaberto')
    expect(ids('repasse_recibos')).toContain('mock-recibo-repasse-lucas')
  })

  it('mantém oportunidades e cálculos no mesmo grupo, corretora e ramo', () => {
    const branches = new Map(rows('filiais').map((row) => [row.id, row]))
    const insureds = new Map(rows('segurados').map((row) => [row.id, row]))
    const opportunities = new Map(rows('oportunidades').map((row) => [row.id, row]))
    const lines = new Map(rows('ramos').map((row) => [row.id, row]))
    const coverageCatalog = new Map(rows('coberturas_catalogo').map((row) => [row.id, row]))
    const specializationTables = [
      'calc_auto', 'calc_residencia', 'calc_condominio',
      'calc_vida', 'calc_empresa', 'calc_diversos',
    ]

    rows('oportunidades').forEach((opportunity) => {
      const branch = branches.get(opportunity.filial_id)
      expect(branch).toBeDefined()
      expect(branch?.tenant_id).toBe(opportunity.tenant_id)
      if (opportunity.segurado_id) {
        const insured = insureds.get(opportunity.segurado_id)
        expect(insured).toBeDefined()
        expect(insured?.filial_id).toBe(opportunity.filial_id)
        expect(insured?.tenant_id).toBe(opportunity.tenant_id)
      }
    })

    rows('calculos').forEach((calculation) => {
      const opportunity = opportunities.get(calculation.oportunidade_id)
      const line = lines.get(calculation.ramo_id)
      expect(opportunity).toBeDefined()
      expect(line).toBeDefined()
      expect(calculation.ramo_id).toBe(opportunity?.ramo_id)

      const specializationCount = specializationTables.reduce(
        (total, table) => total + rows(table).filter((row) => row.calculo_id === calculation.id).length,
        0,
      )
      expect(specializationCount).toBe(1)

      rows('calculo_coberturas')
        .filter((coverage) => coverage.calculo_id === calculation.id)
        .forEach((coverage) => {
          expect(coverageCatalog.get(coverage.cobertura_id)?.ramo_id).toBe(calculation.ramo_id)
        })
    })

    expect(rows('calculos').filter((row) => row.oportunidade_id === 'mock-oportunidade-joao-auto')).toHaveLength(2)
  })

  it('preserva contrato, documento, item e sinistro por vínculos reais', () => {
    const policies = new Map(rows('apolices').map((row) => [row.id, row]))
    const proposals = new Map(rows('propostas').map((row) => [row.id, row]))
    const policyItems = new Map(rows('apolice_itens').map((row) => [row.id, row]))
    const claims = new Map(rows('sinistros').map((row) => [row.id, row]))

    rows('propostas').forEach((proposal) => {
      expect(policies.has(proposal.apolice_id)).toBe(true)
    })

    rows('apolice_itens').forEach((item) => {
      expect(policies.has(item.apolice_id)).toBe(true)
      for (const proposalId of [item.incluido_por_proposta_id, item.excluido_por_proposta_id]) {
        if (!proposalId) continue
        expect(proposals.get(proposalId)?.apolice_id).toBe(item.apolice_id)
      }
    })

    rows('sinistros').forEach((claim) => {
      expect(policies.has(claim.apolice_id)).toBe(true)
    })
    rows('sinistro_envolvidos').forEach((involved) => {
      const claim = claims.get(involved.sinistro_id)
      expect(claim).toBeDefined()
      if (involved.apolice_item_id) {
        expect(policyItems.get(involved.apolice_item_id)?.apolice_id).toBe(claim?.apolice_id)
      }
    })

    expect(policies.get('mock-apolice-lucas-atual')?.renovada_de_id).toBe('mock-apolice-lucas-anterior')
    expect(policies.get('mock-apolice-lucas-anterior')?.status).toBe('RENOVADA')
  })

  it('mantém agendas, conciliação, baixa e recibo como fatos separados', () => {
    const proposals = new Map(rows('propostas').map((row) => [row.id, row]))
    const installments = new Map(rows('parcelas').map((row) => [row.id, row]))
    const commissions = new Map(rows('comissoes').map((row) => [row.id, row]))
    const transfers = new Map(rows('repasses').map((row) => [row.id, row]))
    const reconciliations = new Map(rows('comissao_conciliacoes').map((row) => [row.id, row]))
    const receipts = new Map(rows('repasse_recibos').map((row) => [row.id, row]))

    rows('parcelas').forEach((installment) => expect(proposals.has(installment.proposta_id)).toBe(true))
    rows('comissoes').forEach((commission) => expect(proposals.has(commission.proposta_id)).toBe(true))
    rows('repasses').forEach((transfer) => {
      expect(proposals.has(transfer.proposta_id)).toBe(true)
      if (transfer.comissao_id) {
        expect(commissions.get(transfer.comissao_id)?.proposta_id).toBe(transfer.proposta_id)
      }
    })
    rows('financeiro_cobrancas').forEach((collection) => {
      expect(installments.has(collection.parcela_id)).toBe(true)
    })
    rows('comissao_baixas').forEach((receiptEvent) => {
      expect(commissions.has(receiptEvent.comissao_id)).toBe(true)
      if (receiptEvent.baixa_origem_id) expect(ids('comissao_baixas')).toContain(receiptEvent.baixa_origem_id)
    })
    rows('comissao_baixa_conciliacoes').forEach((bridge) => {
      const receiptEvent = rows('comissao_baixas').find((row) => row.id === bridge.baixa_id)
      const reconciliation = reconciliations.get(bridge.conciliacao_id)
      expect(receiptEvent).toBeDefined()
      expect(reconciliation).toBeDefined()
      expect(receiptEvent?.comissao_id).toBe(reconciliation?.comissao_id)
    })
    rows('repasse_recibo_itens').forEach((item) => {
      expect(receipts.has(item.recibo_id)).toBe(true)
      expect(transfers.has(item.repasse_id)).toBe(true)
    })

    expect(commissions.get('mock-comissao-lucas-recebida')?.status).toBe('RECEBIDA')
    expect(receipts.get('mock-recibo-repasse-lucas')?.status).toBe('EMITIDO')
  })
})
