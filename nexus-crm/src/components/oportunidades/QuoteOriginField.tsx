import { getTable } from '../../lib/inMemoryDb'
import { getQuoteProposalOrigin } from '../../modules/comercial/quoteProposalOrigin'
import { presentationMoney } from '../../modules/comercial/commercialPresentationFormat'

export default function QuoteOriginField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const options = getTable('cotacoes').flatMap((row) => {
    if (typeof row.id !== 'string') return []
    try {
      const origin = getQuoteProposalOrigin(row.id)
      if (origin.proposal && row.id !== value) return []
      if (!['APRESENTADA', 'APROVADA'].includes(origin.quote.status ?? '') && row.id !== value) return []
      const insurer = getTable('seguradoras').find((insurer) => insurer.id === origin.execution.seguradora_id)
      return [{ id: row.id, label: `${origin.opportunity.titulo} · ${String(insurer?.nome ?? 'Seguradora')} · ${presentationMoney(origin.quote.premio_total)}` }]
    } catch { return [] }
  })
  return <label className="mb-5 block rounded-[8px] border border-border-1 bg-bg-surface-2 p-4">
    <span className="block text-sm font-bold text-fg-1">Cotação de origem</span>
    <span className="mt-1 block text-xs text-fg-3">Opcional. Vincule o resultado do multicalculo para preservar a origem comercial da proposta.</span>
    <select aria-label="Cotação de origem" value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1">
      <option value="">Sem cotação de origem</option>
      {value && !options.some((option) => option.id === value) && <option value={value}>Cotação indisponível — selecione novamente</option>}
      {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
  </label>
}
