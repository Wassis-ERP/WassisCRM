import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';

interface LookupRow {
  id: string;
  nome: string;
}

async function fetchLookup(table: 'ramos' | 'origens' | 'seguradoras' | 'motivos_perda'): Promise<LookupRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select('id, nome')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []) as LookupRow[];
}

/** Lista de Ramos ativos do tenant. RLS aplica o isolamento. */
export function useRamos() {
  return useQuery({ queryKey: queryKeys.lookups.ramos, queryFn: () => fetchLookup('ramos'), staleTime: 5 * 60_000 });
}

/** Lista de Origens ativas do tenant. */
export function useOrigens() {
  return useQuery({ queryKey: queryKeys.lookups.origens, queryFn: () => fetchLookup('origens'), staleTime: 5 * 60_000 });
}

/** Lista de Seguradoras ativas do tenant. */
export function useSeguradoras() {
  return useQuery({ queryKey: queryKeys.lookups.seguradoras, queryFn: () => fetchLookup('seguradoras'), staleTime: 5 * 60_000 });
}

/** Lista de Motivos de Perda ativos do tenant. */
export function useMotivosPerda() {
  return useQuery({ queryKey: queryKeys.lookups.motivosPerda, queryFn: () => fetchLookup('motivos_perda'), staleTime: 5 * 60_000 });
}
