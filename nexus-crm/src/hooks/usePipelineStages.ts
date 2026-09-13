import { useQuery } from '@tanstack/react-query';
import { usesBackendData } from '../lib/dataMode';
import { listBackendCatalog } from '../lib/backendLookups';
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
      if (usesBackendData) return (await listBackendCatalog('pipeline_stages')).filter(row => row.pipeline_id === pipelineId).map(normalizePipelineStageRow).sort((a, b) => a.order - b.order);
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
