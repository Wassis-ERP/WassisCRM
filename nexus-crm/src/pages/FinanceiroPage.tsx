import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle, ArrowUpRight, CalendarCheck2, CheckCircle2, ChevronRight,
  CircleDollarSign, FilterX, HandCoins, Loader2, ReceiptText, RotateCcw,
  Search, ShieldAlert, UsersRound, WalletCards,
} from 'lucide-react'
import PaymentModal from '../components/financeiro/PaymentModal'
import CommissionsView from '../components/financeiro/CommissionsView'
import { useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import { useAuth } from '../hooks/useAuth'
import {
  useConfirmarPagamentoParcela,
  useDesfazerPagamentoParcela,
  useFinanceiroParcelas,
} from '../hooks/useFinanceiroParcelas'
import { usePermission } from '../hooks/usePermission'
import {
  filterFinanceiroParcelas,
  type FinanceiroParcela,
  type ParcelaFilters,
} from '../modules/financeiro/parcelasDomain'
import type { ParcelaStatus } from '../types/database'

type FinanceView = 'parcelas' | 'comissoes' | 'repasses' | 'cobrancas'

const EMPTY_FILTERS: ParcelaFilters = {
  filialId: '', seguradoId: '', seguradoraId: '', ramoId: '', documento: '',
  vencimentoDe: '', vencimentoAte: '', status: '',
}

const TABS: Array<{ id: FinanceView; label: string; icon: typeof ReceiptText; phase: string }> = [
  { id: 'parcelas', label: 'Parcelas', icon: ReceiptText, phase: '3.1' },
  { id: 'comissoes', label: 'Comissões', icon: CircleDollarSign, phase: '3.3' },
  { id: 'repasses', label: 'Repasses', icon: HandCoins, phase: '3.5' },
  { id: 'cobrancas', label: 'Cobranças', icon: UsersRound, phase: '3.6' },
]

const STATUS_META: Record<ParcelaStatus, { label: string; className: string }> = {
  em_aberto: { label: 'Em aberto', className: 'bg-accent-primary-soft text-accent-primary' },
  vencida: { label: 'Vencida', className: 'bg-signal-danger/12 text-signal-danger' },
  paga: { label: 'Paga', className: 'bg-signal-success/12 text-signal-success' },
  cancelada: { label: 'Cancelada', className: 'bg-bg-surface-3 text-fg-3' },
  estornada: { label: 'Estornada', className: 'bg-signal-warning/14 text-signal-warning' },
}

const money = (value: number | null) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format(value ?? 0)
const date = (value: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))
  : '—'

function uniqueOptions(rows: FinanceiroParcela[], id: keyof FinanceiroParcela, label: keyof FinanceiroParcela) {
  const map = new Map<string, string>()
  rows.forEach((row) => {
    const value = row[id]
    const text = row[label]
    if (typeof value === 'string' && typeof text === 'string') map.set(value, text)
  })
  return Array.from(map, ([value, text]) => ({ value, text })).sort((a, b) => a.text.localeCompare(b.text, 'pt-BR'))
}

