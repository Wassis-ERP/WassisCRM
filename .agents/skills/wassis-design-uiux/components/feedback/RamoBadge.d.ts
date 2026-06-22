import * as React from 'react'

export interface RamoBadgeProps {
  /** Nome do ramo (livre). Resolve tolerante: "Seguro Auto", "auto frota" → Auto. */
  ramo: string
  /** Exibe o ponto colorido. @default true */
  dot?: boolean
  style?: React.CSSProperties
}

/** Pílula tintada com a cor oficial do ramo de seguro. */
export function RamoBadge(props: RamoBadgeProps): React.JSX.Element
