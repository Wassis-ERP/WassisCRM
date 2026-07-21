import { useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, Plus, Search, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DateField from '../DateField'
import NovaCobrancaModal from '../NovaCobrancaModal'
import { KanbanBoard } from '../kanban/KanbanBoard'
import { PipelineSelector } from '../kanban/PipelineSelector'
import { useActivePipeline } from '../../hooks/useActivePipeline'
import { useFinanceiroCobrancas } from '../../hooks/useFinanceiroCobrancas'
import type { ConclusionFilter, KanbanFilters } from '../../modules/types'

interface CobrancasViewProps {
  branchIds: readonly string[] | null
  requestedParcelaId?: string | null
  canUpdate: boolean
  onRequestHandled: () => void
}

const STATUS_OPTIONS: Array<{ value: ConclusionFilter; label: string }> = [
  { value: 'active', label: 'Ativas' },
  { value: 'concluded', label: 'Encerradas' },
  { value: 'all', label: 'Todas' },
]

export default function CobrancasView({ branchIds, requestedParcelaId, canUpdate, onRequestHandled }: CobrancasViewProps) {
  const navigate = useNavigate()
  const { pipelines, active, setActive, isLoading, isError, hasMultiple } = useActivePipeline('financeiro')
  const cobrancas = useFinanceiroCobrancas(branchIds)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [filters, setFilters] = useState<KanbanFilters>({
    search: '', dataRetorno: { start: '', end: '' }, status: 'active',
  })
  const existingRequested = requestedParcelaId
    ? cobrancas.data?.find((row) => row.parcela_id === requestedParcelaId && row.status === 'ATIVA')
    : undefined
  const shouldOpenRequested = Boolean(requestedParcelaId && !cobrancas.isLoading && !existingRequested)

  const totals = useMemo(() => {
    const rows = cobrancas.data ?? []
    return {
      ativas: rows.filter((row) => row.status === 'ATIVA').length,
      urgentes: rows.filter((row) => row.status === 'ATIVA' && row.prioridade === 'URGENTE').length,
      valor: rows.filter((row) => row.status === 'ATIVA').reduce((sum, row) => sum + (row.parcela.valor ?? 0), 0),
    }
  }, [cobrancas.data])

  const setDate = (edge: 'start' | 'end', value: string) => setFilters((current) => ({
    ...current,
    dataRetorno: { ...(current.dataRetorno ?? {}), [edge]: value },
  }))

  if (isLoading && !active) return <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-fg-4">Carregando pipeline de Cobranças...</div>
  if (isError || !active) return <div className="py-20 text-center text-sm font-bold text-signal-danger">Não foi possível carregar o pipeline de Cobranças.</div>

  return (
    <section className="border-t border-border-1 bg-bg-canvas px-5 py-5 lg:px-7">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><UsersRound size={18} className="text-accent-primary" /><h2 className="text-lg font-black text-fg-1">Acompanhamento de inadimplentes</h2></div>
          <p className="mt-1 max-w-[72ch] text-xs font-semibold text-fg-3">Follow-up sobre parcelas vencidas já materializadas. O sistema não consulta portais de seguradoras.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasMultiple && <PipelineSelector pipelines={pipelines} value={active.id} onChange={setActive} />}
          {canUpdate && <button type="button" onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover"><Plus size={14} />Abrir cobrança</button>}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[8px] border border-border-1 bg-bg-surface px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-4">Cobranças ativas</p><p className="mt-1 text-xl font-black text-fg-1">{totals.ativas}</p></div>
        <div className="rounded-[8px] border border-border-1 bg-bg-surface px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-4">Prioridade urgente</p><p className="mt-1 text-xl font-black text-signal-danger">{totals.urgentes}</p></div>
        <div className="rounded-[8px] border border-border-1 bg-bg-surface px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-4">Valor vencido acompanhado</p><p className="mt-1 font-mono text-xl font-black text-fg-1">{totals.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
      </div>

      {existingRequested && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-signal-warning/30 bg-signal-warning/10 px-4 py-3">
        <div className="flex items-start gap-3"><AlertCircle size={18} className="mt-0.5 shrink-0 text-signal-warning" /><div><p className="text-sm font-bold text-fg-1">Esta parcela já possui cobrança ativa</p><p className="text-xs font-semibold text-fg-3">Abra o acompanhamento existente para evitar duplicidade.</p></div></div>
        <div className="flex gap-2"><button type="button" onClick={onRequestHandled} className="rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-fg-3">Dispensar</button><button type="button" onClick={() => navigate(`/financeiro/${existingRequested.id}`)} className="rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand">Abrir acompanhamento</button></div>
      </div>}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-3 shadow-[var(--shadow-1)]">
        <div className="relative min-w-[220px] flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" /><input value={filters.search ?? ''} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Buscar segurado ou documento" className="w-full rounded-[6px] border-0 bg-bg-surface-2 py-2 pl-9 pr-3 text-xs font-bold text-fg-2 focus:ring-2 focus:ring-accent-primary/30" /></div>
        <div className="flex items-center gap-2"><CalendarClock size={14} className="text-fg-4" /><DateField value={filters.dataRetorno?.start ?? ''} onChange={(value) => setDate('start', value)} inputClassName="text-xs" /><span className="text-xs text-fg-4">até</span><DateField value={filters.dataRetorno?.end ?? ''} onChange={(value) => setDate('end', value)} inputClassName="text-xs" /></div>
        <div className="flex rounded-[6px] bg-bg-surface-2 p-1">{STATUS_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => setFilters((current) => ({ ...current, status: option.value }))} className={`rounded-[5px] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${(filters.status ?? 'active') === option.value ? 'bg-accent-primary text-fg-on-brand shadow-[var(--shadow-1)]' : 'text-fg-4 hover:text-fg-2'}`}>{option.label}</button>)}</div>
      </div>

      <KanbanBoard pipelineId={active.id} module="financeiro" filters={filters} onCardOpen={(card) => navigate(`/financeiro/${card.id}`)} />

      <NovaCobrancaModal
        key={`${requestedParcelaId ?? 'manual'}-${isCreateOpen || shouldOpenRequested ? 'open' : 'closed'}`}
        isOpen={isCreateOpen || shouldOpenRequested}
        onClose={() => { setIsCreateOpen(false); if (requestedParcelaId) onRequestHandled() }}
        pipelineId={active.id}
        branchIds={branchIds}
        initialParcelaId={shouldOpenRequested ? requestedParcelaId : null}
        onCreated={(id) => navigate(`/financeiro/${id}`)}
      />
    </section>
  )
}
