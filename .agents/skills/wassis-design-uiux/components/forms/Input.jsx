import React from 'react'

/**
 * Campo de texto W.Assis. Suporta label (eyebrow), ícone à esquerda,
 * mensagem de erro e estado desabilitado. Foco com ring azul da marca.
 */
export function Input({
  label,
  hint,
  error,
  leadingIcon = null,
  pill = false,
  id,
  style = {},
  containerStyle = {},
  disabled = false,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false)
  const inputId = id || React.useId()
  const borderColor = error
    ? 'var(--signal-danger)'
    : focused
    ? 'var(--accent-primary)'
    : 'var(--border-1)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...containerStyle }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-text)', fontSize: '10px', fontWeight: 'var(--w-bold)',
          textTransform: 'uppercase', letterSpacing: 'var(--tr-caps)', color: 'var(--fg-3)',
        }}>{label}</label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leadingIcon && (
          <span style={{ position: 'absolute', left: 12, color: 'var(--fg-4)', display: 'flex', pointerEvents: 'none' }}>
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e) }}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: leadingIcon ? '9px 14px 9px 36px' : '9px 14px',
            fontFamily: 'var(--font-text)',
            fontSize: 'var(--t-sm)',
            color: 'var(--fg-1)',
            background: disabled ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
            border: `1px solid ${borderColor}`,
            borderRadius: pill ? 'var(--r-pill)' : 'var(--r-md)',
            outline: 'none',
            boxShadow: focused && !error ? 'var(--focus-ring)' : 'none',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
            ...style,
          }}
          {...rest}
        />
      </div>
      {error ? (
        <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-xs)', color: 'var(--signal-danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-xs)', color: 'var(--fg-4)' }}>{hint}</span>
      ) : null}
    </div>
  )
}
