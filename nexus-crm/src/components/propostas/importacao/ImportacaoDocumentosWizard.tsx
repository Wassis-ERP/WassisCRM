import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileText,
  Link2,
  Percent,
  Plus,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import {
  createImportDraft,
  getImportLookups,
  getInsuredDefaults,
  getPolicyDefaults,
  importDocument,
  previewImportAgendas,
  validateImportDraft,
} from './importacaoDomain'
import type { ImportFileDraft, ImportFileStatus, ImportResult } from './importacaoTypes'

interface ImportacaoDocumentosWizardProps {
  onImported: () => void
}

const steps = [
  { label: 'Arquivos', icon: UploadCloud },
  { label: 'Vínculos', icon: Link2 },
  { label: 'Comissão e produtor', icon: Percent },
  { label: 'Conclusão', icon: CheckCircle2 },
]

const statusClass: Record<ImportFileStatus, string> = {
  LIDO: 'bg-signal-success-soft text-signal-success',
  REVISAO: 'bg-signal-warning-soft text-signal-warning',
  NAO_SUPORTADO: 'bg-signal-warning-soft text-signal-warning',
  IMPORTADO: 'bg-signal-success-soft text-signal-success',
  ERRO: 'bg-signal-danger-soft text-signal-danger',
}

const statusLabel: Record<ImportFileStatus, string> = {
  LIDO: 'Lido',
  REVISAO: 'Revisão necessária',
  NAO_SUPORTADO: 'Não suportado',
  IMPORTADO: 'Importado',
  ERRO: 'Erro',
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-4 text-fg-4">{hint}</span>}
    </label>
  )
}

const controlClass = 'w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:cursor-not-allowed disabled:bg-bg-surface-2 disabled:text-fg-4'

