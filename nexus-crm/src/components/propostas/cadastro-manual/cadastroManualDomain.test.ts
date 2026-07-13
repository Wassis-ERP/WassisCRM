import { afterEach, describe, expect, it } from 'vitest'
import { getTable } from '../../../lib/inMemoryDb'
import {
  createManualDraft,
  createManualInsuranceDocument,
  getManualLookups,
  previewManualAgendas,
  validateManualDraft,
} from './cadastroManualDomain'

function cleanupManualRows() {
  const logs = getTable('audit_logs')
  const proposalIds = new Set(logs
    .filter((row) => row.acao === 'CREATE_MANUAL')
    .map((row) => String(row.entidade_id)))
  const proposals = getTable('propostas')
  const policyIds = new Set(proposals
    .filter((row) => proposalIds.has(String(row.id)))
    .map((row) => String(row.apolice_id)))
  const items = getTable('apolice_itens')
  const itemIds = new Set(items
    .filter((row) => policyIds.has(String(row.apolice_id)))
    .map((row) => String(row.id)))

  for (const table of ['parcelas', 'comissoes', 'repasses'] as const) {
    const tableRows = getTable(table)
    tableRows.splice(0, tableRows.length, ...tableRows.filter((row) => !proposalIds.has(String(row.proposta_id))))
  }
  for (const table of ['item_veiculo', 'item_imovel', 'item_empresa', 'item_vida'] as const) {
    const tableRows = getTable(table)
    tableRows.splice(0, tableRows.length, ...tableRows.filter((row) => !itemIds.has(String(row.apolice_item_id))))
  }
  const coverageRows = getTable('item_coberturas')
  coverageRows.splice(0, coverageRows.length, ...coverageRows.filter((row) => !itemIds.has(String(row.apolice_item_id))))
  items.splice(0, items.length, ...items.filter((row) => !policyIds.has(String(row.apolice_id))))
  const attachments = getTable('anexos')
  attachments.splice(0, attachments.length, ...attachments.filter((row) => !proposalIds.has(String(row.entidade_id))))
  logs.splice(0, logs.length, ...logs.filter((row) => !proposalIds.has(String(row.entidade_id))))
  proposals.splice(0, proposals.length, ...proposals.filter((row) => !proposalIds.has(String(row.id))))
  const policies = getTable('apolices')
  policies.splice(0, policies.length, ...policies.filter((row) => !policyIds.has(String(row.id))))
}

afterEach(cleanupManualRows)

function validDraft() {
  const draft = createManualDraft()
  draft.items[0].description = 'Risco cadastrado manualmente'
  draft.items[0].externalIdentifier = 'TESTE-2-3-1'
  draft.totalPremium = '2400'
  draft.netPremium = '2200'
  draft.installmentCount = '4'
  draft.commissionPct = '20'
  return draft
}

describe('cadastro manual 2.3.1', () => {
  it('cria proposta em tramitação sem materializar agendas oficiais', () => {
    const draft = validDraft()
    const result = createManualInsuranceDocument(draft)
    const policy = getTable('apolices').find((row) => row.id === result.policyId)
    const proposal = getTable('propostas').find((row) => row.id === result.proposalId)

    expect(policy?.status).toBe('EM_EMISSAO')
    expect(policy?.numero_apolice).toBeNull()
    expect(proposal?.tipo).toBe('NOVA')
    expect(result.agendas).toEqual({ parcelas: 0, comissoes: 0, repasses: 0 })
    expect(getTable('apolice_itens').filter((row) => row.apolice_id === result.policyId)).toHaveLength(1)
  })

  it('cria apólice emitida com risco, cobertura, anexo e agendas idempotentes', () => {
    const draft = validDraft()
    const lookups = getManualLookups()
    draft.mode = 'APOLICE'
    draft.policyNumber = 'AP-MANUAL-TESTE-231'
    draft.issueDate = draft.coverageStart
    draft.attachment = { name: 'apolice-manual-teste.pdf', type: 'application/pdf', size: 2048 }
    const coverage = lookups.coverages.find((option) => option.branchId === draft.branchId)
    if (coverage) {
      draft.items[0].coverages.push({
        id: 'cobertura-teste', catalogId: coverage.id,
        capital: String(coverage.defaultCapital ?? 100000), deductible: '1000', premium: '250',
      })
    }

    const preview = previewManualAgendas(draft)
    const result = createManualInsuranceDocument(draft)

    expect(getTable('apolices').find((row) => row.id === result.policyId)?.status).toBe('VIGENTE')
    expect(getTable('apolices').find((row) => row.id === result.policyId)?.numero_apolice).toBe(draft.policyNumber)
    expect(getTable('parcelas').filter((row) => row.proposta_id === result.proposalId)).toHaveLength(4)
    expect(getTable('comissoes').filter((row) => row.proposta_id === result.proposalId)).toHaveLength(preview.commissionEvents)
    expect(getTable('anexos').find((row) => row.entidade_id === result.proposalId)?.origem).toBe('CADASTRO_MANUAL')
    expect(getTable('audit_logs').find((row) => row.entidade_id === result.proposalId)?.acao).toBe('CREATE_MANUAL')
  })

  it('permite concluir sem item e ignora o cartão vazio', () => {
    const draft = validDraft()
    draft.items[0].description = ''
    draft.items[0].externalIdentifier = ''
    const beforeItems = getTable('apolice_itens').length

    expect(validateManualDraft(draft)).not.toContain('Informe a descrição do item 1.')
    createManualInsuranceDocument(draft)
    expect(getTable('apolice_itens')).toHaveLength(beforeItems)
  })

  it('rejeita item parcialmente preenchido sem descrição', () => {
    const draft = validDraft()
    draft.items[0].description = ''
    draft.items[0].externalIdentifier = 'RISCO-PARCIAL'
    const beforePolicies = getTable('apolices').length
    const beforeProposals = getTable('propostas').length

    expect(validateManualDraft(draft)).toContain('Informe a descrição do item 1.')
    expect(() => createManualInsuranceDocument(draft)).toThrow('Informe a descrição do item 1.')
    expect(getTable('apolices')).toHaveLength(beforePolicies)
    expect(getTable('propostas')).toHaveLength(beforeProposals)
  })

  it('desfaz toda a escrita quando a materialização falha após criar o documento', () => {
    const draft = validDraft()
    draft.mode = 'APOLICE'
    draft.policyNumber = 'AP-MANUAL-ROLLBACK-231'
    draft.issueDate = draft.coverageStart
    const event = getTable('recebimento_grade_parcelas').find((row) => row.grade_id === draft.gradeId)
    expect(event).toBeTruthy()
    const originalDelay = event?.dias_apos_vencimento
    const before = new Map([
      ['apolices', getTable('apolices').length],
      ['propostas', getTable('propostas').length],
      ['apolice_itens', getTable('apolice_itens').length],
      ['parcelas', getTable('parcelas').length],
      ['audit_logs', getTable('audit_logs').length],
    ])

    if (event) event.dias_apos_vencimento = 'falha-induzida'
    try {
      expect(() => createManualInsuranceDocument(draft)).toThrow()
    } finally {
      if (event) event.dias_apos_vencimento = originalDelay
    }

    before.forEach((length, table) => expect(getTable(table)).toHaveLength(length))
  })
})
