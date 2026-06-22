import * as React from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'style'> {
  /** Rótulo (eyebrow, caixa-alta). */
  label?: React.ReactNode
  /** Opções [{value,label}]. Alternativa a passar <option> como children. */
  options?: SelectOption[]
  /** Texto da opção vazia inicial. */
  placeholder?: string
  style?: React.CSSProperties
  containerStyle?: React.CSSProperties
  children?: React.ReactNode
}

/** Select estilizado da marca, com chevron próprio. */
export function Select(props: SelectProps): React.JSX.Element
