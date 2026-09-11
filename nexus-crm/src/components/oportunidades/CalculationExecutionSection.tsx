import { useMemo, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  Columns3,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleX,
  Clock3,
  FileSearch,
  Info,
  ListFilter,
  Loader2,
  Play,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'
import { useAuth } from '../../hooks/useAuth'
import {
  useCommercialPresentationWorkspace,
  useToggleCommercialPresentationQuote,
} from '../../hooks/useCommercialPresentation'
import {
  useCalculationExecutionWorkspace,
  useRecalculateCalculationExecution,
  useStartCalculationExecutions,
} from '../../hooks/useCalculos'
import type {
  CalculationExecutionSort,
  CalculationExecutionView,
} from '../../modules/comercial/calculationExecutionDomain'
import type { CalculoExecucaoRow, CalculoRow } from '../../types/database'
import { fmtDate } from '../../utils/date'
import CommercialPresentationTray from './CommercialPresentationTray'
import { useNavigate } from 'react-router-dom'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const inputClass = 'w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-3 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-1 px-3.5 py-2 text-xs font-black text-fg-2 hover:border-accent-primary/30 hover:bg-accent-primary-soft hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-50'

type InsurerOption = { id: string; nome: string }

type Props = {
  calculation: CalculoRow
  insurers: InsurerOption[]
  canExecute: boolean
  draftChanged?: boolean
  versionCreating?: boolean
  createVersion?: () => Promise<CalculoRow>
  onVersionCreated?: (calculation: CalculoRow) => void
  executionSectionNumber: string
  resultsSectionNumber: string
}

function finiteCommission(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function statusPresentation(execution: CalculoExecucaoRow) {
  const recalculating = execution.tentativa > 1 && ['AGUARDANDO', 'EM_EXECUCAO'].includes(execution.status)
  if (recalculating) return { label: 'Recalculando', className: 'bg-accent-primary-soft text-accent-primary', icon: <Loader2 size={12} className="animate-spin" /> }
  switch (execution.status) {
    case 'AGUARDANDO': return { label: 'Aguardando', className: 'bg-bg-surface-3 text-fg-2', icon: <Clock3 size={12} /> }
    case 'EM_EXECUCAO': return { label: 'Calculando', className: 'bg-accent-primary-soft text-accent-primary', icon: <Loader2 size={12} className="animate-spin" /> }
    case 'CONCLUIDA': return { label: 'Resultado disponível', className: 'bg-signal-success/10 text-signal-success', icon: <CheckCircle2 size={12} /> }
    case 'PENDENTE_DADOS': return { label: 'Pendência de dados', className: 'bg-signal-warning/10 text-signal-warning', icon: <CircleAlert size={12} /> }
    case 'INDISPONIVEL': return { label: 'Indisponível', className: 'bg-signal-danger/10 text-signal-danger', icon: <CircleX size={12} /> }
    case 'ERRO': return { label: 'Erro recuperável', className: 'bg-signal-danger/10 text-signal-danger', icon: <CircleX size={12} /> }
    case 'CANCELADA': return { label: 'Cancelada', className: 'bg-bg-surface-3 text-fg-3', icon: <CircleX size={12} /> }
  }
}

function executionMessage(execution: CalculoExecucaoRow): string | null {
  return execution.pendencia_mensagem || execution.erro_mensagem_segura
}

function responseTimeLabel(milliseconds: number | null): string {
  if (milliseconds === null) return 'Tempo não disponível'
  if (milliseconds < 1000) return String(milliseconds) + ' ms'
  return (milliseconds / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' s'
}

function paymentLabel(result: CalculationExecutionView): string {
  const option = result.primaryInstallment
  if (!option) return 'Pagamento não informado'
  const form = option.forma_pagamento.replaceAll('_', ' ').toLocaleLowerCase('pt-BR')
  return option.quantidade_parcelas === 1
    ? form + ' à vista · ' + currency.format(option.valor_total ?? option.valor_parcela ?? 0)
    : String(option.quantidade_parcelas) + 'x de ' + currency.format(option.valor_parcela ?? 0) + ' · ' + form
}

export default function CalculationExecutionSection({
  calculation,
  insurers,
  canExecute,
  draftChanged = false,
  versionCreating = false,
  createVersion,
  onVersionCreated,
  executionSectionNumber,
  resultsSectionNumber,
}: Props) {
  const navigate = useNavigate()
  const [selection, setSelection] = useState<Set<string> | null>(null)
  const [defaultCommission, setDefaultCommission] = useState(() => String(calculation.comissao_sugerida_pct ?? 20))
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<CalculationExecutionSort>('RETORNO')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [adjustment, setAdjustment] = useState<{ executionId: string; value: string } | null>(null)
  const workspace = useCalculationExecutionWorkspace(calculation.id, sort)
  const start = useStartCalculationExecutions()
  const recalculate = useRecalculateCalculationExecution()
  const { notify } = useSystemFeedback()
  const confirm = useConfirm()
  const { user } = useAuth()
  const presentation = useCommercialPresentationWorkspace(calculation.oportunidade_id)
  const togglePresentationQuote = useToggleCommercialPresentationQuote()

  const selectedIds = useMemo(() => selection ?? new Set(insurers.map((insurer) => insurer.id)), [insurers, selection])
  const latestByInsurer = useMemo(() => new Map((workspace.data?.latestExecutions ?? []).map((result) => [result.execution.seguradora_id, result])), [workspace.data?.latestExecutions])
  const allSelected = insurers.length > 0 && insurers.every((insurer) => selectedIds.has(insurer.id))
  const busy = start.isPending || recalculate.isPending || versionCreating
  const selectedQuoteIds = useMemo(
    () => new Set((presentation.data?.items ?? []).map((item) => item.item.cotacao_id)),
    [presentation.data?.items],
  )

  const toggleInsurer = (insurerId: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(insurerId)
    else next.delete(insurerId)
    setSelection(next)
  }

  const toggleAll = (checked: boolean) => setSelection(new Set(checked ? insurers.map((insurer) => insurer.id) : []))

  const runBatch = async () => {
    const parsedDefault = finiteCommission(defaultCommission)
    if (parsedDefault === null) {
      notify({ title: 'Comissão inválida', description: 'Informe um percentual padrão maior ou igual a zero.', tone: 'warning' })
      return
    }
    const selected = insurers.filter((insurer) => selectedIds.has(insurer.id))
    if (selected.length === 0) {
      notify({ title: 'Selecione as seguradoras', description: 'Marque ao menos uma companhia para iniciar o cálculo.', tone: 'warning' })
      return
    }
    const invalidOverride = selected.find((insurer) => overrides[insurer.id]?.trim() && finiteCommission(overrides[insurer.id]) === null)
    if (invalidOverride) {
      notify({ title: 'Comissão inválida', description: 'Revise o percentual informado para ' + invalidOverride.nome + '.', tone: 'warning' })
      return
    }
    let targetCalculation = calculation
    let createdVersion = false
    try {
      if (draftChanged && createVersion) {
        const accepted = await confirm({
          title: 'Gerar nova versão e calcular?',
          description: 'As alterações de perfil, risco ou coberturas serão gravadas em uma nova versão. O cálculo atual e seus resultados permanecerão intactos.',
          confirmLabel: 'Gerar e calcular',
        })
        if (!accepted) return
        targetCalculation = await createVersion()
        createdVersion = true
      }
      await start.mutateAsync({
        calculationId: targetCalculation.id,
        defaultCommissionPct: parsedDefault,
        insurers: selected.map((insurer) => ({
          insurerId: insurer.id,
          commissionOverridePct: overrides[insurer.id]?.trim() ? finiteCommission(overrides[insurer.id]) : undefined,
        })),
      })
      notify({
        title: createdVersion ? 'Nova versão calculada' : 'Simulação concluída',
        description: createdVersion
          ? 'A versão anterior foi preservada e as execuções foram vinculadas ao novo snapshot.'
          : 'Os retornos independentes das seguradoras foram atualizados.',
        tone: 'success',
      })
      if (createdVersion) onVersionCreated?.(targetCalculation)
    } catch (cause) {
      notify({
        title: createdVersion ? 'A versão foi criada, mas o cálculo falhou' : 'Não foi possível calcular',
        description: cause instanceof Error ? cause.message : 'Revise a seleção e tente novamente.',
        tone: 'danger',
      })
      if (createdVersion) onVersionCreated?.(targetCalculation)
    }
  }

  const rerun = async (executionId: string, commissionPct?: number) => {
    try {
      await recalculate.mutateAsync({ executionId, commissionPct })
      setAdjustment(null)
      notify({ title: 'Nova tentativa concluída', description: 'O resultado anterior foi preservado no histórico.', tone: 'success' })
    } catch (cause) {
      notify({ title: 'Não foi possível recalcular', description: cause instanceof Error ? cause.message : 'Tente novamente.', tone: 'danger' })
    }
  }

  const applyAdjustment = (result: CalculationExecutionView) => {
    const parsed = adjustment?.executionId === result.execution.id ? finiteCommission(adjustment.value) : null
    if (parsed === null) {
      notify({ title: 'Comissão inválida', description: 'Informe o percentual que deve ser aplicado à nova tentativa.', tone: 'warning' })
      return
    }
    void rerun(result.execution.id, parsed)
  }

  const toggleDetails = (resultId: string) => {
    const next = new Set(expanded)
    if (next.has(resultId)) next.delete(resultId)
    else next.add(resultId)
    setExpanded(next)
  }

  const toggleComparison = async (quoteId: string) => {
    const wasSelected = selectedQuoteIds.has(quoteId)
    try {
      await togglePresentationQuote.mutateAsync({
        opportunityId: calculation.oportunidade_id,
        quoteId,
        createdById: user?.id ?? null,
      })
      notify({
        title: wasSelected ? 'Cotação removida' : 'Cotação adicionada',
        description: wasSelected
          ? 'A bandeja do comparativo foi atualizada.'
          : 'O resultado está disponível no comparativo da oportunidade.',
        tone: 'success',
      })
    } catch (cause) {
      notify({
        title: 'Não foi possível atualizar o comparativo',
        description: cause instanceof Error ? cause.message : 'Revise a seleção e tente novamente.',
        tone: 'warning',
      })
    }
  }

  return (
    <>
      <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
        <SectionHeading
          number={executionSectionNumber}
          title="Companhias e comissões"
          description="Selecione as seguradoras, defina a comissão aplicada e acompanhe cada tentativa de forma independente."
        />

        <div className="mb-5 flex items-start gap-3 rounded-[6px] bg-accent-primary-soft p-4 text-sm">
          <Info size={17} className="mt-0.5 shrink-0 text-accent-primary" />
          <div>
            <p className="font-black text-fg-1">Simulação exclusiva do frontend</p>
            <p className="mt-1 text-xs text-fg-3">Não há chamada a seguradora, portal, motor externo ou rede. Os cenários e tempos são fixtures determinísticas.</p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border-1 pb-5 md:grid-cols-[minmax(220px,320px)_1fr] md:items-end">
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Comissão padrão (%)</span>
            <input type="number" min="0" step="0.01" disabled={!canExecute || busy} value={defaultCommission} onChange={(event) => setDefaultCommission(event.target.value)} className={inputClass} />
            <span className="mt-1 block text-[11px] text-fg-3">Persistida no cálculo; cada execução guarda seu próprio snapshot.</span>
          </label>
          <div className="flex flex-col gap-2 md:items-end">
            {!canExecute && <p className="text-xs font-bold text-signal-warning">Seu perfil pode consultar os resultados, mas não iniciar novas execuções.</p>}
            {canExecute && <button type="button" disabled={busy || selectedIds.size === 0 || insurers.length === 0} onClick={() => void runBatch()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-xs font-black text-accent-primary-fg shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} {busy ? 'Preparando o cálculo…' : draftChanged ? 'Gerar nova versão e calcular' : 'Calcular nas seguradoras selecionadas'}</button>}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[6px] border border-border-1">
          <label className="flex min-h-11 items-center gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-3 text-xs font-black text-fg-2">
            <input type="checkbox" disabled={!canExecute || busy || insurers.length === 0} checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} className="h-5 w-5 rounded border-border-2 text-accent-primary focus:ring-accent-primary" />
            Selecionar todas
            <span className="ml-auto font-semibold text-fg-3">{selectedIds.size} de {insurers.length}</span>
          </label>
          {insurers.length === 0 ? <p className="p-5 text-sm text-fg-3">Nenhuma seguradora ativa está disponível para este grupo.</p> : insurers.map((insurer) => {
            const selected = selectedIds.has(insurer.id)
            const override = overrides[insurer.id] ?? ''
            const latest = latestByInsurer.get(insurer.id)
            const presentation = latest ? statusPresentation(latest.execution) : null
            const message = latest ? executionMessage(latest.execution) : null
            const retryable = latest && ['PENDENTE_DADOS', 'INDISPONIVEL', 'ERRO'].includes(latest.execution.status)
            const rowClass = 'grid gap-3 border-b border-border-1 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(180px,1fr)_minmax(180px,240px)_minmax(180px,1.2fr)_auto] md:items-center ' + (selected ? 'bg-bg-surface' : 'bg-bg-surface-2/60')
            return (
              <div key={insurer.id} className={rowClass}>
                <label className="flex min-h-11 min-w-0 items-center gap-3">
                  <input type="checkbox" disabled={!canExecute || busy} checked={selected} onChange={(event) => toggleInsurer(insurer.id, event.target.checked)} className="h-5 w-5 shrink-0 rounded border-border-2 text-accent-primary focus:ring-accent-primary" />
                  <span className="truncate text-sm font-black text-fg-1">{insurer.nome}</span>
                </label>
                <label className="min-w-0">
                  <span className="sr-only">Sobrescrever comissão de {insurer.nome}</span>
                  <input type="number" min="0" step="0.01" disabled={!canExecute || !selected || busy} value={override} onChange={(event) => setOverrides((current) => ({ ...current, [insurer.id]: event.target.value }))} className={inputClass} placeholder={(defaultCommission || '0') + '% herdado'} />
                  <span className={'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ' + (override.trim() ? 'bg-signal-warning/10 text-signal-warning' : 'bg-bg-surface-3 text-fg-3')}>{override.trim() ? 'Sobrescrita nesta seguradora' : 'Herda o padrão'}</span>
                </label>
                <div className="min-w-0">
                  {presentation ? <><span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ' + presentation.className}>{presentation.icon}{presentation.label}</span><p className="mt-1 truncate text-[11px] text-fg-3">Tentativa {latest?.execution.tentativa} · comissão {percent.format(latest?.execution.comissao_pct_aplicada ?? 0)}%</p>{message && <p className="mt-1 text-xs font-semibold text-fg-2">{message}</p>}</> : <span className="text-xs text-fg-3">Ainda não executada</span>}
                </div>
                {retryable && canExecute ? <button type="button" disabled={busy} onClick={() => void rerun(latest.execution.id)} className={secondaryButton}><RotateCcw size={13} /> Recalcular</button> : <span className="hidden md:block" />}
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeading number={resultsSectionNumber} title="Resultados das seguradoras" description="Cada cotação permanece vinculada à execução e mostra somente valores devolvidos pela seguradora." compact />
          <button type="button" disabled={!canExecute || busy || draftChanged} onClick={() => navigate(`/oportunidades/${calculation.oportunidade_id}/calculos/${calculation.id}/cotacoes/nova`)} className={secondaryButton}>Registrar cotação manual</button>
          {(workspace.data?.results.length ?? 0) > 1 && <label className="flex shrink-0 items-center gap-2 text-xs font-bold text-fg-3"><ListFilter size={14} /><span>Ordenar por</span><select value={sort} onChange={(event) => setSort(event.target.value as CalculationExecutionSort)} className="rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2 text-xs font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"><option value="RETORNO">Tempo de retorno</option><option value="PREMIO">Menor prêmio</option><option value="FRANQUIA">Menor franquia</option></select></label>}
        </div>

        {workspace.isLoading ? <div className="space-y-3" aria-label="Carregando resultados">{[1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-[6px] bg-bg-surface-2" />)}</div> : workspace.isError ? <div className="rounded-[6px] bg-signal-danger/10 p-4"><p className="text-sm font-black text-signal-danger">Não foi possível carregar os resultados.</p><button type="button" onClick={() => void workspace.refetch()} className={secondaryButton + ' mt-3'}><RefreshCw size={13} /> Tentar novamente</button></div> : (workspace.data?.results.length ?? 0) === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-[6px] border border-dashed border-border-2 bg-bg-surface-2 px-6 py-8 text-center">
            <FileSearch size={24} className="text-accent-primary" />
            <h3 className="mt-3 text-sm font-black text-fg-1">Nenhum resultado disponível</h3>
            <p className="mt-1 max-w-lg text-sm text-fg-3">Selecione as companhias e inicie a simulação. Pendências e erros aparecem acima sem bloquear os demais retornos.</p>
          </div>
        ) : <div className="space-y-3" aria-live="polite">{workspace.data?.results.map((result) => <ResultCard
          key={result.quote?.id ?? result.execution.id}
          result={result}
          calculation={calculation}
          canExecute={canExecute}
          busy={busy}
          expanded={result.quote ? expanded.has(result.quote.id) : false}
          adjustment={adjustment}
          selectedForComparison={result.quote ? selectedQuoteIds.has(result.quote.id) : false}
          comparisonPending={togglePresentationQuote.isPending}
          onToggleDetails={toggleDetails}
          onToggleComparison={toggleComparison}
          onSetAdjustment={setAdjustment}
          onApplyAdjustment={applyAdjustment}
          onRerun={rerun}
        /> )}</div>}
      </section>
      <CommercialPresentationTray opportunityId={calculation.oportunidade_id} />
    </>
  )
}

function ResultCard({ result, calculation, canExecute, busy, expanded, adjustment, selectedForComparison, comparisonPending, onToggleDetails, onToggleComparison, onSetAdjustment, onApplyAdjustment, onRerun }: {
  result: CalculationExecutionView
  calculation: CalculoRow
  canExecute: boolean
  busy: boolean
  expanded: boolean
  adjustment: { executionId: string; value: string } | null
  selectedForComparison: boolean
  comparisonPending: boolean
  onToggleDetails: (quoteId: string) => void
  onToggleComparison: (quoteId: string) => Promise<void>
  onSetAdjustment: (value: { executionId: string; value: string } | null) => void
  onApplyAdjustment: (result: CalculationExecutionView) => void
  onRerun: (executionId: string, commissionPct?: number) => Promise<void>
}) {
  const quote = result.quote
  if (!quote) return null
  const adjusting = adjustment?.executionId === result.execution.id
  return (
    <article className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-fg-1">{result.insurerName}</h3>
              <span className="rounded-full bg-signal-success/10 px-2.5 py-1 text-[10px] font-black text-signal-success">Cotação apresentada</span>
              <span className="rounded-full bg-accent-primary-soft px-2.5 py-1 text-[10px] font-black text-accent-primary">{result.execution.motor === 'MANUAL' ? 'Registro manual' : 'Simulação frontend'}</span>
              {!result.isLatest && <span className="rounded-full bg-bg-surface-3 px-2.5 py-1 text-[10px] font-black text-fg-3">Histórico</span>}
            </div>
            <p className="mt-1 font-mono text-xs font-semibold text-fg-3">{quote.numero_cotacao_seguradora} · tentativa {result.execution.tentativa}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canExecute && <button type="button" disabled={comparisonPending} onClick={() => void onToggleComparison(quote.id)} className={selectedForComparison ? 'inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary-soft px-3.5 py-2 text-xs font-black text-accent-primary disabled:opacity-50' : secondaryButton}><Columns3 size={14} /> {selectedForComparison ? 'No comparativo' : 'Adicionar ao comparativo'}</button>}
            <button type="button" onClick={() => onToggleDetails(quote.id)} className={secondaryButton}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}</button>
            {canExecute && <button type="button" disabled={busy} onClick={() => onSetAdjustment(adjusting ? null : { executionId: result.execution.id, value: String(result.execution.comissao_pct_aplicada ?? calculation.comissao_sugerida_pct ?? 0) })} className={secondaryButton}><Settings2 size={14} /> Ajustar para esta seguradora</button>}
            {canExecute && <button type="button" disabled={busy} onClick={() => void onRerun(result.execution.id)} className={secondaryButton}><RotateCcw size={14} /> Recalcular</button>}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Prêmio total" value={currency.format(quote.premio_total ?? 0)} icon={<ReceiptText size={15} />} />
          <Metric label="Pagamento principal" value={paymentLabel(result)} icon={<ShieldCheck size={15} />} />
          <Metric label="Franquia" value={result.franchiseValue === null ? 'Não informada' : currency.format(result.franchiseValue)} icon={<Settings2 size={15} />} />
          <Metric label="Retorno e validade" value={responseTimeLabel(result.responseTimeMs) + ' · até ' + fmtDate(quote.validade)} icon={<Clock3 size={15} />} />
        </div>

        <div className="mt-4 grid gap-3 border-t border-border-1 pt-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,1fr)]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-fg-4">Coberturas aceitas</p>
            <div className="mt-2 flex flex-wrap gap-2">{result.coverages.map((coverage) => {
              const accepted = coverage.limite_aceito !== null
                ? ' · ' + currency.format(coverage.limite_aceito)
                : coverage.percentual_fipe_aceito !== null ? ' · ' + percent.format(coverage.percentual_fipe_aceito) + '% FIPE' : ''
              return <span key={coverage.id} className="rounded-full bg-bg-surface-2 px-2.5 py-1 text-xs font-bold text-fg-2">{coverage.name}{accepted}</span>
            })}</div>
          </div>
          <div className="text-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-fg-4">Comissão aplicada</p>
            <p className="mt-2 font-black text-fg-1">{percent.format(result.execution.comissao_pct_aplicada ?? 0)}% · {currency.format(quote.comissao_valor ?? 0)}</p>
            <p className="mt-0.5 text-xs text-fg-3">{result.execution.comissao_origem === 'SOBRESCRITA' ? 'Sobrescrita nesta seguradora' : 'Herdada do padrão do cálculo'}</p>
          </div>
        </div>

        {(quote.mensagem_seguradora || quote.restricoes) && <div className="mt-4 grid gap-2">{quote.mensagem_seguradora && <p className="flex items-start gap-2 rounded-[6px] bg-accent-primary-soft p-3 text-xs font-semibold text-fg-2"><Info size={14} className="mt-0.5 shrink-0 text-accent-primary" />{quote.mensagem_seguradora}</p>}{quote.restricoes && <p className="flex items-start gap-2 rounded-[6px] bg-signal-warning/10 p-3 text-xs font-semibold text-fg-2"><CircleAlert size={14} className="mt-0.5 shrink-0 text-signal-warning" />{quote.restricoes}</p>}</div>}
      </div>

      {adjusting && <div className="border-t border-border-1 bg-bg-surface-2 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="w-full max-w-xs"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Comissão na nova tentativa (%)</span><input type="number" min="0" step="0.01" value={adjustment.value} onChange={(event) => onSetAdjustment({ executionId: result.execution.id, value: event.target.value })} className={inputClass} /></label>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => onSetAdjustment(null)} className={secondaryButton}>Cancelar</button><button type="button" disabled={busy} onClick={() => onApplyAdjustment(result)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-accent-primary-fg hover:bg-accent-primary-hover disabled:opacity-50"><Play size={13} /> Gerar nova tentativa</button></div>
        </div>
        <p className="mt-2 text-xs text-fg-3">Ajustar pessoa, risco, vigência ou cobertura exige criar uma nova versão do cálculo. Aqui somente a comissão desta seguradora muda.</p>
      </div>}

      {expanded && <ResultDetails result={result} />}
    </article>
  )
}

function SectionHeading({ number, title, description, compact = false }: { number: string; title: string; description: string; compact?: boolean }) {
  return <div className={compact ? 'flex items-start gap-3' : 'mb-5 flex items-start gap-3'}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-black text-accent-primary-fg">{number}</span><div><h2 className="text-sm font-black uppercase tracking-wide text-fg-1">{title}</h2><p className="mt-0.5 max-w-3xl text-xs text-fg-3">{description}</p></div></div>
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="rounded-[6px] bg-bg-surface-2 p-3"><div className="flex items-center gap-2 text-accent-primary">{icon}<span className="text-[10px] font-black uppercase tracking-wider text-fg-4">{label}</span></div><p className="mt-2 text-sm font-black text-fg-1">{value}</p></div>
}

function ResultDetails({ result }: { result: CalculationExecutionView }) {
  return <div className="border-t border-border-1 bg-bg-surface-2 p-4 sm:p-5">
    <div className="grid gap-5 xl:grid-cols-2">
      <div>
        <h4 className="flex items-center gap-2 text-sm font-black text-fg-1"><ShieldCheck size={15} className="text-accent-primary" /> Coberturas devolvidas</h4>
        <div className="mt-3 divide-y divide-border-1 overflow-hidden rounded-[6px] border border-border-1 bg-bg-surface">{result.coverages.map((coverage) => <div key={coverage.id} className="p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-fg-1">{coverage.name}</p><span className="text-[10px] font-black uppercase tracking-wide text-signal-success">{coverage.incluida ? 'Incluída' : 'Não incluída'}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-3">{coverage.limite_aceito !== null && <span>Limite {currency.format(coverage.limite_aceito)}</span>}{coverage.percentual_fipe_aceito !== null && <span>{percent.format(coverage.percentual_fipe_aceito)}% FIPE</span>}{coverage.franquia_valor !== null && <span>Franquia {coverage.franquia_tipo?.toLocaleLowerCase('pt-BR')} · {currency.format(coverage.franquia_valor)}</span>}{coverage.premio !== null && <span>Prêmio {currency.format(coverage.premio)}</span>}</div>{coverage.clausula_texto && <p className="mt-2 text-xs text-fg-2">{coverage.clausula_texto}</p>}</div>)}</div>
      </div>
      <div>
        <h4 className="flex items-center gap-2 text-sm font-black text-fg-1"><ReceiptText size={15} className="text-accent-primary" /> Opções de pagamento</h4>
        <div className="mt-3 divide-y divide-border-1 overflow-hidden rounded-[6px] border border-border-1 bg-bg-surface">{result.installments.map((installment) => <div key={installment.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-fg-1">{installment.forma_pagamento.replaceAll('_', ' ')}</p>{installment.principal && <span className="rounded-full bg-accent-primary-soft px-2 py-0.5 text-[10px] font-black text-accent-primary">Principal</span>}</div><p className="mt-1 text-xs text-fg-3">{installment.quantidade_parcelas === 1 ? 'À vista' : String(installment.quantidade_parcelas) + ' parcelas'} · primeiro vencimento {fmtDate(installment.primeiro_vencimento)}</p></div><div className="sm:text-right"><p className="text-sm font-black text-fg-1">{installment.quantidade_parcelas > 1 ? String(installment.quantidade_parcelas) + 'x ' + currency.format(installment.valor_parcela ?? 0) : currency.format(installment.valor_total ?? 0)}</p><p className="text-xs text-fg-3">Total {currency.format(installment.valor_total ?? 0)}</p></div></div>)}</div>
      </div>
    </div>
  </div>
}
