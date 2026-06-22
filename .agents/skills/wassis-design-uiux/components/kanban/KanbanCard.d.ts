import * as React from 'react'

export interface KanbanCardTag {
  label: string
  tone?: 'default' | 'danger' | 'warning' | 'success'
}

export interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Título (renderizado em caixa-alta). */
  title: React.ReactNode
  /** Subtítulo curto (caixa-alta, tom leve). */
  subtitle?: React.ReactNode
  /** Tag-cabeçalho (ex.: número da oportunidade ou ramo). */
  tag?: React.ReactNode
  /** Valor principal — número (formatado em BRL) ou string pronta. */
  value?: number | string
  /** Rótulo do valor. @default 'Valor' */
  valueLabel?: string
  /** Data de vencimento/retorno — colore por atraso/hoje/futuro. */
  dueDate?: string
  /** Nome do responsável (mostra primeiro nome + iniciais). */
  responsavelName?: string
  /** URL do avatar do responsável. */
  responsavelAvatar?: string
  /** Tags extras coloridas. */
  tags?: KanbanCardTag[]
  /** Cor de destaque do valor. @default 'primary' */
  accent?: 'primary' | 'danger' | 'success' | 'warning' | 'info'
  /** Barra vertical de acento à esquerda. @default false */
  accentBar?: boolean
}

/**
 * Card de Kanban — o componente-assinatura dos funis por módulo do CRM.
 *
 * @startingPoint section="Kanban" subtitle="Card de funil com ramo, prazo, responsável e valor" viewport="700x280"
 */
export function KanbanCard(props: KanbanCardProps): React.JSX.Element
