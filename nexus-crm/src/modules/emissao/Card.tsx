import { FileText } from 'lucide-react';
import { makeKanbanCard } from '../KanbanCardShell';

/** Card do modulo Emissao. Accent bar azul (info) + icone de documento. */
export const EmissaoCard = makeKanbanCard({ accent: 'info', accentBar: true, LeftIcon: FileText });
