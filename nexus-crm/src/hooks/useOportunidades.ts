import { createBackendOpportunity, getBackendInsuredPerson, getBackendOpportunity, updateBackendOpportunity, usesBackendDomainData } from '../lib/backendDomainApi'
import { getTable } from '../lib/inMemoryDb'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useAuth } from './useAuth'
import { useActiveFilialId } from './useActiveFilial'
import {
  buildOpportunityInsert,
  type OpportunityCreateInput,
  type OpportunityRow,
  type OpportunityUpdate,
} from '../modules/comercial/opportunityDomain'

type SeguradoLite = Pick<Database['public']['Tables']['segurados']['Row'], 'id' | 'nome' | 'cpf_cnpj' | 'telefone' | 'email'>
type RamoLite = Pick<Database['public']['Tables']['ramos']['Row'], 'id' | 'nome' | 'risk_type' | 'grupo_operacional' | 'forma_calculo'>
type LookupLite = { id: string; nome: string | null }
type ProfileLite = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'nome_completo' | 'avatar_url'>
type StageRow = Database['public']['Tables']['pipeline_stages']['Row']

export type OpportunityDetail = OpportunityRow & {
  segurados: SeguradoLite | null
  ramos: RamoLite | null
  origens: LookupLite | null
  motivos_perda: LookupLite | null
  profiles: ProfileLite | null
  pipeline_stage: StageRow | null
}

export type CreateOportunidadeInput = OpportunityCreateInput
const todayIso = () => new Date().toISOString().slice(0, 10)

function invalidateOpportunityQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  void queryClient.invalidateQueries({ queryKey: ['kanban_cards', 'comercial'] })
  void queryClient.invalidateQueries({ queryKey: ['segurado-negocios', 'oportunidades'] })
  if (id) void queryClient.invalidateQueries({ queryKey: ['oportunidade', id] })
}

/** Cria lead ou oportunidade vinculada usando somente as colunas canônicas do DBML v2.6. */
export function useCreateOportunidade() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const filialId = useActiveFilialId()

  return useMutation({
    mutationFn: async (input: CreateOportunidadeInput): Promise<OpportunityRow> => {
      if (!user?.tenantId) throw new Error('Usuário sem grupo vinculado')
      if (!filialId) throw new Error('Selecione uma corretora para cadastrar a oportunidade')
      const payload = buildOpportunityInsert(input, {
        tenantId: user.tenantId,
        filialId,
        responsavelId: user.id,
        dataAbertura: todayIso(),
      })

      if (usesBackendDomainData) return createBackendOpportunity(payload, user.tenantId)
      const { data, error } = await supabase.from('oportunidades').insert(payload).select('*').single()
      if (error) throw error
      return data as OpportunityRow
    },
    onSuccess: (row) => invalidateOpportunityQueries(queryClient, row.id),
  })
}

/** Atualiza apenas campos do contrato v2.6 e invalida detalhe, lista e Kanban. */
export function useUpdateOportunidade() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: { id: string; patch: OpportunityUpdate }): Promise<OpportunityRow> => {
      if (usesBackendDomainData) return updateBackendOpportunity(args.id, args.patch, user?.tenantId ?? null)
      const { data, error } = await supabase
        .from('oportunidades')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single()
      if (error) throw error
      return data as OpportunityRow
    },
    onSuccess: (row) => invalidateOpportunityQueries(queryClient, row.id),
  })
}

/** Busca o detalhe e resolve joins sem depender de FKs legadas de pipeline/seguradora. */
export function useOportunidade(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    enabled: Boolean(id),
    queryKey: ['oportunidade', id],
    queryFn: async (): Promise<OpportunityDetail> => {
      if (usesBackendDomainData) {
        const row = await getBackendOpportunity(id as string, user?.tenantId ?? null)
        const insured = row.segurado_id ? await getBackendInsuredPerson(row.segurado_id, row.tenant_id) : null
        const lookup = <T,>(table: string, value: string | null): T | null =>
          (getTable(table).find(item => item.id === value) as T | undefined) ?? null
        return {
          ...row,
          segurados: insured,
          ramos: lookup<RamoLite>('ramos', row.ramo_id),
          origens: lookup<LookupLite>('origens', row.origem_id),
          motivos_perda: lookup<LookupLite>('motivos_perda', row.motivo_perda_id),
          profiles: lookup<ProfileLite>('profiles', row.responsavel_id),
          pipeline_stage: lookup<StageRow>('pipeline_stages', row.stage_id),
        }
      }
      const { data, error } = await supabase
        .from('oportunidades')
        .select(`
          *,
          segurados:segurado_id ( id, nome, cpf_cnpj, telefone, email ),
          ramos:ramo_id ( id, nome, risk_type, grupo_operacional, forma_calculo ),
          origens:origem_id ( id, nome ),
          motivos_perda:motivo_perda_id ( id, nome )
        `)
        .eq('id', id as string)
        .single()
      if (error) throw error

      const row = data as unknown as OpportunityRow & {
        segurados?: SeguradoLite | null
        ramos?: RamoLite | null
        origens?: LookupLite | null
        motivos_perda?: LookupLite | null
      }
      const [profileResult, stageResult] = await Promise.all([
        row.responsavel_id
          ? supabase.from('profiles').select('id, nome_completo, avatar_url').eq('id', row.responsavel_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('pipeline_stages').select('*').eq('id', row.stage_id).maybeSingle(),
      ])
      if (profileResult.error) throw profileResult.error
      if (stageResult.error) throw stageResult.error

      return {
        ...row,
        segurados: row.segurados ?? null,
        ramos: row.ramos ?? null,
        origens: row.origens ?? null,
        motivos_perda: row.motivos_perda ?? null,
        profiles: (profileResult.data as ProfileLite | null) ?? null,
        pipeline_stage: (stageResult.data as StageRow | null) ?? null,
      }
    },
  })
}

export function useOpportunityProfiles() {
  return useQuery({
    queryKey: ['profiles', 'opportunity-lookup'],
    queryFn: async (): Promise<ProfileLite[]> => {
      const { data, error } = await supabase.from('profiles').select('id, nome_completo, avatar_url').order('nome_completo')
      if (error) throw error
      return (data ?? []) as ProfileLite[]
    },
    staleTime: 5 * 60_000,
  })
}
