import { Building2, LogOut, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import ProfileModal from './ProfileModal'
import { useAuth } from '../../hooks/useAuth'
import { useFilialLabelMap } from '../../hooks/useFiliais'
import { useMyBranches } from '../../hooks/useMyBranches'
import { useProfileFiliais } from '../../hooks/useProfileFiliais'
import { usePerfis } from '../../hooks/usePerfis'

/**
 * Header principal do CRM.
 * Contém barra de busca global e avatar do usuário logado.
 */
export default function Header() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const { activeBranchId, setActiveBranchId, user, signOut } = useAuth()
  const { map: filialLabels } = useFilialLabelMap()
  const labelFor = (branchId: string) => filialLabels.get(branchId) ?? formatBranchLabel(branchId)
  const displayName = user?.fullName || user?.email || 'Usuario'
  const initials = displayName
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  // Rótulo sob o nome = PERFIL do usuário na corretora ativa (D18), não mais o
  // Role global. Em "Todas", usa o perfil da corretora principal.
  const { vinculos } = useProfileFiliais(user?.id)
  const { data: perfis } = usePerfis()
  const activeVinculo = activeBranchId
    ? vinculos.find((v) => v.filial_id === activeBranchId)
    : vinculos.find((v) => v.principal) ?? vinculos[0]
  const roleLabel =
    (activeVinculo && (perfis ?? []).find((p) => p.id === activeVinculo.perfil_id)?.nome) || 'Sem perfil'
  const { branches } = useMyBranches()
  const branchIds = branches.map((b) => b.id)
  const canSelectAllBranches = branches.length > 1
  const canSwitchBranch = branches.length > 1
  const activeBranchLabel = activeBranchId ? labelFor(activeBranchId) : 'Todas as filiais'

  // Reconcilia a corretora ativa com o que o usuário realmente acessa: se o
  // acesso foi removido (ou só há 1 corretora), aponta para a principal/primeira.
  useEffect(() => {
    if (branches.length === 0) return
    const ok = activeBranchId === null ? branches.length > 1 : branches.some((b) => b.id === activeBranchId)
    if (!ok) setActiveBranchId(branches.find((b) => b.principal)?.id ?? branches[0].id)
  }, [activeBranchId, branches, setActiveBranchId])

  return (
    <>
      <header className="h-16 border-b border-border-1 bg-bg-surface flex items-center justify-between px-8 shrink-0">
        {/* Barra de Busca */}
        <div className="flex-1 max-w-xl relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-4" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail..."
            className="w-full pl-12 pr-4 py-2 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-transparent focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 rounded-full text-sm transition-all"
          />
        </div>

        {/* Ações do Usuário */}
        <div className="flex items-center gap-4 ml-8">
          {canSwitchBranch ? (
            <label className="hidden md:flex items-center gap-2 h-10 px-3 bg-bg-surface-2 border border-border-1 rounded-full text-sm text-fg-2">
              <Building2 size={16} className="text-fg-4 shrink-0" />
              <select
                value={activeBranchId ?? '__all__'}
                onChange={(event) => setActiveBranchId(event.target.value === '__all__' ? null : event.target.value)}
                className="max-w-44 bg-transparent text-fg-1 text-sm font-semibold focus:outline-none"
                aria-label="Filial ativa"
                title="Filial ativa"
              >
                {canSelectAllBranches ? (
                  <option value="__all__" className="bg-bg-surface text-fg-1">Todas as filiais</option>
                ) : null}
                {branchIds.map((branchId) => (
                  <option key={branchId} value={branchId} className="bg-bg-surface text-fg-1">
                    {labelFor(branchId)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div
              className="hidden md:flex items-center gap-2 h-10 px-3 bg-bg-surface-2 border border-border-1 rounded-full text-sm text-fg-2"
              title="Filial ativa"
            >
              <Building2 size={16} className="text-fg-4 shrink-0" />
              <span className="max-w-44 truncate text-fg-1 font-semibold">{activeBranchLabel}</span>
            </div>
          )}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 p-1.5 pr-3 hover:bg-bg-surface-2 rounded-full transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-brand-primary-deep flex items-center justify-center text-fg-on-brand font-semibold text-sm shadow-[var(--shadow-1)] group-hover:shadow-[var(--shadow-2)] transition-shadow">
              {initials || 'U'}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-fg-1 leading-tight">{displayName}</p>
              <p className="text-[10px] text-fg-3 flex items-center justify-end gap-1">
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

function formatBranchLabel(branchId: string) {
  return (
    branchId
      .replace(/^filial[-_]/i, '')
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || branchId
  )
}
