/* @ds-bundle: {"format":3,"namespace":"WAssisDesignSystem_502d77","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"KpiCard","sourcePath":"components/data/KpiCard.jsx"},{"name":"RamoBadge","sourcePath":"components/feedback/RamoBadge.jsx"},{"name":"StatusBadge","sourcePath":"components/feedback/StatusBadge.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"KanbanCard","sourcePath":"components/kanban/KanbanCard.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"997b558638d0","components/buttons/IconButton.jsx":"2e4cfb10ea12","components/data/Avatar.jsx":"7fc7de0defdb","components/data/Card.jsx":"a0918e9d3943","components/data/KpiCard.jsx":"804a8d04ab33","components/feedback/RamoBadge.jsx":"4df9a225ba1b","components/feedback/StatusBadge.jsx":"e99b76ae8721","components/forms/Input.jsx":"7d4e6c62424b","components/forms/Select.jsx":"c0d1196a3f1e","components/kanban/KanbanCard.jsx":"e6f1d3333f0d","ui_kits/crm/DashboardScreen.jsx":"f43b9b612481","ui_kits/crm/KanbanScreen.jsx":"2482afb97f63","ui_kits/crm/SeguradosScreen.jsx":"88fcb9e82769","ui_kits/crm/Shell.jsx":"daabae9658b4","ui_kits/crm/icons.js":"0da567915fef"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.WAssisDesignSystem_502d77 = window.WAssisDesignSystem_502d77 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Botão W.Assis — usa os tokens semânticos (--accent-*, --signal-*, --r-*).
 * Variantes: primary (azul sólido), secondary (azul soft), ghost (transparente),
 * danger (vermelho soft). `pill` ativa o estilo de CTA da marca: cantos
 * arredondados totais, caixa-alta e tracking largo.
 */
function Button({
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
    sm: {
      padding: pill ? '6px 14px' : '6px 12px',
      fontSize: 'var(--t-xs)',
      gap: '6px',
      icon: 14,
      minH: 30
    },
    md: {
      padding: pill ? '9px 18px' : '9px 16px',
      fontSize: 'var(--t-sm)',
      gap: '8px',
      icon: 16,
      minH: 38
    },
    lg: {
      padding: pill ? '12px 24px' : '12px 22px',
      fontSize: 'var(--t-base)',
      gap: '10px',
      icon: 18,
      minH: 46
    }
  }[size];
  const variants = {
    primary: {
      background: 'var(--accent-primary)',
      color: 'var(--accent-primary-fg)',
      border: '1px solid transparent',
      boxShadow: pill ? 'var(--shadow-brand)' : 'var(--shadow-1)'
    },
    secondary: {
      background: 'var(--accent-primary-soft)',
      color: 'var(--accent-primary)',
      border: '1px solid transparent'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fg-2)',
      border: '1px solid var(--border-1)'
    },
    danger: {
      background: 'color-mix(in srgb, var(--signal-danger) 12%, transparent)',
      color: 'var(--signal-danger)',
      border: '1px solid color-mix(in srgb, var(--signal-danger) 24%, transparent)'
    }
  }[variant];
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
    ...style
  };
  const onEnter = e => {
    if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)';
  };
  const onLeave = e => {
    e.currentTarget.style.filter = 'none';
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    onClick: onClick,
    disabled: disabled,
    style: base,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave
  }, rest), leadingIcon, children, trailingIcon);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Botão somente-ícone — quadrado, para barras de ferramentas e ações de linha.
 * Tons: neutral (padrão), primary, danger.
 */
function IconButton({
  tone = 'neutral',
  size = 'md',
  label,
  disabled = false,
  onClick,
  style = {},
  children,
  ...rest
}) {
  const dim = {
    sm: 30,
    md: 36,
    lg: 42
  }[size];
  const tones = {
    neutral: {
      color: 'var(--fg-3)',
      bgHover: 'var(--bg-surface-2)'
    },
    primary: {
      color: 'var(--accent-primary)',
      bgHover: 'var(--accent-primary-soft)'
    },
    danger: {
      color: 'var(--signal-danger)',
      bgHover: 'color-mix(in srgb, var(--signal-danger) 12%, transparent)'
    }
  }[tone];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.background = tones.bgHover;
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
    },
    style: {
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
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar W.Assis — imagem circular ou iniciais sobre gradiente azul da marca.
 * Deriva iniciais do `name` quando não há `src`.
 */
function Avatar({
  name = '',
  src,
  size = 40,
  style = {},
  ...rest
}) {
  const initials = name.split(/\s+|@/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'U';
  const common = {
    width: size,
    height: size,
    borderRadius: '50%',
    flex: 'none',
    boxShadow: 'var(--shadow-1)',
    ...style
  };
  if (src) {
    return /*#__PURE__*/React.createElement("img", _extends({
      src: src,
      alt: name,
      style: {
        ...common,
        objectFit: 'cover',
        border: '1px solid var(--border-1)'
      }
    }, rest));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-label": name,
    style: {
      ...common,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--accent-primary), var(--brand-blue-deep))',
      color: 'var(--fg-on-brand)',
      fontFamily: 'var(--font-text)',
      fontWeight: 'var(--w-semibold)',
      fontSize: Math.max(11, size * 0.38)
    }
  }, rest), initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card / superfície de seção do W.Assis. Cabeçalho opcional (título + ícone
 * + ação à direita) e corpo com padding configurável. Borda + sombra suave.
 */
function Card({
  title,
  icon = null,
  action = null,
  bodyStyle = {},
  style = {},
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: 'var(--bg-surface)',
      borderRadius: 'var(--r-lg)',
      border: '1px solid var(--border-1)',
      boxShadow: 'var(--shadow-1)',
      overflow: 'hidden',
      ...style
    }
  }, rest), title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '16px 24px',
      borderBottom: '1px solid var(--border-1)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
      fontFamily: 'var(--font-text)',
      fontSize: 'var(--t-base)',
      fontWeight: 'var(--w-bold)',
      color: 'var(--fg-1)'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-primary)',
      display: 'flex'
    }
  }, icon), title), action), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px',
      ...bodyStyle
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/KpiCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * KpiCard — cartão de indicador do dashboard. Ícone em bloco colorido,
 * valor grande, título e variação (trend up/down) opcional.
 */
