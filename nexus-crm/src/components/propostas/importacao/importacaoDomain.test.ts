import { afterEach, describe, expect, it } from 'vitest'
import { getTable } from '../../../lib/inMemoryDb'
import { createImportDraft, importDocument, previewImportAgendas, validateImportDraft } from './importacaoDomain'

const testPrefix = 'teste_2_3_'

afterEach(() => {
  const attachments = getTable('anexos').filter((row) => String(row.nome_arquivo).startsWith(testPrefix))
  const proposalIds = new Set(attachments.map((row) => String(row.entidade_id)))
  const proposalRows = getTable('propostas').filter((row) => proposalIds.has(String(row.id)))
  const policyIds = new Set(proposalRows.map((row) => String(row.apolice_id)))

  for (const table of ['parcelas', 'comissoes', 'repasses'] as const) {
    const rows = getTable(table)
    rows.splice(0, rows.length, ...rows.filter((row) => !proposalIds.has(String(row.proposta_id))))
  }
  const logs = getTable('audit_logs')
  logs.splice(0, logs.length, ...logs.filter((row) => !proposalIds.has(String(row.entidade_id))))
  const proposals = getTable('propostas')
  proposals.splice(0, proposals.length, ...proposals.filter((row) => !proposalIds.has(String(row.id))))
  const policies = getTable('apolices')
  policies.splice(0, policies.length, ...policies.filter((row) => !policyIds.has(String(row.id)) || String(row.id).startsWith('mock-')))
  const storedAttachments = getTable('anexos')
  storedAttachments.splice(0, storedAttachments.length, ...storedAttachments.filter((row) => !String(row.nome_arquivo).startsWith(testPrefix)))
})

describe('importação assistida 2.3', () => {
  it('reconhece cancelamento sem persistir tipo fora do recorte', () => {
    const draft = createImportDraft({ name: `${testPrefix}cancelamento.pdf`, size: 1000, type: 'application/pdf' })

    expect(draft.kind).toBe('CANCELAMENTO')
    expect(draft.proposalType).toBeNull()
    expect(validateImportDraft(draft)).toContain('Tipo de documento fora do escopo atual.')
  })

  it('importa apólice oficial, anexa o PDF e materializa agendas uma única vez', () => {
    const draft = createImportDraft({ name: `${testPrefix}apolice.pdf`, size: 3200, type: 'application/pdf' })
    const preview = previewImportAgendas(draft)
    const result = importDocument(draft)

    expect(result.status).toBe('IMPORTADO')
    expect(result.policyId).toBeTruthy()
    expect(result.proposalId).toBeTruthy()
    expect(getTable('anexos').find((row) => row.entidade_id === result.proposalId)?.entidade_tipo).toBe('proposta')
    expect(getTable('parcelas').filter((row) => row.proposta_id === result.proposalId)).toHaveLength(4)
    expect(getTable('comissoes').filter((row) => row.proposta_id === result.proposalId)).toHaveLength(preview.commissionEvents)
    expect(getTable('repasses').filter((row) => row.proposta_id === result.proposalId)).toHaveLength(preview.commissionEvents)

    const duplicate = importDocument(draft)
    expect(duplicate.status).toBe('ERRO')
    expect(duplicate.message).toContain('já importado')
    expect(getTable('propostas').filter((row) => row.id === result.proposalId)).toHaveLength(1)
  })

  it('importa endosso sem alterar o status vigente da apólice-mãe', () => {
    const draft = createImportDraft({ name: `${testPrefix}endosso_viaforte.pdf`, size: 4100, type: 'application/pdf' })
    const before = getTable('apolices').find((row) => row.id === draft.policyId)?.status
    const result = importDocument(draft)
    const document = getTable('propostas').find((row) => row.id === result.proposalId)

    expect(result.status).toBe('IMPORTADO')
    expect(before).toBe('VIGENTE')
    expect(getTable('apolices').find((row) => row.id === draft.policyId)?.status).toBe('VIGENTE')
    expect(document?.tipo).toBe('ENDOSSO')
    expect(document?.endosso_subtipo_id).toBeTruthy()
    expect(document?.tipo_movimento_endosso).toBeTruthy()
  })
})
