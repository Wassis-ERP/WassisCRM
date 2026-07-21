import { beforeEach, describe, expect, it } from 'vitest'

import type { ApoliceRow, PosVendaRow } from '../../types/database'
import {
  createPosVendaAtomic,
  maintainPosVendaAtomic,
  movePosVendaStageAtomic,
  type PosVendaContext,
  type PosVendaStore,
} from './domain'

const APOLICE_BASE: ApoliceRow = {
  id: 'apolice-auto',
  segurado_id: 'segurado-1',
  seguradora_id: 'seguradora-1',
  ramo_id: 'ramo-auto',
  status: 'VIGENTE',
  renovada_de_id: null,
  produtor_id: null,
  numero_apolice: 'AUTO-001',
  numero_controle_documento: null,
  tipo_contratacao: null,
  tipo_apolice: null,
  certificado_individual: null,
  processo_susep: null,
  estipulante_nome: null,
  estipulante_cpf_cnpj: null,
  subestipulante_nome: null,
  subestipulante_cpf_cnpj: null,
  vigencia_inicio: '2026-07-01',
  vigencia_fim: '2027-07-01',
  vigencia_inicio_hora: null,
  vigencia_fim_hora: null,
  data_emissao: '2026-07-01',
  data_recebimento_documento: null,
  premio_total: null,
  premio_liquido: null,
  iof: null,
  adicional_fracionamento: null,
  lmg_total: null,
  moeda: 'BRL',
  periodicidade_pagamento: null,
  motivo_status: null,
  canal_emissao: null,
  observacoes: null,
}

function makeStore(): PosVendaStore {
  return {
    apolices: [
      APOLICE_BASE,
      { ...APOLICE_BASE, id: 'apolice-mensal', ramo_id: 'ramo-mensal', numero_apolice: 'MENSAL-001' },
      { ...APOLICE_BASE, id: 'apolice-cancelada', status: 'CANCELADA', numero_apolice: 'CANCELADA-001' },
    ],
    segurados: [{ id: 'segurado-1', filial_id: 'filial-1', nome: 'Empresa Segurada' }],
    ramos: [
      { id: 'ramo-auto', nome: 'Automóvel', is_monthly: false },
      { id: 'ramo-mensal', nome: 'Benefícios', is_monthly: true },
    ],
    pipelines: [
      { id: 'pipeline-onboarding', nome: 'Pós-venda · Onboarding', entidade_tipo: 'pos_venda', ativo: true, filial_id: 'filial-1' },
      { id: 'pipeline-mensal', nome: 'Pós-venda · Acompanhamento mensal', entidade_tipo: 'pos_venda', ativo: true, filial_id: 'filial-1' },
      { id: 'pipeline-outro', nome: 'Outro funil', entidade_tipo: 'oportunidade', ativo: true, filial_id: 'filial-1' },
    ],
    stages: [
      { id: 'onboarding-2', pipeline_id: 'pipeline-onboarding', ordem: 2, ativo: true },
      { id: 'onboarding-1', pipeline_id: 'pipeline-onboarding', ordem: 1, ativo: true },
      { id: 'mensal-1', pipeline_id: 'pipeline-mensal', ordem: 1, ativo: true },
      { id: 'outro-1', pipeline_id: 'pipeline-outro', ordem: 1, ativo: true },
    ],
    profiles: [
      { id: 'usuario-1', tenant_id: 'tenant-1' },
      { id: 'usuario-2', tenant_id: 'tenant-1' },
    ],
    posVendas: [],
    atividades: [],
    auditLogs: [],
  }
}

function makeContext(pipelineId = 'pipeline-onboarding'): PosVendaContext {
  let sequence = 0
  return {
    tenantId: 'tenant-1',
    filialId: 'filial-1',
    sessionUserId: 'usuario-1',
    pipelineId,
    now: () => '2026-07-16T12:00:00.000Z',
    newId: () => `id-${++sequence}`,
  }
}

function createOnboarding(store: PosVendaStore): PosVendaRow {
  return createPosVendaAtomic(store, {
    apoliceId: 'apolice-auto',
    assunto: 'Boas-vindas após emissão',
  }, makeContext()).posVenda
}

