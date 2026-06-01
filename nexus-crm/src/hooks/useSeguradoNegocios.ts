import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useAuth } from './useAuth'

type CardStatus = Database['public']['Enums']['card_status']

/** Oportunidade resumida para exibição no detalhe do segurado. */
export interface OportunidadeResumo {
  id: string
  nome: string
  ramo?: string | null
  seguradora?: string | null
  premio?: number | null
  status: CardStatus
  tipoNegocio?: string | null
  vigenciaFim?: string | null
}

/** Apólice resumida (origem: Painel de Propostas e Apólices). */
export interface ApoliceResumo {
  id: string
  numero?: string | null
  ramo?: string | null
  seguradora?: string | null
  premio?: number | null
  vigenciaInicio?: string | null
  vigenciaFim?: string | null
  status?: string | null
}

const NEGOCIOS_KEY = ['segurado-negocios'] as const

/**
 * Oportunidades vinculadas a um segurado (`oportunidades.segurado_id`).
 *
 * Fonte real (mesma tabela do Pipeline Comercial / Kanban). Filtra client-side
 * por `segurado_id` — mesmo padrão de `usePessoaContatos` — para compatibilidade
 * com o adapter in-memory do modo frontend-puro.
 */
export function useOportunidadesBySegurado(seguradoId: string | undefined) {
  const { session, loading: authLoading } = useAuth()
  const authReady = !authLoading && !!session

  return useQuery({
    queryKey: [...NEGOCIOS_KEY, 'oportunidades', seguradoId] as const,
    enabled: Boolean(seguradoId) && authReady,
    queryFn: async (): Promise<OportunidadeResumo[]> => {
      const { data, error } = await supabase.from('oportunidades').select(`
          id,
          nome,
          status,
          premio_liquido,
          tipo_negocio,
          vigencia_fim,
          segurado_id,
          ramos:ramo_id ( id, nome ),
          seguradoras:seguradora_id ( id, nome )
        `)

      if (error) throw error
      const rows = (data ?? []) as unknown as Array<Record<string, unknown>>
      return rows
        .filter((r) => r.segurado_id === seguradoId)
        .map<OportunidadeResumo>((r) => {
          const ramo = (r.ramos ?? null) as { nome: string } | null
          const seguradora = (r.seguradoras ?? null) as { nome: string } | null
          return {
            id: r.id as string,
            nome: (r.nome as string | null) ?? 'Oportunidade',
            ramo: ramo?.nome ?? null,
            seguradora: seguradora?.nome ?? null,
            premio: r.premio_liquido != null ? Number(r.premio_liquido) : null,
            status: r.status as CardStatus,
            tipoNegocio: (r.tipo_negocio as string | null) ?? null,
            vigenciaFim: (r.vigencia_fim as string | null) ?? null,
          }
        })
    },
    staleTime: 30_000,
  })
}

/**
 * Apólices vinculadas a um segurado, vindas do Painel (Propostas e Apólices).
 *
 * SEAM: o Painel (`PropostasPage`) ainda é frontend-puro com dados mock não
 * relacionados a `segurado_id`, então hoje não há fonte consultável e o retorno
 * é vazio. Quando o Painel persistir apólices keyed por segurado (tabela
 * `apolices`/`propostas` com `segurado_id`), implemente a query aqui — a UI do
 * detalhe (TabVisaoGeral) já consome este hook e passa a listar automaticamente.
 */
export function useApolicesBySegurado(seguradoId: string | undefined) {
  const { session, loading: authLoading } = useAuth()
  const authReady = !authLoading && !!session

  return useQuery({
    queryKey: [...NEGOCIOS_KEY, 'apolices', seguradoId] as const,
    enabled: Boolean(seguradoId) && authReady,
    queryFn: async (): Promise<ApoliceResumo[]> => {
      // TODO(Painel): consultar a fonte real de apólices por segurado quando existir.
      return []
    },
    staleTime: 30_000,
  })
}
