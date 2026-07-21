import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Search, WalletCards } from 'lucide-react'
import AppModal from '../modals/AppModal'
import type { BaixaManualCommand, FinanceiroComissao } from '../../modules/financeiro/comissoesDomain'

interface CommissionReceiptModalProps {
  rows: FinanceiroComissao[]
  initialIds: string[]
  isSaving: boolean
  onClose: () => void
  onConfirm: (command: BaixaManualCommand) => void
}

interface ItemDraft {
  valorBruto: number
  valorDescontos: number
  valorEfetivo: number
  percentualInformado: number | null
  justificativa: string
  usarConciliacoes: boolean
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const localDate = () => {
  const current = new Date()
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
}
const monthStart = () => `${localDate().slice(0, 7)}-01`
const operationKey = () => `baixa-manual-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`

function initialDraft(row: FinanceiroComissao): ItemDraft {
  return {
    valorBruto: row.saldo,
    valorDescontos: 0,
    valorEfetivo: row.saldo,
    percentualInformado: row.percentual,
    justificativa: '',
    usarConciliacoes: row.conciliacaoIds.length > 0,
  }
}

function needsJustification(row: FinanceiroComissao, draft: ItemDraft, competencia: string): boolean {
  const tolerance = 0.01
  const partialOrOver = Math.abs(Math.abs(draft.valorEfetivo) - Math.abs(row.saldo)) > tolerance
  const netMismatch = Math.abs(Math.abs(draft.valorBruto) - draft.valorDescontos - Math.abs(draft.valorEfetivo)) > tolerance
  const percentageMismatch = draft.percentualInformado !== null && row.percentual !== null
    && Math.abs(draft.percentualInformado - row.percentual) > tolerance
  const competenceMismatch = Boolean(
    row.competencia_inicio && row.competencia_fim
      ? competencia < row.competencia_inicio || competencia > row.competencia_fim
      : row.competencia_inicio && competencia !== row.competencia_inicio,
  )
  return partialOrOver || netMismatch || percentageMismatch || competenceMismatch
}

function FieldLabel({ children }: { children: string }) {
  return <span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">{children}</span>
}

export default function CommissionReceiptModal({ rows, initialIds, isSaving, onClose, onConfirm }: CommissionReceiptModalProps) {
  const eligibleRows = useMemo(() => rows.filter((row) => row.statusOperacional !== 'CANCELADA' && Math.abs(row.saldo) > 0.01 && row.ocorrenciasAbertas === 0 && row.conciliacoesPendentes === 0), [rows])
  const firstInitial = eligibleRows.find((row) => initialIds.includes(row.id)) ?? eligibleRows[0]
  const initialBatchIds = firstInitial
    ? initialIds.filter((id) => eligibleRows.some((row) => row.id === id && row.filialId === firstInitial.filialId && row.seguradoraId === firstInitial.seguradoraId))
    : []
  const [step, setStep] = useState(0)
  const [filialId, setFilialId] = useState(firstInitial?.filialId ?? '')
  const [seguradoraId, setSeguradoraId] = useState(firstInitial?.seguradoraId ?? '')
  const [competencia, setCompetencia] = useState(firstInitial?.competencia_inicio ?? monthStart())
  const [dataEfetiva, setDataEfetiva] = useState(localDate())
  const [identificacaoExterna, setIdentificacaoExterna] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialBatchIds)
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>(() => Object.fromEntries(
    eligibleRows.filter((row) => initialBatchIds.includes(row.id)).map((row) => [row.id, initialDraft(row)]),
  ))
  const [key] = useState(operationKey)

