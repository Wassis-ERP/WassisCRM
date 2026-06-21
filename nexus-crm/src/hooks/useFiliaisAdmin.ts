import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import { onlyDigits } from '../utils/documento';
import type { Filial, FilialInput } from '../types/platform';

/**
 * CRUD das corretoras (filiais). Segue o padrão de useLookupsAdmin, mas com
 * payload de objeto completo. `cnpj_cpf` é normalizado (só dígitos) antes de
 * gravar. Soft-delete via `ativo:false`. Auditoria em cada mutação.
 */
export function useFiliaisAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const listQuery = useQuery({
    queryKey: queryKeys.filiais,
    queryFn: async (): Promise<Filial[]> => {
      const { data, error } = await supabase
        .from('filiais')
        .select('*')
        .eq('ativo', true)
        .order('razao_social', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Filial[];
    },
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.filiais });
    queryClient.invalidateQueries({ queryKey: queryKeys.lookups.filiais });
    queryClient.invalidateQueries({ queryKey: ['profile_filiais'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.team });
  };

  const normalize = (input: Partial<FilialInput>): Partial<FilialInput> => {
    const next = { ...input };
    if (next.cnpj_cpf !== undefined) next.cnpj_cpf = next.cnpj_cpf ? onlyDigits(next.cnpj_cpf) : null;
    if (next.cep !== undefined) next.cep = next.cep ? onlyDigits(next.cep) : null;
    if (next.uf !== undefined) next.uf = next.uf ? next.uf.toUpperCase().slice(0, 2) : null;
    return next;
  };

  /**
   * Invariante de matriz: existe no máximo UMA matriz por grupo (matriz_id NULL);
   * as demais corretoras são filiais que apontam para ela. Resolve o matriz_id
   * desejado, bloqueando uma 2ª matriz e forçando a filial a apontar para a matriz
   * real (impede auto-referência e ciclos).
   */
  const resolveMatrizId = async (
    desired: string | null | undefined,
    selfId?: string,
  ): Promise<string | null> => {
    const { data } = await supabase
      .from('filiais')
      .select('id, matriz_id, fantasia, razao_social')
      .eq('ativo', true);
    const all = (data ?? []) as Array<Record<string, unknown>>;
    const otherMatriz = all.find((f) => !f.matriz_id && f.id !== selfId);
    if (!desired) {
      if (otherMatriz) {
        const nome =
          (otherMatriz.fantasia as string) || (otherMatriz.razao_social as string) || 'existente';
        throw new Error(`Já existe uma matriz no grupo (${nome}). Cadastre esta corretora como filial.`);
      }
      return null;
    }
    if (!otherMatriz) {
      throw new Error('Cadastre primeiro a matriz do grupo — a primeira corretora é a matriz.');
    }
    return otherMatriz.id as string;
  };

  const createMutation = useMutation({
    mutationFn: async (input: FilialInput): Promise<Filial> => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      const matriz_id = await resolveMatrizId(input.matriz_id);
      const { data, error } = await supabase
        .from('filiais')
        .insert({ ...normalize(input), matriz_id, tenant_id: tenantId, ativo: true })
        .select()
        .single();
      if (error) throw error;
      const filial = data as Filial;
      await supabase.from('audit_logs').insert({
        action: 'CREATE_FILIAL',
        entity_type: 'filiais',
        entity_id: filial.id,
        new_data: { razao_social: input.razao_social, fantasia: input.fantasia },
      });
      // Concede acesso ao criador (perfil Master) para a nova corretora já
      // aparecer no seletor e no acesso do usuário.
      const { data: perfisData } = await supabase
        .from('perfis')
        .select('id, nome, sistema')
        .eq('ativo', true);
      const perfis = (perfisData ?? []) as Array<{ id: string; nome: string; sistema: boolean }>;
      const master = perfis.find((p) => p.sistema && p.nome === 'Master') ?? perfis[0];
      if (master && user?.id) {
        await supabase.from('profile_filiais').insert({
          profile_id: user.id,
          filial_id: filial.id,
          perfil_id: master.id,
          principal: false,
        });
      }
      return filial;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<FilialInput> }): Promise<Filial> => {
      const norm = normalize(patch);
      if ('matriz_id' in patch) norm.matriz_id = await resolveMatrizId(patch.matriz_id, id);
      const { data, error } = await supabase
        .from('filiais')
        .update(norm)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_FILIAL',
        entity_type: 'filiais',
        entity_id: id,
        new_data: norm,
      });
      return data as Filial;
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('filiais').update({ ativo: false }).eq('id', id);
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_FILIAL',
        entity_type: 'filiais',
        entity_id: id,
      });
    },
    onSuccess: invalidate,
  });

  return {
    filiais: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
