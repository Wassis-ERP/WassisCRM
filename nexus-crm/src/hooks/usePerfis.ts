import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Perfil } from '../types/platform';

/**
 * Lista de perfis de acesso ATIVOS do grupo (pré-configurados + personalizados).
 * Usado para popular selects (ex.: perfil-por-corretora na Equipe). D18.
 */
export function usePerfis() {
  return useQuery({
    queryKey: queryKeys.perfis,
    queryFn: async (): Promise<Perfil[]> => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Perfil[];
    },
    staleTime: 5 * 60_000,
  });
}
