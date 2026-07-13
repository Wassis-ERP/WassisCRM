import { useMemo, useState } from 'react'
import { Calculator, Copy, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { RecebimentoGradeParcelaRow, RecebimentoGradeRow } from '../../hooks/useLookupsAdmin'
import { simulateReceiptGrade, validateReceiptGrade } from '../../lib/receiptGradeDomain'
import { fmtDate, fmtMoney } from '../propostas/propostaFormat'

type Props = {
  grade: RecebimentoGradeRow
  events: RecebimentoGradeParcelaRow[]
  catalog: RecebimentoGradeRow[]
  duplicating: boolean
  onDuplicate: () => void
}

const originLabel = {
  GRADE: 'Definido na grade',
  PROPOSTA_COMISSAO: '% comissão da proposta',
  PROPOSTA_AGENCIAMENTO: '% agenciamento da proposta',
} as const

export function ReceiptGradeInspector({ grade, events, catalog, duplicating, onDuplicate }: Props) {
  const [totalPremium, setTotalPremium] = useState('1000')
  const [netPremium, setNetPremium] = useState('900')
  const [commissionPct, setCommissionPct] = useState('20')
  const [agencyCommissionPct, setAgencyCommissionPct] = useState('300')
  const [installmentCount, setInstallmentCount] = useState('10')
  const [firstDueDate, setFirstDueDate] = useState('2026-07-10')
  const validation = useMemo(() => validateReceiptGrade(grade, events, catalog), [catalog, events, grade])
  const simulation = useMemo(() => validation.applicable ? simulateReceiptGrade(grade, events, {
    totalPremium: Number(totalPremium) || 0,
    netPremium: Number(netPremium) || 0,
    commissionPct: Number(commissionPct) || 0,
    agencyCommissionPct: Number(agencyCommissionPct) || 0,
    installmentCount: Math.max(1, Number(installmentCount) || 1),
    firstDueDate,
  }) : [], [agencyCommissionPct, commissionPct, events, firstDueDate, grade, installmentCount, netPremium, totalPremium, validation.applicable])
  const total = simulation.reduce((sum, event) => sum + event.expectedValue, 0)

  return <div className="border-t border-border-1 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <span className={`rounded-[6px] p-2 ${validation.applicable ? 'bg-signal-success/15 text-signal-success' : 'bg-signal-warning/15 text-signal-warning'}`}>
          {validation.applicable ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        </span>
        <div>
          <h4 className="text-sm font-black text-fg-1">{validation.applicable ? 'Grade aplicável' : 'Grade ainda não aplicável'}</h4>
          <p className="mt-0.5 text-xs font-semibold text-fg-3">
            {validation.applicable ? 'O molde pode ser selecionado na geração das agendas.' : `${validation.issues.length} ajuste(s) impedem novas materializações.`}
          </p>
        </div>
      </div>
      <button type="button" onClick={onDuplicate} disabled={duplicating} className="inline-flex items-center gap-2 rounded-[6px] border border-border-1 px-3 py-2 text-xs font-black text-fg-2 transition-colors hover:border-accent-primary/40 hover:text-accent-primary disabled:opacity-50">
        <Copy size={14} /> {duplicating ? 'Duplicando...' : 'Duplicar grade'}
      </button>
    </div>

    {!validation.applicable && <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {validation.issues.map((issue, index) => <li key={`${issue.code}-${issue.eventId ?? index}`} className="rounded-[6px] bg-signal-warning/10 px-3 py-2 text-xs font-semibold text-signal-warning">{issue.message}</li>)}
    </ul>}

    <div className="mt-5 flex items-center gap-2">
      <Calculator size={16} className="text-accent-primary" />
      <div><h4 className="text-sm font-black text-fg-1">Simular recebimento</h4><p className="text-xs font-semibold text-fg-3">Prévia sem persistir parcelas, comissões ou repasses.</p></div>
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Field label="Prêmio total" type="number" value={totalPremium} onChange={setTotalPremium} />
      <Field label="Prêmio líquido" type="number" value={netPremium} onChange={setNetPremium} />
      <Field label="Comissão (%)" type="number" value={commissionPct} onChange={setCommissionPct} />
      <Field label="Agenciamento (%)" type="number" value={agencyCommissionPct} onChange={setAgencyCommissionPct} />
      <Field label="Parcelas segurado" type="number" value={installmentCount} onChange={setInstallmentCount} />
      <Field label="Primeiro vencimento" type="date" value={firstDueDate} onChange={setFirstDueDate} />
    </div>

    {validation.applicable && <div className="mt-4 overflow-x-auto rounded-[6px] border border-border-1">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-bg-surface-2 text-fg-3"><tr><Header>Evento</Header><Header>Tipo</Header><Header>Percentual</Header><Header>Origem</Header><Header>Base</Header><Header>Previsão</Header><Header>Valor</Header></tr></thead>
        <tbody>{simulation.map((event) => <tr key={event.number} className="border-t border-border-1">
          <Cell mono>{event.number}</Cell><Cell>{event.commissionType}</Cell><Cell mono>{event.percentage}%</Cell><Cell>{originLabel[event.percentageOrigin]}</Cell><Cell mono>{fmtMoney(event.calculationBase)}</Cell><Cell mono>{fmtDate(event.expectedDate)}</Cell><Cell mono>{fmtMoney(event.expectedValue)}</Cell>
        </tr>)}</tbody>
        <tfoot><tr className="border-t border-border-1 bg-bg-surface-2"><td colSpan={6} className="px-3 py-2 text-right font-black text-fg-2">Receita prevista</td><td className="px-3 py-2 font-mono font-black text-fg-1">{fmtMoney(total)}</td></tr></tfoot>
      </table>
    </div>}
  </div>
}

function Field({ label, value, type, onChange }: { label: string; value: string; type: 'number' | 'date'; onChange: (value: string) => void }) {
  return <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-widest text-fg-4">{label}</span><input type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30" /></label>
}
function Header({ children }: { children: string }) { return <th className="px-3 py-2 font-black">{children}</th> }
function Cell({ children, mono }: { children: React.ReactNode; mono?: boolean }) { return <td className={`${mono ? 'font-mono' : ''} px-3 py-2.5 font-semibold text-fg-2`}>{children}</td> }
