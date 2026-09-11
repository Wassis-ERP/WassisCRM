import { opportunityPermissionContext } from '../modules/plataforma/platformDomain'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import CommercialPresentationDocument from '../components/oportunidades/CommercialPresentationDocument'
import { presentationCoverage, presentationPayment } from '../modules/comercial/commercialPresentationFormat'
import { getQuoteProposalOrigin } from '../modules/comercial/quoteProposalOrigin'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Columns3,
  FileChartColumnIncreasing,
  FileDown,
  Info,
  LayoutList,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import { useAuth } from '../hooks/useAuth'
import {
  useCommercialPresentationWorkspace,
  useSaveCommercialPresentation,
  useToggleCommercialPresentationQuote,
} from '../hooks/useCommercialPresentation'
import { useOportunidade } from '../hooks/useOportunidades'
import { usePermission } from '../hooks/usePermission'
import {
  MAX_PRESENTATION_QUOTES,
  alignCommercialPresentationCoverages,
  type CommercialPresentationCandidate,
  type CommercialPresentationItemInput,
  type CommercialPresentationWorkspace,
  type SaveCommercialPresentationInput,
} from '../modules/comercial/commercialPresentationDomain'
import type {
  ApresentacaoCriterioOrdenacao,
  ApresentacaoLayout,
  ApresentacaoStatus,
} from '../types/database'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const inputClass = 'w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-3 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-full border border-border-1 px-4 py-2.5 text-xs font-black text-fg-2 hover:border-accent-primary/30 hover:bg-accent-primary-soft hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-50'

type EditorStep = 'COMPARAR' | 'CONFIGURAR' | 'PREVIA'

type PresentationDraft = {
  presentationId?: string
  selectedQuoteId: string | null
  title: string
  layout: ApresentacaoLayout
  ordering: ApresentacaoCriterioOrdenacao
  showFipe: boolean
  showAdvantages: boolean
  showLegend: boolean
  showNotes: boolean
  showCommission: boolean
  commercialNotes: string
  items: CommercialPresentationItemInput[]
}

function draftFromWorkspace(workspace: CommercialPresentationWorkspace): PresentationDraft {
  const presentation = workspace.presentation
  return {
    presentationId: presentation?.id,
    selectedQuoteId: presentation?.cotacao_escolhida_id ?? null,
    title: presentation?.titulo ?? 'Comparativo comercial',
    layout: presentation?.layout ?? 'HORIZONTAL',
    ordering: presentation?.criterio_ordenacao ?? 'MANUAL',
    showFipe: presentation?.exibir_percentual_fipe ?? true,
    showAdvantages: presentation?.exibir_vantagens ?? true,
    showLegend: presentation?.exibir_legenda ?? true,
    showNotes: presentation?.exibir_observacoes ?? true,
    showCommission: presentation?.exibir_comissao ?? false,
    commercialNotes: presentation?.observacoes_comerciais ?? '',
    items: workspace.items.map(({ item }) => ({
      quoteId: item.cotacao_id,
      installmentId: item.parcelamento_id,
      recommended: item.recomendada ?? false,
      commercialTitle: item.titulo_comercial,
      advantagesText: item.vantagens_texto,
      commercialNote: item.observacao_comercial,
    })),
  }
}

function draftFingerprint(draft: PresentationDraft): string {
  return JSON.stringify(draft)
}

const paymentLabel = presentationPayment


function scrollPageToTop() {
  document.querySelector<HTMLElement>('main .custom-scrollbar')?.scrollTo({ top: 0 })
}

export default function CommercialPresentationPage() {
  const { oportunidadeId } = useParams<{ oportunidadeId: string }>()
  const navigate = useNavigate()
  const opportunity = useOportunidade(oportunidadeId)
  const workspace = useCommercialPresentationWorkspace(oportunidadeId)
  const { can } = usePermission('comercial', opportunityPermissionContext(opportunity.data))

  useEffect(() => {
    scrollPageToTop()
  }, [])

  if (!oportunidadeId) return <PageState title="Identificador inválido" description="Não foi possível localizar a oportunidade." onBack={() => navigate('/oportunidades')} />
  if (opportunity.isLoading || workspace.isLoading) return <PageSkeleton />
  if (opportunity.isError || !opportunity.data) return <PageState title="Oportunidade não encontrada" description="O registro pode ter sido removido ou não estar acessível." onBack={() => navigate('/oportunidades')} />
  if (workspace.isError || !workspace.data) return <PageState title="Comparativo indisponível" description="Não foi possível carregar as cotações e o rascunho desta oportunidade." onBack={() => navigate(`/oportunidades/${oportunidadeId}?tab=calculos`)} onRetry={() => void workspace.refetch()} />

  return (
    <PresentationEditor
      key={workspace.data.presentation?.id ?? 'new-presentation'}
      opportunity={opportunity.data}
      initialWorkspace={workspace.data}
      canEdit={can('update')}
      onBack={() => navigate(`/oportunidades/${oportunidadeId}?tab=calculos`)}
    />
  )
}

