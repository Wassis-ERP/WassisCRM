import { describe, expect, it } from 'vitest'
import {
  ContractOperationError,
  createDerivedDocument,
  createRenewalOpportunity,
  issueContractDocument,
  markPolicyNotRenewed,
  transmitRenewalOpportunity,
  type ContractTables,
} from './contractOperations'

function fixture(): ContractTables {
  return {
    policies: [{
      id: 'apolice-1', segurado_id: 'segurado-1', seguradora_id: 'seguradora-1', ramo_id: 'ramo-auto',
      status: 'VIGENTE', renovada_de_id: null, produtor_id: 'produtor-1', numero_apolice: 'AUTO-001',
      vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', premio_total: 1200, premio_liquido: 1100,
      motivo_status: null, observacoes: null, data_emissao: '2025-12-20',
    }],
    documents: [{
      id: 'documento-original', apolice_id: 'apolice-1', tipo: 'NOVA', cotacao_id: null, stage_id: 'emitida',
      responsavel_id: 'usuario-1', recebimento_grade_id: null, endosso_subtipo_id: null,
      cancelamento_motivo_id: null, numero_proposta: 'PROP-001', numero_endosso: null, numero_fatura: null,
      tipo_movimento_endosso: null, data_transmissao: '2025-12-10', data_emissao: '2025-12-20',
      vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', premio_total: 1200, premio_liquido: 1100,
      forma_pagamento: 'BOLETO', periodicidade_pagamento: 'MENSAL', qtd_parcelas: 12,
      primeira_parcela_vencimento: '2026-01-10', primeira_parcela_valor: 100, comissao_pct: 20, agenciamento_pct: null,
      competencia_inicio: null, competencia_fim: null, observacoes: null,
    }],
    opportunities: [],
    branches: [
      { id: 'ramo-auto', risk_type: 'VEICULO', is_monthly: false, renovavel: true, permite_endosso: true },
      { id: 'ramo-mensal', risk_type: 'VIDA', is_monthly: true, renovavel: true, permite_endosso: true },
    ],
    pipelines: [
      { id: 'pipeline-comercial', entidade_tipo: 'oportunidade', filial_id: null, ativo: true },
      { id: 'pipeline-proposta', entidade_tipo: 'proposta', filial_id: null, ativo: true },
    ],
    stages: [
      { id: 'prospeccao', pipeline_id: 'pipeline-comercial', nome: 'Prospecção', ativo: true },
      { id: 'analise', pipeline_id: 'pipeline-proposta', nome: 'Em análise', ativo: true },
      { id: 'emitida', pipeline_id: 'pipeline-proposta', nome: 'Emitida', ativo: true },
    ],
    subtypes: [
      { id: 'substituicao', tenant_id: 'tenant-1', filial_id: null, ramo_id: null, nome: 'Substituição', natureza_canonica: 'SUBSTITUICAO_ITEM', ordem: 10, ativo: true, observacoes: null },
      { id: 'dados', tenant_id: 'tenant-1', filial_id: null, ramo_id: null, nome: 'Alteração de dados', natureza_canonica: 'ALTERACAO_DADOS', ordem: 20, ativo: true, observacoes: null },
      { id: 'cobertura', tenant_id: 'tenant-1', filial_id: null, ramo_id: null, nome: 'Alteração de cobertura', natureza_canonica: 'ALTERACAO_COBERTURA', ordem: 30, ativo: true, observacoes: null },
    ],
    cancellationReasons: [
      { id: 'solicitacao', tenant_id: 'tenant-1', filial_id: null, ramo_id: null, nome: 'Solicitação do segurado', ordem: 10, ativo: true, observacoes: null },
    ],
    items: [{
      id: 'item-1', apolice_id: 'apolice-1', risk_type: 'VEICULO', incluido_por_proposta_id: 'documento-original',
      excluido_por_proposta_id: null, numero_item: 1, descricao: 'Veículo anterior', identificador_externo: 'ABC1D23',
      valor_risco: 50000, endereco_risco_resumo: null, status: 'vigente', observacoes: null,
    }],
    coverages: [{
      id: 'cobertura-1', apolice_item_id: 'item-1', cobertura_id: 'casco', incluido_por_proposta_id: 'documento-original',
      excluido_por_proposta_id: null, capital_lmi: 50000, franquia_valor: 2000, franquia_tipo: null,
      premio: 1000, premio_liquido: 900, carencia_dias: 0, participacao_obrigatoria_pct: null,
      vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', observacoes: null,
    }],
    specializations: [[{ apolice_item_id: 'item-1', marca: 'Ford', modelo: 'Ka' }], [], [], []],
    financialFacts: [[], [], []],
    auditLogs: [],
    pendingEffects: new Map(),
  }
}

