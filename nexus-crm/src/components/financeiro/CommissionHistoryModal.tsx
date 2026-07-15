import { useState } from 'react'
import { History, RotateCcw, ShieldCheck } from 'lucide-react'
import AppModal from '../modals/AppModal'
import type { ComissaoHistoricoItem, FinanceiroComissao } from '../../modules/financeiro/comissoesDomain'

interface CommissionHistoryModalProps {
  row: FinanceiroComissao
  isSaving: boolean
  onClose: () => void
  onReverse: (event: ComissaoHistoricoItem, justification: string) => void
}
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))

export default function CommissionHistoryModal({ row, isSaving, onClose, onReverse }: CommissionHistoryModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<ComissaoHistoricoItem | null>(null)
  const [justification, setJustification] = useState('')

  const footer = selectedEvent ? <>
    <button type="button" disabled={isSaving} onClick={() => { setSelectedEvent(null); setJustification('') }} className="mr-auto rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40">Voltar ao histórico</button>
    <button type="button" disabled={isSaving} onClick={onClose} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-black text-fg-2 hover:bg-bg-surface-3 disabled:opacity-40">Cancelar</button>
    <button type="button" disabled={isSaving || justification.trim().length < 5} onClick={() => onReverse(selectedEvent, justification)} className="inline-flex items-center gap-2 rounded-full bg-signal-warning px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"><RotateCcw size={15} />{isSaving ? 'Estornando…' : 'Confirmar estorno'}</button>
  </> : <button type="button" onClick={onClose} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Fechar</button>

  return <AppModal isOpen onClose={onClose} isDismissDisabled={isSaving} title="Histórico da comissão" description={`${row.seguradoNome} · ${row.documentoReferencia}`} icon={<History size={18} />} size="lg" footer={footer}>
    <div className="max-h-[65vh] overflow-y-auto px-8 py-6">
      {selectedEvent ? <div className="space-y-5">
        <div className="rounded-[8px] border border-signal-warning/30 bg-signal-warning/8 p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-signal-warning">Evento que será compensado</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-black text-fg-1">Baixa de {date(selectedEvent.data_efetiva)}</p><p className="mt-0.5 text-xs text-fg-3">{selectedEvent.conciliacoes} conciliação(ões) · {selectedEvent.autorNome}</p></div><p className="font-mono text-lg font-black text-fg-1">{money(selectedEvent.valorAtivo)}</p></div>
        </div>
        <label className="space-y-1.5"><span className="block text-[9px] font-black uppercase tracking-wider text-fg-3">Justificativa obrigatória</span><textarea autoFocus value={justification} onChange={(event) => setJustification(event.target.value)} rows={4} placeholder="Descreva o motivo da correção; o evento original será preservado" className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20" /></label>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-fg-3"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-signal-success" />O estorno cria um novo evento compensatório. A baixa original e suas conciliações permanecem no histórico.</p>
      </div> : <>
        <section className="grid gap-3 sm:grid-cols-4">
          {[['Previsto', row.valor_previsto ?? 0], ['Informado', row.valorInformadoBruto], ['Baixado', row.valorBaixado], ['Saldo', row.saldo]].map(([label, value]) => <div key={String(label)} className="rounded-[8px] border border-border-1 bg-bg-surface-2 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{label}</p><p className="mt-1 font-mono text-sm font-black text-fg-1">{money(Number(value))}</p></div>)}
        </section>
        {row.historico.length === 0 ? <div className="py-14 text-center"><History className="mx-auto text-fg-4" size={28} /><h3 className="mt-3 text-base font-black text-fg-1">Nenhuma baixa registrada</h3><p className="mt-1 text-sm text-fg-3">Conciliações existentes continuam separadas do histórico de recebimento.</p></div> : <div className="mt-5 overflow-hidden rounded-[8px] border border-border-1">
          {row.historico.map((event) => <article key={event.id} className="border-b border-border-1 p-4 last:border-b-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${event.tipo === 'BAIXA' ? 'bg-signal-success/12 text-signal-success' : 'bg-signal-warning/12 text-signal-warning'}`}>{event.tipo === 'BAIXA' ? 'Baixa' : 'Estorno'}</span><span className="text-xs font-bold text-fg-3">{date(event.data_efetiva)}</span></div><p className="mt-2 text-xs text-fg-3">{event.motivo_tipo.replaceAll('_', ' ')} · {event.origem_tipo.toLowerCase()} · {event.autorNome}</p>{event.justificativa && <p className="mt-1 max-w-[65ch] text-xs leading-relaxed text-fg-2">{event.justificativa}</p>}</div>
              <div className="text-right"><p className={`font-mono text-base font-black ${event.tipo === 'ESTORNO' ? 'text-signal-warning' : 'text-fg-1'}`}>{money(event.valor_efetivo)}</p><p className="mt-0.5 text-[10px] text-fg-3">saldo após {money(event.saldo_apos)}</p></div>
            </div>
            {event.tipo === 'BAIXA' && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-1 pt-3"><span className="text-[11px] font-bold text-fg-3">Valor ainda ativo: {money(event.valorAtivo)}</span><button type="button" disabled={!event.podeEstornar || isSaving} title={event.bloqueioEstorno ?? undefined} onClick={() => setSelectedEvent(event)} className="inline-flex items-center gap-1.5 rounded-[6px] border border-border-1 px-3 py-1.5 text-[11px] font-black text-signal-warning hover:bg-signal-warning/8 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={12} />Estornar</button></div>}
          </article>)}
        </div>}
      </>}
    </div>
  </AppModal>
}
