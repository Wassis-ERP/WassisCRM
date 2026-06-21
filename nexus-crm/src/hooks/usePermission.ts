import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import { useProfileFiliais } from './useProfileFiliais';

type Action = 'read' | 'create' | 'update' | 'delete';

interface RolePerm {
  perfil_id: string;
  module: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

/**
 * Permissão de NEGÓCIO resolvida pelo PERFIL do usuário na corretora ATIVA (D18).
 * Não existe mais "Role" global: o que o usuário pode fazer depende do perfil que
 * ele tem na corretora selecionada (profile_filiais → role_permissions).
 * Em "Todas as filiais" (sem corretora ativa) vale a UNIÃO dos perfis do usuário
 * (pode agir se puder em ao menos uma corretora).
 *
 * Observação: este é o gating de UI. O enforcement definitivo (RLS/regras) é do
 * backend — ver D18 e o relatório de hand-off.
 *
 * Uso: const { can } = usePermission('comercial'); if (can('create')) {...}
 */
export const usePermission = (moduleName: string) => {
  const { user, activeBranchId } = useAuth();
  const { vinculos } = useProfileFiliais(user?.id);

  const { data: rolePerms } = useQuery({
    queryKey: queryKeys.permissions,
    queryFn: async (): Promise<RolePerm[]> => {
      const { data, error } = await supabase.from('role_permissions').select('*');
      if (error) throw error;
      return (data ?? []) as RolePerm[];
    },
    staleTime: 5 * 60_000,
  });

  const perfilIds = useMemo(() => {
    if (activeBranchId) {
      const v = vinculos.find((x) => x.filial_id === activeBranchId);
      return v ? [v.perfil_id] : [];
    }
    // "Todas as filiais": união dos perfis do usuário.
    return Array.from(new Set(vinculos.map((x) => x.perfil_id)));
  }, [vinculos, activeBranchId]);

  const can = (action: Action): boolean => {
    if (!user || perfilIds.length === 0) return false;
    const key = `can_${action}` as const;
    return (rolePerms ?? []).some(
      (p) => perfilIds.includes(p.perfil_id) && p.module === moduleName && Boolean(p[key]),
    );
  };

  return { can };
};
