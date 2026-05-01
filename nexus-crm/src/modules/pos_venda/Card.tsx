import { LifeBuoy } from 'lucide-react';
import { makeKanbanCard } from '../KanbanCardShell';

/** Card do modulo Pos-Venda. Accent bar ambar + icone de apoio. */
export const PosVendaCard = makeKanbanCard({ accent: 'warning', accentBar: true, LeftIcon: LifeBuoy });
