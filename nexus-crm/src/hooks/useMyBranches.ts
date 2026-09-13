import { useMemo } from 'react';
import { usesBackendData } from '../lib/dataMode';
import { useAuth } from './useAuth';
import { useFiliais } from './useFiliais';
import { useProfileFiliais } from './useProfileFiliais';
import { activeProfileLinks } from '../modules/plataforma/platformCommands';

export interface MyBranch {
  id: string;
  label: string;
  principal: boolean;
}

/**
 * Corretoras que o USUÁRIO LOGADO acessa, derivadas de `profile_filiais`
 * (D12/D18) cruzadas com as filiais ativas. É a fonte do seletor de corretora
 * ativa do Header: o acesso (perfil por corretora) define o que aparece.
 * No backend, o token derivaria o mesmo conjunto.
 */
export function useMyBranches() {
  const { user } = useAuth();
  const { data: filiais } = useFiliais();
  const { vinculos, isLoading } = useProfileFiliais(user?.id);

  const branches = useMemo<MyBranch[]>(() => {
    if (usesBackendData) return (filiais ?? []).map(row => ({ id: row.id, label: row.label, principal: row.id === user?.branchId }));
    const labelById = new Map((filiais ?? []).map((f) => [f.id, f.label]));
    const allowed = new Set(user ? activeProfileLinks(user.id).map(v => v.id) : []);
    return vinculos
      .filter((v) => labelById.has(v.filial_id) && allowed.has(v.id))
      .map((v) => ({
        id: v.filial_id,
        label: labelById.get(v.filial_id) as string,
        principal: v.principal === true,
      }))
      .sort((a, b) =>
        a.principal === b.principal ? a.label.localeCompare(b.label, 'pt-BR') : a.principal ? -1 : 1,
      );
  }, [vinculos, filiais, user]);

  return { branches, isLoading };
}
