import { useEffect, useState } from 'react'
import { FilterX, Kanban, List, Plus, Search } from 'lucide-react'
import KanbanPage from './KanbanPage'
import OportunidadesListPage from './OportunidadesListPage'
import NovaOportunidadeModal from '../components/NovaOportunidadeModal'
import { useOrigens, useRamos } from '../hooks/useLookups'
import { usePermission } from '../hooks/usePermission'
import type { ConclusionFilter, KanbanFilters } from '../modules/types'

export type OportunidadeFilters = KanbanFilters

const STATUS_OPTIONS: Array<{ value: ConclusionFilter; label: string }> = [
  { value: 'active', label: 'Em andamento' },
  { value: 'concluded', label: 'Concluídas' },
  { value: 'all', label: 'Todas' },
]

const INITIAL_FILTERS: KanbanFilters = { search: '', ramo: '', origem: '', produtor: '', status: 'active' }

export default function OportunidadesPage() {
  const [view, setView] = useState<'kanban' | 'list'>(() => localStorage.getItem('nexus-crm-opportunities-view') === 'list' ? 'list' : 'kanban')
  const [filters, setFilters] = useState<KanbanFilters>(INITIAL_FILTERS)
  const [showModal, setShowModal] = useState(false)
  const ramos = useRamos()
  const origens = useOrigens()
  const { can } = usePermission('comercial')

  useEffect(() => localStorage.setItem('nexus-crm-opportunities-view', view), [view])

  const setFilter = <K extends keyof KanbanFilters>(key: K, value: KanbanFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))
  const hasFilters = Boolean(filters.search || filters.ramo || filters.origem)

  return (
    <div className="flex flex-col">
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg-1">Oportunidades</h1>
          <p className="mt-0.5 text-xs font-semibold text-fg-3">Leads e negócios comerciais organizados por funil.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-[6px] border border-border-1 bg-bg-surface p-1 shadow-[var(--shadow-1)]" aria-label="Situação das oportunidades">
            {STATUS_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => setFilter('status', option.value)} className={`rounded-[4px] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${filters.status === option.value ? 'bg-accent-primary text-fg-on-brand' : 'text-fg-4 hover:bg-bg-surface-2 hover:text-fg-2'}`}>{option.label}</button>
            ))}
          </div>
          <div className="flex rounded-[6px] border border-border-1 bg-bg-surface p-1 shadow-[var(--shadow-1)]" aria-label="Visualização">
            <button type="button" aria-label="Exibir lista" onClick={() => setView('list')} className={`rounded-[4px] p-1.5 ${view === 'list' ? 'bg-bg-surface-2 text-accent-primary' : 'text-fg-4 hover:text-fg-2'}`}><List size={16} /></button>
            <button type="button" aria-label="Exibir Kanban" onClick={() => setView('kanban')} className={`rounded-[4px] p-1.5 ${view === 'kanban' ? 'bg-bg-surface-2 text-accent-primary' : 'text-fg-4 hover:text-fg-2'}`}><Kanban size={16} /></button>
          </div>
          {can('create') && <button type="button" onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover"><Plus size={16} /> Nova oportunidade</button>}
        </div>
      </header>

      <section aria-label="Filtros de oportunidades" className="mb-4 flex flex-wrap items-center gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-3 shadow-[var(--shadow-1)]">
        <label className="relative min-w-[240px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
          <input value={filters.search ?? ''} onChange={(event) => setFilter('search', event.target.value)} placeholder="Buscar oportunidade ou cliente…" className="w-full rounded-[6px] bg-bg-surface-2 py-2.5 pl-9 pr-3 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:outline-none focus:ring-2 focus:ring-accent-primary/30" />
        </label>
        <select aria-label="Filtrar por ramo" value={filters.ramo ?? ''} onChange={(event) => setFilter('ramo', event.target.value)} className="rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-xs font-bold text-fg-2 focus:outline-none focus:ring-2 focus:ring-accent-primary/30">
          <option value="">Todos os ramos</option>{(ramos.data ?? []).map((row) => <option key={row.id} value={row.nome}>{row.nome}</option>)}
        </select>
        <select aria-label="Filtrar por origem" value={filters.origem ?? ''} onChange={(event) => setFilter('origem', event.target.value)} className="rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-xs font-bold text-fg-2 focus:outline-none focus:ring-2 focus:ring-accent-primary/30">
          <option value="">Todas as origens</option>{(origens.data ?? []).map((row) => <option key={row.id} value={row.nome}>{row.nome}</option>)}
        </select>
        {hasFilters && <button type="button" onClick={() => setFilters((current) => ({ ...INITIAL_FILTERS, status: current.status }))} className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-2.5 text-xs font-black text-fg-3 hover:bg-bg-surface-2 hover:text-signal-danger"><FilterX size={14} /> Limpar</button>}
      </section>

      <div className="flex-1">{view === 'kanban' ? <KanbanPage filters={filters} module="comercial" /> : <OportunidadesListPage filters={filters} />}</div>
      <NovaOportunidadeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
