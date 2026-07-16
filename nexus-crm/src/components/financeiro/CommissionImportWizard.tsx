import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleHelp,
  FileSpreadsheet,
  FileText,
  FileUp,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useConfirmarImportacaoComissao, useProcessarDemonstrativoComissao } from '../../hooks/useFinanceiroExtratos'
import {
  refreshImportItem,
  validateImportPreview,
  type CommissionImportItem,
  type CommissionImportPreview,
  type ConfirmCommissionImportResult,
  type ImportAssociationKind,
} from '../../modules/financeiro/extratoImportDomain'
import type { FinanceiroComissao } from '../../modules/financeiro/comissoesDomain'
interface CommissionImportWizardProps {
  rows: FinanceiroComissao[]
  canUpdate: boolean
  onCancel: () => void
  onStartReceipt: (commissionIds: string[]) => void
}

const ASSOCIATION_LABELS: Record<ImportAssociationKind, string> = {
  EXATA: 'Exata',
  SUGERIDA: 'Sugerida',
  AMBIGUA: 'Ambígua',
  PARCIAL: 'Parcial',
  MANUAL: 'Manual',
  NAO_ENCONTRADA: 'Não encontrada',
}

const ASSOCIATION_TONES: Record<ImportAssociationKind, string> = {
  EXATA: 'bg-signal-success/12 text-signal-success',
  SUGERIDA: 'bg-signal-info/12 text-signal-info',
  AMBIGUA: 'bg-signal-warning/12 text-signal-warning',
  PARCIAL: 'bg-signal-warning/12 text-signal-warning',
  MANUAL: 'bg-accent-primary-soft text-accent-primary',
  NAO_ENCONTRADA: 'bg-signal-danger/12 text-signal-danger',
}

const ASSOCIATION_DESCRIPTIONS: Record<ImportAssociationKind, string> = {
  EXATA: 'Documento, contexto e valor correspondem à comissão encontrada.',
  SUGERIDA: 'O sistema encontrou a comissão mais provável, mas nem todos os critérios permitiram classificá-la como exata. Revise o vínculo antes de confirmar.',
  AMBIGUA: 'Mais de uma comissão pode corresponder ao item. É necessário escolher o vínculo correto.',
  PARCIAL: 'O valor informado é menor que o saldo previsto. A diferença precisa ser justificada.',
  MANUAL: 'O vínculo foi escolhido ou alterado manualmente durante a conferência.',
  NAO_ENCONTRADA: 'Nenhuma comissão compatível foi encontrada para o item.',
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const fileSize = (value: number) => value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`

function uniqueContexts(rows: FinanceiroComissao[], id: 'filialId' | 'seguradoraId', label: 'filialNome' | 'seguradoraNome') {
  const values = new Map<string, string>()
  rows.forEach((row) => {
    const value = row[id]
    if (value) values.set(value, row[label])
  })
  return Array.from(values, ([value, text]) => ({ value, text })).sort((a, b) => a.text.localeCompare(b.text, 'pt-BR'))
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function demoFile(): File {
  const content = new TextEncoder().encode('%PDF-1.4\n% WassisCRM demonstrativo frontend\n1 0 obj<</Type/Catalog>>endobj\n%%EOF')
  return new File([content], 'demonstrativo-comissoes-demo.pdf', { type: 'application/pdf' })
}

function StepBadge({ index, current, label }: { index: number; current: number; label: string }) {
  const active = index <= current
  return <li className={`flex min-w-0 items-center gap-2 text-xs font-black ${active ? 'text-accent-primary' : 'text-fg-4'}`}>
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${active ? 'bg-accent-primary text-fg-on-brand' : 'bg-bg-surface-3 text-fg-3'}`}>
      {index < current ? <Check size={12} /> : index + 1}
    </span>
    <span className="truncate">{label}</span>
  </li>
}

