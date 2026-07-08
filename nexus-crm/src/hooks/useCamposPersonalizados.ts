import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';
import type {
  CampoDefinicaoRow,
  CampoEntidadeTipo,
  CampoOpcaoRow,
} from './useLookupsAdmin';

type CampoValorRow = Database['public']['Tables']['campo_valores']['Row'];
type CampoValorOpcaoRow = Database['public']['Tables']['campo_valor_opcoes']['Row'];
type CampoValorInsert = Database['public']['Tables']['campo_valores']['Insert'];

export type CampoValorInput = string | number | boolean | string[] | null;

export type CampoPersonalizadoOperacional = CampoDefinicaoRow & {
  opcoes: CampoOpcaoRow[];
  valor: CampoValorRow | null;
  valorOpcoes: CampoValorOpcaoRow[];
};

const valorBase = (campoDefinicaoId: string, entidadeId: string): CampoValorInsert => ({
  campo_definicao_id: campoDefinicaoId,
  entidade_id: entidadeId,
  valor_texto: null,
  valor_numero: null,
  valor_booleano: null,
  valor_data: null,
  valor_datahora: null,
  valor_opcao_id: null,
  preenchido_em: new Date().toISOString(),
  origem: 'manual',
  validado_em: null,
});

const isBlank = (value: unknown) => value === null || value === undefined || value === '';

export function isCampoValorInputEmpty(definicao: CampoDefinicaoRow, value: CampoValorInput): boolean {
  if (definicao.tipo_dado === 'BOOLEANO') return value === null || value === undefined || value === '';
  if (definicao.tipo_dado === 'LISTA_MULTIPLA') return !Array.isArray(value) || value.length === 0;
  return isBlank(value);
}

function parseNumero(value: CampoValorInput): number {
  const raw = String(value ?? '').replace(',', '.').trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error('Informe um número válido.');
  return parsed;
}

export function buildCampoValorPayload(
  definicao: CampoDefinicaoRow,
  entidadeId: string,
  value: CampoValorInput,
): CampoValorInsert {
  const payload = valorBase(definicao.id, entidadeId);

  switch (definicao.tipo_dado) {
    case 'TEXTO_CURTO':
    case 'TEXTO_LONGO':
      payload.valor_texto = String(value ?? '').trim();
      break;
    case 'INTEIRO':
    case 'DECIMAL':
      payload.valor_numero = parseNumero(value);
      break;
    case 'BOOLEANO':
      payload.valor_booleano = Boolean(value);
      break;
    case 'DATA':
      payload.valor_data = String(value ?? '');
      break;
    case 'DATA_HORA':
      payload.valor_datahora = String(value ?? '');
      break;
    case 'LISTA_UNICA':
      payload.valor_opcao_id = String(value ?? '');
      break;
    case 'LISTA_MULTIPLA':
      break;
  }

  return payload;
}

function sortDefinicoes(a: CampoDefinicaoRow, b: CampoDefinicaoRow) {
  const group = (a.agrupamento ?? '').localeCompare(b.agrupamento ?? '');
  if (group !== 0) return group;
  return (a.ordem ?? 9999) - (b.ordem ?? 9999) || a.nome.localeCompare(b.nome);
}

