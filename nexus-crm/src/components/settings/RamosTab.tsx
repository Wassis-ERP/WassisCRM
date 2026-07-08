import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Edit3,
  Loader2,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import {
  useRamosAdmin,
  type RamoAdminRow,
  type RamoInput,
} from '../../hooks/useLookupsAdmin'
import { getRamoCategoriaRiscoFromFields, RAMO_CATEGORIAS_RISCO } from '../../hooks/useLookups'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'

const emptyForm = (): RamoInput => ({
  nome: '',
  codigo_susep: '',
  categoria_risco: 'AUTO_FROTA',
  is_monthly: false,
  renovavel: true,
  permite_endosso: true,
  exige_item: true,
  exige_coberturas: true,
  ordem: null,
  ativo: true,
  observacoes: '',
})

const formFromRow = (row: RamoAdminRow): RamoInput => ({
  nome: row.nome,
  codigo_susep: row.codigo_susep ?? '',
  categoria_risco: getRamoCategoriaRiscoFromFields(row.risk_type, row.grupo_operacional, row.forma_calculo).value,
  is_monthly: row.is_monthly,
  renovavel: row.renovavel,
  permite_endosso: row.permite_endosso,
  exige_item: row.exige_item,
  exige_coberturas: row.exige_coberturas,
  ordem: row.ordem,
  ativo: row.ativo,
  observacoes: row.observacoes ?? '',
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

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex h-[42px] items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 text-sm font-black text-fg-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-accent-primary"
      />
      {label}
    </label>
  )
}

