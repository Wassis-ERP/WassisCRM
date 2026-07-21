import { useMemo, useState } from 'react'
import { CheckCircle2, ReceiptText } from 'lucide-react'
import AppModal from '../modals/AppModal'
import type { RepasseFormaPagamento } from '../../types/database'
import {
  groupRepasseReceipts,
  type EmitirRepasseRecibosCommand,
  type FinanceiroRepasse,
} from '../../modules/financeiro/repasseDomain'
import { canSubmitRepasseReceipt } from '../../modules/financeiro/repasseReceiptValidation'

interface RepasseReceiptModalProps {
  rows: FinanceiroRepasse[]
  isSaving: boolean
  onClose: () => void
  onConfirm: (command: EmitirRepasseRecibosCommand) => void
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const today = () => new Date().toLocaleDateString('en-CA')
const operationKey = () => `repasse-recibo-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`

export default function RepasseReceiptModal({ rows, isSaving, onClose, onConfirm }: RepasseReceiptModalProps) {
  const groups = useMemo(() => groupRepasseReceipts(rows), [rows])
  const [dataPagamento, setDataPagamento] = useState(today)
  const [formaPagamento, setFormaPagamento] = useState<RepasseFormaPagamento>('TRANSFERENCIA_BANCARIA')
  const [referencia, setReferencia] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [key] = useState(operationKey)
  const total = groups.reduce((value, group) => value + group.total, 0)

  const submit = () => onConfirm({
    repasseIds: rows.map((row) => row.id), dataPagamento, formaPagamento,
    comprovanteReferencia: referencia.trim() || undefined,
    observacoes: observacoes.trim() || undefined, chaveIdempotencia: key,
  })

  const footer = <>
    <button type="button" disabled={isSaving} onClick={onClose} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40">Cancelar</button>
    <button type="button" disabled={!canSubmitRepasseReceipt(confirmed, dataPagamento, isSaving)} onClick={submit} title={!confirmed ? 'Marque a confirmação obrigatória para continuar.' : undefined} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:cursor-not-allowed disabled:opacity-40"><ReceiptText size={15} />{isSaving ? 'Emitindo recibos…' : 'Emitir recibo e marcar como pago'}</button>
  </>

  return <AppModal isOpen onClose={onClose} isDismissDisabled={isSaving} title="Emitir recibo e marcar como pago" description="A emissão é integral e cria um recibo por corretora, beneficiário e sentido financeiro." icon={<ReceiptText size={18} />} size="lg" footer={footer}>
    <div className="max-h-[68vh] overflow-y-auto px-8 py-6">
      <section className="grid gap-3 sm:grid-cols-3">
        {[['Repasses', String(rows.length)], ['Recibos', String(groups.length)], ['Total líquido', money(total)]].map(([label, value]) => <div key={label} className="rounded-[8px] border border-border-1 bg-bg-surface-2 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className="mt-1 font-mono text-base font-black text-fg-1">{value}</p></div>)}
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Data do pagamento</span><input type="date" value={dataPagamento} onChange={(event) => setDataPagamento(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20" /></label>
        <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Forma</span><select value={formaPagamento} onChange={(event) => setFormaPagamento(event.target.value as RepasseFormaPagamento)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1"><option value="TRANSFERENCIA_BANCARIA">Transferência bancária</option><option value="DINHEIRO">Dinheiro</option><option value="CHEQUE">Cheque</option><option value="OUTRO">Outro</option></select></label>
        <label className="space-y-1.5 sm:col-span-2"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Referência do comprovante</span><input value={referencia} onChange={(event) => setReferencia(event.target.value)} placeholder="Identificação bancária ou referência interna (opcional)" className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1 placeholder:text-fg-4" /></label>
        <label className="space-y-1.5 sm:col-span-2"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Observações</span><textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={2} placeholder="Contexto operacional do pagamento" className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm text-fg-1 placeholder:text-fg-4" /></label>
      </div>

      <section className="mt-5 overflow-hidden rounded-[8px] border border-border-1" aria-label="Recibos que serão emitidos">
        <div className="border-b border-border-1 bg-bg-surface-2 px-4 py-3 text-xs font-black text-fg-2">Agrupamento automático</div>
        {groups.map((group) => <article key={group.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-border-1 px-4 py-3 last:border-b-0"><div><p className="text-sm font-black text-fg-1">{group.beneficiarioNome}</p><p className="mt-0.5 text-xs text-fg-3">{group.filialNome} · {group.sentido === 'CREDITO' ? 'Crédito' : 'Débito'} · {group.rows.length} item(ns)</p></div><p className={`font-mono text-sm font-black ${group.sentido === 'DEBITO' ? 'text-signal-warning' : 'text-fg-1'}`}>{money(group.total)}</p></article>)}
      </section>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[8px] border border-accent-primary/30 bg-accent-primary-soft p-4 text-sm leading-relaxed text-fg-1">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-primary)]" />
        <span><strong className="flex items-center gap-1.5 font-black text-accent-primary"><CheckCircle2 size={15} />Confirmação obrigatória</strong><span className="mt-1 block">Confirmo que o pagamento foi realizado e que os repasses selecionados serão marcados como pagos.</span></span>
      </label>
    </div>
  </AppModal>
}
