import { MessageSquareText } from 'lucide-react'
import { KanbanCardShell } from '../KanbanCardShell'
import type { KanbanCardProps } from '../types'

export function FinanceiroCard({ card, onOpen }: KanbanCardProps) {
  return (
    <KanbanCardShell
      card={card}
      onOpen={onOpen}
      accent="warning"
      accentBar
      LeftIcon={MessageSquareText}
    />
  )
}
