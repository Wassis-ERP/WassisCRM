import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Role, ModulePermission } from '../types/auth';

export interface RolePermission extends ModulePermission {
  id: string;
  role: Role;
}

export function usePermissionsAdmin() {
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery({
    queryKey: queryKeys.permissions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('module', { ascending: true });
      
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: keyof ModulePermission; value: boolean }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update({ [field]: value })
        .eq('id', id);
      
      if (error) throw error;

      // Log de auditoria
      await supabase.from('audit_logs').insert({
        action: 'UPDATE_PERMISSION',
        entity_type: 'role_permissions',
        entity_id: id,
        new_data: { [field]: value }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions });
    },
  });

  return {
    permissions: permissionsQuery.data || [],
    isLoading: permissionsQuery.isLoading,
    updatePermission: updatePermissionMutation.mutateAsync,
    isUpdating: updatePermissionMutation.isPending,
  };
}
