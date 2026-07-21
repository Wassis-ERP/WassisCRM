import { useMemo, useState } from 'react'
import {
  AlertCircle, ArrowUpRight, CheckCircle2, Download, FileDown, FilterX,
  HandCoins, Loader2, ReceiptText, Search, ShieldAlert, XCircle,
} from 'lucide-react'
import {
  useCancelarRepasseRecibo,
  useEmitirRepasseRecibos,
  useFinanceiroRepasses,
} from '../../hooks/useFinanceiroRepasses'
import {
  filterFinanceiroRepasses,
  getRepasseReceipt,
  type EmitirRepasseRecibosResult,
  type FinanceiroRepasse,
  type RepasseFilters,
  type RepasseReciboDetalhe,
} from '../../modules/financeiro/repasseDomain'
import {
  createRepasseReportExcel, createRepasseReportPdf, downloadExport,
} from '../../modules/financeiro/financialExports'
import type { RepasseStatus } from '../../types/database'
import { useSystemFeedback } from '../feedback/systemFeedbackContext'
import RepasseReceiptDetailsModal from './RepasseReceiptDetailsModal'
import RepasseReceiptModal from './RepasseReceiptModal'

interface RepassesViewProps {
  branchIds: readonly string[] | null
  canUpdate: boolean
}

const EMPTY_FILTERS: RepasseFilters = {
  filialId: '', beneficiarioId: '', papel: '', seguradoId: '', seguradoraId: '',
  ramoId: '', documento: '', comissaoId: '', origem: '', periodo: 'LIBERADO',
  dataDe: '', dataAte: '', status: '',
}

const STATUS_META: Record<RepasseStatus, { label: string; className: string }> = {
  PREVISTO: { label: 'Previsto', className: 'bg-bg-surface-3 text-fg-3' },
  LIBERADO: { label: 'Liberado', className: 'bg-accent-primary-soft text-accent-primary' },
  PAGO: { label: 'Pago', className: 'bg-signal-success/12 text-signal-success' },
  CANCELADO: { label: 'Cancelado', className: 'bg-signal-danger/12 text-signal-danger' },
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`)) : '—'

function options(rows: readonly FinanceiroRepasse[], value: (row: FinanceiroRepasse) => string | null, label: (row: FinanceiroRepasse) => string) {
  return Array.from(new Map(rows.map((row) => [value(row), label(row)]).filter((entry): entry is [string, string] => Boolean(entry[0]))), ([optionValue, optionLabel]) => ({ value: optionValue, label: optionLabel }))
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'))
}

function Select({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: Array<{ value: string; label: string }> }) {
  return <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-xs font-bold text-fg-1"><option value="">Todos</option>{items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
}

function StatusBadge({ row }: { row: FinanceiroRepasse }) {
  const meta = row.status ? STATUS_META[row.status] : { label: 'Não informado', className: 'bg-bg-surface-3 text-fg-3' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${meta.className}`}>{meta.label}</span>
}

