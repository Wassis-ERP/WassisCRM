import { AlertTriangle } from 'lucide-react';
import { makeKanbanCard } from '../KanbanCardShell';

/** Card do modulo Sinistro. Accent bar vermelho + icone de alerta. */
export const SinistroCard = makeKanbanCard({ accent: 'danger', accentBar: true, LeftIcon: AlertTriangle });
