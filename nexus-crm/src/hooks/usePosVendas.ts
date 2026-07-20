import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPosVendaInMemory,
  maintainPosVendaInMemory,
} from '../lib/inMemoryDb'
import { supabase } from '../lib/supabase'
import {
  inferPosVendaProcesso,
  validatePosVendaEligibility,
  type PosVendaCreateInput,
  type PosVendaMaintenanceInput,
  type PosVendaProcesso,
} from '../modules/pos_venda/domain'
import type {
  ApoliceRow,
  Database,
  PosVendaRow,
} from '../types/database'
import { useAuth } from './useAuth'

type SeguradoResumo = Pick<
  Database['public']['Tables']['segurados']['Row'],
  'id' | 'nome' | 'cpf_cnpj' | 'filial_id' | 'email' | 'telefone'
>
type SeguradoraResumo = Pick<Database['public']['Tables']['seguradoras']['Row'], 'id' | 'nome'>
type RamoResumo = Pick<Database['public']['Tables']['ramos']['Row'], 'id' | 'nome' | 'risk_type' | 'is_monthly'>
type ProfileResumo = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name' | 'avatar_url'>
type StageResumo = Pick<Database['public']['Tables']['pipeline_stages']['Row'], 'id' | 'nome' | 'cor' | 'pipeline_id'>

type ApoliceLookupRow = ApoliceRow & {
  segurados: SeguradoResumo | null
  seguradoras: SeguradoraResumo | null
  ramos: RamoResumo | null
}

export interface PosVendaApoliceOption {
  id: string
  numero_apolice: string | null
  status: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  premio_total: number | null
  segurado: SeguradoResumo
  seguradora: SeguradoraResumo | null
  ramo: RamoResumo
  eligible: boolean
  reason: string | null
}

export interface PosVendaResponsavel {
  id: string
  full_name: string | null
  email: string | null
  tenant_id: string | null
}

export type PosVendaDetalhe = PosVendaRow & {
  apolices: {
    id: string
    numero_apolice: string | null
    status: string | null
    vigencia_inicio: string | null
    vigencia_fim: string | null
    premio_total: number | null
    segurados: SeguradoResumo | null
    seguradoras: SeguradoraResumo | null
    ramos: RamoResumo | null
  } | null
  pipeline_stages: StageResumo | null
  profiles: ProfileResumo | null
}

