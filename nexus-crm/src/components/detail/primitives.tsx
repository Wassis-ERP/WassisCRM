/**
 * Primitivos de UI das telas de detalhe, alinhados ao design system W.Assis
 * (tokens semânticos `--fg-*`, `--bg-*`, `--accent-*`, `--signal-*`).
 *
 * Generalizam blocos que viviam inline nas páginas de Segurados e que serão
 * reaproveitados por outros módulos. Estilo 100% Tailwind v4 + tokens.
 */
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { fmtDateTime } from '../../utils/date'

// ---------------------------------------------------------------------------
// DetailCard — superfície de seção com cabeçalho (título + ícone) e ação.
// ---------------------------------------------------------------------------
export function DetailCard({
  title,
  icon: Icon,
  action,
  children,
  className = '',
  bodyClassName = 'p-6',
}: {
  title?: ReactNode
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      className={`bg-bg-surface rounded-[14px] shadow-[var(--shadow-1)] border border-border-1 ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-border-1 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-bold text-fg-1">
            {Icon && <Icon size={16} className="text-accent-primary shrink-0" />}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// DetailField — label (eyebrow) + valor, com estado vazio "—".
// ---------------------------------------------------------------------------
export function DetailField({
  label,
  children,
  full = false,
  mono = false,
}: {
  label: ReactNode
  children?: ReactNode
  full?: boolean
  mono?: boolean
}) {
  const isEmpty =
    children === null || children === undefined || children === '' || children === '—'
  return (
    <div className={full ? 'sm:col-span-2 md:col-span-3' : ''}>
      <p className="text-[10px] text-fg-4 uppercase tracking-widest font-bold mb-1">{label}</p>
      <div
        className={`text-sm font-medium flex items-center gap-2 flex-wrap ${mono ? 'font-mono' : ''} ${
          isEmpty ? 'italic text-fg-4' : 'text-fg-1'
        }`}
      >
        {isEmpty ? '—' : children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatusBadge — tom semântico por status (nunca cor de ramo).
// ---------------------------------------------------------------------------
export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'bg-signal-success/15 text-signal-success',
  warning: 'bg-signal-warning/15 text-signal-warning',
  danger: 'bg-signal-danger/15 text-signal-danger',
  info: 'bg-accent-primary-soft text-accent-primary',
  neutral: 'bg-bg-surface-3 text-fg-3',
}

const STATUS_TONE: Record<string, BadgeTone> = {
  Ativo: 'success',
  Ativa: 'success',
  Inativo: 'neutral',
  Prospecto: 'info',
  Renovar: 'warning',
  'Em cotação': 'info',
  Atrasada: 'danger',
  Pendente: 'warning',
  Concluída: 'success',
}

function statusTone(status: string): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral'
}

export function StatusBadge({
  status,
  tone,
  dot = true,
}: {
  status: string
  tone?: BadgeTone
  dot?: boolean
}) {
  const t = tone ?? statusTone(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${TONE_CLASS[t]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// EmptyState — placeholder consistente para listas vazias.
// ---------------------------------------------------------------------------
export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon?: LucideIcon
  title: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      {Icon && (
        <div className="w-11 h-11 rounded-[12px] bg-bg-surface-2 text-fg-4 flex items-center justify-center mb-3">
          <Icon size={22} />
        </div>
      )}
      <p className="text-sm font-semibold text-fg-2">{title}</p>
      {hint && <p className="text-xs text-fg-4 mt-1 max-w-xs">{hint}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// GhostButton — botão de ação suave usado nos cabeçalhos das guias.
// ---------------------------------------------------------------------------
export function GhostButton({
  icon: Icon,
  children,
  onClick,
  type = 'button',
}: {
  icon?: LucideIcon
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary-soft text-accent-primary rounded-lg text-xs font-semibold hover:brightness-95 transition-colors"
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Timeline — linha do tempo de eventos/logs.
// ---------------------------------------------------------------------------
export interface TimelineEntry {
  titulo: string
  detalhe?: string
  quando: string
  autor?: string
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border-1" />
      <div className="space-y-6">
        {entries.map((e, i) => (
          <div key={i} className="relative pl-6">
            <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-accent-primary border-2 border-bg-surface" />
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <p className="text-sm font-medium text-fg-1">{e.titulo}</p>
              <span className="text-xs text-fg-4">{fmtDateTime(e.quando)}</span>
            </div>
            {e.detalhe && <p className="text-xs text-fg-3 mt-0.5">{e.detalhe}</p>}
            {e.autor && <span className="text-xs text-fg-4 mt-0.5 block">{e.autor}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
