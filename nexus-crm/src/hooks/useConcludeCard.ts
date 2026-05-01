import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { getAdapter } from '../modules/registry';
import type { ConcludePayload, KanbanCard, PipelineModule } from '../modules/types';

interface UseConcludeCardArgs {
  module: PipelineModule;
  pipelineId: string;
}

interface ConcludeVariables {
  cardId: string;
  payload: ConcludePayload;
}

/**
 * Marca o card como won/lost. Card nao troca de stage; o status e o concluded_at
 * sao persistidos e o card sai do board (filtro `status='pending'`).
 */
export function useConcludeCard({ module, pipelineId }: UseConcludeCardArgs) {
  const qc = useQueryClient();
  const cacheKeyPending = queryKeys.cards(module, pipelineId, 'pending');
  const cacheKeyAll = queryKeys.cards(module, pipelineId, 'all');

  return useMutation({
    mutationFn: async ({ cardId, payload }: ConcludeVariables) => {
      const adapter = getAdapter(module);
      await adapter.conclude({ cardId, payload });
    },
    onMutate: async ({ cardId }) => {
      await qc.cancelQueries({ queryKey: cacheKeyPending });
      const previous = qc.getQueryData<KanbanCard[]>(cacheKeyPending);

      if (previous) {
        qc.setQueryData<KanbanCard[]>(
          cacheKeyPending,
          previous.filter((card) => card.id !== cardId),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(cacheKeyPending, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cacheKeyPending });
      qc.invalidateQueries({ queryKey: cacheKeyAll });
    },
  });
}
