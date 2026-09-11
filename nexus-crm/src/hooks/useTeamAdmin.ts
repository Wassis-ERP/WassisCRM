import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

export interface TeamMember {
  id: string;
  nome_completo: string;
  email: string;
  avatar_url: string | null;
  ativo: boolean;
  status: string | null;
  convite_status: string | null;
  convite_enviado_em: string | null;
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
      const { data, error } = await supabase.rpc('get_team_members', {tenantId});
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, nome_completo }: { email: string; nome_completo: string }): Promise<TeamMember> => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      if (!nome_completo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Informe nome e email válidos.');
      // Cria o membro no mock (profiles). O acesso (perfil por corretora) é
      // atribuído depois em profile_filiais. No backend real isto vira convite.
      const { data, error } = await supabase
        .from('profiles')
        .insert({ nome_completo: nome_completo.trim(), email: email.trim(), tenant_id: tenantId, avatar_url: null, ativo: true, status: 'ATIVO', convite_status: 'PENDENTE', convite_enviado_em: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      const profile = data as { id: string; convite_enviado_em: string };
      await supabase.from('audit_logs').insert({
        action: 'INVITE_MEMBER',
        entity_type: 'profiles',
        entity_id: profile.id,
        new_data: { email },
      });
      return {
        id: profile.id,
        nome_completo,
        email,
        avatar_url: null,
        ativo: true, status: 'ATIVO', convite_status: 'PENDENTE', convite_enviado_em: profile.convite_enviado_em,
        corretoras_count: 0,
        perfil_principal: null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team });
    },
  });

  const setActive = useMutation({ mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
    const { error } = await supabase.from('profiles').update({ ativo, status: ativo ? 'ATIVO' : 'INATIVO' }).eq('id', id).eq('tenant_id', tenantId);
    if (error) throw error;
  }, onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.team });
    void queryClient.invalidateQueries({ queryKey: queryKeys.permissions });
    window.dispatchEvent(new Event('wassis:access-changed'));
  } });

  return {
    setActive: setActive.mutateAsync,
    isUpdating: setActive.isPending,
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    invite: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
  };
}
