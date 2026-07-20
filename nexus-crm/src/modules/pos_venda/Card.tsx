import { LifeBuoy } from 'lucide-react'
import { KanbanCardShell } from '../KanbanCardShell'
import type { KanbanCardProps } from '../types'

export function PosVendaCard(props: KanbanCardProps) {
  return (
    <KanbanCardShell
      {...props}
      onConclude={undefined}
      accent="info"
      accentBar
      LeftIcon={LifeBuoy}
    />
  )
}