function StatusBadge({ kind }: { kind: ImportAssociationKind }) {
  return <span title={ASSOCIATION_DESCRIPTIONS[kind]} aria-label={`${ASSOCIATION_LABELS[kind]}. ${ASSOCIATION_DESCRIPTIONS[kind]}`} className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${ASSOCIATION_TONES[kind]}`}>{ASSOCIATION_LABELS[kind]}</span>
}

function SummaryMetrics({ preview, totals }: { preview: CommissionImportPreview; totals: { gross: number; discounts: number; net: number; ignored: number; ready: number; occurrences: number } }) {
  return <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{[
    ['Itens', String(preview.items.length)],
    ['Prontos', String(totals.ready)],
    ['Ocorrências', String(totals.occurrences)],
    ['Ignorados', String(totals.ignored)],
    ['Bruto', money(totals.gross)],
    ['Líquido', money(totals.net)],
  ].map(([label, value]) => <div key={label} className="rounded-[8px] border border-border-1 bg-bg-surface-2 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className="mt-1 font-mono text-sm font-black text-fg-1">{value}</p></div>)}</div>
}

function AssociationLegend() {
  return <div className="flex flex-wrap items-start gap-x-6 gap-y-3 rounded-[8px] border border-border-1 bg-bg-surface-2 px-4 py-3 text-xs text-fg-2">
    <div className="flex shrink-0 items-center gap-2 font-black text-fg-1"><CircleHelp size={15} className="text-accent-primary" />Como interpretar</div>
    {(['EXATA', 'SUGERIDA', 'PARCIAL'] as const).map((kind) => <div key={kind} className="flex min-w-[220px] flex-1 items-start gap-2"><StatusBadge kind={kind} /><span className="leading-5">{ASSOCIATION_DESCRIPTIONS[kind]}</span></div>)}
  </div>
}

function ImportSummaryTable({
  preview,
  rows,
  completedCommissionIds,
}: {
  preview: CommissionImportPreview
  rows: FinanceiroComissao[]
  completedCommissionIds?: readonly string[]
}) {
  const completed = completedCommissionIds ? new Set(completedCommissionIds) : null

  return <div className="overflow-x-auto rounded-[8px] border border-border-1">
    <table className="w-full min-w-[1240px] border-collapse text-left">
      <thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3">
        <tr>
          <th className="px-3 py-3">Situação</th>
          <th className="px-3 py-3">Segurado</th>
          <th className="px-3 py-3">Ramo</th>
          <th className="px-3 py-3">Proposta</th>
          <th className="px-3 py-3">Apólice / documento</th>
          <th className="px-3 py-3 text-center">Parcela</th>
          <th className="px-3 py-3 text-right">Saldo previsto</th>
          <th className="px-3 py-3 text-right">Comissão informada</th>
          <th className="px-3 py-3 text-right">Diferença</th>
          <th className="px-3 py-3 text-right">Ação</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-1">
        {preview.items.map((item) => {
          const selected = rows.find((row) => row.id === item.selectedCommissionId)
          const expected = selected?.saldo ?? 0
          const difference = item.netValue - expected
          const isCompleted = Boolean(selected && completed?.has(selected.id))
          const financeUrl = selected ? `/apolices/${selected.apoliceId}?documento=${selected.proposta_id}&aba=agendas` : null

          return <tr key={item.id} className="bg-bg-surface hover:bg-bg-surface-2/70">
            <td className="px-3 py-3 align-top">
              {completed ? isCompleted
                ? <span className="inline-flex items-center gap-1.5 rounded-full bg-signal-success/12 px-2.5 py-1 text-[10px] font-black text-signal-success"><CheckCircle2 size={12} />Conciliada</span>
                : <span className="inline-flex rounded-full bg-bg-surface-3 px-2.5 py-1 text-[10px] font-black text-fg-3">Não conciliada</span>
                : <StatusBadge kind={item.associationKind} />}
              <p className="mt-1.5 font-mono text-[10px] text-fg-4">Linha {item.sequence}</p>
            </td>
            <td className="max-w-[220px] px-3 py-3 align-top"><p className="text-xs font-black text-fg-1">{item.insuredName}</p>{selected && item.insuredName !== selected.seguradoNome && <p className="mt-1 text-[10px] text-signal-warning">Vínculo: {selected.seguradoNome}</p>}</td>
            <td className="px-3 py-3 align-top text-xs font-bold text-fg-2">{selected?.ramoNome ?? '—'}</td>
            <td className="px-3 py-3 align-top font-mono text-xs font-bold text-fg-1">{item.proposalNumber || selected?.propostaNumero || '—'}</td>
            <td className="px-3 py-3 align-top"><p className="font-mono text-xs font-bold text-fg-1">{item.policyNumber || selected?.apoliceNumero || 'Em emissão'}</p><p className="mt-1 text-[10px] text-fg-3">{selected?.documentoReferencia ?? item.originalDescription}</p></td>
            <td className="px-3 py-3 text-center align-top font-mono text-xs font-bold text-fg-1">{item.installmentNumber || selected?.numero || '—'}</td>
            <td className="px-3 py-3 text-right align-top font-mono text-xs font-black text-fg-1">{selected ? money(expected) : '—'}</td>
            <td className="px-3 py-3 text-right align-top"><p className="font-mono text-xs font-black text-fg-1">{money(item.netValue)}</p><p className="mt-1 text-[10px] text-fg-3">Bruto {money(item.grossValue)}</p></td>
            <td className={`px-3 py-3 text-right align-top font-mono text-xs font-black ${Math.abs(difference) <= 0.01 ? 'text-signal-success' : 'text-signal-warning'}`}>{selected ? money(difference) : '—'}</td>
            <td className="px-3 py-3 text-right align-top">{financeUrl ? <a href={financeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary hover:bg-accent-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30">Abrir financeiro<ArrowUpRight size={12} /></a> : <span className="text-xs text-fg-4">Sem vínculo</span>}</td>
          </tr>
        })}
      </tbody>
      <tfoot className="border-t border-border-1 bg-bg-surface-2 font-mono text-xs font-black text-fg-1">
        <tr><td colSpan={6} className="px-3 py-3 text-right">Totais</td><td className="px-3 py-3 text-right">{money(preview.items.reduce((sum, item) => sum + (rows.find((row) => row.id === item.selectedCommissionId)?.saldo ?? 0), 0))}</td><td className="px-3 py-3 text-right">{money(preview.items.reduce((sum, item) => sum + item.netValue, 0))}</td><td className="px-3 py-3 text-right">{money(preview.items.reduce((sum, item) => sum + item.netValue - (rows.find((row) => row.id === item.selectedCommissionId)?.saldo ?? 0), 0))}</td><td /></tr>
      </tfoot>
    </table>
  </div>
}

export default function CommissionImportWizard({ rows, canUpdate, onCancel, onStartReceipt }: CommissionImportWizardProps) {
  const processFile = useProcessarDemonstrativoComissao()
  const confirmImport = useConfirmarImportacaoComissao()
  const branchOptions = useMemo(() => uniqueContexts(rows, 'filialId', 'filialNome'), [rows])
  const initialBranch = branchOptions[0]?.value ?? ''
  const initialInsurer = uniqueContexts(rows.filter((row) => row.filialId === initialBranch), 'seguradoraId', 'seguradoraNome')[0]?.value ?? ''
  const [step, setStep] = useState(0)
  const [branchId, setBranchId] = useState(initialBranch)
  const [insurerId, setInsurerId] = useState(initialInsurer)
  const [competence, setCompetence] = useState(today())
  const [files, setFiles] = useState<File[]>([])
  const [fileIndex, setFileIndex] = useState(0)
  const [preview, setPreview] = useState<CommissionImportPreview | null>(null)
  const [result, setResult] = useState<ConfirmCommissionImportResult | null>(null)
  const [localError, setLocalError] = useState('')
  const file = files[fileIndex] ?? null
  const insurerOptions = useMemo(() => uniqueContexts(rows.filter((row) => row.filialId === branchId), 'seguradoraId', 'seguradoraNome'), [branchId, rows])
  const contextRows = useMemo(() => rows.filter((row) => row.filialId === branchId && row.seguradoraId === insurerId), [branchId, insurerId, rows])
  const previewErrors = preview ? validateImportPreview(preview, rows) : []
  const totals = useMemo(() => preview?.items.reduce((summary, item) => ({
    gross: summary.gross + item.grossValue,
    discounts: summary.discounts + item.discountValue,
    net: summary.net + item.netValue,
    ignored: summary.ignored + Number(item.ignored),
    ready: summary.ready + Number(!item.ignored && Boolean(item.selectedCommissionId)),
    occurrences: summary.occurrences + Number(item.ignored || item.associationKind === 'AMBIGUA' || item.associationKind === 'PARCIAL' || item.associationKind === 'NAO_ENCONTRADA'),
  }), { gross: 0, discounts: 0, net: 0, ignored: 0, ready: 0, occurrences: 0 }) ?? { gross: 0, discounts: 0, net: 0, ignored: 0, ready: 0, occurrences: 0 }, [preview])
  const isBusy = processFile.isPending || confirmImport.isPending

  const changeBranch = (value: string) => {
    const nextInsurer = uniqueContexts(rows.filter((row) => row.filialId === value), 'seguradoraId', 'seguradoraNome')[0]?.value ?? ''
    setBranchId(value)
    setInsurerId(nextInsurer)
    setPreview(null)
  }

  const selectFiles = (nextFiles: File[]) => {
    setFiles(nextFiles)
    setFileIndex(0)
    setPreview(null)
    setLocalError('')
  }

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, candidateIndex) => candidateIndex !== index))
    setFileIndex((current) => Math.max(0, index < current ? current - 1 : current))
    setPreview(null)
    setLocalError('')
  }

  const nextFile = () => {
    setFileIndex((current) => current + 1)
    setPreview(null)
    setResult(null)
    setLocalError('')
    setStep(0)
  }

  const process = async () => {
    if (!file) {
      setLocalError('Selecione um arquivo para continuar.')
      return
    }
    setLocalError('')
    try {
      const nextPreview = await processFile.mutateAsync({ file, branchId, insurerId, competence })
      setPreview(nextPreview)
      setStep(1)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Não foi possível validar o arquivo.')
    }
  }

  const updateItem = (id: string, patch: Partial<CommissionImportItem>, editedField?: keyof CommissionImportItem) => {
    setPreview((current) => current ? {
      ...current,
      items: current.items.map((item) => {
        if (item.id !== id) return item
        const editedFields = editedField && !item.editedFields.includes(String(editedField))
          ? [...item.editedFields, String(editedField)]
          : item.editedFields
        return refreshImportItem({ ...item, ...patch, editedFields }, rows)
      }),
    } : current)
  }

  const confirm = async () => {
    if (!preview || previewErrors.length > 0) return
    setLocalError('')
    try {
      const nextResult = await confirmImport.mutateAsync(preview)
      setResult(nextResult)
      setStep(3)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Não foi possível confirmar a conciliação.')
    }
  }

  const footer = step === 0 ? <>
    <button type="button" onClick={onCancel} disabled={isBusy} className="rounded-full border border-border-1 px-5 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40">Cancelar</button>
    <button type="button" onClick={() => void process()} disabled={isBusy || !file || !branchId || !insurerId} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40">{processFile.isPending ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}{processFile.isPending ? 'Validando…' : 'Validar arquivo'}</button>
  </> : step === 1 ? <>
    <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-5 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3"><ArrowLeft size={15} />Voltar</button>
    <button type="button" onClick={() => setStep(2)} disabled={previewErrors.length > 0} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand disabled:opacity-40">Revisar confirmação<ArrowRight size={15} /></button>
  </> : step === 2 ? <>
    <button type="button" onClick={() => setStep(1)} disabled={isBusy} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-5 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40"><ArrowLeft size={15} />Voltar e ajustar</button>
    <button type="button" onClick={() => void confirm()} disabled={isBusy || !canUpdate || previewErrors.length > 0} title={!canUpdate ? 'Seu perfil pode revisar, mas não confirmar conciliações.' : undefined} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40">{confirmImport.isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}{confirmImport.isPending ? 'Confirmando…' : 'Confirmar conciliação'}</button>
  </> : <>
    {result && result.commissionIds.length > 0 && <button type="button" onClick={() => onStartReceipt(result.commissionIds)} className="inline-flex items-center gap-2 rounded-full border border-accent-primary px-5 py-2.5 text-sm font-black text-accent-primary hover:bg-accent-primary-soft"><ArrowRight size={15} />Baixar elegíveis</button>}
    {fileIndex + 1 < files.length ? <button type="button" onClick={nextFile} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)]">Próximo arquivo<ArrowRight size={15} /></button> : <button type="button" onClick={onCancel} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)]">Voltar para Comissões</button>}
  </>

  return <section className="overflow-hidden rounded-[12px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
    <div className="border-b border-border-1 bg-bg-surface px-8 py-4">
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Etapas da importação">
        {['Upload', 'Conferência', 'Confirmação', 'Conclusão'].map((label, index) => <StepBadge key={label} index={index} current={step} label={label} />)}
      </ol>
    </div>

    <div className="px-5 py-6 sm:px-8" aria-live="polite">
      {step === 0 && <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-fg-3">Corretora</span><select value={branchId} onChange={(event) => changeBranch(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1">{branchOptions.map((option) => <option key={option.value} value={option.value}>{option.text}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-fg-3">Seguradora</span><select value={insurerId} onChange={(event) => { setInsurerId(event.target.value); setPreview(null) }} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1">{insurerOptions.map((option) => <option key={option.value} value={option.value}>{option.text}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-fg-3">Competência</span><input type="date" value={competence} onChange={(event) => { setCompetence(event.target.value); setPreview(null) }} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1" /></label>
        </div>

        <div className="rounded-[8px] border border-dashed border-border-2 bg-bg-surface-2 px-6 py-8 text-center">
          <FileUp className="mx-auto text-accent-primary" size={28} />
          <h3 className="mt-3 text-base font-black text-fg-1">Selecione o demonstrativo da seguradora</h3>
          <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-fg-3">PDF, XLS ou XLSX. O arquivo é uma unidade independente e a confirmação não reconhece recebimento.</p>
          <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)]"><FileUp size={15} />Escolher arquivos<input type="file" multiple accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => selectFiles(Array.from(event.target.files ?? []))} className="sr-only" /></label>
          <button type="button" onClick={() => selectFiles([demoFile()])} className="ml-2 rounded-full border border-border-1 bg-bg-surface px-5 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3">Usar demonstração</button>
          {files.length > 0 && <div className="mx-auto mt-5 max-w-xl overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface text-left">{files.map((selectedFile, index) => <div key={`${selectedFile.name}-${selectedFile.lastModified}-${index}`} className={`flex items-center justify-between gap-3 border-b border-border-1 px-4 py-3 last:border-b-0 ${index === fileIndex ? 'bg-accent-primary-soft/45' : ''}`}><button type="button" onClick={() => { setFileIndex(index); setPreview(null); setLocalError('') }} className="flex min-w-0 flex-1 items-center gap-3 text-left">{selectedFile.name.toLowerCase().endsWith('.pdf') ? <FileText className="shrink-0 text-signal-danger" size={20} /> : <FileSpreadsheet className="shrink-0 text-signal-success" size={20} />}<span className="min-w-0"><span className="block truncate text-sm font-black text-fg-1">{selectedFile.name}</span><span className="text-[11px] text-fg-3">{fileSize(selectedFile.size)}{index === fileIndex ? ' · arquivo atual' : ''}</span></span></button><button type="button" onClick={() => removeFile(index)} className="text-xs font-black text-signal-danger hover:underline">Remover</button></div>)}</div>}
        </div>

        <div className="rounded-[8px] border border-signal-info/25 bg-signal-info/8 px-4 py-3 text-xs leading-relaxed text-signal-info"><strong className="font-black">Ambiente frontend:</strong> o fluxo usa resposta de extração simulada e tipada. Layouts por seguradora só serão publicados depois da homologação com amostras anonimizadas.</div>
        <div className="grid gap-3 sm:grid-cols-3">{[['PDF', 'Camada de texto'], ['XLS', 'Planilha legada'], ['XLSX', 'Planilha atual']].map(([format, detail]) => <div key={format} className="rounded-[8px] border border-border-1 px-4 py-3"><p className="font-mono text-sm font-black text-fg-1">{format}</p><p className="mt-0.5 text-[11px] text-fg-3">{detail} · validação demonstrativa</p></div>)}</div>
        <p className="text-xs font-bold text-fg-3">{contextRows.length} comissão(ões) pendente(s) no contexto selecionado.</p>
      </div>}

      {step === 1 && preview && <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface-2 px-4 py-3"><div><p className="text-sm font-black text-fg-1">{preview.fileName}</p><p className="mt-0.5 text-[11px] text-fg-3">{preview.format} · referência {preview.externalReference} · versão {preview.parserVersion}</p></div>{preview.duplicateExtractId && <span className="rounded-full bg-signal-warning/12 px-3 py-1 text-[10px] font-black text-signal-warning">Arquivo já conhecido</span>}</div>
        <div className="overflow-x-auto rounded-[8px] border border-border-1"><table className="w-full min-w-[1040px] border-collapse text-left"><thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3"><tr><th className="px-3 py-3">Linha / associação</th><th className="px-3 py-3">Segurado e documento</th><th className="px-3 py-3">Valores</th><th className="px-3 py-3">Vínculo</th><th className="px-3 py-3">Tratamento</th></tr></thead><tbody className="divide-y divide-border-1">{preview.items.map((item) => {
          const selected = rows.find((row) => row.id === item.selectedCommissionId)
          const requiresNote = item.ignored || (selected ? Math.abs(item.netValue - selected.saldo) > 0.01 : true)
          return <tr key={item.id} className={item.ignored ? 'bg-bg-surface-2 opacity-70' : 'bg-bg-surface'}><td className="px-3 py-4 align-top"><p className="font-mono text-xs font-black text-fg-1">#{item.sequence}</p><div className="mt-2"><StatusBadge kind={item.associationKind} /></div>{item.editedFields.length > 0 && <p className="mt-2 text-[10px] font-bold text-accent-primary">{item.editedFields.length} ajuste(s)</p>}</td><td className="w-[280px] px-3 py-4 align-top"><input value={item.insuredName} disabled={item.ignored} onChange={(event) => updateItem(item.id, { insuredName: event.target.value }, 'insuredName')} aria-label={`Segurado da linha ${item.sequence}`} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-2.5 py-2 text-xs font-bold text-fg-1 disabled:opacity-50" /><input value={item.policyNumber} disabled={item.ignored} onChange={(event) => updateItem(item.id, { policyNumber: event.target.value }, 'policyNumber')} aria-label={`Apólice da linha ${item.sequence}`} placeholder="Apólice" className="mt-2 w-full rounded-[6px] border border-border-1 bg-bg-surface px-2.5 py-2 font-mono text-xs font-bold text-fg-1 disabled:opacity-50" /></td><td className="w-[190px] px-3 py-4 align-top"><div className="grid grid-cols-2 gap-2"><label className="text-[9px] font-black uppercase text-fg-3">Bruto<input type="number" step="0.01" value={item.grossValue} disabled={item.ignored} onChange={(event) => updateItem(item.id, { grossValue: Number(event.target.value) }, 'grossValue')} className="mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-2 py-1.5 font-mono text-xs text-fg-1" /></label><label className="text-[9px] font-black uppercase text-fg-3">Líquido<input type="number" step="0.01" value={item.netValue} disabled={item.ignored} onChange={(event) => updateItem(item.id, { netValue: Number(event.target.value) }, 'netValue')} className="mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-2 py-1.5 font-mono text-xs text-fg-1" /></label></div><p className="mt-2 text-[10px] text-fg-3">Descontos {money(item.discountValue)}</p></td><td className="w-[260px] px-3 py-4 align-top"><select value={item.selectedCommissionId ?? ''} disabled={item.ignored} onChange={(event) => updateItem(item.id, { selectedCommissionId: event.target.value || null })} aria-label={`Comissão vinculada à linha ${item.sequence}`} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-2.5 py-2 text-xs font-bold text-fg-1 disabled:opacity-50"><option value="">Escolher comissão…</option>{contextRows.filter((row) => row.statusOperacional !== 'CANCELADA' && Math.abs(row.saldo) > 0.01).map((row) => <option key={row.id} value={row.id}>{row.seguradoNome} · {row.documentoReferencia} · {money(row.saldo)}</option>)}</select>{selected && <p className="mt-2 text-[10px] text-fg-3">Saldo previsto {money(selected.saldo)}</p>}</td><td className="w-[250px] px-3 py-4 align-top"><label className="flex items-center gap-2 text-xs font-bold text-fg-2"><input type="checkbox" checked={item.ignored} onChange={(event) => updateItem(item.id, { ignored: event.target.checked })} />Descartar item</label>{requiresNote && <textarea value={item.resolutionNote} onChange={(event) => updateItem(item.id, { resolutionNote: event.target.value })} rows={2} placeholder={item.ignored ? 'Motivo do descarte' : 'Justificativa da diferença'} className="mt-2 w-full resize-none rounded-[6px] border border-signal-warning/40 bg-bg-surface px-2.5 py-2 text-xs text-fg-1" />}</td></tr>
        })}</tbody></table></div>
        {previewErrors.length > 0 && <div role="alert" className="rounded-[8px] border border-signal-warning/30 bg-signal-warning/8 px-4 py-3"><div className="flex items-center gap-2 text-sm font-black text-signal-warning"><TriangleAlert size={16} />Ajustes necessários</div><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-fg-2">{previewErrors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      </div>}

      {step === 2 && preview && <div className="space-y-5">
        <SummaryMetrics preview={preview} totals={totals} />
        <AssociationLegend />
        <ImportSummaryTable preview={preview} rows={rows} />
        <div className="rounded-[8px] border border-signal-info/25 bg-signal-info/8 px-4 py-3 text-xs leading-relaxed text-signal-info"><strong className="font-black">Atenção:</strong> confirmar registra o extrato, os itens, as conciliações e as resoluções informadas. Nenhuma comissão será baixada nesta etapa.</div>
        {!canUpdate && <div role="alert" className="rounded-[8px] border border-signal-warning/30 bg-signal-warning/8 px-4 py-3 text-xs font-bold text-signal-warning">Seu perfil está em modo somente leitura para esta confirmação.</div>}
      </div>}

      {step === 3 && result && preview && <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-[8px] border border-signal-success/30 bg-signal-success/8 px-4 py-3"><CheckCircle2 className="mt-0.5 shrink-0 text-signal-success" size={20} /><div><h3 className="text-sm font-black text-fg-1">Conciliação concluída</h3><p className="mt-1 text-xs leading-5 text-fg-3">O demonstrativo e as linhas abaixo foram registrados. Nenhuma baixa foi realizada automaticamente.</p></div></div>
        <SummaryMetrics preview={preview} totals={totals} />
        <ImportSummaryTable preview={preview} rows={rows} completedCommissionIds={preview.items.filter((item) => !item.ignored && item.selectedCommissionId).map((item) => item.selectedCommissionId!)} />
        {result.idempotent && <p className="rounded-[8px] bg-signal-warning/10 px-4 py-3 text-xs font-bold text-signal-warning">Este arquivo já havia sido confirmado; o resultado anterior foi reutilizado sem duplicação.</p>}
        <div className="rounded-[8px] border border-signal-info/25 bg-signal-info/8 px-4 py-3 text-xs leading-5 text-signal-info"><strong className="font-black">Próxima ação:</strong> {result.commissionIds.length} comissão(ões) está(ão) elegível(is) para baixa. Use “Baixar elegíveis” para iniciar o fluxo separado do 3.3.</div>
      </div>}

      {localError && <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 rounded-[8px] border border-signal-danger/30 bg-signal-danger/8 px-4 py-3 text-xs font-bold text-signal-danger"><AlertCircle className="shrink-0" size={15} /><span className="min-w-0 flex-1">{localError}</span>{step === 0 && <button type="button" disabled={!canUpdate} onClick={() => onStartReceipt([])} className="rounded-full border border-signal-danger/30 bg-bg-surface px-3 py-1.5 text-[11px] font-black text-signal-danger disabled:opacity-40">Continuar pela baixa manual</button>}</div>}
    </div>
    <footer className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-border-1 bg-bg-surface-2 px-5 py-5 sm:px-8">
      {footer}
    </footer>
  </section>
}
