import { DollarSign } from 'lucide-react';
import { makeKanbanCard } from '../KanbanCardShell';

/** Card do modulo Financeiro. Accent bar verde + icone de cifrao. */
export const FinanceiroCard = makeKanbanCard({ accent: 'success', accentBar: true, LeftIcon: DollarSign });