function services(options: { failMaterialization?: boolean } = {}) {
  let sequence = 0
  const materialized: string[] = []
  return {
    value: {
      makeId: (scope: string) => `${scope}-${++sequence}`,
      today: () => '2026-07-12',
      materialize: (documentId: string) => {
        if (options.failMaterialization) throw new Error('Falha ao materializar')
        materialized.push(documentId)
      },
    },
    materialized,
  }
}

describe('contractOperations', () => {
  it('cria oportunidade de renovação e transmite uma sucessora sem alterar a antecessora', () => {
    const tables = fixture()
    const tool = services()
    const opportunity = createRenewalOpportunity(tables, {
      policyId: 'apolice-1', tenantId: 'tenant-1', filialId: 'filial-1', responsibleId: 'usuario-1',
    }, tool.value)

    expect(opportunity).toMatchObject({ apolice_origem_id: 'apolice-1', tipo_negocio: 'renovacao', status: 'pending' })
    const result = transmitRenewalOpportunity(tables, {
      opportunityId: opportunity.id, responsibleId: 'usuario-1', effectiveStart: '2027-01-01', effectiveEnd: '2027-12-31',
    }, tool.value)

    expect(result.policy).toMatchObject({ status: 'EM_EMISSAO', renovada_de_id: 'apolice-1' })
    expect(result.document).toMatchObject({ tipo: 'RENOVACAO', stage_id: 'analise' })
    expect(tables.policies[0].status).toBe('VIGENTE')
    expect(tables.items.some((item) => item.apolice_id === result.policy.id)).toBe(true)
    expect(opportunity.status).toBe('won')
  })

  it('efetiva a renovação e atualiza sucessora e antecessora atomicamente', () => {
    const tables = fixture()
    const tool = services()
    const opportunity = createRenewalOpportunity(tables, {
      policyId: 'apolice-1', tenantId: 'tenant-1', filialId: null, responsibleId: 'usuario-1',
    }, tool.value)
    const { policy, document } = transmitRenewalOpportunity(tables, {
      opportunityId: opportunity.id, responsibleId: 'usuario-1', effectiveStart: '2027-01-01', effectiveEnd: '2027-12-31',
    }, tool.value)
    policy.numero_apolice = 'AUTO-002'
    document.numero_proposta = 'REN-002'

    issueContractDocument(tables, { documentId: document.id }, tool.value)

    expect(policy.status).toBe('VIGENTE')
    expect(tables.policies[0].status).toBe('RENOVADA')
    expect(document).toMatchObject({ stage_id: 'emitida', data_emissao: '2026-07-12' })
    expect(tool.materialized).toEqual([document.id])
  })

  it('impede segunda oportunidade de renovação ativa', () => {
    const tables = fixture()
    const tool = services()
    const input = { policyId: 'apolice-1', tenantId: 'tenant-1', filialId: null, responsibleId: 'usuario-1' }
    createRenewalOpportunity(tables, input, tool.value)
    expect(() => createRenewalOpportunity(tables, input, tool.value)).toThrow('Já existe uma oportunidade')
  })

  it('registra endosso de substituição e preserva o item anterior como histórico', () => {
    const tables = fixture()
    const tool = services()
    const document = createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'ENDOSSO', responsibleId: 'usuario-1', issued: true,
      officialNumber: 'END-002', endorsementSubtypeId: 'substituicao', effectiveDate: '2026-08-01',
      totalPremium: 150, netPremium: 130, installmentCount: 1,
      endorsementEffect: { itemId: 'item-1', description: 'Veículo substituto', externalIdentifier: 'XYZ9Z99', riskValue: 62000 },
    }, tool.value)

    expect(document).toMatchObject({ tipo: 'ENDOSSO', tipo_movimento_endosso: 'SUBSTITUICAO_ITEM', stage_id: 'emitida' })
    expect(tables.items.find((item) => item.id === 'item-1')).toMatchObject({ excluido_por_proposta_id: document.id, status: 'historico' })
    expect(tables.items.find((item) => item.incluido_por_proposta_id === document.id)).toMatchObject({ descricao: 'Veículo substituto', status: 'vigente' })
    expect(tables.coverages.some((coverage) => coverage.incluido_por_proposta_id === document.id)).toBe(true)
    const replacement = tables.items.find((item) => item.incluido_por_proposta_id === document.id)
    expect(tables.specializations[0]).toContainEqual(expect.objectContaining({ apolice_item_id: replacement?.id, marca: 'Ford' }))
    expect(tool.materialized).toEqual([document.id])
  })

  it('salva endosso em análise sem aplicar efeito e o efetiva depois', () => {
    const tables = fixture()
    const tool = services()
    const document = createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'ENDOSSO', responsibleId: 'usuario-1', issued: false,
      officialNumber: 'END-003', endorsementSubtypeId: 'substituicao', effectiveDate: '2026-09-01',
      endorsementEffect: { itemId: 'item-1', description: 'Veículo futuro' },
    }, tool.value)
    expect(tables.items.find((item) => item.id === 'item-1')?.excluido_por_proposta_id).toBeNull()

    issueContractDocument(tables, { documentId: document.id }, tool.value)
    expect(tables.items.find((item) => item.id === 'item-1')?.excluido_por_proposta_id).toBe(document.id)
  })

  it('versiona cobertura por documento sem sobrescrever a linha histórica', () => {
    const tables = fixture()
    const tool = services()
    const document = createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'ENDOSSO', responsibleId: 'usuario-1', issued: true,
      officialNumber: 'END-004', endorsementSubtypeId: 'cobertura', effectiveDate: '2026-10-01',
      endorsementEffect: { itemId: 'item-1', coverageId: 'cobertura-1', coverageCapital: 65000, coveragePremium: 1150 },
    }, tool.value)

    expect(tables.coverages.find((row) => row.id === 'cobertura-1')?.excluido_por_proposta_id).toBe(document.id)
    expect(tables.coverages.find((row) => row.incluido_por_proposta_id === document.id)).toMatchObject({
      capital_lmi: 65000,
      premio: 1150,
      excluido_por_proposta_id: null,
    })
  })

  it('cancela contrato somente quando o documento é emitido', () => {
    const tables = fixture()
    const tool = services()
    const draft = createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'CANCELAMENTO', responsibleId: 'usuario-1', issued: false,
      officialNumber: 'CAN-001', cancellationReasonId: 'solicitacao', effectiveDate: '2026-08-01', totalPremium: -600,
    }, tool.value)
    expect(tables.policies[0].status).toBe('VIGENTE')

    issueContractDocument(tables, { documentId: draft.id }, tool.value)
    expect(tables.policies[0]).toMatchObject({ status: 'CANCELADA', motivo_status: 'Solicitação do segurado' })
  })

  it('aceita fatura apenas em ramo mensal e bloqueia competência sobreposta', () => {
    const tables = fixture()
    const tool = services()
    expect(() => createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'FATURA', responsibleId: 'usuario-1', issued: false,
      officialNumber: 'FAT-07', competenceStart: '2026-07-01', competenceEnd: '2026-07-31',
    }, tool.value)).toThrow('somente para ramos mensais')

    tables.policies[0].ramo_id = 'ramo-mensal'
    createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'FATURA', responsibleId: 'usuario-1', issued: false,
      officialNumber: 'FAT-07', competenceStart: '2026-07-01', competenceEnd: '2026-07-31',
    }, tool.value)
    expect(() => createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'FATURA', responsibleId: 'usuario-1', issued: false,
      officialNumber: 'FAT-08', competenceStart: '2026-07-15', competenceEnd: '2026-08-15',
    }, tool.value)).toThrow('competência sobreposta')
  })

  it('reverte documento e status quando a materialização falha', () => {
    const tables = fixture()
    const tool = services({ failMaterialization: true })
    tool.value.materialize = () => {
      tables.financialFacts[0].push({ id: 'parcela-parcial' })
      tables.auditLogs.push({ id: 'log-parcial' })
      throw new Error('Falha ao materializar')
    }
    expect(() => createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'CANCELAMENTO', responsibleId: 'usuario-1', issued: true,
      officialNumber: 'CAN-002', cancellationReasonId: 'solicitacao', effectiveDate: '2026-08-01', totalPremium: -300,
    }, tool.value)).toThrow('Falha ao materializar')
    expect(tables.documents).toHaveLength(1)
    expect(tables.policies[0].status).toBe('VIGENTE')
    expect(tables.financialFacts[0]).toHaveLength(0)
    expect(tables.auditLogs).toHaveLength(0)
  })

  it('marca não renovada com motivo sem excluir histórico', () => {
    const tables = fixture()
    const tool = services()
    markPolicyNotRenewed(tables, 'apolice-1', 'Cliente optou por outra corretora', tool.value)
    expect(tables.policies[0]).toMatchObject({ status: 'NAO_RENOVADA', motivo_status: 'Cliente optou por outra corretora' })
    expect(tables.documents).toHaveLength(1)
  })

  it('usa erro de domínio previsível para campos obrigatórios', () => {
    const tables = fixture()
    const tool = services()
    expect(() => createDerivedDocument(tables, {
      policyId: 'apolice-1', type: 'ENDOSSO', responsibleId: 'usuario-1', issued: true,
      officialNumber: '', endorsementSubtypeId: 'substituicao', effectiveDate: '2026-08-01',
    }, tool.value)).toThrow(ContractOperationError)
  })
})