function KpiCard({
  title,
  value,
  icon = null,
  iconColor = 'var(--accent-primary)',
  change,
  trend = 'up',
  style = {},
  ...rest
}) {
  const up = trend === 'up';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--bg-surface)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border-1)',
      boxShadow: 'var(--shadow-1)',
      padding: '24px',
      transition: 'box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-2)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-1)';
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '16px'
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: 'var(--r-md)',
      background: iconColor,
      color: '#fff'
    }
  }, icon), change && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      fontFamily: 'var(--font-text)',
      fontSize: 'var(--t-xs)',
      fontWeight: 'var(--w-semibold)',
      color: up ? 'var(--signal-success)' : 'var(--signal-danger)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, up ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "17",
    x2: "17",
    y2: "7"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "7 7 17 7 17 17"
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "7",
    x2: "17",
    y2: "17"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "17 7 17 17 7 17"
  }))), change)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--t-2xl)',
      fontWeight: 'var(--w-bold)',
      color: 'var(--fg-1)',
      letterSpacing: 'var(--tr-tight)'
    }
  }, value), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontFamily: 'var(--font-text)',
      fontSize: 'var(--t-sm)',
      color: 'var(--fg-3)'
    }
  }, title));
}
Object.assign(__ds_scope, { KpiCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/KpiCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/RamoBadge.jsx
try { (() => {
const RAMOS = {
  saude: {
    label: 'Saúde',
    color: 'var(--ramo-saude-fg)',
    soft: 'var(--ramo-saude-soft)'
  },
  vida: {
    label: 'Vida',
    color: 'var(--ramo-vida-fg)',
    soft: 'var(--ramo-vida-soft)'
  },
  auto: {
    label: 'Auto',
    color: 'var(--ramo-auto-fg)',
    soft: 'var(--ramo-auto-soft)'
  },
  moto: {
    label: 'Moto',
    color: 'var(--ramo-moto-fg)',
    soft: 'var(--ramo-moto-soft)'
  },
  residencia: {
    label: 'Residência',
    color: 'var(--ramo-residencia-fg)',
    soft: 'var(--ramo-residencia-soft)'
  },
  empresarial: {
    label: 'Empresarial',
    color: 'var(--ramo-empresarial-fg)',
    soft: 'var(--ramo-empresarial-soft)'
  },
  portateis: {
    label: 'Portáteis',
    color: 'var(--ramo-portateis-fg)',
    soft: 'var(--ramo-portateis-soft)'
  },
  previdencia: {
    label: 'Previdência',
    color: 'var(--ramo-previdencia-fg)',
    soft: 'var(--ramo-previdencia-soft)'
  }
};
function resolve(ramo) {
  const k = String(ramo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const match = Object.keys(RAMOS).find(key => k.includes(key));
  return match ? RAMOS[match] : {
    label: ramo,
    color: 'var(--fg-3)',
    soft: 'var(--bg-surface-3)'
  };
}

/**
 * Badge de ramo de seguro — pílula tintada com a cor oficial do ramo.
 * Resolve o ramo de forma tolerante ("Seguro Auto", "auto frota" → Auto).
 */
function RamoBadge({
  ramo,
  dot = true,
  style = {}
}) {
  const r = resolve(ramo);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 10px',
      borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-text)',
      fontSize: '11px',
      fontWeight: 'var(--w-bold)',
      background: r.soft,
      color: r.color,
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: 'currentColor'
    }
  }), r.label);
}
Object.assign(__ds_scope, { RamoBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/RamoBadge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusBadge.jsx
try { (() => {
const TONES = {
  success: {
    bg: 'color-mix(in srgb, var(--signal-success) 15%, transparent)',
    fg: 'var(--signal-success)'
  },
  warning: {
    bg: 'color-mix(in srgb, var(--signal-warning) 15%, transparent)',
    fg: 'var(--signal-warning)'
  },
  danger: {
    bg: 'color-mix(in srgb, var(--signal-danger) 15%, transparent)',
    fg: 'var(--signal-danger)'
  },
  info: {
    bg: 'var(--accent-primary-soft)',
    fg: 'var(--accent-primary)'
  },
  neutral: {
    bg: 'var(--bg-surface-3)',
    fg: 'var(--fg-3)'
  }
};
const STATUS_TONE = {
  Ativo: 'success',
  Ativa: 'success',
  Inativo: 'neutral',
  Prospecto: 'info',
  Renovar: 'warning',
  'Em cotação': 'info',
  Atrasada: 'danger',
  Pendente: 'warning',
  Concluída: 'success',
  Ganho: 'success',
  Perdido: 'danger'
};

/**
 * Badge de status — pílula com tom semântico (nunca cor de ramo).
 * O tom é inferido do texto quando `tone` não é passado.
 */
function StatusBadge({
  status,
  tone,
  dot = true,
  style = {}
}) {
  const t = TONES[tone || STATUS_TONE[status] || 'neutral'];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 10px',
      borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-text)',
      fontSize: '10px',
      fontWeight: 'var(--w-bold)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      background: t.bg,
      color: t.fg,
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'currentColor'
    }
  }), status);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Campo de texto W.Assis. Suporta label (eyebrow), ícone à esquerda,
 * mensagem de erro e estado desabilitado. Foco com ring azul da marca.
 */
function Input({
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
  const [focused, setFocused] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error ? 'var(--signal-danger)' : focused ? 'var(--accent-primary)' : 'var(--border-1)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: '10px',
      fontWeight: 'var(--w-bold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tr-caps)',
      color: 'var(--fg-3)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, leadingIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 12,
      color: 'var(--fg-4)',
      display: 'flex',
      pointerEvents: 'none'
    }
  }, leadingIcon), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    disabled: disabled,
    onFocus: e => {
      setFocused(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocused(false);
      rest.onBlur?.(e);
    },
    style: {
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
      ...style
    }
  }, rest))), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 'var(--t-xs)',
      color: 'var(--signal-danger)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 'var(--t-xs)',
      color: 'var(--fg-4)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select W.Assis — wrapper estilizado sobre o <select> nativo, com label
 * opcional (eyebrow) e chevron próprio. Aceita `options` [{value,label}]
 * ou children <option>.
 */
