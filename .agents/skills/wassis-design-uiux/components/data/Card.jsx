import React from 'react'

/**
 * Card / superfície de seção do W.Assis. Cabeçalho opcional (título + ícone
 * + ação à direita) e corpo com padding configurável. Borda + sombra suave.
 */
export function Card({
  title,
  icon = null,
  action = null,
  bodyStyle = {},
  style = {},
  children,
  ...rest
}) {
  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border-1)',
        boxShadow: 'var(--shadow-1)',
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          padding: '16px 24px', borderBottom: '1px solid var(--border-1)',
        }}>
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: '8px', margin: 0,
            fontFamily: 'var(--font-text)', fontSize: 'var(--t-base)', fontWeight: 'var(--w-bold)', color: 'var(--fg-1)',
          }}>
            {icon && <span style={{ color: 'var(--accent-primary)', display: 'flex' }}>{icon}</span>}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div style={{ padding: '24px', ...bodyStyle }}>{children}</div>
    </section>
  )
}
