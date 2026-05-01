import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { PipelineStageRow } from '../modules/types';

/**
 * Stages de um pipeline, ordenadas por `order`.
 */
export function usePipelineStages(pipelineId: string | null | undefined) {
  return useQuery({
    enabled: !!pipelineId,
    queryKey: queryKeys.stages(pipelineId),
    queryFn: async (): Promise<PipelineStageRow[]> => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId as string)
        .order('order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as PipelineStageRow[];
    },
  });
}
