import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileText,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import type { Segurado } from '../../../contexts/seguradosCore'
import { usePropostas } from '../../../contexts/usePropostas'
import { useCreateSegurado } from '../../../hooks/useSegurados'
import { buildCreateSeguradoInput } from '../../../lib/seguradoMapper'
import NovoSeguradoModal from '../../NovoSeguradoModal'
import { useSystemFeedback } from '../../feedback/systemFeedbackContext'
import AppModal from '../../modals/AppModal'
import {
  applyManualInsuredDefaults,
  createEmptyItem,
  createManualDraft,
  createManualInsuranceDocument,
  getManualLookups,
  hasManualItemContent,
  suggestManualGrade,
  validateManualDraft,
} from './cadastroManualDomain'
import {
  ContextStep,
  DocumentStep,
  FinanceStep,
  ItemsStep,
  ReviewStep,
} from './CadastroManualSteps'
import type { ManualDocumentDraft } from './cadastroManualTypes'

const steps = [
  { label: 'Contexto', icon: ShieldCheck },
  { label: 'Documento', icon: FileText },
  { label: 'Itens e coberturas', icon: FileCheck2 },
  { label: 'Parcelas e agendas', icon: FileCheck2 },
  { label: 'Revisão', icon: Check },
]

function validateCurrentStep(step: number, draft: ManualDocumentDraft): string[] {
  if (step === 0) {
    const errors: string[] = []
    if (!draft.insuredId) errors.push('Selecione o segurado.')
    if (!draft.branchOfficeId) errors.push('O segurado precisa estar vinculado a uma corretora.')
    if (!draft.insurerId) errors.push('Selecione a seguradora.')
    if (!draft.branchId) errors.push('Selecione o ramo.')
    if (!draft.producerId) errors.push('Selecione o produtor principal.')
    return errors
  }
  if (step === 1) {
    const errors: string[] = []
    if (!draft.coverageStart || !draft.coverageEnd) errors.push('Informe a vigência.')
    if (draft.coverageEnd < draft.coverageStart) errors.push('A vigência final deve ser posterior à inicial.')
    if (draft.mode === 'APOLICE' && !draft.policyNumber.trim()) errors.push('Informe o número da apólice.')
    if (draft.mode === 'APOLICE' && !draft.issueDate) errors.push('Informe a data de emissão.')
    if (!Number.isFinite(Number(draft.totalPremium.replace(',', '.')))) errors.push('Informe um prêmio total válido.')
    if (!Number.isFinite(Number(draft.netPremium.replace(',', '.')))) errors.push('Informe um prêmio líquido válido.')
    return errors
  }
  if (step === 2) {
    return draft.items.flatMap((item, index) => !hasManualItemContent(item) || item.description.trim() ? [] : [`Informe a descrição do item ${index + 1}.`])
  }
  if (step === 3) {
    const errors: string[] = []
    const installments = Number(draft.installmentCount)
    const commission = Number(draft.commissionPct.replace(',', '.'))
    const agencyCommission = Number(draft.agencyCommissionPct.replace(',', '.'))
    if (!Number.isInteger(installments) || installments < 1) errors.push('Informe uma quantidade de parcelas válida.')
    if (!draft.firstDueDate) errors.push('Informe o primeiro vencimento.')
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) errors.push('A comissão deve ficar entre 0% e 100%.')
    if (!Number.isFinite(agencyCommission) || agencyCommission < 0) errors.push('O agenciamento deve ser igual ou maior que zero.')
    return errors
  }
  return validateManualDraft(draft)
}

