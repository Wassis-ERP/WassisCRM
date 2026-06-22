import * as React from 'react'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tom do ícone. @default 'neutral' */
  tone?: 'neutral' | 'primary' | 'danger'
  /** Tamanho. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
  /** Rótulo acessível (aria-label + title). */
  label?: string
  /** Ícone (ex.: <MoreHorizontal size={16} />). */
  children?: React.ReactNode
}

/** Botão somente-ícone para toolbars e ações de linha. */
export function IconButton(props: IconButtonProps): React.JSX.Element
