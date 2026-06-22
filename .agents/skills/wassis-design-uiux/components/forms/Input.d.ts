import * as React from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  /** Rótulo (eyebrow, caixa-alta). */
  label?: React.ReactNode
  /** Texto auxiliar abaixo do campo. */
  hint?: React.ReactNode
  /** Mensagem de erro (substitui hint e pinta a borda de vermelho). */
  error?: React.ReactNode
  /** Ícone à esquerda (ex.: <Search size={16} />). */
  leadingIcon?: React.ReactNode
  /** Cantos totalmente arredondados (estilo busca). @default false */
  pill?: boolean
  style?: React.CSSProperties
  containerStyle?: React.CSSProperties
}

/**
 * Campo de texto da marca.
 *
 * @startingPoint section="Forms" subtitle="Campo de texto com label, ícone e erro" viewport="700x160"
 */
export function Input(props: InputProps): React.JSX.Element