export default function ImportacaoDocumentosWizard({ onImported }: ImportacaoDocumentosWizardProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [drafts, setDrafts] = useState<ImportFileDraft[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const lookups = getImportLookups()
  const selected = drafts.find((draft) => draft.id === selectedId) ?? drafts[0]
  const importable = drafts.filter((draft) => draft.proposalType !== null)

  const reset = () => {
    setStep(0)
    setDrafts([])
    setSelectedId('')
    setConfirmed(false)
    setResults([])
  }

  const leaveImport = () => {
    reset()
    navigate('/propostas')
  }

  const addMetadata = (files: Array<{ name: string; size: number; type: string }>) => {
    const additions = files
      .filter((file) => !drafts.some((draft) => draft.fileName === file.name && draft.size === file.size))
      .map(createImportDraft)
    if (!additions.length) return
    setDrafts((current) => [...current, ...additions])
    setSelectedId((current) => current || additions[0].id)
  }

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const pdfs = files.filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    addMetadata(pdfs)
    event.target.value = ''
  }

  const loadExamples = () => addMetadata([
    { name: 'apolice_nova_joao.pdf', size: 428_600, type: 'application/pdf' },
    { name: 'endosso_viaforte.pdf', size: 312_400, type: 'application/pdf' },
  ])

  const updateSelected = (patch: Partial<ImportFileDraft>) => {
    if (!selected) return
    setDrafts((current) => current.map((draft) => draft.id === selected.id ? { ...draft, ...patch } : draft))
  }

  const selectInsured = (insuredId: string) => updateSelected({ insuredId, ...getInsuredDefaults(insuredId) })
  const selectPolicy = (policyId: string) => updateSelected({ policyId, ...getPolicyDefaults(policyId) })

  const removeSelected = (id: string) => {
    const remaining = drafts.filter((draft) => draft.id !== id)
    setDrafts(remaining)
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? '')
  }

  const canAdvance = step === 0
    ? importable.length > 0
    : step === 1
      ? importable.every((draft) => validateImportDraft(draft).length === 0)
      : confirmed && importable.every((draft) => validateImportDraft(draft).length === 0)

  const finishImport = () => {
    const nextResults = importable.map(importDocument)
    setResults(nextResults)
    setDrafts((current) => current.map((draft) => {
      const result = nextResults.find((item) => item.fileId === draft.id)
      return result ? { ...draft, status: result.status, message: result.message } : draft
    }))
    setStep(3)
    if (nextResults.some((result) => result.status === 'IMPORTADO')) onImported()
  }

  const footer = step === 3 ? (
    <>
      <button type="button" onClick={reset} className="rounded-full border border-border-1 bg-bg-surface px-5 py-2 text-sm font-bold text-fg-2 hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">
        Importar novos
      </button>
      <button type="button" onClick={leaveImport} className="rounded-full bg-accent-primary px-5 py-2 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">
        Voltar ao Painel
      </button>
    </>
  ) : (
    <>
      <button type="button" onClick={step === 0 ? leaveImport : () => setStep((current) => current - 1)} className="inline-flex items-center gap-2 rounded-full border border-border-1 bg-bg-surface px-5 py-2 text-sm font-bold text-fg-2 hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">
        {step > 0 && <ChevronLeft size={16} />}
        {step === 0 ? 'Cancelar' : 'Voltar'}
      </button>
      <button
        type="button"
        disabled={!canAdvance}
        onClick={step === 2 ? finishImport : () => setStep((current) => current + 1)}
        className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {step === 2 ? 'Confirmar importação' : 'Continuar'}
        {step < 2 && <ChevronRight size={16} />}
      </button>
    </>
  )

  return (
    <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <nav aria-label="Etapas da importação" className="border-b border-border-1 bg-bg-surface px-5 py-4 sm:px-8">
          <ol className="flex min-w-max items-center gap-2 overflow-x-auto pb-1">
            {steps.map((item, index) => {
              const Icon = item.icon
              const active = index === step
              const complete = index < step
              return (
                <li key={item.label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-colors ${active ? 'bg-accent-primary text-fg-on-brand' : complete ? 'bg-accent-primary-soft text-accent-primary' : 'bg-bg-surface-2 text-fg-4'}`} aria-current={active ? 'step' : undefined}>
                    {complete ? <Check size={14} /> : <Icon size={14} />}
                    {item.label}
                  </div>
                  {index < steps.length - 1 && <ChevronRight size={14} className="text-fg-4" aria-hidden="true" />}
                </li>
              )
            })}
          </ol>
        </nav>

        {step === 0 ? (
          <div className="p-5 sm:p-8">
            <div className="rounded-[8px] border border-dashed border-border-2 bg-bg-surface-2 px-6 py-10 text-center">
              <UploadCloud size={32} className="mx-auto text-accent-primary" />
              <h3 className="mt-3 text-base font-extrabold text-fg-1">Selecione os documentos oficiais</h3>
              <p className="mx-auto mt-1 max-w-xl text-sm text-fg-3">PDFs de proposta, apólice ou endosso. Cancelamentos e faturas são identificados, mas não importados neste corte.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2 text-sm font-bold text-fg-on-brand hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">
                  <Plus size={16} /> Selecionar PDFs
                </button>
                <button type="button" onClick={loadExamples} className="rounded-full border border-border-1 bg-bg-surface px-5 py-2 text-sm font-bold text-fg-2 hover:bg-bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">
                  Carregar exemplos
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={handleFiles} />
            </div>
            {drafts.length > 0 && <FileList drafts={drafts} selectedId={selectedId} onSelect={setSelectedId} onRemove={removeSelected} />}
          </div>
        ) : step === 3 ? (
          <Conclusion results={results} drafts={drafts} lookups={lookups} />
        ) : (
          <div className="grid min-h-[460px] lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-border-1 bg-bg-surface-2 p-4 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">Arquivos do lote</p>
              <div className="space-y-2">
                {drafts.map((draft) => <FileRow key={draft.id} draft={draft} active={draft.id === selected?.id} onClick={() => setSelectedId(draft.id)} />)}
              </div>
            </aside>
            <main className="min-w-0 p-5 sm:p-8">
              {!selected ? <p className="text-sm text-fg-3">Selecione um arquivo.</p> : step === 1 ? (
                <LinksStep draft={selected} lookups={lookups} update={updateSelected} selectInsured={selectInsured} selectPolicy={selectPolicy} />
              ) : (
                <FinanceStep draft={selected} lookups={lookups} update={updateSelected} confirmed={confirmed} setConfirmed={setConfirmed} />
              )}
            </main>
          </div>
        )}
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-border-1 bg-bg-surface-2 px-5 py-4 sm:px-8">
        {footer}
      </div>
    </section>
  )
}

function FileList({ drafts, selectedId, onSelect, onRemove }: { drafts: ImportFileDraft[]; selectedId: string; onSelect: (id: string) => void; onRemove: (id: string) => void }) {
  return (
    <div className="mt-5 overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface">
      <div className="grid grid-cols-[minmax(0,1fr)_130px_140px_44px] gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">
        <span>Arquivo</span><span>Tipo detectado</span><span>Status</span><span className="sr-only">Ações</span>
      </div>
      {drafts.map((draft) => (
        <div key={draft.id} className={`grid grid-cols-[minmax(0,1fr)_130px_140px_44px] items-center gap-3 border-b border-border-1 px-4 py-3 last:border-0 hover:bg-bg-surface-2 ${draft.id === selectedId ? 'bg-accent-primary-soft/45' : ''}`}>
          <button type="button" onClick={() => onSelect(draft.id)} className="col-span-3 grid min-w-0 grid-cols-[minmax(0,1fr)_130px_140px] items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">
            <span className="min-w-0"><span className="block truncate text-sm font-bold text-fg-1">{draft.fileName}</span><span className="text-xs text-fg-4">{formatSize(draft.size)}</span></span>
            <span className="text-xs font-bold text-fg-2">{draft.kind}</span>
            <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusClass[draft.status]}`}>{statusLabel[draft.status]}</span>
          </button>
          <button type="button" aria-label={`Remover ${draft.fileName}`} onClick={() => onRemove(draft.id)} className="rounded-[6px] p-2 text-fg-4 hover:bg-signal-danger-soft hover:text-signal-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function FileRow({ draft, active, onClick }: { draft: ImportFileDraft; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`w-full rounded-[6px] border p-3 text-left transition-colors ${active ? 'border-accent-primary bg-bg-surface text-fg-1' : 'border-border-1 bg-bg-surface text-fg-2 hover:bg-bg-surface-3'}`}>
      <span className="flex items-start gap-2"><FileText size={16} className="mt-0.5 shrink-0 text-accent-primary" /><span className="min-w-0"><span className="block truncate text-xs font-extrabold">{draft.fileName}</span><span className="mt-1 block text-[10px] text-fg-4">{draft.kind} · {statusLabel[draft.status]}</span></span></span>
    </button>
  )
}

interface StepProps {
  draft: ImportFileDraft
  lookups: ReturnType<typeof getImportLookups>
  update: (patch: Partial<ImportFileDraft>) => void
}

function OptionSelect({ value, onChange, options, placeholder = 'Selecione' }: { value: string; onChange: (value: string) => void; options: Array<{ id: string; label: string; detail?: string }>; placeholder?: string }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}><option value="">{placeholder}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}{option.detail ? ` · ${option.detail}` : ''}</option>)}</select>
}

