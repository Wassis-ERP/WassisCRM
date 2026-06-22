import * as React from 'react'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface StatusBadgeProps {
  /** Texto exibido. Tons conhecidos (Ativo, Pendente, Atrasada…) inferem a cor. */
  status: string
  /** Força um tom semântico. */
  tone?: BadgeTone
  /** Exibe o ponto colorido. @default true */
  dot?: boolean
  style?: React.CSSProperties
}

/** Pílula de status com tom semântico (sucesso/alerta/perigo/info/neutro). */
export function StatusBadge(props: StatusBadgeProps): React.JSX.Element
