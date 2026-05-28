import type { ComponentType, ReactNode } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { getDateStatus } from '../utils/date';
import type { KanbanCardProps } from './types';

export type CardAccent = 'primary' | 'danger' | 'success' | 'warning' | 'info';

const ACCENT_CLASSES: Record<CardAccent, string> = {
  primary: 'text-accent-primary',
  danger: 'text-signal-danger',
  success: 'text-signal-success',
  warning: 'text-signal-warning',
  info: 'text-signal-info',
};

const ACCENT_BAR_CLASSES: Record<CardAccent, string> = {
  primary: 'bg-accent-primary',
  danger: 'bg-signal-danger',
  success: 'bg-signal-success',
  warning: 'bg-signal-warning',
  info: 'bg-signal-info',
};

interface ShellOptions {
  /** Cor de destaque usada no valor principal. */
  accent?: CardAccent;
  /** Icone opcional renderizado a esquerda do titulo. */
  LeftIcon?: ComponentType<{ size?: number; className?: string }>;
  /** Tom de fundo adicional (gradient) para diferenciar modulo. */
  accentBar?: boolean;
}

/**
 * Componente visual compartilhado pelos cards de todos os modulos.
 * Reproduz o layout do card Comercial (data colorida por vencimento, tags,
 * avatar do responsavel, valor primario) mas aceita customizacoes por modulo:
 * `accent`, `LeftIcon` e `accentBar`. Tambem integra botoes hover de conclusao
 * (Ganho/Perdido) via `onConclude` + `canWin` do `KanbanCardProps`.
 */
export function KanbanCardShell({
  card,
  onOpen,
  onConclude,
  canWin,
  accent = 'primary',
  LeftIcon,
  accentBar = false,
}: KanbanCardProps & ShellOptions) {
  const dateStatus = getDateStatus(card.dueDate);
  const borderClass =
    dateStatus === 'today' ? 'border-accent-primary/50'
    : dateStatus === 'overdue' ? 'border-signal-danger/60'
    : 'border-border-1';

  const primaryTag = card.tags?.find((t) => t.tone === 'default');
  const infoTag = card.tags?.find((t) => t.tone === 'info');
  const extraTags = (card.tags ?? []).filter((t) => t !== primaryTag && t !== infoTag);

  const dateText = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '-';

  const valueText = typeof card.primaryValue === 'number'
    ? card.primaryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '-';

  const avatarUrl = card.responsavelAvatar ?? `https://i.pravatar.cc/150?u=${card.responsavelId ?? card.id}`;
  const firstName = card.responsavelName?.split(' ')[0] ?? '';

  const stopAnd = (e: React.MouseEvent, fn?: () => void) => {
    e.stopPropagation();
    fn?.();
  };

  return (
    <div
      onClick={() => onOpen?.(card)}
      className={`group relative bg-bg-surface border rounded-[14px] shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] transition-all cursor-pointer p-3 overflow-hidden ${borderClass}`}
    >
      {accentBar && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${ACCENT_BAR_CLASSES[accent]}`} />
      )}

      {onConclude && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canWin && (
            <button
              onClick={(e) => stopAnd(e, () => onConclude(card, 'won'))}
              title="Marcar como Ganho"
              className="p-1 rounded-md bg-signal-success/10 hover:bg-signal-success/20 text-signal-success border border-signal-success/20"
            >
              <Check size={11} />
            </button>
          )}
          <button
            onClick={(e) => stopAnd(e, () => onConclude(card, 'lost'))}
            title="Marcar como Perdido"
            className="p-1 rounded-md bg-signal-danger/10 hover:bg-signal-danger/20 text-signal-danger border border-signal-danger/20"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-2 pr-12">
        <div className="flex items-center gap-1.5 min-w-0">
          {LeftIcon && <LeftIcon size={12} className="text-fg-4 shrink-0" />}
          {primaryTag && (
            <span className="px-2 py-0.5 bg-bg-surface-2 text-[9px] font-black text-fg-4 uppercase tracking-widest rounded-md border border-border-1 truncate">
              {primaryTag.label}
            </span>
          )}
        </div>
        {card.dueDate && (
          <div className={`flex items-center gap-1 text-[9px] font-bold shrink-0 ${
            dateStatus === 'overdue' ? 'text-signal-danger'
            : dateStatus === 'today' ? 'text-accent-primary'
            : 'text-signal-warning'
          }`}>
            <Calendar size={10} />
            <span>{dateText}</span>
          </div>
        )}
      </div>

      <h4 className="text-sm font-black text-fg-1 mb-1 group-hover:text-accent-primary transition-all uppercase tracking-tight leading-tight">
        {card.title}
      </h4>
      {card.subtitle && (
        <p className="text-[9px] font-bold text-fg-4 uppercase tracking-widest mb-2 truncate">
          {card.subtitle}
        </p>
      )}

      {extraTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {extraTags.map((t, i) => (
            <span
              key={`${t.label}-${i}`}
              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                t.tone === 'danger' ? 'bg-signal-danger/10 text-signal-danger border-signal-danger/20'
                : t.tone === 'warning' ? 'bg-signal-warning/10 text-signal-warning border-signal-warning/20'
                : t.tone === 'success' ? 'bg-signal-success/10 text-signal-success border-signal-success/20'
                : 'bg-bg-surface-2 text-fg-3 border-border-1'
              }`}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border-1">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={avatarUrl}
            alt={card.responsavelName ?? 'Responsavel'}
            className="w-6 h-6 rounded-full border border-border-1 shadow-[var(--shadow-1)] shrink-0"
          />
          <div className="flex flex-col min-w-0">
            {infoTag && (
              <span className="text-[9px] font-black text-fg-4 uppercase leading-none truncate">{infoTag.label}</span>
            )}
            {firstName && (
              <span className="text-[10px] font-bold text-fg-2 leading-tight truncate">{firstName}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-[8px] font-black text-fg-4 uppercase leading-none mb-0.5">
            {card.primaryValueLabel ?? 'Valor'}
          </span>
          <span className={`text-xs font-black tracking-tighter ${ACCENT_CLASSES[accent]}`}>
            {valueText}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Helper para criar um CardComponent com opcoes pre-configuradas. */
export function makeKanbanCard(options: ShellOptions): ComponentType<KanbanCardProps> {
  return function BoundCard(props: KanbanCardProps): ReactNode {
    return <KanbanCardShell {...props} {...options} />;
  };
}
