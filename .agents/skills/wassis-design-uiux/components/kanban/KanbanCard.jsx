import React from 'react'

const ACCENTS = {
  primary: 'var(--accent-primary)', danger: 'var(--signal-danger)',
  success: 'var(--signal-success)', warning: 'var(--signal-warning)', info: 'var(--signal-info)',
}

function dateStatus(due) {
  if (!due) return 'none'
  const d = new Date(due); const today = new Date()
  d.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0)
  if (d < today) return 'overdue'
  if (d.getTime() === today.getTime()) return 'today'
  return 'future'
}

const TAG_TONE = {
  default: { bg: 'var(--bg-surface-2)', fg: 'var(--fg-3)', bd: 'var(--border-1)' },
  danger: { bg: 'color-mix(in srgb, var(--signal-danger) 10%, transparent)', fg: 'var(--signal-danger)', bd: 'color-mix(in srgb, var(--signal-danger) 22%, transparent)' },
  warning: { bg: 'color-mix(in srgb, var(--signal-warning) 10%, transparent)', fg: 'var(--signal-warning)', bd: 'color-mix(in srgb, var(--signal-warning) 22%, transparent)' },
  success: { bg: 'color-mix(in srgb, var(--signal-success) 10%, transparent)', fg: 'var(--signal-success)', bd: 'color-mix(in srgb, var(--signal-success) 22%, transparent)' },
}

/**
 * Card de Kanban do W.Assis CRM — o componente-assinatura dos funis por módulo.
 * Tag de ramo, data com cor por vencimento, título caixa-alta, tags extras,
 * responsável (avatar + nome) e valor principal destacado.
 */
export function KanbanCard({
  title, subtitle, tag, value, valueLabel = 'Valor',
  dueDate, responsavelName, responsavelAvatar, tags = [],
  accent = 'primary', accentBar = false, onClick, style = {}, ...rest
}) {
  const status = dateStatus(dueDate)
  const borderColor = status === 'today' ? 'color-mix(in srgb, var(--accent-primary) 50%, var(--border-1))'
    : status === 'overdue' ? 'color-mix(in srgb, var(--signal-danger) 55%, var(--border-1))'
    : 'var(--border-1)'
  const dateColor = status === 'overdue' ? 'var(--signal-danger)' : status === 'today' ? 'var(--accent-primary)' : 'var(--signal-warning)'
  const dateText = dueDate ? new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null
  const valueText = typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : value
  const firstName = (responsavelName || '').split(' ')[0]
  const initials = (responsavelName || 'U').split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-1)' }}
      style={{
        position: 'relative', background: 'var(--bg-surface)',
        border: `1px solid ${borderColor}`, borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-1)', padding: '12px', cursor: 'pointer',
        overflow: 'hidden', transition: 'box-shadow var(--dur-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {accentBar && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ACCENTS[accent] }} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        {tag && (
          <span style={{
            padding: '2px 8px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-1)',
            borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-text)', fontSize: 9, fontWeight: 'var(--w-black)',
            textTransform: 'uppercase', letterSpacing: 'var(--tr-widest)', color: 'var(--fg-4)',
          }}>{tag}</span>
        )}
        {dateText && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-text)', fontSize: 9, fontWeight: 'var(--w-bold)', color: dateColor, marginLeft: 'auto' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {dateText}
          </span>
        )}
      </div>

      <h4 style={{ margin: 0, fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 'var(--w-black)', color: 'var(--fg-1)', textTransform: 'uppercase', letterSpacing: 'var(--tr-tight)', lineHeight: 1.2 }}>{title}</h4>
      {subtitle && <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-text)', fontSize: 9, fontWeight: 'var(--w-bold)', textTransform: 'uppercase', letterSpacing: 'var(--tr-widest)', color: 'var(--fg-4)' }}>{subtitle}</p>}

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {tags.map((t, i) => {
            const tone = TAG_TONE[t.tone || 'default']
            return <span key={i} style={{ padding: '2px 6px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-text)', fontSize: 8, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: '0.08em', background: tone.bg, color: tone.fg, border: `1px solid ${tone.bd}` }}>{t.label}</span>
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {responsavelAvatar
            ? <img src={responsavelAvatar} alt={responsavelName} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border-1)' }} />
            : <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-primary), var(--brand-blue-deep))', color: 'var(--fg-on-brand)', fontFamily: 'var(--font-text)', fontWeight: 700, fontSize: 9 }}>{initials}</span>}
          {firstName && <span style={{ fontFamily: 'var(--font-text)', fontSize: 10, fontWeight: 'var(--w-bold)', color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstName}</span>}
        </div>
        {value != null && (
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-text)', fontSize: 8, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-4)', lineHeight: 1, marginBottom: 2 }}>{valueLabel}</span>
            <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-xs)', fontWeight: 'var(--w-black)', letterSpacing: 'var(--tr-tight)', color: ACCENTS[accent] }}>{valueText}</span>
          </div>
        )}
      </div>
    </div>
  )
}
