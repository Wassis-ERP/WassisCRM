import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Edit3,
  Layers3,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useRamos } from '../../hooks/useLookups'
import {
  useCoberturasCatalogoAdmin,
  type CoberturaCatalogoInput,
  type CoberturaCatalogoRow,
} from '../../hooks/useLookupsAdmin'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'

const emptyForm = (ramoId = ''): CoberturaCatalogoInput => ({
  ramo_id: ramoId,
  codigo: '',
  codigo_susep: '',
  nome: '',
  descricao: '',
  tipo_cobertura: 'basica',
  caracteristica: 'massificado',
  tipo_risco: 'danos',
  modalidade: 'regular',
  capital_lmi_padrao: null,
  franquia_padrao: null,
  carencia_dias: 0,
  obrigatoria: false,
  ordem: null,
  ativo: true,
})

const formFromRow = (row: CoberturaCatalogoRow): CoberturaCatalogoInput => ({
  ramo_id: row.ramo_id,
  codigo: row.codigo ?? '',
  codigo_susep: row.codigo_susep ?? '',
  nome: row.nome,
  descricao: row.descricao ?? '',
  tipo_cobertura: row.tipo_cobertura ?? 'basica',
  caracteristica: row.caracteristica ?? 'massificado',
  tipo_risco: row.tipo_risco ?? 'danos',
  modalidade: row.modalidade ?? 'regular',
  capital_lmi_padrao: row.capital_lmi_padrao,
  franquia_padrao: row.franquia_padrao,
  carencia_dias: row.carencia_dias,
  obrigatoria: row.obrigatoria,
  ordem: row.ordem,
  ativo: row.ativo,
})

