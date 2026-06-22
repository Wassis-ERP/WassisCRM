import * as React from 'react'

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rótulo da métrica (ex.: "Receita Total"). */
  title: React.ReactNode
  /** Valor em destaque (ex.: "R$ 2.847.500"). */
  value: React.ReactNode
  /** Ícone (ex.: <DollarSign size={20} />). */
  icon?: React.ReactNode
  /** Cor do bloco do ícone. @default azul da marca */
  iconColor?: string
  /** Texto de variação (ex.: "+18.2%"). */
  change?: React.ReactNode
  /** Direção da variação. @default 'up' */
  trend?: 'up' | 'down'
}

/**
 * Cartão de KPI do dashboard.
 *
 * @startingPoint section="Data" subtitle="Cartão de indicador com ícone e variação" viewport="700x180"
 */
export function KpiCard(props: KpiCardProps): React.JSX.Element
