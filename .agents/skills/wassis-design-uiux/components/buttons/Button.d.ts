import * as React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Estilo visual. @default 'primary' */
  variant?: ButtonVariant
  /** Tamanho. @default 'md' */
  size?: ButtonSize
  /** CTA da marca: arredondamento total, caixa-alta, tracking largo. @default false */
  pill?: boolean
  /** Ícone à esquerda (ex.: <Plus size={16} /> do lucide). */
  leadingIcon?: React.ReactNode
  /** Ícone à direita. */
  trailingIcon?: React.ReactNode
  children?: React.ReactNode
}

/**
 * Botão principal do W.Assis CRM.
 *
 * @startingPoint section="Buttons" subtitle="Botão da marca com variantes e CTA pill" viewport="700x200"
 */
export function Button(props: ButtonProps): React.JSX.Element