function StatusBadge({ row }: { row: FinanceiroParcela }) {
  const meta = STATUS_META[row.statusEfetivo]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${meta.className}`}>
    {row.statusEfetivo === 'paga' && <CheckCircle2 size={12} />}
    {row.statusEfetivo === 'vencida' && <AlertCircle size={12} />}
    {meta.label}{row.statusEfetivo === 'vencida' && row.diasVencidos > 0 ? ` · ${row.diasVencidos}d` : ''}
  </span>
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; text: string }> }) {
  return <label className="min-w-0 space-y-1.5">
    <span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-xs font-bold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20">
      <option value="">Todos</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.text}</option>)}
    </select>
  </label>
}

function FutureView({ view, onBack }: { view: Exclude<FinanceView, 'parcelas' | 'comissoes'>; onBack: () => void }) {
  const tab = TABS.find((item) => item.id === view) ?? TABS[1]
  const Icon = tab.icon
  const message = view === 'cobrancas'
    ? 'A abertura e o kanban serão reconstruídos por parcela_id no recorte 3.6. Nenhum dado é gravado na estrutura legada por oportunidade.'
    : `${tab.label} já faz parte da arquitetura deste cockpit e será habilitada no recorte ${tab.phase}.`
  return <section className="flex min-h-[360px] items-center justify-center border-t border-border-1 bg-bg-surface px-6 py-14">
    <div className="max-w-xl text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent-primary-soft text-accent-primary"><Icon size={22} /></div>
      <h2 className="mt-5 text-xl font-black text-fg-1">{tab.label} na mesma superfície</h2>
      <p className="mx-auto mt-2 max-w-[62ch] text-sm leading-relaxed text-fg-3">{message}</p>
      <button type="button" onClick={onBack} className="mt-6 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover">Voltar para Parcelas</button>
    </div>
  </section>
}

export default function FinanceiroPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedView = searchParams.get('visao') as FinanceView | null
  const activeView: FinanceView = TABS.some((tab) => tab.id === requestedView) ? requestedView ?? 'parcelas' : 'parcelas'
  const { user, activeBranchId } = useAuth()
  const { can } = usePermission('financeiro')
  const canRead = can('read')
  const canUpdate = can('update')
  const branchIds = activeBranchId ? [activeBranchId] : user?.branchIds ?? null
  const query = useFinanceiroParcelas(branchIds)
  const confirmPayment = useConfirmarPagamentoParcela()
  const reversePayment = useDesfazerPagamentoParcela()
  const { confirm, notify } = useSystemFeedback()
  const [filters, setFilters] = useState<ParcelaFilters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<string[]>([])
  const [paymentRows, setPaymentRows] = useState<FinanceiroParcela[] | null>(null)
  const rows = useMemo(() => query.data ?? [], [query.data])
  const filtered = useMemo(() => filterFinanceiroParcelas(rows, filters), [filters, rows])
  const selectedRows = useMemo(() => rows.filter((row) => selected.includes(row.id)), [rows, selected])
  const confirmEligible = selectedRows.length > 0 && selectedRows.every((row) => ['em_aberto', 'vencida'].includes(row.statusEfetivo))
  const reverseEligible = selectedRows.length > 0 && selectedRows.every((row) => row.statusEfetivo === 'paga')
  const allVisibleSelected = filtered.length > 0 && filtered.every((row) => selected.includes(row.id))
  const hasFilters = Object.values(filters).some(Boolean)

  const totals = useMemo(() => ({
    previsto: rows.reduce((sum, row) => sum + (row.valor ?? 0), 0),
    pago: rows.filter((row) => row.statusEfetivo === 'paga').reduce((sum, row) => sum + (row.valor_pago ?? 0), 0),
    vencido: rows.filter((row) => row.statusEfetivo === 'vencida').reduce((sum, row) => sum + (row.valor ?? 0), 0),
    abertas: rows.filter((row) => ['em_aberto', 'vencida'].includes(row.statusEfetivo)).length,
  }), [rows])

  const setView = (view: FinanceView) => setSearchParams(view === 'parcelas' ? {} : { visao: view })
  const updateFilter = <K extends keyof ParcelaFilters>(key: K, value: ParcelaFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))

  const handleConfirm = async (dataPagamento: string, valorPago?: number) => {
    if (!paymentRows) return
    try {
      const result = await confirmPayment.mutateAsync({ ids: paymentRows.map((row) => row.id), dataPagamento, valorPago })
      setPaymentRows(null)
      setSelected([])
      notify({ title: result.changed === 1 ? 'Pagamento confirmado' : `${result.changed} pagamentos confirmados`, description: 'O valor previsto foi preservado e a operação foi auditada.', tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível confirmar', description: error instanceof Error ? error.message : 'Falha inesperada.', tone: 'danger' })
    }
  }

  const handleReverse = async (targets: FinanceiroParcela[]) => {
    const accepted = await confirm({
      title: targets.length === 1 ? 'Desfazer pagamento?' : `Desfazer ${targets.length} pagamentos?`,
      description: 'Os campos de liquidação serão limpos. O valor previsto e a origem contratual serão preservados.',
      confirmLabel: 'Desfazer pagamento', tone: 'warning',
    })
    if (!accepted) return
    try {
      const result = await reversePayment.mutateAsync(targets.map((row) => row.id))
      setSelected([])
      notify({ title: result.changed === 1 ? 'Pagamento desfeito' : `${result.changed} pagamentos desfeitos`, description: 'As parcelas voltaram ao status correspondente ao vencimento.', tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível desfazer', description: error instanceof Error ? error.message : 'Falha inesperada.', tone: 'danger' })
    }
  }

  if (!canRead) return <div className="p-6 lg:p-8"><div className="mx-auto mt-16 max-w-lg rounded-[12px] border border-border-1 bg-bg-surface p-8 text-center"><ShieldAlert className="mx-auto text-signal-warning" size={30} /><h1 className="mt-4 text-xl font-black text-fg-1">Sem permissão para acessar o Financeiro</h1><p className="mt-2 text-sm text-fg-3">Solicite acesso de leitura ao módulo Financeiro na corretora selecionada.</p></div></div>

  return <div className="min-h-full animate-fade-in">
    <div className="min-h-full w-full overflow-hidden">
      <header className="px-5 pb-5 pt-7 lg:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2 text-accent-primary"><WalletCards size={20} /><span className="text-[10px] font-black uppercase tracking-wider">Financeiro securitário</span></div><h1 className="mt-1 text-2xl font-black tracking-tight text-fg-1">Cockpit Financeiro</h1><p className="mt-1 text-sm text-fg-3">Operação dos fatos materializados pelas apólices e documentos.</p></div>
          {!canUpdate && <span className="inline-flex items-center gap-2 rounded-full bg-signal-warning/12 px-3 py-1.5 text-xs font-black text-signal-warning"><ShieldAlert size={14} />Somente leitura</span>}
        </div>
        <nav aria-label="Visões do Financeiro" className="mt-5 flex flex-wrap gap-1 rounded-[8px] bg-bg-surface-3 p-1">
          {TABS.map((tab) => { const Icon = tab.icon; const active = tab.id === activeView; return <button key={tab.id} type="button" onClick={() => setView(tab.id)} className={`inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black transition-colors ${active ? 'bg-bg-surface text-accent-primary shadow-[var(--shadow-1)]' : 'text-fg-3 hover:bg-bg-surface-2 hover:text-fg-1'}`}><Icon size={15} />{tab.label}{tab.id !== 'parcelas' && tab.id !== 'comissoes' && <span className="text-[9px] font-bold text-fg-4">{tab.phase}</span>}</button> })}
        </nav>
      </header>

      {activeView === 'comissoes' ? <CommissionsView branchIds={branchIds} canUpdate={canUpdate} /> : activeView !== 'parcelas' ? <FutureView view={activeView} onBack={() => setView('parcelas')} /> : <>
        {query.isLoading ? <div className="space-y-4 p-6"><div className="h-20 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-28 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-64 animate-pulse rounded-[8px] bg-bg-surface-2" /></div>
        : query.isError ? <div className="p-8 text-center"><AlertCircle className="mx-auto text-signal-danger" size={28} /><h2 className="mt-3 text-lg font-black text-fg-1">Não foi possível carregar as parcelas</h2><p className="mt-1 text-sm text-fg-3">{query.error instanceof Error ? query.error.message : 'Tente novamente.'}</p><button type="button" onClick={() => void query.refetch()} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Tentar novamente</button></div>
        : <>
          <section className="grid divide-y divide-border-1 border-b border-border-1 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {[['Carteira prevista', money(totals.previsto)], ['Recebido', money(totals.pago)], ['Vencido', money(totals.vencido)], ['Parcelas em acompanhamento', String(totals.abertas)]].map(([label, value]) => <div key={label} className="px-5 py-4"><p className="text-[10px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className={`mt-1 font-mono text-lg font-black ${label === 'Vencido' ? 'text-signal-danger' : 'text-fg-1'}`}>{value}</p></div>)}
          </section>

          <section className="border-b border-border-1 px-5 py-5 lg:px-7">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <Select label="Corretora" value={filters.filialId} onChange={(value) => updateFilter('filialId', value)} options={uniqueOptions(rows, 'filialId', 'filialNome')} />
              <Select label="Segurado" value={filters.seguradoId} onChange={(value) => updateFilter('seguradoId', value)} options={uniqueOptions(rows, 'seguradoId', 'seguradoNome')} />
              <Select label="Seguradora" value={filters.seguradoraId} onChange={(value) => updateFilter('seguradoraId', value)} options={uniqueOptions(rows, 'seguradoraId', 'seguradoraNome')} />
              <Select label="Ramo" value={filters.ramoId} onChange={(value) => updateFilter('ramoId', value)} options={uniqueOptions(rows, 'ramoId', 'ramoNome')} />
              <label className="space-y-1.5 xl:col-span-2"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Proposta / apólice</span><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" /><input value={filters.documento} onChange={(event) => updateFilter('documento', event.target.value)} placeholder="Número do documento" className="w-full rounded-[6px] border border-border-1 bg-bg-surface py-2.5 pl-9 pr-3 text-xs font-bold text-fg-1 placeholder:text-fg-3 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20" /></div></label>
              <Select label="Status" value={filters.status} onChange={(value) => updateFilter('status', value as ParcelaFilters['status'])} options={Object.entries(STATUS_META).map(([value, meta]) => ({ value, text: meta.label }))} />
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasFilters} className="mt-auto inline-flex h-[38px] items-center justify-center gap-2 rounded-[6px] border border-border-1 px-3 text-xs font-black text-fg-3 hover:bg-bg-surface-2 disabled:opacity-40"><FilterX size={14} />Limpar</button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-md">
              <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Vencimento de</span><input type="date" value={filters.vencimentoDe} onChange={(event) => updateFilter('vencimentoDe', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label>
              <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Vencimento até</span><input type="date" value={filters.vencimentoAte} onChange={(event) => updateFilter('vencimentoAte', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label>
            </div>
          </section>

          {selectedRows.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b border-border-1 bg-accent-primary-soft px-5 py-3 lg:px-7"><span className="text-sm font-black text-accent-primary">{selectedRows.length} selecionada{selectedRows.length > 1 ? 's' : ''}</span><button type="button" disabled={!canUpdate || !confirmEligible} title={!confirmEligible ? 'Selecione apenas parcelas em aberto ou vencidas.' : undefined} onClick={() => setPaymentRows(selectedRows)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand disabled:opacity-40"><CalendarCheck2 size={14} />Confirmar pagamentos</button><button type="button" disabled={!canUpdate || !reverseEligible} title={!reverseEligible ? 'Selecione apenas parcelas pagas.' : undefined} onClick={() => void handleReverse(selectedRows)} className="inline-flex items-center gap-2 rounded-full border border-signal-warning/40 bg-bg-surface px-4 py-2 text-xs font-black text-signal-warning disabled:opacity-40"><RotateCcw size={14} />Desfazer pagamentos</button><button type="button" onClick={() => setSelected([])} className="ml-auto text-xs font-bold text-fg-3 hover:text-fg-1">Limpar seleção</button></div>}

          {rows.length === 0 ? <div className="px-6 py-16 text-center"><ReceiptText className="mx-auto text-fg-4" size={30} /><h2 className="mt-4 text-lg font-black text-fg-1">Nenhuma parcela materializada</h2><p className="mx-auto mt-2 max-w-lg text-sm text-fg-3">Gere as agendas no documento da apólice para que as parcelas apareçam neste cockpit.</p><Link to="/apolices" className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Abrir apólices<ArrowUpRight size={15} /></Link></div>
          : filtered.length === 0 ? <div className="px-6 py-14 text-center"><FilterX className="mx-auto text-fg-4" size={28} /><h2 className="mt-3 text-lg font-black text-fg-1">Nenhuma parcela corresponde aos filtros</h2><button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Limpar filtros</button></div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[1080px] border-collapse text-left"><thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3"><tr><th className="w-12 px-5 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? selected.filter((id) => !filtered.some((row) => row.id === id)) : Array.from(new Set([...selected, ...filtered.map((row) => row.id)])))} aria-label="Selecionar parcelas visíveis" /></th><th className="px-3 py-3">Corretora / segurado</th><th className="px-3 py-3">Origem</th><th className="px-3 py-3">Seguradora / ramo</th><th className="px-3 py-3">Vencimento</th><th className="px-3 py-3 text-right">Previsto</th><th className="px-3 py-3 text-right">Pago</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-border-1">
            {filtered.map((row) => <tr key={row.id} className="group hover:bg-bg-surface-2/70"><td className="px-5 py-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} aria-label={`Selecionar parcela ${row.numero ?? ''} de ${row.seguradoNome}`} /></td><td className="px-3 py-3"><p className="text-sm font-black text-fg-1">{row.seguradoNome}</p><p className="mt-0.5 text-[11px] text-fg-3">{row.filialNome}</p></td><td className="px-3 py-3"><Link to={`/apolices/${row.apoliceId}?documento=${row.proposta_id}`} className="inline-flex items-center gap-1 text-sm font-black text-accent-primary hover:underline">{row.documentoReferencia}<ChevronRight size={13} /></Link><p className="mt-0.5 font-mono text-[11px] text-fg-3">Apólice {row.apoliceNumero ?? 'em emissão'} · Parcela {row.numero ?? '—'}</p></td><td className="px-3 py-3"><p className="text-sm font-bold text-fg-1">{row.seguradoraNome}</p><p className="mt-0.5 text-[11px] text-fg-3">{row.ramoNome}</p></td><td className="px-3 py-3 font-mono text-sm font-bold text-fg-1">{date(row.vencimento)}</td><td className="px-3 py-3 text-right font-mono text-sm font-black text-fg-1">{money(row.valor)}</td><td className="px-3 py-3 text-right font-mono text-sm font-bold text-fg-2">{row.valor_pago === null ? '—' : money(row.valor_pago)}</td><td className="px-3 py-3"><StatusBadge row={row} /></td><td className="px-5 py-3"><div className="flex justify-end gap-1.5">{['em_aberto', 'vencida'].includes(row.statusEfetivo) && <button type="button" disabled={!canUpdate} onClick={() => setPaymentRows([row])} className="rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary hover:bg-accent-primary-soft disabled:opacity-40">Confirmar</button>}{row.statusEfetivo === 'paga' && <button type="button" disabled={!canUpdate} onClick={() => void handleReverse([row])} className="rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-signal-warning hover:bg-signal-warning/10 disabled:opacity-40">Desfazer</button>}{row.statusEfetivo === 'vencida' && <button type="button" onClick={() => setSearchParams({ visao: 'cobrancas', parcela: row.id })} className="rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-fg-2 hover:bg-bg-surface-3">Abrir cobrança</button>}</div></td></tr>)}
          </tbody></table></div>}
          <footer className="flex items-center justify-between border-t border-border-1 bg-bg-surface-2 px-5 py-3 text-xs font-bold text-fg-3 lg:px-7"><span>{filtered.length} de {rows.length} parcelas</span><span>Valores previstos permanecem imutáveis após a baixa</span></footer>
        </>}
      </>}
    </div>
    {paymentRows && <PaymentModal rows={paymentRows} isSaving={confirmPayment.isPending} onClose={() => setPaymentRows(null)} onConfirm={(dataPagamento, valorPago) => void handleConfirm(dataPagamento, valorPago)} />}
    {(confirmPayment.isPending || reversePayment.isPending) && <div className="pointer-events-none fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-fg-1 px-4 py-2 text-xs font-black text-bg-surface shadow-[var(--shadow-2)]"><Loader2 size={14} className="animate-spin" />Atualizando parcelas</div>}
  </div>
}
