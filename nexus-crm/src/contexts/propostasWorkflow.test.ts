import { describe, expect, it } from 'vitest'
import {
  getProposalWorkflowStages,
  moveProposalToStatus,
  refuseProposalDocument,
  type ProposalWorkflowTables,
} from './propostasWorkflow'

function workflow(documentType = 'NOVA', policyStatus = 'EM_EMISSAO'): ProposalWorkflowTables {
  return {
    activeBranchId: 'filial-atual',
    pipelines: [{ id: 'pipeline-proposta', entidade_tipo: 'proposta', filial_id: null, ativo: true }],
    stages: [
      { id: 'analise', pipeline_id: 'pipeline-proposta', nome: 'Em análise', cor: 'bg-yellow-400', ordem: 1, finaliza_com_sucesso: false, finaliza_com_perda: false, ativo: true },
      { id: 'emitida', pipeline_id: 'pipeline-proposta', nome: 'Emitida', cor: 'bg-green-400', ordem: 2, finaliza_com_sucesso: true, finaliza_com_perda: false, ativo: true },
      { id: 'recusada', pipeline_id: 'pipeline-proposta', nome: 'Recusada', cor: 'bg-red-400', ordem: 3, finaliza_com_sucesso: false, finaliza_com_perda: true, ativo: true },
    ],
    documents: [{ id: 'documento-1', apolice_id: 'apolice-1', tipo: documentType, stage_id: 'analise', data_recusa: null, motivo_recusa: null }],
    policies: [{ id: 'apolice-1', status: policyStatus }],
  }
}

describe('propostasWorkflow', () => {
  it('deriva as colunas do pipeline de proposta e preserva sua ordem', () => {
    const stages = getProposalWorkflowStages(workflow())
    expect(stages.map((stage) => [stage.name, stage.isLoss])).toEqual([
      ['Em Análise', false],
      ['Proposta Emitida', false],
      ['Recusada', true],
    ])
  })

  it('mover para Emitida altera somente o stage do documento', () => {
    const tables = workflow()
    expect(moveProposalToStatus(tables, 'documento-1', 'Proposta Emitida')).toBe(true)
    expect(tables.documents[0].stage_id).toBe('emitida')
    expect(tables.policies[0].status).toBe('EM_EMISSAO')
  })

  it('ignora etapa de pipeline pertencente a outra filial', () => {
    const tables = workflow()
    tables.pipelines = [{ id: 'pipeline-outra', entidade_tipo: 'proposta', filial_id: 'filial-outra', ativo: true }]
    tables.stages = [{ id: 'emitida-outra', pipeline_id: 'pipeline-outra', nome: 'Emitida', cor: null, ordem: 1, finaliza_com_sucesso: true, finaliza_com_perda: false, ativo: true }]
    expect(moveProposalToStatus(tables, 'documento-1', 'Proposta Emitida')).toBe(false)
    expect(tables.documents[0].stage_id).toBe('analise')
  })

  it('recusa proposta original e preserva a casca como historico', () => {
    const tables = workflow('NOVA', 'EM_EMISSAO')
    const result = refuseProposalDocument(tables, 'documento-1', {
      reason: 'Recusada pela seguradora',
      refusedAt: '2026-07-12',
    })
    expect(result).toEqual({ changed: true, policyRefused: true })
    expect(tables.documents[0]).toMatchObject({
      stage_id: 'recusada',
      data_recusa: '2026-07-12',
      motivo_recusa: 'Recusada pela seguradora',
    })
    expect(tables.policies[0].status).toBe('RECUSADA')
  })

  it('recusa endosso sem alterar a apolice vigente', () => {
    const tables = workflow('ENDOSSO', 'VIGENTE')
    const result = refuseProposalDocument(tables, 'documento-1')
    expect(result).toEqual({ changed: true, policyRefused: false })
    expect(tables.documents[0].stage_id).toBe('recusada')
    expect(tables.policies[0].status).toBe('VIGENTE')
  })
})
