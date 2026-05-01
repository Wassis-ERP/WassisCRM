import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Role } from '../types/auth';

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export function useTeamAdmin() {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: queryKeys.team,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_members');
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      // Log de auditoria manual (já que não temos trigger para tudo ainda)
      await supabase.from('audit_logs').insert({
        action: 'CHANGE_ROLE',
        entity_type: 'user_roles',
        entity_id: userId,
        new_data: { role }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, full_name, role }: { email: string; full_name: string; role: Role }) => {
      // Aqui chamaríamos a Edge Function futuramente.
      // Por enquanto, vamos simular ou usar o rpc se implementado.
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, full_name, role }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team });
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    updateRole: updateRoleMutation.mutateAsync,
    invite: inviteMutation.mutateAsync,
    isUpdating: updateRoleMutation.isPending,
    isInviting: inviteMutation.isPending,
  };
}
