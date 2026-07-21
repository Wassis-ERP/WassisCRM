import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle, CheckCircle2, ChevronRight, CircleDollarSign, FileUp, FilterX,
  History, Loader2, Plus, Search, ShieldCheck, Split, TriangleAlert,
} from 'lucide-react'
import { useSystemFeedback } from '../feedback/systemFeedbackContext'
import { useEstornarBaixaComissao, useFinanceiroComissoes, useRegistrarBaixaManualComissao } from '../../hooks/useFinanceiroComissoes'
import {
  filterFinanceiroComissoes,
  type BaixaManualCommand,
  type ComissaoFilters,
  type ComissaoHistoricoItem,
  type ComissaoStatusOperacional,
  type FinanceiroComissao,
} from '../../modules/financeiro/comissoesDomain'
import type { ComissaoTipo } from '../../types/database'
import CommissionHistoryModal from './CommissionHistoryModal'
import CommissionReceiptModal from './CommissionReceiptModal'

interface CommissionsViewProps {
  branchIds: readonly string[] | null
  canUpdate: boolean
}

const EMPTY_FILTERS: ComissaoFilters = {
  filialId: '', seguradoId: '', seguradoraId: '', ramoId: '', documento: '',
  competenciaDe: '', competenciaAte: '', status: '', tipo: '',
}

const STATUS_META: Record<ComissaoStatusOperacional, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  PENDENTE: { label: 'Pendente', className: 'bg-accent-primary-soft text-accent-primary', icon: CircleDollarSign },
  CONCILIADA: { label: 'Conciliada', className: 'bg-signal-info/12 text-signal-info', icon: ShieldCheck },
  PARCIAL: { label: 'Parcial', className: 'bg-signal-warning/12 text-signal-warning', icon: Split },
  DIVERGENTE: { label: 'Divergente', className: 'bg-signal-danger/12 text-signal-danger', icon: TriangleAlert },
  BAIXADA: { label: 'Baixada', className: 'bg-signal-success/12 text-signal-success', icon: CheckCircle2 },
  CANCELADA: { label: 'Cancelada', className: 'bg-bg-surface-3 text-fg-3', icon: AlertCircle },
}

const TYPE_LABELS: Record<ComissaoTipo, string> = {
  NORMAL: 'Normal', AGENCIAMENTO: 'Agenciamento', VITALICIA: 'Vitalícia',
  ADICIONAL: 'Adicional', RESTITUICAO: 'Restituição',
}

const money = (value: number | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
const date = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`)) : '—'
const operationKey = () => `estorno-comissao-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`

function uniqueOptions(rows: FinanceiroComissao[], id: keyof FinanceiroComissao, label: keyof FinanceiroComissao) {
  const options = new Map<string, string>()
  rows.forEach((row) => {
    const value = row[id]
    const text = row[label]
    if (typeof value === 'string' && typeof text === 'string') options.set(value, text)
  })
  return Array.from(options, ([value, text]) => ({ value, text })).sort((a, b) => a.text.localeCompare(b.text, 'pt-BR'))
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; text: string }>; onChange: (value: string) => void }) {
  return <label className="min-w-0 space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-xs font-bold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"><option value="">Todos</option>{options.map((option) => <option key={option.value} value={option.value}>{option.text}</option>)}</select></label>
}

function StatusBadge({ status }: { status: ComissaoStatusOperacional }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${meta.className}`}><Icon size={12} />{meta.label}</span>
}

