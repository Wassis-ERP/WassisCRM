import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Layers3, Loader2, Settings, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { applyDocumentAgendas, getTable, previewDocumentAgendas } from '../../lib/inMemoryDb'
import type { AgendaApplyMode, AgendaState, ContractAgendaPreview } from '../../lib/contractAgendaDomain'
import type { Proposal } from '../../types/proposta'
import { fmtDate, fmtMoney } from '../propostas/propostaFormat'

type Props = {
  document: Proposal
  onClose: () => void
  onApplied: (message: string) => void
}

const steps = ['Dados', 'Grade', 'Prévia', 'Confirmação'] as const
const statusTone: Record<AgendaState, string> = {
  VAZIA: 'bg-bg-surface-2 text-fg-3',
  COMPLETA: 'bg-signal-success/15 text-signal-success',
  PARCIAL: 'bg-signal-warning/15 text-signal-warning',
  DIVERGENTE: 'bg-signal-warning/15 text-signal-warning',
  BLOQUEADA: 'bg-signal-danger/15 text-signal-danger',
}

export function AgendaGenerationModal({ document, onClose, onApplied }: Props) {
  const rawDocument = getTable('propostas').find((row) => row.id === document.id)
  const initial = previewDocumentAgendas(document.id, rawDocument?.recebimento_grade_id as string | null | undefined)
  const [step, setStep] = useState(0)
  const [gradeId, setGradeId] = useState(() => String(initial.gradeId ?? (initial.compatibleGrades.length === 1 ? initial.compatibleGrades[0].id : '')))
  const [mode, setMode] = useState<AgendaApplyMode>(() => hasDivergence(initial) ? 'REPLACE_PENDING' : 'COMPLETE_MISSING')
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = useMemo(() => previewDocumentAgendas(document.id, gradeId || null), [document.id, gradeId])
  const blocked = Object.values(preview.diagnosis).some((item) => item.state === 'BLOQUEADA')
  const divergent = hasDivergence(preview)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isApplying) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isApplying, onClose])

  const next = () => {
    setError(null)
    if (step === 1 && !gradeId) {
      setError('Selecione uma grade compatível antes de continuar.')
      return
    }
    if (step === 2 && preview.errors.length) {
      setError(preview.errors[0])
      return
    }
    if (step === 2 && hasDivergence(preview)) setMode('REPLACE_PENDING')
    setStep((current) => Math.min(3, current + 1))
  }

  const apply = () => {
    if (!gradeId || preview.errors.length || blocked || isApplying) return
    setIsApplying(true)
    setError(null)
    try {
      const result = applyDocumentAgendas(document.id, gradeId, mode)
      onApplied(`${result.created.installments} parcela(s), ${result.created.commissions} comissão(ões) e ${result.created.transfers} repasse(s) criados.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível gerar as agendas.')
      setIsApplying(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isApplying) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="agenda-generation-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[10px] bg-bg-surface shadow-[var(--shadow-3)]">
      <header className="flex items-start gap-3 border-b border-border-1 px-5 py-4">
        <span className="rounded-[6px] bg-accent-primary-soft p-2 text-accent-primary"><Layers3 size={19} /></span>
        <div className="min-w-0 flex-1"><h2 id="agenda-generation-title" className="text-lg font-black text-fg-1">Gerar agendas contratuais</h2><p className="mt-0.5 text-xs font-semibold text-fg-3">Parcelas, comissões e repasses em uma única operação auditada.</p></div>
        <button type="button" aria-label="Fechar" disabled={isApplying} onClick={onClose} className="rounded-[6px] p-2 text-fg-4 hover:bg-bg-surface-2 hover:text-fg-1 disabled:opacity-40"><X size={18} /></button>
      </header>

      <nav className="grid grid-cols-4 border-b border-border-1 bg-bg-surface-2 px-5" aria-label="Etapas da geração">
        {steps.map((label, index) => <button key={label} type="button" onClick={() => index < step && setStep(index)} className={`border-b-2 px-2 py-3 text-xs font-black ${index === step ? 'border-accent-primary text-accent-primary' : index < step ? 'border-transparent text-fg-2' : 'border-transparent text-fg-4'}`}><span className="mr-1.5 font-mono">{index + 1}</span>{label}</button>)}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {step === 0 && <DataStep document={document} preview={preview} />}
        {step === 1 && <GradeStep preview={preview} selected={gradeId} onSelected={setGradeId} onClose={onClose} />}
        {step === 2 && <PreviewStep preview={preview} />}
        {step === 3 && <ConfirmationStep mode={mode} onMode={setMode} divergent={divergent} blocked={blocked} />}
        {(error || (step >= 2 && preview.errors.length > 0)) && <div className="mt-4 flex gap-2 rounded-[6px] bg-signal-danger/10 px-3 py-2.5 text-xs font-bold text-signal-danger"><AlertTriangle size={15} className="shrink-0" /><span>{error ?? preview.errors[0]}</span></div>}
        {step >= 2 && preview.warnings.map((warning) => <div key={warning} className="mt-3 flex gap-2 rounded-[6px] bg-signal-warning/10 px-3 py-2.5 text-xs font-bold text-signal-warning"><AlertTriangle size={15} className="shrink-0" /><span>{warning}</span></div>)}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border-1 bg-bg-surface-2 px-5 py-4">
        <button type="button" onClick={step === 0 ? onClose : () => setStep((current) => current - 1)} disabled={isApplying} className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 hover:bg-bg-surface hover:text-fg-1"><ChevronLeft size={16} />{step === 0 ? 'Cancelar' : 'Voltar'}</button>
        {step < 3 ? <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand hover:bg-accent-primary-hover">Continuar <ChevronRight size={16} /></button>
          : <button type="button" onClick={apply} disabled={!gradeId || preview.errors.length > 0 || blocked || isApplying} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-45">{isApplying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{mode === 'REPLACE_PENDING' ? 'Substituir e gerar agendas' : 'Gerar agendas'}</button>}
      </footer>
    </section>
  </div>
}

function DataStep({ document, preview }: { document: Proposal; preview: ContractAgendaPreview }) {
  return <div className="space-y-5"><div><h3 className="text-base font-black text-fg-1">Dados do documento</h3><p className="mt-1 text-sm text-fg-3">Confira os parâmetros que serão usados na geração.</p></div>
    <dl className="grid gap-3 rounded-[8px] bg-bg-surface-2 p-4 sm:grid-cols-2 lg:grid-cols-4"><Data label="Documento" value={document.proposalNumber ?? document.policyNumber ?? document.id} mono /><Data label="Parcelas" value={String(document.installmentCount ?? 0)} /><Data label="Prêmio total" value={fmtMoney(document.totalPremium)} mono /><Data label="Comissão" value={`${document.commissionPercent ?? 0}%`} mono /><Data label="Agenciamento" value={`${document.agencyCommissionPercent ?? 0}%`} mono /><Data label="Primeiro vencimento" value={document.firstInstallmentDueDate ? fmtDate(document.firstInstallmentDueDate) : 'Derivado da vigência'} mono /></dl>
    <DiagnosisGrid preview={preview} />
  </div>
}

function GradeStep({ preview, selected, onSelected, onClose }: { preview: ContractAgendaPreview; selected: string; onSelected: (id: string) => void; onClose: () => void }) {
  return <div><h3 className="text-base font-black text-fg-1">Grade de recebimento</h3><p className="mt-1 text-sm text-fg-3">Somente grades ativas, íntegras e compatíveis com seguradora e ramo.</p>
    <div className="mt-4 space-y-2">{preview.compatibleGrades.map((grade) => <label key={grade.id} className={`flex cursor-pointer items-start gap-3 rounded-[8px] border p-4 ${selected === grade.id ? 'border-accent-primary bg-accent-primary-soft' : 'border-border-1 hover:bg-bg-surface-2'}`}><input type="radio" name="receipt-grade" value={grade.id} checked={selected === grade.id} onChange={() => onSelected(grade.id)} className="mt-1 h-4 w-4 accent-[var(--accent-primary)]" /><span className="min-w-0"><span className="block text-sm font-black text-fg-1">{grade.nome}</span><span className="mt-1 block text-xs font-semibold text-fg-3">{grade.tipo} · {grade.qtd_parcelas} evento(s) · {grade.base_calculo}</span></span></label>)}</div>
    {!preview.compatibleGrades.length && <div className="mt-4 rounded-[8px] border border-signal-warning/30 bg-signal-warning/10 p-4"><p className="text-sm font-black text-signal-warning">Nenhuma grade compatível</p><p className="mt-1 text-xs font-semibold text-fg-3">Cadastre ou corrija o molde antes de gerar as agendas. Nenhuma comissão será inventada.</p><Link to="/configuracoes?tab=financeiro_grades_recebimento" onClick={onClose} className="mt-3 inline-flex items-center gap-2 rounded-[6px] bg-bg-surface px-3 py-2 text-xs font-black text-accent-primary"><Settings size={14} />Abrir Configurações</Link></div>}
  </div>
}

function PreviewStep({ preview }: { preview: ContractAgendaPreview }) {
  return <div className="space-y-5"><div><h3 className="text-base font-black text-fg-1">Prévia consolidada</h3><p className="mt-1 text-sm text-fg-3">Nenhum fato foi persistido. Os três conjuntos continuam separados.</p></div><DiagnosisGrid preview={preview} />
    <PreviewTable title="Parcelas do segurado" headers={['Parcela', 'Vencimento', 'Valor']} rows={preview.installments.map((row) => [String(row.numero), row.vencimento ? fmtDate(row.vencimento) : '—', fmtMoney(row.valor ?? undefined)])} />
    <PreviewTable title="Comissões da corretora" headers={['Evento', 'Tipo', 'Percentual', 'Previsão', 'Valor']} rows={preview.commissions.map((row) => [String(row.numero), row.tipo_comissao, `${row.percentual}%`, row.prevista_em ? fmtDate(row.prevista_em) : '—', fmtMoney(row.valor_previsto ?? undefined)])} />
    <PreviewTable title="Repasses" headers={['Evento', 'Papel', 'Base', 'Previsão', 'Valor']} rows={preview.transfers.map((row) => [String(row.numero), row.papel_beneficiario ?? '—', row.base ?? '—', row.previsto_em ? fmtDate(row.previsto_em) : '—', fmtMoney(row.valor_previsto ?? undefined)])} />
  </div>
}

function ConfirmationStep({ mode, onMode, divergent, blocked }: { mode: AgendaApplyMode; onMode: (mode: AgendaApplyMode) => void; divergent: boolean; blocked: boolean }) {
  return <div><h3 className="text-base font-black text-fg-1">Confirmar geração</h3><p className="mt-1 text-sm text-fg-3">A grade será vinculada ao documento e a operação será aplicada de forma atômica.</p><div className="mt-4 space-y-2">
    <Option checked={mode === 'COMPLETE_MISSING'} disabled={divergent || blocked} title="Completar ausentes" description="Inclui somente fatos que faltam quando os existentes coincidem com a prévia." onSelect={() => onMode('COMPLETE_MISSING')} />
    <Option checked={mode === 'REPLACE_PENDING'} disabled={blocked} recommended={divergent} title="Substituir agendas não processadas" description="Cancela coletivamente os fatos pendentes e recria a agenda completa, preservando o histórico." onSelect={() => onMode('REPLACE_PENDING')} />
  </div>{blocked && <p className="mt-4 rounded-[6px] bg-signal-danger/10 px-3 py-2 text-xs font-bold text-signal-danger">Há fatos liquidados ou conciliados. A reversão deve ocorrer na Fase 3.</p>}</div>
}

function DiagnosisGrid({ preview }: { preview: ContractAgendaPreview }) { return <div className="grid gap-3 sm:grid-cols-3"><Diagnosis label="Parcelas" item={preview.diagnosis.installments} /><Diagnosis label="Comissões" item={preview.diagnosis.commissions} /><Diagnosis label="Repasses" item={preview.diagnosis.transfers} /></div> }
function Diagnosis({ label, item }: { label: string; item: ContractAgendaPreview['diagnosis']['installments'] }) { return <div className="rounded-[8px] border border-border-1 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-fg-2">{label}</span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${statusTone[item.state]}`}>{item.state}</span></div><p className="mt-2 font-mono text-xs text-fg-3">{item.existing} atual · {item.expected} previsto</p></div> }
function Data({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div><dt className="text-[10px] font-black uppercase tracking-wider text-fg-4">{label}</dt><dd className={`${mono ? 'font-mono' : ''} mt-1 text-sm font-bold text-fg-2`}>{value}</dd></div> }
function PreviewTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) { return <section><div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-black text-fg-1">{title}</h4><span className="text-xs font-bold text-fg-4">{rows.length} linha(s)</span></div><div className="overflow-x-auto rounded-[6px] border border-border-1"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-bg-surface-2"><tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-black text-fg-3">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border-1">{row.map((cell, cellIndex) => <td key={cellIndex} className={`${cellIndex === row.length - 1 ? 'font-mono' : ''} px-3 py-2.5 font-semibold text-fg-2`}>{cell}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <p className="p-4 text-center text-xs font-semibold text-fg-4">Nenhuma linha será criada.</p>}</div></section> }
function Option({ checked, disabled, recommended, title, description, onSelect }: { checked: boolean; disabled: boolean; recommended?: boolean; title: string; description: string; onSelect: () => void }) { return <label className={`flex items-start gap-3 rounded-[8px] border p-4 ${disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'} ${checked ? 'border-accent-primary bg-accent-primary-soft' : 'border-border-1'}`}><input type="radio" name="apply-mode" checked={checked} disabled={disabled} onChange={onSelect} className="mt-1 h-4 w-4 accent-[var(--accent-primary)]" /><span><span className="flex items-center gap-2 text-sm font-black text-fg-1">{title}{recommended && <span className="rounded-full bg-signal-warning/15 px-2 py-1 text-[10px] text-signal-warning">Recomendado</span>}</span><span className="mt-1 block text-xs font-semibold text-fg-3">{description}</span></span></label> }
function hasDivergence(preview: ContractAgendaPreview) { return Object.values(preview.diagnosis).some((item) => item.state === 'DIVERGENTE') }
