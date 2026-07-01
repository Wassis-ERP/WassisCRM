import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react'
import {
  FeedbackContext,
  type ConfirmOptions,
  type FeedbackTone,
  type NotifyOptions,
} from './systemFeedbackContext'

interface Toast extends NotifyOptions {
  id: number
}

interface ConfirmState extends Required<Pick<ConfirmOptions, 'confirmLabel' | 'cancelLabel' | 'tone'>> {
  title: string
  description?: string
}

const toneClass: Record<FeedbackTone, { icon: string; panel: string; button: string }> = {
  info: {
    icon: 'bg-accent-primary-soft text-accent-primary',
    panel: 'border-accent-primary/20 bg-accent-primary-soft text-accent-primary',
    button: 'bg-accent-primary text-fg-on-brand hover:bg-accent-primary-hover shadow-[var(--shadow-brand)]',
  },
  success: {
    icon: 'bg-signal-success/15 text-signal-success',
    panel: 'border-signal-success/20 bg-signal-success/10 text-signal-success',
    button: 'bg-signal-success text-white hover:brightness-95',
  },
  warning: {
    icon: 'bg-signal-warning/15 text-signal-warning',
    panel: 'border-signal-warning/30 bg-signal-warning/10 text-signal-warning',
    button: 'bg-signal-warning text-white hover:brightness-95',
  },
  danger: {
    icon: 'bg-signal-danger/15 text-signal-danger',
    panel: 'border-signal-danger/30 bg-signal-danger/10 text-signal-danger',
    button: 'bg-signal-danger text-white hover:brightness-95',
  },
}

function ToneIcon({ tone, size = 18 }: { tone: FeedbackTone; size?: number }) {
  if (tone === 'success') return <CheckCircle2 size={size} />
  if (tone === 'info') return <Info size={size} />
  return <AlertTriangle size={size} />
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const resolverRef = useRef<((value: boolean) => void) | null>(null)
  const toastIdRef = useRef(1)

  const closeConfirm = useCallback((value: boolean) => {
    if (!resolverRef.current) return
    setIsResolving(true)
    resolverRef.current(value)
    resolverRef.current = null
    setConfirmState(null)
    setIsResolving(false)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    if (resolverRef.current) resolverRef.current(false)

    setConfirmState({
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel ?? 'Confirmar',
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      tone: options.tone ?? 'warning',
    })

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const notify = useCallback((options: NotifyOptions) => {
    const id = toastIdRef.current
    toastIdRef.current += 1
    setToasts((current) => [...current, { id, tone: options.tone ?? 'info', ...options }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 5200)
  }, [])

  useEffect(() => {
    if (!confirmState) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeConfirm(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeConfirm, confirmState])

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify])

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {confirmState && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => closeConfirm(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[12px] border border-border-1 bg-bg-surface shadow-[var(--shadow-3)] animate-in zoom-in-95 duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4 px-6 py-5">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] ${toneClass[confirmState.tone].icon}`}>
                <ToneIcon tone={confirmState.tone} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black uppercase tracking-tight text-fg-1">{confirmState.title}</h2>
                {confirmState.description && (
                  <p className="mt-2 text-sm leading-relaxed text-fg-3">{confirmState.description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border-1 bg-bg-surface-2 px-6 py-5">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                disabled={isResolving}
                className="rounded-[6px] px-5 py-2.5 text-sm font-bold text-fg-3 transition-all hover:bg-bg-surface-3 hover:text-fg-1 disabled:opacity-50"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                disabled={isResolving}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-black transition-all disabled:opacity-50 ${toneClass[confirmState.tone].button}`}
              >
                {isResolving && <Loader2 size={16} className="animate-spin" />}
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-4 top-4 z-[130] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const tone = toast.tone ?? 'info'
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-[8px] border px-4 py-3 shadow-[var(--shadow-2)] backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200 ${toneClass[tone].panel}`}
            >
              <ToneIcon tone={tone} size={18} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-fg-1">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-xs font-semibold text-fg-3">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="rounded-[6px] p-1 text-fg-4 transition-colors hover:bg-bg-surface-3 hover:text-fg-2"
                aria-label="Fechar aviso"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </FeedbackContext.Provider>
  )
}
