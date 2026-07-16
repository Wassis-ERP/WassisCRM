import { describe, expect, it } from 'vitest'
import type { Database } from '../../types/database'
import {
  createSinistroAtomic,
  filterApolicesForSinistro,
  type ApoliceSinistroOption,
  type SinistroAberturaInput,
  type SinistroCreationStore,
} from './opening'

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']

const policyOption: ApoliceSinistroOption = {
  id: 'apolice-1',
  numero_apolice: 'PORTO-531-2026',
  status: 'EMITIDA',
  vigencia_inicio: '2026-01-01',
  vigencia_fim: '2026-12-31',
  segurado: {
    id: 'segurado-1',
    nome: 'José da Silva',
    cpf_cnpj: '123.456.789-01',
    filial_id: 'filial-1',
    email: 'jose@example.com',
    telefone: '11999999999',
  },
  seguradora: { id: 'seguradora-1', nome: 'Porto Seguro' },
  ramo: { id: 'ramo-1', nome: 'Automóvel', risk_type: 'VEICULO' },
  itens: [],
}

function makeStore(): SinistroCreationStore {
  return {
    apolices: [{
      id: 'apolice-1', segurado_id: 'segurado-1', seguradora_id: 'seguradora-1', ramo_id: 'ramo-1',
      status: 'EMITIDA', numero_apolice: 'PORTO-531-2026', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31',
    } as SinistroCreationStore['apolices'][number]],
    apoliceItens: [{
      id: 'item-1', apolice_id: 'apolice-1', risk_type: 'VEICULO', incluido_por_proposta_id: null,
      excluido_por_proposta_id: null, numero_item: 1, descricao: 'Veículo segurado', identificador_externo: 'ABC1D23',
      valor_risco: 100_000, endereco_risco_resumo: null, status: 'vigente', observacoes: null,
    }, {
      id: 'item-outra-apolice', apolice_id: 'apolice-2', risk_type: 'VEICULO', incluido_por_proposta_id: null,
      excluido_por_proposta_id: null, numero_item: 1, descricao: 'Outro veículo', identificador_externo: 'XYZ9Z99',
      valor_risco: 80_000, endereco_risco_resumo: null, status: 'vigente', observacoes: null,
    }],
    propostas: [],
    segurados: [{
      id: 'segurado-1', nome: 'José da Silva', cpf_cnpj: '12345678901', filial_id: 'filial-1',
      email: 'jose@example.com', telefone: '11999999999',
    } as SinistroCreationStore['segurados'][number]],
    pipelines: [{
      id: 'pipeline-1', entidade_tipo: 'sinistro', ativo: true, ordem: 10,
    } as SinistroCreationStore['pipelines'][number]],
    stages: [{
      id: 'stage-2', pipeline_id: 'pipeline-1', ativo: true, ordem: 20,
    } as SinistroCreationStore['stages'][number], {
      id: 'stage-1', pipeline_id: 'pipeline-1', ativo: true, ordem: 10,
    } as SinistroCreationStore['stages'][number]],
    profiles: [{
      id: 'user-1', full_name: 'Responsável', tenant_id: 'tenant-1',
    } as SinistroCreationStore['profiles'][number]],
    sinistros: [],
    envolvidos: [],
    auditLogs: [],
  }
}

function makeInput(overrides: Partial<SinistroAberturaInput> = {}): SinistroAberturaInput {
  return {
    apolice_id: 'apolice-1',
    responsavel_id: 'user-1',
    data_ocorrencia: '2026-07-10',
    data_aviso: '2026-07-11',
    data_registro_aviso: '2026-07-11',
    tipo_sinistro: 'administrativo',
    valor_estimado: 12_000,
    valor_pendente: 12_000,
    envolvidos: [{
      apolice_item_id: 'item-1', tipo: 'SEGURADO', nome: 'José da Silva', cpf_cnpj: '12345678901',
      email: 'jose@example.com', telefone: '11999999999', placa: 'ABC1D23', seguradora_terceiro: null,
      apolice_terceiro: null, tipo_dano: 'Danos materiais', valor_reclamado: 12_000, valor_indenizado: null,
      responsavel_pelo_evento: false, observacoes: null,
    }],
    ...overrides,
  }
}

function makeContext() {
  let sequence = 0
  return {
    tenantId: 'tenant-1',
    filialId: 'filial-1',
    sessionUserId: 'user-1',
    pipelineId: 'pipeline-1',
    today: '2026-07-15',
    now: () => '2026-07-15T12:00:00.000Z',
    newId: () => `new-${++sequence}`,
  }
}