function PresentationEditor({ opportunity, initialWorkspace, canEdit, onBack }: {
  opportunity: NonNullable<ReturnType<typeof useOportunidade>['data']>
  initialWorkspace: CommercialPresentationWorkspace
  canEdit: boolean
  onBack: () => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const toggleQuote = useToggleCommercialPresentationQuote()
  const savePresentation = useSaveCommercialPresentation()
  const [step, setStep] = useState<EditorStep>('COMPARAR')
  const [draft, setDraft] = useState(() => draftFromWorkspace(initialWorkspace))
  const [savedFingerprint, setSavedFingerprint] = useState(() => draftFingerprint(draftFromWorkspace(initialWorkspace)))
  const [status, setStatus] = useState<ApresentacaoStatus>(initialWorkspace.presentation?.status ?? 'RASCUNHO')
  const [generatedAt, setGeneratedAt] = useState(initialWorkspace.presentation?.gerada_em ?? null)
  const candidates = initialWorkspace.candidates
  const candidateByQuote = useMemo(() => new Map(candidates.map((candidate) => [candidate.quote.id, candidate])), [candidates])
  const selectedQuoteIds = useMemo(() => new Set(draft.items.map((item) => item.quoteId)), [draft.items])
  const selectedViews = useMemo(() => draft.items.flatMap((item) => {
    const candidate = candidateByQuote.get(item.quoteId)
    return candidate ? [{ item, candidate }] : []
  }), [candidateByQuote, draft.items])
  const comparison = useMemo(
    () => alignCommercialPresentationCoverages(selectedViews.map((row) => row.candidate)),
    [selectedViews],
  )
  const dirty = draftFingerprint(draft) !== savedFingerprint
  const canShowCommission = user?.role === 'admin'
  const existingProposal = draft.selectedQuoteId ? getQuoteProposalOrigin(draft.selectedQuoteId).proposal : null

  const updateDraft = (updater: (current: PresentationDraft) => PresentationDraft) => {
    setDraft(updater)
    setStatus('RASCUNHO')
    setGeneratedAt(null)
  }

  const buildSaveInput = (nextStatus: ApresentacaoStatus): SaveCommercialPresentationInput => ({
    presentationId: draft.presentationId,
    opportunityId: opportunity.id,
    createdById: user?.id ?? null,
    selectedQuoteId: draft.selectedQuoteId,
    title: draft.title,
    layout: draft.layout,
    ordering: draft.ordering,
    showFipe: draft.showFipe,
    showAdvantages: draft.showAdvantages,
    showLegend: draft.showLegend,
    showNotes: draft.showNotes,
    showCommission: canShowCommission ? draft.showCommission : false,
    commercialNotes: draft.commercialNotes,
    status: nextStatus,
    items: draft.items,
  })

  const persist = async (nextStatus: ApresentacaoStatus, announce = true): Promise<boolean> => {
    try {
      const workspace = await savePresentation.mutateAsync(buildSaveInput(nextStatus))
      const nextDraft = draftFromWorkspace(workspace)
      setDraft(nextDraft)
      setSavedFingerprint(draftFingerprint(nextDraft))
      setStatus(workspace.presentation?.status ?? nextStatus)
      setGeneratedAt(workspace.presentation?.gerada_em ?? null)
      if (announce) notify({
        title: nextStatus === 'GERADA' ? 'Representação mock gerada' : 'Rascunho salvo',
        description: nextStatus === 'GERADA'
          ? 'A prévia foi congelada no mock e está pronta para impressão ou salvamento em PDF pelo navegador.'
          : 'Seleção e configurações permanecem disponíveis nesta sessão.',
        tone: 'success',
      })
      return true
    } catch (cause) {
      notify({
        title: nextStatus === 'GERADA' ? 'Não foi possível gerar' : 'Não foi possível salvar',
        description: cause instanceof Error ? cause.message : 'Revise os dados e tente novamente.',
        tone: 'danger',
      })
      return false
    }
  }

  const goToStep = async (nextStep: EditorStep) => {
    if (nextStep !== 'COMPARAR' && draft.items.length === 0) {
      notify({ title: 'Selecione uma cotação', description: 'Adicione ao menos um produto antes de continuar.', tone: 'warning' })
      return
    }
    if (dirty && !(await persist('RASCUNHO', false))) return
    setStep(nextStep)
    scrollPageToTop()
  }

  const leave = async () => {
    if (!dirty) {
      onBack()
      return
    }
    const confirmed = await confirm({
      title: 'Sair sem salvar alterações?',
      description: 'A seleção já persistida será mantida, mas as configurações ainda não salvas serão descartadas.',
      confirmLabel: 'Sair sem salvar',
      cancelLabel: 'Continuar editando',
      tone: 'warning',
    })
    if (confirmed) onBack()
  }

  const toggleCandidate = async (quoteId: string) => {
    if (!canEdit) return
    const wasSelected = selectedQuoteIds.has(quoteId)
    try {
      const workspace = await toggleQuote.mutateAsync({ opportunityId: opportunity.id, quoteId, createdById: user?.id ?? null })
      const nextDraft = draftFromWorkspace(workspace)
      setDraft(nextDraft)
      setSavedFingerprint(draftFingerprint(nextDraft))
      setStatus('RASCUNHO')
      setGeneratedAt(null)
      notify({
        title: wasSelected ? 'Cotação removida' : 'Cotação adicionada',
        description: `Comparativo atualizado com ${workspace.items.length} de ${MAX_PRESENTATION_QUOTES} produtos.`,
        tone: 'success',
      })
    } catch (cause) {
      notify({
        title: 'Não foi possível atualizar a seleção',
        description: cause instanceof Error ? cause.message : 'Revise os produtos e tente novamente.',
        tone: 'warning',
      })
    }
  }

  const moveItem = (index: number, direction: -1 | 1) => updateDraft((current) => {
    const target = index + direction
    if (target < 0 || target >= current.items.length) return current
    const items = [...current.items]
    ;[items[index], items[target]] = [items[target], items[index]]
    return { ...current, items, ordering: 'MANUAL' }
  })

  return (
    <div className="-m-8 min-h-full bg-bg-app p-8 text-fg-1">
      <header className="mb-5 flex flex-col gap-4 border-b border-border-1 pb-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <button type="button" onClick={() => void leave()} className="mb-3 inline-flex items-center gap-2 text-xs font-black text-fg-3 hover:text-accent-primary">
            <ArrowLeft size={14} /> Voltar aos cálculos
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-fg-1">Comparativo e apresentação</h1>
            <span className={status === 'GERADA' ? 'rounded-full bg-signal-success/10 px-2.5 py-1 text-[10px] font-black text-signal-success' : 'rounded-full bg-signal-warning/10 px-2.5 py-1 text-[10px] font-black text-signal-warning'}>
              {status === 'GERADA' ? 'Representação gerada' : 'Rascunho'}
            </span>
          </div>
          <p className="mt-1 text-sm text-fg-3">{opportunity.titulo} · selecione resultados da mesma oportunidade sem alterar as cotações oficiais.</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" disabled={!canEdit || savePresentation.isPending || !dirty} onClick={() => void persist('RASCUNHO')} className={secondaryButton}>
            {savePresentation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar rascunho
          </button>
          <button type="button" disabled={!canEdit || savePresentation.isPending || draft.items.length === 0} onClick={async () => { if (await persist('GERADA')) setStep('PREVIA') }} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            <FileDown size={14} /> Gerar apresentação
          </button>
        </div>
      </header>

      {!canEdit && <div className="mb-4 flex items-start gap-3 rounded-[8px] bg-signal-warning/10 p-4 text-sm"><Info size={17} className="mt-0.5 shrink-0 text-signal-warning" /><div><p className="font-black text-fg-1">Consulta somente leitura</p><p className="mt-1 text-xs text-fg-3">Seu perfil pode revisar a apresentação, mas não alterar a seleção nem gerar uma nova versão.</p></div></div>}

      <StepNavigation active={step} onChange={(next) => void goToStep(next)} />

      {draft.selectedQuoteId && <section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-4 print:hidden">
        <div><h2 style={{ fontSize: 14 }} className="text-sm font-bold text-fg-1">Formalizar a escolha do cliente</h2><p className="mt-1 text-xs text-fg-3">Revise o documento antes de concluir. A cotação será vinculada à proposta.</p></div>
        <div className="flex flex-wrap gap-2">{existingProposal ? <button type="button" className={secondaryButton} onClick={() => navigate(`/apolices/${existingProposal.apolice_id}`)}>Abrir proposta vinculada</button> : <>
          <button type="button" disabled={!canEdit || savePresentation.isPending} className={secondaryButton} onClick={async () => { if (await persist('RASCUNHO', false)) navigate(`/propostas/novo?cotacao=${encodeURIComponent(draft.selectedQuoteId!)}`) }}>Cadastrar proposta</button>
          <button type="button" disabled={!canEdit || savePresentation.isPending} className={secondaryButton} onClick={async () => { if (await persist('RASCUNHO', false)) navigate(`/propostas/importar?cotacao=${encodeURIComponent(draft.selectedQuoteId!)}`) }}>Importar proposta</button>
        </>}</div>
      </section>}

      {step === 'COMPARAR' && (
        <CompareStep
          candidates={candidates}
          selectedQuoteIds={selectedQuoteIds}
          selectedViews={selectedViews}
          comparison={comparison}
          canEdit={canEdit}
          pending={toggleQuote.isPending}
          onToggle={toggleCandidate}
          onContinue={() => void goToStep('CONFIGURAR')}
        />
      )}
      {step === 'CONFIGURAR' && (
        <ConfigureStep
          draft={draft}
          selectedViews={selectedViews}
          canEdit={canEdit}
          canShowCommission={canShowCommission}
          onChange={updateDraft}
          onMove={moveItem}
          onBack={() => void goToStep('COMPARAR')}
          onContinue={() => void goToStep('PREVIA')}
        />
      )}
      {step === 'PREVIA' && (
        <PreviewStep
          opportunity={opportunity}
          draft={{ ...draft, showCommission: canShowCommission && draft.showCommission }}
          selectedViews={selectedViews}
          comparison={comparison}
          status={status}
          generatedAt={generatedAt}
          canEdit={canEdit}
          onBack={() => void goToStep('CONFIGURAR')}
          onGenerate={async () => { await persist('GERADA') }}
        />
      )}
    </div>
  )
}

function StepNavigation({ active, onChange }: { active: EditorStep; onChange: (step: EditorStep) => void }) {
  const steps: Array<{ id: EditorStep; label: string; description: string }> = [
    { id: 'COMPARAR', label: 'Comparar', description: 'Seleção e diferenças' },
    { id: 'CONFIGURAR', label: 'Configurar', description: 'Ordem e conteúdo' },
    { id: 'PREVIA', label: 'Prévia', description: 'Representação final' },
  ]
  return (
    <nav className="mb-5 overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)] print:hidden" aria-label="Etapas da apresentação">
      <ol className="grid md:grid-cols-3">
        {steps.map((step, index) => {
          const selected = active === step.id
          return <li key={step.id} className="border-b border-border-1 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><button type="button" onClick={() => onChange(step.id)} className={selected ? 'flex w-full items-center gap-3 bg-accent-primary-soft px-4 py-3 text-left text-accent-primary' : 'flex w-full items-center gap-3 px-4 py-3 text-left text-fg-3 hover:bg-bg-surface-2 hover:text-fg-1'}><span className={selected ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-black text-fg-on-brand' : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-surface-3 text-xs font-black text-fg-3'}>{index + 1}</span><span><span className="block text-xs font-black">{step.label}</span><span className="mt-0.5 block text-[11px] font-semibold opacity-80">{step.description}</span></span></button></li>
        })}
      </ol>
    </nav>
  )
}

function CompareStep({ candidates, selectedQuoteIds, selectedViews, comparison, canEdit, pending, onToggle, onContinue }: {
  candidates: CommercialPresentationCandidate[]
  selectedQuoteIds: Set<string>
  selectedViews: Array<{ item: CommercialPresentationItemInput; candidate: CommercialPresentationCandidate }>
  comparison: ReturnType<typeof alignCommercialPresentationCoverages>
  canEdit: boolean
  pending: boolean
  onToggle: (quoteId: string) => Promise<void>
  onContinue: () => void
}) {
  const groups = useMemo(() => {
    const grouped = new Map<string, CommercialPresentationCandidate[]>()
    candidates.forEach((candidate) => grouped.set(candidate.profileLabel, [...(grouped.get(candidate.profileLabel) ?? []), candidate]))
    return Array.from(grouped.entries())
  }, [candidates])
  return (
    <div className="space-y-5">
      <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-3 border-b border-border-1 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="flex items-center gap-2 text-base font-black text-fg-1"><Columns3 size={18} className="text-accent-primary" /> Resultados disponíveis</h2><p className="mt-1 text-sm text-fg-3">Combine até {MAX_PRESENTATION_QUOTES} resultados, inclusive de versões diferentes. O perfil permanece explícito em cada produto.</p></div>
          <span className="shrink-0 rounded-full bg-bg-surface-3 px-3 py-1.5 text-xs font-black text-fg-2">{selectedQuoteIds.size} de {MAX_PRESENTATION_QUOTES} selecionados</span>
        </div>
        {groups.length === 0 ? <EmptyResults /> : <div className="mt-4 space-y-5">{groups.map(([profile, rows]) => <div key={profile}><div className="mb-2 flex items-center gap-2"><LayoutList size={14} className="text-accent-primary" /><h3 className="text-xs font-black text-fg-1">{profile}</h3><span className="text-[11px] font-semibold text-fg-3">{rows.length} {rows.length === 1 ? 'resultado' : 'resultados'}</span></div><div className="divide-y divide-border-1 overflow-hidden rounded-[6px] border border-border-1">{rows.map((candidate) => {
          const selected = selectedQuoteIds.has(candidate.quote.id)
          return <label key={candidate.quote.id} className={selected ? 'grid cursor-pointer gap-3 bg-accent-primary-soft/60 p-4 md:grid-cols-[auto_minmax(180px,1fr)_repeat(3,minmax(130px,0.7fr))] md:items-center' : 'grid cursor-pointer gap-3 bg-bg-surface p-4 hover:bg-bg-surface-2 md:grid-cols-[auto_minmax(180px,1fr)_repeat(3,minmax(130px,0.7fr))] md:items-center'}><input type="checkbox" disabled={!canEdit || pending} checked={selected} onChange={() => void onToggle(candidate.quote.id)} className="h-4 w-4 rounded border-border-2 text-accent-primary focus:ring-accent-primary" /><span><span className="block text-sm font-black text-fg-1">{candidate.insurerName}</span><span className="mt-0.5 block font-mono text-[11px] text-fg-3">{candidate.quote.numero_cotacao_seguradora ?? 'Sem número externo'}</span></span><DataPoint label="Prêmio" value={currency.format(candidate.quote.premio_total ?? 0)} /><DataPoint label="Franquia" value={candidate.franchiseValue === null ? 'Não informada' : currency.format(candidate.franchiseValue)} /><DataPoint label="Pagamento" value={paymentLabel(candidate.primaryInstallment)} /></label>
        })}</div></div>)}</div>}
      </section>

      {selectedViews.length > 0 && <ComparisonTable selectedViews={selectedViews} comparison={comparison} />}

      <div className="flex justify-end print:hidden"><button type="button" disabled={selectedViews.length === 0} onClick={onContinue} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-50">Configurar apresentação <ArrowRight size={14} /></button></div>
    </div>
  )
}

function ComparisonTable({ selectedViews, comparison }: {
  selectedViews: Array<{ item: CommercialPresentationItemInput; candidate: CommercialPresentationCandidate }>
  comparison: ReturnType<typeof alignCommercialPresentationCoverages>
}) {
  const columns = `220px repeat(${selectedViews.length}, minmax(220px, 1fr))`
  return <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]"><div className="border-b border-border-1 p-5"><h2 className="flex items-center gap-2 text-base font-black text-fg-1"><FileChartColumnIncreasing size={18} className="text-accent-primary" /> Comparação lado a lado</h2><p className="mt-1 text-sm text-fg-3">Ausências e diferenças de limite, FIPE e franquia são destacadas sem preencher valores não devolvidos.</p></div><div className="overflow-x-auto"><div style={{ display: 'grid', gridTemplateColumns: columns, minWidth: `${220 + selectedViews.length * 220}px` }}><div className="border-b border-r border-border-1 bg-bg-surface-2 p-3 text-[10px] font-black uppercase tracking-wider text-fg-4">Produto</div>{selectedViews.map(({ candidate }) => <div key={candidate.quote.id} className="border-b border-r border-border-1 bg-bg-surface-2 p-3 last:border-r-0"><p className="text-sm font-black text-fg-1">{candidate.insurerShortName}</p><p className="mt-1 text-[11px] font-semibold text-fg-3">{candidate.profileLabel}</p></div>)}<ComparisonMetric label="Prêmio total" cells={selectedViews.map(({ candidate }) => currency.format(candidate.quote.premio_total ?? 0))} /><ComparisonMetric label="Pagamento principal" cells={selectedViews.map(({ candidate }) => paymentLabel(candidate.primaryInstallment))} /><ComparisonMetric label="Franquia principal" cells={selectedViews.map(({ candidate }) => candidate.franchiseValue === null ? 'Não informada' : currency.format(candidate.franchiseValue))} highlight />{comparison.map((row) => <ComparisonMetric key={row.key} label={row.name} highlight={row.differs} cells={row.cells.map(({ coverage }) => coverage ? coverageValue(coverage) : 'Não oferecida')} />)}</div></div></section>
}

function ComparisonMetric({ label, cells, highlight = false }: { label: string; cells: string[]; highlight?: boolean }) {
  return <><div className={highlight ? 'border-b border-r border-border-1 bg-signal-warning/10 p-3 text-xs font-black text-fg-1' : 'border-b border-r border-border-1 p-3 text-xs font-black text-fg-2'}>{label}</div>{cells.map((cell, index) => <div key={`${label}-${index}`} className={highlight ? 'border-b border-r border-border-1 bg-signal-warning/5 p-3 text-xs font-semibold text-fg-2 last:border-r-0' : 'border-b border-r border-border-1 p-3 text-xs font-semibold text-fg-2 last:border-r-0'}>{cell}</div>)}</>
}

const coverageValue = presentationCoverage

function ConfigureStep({ draft, selectedViews, canEdit, canShowCommission, onChange, onMove, onBack, onContinue }: {
  draft: PresentationDraft
  selectedViews: Array<{ item: CommercialPresentationItemInput; candidate: CommercialPresentationCandidate }>
  canEdit: boolean
  canShowCommission: boolean
  onChange: (updater: (current: PresentationDraft) => PresentationDraft) => void
  onMove: (index: number, direction: -1 | 1) => void
  onBack: () => void
  onContinue: () => void
}) {
  const updateItem = (quoteId: string, patch: Partial<CommercialPresentationItemInput>) => onChange((current) => ({
    ...current,
    items: current.items.map((item) => item.quoteId === quoteId ? { ...item, ...patch } : item),
  }))
  return <div className="space-y-5"><section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]"><h2 className="text-base font-black text-fg-1">Estrutura da apresentação</h2><p className="mt-1 text-sm text-fg-3">Defina o formato e o conteúdo visível. Os valores oficiais das cotações permanecem somente leitura.</p><div className="mt-5 grid gap-5 lg:grid-cols-2"><label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Título</span><input disabled={!canEdit} value={draft.title} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></label><label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Ordenar por</span><select disabled={!canEdit} value={draft.ordering} onChange={(event) => onChange((current) => ({ ...current, ordering: event.target.value as ApresentacaoCriterioOrdenacao }))} className={inputClass}><option value="MANUAL">Ordem manual</option><option value="RECOMENDACAO">Recomendação</option><option value="PREMIO">Menor prêmio</option><option value="FRANQUIA">Menor franquia</option></select></label><fieldset><legend className="mb-2 text-[10px] font-black uppercase tracking-wider text-fg-3">Layout</legend><div className="grid grid-cols-2 gap-2"><SegmentButton selected={draft.layout === 'HORIZONTAL'} disabled={!canEdit} onClick={() => onChange((current) => ({ ...current, layout: 'HORIZONTAL' }))} icon={<Columns3 size={15} />} label="Horizontal" /><SegmentButton selected={draft.layout === 'VERTICAL'} disabled={!canEdit} onClick={() => onChange((current) => ({ ...current, layout: 'VERTICAL' }))} icon={<LayoutList size={15} />} label="Vertical" /></div></fieldset><fieldset><legend className="mb-2 text-[10px] font-black uppercase tracking-wider text-fg-3">Conteúdo visível</legend><div className="grid gap-2 sm:grid-cols-2"><Toggle label="Percentual FIPE" checked={draft.showFipe} disabled={!canEdit} onChange={(checked) => onChange((current) => ({ ...current, showFipe: checked }))} /><Toggle label="Vantagens" checked={draft.showAdvantages} disabled={!canEdit} onChange={(checked) => onChange((current) => ({ ...current, showAdvantages: checked }))} /><Toggle label="Legenda" checked={draft.showLegend} disabled={!canEdit} onChange={(checked) => onChange((current) => ({ ...current, showLegend: checked }))} /><Toggle label="Observações" checked={draft.showNotes} disabled={!canEdit} onChange={(checked) => onChange((current) => ({ ...current, showNotes: checked }))} /><Toggle label="Comissão" checked={draft.showCommission} disabled={!canEdit || !canShowCommission} onChange={(checked) => onChange((current) => ({ ...current, showCommission: checked }))} /></div>{!canShowCommission && <p className="mt-2 text-[11px] font-semibold text-signal-warning">A comissão só pode ser exibida por perfil administrativo.</p>}</fieldset></div><label className="mt-5 block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Observações gerais ao cliente</span><textarea disabled={!canEdit} rows={3} value={draft.commercialNotes} onChange={(event) => onChange((current) => ({ ...current, commercialNotes: event.target.value }))} className={inputClass} placeholder="Orientações comerciais permitidas, sem alterar o retorno da seguradora." /></label></section>

    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]"><div className="border-b border-border-1 pb-4"><h2 className="text-base font-black text-fg-1">Produtos selecionados</h2><p className="mt-1 text-sm text-fg-3">Escolha parcelamento, destaque e textos comerciais para cada produto.</p></div><div className="mt-4 space-y-4">{selectedViews.map(({ item, candidate }, index) => <article key={candidate.quote.id} className="rounded-[6px] border border-border-1 bg-bg-surface-2 p-4"><div className="flex flex-col gap-3 border-b border-border-1 pb-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-fg-1">{candidate.insurerName}</h3>{item.recommended && <span className="rounded-full bg-accent-primary-soft px-2.5 py-1 text-[10px] font-black text-accent-primary">Recomendado</span>}{draft.selectedQuoteId === candidate.quote.id && <span className="rounded-full bg-signal-success/10 px-2.5 py-1 text-[10px] font-black text-signal-success">Escolha do cliente</span>}</div><p className="mt-1 text-xs font-semibold text-fg-3">{candidate.profileLabel} · {currency.format(candidate.quote.premio_total ?? 0)}</p></div><div className="flex flex-wrap gap-1"><button type="button" disabled={!canEdit || index === 0} onClick={() => onMove(index, -1)} className="rounded-[6px] p-2 text-fg-3 hover:bg-bg-surface-3 hover:text-fg-1 disabled:opacity-30" aria-label={`Mover ${candidate.insurerName} para cima`}><ArrowUp size={15} /></button><button type="button" disabled={!canEdit || index === selectedViews.length - 1} onClick={() => onMove(index, 1)} className="rounded-[6px] p-2 text-fg-3 hover:bg-bg-surface-3 hover:text-fg-1 disabled:opacity-30" aria-label={`Mover ${candidate.insurerName} para baixo`}><ArrowDown size={15} /></button></div></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Opção de pagamento</span><select disabled={!canEdit} value={item.installmentId ?? ''} onChange={(event) => updateItem(candidate.quote.id, { installmentId: event.target.value || null })} className={inputClass}>{candidate.installments.map((installment) => <option key={installment.id} value={installment.id}>{paymentLabel(installment)}</option>)}</select></label><label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Título comercial</span><input disabled={!canEdit} value={item.commercialTitle ?? ''} onChange={(event) => updateItem(candidate.quote.id, { commercialTitle: event.target.value })} className={inputClass} placeholder={candidate.insurerShortName} /></label><label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Vantagens permitidas</span><textarea disabled={!canEdit} rows={2} value={item.advantagesText ?? ''} onChange={(event) => updateItem(candidate.quote.id, { advantagesText: event.target.value })} className={inputClass} placeholder="Resumo comercial sem modificar coberturas ou valores." /></label><label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Observação comercial</span><textarea disabled={!canEdit} rows={2} value={item.commercialNote ?? ''} onChange={(event) => updateItem(candidate.quote.id, { commercialNote: event.target.value })} className={inputClass} placeholder="Orientação específica deste produto." /></label></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!canEdit} onClick={() => updateItem(candidate.quote.id, { recommended: !item.recommended })} className={item.recommended ? 'inline-flex items-center gap-2 rounded-full bg-accent-primary-soft px-3 py-2 text-xs font-black text-accent-primary' : secondaryButton}><Sparkles size={14} /> {item.recommended ? 'Produto recomendado' : 'Marcar como recomendado'}</button><button type="button" disabled={!canEdit} onClick={() => onChange((current) => ({ ...current, selectedQuoteId: current.selectedQuoteId === candidate.quote.id ? null : candidate.quote.id }))} className={draft.selectedQuoteId === candidate.quote.id ? 'inline-flex items-center gap-2 rounded-full bg-signal-success/10 px-3 py-2 text-xs font-black text-signal-success' : secondaryButton}><BadgeCheck size={14} /> {draft.selectedQuoteId === candidate.quote.id ? 'Escolha registrada' : 'Registrar escolha do cliente'}</button></div></article>)}</div><div className="mt-4 flex items-start gap-2 rounded-[6px] bg-accent-primary-soft p-3 text-xs font-semibold text-fg-2"><Info size={14} className="mt-0.5 shrink-0 text-accent-primary" />Registrar a escolha não cria proposta. A efetivação permanece uma ação explícita fora deste fluxo.</div></section>

    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between print:hidden"><button type="button" onClick={onBack} className={secondaryButton}><ArrowLeft size={14} /> Voltar ao comparativo</button><button type="button" onClick={onContinue} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover">Ver prévia <ArrowRight size={14} /></button></div></div>
}

