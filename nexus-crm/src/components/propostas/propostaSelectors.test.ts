import { describe, expect, it } from 'vitest'
import type { Proposal } from '../../types/proposta'
import {
  buildPolicyTree,
  getDocumentFinancialEffect,
  getCurrentPolicyDocument,
  getDocumentNumber,
  getIssuancePendingLabel,
  getMovementLabel,
  getPendingDocumentsBreakdown,
  getPolicyExpansionIds,
  getPolicyOperationalStatus,
  getPolicyStatusReference,
  isPendingPipelineProposal,
  isPendingRenewalDocument,
  isPipelineProposal,
} from './propostaSelectors'

const makeRecord = (patch: Partial<Proposal> = {}): Proposal => ({
  id: 'record-1',
  entityType: 'proposta',
  insured: 'Segurado Teste',
  branch: 'Automóvel',
  status: 'Pendente',
  proposalType: 'Proposta',
  producer: { name: 'Produtor Teste' },
  insurer: 'Seguradora Teste',
  ...patch,
})

describe('propostaSelectors', () => {
  it('usa a mesma regra de pertencimento para lista e Kanban', () => {
    expect(isPipelineProposal(makeRecord({ status: 'Em Análise' }))).toBe(true)
    expect(isPipelineProposal(makeRecord({ status: 'Pendência Resolvida' }))).toBe(true)
    expect(isPipelineProposal(makeRecord({ status: 'Proposta Emitida' }))).toBe(true)
    expect(isPipelineProposal(makeRecord({ entityType: 'apolice', status: 'Proposta Emitida' }))).toBe(false)
  })

  it('conta como pendente somente o documento que ainda exige ação', () => {
    expect(isPendingPipelineProposal(makeRecord({ status: 'Em Análise' }))).toBe(true)
    expect(isPendingPipelineProposal(makeRecord({
      status: 'Proposta Emitida',
      issueDate: '2026-07-12',
      policyNumber: 'AP-1',
    }))).toBe(false)
    expect(isPendingPipelineProposal(makeRecord({
      status: 'Proposta Emitida',
      issueDate: '2026-07-12',
    }))).toBe(true)
  })

  it('separa documentos pendentes por resultado operacional', () => {
    const records = [
      makeRecord({ id: 'proposta-1' }),
      makeRecord({ id: 'renovacao-1', proposalType: 'Renovação' }),
      makeRecord({ id: 'endosso-1', proposalType: 'Endosso' }),
      makeRecord({ id: 'fatura-1', proposalType: 'Fatura' }),
      makeRecord({ id: 'cancelamento-1', proposalType: 'Cancelamento' }),
      makeRecord({
        id: 'emitida-1',
        status: 'Proposta Emitida',
        issueDate: '2026-07-12',
        policyNumber: 'AP-1',
      }),
    ]

    expect(getPendingDocumentsBreakdown(records)).toEqual({
      total: 5,
      newPolicies: 2,
      endorsements: 1,
      invoices: 1,
      cancellations: 1,
    })
  })

  it('conta renovação pendente pelo documento, não pela apólice', () => {
    expect(isPendingRenewalDocument(makeRecord({
      entityType: 'proposta',
      proposalType: 'Renovação',
      status: 'Pendente',
    }))).toBe(true)
    expect(isPendingRenewalDocument(makeRecord({
      entityType: 'apolice',
      proposalType: 'Renovação',
      status: 'Pendente',
    }))).toBe(false)
    expect(isPendingRenewalDocument(makeRecord({
      entityType: 'proposta',
      proposalType: 'Renovação',
      status: 'Proposta Emitida',
      issueDate: '2026-07-12',
      policyNumber: 'AP-REN-1',
    }))).toBe(false)
  })

  it('deriva endosso em tramitação sem alterar o status da apólice', () => {
    const records = [
      makeRecord({ id: 'apolice-1', entityType: 'apolice', currentStatus: 'Vigente' }),
      makeRecord({ id: 'endosso-1', proposalType: 'Endosso', apoliceId: 'apolice-1' }),
    ]

    expect(getPolicyOperationalStatus('apolice-1', records)).toBe('Endosso em tramitação')
    expect(records[0].currentStatus).toBe('Vigente')
  })

  it('sinaliza documento pendente quando o stage está emitido sem número de endosso', () => {
    const records = [
      makeRecord({
        id: 'endosso-1',
        proposalType: 'Endosso',
        apoliceId: 'apolice-1',
        status: 'Proposta Emitida',
      }),
    ]

    expect(getPolicyOperationalStatus('apolice-1', records)).toBe('Documento do endosso pendente')
    expect(getIssuancePendingLabel(records[0])).toBe('Documento emitido pendente de importação')
  })

  it('distingue número oficial ausente de documento ainda não importado', () => {
    expect(getIssuancePendingLabel(makeRecord({
      status: 'Proposta Emitida',
      issueDate: '2026-07-12',
    }))).toBe('Número da apólice pendente')
    expect(getIssuancePendingLabel(makeRecord({
      status: 'Proposta Emitida',
      issueDate: '2026-07-12',
      policyNumber: '12345',
    }))).toBeUndefined()
  })

  it('encerra a pendência ao receber o número e ignora endosso recusado', () => {
    const emitido = makeRecord({
      id: 'endosso-emitido',
      proposalType: 'Endosso',
      apoliceId: 'apolice-1',
      status: 'Proposta Emitida',
      endorsementNumber: 'END-123',
    })
    const recusado = makeRecord({
      id: 'endosso-recusado',
      proposalType: 'Endosso',
      apoliceId: 'apolice-1',
      status: 'Recusada',
    })

    expect(getPolicyOperationalStatus('apolice-1', [emitido, recusado])).toBeUndefined()
  })

  it('agrupa documentos sob uma única apólice e não anexa órfãos silenciosamente', () => {
    const policy = makeRecord({
      id: 'apolice-1',
      entityType: 'apolice',
      currentStatus: 'Vigente',
    })
    const endorsement = makeRecord({
      id: 'endosso-1',
      proposalType: 'Endosso',
      apoliceId: policy.id,
    })
    const invoice = makeRecord({
      id: 'fatura-1',
      proposalType: 'Fatura',
      apoliceId: policy.id,
    })
    const orphan = makeRecord({ id: 'orfao-1', apoliceId: 'apolice-inexistente' })

    const tree = buildPolicyTree([policy, endorsement, invoice, orphan])

    expect(tree).toHaveLength(1)
    expect(tree[0].policy.id).toBe(policy.id)
    expect(tree[0].documents.map(({ document }) => document.id)).toEqual([
      'endosso-1',
      'fatura-1',
    ])
    expect(tree[0].regularDocuments).toHaveLength(1)
    expect(tree[0].invoices).toHaveLength(1)
  })

  it('revela o pai quando somente um documento filho atende ao filtro', () => {
    const policy = makeRecord({ id: 'apolice-1', entityType: 'apolice' })
    const matching = makeRecord({ id: 'endosso-match', apoliceId: policy.id })
    const hidden = makeRecord({ id: 'endosso-hidden', apoliceId: policy.id })

    const tree = buildPolicyTree([matching], [policy, matching, hidden])

    expect(tree).toHaveLength(1)
    expect(tree[0].policy.id).toBe(policy.id)
    expect(tree[0].documents.map(({ document }) => document.id)).toEqual(['endosso-match'])
  })

  it('ordena faturas por competência mais recente', () => {
    const policy = makeRecord({ id: 'apolice-1', entityType: 'apolice' })
    const may = makeRecord({
      id: 'fatura-maio',
      proposalType: 'Fatura',
      apoliceId: policy.id,
      competenceStart: '2026-05-01',
      competenceEnd: '2026-05-31',
    })
    const june = makeRecord({
      id: 'fatura-junho',
      proposalType: 'Fatura',
      apoliceId: policy.id,
      competenceStart: '2026-06-01',
      competenceEnd: '2026-06-30',
    })

    const tree = buildPolicyTree([policy, may, june])

    expect(tree[0].invoices.map(({ document }) => document.id)).toEqual([
      'fatura-junho',
      'fatura-maio',
    ])
  })

  it('mapeia natureza do endosso e separa o efeito financeiro', () => {
    expect(getMovementLabel(makeRecord({
      proposalType: 'Endosso',
      endorsementMovement: 'inclusao_item',
    }))).toBe('Inclusão')
    expect(getMovementLabel(makeRecord({
      proposalType: 'Endosso',
      endorsementMovement: 'substituicao_item',
    }))).toBe('Substituição')
    expect(getDocumentFinancialEffect(makeRecord({
      proposalType: 'Endosso',
      totalPremium: 0,
    }))).toBe('Sem movimento')
    expect(getDocumentFinancialEffect(makeRecord({
      proposalType: 'Endosso',
      totalPremium: 250,
    }))).toBe('Acréscimo')
    expect(getDocumentFinancialEffect(makeRecord({
      proposalType: 'Cancelamento',
      totalPremium: -180,
    }))).toBe('Restituição')
  })

  it('lista todos os níveis controlados pela ação de expandir tudo', () => {
    const policy = makeRecord({ id: 'apolice-1', entityType: 'apolice' })
    const endorsement = makeRecord({
      id: 'endosso-1',
      proposalType: 'Endosso',
      apoliceId: policy.id,
    })
    const invoice = makeRecord({
      id: 'fatura-1',
      proposalType: 'Fatura',
      apoliceId: policy.id,
    })
    const [row] = buildPolicyTree([policy, endorsement, invoice])

    expect(getPolicyExpansionIds(row)).toEqual([
      'apolice-1',
      'endosso-1',
      'invoices:apolice-1',
      'fatura-1',
    ])
  })

  it('preserva Endosso 0 quando esse é o número oficial da emissão original', () => {
    expect(getDocumentNumber(makeRecord({ endorsementNumber: '0', proposalNumber: 'PROP-1' }))).toBe('0')
  })

  it('abre o último documento emitido e já vigente, ignorando pendente e recusado', () => {
    const policy = makeRecord({ id: 'apolice-1', entityType: 'apolice' })
    const original = makeRecord({
      id: 'original', apoliceId: policy.id, status: 'Proposta Emitida', issueDate: '2026-01-01', vigenciaInicial: '2026-01-01',
    })
    const effectiveEndorsement = makeRecord({
      id: 'endosso-vigente', apoliceId: policy.id, proposalType: 'Endosso', status: 'Proposta Emitida', issueDate: '2026-06-01', vigenciaInicial: '2026-06-15',
    })
    const pending = makeRecord({
      id: 'endosso-pendente', apoliceId: policy.id, proposalType: 'Endosso', status: 'Em Análise', vigenciaInicial: '2026-07-01',
    })
    const refused = makeRecord({
      id: 'endosso-recusado', apoliceId: policy.id, proposalType: 'Endosso', status: 'Recusada', issueDate: '2026-07-02', vigenciaInicial: '2026-07-02',
    })
    const [row] = buildPolicyTree([policy, original, effectiveEndorsement, pending, refused])

    expect(getCurrentPolicyDocument(row, new Date('2026-07-11T12:00:00Z'))?.id).toBe('endosso-vigente')
  })

  it('em mensal usa a competência vigente emitida ou a última competência emitida', () => {
    const policy = makeRecord({ id: 'apolice-1', entityType: 'apolice', isMonthly: true })
    const june = makeRecord({
      id: 'junho', apoliceId: policy.id, proposalType: 'Fatura', status: 'Proposta Emitida', issueDate: '2026-06-02', competenceStart: '2026-06-01', competenceEnd: '2026-06-30',
    })
    const julyPending = makeRecord({
      id: 'julho', apoliceId: policy.id, proposalType: 'Fatura', status: 'Pendente', competenceStart: '2026-07-01', competenceEnd: '2026-07-31',
    })
    const [row] = buildPolicyTree([policy, june, julyPending])

    expect(getCurrentPolicyDocument(row, new Date('2026-07-11T12:00:00Z'))?.id).toBe('junho')
  })

  it('em apólice simples ainda abre a proposta pendente quando não há emissão anterior', () => {
    const policy = makeRecord({ id: 'apolice-1', entityType: 'apolice' })
    const pending = makeRecord({ id: 'proposta-pendente', apoliceId: policy.id, status: 'Pendente' })
    const [row] = buildPolicyTree([policy, pending])

    expect(getCurrentPolicyDocument(row, new Date('2026-07-11T12:00:00Z'))?.id).toBe('proposta-pendente')
  })

  it('exibe a identificação do contrato e prioriza endosso pendente no Painel', () => {
    const policy = makeRecord({
      id: 'apolice-1',
      entityType: 'apolice',
      policyNumber: '12345',
      currentStatus: 'Vigente',
    })
    const issued = makeRecord({
      id: 'original',
      apoliceId: policy.id,
      policyNumber: policy.policyNumber,
      proposalNumber: 'PROP-1',
      status: 'Proposta Emitida',
      issueDate: '2026-01-01',
    })
    const pendingEndorsement = makeRecord({
      id: 'endosso-pendente',
      apoliceId: policy.id,
      policyNumber: policy.policyNumber,
      proposalType: 'Endosso',
      proposalNumber: 'PROP-END-2',
      status: 'Em Análise',
    })
    const [row] = buildPolicyTree([policy, issued, pendingEndorsement])

    expect(getPolicyStatusReference(row)).toEqual({
      policyLabel: 'Ap-12345',
      documentLabel: 'P. End. PROP-END-2',
      pending: true,
    })
  })

  it('usa P para proposta pendente e Ap para apólice emitida', () => {
    const pendingPolicy = makeRecord({ id: 'apolice-pendente', entityType: 'apolice' })
    const pendingProposal = makeRecord({
      id: 'proposta-pendente',
      apoliceId: pendingPolicy.id,
      proposalNumber: 'PROP-9',
    })
    const [pendingRow] = buildPolicyTree([pendingPolicy, pendingProposal])

    expect(getPolicyStatusReference(pendingRow).documentLabel).toBe('P-PROP-9')

    const issuedPolicy = makeRecord({
      id: 'apolice-emitida',
      entityType: 'apolice',
      policyNumber: 'AP-88',
    })
    const issuedProposal = makeRecord({
      id: 'proposta-emitida',
      apoliceId: issuedPolicy.id,
      policyNumber: issuedPolicy.policyNumber,
      status: 'Proposta Emitida',
      issueDate: '2026-01-01',
    })
    const [issuedRow] = buildPolicyTree([issuedPolicy, issuedProposal])

    expect(getPolicyStatusReference(issuedRow).policyLabel).toBe('Ap-AP-88')
  })
})
