import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActivePipeline } from '../hooks/useActivePipeline';
import { useKanbanCards } from '../hooks/useKanbanCards';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { applyKanbanFilters } from '../modules/filters';
import { getAdapter } from '../modules/registry';
import { startOfDayTs, toDisplayDateBr } from '../utils/date';
import type { KanbanCard, KanbanFilters } from '../modules/types';

type SortKey =
  | 'vigencia'
  | 'segurado'
  | 'ramo'
  | 'origem'
  | 'premioLiquido'
  | 'comissao'
  | 'etapa'
  | 'retorno'
  | 'status'
  | 'vendedor';

type SortConfig = { key: SortKey; direction: 'asc' | 'desc' } | null;

type OportunidadeRow = {
  id: string;
  vigencia: string;
  segurado: string;
  ramo: string;
  origem: string;
  premioLiquidoNum: number | null;
  premioLiquido: string;
  comissaoNum: number | null;
  comissao: string;
  etapa: string;
  retorno: string;
  status: string;
  vendedor: string;
};

const SortableHeader = ({
  title,
  sortKey,
  sortConfig,
  onSort,
}: {
  title: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
}) => {
  const isActive = sortConfig?.key === sortKey;
  return (
    <th
      className="px-6 py-4 text-[10px] font-black text-fg-4 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-bg-surface-2 transition-colors group select-none relative"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        {title}
        <div className="flex flex-col opacity-0 group-hover:opacity-50 transition-opacity">
          {isActive ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp size={12} className="text-accent-primary opacity-100" />
            ) : (
              <ArrowDown size={12} className="text-accent-primary opacity-100" />
            )
          ) : (
            <ArrowUpDown size={12} />
          )}
        </div>
      </div>
    </th>
  );
};

/**
 * Lista de oportunidades do modulo Comercial, alimentada pelo Supabase (mesma
 * fonte do Kanban). Filtros globais continuam vindo do OportunidadesPage.
 * `pipelineId` e ignorado (mantido por compatibilidade) - a selecao e feita
 * pelo `useActivePipeline('comercial')`.
 */
