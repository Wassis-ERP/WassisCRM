import { Search, UserPlus, Edit, X, Shield, Check } from 'lucide-react'
import { useState } from 'react'
import { useTeamAdmin, type TeamMember } from '../hooks/useTeamAdmin'
import type { Role } from '../types/auth'

// Cargos são categóricos (não status nem ramo): admin em destaque, demais neutros.
const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-accent-primary-soft text-accent-primary',
  vendedor: 'bg-bg-surface-3 text-fg-2',
  visualizador: 'bg-bg-surface-2 text-fg-3',
}

/**
 * Componente Modal para Adicionar/Editar Produtor e Gerenciar Permissões.
 */
const ProdutorModal = ({
  isOpen,
  onClose,
  produtor,
  onSave,
  isSaving
}: {
  isOpen: boolean,
  onClose: () => void,
  produtor?: TeamMember | null,
  onSave: (email: string, full_name: string, role: Role) => void,
  isSaving: boolean
}) => {
  const [formData, setFormData] = useState({
    full_name: produtor?.full_name || '',
    email: produtor?.email || '',
    role: produtor?.role || 'vendedor' as Role
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-2xl rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary-soft rounded-[6px] text-accent-primary">
              {produtor ? <Edit size={20} /> : <UserPlus size={20} />}
            </div>
            <h2 className="text-xl font-black text-fg-1 uppercase tracking-tight">
              {produtor ? 'Editar Produtor' : 'Convidar Produtor'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                placeholder="Ex: João Silva"
                className="w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <input
                type="email"
                disabled={!!produtor}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Cargo / Role</label>
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                className="w-full px-4 py-3 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium"
              >
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
                <option value="visualizador">Visualizador</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-accent-primary" />
              <h3 className="text-sm font-black text-fg-1 uppercase tracking-widest">Resumo do Perfil</h3>
            </div>
            <div className="bg-bg-surface-2 rounded-[8px] p-6 border border-border-1">
              <p className="text-xs text-fg-3 leading-relaxed">
                {formData.role === 'admin' ? (
                  'Administradores possuem acesso total a todas as configurações, pipelines, financeiros e gestão de equipe.'
                ) : formData.role === 'vendedor' ? (
                  'Vendedores podem gerenciar segurados, oportunidades e seus próprios cards nos pipelines comercial e de emissão.'
                ) : (
                  'Visualizadores podem apenas ler dados, sem permissão para criar ou editar registros.'
                )}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-accent-primary uppercase tracking-widest">
                <Check size={12} /> Matriz de permissões detalhada será configurável na Fase 3.4
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all">
            Cancelar
          </button>
          <button
            disabled={isSaving || !formData.email || !formData.full_name}
            onClick={() => onSave(formData.email, formData.full_name, formData.role)}
            className="px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : produtor ? 'Atualizar Cargo' : 'Enviar Convite'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Página de Produtores em formato de Lista (Tabela).
 */
export default function ProdutoresPage() {
  const { members, isLoading, invite, updateRole, isInviting, isUpdating } = useTeamAdmin()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProdutor, setSelectedProdutor] = useState<TeamMember | null>(null)

  const filtered = members.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenModal = (produtor?: TeamMember) => {
    setSelectedProdutor(produtor || null)
    setIsModalOpen(true)
  }

  const handleSave = async (email: string, full_name: string, role: Role) => {
    try {
      if (selectedProdutor) {
        await updateRole({ userId: selectedProdutor.id, role })
      } else {
        await invite({ email, full_name, role })
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Erro ao salvar produtor:', err)
      alert('Erro ao realizar operação. Verifique os logs.')
    }
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg-1 mb-1">Equipe e Acessos</h2>
          <p className="text-sm text-fg-3 font-medium">Gerencie quem tem acesso ao CRM e seus respectivos cargos.</p>
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

      {/* Tabela de Produtores */}
      <div className="bg-bg-surface rounded-[8px] shadow-[var(--shadow-1)] border border-border-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-2 text-fg-4 text-[10px] font-black uppercase tracking-widest border-b border-border-1">
                <th className="px-6 py-5">Membro</th>
                <th className="px-6 py-5">E-mail</th>
                <th className="px-6 py-5 text-center">Cargo</th>
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
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-bg-surface-2 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.full_name} className="w-9 h-9 rounded-[6px] object-cover" />
                      ) : (
                        <div className="w-9 h-9 bg-accent-primary-soft rounded-[6px] flex items-center justify-center text-accent-primary font-black text-xs">
                          {p.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="font-bold text-fg-1">{p.full_name || 'Sem nome'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs text-fg-2 font-bold">{p.email}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ROLE_BADGE[p.role] ?? 'bg-bg-surface-2 text-fg-3'}`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="p-2 text-fg-4 hover:text-accent-primary hover:bg-accent-primary-soft rounded-[6px] transition-all"
                        title="Ver Detalhes / Editar Cargo"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProdutorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        produtor={selectedProdutor}
        onSave={handleSave}
        isSaving={isInviting || isUpdating}
      />
    </div>
  )
}
