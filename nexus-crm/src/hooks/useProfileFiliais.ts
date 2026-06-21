import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { ProfileFilial } from '../types/platform';

/**
 * Vínculos usuário ↔ corretora (perfil por filial — D12/D18). Lê e edita os
 * registros de `profile_filiais` de um usuário: define o perfil em cada corretora
 * e qual é a "casa" (principal). `principal` é único por usuário.
 */
export function useProfileFiliais(profileId: string | undefined) {
  const queryClient = useQueryClient();
  const key = queryKeys.profileFiliais(profileId ?? '');

  const query = useQuery({
    queryKey: key,
    enabled: !!profileId,
    queryFn: async (): Promise<ProfileFilial[]> => {
      const { data, error } = await supabase
        .from('profile_filiais')
        .select('*')
        .eq('profile_id', profileId as string);
      if (error) throw error;
      return (data ?? []) as ProfileFilial[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: key });
    // a lista da Equipe (get_team_members) deriva de profile_filiais — refletir na hora.
    queryClient.invalidateQueries({ queryKey: queryKeys.team });
  };

  const setVinculo = useMutation({
    mutationFn: async ({
      filialId,
      perfilId,
      principal,
    }: {
      filialId: string;
      perfilId: string;
      principal?: boolean;
    }) => {
      if (!profileId) throw new Error('Usuário ausente');
      const current = query.data ?? [];
      const existing = current.find((v) => v.filial_id === filialId);

      if (principal) {
        // principal é único por usuário: desmarca as demais.
        for (const v of current) {
          if (v.principal && v.filial_id !== filialId) {
            await supabase.from('profile_filiais').update({ principal: false }).eq('id', v.id);
          }
        }
      }

      if (existing) {
        await supabase
          .from('profile_filiais')
          .update({ perfil_id: perfilId, ...(principal !== undefined ? { principal } : {}) })
          .eq('id', existing.id);
      } else {
        await supabase.from('profile_filiais').insert({
          profile_id: profileId,
          filial_id: filialId,
          perfil_id: perfilId,
          principal: principal ?? false,
        });
      }
    },
    onSuccess: invalidate,
  });

  const removeVinculo = useMutation({
    mutationFn: async (filialId: string) => {
      const existing = (query.data ?? []).find((v) => v.filial_id === filialId);
      if (existing) {
        const { error } = await supabase.from('profile_filiais').delete().eq('id', existing.id);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  return {
    vinculos: query.data ?? [],
    isLoading: query.isLoading,
    setVinculo: setVinculo.mutateAsync,
    removeVinculo: removeVinculo.mutateAsync,
    isSaving: setVinculo.isPending || removeVinculo.isPending,
  };
}
