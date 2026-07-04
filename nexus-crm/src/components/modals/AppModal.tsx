import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type AppModalSize = 'sm' | 'md' | 'lg'

interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: AppModalSize
  isDismissDisabled?: boolean
}

const sizeClass: Record<AppModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
}

export default function AppModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  isDismissDisabled = false,
}: AppModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const timerId = window.setTimeout(() => dialogRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(timerId)
      previousFocus?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || isDismissDisabled) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDismissDisabled, isOpen, onClose])

  if (!isOpen) return null

  const handleBackdrop = () => {
    if (!isDismissDisabled) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`bg-bg-surface w-full ${sizeClass[size]} rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-border-1 flex items-start justify-between gap-4 bg-bg-surface-2">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <div className="p-2 bg-accent-primary-soft rounded-[6px] text-accent-primary shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-black text-fg-1 uppercase tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-xs text-fg-3 font-bold leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDismissDisabled}
            className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {children}

        {footer && (
          <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
