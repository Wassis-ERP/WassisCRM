import { describe, expect, it } from 'vitest'
import type { Database, SinistroEnvolvidoRow, SinistroRow } from '../../types/database'
import { executeSinistroOperationalInMemory, getTable } from '../../lib/inMemoryDb'
import {
  executeSinistroOperationalCommandAtomic,
  getSinistroOperationalActions,
  type SinistroOperationalContext,
  type SinistroOperationalStore,
} from './closure'

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']

function sinistro(status: SinistroRow['status'] = 'aberto'): SinistroRow {
  return {
    id: 'sinistro-1', apolice_id: 'apolice-1', stage_id: 'stage-1', responsavel_id: 'user-1',
    numero_sinistro: 'SIN-1', numero_aviso: 'AV-1', protocolo_seguradora: null,
    cobertura_codigo: null, cobertura_nome: null, data_ocorrencia: '2026-07-10',
    data_aviso: '2026-07-11', data_registro_aviso: '2026-07-11',
    data_documentacao_completa: null, data_liquidacao_financeira: null,
    data_conclusao: null, tipo_sinistro: 'administrativo', causa: null,
    descricao: 'Evento', local_ocorrencia: null, status, valor_estimado: 10_000,
    valor_indenizado: null, valor_pendente: 10_000, valor_despesas_regulacao: null,
    valor_salvado: null, data_salvado: null, valor_ressarcimento: null,
    data_ressarcimento: null, negativa_motivo: null, regulador_nome: null,
    oficina_nome: null, observacoes: null,
  }
}

function segurado(): SinistroEnvolvidoRow {
  return {
    id: 'envolvido-1', sinistro_id: 'sinistro-1', apolice_item_id: 'item-1', tipo: 'SEGURADO',
    nome: 'Segurado', cpf_cnpj: null, email: null, telefone: null, placa: null,
    seguradora_terceiro: null, apolice_terceiro: null, tipo_dano: null,
    valor_reclamado: null, valor_indenizado: null, responsavel_pelo_evento: false,
    observacoes: null,
  }
}

function store(status: SinistroRow['status'] = 'aberto'): SinistroOperationalStore {
  return { sinistros: [sinistro(status)], envolvidos: [segurado()], auditLogs: [] }
}

function context(): SinistroOperationalContext {
  let sequence = 0
  return {
    tenantId: 'tenant-1', sessionUserId: 'user-1', now: () => '2026-07-16T12:00:00.000Z',
    newId: () => `audit-${++sequence}`,
  }
}

const common = {
  data_documentacao_completa: '2026-07-12',
  data_conclusao: '2026-07-16',
  valor_despesas_regulacao: 350,
  valor_salvado: 500,
  data_salvado: '2026-07-14',
  valor_ressarcimento: 250,
  data_ressarcimento: '2026-07-15',
}

