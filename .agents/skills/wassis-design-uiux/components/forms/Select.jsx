import React from 'react'

/**
 * Select W.Assis — wrapper estilizado sobre o <select> nativo, com label
 * opcional (eyebrow) e chevron próprio. Aceita `options` [{value,label}]
 * ou children <option>.
 */
export function Select({
  label,
  options,
  placeholder,
  id,
  style = {},
  containerStyle = {},
  disabled = false,
  children,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false)
  const selectId = id || React.useId()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...containerStyle }}>
      {label && (
        <label htmlFor={selectId} style={{
          fontFamily: 'var(--font-text)', fontSize: '10px', fontWeight: 'var(--w-bold)',
          textTransform: 'uppercase', letterSpacing: 'var(--tr-caps)', color: 'var(--fg-3)',
        }}>{label}</label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          id={selectId}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            appearance: 'none',
            WebkitAppearance: 'none',
            padding: '9px 36px 9px 14px',
            fontFamily: 'var(--font-text)',
            fontSize: 'var(--t-sm)',
            fontWeight: 'var(--w-medium)',
            color: 'var(--fg-1)',
            background: disabled ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
            border: `1px solid ${focused ? 'var(--accent-primary)' : 'var(--border-1)'}`,
            borderRadius: 'var(--r-md)',
            outline: 'none',
            boxShadow: focused ? 'var(--focus-ring)' : 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
            ...style,
          }}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options
            ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
            : children}
        </select>
        <span style={{ position: 'absolute', right: 12, color: 'var(--fg-4)', pointerEvents: 'none', display: 'flex' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </div>
    </div>
  )
}