const numberOrNull = (value: string) => (value === '' ? null : Number(value))

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
        active
          ? 'bg-signal-success/15 text-signal-success'
          : 'border border-border-1 bg-bg-surface-2 text-fg-4'
      }`}
    >
      {active ? 'Ativa' : 'Inativa'}
    </span>
  )
}

export default function CoberturasCatalogoTab() {
  const { data: ramos, isLoading: isLoadingRamos } = useRamos()
  const [selectedRamoId, setSelectedRamoId] = useState<string | null>(null)
  const activeRamoId = selectedRamoId ?? ramos?.[0]?.id ?? null
  const { coberturas, isLoading, create, update, remove, isCreating, isUpdating, isRemoving } =
    useCoberturasCatalogoAdmin(activeRamoId)
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()

  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CoberturaCatalogoInput>(() => emptyForm())
  const [error, setError] = useState<string | null>(null)
  const isSaving = isCreating || isUpdating

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return coberturas
    return coberturas.filter((item) =>
      [
        item.nome,
        item.codigo,
        item.codigo_susep,
        item.tipo_cobertura,
        item.caracteristica,
        item.tipo_risco,
        item.modalidade,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [coberturas, search])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm(activeRamoId ?? ''))
    setError(null)
  }

  const handleRamoChange = (ramoId: string) => {
    setSelectedRamoId(ramoId)
    setEditingId(null)
    setForm(emptyForm(ramoId))
    setError(null)
  }

  const updateForm = <Key extends keyof CoberturaCatalogoInput>(key: Key, value: CoberturaCatalogoInput[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    const ramoId = form.ramo_id || activeRamoId || ''
    if (isSaving) return
    if (!ramoId) {
      setError('Selecione um ramo.')
      return
    }
    if (!form.nome.trim()) {
      setError('Nome da cobertura é obrigatório.')
      return
    }

    const payload = { ...form, ramo_id: ramoId }
    setError(null)
    try {
      if (editingId) {
        await update({ id: editingId, input: payload })
      } else {
        await create(payload)
      }
      resetForm()
      setView('list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cobertura')
    }
  }

  const handleEdit = (row: CoberturaCatalogoRow) => {
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

  const handleRemove = async (row: CoberturaCatalogoRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar cobertura',
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
        title: 'Erro ao inativar cobertura',
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
              <Layers3 size={18} />
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
                {editingId ? 'Editar Cobertura' : 'Nova Cobertura'}
              </h3>
              <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-fg-3">
                Mantenha o catálogo de garantias consumido por cotações, propostas e itens segurados.
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
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Ramo</span>
              <select
                value={activeRamoId ?? ''}
                onChange={(event) => handleRamoChange(event.target.value)}
                disabled={isLoadingRamos}
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
              >
                {(ramos ?? []).map((ramo) => (
                  <option key={ramo.id} value={ramo.id}>{ramo.nome}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Nome *</span>
              <input
                value={form.nome}
                onChange={(event) => updateForm('nome', event.target.value)}
                placeholder="Ex: Danos Elétricos"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Código</span>
              <input
                value={form.codigo ?? ''}
                onChange={(event) => updateForm('codigo', event.target.value)}
                placeholder="Ex: danos-eletricos"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Código SUSEP</span>
              <input
                value={form.codigo_susep ?? ''}
                onChange={(event) => updateForm('codigo_susep', event.target.value)}
                placeholder="Ex: 011"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tipo</span>
              <select
                value={form.tipo_cobertura ?? 'basica'}
                onChange={(event) => updateForm('tipo_cobertura', event.target.value)}
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                <option value="basica">Básica</option>
                <option value="adicional">Adicional</option>
                <option value="assistencia">Assistência</option>
                <option value="servico">Serviço</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Característica</span>
              <select
                value={form.caracteristica ?? 'massificado'}
                onChange={(event) => updateForm('caracteristica', event.target.value)}
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                <option value="massificado">Massificado</option>
                <option value="microsseguro">Microsseguro</option>
                <option value="grandes_riscos">Grandes riscos</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tipo de risco</span>
              <select
                value={form.tipo_risco ?? 'danos'}
                onChange={(event) => updateForm('tipo_risco', event.target.value)}
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                <option value="danos">Danos</option>
                <option value="pessoas">Pessoas</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Modalidade</span>
              <select
                value={form.modalidade ?? 'regular'}
                onChange={(event) => updateForm('modalidade', event.target.value)}
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                <option value="regular">Regular</option>
                <option value="intermitente">Intermitente</option>
                <option value="parametrica">Paramétrica</option>
                <option value="capital_global">Capital global</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Capital/LMI padrão</span>
              <input
                type="number"
                min={0}
                value={form.capital_lmi_padrao ?? ''}
                onChange={(event) => updateForm('capital_lmi_padrao', numberOrNull(event.target.value))}
                placeholder="100000"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Franquia padrão</span>
              <input
                type="number"
                min={0}
                value={form.franquia_padrao ?? ''}
                onChange={(event) => updateForm('franquia_padrao', numberOrNull(event.target.value))}
                placeholder="0"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Carência</span>
              <input
                type="number"
                min={0}
                value={form.carencia_dias ?? ''}
                onChange={(event) => updateForm('carencia_dias', numberOrNull(event.target.value))}
                placeholder="0"
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <label className="mt-auto flex h-[42px] items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 text-sm font-black text-fg-2">
              <input
                type="checkbox"
                checked={form.obrigatoria}
                onChange={(event) => updateForm('obrigatoria', event.target.checked)}
                className="h-4 w-4 accent-accent-primary"
              />
              Obrigatória
            </label>
            <label className="mt-auto flex h-[42px] items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 text-sm font-black text-fg-2">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(event) => updateForm('ativo', event.target.checked)}
                className="h-4 w-4 accent-accent-primary"
              />
              Ativa
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Descrição</span>
            <textarea
              value={form.descricao ?? ''}
              onChange={(event) => updateForm('descricao', event.target.value)}
              rows={3}
              placeholder="Descrição operacional da cobertura e regras de uso."
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
            disabled={isSaving || !form.nome.trim() || !activeRamoId}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={17} className="animate-spin" /> : editingId ? <Save size={17} /> : <Plus size={17} />}
            {isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar cobertura'}
          </button>
        </div>
      </section>
      ) : (

      <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black text-fg-1">Coberturas do Ramo</h3>
            <p className="mt-1 text-xs font-semibold text-fg-3">Lista filtrada pelo ramo selecionado.</p>
          </div>
          <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row md:items-center">
            <label className="min-w-0 md:w-56">
              <select
                value={activeRamoId ?? ''}
                onChange={(event) => handleRamoChange(event.target.value)}
                disabled={isLoadingRamos}
                className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
              >
                {(ramos ?? []).map((ramo) => (
                  <option key={ramo.id} value={ramo.id}>{ramo.nome}</option>
                ))}
              </select>
            </label>
            <label className="relative block min-w-0 flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cobertura..."
                className="w-full rounded-full border border-border-1 bg-bg-surface py-2.5 pl-9 pr-4 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
            </label>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!activeRamoId}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
            >
              <Plus size={17} /> Nova cobertura
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-[1.2fr_120px_110px_1fr_110px_auto] gap-3 border-b border-border-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-fg-4 xl:grid">
          <span>Cobertura</span>
          <span>Tipo</span>
          <span>Risco</span>
          <span>Valores</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>

        {isLoading || isLoadingRamos ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
            <Loader2 className="animate-spin" size={18} /> Carregando coberturas...
          </div>
        ) : (
          <div className="divide-y divide-border-1">
            {filtered.map((cobertura) => (
              <div
                key={cobertura.id}
                className={`grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-bg-surface-2 xl:grid-cols-[1.2fr_120px_110px_1fr_110px_auto] ${
                  editingId === cobertura.id ? 'bg-accent-primary-soft/40' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-fg-1">{cobertura.nome}</p>
                    {cobertura.codigo && <span className="font-mono text-xs font-semibold text-fg-4">{cobertura.codigo}</span>}
                    {cobertura.obrigatoria && <span className="rounded-full bg-accent-primary-soft px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-accent-primary">Obrigatória</span>}
                  </div>
                  {cobertura.descricao && <p className="mt-1 line-clamp-1 text-xs font-semibold text-fg-3">{cobertura.descricao}</p>}
                </div>
                <div className="text-sm font-semibold text-fg-2">{cobertura.tipo_cobertura ?? '-'}</div>
                <div className="text-sm font-semibold text-fg-2">{cobertura.tipo_risco ?? '-'}</div>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-widest text-fg-3">
                  {cobertura.capital_lmi_padrao != null && <span className="rounded-full bg-bg-surface-2 px-2 py-1">LMI {cobertura.capital_lmi_padrao}</span>}
                  {cobertura.franquia_padrao != null && <span className="rounded-full bg-bg-surface-2 px-2 py-1">Franquia {cobertura.franquia_padrao}</span>}
                  {cobertura.carencia_dias != null && <span className="rounded-full bg-bg-surface-2 px-2 py-1">{cobertura.carencia_dias} dias</span>}
                </div>
                <div>
                  <StatusPill active={cobertura.ativo} />
                </div>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(cobertura)}
                    className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                    aria-label={`Editar cobertura ${cobertura.nome}`}
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(cobertura)}
                    disabled={isRemoving || !cobertura.ativo}
                    className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Inativar cobertura ${cobertura.nome}`}
                    title="Inativar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm font-semibold text-fg-4">
                Nenhuma cobertura encontrada para o ramo selecionado.
              </div>
            )}
          </div>
        )}
      </section>
      )}
    </div>
  )
}
