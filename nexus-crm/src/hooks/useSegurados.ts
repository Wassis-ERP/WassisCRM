import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { useAuth } from './useAuth';
import { useActiveFilialId } from './useActiveFilial';
import { useProdutores } from './useProdutores';
import { mapPessoaContatoRowToView } from '../lib/seguradoMapper';
import type { PessoaContato } from '../contexts/seguradosCore';
import { useMemo } from 'react';
import { onlyDigits } from '../utils/documento';
import {
  createBackendInsuredPerson,
  getBackendInsuredPerson,
  listBackendInsuredPeople,
  updateBackendInsuredPerson,
  usesBackendDomainData,
} from '../lib/backendDomainApi';

type SeguradoRow = Database['public']['Tables']['segurados']['Row'];
type SeguradoUpdate = Database['public']['Tables']['segurados']['Update'];
type SeguradoInsert = Database['public']['Tables']['segurados']['Insert'];
type PessoaContatoRow = Database['public']['Tables']['pessoa_contato']['Row'];
import { getTable } from '../lib/inMemoryDb';
import { saveCompanyContact } from '../modules/plataforma/platformCommands';

const SEGURADOS_KEY = ['segurados'] as const;
const PESSOA_CONTATO_KEY = ['pessoa_contato'] as const;

// Select com joins para resolver produtor/gerente em `produtores`.
const SEGURADO_WITH_JOINS_SELECT =
  '*, produtor:produtor_id ( id, nome ), gerente:gerente_id ( id, nome )';

/**
 * Lista segurados do tenant (RLS aplica em produção). Ordenado por nome.
 * Traz join de produtor/gerente para que a listagem mostre o nome resolvido
 * sem precisar de hidratar separadamente.
 */
export function useSegurados() {
  const { session, user, loading: authLoading, activeBranchId } = useAuth();
  const authReady = !authLoading && !!session;

  return useQuery({
    // activeBranchId entra na chave: trocar a corretora ativa refaz a lista.
    queryKey: [...SEGURADOS_KEY, 'branch', activeBranchId ?? '__all__'] as const,
    enabled: authReady,
    queryFn: async (): Promise<SeguradoRow[]> => {
      if (usesBackendDomainData) {
        return listBackendInsuredPeople(user?.tenantId ?? null, activeBranchId);
      }

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
  'id' | 'tenant_id' | 'filial_id' | 'created_at' | 'updated_at'
>;

/**
 * Cria um segurado. Preenche `tenant_id` do usuário logado e carimba
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
      const cpfCnpj = onlyDigits(input.cpf_cnpj);
      if (!filialId) throw new Error('Selecione a corretora antes de cadastrar.');
      if (!input.nome?.trim()) throw new Error('Nome é obrigatório.');
      if (!cpfCnpj && input.status !== 'Prospecto') throw new Error('CPF/CNPJ é obrigatório para cadastrar segurado');

      const payload: SeguradoInsert = {
        ...input,
        cpf_cnpj: cpfCnpj,
        nome: input.nome.trim(),
        tipo: input.tipo ?? 'PF',
        status: input.status ?? 'Ativo',
        lgpd_autorizado: input.lgpd_autorizado ?? false,
        tenant_id: user.tenantId,
        filial_id: filialId,
      };

      if (usesBackendDomainData) {
        return createBackendInsuredPerson(payload, user.tenantId);
      }

      const { data, error } = await supabase
        .from('segurados')
        .insert(payload)
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
  const { session, loading: authLoading, user } = useAuth();
  const authReady = !authLoading && !!session;

  return useQuery({
    queryKey: [...SEGURADOS_KEY, id] as const,
    enabled: Boolean(id) && authReady,
    queryFn: async (): Promise<SeguradoRow> => {
      if (usesBackendDomainData) {
        return getBackendInsuredPerson(id as string, user?.tenantId ?? null);
      }

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: { id: string; patch: SeguradoUpdate }): Promise<SeguradoRow> => {
      if (usesBackendDomainData) {
        return updateBackendInsuredPerson(args.id, args.patch, user?.tenantId ?? null);
      }

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
  '*, pj:pj_id ( id, nome, nome_fantasia ), pf:pf_id ( id, nome, email, telefone, celular )';

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

export type CreatePessoaContatoInput = Omit<Parameters<typeof saveCompanyContact>[0], 'id' | 'tenantId'>;
export type UpdatePessoaContatoInput = Omit<CreatePessoaContatoInput, 'pfId'> & { id: string; pfId?: string | null };

export function useCreatePessoaContato() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({mutationFn: async (input: CreatePessoaContatoInput): Promise<PessoaContatoRow> => {
    if(!user?.tenantId)throw new Error('Grupo não encontrado.');
    return saveCompanyContact({...input,tenantId:user.tenantId}) as PessoaContatoRow;
  },onSuccess:()=>{void qc.invalidateQueries({queryKey:PESSOA_CONTATO_KEY});}});
}

export function useUpdatePessoaContato() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({mutationFn: async(input: UpdatePessoaContatoInput): Promise<PessoaContatoRow> => {
    if(!user?.tenantId)throw new Error('Grupo não encontrado.');
    const current=getTable('pessoa_contato').find(r=>r.id===input.id);
    if(!current)throw new Error('Contato não encontrado.');
    return saveCompanyContact({...input,tenantId:user.tenantId,pfId:input.pfId===undefined?current.pf_id as string|null:input.pfId}) as PessoaContatoRow;
  },onSuccess:()=>{void qc.invalidateQueries({queryKey:PESSOA_CONTATO_KEY});}});
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
// Produtores / Gerentes (refs a `produtores`, fase 0.2)
// ---------------------------------------------------------------------------

/**
 * Lookup leve para popular selects de Produtor/Gerente.
 * O PRD diz que um produtor inativo não deve aparecer nas opções, mas mantém-se
 * o registro histórico — como aqui produtor é o membro da equipe, considera-se
 * que todos os membros retornados são "ativos".
 */
export function useProdutoresLookup() {
  const { data, isLoading } = useProdutores();

  const options = useMemo(
    () =>
      (data ?? [])
        .map((p) => ({ id: p.id, nome: p.nome || 'Sem nome' }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [data],
  );

  return { options, isLoading };
}
