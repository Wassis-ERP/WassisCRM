/**
 * Hook das guias transversais. A origem agora é o mock in-memory via contrato
 * polimórfico `entidade_tipo + entidade_id`, igual ao DBML v2.0.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { queryKeys } from '../../lib/queryClient'
import { MOCK_TENANT_ID, MOCK_USER_ID } from '../../lib/inMemoryDb'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database'
import type { EntidadeContexto, EntidadeTipo } from '../../types/entidade'
import { entityContextKey } from '../../types/entidade'
import { useAuth } from '../../hooks/useAuth'
import type {
  Anexo,
  EntityTabsData,
  LogEntry,
  MentionCandidate,
  Observacao,
  ResolvedMention,
  Tarefa,
  TarefaPrioridade,
  TarefaTipo,
} from './types'

type AtividadeRow = Database['public']['Tables']['atividades']['Row'] & {
  created_at?: string
  updated_at?: string
}
type AtividadeInsert = Database['public']['Tables']['atividades']['Insert']
type AnexoRow = Database['public']['Tables']['anexos']['Row'] & {
  created_at?: string
  updated_at?: string
}
type AnexoInsert = Database['public']['Tables']['anexos']['Insert']
type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'] & {
  created_at?: string
  updated_at?: string
}
type ProfileRow = Database['public']['Tables']['profiles']['Row']

const EMPTY: EntityTabsData = {
  tarefas: [],
  campos: [],
  anexos: [],
  logs: [],
  observacoes: [],
  mentionCandidates: [],
}

const TAREFA_TIPO_TO_DB: Record<TarefaTipo, string> = {
  Ligação: 'ligacao',
  'E-mail': 'email',
  Reunião: 'followup',
  Documento: 'tarefa',
  'Follow-up': 'followup',
  Renovação: 'followup',
}

const DB_TO_TAREFA_TIPO: Record<string, TarefaTipo> = {
  ligacao: 'Ligação',
  email: 'E-mail',
  whatsapp: 'Follow-up',
  followup: 'Follow-up',
  tarefa: 'Documento',
}

const PRIORIDADE_TO_DB: Record<TarefaPrioridade, string> = {
  Alta: 'alta',
  Média: 'media',
  Baixa: 'baixa',
}

const DB_TO_PRIORIDADE: Record<string, TarefaPrioridade> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function isOverdue(vencimento?: string | null): boolean {
  if (!vencimento) return false
  const due = new Date(`${vencimento}T23:59:59`)
  return Number.isFinite(due.getTime()) && due.getTime() < Date.now()
}

function profileName(profile: ProfileRow | undefined, fallback: string): string {
  return profile?.full_name || profile?.email || fallback
}

function initials(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function fileType(nome: string): Anexo['tipo'] {
  const ext = nome.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'img'
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip'
  if (ext === 'pdf') return 'pdf'
  return 'doc'
}

function humanSize(bytes: number | null): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function shortTitle(texto: string): string {
  const firstLine = texto.trim().split(/\r?\n/)[0] ?? ''
  return firstLine.length > 54 ? `${firstLine.slice(0, 51)}...` : firstLine || 'Observação'
}

export function buildEntityContextKey(entidadeTipo: EntidadeTipo, entidadeId: string): string {
  return entityContextKey({ entidadeTipo, entidadeId })
}

export function mapAtividadeToTarefa(row: AtividadeRow, profiles: ProfileRow[], fallbackAutor: string): Tarefa {
  const responsavel = profileName(
    profiles.find((profile) => profile.id === row.responsavel_id),
    fallbackAutor,
  )
  const concluida = row.status === 'concluida' || Boolean(row.concluida_em)
  return {
    id: row.id,
    titulo: row.titulo ?? row.descricao ?? 'Tarefa',
    tipo: DB_TO_TAREFA_TIPO[row.tipo] ?? 'Follow-up',
    prazo: row.vencimento ?? undefined,
    status: concluida ? 'Concluída' : isOverdue(row.vencimento) ? 'Atrasada' : 'Pendente',
    prioridade: DB_TO_PRIORIDADE[row.prioridade ?? ''] ?? 'Média',
    responsavel: {
      nome: responsavel,
      iniciais: initials(responsavel),
    },
  }
}

export function mapAtividadeToObservacao(row: AtividadeRow, profiles: ProfileRow[], fallbackAutor: string): Observacao {
  const autor = profileName(
    profiles.find((profile) => profile.id === row.responsavel_id),
    fallbackAutor,
  )
  return {
    id: row.id,
    texto: row.descricao ?? row.observacoes ?? row.titulo ?? '',
    autor,
    data: row.created_at ?? row.concluida_em ?? new Date().toISOString(),
    pinned: Boolean(row.fixada_em),
  }
}

export function mapAnexoToView(row: AnexoRow): Anexo {
  return {
    id: row.id,
    nome: row.nome_arquivo,
    tipo: fileType(row.nome_arquivo),
    tamanho: humanSize(row.tamanho_bytes),
    data: row.anexado_em ?? row.created_at,
    autor: row.origem === 'usuario' ? 'Usuário da sessão' : undefined,
  }
}

function mapProfileToMentionCandidate(profile: ProfileRow): MentionCandidate {
  return {
    id: profile.id,
    nome: profileName(profile, 'Usuário'),
    email: profile.email,
  }
}

export function buildTarefaInsertPayload(
  context: EntidadeContexto,
  tarefa: Omit<Tarefa, 'id'>,
  responsavelId: string,
): AtividadeInsert {
  return {
    tenant_id: context.tenantId,
    filial_id: context.filialId ?? null,
    responsavel_id: responsavelId,
    entidade_tipo: context.entidadeTipo,
    entidade_id: context.entidadeId,
    tipo: TAREFA_TIPO_TO_DB[tarefa.tipo] ?? 'tarefa',
    titulo: tarefa.titulo,
    descricao: null,
    status: tarefa.status === 'Concluída' ? 'concluida' : 'pendente',
    prioridade: PRIORIDADE_TO_DB[tarefa.prioridade] ?? 'media',
    vencimento: tarefa.prazo ?? null,
    concluida_em: tarefa.status === 'Concluída' ? new Date().toISOString() : null,
    fixada_em: null,
    canal: tarefa.tipo === 'E-mail' ? 'email' : tarefa.tipo === 'Ligação' ? 'telefone' : null,
    origem: 'usuario',
    lembrete_em: null,
    recorrente: false,
    observacoes: null,
  }
}

export function buildNotaInsertPayload(
  context: EntidadeContexto,
  observacao: Omit<Observacao, 'id'>,
  responsavelId: string,
): AtividadeInsert {
  const texto = observacao.texto.trim()
  const now = new Date().toISOString()
  return {
    tenant_id: context.tenantId,
    filial_id: context.filialId ?? null,
    responsavel_id: responsavelId,
    entidade_tipo: context.entidadeTipo,
    entidade_id: context.entidadeId,
    tipo: 'nota',
    titulo: shortTitle(texto),
    descricao: texto,
    status: 'concluida',
    prioridade: 'baixa',
    vencimento: null,
    concluida_em: now,
    fixada_em: observacao.pinned ? now : null,
    canal: null,
    origem: 'usuario',
    lembrete_em: null,
    recorrente: false,
    observacoes: null,
  }
}

export function buildAnexoInsertPayload(context: EntidadeContexto, anexo: Omit<Anexo, 'id'>): AnexoInsert {
  const ext = anexo.nome.split('.').pop()?.toLowerCase() ?? ''
  return {
    tenant_id: context.tenantId,
    filial_id: context.filialId ?? null,
    entidade_tipo: context.entidadeTipo,
    entidade_id: context.entidadeId,
    nome_arquivo: anexo.nome,
    mime_type: EXT_TO_MIME[ext] ?? null,
    tamanho_bytes: Number(anexo.tamanhoBytes ?? 0),
    url_armazenamento: null,
    categoria: 'documento',
    descricao: anexo.descricao ?? null,
    origem: 'usuario',
    status: 'ativo',
    hash_sha256: null,
    anexado_em: anexo.data ?? new Date().toISOString(),
  }
}

function buildActivityLogs(
  atividades: AtividadeRow[],
  profiles: ProfileRow[],
  fallbackAutor: string,
): LogEntry[] {
  return atividades.map((atividade) => {
    const autor = profileName(
      profiles.find((profile) => profile.id === atividade.responsavel_id),
      fallbackAutor,
    )
    if (atividade.tipo === 'nota') {
      return {
        id: `atividade-${atividade.id}`,
        quando: atividade.created_at ?? atividade.concluida_em ?? new Date().toISOString(),
        titulo: atividade.fixada_em ? 'Observação fixada' : 'Observação registrada',
        detalhe: atividade.descricao ?? atividade.titulo ?? undefined,
        autor,
        tipo: 'nota' as const,
        origem: 'atividade' as const,
      }
    }
    const concluida = atividade.status === 'concluida' || Boolean(atividade.concluida_em)
    return {
      id: `atividade-${atividade.id}`,
      quando: atividade.updated_at ?? atividade.created_at ?? new Date().toISOString(),
      titulo: concluida ? 'Tarefa concluída' : 'Tarefa criada ou reaberta',
      detalhe: atividade.titulo ?? atividade.descricao ?? undefined,
      autor,
      tipo: 'sistema' as const,
      origem: 'atividade' as const,
    }
  })
}

function buildAnexoLogs(anexos: AnexoRow[], fallbackAutor: string): LogEntry[] {
  return anexos.map((anexo) => ({
    id: `anexo-${anexo.id}`,
    quando: anexo.anexado_em ?? anexo.created_at ?? new Date().toISOString(),
    titulo: 'Anexo adicionado',
    detalhe: anexo.nome_arquivo,
    autor: fallbackAutor,
    tipo: 'anexo' as const,
    origem: 'anexo' as const,
  }))
}

function formatAuditLogDetail(log: AuditLogRow): string {
  const campo = log.campo ? `Campo ${log.campo}` : 'Registro'
  if (log.valor_antigo != null || log.valor_novo != null) {
    return `${campo}: ${log.valor_antigo ?? 'vazio'} → ${log.valor_novo ?? 'vazio'}`
  }
  return campo
}

function buildAuditLogs(logs: AuditLogRow[], profiles: ProfileRow[], fallbackAutor: string): LogEntry[] {
  return logs.map((log) => {
    const autor = profileName(
      profiles.find((profile) => profile.id === log.user_id),
      fallbackAutor,
    )
    return {
      id: `audit-${log.id}`,
      quando: log.ocorrido_em ?? log.created_at ?? new Date().toISOString(),
      titulo: log.acao === 'DELETE' ? 'Registro removido' : log.acao === 'INSERT' ? 'Registro criado' : 'Alteração técnica',
      detalhe: formatAuditLogDetail(log),
      autor,
      tipo: 'audit_log' as const,
      origem: 'audit_log' as const,
    }
  })
}

export function buildTimeline(
  atividades: AtividadeRow[],
  anexos: AnexoRow[],
  auditLogs: AuditLogRow[],
  profiles: ProfileRow[],
  fallbackAutor: string,
  includeAuditLogs: boolean,
): LogEntry[] {
  return [
    ...buildActivityLogs(atividades, profiles, fallbackAutor),
    ...buildAnexoLogs(anexos, fallbackAutor),
    ...(includeAuditLogs ? buildAuditLogs(auditLogs, profiles, fallbackAutor) : []),
  ].sort((a, b) => b.quando.localeCompare(a.quando) || a.id.localeCompare(b.id))
}

function resolveProfileMentions(texto: string, profiles: ProfileRow[]): string[] {
  const mentions = Array.from(texto.matchAll(/@([\p{L}\d._-]+)/giu)).map((match) => match[1]?.toLowerCase())
  if (mentions.length === 0) return []
  return profiles
    .filter((profile) => {
      const nameParts = (profile.full_name ?? profile.email ?? '')
        .toLowerCase()
        .split(/[\s@.]+/)
        .filter(Boolean)
      return mentions.some((mention) => mention && nameParts.includes(mention))
    })
    .map((profile) => profile.id)
}

export function mergeResolvedMentions(texto: string, profiles: ProfileRow[], resolvedMentions?: ResolvedMention[]): string[] {
  return Array.from(
    new Set([
      ...resolveProfileMentions(texto, profiles),
      ...(resolvedMentions ?? []).map((mention) => mention.profileId),
    ]),
  )
}

async function persistMentions(
  atividadeId: string,
  texto: string,
  profiles: ProfileRow[],
  resolvedMentions?: ResolvedMention[],
) {
  const profileIds = mergeResolvedMentions(texto, profiles, resolvedMentions)
  if (profileIds.length === 0) return
  await supabase.from('atividade_mencoes').insert(
    profileIds.map((profileId) => ({
      atividade_id: atividadeId,
      profile_id: profileId,
      lida_em: null,
      notificada_em: new Date().toISOString(),
    })),
  )
}

function defaultAuthor(user: ReturnType<typeof useAuth>['user']): string {
  const fullName = user?.fullName ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  return fullName || user?.email || 'Usuário da sessão'
}

export interface EntityTabsApi extends EntityTabsData {
  isLoading: boolean
  isSaving: boolean
  mentionCandidates: MentionCandidate[]
  showAuditLogs: boolean
  setShowAuditLogs: (show: boolean) => void
  addTarefa: (t: Omit<Tarefa, 'id'>) => Promise<void>
  toggleTarefa: (id: string) => Promise<void>
  addAnexo: (a: Omit<Anexo, 'id'>) => Promise<void>
  addLog: (l: Omit<LogEntry, 'id'>) => Promise<void>
  addObservacao: (o: Omit<Observacao, 'id'>, resolvedMentions?: ResolvedMention[]) => Promise<void>
  togglePin: (id: string) => Promise<void>
}

export function useEntityTabsState(
  entidadeTipo: EntidadeTipo,
  entidadeId: string | undefined,
  options: { filialId?: string | null } = {},
): EntityTabsApi {
  const { user, activeBranchId, session, loading } = useAuth()
  const queryClient = useQueryClient()
  const [showAuditLogs, setShowAuditLogs] = useState(false)
  const enabled = Boolean(entidadeId) && !loading && Boolean(session)
  const context: EntidadeContexto | null = entidadeId
    ? {
        entidadeTipo,
        entidadeId,
        tenantId: user?.tenantId ?? MOCK_TENANT_ID,
        filialId: options.filialId ?? activeBranchId ?? user?.branchId ?? null,
      }
    : null
  const baseKey = queryKeys.entityTabs(entidadeTipo, entidadeId)
  const key = [...baseKey, showAuditLogs ? 'audit' : 'operacional'] as const
  const autor = defaultAuthor(user)
  const responsavelId = user?.id ?? MOCK_USER_ID

  const query = useQuery({
    queryKey: key,
    enabled,
    queryFn: async (): Promise<EntityTabsData> => {
      if (!context) return EMPTY
      const [atividadesResult, anexosResult, profilesResult, auditLogsResult] = await Promise.all([
        supabase
          .from('atividades')
          .select('*')
          .eq('entidade_tipo', context.entidadeTipo)
          .eq('entidade_id', context.entidadeId)
          .order('created_at', { ascending: false }),
        supabase
          .from('anexos')
          .select('*')
          .eq('entidade_tipo', context.entidadeTipo)
          .eq('entidade_id', context.entidadeId)
          .order('anexado_em', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase
          .from('audit_logs')
          .select('*')
          .eq('entidade_tipo', context.entidadeTipo)
          .eq('entidade_id', context.entidadeId)
          .order('ocorrido_em', { ascending: false }),
      ])
      if (atividadesResult.error) throw atividadesResult.error
      if (anexosResult.error) throw anexosResult.error
      if (profilesResult.error) throw profilesResult.error
      if (auditLogsResult.error) throw auditLogsResult.error

      const atividades = (atividadesResult.data ?? []) as AtividadeRow[]
      const anexos = (anexosResult.data ?? []) as AnexoRow[]
      const profiles = (profilesResult.data ?? []) as ProfileRow[]
      const auditLogs = (auditLogsResult.data ?? []) as AuditLogRow[]
      const tarefas = atividades
        .filter((atividade) => atividade.tipo !== 'nota')
        .map((atividade) => mapAtividadeToTarefa(atividade, profiles, autor))
      const observacoes = atividades
        .filter((atividade) => atividade.tipo === 'nota')
        .map((atividade) => mapAtividadeToObservacao(atividade, profiles, autor))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.data.localeCompare(a.data))

      return {
        campos: [],
        tarefas,
        observacoes,
        anexos: anexos.map(mapAnexoToView),
        logs: buildTimeline(atividades, anexos, auditLogs, profiles, autor, showAuditLogs),
        mentionCandidates: profiles
          .filter((profile) => profile.id !== user?.id)
          .map(mapProfileToMentionCandidate),
      }
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: baseKey })

  const addTarefaMutation = useMutation({
    mutationFn: async (tarefa: Omit<Tarefa, 'id'>) => {
      if (!context) throw new Error('Entidade não encontrada.')
      const { error } = await supabase.from('atividades').insert(buildTarefaInsertPayload(context, tarefa, responsavelId))
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const toggleTarefaMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = query.data?.tarefas.find((tarefa) => tarefa.id === id)
      const shouldReopen = current?.status === 'Concluída'
      const { error } = await supabase
        .from('atividades')
        .update({
          status: shouldReopen ? 'pendente' : 'concluida',
          concluida_em: shouldReopen ? null : new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const addAnexoMutation = useMutation({
    mutationFn: async (anexo: Omit<Anexo, 'id'>) => {
      if (!context) throw new Error('Entidade não encontrada.')
      const { error } = await supabase.from('anexos').insert(buildAnexoInsertPayload(context, anexo))
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const addObservacaoMutation = useMutation({
    mutationFn: async ({
      observacao,
      resolvedMentions,
    }: {
      observacao: Omit<Observacao, 'id'>
      resolvedMentions?: ResolvedMention[]
    }) => {
      if (!context) throw new Error('Entidade não encontrada.')
      const [profilesResult, insertResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('atividades').insert(buildNotaInsertPayload(context, observacao, responsavelId)).select('*').single(),
      ])
      if (profilesResult.error) throw profilesResult.error
      if (insertResult.error) throw insertResult.error
      await persistMentions(
        (insertResult.data as AtividadeRow).id,
        observacao.texto,
        (profilesResult.data ?? []) as ProfileRow[],
        resolvedMentions,
      )
    },
    onSuccess: () => {
      invalidate()
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user?.id) })
    },
  })

  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = query.data?.observacoes.find((observacao) => observacao.id === id)
      const { error } = await supabase
        .from('atividades')
        .update({ fixada_em: current?.pinned ? null : new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    ...(query.data ?? EMPTY),
    isLoading: query.isLoading,
    isSaving:
      addTarefaMutation.isPending ||
      toggleTarefaMutation.isPending ||
      addAnexoMutation.isPending ||
      addObservacaoMutation.isPending ||
      togglePinMutation.isPending,
    mentionCandidates: query.data?.mentionCandidates ?? [],
    showAuditLogs,
    setShowAuditLogs,
    addTarefa: async (tarefa) => {
      await addTarefaMutation.mutateAsync(tarefa)
    },
    toggleTarefa: async (id) => {
      await toggleTarefaMutation.mutateAsync(id)
    },
    addAnexo: async (anexo) => {
      await addAnexoMutation.mutateAsync(anexo)
    },
    addLog: async (log) => {
      await addObservacaoMutation.mutateAsync({
        observacao: {
          texto: [log.titulo, log.detalhe].filter(Boolean).join('\n'),
          data: log.quando,
          autor: log.autor,
          pinned: false,
        },
      })
    },
    addObservacao: async (observacao, resolvedMentions) => {
      await addObservacaoMutation.mutateAsync({ observacao, resolvedMentions })
    },
    togglePin: async (id) => {
      await togglePinMutation.mutateAsync(id)
    },
  }
}