export default function RamosTab() {
  const { ramos, isLoading, add, update, remove, isAdding, isUpdating, isRemoving } = useRamosAdmin()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()

  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RamoInput>(() => emptyForm())
  const [error, setError] = useState<string | null>(null)
  const isSaving = isAdding || isUpdating

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return ramos
    return ramos.filter((ramo) =>
      [
        ramo.nome,
        ramo.codigo_susep,
        getRamoCategoriaRiscoFromFields(ramo.risk_type, ramo.grupo_operacional, ramo.forma_calculo).label,
        ramo.observacoes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [ramos, search])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
  }

  const updateForm = <Key extends keyof RamoInput>(key: Key, value: RamoInput[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (isSaving) return
    if (!form.nome.trim()) {
      setError('Nome do ramo é obrigatório.')
      return
    }

    setError(null)
    try {
      if (editingId) {
        await update({ id: editingId, input: form })
      } else {
        await add(form)
      }
      resetForm()
      setView('list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ramo')
    }
  }

  const handleEdit = (row: RamoAdminRow) => {
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

  const handleRemove = async (row: RamoAdminRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar ramo',
      description: `Inativar "${row.nome}"? Ele deixa de aparecer em novas seleções, mas históricos continuam preservados.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return

    try {
      await remove(row.id)
      if (editingId === row.id) resetForm()
    } catch (err) {
      notify({
        title: 'Erro ao inativar ramo',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {view === 'detail' ? (
      <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 rounded-[8px] bg-accent-primary-soft p-2 text-accent-primary">
              <ShieldCheck size={18} />
            </span>
            <div>
              <button
                type="button"
                onClick={handleBackToList}
                className="mb-4 inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
              >
                <ArrowLeft size={14} /> Voltar para lista
              </button>
              <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                {editingId ? 'Editar Ramo' : 'Novo Ramo'}
              </h3>
              <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-fg-3">
                Configure a categoria do risco e as regras operacionais do ramo.
              </p>
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

        <div className="space-y-5 p-5">
          <div className="grid gap-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Nome *</span>
              <input
                value={form.nome}
                onChange={(event) => updateForm('nome', event.target.value)}
                placeholder="Ex: Vida em Grupo PME"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Código SUSEP</span>
              <input
                value={form.codigo_susep}
                onChange={(event) => updateForm('codigo_susep', event.target.value)}
                placeholder="Ex: 0994"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Categoria do risco</span>
              <select
                value={form.categoria_risco}
                onChange={(event) => updateForm('categoria_risco', event.target.value as RamoInput['categoria_risco'])}
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                {RAMO_CATEGORIAS_RISCO.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField label="Mensal" checked={form.is_monthly} onChange={(checked) => updateForm('is_monthly', checked)} />
            <ToggleField label="Renovável" checked={form.renovavel} onChange={(checked) => updateForm('renovavel', checked)} />
            <ToggleField label="Permite endosso" checked={form.permite_endosso} onChange={(checked) => updateForm('permite_endosso', checked)} />
            <ToggleField label="Exige item" checked={form.exige_item} onChange={(checked) => updateForm('exige_item', checked)} />
            <ToggleField label="Exige coberturas" checked={form.exige_coberturas} onChange={(checked) => updateForm('exige_coberturas', checked)} />
            <ToggleField label="Ativo" checked={form.ativo} onChange={(checked) => updateForm('ativo', checked)} />
          </div>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Observações</span>
            <textarea
              value={form.observacoes}
              onChange={(event) => updateForm('observacoes', event.target.value)}
              rows={3}
              placeholder="Regras operacionais, exceções de cálculo ou uso comercial."
              className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </label>
        </div>

        {error && (
          <div className="mx-5 mb-4 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border-1 px-5 py-4 sm:flex-row sm:justify-end">
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
            {isSaving ? <Loader2 size={17} className="animate-spin" /> : editingId ? <Save size={17} /> : <Plus size={17} />}
            {isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar ramo'}
          </button>
        </div>
      </section>
      ) : (

      <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black text-fg-1">Ramos de Seguros</h3>
            <p className="mt-1 text-xs font-semibold text-fg-3">A base operacional que orienta cálculo, itens, faturas, endossos e coberturas.</p>
          </div>
          <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row md:items-center">
            <label className="relative block min-w-0 flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar ramo, SUSEP ou categoria..."
                className="w-full rounded-full border border-border-1 bg-bg-surface py-2.5 pl-9 pr-4 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover"
            >
              <Plus size={17} /> Novo ramo
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-[1.2fr_1fr_1.5fr_90px_auto] gap-3 border-b border-border-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-fg-4 xl:grid">
          <span>Ramo</span>
          <span>Categoria</span>
          <span>Regras</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
            <Loader2 className="animate-spin" size={18} /> Carregando ramos...
          </div>
        ) : (
          <div className="divide-y divide-border-1">
            {filtered.map((ramo) => (
              (() => {
                const categoria = getRamoCategoriaRiscoFromFields(ramo.risk_type, ramo.grupo_operacional, ramo.forma_calculo)

                return (
              <div
                key={ramo.id}
                className={`grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-bg-surface-2 xl:grid-cols-[1.2fr_1fr_1.5fr_90px_auto] ${
                  editingId === ramo.id ? 'bg-accent-primary-soft/40' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-fg-1">{ramo.nome}</p>
                    {ramo.codigo_susep && <span className="font-mono text-xs font-semibold text-fg-4">SUSEP {ramo.codigo_susep}</span>}
                  </div>
                  {ramo.observacoes && <p className="mt-1 line-clamp-1 text-xs font-semibold text-fg-3">{ramo.observacoes}</p>}
                </div>
                <div className="text-sm font-semibold text-fg-2">
                  <p>{categoria.label}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-widest">
                  {ramo.is_monthly && <span className="rounded-full bg-accent-primary-soft px-2 py-1 text-accent-primary">Mensal</span>}
                  {ramo.permite_endosso && <span className="rounded-full bg-bg-surface-2 px-2 py-1 text-fg-3">Endosso</span>}
                  {ramo.exige_item && <span className="rounded-full bg-bg-surface-2 px-2 py-1 text-fg-3">Item</span>}
                  {ramo.exige_coberturas && <span className="rounded-full bg-bg-surface-2 px-2 py-1 text-fg-3">Coberturas</span>}
                </div>
                <div>
                  <StatusPill active={ramo.ativo} />
                </div>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(ramo)}
                    className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                    aria-label={`Editar ramo ${ramo.nome}`}
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(ramo)}
                    disabled={isRemoving || !ramo.ativo}
                    className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Inativar ramo ${ramo.nome}`}
                    title="Inativar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
                )
              })()
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm font-semibold text-fg-4">
                Nenhum ramo encontrado.
              </div>
            )}
          </div>
        )}
      </section>
      )}
    </div>
  )
}
