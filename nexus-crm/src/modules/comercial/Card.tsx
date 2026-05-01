import { makeKanbanCard } from '../KanbanCardShell';

/**
 * Card do modulo Comercial. Destaca o valor do premio na cor primaria e
 * nao usa accent bar (visual mais sobrio por ser o modulo principal).
 */
export const ComercialCard = makeKanbanCard({ accent: 'primary' });
