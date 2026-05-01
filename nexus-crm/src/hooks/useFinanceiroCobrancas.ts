import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';

type CobrancaRow = Database['public']['Tables']['financeiro_cobrancas']['Row'];
type CobrancaInsert = Database['public']['Tables']['financeiro_cobrancas']['Insert'];
type CobrancaUpdate = Database['public']['Tables']['financeiro_cobrancas']['Update'];

export interface CreateCobrancaInput {
  /**
   * Opcional: permite criar cobrancas avulsas/inadimplencia pura (ver migracao 007).
   * Se omitido e a coluna ainda for NOT NULL no banco, o insert falhara e o
   * usuario recebera erro de constraint no modal ate a migracao ser aplicada.
   */
  oportunidadeId?: string | null;
  pipelineId: string;
  stageId: string;
  proximoFollowup?: string | null;
  observacoes?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Cria uma cobranca financeira vinculada ao tenant/responsavel logado.
 * Cobrancas podem ser vinculadas a uma oportunidade (apolice) OU avulsas
 * para controle puro de inadimplencia (quando a migracao 007 estiver aplicada).
 */
export function useCreateCobranca() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCobrancaInput): Promise<CobrancaRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');

      const payload: CobrancaInsert = {
        // Cast para any so para contornar a tipagem atual (NOT NULL); o banco decide.
        oportunidade_id: (input.oportunidadeId ?? null) as unknown as CobrancaInsert['oportunidade_id'],
        pipeline_id: input.pipelineId,
        stage_id: input.stageId,
        proximo_followup: input.proximoFollowup ?? null,
        observacoes: input.observacoes ?? null,
        metadata: (input.metadata ?? {}) as CobrancaInsert['metadata'],
        responsavel_id: user.id,
        tenant_id: user.tenantId,
        status: 'pending',
      };

      const { data, error } = await supabase.from('financeiro_cobrancas').insert(payload).select('*').single();
      if (error) throw error;
      return data as CobrancaRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('financeiro', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('financeiro', row.pipeline_id, 'all') });
    },
  });
}

/** Atualiza colunas pontuais de uma cobranca. */
export function useUpdateCobranca() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; patch: CobrancaUpdate }): Promise<CobrancaRow> => {
      const { data, error } = await supabase
        .from('financeiro_cobrancas')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as CobrancaRow;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: queryKeys.cards('financeiro', row.pipeline_id, 'pending') });
      qc.invalidateQueries({ queryKey: queryKeys.cards('financeiro', row.pipeline_id, 'all') });
      qc.invalidateQueries({ queryKey: ['cobranca', row.id] });
    },
  });
}

/**
 * Busca detalhe de uma cobranca (eventual join na oportunidade e segurado).
 */
export function useCobranca(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['cobranca', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financeiro_cobrancas')
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