describe('Pós-venda sobre Apólice', () => {
  let store: PosVendaStore

  beforeEach(() => {
    store = makeStore()
  })

  it('cria onboarding na primeira etapa, com atividade e contrato v2.4', () => {
    const result = createPosVendaAtomic(store, {
      apoliceId: 'apolice-auto',
      assunto: 'Boas-vindas após emissão',
      descricao: 'Orientar sobre os canais de atendimento.',
    }, makeContext())

    expect(result.processo).toBe('ONBOARDING')
    expect(result.posVenda).toMatchObject({
      apolice_id: 'apolice-auto',
      stage_id: 'onboarding-1',
      responsavel_id: 'usuario-1',
      status: null,
      tipo_processo: null,
    })
    expect(result.posVenda).not.toHaveProperty('oportunidade_id')
    expect(result.posVenda).not.toHaveProperty('pipeline_id')
    expect(result.posVenda).not.toHaveProperty('metadata')
    expect(result.atividade).toMatchObject({ entidade_tipo: 'pos_venda', recorrente: false, tipo: 'tarefa' })
    expect(result.auditCount).toBeGreaterThan(0)
  })

  it('exige uma Apólice válida e vigente', () => {
    expect(() => createPosVendaAtomic(store, { apoliceId: '', assunto: 'Teste' }, makeContext()))
      .toThrow('Selecione uma Apólice válida')
    expect(() => createPosVendaAtomic(store, { apoliceId: 'apolice-cancelada', assunto: 'Teste' }, makeContext()))
      .toThrow('Somente Apólices vigentes')
  })

  it('cria acompanhamento recorrente apenas para ramo faturável', () => {
    const result = createPosVendaAtomic(store, {
      apoliceId: 'apolice-mensal',
      assunto: 'Acompanhamento da competência',
    }, makeContext('pipeline-mensal'))

    expect(result.processo).toBe('ACOMPANHAMENTO_MENSAL')
    expect(result.atividade).toMatchObject({ recorrente: true, tipo: 'followup' })
    expect(result.atividade?.vencimento).toBe('2026-08-16')
    expect(() => createPosVendaAtomic(store, {
      apoliceId: 'apolice-auto',
      assunto: 'Acompanhamento indevido',
    }, makeContext('pipeline-mensal'))).toThrow('somente para ramos faturáveis')
  })

  it('mantém os registros na mesma sessão do mock', () => {
    const created = createOnboarding(store)

    expect(store.posVendas.find((row) => row.id === created.id)?.apolice_id).toBe('apolice-auto')
    expect(store.atividades.some((row) => row.entidade_id === created.id)).toBe(true)
  })

  it('impede manutenção da Apólice vinculada', () => {
    const created = createOnboarding(store)
    const protectedPatch = { apolice_id: 'apolice-mensal' } as unknown as Parameters<typeof maintainPosVendaAtomic>[1]['patch']

    expect(() => maintainPosVendaAtomic(store, { id: created.id, patch: protectedPatch }, makeContext()))
      .toThrow('campo protegido')
    expect(store.posVendas[0].apolice_id).toBe('apolice-auto')
  })

  it('audita manutenção dos campos permitidos e do responsável', () => {
    const created = createOnboarding(store)
    const result = maintainPosVendaAtomic(store, {
      id: created.id,
      patch: { responsavel_id: 'usuario-2', prioridade: 'alta', observacoes: 'Contato confirmado.' },
    }, makeContext())

    expect(result.changedFields).toBe(3)
    expect(result.auditCount).toBe(3)
    expect(result.posVenda).toMatchObject({ responsavel_id: 'usuario-2', prioridade: 'alta' })
    expect(store.auditLogs.some((row) => row.campo === 'responsavel_id' && row.acao === 'UPDATE')).toBe(true)
  })

  it('move etapa somente dentro do funil atual, sem alterar Apólice ou status', () => {
    const created = createOnboarding(store)
    const result = movePosVendaStageAtomic(store, { id: created.id, toStageId: 'onboarding-2' }, makeContext())

    expect(result.posVenda).toMatchObject({ stage_id: 'onboarding-2', apolice_id: 'apolice-auto', status: null })
    expect(() => movePosVendaStageAtomic(store, { id: created.id, toStageId: 'mensal-1' }, makeContext()))
      .toThrow('não pertence ao funil atual')
  })

  it.each(['after-record', 'after-activity', 'audit'] as const)(
    'reverte criação atômica quando falha em %s',
    (failAt) => {
      const context = { ...makeContext(), failAt }

      expect(() => createPosVendaAtomic(store, {
        apoliceId: 'apolice-auto',
        assunto: 'Falha controlada',
      }, context)).toThrow('Falha simulada')
      expect(store.posVendas).toHaveLength(0)
      expect(store.atividades).toHaveLength(0)
      expect(store.auditLogs).toHaveLength(0)
    },
  )

  it('reverte manutenção e movimento quando a auditoria falha', () => {
    const created = createOnboarding(store)
    const beforeAudit = store.auditLogs.length

    expect(() => maintainPosVendaAtomic(store, {
      id: created.id,
      patch: { assunto: 'Não deve permanecer' },
    }, { ...makeContext(), failAt: 'audit' })).toThrow('Falha simulada de auditoria')
    expect(store.posVendas[0].assunto).toBe('Boas-vindas após emissão')
    expect(store.auditLogs).toHaveLength(beforeAudit)

    expect(() => movePosVendaStageAtomic(store, {
      id: created.id,
      toStageId: 'onboarding-2',
    }, { ...makeContext(), failAt: 'audit' })).toThrow('Falha simulada de auditoria')
    expect(store.posVendas[0].stage_id).toBe('onboarding-1')
    expect(store.auditLogs).toHaveLength(beforeAudit)
  })
})
