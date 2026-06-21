import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';
import { useActiveFilialId } from './useActiveFilial';

type OportunidadeRow = Database['public']['Tables']['oportunidades']['Row'];
type OportunidadeInsert = Database['public']['Tables']['oportunidades']['Insert'];
type OportunidadeUpdate = Database['public']['Tables']['oportunidades']['Update'];

export interface CreateOportunidadeInput {
  nome: string;
  pipelineId: string;
  stageId: string;
  seguradoId?: string | null;
  ramoId?: string | null;
  seguradoraId?: string | null;
  origemId?: string | null;
  premioLiquido?: number | null;
  comissaoPercentual?: number | null;
  agenciamento?: number | null;
  tipoNegocio?: Database['public']['Enums']['tipo_negocio'] | null;
  tipoContato?: boolean | null;
  vigenciaInicio?: string | null;
  vigenciaFim?: string | null;
  proximoFollowup?: string | null;
  indicador?: string | null;
  observacoes?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Cria uma oportunidade vinculada ao tenant e responsavel logado.
 * Invalida o cache do Kanban Comercial para refletir no board.
 */
export function useCreateOportunidade() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const filialId = useActiveFilialId();

  return useMutation({
    mutationFn: async (input: CreateOportunidadeInput): Promise<OportunidadeRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');

      const payload: OportunidadeInsert = {
        nome: input.nome.trim(),
        pipeline_id: input.pipelineId,
        stage_id: input.stageId,
        segurado_id: input.seguradoId ?? null,
        ramo_id: input.ramoId ?? null,
        seguradora_id: input.seguradoraId ?? null,
        origem_id: input.origemId ?? null,
        premio_liquido: input.premioLiquido ?? null,
        comissao_percentual: input.comissaoPercentual ?? null,
        agenciamento: input.agenciamento ?? null,
        tipo_negocio: input.tipoNegocio ?? null,
        tipo_contato: input.tipoContato ?? null,
        vigencia_inicio: input.vigenciaInicio ?? null,
        vigencia_fim: input.vigenciaFim ?? null,
        proximo_followup: input.proximoFollowup ?? null,
        indicador: input.indicador ?? null,
        observacoes: input.observacoes ?? null,
        metadata: (input.metadata ?? {}) as OportunidadeInsert['metadata'],
        responsavel_id: user.id,
        tenant_id: user.tenantId,
        filial_id: filialId,
        status: 'pending',
      };

      const { data, error } = await supabase.from('oportunidades').insert(payload).select('*').single();
      if (error) throw error;
      return data as OportunidadeRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('comercial', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('comercial', row.pipeline_id, 'all') });
    },
  });
}

/**
 * Atualiza colunas pontuais de uma oportunidade (ex.: partial update do detalhe).
 */
export function useUpdateOportunidade() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; patch: OportunidadeUpdate }): Promise<OportunidadeRow> => {
      const { data, error } = await supabase
        .from('oportunidades')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as OportunidadeRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('comercial', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('comercial', row.pipeline_id, 'all') });
      qc.invalidateQueries({ queryKey: ['oportunidade', row.id] });
    },
  });
}

/**
 * Busca detalhe de uma oportunidade com joins (segurado, ramo, seguradora, origem, motivo_perda, profile).
 */
export function useOportunidade(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['oportunidade', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oportunidades')
        .select(`
          *,
          segurados:segurado_id ( id, nome, cpf_cnpj, telefone, email ),
          ramos:ramo_id ( id, nome, comissao_padrao ),
          seguradoras:seguradora_id ( id, nome ),
          origens:origem_id ( id, nome ),
          motivos_perda:motivo_perda_id ( id, nome )
        `)
        .eq('id', id as string)
        .single();
      if (error) throw error;

      const row = data as Record<string, unknown>;
      const rid = row.responsavel_id as string | undefined;
      if (rid) {
        const { data: prof, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', rid)
          .maybeSingle();
        if (!pErr && prof) {
          return { ...row, profiles: prof } as typeof data;
        }
      }
      return data;
    },
  });
}
