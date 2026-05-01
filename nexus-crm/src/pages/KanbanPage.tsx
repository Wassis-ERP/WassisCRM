import { useNavigate } from 'react-router-dom';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { PipelineSelector } from '../components/kanban/PipelineSelector';
import { useActivePipeline } from '../hooks/useActivePipeline';
import type { KanbanCard, KanbanFilters, PipelineModule } from '../modules/types';

/**
 * Wrapper fino sobre o KanbanBoard generico. Auto-descobre o pipeline do modulo
 * via `useActivePipeline`. Se houver mais de um funil no mesmo modulo, o
 * PipelineSelector aparece para permitir a troca.
 *
 * Micro 6 - aceita um objeto `filters: KanbanFilters` completo, que sera
 * aplicado pelo board respeitando `availableFilters` do adapter.
 */
export default function KanbanPage({
  filters,
  module = 'comercial',
}: {
  filters: KanbanFilters;
  /** Mantido por compatibilidade - aceito mas ignorado apos a Fase 2. */
  pipelineId?: string;
  module?: PipelineModule;
  /** Mantido por compatibilidade com a OportunidadesPage legada. */
  oportunidades?: unknown[];
}) {
  const navigate = useNavigate();
  const { pipelines, active, setActive, isLoading, isError, hasMultiple } = useActivePipeline(module);

  const handleOpen = (card: KanbanCard) => {
    if (module === 'comercial') navigate(`/oportunidades/${card.id}`);
  };

  if (isLoading && !active) {
    return (
      <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Carregando funil...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-rose-500">
        Nao foi possivel carregar os funis
      </div>
    );
  }

  if (!active) {
    return (
      <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Nenhum funil disponivel para este modulo
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {hasMultiple && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Funil</span>
          <PipelineSelector
            pipelines={pipelines}
            value={active.id}
            onChange={setActive}
          />
        </div>
      )}

      <KanbanBoard
        pipelineId={active.id}
        module={active.module as PipelineModule}
        filters={filters}
        onCardOpen={handleOpen}
      />
    </div>
  );
}