export default function CadastroManualWizard() {
  const navigate = useNavigate()
  const { refreshProposals } = usePropostas()
  const { notify } = useSystemFeedback()
  const createInsured = useCreateSegurado()
  const [draft, setDraft] = useState(createManualDraft)
  const [lookups, setLookups] = useState(getManualLookups)
  const [step, setStep] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [showNewInsured, setShowNewInsured] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const stepErrors = useMemo(() => validateCurrentStep(step, draft), [draft, step])

  useEffect(() => {
    const scrollContainer = headingRef.current?.closest('.overflow-y-auto')
    if (scrollContainer instanceof HTMLElement) scrollContainer.scrollTop = 0
  }, [])

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const update = (patch: Partial<ManualDocumentDraft>) => {
    setError(null)
    setDraft((current) => {
      let next = { ...current, ...patch }
      if (patch.insuredId !== undefined) next = applyManualInsuredDefaults(next, patch.insuredId)
      if (patch.branchId !== undefined) {
        const branch = lookups.branches.find((option) => option.id === patch.branchId)
        if (branch?.requiresItems && next.items.length === 0) next = { ...next, items: [createEmptyItem()] }
      }
      if (patch.branchId !== undefined || patch.insurerId !== undefined) {
        next = { ...next, gradeId: suggestManualGrade(next) }
      }
      return next
    })
  }

  const nextStep = () => {
    if (stepErrors.length) {
      setError(stepErrors[0])
      return
    }
    setError(null)
    setStep((current) => Math.min(steps.length - 1, current + 1))
  }

  const previousStep = () => {
    setError(null)
    setStep((current) => Math.max(0, current - 1))
  }

  const handleCreateInsured = async (data: Partial<Segurado>) => {
    const created = await createInsured.mutateAsync(buildCreateSeguradoInput(data))
    const nextLookups = getManualLookups()
    setLookups(nextLookups)
    setDraft((current) => applyManualInsuredDefaults(current, created.id))
    notify({ title: 'Segurado cadastrado', description: `${created.nome} foi selecionado no cadastro.`, tone: 'success' })
  }

  const submit = () => {
    const errors = validateManualDraft(draft)
    if (errors.length) {
      setError(errors[0])
      return
    }
    if (!confirmed) {
      setError('Confirme a revisão dos dados antes de cadastrar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = createManualInsuranceDocument(draft)
      refreshProposals()
      notify({
        title: draft.mode === 'APOLICE' ? 'Apólice cadastrada' : 'Proposta cadastrada',
        description: draft.mode === 'APOLICE'
          ? 'Contrato, documento, riscos e agendas foram registrados.'
          : 'A proposta entrou no funil em tramitação.',
        tone: 'success',
      })
      navigate(`/apolices/${result.policyId}?documento=${result.proposalId}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir o cadastro.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] animate-fade-in pb-4">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button type="button" onClick={() => setShowExit(true)} className="mt-1 rounded-full p-2 text-fg-3 hover:bg-bg-surface-2 hover:text-fg-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30" aria-label="Voltar para Propostas e Apólices"><ArrowLeft size={20} /></button>
          <div><p className="text-sm font-semibold text-accent-primary">Negócios › Propostas e Apólices</p><h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.02em] text-fg-1">Cadastro manual</h1><p className="mt-1 text-sm text-fg-3">Proposta em tramitação ou apólice original já emitida.</p></div>
        </div>
        <div className="rounded-full bg-bg-surface-2 px-4 py-2 text-xs font-bold text-fg-3"><span className="text-accent-primary">{step + 1}</span> de {steps.length}</div>
      </header>

      <nav aria-label="Etapas do cadastro" className="mb-5 overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface px-2 py-2 shadow-[var(--shadow-1)]">
        <ol className="flex items-center">
          {steps.map((item, index) => {
            const Icon = item.icon
            const active = index === step
            const completed = index < step
            return (
              <li key={item.label} className={`flex min-w-0 items-center lg:flex-1 ${active ? 'flex-[2]' : 'flex-1'}`}>
                <button type="button" onClick={() => completed && setStep(index)} disabled={!completed && !active} aria-current={active ? 'step' : undefined} aria-label={item.label} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[6px] px-2 py-2 text-left text-xs font-bold transition-colors lg:justify-start lg:px-3 ${active ? 'bg-accent-primary-soft text-accent-primary' : completed ? 'text-fg-2 hover:bg-bg-surface-2' : 'cursor-default text-fg-4'}`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${completed ? 'bg-signal-success text-white' : active ? 'bg-accent-primary text-white' : 'bg-bg-surface-2 text-fg-4'}`}>{completed ? <Check size={15} /> : <Icon size={15} />}</span>
                  <span className={`${active ? 'block' : 'hidden'} truncate lg:block`}>{item.label}</span>
                </button>
                {index < steps.length - 1 && <ChevronRight size={14} className="shrink-0 text-border-2" />}
              </li>
            )
          })}
        </ol>
      </nav>

      <main className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <div ref={headingRef} tabIndex={-1} className="min-h-[440px] p-5 outline-none sm:p-7 lg:p-8">
          {step === 0 && <ContextStep draft={draft} lookups={lookups} update={update} onNewInsured={() => setShowNewInsured(true)} />}
          {step === 1 && <DocumentStep draft={draft} lookups={lookups} update={update} />}
          {step === 2 && <ItemsStep draft={draft} lookups={lookups} update={update} />}
          {step === 3 && <FinanceStep draft={draft} lookups={lookups} update={update} />}
          {step === 4 && <ReviewStep draft={draft} lookups={lookups} update={update} confirmed={confirmed} setConfirmed={setConfirmed} />}
        </div>
        {error && <div role="alert" className="mx-5 mb-4 flex items-start gap-2 rounded-[6px] bg-signal-danger-soft px-4 py-3 text-sm font-bold text-signal-danger sm:mx-7 lg:mx-8"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}
        <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border-1 bg-bg-surface-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8">
          <button type="button" onClick={step === 0 ? () => setShowExit(true) : previousStep} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-fg-2 hover:bg-bg-surface-3 disabled:opacity-50">{step === 0 ? <ArrowLeft size={16} /> : <ChevronLeft size={16} />}{step === 0 ? 'Cancelar' : 'Voltar'}</button>
          {step < steps.length - 1 ? <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover">Continuar <ChevronRight size={16} /></button> : <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-50">{submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{submitting ? 'Cadastrando…' : draft.mode === 'APOLICE' ? 'Cadastrar apólice' : 'Cadastrar proposta'}</button>}
        </footer>
      </main>

      <AppModal isOpen={showExit} onClose={() => setShowExit(false)} title="Descartar cadastro?" description="Os dados preenchidos neste rascunho serão perdidos." icon={<AlertTriangle size={18} />} size="sm" footer={<><button type="button" onClick={() => setShowExit(false)} className="rounded-full px-5 py-2.5 text-sm font-bold text-fg-2 hover:bg-bg-surface-3">Continuar preenchendo</button><button type="button" onClick={() => navigate('/propostas')} className="rounded-full bg-signal-danger px-5 py-2.5 text-sm font-bold text-white hover:brightness-95">Descartar</button></>}><div className="px-8 py-6 text-sm leading-6 text-fg-3">Nenhum registro contratual foi criado até a confirmação final.</div></AppModal>
      <NovoSeguradoModal isOpen={showNewInsured} onClose={() => setShowNewInsured(false)} onSave={handleCreateInsured} />
    </div>
  )
}
