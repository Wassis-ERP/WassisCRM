import { describe, expect, it } from 'vitest'
import type { Database, SinistroEnvolvidoRow, SinistroRow } from '../../types/database'
import {
  maintainSinistroAtomic,
  type SinistroEnvolvidoMaintenanceDraft,
  type SinistroMaintenanceStore,
} from './maintenance'

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']

function sinistro(): SinistroRow {
  return {
    id: 'sinistro-1', apolice_id: 'apolice-1', stage_id: 'stage-1', responsavel_id: 'user-1',
    numero_sinistro: null, numero_aviso: 'AV-1', protocolo_seguradora: null, cobertura_codigo: null,
    cobertura_nome: null, data_ocorrencia: '2026-07-10', data_aviso: '2026-07-11',
    data_registro_aviso: '2026-07-11', data_documentacao_completa: null,
    data_liquidacao_financeira: null, data_conclusao: null, tipo_sinistro: 'administrativo',
    causa: null, descricao: 'Descrição inicial', local_ocorrencia: null, status: 'aberto',
    valor_estimado: 10_000, valor_indenizado: null, valor_pendente: 10_000,
    valor_despesas_regulacao: null, valor_salvado: null, data_salvado: null,
    valor_ressarcimento: null, data_ressarcimento: null, negativa_motivo: null,
    regulador_nome: null, oficina_nome: null, observacoes: null,
  }
}

function segurado(): SinistroEnvolvidoRow {
  return {
    id: 'envolvido-segurado', sinistro_id: 'sinistro-1', apolice_item_id: 'item-1', tipo: 'SEGURADO',
    nome: 'Segurado', cpf_cnpj: '12345678901', email: null, telefone: null, placa: null,
    seguradora_terceiro: null, apolice_terceiro: null, tipo_dano: null, valor_reclamado: 10_000,
    valor_indenizado: null, responsavel_pelo_evento: false, observacoes: null,
  }
}