function PreviewStep({ opportunity, draft, selectedViews, comparison, status, generatedAt, canEdit, onBack, onGenerate }: {
  opportunity: NonNullable<ReturnType<typeof useOportunidade>['data']>
  draft: PresentationDraft
  selectedViews: Array<{ item: CommercialPresentationItemInput; candidate: CommercialPresentationCandidate }>
  comparison: ReturnType<typeof alignCommercialPresentationCoverages>
  status: ApresentacaoStatus
  generatedAt: string | null
  canEdit: boolean
  onBack: () => void
  onGenerate: () => Promise<void>
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-[var(--shadow-1)] sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-start gap-3">
          <Info size={17} className="mt-0.5 shrink-0 text-accent-primary" />
          <div>
            <p className="text-sm font-black text-fg-1">Confira a apresentação antes de salvar</p>
            <p className="mt-1 text-xs text-fg-3">Revise as opções e as condições. Gere a apresentação e escolha Salvar como PDF na impressão.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={onBack} className={secondaryButton}><ArrowLeft size={14} /> Ajustar</button>
          {status === 'GERADA' ? (
            <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-xs font-black text-fg-on-brand hover:bg-accent-primary-hover"><Printer size={14} /> Imprimir ou salvar PDF</button>
          ) : (
            <button type="button" disabled={!canEdit} onClick={() => void onGenerate()} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-xs font-black text-fg-on-brand hover:bg-accent-primary-hover disabled:opacity-50"><FileDown size={14} /> Gerar representação mock</button>
          )}
        </div>
      </div>

      <CommercialPresentationDocument
        title={opportunity.titulo}
        insuredName={opportunity.segurados?.nome ?? opportunity.lead_nome ?? 'Não informado'}
        draft={draft}
        selectedViews={selectedViews}
        comparison={comparison}
        generatedAt={generatedAt}
      />
    </div>
  )
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return <span className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-4">{label}</span><span className="mt-1 block truncate text-xs font-black text-fg-2" title={value}>{value}</span></span>
}

