import { useMemo, useRef, useState } from 'react';
import { useKanbanCards } from '../../hooks/useKanbanCards';
import { useMoveCard } from '../../hooks/useMoveCard';
import { usePipelineStages } from '../../hooks/usePipelineStages';
import { applyKanbanFilters } from '../../modules/filters';
import { getAdapter } from '../../modules/registry';
import type { CardStatus, KanbanCard, KanbanFilters, PipelineModule } from '../../modules/types';
import { KanbanColumn } from './KanbanColumn';
import ConcludeCardModal from './ConcludeCardModal';

export interface KanbanBoardProps {
  pipelineId: string;
  module: PipelineModule;
  filters?: KanbanFilters;
  onCardOpen?: (card: KanbanCard) => void;
}

/**
 * KanbanBoard generico. Recebe um pipeline (id + module), busca stages e cards
 * via React Query, e renderiza usando o CardComponent do adapter do modulo.
 *
 * DnD entre colunas usa update otimista via `useMoveCard`.
 */
export function KanbanBoard({
  pipelineId,
  module,
  filters,
  onCardOpen,
}: KanbanBoardProps) {
  const statusFilter = filters?.status ?? 'active';
  const includeConcluded = statusFilter !== 'active';

  const stagesQuery = usePipelineStages(pipelineId);
  const cardsQuery = useKanbanCards({ pipelineId, module, includeConcluded });
  const moveMutation = useMoveCard({ module, pipelineId });

  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [concludeState, setConcludeState] = useState<{ card: KanbanCard; mode: Exclude<CardStatus, 'pending'> } | null>(null);
  const draggedRef = useRef<{ cardId: string; fromStageId: string } | null>(null);

  const adapter = useMemo(() => getAdapter(module), [module]);

  const handleCardConclude = (card: KanbanCard, mode: Exclude<CardStatus, 'pending'>) => {
    setConcludeState({ card, mode });
  };

  const toggleCollapse = (stageId: string) => {
    setCollapsed((prev) => (prev.includes(stageId) ? prev.filter((id) => id !== stageId) : [...prev, stageId]));
  };

  const handleDragStart = (cardId: string, fromStageId: string) => {
    draggedRef.current = { cardId, fromStageId };
  };

  const handleDrop = (toStageId: string) => {
    const dragged = draggedRef.current;
    draggedRef.current = null;
    if (!dragged || dragged.fromStageId === toStageId) return;

    moveMutation.mutate({ cardId: dragged.cardId, toStageId });
  };

  const cardsByStage = useMemo(() => {
    const all = cardsQuery.data ?? [];

    const statusFiltered = all.filter((c) => {
      if (statusFilter === 'active') return c.status === 'pending';
      if (statusFilter === 'concluded') return c.status !== 'pending';
      return true;
    });

    const filtered = applyKanbanFilters(statusFiltered, filters, adapter.availableFilters);

    const map = new Map<string, KanbanCard[]>();
    for (const card of filtered) {
      if (!card.stageId) continue;
      const list = map.get(card.stageId) ?? [];
      list.push(card);
      map.set(card.stageId, list);
    }
    return map;
  }, [cardsQuery.data, filters, statusFilter, adapter.availableFilters]);

  if (stagesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Carregando funil...
      </div>
    );
  }

  if (stagesQuery.isError) {
    return (
      <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-rose-500">
        Erro ao carregar etapas do funil
      </div>
    );
  }

  const stages = stagesQuery.data ?? [];

  return (
    <div className="animate-fade-in w-full h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 mt-2 custom-scrollbar flex-1">
        {stages.map((stage) => {
          const stageCards = cardsByStage.get(stage.id) ?? [];
          const totalValue = stageCards.reduce((acc, c) => acc + (c.primaryValue ?? 0), 0);
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              cards={stageCards}
              totalValue={totalValue}
              collapsed={collapsed.includes(stage.id)}
              onToggleCollapse={toggleCollapse}
              CardComponent={adapter.CardComponent}
              onCardOpen={onCardOpen}
              onCardConclude={handleCardConclude}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          );
        })}

        {stages.length === 0 && !stagesQuery.isLoading && (
          <div className="flex-1 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-slate-400">
            Este funil ainda nao possui etapas
          </div>
        )}
      </div>

      {cardsQuery.isError && (
        <div className="border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-[10px] font-bold px-3 py-2 rounded-lg mx-4 mb-2">
          Falha ao carregar cards. Verifique conexao ou RLS.
        </div>
      )}

      <ConcludeCardModal
        isOpen={!!concludeState}
        card={concludeState?.card ?? null}
        mode={concludeState?.mode ?? 'won'}
        module={module}
        pipelineId={pipelineId}
        onClose={() => setConcludeState(null)}
      />
    </div>
  );
}