export default function RepassesView({ branchIds, canUpdate }: RepassesViewProps) {
  const query = useFinanceiroRepasses(branchIds)
  const issue = useEmitirRepasseRecibos()
  const cancel = useCancelarRepasseRecibo()
  const { notify } = useSystemFeedback()
  const [filters, setFilters] = useState<RepasseFilters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<string[]>([])
  const [issueRows, setIssueRows] = useState<FinanceiroRepasse[] | null>(null)
  const [result, setResult] = useState<EmitirRepasseRecibosResult | null>(null)
  const [detail, setDetail] = useState<RepasseReciboDetalhe | null>(null)
  const rows = useMemo(() => query.data ?? [], [query.data])
  const filtered = useMemo(() => filterFinanceiroRepasses(rows, filters), [filters, rows])
  const selectedRows = useMemo(() => rows.filter((row) => selected.includes(row.id)), [rows, selected])
  const eligibleVisible = useMemo(() => filtered.filter((row) => row.elegivel), [filtered])
  const allEligibleSelected = eligibleVisible.length > 0 && eligibleVisible.every((row) => selected.includes(row.id))
  const hasFilters = Object.entries(filters).some(([key, value]) => key === 'periodo' ? value !== 'LIBERADO' : Boolean(value))

  const totals = useMemo(() => ({
    quantidade: filtered.length,
    previsto: filtered.reduce((total, row) => total + (row.valor_previsto ?? 0), 0),
    liberado: filtered.filter((row) => row.status === 'LIBERADO').reduce((total, row) => total + (row.valor_previsto ?? 0), 0),
    pago: filtered.filter((row) => row.status === 'PAGO').reduce((total, row) => total + (row.valor_pago ?? 0), 0),
    pendente: filtered.filter((row) => ['PREVISTO', 'LIBERADO'].includes(row.status ?? '')).reduce((total, row) => total + (row.valor_previsto ?? 0), 0),
    credito: filtered.filter((row) => (row.valor_previsto ?? 0) > 0).reduce((total, row) => total + (row.valor_previsto ?? 0), 0),
    debito: filtered.filter((row) => (row.valor_previsto ?? 0) < 0).reduce((total, row) => total + (row.valor_previsto ?? 0), 0),
  }), [filtered])

  const updateFilter = <K extends keyof RepasseFilters>(key: K, value: RepasseFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))
  const openReceipt = (receiptId: string) => {
    const current = getRepasseReceipt(receiptId)
    if (current) setDetail(current)
    else notify({ title: 'Recibo não encontrado', description: 'Atualize a visão e tente novamente.', tone: 'danger' })
  }

  const issueReceipts = async (command: Parameters<typeof issue.mutateAsync>[0]) => {
    try {
      const response = await issue.mutateAsync(command)
      setIssueRows(null)
      setSelected([])
      setResult(response)
      notify({
        title: response.falhos ? 'Lote concluído parcialmente' : 'Recibos emitidos',
        description: `${response.emitidos} emitido(s), ${response.idempotentes} já processado(s) e ${response.falhos} falho(s).`,
        tone: response.falhos ? 'warning' : 'success',
      })
    } catch (error) {
      notify({ title: 'Não foi possível emitir', description: error instanceof Error ? error.message : 'Falha inesperada.', tone: 'danger' })
    }
  }

  const cancelReceipt = async (justification: string, key: string) => {
    if (!detail) return
    try {
      const response = await cancel.mutateAsync({ reciboId: detail.recibo.id, justificativa: justification, chaveCancelamento: key })
      setDetail(getRepasseReceipt(response.recibo.id))
      setSelected([])
      notify({ title: response.idempotent ? 'Cancelamento já processado' : 'Recibo cancelado', description: `${response.repasseIds.length} repasse(s) voltaram a LIBERADO.`, tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível cancelar', description: error instanceof Error ? error.message : 'Falha inesperada.', tone: 'danger' })
    }
  }

  if (query.isLoading) return <div className="space-y-4 p-6"><div className="h-20 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-36 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-64 animate-pulse rounded-[8px] bg-bg-surface-2" /></div>
  if (query.isError) return <div className="p-8 text-center"><AlertCircle className="mx-auto text-signal-danger" size={28} /><h2 className="mt-3 text-lg font-black text-fg-1">Não foi possível carregar os repasses</h2><p className="mt-1 text-sm text-fg-3">{query.error instanceof Error ? query.error.message : 'Tente novamente.'}</p><button type="button" onClick={() => void query.refetch()} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Tentar novamente</button></div>

  return <>
    <section className="grid divide-y divide-border-1 border-b border-border-1 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
      {[['Repasses filtrados', String(totals.quantidade)], ['Valor liberado', money(totals.liberado)], ['Valor pago', money(totals.pago)], ['Saldo pendente', money(totals.pendente)]].map(([label, value]) => <div key={label} className="px-5 py-4"><p className="text-[10px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className="mt-1 font-mono text-lg font-black text-fg-1">{value}</p></div>)}
    </section>
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border-1 bg-bg-surface-2 px-5 py-3 text-xs font-bold text-fg-3 lg:px-7"><span>Previsto <strong className="font-mono text-fg-1">{money(totals.previsto)}</strong></span><span>Créditos <strong className="font-mono text-signal-success">{money(totals.credito)}</strong></span><span>Débitos <strong className="font-mono text-signal-warning">{money(totals.debito)}</strong></span><span className="ml-auto">Positivos e negativos geram recibos separados</span></div>

    <section className="border-b border-border-1 px-5 py-5 lg:px-7">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Select label="Corretora" value={filters.filialId} onChange={(value) => updateFilter('filialId', value)} items={options(rows, (row) => row.filialId, (row) => row.filialNome)} />
        <Select label="Beneficiário" value={filters.beneficiarioId} onChange={(value) => updateFilter('beneficiarioId', value)} items={options(rows, (row) => row.beneficiario_id, (row) => row.beneficiarioNome)} />
        <Select label="Papel" value={filters.papel} onChange={(value) => updateFilter('papel', value)} items={options(rows, (row) => row.papel_beneficiario, (row) => row.papel_beneficiario ?? 'Não informado')} />
        <Select label="Segurado" value={filters.seguradoId} onChange={(value) => updateFilter('seguradoId', value)} items={options(rows, (row) => row.seguradoId, (row) => row.seguradoNome)} />
        <Select label="Seguradora" value={filters.seguradoraId} onChange={(value) => updateFilter('seguradoraId', value)} items={options(rows, (row) => row.seguradoraId, (row) => row.seguradoraNome)} />
        <Select label="Ramo" value={filters.ramoId} onChange={(value) => updateFilter('ramoId', value)} items={options(rows, (row) => row.ramoId, (row) => row.ramoNome)} />
        <Select label="Origem" value={filters.origem} onChange={(value) => updateFilter('origem', value as RepasseFilters['origem'])} items={[{ value: 'REGRA', label: 'Regra' }, { value: 'MANUAL', label: 'Manual' }]} />
        <Select label="Status" value={filters.status} onChange={(value) => updateFilter('status', value as RepasseFilters['status'])} items={Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <label className="space-y-1.5 xl:col-span-2"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Proposta / apólice / comissão</span><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" /><input value={filters.documento} onChange={(event) => updateFilter('documento', event.target.value)} placeholder="Número, segurado ou comissão" className="w-full rounded-[6px] border border-border-1 bg-bg-surface py-2.5 pl-9 pr-3 text-xs font-bold text-fg-1 placeholder:text-fg-3" /></div></label>
        <Select label="Período por" value={filters.periodo} onChange={(value) => updateFilter('periodo', value as RepasseFilters['periodo'])} items={[{ value: 'PREVISTO', label: 'Previsto em' }, { value: 'LIBERADO', label: 'Liberado em' }, { value: 'PAGO', label: 'Pago em' }]} />
        <Select label="Comissão" value={filters.comissaoId} onChange={(value) => updateFilter('comissaoId', value)} items={options(rows, (row) => row.comissao_id, (row) => `Comissão #${row.comissaoNumero ?? '—'}`)} />
        <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Data de</span><input type="date" value={filters.dataDe} onChange={(event) => updateFilter('dataDe', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label>
        <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Data até</span><input type="date" value={filters.dataAte} onChange={(event) => updateFilter('dataAte', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label>
        <div className="flex items-end gap-2 xl:col-span-2"><button type="button" onClick={() => downloadExport(createRepasseReportPdf(filtered))} disabled={filtered.length === 0} className="inline-flex h-[38px] items-center gap-2 rounded-[6px] border border-border-1 px-3 text-xs font-black text-fg-2 hover:bg-bg-surface-2 disabled:opacity-40"><FileDown size={14} />Relatório PDF</button><button type="button" onClick={() => downloadExport(createRepasseReportExcel(filtered))} disabled={filtered.length === 0} className="inline-flex h-[38px] items-center gap-2 rounded-[6px] border border-border-1 px-3 text-xs font-black text-fg-2 hover:bg-bg-surface-2 disabled:opacity-40"><Download size={14} />Relatório Excel</button><button type="button" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasFilters} className="ml-auto inline-flex h-[38px] items-center gap-2 rounded-[6px] border border-border-1 px-3 text-xs font-black text-fg-3 hover:bg-bg-surface-2 disabled:opacity-40"><FilterX size={14} />Limpar</button></div>
      </div>
      <p className="mt-3 text-[11px] font-bold text-fg-3">Relatórios são somente leitura e nunca alteram o status dos repasses.</p>
    </section>

    {result && <section className="border-b border-border-1 bg-bg-surface-2 px-5 py-4 lg:px-7" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black text-fg-1">Resultado do lote</p><p className="mt-0.5 text-xs text-fg-3">{result.emitidos} emitido(s) · {result.idempotentes} idempotente(s) · {result.falhos} falho(s)</p></div><button type="button" onClick={() => setResult(null)} className="text-xs font-black text-fg-3 hover:text-fg-1">Ocultar resultado</button></div><div className="mt-3 grid gap-2 lg:grid-cols-2">{result.grupos.map((group) => <div key={group.grupo} className="flex items-start gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-3">{group.status === 'FALHOU' ? <XCircle size={17} className="mt-0.5 shrink-0 text-signal-danger" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-signal-success" />}<div className="min-w-0 flex-1"><p className="text-xs font-black text-fg-1">{group.numero ?? `${group.beneficiarioNome} · ${group.sentido}`}</p><p className="mt-0.5 text-[11px] leading-relaxed text-fg-3">{group.mensagem}</p></div>{group.reciboId && <button type="button" onClick={() => openReceipt(group.reciboId!)} className="shrink-0 text-[11px] font-black text-accent-primary hover:underline">Abrir recibo</button>}</div>)}</div></section>}

    {selectedRows.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b border-border-1 bg-accent-primary-soft px-5 py-3 lg:px-7"><span className="text-sm font-black text-accent-primary">{selectedRows.length} selecionado(s) · {money(selectedRows.reduce((total, row) => total + (row.valor_previsto ?? 0), 0))}</span><button type="button" disabled={!canUpdate || selectedRows.some((row) => !row.elegivel)} title={selectedRows.some((row) => !row.elegivel) ? 'Selecione somente repasses liberados e sem recibo ativo.' : undefined} onClick={() => setIssueRows(selectedRows)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand disabled:opacity-40"><ReceiptText size={14} />Emitir recibo e marcar como pago</button><button type="button" onClick={() => setSelected([])} className="ml-auto text-xs font-black text-fg-3 hover:text-fg-1">Limpar seleção</button></div>}

    {rows.length === 0 ? <div className="px-6 py-16 text-center"><HandCoins className="mx-auto text-fg-4" size={30} /><h2 className="mt-4 text-lg font-black text-fg-1">Nenhum repasse materializado</h2><p className="mx-auto mt-2 max-w-lg text-sm text-fg-3">Gere a agenda no documento da apólice. A guia contratual continua sendo a origem dos snapshots.</p><a href="/apolices" className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Abrir apólices<ArrowUpRight size={15} /></a></div>
    : filtered.length === 0 ? <div className="px-6 py-14 text-center"><FilterX className="mx-auto text-fg-4" size={28} /><h2 className="mt-3 text-lg font-black text-fg-1">Nenhum repasse corresponde aos filtros</h2><button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Limpar filtros</button></div>
    : <div className="overflow-x-auto"><table className="w-full min-w-[1420px] border-collapse text-left"><thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3"><tr><th className="w-12 px-5 py-3"><input type="checkbox" checked={allEligibleSelected} onChange={() => setSelected(allEligibleSelected ? selected.filter((id) => !eligibleVisible.some((row) => row.id === id)) : Array.from(new Set([...selected, ...eligibleVisible.map((row) => row.id)])))} aria-label="Selecionar repasses elegíveis visíveis" /></th><th className="px-3 py-3">Corretora / beneficiário</th><th className="px-3 py-3">Segurado / documento</th><th className="px-3 py-3">Seguradora / ramo</th><th className="px-3 py-3">Repasse / origem</th><th className="px-3 py-3">Datas</th><th className="px-3 py-3 text-right">Previsto</th><th className="px-3 py-3 text-right">Pago / diferença</th><th className="px-3 py-3">Status / recibo</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-border-1">{filtered.map((row) => <tr key={row.id} className="hover:bg-bg-surface-2/70"><td className="px-5 py-3"><input type="checkbox" checked={selected.includes(row.id)} disabled={!row.elegivel} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} aria-label={`Selecionar repasse ${row.numero ?? ''} de ${row.beneficiarioNome}`} title={row.bloqueio ?? undefined} /></td><td className="px-3 py-3"><p className="text-sm font-black text-fg-1">{row.beneficiarioNome}</p><p className="mt-0.5 text-[11px] text-fg-3">{row.filialNome} · {row.papel_beneficiario ?? 'Papel não informado'}</p></td><td className="px-3 py-3"><p className="text-sm font-black text-fg-1">{row.seguradoNome}</p><a href={`/apolices/${row.apoliceId}?documento=${row.proposta_id}&aba=repasses`} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-accent-primary hover:underline">{row.documentoReferencia}<ArrowUpRight size={11} /></a></td><td className="px-3 py-3"><p className="text-sm font-bold text-fg-1">{row.seguradoraNome}</p><p className="mt-0.5 text-[11px] text-fg-3">{row.ramoNome}</p></td><td className="px-3 py-3"><p className="font-mono text-xs font-black text-fg-1">#{row.numero ?? '—'}</p><p className="mt-0.5 text-[11px] text-fg-3">{row.origem === 'REGRA' ? 'Regra materializada' : 'Manual'} · {row.sentido === 'CREDITO' ? 'Crédito' : 'Débito'}</p></td><td className="px-3 py-3 text-[11px] text-fg-3"><p>Prev. {date(row.previsto_em)}</p><p>Lib. {date(row.liberado_em)}</p><p>Pago {date(row.pago_em)}</p></td><td className="px-3 py-3 text-right font-mono text-sm font-black text-fg-1">{money(row.valor_previsto ?? 0)}</td><td className="px-3 py-3 text-right"><p className="font-mono text-sm font-black text-fg-1">{row.valor_pago == null ? '—' : money(row.valor_pago)}</p><p className="mt-0.5 font-mono text-[11px] text-fg-3">Dif. {row.valor_diferenca == null ? '—' : money(row.valor_diferenca)}</p></td><td className="px-3 py-3"><StatusBadge row={row} />{row.ultimoRecibo && <button type="button" onClick={() => openReceipt(row.ultimoRecibo!.id)} className="mt-1.5 block font-mono text-[10px] font-black text-accent-primary hover:underline">{row.ultimoRecibo.numero}{row.ultimoRecibo.status === 'CANCELADO' ? ' · cancelado' : ''}</button>}</td><td className="px-5 py-3"><div className="flex justify-end gap-1.5">{row.elegivel && <button type="button" disabled={!canUpdate} onClick={() => setIssueRows([row])} className="rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary hover:bg-accent-primary-soft disabled:opacity-40">Emitir recibo</button>}{row.ultimoRecibo && <button type="button" onClick={() => openReceipt(row.ultimoRecibo!.id)} className="rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-fg-2 hover:bg-bg-surface-3">Consultar</button>}</div></td></tr>)}</tbody></table></div>}
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border-1 bg-bg-surface-2 px-5 py-3 text-xs font-bold text-fg-3 lg:px-7"><span>{filtered.length} de {rows.length} repasses</span><span>Pagamento integral · recibo persistente · zero movimentação bancária</span></footer>

    {issueRows && <RepasseReceiptModal rows={issueRows} isSaving={issue.isPending} onClose={() => setIssueRows(null)} onConfirm={(command) => void issueReceipts(command)} />}
    {detail && <RepasseReceiptDetailsModal key={`${detail.recibo.id}:${detail.recibo.status}`} detail={detail} canUpdate={canUpdate} isSaving={cancel.isPending} onClose={() => setDetail(null)} onCancel={(justification, key) => void cancelReceipt(justification, key)} />}
    {!canUpdate && <div className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 rounded-full border border-signal-warning/30 bg-bg-surface px-4 py-2 text-xs font-black text-signal-warning shadow-[var(--shadow-2)]"><ShieldAlert size={14} />Repasses em somente leitura</div>}
    {(issue.isPending || cancel.isPending) && <div className="pointer-events-none fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-fg-1 px-4 py-2 text-xs font-black text-bg-surface shadow-[var(--shadow-2)]"><Loader2 size={14} className="animate-spin" />Atualizando repasses</div>}
  </>
}
