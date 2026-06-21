import { useAuth } from './useAuth';
import { useMyBranches } from './useMyBranches';

/**
 * Resolve a CORRETORA (filial) a carimbar em novos cadastros (segurados,
 * oportunidades — R6 do esqueleto): a corretora ATIVA do seletor do Header
 * quando há uma selecionada; senão a corretora "casa" (principal) do usuário;
 * senão a primeira a que ele tem acesso.
 *
 * É só o lado da ESCRITA (default do filial_id). O isolamento de LEITURA entre
 * corretoras (corretora B nunca lê dados da A) é responsabilidade do RLS no
 * backend — ver notas de Fase 2 no esqueleto. Aqui, o filtro de lista é apenas
 * conveniência de UI da corretora ativa.
 */
export function useActiveFilialId(): string | null {
  const { activeBranchId } = useAuth();
  const { branches } = useMyBranches();
  if (activeBranchId) return activeBranchId;
  const principal = branches.find((b) => b.principal) ?? branches[0];
  return principal?.id ?? null;
}
