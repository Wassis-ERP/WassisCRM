import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';

export interface FilialOption {
  id: string;
  label: string; // fantasia ?? razao_social ?? id
  matriz_id: string | null;
}

/**
 * Lista de corretoras (filiais) ATIVAS do grupo, no formato leve para selects
 * e para o seletor de corretora ativa do Header. RLS aplica o isolamento.
 */
export function useFiliais() {
  return useQuery({
    queryKey: queryKeys.lookups.filiais,
    queryFn: async (): Promise<FilialOption[]> => {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, fantasia, razao_social, matriz_id, ativo')
        .eq('ativo', true)
        .order('fantasia', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((f: Record<string, unknown>) => ({
        id: f.id as string,
        label: (f.fantasia as string) || (f.razao_social as string) || (f.id as string),
        matriz_id: (f.matriz_id as string | null) ?? null,
      }));
    },
    staleTime: 5 * 60_000,
  });
}

/** Mapa id -> rótulo da corretora, para resolver nomes no Header/listas. */
export function useFilialLabelMap() {
  const query = useFiliais();
  const map = new Map<string, string>((query.data ?? []).map((f) => [f.id, f.label]));
  return { ...query, map };
}
