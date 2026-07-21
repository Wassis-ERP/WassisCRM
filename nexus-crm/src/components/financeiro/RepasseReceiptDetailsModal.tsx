import { useState } from 'react'
import { FileDown, ReceiptText, RotateCcw, ShieldCheck } from 'lucide-react'
import AppModal from '../modals/AppModal'
import { createReceiptExcel, createReceiptPdf, downloadExport } from '../../modules/financeiro/financialExports'
import type { RepasseReciboDetalhe } from '../../modules/financeiro/repasseDomain'

interface RepasseReceiptDetailsModalProps {
  detail: RepasseReciboDetalhe
  canUpdate: boolean
  isSaving: boolean
  onClose: () => void
  onCancel: (justification: string, key: string) => void
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))
const cancellationKey = () => `cancelar-recibo-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`

export default function RepasseReceiptDetailsModal({ detail, canUpdate, isSaving, onClose, onCancel }: RepasseReceiptDetailsModalProps) {
  const [cancelling, setCancelling] = useState(false)
  const [justification, setJustification] = useState('')
  const [key] = useState(cancellationKey)
  const { recibo, itens } = detail

  const footer = cancelling ? <>
    <button type="button" disabled={isSaving} onClick={() => { setCancelling(false); setJustification('') }} className="mr-auto rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40">Voltar ao recibo</button>
    <button type="button" disabled={isSaving} onClick={onClose} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 disabled:opacity-40">Fechar</button>
    <button type="button" disabled={isSaving || justification.trim().length < 5} onClick={() => onCancel(justification.trim(), key)} className="inline-flex items-center gap-2 rounded-full bg-signal-warning px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"><RotateCcw size={15} />{isSaving ? 'Cancelando…' : 'Cancelar recibo integralmente'}</button>
  </> : <>
    <button type="button" onClick={() => downloadExport(createReceiptPdf(detail))} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3"><FileDown size={15} />Reemitir PDF</button>
    <button type="button" onClick={() => downloadExport(createReceiptExcel(detail))} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3"><FileDown size={15} />Reemitir Excel</button>
    {recibo.status === 'EMITIDO' && canUpdate && <button type="button" onClick={() => setCancelling(true)} className="inline-flex items-center gap-2 rounded-full border border-signal-warning/40 px-4 py-2.5 text-sm font-black text-signal-warning hover:bg-signal-warning/8"><RotateCcw size={15} />Cancelar recibo</button>}
    <button type="button" onClick={onClose} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Fechar</button>
  </>

  return <AppModal isOpen onClose={onClose} isDismissDisabled={isSaving} title={recibo.numero} description={`${recibo.beneficiario_nome_snapshot} · ${recibo.filial_nome_snapshot}`} icon={<ReceiptText size={18} />} size="lg" footer={footer}>
    <div className="max-h-[68vh] overflow-y-auto px-8 py-6">
      {cancelling ? <div className="space-y-5">
        <div className="rounded-[8px] border border-signal-warning/30 bg-signal-warning/8 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-signal-warning">Cancelamento integral</p><p className="mt-2 text-sm leading-relaxed text-fg-2">Os {itens.length} repasses voltarão a <strong>LIBERADO</strong>. O recibo e seus itens continuarão consultáveis; nenhum registro será apagado.</p></div>
        <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Justificativa obrigatória</span><textarea autoFocus value={justification} onChange={(event) => setJustification(event.target.value)} rows={4} placeholder="Descreva o motivo da correção" className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20" /></label>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-fg-3"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-signal-success" />A correção posterior exige um novo recibo. Esta emissão permanece preservada para auditoria.</p>
      </div> : <>
        <section className="grid gap-3 sm:grid-cols-4">
          {[['Status', recibo.status], ['Pagamento', date(recibo.data_pagamento)], ['Itens', String(itens.length)], ['Total', money(detail.total)]].map(([label, value]) => <div key={label} className="rounded-[8px] border border-border-1 bg-bg-surface-2 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className="mt-1 font-mono text-sm font-black text-fg-1">{value}</p></div>)}
        </section>
        <div className="mt-5 grid gap-3 text-xs text-fg-2 sm:grid-cols-2"><p><strong className="text-fg-1">Sentido:</strong> {recibo.sentido === 'CREDITO' ? 'Crédito' : 'Débito'}</p><p><strong className="text-fg-1">Forma:</strong> {recibo.forma_pagamento.replaceAll('_', ' ')}</p><p><strong className="text-fg-1">Referência:</strong> {recibo.comprovante_referencia ?? '—'}</p><p><strong className="text-fg-1">Emitido em:</strong> {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(recibo.emitido_em))}</p></div>
        {recibo.status === 'CANCELADO' && <div className="mt-5 rounded-[8px] border border-signal-warning/30 bg-signal-warning/8 px-4 py-3 text-xs text-fg-2"><strong className="font-black text-signal-warning">Recibo cancelado.</strong> {recibo.motivo_cancelamento}</div>}
        <div className="mt-5 overflow-x-auto rounded-[8px] border border-border-1"><table className="w-full min-w-[720px] text-left"><thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3"><tr><th className="px-4 py-3">Repasse / documento</th><th className="px-3 py-3">Segurado</th><th className="px-3 py-3">Seguradora / ramo</th><th className="px-4 py-3 text-right">Valor pago</th></tr></thead><tbody className="divide-y divide-border-1">{itens.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-mono text-xs font-black text-fg-1">#{item.numero_repasse_snapshot ?? '—'}</p><p className="mt-0.5 text-[11px] text-fg-3">{item.documento_referencia_snapshot}</p></td><td className="px-3 py-3 text-sm font-bold text-fg-1">{item.segurado_nome_snapshot}</td><td className="px-3 py-3"><p className="text-sm font-bold text-fg-1">{item.seguradora_nome_snapshot}</p><p className="text-[11px] text-fg-3">{item.ramo_nome_snapshot}</p></td><td className="px-4 py-3 text-right font-mono text-sm font-black text-fg-1">{money(item.valor_pago_snapshot)}</td></tr>)}</tbody></table></div>
      </>}
    </div>
  </AppModal>
}