export default function OportunidadesListPage({
  filters,
}: {
  filters: KanbanFilters;
  /** @deprecated - mantido por compatibilidade. */
  pipelineId?: string;
}) {
  const navigate = useNavigate();
  const { active: activePipeline } = useActivePipeline('comercial');
  const stagesQuery = usePipelineStages(activePipeline?.id);
  const cardsQuery = useKanbanCards({
    pipelineId: activePipeline?.id,
    module: 'comercial',
    includeConcluded: true,
  });
  const adapter = useMemo(() => getAdapter('comercial'), []);

  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const stageNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of stagesQuery.data ?? []) map.set(s.id, s.name);
    return map;
  }, [stagesQuery.data]);

  const filteredCards: KanbanCard[] = useMemo(() => {
    const all = cardsQuery.data ?? [];
    const statusFilter = filters.status ?? 'all';
    const byStatus = all.filter((c) => {
      if (statusFilter === 'active') return c.status === 'pending';
      if (statusFilter === 'concluded') return c.status !== 'pending';
      return true;
    });
    return applyKanbanFilters(byStatus, filters, adapter.availableFilters);
  }, [cardsQuery.data, filters, adapter.availableFilters]);

  const rows: OportunidadeRow[] = useMemo(() => {
    return filteredCards.map((card: KanbanCard) => {
      const raw = card.raw as Record<string, unknown>;
      const origemJoin = raw.origens as { nome: string } | null | undefined;
      const vigenciaIso = (raw.vigencia_inicio as string | null) ?? null;
      const retornoIso = (raw.proximo_followup as string | null) ?? null;

      return {
        id: card.id,
        vigencia: vigenciaIso ? toDisplayDateBr(vigenciaIso) : '',
        segurado: card.title,
        ramo: card.tags?.find((t) => t.tone === 'default')?.label ?? '-',
        origem: origemJoin?.nome ?? '-',
        premioLiquidoNum: typeof card.primaryValue === 'number' ? card.primaryValue : null,
        premioLiquido:
          typeof card.primaryValue === 'number'
            ? card.primaryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '-',
        comissaoNum: typeof raw.comissao_percentual === 'number' ? (raw.comissao_percentual as number) : null,
        comissao: typeof raw.comissao_percentual === 'number' ? `${raw.comissao_percentual}%` : '-',
        etapa: card.stageId ? stageNameById.get(card.stageId) ?? '-' : '-',
        retorno: retornoIso ? toDisplayDateBr(retornoIso) : '-',
        status:
          card.status === 'pending' ? 'Ativo'
          : card.status === 'won' ? 'Ganho'
          : 'Perdido',
        vendedor: card.responsavelName ?? '-',
      };
    });
  }, [filteredCards, stageNameById]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = [...rows].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const modifier = direction === 'asc' ? 1 : -1;

    if (key === 'vigencia' || key === 'retorno') {
      const aNum = startOfDayTs(a[key]) ?? 0;
      const bNum = startOfDayTs(b[key]) ?? 0;
      return aNum === bNum ? 0 : (aNum < bNum ? -1 : 1) * modifier;
    }

    if (key === 'premioLiquido') {
      const aNum = a.premioLiquidoNum ?? 0;
      const bNum = b.premioLiquidoNum ?? 0;
      return aNum === bNum ? 0 : (aNum < bNum ? -1 : 1) * modifier;
    }

    if (key === 'comissao') {
      const aNum = a.comissaoNum ?? 0;
      const bNum = b.comissaoNum ?? 0;
      return aNum === bNum ? 0 : (aNum < bNum ? -1 : 1) * modifier;
    }

    const aStr = String(a[key] ?? '').toLowerCase();
    const bStr = String(b[key] ?? '').toLowerCase();
    return aStr === bStr ? 0 : (aStr < bStr ? -1 : 1) * modifier;
  });

  return (
    <div className="animate-fade-in w-full">
      <div className="bg-bg-surface rounded-[14px] shadow-[var(--shadow-1)] border border-border-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-bg-surface-2 border-b border-border-1">
                <SortableHeader title="Vigencia" sortKey="vigencia" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Segurado" sortKey="segurado" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Ramo" sortKey="ramo" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Origem" sortKey="origem" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Prem. Liq." sortKey="premioLiquido" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="% Comissao" sortKey="comissao" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Etapa" sortKey="etapa" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Retorno" sortKey="retorno" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="Vendedor" sortKey="vendedor" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1">
              {cardsQuery.isLoading && (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <p className="text-fg-4 font-bold uppercase tracking-widest text-xs italic">Carregando oportunidades...</p>
                  </td>
                </tr>
              )}
              {!cardsQuery.isLoading && sortedData.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => navigate(`/oportunidades/${op.id}`)}
                  className="hover:bg-bg-surface-2 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 text-xs font-bold text-fg-3 whitespace-nowrap">{op.vigencia || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="font-black text-fg-1 text-sm uppercase tracking-tighter group-hover:text-accent-primary transition-colors whitespace-nowrap">
                      {op.segurado}
                    </div>
                    <div className="text-[10px] text-fg-4 font-bold mt-0.5">ID: #{op.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-fg-2">{op.ramo}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-fg-2">{op.origem}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-fg-2">{op.premioLiquido}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-accent-primary">{op.comissao}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-[10px] text-[10px] font-black bg-accent-primary-soft text-accent-primary border border-accent-primary/10 uppercase tracking-widest whitespace-nowrap">
                      {op.etapa}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-fg-3 whitespace-nowrap">{op.retorno}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        op.status === 'Ativo' ? 'text-signal-success'
                        : op.status === 'Ganho' ? 'text-signal-success'
                        : op.status === 'Perdido' ? 'text-signal-danger'
                        : 'text-fg-4'
                      }`}
                    >
                      {op.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-fg-2 whitespace-nowrap">{op.vendedor}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-bg-surface-2 rounded-[10px] text-fg-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {!cardsQuery.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <p className="text-fg-4 font-bold uppercase tracking-widest text-xs italic">
                      Nenhuma oportunidade encontrada com estes filtros.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-bg-surface-2 flex items-center justify-between border-t border-border-1">
          <p className="text-[10px] font-black text-fg-4 uppercase tracking-widest">
            Exibindo {rows.length} de {cardsQuery.data?.length ?? 0} registros
          </p>
          <div className="flex gap-1.5">
            <button className="p-1.5 rounded-[10px] border border-border-1 text-fg-4 hover:bg-bg-surface shadow-[var(--shadow-1)] transition-all">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-[10px] bg-accent-primary text-fg-on-brand font-black text-xs shadow-[var(--shadow-brand)]">1</button>
            <button className="p-1.5 rounded-[10px] border border-border-1 text-fg-4 hover:bg-bg-surface shadow-[var(--shadow-1)] transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
