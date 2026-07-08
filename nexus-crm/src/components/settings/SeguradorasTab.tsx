import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Bot,
  Building2,
  Edit3,
  FileText,
  Globe2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  useSeguradorasAdmin,
  type SeguradoraInput,
  type SeguradoraRow,
} from '../../hooks/useLookupsAdmin'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'
import { formatCpfCnpj } from '../../utils/documento'

const emptySeguradoraForm = (): SeguradoraInput => ({
  nome: '',
  nome_curto: '',
  cnpj: '',
  codigo_susep: '',
  codigo_interno: '',
  site: '',
  portal_url: '',
  telefone_sac: '',
  telefone_assistencia: '',
  email: '',
  aceita_importacao_pdf: false,
  aceita_busca_automatica: false,
  ativo: true,
  observacoes: '',
})

const formFromRow = (row: SeguradoraRow): SeguradoraInput => ({
  nome: row.nome,
  nome_curto: row.nome_curto ?? '',
  cnpj: row.cnpj ?? '',
  codigo_susep: row.codigo_susep ?? '',
  codigo_interno: row.codigo_interno ?? '',
  site: row.site ?? '',
  portal_url: row.portal_url ?? '',
  telefone_sac: row.telefone_sac ?? '',
  telefone_assistencia: row.telefone_assistencia ?? '',
  email: row.email ?? '',
  aceita_importacao_pdf: row.aceita_importacao_pdf,
  aceita_busca_automatica: row.aceita_busca_automatica,
  ativo: row.ativo,
  observacoes: row.observacoes ?? '',
})

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">
        {label}{required ? ' *' : ''}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
      />
    </label>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-border-1 bg-bg-surface-2 p-3 transition-colors hover:bg-bg-surface-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-accent-primary"
      />
      <span className="flex min-w-0 gap-3">
        <span className="mt-0.5 text-fg-4">{icon}</span>
        <span>
          <span className="block text-sm font-black text-fg-1">{label}</span>
          <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-fg-3">{description}</span>
        </span>
      </span>
    </label>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
        active
          ? 'bg-signal-success/15 text-signal-success'
          : 'bg-bg-surface-2 text-fg-4 border border-border-1'
      }`}
    >
      {active ? 'Ativa' : 'Inativa'}
    </span>
  )
}

export default function SeguradorasTab() {
  const {
    seguradoras,
    isLoading,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isRemoving,
  } = useSeguradorasAdmin()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()

  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SeguradoraInput>(() => emptySeguradoraForm())
  const [error, setError] = useState<string | null>(null)
  const isSaving = isCreating || isUpdating

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return seguradoras
    return seguradoras.filter((item) => {
      const haystack = [
        item.nome,
        item.nome_curto,
        item.cnpj,
        item.codigo_susep,
        item.codigo_interno,
        item.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [search, seguradoras])

  const updateForm = <Key extends keyof SeguradoraInput>(key: Key, value: SeguradoraInput[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptySeguradoraForm())
    setError(null)
  }

  const handleEdit = (row: SeguradoraRow) => {
    setEditingId(row.id)
    setView('detail')
    setForm(formFromRow(row))
    setError(null)
  }

  const handleCreate = () => {
    resetForm()
    setView('detail')
  }

  const handleBackToList = () => {
    resetForm()
    setView('list')
  }

  const handleSave = async () => {
    if (isSaving) return
    if (!form.nome.trim()) {
      setError('Nome da seguradora é obrigatório.')
      return
    }

    setError(null)
    try {
      if (editingId) {
        await update({ id: editingId, input: form })
      } else {
        await create(form)
      }
      resetForm()
      setView('list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar seguradora')
    }
  }

  const handleRemove = async (row: SeguradoraRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar seguradora',
      description: `Inativar "${row.nome}"? Ela deixa de aparecer em novas seleções, mas históricos continuam preservados.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return

    try {
      await remove(row.id)
      if (editingId === row.id) resetForm()
    } catch (err) {
      notify({
        title: 'Erro ao inativar seguradora',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {view === 'list' ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-[var(--shadow-1)] sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block min-w-0 flex-1">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, CNPJ, SUSEP ou código..."
                className="w-full rounded-full border border-border-1 bg-bg-surface-2 py-2.5 pl-10 pr-4 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover"
            >
              <Plus size={18} /> Nova Seguradora
            </button>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-fg-4 lg:grid">
              <span>Seguradora</span>
              <span>Canais</span>
              <span>Operação</span>
              <span className="text-right">Ações</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
                <Loader2 className="animate-spin" size={18} /> Carregando seguradoras...
              </div>
            ) : (
              <div className="divide-y divide-border-1">
                {filtered.map((row) => (
                  <div
                    key={row.id}
                    className={`grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-bg-surface-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] ${
                      editingId === row.id ? 'bg-accent-primary-soft/40' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-fg-1">{row.nome}</p>
                        <StatusPill active={row.ativo} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-fg-3">
                        {row.nome_curto && <span>{row.nome_curto}</span>}
                        {row.cnpj && <span className="font-mono">{formatCpfCnpj(row.cnpj)}</span>}
                        {row.codigo_susep && <span>SUSEP {row.codigo_susep}</span>}
                        {row.codigo_interno && <span>Cód. {row.codigo_interno}</span>}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-semibold text-fg-3">
                      {row.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={12} className="text-fg-4" /> {row.email}
                        </p>
                      )}
                      {row.telefone_sac && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={12} className="text-fg-4" /> SAC {row.telefone_sac}
                        </p>
                      )}
                      {row.portal_url && (
                        <p className="flex items-center gap-1.5">
                          <Globe2 size={12} className="text-fg-4" /> Portal configurado
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-start gap-2 text-[10px] font-black uppercase tracking-widest">
                      {row.aceita_importacao_pdf && (
                        <span className="rounded-full bg-accent-primary-soft px-2 py-1 text-accent-primary">PDF</span>
                      )}
                      {row.aceita_busca_automatica && (
                        <span className="rounded-full bg-accent-primary-soft px-2 py-1 text-accent-primary">Busca auto</span>
                      )}
                      {!row.aceita_importacao_pdf && !row.aceita_busca_automatica && (
                        <span className="rounded-full border border-border-1 bg-bg-surface-2 px-2 py-1 text-fg-4">Manual</span>
                      )}
                    </div>

                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                        aria-label={`Editar seguradora ${row.nome}`}
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(row)}
                        disabled={isRemoving || !row.ativo}
                        className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Inativar seguradora ${row.nome}`}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="py-12 text-center text-sm font-semibold text-fg-4">
                    Nenhuma seguradora encontrada.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        <aside className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
          <div className="flex items-start justify-between gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4">
            <div>
              <button
                type="button"
                onClick={handleBackToList}
                className="mb-4 inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
              >
                <ArrowLeft size={14} /> Voltar para lista
              </button>
              <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                {editingId ? 'Editar seguradora' : 'Nova seguradora'}
              </h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-fg-3">
                Cadastro do grupo usado em cotações, propostas, apólices e regras financeiras.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                aria-label="Cancelar edição"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="space-y-5 p-5">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-fg-4">
                <Building2 size={14} /> Identificação
              </div>
              <Field label="Nome" required value={form.nome} onChange={(value) => updateForm('nome', value)} placeholder="Ex: Porto Seguro" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome curto" value={form.nome_curto ?? ''} onChange={(value) => updateForm('nome_curto', value)} placeholder="Porto" />
                <Field label="CNPJ" value={form.cnpj ?? ''} onChange={(value) => updateForm('cnpj', value)} placeholder="00.000.000/0000-00" />
                <Field label="Código SUSEP" value={form.codigo_susep ?? ''} onChange={(value) => updateForm('codigo_susep', value)} placeholder="Ex: 05886" />
                <Field label="Código interno" value={form.codigo_interno ?? ''} onChange={(value) => updateForm('codigo_interno', value)} placeholder="Ex: porto" />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-fg-4">
                <Globe2 size={14} /> Canais
              </div>
              <Field label="Site" value={form.site ?? ''} onChange={(value) => updateForm('site', value)} placeholder="https://..." />
              <Field label="Portal da seguradora" value={form.portal_url ?? ''} onChange={(value) => updateForm('portal_url', value)} placeholder="https://portal..." />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Telefone SAC" value={form.telefone_sac ?? ''} onChange={(value) => updateForm('telefone_sac', value)} placeholder="0800..." />
                <Field label="Telefone assistência" value={form.telefone_assistencia ?? ''} onChange={(value) => updateForm('telefone_assistencia', value)} placeholder="0800..." />
              </div>
              <Field label="E-mail" type="email" value={form.email ?? ''} onChange={(value) => updateForm('email', value)} placeholder="atendimento@..." />
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-fg-4">
                <FileText size={14} /> Operação
              </div>
              <ToggleField
                label="Aceita importação PDF"
                description="Permite usar documentos importados como apoio ao cadastro operacional."
                checked={form.aceita_importacao_pdf}
                onChange={(checked) => updateForm('aceita_importacao_pdf', checked)}
                icon={<FileText size={15} />}
              />
              <ToggleField
                label="Aceita busca automática"
                description="Sinaliza que a seguradora pode ter consulta automatizada quando o backend expuser integração."
                checked={form.aceita_busca_automatica}
                onChange={(checked) => updateForm('aceita_busca_automatica', checked)}
                icon={<Bot size={15} />}
              />
              <ToggleField
                label="Ativa"
                description="Seguradoras inativas somem de novas seleções, sem apagar históricos."
                checked={form.ativo}
                onChange={(checked) => updateForm('ativo', checked)}
                icon={<Building2 size={15} />}
              />
            </section>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Observações</span>
              <textarea
                value={form.observacoes ?? ''}
                onChange={(event) => updateForm('observacoes', event.target.value)}
                rows={4}
                placeholder="Notas internas sobre operação, portal, importações ou restrições."
                className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>

            {error && (
              <div className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
              >
                <X size={16} /> Limpar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !form.nome.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                {isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar seguradora'}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
