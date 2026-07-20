import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSinistroInMemory,
  executeSinistroOperationalInMemory,
  maintainSinistroInMemory,
} from '../lib/inMemoryDb'
import { supabase } from '../lib/supabase'
import {
  filterApolicesForSinistro,
  type ApoliceSinistroOption,
  type SinistroAberturaInput,
  type SinistroCreationResult,
} from '../modules/sinistro/opening'
import type {
  SinistroMaintenanceInput,
  SinistroMaintenanceResult,
} from '../modules/sinistro/maintenance'
import type {
  SinistroOperationalInput,
  SinistroOperationalResult,
} from '../modules/sinistro/closure'
import type {
  ApoliceItemRow,
  Database,
  SinistroEnvolvidoRow,
  SinistroRow,
} from '../types/database'
import { useAuth } from './useAuth'

type SeguradoResumo = Pick<
  Database['public']['Tables']['segurados']['Row'],
  'id' | 'nome' | 'cpf_cnpj' | 'filial_id' | 'email' | 'telefone'
>
type SeguradoraResumo = Pick<Database['public']['Tables']['seguradoras']['Row'], 'id' | 'nome'>
type RamoResumo = Pick<Database['public']['Tables']['ramos']['Row'], 'id' | 'nome' | 'risk_type'>
type ProfileResumo = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name' | 'avatar_url'>
type StageResumo = Pick<Database['public']['Tables']['pipeline_stages']['Row'], 'id' | 'nome' | 'cor' | 'pipeline_id'>
export type SinistroResponsavel = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'full_name' | 'email' | 'tenant_id'
>

type ApoliceLookupRow = {
  id: string
  numero_apolice: string | null
  status: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  segurados: SeguradoResumo | null
  seguradoras: SeguradoraResumo | null
  ramos: RamoResumo | null
  apolice_itens: ApoliceItemRow[] | null
}

export type SinistroEnvolvidoDetalhe = SinistroEnvolvidoRow & {
  apolice_itens: Pick<
    ApoliceItemRow,
    'id' | 'numero_item' | 'descricao' | 'identificador_externo' | 'risk_type' | 'status'
  > | null
}

export type SinistroDetalhe = SinistroRow & {
  apolices: {
    id: string
    numero_apolice: string | null
    status: string | null
    vigencia_inicio: string | null
    vigencia_fim: string | null
    segurados: SeguradoResumo | null
    seguradoras: SeguradoraResumo | null
    ramos: RamoResumo | null
    apolice_itens: ApoliceItemRow[]
  } | null
  pipeline_stages: StageResumo | null
  profiles: ProfileResumo | null
  sinistro_envolvidos: SinistroEnvolvidoDetalhe[]
}

/**
 * Leitura contratual do Sinistro. O contexto de tenant/corretora e herdado da
 * apolice; envolvidos ficam em colecao propria e terceiros nao viram segurados.
 */
