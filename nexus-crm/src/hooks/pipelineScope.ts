import type { PipelineRow } from '../modules/types';

export function isPipelineVisibleForBranch(pipeline: PipelineRow, activeBranchId: string | null) {
  return pipeline.filial_id === null || activeBranchId === null || pipeline.filial_id === activeBranchId;
}

export function getPipelineScopeLabel(pipeline: Pick<PipelineRow, 'filial_id'>) {
  return pipeline.filial_id ? 'Funil da corretora' : 'Modelo do grupo';
}

export function comparePipelinesForBranch(
  activeBranchId: string | null,
  a: PipelineRow,
  b: PipelineRow,
) {
  const aIsCurrentBranch = activeBranchId !== null && a.filial_id === activeBranchId;
  const bIsCurrentBranch = activeBranchId !== null && b.filial_id === activeBranchId;

  if (aIsCurrentBranch !== bIsCurrentBranch) return aIsCurrentBranch ? -1 : 1;
  if ((a.filial_id === null) !== (b.filial_id === null)) return a.filial_id === null ? -1 : 1;

  const moduleOrder = a.module.localeCompare(b.module, 'pt-BR');
  if (moduleOrder !== 0) return moduleOrder;
  return a.name.localeCompare(b.name, 'pt-BR');
}
