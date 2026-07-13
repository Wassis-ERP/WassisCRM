import { comercialAdapter } from './comercial/adapter';
import { financeiroAdapter } from './financeiro/adapter';
import { posVendaAdapter } from './pos_venda/adapter';
import { sinistroAdapter } from './sinistro/adapter';
import type { ModuleAdapter, PipelineModule } from './types';

/**
 * Registry central. O KanbanBoard usa este map para resolver o adapter
 * correto a partir do pipeline.module.
 */
export const MODULE_ADAPTERS: Partial<Record<PipelineModule, ModuleAdapter>> = {
  comercial:  comercialAdapter,
  sinistro:   sinistroAdapter,
  pos_venda:  posVendaAdapter,
  financeiro: financeiroAdapter,
};

export function getAdapter(module: PipelineModule): ModuleAdapter {
  const adapter = MODULE_ADAPTERS[module];
  if (!adapter) throw new Error(`Modulo sem adapter generico: ${module}`);
  return adapter;
}
