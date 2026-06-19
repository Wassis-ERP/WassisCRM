import { Maximize2, MoreHorizontal } from 'lucide-react';
import type { ComponentType } from 'react';
import type { CardStatus, KanbanCard, KanbanCardProps, PipelineStageRow } from '../../modules/types';

interface KanbanColumnProps {
  stage: PipelineStageRow;
  cards: KanbanCard[];
  /** Soma dos `primaryValue` dos cards (usada no header). */
  totalValue?: number;
  collapsed: boolean;
  onToggleCollapse: (stageId: string) => void;
  CardComponent: ComponentType<KanbanCardProps>;
  onCardOpen?: (card: KanbanCard) => void;
  onCardConclude?: (card: KanbanCard, mode: Exclude<CardStatus, 'pending'>) => void;
  onDragStart: (cardId: string, fromStageId: string) => void;
  onDrop: (toStageId: string) => void;
}

function formatCurrencyCompact(value: number): string {
  if (!value) return 'R$ 0';
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.0', '')}K`;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/**
 * Coluna individual do KanbanBoard. Mantem a UX ja conhecida pelo usuario:
 * - Cabecalho com bolinha colorida, nome da etapa e contador
 * - Botao para colapsar (transforma a coluna em trilha vertical com nome rotacionado)
 * - Drop zone em toda a area dos cards
 */
export function KanbanColumn({
  stage,
  cards,
  totalValue = 0,
  collapsed,
  onToggleCollapse,
  CardComponent,
  onCardOpen,
  onCardConclude,
  onDragStart,
  onDrop,
}: KanbanColumnProps) {
  const canWin = !!stage.is_win_eligible;
  if (collapsed) {
    return (
      <div
        className="w-10 shrink-0 flex flex-col items-center py-4 bg-bg-surface-2 rounded-[8px] border border-border-1 cursor-pointer hover:bg-bg-surface-3 transition-all"
        onClick={() => onToggleCollapse(stage.id)}
      >
        <div className={`w-2 h-2 rounded-full mb-4 ${stage.color}`} />
        <div className="flex-1 flex items-center justify-center">
          <h3 className="font-black text-[9px] uppercase tracking-widest text-fg-3 whitespace-nowrap rotate-90 origin-center">
            {stage.name}
          </h3>
        </div>
        <span className="mt-4 text-[10px] font-black text-accent-primary">{cards.length}</span>
      </div>
    );
  }

  return (
    <div
      className="min-w-[280px] w-[280px] shrink-0 flex flex-col min-h-0 h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(stage.id)}
    >
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${stage.color}`} />
            <h3 className="font-black text-[10px] uppercase tracking-wider text-fg-3 truncate">{stage.name}</h3>
            <div className="bg-bg-surface px-1.5 py-0.5 rounded-md border border-border-1 text-[9px] font-black text-fg-4 shrink-0">
              {cards.length}
            </div>
            {stage.is_win_eligible && (
              <span title="Etapa elegivel para Ganho" className="text-[9px] font-black text-signal-success uppercase shrink-0">
                ★
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleCollapse(stage.id)}
              className="p-1 text-fg-4 hover:text-accent-primary transition-all"
              title="Colapsar"
            >
              <Maximize2 size={12} className="rotate-45" />
            </button>
            <button className="p-1 text-fg-4 hover:text-fg-2">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
        {totalValue > 0 && (
          <div className="mt-1 ml-4 text-[9px] font-black uppercase tracking-widest text-fg-4">
            Total: <span className="text-accent-primary">{formatCurrencyCompact(totalValue)}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-2 px-1 -mx-1">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={() => onDragStart(card.id, stage.id)}
          >
            <CardComponent card={card} onOpen={onCardOpen} onConclude={onCardConclude} canWin={canWin} />
          </div>
        ))}

        {cards.length === 0 && (
          <div className="h-20 border border-dashed border-border-1 rounded-[8px] flex items-center justify-center bg-bg-surface-2/40">
            <span className="text-[9px] font-black text-fg-4 uppercase tracking-widest italic">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );
}
