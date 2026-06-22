import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Produtor } from '../types/platform';

export interface ProdutorOption {
  id: string;
  nome: string;
  profile_id: string | null;
  ativo: boolean;
}

/**
 * Lookup ativo de produtores de negócio. Produtor interno tem `profile_id`;
 * produtor externo não tem login e mantém `profile_id = null`.
 */
export function useProdutores() {
  return useQuery({
    queryKey: queryKeys.lookups.produtores,
    queryFn: async (): Promise<ProdutorOption[]> => {
      const { data, error } = await supabase
        .from('produtores')
        .select('id, nome, profile_id, ativo')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as Produtor[]).map((p) => ({
        id: p.id,
        nome: p.nome,
        profile_id: p.profile_id,
        ativo: p.ativo,
      }));
    },
    staleTime: 5 * 60_000,
  });
}
