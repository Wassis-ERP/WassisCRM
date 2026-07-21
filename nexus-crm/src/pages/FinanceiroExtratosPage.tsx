import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, ChevronRight, CheckCircle2, FileClock, FileUp,
  FilterX, Search, ShieldAlert, TriangleAlert,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFinanceiroExtratos } from '../hooks/useFinanceiroExtratos'
import { usePermission } from '../hooks/usePermission'
import {
  filterFinanceiroExtratos,
  type ExtratoFilters,
  type FinanceiroExtratoResumo,
} from '../modules/financeiro/extratosDomain'

const EMPTY_FILTERS: ExtratoFilters = {
  busca: '', filialId: '', seguradoraId: '', origem: '', formato: '',
  processamento: '', conciliacao: '', periodoDe: '', periodoAte: '',
}

const PROCESSING_LABELS = {
  RECEBIDO: 'Recebido', NORMALIZANDO: 'Normalizando', NORMALIZADO: 'Normalizado',
  ERRO: 'Erro', CANCELADO: 'Cancelado',
} as const
const RECONCILIATION_LABELS = {
  NAO_INICIADA: 'Não iniciada', EM_ANALISE: 'Em análise', PARCIAL: 'Parcial',
  CONCILIADO: 'Conciliado', COM_OCORRENCIAS: 'Com ocorrências',
} as const
const ORIGIN_LABELS = { MANUAL: 'Manual', ARQUIVO: 'Arquivo', INTEGRACAO: 'Integração' } as const

const money = (value: number | null, currency = 'BRL') => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: currency || 'BRL',
}).format(value ?? 0)
const date = (value: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))
  : '—'

function options(rows: readonly FinanceiroExtratoResumo[], id: 'filial_id' | 'seguradora_id', label: 'filialNome' | 'seguradoraNome') {
  const map = new Map<string, string>()
  rows.forEach((row) => map.set(row[id], row[label]))
  return Array.from(map, ([value, text]) => ({ value, text })).sort((a, b) => a.text.localeCompare(b.text, 'pt-BR'))
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="min-w-0 space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-xs font-bold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"><option value="">Todos</option>{children}</select></label>
}

function ProcessingBadge({ row }: { row: FinanceiroExtratoResumo }) {
  const error = row.status_processamento === 'ERRO'
  const complete = row.status_processamento === 'NORMALIZADO'
  const Icon = error ? AlertCircle : complete ? CheckCircle2 : FileClock
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${error ? 'bg-signal-danger/12 text-signal-danger' : complete ? 'bg-signal-success/12 text-signal-success' : 'bg-signal-info/12 text-signal-info'}`}><Icon size={12} />{PROCESSING_LABELS[row.status_processamento]}</span>
}

function ConciliationBadge({ row }: { row: FinanceiroExtratoResumo }) {
  const alert = row.status_conciliacao === 'COM_OCORRENCIAS'
  const complete = row.status_conciliacao === 'CONCILIADO'
  const Icon = alert ? TriangleAlert : complete ? CheckCircle2 : FileClock
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${alert ? 'bg-signal-warning/12 text-signal-warning' : complete ? 'bg-signal-success/12 text-signal-success' : 'bg-bg-surface-3 text-fg-2'}`}><Icon size={12} />{RECONCILIATION_LABELS[row.status_conciliacao]}</span>
}

