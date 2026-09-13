import { useQuery } from '@tanstack/react-query';
import { usesBackendData } from '../lib/dataMode';
import { listBackendCatalog } from '../lib/backendLookups';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { PipelineDbRow, PipelineRow, PipelineStageDbRow, PipelineStageRow } from '../modules/types';
import { normalizePipelineRow, normalizePipelineStageRow } from '../modules/types';
import { useAuth } from './useAuth';
import { comparePipelinesForBranch, isPipelineVisibleForBranch } from './pipelineScope';

export interface PipelineWithStages extends PipelineRow {
  stages: PipelineStageRow[];
}

type PipelineSelectRow = PipelineDbRow & {
  pipeline_stages?: PipelineStageDbRow[] | null;
};

export function usePipelines() {
  const { session, loading: authLoading, activeBranchId } = useAuth();
  const authReady = !authLoading && !!session;

  const q = useQuery({
    queryKey: [...queryKeys.pipelines, activeBranchId ?? 'all'],
    enabled: authReady,
    queryFn: async (): Promise<PipelineWithStages[]> => {
      if (usesBackendData) {
        const [pipelines, stages] = await Promise.all([listBackendCatalog('pipelines'), listBackendCatalog('pipeline_stages')]);
        return pipelines.filter(row => row.entidade_tipo === 'oportunidade' && isPipelineVisibleForBranch(normalizePipelineRow(row), activeBranchId))
          .map(row => ({ ...normalizePipelineRow(row), stages: stages.filter(stage => stage.pipeline_id === row.id).map(normalizePipelineStageRow) }))
          .sort((a, b) => comparePipelinesForBranch(activeBranchId, a, b));
      }
      const { data, error } = await supabase
        .from('pipelines')
        .select(`
          *,
          pipeline_stages (*)
        `)
        .eq('ativo', true)
        .order('entidade_tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }

      const rows = ((data ?? []) as PipelineSelectRow[])
        .map((row) => {
          const { pipeline_stages, ...pipeline } = row;
          return {
            ...normalizePipelineRow(pipeline),
            stages: [...(pipeline_stages ?? [])]
              .map((stage) => normalizePipelineStageRow(stage))
              .sort((a, b) => (a.ordem ?? Number.MAX_SAFE_INTEGER) - (b.ordem ?? Number.MAX_SAFE_INTEGER)),
          };
        })
        .filter((row) => isPipelineVisibleForBranch(normalizePipelineRow(row), activeBranchId))
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
