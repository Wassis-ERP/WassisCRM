import { AlertTriangle } from 'lucide-react'
import { KanbanCardShell } from '../KanbanCardShell'
import type { KanbanCardProps } from '../types'

/**
 * Card de Sinistro sem os atalhos genericos Ganho/Perda. Os status de dominio
 * serao tratados por comandos proprios no fechamento da Fase 4.1.
 */
export function SinistroCard(props: KanbanCardProps) {
  return (
    <KanbanCardShell
      {...props}
      onConclude={undefined}
      accent="danger"
      accentBar
      LeftIcon={AlertTriangle}
    />
  )
}
