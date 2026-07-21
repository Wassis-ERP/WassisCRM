import { useMemo, useState } from 'react'
import { CalendarCheck2 } from 'lucide-react'
import AppModal from '../modals/AppModal'
import type { FinanceiroParcela } from '../../modules/financeiro/parcelasDomain'

interface PaymentModalProps {
  rows: FinanceiroParcela[]
  isSaving: boolean
  onClose: () => void
  onConfirm: (dataPagamento: string, valorPago?: number) => void
}

const todayLocal = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format(value)

function parseMoney(value: string): number | undefined {
  if (!value.trim()) return undefined
  const normalized = value.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default function PaymentModal({ rows, isSaving, onClose, onConfirm }: PaymentModalProps) {
  const [date, setDate] = useState(todayLocal)
  const single = rows.length === 1
  const expected = useMemo(() => rows.reduce((total, row) => total + (row.valor ?? row.valor_liquido ?? 0), 0), [rows])
  const [value, setValue] = useState(() => {
    const expectedValue = rows[0]?.valor ?? rows[0]?.valor_liquido
    return single && expectedValue !== null && expectedValue !== undefined
      ? expectedValue.toFixed(2).replace('.', ',')
      : ''
  })
  const parsed = parseMoney(value)
  const canSubmit = Boolean(date) && (!single || (parsed !== undefined && parsed > 0)) && !isSaving

  return (
    <AppModal
      isOpen
      onClose={onClose}
      isDismissDisabled={isSaving}
      title={single ? 'Confirmar pagamento' : `Confirmar ${rows.length} pagamentos`}
      description={single
        ? 'A baixa registra o valor efetivo sem alterar o valor previsto.'
        : 'O lote usa uma data comum e o valor previsto de cada parcela.'}
      icon={<CalendarCheck2 size={18} />}
      footer={<>
        <button type="button" onClick={onClose} disabled={isSaving} className="rounded-[6px] px-5 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-3 disabled:opacity-50">Cancelar</button>
        <button type="button" onClick={() => onConfirm(date, single ? parsed : undefined)} disabled={!canSubmit} className="rounded-full bg-accent-primary px-6 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-50">
          {isSaving ? 'Confirmando...' : 'Confirmar pagamento'}
        </button>
      </>}
    >
      <div className="space-y-5 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-wider text-fg-3">Data do pagamento</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-bold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20" />
          </label>
          {single ? (
            <label className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-wider text-fg-3">Valor efetivamente pago</span>
              <input type="text" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 font-mono text-sm font-bold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20" />
            </label>
          ) : (
            <div className="rounded-[8px] bg-bg-surface-2 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-fg-3">Total previsto do lote</p>
              <p className="mt-1 font-mono text-base font-black text-fg-1">{formatMoney(expected)}</p>
            </div>
          )}
        </div>
        <div className="max-h-48 overflow-auto rounded-[8px] border border-border-1">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-4 border-b border-border-1 px-4 py-3 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-fg-1">{row.seguradoNome}</p>
                <p className="mt-0.5 text-xs text-fg-3">{row.documentoReferencia} · Parcela {row.numero ?? '—'}</p>
              </div>
              <span className="shrink-0 font-mono text-sm font-black text-fg-1">{formatMoney(row.valor ?? row.valor_liquido ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </AppModal>
  )
}
