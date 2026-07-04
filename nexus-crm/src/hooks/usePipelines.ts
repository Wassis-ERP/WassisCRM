import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { PipelineRow, PipelineStageRow } from '../modules/types';
import { useAuth } from './useAuth';
import { comparePipelinesForBranch, isPipelineVisibleForBranch } from './pipelineScope';

export interface PipelineWithStages extends PipelineRow {
  stages: PipelineStageRow[];
}

type PipelineSelectRow = PipelineRow & {
  pipeline_stages?: PipelineStageRow[] | null;
};

export function usePipelines() {
  const { session, loading: authLoading, activeBranchId } = useAuth();
  const authReady = !authLoading && !!session;

  const q = useQuery({
    queryKey: [...queryKeys.pipelines, activeBranchId ?? 'all'],
    enabled: authReady,
    queryFn: async (): Promise<PipelineWithStages[]> => {
      const { data, error } = await supabase
        .from('pipelines')
        .select(`
          *,
          pipeline_stages (*)
        `)
        .eq('is_active', true)
        .order('module', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      const rows = ((data ?? []) as PipelineSelectRow[])
        .filter((row) => isPipelineVisibleForBranch(row, activeBranchId))
        .map(({ pipeline_stages, ...row }) => ({
          ...row,
          stages: [...(pipeline_stages ?? [])].sort((a, b) => a.order - b.order),
        }))
        .sort((a: PipelineRow, b: PipelineRow) => comparePipelinesForBranch(activeBranchId, a, b)) as PipelineWithStages[];
      
      return rows;
    },
  });

  const isLoading = authLoading || (authReady && q.isLoading);
  const isError = authReady && q.isError;

  return {
    ...q,
    isLoading,
    isError,
  };
}
