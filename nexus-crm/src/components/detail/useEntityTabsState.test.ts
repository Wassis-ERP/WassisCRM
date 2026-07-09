import { describe, expect, it } from 'vitest'
import {
  buildAnexoInsertPayload,
  buildEntityContextKey,
  buildNotaInsertPayload,
  buildTarefaInsertPayload,
  buildTimeline,
  mergeResolvedMentions,
  mapAtividadeToObservacao,
  mapAtividadeToTarefa,
} from './useEntityTabsState'
import type { EntidadeContexto } from '../../types/entidade'

const context: EntidadeContexto = {
  entidadeTipo: 'segurado',
  entidadeId: 'segurado-1',
  tenantId: 'tenant-1',
  filialId: 'filial-1',
}

describe('guias transversais polimorficas', () => {
  it('usa entidade_tipo e entidade_id na chave do contexto', () => {
    expect(buildEntityContextKey('segurado', 'id-igual')).toBe('segurado:id-igual')
    expect(buildEntityContextKey('proposta', 'id-igual')).toBe('proposta:id-igual')
  })

  it('monta tarefa como atividade polimorfica', () => {
    expect(buildTarefaInsertPayload(context, {
      titulo: 'Cobrar documento',
      tipo: 'Documento',
      prioridade: 'Alta',
      prazo: '2026-07-15',
      status: 'Pendente',
      responsavel: { nome: 'Dev Wassis' },
    }, 'profile-1')).toMatchObject({
      tenant_id: 'tenant-1',
      filial_id: 'filial-1',
      responsavel_id: 'profile-1',
      entidade_tipo: 'segurado',
      entidade_id: 'segurado-1',
      tipo: 'tarefa',
      status: 'pendente',
      prioridade: 'alta',
      vencimento: '2026-07-15',
    })
  })

  it('normaliza observacao como atividade tipo nota fixavel', () => {
    expect(buildNotaInsertPayload(context, {
      texto: 'Cliente prefere WhatsApp',
      data: '2026-07-08T10:00:00.000Z',
      pinned: true,
    }, 'profile-1')).toMatchObject({
      entidade_tipo: 'segurado',
      entidade_id: 'segurado-1',
      tipo: 'nota',
      descricao: 'Cliente prefere WhatsApp',
      status: 'concluida',
    })
  })

  it('grava anexo somente como metadado', () => {
    expect(buildAnexoInsertPayload(context, {
      nome: 'apolice.pdf',
      tipo: 'pdf',
      tamanho: '24 KB',
      tamanhoBytes: 24_576,
      data: '2026-07-08T10:00:00.000Z',
    })).toMatchObject({
      entidade_tipo: 'segurado',
      entidade_id: 'segurado-1',
      nome_arquivo: 'apolice.pdf',
      mime_type: 'application/pdf',
      tamanho_bytes: 24576,
      url_armazenamento: null,
    })
  })

  it('mapeia atividades para view models de tarefa e observacao com autoria', () => {
    const profiles = [{ id: 'profile-1', full_name: 'Dev Wassis', email: 'dev@wassis.com' }] as any[]

    expect(mapAtividadeToTarefa({
      id: 'atividade-1',
      responsavel_id: 'profile-1',
      tipo: 'followup',
      titulo: 'Retornar',
      descricao: null,
      status: 'concluida',
      prioridade: 'media',
      vencimento: null,
      concluida_em: '2026-07-08T10:00:00.000Z',
      fixada_em: null,
    } as any, profiles, 'Fallback')).toMatchObject({
      titulo: 'Retornar',
      tipo: 'Follow-up',
      status: 'Concluída',
      prioridade: 'Média',
      responsavel: { nome: 'Dev Wassis' },
    })

    expect(mapAtividadeToObservacao({
      id: 'atividade-2',
      responsavel_id: 'profile-1',
      descricao: 'Nota fixada',
      fixada_em: '2026-07-08T10:00:00.000Z',
      created_at: '2026-07-08T09:00:00.000Z',
    } as any, profiles, 'Fallback')).toMatchObject({
      texto: 'Nota fixada',
      autor: 'Dev Wassis',
      pinned: true,
    })
  })

  it('monta timeline unificada mantendo audit_logs atras do toggle', () => {
    const profiles = [{ id: 'profile-1', full_name: 'Dev Wassis', email: 'dev@wassis.com' }] as any[]
    const atividades = [{
      id: 'atividade-1',
      responsavel_id: 'profile-1',
      tipo: 'nota',
      titulo: 'Nota',
      descricao: 'Contato registrado',
      fixada_em: null,
      created_at: '2026-07-08T10:00:00.000Z',
    }] as any[]
    const anexos = [{
      id: 'anexo-1',
      nome_arquivo: 'apolice.pdf',
      anexado_em: '2026-07-08T11:00:00.000Z',
    }] as any[]
    const auditLogs = [{
      id: 'audit-1',
      user_id: 'profile-1',
      acao: 'UPDATE',
      campo: 'telefone',
      valor_antigo: '1111',
      valor_novo: '2222',
      ocorrido_em: '2026-07-08T12:00:00.000Z',
    }] as any[]

    expect(buildTimeline(atividades, anexos, auditLogs, profiles, 'Fallback', false)).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ origem: 'audit_log' })]),
    )
    expect(buildTimeline(atividades, anexos, auditLogs, profiles, 'Fallback', true)[0]).toMatchObject({
      origem: 'audit_log',
      titulo: 'Alteração técnica',
      detalhe: 'Campo telefone: 1111 → 2222',
    })
  })

  it('deduplica mencoes resolvidas e mencoes inferidas do texto', () => {
    const profiles = [
      { id: 'profile-1', full_name: 'Dev Wassis', email: 'dev@wassis.com' },
      { id: 'profile-2', full_name: 'Renato Assis', email: 'renato@wassis.com' },
    ] as any[]

    expect(mergeResolvedMentions('Falar com @Dev e @Renato', profiles, [
      { profileId: 'profile-1', marcador: '@Dev' },
    ])).toEqual(['profile-1', 'profile-2'])
  })
})
