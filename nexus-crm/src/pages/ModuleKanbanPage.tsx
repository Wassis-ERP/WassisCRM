import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { PipelineSelector } from '../components/kanban/PipelineSelector';
import DateField from '../components/DateField';
import { useActivePipeline } from '../hooks/useActivePipeline';
import { useRamos } from '../hooks/useLookups';
import { getAdapter } from '../modules/registry';
import type { ConclusionFilter, KanbanCard, KanbanFilters, PipelineModule } from '../modules/types';

interface ModuleKanbanPageProps {
  module: PipelineModule;
  title: string;
  description?: string;
}

const STATUS_OPTIONS: Array<{ value: ConclusionFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'concluded', label: 'Concluidos' },
  { value: 'all', label: 'Todos' },
];

const INITIAL_FILTERS: KanbanFilters = {
  search: '',
  ramo: '',
  dataRetorno: { start: '', end: '' },
  dataVigencia: { start: '', end: '' },
  status: 'active',
};

/**
 * Pagina generica de Kanban para modulos sem tela dedicada ainda
 * (Sinistro, Emissao, Pos-Venda, Financeiro). Reutiliza o <KanbanBoard />
 * generico e o `useActivePipeline` do Micro 3 para descoberta automatica do funil.
 *
 * Micro 6 - exibe toggle Ativos/Concluidos + filtros dinamicos conforme
 * `availableFilters` do adapter.
 */
export default function ModuleKanbanPage({ module, title, description }: ModuleKanbanPageProps) {
  const navigate = useNavigate();
  const { pipelines, active, setActive, isLoading, isError, hasMultiple } = useActivePipeline(module);
  const [filters, setFilters] = useState<KanbanFilters>(INITIAL_FILTERS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const adapter = useMemo(() => getAdapter(module), [module]);
  const enabled = useMemo(() => new Set(adapter.availableFilters), [adapter.availableFilters]);
  const ramosQuery = useRamos();

  const CreateModal = adapter.createModalComponent;
  const createLabel = adapter.createLabel ?? 'Novo';

  const setFilter = <K extends keyof KanbanFilters>(key: K, value: KanbanFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const setDateRange = (key: 'dataRetorno' | 'dataVigencia', edge: 'start' | 'end', v: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { start: '', end: '' }), [edge]: v },
    }));
  };

  const handleOpen = (card: KanbanCard) => {
    if (adapter.detailRoute) {
      navigate(adapter.detailRoute(card.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-fg-1 uppercase">
            {title}
          </h1>
          {description && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-fg-4 mt-1">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-bg-surface p-1 rounded-[6px] border border-border-1 shadow-[var(--shadow-1)]">
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

          {hasMultiple && (
            <PipelineSelector
              pipelines={pipelines}
              value={active?.id ?? null}
              onChange={setActive}
            />
          )}

          {CreateModal && (
            <button
              onClick={() => setIsCreateOpen(true)}
              disabled={!active}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-fg-on-brand rounded-full text-[10px] font-black uppercase tracking-widest shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} /> {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* Filtros dinamicos */}
      <div className="bg-bg-surface border border-border-1 rounded-[8px] shadow-[var(--shadow-1)] mb-4 p-3 flex flex-wrap items-center gap-3">
        {enabled.has('search') && (
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
            <input
              type="text"
              value={filters.search ?? ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 rounded-[6px] bg-bg-surface-2 border-none text-xs font-bold text-fg-2 placeholder:text-fg-4 focus:ring-2 focus:ring-accent-primary/30"
            />
          </div>
        )}

        {enabled.has('ramo') && (
          <select
            value={filters.ramo ?? ''}
            onChange={(e) => setFilter('ramo', e.target.value)}
            className="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[6px] py-2 px-3"
          >
            <option value="">Todos os Ramos</option>
            {ramosQuery.data?.map(r => (
              <option key={r.id} value={r.nome}>{r.nome}</option>
            ))}
          </select>
        )}

        {enabled.has('dataRetorno') && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-fg-4">Retorno:</span>
            <DateField
              value={filters.dataRetorno?.start ?? ''}
              onChange={(v) => setDateRange('dataRetorno', 'start', v)}
              inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[6px] py-1.5 px-2"
            />
            <span className="text-fg-4 text-[10px]">ate</span>
            <DateField
              value={filters.dataRetorno?.end ?? ''}
              onChange={(v) => setDateRange('dataRetorno', 'end', v)}
              inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[6px] py-1.5 px-2"
            />
          </div>
        )}

        {enabled.has('dataVigencia') && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-fg-4">Vigencia:</span>
            <DateField
              value={filters.dataVigencia?.start ?? ''}
              onChange={(v) => setDateRange('dataVigencia', 'start', v)}
              inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[6px] py-1.5 px-2"
            />
            <span className="text-fg-4 text-[10px]">ate</span>
            <DateField
              value={filters.dataVigencia?.end ?? ''}
              onChange={(v) => setDateRange('dataVigencia', 'end', v)}
              inputClassName="bg-bg-surface-2 text-fg-2 border-none text-[11px] font-bold rounded-[6px] py-1.5 px-2"
            />
          </div>
        )}

        <button
          onClick={() => setFilters(INITIAL_FILTERS)}
          className="ml-auto px-3 py-1.5 bg-bg-surface-2 text-fg-3 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-signal-danger/10 hover:text-signal-danger transition-all"
        >
          Limpar
        </button>
      </div>

      {isLoading && !active && (
        <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-fg-4">
          Carregando funil...
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-signal-danger">
          Nao foi possivel carregar os funis
        </div>
      )}
      {!isLoading && !isError && !active && (
        <div className="flex items-center justify-center py-24 text-[11px] font-black uppercase tracking-widest text-fg-4">
          Nenhum funil disponivel para este modulo
        </div>
      )}

      {active && (
        <KanbanBoard
          pipelineId={active.id}
          module={active.module as PipelineModule}
          filters={filters}
          onCardOpen={handleOpen}
        />
      )}

      {CreateModal && (
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          pipelineId={active?.id ?? null}
        />
      )}
    </div>
  );
}