function searchable(option: PosVendaApoliceOption): string {
  return [
    option.numero_apolice,
    option.segurado.nome,
    option.segurado.cpf_cnpj,
    option.seguradora?.nome,
    option.ramo.nome,
  ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR')
}

function eligibilityReason(
  policy: ApoliceRow,
  ramo: RamoResumo,
  processo: PosVendaProcesso,
): string | null {
  try {
    validatePosVendaEligibility(policy, ramo, processo)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'Apólice inelegível.'
  }
}

export function usePosVendaPipeline(pipelineId: string | null | undefined) {
  return useQuery({
    queryKey: ['pos_venda_pipeline', pipelineId],
    enabled: Boolean(pipelineId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select('id, nome, entidade_tipo, ativo')
        .eq('id', pipelineId as string)
        .single()
      if (error) throw error
      return data as Pick<Database['public']['Tables']['pipelines']['Row'], 'id' | 'nome' | 'entidade_tipo' | 'ativo'>
    },
  })
}

export function useApolicesPosVendaLookup(search: string, pipelineId: string | null | undefined) {
  const { activeBranchId } = useAuth()
  const pipeline = usePosVendaPipeline(pipelineId)

  return useQuery({
    queryKey: ['pos_venda_apolices_lookup', activeBranchId, pipelineId, search],
    enabled: Boolean(pipeline.data),
    queryFn: async (): Promise<PosVendaApoliceOption[]> => {
      const { data, error } = await supabase
        .from('apolices')
        .select(`
          id,
          segurado_id,
          seguradora_id,
          ramo_id,
          status,
          renovada_de_id,
          produtor_id,
          numero_apolice,
          numero_controle_documento,
          tipo_contratacao,
          tipo_apolice,
          certificado_individual,
          processo_susep,
          estipulante_nome,
          estipulante_cpf_cnpj,
          subestipulante_nome,
          subestipulante_cpf_cnpj,
          vigencia_inicio,
          vigencia_fim,
          vigencia_inicio_hora,
          vigencia_fim_hora,
          data_emissao,
          data_recebimento_documento,
          premio_total,
          premio_liquido,
          iof,
          adicional_fracionamento,
          lmg_total,
          moeda,
          periodicidade_pagamento,
          motivo_status,
          canal_emissao,
          observacoes,
          segurados:segurado_id ( id, nome, cpf_cnpj, filial_id, email, telefone ),
          seguradoras:seguradora_id ( id, nome ),
          ramos:ramo_id ( id, nome, risk_type, is_monthly )
        `)
        .order('numero_apolice', { ascending: true })
      if (error) throw error

      const processo = inferPosVendaProcesso(pipeline.data?.nome ?? null)
      const term = search.trim().toLocaleLowerCase('pt-BR')
      return ((data ?? []) as unknown as ApoliceLookupRow[])
        .filter((row): row is ApoliceLookupRow & { segurados: SeguradoResumo; ramos: RamoResumo } => (
          row.segurados != null && row.ramos != null && (!activeBranchId || row.segurados.filial_id === activeBranchId)
        ))
        .map((row) => {
          const reason = eligibilityReason(row, row.ramos, processo)
          return {
            id: row.id,
            numero_apolice: row.numero_apolice,
            status: row.status,
            vigencia_inicio: row.vigencia_inicio,
            vigencia_fim: row.vigencia_fim,
            premio_total: row.premio_total,
            segurado: row.segurados,
            seguradora: row.seguradoras,
            ramo: row.ramos,
            eligible: reason == null,
            reason,
          }
        })
        .filter((option) => !term || searchable(option).includes(term))
    },
  })
}

export function usePosVenda(id: string | undefined) {
  return useQuery({
    queryKey: ['pos_venda', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<PosVendaDetalhe> => {
      const { data, error } = await supabase
        .from('pos_vendas')
        .select(`
          *,
          apolices:apolice_id (
            id,
            numero_apolice,
            status,
            vigencia_inicio,
            vigencia_fim,
            premio_total,
            segurados:segurado_id ( id, nome, cpf_cnpj, filial_id, email, telefone ),
            seguradoras:seguradora_id ( id, nome ),
            ramos:ramo_id ( id, nome, risk_type, is_monthly )
          ),
          pipeline_stages:stage_id ( id, nome, cor, pipeline_id ),
          profiles:responsavel_id ( id, full_name, avatar_url )
        `)
        .eq('id', id as string)
        .single()
      if (error) throw error
      return data as unknown as PosVendaDetalhe
    },
  })
}

export function usePosVendaResponsaveis() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['pos_venda_responsaveis', user?.tenantId],
    queryFn: async (): Promise<PosVendaResponsavel[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, tenant_id')
        .order('full_name', { ascending: true })
      if (error) throw error
      return ((data ?? []) as PosVendaResponsavel[]).filter(
        (profile) => !user?.tenantId || !profile.tenant_id || profile.tenant_id === user.tenantId,
      )
    },
  })
}

export function useCreatePosVenda() {
  const queryClient = useQueryClient()
  const { user, activeBranchId } = useAuth()

  return useMutation({
    mutationFn: async (command: { input: PosVendaCreateInput; pipelineId: string }) => {
      if (!user?.tenantId) throw new Error('Usuário sem tenant válido para abrir o Pós-venda.')
      return createPosVendaInMemory(command.input, {
        tenantId: user.tenantId,
        filialId: activeBranchId,
        sessionUserId: user.id,
        pipelineId: command.pipelineId,
      })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kanban_cards', 'pos_venda'] }),
        queryClient.invalidateQueries({ queryKey: ['pos_venda', result.posVenda.id] }),
        queryClient.invalidateQueries({ queryKey: ['entity_tabs', 'pos_venda', result.posVenda.id] }),
      ])
    },
  })
}

export function useMaintainPosVenda() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: PosVendaMaintenanceInput) => {
      if (!user?.tenantId) throw new Error('Usuário sem tenant válido para manter o Pós-venda.')
      return maintainPosVendaInMemory(input, {
        tenantId: user.tenantId,
        sessionUserId: user.id,
      })
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pos_venda', result.posVenda.id] }),
        queryClient.invalidateQueries({ queryKey: ['kanban_cards', 'pos_venda'] }),
        queryClient.invalidateQueries({ queryKey: ['entity_tabs', 'pos_venda', result.posVenda.id] }),
      ])
    },
  })
}
