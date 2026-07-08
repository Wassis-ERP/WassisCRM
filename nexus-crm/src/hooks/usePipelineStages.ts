import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { PipelineStageDbRow, PipelineStageRow } from '../modules/types';
import { normalizePipelineStageRow } from '../modules/types';

/**
 * Stages de um pipeline, ordenadas por `ordem`.
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
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as PipelineStageDbRow[]).map((row) => normalizePipelineStageRow(row));
    },
  });
}
