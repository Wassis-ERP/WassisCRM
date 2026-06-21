import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  corretoras_count: number; // nº de corretoras que o membro acessa (profile_filiais)
  perfil_principal: string | null; // perfil na corretora "casa" (principal)
}

/**
 * Equipe (membros). O CARGO global foi APOSENTADO (D18): a permissão de negócio
 * vem do PERFIL por corretora (profile_filiais), gerido na guia "Corretoras &
 * Perfil" do membro. Aqui só listamos e convidamos.
 */
export function useTeamAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const membersQuery = useQuery({
    queryKey: queryKeys.team,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_members');
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, full_name }: { email: string; full_name: string }): Promise<TeamMember> => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      // Cria o membro no mock (profiles). O acesso (perfil por corretora) é
      // atribuído depois em profile_filiais. No backend real isto vira convite.
      const { data, error } = await supabase
        .from('profiles')
        .insert({ full_name, email, tenant_id: tenantId, avatar_url: null })
        .select()
        .single();
      if (error) throw error;
      const profile = data as { id: string; created_at?: string };
      await supabase.from('audit_logs').insert({
        action: 'INVITE_MEMBER',
        entity_type: 'profiles',
        entity_id: profile.id,
        new_data: { email },
      });
      return {
        id: profile.id,
        full_name,
        email,
        avatar_url: null,
        created_at: profile.created_at ?? '',
        corretoras_count: 0,
        perfil_principal: null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team });
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    invite: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
  };
}