function Select({
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
  const [focused, setFocused] = React.useState(false);
  const selectId = id || React.useId();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selectId,
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: '10px',
      fontWeight: 'var(--w-bold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tr-caps)',
      color: 'var(--fg-3)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selectId,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
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
      ...style
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options ? options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)) : children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 12,
      color: 'var(--fg-4)',
      pointerEvents: 'none',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  })))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/kanban/KanbanCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ACCENTS = {
  primary: 'var(--accent-primary)',
  danger: 'var(--signal-danger)',
  success: 'var(--signal-success)',
  warning: 'var(--signal-warning)',
  info: 'var(--signal-info)'
};
function dateStatus(due) {
  if (!due) return 'none';
  const d = new Date(due);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (d < today) return 'overdue';
  if (d.getTime() === today.getTime()) return 'today';
  return 'future';
}
const TAG_TONE = {
  default: {
    bg: 'var(--bg-surface-2)',
    fg: 'var(--fg-3)',
    bd: 'var(--border-1)'
  },
  danger: {
    bg: 'color-mix(in srgb, var(--signal-danger) 10%, transparent)',
    fg: 'var(--signal-danger)',
    bd: 'color-mix(in srgb, var(--signal-danger) 22%, transparent)'
  },
  warning: {
    bg: 'color-mix(in srgb, var(--signal-warning) 10%, transparent)',
    fg: 'var(--signal-warning)',
    bd: 'color-mix(in srgb, var(--signal-warning) 22%, transparent)'
  },
  success: {
    bg: 'color-mix(in srgb, var(--signal-success) 10%, transparent)',
    fg: 'var(--signal-success)',
    bd: 'color-mix(in srgb, var(--signal-success) 22%, transparent)'
  }
};

/**
 * Card de Kanban do W.Assis CRM — o componente-assinatura dos funis por módulo.
 * Tag de ramo, data com cor por vencimento, título caixa-alta, tags extras,
 * responsável (avatar + nome) e valor principal destacado.
 */
function KanbanCard({
  title,
  subtitle,
  tag,
  value,
  valueLabel = 'Valor',
  dueDate,
  responsavelName,
  responsavelAvatar,
  tags = [],
  accent = 'primary',
  accentBar = false,
  onClick,
  style = {},
  ...rest
}) {
  const status = dateStatus(dueDate);
  const borderColor = status === 'today' ? 'color-mix(in srgb, var(--accent-primary) 50%, var(--border-1))' : status === 'overdue' ? 'color-mix(in srgb, var(--signal-danger) 55%, var(--border-1))' : 'var(--border-1)';
  const dateColor = status === 'overdue' ? 'var(--signal-danger)' : status === 'today' ? 'var(--accent-primary)' : 'var(--signal-warning)';
  const dateText = dueDate ? new Date(dueDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }) : null;
  const valueText = typeof value === 'number' ? value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }) : value;
  const firstName = (responsavelName || '').split(' ')[0];
  const initials = (responsavelName || 'U').split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-2)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-1)';
    },
    style: {
      position: 'relative',
      background: 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-1)',
      padding: '12px',
      cursor: 'pointer',
      overflow: 'hidden',
      transition: 'box-shadow var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, rest), accentBar && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      background: ACCENTS[accent]
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8
    }
  }, tag && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '2px 8px',
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border-1)',
      borderRadius: 'var(--r-sm)',
      fontFamily: 'var(--font-text)',
      fontSize: 9,
      fontWeight: 'var(--w-black)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tr-widest)',
      color: 'var(--fg-4)'
    }
  }, tag), dateText && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-text)',
      fontSize: 9,
      fontWeight: 'var(--w-bold)',
      color: dateColor,
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  })), dateText)), /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-text)',
      fontSize: 'var(--t-sm)',
      fontWeight: 'var(--w-black)',
      color: 'var(--fg-1)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tr-tight)',
      lineHeight: 1.2
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontFamily: 'var(--font-text)',
      fontSize: 9,
      fontWeight: 'var(--w-bold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tr-widest)',
      color: 'var(--fg-4)'
    }
  }, subtitle), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 8
    }
  }, tags.map((t, i) => {
    const tone = TAG_TONE[t.tone || 'default'];
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        padding: '2px 6px',
        borderRadius: 'var(--r-sm)',
        fontFamily: 'var(--font-text)',
        fontSize: 8,
        fontWeight: 'var(--w-black)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.bd}`
      }
    }, t.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 10,
      paddingTop: 10,
      borderTop: '1px solid var(--border-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0
    }
  }, responsavelAvatar ? /*#__PURE__*/React.createElement("img", {
    src: responsavelAvatar,
    alt: responsavelName,
    style: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      border: '1px solid var(--border-1)'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--accent-primary), var(--brand-blue-deep))',
      color: 'var(--fg-on-brand)',
      fontFamily: 'var(--font-text)',
      fontWeight: 700,
      fontSize: 9
    }
  }, initials), firstName && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 10,
      fontWeight: 'var(--w-bold)',
      color: 'var(--fg-2)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, firstName)), value != null && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-text)',
      fontSize: 8,
      fontWeight: 'var(--w-black)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--fg-4)',
      lineHeight: 1,
      marginBottom: 2
    }
  }, valueLabel), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-text)',
      fontSize: 'var(--t-xs)',
      fontWeight: 'var(--w-black)',
      letterSpacing: 'var(--tr-tight)',
      color: ACCENTS[accent]
    }
  }, valueText))));
}
Object.assign(__ds_scope, { KanbanCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kanban/KanbanCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/crm/DashboardScreen.jsx
try { (() => {
// Tela de Dashboard executivo do WassisCRM.
(function () {
  const {
    KpiCard,
    Card
  } = window.WAssisDesignSystem_502d77;
  const DashIcons = window.Icons;
  const KPIS = [{
    title: 'Receita Total',
    value: 'R$ 2.847.500',
    change: '+18.2%',
    trend: 'up',
    icon: 'DollarSign',
    color: 'var(--signal-success)'
  }, {
    title: 'Novos Segurados',
    value: '1.284',
    change: '+12.5%',
    trend: 'up',
    icon: 'Users',
    color: 'var(--accent-primary)'
  }, {
    title: 'Taxa de Conversão',
    value: '34.8%',
    change: '-2.1%',
    trend: 'down',
    icon: 'Target',
    color: 'var(--signal-warning)'
  }, {
    title: 'Ticket Médio',
    value: 'R$ 4.250',
    change: '+8.7%',
    trend: 'up',
    icon: 'TrendingUp',
    color: 'var(--accent-primary)'
  }];
  const MONTHS = [['Jan', 65], ['Fev', 78], ['Mar', 55], ['Abr', 90], ['Mai', 82], ['Jun', 95], ['Jul', 70], ['Ago', 88], ['Set', 92], ['Out', 75], ['Nov', 85], ['Dez', 98]];
  const PRODUTORES = [['Vinícius Assis', 'R$ 485.000', 92], ['Hicila Fernandes', 'R$ 412.000', 78], ['Carlos Santos', 'R$ 358.000', 68], ['Marina Costa', 'R$ 295.000', 56], ['Roberto Lima', 'R$ 247.000', 47]];
  const ATIVIDADES = [['Nova apólice emitida', 'Auto · Leonardo Perboni', 'Há 5 min', 'var(--signal-success)'], ['Cotação solicitada', 'Vida · Mario Sgarbi', 'Há 12 min', 'var(--accent-primary)'], ['Renovação pendente', 'Empresarial · 1001 Ind.', 'Há 30 min', 'var(--signal-warning)'], ['Sinistro registrado', 'Auto · Edmilson Giovani', 'Há 1h', 'var(--signal-danger)'], ['Lead convertido', 'Residencial · Ana Silva', 'Há 2h', 'var(--signal-success)']];
  function SectionTitle({
    icon,
    children
  }) {
    const Icon = DashIcons[icon];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent-primary)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 20
    })), /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-lg)',
        fontWeight: 'var(--w-bold)',
        color: 'var(--fg-1)'
      }
    }, children));
  }
  function DashboardScreen() {
    return /*#__PURE__*/React.createElement("div", {
      className: "animate-fade-in"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 32
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: '0 0 8px',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-3xl)',
        fontWeight: 'var(--w-bold)',
        color: 'var(--fg-1)',
        letterSpacing: 'var(--tr-tight)'
      }
    }, "Dashboard"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-text)',
        color: 'var(--fg-3)'
      }
    }, "Vis\xE3o geral de performance e indicadores-chave.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 24,
        marginBottom: 32
      }
    }, KPIS.map(k => {
      const Icon = DashIcons[k.icon];
      return /*#__PURE__*/React.createElement(KpiCard, {
        key: k.title,
        title: k.title,
        value: k.value,
        change: k.change,
        trend: k.trend,
        iconColor: k.color,
        icon: /*#__PURE__*/React.createElement(Icon, {
          size: 20
        })
      });
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 24,
        marginBottom: 32
      }
    }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement(SectionTitle, {
      icon: "BarChart3"
    }, "Produ\xE7\xE3o Mensal"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: 600,
        color: 'var(--fg-3)',
        background: 'var(--bg-surface-2)',
        padding: '6px 12px',
        borderRadius: 'var(--r-md)'
      }
    }, "2026")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        height: 180
      }
    }, MONTHS.map(([m, v]) => /*#__PURE__*/React.createElement("div", {
      key: m,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: `${v}%`,
        background: 'linear-gradient(to top, var(--accent-primary), var(--accent-primary-hover))',
        borderRadius: '4px 4px 0 0'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 10,
        color: 'var(--fg-4)',
        fontWeight: 500
      }
    }, m))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement(SectionTitle, {
      icon: "PieChart"
    }, "Top Produtores")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, PRODUTORES.map(([name, val, pct], i) => /*#__PURE__*/React.createElement("div", {
      key: name
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: 'var(--accent-primary-soft)',
        color: 'var(--accent-primary)',
        fontFamily: 'var(--font-text)',
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: 500,
        color: 'var(--fg-1)'
      }
    }, name)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: 600,
        color: 'var(--fg-2)'
      }
    }, val)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: 6,
        background: 'var(--bg-surface-2)',
        borderRadius: 'var(--r-pill)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${pct}%`,
        height: 6,
        background: 'linear-gradient(to right, var(--accent-primary), var(--accent-primary-hover))',
        borderRadius: 'var(--r-pill)'
      }
    }))))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement(SectionTitle, {
      icon: "Activity"
    }, "Atividades Recentes")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }
    }, ATIVIDADES.map(([action, detail, time, color], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        flex: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: 500,
        color: 'var(--fg-1)'
      }
    }, action), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-xs)',
        color: 'var(--fg-3)'
      }
    }, detail)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-xs)',
        color: 'var(--fg-4)',
        whiteSpace: 'nowrap'
      }
    }, time))))));
  }
  window.DashboardScreen = DashboardScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/crm/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/crm/KanbanScreen.jsx
