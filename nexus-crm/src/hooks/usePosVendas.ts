import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';

type PosVendaRow = Database['public']['Tables']['pos_vendas']['Row'];
type PosVendaInsert = Database['public']['Tables']['pos_vendas']['Insert'];
type PosVendaUpdate = Database['public']['Tables']['pos_vendas']['Update'];

export interface CreatePosVendaInput {
  oportunidadeId: string;
  pipelineId: string;
  stageId: string;
  proximoFollowup?: string | null;
  observacoes?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Cria um registro de pos-venda vinculado a uma oportunidade. Em producao, o
 * fluxo primario sera via n8n (Fase 4); este hook existe para fallback manual.
 */
export function useCreatePosVenda() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePosVendaInput): Promise<PosVendaRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');

      const payload: PosVendaInsert = {
        oportunidade_id: input.oportunidadeId,
        pipeline_id: input.pipelineId,
        stage_id: input.stageId,
        proximo_followup: input.proximoFollowup ?? null,
        observacoes: input.observacoes ?? null,
        metadata: (input.metadata ?? {}) as PosVendaInsert['metadata'],
        responsavel_id: user.id,
        tenant_id: user.tenantId,
        status: 'pending',
      };

      const { data, error } = await supabase.from('pos_vendas').insert(payload).select('*').single();
      if (error) throw error;
      return data as PosVendaRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('pos_venda', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('pos_venda', row.pipeline_id, 'all') });
    },
  });
}

/** Atualiza colunas pontuais de um registro de pos-venda. */
export function useUpdatePosVenda() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; patch: PosVendaUpdate }): Promise<PosVendaRow> => {
      const { data, error } = await supabase
        .from('pos_vendas')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as PosVendaRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('pos_venda', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('pos_venda', row.pipeline_id, 'all') });
      qc.invalidateQueries({ queryKey: ['pos_venda', row.id] });
    },
  });
}

/**
 * Detalhe de um registro de pos-venda com joins na oportunidade e segurado.
 */
export function usePosVenda(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['pos_venda', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pos_vendas')
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
