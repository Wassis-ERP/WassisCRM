import React from 'react'

/**
 * KpiCard — cartão de indicador do dashboard. Ícone em bloco colorido,
 * valor grande, título e variação (trend up/down) opcional.
 */
export function KpiCard({
  title,
  value,
  icon = null,
  iconColor = 'var(--accent-primary)',
  change,
  trend = 'up',
  style = {},
  ...rest
}) {
  const up = trend === 'up'
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border-1)',
        boxShadow: 'var(--shadow-1)',
        padding: '24px',
        transition: 'box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-1)' }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        {icon && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 'var(--r-md)',
            background: iconColor, color: '#fff',
          }}>{icon}</div>
        )}
        {change && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontFamily: 'var(--font-text)', fontSize: 'var(--t-xs)', fontWeight: 'var(--w-semibold)',
            color: up ? 'var(--signal-success)' : 'var(--signal-danger)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {up ? <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>
                  : <><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></>}
            </svg>
            {change}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--t-2xl)', fontWeight: 'var(--w-bold)', color: 'var(--fg-1)', letterSpacing: 'var(--tr-tight)' }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', color: 'var(--fg-3)' }}>{title}</p>
    </div>
  )
}
