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

export type RamoFormaCalculo = 'AUTO' | 'RESIDENCIA' | 'CONDOMINIO' | 'VIDA' | 'EMPRESA' | 'DIVERSOS';

export type RamoCategoriaRisco =
  | 'AUTO_FROTA'
  | 'RESIDENCIAL'
  | 'CONDOMINIO'
  | 'EMPRESARIAL'
  | 'VIDA'
  | 'SAUDE'
  | 'TRANSPORTE'
  | 'DIVERSOS';

export type RamoCategoriaRiscoDefinition = {
  value: RamoCategoriaRisco;
  label: string;
  risk_type: RamoRiskType;
  grupo_operacional: RamoGrupoOperacional;
  forma_calculo: RamoFormaCalculo;
};

export const RAMO_CATEGORIAS_RISCO: RamoCategoriaRiscoDefinition[] = [
  { value: 'AUTO_FROTA', label: 'Auto e Frota', risk_type: 'VEICULO', grupo_operacional: 'Auto e Frota', forma_calculo: 'AUTO' },
  { value: 'RESIDENCIAL', label: 'Residencial', risk_type: 'IMOVEL', grupo_operacional: 'Patrimonial', forma_calculo: 'RESIDENCIA' },
  { value: 'CONDOMINIO', label: 'Condomínio', risk_type: 'IMOVEL', grupo_operacional: 'Patrimonial', forma_calculo: 'CONDOMINIO' },
  { value: 'EMPRESARIAL', label: 'Empresarial', risk_type: 'EMPRESA', grupo_operacional: 'Empresarial', forma_calculo: 'EMPRESA' },
  { value: 'VIDA', label: 'Vida', risk_type: 'VIDA', grupo_operacional: 'Pessoas', forma_calculo: 'VIDA' },
  { value: 'SAUDE', label: 'Saúde', risk_type: 'SAUDE', grupo_operacional: 'Pessoas', forma_calculo: 'DIVERSOS' },
  { value: 'TRANSPORTE', label: 'Transporte', risk_type: 'CARGA', grupo_operacional: 'Transporte', forma_calculo: 'DIVERSOS' },
  { value: 'DIVERSOS', label: 'Diversos', risk_type: 'DIVERSOS', grupo_operacional: 'Diversos', forma_calculo: 'DIVERSOS' },
];

export const RAMO_CATEGORIA_RISCO_MAP = RAMO_CATEGORIAS_RISCO.reduce(
  (acc, item) => {
    acc[item.value] = item;
    return acc;
  },
  {} as Record<RamoCategoriaRisco, RamoCategoriaRiscoDefinition>,
);

export function getRamoCategoriaRiscoFromFields(
  riskType: RamoRiskType,
  grupoOperacional: RamoGrupoOperacional,
  formaCalculo: RamoFormaCalculo | null,
) {
  const forma = formaCalculo ?? 'DIVERSOS';
  return (
    RAMO_CATEGORIAS_RISCO.find(
      (item) =>
        item.risk_type === riskType &&
        item.grupo_operacional === grupoOperacional &&
        item.forma_calculo === forma,
    ) ?? RAMO_CATEGORIA_RISCO_MAP.DIVERSOS
  );
}

export interface RamoRow extends LookupRow {
  risk_type: RamoRiskType;
  is_monthly: boolean;
  grupo_operacional: RamoGrupoOperacional;
  codigo_susep: string | null;
  forma_calculo: RamoFormaCalculo | null;
  renovavel: boolean;
  permite_endosso: boolean;
  exige_item: boolean;
  exige_coberturas: boolean;
  ordem: number | null;
  ativo: boolean;
  observacoes: string | null;
}

async function fetchLookup(table: 'ramos' | 'origens' | 'seguradoras' | 'motivos_perda'): Promise<LookupRow[]> {
  const query = supabase
    .from(table)
    .select('id, nome')
    .eq('ativo', true);

  const { data, error } = await query.order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []) as LookupRow[];
}

async function fetchRamos(): Promise<RamoRow[]> {
  const { data, error } = await supabase
    .from('ramos')
    .select('id, nome, codigo_susep, risk_type, grupo_operacional, forma_calculo, is_monthly, renovavel, permite_endosso, exige_item, exige_coberturas, ordem, ativo, observacoes')
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
