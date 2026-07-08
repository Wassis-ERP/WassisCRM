import { useMemo, useState, type ComponentType } from 'react'
import {
  Edit3,
  Loader2,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import {
  useCatalogoEnxutoAdmin,
  type CatalogoEnxutoField,
  type CatalogoEnxutoInput,
  type CatalogoEnxutoRow,
  type CatalogoEnxutoTable,
} from '../../hooks/useLookupsAdmin'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'

type CatalogoEnxutoTabProps = {
  title: string
  singular: string
  description: string
  table: CatalogoEnxutoTable
  field: CatalogoEnxutoField
  fieldLabel: string
  fieldPlaceholder: string
  newLabel?: string
  icon: ComponentType<{ size?: number; className?: string }>
}

const emptyForm = (): CatalogoEnxutoInput => ({
  nome: '',
  classificacao: '',
  ordem: null,
  ativo: true,
})

const formFromRow = (row: CatalogoEnxutoRow, field: CatalogoEnxutoField): CatalogoEnxutoInput => ({
  nome: row.nome,
  classificacao: row[field] ?? '',
  ordem: row.ordem,
  ativo: row.ativo,
})

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
        active
          ? 'bg-signal-success/15 text-signal-success'
          : 'border border-border-1 bg-bg-surface-2 text-fg-4'
      }`}
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

export default function CatalogoEnxutoTab({
  title,
  singular,
  description,
  table,
  field,
  fieldLabel,
  fieldPlaceholder,
  newLabel,
  icon: Icon,
}: CatalogoEnxutoTabProps) {
  const { items, isLoading, create, update, remove, isCreating, isUpdating, isRemoving } =
    useCatalogoEnxutoAdmin(table, field)
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CatalogoEnxutoInput>(() => emptyForm())
  const [error, setError] = useState<string | null>(null)
  const isSaving = isCreating || isUpdating

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return items

    return items.filter((item) => {
      const haystack = [item.nome, item[field]]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [field, items, search])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
  }

  const handleSave = async () => {
    if (isSaving) return
    if (!form.nome.trim()) {
      setError(`Nome de ${singular.toLowerCase()} é obrigatório.`)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao salvar ${singular.toLowerCase()}`)
    }
  }

  const handleEdit = (row: CatalogoEnxutoRow) => {
    setEditingId(row.id)
    setForm(formFromRow(row, field))
    setError(null)
  }

  const handleRemove = async (row: CatalogoEnxutoRow) => {
    const shouldRemove = await confirm({
      title: `Inativar ${singular.toLowerCase()}`,
      description: `Inativar "${row.nome}"? O registro deixa de aparecer em novas seleções, mas históricos continuam preservados.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return

    try {
      await remove(row.id)
      if (editingId === row.id) resetForm()
    } catch (err) {
      notify({
        title: `Erro ao inativar ${singular.toLowerCase()}`,
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 rounded-[8px] bg-accent-primary-soft p-2 text-accent-primary">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                {editingId ? `Editar ${singular}` : newLabel ?? `Novo ${singular}`}
              </h3>
              <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-fg-3">{description}</p>
            </div>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
            >
              <X size={15} /> Cancelar edição
            </button>
          )}
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.8fr)_160px]">
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Nome *</span>
            <input
              value={form.nome}
              onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
              placeholder={`Ex: ${singular === 'Origem' ? 'Indicação parceiro' : 'Preço fora da faixa'}`}
              className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">{fieldLabel}</span>
            <input
              value={form.classificacao}
              onChange={(event) => setForm((prev) => ({ ...prev, classificacao: event.target.value }))}
              placeholder={fieldPlaceholder}
              className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </label>

          <div className="flex flex-col justify-end gap-2">
            <label className="flex h-[42px] items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 text-sm font-black text-fg-2">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.checked }))}
                className="h-4 w-4 accent-accent-primary"
              />
              Ativo
            </label>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-4 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border-1 px-5 py-4 sm:flex-row sm:justify-end">
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
            {isSaving ? <Loader2 size={17} className="animate-spin" /> : editingId ? <Save size={17} /> : <Plus size={17} />}
            {isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : `Criar ${singular.toLowerCase()}`}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black text-fg-1">{title}</h3>
            <p className="mt-1 text-xs font-semibold text-fg-3">Lista alfabética com opções válidas para novas seleções.</p>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${singular.toLowerCase()}...`}
              className="w-full rounded-full border border-border-1 bg-bg-surface py-2.5 pl-9 pr-4 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </label>
        </div>

        <div className="hidden grid-cols-[1fr_1fr_100px_auto] gap-3 border-b border-border-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-fg-4 lg:grid">
          <span>Nome</span>
          <span>{fieldLabel}</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
            <Loader2 className="animate-spin" size={18} /> Carregando {title.toLowerCase()}...
          </div>
        ) : (
          <div className="divide-y divide-border-1">
            {filtered.map((row) => (
              <div
                key={row.id}
                className={`grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-bg-surface-2 lg:grid-cols-[1fr_1fr_100px_auto] ${
                  editingId === row.id ? 'bg-accent-primary-soft/40' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-fg-1">{row.nome}</p>
                  <p className="mt-1 text-xs font-semibold text-fg-4">{singular}</p>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-fg-2">
                  <SlidersHorizontal size={14} className="shrink-0 text-fg-4" />
                  <span className="truncate">{row[field] || 'Sem classificação'}</span>
                </div>
                <div>
                  <StatusPill active={row.ativo} />
                </div>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(row)}
                    className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                    aria-label={`Editar ${singular.toLowerCase()} ${row.nome}`}
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(row)}
                    disabled={isRemoving || !row.ativo}
                    className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Inativar ${singular.toLowerCase()} ${row.nome}`}
                    title="Inativar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm font-semibold text-fg-4">
                Nenhum registro encontrado.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
