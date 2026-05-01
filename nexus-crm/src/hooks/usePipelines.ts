import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import type { PipelineRow, PipelineStageRow } from '../modules/types';
import { useAuth } from './useAuth';

export interface PipelineWithStages extends PipelineRow {
  stages: PipelineStageRow[];
}

export function usePipelines() {
  const { session, loading: authLoading } = useAuth();
  const authReady = !authLoading && !!session;

  const q = useQuery({
    queryKey: queryKeys.pipelines,
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

      const rows = (data ?? []).map((row: any) => ({
        ...row,
        stages: (row.pipeline_stages ?? []).sort((a: any, b: any) => a.order - b.order)
      })) as PipelineWithStages[];
      
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
