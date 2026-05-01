import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';

type EmissaoRow = Database['public']['Tables']['emissoes']['Row'];
type EmissaoInsert = Database['public']['Tables']['emissoes']['Insert'];
type EmissaoUpdate = Database['public']['Tables']['emissoes']['Update'];

export interface CreateEmissaoInput {
  oportunidadeId: string;
  pipelineId: string;
  stageId: string;
  proximoFollowup?: string | null;
  observacoes?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Cria uma emissao vinculada a uma oportunidade existente. Em producao, o
 * fluxo primario sera via n8n (Fase 4); este hook existe para fallback manual.
 */
export function useCreateEmissao() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEmissaoInput): Promise<EmissaoRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');

      const payload: EmissaoInsert = {
        oportunidade_id: input.oportunidadeId,
        pipeline_id: input.pipelineId,
        stage_id: input.stageId,
        proximo_followup: input.proximoFollowup ?? null,
        observacoes: input.observacoes ?? null,
        metadata: (input.metadata ?? {}) as EmissaoInsert['metadata'],
        responsavel_id: user.id,
        tenant_id: user.tenantId,
        status: 'pending',
      };

      const { data, error } = await supabase.from('emissoes').insert(payload).select('*').single();
      if (error) throw error;
      return data as EmissaoRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('emissao', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('emissao', row.pipeline_id, 'all') });
    },
  });
}

/** Atualiza colunas pontuais de uma emissao. */
export function useUpdateEmissao() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; patch: EmissaoUpdate }): Promise<EmissaoRow> => {
      const { data, error } = await supabase
        .from('emissoes')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as EmissaoRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('emissao', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('emissao', row.pipeline_id, 'all') });
      qc.invalidateQueries({ queryKey: ['emissao', row.id] });
    },
  });
}

/**
 * Detalhe de uma emissao com joins na oportunidade e segurado.
 */
export function useEmissao(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['emissao', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emissoes')
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
