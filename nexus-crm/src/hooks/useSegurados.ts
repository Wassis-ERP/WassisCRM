import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';
import { useActiveFilialId } from './useActiveFilial';
import { useTeamAdmin } from './useTeamAdmin';
import { mapPessoaContatoRowToView } from '../lib/seguradoMapper';
import type { PessoaContato } from '../contexts/seguradosCore';
import { useMemo } from 'react';

type SeguradoRow = Database['public']['Tables']['segurados']['Row'];
type SeguradoUpdate = Database['public']['Tables']['segurados']['Update'];
type SeguradoInsert = Database['public']['Tables']['segurados']['Insert'];
type PessoaContatoRow = Database['public']['Tables']['pessoa_contato']['Row'];
type PessoaContatoInsert = Database['public']['Tables']['pessoa_contato']['Insert'];

const SEGURADOS_KEY = ['segurados'] as const;
const PESSOA_CONTATO_KEY = ['pessoa_contato'] as const;

// Select com joins para resolver produtor/gerente em `profiles`.
const SEGURADO_WITH_JOINS_SELECT =
  '*, produtor:produtor_id ( id, full_name ), gerente:gerente_id ( id, full_name )';

/**
 * Lista segurados do tenant (RLS aplica em produção). Ordenado por nome.
 * Traz join de produtor/gerente para que a listagem mostre o nome resolvido
 * sem precisar de hidratar separadamente.
 */
export function useSegurados() {
  const { session, loading: authLoading, activeBranchId } = useAuth();
  const authReady = !authLoading && !!session;

  return useQuery({
    // activeBranchId entra na chave: trocar a corretora ativa refaz a lista.
    queryKey: [...SEGURADOS_KEY, 'branch', activeBranchId ?? '__all__'] as const,
    enabled: authReady,
    queryFn: async (): Promise<SeguradoRow[]> => {
      let builder = supabase
        .from('segurados')
        .select(SEGURADO_WITH_JOINS_SELECT)
        .order('nome', { ascending: true });

      // Corretora ativa selecionada -> só os cadastros dela (UX). "Todas as
      // filiais" (null) não filtra. O isolamento real é RLS no backend.
      if (activeBranchId) builder = builder.eq('filial_id', activeBranchId);

      const { data, error } = await builder;
      if (error) throw error;
      return (data ?? []) as SeguradoRow[];
    },
    staleTime: 60_000,
  });
}

export type CreateSeguradoInput = Omit<
  SeguradoInsert,
  'id' | 'tenant_id' | 'filial_id' | 'created_by' | 'created_at' | 'updated_at'
>;

/**
 * Cria um segurado. Preenche `tenant_id`/`created_by` do usuário logado e carimba
 * `filial_id` com a corretora ATIVA (R6). Campos exclusivos do tipo oposto já
 * chegam zerados (filtro feito no mapper).
 */
export function useCreateSegurado() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const filialId = useActiveFilialId();

  return useMutation({
    mutationFn: async (input: CreateSeguradoInput): Promise<SeguradoRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');

      const { data, error } = await supabase
        .from('segurados')
        .insert({
          ...input,
          nome: input.nome.trim(),
          tipo: input.tipo ?? 'PF',
          status: input.status ?? 'Ativo',
          lgpd_autorizado: input.lgpd_autorizado ?? false,
          tenant_id: user.tenantId,
          filial_id: filialId,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as SeguradoRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SEGURADOS_KEY });
    },
  });
}

/**
 * Detalhe de um segurado por id (com joins de produtor/gerente).
 */
export function useSegurado(id: string | undefined) {
  const { session, loading: authLoading } = useAuth();
  const authReady = !authLoading && !!session;

  return useQuery({
    queryKey: [...SEGURADOS_KEY, id] as const,
    enabled: Boolean(id) && authReady,
    queryFn: async (): Promise<SeguradoRow> => {
      const { data, error } = await supabase
        .from('segurados')
        .select(SEGURADO_WITH_JOINS_SELECT)
        .eq('id', id as string)
        .single();

      if (error) throw error;
      return data as SeguradoRow;
    },
    staleTime: 60_000,
  });
}

/**
 * Atualiza cadastro em `public.segurados`.
 */
export function useUpdateSegurado() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; patch: SeguradoUpdate }): Promise<SeguradoRow> => {
      const { data, error } = await supabase
        .from('segurados')
        .update(args.patch)
        .eq('id', args.id)
        .select('*')
        .single();

      if (error) throw error;
      return data as SeguradoRow;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: SEGURADOS_KEY });
      qc.invalidateQueries({ queryKey: [...SEGURADOS_KEY, variables.id] });
    },
  });
}

/**
 * Verifica se já existe outro segurado com o mesmo CPF/CNPJ.
 * Usado pelo modal para validação inline antes de chamar o create/update.
 */
