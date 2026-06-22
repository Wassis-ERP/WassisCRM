import React from 'react'

const RAMOS = {
  saude: { label: 'Saúde', color: 'var(--ramo-saude-fg)', soft: 'var(--ramo-saude-soft)' },
  vida: { label: 'Vida', color: 'var(--ramo-vida-fg)', soft: 'var(--ramo-vida-soft)' },
  auto: { label: 'Auto', color: 'var(--ramo-auto-fg)', soft: 'var(--ramo-auto-soft)' },
  moto: { label: 'Moto', color: 'var(--ramo-moto-fg)', soft: 'var(--ramo-moto-soft)' },
  residencia: { label: 'Residência', color: 'var(--ramo-residencia-fg)', soft: 'var(--ramo-residencia-soft)' },
  empresarial: { label: 'Empresarial', color: 'var(--ramo-empresarial-fg)', soft: 'var(--ramo-empresarial-soft)' },
  portateis: { label: 'Portáteis', color: 'var(--ramo-portateis-fg)', soft: 'var(--ramo-portateis-soft)' },
  previdencia: { label: 'Previdência', color: 'var(--ramo-previdencia-fg)', soft: 'var(--ramo-previdencia-soft)' },
}

function resolve(ramo) {
  const k = String(ramo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const match = Object.keys(RAMOS).find((key) => k.includes(key))
  return match ? RAMOS[match] : { label: ramo, color: 'var(--fg-3)', soft: 'var(--bg-surface-3)' }
}

/**
 * Badge de ramo de seguro — pílula tintada com a cor oficial do ramo.
 * Resolve o ramo de forma tolerante ("Seguro Auto", "auto frota" → Auto).
 */
export function RamoBadge({ ramo, dot = true, style = {} }) {
  const r = resolve(ramo)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 10px', borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-text)', fontSize: '11px', fontWeight: 'var(--w-bold)',
      background: r.soft, color: r.color, ...style,
    }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />}
      {r.label}
    </span>
  )
}
