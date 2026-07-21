import { describe, expect, it } from 'vitest'
import { getTable } from '../../lib/inMemoryDb'
import {
  sinistroAdapter,
  sinistroStatusToCardStatus,
} from './adapter'

describe('sinistroAdapter contratual', () => {
  it('mapeia os status v2.4 apenas na camada visual do kanban', () => {
    expect(sinistroStatusToCardStatus('aberto')).toBe('pending')
    expect(sinistroStatusToCardStatus('reaberto')).toBe('pending')
    expect(sinistroStatusToCardStatus('encerrado_com_indenizacao')).toBe('won')
    expect(sinistroStatusToCardStatus('encerrado_sem_indenizacao')).toBe('lost')
    expect(sinistroStatusToCardStatus('cancelado')).toBe('lost')
  })

  it('deriva o funil pelas etapas e compoe o card pela apolice', async () => {
    const pipeline = getTable('pipelines').find((row) => row.entidade_tipo === 'sinistro')
    expect(pipeline).toBeDefined()

    const cards = await sinistroAdapter.fetchCards({
      pipelineId: String(pipeline?.id),
      tenantId: 'mock-tenant-id',
      filialId: 'mock-branch-id',
    })

    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({
      id: 'mock-sinistro-viaforte',
      pipelineId: pipeline?.id,
      status: 'pending',
      title: 'Viaforte Logística Ltda',
      responsavelName: 'Dev Wassis',
    })
    expect(cards[0].raw).not.toHaveProperty('pipeline_id')
    expect(cards[0].raw).not.toHaveProperty('oportunidade_id')
    expect(cards[0].raw).not.toHaveProperty('metadata')
  })

  it('mantem terceiro apenas em sinistro_envolvidos', () => {
    const terceiro = getTable('sinistro_envolvidos').find((row) => row.tipo === 'TERCEIRO')
    expect(terceiro).toMatchObject({
      sinistro_id: 'mock-sinistro-viaforte',
      apolice_item_id: null,
      nome: 'Carlos Eduardo Lima',
    })
    expect(
      getTable('segurados').some((row) => row.cpf_cnpj === terceiro?.cpf_cnpj),
    ).toBe(false)
  })

  it('move somente a etapa e registra auditoria tecnica', async () => {
    const sinistro = getTable('sinistros').find((row) => row.id === 'mock-sinistro-viaforte')
    const pipeline = getTable('pipelines').find((row) => row.entidade_tipo === 'sinistro')
    const nextStage = getTable('pipeline_stages').find(
      (row) => row.pipeline_id === pipeline?.id && row.nome === 'Em análise',
    )
    expect(sinistro).toBeDefined()
    expect(nextStage).toBeDefined()

    const originalStageId = String(sinistro?.stage_id)
    const auditCount = getTable('audit_logs').length
    await sinistroAdapter.updateStage({
      cardId: 'mock-sinistro-viaforte',
      toStageId: String(nextStage?.id),
      pipelineId: String(pipeline?.id),
    })

    expect(sinistro?.stage_id).toBe(nextStage?.id)
    expect(getTable('audit_logs')).toHaveLength(auditCount + 1)
    expect(getTable('audit_logs').at(-1)).toMatchObject({
      entidade_tipo: 'sinistro',
      entidade_id: 'mock-sinistro-viaforte',
      campo: 'stage_id',
      valor_antigo: originalStageId,
      valor_novo: nextStage?.id,
    })

    if (sinistro) sinistro.stage_id = originalStageId
  })
})
