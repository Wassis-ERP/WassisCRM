import { KanbanCardShell } from '../KanbanCardShell';
import type { KanbanCardProps } from '../types';

/**
 * Card do modulo Comercial. Destaca o valor do premio na cor primaria e
 * nao usa accent bar (visual mais sobrio por ser o modulo principal).
 */
export function ComercialCard(props: KanbanCardProps) { return <KanbanCardShell {...props} accent="primary" />; }
