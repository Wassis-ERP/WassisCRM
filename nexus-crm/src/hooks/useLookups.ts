import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';

interface LookupRow {
  id: string;
  nome: string;
}

export type RamoRiskType = 'VEICULO' | 'IMOVEL' | 'VIDA' | 'EMPRESA' | 'CARGA' | 'SAUDE' | 'DIVERSOS';

export type RamoGrupoOperacional =
  | 'Auto e Frota'
  | 'Patrimonial'
  | 'Pessoas'
  | 'Empresarial'
  | 'Transporte'
  | 'Diversos';

export interface RamoRow extends LookupRow {
  risk_type: RamoRiskType;
  is_monthly: boolean;
  grupo_operacional: RamoGrupoOperacional;
  comissao_padrao?: number;
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

async function fetchRamos(): Promise<RamoRow[]> {
  const { data, error } = await supabase
    .from('ramos')
    .select('id, nome, risk_type, is_monthly, grupo_operacional, comissao_padrao')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RamoRow[];
}

/** Lista de Ramos ativos do tenant. RLS aplica o isolamento. */
export function useRamos() {
  return useQuery({ queryKey: queryKeys.lookups.ramos, queryFn: fetchRamos, staleTime: 5 * 60_000 });
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
