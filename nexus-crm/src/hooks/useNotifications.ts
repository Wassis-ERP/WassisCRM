import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../types/database'
import type { EntidadeTipo } from '../types/entidade'

type AtividadeRow = Database['public']['Tables']['atividades']['Row'] & {
  created_at?: string
  updated_at?: string
}
type MencaoRow = Database['public']['Tables']['atividade_mencoes']['Row'] & {
  created_at?: string
  updated_at?: string
}
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type SeguradoRow = Database['public']['Tables']['segurados']['Row']

export interface NotificationItem {
  id: string
  atividadeId: string
  lidaEm: string | null
  notificadaEm?: string | null
  titulo: string
  trecho: string
  autor: string
  quando: string
  entidadeTipo: EntidadeTipo
  entidadeId: string
  origemLabel: string
  href: string | null
}

function profileLabel(profile: ProfileRow | undefined) {
  return profile?.full_name || profile?.email || 'Usuário'
}

function entidadeLabel(tipo: string, id: string, segurados: SeguradoRow[]) {
  if (tipo === 'segurado') {
    return segurados.find((segurado) => segurado.id === id)?.nome ?? 'Segurado'
  }
  return tipo.replace(/_/g, ' ')
}

export function notificationHref(tipo: EntidadeTipo, id: string): string | null {
  if (tipo === 'segurado') return `/segurados/${id}?tab=observacoes`
  if (tipo === 'oportunidade') return `/oportunidades/${id}`
  if (tipo === 'sinistro') return `/sinistros/${id}`
  if (tipo === 'cobranca') return `/financeiro/${id}`
  if (tipo === 'pos_venda') return `/pos-venda/${id}`
  return null
}

async function fetchNotifications(profileId: string): Promise<NotificationItem[]> {
  const [mencoesResult, atividadesResult, profilesResult, seguradosResult] = await Promise.all([
    supabase.from('atividade_mencoes').select('*').eq('profile_id', profileId),
    supabase.from('atividades').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('segurados').select('*'),
  ])

  if (mencoesResult.error) throw mencoesResult.error
  if (atividadesResult.error) throw atividadesResult.error
  if (profilesResult.error) throw profilesResult.error
  if (seguradosResult.error) throw seguradosResult.error

  const atividades = (atividadesResult.data ?? []) as AtividadeRow[]
  const profiles = (profilesResult.data ?? []) as ProfileRow[]
  const segurados = (seguradosResult.data ?? []) as SeguradoRow[]

  const items: NotificationItem[] = []

  ;((mencoesResult.data ?? []) as MencaoRow[]).forEach((mencao) => {
      const atividade = atividades.find((row) => row.id === mencao.atividade_id)
      if (!atividade) return
      const entidadeTipo = atividade.entidade_tipo as EntidadeTipo
      const trecho = atividade.descricao ?? atividade.observacoes ?? atividade.titulo ?? 'Menção em atividade'
      items.push({
        id: mencao.id,
        atividadeId: mencao.atividade_id,
        lidaEm: mencao.lida_em,
        notificadaEm: mencao.notificada_em ?? null,
        titulo: atividade.titulo ?? 'Menção em observação',
        trecho,
        autor: profileLabel(profiles.find((profile) => profile.id === atividade.responsavel_id)),
        quando: atividade.created_at ?? atividade.concluida_em ?? mencao.notificada_em ?? new Date().toISOString(),
        entidadeTipo,
        entidadeId: atividade.entidade_id,
        origemLabel: entidadeLabel(atividade.entidade_tipo, atividade.entidade_id, segurados),
        href: notificationHref(entidadeTipo, atividade.entidade_id),
      })
    })

  return items.sort((a, b) => b.quando.localeCompare(a.quando))
}

export function useNotifications() {
  const { user, session, loading } = useAuth()
  const queryClient = useQueryClient()
  const profileId = user?.id
  const queryKey = queryKeys.notifications(profileId)

  const query = useQuery({
    queryKey,
    enabled: Boolean(profileId) && Boolean(session) && !loading,
    queryFn: () => fetchNotifications(profileId as string),
  })

  const markReadMutation = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase
        .from('atividade_mencoes')
        .update({ lida_em: read ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) return
      const { error } = await supabase
        .from('atividade_mencoes')
        .update({ lida_em: new Date().toISOString() })
        .eq('profile_id', profileId)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })

  const items = query.data ?? []
  const unread = items.filter((item) => !item.lidaEm)

  return {
    items,
    unread,
    unreadCount: unread.length,
    recent: items.slice(0, 5),
    isLoading: query.isLoading,
    markRead: (id: string, read = true) => markReadMutation.mutateAsync({ id, read }),
    markAllRead: () => markAllReadMutation.mutateAsync(),
    isMutating: markReadMutation.isPending || markAllReadMutation.isPending,
  }
}
