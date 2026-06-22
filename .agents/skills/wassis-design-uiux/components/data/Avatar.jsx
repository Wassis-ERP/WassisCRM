import React from 'react'

/**
 * Avatar W.Assis — imagem circular ou iniciais sobre gradiente azul da marca.
 * Deriva iniciais do `name` quando não há `src`.
 */
export function Avatar({ name = '', src, size = 40, style = {}, ...rest }) {
  const initials = name
    .split(/\s+|@/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join('') || 'U'

  const common = {
    width: size, height: size, borderRadius: '50%', flex: 'none',
    boxShadow: 'var(--shadow-1)', ...style,
  }

  if (src) {
    return <img src={src} alt={name} style={{ ...common, objectFit: 'cover', border: '1px solid var(--border-1)' }} {...rest} />
  }
  return (
    <span
      aria-label={name}
      style={{
        ...common,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--accent-primary), var(--brand-blue-deep))',
        color: 'var(--fg-on-brand)',
        fontFamily: 'var(--font-text)', fontWeight: 'var(--w-semibold)',
        fontSize: Math.max(11, size * 0.38),
      }}
      {...rest}
    >{initials}</span>
  )
}
