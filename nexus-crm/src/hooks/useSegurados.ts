import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';

type SeguradoRow = Database['public']['Tables']['segurados']['Row'];

const SEGURADOS_KEY = ['segurados'] as const;

/**
 * Lista segurados do tenant (RLS aplica). Ordenado por nome.
 * Os campos sensiveis (CPF/CNPJ, email, telefone) trafegam de acordo com a LGPD:
 * o acesso a esta tabela ja e restrito via RLS e mascarado no log pelo Supabase.
 */
export function useSegurados() {
  const { session, loading: authLoading } = useAuth();
  const authReady = !authLoading && !!session;

  return useQuery({
    queryKey: SEGURADOS_KEY,
    enabled: authReady,
    queryFn: async (): Promise<SeguradoRow[]> => {
      const { data, error } = await supabase
        .from('segurados')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data ?? []) as SeguradoRow[];
    },
    staleTime: 60_000,
  });
}

export interface CreateSeguradoInput {
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  tipo?: Database['public']['Enums']['tipo_pessoa'];
  chatwoot_id?: string | null;
  endereco?: string | null;
}

/**
 * Cria um segurado mínimo para ser vinculado a uma oportunidade.
 * Preenche `tenant_id` do usuario logado e `created_by` com seu id.
 */
export function useCreateSegurado() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateSeguradoInput): Promise<SeguradoRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');

      const { data, error } = await supabase
        .from('segurados')
        .insert({
          nome: input.nome.trim(),
          cpf_cnpj: input.cpf_cnpj?.trim() || null,
          telefone: input.telefone?.trim() || null,
          email: input.email?.trim() || null,
          tipo: input.tipo ?? 'PF',
          chatwoot_id: input.chatwoot_id?.trim() || null,
          endereco: input.endereco?.trim() || null,
          tenant_id: user.tenantId,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as SeguradoRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SEGURADOS_KEY });
    },
  });
}

type SeguradoUpdate = Database['public']['Tables']['segurados']['Update'];

/**
 * Detalhe de um segurado por id (RLS do tenant).
 */
export function useSegurado(id: string | undefined) {
  const { session, loading: authLoading } = useAuth();
  const authReady = !authLoading && !!session;

  return useQuery({
    queryKey: [...SEGURADOS_KEY, id] as const,
    enabled: Boolean(id) && authReady,
    queryFn: async (): Promise<SeguradoRow> => {
      const { data, error } = await supabase
        .from('segurados')
        .select('*')
        .eq('id', id as string)
        .single();

      if (error) throw error;
      return data as SeguradoRow;
    },
    staleTime: 60_000,
  });
}

/**
 * Atualiza cadastro em `public.segurados`.
 */
export function useUpdateSegurado() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; patch: SeguradoUpdate }): Promise<SeguradoRow> => {
      const { data, error } = await supabase
        .from('segurados')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single();

      if (error) throw error;
      return data as SeguradoRow;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: SEGURADOS_KEY });
      qc.invalidateQueries({ queryKey: [...SEGURADOS_KEY, variables.id] });
    },
  });
}
