import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import type { PipelineModule, PipelineRow, PipelineStageRow } from '../modules/types';
import type { TablesUpdate } from '../types/database';

type PipelinePatch = Pick<TablesUpdate<'pipelines'>, 'name' | 'is_active' | 'won_label' | 'lost_label'>;
type StagePatch = Pick<
  TablesUpdate<'pipeline_stages'>,
  'name' | 'color' | 'is_win_eligible' | 'is_loss_eligible' | 'order'
>;

/**
 * Mutations admin para gestao de Pipelines e Pipeline Stages.
 * Todas isoladas por tenant via RLS (`get_user_tenant_id()`) + filtro explicito.
 * Invalida `queryKeys.pipelines` e `queryKeys.stages(...)` para refletir imediato no Kanban.
 */
export function usePipelinesAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const invalidatePipelines = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines });
  };

  const invalidateStages = (pipelineId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stages(pipelineId) });
  };

  // ------------------- Pipelines -------------------

  const createPipeline = useMutation({
    mutationFn: async (input: { name: string; module: PipelineModule }): Promise<PipelineRow> => {
      if (!tenantId) throw new Error('Tenant nao encontrado');
      const { data, error } = await supabase
        .from('pipelines')
        .insert({
          name: input.name.trim(),
          module: input.module,
          tenant_id: tenantId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PipelineRow;
    },
    onSuccess: () => invalidatePipelines(),
  });

  const updatePipeline = useMutation({
    mutationFn: async (input: { id: string; patch: PipelinePatch }): Promise<PipelineRow> => {
      const { data, error } = await supabase
        .from('pipelines')
        .update(input.patch)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as PipelineRow;
    },
    onSuccess: () => invalidatePipelines(),
  });

  const archivePipeline = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('pipelines')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidatePipelines(),
  });

  // ------------------- Stages -------------------

  const createStage = useMutation({
    mutationFn: async (input: {
      pipelineId: string;
      name: string;
      color?: string;
      order?: number;
      is_win_eligible?: boolean;
      is_loss_eligible?: boolean;
    }): Promise<PipelineStageRow> => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert({
          pipeline_id: input.pipelineId,
          name: input.name.trim(),
          color: input.color ?? 'bg-slate-400',
          order: input.order ?? 0,
          is_win_eligible: input.is_win_eligible ?? false,
          is_loss_eligible: input.is_loss_eligible ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PipelineStageRow;
    },
    onSuccess: (_data, vars) => invalidateStages(vars.pipelineId),
  });

  const updateStage = useMutation({
    mutationFn: async (input: {
      id: string;
      pipelineId: string;
      patch: StagePatch;
    }): Promise<PipelineStageRow> => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .update(input.patch)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as PipelineStageRow;
    },
    onSuccess: (_data, vars) => invalidateStages(vars.pipelineId),
  });

  const deleteStage = useMutation({
    mutationFn: async (input: { id: string; pipelineId: string }): Promise<void> => {
      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => invalidateStages(vars.pipelineId),
  });

  /**
   * Reordena todas as stages de um pipeline em uma unica mutation.
   * Recebe a lista ja na ordem desejada; atualiza `order` sequencialmente (0..n-1).
   * Tambem aceita patches parciais por stage (ex.: nome, cor, flags) para "Salvar Configuracao" de uma so vez.
   */
  const saveStagesBatch = useMutation({
    mutationFn: async (input: {
      pipelineId: string;
      stages: Array<{ id: string; patch: StagePatch }>;
    }): Promise<void> => {
      const updates = input.stages.map((s, idx) =>
        supabase
          .from('pipeline_stages')
          .update({ ...s.patch, order: idx })
          .eq('id', s.id)
      );
      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
    },
    onSuccess: (_data, vars) => invalidateStages(vars.pipelineId),
  });

  return {
    // pipelines
    createPipeline: createPipeline.mutateAsync,
    updatePipeline: updatePipeline.mutateAsync,
    archivePipeline: archivePipeline.mutateAsync,
    isCreatingPipeline: createPipeline.isPending,
    isArchivingPipeline: archivePipeline.isPending,
    // stages
    createStage: createStage.mutateAsync,
    updateStage: updateStage.mutateAsync,
    deleteStage: deleteStage.mutateAsync,
    saveStagesBatch: saveStagesBatch.mutateAsync,
    isSavingStages: saveStagesBatch.isPending,
  };
}
