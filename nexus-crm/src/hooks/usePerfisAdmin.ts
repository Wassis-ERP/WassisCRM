import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import type { Perfil } from '../types/platform';

export interface PermissionRow {
  id: string;
  perfil_id: string;
  module: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export type PermField = 'can_read' | 'can_create' | 'can_update' | 'can_delete';

/**
 * AUTORIA de perfis de acesso (D18): CRUD de perfis personalizados + edição das
 * permissões por módulo (role_permissions, agora por perfil_id). A APLICAÇÃO
 * destas permissões em runtime/RLS é responsabilidade do backend — aqui só
 * autoramos e entregamos no hand-off.
 */
export function usePerfisAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const perfisQuery = useQuery({
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
  });

  const permsQuery = useQuery({
    queryKey: queryKeys.permissions,
    queryFn: async (): Promise<PermissionRow[]> => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('module', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PermissionRow[];
    },
  });

  // Módulos distintos a partir das permissões existentes (semeadas pelos
  // perfis-sistema). Servem de "gabarito" ao criar um perfil novo.
  const modules = Array.from(new Set((permsQuery.data ?? []).map((p) => p.module)));

  const invalidatePerfis = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.perfis });
    queryClient.invalidateQueries({ queryKey: queryKeys.permissions });
  };

  const createPerfil = useMutation({
    mutationFn: async (nome: string): Promise<Perfil> => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('perfis')
        .insert({ nome: nome.trim(), sistema: false, ativo: true, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      const perfil = data as Perfil;
      // Cria as linhas de permissão (uma por módulo, tudo false) para o novo perfil.
      for (const module of modules) {
        await supabase.from('role_permissions').insert({
          perfil_id: perfil.id,
          module,
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false,
        });
      }
      await supabase.from('audit_logs').insert({
        action: 'CREATE_PERFIL',
        entity_type: 'perfis',
        entity_id: perfil.id,
        new_data: { nome },
      });
      return perfil;
    },
    onSuccess: invalidatePerfis,
  });

  const renamePerfil = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from('perfis').update({ nome: nome.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidatePerfis,
  });

  const removePerfil = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('perfis').update({ ativo: false }).eq('id', id);
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_PERFIL',
        entity_type: 'perfis',
        entity_id: id,
      });
    },
    onSuccess: invalidatePerfis,
  });

  const togglePermission = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: PermField; value: boolean }) => {
      const { error } = await supabase.from('role_permissions').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_PERMISSION',
        entity_type: 'role_permissions',
        entity_id: id,
        new_data: { [field]: value },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.permissions }),
  });

  return {
    perfis: perfisQuery.data ?? [],
    permissions: permsQuery.data ?? [],
    modules,
    isLoading: perfisQuery.isLoading || permsQuery.isLoading,
    createPerfil: createPerfil.mutateAsync,
    renamePerfil: renamePerfil.mutateAsync,
    removePerfil: removePerfil.mutateAsync,
    togglePermission: togglePermission.mutateAsync,
    isSaving:
      createPerfil.isPending ||
      renamePerfil.isPending ||
      removePerfil.isPending ||
      togglePermission.isPending,
  };
}
