import { useState, useEffect } from 'react'
import { Search, Kanban, Filter, List, Plus } from 'lucide-react'
import KanbanPage from './KanbanPage'
import OportunidadesListPage from './OportunidadesListPage'
import NovaOportunidadeModal from '../components/NovaOportunidadeModal'
import DateField from '../components/DateField'
import { useOrigens, useRamos } from '../hooks/useLookups'
import type { KanbanFilters, ConclusionFilter } from '../modules/types'

/** Filtros usados pela pagina de Oportunidades. Alias compativel com KanbanFilters. */
export type OportunidadeFilters = KanbanFilters;

const STATUS_OPTIONS: Array<{ value: ConclusionFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'concluded', label: 'Concluidos' },
  { value: 'all', label: 'Todos' },
];

const INITIAL_FILTERS: KanbanFilters = {
  search: '',
  dataVigencia: { start: '', end: '' },
  dataRetorno: { start: '', end: '' },
  ramo: '',
  origem: '',
  tipoNegocio: '',
  produtor: '',
  status: 'active',
};

/**
 * Componente principal de Oportunidades que alterna entre Kanban e Lista.
 * Centraliza os filtros (agora baseados em KanbanFilters) para ambas as visualizacoes.
 * Selects de Ramo/Origem sao populados dinamicamente via useLookups.
 */
