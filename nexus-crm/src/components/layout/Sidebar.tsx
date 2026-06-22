import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  LifeBuoy,
  DollarSign,
  LayoutGrid,
} from 'lucide-react'
import wassisMark from '../../assets/brand/wassis-mark.png'
import wassisLogoClean from '../../assets/brand/wassis-logo-full_sidebar_clean.png'
import wassisLogoDark from '../../assets/brand/wassis-logo-full_sidebar_dark.png'

/**
 * Itens de navegação do menu lateral.
 * Cada item possui rótulo, ícone e rota.
 */
const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Segurados', icon: Users, path: '/segurados' },
  { label: 'Oportunidades', icon: Kanban, path: '/oportunidades' },
  { label: 'Painel', icon: LayoutGrid, path: '/propostas' },
  { label: 'Sinistros', icon: AlertTriangle, path: '/sinistros' },
  { label: 'Emissão', icon: FileText, path: '/emissoes' },
  { label: 'Pós-Venda', icon: LifeBuoy, path: '/pos-venda' },
  { label: 'Financeiro', icon: DollarSign, path: '/financeiro' },
  { label: 'Configurações', icon: Settings, path: '/configuracoes' },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onToggleTheme: () => void
  darkMode: boolean
}

/**
 * Sidebar (menu lateral) principal do CRM.
 * Colapsável e com suporte a tema escuro.
 */
export default function Sidebar({ collapsed, onToggleCollapse, onToggleTheme, darkMode }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-[248px]'
      } border-r border-border-1 bg-bg-surface flex flex-col transition-all duration-300 shrink-0 sticky top-0 h-screen`}
    >
      {/* Logo */}
      <div className={`px-5 py-6 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        {collapsed ? (
          <img src={wassisMark} width={40} height={40} alt="W.Assis" className="shrink-0 block rounded-xl" />
        ) : (
          <img
            src={darkMode ? wassisLogoDark : wassisLogoClean}
            alt="W.Assis"
            className="animate-fade-in block h-10 w-auto object-contain object-left"
          />
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-colors text-sm ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-accent-primary-soft text-accent-primary font-semibold'
                  : 'text-fg-3 font-medium hover:bg-bg-surface-2 hover:text-fg-2'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Botões inferiores */}
      <div className="p-3 border-t border-border-1 space-y-1">
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-fg-3 hover:bg-bg-surface-2 hover:text-fg-2 transition-colors text-sm ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Alterar Tema' : undefined}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>Alterar Tema</span>}
        </button>
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-fg-3 hover:bg-bg-surface-2 hover:text-fg-2 transition-colors text-sm ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Expandir' : 'Encolher'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span>Encolher menu</span>}
        </button>
      </div>
    </aside>
  )
}
