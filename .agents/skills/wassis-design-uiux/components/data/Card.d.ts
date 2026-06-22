import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Título da seção (omita para um card sem cabeçalho). */
  title?: React.ReactNode
  /** Ícone à esquerda do título (ex.: <Users size={16} />). */
  icon?: React.ReactNode
  /** Conteúdo à direita do cabeçalho (botão, link, badge). */
  action?: React.ReactNode
  /** Override do padding do corpo. */
  bodyStyle?: React.CSSProperties
  children?: React.ReactNode
}

/**
 * Superfície de seção da marca.
 *
 * @startingPoint section="Data" subtitle="Card com cabeçalho, ícone e ação" viewport="700x240"
 */
export function Card(props: CardProps): React.JSX.Element
