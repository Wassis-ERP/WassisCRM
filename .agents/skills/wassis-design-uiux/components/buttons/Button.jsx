import React from 'react'

/**
 * Botão W.Assis — usa os tokens semânticos (--accent-*, --signal-*, --r-*).
 * Variantes: primary (azul sólido), secondary (azul soft), ghost (transparente),
 * danger (vermelho soft). `pill` ativa o estilo de CTA da marca: cantos
 * arredondados totais, caixa-alta e tracking largo.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  pill = false,
  leadingIcon = null,
  trailingIcon = null,
  disabled = false,
  type = 'button',
  onClick,
  style = {},
  children,
  ...rest
}) {
  const sizes = {
    sm: { padding: pill ? '6px 14px' : '6px 12px', fontSize: 'var(--t-xs)', gap: '6px', icon: 14, minH: 30 },
    md: { padding: pill ? '9px 18px' : '9px 16px', fontSize: 'var(--t-sm)', gap: '8px', icon: 16, minH: 38 },
    lg: { padding: pill ? '12px 24px' : '12px 22px', fontSize: 'var(--t-base)', gap: '10px', icon: 18, minH: 46 },
  }[size]

  const variants = {
    primary: {
      background: 'var(--accent-primary)',
      color: 'var(--accent-primary-fg)',
      border: '1px solid transparent',
      boxShadow: pill ? 'var(--shadow-brand)' : 'var(--shadow-1)',
    },
    secondary: {
      background: 'var(--accent-primary-soft)',
      color: 'var(--accent-primary)',
      border: '1px solid transparent',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fg-2)',
      border: '1px solid var(--border-1)',
    },
    danger: {
      background: 'color-mix(in srgb, var(--signal-danger) 12%, transparent)',
      color: 'var(--signal-danger)',
      border: '1px solid color-mix(in srgb, var(--signal-danger) 24%, transparent)',
    },
  }[variant]

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.gap,
    padding: sizes.padding,
    minHeight: sizes.minH,
    fontFamily: 'var(--font-text)',
    fontSize: sizes.fontSize,
    fontWeight: pill ? 'var(--w-black)' : 'var(--w-semibold)',
    letterSpacing: pill ? 'var(--tr-widest)' : 'normal',
    textTransform: pill ? 'uppercase' : 'none',
    lineHeight: 1,
    borderRadius: pill ? 'var(--r-pill)' : 'var(--r-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'filter var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
    whiteSpace: 'nowrap',
    ...variants,
    ...style,
  }

  const onEnter = (e) => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)' }
  const onLeave = (e) => { e.currentTarget.style.filter = 'none' }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={base}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
}
