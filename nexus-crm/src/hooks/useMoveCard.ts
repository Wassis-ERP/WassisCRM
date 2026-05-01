import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { getAdapter } from '../modules/registry';
import type { KanbanCard, PipelineModule } from '../modules/types';

interface UseMoveCardArgs {
  module: PipelineModule;
  pipelineId: string;
}

interface MoveVariables {
  cardId: string;
  toStageId: string;
}

/**
 * Mutation para mover um card entre stages. Faz update optimista no cache e
 * invalida ao final para manter o estado sincronizado com o banco.
 */
export function useMoveCard({ module, pipelineId }: UseMoveCardArgs) {
  const qc = useQueryClient();
  const cacheKey = queryKeys.cards(module, pipelineId, 'pending');

  return useMutation({
    mutationFn: async ({ cardId, toStageId }: MoveVariables) => {
      const adapter = getAdapter(module);
      await adapter.updateStage({ cardId, toStageId, pipelineId });
    },
    onMutate: async ({ cardId, toStageId }) => {
      await qc.cancelQueries({ queryKey: cacheKey });
      const previous = qc.getQueryData<KanbanCard[]>(cacheKey);

      if (previous) {
        qc.setQueryData<KanbanCard[]>(
          cacheKey,
          previous.map((card) => (card.id === cardId ? { ...card, stageId: toStageId } : card)),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(cacheKey, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cacheKey });
    },
  });
}