function store(): SinistroMaintenanceStore {
  return {
    apolices: [{ id: 'apolice-1', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31' } as SinistroMaintenanceStore['apolices'][number]],
    apoliceItens: [
      { id: 'item-1', apolice_id: 'apolice-1' },
      { id: 'item-2', apolice_id: 'apolice-2' },
    ] as SinistroMaintenanceStore['apoliceItens'],
    profiles: [{ id: 'user-1' }, { id: 'user-2' }] as SinistroMaintenanceStore['profiles'],
    sinistros: [sinistro()],
    envolvidos: [segurado()],
    auditLogs: [],
  }
}

function context() {
  let sequence = 0
  return {
    tenantId: 'tenant-1', sessionUserId: 'user-1', now: () => '2026-07-15T12:00:00.000Z',
    newId: () => `new-${++sequence}`,
  }
}

function draft(row: SinistroEnvolvidoRow): SinistroEnvolvidoMaintenanceDraft {
  return {
    id: row.id,
    apolice_item_id: row.apolice_item_id,
    tipo: row.tipo,
    nome: row.nome,
    cpf_cnpj: row.cpf_cnpj,
    email: row.email,
    telefone: row.telefone,
    placa: row.placa,
    seguradora_terceiro: row.seguradora_terceiro,
    apolice_terceiro: row.apolice_terceiro,
    tipo_dano: row.tipo_dano,
    valor_reclamado: row.valor_reclamado,
    responsavel_pelo_evento: row.responsavel_pelo_evento,
    observacoes: row.observacoes,
  }
}

describe('manutenção contratual de Sinistros', () => {
  it('edita somente escalares autorizados e responsável válido, com auditoria anterior/novo', () => {
    const data = store()
    const result = maintainSinistroAtomic(data, {
      sinistroId: 'sinistro-1', patch: { responsavel_id: 'user-2', descricao: 'Descrição revisada', valor_pendente: 8_000 },
      envolvidos: [draft(segurado())],
    }, context())
    expect(result.sinistro).toMatchObject({ apolice_id: 'apolice-1', status: 'aberto', stage_id: 'stage-1', responsavel_id: 'user-2', descricao: 'Descrição revisada' })
    expect(result.auditLogs).toEqual(expect.arrayContaining([
      expect.objectContaining({ campo: 'descricao', valor_antigo: 'Descrição inicial', valor_novo: 'Descrição revisada' }),
      expect.objectContaining({ campo: 'responsavel_id', valor_antigo: 'user-1', valor_novo: 'user-2' }),
    ]))
  })

  it('bloqueia item de outra apólice para segurado', () => {
    const data = store()
    expect(() => maintainSinistroAtomic(data, {
      sinistroId: 'sinistro-1', patch: {}, envolvidos: [{ ...draft(segurado()), apolice_item_id: 'item-2' }],
    }, context())).toThrow(/não pertence à apólice/i)
  })

  it('bloqueia a remoção do último segurado', () => {
    const data = store()
    expect(() => maintainSinistroAtomic(data, { sinistroId: 'sinistro-1', patch: {}, envolvidos: [] }, context()))
      .toThrow(/último envolvido Segurado/i)
    expect(data.envolvidos).toHaveLength(1)
  })

  it('inclui, edita e remove terceiro sem criar segurado e audita cada ação', () => {
    const data = store()
    const third: SinistroEnvolvidoMaintenanceDraft = {
      apolice_item_id: null, tipo: 'TERCEIRO', nome: 'Terceiro', cpf_cnpj: '98765432100', email: null,
      telefone: null, placa: 'ABC1D23', seguradora_terceiro: null, apolice_terceiro: null,
      tipo_dano: 'Material', valor_reclamado: 2_000, responsavel_pelo_evento: false, observacoes: null,
    }
    const created = maintainSinistroAtomic(data, { sinistroId: 'sinistro-1', patch: {}, envolvidos: [draft(segurado()), third] }, context())
    const createdThird = created.envolvidos.find((row) => row.tipo === 'TERCEIRO')
    expect(createdThird?.apolice_item_id).toBeNull()
    expect(created.auditLogs.at(-1)).toMatchObject({ acao: 'INSERT', valor_antigo: null })

    const updated = maintainSinistroAtomic(data, {
      sinistroId: 'sinistro-1', patch: {}, envolvidos: [draft(segurado()), { ...draft(createdThird!), nome: 'Terceiro editado' }],
    }, context())
    expect(updated.auditLogs).toEqual([expect.objectContaining({ acao: 'UPDATE', valor_antigo: expect.stringContaining('nome=Terceiro'), valor_novo: expect.stringContaining('nome=Terceiro editado') })])

    const removed = maintainSinistroAtomic(data, { sinistroId: 'sinistro-1', patch: {}, envolvidos: [draft(segurado())] }, context())
    expect(removed.auditLogs).toEqual([expect.objectContaining({ acao: 'DELETE', valor_novo: null })])
    expect(data.envolvidos).toHaveLength(1)
  })

  it('restaura Sinistro, envolvidos e auditoria se a auditoria falhar', () => {
    const data = store()
    const rawAudits: AuditLogRow[] = []
    data.auditLogs = new Proxy(rawAudits, {
      get(target, property, receiver) {
        if (property === 'push') return () => { throw new Error('Falha de auditoria simulada') }
        return Reflect.get(target, property, receiver)
      },
    })
    expect(() => maintainSinistroAtomic(data, {
      sinistroId: 'sinistro-1', patch: { descricao: 'Não deve persistir' },
      envolvidos: [draft(segurado()), { ...draft(segurado()), id: undefined, nome: 'Outro segurado' }],
    }, context())).toThrow(/auditoria simulada/i)
    expect(data.sinistros[0].descricao).toBe('Descrição inicial')
    expect(data.envolvidos).toEqual([segurado()])
    expect(rawAudits).toHaveLength(0)
  })

  it('restaura integralmente se a gravação dos envolvidos falhar', () => {
    const data = store()
    const rawEnvolvidos = data.envolvidos
    let spliceCalls = 0
    data.envolvidos = new Proxy(rawEnvolvidos, {
      get(target, property, receiver) {
        if (property === 'splice') {
          return (...args: Parameters<Array<SinistroEnvolvidoRow>['splice']>) => {
            spliceCalls += 1
            if (spliceCalls === 1) throw new Error('Falha de envolvidos simulada')
            return Reflect.apply(Array.prototype.splice, target, args)
          }
        }
        return Reflect.get(target, property, receiver)
      },
    })
    expect(() => maintainSinistroAtomic(data, {
      sinistroId: 'sinistro-1', patch: { descricao: 'Não deve persistir' },
      envolvidos: [draft(segurado()), { ...draft(segurado()), id: undefined, nome: 'Outro segurado' }],
    }, context())).toThrow(/envolvidos simulada/i)
    expect(data.sinistros[0].descricao).toBe('Descrição inicial')
    expect(rawEnvolvidos).toEqual([segurado()])
    expect(data.auditLogs).toHaveLength(0)
  })
})
