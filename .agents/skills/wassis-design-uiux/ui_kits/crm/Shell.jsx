// Shell do WassisCRM — sidebar (logo, navegação, tema) + header (busca, filial, avatar).
(function () {
const { useState } = React
const { Avatar } = window.WAssisDesignSystem_502d77
const I = window.Icons

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { key: 'segurados', label: 'Segurados', icon: 'Users' },
  { key: 'oportunidades', label: 'Oportunidades', icon: 'Kanban' },
  { key: 'painel', label: 'Painel', icon: 'LayoutGrid' },
  { key: 'sinistros', label: 'Sinistros', icon: 'AlertTriangle' },
  { key: 'emissao', label: 'Emissão', icon: 'FileText' },
  { key: 'posvenda', label: 'Pós-Venda', icon: 'LifeBuoy' },
  { key: 'financeiro', label: 'Financeiro', icon: 'DollarSign' },
  { key: 'config', label: 'Configurações', icon: 'Settings' },
]

function NavItem({ item, active, collapsed, onClick }) {
  const [hover, setHover] = useState(false)
  const Icon = I[item.icon]
  const bg = active ? 'var(--accent-primary-soft)' : hover ? 'var(--bg-surface-2)' : 'transparent'
  const color = active ? 'var(--accent-primary)' : hover ? 'var(--fg-2)' : 'var(--fg-3)'
  return (
    <button
      onClick={onClick} title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: '10px 12px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
        background: bg, color, fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)',
        fontWeight: active ? 'var(--w-semibold)' : 'var(--w-medium)',
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
      }}
    >
      <Icon size={20} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  )
}

function BottomBtn({ icon, label, collapsed, onClick }) {
  const [hover, setHover] = useState(false)
  const Icon = I[icon]
  return (
    <button onClick={onClick} title={collapsed ? label : undefined}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        justifyContent: collapsed ? 'center' : 'flex-start', padding: '10px 12px',
        borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
        background: hover ? 'var(--bg-surface-2)' : 'transparent', color: 'var(--fg-3)',
        fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 'var(--w-medium)',
        transition: 'background var(--dur-fast) var(--ease-out)' }}>
      <Icon size={20} />
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

function Shell({ active, onNavigate, dark, onToggleDark, children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 80 : 248, flex: 'none', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border-1)',
        transition: 'width var(--dur-slow) var(--ease-out)',
      }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 12 }}>
          {collapsed
            ? <img src={dark ? '../../assets/brand/wassis-mark-white.png' : '../../assets/brand/wassis-mark.png'} width={40} height={40} alt="W.Assis" style={{ borderRadius: 'var(--r-xl)' }} />
            : <img src={dark ? '../../assets/brand/wassis-logo-sidebar-dark.png' : '../../assets/brand/wassis-logo-sidebar-clean.png'} alt="W.Assis" style={{ height: 40, width: 'auto', objectFit: 'contain', objectPosition: 'left' }} />}
        </div>
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }} className="custom-scrollbar">
          {NAV.map((item) => (
            <NavItem key={item.key} item={item} active={active === item.key} collapsed={collapsed} onClick={() => onNavigate(item.key)} />
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <BottomBtn icon={dark ? 'Sun' : 'Moon'} label="Alterar Tema" collapsed={collapsed} onClick={onToggleDark} />
          <BottomBtn icon={collapsed ? 'ChevronRight' : 'ChevronLeft'} label="Colapsar Menu" collapsed={collapsed} onClick={() => setCollapsed((c) => !c)} />
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header dark={dark} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 32 }} className="custom-scrollbar">{children}</main>
      </div>
    </div>
  )
}

function Header({ dark }) {
  const Search = I.Search, Building2 = I.Building2, LogOut = I.LogOut
  return (
    <header style={{
      height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-1)',
    }}>
      <div style={{ flex: 1, maxWidth: 560, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 16, color: 'var(--fg-4)', display: 'flex' }}><Search size={18} /></span>
        <input placeholder="Buscar por nome, CPF, e-mail..." style={{
          width: '100%', boxSizing: 'border-box', padding: '9px 16px 9px 44px',
          background: 'var(--bg-surface-2)', border: '1px solid transparent', borderRadius: 'var(--r-pill)',
          fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', color: 'var(--fg-1)', outline: 'none',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-pill)' }}>
          <span style={{ color: 'var(--fg-4)', display: 'flex' }}><Building2 size={16} /></span>
          <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 'var(--w-semibold)', color: 'var(--fg-1)' }}>Matriz — Centro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="Vinícius Assis" size={40} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 'var(--w-semibold)', color: 'var(--fg-1)', lineHeight: 1.2 }}>Vinícius Assis</div>
            <div style={{ fontFamily: 'var(--font-text)', fontSize: 10, color: 'var(--fg-3)' }}>Administrador</div>
          </div>
        </div>
        <button title="Sair" style={{ padding: 8, border: 'none', background: 'transparent', color: 'var(--fg-4)', cursor: 'pointer', display: 'flex', borderRadius: 'var(--r-md)' }}><LogOut size={18} /></button>
      </div>
    </header>
  )
}

window.Shell = Shell
})()
