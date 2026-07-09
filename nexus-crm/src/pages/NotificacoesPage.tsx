import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, ExternalLink, Inbox, Search } from 'lucide-react'
import { EmptyState, StatusBadge } from '../components/detail/primitives'
import { useNotifications } from '../hooks/useNotifications'
import { fmtDateTime } from '../utils/date'

type ReadFilter = 'todas' | 'nao_lidas' | 'lidas'

const inputCls =
  'w-full rounded-[8px] border border-border-1 bg-bg-surface py-2 pl-9 pr-3 text-sm text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

export default function NotificacoesPage() {
  const navigate = useNavigate()
  const notifications = useNotifications()
  const [readFilter, setReadFilter] = useState<ReadFilter>('todas')
  const [moduleFilter, setModuleFilter] = useState('todos')
  const [search, setSearch] = useState('')

  const modules = useMemo(
    () => Array.from(new Set(notifications.items.map((item) => item.entidadeTipo))).sort(),
    [notifications.items],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notifications.items.filter((item) => {
      if (readFilter === 'nao_lidas' && item.lidaEm) return false
      if (readFilter === 'lidas' && !item.lidaEm) return false
      if (moduleFilter !== 'todos' && item.entidadeTipo !== moduleFilter) return false
      if (!q) return true
      return `${item.titulo} ${item.trecho} ${item.origemLabel} ${item.autor}`.toLowerCase().includes(q)
    })
  }, [moduleFilter, notifications.items, readFilter, search])

  const openItem = async (id: string, href: string | null) => {
    await notifications.markRead(id, true)
    if (href) navigate(href)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-fg-4">Central operacional</p>
          <h1 className="font-display text-2xl font-bold text-fg-1">Notificações</h1>
          <p className="text-sm text-fg-3">Menções em observações e atividades transversais.</p>
        </div>
        <button
          type="button"
          onClick={() => void notifications.markAllRead()}
          disabled={notifications.unreadCount === 0 || notifications.isMutating}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
        >
          <Check size={16} /> Marcar todas como lidas
        </button>
      </div>

      <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
        <div className="border-b border-border-1 p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_160px_180px]">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por texto, origem ou autor"
                className={inputCls}
              />
            </label>
            <select
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value as ReadFilter)}
              className="rounded-[8px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              aria-label="Filtro de leitura"
            >
              <option value="todas">Todas</option>
              <option value="nao_lidas">Não lidas</option>
              <option value="lidas">Lidas</option>
            </select>
            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              className="rounded-[8px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              aria-label="Filtro de módulo"
            >
              <option value="todos">Todos os módulos</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-border-1">
            {filtered.map((item) => (
              <article key={item.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${item.lidaEm ? 'bg-border-2' : 'bg-accent-primary'}`}
                    />
                    <h2 className="text-sm font-bold text-fg-1">{item.titulo}</h2>
                    <StatusBadge status={item.lidaEm ? 'Lida' : 'Pendente'} tone={item.lidaEm ? 'neutral' : 'info'} />
                  </div>
                  <p className="mt-1 text-sm text-fg-2 line-clamp-2">{item.trecho}</p>
                  <p className="mt-1 text-xs text-fg-4">
                    {item.origemLabel} · {item.autor} · {fmtDateTime(item.quando)}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => void notifications.markRead(item.id, !item.lidaEm)}
                    className="rounded-lg bg-bg-surface-2 px-3 py-1.5 text-xs font-semibold text-fg-2 hover:text-accent-primary"
                  >
                    {item.lidaEm ? 'Marcar não lida' : 'Marcar lida'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void openItem(item.id, item.href)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent-primary-soft px-3 py-1.5 text-xs font-semibold text-accent-primary hover:brightness-95 disabled:opacity-50"
                    disabled={!item.href}
                    title={item.href ? 'Abrir origem' : 'Origem sem rota disponível'}
                  >
                    <ExternalLink size={14} /> Abrir
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={notifications.items.length === 0 ? Inbox : Bell}
            title={notifications.items.length === 0 ? 'Nenhuma notificação' : 'Nenhum resultado'}
            hint="Menções feitas nas observações aparecem aqui quando forem direcionadas ao usuário atual."
          />
        )}
      </section>
    </div>
  )
}
