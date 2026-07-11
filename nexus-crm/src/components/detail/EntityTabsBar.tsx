/**
 * Barra de guias controlada para telas de detalhe. Entity-agnostic: recebe a
 * lista de guias, a guia ativa e o callback de mudança. Reutilizável por
 * qualquer módulo (Segurados, Oportunidades, Sinistros…).
 */
import type { ReactNode } from 'react'

export interface EntityTab<Id extends string = string> {
  id: Id
  label: string
  badge?: ReactNode
}

export function EntityTabsBar<Id extends string = string>({
  tabs,
  active,
  onChange,
  wrap = false,
}: {
  tabs: EntityTab<Id>[]
  active: Id
  onChange: (id: Id) => void
  wrap?: boolean
}) {
  return (
    <div
      role="tablist"
      aria-label="Seções do cadastro"
      className={`flex items-center gap-1 border-b border-border-1 mb-6 ${wrap ? 'flex-wrap overflow-visible' : 'overflow-x-auto overflow-y-hidden'}`}
    >
      {tabs.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-2 whitespace-nowrap py-3 text-sm font-semibold transition-colors -mb-px border-b-2 ${wrap ? 'px-3 xl:px-4' : 'px-4'} ${
              isActive
                ? 'text-accent-primary border-accent-primary'
                : 'text-fg-3 border-transparent hover:text-fg-1'
            }`}
          >
            {t.label}
            {t.badge != null && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-accent-primary-soft text-accent-primary'
                    : 'bg-bg-surface-3 text-fg-3'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
