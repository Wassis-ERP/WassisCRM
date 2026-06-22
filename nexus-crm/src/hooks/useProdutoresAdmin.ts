import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import { onlyDigits } from '../utils/documento';
import type { Produtor, ProdutorInput } from '../types/platform';

/**
 * CRUD de produtores de negócio (Fase 0.2). Produtor interno aponta para
 * `profiles`; produtor externo não tem login.
 */
export function useProdutoresAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const listQuery = useQuery({
    queryKey: queryKeys.produtores,
    queryFn: async (): Promise<Produtor[]> => {
      const { data, error } = await supabase
        .from('produtores')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Produtor[];
    },
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.produtores });
    queryClient.invalidateQueries({ queryKey: queryKeys.lookups.produtores });
    queryClient.invalidateQueries({ queryKey: ['segurados'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.filiais });
    queryClient.invalidateQueries({ queryKey: queryKeys.lookups.filiais });
  };

  const normalize = (input: Partial<ProdutorInput>): Partial<ProdutorInput> => {
    const next = { ...input };
    if (next.cpf_cnpj !== undefined) next.cpf_cnpj = next.cpf_cnpj ? onlyDigits(next.cpf_cnpj) : null;
    if (next.profile_id === '') next.profile_id = null;
    if (next.percentual_repasse_padrao === undefined) next.percentual_repasse_padrao = null;
    return next;
  };

  const assertProfileAvailable = (profileId: string | null | undefined, selfId?: string) => {
    if (!profileId) return;
    const duplicate = (listQuery.data ?? []).find((p) => p.profile_id === profileId && p.id !== selfId);
    if (duplicate) {
      throw new Error(`Este membro já está vinculado ao produtor ${duplicate.nome}.`);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (input: ProdutorInput): Promise<Produtor> => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      assertProfileAvailable(input.profile_id);
      const payload = normalize({ ...input, ativo: true });
      const { data, error } = await supabase
        .from('produtores')
        .insert({ ...payload, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      const produtor = data as Produtor;
      await supabase.from('audit_logs').insert({
        action: 'CREATE_PRODUTOR',
        entity_type: 'produtores',
        entity_id: produtor.id,
        new_data: { nome: produtor.nome, profile_id: produtor.profile_id },
      });
      return produtor;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProdutorInput> }): Promise<Produtor> => {
      assertProfileAvailable(patch.profile_id, id);
      const payload = normalize(patch);
      const { data, error } = await supabase
        .from('produtores')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_PRODUTOR',
        entity_type: 'produtores',
        entity_id: id,
        new_data: payload,
      });
      return data as Produtor;
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtores').update({ ativo: false }).eq('id', id);
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_PRODUTOR',
        entity_type: 'produtores',
        entity_id: id,
      });
    },
    onSuccess: invalidate,
  });

  return {
    produtores: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
