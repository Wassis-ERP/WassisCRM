import { describe, expect, it } from 'vitest'
import type { Proposal } from '../../types/proposta'
import {
  buildPolicyTree,
  getDocumentFinancialEffect,
  getMovementLabel,
  getPolicyExpansionIds,
  getPolicyOperationalStatus,
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
      endorsementMovement: 'sem_movimento',
    }))).toBe('Sem movimento')
    expect(getDocumentFinancialEffect(makeRecord({
      proposalType: 'Endosso',
      additionalPremium: 250,
    }))).toBe('Acréscimo')
    expect(getDocumentFinancialEffect(makeRecord({
      proposalType: 'Cancelamento',
      refundPremium: 180,
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
})
