import { comercialAdapter } from './comercial/adapter';
import { emissaoAdapter } from './emissao/adapter';
import { financeiroAdapter } from './financeiro/adapter';
import { posVendaAdapter } from './pos_venda/adapter';
import { sinistroAdapter } from './sinistro/adapter';
import type { ModuleAdapter, PipelineModule } from './types';

/**
 * Registry central. O KanbanBoard usa este map para resolver o adapter
 * correto a partir do pipeline.module.
 */
export const MODULE_ADAPTERS: Record<PipelineModule, ModuleAdapter> = {
  comercial:  comercialAdapter,
  sinistro:   sinistroAdapter,
  emissao:    emissaoAdapter,
  pos_venda:  posVendaAdapter,
  financeiro: financeiroAdapter,
};

export function getAdapter(module: PipelineModule): ModuleAdapter {
  return MODULE_ADAPTERS[module];
}
