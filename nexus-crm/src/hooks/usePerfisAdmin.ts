import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import type { Perfil } from '../types/platform';
import type { RolePermissionRow } from '../types/platformRows';
import { createCustomProfile } from '../modules/plataforma/platformCommands';
import type { PermissionScope } from '../modules/plataforma/platformDomain';
import { usesBackendData } from '../lib/dataMode';
import {
  createAdministrationAccessProfile,
  listAdministrationAccessProfiles,
  listAdministrationPermissions,
  updateAdministrationAccessProfile,
  updateAdministrationPermission,
} from '../lib/backendAdministrationApi';

export type PermissionRow = RolePermissionRow;
export type PermField = 'can_read' | 'can_create' | 'can_update' | 'can_delete' | 'can_export' | 'can_manage';

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
      if (usesBackendData) return (await listAdministrationAccessProfiles()).filter((profile) => profile.ativo !== false);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Perfil[];
    },
  });

  const permsQuery = useQuery({
    queryKey: queryKeys.permissions,
    queryFn: async (): Promise<PermissionRow[]> => {
      if (usesBackendData) return listAdministrationPermissions();
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('modulo', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PermissionRow[];
    },
  });

  // Módulos distintos a partir das permissões existentes (semeadas pelos
  // perfis-sistema). Servem de "gabarito" ao criar um perfil novo.
  const modules = Array.from(new Set((permsQuery.data ?? []).map((p) => p.modulo).filter((value): value is string => !!value)));

  const invalidatePerfis = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.perfis });
    queryClient.invalidateQueries({ queryKey: queryKeys.permissions });
  };

  const createPerfil = useMutation({
    mutationFn: async (nome: string): Promise<Perfil> => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      if (usesBackendData) return createAdministrationAccessProfile(nome);
      const perfil = createCustomProfile(tenantId, nome, modules);
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
      if (usesBackendData) {
        const current = perfisQuery.data?.find((profile) => profile.id === id);
        if (!current) throw new Error('Perfil não encontrado.');
        await updateAdministrationAccessProfile({ ...current, nome: nome.trim() });
        return;
      }
      const { error } = await supabase.from('perfis').update({ nome: nome.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidatePerfis,
  });

  const removePerfil = useMutation({
    mutationFn: async (id: string) => {
      if (usesBackendData) {
        const current = perfisQuery.data?.find((profile) => profile.id === id);
        if (!current) throw new Error('Perfil não encontrado.');
        await updateAdministrationAccessProfile({ ...current, ativo: false });
        return;
      }
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
      if (usesBackendData) {
        const current = permsQuery.data?.find((permission) => permission.id === id);
        if (!current) throw new Error('Permissão não encontrada.');
        await updateAdministrationPermission({ ...current, [field]: value });
        return;
      }
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

  const setScope = useMutation({ mutationFn: async ({ id, escopo }: { id: string; escopo: PermissionScope }) => {
    if (usesBackendData) {
      const current = permsQuery.data?.find((permission) => permission.id === id);
      if (!current) throw new Error('Permissão não encontrada.');
      await updateAdministrationPermission({ ...current, escopo });
      return;
    }
    const { error } = await supabase.from('role_permissions').update({ escopo }).eq('id', id);
    if (error) throw error;
  }, onSuccess: invalidatePerfis });

  return {
    setScope: setScope.mutateAsync,
    perfis: perfisQuery.data ?? [],
    permissions: permsQuery.data ?? [],
    modules,
    isLoading: perfisQuery.isLoading || permsQuery.isLoading,
    createPerfil: createPerfil.mutateAsync,
    renamePerfil: renamePerfil.mutateAsync,
    removePerfil: removePerfil.mutateAsync,
    togglePermission: togglePermission.mutateAsync,
    isSaving:
      setScope.isPending ||
      createPerfil.isPending ||
      renamePerfil.isPending ||
      removePerfil.isPending ||
      togglePermission.isPending,
  };
}
