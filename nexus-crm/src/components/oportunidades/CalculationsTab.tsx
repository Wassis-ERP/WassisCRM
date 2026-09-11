import { ArrowRight, Calculator, CalendarRange, CopyPlus, Layers3, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCalculations } from '../../hooks/useCalculos'
import type { OpportunityDetail } from '../../hooks/useOportunidades'
import { fmtDate } from '../../utils/date'
import CommercialPresentationTray from './CommercialPresentationTray'

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export default function CalculationsTab({ opportunity, canCreate }: { opportunity: OpportunityDetail; canCreate: boolean }) {
  const navigate = useNavigate()
  const query = useCalculations(opportunity.id)
  const openNew = (sourceId?: string) => {
    const suffix = sourceId ? `?from=${encodeURIComponent(sourceId)}` : ''
    navigate(`/oportunidades/${opportunity.id}/calculos/novo${suffix}`)
  }

  if (query.isLoading) return <CalculationsSkeleton />
  if (query.isError) {
    return (
      <div className="rounded-[8px] border border-signal-danger/25 bg-signal-danger/10 p-5">
        <p className="text-sm font-black text-fg-1">Não foi possível carregar os cálculos.</p>
        <p className="mt-1 text-xs text-fg-3">Tente novamente sem sair da oportunidade.</p>
        <button type="button" onClick={() => void query.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-signal-danger/30 px-4 py-2 text-xs font-black text-signal-danger hover:bg-signal-danger/10">
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    )
  }

  if (!opportunity.ramo_id || !opportunity.ramos?.forma_calculo) {
    return (
      <div className="rounded-[8px] border border-signal-warning/30 bg-signal-warning/10 p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-signal-warning" />
          <div>
            <h2 className="text-sm font-black text-fg-1">Defina o ramo antes de calcular</h2>
            <p className="mt-1 max-w-2xl text-sm text-fg-3">A forma do questionário e o catálogo de coberturas dependem do ramo registrado na Visão geral.</p>
          </div>
        </div>
      </div>
    )
  }

  const calculations = query.data ?? []
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-border-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Calculator size={18} className="text-accent-primary" /><h2 className="text-base font-black text-fg-1">Versões de cálculo</h2></div>
          <p className="mt-1 text-sm text-fg-3">Cada versão preserva cotado, risco, vigência, comissão e coberturas próprios.</p>
        </div>
        {canCreate && (
          <button type="button" onClick={() => openNew()} className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover">
            <Plus size={15} /> Novo cálculo
          </button>
        )}
      </div>

      {calculations.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-[8px] border border-dashed border-border-2 bg-bg-surface-2 px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-accent-primary-soft text-accent-primary"><Layers3 size={21} /></span>
          <h3 className="mt-4 text-sm font-black text-fg-1">Nenhuma versão criada</h3>
          <p className="mt-1 max-w-md text-sm text-fg-3">Crie o primeiro cálculo manual para registrar o perfil de risco e as coberturas desta tentativa comercial.</p>
          {canCreate && <button type="button" onClick={() => openNew()} className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 px-4 py-2 text-xs font-black text-accent-primary hover:bg-accent-primary-soft"><Plus size={14} /> Criar primeiro cálculo</button>}
        </div>
      ) : (
        <div className="divide-y divide-border-1 overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
          {calculations.map((calculation) => (
            <article key={calculation.id} className="p-4 transition-colors hover:bg-bg-surface-2 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-black text-fg-1">{calculation.versionLabel}</h3>
                    <span className="rounded-full bg-bg-surface-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-fg-3">{calculation.origin ?? 'Origem não informada'}</span>
                    <span className="rounded-full bg-accent-primary-soft px-2.5 py-1 text-[10px] font-black text-accent-primary">{calculation.lineName}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-fg-2">{calculation.insuredName} · {calculation.riskSummary}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-3">
                    <span className="inline-flex items-center gap-1.5"><CalendarRange size={13} /> {fmtDate(calculation.validityStart)} a {fmtDate(calculation.validityEnd)}</span>
                    <span>{calculation.coverageCount} {calculation.coverageCount === 1 ? 'cobertura' : 'coberturas'}</span>
                    <span>Comissão sugerida: {calculation.suggestedCommission === null ? '—' : `${percent.format(calculation.suggestedCommission)}%`}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canCreate && <button type="button" onClick={() => openNew(calculation.id)} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-3.5 py-2 text-xs font-black text-fg-2 hover:border-accent-primary/30 hover:bg-accent-primary-soft hover:text-accent-primary"><CopyPlus size={14} /> Criar nova versão</button>}
                  <button type="button" onClick={() => navigate(`/oportunidades/${opportunity.id}/calculos/${calculation.id}`)} className="inline-flex items-center gap-2 rounded-full bg-bg-surface-3 px-3.5 py-2 text-xs font-black text-fg-1 hover:bg-accent-primary-soft hover:text-accent-primary">Abrir <ArrowRight size={14} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <CommercialPresentationTray opportunityId={opportunity.id} />
    </div>
  )
}

function CalculationsSkeleton() {
  return <div className="space-y-3" aria-label="Carregando cálculos">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[8px] bg-bg-surface-2" />)}</div>
}
