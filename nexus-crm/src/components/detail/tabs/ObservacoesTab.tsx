/**
 * Guia padrão "Observações" — entity-agnostic. Notas livres com fixação no
 * topo. Reutilizável por qualquer módulo.
 */
import { useMemo, useState } from 'react'
import { Pin, Plus } from 'lucide-react'
import { DetailCard, EmptyState, GhostButton } from '../primitives'
import { fmtDateTime } from '../../../utils/date'
import type { Observacao } from '../types'

function iniciais(nome?: string): string {
  if (!nome) return '—'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const inputCls =
  'w-full px-3 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[10px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

function NovaObservacaoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (o: Omit<Observacao, 'id'>) => void
  onCancel: () => void
}) {
  const [texto, setTexto] = useState('')
  const [pinned, setPinned] = useState(false)

  const submit = () => {
    if (!texto.trim()) return
    onSubmit({ texto: texto.trim(), data: new Date().toISOString(), pinned })
    onCancel()
  }

  return (
    <div className="mb-4 p-4 bg-bg-surface-2 rounded-xl border border-border-1 space-y-3">
      <textarea
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva uma observação…"
        rows={3}
        className={inputCls}
      />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-fg-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="accent-[var(--accent-primary)]"
          />
          <Pin size={13} /> Fixar no topo
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-fg-3 hover:text-fg-1">
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!texto.trim()}
            className="px-4 py-1.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-semibold hover:bg-accent-primary-hover disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ObservacoesTab({
  observacoes,
  onAdd,
  onTogglePin,
}: {
  observacoes: Observacao[]
  onAdd: (o: Omit<Observacao, 'id'>) => void
  onTogglePin: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)

  const ordered = useMemo(
    () => [...observacoes].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [observacoes],
  )

  return (
    <DetailCard
      title="Observações"
      icon={Pin}
      action={
        !adding && (
          <GhostButton icon={Plus} onClick={() => setAdding(true)}>
            Nova observação
          </GhostButton>
        )
      }
    >
      {adding && <NovaObservacaoForm onSubmit={onAdd} onCancel={() => setAdding(false)} />}
      {ordered.length ? (
        <div className="space-y-3">
          {ordered.map((o) => (
            <div
              key={o.id}
              className={`p-4 rounded-xl border ${
                o.pinned
                  ? 'bg-accent-primary-soft/40 border-accent-primary/30'
                  : 'bg-bg-surface-2 border-border-1'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {o.pinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent-primary">
                    <Pin size={12} /> Fixada
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onTogglePin(o.id)}
                  className="ml-auto p-1 text-fg-4 hover:text-accent-primary transition-colors"
                  title={o.pinned ? 'Desafixar' : 'Fixar no topo'}
                >
                  <Pin size={14} className={o.pinned ? 'fill-current' : ''} />
                </button>
              </div>
              <p className="text-sm text-fg-1 whitespace-pre-wrap">{o.texto}</p>
              <div className="flex items-center gap-2 text-xs text-fg-4 mt-2">
                {o.autor && (
                  <span className="w-5 h-5 rounded-full bg-bg-surface-3 text-fg-3 flex items-center justify-center text-[9px] font-bold">
                    {iniciais(o.autor)}
                  </span>
                )}
                {o.autor && <span>{o.autor}</span>}
                {o.autor && <span className="w-1 h-1 rounded-full bg-fg-4" />}
                <span>{fmtDateTime(o.data)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !adding && (
          <EmptyState
            icon={Pin}
            title="Nenhuma observação"
            hint="Registre preferências, contexto e lembretes sobre este cadastro."
          />
        )
      )}
    </DetailCard>
  )
}
