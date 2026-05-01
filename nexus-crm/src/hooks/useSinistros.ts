import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';

type SinistroRow = Database['public']['Tables']['sinistros']['Row'];
type SinistroInsert = Database['public']['Tables']['sinistros']['Insert'];
type SinistroUpdate = Database['public']['Tables']['sinistros']['Update'];
type TipoSinistro = Database['public']['Enums']['tipo_sinistro'];

export interface CreateSinistroInput {
  oportunidadeId: string;
  pipelineId: string;
  stageId: string;
  numeroSinistro?: string | null;
  dataSinistro?: string | null;
  dataAviso?: string | null;
  tipoSinistro?: TipoSinistro | null;
  valorPrejuizo?: number | null;
  valorIndenizacao?: number | null;
  observacoes?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Cria um sinistro vinculado ao tenant/responsavel logado e a uma oportunidade existente.
 */
export function useCreateSinistro() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateSinistroInput): Promise<SinistroRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');

      const payload: SinistroInsert = {
        oportunidade_id: input.oportunidadeId,
        pipeline_id: input.pipelineId,
        stage_id: input.stageId,
        numero_sinistro: input.numeroSinistro ?? null,
        data_sinistro: input.dataSinistro ?? null,
        data_aviso: input.dataAviso ?? null,
        tipo_sinistro: input.tipoSinistro ?? null,
        valor_prejuizo: input.valorPrejuizo ?? null,
        valor_indenizacao: input.valorIndenizacao ?? null,
        observacoes: input.observacoes ?? null,
        metadata: (input.metadata ?? {}) as SinistroInsert['metadata'],
        responsavel_id: user.id,
        tenant_id: user.tenantId,
        status: 'pending',
      };

      const { data, error } = await supabase.from('sinistros').insert(payload).select('*').single();
      if (error) throw error;
      return data as SinistroRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('sinistro', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('sinistro', row.pipeline_id, 'all') });
    },
  });
}

/** Atualiza colunas pontuais de um sinistro. */
export function useUpdateSinistro() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; patch: SinistroUpdate }): Promise<SinistroRow> => {
      const { data, error } = await supabase
        .from('sinistros')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as SinistroRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('sinistro', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('sinistro', row.pipeline_id, 'all') });
      qc.invalidateQueries({ queryKey: ['sinistro', row.id] });
    },
  });
}

/**
 * Busca detalhe de um sinistro com joins na oportunidade (segurado, ramo, seguradora).
 */
export function useSinistro(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['sinistro', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sinistros')
        .select(`
          *,
          oportunidades:oportunidade_id (
            id,
            nome,
            segurados:segurado_id ( id, nome, cpf_cnpj, telefone, email ),
            ramos:ramo_id ( id, nome ),
            seguradoras:seguradora_id ( id, nome )
          )
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
