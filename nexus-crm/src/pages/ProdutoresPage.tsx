import { Edit, Search, Trash2, UserPlus, X, BadgeDollarSign, Link2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useProdutoresAdmin } from '../hooks/useProdutoresAdmin'
import { useTeamAdmin } from '../hooks/useTeamAdmin'
import type { Produtor, ProdutorInput } from '../types/platform'
import { formatCpfCnpj } from '../utils/documento'
import { formatTelefone } from '../utils/masks'

const EMPTY: ProdutorInput = {
  profile_id: null,
  nome: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  celular: '',
  banco: '',
  agencia: '',
  conta: '',
  chave_pix: '',
  percentual_repasse_padrao: null,
  ativo: true,
}

function toForm(produtor: Produtor | null): ProdutorInput {
  if (!produtor) return { ...EMPTY }
  const { id, tenant_id, created_at, updated_at, ...rest } = produtor
  void id
  void tenant_id
  void created_at
  void updated_at
  return { ...EMPTY, ...rest }
}

const inputClass =
  'w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium'

function ProdutorModal({
  isOpen,
  onClose,
  produtor,
  onSave,
  isSaving,
}: {
  isOpen: boolean
  onClose: () => void
  produtor: Produtor | null
  onSave: (values: ProdutorInput) => Promise<void>
  isSaving: boolean
}) {
  const [form, setForm] = useState<ProdutorInput>(() => toForm(produtor))
  const { members } = useTeamAdmin()

  if (!isOpen) return null

  const set = <K extends keyof ProdutorInput,>(key: K, value: ProdutorInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleProfileChange = (profileId: string) => {
    const member = members.find((m) => m.id === profileId)
    set('profile_id', profileId || null)
    if (member && (!form.nome || form.profile_id)) {
      setForm((current) => ({
        ...current,
        profile_id: profileId,
        nome: member.full_name || current.nome,
        email: member.email || current.email,
      }))
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await onSave({
      ...form,
      profile_id: form.profile_id || null,
      percentual_repasse_padrao:
        form.percentual_repasse_padrao === null || Number.isNaN(Number(form.percentual_repasse_padrao))
          ? null
          : Number(form.percentual_repasse_padrao),
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-3xl rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary-soft rounded-[6px] text-accent-primary">
              {produtor ? <Edit size={20} /> : <UserPlus size={20} />}
            </div>
            <h2 className="text-xl font-black text-fg-1 uppercase tracking-tight">
              {produtor ? 'Editar Produtor' : 'Novo Produtor'}
            </h2>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest md:col-span-3">Vínculo</h3>
            <label className="space-y-1.5 md:col-span-3">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Membro interno</span>
              <select
                value={form.profile_id ?? ''}
                onChange={(e) => handleProfileChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Produtor externo sem login</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email} ({m.email})
                  </option>
                ))}
              </select>
            </label>

            <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest md:col-span-3">Cadastro</h3>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Nome</span>
              <input className={inputClass} value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">CPF/CNPJ</span>
              <input className={inputClass} value={formatCpfCnpj(form.cpf_cnpj ?? '')} onChange={(e) => set('cpf_cnpj', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">E-mail</span>
              <input type="email" className={inputClass} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Telefone</span>
              <input className={inputClass} value={formatTelefone(form.telefone ?? '')} onChange={(e) => set('telefone', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Celular</span>
              <input className={inputClass} value={formatTelefone(form.celular ?? '')} onChange={(e) => set('celular', e.target.value)} />
            </label>

            <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest md:col-span-3">Pagamento & Repasse</h3>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">% Repasse padrão</span>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.percentual_repasse_padrao ?? ''}
                onChange={(e) => set('percentual_repasse_padrao', e.target.value === '' ? null : Number(e.target.value))}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Banco</span>
              <input className={inputClass} value={form.banco ?? ''} onChange={(e) => set('banco', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Agência</span>
              <input className={inputClass} value={form.agencia ?? ''} onChange={(e) => set('agencia', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Conta</span>
              <input className={inputClass} value={form.conta ?? ''} onChange={(e) => set('conta', e.target.value)} />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Chave Pix</span>
              <input className={inputClass} value={form.chave_pix ?? ''} onChange={(e) => set('chave_pix', e.target.value)} />
            </label>
          </div>

          <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || !form.nome.trim()} className="px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50">
              {isSaving ? 'Salvando...' : produtor ? 'Atualizar' : 'Criar Produtor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProdutoresPage() {
  const { produtores, isLoading, create, update, remove, isSaving, isRemoving } = useProdutoresAdmin()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Produtor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return produtores
    return produtores.filter((p) =>
      [p.nome, p.email, p.cpf_cnpj].some((value) => (value ?? '').toLowerCase().includes(q)),
    )
  }, [produtores, search])

  const openModal = (produtor?: Produtor) => {
    setSelected(produtor ?? null)
    setIsModalOpen(true)
  }

  const handleSave = async (values: ProdutorInput) => {
    try {
      if (selected) await update({ id: selected.id, patch: values })
      else await create(values)
      setIsModalOpen(false)
      setSelected(null)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Erro ao salvar produtor')
    }
  }

  const handleRemove = async (produtor: Produtor) => {
    if (!window.confirm(`Inativar o produtor ${produtor.nome}? Registros históricos continuam preservados.`)) return
    try {
      await remove(produtor.id)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Erro ao inativar produtor')
    }
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg-1 mb-1">Produtores</h2>
          <p className="text-sm text-fg-3 font-medium">
            Cadastre produtores internos e parceiros externos usados na carteira, vendas e repasses.
          </p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)]">
          <UserPlus size={18} /> Novo Produtor
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
        <input
          type="text"
          placeholder="Buscar por nome, documento ou email..."
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
                <th className="px-6 py-5">Produtor</th>
                <th className="px-6 py-5">Contato</th>
                <th className="px-6 py-5">Tipo</th>
                <th className="px-6 py-5 text-center">Repasse</th>
                <th className="px-6 py-5 text-right w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1 font-medium">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-fg-4 text-sm">Carregando produtores...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-fg-4 text-sm">Nenhum produtor encontrado.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-surface-2 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-accent-primary-soft rounded-[6px] flex items-center justify-center text-accent-primary">
                          <BadgeDollarSign size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-fg-1 truncate">{p.nome}</div>
                          <div className="text-[11px] text-fg-4 font-bold">{formatCpfCnpj(p.cpf_cnpj ?? '') || 'Sem documento'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-fg-2 font-bold">{p.email || 'Sem email'}</div>
                      <div className="text-[11px] text-fg-4">{formatTelefone(p.celular || p.telefone || '') || 'Sem telefone'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.profile_id ? 'bg-accent-primary-soft text-accent-primary' : 'bg-bg-surface-3 text-fg-3'
                      }`}>
                        {p.profile_id && <Link2 size={12} />}
                        {p.profile_id ? 'Interno' : 'Externo'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-black text-fg-1">
                      {p.percentual_repasse_padrao != null ? `${p.percentual_repasse_padrao}%` : '-'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal(p)} className="p-2 text-fg-4 hover:text-accent-primary hover:bg-accent-primary-soft rounded-[6px] transition-all" title="Editar produtor">
                          <Edit size={18} />
                        </button>
                        <button disabled={isRemoving} onClick={() => handleRemove(p)} className="p-2 text-fg-4 hover:text-signal-danger hover:bg-signal-danger/10 rounded-[6px] transition-all disabled:opacity-50" title="Inativar produtor">
                          <Trash2 size={18} />
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
        produtor={selected}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  )
}
