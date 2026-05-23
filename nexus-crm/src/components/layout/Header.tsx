import { LogOut, Search } from 'lucide-react'
import { useState } from 'react'
import ProfileModal from './ProfileModal'
import { useAuth } from '../../hooks/useAuth'

/**
 * Header principal do CRM.
 * Contém barra de busca global e avatar do usuário logado.
 */
export default function Header() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const displayName = user?.fullName || user?.email || 'Usuario'
  const initials = displayName
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const roleLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'vendedor' ? 'Vendedor' : 'Visualizador'

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-8 shrink-0">
        {/* Barra de Busca */}
        <div className="flex-1 max-w-xl relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail..."
            className="w-full pl-12 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary focus:outline-none rounded-full text-sm transition-all"
          />
        </div>

        {/* Ações do Usuário */}
        <div className="flex items-center gap-4 ml-8">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
              {initials || 'U'}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                {roleLabel}
              </p>
            </div>
          </button>
          <button
            onClick={() => void signOut()}
            className="p-2 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  )
}
