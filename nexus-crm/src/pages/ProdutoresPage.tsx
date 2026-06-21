import { Search, UserPlus, Edit, X, Building2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTeamAdmin, type TeamMember } from '../hooks/useTeamAdmin'
import { useFiliais } from '../hooks/useFiliais'
import { usePerfis } from '../hooks/usePerfis'
import { useProfileFiliais } from '../hooks/useProfileFiliais'

/**
 * Modal de membro. Convite = nome + e-mail (o CARGO global foi aposentado — D18).
 * Depois de convidar, o modal entra em modo edição e revela "Corretoras & Perfil"
 * para atribuir o acesso (perfil por corretora).
 */
const ProdutorModal = ({
  isOpen,
  onClose,
  produtor,
  onInvite,
  isSaving,
}: {
  isOpen: boolean
  onClose: () => void
  produtor?: TeamMember | null
  onInvite: (email: string, full_name: string) => Promise<void>
  isSaving: boolean
}) => {
  const [formData, setFormData] = useState({
    full_name: produtor?.full_name || '',
    email: produtor?.email || '',
  })

  if (!isOpen) return null

  const isEditing = !!produtor?.id

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-2xl rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary-soft rounded-[6px] text-accent-primary">
              {isEditing ? <Edit size={20} /> : <UserPlus size={20} />}
            </div>
            <h2 className="text-xl font-black text-fg-1 uppercase tracking-tight">
              {isEditing ? 'Editar Membro' : 'Convidar Membro'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                type="text"
                value={formData.full_name}
                disabled={isEditing}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ex: João Silva"
                className="w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <input
                type="email"
                disabled={isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium disabled:opacity-50"
              />
            </div>
          </div>

          {isEditing ? (
            <div className="mt-8">
              <CorretorasPerfilSection profileId={produtor!.id} />
            </div>
          ) : (
            <div className="mt-6 bg-bg-surface-2 rounded-[8px] p-4 border border-border-1 flex items-center gap-2 text-xs text-fg-3">
              <ShieldCheck size={14} className="text-accent-primary shrink-0" />
              Após convidar, defina as <strong>corretoras e o perfil de acesso</strong> do membro.
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all"
          >
            {isEditing ? 'Fechar' : 'Cancelar'}
          </button>
          {!isEditing && (
            <button
              disabled={isSaving || !formData.email || !formData.full_name}
              onClick={() => onInvite(formData.email, formData.full_name)}
              className="px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
            >
              {isSaving ? 'Convidando...' : 'Enviar Convite'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Vínculo perfil-por-corretora do membro (profile_filiais). Cada corretora tem um
 * select de perfil ("— Sem acesso —" remove o vínculo) e um toggle de "Principal"
 * (corretora casa, único por usuário). Persiste na hora.
 */
function CorretorasPerfilSection({ profileId }: { profileId: string }) {
  const { data: filiais } = useFiliais()
  const { data: perfis } = usePerfis()
  const { vinculos, setVinculo, removeVinculo, isSaving } = useProfileFiliais(profileId)

  const vinculoFor = (filialId: string) => vinculos.find((v) => v.filial_id === filialId)

  const handlePerfil = async (filialId: string, perfilId: string) => {
    try {
      if (!perfilId) await removeVinculo(filialId)
      else await setVinculo({ filialId, perfilId, principal: vinculoFor(filialId)?.principal })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao definir perfil')
    }
  }

  const handlePrincipal = async (filialId: string) => {
    const v = vinculoFor(filialId)
    if (!v) {
      window.alert('Defina um perfil para esta corretora antes de torná-la principal.')
      return
    }
    try {
      await setVinculo({ filialId, perfilId: v.perfil_id, principal: true })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao definir corretora principal')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={16} className="text-accent-primary" />
        <h3 className="text-sm font-black text-fg-1 uppercase tracking-widest">Corretoras & Perfil</h3>
      </div>
      <p className="text-[11px] text-fg-4 mb-2">As alterações de acesso são salvas automaticamente.</p>
      <div className="bg-bg-surface-2 rounded-[8px] border border-border-1 divide-y divide-border-1 overflow-hidden">
        {(filiais ?? []).map((f) => {
          const v = vinculoFor(f.id)
          return (
            <div key={f.id} className="flex items-center gap-3 p-3">
              <span className="flex-1 min-w-0 text-sm font-bold text-fg-1 truncate">{f.label}</span>
              <select
                value={v?.perfil_id ?? ''}
                onChange={(e) => handlePerfil(f.id, e.target.value)}
                disabled={isSaving}
                className="px-3 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-xs font-medium focus:border-accent-primary focus:outline-none disabled:opacity-50"
              >
                <option value="" className="bg-bg-surface text-fg-1">— Sem acesso —</option>
                {(perfis ?? []).map((p) => (
                  <option key={p.id} value={p.id} className="bg-bg-surface text-fg-1">{p.nome}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handlePrincipal(f.id)}
                disabled={isSaving || !v}
                title="Corretora principal (casa)"
                className={`px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${
                  v?.principal
                    ? 'bg-accent-primary-soft text-accent-primary border-accent-primary/20'
                    : 'bg-bg-surface text-fg-4 border-border-1'
                } ${!v ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent-primary/40'}`}
              >
                {v?.principal ? 'Principal' : 'Tornar principal'}
              </button>
            </div>
          )
        })}
        {(filiais ?? []).length === 0 && (
          <p className="p-3 text-xs text-fg-4 font-medium">Nenhuma corretora cadastrada.</p>
        )}
      </div>
    </div>
  )
}

/**
 * Página de Equipe (membros) em formato de Lista (Tabela).
 */
export default function ProdutoresPage() {
  const { members, isLoading, invite, isInviting } = useTeamAdmin()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProdutor, setSelectedProdutor] = useState<TeamMember | null>(null)

  const filtered = members.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpenModal = (produtor?: TeamMember) => {
    setSelectedProdutor(produtor || null)
    setIsModalOpen(true)
  }

  const handleInvite = async (email: string, full_name: string) => {
    try {
      const member = await invite({ email, full_name })
      // mantém o modal aberto em modo edição para já atribuir corretoras/perfil
      if (member) setSelectedProdutor(member)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao convidar membro')
    }
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg-1 mb-1">Equipe e Acessos</h2>
          <p className="text-sm text-fg-3 font-medium">
            Gerencie quem acessa o CRM e o perfil de cada um por corretora.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)]"
        >
          <UserPlus size={18} /> Convidar Membro
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
        <input
          type="text"
          placeholder="Buscar membro por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-surface text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[8px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 transition-all shadow-[var(--shadow-1)]"
        />
      </div>

      <div className="bg-bg-surface rounded-[8px] shadow-[var(--shadow-1)] border border-border-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-2 text-fg-4 text-[10px] font-black uppercase tracking-widest border-b border-border-1">
                <th className="px-6 py-5">Membro</th>
                <th className="px-6 py-5">E-mail</th>
                <th className="px-6 py-5 text-center">Acesso</th>
                <th className="px-6 py-5 text-right w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-fg-4 text-sm">Carregando equipe...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-fg-4 text-sm">Nenhum membro encontrado.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-surface-2 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.full_name} className="w-9 h-9 rounded-[6px] object-cover" />
                        ) : (
                          <div className="w-9 h-9 bg-accent-primary-soft rounded-[6px] flex items-center justify-center text-accent-primary font-black text-xs">
                            {p.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </div>
                        )}
                        <span className="font-bold text-fg-1">{p.full_name || 'Sem nome'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-fg-2 font-bold">{p.email}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {p.corretoras_count > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          {p.perfil_principal && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-accent-primary-soft text-accent-primary">
                              {p.perfil_principal}
                            </span>
                          )}
                          <span className="text-[10px] text-fg-4 font-bold">
                            {p.corretoras_count} corretora{p.corretoras_count > 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-fg-4 font-bold uppercase tracking-widest">Sem acesso</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-2 text-fg-4 hover:text-accent-primary hover:bg-accent-primary-soft rounded-[6px] transition-all"
                          title="Gerenciar acesso"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProdutorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        produtor={selectedProdutor}
        onInvite={handleInvite}
        isSaving={isInviting}
      />
    </div>
  )
}