export default function CommissionsView({ branchIds, canUpdate }: CommissionsViewProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useFinanceiroComissoes(branchIds)
  const registerReceipt = useRegistrarBaixaManualComissao()
  const reverseReceipt = useEstornarBaixaComissao()
  const { notify } = useSystemFeedback()
  const [filters, setFilters] = useState<ComissaoFilters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<string[]>([])
  const [modalIds, setModalIds] = useState<string[] | null>(() => searchParams.get('baixa')?.split(',').filter(Boolean) ?? null)
  const [historyRow, setHistoryRow] = useState<FinanceiroComissao | null>(null)
  const rows = useMemo(() => query.data ?? [], [query.data])
  const requestedCommissionId = searchParams.get('comissao')
  const filtered = useMemo(() => {
    const result = filterFinanceiroComissoes(rows, filters)
    return requestedCommissionId ? result.filter((row) => row.id === requestedCommissionId) : result
  }, [filters, requestedCommissionId, rows])
  const selectedRows = useMemo(() => rows.filter((row) => selected.includes(row.id)), [rows, selected])
  const sameContext = selectedRows.length > 0 && selectedRows.every((row) => row.filialId === selectedRows[0].filialId && row.seguradoraId === selectedRows[0].seguradoraId)
  const eligibleSelection = sameContext && selectedRows.every((row) => row.statusOperacional !== 'CANCELADA' && Math.abs(row.saldo) > 0.01 && row.ocorrenciasAbertas === 0 && row.conciliacoesPendentes === 0)
  const allVisibleSelected = filtered.length > 0 && filtered.every((row) => selected.includes(row.id))
  const hasFilters = Object.values(filters).some(Boolean) || Boolean(requestedCommissionId)

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    if (!requestedCommissionId) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('comissao')
    setSearchParams(nextParams, { replace: true })
  }

  const totals = useMemo(() => ({
    previsto: rows.reduce((total, row) => total + (row.valor_previsto ?? 0), 0),
    informado: rows.reduce((total, row) => total + row.valorInformadoBruto, 0),
    conciliado: rows.reduce((total, row) => total + row.valorConciliado, 0),
    baixado: rows.reduce((total, row) => total + row.valorBaixado, 0),
    saldo: rows.reduce((total, row) => total + row.saldo, 0),
    divergencias: rows.filter((row) => row.statusOperacional === 'DIVERGENTE' || row.ocorrenciasAbertas > 0).length,
  }), [rows])

  const updateFilter = <K extends keyof ComissaoFilters>(key: K, value: ComissaoFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))

  const closeReceipt = () => {
    setModalIds(null)
    if (!searchParams.has('baixa')) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('baixa')
    setSearchParams(nextParams, { replace: true })
  }

  const handleReceipt = async (command: BaixaManualCommand) => {
    try {
      const result = await registerReceipt.mutateAsync(command)
      closeReceipt()
      setSelected([])
      notify({
        title: result.idempotent ? 'Baixa já registrada' : result.baixaIds.length === 1 ? 'Baixa registrada' : `${result.baixaIds.length} baixas registradas`,
        description: result.idempotent ? 'A chave idempotente preservou a operação original.' : 'Previsto preservado, histórico auditado e saldos atualizados.',
        tone: 'success',
      })
    } catch (error) {
      notify({ title: 'Não foi possível registrar a baixa', description: error instanceof Error ? error.message : 'Falha inesperada.', tone: 'danger' })
    }
  }

  const handleReverse = async (event: ComissaoHistoricoItem, justification: string) => {
    try {
      await reverseReceipt.mutateAsync({
        baixaId: event.id, dataEfetiva: new Date().toISOString().slice(0, 10),
        justificativa: justification, chaveIdempotencia: operationKey(),
      })
      setHistoryRow(null)
      notify({ title: 'Estorno registrado', description: 'Um evento compensatório foi criado; a baixa original permanece no histórico.', tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível estornar', description: error instanceof Error ? error.message : 'Falha inesperada.', tone: 'danger' })
    }
  }

  if (query.isLoading) return <div className="space-y-4 border-t border-border-1 p-6"><div className="h-24 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-28 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-64 animate-pulse rounded-[8px] bg-bg-surface-2" /></div>
  if (query.isError) return <div className="border-t border-border-1 p-10 text-center"><AlertCircle className="mx-auto text-signal-danger" size={28} /><h2 className="mt-3 text-lg font-black text-fg-1">Não foi possível carregar as comissões</h2><p className="mt-1 text-sm text-fg-3">{query.error instanceof Error ? query.error.message : 'Tente novamente.'}</p><button type="button" onClick={() => void query.refetch()} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Tentar novamente</button></div>

  return <section className="border-t border-border-1 bg-bg-surface">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-1 px-5 py-4 lg:px-7">
      <div><h2 className="text-base font-black text-fg-1">Comissões a receber</h2><p className="mt-0.5 text-xs text-fg-3">Agenda contratual, demonstrativos, conciliações e recebimentos em uma leitura operacional.</p></div>
      <div className="flex flex-wrap gap-2"><Link to="/financeiro/extratos" className="inline-flex items-center gap-2 rounded-full border border-border-1 bg-bg-surface px-4 py-2.5 text-xs font-black text-fg-2 hover:bg-bg-surface-2"><History size={14} />Histórico de extratos</Link><Link to="/financeiro/importar-demonstrativo" className="inline-flex items-center gap-2 rounded-full border border-border-1 bg-bg-surface px-4 py-2.5 text-xs font-black text-fg-2 hover:bg-bg-surface-2"><FileUp size={14} />Importar demonstrativo</Link><button type="button" disabled={!canUpdate || rows.every((row) => Math.abs(row.saldo) <= 0.01 || row.statusOperacional === 'CANCELADA' || row.ocorrenciasAbertas > 0 || row.conciliacoesPendentes > 0)} onClick={() => setModalIds([])} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40"><Plus size={14} />Registrar baixa</button></div>
    </div>

    <div className="grid divide-y divide-border-1 border-b border-border-1 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-6">
      {[
        ['Previsto', money(totals.previsto), 'text-fg-1'], ['Informado bruto', money(totals.informado), 'text-fg-1'],
        ['Conciliado', money(totals.conciliado), 'text-signal-info'], ['Baixado', money(totals.baixado), 'text-signal-success'],
        ['Saldo', money(totals.saldo), 'text-accent-primary'], ['Divergências', String(totals.divergencias), totals.divergencias ? 'text-signal-danger' : 'text-fg-1'],
      ].map(([label, value, tone]) => <div key={label} className="px-5 py-4"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className={`mt-1 font-mono text-base font-black ${tone}`}>{value}</p></div>)}
    </div>

    <div className="border-b border-border-1 px-5 py-5 lg:px-7">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <FilterSelect label="Corretora" value={filters.filialId} onChange={(value) => updateFilter('filialId', value)} options={uniqueOptions(rows, 'filialId', 'filialNome')} />
        <FilterSelect label="Segurado" value={filters.seguradoId} onChange={(value) => updateFilter('seguradoId', value)} options={uniqueOptions(rows, 'seguradoId', 'seguradoNome')} />
        <FilterSelect label="Seguradora" value={filters.seguradoraId} onChange={(value) => updateFilter('seguradoraId', value)} options={uniqueOptions(rows, 'seguradoraId', 'seguradoraNome')} />
        <FilterSelect label="Ramo" value={filters.ramoId} onChange={(value) => updateFilter('ramoId', value)} options={uniqueOptions(rows, 'ramoId', 'ramoNome')} />
        <label className="space-y-1.5 xl:col-span-2"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Documento / segurado</span><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" /><input value={filters.documento} onChange={(event) => updateFilter('documento', event.target.value)} placeholder="Proposta, apólice ou segurado" className="w-full rounded-[6px] border border-border-1 bg-bg-surface py-2.5 pl-9 pr-3 text-xs font-bold text-fg-1 placeholder:text-fg-4" /></div></label>
        <FilterSelect label="Status" value={filters.status} onChange={(value) => updateFilter('status', value as ComissaoFilters['status'])} options={Object.entries(STATUS_META).map(([value, meta]) => ({ value, text: meta.label }))} />
        <FilterSelect label="Tipo" value={filters.tipo} onChange={(value) => updateFilter('tipo', value as ComissaoFilters['tipo'])} options={Object.entries(TYPE_LABELS).map(([value, text]) => ({ value, text }))} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:max-w-2xl"><label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Competência de</span><input type="date" value={filters.competenciaDe} onChange={(event) => updateFilter('competenciaDe', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label><label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Competência até</span><input type="date" value={filters.competenciaAte} onChange={(event) => updateFilter('competenciaAte', event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-1" /></label><button type="button" disabled={!hasFilters} onClick={clearFilters} className="mt-auto inline-flex h-[35px] items-center justify-center gap-2 rounded-[6px] border border-border-1 px-3 text-xs font-black text-fg-3 hover:bg-bg-surface-2 disabled:opacity-40"><FilterX size={14} />Limpar</button></div>
    </div>

    {selectedRows.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b border-border-1 bg-accent-primary-soft px-5 py-3 lg:px-7"><span className="text-sm font-black text-accent-primary">{selectedRows.length} selecionada{selectedRows.length > 1 ? 's' : ''}</span><button type="button" disabled={!canUpdate || !eligibleSelection} title={!sameContext ? 'Selecione comissões da mesma corretora e seguradora.' : !eligibleSelection ? 'A seleção contém comissão sem saldo, cancelada ou com conciliação pendente.' : undefined} onClick={() => setModalIds(selectedRows.map((row) => row.id))} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand disabled:opacity-40"><Plus size={14} />Registrar baixa em lote</button><button type="button" onClick={() => setSelected([])} className="ml-auto text-xs font-bold text-fg-3 hover:text-fg-1">Limpar seleção</button></div>}

    {rows.length === 0 ? <div className="px-6 py-16 text-center"><CircleDollarSign className="mx-auto text-fg-4" size={30} /><h3 className="mt-4 text-lg font-black text-fg-1">Nenhuma comissão materializada</h3><p className="mx-auto mt-2 max-w-lg text-sm text-fg-3">As agendas de comissão são geradas nos documentos da apólice pela Fase 2.</p></div>
      : filtered.length === 0 ? <div className="px-6 py-14 text-center"><FilterX className="mx-auto text-fg-4" size={28} /><h3 className="mt-3 text-lg font-black text-fg-1">Nenhuma comissão corresponde aos filtros</h3><button type="button" onClick={clearFilters} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Limpar filtros</button></div>
        : <div className="overflow-x-auto"><table className="w-full min-w-[1460px] border-collapse text-left"><thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3"><tr><th className="w-12 px-5 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? selected.filter((id) => !filtered.some((row) => row.id === id)) : Array.from(new Set([...selected, ...filtered.map((row) => row.id)])))} aria-label="Selecionar comissões visíveis" /></th><th className="px-3 py-3">Corretora / segurado</th><th className="px-3 py-3">Documento</th><th className="px-3 py-3">Seguradora / ramo</th><th className="px-3 py-3">Agenda</th><th className="px-3 py-3 text-right">Previsto / informado</th><th className="px-3 py-3 text-right">Conciliado</th><th className="px-3 py-3 text-right">Baixado / saldo</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-border-1">
          {filtered.map((row) => <tr key={row.id} className="group hover:bg-bg-surface-2/70"><td className="px-5 py-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => setSelected((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} aria-label={`Selecionar comissão ${row.numero ?? ''} de ${row.seguradoNome}`} /></td><td className="px-3 py-3"><p className="text-sm font-black text-fg-1">{row.seguradoNome}</p><p className="mt-0.5 text-[11px] text-fg-3">{row.filialNome}</p></td><td className="px-3 py-3"><Link to={`/apolices/${row.apoliceId}?documento=${row.proposta_id}`} className="inline-flex items-center gap-1 text-sm font-black text-accent-primary hover:underline">{row.documentoReferencia}<ChevronRight size={13} /></Link><p className="mt-0.5 font-mono text-[11px] text-fg-3">Apólice {row.apoliceNumero ?? 'em emissão'} · comissão {row.numero ?? '—'}</p></td><td className="px-3 py-3"><p className="text-sm font-bold text-fg-1">{row.seguradoraNome}</p><p className="mt-0.5 text-[11px] text-fg-3">{row.ramoNome}</p></td><td className="px-3 py-3"><p className="font-mono text-sm font-bold text-fg-1">{date(row.prevista_em)}</p><p className="mt-0.5 text-[10px] font-black uppercase text-fg-3">{TYPE_LABELS[row.tipo_comissao]}</p></td><td className="px-3 py-3 text-right"><p className="font-mono text-sm font-black text-fg-1">{money(row.valor_previsto)}</p><p className={`mt-0.5 font-mono text-[11px] ${row.valorInformadoBruto ? 'text-fg-2' : 'text-fg-4'}`}>{row.valorInformadoBruto ? money(row.valorInformadoBruto) : 'não informado'}</p></td><td className="px-3 py-3 text-right"><p className="font-mono text-sm font-bold text-fg-1">{money(row.valorConciliado)}</p><p className="mt-0.5 text-[10px] text-fg-3">{row.conciliacoesConfirmadas} confirmada(s)</p></td><td className="px-3 py-3 text-right"><p className="font-mono text-sm font-black text-signal-success">{money(row.valorBaixado)}</p><p className={`mt-0.5 font-mono text-[11px] font-bold ${Math.abs(row.saldo) > 0.01 ? 'text-accent-primary' : 'text-fg-4'}`}>saldo {money(row.saldo)}</p></td><td className="px-3 py-3"><StatusBadge status={row.statusOperacional} />{row.ocorrenciasAbertas > 0 && <p className="mt-1 text-[10px] font-bold text-signal-danger">{row.ocorrenciasAbertas} ocorrência(s)</p>}{row.conciliacoesPendentes > 0 && <p className="mt-1 text-[10px] font-bold text-signal-warning">{row.conciliacoesPendentes} sugestão(ões)</p>}</td><td className="px-5 py-3"><div className="flex justify-end gap-1.5">{Math.abs(row.saldo) > 0.01 && row.statusOperacional !== 'CANCELADA' && <button type="button" disabled={!canUpdate || row.ocorrenciasAbertas > 0 || row.conciliacoesPendentes > 0} title={row.ocorrenciasAbertas > 0 || row.conciliacoesPendentes > 0 ? 'Resolva ocorrências e sugestões antes da baixa.' : undefined} onClick={() => setModalIds([row.id])} className="rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary hover:bg-accent-primary-soft disabled:opacity-40">Baixar</button>}<button type="button" onClick={() => setHistoryRow(row)} className="inline-flex items-center gap-1 rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-fg-2 hover:bg-bg-surface-3"><History size={12} />Histórico</button></div></td></tr>)}
        </tbody></table></div>}
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border-1 bg-bg-surface-2 px-5 py-3 text-xs font-bold text-fg-3 lg:px-7"><span>{filtered.length} de {rows.length} comissões</span><span>Previsto, informado, conciliado e recebido permanecem separados</span></footer>

    {modalIds && <CommissionReceiptModal rows={rows} initialIds={modalIds} isSaving={registerReceipt.isPending} onClose={closeReceipt} onConfirm={(command) => void handleReceipt(command)} />}
    {historyRow && <CommissionHistoryModal row={rows.find((row) => row.id === historyRow.id) ?? historyRow} isSaving={reverseReceipt.isPending} onClose={() => setHistoryRow(null)} onReverse={(event, justification) => void handleReverse(event, justification)} />}
    {(registerReceipt.isPending || reverseReceipt.isPending) && <div className="pointer-events-none fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-fg-1 px-4 py-2 text-xs font-black text-bg-surface shadow-[var(--shadow-2)]"><Loader2 size={14} className="animate-spin" />Atualizando comissões</div>}
  </section>
}
