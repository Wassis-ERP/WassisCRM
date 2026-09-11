import { ArrowRight, FileChartColumnIncreasing, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  useCommercialPresentationWorkspace,
  useToggleCommercialPresentationQuote,
} from '../../hooks/useCommercialPresentation'
import { useSystemFeedback } from '../feedback/systemFeedbackContext'
import { MAX_PRESENTATION_QUOTES } from '../../modules/comercial/commercialPresentationDomain'

export default function CommercialPresentationTray({ opportunityId }: { opportunityId: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const workspace = useCommercialPresentationWorkspace(opportunityId)
  const toggle = useToggleCommercialPresentationQuote()
  const { notify } = useSystemFeedback()
  const items = workspace.data?.items ?? []

  if (items.length === 0) return null

  const remove = async (quoteId: string) => {
    try {
      await toggle.mutateAsync({ opportunityId, quoteId, createdById: user?.id ?? null })
      notify({ title: 'Cotação removida', description: 'A bandeja do comparativo foi atualizada.', tone: 'success' })
    } catch (cause) {
      notify({
        title: 'Não foi possível remover',
        description: cause instanceof Error ? cause.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  return (
    <aside className="sticky bottom-4 z-20 mt-4 rounded-[8px] bg-neutral-950 px-4 py-3 text-white shadow-[var(--shadow-3)] dark:bg-neutral-900" aria-label="Bandeja do comparativo">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-white/10 text-white">
            <FileChartColumnIncreasing size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black">Comparativo · {items.length} de {MAX_PRESENTATION_QUOTES} {items.length === 1 ? 'produto' : 'produtos'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {items.map(({ item, candidate }) => (
                <span key={item.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/10 py-1 pl-2.5 pr-1 text-[11px] font-bold text-white/90">
                  <span className="truncate">{candidate.insurerShortName} · {candidate.profileLabel}</span>
                  <button
                    type="button"
                    disabled={toggle.isPending}
                    onClick={() => void remove(item.cotacao_id)}
                    className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    aria-label={`Remover ${candidate.insurerName} do comparativo`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/oportunidades/${opportunityId}/apresentacao`)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-neutral-950 hover:bg-neutral-100"
        >
          Comparar e apresentar <ArrowRight size={14} />
        </button>
      </div>
    </aside>
  )
}
