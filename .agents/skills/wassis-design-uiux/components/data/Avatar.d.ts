import * as React from 'react'

export interface AvatarProps extends React.HTMLAttributes<HTMLElement> {
  /** Nome — usado para iniciais e alt. */
  name?: string
  /** URL da imagem; sem ela, mostra iniciais sobre gradiente azul. */
  src?: string
  /** Diâmetro em px. @default 40 */
  size?: number
}

/** Avatar circular: imagem ou iniciais sobre o gradiente azul da marca. */
export function Avatar(props: AvatarProps): React.JSX.Element