export default function OportunidadesPage() {
  const [view, setView] = useState<'kanban' | 'list'>(() => {
    const saved = localStorage.getItem('nexus-crm-opportunities-view')
    return (saved as 'kanban' | 'list') || 'kanban'
  })

  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState<KanbanFilters>(INITIAL_FILTERS)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const ramosQuery = useRamos()
  const origensQuery = useOrigens()

  useEffect(() => {
    localStorage.setItem('nexus-crm-opportunities-view', view)
  }, [view])

  const setFilter = <K extends keyof KanbanFilters>(key: K, value: KanbanFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleDateRangeChange = (
    key: 'dataVigencia' | 'dataRetorno',
    edge: 'start' | 'end',
    nextIso: string
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { start: '', end: '' }), [edge]: nextIso },
    }))
  }

  const clearFilters = () => setFilters(INITIAL_FILTERS)

  return (
    <div className="flex flex-col">
      {/* Cabeçalho Compacto */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-fg-1 tracking-tighter">Oportunidades</h1>
          <div className="h-6 w-[1px] bg-border-1 hidden lg:block" />
          <p className="text-xs text-fg-3 font-bold hidden lg:block uppercase tracking-wider opacity-60">
            Monitoramento de Funis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Ativos / Concluidos / Todos */}
          <div className="flex bg-bg-surface p-1 rounded-[10px] border border-border-1 shadow-[var(--shadow-1)]">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter('status', opt.value)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                  (filters.status ?? 'active') === opt.value
                    ? 'bg-accent-primary text-fg-on-brand shadow-[var(--shadow-1)]'
                    : 'text-fg-4 hover:text-fg-2'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-bg-surface p-1 rounded-[10px] border border-border-1 shadow-[var(--shadow-1)]">
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-bg-surface-2 text-accent-primary' : 'text-fg-4'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`p-1.5 rounded-md transition-all ${view === 'kanban' ? 'bg-bg-surface-2 text-accent-primary' : 'text-fg-4'}`}
              >
                <Kanban size={16} className="shrink-0" />
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-fg-on-brand rounded-full text-xs font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)]"
            >
              <Plus size={16} />
              Nova Oportunidade
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros Compacta */}
      <div className="bg-bg-surface border border-border-1 rounded-[14px] shadow-[var(--shadow-1)] mb-4">
        <div className="p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
            <input
              type="text"
              placeholder="Buscar oportunidade..."
              value={filters.search ?? ''}
              onChange={(e) => setFilter('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-surface-2 border-none rounded-[10px] text-xs focus:ring-2 focus:ring-accent-primary/30 transition-all font-bold text-fg-2 placeholder:text-fg-4"
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-bold transition-all ${
              showAdvanced
              ? 'bg-accent-primary-soft text-accent-primary'
              : 'bg-bg-surface-2 text-fg-3 hover:bg-bg-surface-3'
            }`}
          >
            <Filter size={14} />
            Filtros
          </button>

          <div className="h-6 w-[1px] bg-border-1" />

          {!showAdvanced && (
            <div className="hidden xl:flex items-center gap-2">
              <select
                value={filters.ramo ?? ''}
                onChange={(e) => setFilter('ramo', e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-fg-4 focus:ring-0 cursor-pointer hover:text-fg-2"
              >
                <option value="">Todos os Ramos</option>
                {ramosQuery.data?.map(r => (
                  <option key={r.id} value={r.nome}>{r.nome}</option>
                ))}
              </select>
              <select
                value={filters.origem ?? ''}
                onChange={(e) => setFilter('origem', e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-fg-4 focus:ring-0 cursor-pointer hover:text-fg-2"
              >
                <option value="">Todas as Origens</option>
                {origensQuery.data?.map(o => (
                  <option key={o.id} value={o.nome}>{o.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {showAdvanced && (
          <div className="p-3 pt-0 border-t border-border-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in slide-in-from-top-1 duration-200">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-fg-4 uppercase ml-1">Ramo</label>
              <select
                value={filters.ramo ?? ''}
                onChange={(e) => setFilter('ramo', e.target.value)}
                className="w-full bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[10px] focus:ring-2 focus:ring-accent-primary/30 py-1.5 px-2"
              >
                <option value="">Todos</option>
                {ramosQuery.data?.map(r => (
                  <option key={r.id} value={r.nome}>{r.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-fg-4 uppercase ml-1">Origem</label>
              <select
                value={filters.origem ?? ''}
                onChange={(e) => setFilter('origem', e.target.value)}
                className="w-full bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[10px] focus:ring-2 focus:ring-accent-primary/30 py-1.5 px-2"
              >
                <option value="">Todas</option>
                {origensQuery.data?.map(o => (
                  <option key={o.id} value={o.nome}>{o.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-fg-4 uppercase ml-1">Tipo de Negocio</label>
              <select
                value={filters.tipoNegocio ?? ''}
                onChange={(e) => setFilter('tipoNegocio', e.target.value)}
                className="w-full bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[10px] focus:ring-2 focus:ring-accent-primary/30 py-1.5 px-2"
              >
                <option value="">Todos</option>
                <option value="novo">Novo</option>
                <option value="renovacao">Renovacao</option>
                <option value="endosso">Endosso</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-fg-4 uppercase ml-1">Vigencia Inicio</label>
              <DateField
                value={filters.dataVigencia?.start ?? ''}
                onChange={(v) => handleDateRangeChange('dataVigencia', 'start', v)}
                inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[10px] py-1.5 px-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-fg-4 uppercase ml-1">Vigencia Fim</label>
              <DateField
                value={filters.dataVigencia?.end ?? ''}
                onChange={(v) => handleDateRangeChange('dataVigencia', 'end', v)}
                inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[10px] py-1.5 px-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-fg-4 uppercase ml-1">Retorno Inicio</label>
              <DateField
                value={filters.dataRetorno?.start ?? ''}
                onChange={(v) => handleDateRangeChange('dataRetorno', 'start', v)}
                inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[10px] py-1.5 px-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-fg-4 uppercase ml-1">Retorno Fim</label>
              <DateField
                value={filters.dataRetorno?.end ?? ''}
                onChange={(v) => handleDateRangeChange('dataRetorno', 'end', v)}
                inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[10px] py-1.5 px-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-1.5 bg-bg-surface-2 text-fg-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest hover:bg-signal-danger/10 hover:text-signal-danger transition-all"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1">
        {view === 'kanban' ? (
          <KanbanPage filters={filters} module="comercial" />
        ) : (
          <OportunidadesListPage filters={filters} />
        )}
      </div>

      <NovaOportunidadeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