describe('abertura contratual de Sinistros', () => {
  it('busca apólices pelos cinco critérios obrigatórios', () => {
    const policies = [policyOption]
    expect(filterApolicesForSinistro(policies, '531')).toHaveLength(1)
    expect(filterApolicesForSinistro(policies, 'Jose da Silva')).toHaveLength(1)
    expect(filterApolicesForSinistro(policies, '456789')).toHaveLength(1)
    expect(filterApolicesForSinistro(policies, 'Porto Seguro')).toHaveLength(1)
    expect(filterApolicesForSinistro(policies, 'Automovel')).toHaveLength(1)
    expect(filterApolicesForSinistro(policies, 'Residencial')).toHaveLength(0)
  })

  it('bloqueia apólice recusada', () => {
    const store = makeStore()
    store.apolices[0].status = 'RECUSADA'
    expect(() => createSinistroAtomic(store, makeInput(), makeContext())).toThrow(/recusadas/i)
    expect(store.sinistros).toHaveLength(0)
  })

  it('valida a ocorrência contra a vigência da apólice', () => {
    const store = makeStore()
    expect(() => createSinistroAtomic(
      store,
      makeInput({ data_ocorrencia: '2025-12-31' }),
      makeContext(),
    )).toThrow(/início da vigência/i)
  })

  it('bloqueia item pertencente a outra apólice', () => {
    const store = makeStore()
    const input = makeInput({
      envolvidos: [{ ...makeInput().envolvidos[0], apolice_item_id: 'item-outra-apolice' }],
    })
    expect(() => createSinistroAtomic(store, input, makeContext())).toThrow(/não pertence à apólice/i)
  })

  it('exige pelo menos um segurado', () => {
    const store = makeStore()
    const terceiro = { ...makeInput().envolvidos[0], tipo: 'TERCEIRO' as const, apolice_item_id: null }
    expect(() => createSinistroAtomic(store, makeInput({ envolvidos: [terceiro] }), makeContext())).toThrow(/pelo menos um envolvido/i)
  })

  it('registra terceiro apenas em sinistro_envolvidos', () => {
    const store = makeStore()
    const insuredCount = store.segurados.length
    const terceiro = {
      ...makeInput().envolvidos[0],
      tipo: 'TERCEIRO' as const,
      apolice_item_id: null,
      nome: 'Terceiro Descritivo',
      cpf_cnpj: '98765432100',
      seguradora_terceiro: 'Outra Seguradora',
    }
    const result = createSinistroAtomic(store, makeInput({ envolvidos: [...makeInput().envolvidos, terceiro] }), makeContext())
    expect(store.segurados).toHaveLength(insuredCount)
    expect(result.envolvidos).toHaveLength(2)
    expect(result.envolvidos[1]).toMatchObject({ tipo: 'TERCEIRO', nome: 'Terceiro Descritivo', apolice_item_id: null })
  })

  it('cria aberto na primeira etapa e deriva o funil somente por stage_id', () => {
    const store = makeStore()
    const result = createSinistroAtomic(store, makeInput(), makeContext())
    expect(result.sinistro).toMatchObject({ status: 'aberto', stage_id: 'stage-1', apolice_id: 'apolice-1' })
    expect(result.sinistro).not.toHaveProperty('pipeline_id')
    expect(result.sinistro).not.toHaveProperty('oportunidade_id')
    expect(result.sinistro).not.toHaveProperty('metadata')
    expect(result.auditLogs).toHaveLength(2)
    expect(result.auditLogs.map((audit) => audit.acao)).toEqual(['INSERT', 'INSERT'])
  })

  it('faz rollback do Sinistro e dos envolvidos quando a auditoria falha', () => {
    const store = makeStore()
    const auditRows: AuditLogRow[] = []
    store.auditLogs = new Proxy(auditRows, {
      get(target, property, receiver) {
        if (property === 'push') return () => { throw new Error('Falha de auditoria simulada') }
        return Reflect.get(target, property, receiver)
      },
    })

    expect(() => createSinistroAtomic(store, makeInput(), makeContext())).toThrow(/auditoria simulada/i)
    expect(store.sinistros).toHaveLength(0)
    expect(store.envolvidos).toHaveLength(0)
    expect(auditRows).toHaveLength(0)
  })

  it('não aceita terceiro vinculado a item mesmo com payload adulterado', () => {
    const store = makeStore()
    const terceiro = {
      ...makeInput().envolvidos[0], tipo: 'TERCEIRO' as const, apolice_item_id: 'item-1',
    }
    expect(() => createSinistroAtomic(store, makeInput({ envolvidos: [makeInput().envolvidos[0], terceiro] }), makeContext())).toThrow(/Terceiros não podem/i)
  })
})
