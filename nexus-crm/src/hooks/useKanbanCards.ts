import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { getAdapter } from '../modules/registry';
import type { KanbanCard, PipelineModule } from '../modules/types';
import { useAuth } from './useAuth';

interface UseKanbanCardsArgs {
  pipelineId: string | null | undefined;
  module: PipelineModule | null | undefined;
  includeConcluded?: boolean;
}

/**
 * Busca os cards de um pipeline usando o adapter do modulo correspondente.
 * Retorna o shape generico `KanbanCard` pronto para render.
 */
export function useKanbanCards({ pipelineId, module, includeConcluded }: UseKanbanCardsArgs) {
  const { user, activeBranchId } = useAuth();
  const tenantLike = user?.tenantId ?? '';

  return useQuery({
    enabled: !!pipelineId && !!module,
    queryKey: queryKeys.cards(
      module ?? '-',
      pipelineId,
      includeConcluded ? 'all' : 'pending',
      activeBranchId,
    ),
    queryFn: async (): Promise<KanbanCard[]> => {
      const adapter = getAdapter(module as PipelineModule);
      return adapter.fetchCards({
        pipelineId: pipelineId as string,
        tenantId: tenantLike,
        includeConcluded,
        filialId: activeBranchId,
      });
    },
  });
}
