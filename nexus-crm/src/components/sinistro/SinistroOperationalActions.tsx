import {
  Ban,
  CheckCircle2,
  CircleDollarSign,
  RotateCcw,
  ShieldX,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import type { SinistroDetalhe } from '../../hooks/useSinistros'
import {
  getSinistroOperationalActions,
  type SinistroOperationalAction,
  type SinistroOperationalInput,
} from '../../modules/sinistro/closure'

type Props = {
  sinistro: SinistroDetalhe
  isSaving: boolean
  onExecute: (input: SinistroOperationalInput) => Promise<boolean>
  onActiveChange: (active: boolean) => void
}

type Draft = {
  data_documentacao_completa: string
  data_liquidacao_financeira: string
  data_conclusao: string
  valor_indenizado: string
  valor_despesas_regulacao: string
  valor_salvado: string
  data_salvado: string
  valor_ressarcimento: string
  data_ressarcimento: string
  negativa_motivo: string
}

type ActionView = {
  label: string
  description: string
  icon: LucideIcon
  buttonClass: string
}

const ACTION_VIEW: Record<SinistroOperationalAction, ActionView> = {
  CONCLUIR_SEM_INDENIZACAO: {
    label: 'Concluir sem indenização',
    description: 'Encerra o processo sem pagamento de indenização.',
    icon: CheckCircle2,
    buttonClass: 'border-border-1 bg-bg-surface text-fg-2 hover:bg-bg-surface-2',
  },
  CONCLUIR_COM_INDENIZACAO: {
    label: 'Concluir com indenização',
    description: 'Registra documentação, liquidação e valor indenizado.',
    icon: CircleDollarSign,
    buttonClass: 'border-signal-success/30 bg-signal-success/10 text-signal-success hover:bg-signal-success/15',
  },
  NEGAR: {
    label: 'Registrar negativa',
    description: 'Encerra sem indenização e exige o motivo da negativa.',
    icon: ShieldX,
    buttonClass: 'border-signal-warning/30 bg-signal-warning/10 text-signal-warning hover:bg-signal-warning/15',
  },
  CANCELAR: {
    label: 'Cancelar Sinistro',
    description: 'Cancela o processo preservando todos os dados já registrados.',
    icon: Ban,
    buttonClass: 'border-signal-danger/30 bg-signal-danger/10 text-signal-danger hover:bg-signal-danger/15',
  },
  REABRIR: {
    label: 'Reabrir Sinistro',
    description: 'Retoma a operação sem apagar datas, valores ou histórico anteriores.',
    icon: RotateCcw,
    buttonClass: 'border-signal-warning/30 bg-signal-warning/10 text-signal-warning hover:bg-signal-warning/15',
  },
}

const inputClass = 'mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 disabled:bg-bg-surface-2 disabled:text-fg-4'

function localToday(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function draftFromSinistro(sinistro: SinistroDetalhe): Draft {
  return {
    data_documentacao_completa: sinistro.data_documentacao_completa ?? '',
    data_liquidacao_financeira: sinistro.data_liquidacao_financeira ?? '',
    data_conclusao: localToday(),
    valor_indenizado: sinistro.valor_indenizado == null ? '' : String(sinistro.valor_indenizado),
    valor_despesas_regulacao: sinistro.valor_despesas_regulacao == null ? '' : String(sinistro.valor_despesas_regulacao),
    valor_salvado: sinistro.valor_salvado == null ? '' : String(sinistro.valor_salvado),
    data_salvado: sinistro.data_salvado ?? '',
    valor_ressarcimento: sinistro.valor_ressarcimento == null ? '' : String(sinistro.valor_ressarcimento),
    data_ressarcimento: sinistro.data_ressarcimento ?? '',
    negativa_motivo: '',
  }
}

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-bold text-fg-3">{label}{children}</label>
}

export default function SinistroOperationalActions({
  sinistro,
  isSaving,
  onExecute,
  onActiveChange,
}: Props) {
  const [selected, setSelected] = useState<SinistroOperationalAction | null>(null)
  const [draft, setDraft] = useState<Draft>(() => draftFromSinistro(sinistro))
  const actions = getSinistroOperationalActions(sinistro.status)

  const choose = async (action: SinistroOperationalAction) => {
    if (action === 'REABRIR') {
      await onExecute({ sinistroId: sinistro.id, action })
      return
    }
    setDraft(draftFromSinistro(sinistro))
    setSelected(action)
    onActiveChange(true)
  }

  const update = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const submit = async () => {
    if (!selected) return
    const hasFinalValues = selected !== 'CANCELAR'
    const hasIndemnity = selected === 'CONCLUIR_COM_INDENIZACAO'
    const success = await onExecute({
      sinistroId: sinistro.id,
      action: selected,
      data_documentacao_completa: hasFinalValues ? draft.data_documentacao_completa || null : undefined,
      data_liquidacao_financeira: hasIndemnity ? draft.data_liquidacao_financeira || null : null,
      data_conclusao: draft.data_conclusao || null,
      valor_indenizado: hasIndemnity ? numberOrNull(draft.valor_indenizado) : null,
      valor_despesas_regulacao: hasFinalValues ? numberOrNull(draft.valor_despesas_regulacao) : undefined,
      valor_salvado: hasFinalValues ? numberOrNull(draft.valor_salvado) : undefined,
      data_salvado: hasFinalValues ? draft.data_salvado || null : undefined,
      valor_ressarcimento: hasFinalValues ? numberOrNull(draft.valor_ressarcimento) : undefined,
      data_ressarcimento: hasFinalValues ? draft.data_ressarcimento || null : undefined,
      negativa_motivo: selected === 'NEGAR' ? draft.negativa_motivo || null : null,
    })
    if (success) {
      setSelected(null)
      onActiveChange(false)
    }
  }

  if (actions.length === 0) return null

  const selectedView = selected ? ACTION_VIEW[selected] : null
  const showFinalValues = selected != null && selected !== 'CANCELAR'
  const showIndemnity = selected === 'CONCLUIR_COM_INDENIZACAO'

  return (
    <section className="mb-6 rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]" aria-labelledby="sinistro-operacoes-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[68ch]">
          <h2 id="sinistro-operacoes-title" className="text-base font-bold text-fg-1">Comandos operacionais</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-fg-3">
            O status muda somente por estas ações. A apólice e a etapa do Kanban permanecem inalteradas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const view = ACTION_VIEW[action]
            const Icon = view.icon
            return (
              <button
                key={action}
                type="button"
                onClick={() => void choose(action)}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 disabled:opacity-50 ${view.buttonClass}`}
                title={view.description}
              >
                <Icon size={14} /> {view.label}
              </button>
            )
          })}
        </div>
      </div>

      {selected && selectedView && (
        <div className="mt-5 border-t border-border-1 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-fg-1">{selectedView.label}</h3>
              <p className="mt-1 text-xs font-semibold text-fg-3">{selectedView.description}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null)
                onActiveChange(false)
              }}
              disabled={isSaving}
              className="rounded-[6px] p-1.5 text-fg-4 hover:bg-bg-surface-2 hover:text-fg-2 disabled:opacity-50"
              aria-label="Fechar comando operacional"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {showFinalValues && (
              <Field label={showIndemnity ? 'Documentação completa *' : 'Documentação completa'}>
                <input type="date" value={draft.data_documentacao_completa} onInput={(event) => update('data_documentacao_completa', event.currentTarget.value)} className={inputClass} />
              </Field>
            )}
            {showIndemnity && (
              <Field label="Liquidação financeira *">
                <input type="date" value={draft.data_liquidacao_financeira} onInput={(event) => update('data_liquidacao_financeira', event.currentTarget.value)} className={inputClass} />
              </Field>
            )}
            <Field label="Data de conclusão *">
              <input type="date" value={draft.data_conclusao} onInput={(event) => update('data_conclusao', event.currentTarget.value)} className={inputClass} />
            </Field>
            {showIndemnity && (
              <Field label="Valor indenizado *">
                <input inputMode="decimal" value={draft.valor_indenizado} onChange={(event) => update('valor_indenizado', event.target.value)} className={inputClass} placeholder="0,00" />
              </Field>
            )}
            {showFinalValues && (
              <>
                <Field label="Despesas de regulação">
                  <input inputMode="decimal" value={draft.valor_despesas_regulacao} onChange={(event) => update('valor_despesas_regulacao', event.target.value)} className={inputClass} placeholder="0,00" />
                </Field>
                <Field label="Valor do salvado">
                  <input inputMode="decimal" value={draft.valor_salvado} onChange={(event) => update('valor_salvado', event.target.value)} className={inputClass} placeholder="0,00" />
                </Field>
                <Field label="Data do salvado">
                  <input type="date" value={draft.data_salvado} onInput={(event) => update('data_salvado', event.currentTarget.value)} className={inputClass} />
                </Field>
                <Field label="Valor do ressarcimento">
                  <input inputMode="decimal" value={draft.valor_ressarcimento} onChange={(event) => update('valor_ressarcimento', event.target.value)} className={inputClass} placeholder="0,00" />
                </Field>
                <Field label="Data do ressarcimento">
                  <input type="date" value={draft.data_ressarcimento} onInput={(event) => update('data_ressarcimento', event.currentTarget.value)} className={inputClass} />
                </Field>
              </>
            )}
            {selected === 'NEGAR' && (
              <label className="text-xs font-bold text-fg-3 sm:col-span-2 lg:col-span-3">
                Motivo da negativa *
                <textarea rows={2} value={draft.negativa_motivo} onChange={(event) => update('negativa_motivo', event.target.value)} className={inputClass} />
              </label>
            )}
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => {
              setSelected(null)
              onActiveChange(false)
            }} disabled={isSaving} className="rounded-full border border-border-1 px-4 py-2 text-xs font-bold text-fg-3 hover:bg-bg-surface-2 disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={() => void submit()} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-bold text-fg-on-brand hover:bg-accent-primary-hover disabled:opacity-50">
              <selectedView.icon size={14} /> {isSaving ? 'Salvando…' : selectedView.label}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
