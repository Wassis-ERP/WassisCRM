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
  Shield,
  AlertTriangle,
  FileText,
  LifeBuoy,
  DollarSign,
  LayoutGrid,
} from 'lucide-react'

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
        collapsed ? 'w-20' : 'w-64'
      } border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 shrink-0 sticky top-0 h-screen`}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0">
          <Shield size={20} />
        </div>
        {!collapsed && (
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white animate-fade-in">
            Nexus CRM
          </span>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
          title={collapsed ? 'Alterar Tema' : undefined}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>Alterar Tema</span>}
        </button>
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span>Colapsar Menu</span>}
        </button>
      </div>
    </aside>
  )
}