  const branchOptions = useMemo(() => Array.from(new Map(eligibleRows.map((row) => [row.filialId, row.filialNome])), ([value, label]) => ({ value, label })), [eligibleRows])
  const insurerOptions = useMemo(() => Array.from(new Map(eligibleRows.filter((row) => row.filialId === filialId && row.seguradoraId).map((row) => [row.seguradoraId!, row.seguradoraNome])), ([value, label]) => ({ value, label })), [eligibleRows, filialId])
  const availableRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return eligibleRows.filter((row) => row.filialId === filialId && row.seguradoraId === seguradoraId && (!term || [row.seguradoNome, row.documentoReferencia, row.apoliceNumero].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(term)))
  }, [eligibleRows, filialId, seguradoraId, search])
  const selectedRows = useMemo(() => eligibleRows.filter((row) => selectedIds.includes(row.id)), [eligibleRows, selectedIds])
  const totals = useMemo(() => selectedRows.reduce((total, row) => {
    const draft = drafts[row.id] ?? initialDraft(row)
    return {
      bruto: total.bruto + draft.valorBruto,
      descontos: total.descontos + draft.valorDescontos,
      efetivo: total.efetivo + draft.valorEfetivo,
    }
  }, { bruto: 0, descontos: 0, efetivo: 0 }), [drafts, selectedRows])

  const updateBatch = (nextBranchId: string, nextInsurerId?: string) => {
    const insurer = nextInsurerId ?? eligibleRows.find((row) => row.filialId === nextBranchId)?.seguradoraId ?? ''
    setFilialId(nextBranchId)
    setSeguradoraId(insurer)
    setSelectedIds([])
    setDrafts({})
  }

  const toggleRow = (row: FinanceiroComissao) => {
    if (selectedIds.includes(row.id)) {
      setSelectedIds((current) => current.filter((id) => id !== row.id))
      return
    }
    setSelectedIds((current) => [...current, row.id])
    setDrafts((current) => ({ ...current, [row.id]: current[row.id] ?? initialDraft(row) }))
  }

  const updateDraft = (row: FinanceiroComissao, patch: Partial<ItemDraft>) => {
    setDrafts((current) => ({ ...current, [row.id]: { ...(current[row.id] ?? initialDraft(row)), ...patch } }))
  }

  const itemsValid = selectedRows.length > 0 && selectedRows.every((row) => {
    const draft = drafts[row.id] ?? initialDraft(row)
    const numeric = [draft.valorBruto, draft.valorDescontos, draft.valorEfetivo].every(Number.isFinite)
    const signed = Math.abs(draft.valorBruto) > 0.01 && Math.abs(draft.valorEfetivo) > 0.01
      && Math.sign(draft.valorBruto) === Math.sign(row.saldo) && Math.sign(draft.valorEfetivo) === Math.sign(row.saldo)
    const validPercentage = draft.percentualInformado === null || Number.isFinite(draft.percentualInformado)
    return numeric && signed && validPercentage && draft.valorDescontos >= 0 && (!needsJustification(row, draft, competencia) || draft.justificativa.trim().length >= 5)
  })
  const headerValid = Boolean(filialId && seguradoraId && competencia && dataEfetiva)

  const submit = () => onConfirm({
    filialId, seguradoraId, competencia, dataEfetiva,
    identificacaoExterna: identificacaoExterna.trim() || undefined,
    observacoes: observacoes.trim() || undefined,
    chaveIdempotencia: key,
    items: selectedRows.map((row) => {
      const draft = drafts[row.id] ?? initialDraft(row)
      return {
        comissaoId: row.id,
        valorBruto: draft.valorBruto,
        valorDescontos: draft.valorDescontos,
        valorEfetivo: draft.valorEfetivo,
        percentualInformado: draft.percentualInformado,
        justificativa: draft.justificativa.trim() || undefined,
        conciliacaoIds: draft.usarConciliacoes ? row.conciliacaoIds : undefined,
      }
    }),
  })

  const footer = <>
    {step > 0 && <button type="button" disabled={isSaving} onClick={() => setStep((current) => current - 1)} className="mr-auto inline-flex items-center gap-2 rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40"><ArrowLeft size={15} />Voltar</button>}
    <button type="button" disabled={isSaving} onClick={onClose} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40">Cancelar</button>
    {step < 2
      ? <button type="button" disabled={isSaving || (step === 0 ? !headerValid : !itemsValid)} onClick={() => setStep((current) => current + 1)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40">Continuar<ArrowRight size={15} /></button>
      : <button type="button" disabled={isSaving || !itemsValid} onClick={submit} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40"><Check size={15} />{isSaving ? 'Registrando…' : 'Confirmar baixa'}</button>}
  </>

  return <AppModal isOpen onClose={onClose} isDismissDisabled={isSaving} title="Registrar baixa manual" description="Reconheça o recebimento sem alterar a agenda contratual nem apagar o histórico." icon={<WalletCards size={18} />} size="lg" footer={footer}>
    <div className="border-b border-border-1 bg-bg-surface px-8 py-4">
      <ol className="grid grid-cols-3 gap-3" aria-label="Etapas da baixa manual">
        {['Identificação', 'Comissões', 'Conferência'].map((label, index) => <li key={label} className={`flex items-center gap-2 text-xs font-black ${index <= step ? 'text-accent-primary' : 'text-fg-4'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${index <= step ? 'bg-accent-primary text-fg-on-brand' : 'bg-bg-surface-3 text-fg-3'}`}>{index < step ? <Check size={12} /> : index + 1}</span>{label}</li>)}
      </ol>
    </div>

    <div className="max-h-[62vh] overflow-y-auto px-8 py-6">
      {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5"><FieldLabel>Corretora</FieldLabel><select value={filialId} onChange={(event) => updateBatch(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1">{branchOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="space-y-1.5"><FieldLabel>Seguradora</FieldLabel><select value={seguradoraId} onChange={(event) => updateBatch(filialId, event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1">{insurerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="space-y-1.5"><FieldLabel>Competência</FieldLabel><input type="date" value={competencia} onChange={(event) => setCompetencia(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1" /></label>
        <label className="space-y-1.5"><FieldLabel>Data efetiva</FieldLabel><input type="date" value={dataEfetiva} onChange={(event) => setDataEfetiva(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1" /></label>
        <label className="space-y-1.5 sm:col-span-2"><FieldLabel>Referência da seguradora</FieldLabel><input value={identificacaoExterna} onChange={(event) => setIdentificacaoExterna(event.target.value)} placeholder="Lote, demonstrativo ou protocolo (opcional)" className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1 placeholder:text-fg-4" /></label>
        <label className="space-y-1.5 sm:col-span-2"><FieldLabel>Observações</FieldLabel><textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} placeholder="Contexto operacional do recebimento" className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-medium text-fg-1 placeholder:text-fg-4" /></label>
        <div className="sm:col-span-2 rounded-[8px] border border-accent-primary/20 bg-accent-primary-soft px-4 py-3 text-xs leading-relaxed text-accent-primary"><strong className="font-black">Sem arquivo?</strong> O sistema cria uma origem manual auditável. PDF e Excel permanecem no recorte 3.4.</div>
      </div>}

      {step === 1 && <div className="space-y-4">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por segurado, proposta ou apólice" className="w-full rounded-[6px] border border-border-1 bg-bg-surface py-2.5 pl-9 pr-3 text-sm font-bold text-fg-1 placeholder:text-fg-4" /></div>
        <div className="overflow-hidden rounded-[8px] border border-border-1">
          {availableRows.length === 0 ? <div className="px-5 py-10 text-center text-sm text-fg-3">Nenhuma comissão pendente neste contexto.</div> : availableRows.map((row) => {
            const selected = selectedIds.includes(row.id)
            const draft = drafts[row.id] ?? initialDraft(row)
            const requiresReason = needsJustification(row, draft, competencia)
            return <div key={row.id} className={`border-b border-border-1 p-4 last:border-b-0 ${selected ? 'bg-accent-primary-soft/45' : 'bg-bg-surface'}`}>
              <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={selected} onChange={() => toggleRow(row)} className="mt-1" /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm font-black text-fg-1">{row.seguradoNome}</strong><span className="font-mono text-sm font-black text-fg-1">Saldo {money(row.saldo)}</span></span><span className="mt-0.5 block text-xs text-fg-3">{row.documentoReferencia} · {row.tipo_comissao} · prevista {money(row.valor_previsto ?? 0)}</span></span></label>
              {selected && <div className="mt-4 grid gap-3 border-t border-border-1 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1"><FieldLabel>Bruto informado</FieldLabel><input type="number" step="0.01" value={draft.valorBruto} onChange={(event) => updateDraft(row, { valorBruto: Number(event.target.value) })} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm font-mono font-bold text-fg-1" /></label>
                <label className="space-y-1"><FieldLabel>Descontos</FieldLabel><input type="number" min="0" step="0.01" value={draft.valorDescontos} onChange={(event) => updateDraft(row, { valorDescontos: Number(event.target.value) })} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm font-mono font-bold text-fg-1" /></label>
                <label className="space-y-1"><FieldLabel>Efetivamente recebido</FieldLabel><input type="number" step="0.01" value={draft.valorEfetivo} onChange={(event) => updateDraft(row, { valorEfetivo: Number(event.target.value) })} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm font-mono font-black text-fg-1" /></label>
                <label className="space-y-1"><FieldLabel>Percentual informado</FieldLabel><input type="number" step="0.01" value={draft.percentualInformado ?? ''} onChange={(event) => updateDraft(row, { percentualInformado: event.target.value === '' ? null : Number(event.target.value) })} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm font-mono font-bold text-fg-1" /></label>
                {row.conciliacaoIds.length > 0 && <label className="flex items-center gap-2 text-xs font-bold text-fg-2 sm:col-span-2 lg:col-span-4"><input type="checkbox" checked={draft.usarConciliacoes} onChange={(event) => updateDraft(row, { usarConciliacoes: event.target.checked })} />Usar {row.conciliacaoIds.length} conciliação(ões) confirmada(s) já existente(s)</label>}
                {requiresReason && <label className="space-y-1 sm:col-span-2 lg:col-span-4"><FieldLabel>Justificativa obrigatória</FieldLabel><textarea value={draft.justificativa} onChange={(event) => updateDraft(row, { justificativa: event.target.value })} rows={2} placeholder="Explique parcialidade ou diferença de valor, percentual ou competência" className="w-full resize-none rounded-[6px] border border-signal-warning/40 bg-bg-surface px-3 py-2 text-sm text-fg-1" /></label>}
              </div>}
            </div>
          })}
        </div>
      </div>}

      {step === 2 && <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {[['Bruto informado', money(totals.bruto)], ['Descontos', money(totals.descontos)], ['Efetivamente recebido', money(totals.efetivo)]].map(([label, value]) => <div key={label} className="rounded-[8px] border border-border-1 bg-bg-surface-2 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className="mt-1 font-mono text-base font-black text-fg-1">{value}</p></div>)}
        </div>
        <div className="overflow-hidden rounded-[8px] border border-border-1"><div className="flex items-center gap-2 border-b border-border-1 bg-bg-surface-2 px-4 py-3 text-xs font-black text-fg-2"><ClipboardCheck size={15} />{selectedRows.length} comissão(ões) nesta baixa</div>{selectedRows.map((row) => { const draft = drafts[row.id] ?? initialDraft(row); return <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border-1 px-4 py-3 last:border-b-0"><div><p className="text-sm font-black text-fg-1">{row.seguradoNome}</p><p className="text-xs text-fg-3">{row.documentoReferencia} · {draft.usarConciliacoes && row.conciliacaoIds.length > 0 ? `${row.conciliacaoIds.length} conciliação(ões)` : 'origem manual'}</p></div><div className="text-right"><p className="font-mono text-sm font-black text-fg-1">{money(draft.valorEfetivo)}</p><p className="text-[10px] text-fg-3">saldo anterior {money(row.saldo)}</p></div></div>})}</div>
        <div className="rounded-[8px] border border-signal-success/25 bg-signal-success/8 px-4 py-3 text-xs leading-relaxed text-signal-success"><strong className="font-black">Confirmação auditável:</strong> a operação cria eventos imutáveis, preserva o previsto e libera apenas repasses ainda não pagos.</div>
      </div>}
    </div>
  </AppModal>
}
