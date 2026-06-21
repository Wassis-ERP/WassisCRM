import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useFiliais } from './useFiliais';
import { useProfileFiliais } from './useProfileFiliais';

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
    const labelById = new Map((filiais ?? []).map((f) => [f.id, f.label]));
    return vinculos
      .filter((v) => labelById.has(v.filial_id)) // só filiais ativas
      .map((v) => ({
        id: v.filial_id,
        label: labelById.get(v.filial_id) as string,
        principal: v.principal,
      }))
      .sort((a, b) =>
        a.principal === b.principal ? a.label.localeCompare(b.label, 'pt-BR') : a.principal ? -1 : 1,
      );
  }, [vinculos, filiais]);

  return { branches, isLoading };
}