export function useSinistro(id: string | undefined) {
  return useQuery({
    queryKey: ['sinistro', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<SinistroDetalhe> => {
      const { data, error } = await supabase
        .from('sinistros')
        .select(`
          *,
          apolices:apolice_id (
            id,
            numero_apolice,
            status,
            vigencia_inicio,
            vigencia_fim,
            segurados:segurado_id ( id, nome, cpf_cnpj, filial_id, email, telefone ),
            seguradoras:seguradora_id ( id, nome ),
            ramos:ramo_id ( id, nome, risk_type ),
            apolice_itens (*)
          ),
          pipeline_stages:stage_id ( id, nome, cor, pipeline_id ),
          profiles:responsavel_id ( id, full_name, avatar_url ),
          sinistro_envolvidos (
            *,
            apolice_itens:apolice_item_id (
              id,
              numero_item,
              descricao,
              identificador_externo,
              risk_type,
              status
            )
          )
        `)
        .eq('id', id as string)
        .single()

      if (error) throw error
      return data as unknown as SinistroDetalhe
    },
  })
}

/** Lookup contratual de apólices elegíveis para iniciar um Sinistro. */
export function useApolicesSinistroLookup(search: string) {
  const { activeBranchId } = useAuth()

  return useQuery({
    queryKey: ['sinistro_apolices_lookup', activeBranchId, search],
    queryFn: async (): Promise<ApoliceSinistroOption[]> => {
      const { data, error } = await supabase
        .from('apolices')
        .select(`
          id,
          numero_apolice,
          status,
          vigencia_inicio,
          vigencia_fim,
          segurados:segurado_id ( id, nome, cpf_cnpj, filial_id, email, telefone ),
          seguradoras:seguradora_id ( id, nome ),
          ramos:ramo_id ( id, nome, risk_type ),
          apolice_itens (*)
        `)
        .order('numero_apolice', { ascending: true })

      if (error) throw error

      const options = ((data ?? []) as unknown as ApoliceLookupRow[])
        .filter((row): row is ApoliceLookupRow & { segurados: SeguradoResumo } => (
          row.segurados != null && (!activeBranchId || row.segurados.filial_id === activeBranchId)
        ))
        .map((row): ApoliceSinistroOption => ({
          id: row.id,
          numero_apolice: row.numero_apolice,
          status: row.status,
          vigencia_inicio: row.vigencia_inicio,
          vigencia_fim: row.vigencia_fim,
          segurado: row.segurados,
          seguradora: row.seguradoras,
          ramo: row.ramos,
          itens: row.apolice_itens ?? [],
        }))

      return filterApolicesForSinistro(options, search)
    },
  })
}

export function useSinistroResponsaveis() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['sinistro_responsaveis', user?.tenantId],
    queryFn: async (): Promise<SinistroResponsavel[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, tenant_id')
        .order('full_name', { ascending: true })

      if (error) throw error
      return ((data ?? []) as SinistroResponsavel[]).filter(
        (profile) => !user?.tenantId || !profile.tenant_id || profile.tenant_id === user.tenantId,
      )
    },
  })
}

export function useOpenSinistro() {
  const queryClient = useQueryClient()
  const { user, activeBranchId } = useAuth()

  return useMutation({
    mutationFn: async (command: { input: SinistroAberturaInput; pipelineId?: string | null }): Promise<SinistroCreationResult> => {
      if (!user?.tenantId) throw new Error('Usuário sem tenant válido para abrir o Sinistro.')
      return createSinistroInMemory(command.input, {
        tenantId: user.tenantId,
        filialId: activeBranchId,
        sessionUserId: user.id,
        pipelineId: command.pipelineId,
      })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kanban_cards', 'sinistro'] }),
        queryClient.invalidateQueries({ queryKey: ['sinistro', result.sinistro.id] }),
      ])
    },
  })
}

export function useMaintainSinistro() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: SinistroMaintenanceInput): Promise<SinistroMaintenanceResult> => {
      if (!user?.tenantId) throw new Error('Usuário sem tenant válido para manter o Sinistro.')
      return maintainSinistroInMemory(input, {
        tenantId: user.tenantId,
        sessionUserId: user.id,
      })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sinistro', result.sinistro.id] }),
        queryClient.invalidateQueries({ queryKey: ['kanban_cards', 'sinistro'] }),
        queryClient.invalidateQueries({ queryKey: ['entity_tabs', 'sinistro', result.sinistro.id] }),
      ])
    },
  })
}

export function useOperateSinistro() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: SinistroOperationalInput): Promise<SinistroOperationalResult> => {
      if (!user?.tenantId) throw new Error('Usuário sem tenant válido para operar o Sinistro.')
      return executeSinistroOperationalInMemory(input, {
        tenantId: user.tenantId,
        sessionUserId: user.id,
      })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sinistro', result.sinistro.id] }),
        queryClient.invalidateQueries({ queryKey: ['kanban_cards', 'sinistro'] }),
        queryClient.invalidateQueries({ queryKey: ['entity_tabs', 'sinistro', result.sinistro.id] }),
      ])
    },
  })
}