export function useCamposPersonalizados(entidadeTipo: CampoEntidadeTipo, entidadeId: string | undefined) {
  const { session, loading: authLoading, activeBranchId } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(entidadeId) && !authLoading && Boolean(session);

  const query = useQuery({
    queryKey: queryKeys.campoValores(entidadeTipo, entidadeId),
    enabled,
    queryFn: async (): Promise<CampoPersonalizadoOperacional[]> => {
      const { data: definicoesData, error: definicoesError } = await supabase
        .from('campo_definicoes')
        .select('*')
        .eq('entidade_tipo', entidadeTipo)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (definicoesError) throw definicoesError;

      const definicoes = ((definicoesData ?? []) as CampoDefinicaoRow[])
        .filter((def) => def.filial_id === null || !activeBranchId || def.filial_id === activeBranchId)
        .sort(sortDefinicoes);

      const definicaoIds = definicoes.map((def) => def.id);
      if (definicaoIds.length === 0 || !entidadeId) return [];

      const [opcoesResult, valoresResult] = await Promise.all([
        supabase
          .from('campo_opcoes')
          .select('*')
          .in('campo_definicao_id', definicaoIds)
          .order('ordem', { ascending: true })
          .order('rotulo', { ascending: true }),
        supabase
          .from('campo_valores')
          .select('*')
          .eq('entidade_id', entidadeId)
          .in('campo_definicao_id', definicaoIds),
      ]);

      if (opcoesResult.error) throw opcoesResult.error;
      if (valoresResult.error) throw valoresResult.error;

      const opcoes = (opcoesResult.data ?? []) as CampoOpcaoRow[];
      const valores = (valoresResult.data ?? []) as CampoValorRow[];
      const valorIds = valores.map((valor) => valor.id);

      let valorOpcoes: CampoValorOpcaoRow[] = [];
      if (valorIds.length > 0) {
        const { data, error } = await supabase
          .from('campo_valor_opcoes')
          .select('*')
          .in('campo_valor_id', valorIds)
          .order('ordem', { ascending: true });
        if (error) throw error;
        valorOpcoes = (data ?? []) as CampoValorOpcaoRow[];
      }

      return definicoes.map((def) => {
        const valor = valores.find((item) => item.campo_definicao_id === def.id) ?? null;
        return {
          ...def,
          opcoes: opcoes.filter((opcao) => opcao.campo_definicao_id === def.id),
          valor,
          valorOpcoes: valor ? valorOpcoes.filter((item) => item.campo_valor_id === valor.id) : [],
        };
      });
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.campoValores(entidadeTipo, entidadeId) });
  };

  const findExistingValor = async (campoDefinicaoId: string) => {
    if (!entidadeId) return null;
    const { data, error } = await supabase
      .from('campo_valores')
      .select('*')
      .eq('campo_definicao_id', campoDefinicaoId)
      .eq('entidade_id', entidadeId)
      .maybeSingle();
    if (error) throw error;
    return data as CampoValorRow | null;
  };

  const clearValor = async (valor: CampoValorRow | null) => {
    if (!valor) return;
    await supabase.from('campo_valor_opcoes').delete().eq('campo_valor_id', valor.id);
    const { error } = await supabase.from('campo_valores').delete().eq('id', valor.id);
    if (error) throw error;
  };

  const saveMutation = useMutation({
    mutationFn: async ({ definicao, value }: { definicao: CampoDefinicaoRow; value: CampoValorInput }) => {
      if (!entidadeId) throw new Error('Entidade não encontrada.');
      const existing = await findExistingValor(definicao.id);

      if (isCampoValorInputEmpty(definicao, value)) {
        await clearValor(existing);
        return null;
      }

      const payload = buildCampoValorPayload(definicao, entidadeId, value);
      const { data, error } = existing
        ? await supabase.from('campo_valores').update(payload).eq('id', existing.id).select('*').single()
        : await supabase.from('campo_valores').insert(payload).select('*').single();
      if (error) throw error;

      const saved = data as CampoValorRow;
      if (definicao.tipo_dado === 'LISTA_MULTIPLA') {
        const optionIds = Array.isArray(value) ? value : [];
        await supabase.from('campo_valor_opcoes').delete().eq('campo_valor_id', saved.id);
        if (optionIds.length > 0) {
          const { error: bridgeError } = await supabase.from('campo_valor_opcoes').insert(
            optionIds.map((campoOpcaoId, index) => ({
              campo_valor_id: saved.id,
              campo_opcao_id: campoOpcaoId,
              ordem: index + 1,
            })),
          );
          if (bridgeError) throw bridgeError;
        }
      }

      return saved;
    },
    onSuccess: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: async (campoDefinicaoId: string) => {
      const existing = await findExistingValor(campoDefinicaoId);
      await clearValor(existing);
    },
    onSuccess: invalidate,
  });

  return {
    campos: query.data ?? [],
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending || clearMutation.isPending,
    saveValue: saveMutation.mutateAsync,
    clearValue: clearMutation.mutateAsync,
  };
}