try { (() => {
// Tela de Kanban (funil Comercial) do WassisCRM, com arrastar-e-soltar.
(function () {
  const {
    KanbanCard,
    Button
  } = window.WAssisDesignSystem_502d77;
  const KIcons = window.Icons;
  const {
    useState: useKState
  } = React;
  const STAGES = [{
    id: 'novo',
    name: 'Novo Lead',
    color: 'var(--neutral-400)'
  }, {
    id: 'cotacao',
    name: 'Em Cotação',
    color: 'var(--ramo-auto)'
  }, {
    id: 'negociacao',
    name: 'Negociação',
    color: 'var(--ramo-previdencia)'
  }, {
    id: 'fechamento',
    name: 'Fechamento',
    color: 'var(--signal-success)',
    win: true
  }];
  const INITIAL = {
    novo: [{
      id: 'c1',
      tag: 'AUTO',
      title: 'Seguro Auto — HB20',
      subtitle: 'João Pereira',
      dueDate: '2026-06-28',
      responsavelName: 'Marina Costa',
      value: 3200,
      valueLabel: 'Prêmio'
    }, {
      id: 'c2',
      tag: 'VIDA',
      title: 'Vida Individual',
      subtitle: 'Ana Costa',
      dueDate: '2026-07-02',
      responsavelName: 'Hicila Fernandes',
      value: 1850,
      valueLabel: 'Prêmio'
    }],
    cotacao: [{
      id: 'c3',
      tag: 'RESIDÊNCIA',
      title: 'Resid. Apto Centro',
      subtitle: 'Marcelo Dias',
      dueDate: '2026-06-22',
      responsavelName: 'Vinícius Assis',
      value: 980,
      valueLabel: 'Prêmio',
      tags: [{
        label: 'Retorno hoje',
        tone: 'warning'
      }]
    }, {
      id: 'c4',
      tag: 'EMPRESARIAL',
      title: 'Renovação Frota XPTO',
      subtitle: '1001 Indústria Ltda',
      dueDate: '2026-06-18',
      responsavelName: 'Carlos Santos',
      value: 48500,
      valueLabel: 'Prêmio',
      tags: [{
        label: 'Renovar',
        tone: 'warning'
      }]
    }],
    negociacao: [{
      id: 'c5',
      tag: 'SAÚDE',
      title: 'Plano Família',
      subtitle: 'Roberto Lima',
      dueDate: '2026-07-10',
      responsavelName: 'Hicila Fernandes',
      value: 12400,
      valueLabel: 'Prêmio'
    }],
    fechamento: [{
      id: 'c6',
      tag: 'MOTO',
      title: 'Moto CG 160',
      subtitle: 'Paulo Henrique',
      dueDate: '2026-07-15',
      responsavelName: 'Marina Costa',
      value: 2100,
      valueLabel: 'Prêmio',
      accent: 'success',
      tags: [{
        label: 'Ganho',
        tone: 'success'
      }]
    }]
  };
  function fmt(v) {
    return v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace('.0', '')}K` : `R$ ${v}`;
  }
  function StatusToggle({
    value,
    onChange
  }) {
    const opts = [['active', 'Ativos'], ['concluded', 'Concluídos'], ['all', 'Todos']];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        padding: 4,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-1)'
      }
    }, opts.map(([v, label]) => /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: () => onChange(v),
      style: {
        padding: '6px 12px',
        borderRadius: 'var(--r-sm)',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-text)',
        fontSize: 10,
        fontWeight: 'var(--w-black)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tr-widest)',
        background: value === v ? 'var(--accent-primary)' : 'transparent',
        color: value === v ? 'var(--accent-primary-fg)' : 'var(--fg-4)',
        boxShadow: value === v ? 'var(--shadow-1)' : 'none',
        transition: 'all var(--dur-fast) var(--ease-out)'
      }
    }, label)));
  }
  function Column({
    stage,
    cards,
    onDragStart,
    onDrop
  }) {
    const [over, setOver] = useKState(false);
    const total = cards.reduce((s, c) => s + (c.value || 0), 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: 288,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      },
      onDragOver: e => {
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: () => {
        setOver(false);
        onDrop(stage.id);
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12,
        padding: '0 4px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: stage.color,
        flex: 'none'
      }
    }), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-text)',
        fontSize: 10,
        fontWeight: 'var(--w-black)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tr-caps)',
        color: 'var(--fg-3)'
      }
    }, stage.name), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: '2px 6px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-sm)',
        fontFamily: 'var(--font-text)',
        fontSize: 9,
        fontWeight: 'var(--w-black)',
        color: 'var(--fg-4)'
      }
    }, cards.length), stage.win && /*#__PURE__*/React.createElement("span", {
      title: "Etapa de ganho",
      style: {
        color: 'var(--signal-success)',
        fontSize: 10,
        fontWeight: 900
      }
    }, "\u2605"))), total > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        marginLeft: 16,
        fontFamily: 'var(--font-text)',
        fontSize: 9,
        fontWeight: 'var(--w-black)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tr-widest)',
        color: 'var(--fg-4)'
      }
    }, "Total: ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent-primary)'
      }
    }, fmt(total)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
        overflowY: 'auto',
        padding: 4,
        borderRadius: 'var(--r-lg)',
        background: over ? 'var(--accent-primary-soft)' : 'transparent',
        transition: 'background var(--dur-fast) var(--ease-out)'
      },
      className: "custom-scrollbar"
    }, cards.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.id,
      draggable: true,
      onDragStart: () => onDragStart(c.id, stage.id),
      style: {
        cursor: 'grab'
      }
    }, /*#__PURE__*/React.createElement(KanbanCard, c))), cards.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        height: 72,
        border: '1px dashed var(--border-1)',
        borderRadius: 'var(--r-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 9,
        fontWeight: 'var(--w-black)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tr-widest)',
        color: 'var(--fg-4)',
        fontStyle: 'italic'
      }
    }, "Vazio"))));
  }
  function KanbanScreen() {
    const [board, setBoard] = useKState(INITIAL);
    const [status, setStatus] = useKState('active');
    const [drag, setDrag] = useKState(null);
    const Plus = KIcons.Plus,
      Search = KIcons.Search,
      Filter = KIcons.Filter;
    const onDragStart = (cardId, from) => setDrag({
      cardId,
      from
    });
    const onDrop = to => {
      if (!drag || drag.from === to) return setDrag(null);
      setBoard(b => {
        const card = b[drag.from].find(c => c.id === drag.cardId);
        if (!card) return b;
        return {
          ...b,
          [drag.from]: b[drag.from].filter(c => c.id !== drag.cardId),
          [to]: [...b[to], card]
        };
      });
      setDrag(null);
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "animate-fade-in",
      style: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-3xl)',
        fontWeight: 'var(--w-black)',
        color: 'var(--fg-1)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tr-tighter)'
      }
    }, "Comercial"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '4px 0 0',
        fontFamily: 'var(--font-text)',
        fontSize: 11,
        fontWeight: 'var(--w-bold)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tr-widest)',
        color: 'var(--fg-4)'
      }
    }, "Funil de novas oportunidades")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(StatusToggle, {
      value: status,
      onChange: setStatus
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      pill: true,
      size: "sm",
      leadingIcon: /*#__PURE__*/React.createElement(Plus, {
        size: 14
      })
    }, "Nova Oportunidade"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        marginBottom: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-1)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 200,
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 12,
        color: 'var(--fg-4)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Search, {
      size: 14
    })), /*#__PURE__*/React.createElement("input", {
      placeholder: "Buscar...",
      style: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '8px 12px 8px 34px',
        background: 'var(--bg-surface-2)',
        border: 'none',
        borderRadius: 'var(--r-md)',
        fontFamily: 'var(--font-text)',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--fg-2)',
        outline: 'none'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--fg-4)',
        fontFamily: 'var(--font-text)',
        fontSize: 10,
        fontWeight: 'var(--w-black)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tr-widest)'
      }
    }, /*#__PURE__*/React.createElement(Filter, {
      size: 14
    }), " Filtros")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 16,
        flex: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: 4
      },
      className: "custom-scrollbar"
    }, STAGES.map(s => /*#__PURE__*/React.createElement(Column, {
      key: s.id,
      stage: s,
      cards: board[s.id],
      onDragStart: onDragStart,
      onDrop: onDrop
    }))));
  }
  window.KanbanScreen = KanbanScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/crm/KanbanScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/crm/SeguradosScreen.jsx
try { (() => {
// Tela de listagem de Segurados do WassisCRM.
(function () {
  const {
    StatusBadge,
    RamoBadge,
    Avatar,
    Button,
    Input
  } = window.WAssisDesignSystem_502d77;
  const SIcons = window.Icons;
  const SEGURADOS = [{
    nome: 'Leonardo Perboni',
    doc: '123.456.789-00',
    email: 'leo@email.com',
    ramos: ['Auto', 'Vida'],
    apolices: 3,
    status: 'Ativo'
  }, {
    nome: '1001 Indústria Ltda',
    doc: '12.345.678/0001-90',
    email: 'contato@1001.com',
    ramos: ['Empresarial'],
    apolices: 5,
    status: 'Ativo'
  }, {
    nome: 'Ana Silva',
    doc: '987.654.321-00',
    email: 'ana.silva@email.com',
    ramos: ['Residência'],
    apolices: 1,
    status: 'Renovar'
  }, {
    nome: 'Mario Sgarbi',
    doc: '456.789.123-00',
    email: 'mario@email.com',
    ramos: ['Vida'],
    apolices: 2,
    status: 'Prospecto'
  }, {
    nome: 'Edmilson Giovani',
    doc: '321.654.987-00',
    email: 'edmilson@email.com',
    ramos: ['Auto', 'Moto'],
    apolices: 4,
    status: 'Ativo'
  }, {
    nome: 'Roberto Lima',
    doc: '789.123.456-00',
    email: 'roberto.lima@email.com',
    ramos: ['Saúde'],
    apolices: 1,
    status: 'Inativo'
  }, {
    nome: 'Marcelo Dias',
    doc: '654.321.789-00',
    email: 'm.dias@email.com',
    ramos: ['Residência', 'Auto'],
    apolices: 2,
    status: 'Ativo'
  }];
  const TH = {
    textAlign: 'left',
    padding: '12px 20px',
    fontFamily: 'var(--font-text)',
    fontSize: 10,
    fontWeight: 'var(--w-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tr-caps)',
    color: 'var(--fg-4)'
  };
  const TD = {
    padding: '14px 20px',
    fontFamily: 'var(--font-text)',
    fontSize: 'var(--t-sm)',
    color: 'var(--fg-1)',
    borderTop: '1px solid var(--border-1)'
  };
  function Row({
    s
  }) {
    const [hover, setHover] = React.useState(false);
    return /*#__PURE__*/React.createElement("tr", {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        background: hover ? 'var(--bg-surface-2)' : 'transparent',
        transition: 'background var(--dur-fast) var(--ease-out)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: TD
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: s.nome,
      size: 36
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 'var(--w-semibold)',
        color: 'var(--fg-1)'
      }
    }, s.nome), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 12,
        color: 'var(--fg-3)'
      }
    }, s.email)))), /*#__PURE__*/React.createElement("td", {
      style: {
        ...TD,
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: 'var(--fg-2)'
      }
    }, s.doc), /*#__PURE__*/React.createElement("td", {
      style: TD
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
      }
    }, s.ramos.map(r => /*#__PURE__*/React.createElement(RamoBadge, {
      key: r,
      ramo: r,
      dot: false
    })))), /*#__PURE__*/React.createElement("td", {
      style: {
        ...TD,
        textAlign: 'center',
        fontWeight: 'var(--w-bold)'
      }
    }, s.apolices), /*#__PURE__*/React.createElement("td", {
      style: TD
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: s.status
    })));
  }
  function SeguradosScreen() {
    const Plus = SIcons.Plus,
      Search = SIcons.Search;
    return /*#__PURE__*/React.createElement("div", {
      className: "animate-fade-in"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 28,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: '0 0 8px',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-3xl)',
        fontWeight: 'var(--w-bold)',
        color: 'var(--fg-1)',
        letterSpacing: 'var(--tr-tight)'
      }
    }, "Segurados"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-text)',
        color: 'var(--fg-3)'
      }
    }, SEGURADOS.length, " segurados na carteira ativa.")), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      pill: true,
      leadingIcon: /*#__PURE__*/React.createElement(Plus, {
        size: 16
      })
    }, "Novo Segurado")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16,
        maxWidth: 360
      }
    }, /*#__PURE__*/React.createElement(Input, {
      pill: true,
      leadingIcon: /*#__PURE__*/React.createElement(Search, {
        size: 16
      }),
      placeholder: "Buscar por nome, CPF/CNPJ ou e-mail..."
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-1)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("table", {
      style: {
        width: '100%',
        borderCollapse: 'collapse'
      }
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
      style: {
        background: 'var(--bg-surface-2)'
      }
    }, /*#__PURE__*/React.createElement("th", {
      style: TH
    }, "Segurado"), /*#__PURE__*/React.createElement("th", {
      style: TH
    }, "CPF / CNPJ"), /*#__PURE__*/React.createElement("th", {
      style: TH
    }, "Ramos"), /*#__PURE__*/React.createElement("th", {
      style: {
        ...TH,
        textAlign: 'center'
      }
    }, "Ap\xF3lices"), /*#__PURE__*/React.createElement("th", {
      style: TH
    }, "Status"))), /*#__PURE__*/React.createElement("tbody", null, SEGURADOS.map(s => /*#__PURE__*/React.createElement(Row, {
      key: s.doc,
      s: s
    }))))));
  }
  window.SeguradosScreen = SeguradosScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/crm/SeguradosScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/crm/Shell.jsx
try { (() => {
// Shell do WassisCRM — sidebar (logo, navegação, tema) + header (busca, filial, avatar).
(function () {
  const {
    useState
  } = React;
  const {
    Avatar
  } = window.WAssisDesignSystem_502d77;
  const I = window.Icons;
  const NAV = [{
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard'
  }, {
    key: 'segurados',
    label: 'Segurados',
    icon: 'Users'
  }, {
    key: 'oportunidades',
    label: 'Oportunidades',
    icon: 'Kanban'
  }, {
    key: 'painel',
    label: 'Painel',
    icon: 'LayoutGrid'
  }, {
    key: 'sinistros',
    label: 'Sinistros',
    icon: 'AlertTriangle'
  }, {
    key: 'emissao',
    label: 'Emissão',
    icon: 'FileText'
  }, {
    key: 'posvenda',
    label: 'Pós-Venda',
    icon: 'LifeBuoy'
  }, {
    key: 'financeiro',
    label: 'Financeiro',
    icon: 'DollarSign'
  }, {
    key: 'config',
    label: 'Configurações',
    icon: 'Settings'
  }];
  function NavItem({
    item,
    active,
    collapsed,
    onClick
  }) {
    const [hover, setHover] = useState(false);
    const Icon = I[item.icon];
    const bg = active ? 'var(--accent-primary-soft)' : hover ? 'var(--bg-surface-2)' : 'transparent';
    const color = active ? 'var(--accent-primary)' : hover ? 'var(--fg-2)' : 'var(--fg-3)';
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      title: collapsed ? item.label : undefined,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: '10px 12px',
        borderRadius: 'var(--r-md)',
        border: 'none',
        cursor: 'pointer',
        background: bg,
        color,
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: active ? 'var(--w-semibold)' : 'var(--w-medium)',
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 20
    }), !collapsed && /*#__PURE__*/React.createElement("span", null, item.label));
  }
  function BottomBtn({
    icon,
    label,
    collapsed,
    onClick
  }) {
    const [hover, setHover] = useState(false);
    const Icon = I[icon];
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      title: collapsed ? label : undefined,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: '10px 12px',
        borderRadius: 'var(--r-md)',
        border: 'none',
        cursor: 'pointer',
        background: hover ? 'var(--bg-surface-2)' : 'transparent',
        color: 'var(--fg-3)',
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: 'var(--w-medium)',
        transition: 'background var(--dur-fast) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 20
    }), !collapsed && /*#__PURE__*/React.createElement("span", null, label));
  }
  function Shell({
    active,
    onNavigate,
    dark,
    onToggleDark,
    children
  }) {
    const [collapsed, setCollapsed] = useState(false);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-app)'
      }
    }, /*#__PURE__*/React.createElement("aside", {
      style: {
        width: collapsed ? 80 : 248,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-1)',
        transition: 'width var(--dur-slow) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 12
      }
    }, collapsed ? /*#__PURE__*/React.createElement("img", {
      src: dark ? '../../assets/brand/wassis-mark-white.png' : '../../assets/brand/wassis-mark.png',
      width: 40,
      height: 40,
      alt: "W.Assis",
      style: {
        borderRadius: 'var(--r-xl)'
      }
    }) : /*#__PURE__*/React.createElement("img", {
      src: dark ? '../../assets/brand/wassis-logo-sidebar-dark.png' : '../../assets/brand/wassis-logo-sidebar-clean.png',
      alt: "W.Assis",
      style: {
        height: 40,
        width: 'auto',
        objectFit: 'contain',
        objectPosition: 'left'
      }
    })), /*#__PURE__*/React.createElement("nav", {
      style: {
        flex: 1,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflowY: 'auto'
      },
      className: "custom-scrollbar"
    }, NAV.map(item => /*#__PURE__*/React.createElement(NavItem, {
      key: item.key,
      item: item,
      active: active === item.key,
      collapsed: collapsed,
      onClick: () => onNavigate(item.key)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12,
        borderTop: '1px solid var(--border-1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(BottomBtn, {
      icon: dark ? 'Sun' : 'Moon',
      label: "Alterar Tema",
      collapsed: collapsed,
      onClick: onToggleDark
    }), /*#__PURE__*/React.createElement(BottomBtn, {
      icon: collapsed ? 'ChevronRight' : 'ChevronLeft',
      label: "Colapsar Menu",
      collapsed: collapsed,
      onClick: () => setCollapsed(c => !c)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(Header, {
      dark: dark
    }), /*#__PURE__*/React.createElement("main", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: 32
      },
      className: "custom-scrollbar"
    }, children)));
  }
  function Header({
    dark
  }) {
    const Search = I.Search,
      Building2 = I.Building2,
      LogOut = I.LogOut;
    return /*#__PURE__*/React.createElement("header", {
      style: {
        height: 64,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-1)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        maxWidth: 560,
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 16,
        color: 'var(--fg-4)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Search, {
      size: 18
    })), /*#__PURE__*/React.createElement("input", {
      placeholder: "Buscar por nome, CPF, e-mail...",
      style: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '9px 16px 9px 44px',
        background: 'var(--bg-surface-2)',
        border: '1px solid transparent',
        borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        color: 'var(--fg-1)',
        outline: 'none'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginLeft: 32
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 40,
        padding: '0 14px',
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-pill)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--fg-4)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Building2, {
      size: 16
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: 'var(--w-semibold)',
        color: 'var(--fg-1)'
      }
    }, "Matriz \u2014 Centro")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Vin\xEDcius Assis",
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 'var(--t-sm)',
        fontWeight: 'var(--w-semibold)',
        color: 'var(--fg-1)',
        lineHeight: 1.2
      }
    }, "Vin\xEDcius Assis"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-text)',
        fontSize: 10,
        color: 'var(--fg-3)'
      }
    }, "Administrador"))), /*#__PURE__*/React.createElement("button", {
      title: "Sair",
      style: {
        padding: 8,
        border: 'none',
        background: 'transparent',
        color: 'var(--fg-4)',
        cursor: 'pointer',
        display: 'flex',
        borderRadius: 'var(--r-md)'
      }
    }, /*#__PURE__*/React.createElement(LogOut, {
      size: 18
    }))));
  }
  window.Shell = Shell;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/crm/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/crm/icons.js
try { (() => {
// Ícones lucide (mesmo set usado no WassisCRM) como SVG inline, para o UI kit
// não depender de CDN. Stroke 2, linecap/linejoin round — idêntico ao lucide-react.
(function () {
  const React = window.React;
  const Svg = (size, children) => React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: {
      display: 'block',
      flex: 'none'
    }
  }, children);
  const P = (tag, attrs) => React.createElement(tag, attrs);
  const make = paths => ({
    size = 20
  } = {}) => Svg(size, paths.map((p, i) => P(p[0], {
    key: i,
    ...p[1]
  })));
  window.Icons = {
    LayoutDashboard: make([['rect', {
      x: 3,
      y: 3,
      width: 7,
      height: 9,
      rx: 1
    }], ['rect', {
      x: 14,
      y: 3,
      width: 7,
      height: 5,
      rx: 1
    }], ['rect', {
      x: 14,
      y: 12,
      width: 7,
      height: 9,
      rx: 1
    }], ['rect', {
      x: 3,
      y: 16,
      width: 7,
      height: 5,
      rx: 1
    }]]),
    Users: make([['path', {
      d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'
    }], ['circle', {
      cx: 9,
      cy: 7,
      r: 4
    }], ['path', {
      d: 'M23 21v-2a4 4 0 0 0-3-3.87'
    }], ['path', {
      d: 'M16 3.13a4 4 0 0 1 0 7.75'
    }]]),
    Kanban: make([['path', {
      d: 'M6 5v11'
    }], ['path', {
      d: 'M12 5v6'
    }], ['path', {
      d: 'M18 5v14'
    }]]),
    LayoutGrid: make([['rect', {
      x: 3,
      y: 3,
      width: 7,
      height: 7,
      rx: 1
    }], ['rect', {
      x: 14,
      y: 3,
      width: 7,
      height: 7,
      rx: 1
    }], ['rect', {
      x: 14,
      y: 14,
      width: 7,
      height: 7,
      rx: 1
    }], ['rect', {
      x: 3,
      y: 14,
      width: 7,
      height: 7,
      rx: 1
    }]]),
    AlertTriangle: make([['path', {
      d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
    }], ['line', {
      x1: 12,
      y1: 9,
      x2: 12,
      y2: 13
    }], ['line', {
      x1: 12,
      y1: 17,
      x2: 12.01,
      y2: 17
    }]]),
    FileText: make([['path', {
      d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
    }], ['polyline', {
      points: '14 2 14 8 20 8'
    }], ['line', {
      x1: 16,
      y1: 13,
      x2: 8,
      y2: 13
    }], ['line', {
      x1: 16,
      y1: 17,
      x2: 8,
      y2: 17
    }]]),
    LifeBuoy: make([['circle', {
      cx: 12,
      cy: 12,
      r: 10
    }], ['circle', {
      cx: 12,
      cy: 12,
      r: 4
    }], ['line', {
      x1: 4.93,
      y1: 4.93,
      x2: 9.17,
      y2: 9.17
    }], ['line', {
      x1: 14.83,
      y1: 14.83,
      x2: 19.07,
      y2: 19.07
    }], ['line', {
      x1: 14.83,
      y1: 9.17,
      x2: 19.07,
      y2: 4.93
    }], ['line', {
      x1: 4.93,
      y1: 19.07,
      x2: 9.17,
      y2: 14.83
    }]]),
    DollarSign: make([['line', {
      x1: 12,
      y1: 1,
      x2: 12,
      y2: 23
    }], ['path', {
      d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
    }]]),
    Settings: make([['circle', {
      cx: 12,
      cy: 12,
      r: 3
    }], ['path', {
      d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
    }]]),
    Search: make([['circle', {
      cx: 11,
      cy: 11,
      r: 8
    }], ['line', {
      x1: 21,
      y1: 21,
      x2: 16.65,
      y2: 16.65
    }]]),
    Plus: make([['line', {
      x1: 12,
      y1: 5,
      x2: 12,
      y2: 19
    }], ['line', {
      x1: 5,
      y1: 12,
      x2: 19,
      y2: 12
    }]]),
    Building2: make([['path', {
      d: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z'
    }], ['path', {
      d: 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2'
    }], ['path', {
      d: 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2'
    }], ['path', {
      d: 'M10 6h4'
    }], ['path', {
      d: 'M10 10h4'
    }], ['path', {
      d: 'M10 14h4'
    }], ['path', {
      d: 'M10 18h4'
    }]]),
    LogOut: make([['path', {
      d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'
    }], ['polyline', {
      points: '16 17 21 12 16 7'
    }], ['line', {
      x1: 21,
      y1: 12,
      x2: 9,
      y2: 12
    }]]),
    Moon: make([['path', {
      d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'
    }]]),
    Sun: make([['circle', {
      cx: 12,
      cy: 12,
      r: 5
    }], ['line', {
      x1: 12,
      y1: 1,
      x2: 12,
      y2: 3
    }], ['line', {
      x1: 12,
      y1: 21,
      x2: 12,
      y2: 23
    }], ['line', {
      x1: 4.22,
      y1: 4.22,
      x2: 5.64,
      y2: 5.64
    }], ['line', {
      x1: 18.36,
      y1: 18.36,
      x2: 19.78,
      y2: 19.78
    }], ['line', {
      x1: 1,
      y1: 12,
      x2: 3,
      y2: 12
    }], ['line', {
      x1: 21,
      y1: 12,
      x2: 23,
      y2: 12
    }], ['line', {
      x1: 4.22,
      y1: 19.78,
      x2: 5.64,
      y2: 18.36
    }], ['line', {
      x1: 18.36,
      y1: 5.64,
      x2: 19.78,
      y2: 4.22
    }]]),
    ChevronLeft: make([['polyline', {
      points: '15 18 9 12 15 6'
    }]]),
    ChevronRight: make([['polyline', {
      points: '9 18 15 12 9 6'
    }]]),
    TrendingUp: make([['polyline', {
      points: '23 6 13.5 15.5 8.5 10.5 1 18'
    }], ['polyline', {
      points: '17 6 23 6 23 12'
    }]]),
    Target: make([['circle', {
      cx: 12,
      cy: 12,
      r: 10
    }], ['circle', {
      cx: 12,
      cy: 12,
      r: 6
    }], ['circle', {
      cx: 12,
      cy: 12,
      r: 2
    }]]),
    BarChart3: make([['path', {
      d: 'M3 3v18h18'
    }], ['rect', {
      x: 7,
      y: 11,
      width: 3,
      height: 6
    }], ['rect', {
      x: 12,
      y: 7,
      width: 3,
      height: 10
    }], ['rect', {
      x: 17,
      y: 13,
      width: 3,
      height: 4
    }]]),
    PieChart: make([['path', {
      d: 'M21.21 15.89A10 10 0 1 1 8 2.83'
    }], ['path', {
      d: 'M22 12A10 10 0 0 0 12 2v10z'
    }]]),
    Activity: make([['polyline', {
      points: '22 12 18 12 15 21 9 3 6 12 2 12'
    }]]),
    MoreHorizontal: make([['circle', {
      cx: 12,
      cy: 12,
      r: 1
    }], ['circle', {
      cx: 19,
      cy: 12,
      r: 1
    }], ['circle', {
      cx: 5,
      cy: 12,
      r: 1
    }]]),
    Calendar: make([['rect', {
      x: 3,
      y: 4,
      width: 18,
      height: 18,
      rx: 2
    }], ['line', {
      x1: 16,
      y1: 2,
      x2: 16,
      y2: 6
    }], ['line', {
      x1: 8,
      y1: 2,
      x2: 8,
      y2: 6
    }], ['line', {
      x1: 3,
      y1: 10,
      x2: 21,
      y2: 10
    }]]),
    Maximize2: make([['polyline', {
      points: '15 3 21 3 21 9'
    }], ['polyline', {
      points: '9 21 3 21 3 15'
    }], ['line', {
      x1: 21,
      y1: 3,
      x2: 14,
      y2: 10
    }], ['line', {
      x1: 3,
      y1: 21,
      x2: 10,
      y2: 14
    }]]),
    Filter: make([['polygon', {
      points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'
    }]]),
    Check: make([['polyline', {
      points: '20 6 9 17 4 12'
    }]])
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/crm/icons.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.KpiCard = __ds_scope.KpiCard;

__ds_ns.RamoBadge = __ds_scope.RamoBadge;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.KanbanCard = __ds_scope.KanbanCard;

})();
