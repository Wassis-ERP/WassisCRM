import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useActivePipeline } from '../hooks/useActivePipeline'
import { useKanbanCards } from '../hooks/useKanbanCards'
import { usePipelineStages } from '../hooks/usePipelineStages'
import { applyKanbanFilters } from '../modules/filters'
import { getAdapter } from '../modules/registry'
import type { KanbanCard, KanbanFilters } from '../modules/types'
import { fmtDate } from '../utils/date'

type SortKey = 'abertura' | 'titulo' | 'cliente' | 'ramo' | 'origem' | 'premio' | 'comissao' | 'etapa' | 'previsao' | 'status' | 'responsavel'
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' } | null

interface OpportunityListRow {
  id: string
  abertura: string
  titulo: string
  cliente: string
  ramo: string
  origem: string
  premio: number | null
  comissao: number | null
  etapa: string
  previsao: string
  status: string
  responsavel: string
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function SortableHeader({ title, sortKey, sortConfig, onSort, className = '' }: { title: string; sortKey: SortKey; sortConfig: SortConfig; onSort: (key: SortKey) => void; className?: string }) {
  const active = sortConfig?.key === sortKey
  return (
    <th className={`cursor-pointer overflow-hidden px-2.5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-fg-4 hover:bg-bg-surface-3 ${className}`} onClick={() => onSort(sortKey)}>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate">{title}</span>
        {active ? sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-accent-primary" /> : <ArrowDown size={12} className="text-accent-primary" /> : <ArrowUpDown size={12} className="opacity-35" />}
      </span>
    </th>
  )
}

export default function OportunidadesListPage({ filters }: { filters: KanbanFilters; pipelineId?: string }) {
  const navigate = useNavigate()
  const { active: pipeline } = useActivePipeline('comercial')
  const stages = usePipelineStages(pipeline?.id)
  const cards = useKanbanCards({ pipelineId: pipeline?.id, module: 'comercial', includeConcluded: true })
  const adapter = useMemo(() => getAdapter('comercial'), [])
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  const stageNames = useMemo(() => new Map((stages.data ?? []).map((stage) => [stage.id, stage.name])), [stages.data])
  const filtered = useMemo(() => {
    const status = filters.status ?? 'all'
    const byStatus = (cards.data ?? []).filter((card) => status === 'all' || (status === 'active' ? card.status === 'pending' : card.status !== 'pending'))
    return applyKanbanFilters(byStatus, filters, adapter.availableFilters)
  }, [adapter.availableFilters, cards.data, filters])

  const rows = useMemo<OpportunityListRow[]>(() => filtered.map((card: KanbanCard) => {
    const raw = card.raw
    const segurado = raw.segurados as { nome?: string | null } | null
    const ramo = raw.ramos as { nome?: string | null } | null
    const origem = raw.origens as { nome?: string | null } | null
    return {
      id: card.id,
      abertura: (raw.data_abertura as string | null) ?? '',
      titulo: card.title,
      cliente: segurado?.nome ?? (raw.lead_nome as string | null) ?? 'Lead sem nome',
      ramo: ramo?.nome ?? '-',
      origem: origem?.nome ?? '-',
      premio: typeof raw.valor_premio_estimado === 'number' ? raw.valor_premio_estimado : null,
      comissao: typeof raw.valor_comissao_estimada === 'number' ? raw.valor_comissao_estimada : null,
      etapa: card.stageId ? stageNames.get(card.stageId) ?? '-' : '-',
      previsao: (raw.data_fechamento_prevista as string | null) ?? '',
      status: card.status === 'won' ? 'Ganha' : card.status === 'lost' ? 'Perdida' : 'Em andamento',
      responsavel: card.responsavelName ?? '-',
    }
  }), [filtered, stageNames])

  const sorted = useMemo(() => {
    if (!sortConfig) return rows
    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...rows].sort((left, right) => {
      const a = left[sortConfig.key]
      const b = right[sortConfig.key]
      if (typeof a === 'number' || typeof b === 'number') return ((Number(a) || 0) - (Number(b) || 0)) * direction
      return String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR') * direction
    })
  }, [rows, sortConfig])

  const handleSort = (key: SortKey) => setSortConfig((current) => ({ key, direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))

  return (
    <div className="animate-fade-in overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse xl:min-w-0 xl:table-fixed">
          <colgroup>
            <col className="w-[9%] 2xl:w-[7%]" />
            <col className="w-[18%] 2xl:w-[14%]" />
            <col className="w-[15%] 2xl:w-[12%]" />
            <col className="w-[11%] 2xl:w-[8%]" />
            <col className="hidden 2xl:table-column 2xl:w-[7%]" />
            <col className="w-[14%] 2xl:w-[10%]" />
            <col className="hidden 2xl:table-column 2xl:w-[10%]" />
            <col className="w-[11%] 2xl:w-[8%]" />
            <col className="hidden 2xl:table-column 2xl:w-[7%]" />
            <col className="w-[10%] 2xl:w-[8%]" />
            <col className="w-[12%] 2xl:w-[9%]" />
          </colgroup>
          <thead><tr className="border-b border-border-1 bg-bg-surface-2">
            <SortableHeader title="Abertura" sortKey="abertura" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader title="Oportunidade" sortKey="titulo" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader title="Cliente/lead" sortKey="cliente" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader title="Ramo" sortKey="ramo" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader title="Origem" sortKey="origem" sortConfig={sortConfig} onSort={handleSort} className="hidden 2xl:table-cell" />
            <SortableHeader title="Prêmio estimado" sortKey="premio" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader title="Comissão estimada" sortKey="comissao" sortConfig={sortConfig} onSort={handleSort} className="hidden 2xl:table-cell" />
            <SortableHeader title="Etapa" sortKey="etapa" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader title="Previsão" sortKey="previsao" sortConfig={sortConfig} onSort={handleSort} className="hidden 2xl:table-cell" />
            <SortableHeader title="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
            <SortableHeader title="Responsável" sortKey="responsavel" sortConfig={sortConfig} onSort={handleSort} />
          </tr></thead>
          <tbody className="divide-y divide-border-1">
            {cards.isLoading && <tr><td colSpan={11} className="px-6 py-16 text-center text-sm font-semibold text-fg-4">Carregando oportunidades…</td></tr>}
            {!cards.isLoading && sorted.map((row) => (
              <tr key={row.id} tabIndex={0} onClick={() => navigate(`/oportunidades/${row.id}`)} onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/oportunidades/${row.id}`) }} className="cursor-pointer hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary/40">
                <td className="min-w-0 px-2.5 py-3 text-xs font-semibold text-fg-3"><p className="truncate" title={row.abertura ? fmtDate(row.abertura) : undefined}>{row.abertura ? fmtDate(row.abertura) : '—'}</p><p className="mt-0.5 truncate text-[10px] text-fg-4 2xl:hidden">Prev. {row.previsao ? fmtDate(row.previsao) : '—'}</p></td>
                <td className="min-w-0 px-2.5 py-3"><p className="truncate text-sm font-black text-fg-1" title={row.titulo}>{row.titulo}</p><p className="mt-0.5 truncate font-mono text-[10px] text-fg-4"><span className="2xl:hidden">{row.origem} · </span>#{row.id.slice(0, 8).toUpperCase()}</p></td>
                <td className="truncate px-2.5 py-3 text-sm font-semibold text-fg-2" title={row.cliente}>{row.cliente}</td>
                <td className="truncate whitespace-nowrap px-2.5 py-3 text-xs font-bold text-fg-2" title={row.ramo}>{row.ramo}</td>
                <td className="hidden truncate whitespace-nowrap px-2.5 py-3 text-xs font-semibold text-fg-3 2xl:table-cell" title={row.origem}>{row.origem}</td>
                <td className="min-w-0 px-2.5 py-3 font-mono text-xs font-bold text-fg-1"><p className="truncate" title={row.premio != null ? currency.format(row.premio) : undefined}>{row.premio != null ? currency.format(row.premio) : '—'}</p><p className="mt-0.5 truncate text-[10px] font-semibold text-fg-4 2xl:hidden">Com. {row.comissao != null ? currency.format(row.comissao) : '—'}</p></td>
                <td className="hidden truncate whitespace-nowrap px-2.5 py-3 font-mono text-xs font-bold text-fg-1 2xl:table-cell" title={row.comissao != null ? currency.format(row.comissao) : undefined}>{row.comissao != null ? currency.format(row.comissao) : '—'}</td>
                <td className="overflow-hidden px-2.5 py-3"><span className="block truncate rounded-full bg-accent-primary-soft px-2 py-1 text-center text-[10px] font-black uppercase tracking-wide text-accent-primary" title={row.etapa}>{row.etapa}</span></td>
                <td className="hidden truncate whitespace-nowrap px-2.5 py-3 text-xs font-semibold text-fg-3 2xl:table-cell" title={row.previsao ? fmtDate(row.previsao) : undefined}>{row.previsao ? fmtDate(row.previsao) : '—'}</td>
                <td className="truncate whitespace-nowrap px-2.5 py-3" title={row.status}><span className={`text-xs font-black ${row.status === 'Ganha' ? 'text-signal-success' : row.status === 'Perdida' ? 'text-signal-danger' : 'text-accent-primary'}`}>{row.status}</span></td>
                <td className="truncate whitespace-nowrap px-2.5 py-3 text-xs font-semibold text-fg-2" title={row.responsavel}>{row.responsavel}</td>
              </tr>
            ))}
            {!cards.isLoading && sorted.length === 0 && <tr><td colSpan={11} className="px-6 py-16 text-center"><p className="text-sm font-semibold text-fg-3">Nenhuma oportunidade encontrada.</p><p className="mt-1 text-xs text-fg-4">Ajuste os filtros ou cadastre uma nova oportunidade.</p></td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between border-t border-border-1 bg-bg-surface-2 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-fg-4">{rows.length} oportunidade(s)</p>
        <div className="flex items-center gap-1"><button type="button" disabled className="rounded-[6px] border border-border-1 p-1.5 text-fg-4 disabled:opacity-40"><ChevronLeft size={15} /></button><span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-accent-primary text-xs font-black text-fg-on-brand">1</span><button type="button" disabled className="rounded-[6px] border border-border-1 p-1.5 text-fg-4 disabled:opacity-40"><ChevronRight size={15} /></button></div>
      </footer>
    </div>
  )
}
