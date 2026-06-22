import React from 'react'

const TONES = {
  success: { bg: 'color-mix(in srgb, var(--signal-success) 15%, transparent)', fg: 'var(--signal-success)' },
  warning: { bg: 'color-mix(in srgb, var(--signal-warning) 15%, transparent)', fg: 'var(--signal-warning)' },
  danger: { bg: 'color-mix(in srgb, var(--signal-danger) 15%, transparent)', fg: 'var(--signal-danger)' },
  info: { bg: 'var(--accent-primary-soft)', fg: 'var(--accent-primary)' },
  neutral: { bg: 'var(--bg-surface-3)', fg: 'var(--fg-3)' },
}

const STATUS_TONE = {
  Ativo: 'success', Ativa: 'success', Inativo: 'neutral', Prospecto: 'info',
  Renovar: 'warning', 'Em cotação': 'info', Atrasada: 'danger',
  Pendente: 'warning', Concluída: 'success', Ganho: 'success', Perdido: 'danger',
}

/**
 * Badge de status — pílula com tom semântico (nunca cor de ramo).
 * O tom é inferido do texto quando `tone` não é passado.
 */
export function StatusBadge({ status, tone, dot = true, style = {} }) {
  const t = TONES[tone || STATUS_TONE[status] || 'neutral']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '2px 10px', borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-text)', fontSize: '10px', fontWeight: 'var(--w-bold)',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: t.bg, color: t.fg, ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {status}
    </span>
  )
}