function LinksStep({ draft, lookups, update, selectInsured, selectPolicy }: StepProps & { selectInsured: (id: string) => void; selectPolicy: (id: string) => void }) {
  const errors = validateImportDraft(draft)
  if (!draft.proposalType) return <Unsupported draft={draft} />
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-lg font-extrabold text-fg-1">Vínculos encontrados</h3><p className="mt-1 text-sm text-fg-3">Confirme os cadastros usados pelo contrato. A corretora é derivada do segurado.</p></div>
        <span className="rounded-full bg-signal-success-soft px-3 py-1 text-xs font-bold text-signal-success">Leitura simulada concluída</span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {draft.kind === 'ENDOSSO' && <Field label="Apólice-mãe"><OptionSelect value={draft.policyId} onChange={selectPolicy} options={lookups.policies} /></Field>}
        <Field label="Segurado" hint="Correspondência determinística pelo documento no backend definitivo."><OptionSelect value={draft.insuredId} onChange={selectInsured} options={lookups.insureds} /></Field>
        <Field label="Corretora"><OptionSelect value={draft.branchOfficeId} onChange={(branchOfficeId) => update({ branchOfficeId })} options={lookups.branchOffices} /></Field>
        <Field label="Seguradora"><OptionSelect value={draft.insurerId} onChange={(insurerId) => update({ insurerId })} options={lookups.insurers} /></Field>
        <Field label="Ramo"><OptionSelect value={draft.branchId} onChange={(branchId) => update({ branchId })} options={lookups.branches} /></Field>
        <Field label="Tipo documental"><input value={draft.proposalType} readOnly className={`${controlClass} bg-bg-surface-2`} /></Field>
        {draft.kind === 'ENDOSSO' && <Field label="Subtipo do endosso"><OptionSelect value={draft.endorsementSubtypeId} onChange={(endorsementSubtypeId) => update({ endorsementSubtypeId })} options={lookups.endorsementSubtypes} /></Field>}
        <Field label={draft.kind === 'ENDOSSO' ? 'Número do endosso' : draft.kind === 'APOLICE' ? 'Número da apólice' : 'Número da proposta'}>
          <input value={draft.kind === 'ENDOSSO' ? draft.endorsementNumber : draft.kind === 'APOLICE' ? draft.policyNumber : draft.proposalNumber} onChange={(event) => update(draft.kind === 'ENDOSSO' ? { endorsementNumber: event.target.value } : draft.kind === 'APOLICE' ? { policyNumber: event.target.value } : { proposalNumber: event.target.value })} className={`${controlClass} font-mono`} />
        </Field>
        <Field label="Início da vigência"><input type="date" value={draft.coverageStart} onChange={(event) => update({ coverageStart: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Fim da vigência"><input type="date" value={draft.coverageEnd} onChange={(event) => update({ coverageEnd: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        {draft.kind !== 'PROPOSTA' && <Field label="Data de emissão"><input type="date" value={draft.issueDate} onChange={(event) => update({ issueDate: event.target.value })} className={`${controlClass} font-mono`} /></Field>}
      </div>
      {errors.length > 0 && <InlineWarning>{errors[0]}</InlineWarning>}
    </div>
  )
}

function FinanceStep({ draft, lookups, update, confirmed, setConfirmed }: StepProps & { confirmed: boolean; setConfirmed: (value: boolean) => void }) {
  if (!draft.proposalType) return <Unsupported draft={draft} />
  const preview = previewImportAgendas(draft)
  return (
    <div>
      <div><h3 className="text-lg font-extrabold text-fg-1">Comissão, produtor e agendas</h3><p className="mt-1 text-sm text-fg-3">Revise os valores do documento e os snapshots que serão materializados.</p></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Produtor principal"><OptionSelect value={draft.producerId} onChange={(producerId) => update({ producerId })} options={lookups.producers} /></Field>
        <Field label="Grade de recebimento"><OptionSelect value={draft.gradeId} onChange={(gradeId) => update({ gradeId })} options={lookups.grades} placeholder="Agenda manual" /></Field>
        <Field label="Comissão da corretora (%)"><input inputMode="decimal" value={draft.commissionPct} onChange={(event) => update({ commissionPct: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Agenciamento (%)" hint="Aceita percentuais acumulados, como 300% em saúde."><input inputMode="decimal" value={draft.agencyCommissionPct} onChange={(event) => update({ agencyCommissionPct: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Prêmio total"><input inputMode="decimal" value={draft.totalPremium} onChange={(event) => update({ totalPremium: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Prêmio líquido"><input inputMode="decimal" value={draft.netPremium} onChange={(event) => update({ netPremium: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Quantidade de parcelas"><input type="number" min="1" value={draft.installmentCount} onChange={(event) => update({ installmentCount: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Primeiro vencimento"><input type="date" value={draft.firstDueDate} onChange={(event) => update({ firstDueDate: event.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Forma de pagamento"><select value={draft.paymentMethod} onChange={(event) => update({ paymentMethod: event.target.value })} className={controlClass}><option value="BOLETO">Boleto</option><option value="CARTAO">Cartão</option><option value="DEBITO">Débito em conta</option><option value="PIX">Pix</option></select></Field>
      </div>
      <div className="mt-6 overflow-hidden rounded-[8px] border border-border-1">
        <div className="border-b border-border-1 bg-bg-surface-2 px-4 py-3"><p className="text-sm font-extrabold text-fg-1">Prévia de materialização</p><p className="text-xs text-fg-4">Leitura separada; nenhuma baixa ou pagamento é executado.</p></div>
        <div className="grid divide-y divide-border-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <PreviewCell label="Parcelas do segurado" value={`${preview.installmentCount} parcela(s)`} detail="Agenda de cobrança" />
          <PreviewCell label="Comissão da corretora" value={money.format(preview.commissionAmount)} detail={`${preview.commissionEvents} evento(s) · ${preview.gradeName}`} />
          <PreviewCell label="Repasse previsto" value={preview.transferAmount == null ? 'Sem regra' : money.format(preview.transferAmount)} detail={preview.transferRule} />
        </div>
      </div>
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[8px] border border-border-1 bg-bg-surface-2 p-4">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]" />
        <span><span className="block text-sm font-bold text-fg-1">Confirmo que revisei os dados lidos</span><span className="mt-0.5 block text-xs leading-5 text-fg-3">Tenho autorização para tratar estes documentos e confirmo a separação entre comissão da corretora e repasse ao produtor.</span></span>
      </label>
    </div>
  )
}

function PreviewCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">{label}</p><p className="mt-2 font-mono text-base font-bold text-fg-1">{value}</p><p className="mt-1 text-xs text-fg-4">{detail}</p></div>
}

function Unsupported({ draft }: { draft: ImportFileDraft }) {
  return <div className="rounded-[8px] border border-signal-warning/30 bg-signal-warning-soft p-5"><div className="flex items-start gap-3"><AlertTriangle size={20} className="mt-0.5 shrink-0 text-signal-warning" /><div><h3 className="font-extrabold text-fg-1">Documento fora do recorte</h3><p className="mt-1 text-sm text-fg-3">{draft.message}. O arquivo permanece no lote como não importado, sem persistência silenciosa.</p></div></div></div>
}

function InlineWarning({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex items-start gap-2 rounded-[6px] bg-signal-warning-soft px-3 py-2 text-xs font-bold text-signal-warning"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{children}</div>
}

function Conclusion({ results, drafts, lookups }: { results: ImportResult[]; drafts: ImportFileDraft[]; lookups: ReturnType<typeof getImportLookups> }) {
  const successCount = results.filter((result) => result.status === 'IMPORTADO').length
  const lookupLabel = (options: Array<{ id: string; label: string }>, id: string) => options.find((option) => option.id === id)?.label ?? '—'
  return (
    <div className="p-5 sm:p-8">
      <div className="flex items-start gap-4 rounded-[8px] bg-signal-success-soft p-5">
        <ShieldCheck size={28} className="shrink-0 text-signal-success" />
        <div><h3 className="text-lg font-extrabold text-fg-1">Importação concluída</h3><p className="mt-1 text-sm text-fg-3">{successCount} de {drafts.length} arquivo(s) importado(s). Pendências permanecem explícitas por arquivo.</p></div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-[8px] border border-border-1">
        <table className="w-full min-w-[1120px] text-left text-xs">
          <thead className="border-b border-border-1 bg-bg-surface-2">
            <tr>
              {['Arquivo', 'Segurado', 'Proposta', 'Apólice / Endosso', 'Ramo', 'Comissão / agenc.', 'Produtor', 'Ação'].map((header) => (
                <th key={header} className="px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => {
              const result = results.find((item) => item.fileId === draft.id)
              const success = result?.status === 'IMPORTADO'
              const contractNumber = draft.kind === 'ENDOSSO' ? draft.endorsementNumber : draft.policyNumber
              const href = success && result.policyId && result.proposalId
                ? `/apolices/${result.policyId}?documento=${result.proposalId}`
                : null
              return (
                <tr key={draft.id} className="border-b border-border-1 last:border-0 hover:bg-bg-surface-2">
                  <td className="max-w-[240px] px-3 py-3 align-top">
                    <div className="flex min-w-0 items-start gap-2">
                      {success ? <FileCheck2 size={17} className="mt-0.5 shrink-0 text-signal-success" /> : <AlertTriangle size={17} className="mt-0.5 shrink-0 text-signal-warning" />}
                      <div className="min-w-0"><p className="truncate font-extrabold text-fg-1">{draft.fileName}</p><p className="mt-0.5 truncate text-[11px] text-fg-4">{result?.message ?? draft.message ?? 'Arquivo ignorado.'}</p></div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top font-semibold text-fg-2">{lookupLabel(lookups.insureds, draft.insuredId)}</td>
                  <td className="px-3 py-3 align-top font-mono text-fg-2">{draft.proposalNumber || '—'}</td>
                  <td className="px-3 py-3 align-top font-mono text-fg-2">{contractNumber || '—'}</td>
                  <td className="px-3 py-3 align-top font-semibold text-fg-2">{lookupLabel(lookups.branches, draft.branchId)}</td>
                  <td className="px-3 py-3 align-top font-mono font-bold text-fg-1">{draft.commissionPct ? `${draft.commissionPct}%` : '—'} / {draft.agencyCommissionPct ? `${draft.agencyCommissionPct}%` : '—'}</td>
                  <td className="px-3 py-3 align-top font-semibold text-fg-2">{lookupLabel(lookups.producers, draft.producerId)}</td>
                  <td className="px-3 py-3 align-top">
                    {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent-primary px-3 py-1.5 font-bold text-accent-primary hover:bg-accent-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">Abrir documento <ExternalLink size={13} /></a> : <span className="text-fg-4">Indisponível</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