export function useIsDocumentoUnique() {
  const { data: rows } = useSegurados();
  return (documento: string, ignoreId?: string): boolean => {
    const d = documento.replace(/\D+/g, '');
    if (!d) return true;
    return !(rows ?? []).some(
      (r) => r.id !== ignoreId && (r.cpf_cnpj ?? '').replace(/\D+/g, '') === d,
    );
  };
}

// ---------------------------------------------------------------------------
// Pessoa ↔ Contato (PJ ↔ PF)
// ---------------------------------------------------------------------------

const PESSOA_CONTATO_SELECT =
  '*, pj:pj_id ( id, nome, nome_fantasia ), pf:pf_id ( id, nome )';

/**
 * Vínculos `pessoa_contato` de uma pessoa.
 * - Quando `pessoa.tipo === 'PJ'`: retorna os PFs vinculados (contatos da empresa).
 * - Quando `pessoa.tipo === 'PF'`: retorna as PJs onde a PF aparece como contato.
 *
 * Usa filtro client-side porque o adapter in-memory ainda não suporta `or()`.
 */
export function usePessoaContatos(pessoaId: string | undefined) {
  const { session, loading: authLoading } = useAuth();
  const authReady = !authLoading && !!session;

  return useQuery({
    queryKey: [...PESSOA_CONTATO_KEY, pessoaId] as const,
    enabled: Boolean(pessoaId) && authReady,
    queryFn: async (): Promise<PessoaContato[]> => {
      const { data, error } = await supabase
        .from('pessoa_contato')
        .select(PESSOA_CONTATO_SELECT);

      if (error) throw error;
      const rows = (data ?? []) as PessoaContatoRow[];
      const filtered = rows.filter(
        (r) => r.pj_id === pessoaId || r.pf_id === pessoaId,
      );
      return filtered.map(mapPessoaContatoRowToView);
    },
    staleTime: 30_000,
  });
}

export interface CreatePessoaContatoInput {
  pjId: string;
  pfId: string;
  cargo?: string | null;
  principal?: boolean;
}

/**
 * Cria um vínculo PJ↔PF. Se `principal=true`, desmarca os outros principais
 * do mesmo `pjId` (regra de unicidade condicional do PRD).
 */
export function useCreatePessoaContato() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePessoaContatoInput): Promise<PessoaContatoRow> => {
      if (!user?.tenantId) throw new Error('Usuario sem tenant vinculado');
      if (input.principal) {
        // Desmarca principal anterior do mesmo PJ.
        await supabase
          .from('pessoa_contato')
          .update({ principal: false })
          .eq('pj_id', input.pjId);
      }

      const payload: PessoaContatoInsert = {
        pj_id: input.pjId,
        pf_id: input.pfId,
        cargo: input.cargo ?? null,
        principal: input.principal ?? false,
        tenant_id: user.tenantId,
      };

      const { data, error } = await supabase
        .from('pessoa_contato')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data as PessoaContatoRow;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: PESSOA_CONTATO_KEY });
      qc.invalidateQueries({ queryKey: [...PESSOA_CONTATO_KEY, variables.pjId] });
      qc.invalidateQueries({ queryKey: [...PESSOA_CONTATO_KEY, variables.pfId] });
    },
  });
}

export interface UpdatePessoaContatoInput {
  id: string;
  pjId: string;
  cargo?: string | null;
  principal?: boolean;
}

/**
 * Atualiza um vínculo. Se `principal=true`, desmarca os outros do mesmo `pjId`.
 */
export function useUpdatePessoaContato() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePessoaContatoInput): Promise<PessoaContatoRow> => {
      if (input.principal) {
        // Desmarca principal de TODOS os irmãos do mesmo PJ.
        await supabase
          .from('pessoa_contato')
          .update({ principal: false })
          .eq('pj_id', input.pjId);
      }
      const patch: Partial<PessoaContatoRow> = {};
      if (input.cargo !== undefined) patch.cargo = input.cargo ?? null;
      if (input.principal !== undefined) patch.principal = input.principal;

      const { data, error } = await supabase
        .from('pessoa_contato')
        .update(patch)
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) throw error;
      return data as PessoaContatoRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PESSOA_CONTATO_KEY });
    },
  });
}

/**
 * Remove o vínculo PJ↔PF. NÃO remove os cadastros das pessoas (regra do PRD).
 */
export function useDeletePessoaContato() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('pessoa_contato').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PESSOA_CONTATO_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Produtores / Gerentes (refs a `profiles` via team admin)
// ---------------------------------------------------------------------------

/**
 * Lookup leve para popular selects de Produtor/Gerente.
 * O PRD diz que um produtor inativo não deve aparecer nas opções, mas mantém-se
 * o registro histórico — como aqui produtor é o membro da equipe, considera-se
 * que todos os membros retornados são "ativos".
 */
export function useProdutoresLookup() {
  const { members, isLoading } = useTeamAdmin();

  const options = useMemo(
    () =>
      (members ?? [])
        .map((m) => ({ id: m.id, nome: m.full_name || m.email || 'Sem nome' }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [members],
  );

  return { options, isLoading };
}