describe('fechamento operacional de Sinistros', () => {
  it('conclui sem indenização, preserva apólice/etapa e audita anterior/novo', () => {
    const data = store()
    const result = executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_SEM_INDENIZACAO', ...common,
      valor_indenizado: 0, data_liquidacao_financeira: null,
    }, context())
    expect(result.sinistro).toMatchObject({
      apolice_id: 'apolice-1', stage_id: 'stage-1', status: 'encerrado_sem_indenizacao',
      valor_indenizado: 0, data_liquidacao_financeira: null,
    })
    expect(result.auditLogs).toEqual(expect.arrayContaining([
      expect.objectContaining({ campo: 'status', valor_antigo: 'aberto', valor_novo: 'encerrado_sem_indenizacao' }),
      expect.objectContaining({ campo: 'valor_despesas_regulacao', valor_antigo: null, valor_novo: '350' }),
    ]))
  })

  it('conclui com indenização somente com datas coerentes e valor positivo', () => {
    const data = store()
    const result = executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_COM_INDENIZACAO', ...common,
      data_liquidacao_financeira: '2026-07-15', valor_indenizado: 8_000,
    }, context())
    expect(result.sinistro).toMatchObject({
      status: 'encerrado_com_indenizacao', valor_indenizado: 8_000,
      data_documentacao_completa: '2026-07-12', data_liquidacao_financeira: '2026-07-15',
      data_conclusao: '2026-07-16',
    })
  })

  it('exige documentação e liquidação para conclusão com indenização', () => {
    expect(() => executeSinistroOperationalCommandAtomic(store(), {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_COM_INDENIZACAO', ...common,
      data_documentacao_completa: null, data_liquidacao_financeira: '2026-07-15',
      valor_indenizado: 8_000,
    }, context())).toThrow(/documentação completa/i)
    expect(() => executeSinistroOperationalCommandAtomic(store(), {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_COM_INDENIZACAO', ...common,
      data_liquidacao_financeira: null, valor_indenizado: 8_000,
    }, context())).toThrow(/liquidação financeira/i)
  })

  it('bloqueia negativa sem motivo e conclui negativa com motivo aparado', () => {
    expect(() => executeSinistroOperationalCommandAtomic(store(), {
      sinistroId: 'sinistro-1', action: 'NEGAR', ...common, negativa_motivo: '   ',
    }, context())).toThrow(/motivo da negativa/i)

    const data = store()
    executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'NEGAR', ...common,
      negativa_motivo: '  Cobertura não contratada  ',
    }, context())
    expect(data.sinistros[0]).toMatchObject({
      status: 'encerrado_sem_indenizacao', negativa_motivo: 'Cobertura não contratada',
      valor_indenizado: 0,
    })
  })

  it.each([
    [{ ...common, data_conclusao: null }, /data de conclusão/i],
    [{ ...common, data_documentacao_completa: '2026-07-17' }, /documentação completa não pode ser posterior/i],
    [{ ...common, data_salvado: null }, /data do salvado/i],
    [{ ...common, valor_ressarcimento: Number.NaN }, /ressarcimento deve ser finito/i],
    [{ ...common, data_conclusao: '2026-02-31' }, /data válida/i],
  ])('bloqueia datas e valores finais inválidos', (fields, error) => {
    expect(() => executeSinistroOperationalCommandAtomic(store(), {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_SEM_INDENIZACAO', ...fields,
    }, context())).toThrow(error)
  })

  it('bloqueia inconsistência entre encerramento e valor indenizado', () => {
    expect(() => executeSinistroOperationalCommandAtomic(store(), {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_SEM_INDENIZACAO', ...common,
      valor_indenizado: 1,
    }, context())).toThrow(/igual a zero/i)
    expect(() => executeSinistroOperationalCommandAtomic(store(), {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_COM_INDENIZACAO', ...common,
      data_liquidacao_financeira: '2026-07-15', valor_indenizado: 0,
    }, context())).toThrow(/maior que zero/i)
  })

  it('permite cancelar somente estado ativo', () => {
    const data = store('reaberto')
    Object.assign(data.sinistros[0], {
      valor_indenizado: 4_000,
      data_liquidacao_financeira: '2026-07-15',
      negativa_motivo: 'Histórico preservado',
    })
    executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CANCELAR', data_conclusao: '2026-07-16',
    }, context())
    expect(data.sinistros[0]).toMatchObject({
      status: 'cancelado', data_conclusao: '2026-07-16', valor_indenizado: 4_000,
      data_liquidacao_financeira: '2026-07-15', negativa_motivo: 'Histórico preservado',
    })
    expect(() => executeSinistroOperationalCommandAtomic(store('cancelado'), {
      sinistroId: 'sinistro-1', action: 'CANCELAR', data_conclusao: '2026-07-16',
    }, context())).toThrow(/transição não é permitida/i)
  })

  it.each(['encerrado_sem_indenizacao', 'encerrado_com_indenizacao', 'cancelado'] as const)(
    'reabre %s preservando histórico e campos finais',
    (status) => {
      const data = store(status)
      Object.assign(data.sinistros[0], {
        data_documentacao_completa: '2026-07-12', data_liquidacao_financeira: '2026-07-15',
        data_conclusao: '2026-07-16', valor_indenizado: 8_000,
        negativa_motivo: 'Histórico anterior',
      })
      executeSinistroOperationalCommandAtomic(data, {
        sinistroId: 'sinistro-1', action: 'REABRIR',
      }, context())
      expect(data.sinistros[0]).toMatchObject({
        status: 'reaberto', data_documentacao_completa: '2026-07-12',
        data_liquidacao_financeira: '2026-07-15', data_conclusao: '2026-07-16',
        valor_indenizado: 8_000, negativa_motivo: 'Histórico anterior',
      })
    },
  )

  it('bloqueia reabertura de estado ativo e expõe somente ações elegíveis', () => {
    expect(getSinistroOperationalActions('aberto')).not.toContain('REABRIR')
    expect(getSinistroOperationalActions('cancelado')).toEqual(['REABRIR'])
    expect(() => executeSinistroOperationalCommandAtomic(store('reaberto'), {
      sinistroId: 'sinistro-1', action: 'REABRIR',
    }, context())).toThrow(/transição não é permitida/i)
  })

  it('exige reabertura antes de corrigir valor indenizado e permite nova conclusão', () => {
    const data = store('encerrado_com_indenizacao')
    Object.assign(data.sinistros[0], {
      data_documentacao_completa: '2026-07-12', data_liquidacao_financeira: '2026-07-15',
      data_conclusao: '2026-07-16', valor_indenizado: 7_000,
    })
    expect(() => executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_COM_INDENIZACAO', ...common,
      data_liquidacao_financeira: '2026-07-16', data_conclusao: '2026-07-17',
      valor_indenizado: 8_000,
    }, context())).toThrow(/transição não é permitida/i)
    executeSinistroOperationalCommandAtomic(data, { sinistroId: 'sinistro-1', action: 'REABRIR' }, context())
    executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CONCLUIR_COM_INDENIZACAO', ...common,
      data_liquidacao_financeira: '2026-07-16', data_conclusao: '2026-07-17',
      valor_indenizado: 8_000,
    }, context())
    expect(data.sinistros[0]).toMatchObject({ status: 'encerrado_com_indenizacao', valor_indenizado: 8_000 })
  })

  it('permite negativa após reabrir indenização e audita a limpeza financeira operacional', () => {
    const data = store('encerrado_com_indenizacao')
    Object.assign(data.sinistros[0], {
      data_documentacao_completa: '2026-07-12',
      data_liquidacao_financeira: '2026-07-15',
      data_conclusao: '2026-07-16',
      valor_indenizado: 7_000,
    })
    executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'REABRIR',
    }, context())
    const result = executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'NEGAR', ...common,
      data_liquidacao_financeira: null, valor_indenizado: null,
      negativa_motivo: 'Cobertura não contratada',
    }, context())
    expect(result.sinistro).toMatchObject({
      status: 'encerrado_sem_indenizacao', valor_indenizado: 0,
      data_liquidacao_financeira: null, negativa_motivo: 'Cobertura não contratada',
    })
    expect(result.auditLogs).toEqual(expect.arrayContaining([
      expect.objectContaining({ campo: 'valor_indenizado', valor_antigo: '7000', valor_novo: '0' }),
      expect.objectContaining({ campo: 'data_liquidacao_financeira', valor_antigo: '2026-07-15', valor_novo: null }),
    ]))
  })

  it('bloqueia operação sem envolvido segurado', () => {
    const data = store()
    data.envolvidos = [{ ...segurado(), tipo: 'TERCEIRO', apolice_item_id: null }]
    expect(() => executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CANCELAR', data_conclusao: '2026-07-16',
    }, context())).toThrow(/envolvido Segurado/i)
  })

  it('restaura integralmente se a atualização falhar', () => {
    const data = store()
    const original = data.sinistros[0]
    data.sinistros[0] = new Proxy(original, {
      set(target, property, value, receiver) {
        if (property === 'status') throw new Error('Falha de atualização simulada')
        return Reflect.set(target, property, value, receiver)
      },
    })
    expect(() => executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CANCELAR', data_conclusao: '2026-07-16',
    }, context())).toThrow(/atualização simulada/i)
    expect(data.sinistros[0]).toEqual(sinistro())
    expect(data.auditLogs).toHaveLength(0)
  })

  it('restaura integralmente se a auditoria falhar', () => {
    const data = store()
    const rawAudits: AuditLogRow[] = []
    data.auditLogs = new Proxy(rawAudits, {
      get(target, property, receiver) {
        if (property === 'push') return () => { throw new Error('Falha de auditoria simulada') }
        return Reflect.get(target, property, receiver)
      },
    })
    expect(() => executeSinistroOperationalCommandAtomic(data, {
      sinistroId: 'sinistro-1', action: 'CANCELAR', data_conclusao: '2026-07-16',
    }, context())).toThrow(/auditoria simulada/i)
    expect(data.sinistros[0]).toEqual(sinistro())
    expect(rawAudits).toHaveLength(0)
  })

  it('persiste na mesma sessão do mock sem campos funcionais legados', () => {
    const sinistros = getTable('sinistros') as unknown as SinistroRow[]
    const envolvidos = getTable('sinistro_envolvidos') as unknown as SinistroEnvolvidoRow[]
    const auditLogs = getTable('audit_logs') as unknown as AuditLogRow[]
    const persistentSinistro = { ...sinistro(), id: 'sinistro-persistencia-4.1c' }
    const persistentInsured = { ...segurado(), id: 'envolvido-persistencia-4.1c', sinistro_id: persistentSinistro.id }
    const originalAuditLength = auditLogs.length
    sinistros.push(persistentSinistro)
    envolvidos.push(persistentInsured)
    try {
      executeSinistroOperationalInMemory({
        sinistroId: persistentSinistro.id, action: 'CANCELAR', data_conclusao: '2026-07-16',
      }, { tenantId: 'tenant-1', sessionUserId: 'user-1' })
      const persisted = (getTable('sinistros') as unknown as SinistroRow[])
        .find((row) => row.id === persistentSinistro.id)
      expect(persisted).toMatchObject({ status: 'cancelado', data_conclusao: '2026-07-16' })
      expect(persisted).not.toHaveProperty('oportunidade_id')
      expect(persisted).not.toHaveProperty('pipeline_id')
      expect(persisted).not.toHaveProperty('metadata')
    } finally {
      sinistros.splice(sinistros.findIndex((row) => row.id === persistentSinistro.id), 1)
      envolvidos.splice(envolvidos.findIndex((row) => row.id === persistentInsured.id), 1)
      auditLogs.splice(originalAuditLength)
    }
  })
})
