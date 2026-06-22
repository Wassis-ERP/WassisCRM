import React from 'react'

/**
 * Botão somente-ícone — quadrado, para barras de ferramentas e ações de linha.
 * Tons: neutral (padrão), primary, danger.
 */
export function IconButton({
  tone = 'neutral',
  size = 'md',
  label,
  disabled = false,
  onClick,
  style = {},
  children,
  ...rest
}) {
  const dim = { sm: 30, md: 36, lg: 42 }[size]
  const tones = {
    neutral: { color: 'var(--fg-3)', bgHover: 'var(--bg-surface-2)' },
    primary: { color: 'var(--accent-primary)', bgHover: 'var(--accent-primary-soft)' },
    danger: { color: 'var(--signal-danger)', bgHover: 'color-mix(in srgb, var(--signal-danger) 12%, transparent)' },
  }[tone]

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = tones.bgHover }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        borderRadius: 'var(--r-md)',
        background: 'transparent',
        border: 'none',
        color: tones.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background var(--dur-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