export default function FinanceiroExtratosPage() {
  const { user, activeBranchId } = useAuth()
  const { can } = usePermission('financeiro')
  const branchIds = activeBranchId ? [activeBranchId] : user?.branchIds ?? null
  const query = useFinanceiroExtratos(branchIds)
  const [filters, setFilters] = useState<ExtratoFilters>(EMPTY_FILTERS)
  const rows = useMemo(() => query.data ?? [], [query.data])
  const filtered = useMemo(() => filterFinanceiroExtratos(rows, filters), [filters, rows])
  const hasFilters = Object.values(filters).some(Boolean)
  const totals = useMemo(() => ({
    extratos: filtered.length,
    itens: filtered.reduce((sum, row) => sum + (row.quantidade_itens ?? 0), 0),
    liquido: filtered.reduce((sum, row) => sum + (row.valor_liquido_total ?? 0), 0),
    ocorrencias: filtered.reduce((sum, row) => sum + row.contagens.ocorrenciasAbertas, 0),
  }), [filtered])
  const update = <K extends keyof ExtratoFilters>(key: K, value: ExtratoFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))

  if (!can('read')) return <div className="p-8 text-center"><ShieldAlert className="mx-auto text-signal-warning" size={30} /><h1 className="mt-4 text-xl font-black text-fg-1">Sem permissão para consultar extratos</h1></div>

  return <div className="min-h-full animate-fade-in">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border-1 px-5 pb-5 pt-7 lg:px-7">
      <div><p className="text-xs text-fg-4">Financeiro &rsaquo; Comissões &rsaquo; Extratos</p><div className="mt-2 flex items-start gap-3"><div className="rounded-[6px] bg-accent-primary-soft p-2.5 text-accent-primary"><FileClock size={22} /></div><div><h1 className="text-2xl font-black tracking-tight text-fg-1">Histórico de extratos</h1><p className="mt-1 max-w-3xl text-sm text-fg-3">Demonstrativos recebidos, processamento, conciliação e conferência de totais.</p></div></div></div>
      <div className="flex flex-wrap gap-2"><Link to="/financeiro?visao=comissoes" className="inline-flex items-center gap-2 rounded-full border border-border-1 bg-bg-surface px-4 py-2.5 text-xs font-black text-fg-2 hover:bg-bg-surface-2"><ArrowLeft size={14} />Comissões</Link><Link to="/financeiro/importar-demonstrativo" className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)]"><FileUp size={14} />Importar demonstrativo</Link></div>
    </header>

    {query.isLoading ? <div className="space-y-4 p-6"><div className="h-20 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-32 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-64 animate-pulse rounded-[8px] bg-bg-surface-2" /></div>
      : query.isError ? <div className="p-12 text-center"><AlertCircle className="mx-auto text-signal-danger" size={30} /><h2 className="mt-3 text-lg font-black text-fg-1">Não foi possível carregar os extratos</h2><button type="button" onClick={() => void query.refetch()} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Tentar novamente</button></div>
        : <>
          <section className="grid divide-y divide-border-1 border-b border-border-1 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {[['Extratos no filtro', String(totals.extratos)], ['Itens normalizados', String(totals.itens)], ['Líquido informado', money(totals.liquido)], ['Ocorrências abertas', String(totals.ocorrencias)]].map(([label, value]) => <div key={label} className="px-5 py-4"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className={`mt-1 font-mono text-lg font-black ${label === 'Ocorrências abertas' && totals.ocorrencias ? 'text-signal-warning' : 'text-fg-1'}`}>{value}</p></div>)}
          </section>

          <section className="border-b border-border-1 px-5 py-5 lg:px-7">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <label className="space-y-1.5 sm:col-span-2"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Referência / arquivo</span><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" /><input value={filters.busca} onChange={(event) => update('busca', event.target.value)} placeholder="Número do demonstrativo ou arquivo" className="w-full rounded-[6px] border border-border-1 bg-bg-surface py-2.5 pl-9 pr-3 text-xs font-bold text-fg-1 placeholder:text-fg-3" /></div></label>
              <Select label="Corretora" value={filters.filialId} onChange={(value) => update('filialId', value)}>{options(rows, 'filial_id', 'filialNome').map((item) => <option key={item.value} value={item.value}>{item.text}</option>)}</Select>
              <Select label="Seguradora" value={filters.seguradoraId} onChange={(value) => update('seguradoraId', value)}>{options(rows, 'seguradora_id', 'seguradoraNome').map((item) => <option key={item.value} value={item.value}>{item.text}</option>)}</Select>
              <Select label="Origem" value={filters.origem} onChange={(value) => update('origem', value as ExtratoFilters['origem'])}>{Object.entries(ORIGIN_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</Select>
              <Select label="Formato" value={filters.formato} onChange={(value) => update('formato', value as ExtratoFilters['formato'])}>{['PDF', 'XLS', 'XLSX', 'CSV', 'TXT', 'XML', 'OUTRO'].map((value) => <option key={value} value={value}>{value}</option>)}</Select>
              <Select label="Processamento" value={filters.processamento} onChange={(value) => update('processamento', value as ExtratoFilters['processamento'])}>{Object.entries(PROCESSING_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</Select>
              <Select label="Conciliação" value={filters.conciliacao} onChange={(value) => update('conciliacao', value as ExtratoFilters['conciliacao'])}>{Object.entries(RECONCILIATION_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</Select>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:max-w-2xl">
              <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Período de</span><input type="date" value={filters.periodoDe} onChange={(event) => update('periodoDe', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label>
              <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Período até</span><input type="date" value={filters.periodoAte} onChange={(event) => update('periodoAte', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label>
              <button type="button" disabled={!hasFilters} onClick={() => setFilters(EMPTY_FILTERS)} className="mt-auto inline-flex h-[35px] items-center justify-center gap-2 rounded-[6px] border border-border-1 px-3 text-xs font-black text-fg-3 hover:bg-bg-surface-2 disabled:opacity-40"><FilterX size={14} />Limpar</button>
            </div>
          </section>

          {rows.length === 0 ? <div className="px-6 py-16 text-center"><FileClock className="mx-auto text-fg-4" size={30} /><h2 className="mt-4 text-lg font-black text-fg-1">Nenhum extrato registrado</h2><p className="mt-2 text-sm text-fg-3">Importe um demonstrativo para iniciar o histórico operacional.</p></div>
            : filtered.length === 0 ? <div className="px-6 py-14 text-center"><FilterX className="mx-auto text-fg-4" size={28} /><h2 className="mt-3 text-lg font-black text-fg-1">Nenhum extrato corresponde aos filtros</h2><button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Limpar filtros</button></div>
              : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] border-collapse text-left"><thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3"><tr><th className="px-5 py-3">Referência / arquivo</th><th className="px-3 py-3">Contexto</th><th className="px-3 py-3">Período</th><th className="px-3 py-3">Processamento</th><th className="px-3 py-3">Conciliação</th><th className="px-3 py-3 text-right">Itens</th><th className="px-3 py-3 text-right">Líquido informado</th><th className="px-3 py-3 text-right">Soma dos itens</th><th className="px-3 py-3 text-right">Diferença</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-border-1">
                {filtered.map((row) => <tr key={row.id} className="hover:bg-bg-surface-2/70"><td className="px-5 py-3"><p className="font-mono text-xs font-black text-fg-1">{row.identificacao_externa ?? 'Sem referência externa'}</p><p className="mt-1 max-w-[220px] truncate text-[11px] text-fg-3">{row.arquivo_nome ?? 'Origem sem arquivo'} · {row.origem_formato ?? row.origem_tipo}</p></td><td className="px-3 py-3"><p className="text-xs font-black text-fg-1">{row.seguradoraNome}</p><p className="mt-1 text-[11px] text-fg-3">{row.filialNome}</p></td><td className="px-3 py-3 font-mono text-xs font-bold text-fg-1">{date(row.periodo_inicio ?? row.competencia)}<span className="block mt-1 text-[10px] text-fg-3">até {date(row.periodo_fim ?? row.competencia)}</span></td><td className="px-3 py-3"><ProcessingBadge row={row} /><p className="mt-1 text-[10px] text-fg-3">Tentativa {row.tentativa_processamento}</p></td><td className="px-3 py-3"><ConciliationBadge row={row} />{row.contagens.ocorrenciasAbertas > 0 && <p className="mt-1 text-[10px] font-bold text-signal-warning">{row.contagens.ocorrenciasAbertas} aberta(s)</p>}</td><td className="px-3 py-3 text-right font-mono text-xs font-black text-fg-1">{row.quantidade_itens ?? row.contagens.prontos + row.contagens.pendentes}</td><td className="px-3 py-3 text-right font-mono text-xs font-black text-fg-1">{money(row.valor_liquido_total, row.moeda ?? 'BRL')}</td><td className="px-3 py-3 text-right font-mono text-xs font-bold text-fg-2">{money(row.somaItensLiquido, row.moeda ?? 'BRL')}</td><td className={`px-3 py-3 text-right font-mono text-xs font-black ${row.totalizacaoCompativel ? 'text-signal-success' : 'text-signal-warning'}`}>{money(row.diferencaTotalizacao, row.moeda ?? 'BRL')}</td><td className="px-5 py-3 text-right"><Link to={`/financeiro/extratos/${row.id}`} className="inline-flex items-center gap-1 rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary hover:bg-accent-primary-soft">Conferir<ChevronRight size={12} /></Link></td></tr>)}
              </tbody></table></div>}
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border-1 bg-bg-surface-2 px-5 py-3 text-xs font-bold text-fg-3 lg:px-7"><span>{filtered.length} de {rows.length} extratos</span><span>Total informado, soma dos itens e baixa permanecem separados</span></footer>
        </>}
  </div>
}