function SegmentButton({ selected, disabled, onClick, icon, label }: { selected: boolean; disabled: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={selected ? 'inline-flex items-center justify-center gap-2 rounded-[6px] border border-accent-primary bg-accent-primary-soft px-3 py-2.5 text-xs font-black text-accent-primary' : 'inline-flex items-center justify-center gap-2 rounded-[6px] border border-border-1 px-3 py-2.5 text-xs font-black text-fg-3 hover:bg-bg-surface-2 disabled:opacity-50'}>{icon}{label}</button>
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2 text-xs font-bold text-fg-2"><input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-border-2 text-accent-primary focus:ring-accent-primary" />{label}</label>
}


function EmptyResults() {
  return <div className="mt-4 flex min-h-48 flex-col items-center justify-center rounded-[6px] border border-dashed border-border-2 bg-bg-surface-2 px-6 py-8 text-center"><ReceiptText size={24} className="text-accent-primary" /><h3 className="mt-3 text-sm font-black text-fg-1">Nenhuma cotação disponível</h3><p className="mt-1 max-w-xl text-sm text-fg-3">Abra uma versão de cálculo e conclua ao menos uma execução por seguradora. Os resultados apresentados aparecerão aqui agrupados pelo perfil cotado.</p></div>
}

function PageSkeleton() {
  return <div className="-m-8 min-h-full bg-bg-app p-8" aria-label="Carregando comparativo"><div className="h-20 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="mt-5 h-16 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="mt-5 h-96 animate-pulse rounded-[8px] bg-bg-surface-2" /></div>
}

function PageState({ title, description, onBack, onRetry }: { title: string; description: string; onBack: () => void; onRetry?: () => void }) {
  return <div className="-m-8 flex min-h-full items-center justify-center bg-bg-app p-8"><div className="w-full max-w-xl rounded-[8px] border border-border-1 bg-bg-surface p-6 text-center shadow-[var(--shadow-1)]"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[8px] bg-accent-primary-soft text-accent-primary"><ShieldCheck size={21} /></span><h1 className="mt-4 text-lg font-black text-fg-1">{title}</h1><p className="mt-1 text-sm text-fg-3">{description}</p><div className="mt-5 flex justify-center gap-2">{onRetry && <button type="button" onClick={onRetry} className={secondaryButton}><RefreshCw size={14} /> Tentar novamente</button>}<button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-xs font-black text-fg-on-brand hover:bg-accent-primary-hover"><ArrowLeft size={14} /> Voltar</button></div></div></div>
}
