/**
 * Guia padrão "Observações" — entity-agnostic. Notas livres com fixação no
 * topo. Reutilizável por qualquer módulo.
 */
import { useMemo, useState } from 'react'
import { Pin, Send } from 'lucide-react'
import { DetailCard, EmptyState } from '../primitives'
import { fmtDateTime } from '../../../utils/date'
import type { MentionCandidate, Observacao, ResolvedMention } from '../types'

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
  'w-full px-3 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

function NovaObservacaoForm({
  onSubmit,
  mentionCandidates,
}: {
  onSubmit: (o: Omit<Observacao, 'id'>, mentions: ResolvedMention[]) => void
  mentionCandidates: MentionCandidate[]
}) {
  const [texto, setTexto] = useState('')
  const [resolvedMentions, setResolvedMentions] = useState<ResolvedMention[]>([])

  const activeMention = useMemo(() => {
    const match = texto.match(/@([\p{L}\d._-]*)$/u)
    return match?.[1]?.toLowerCase() ?? null
  }, [texto])

  const suggestions = useMemo(() => {
    if (activeMention === null) return []
    return mentionCandidates
      .filter((candidate) => {
        const haystack = `${candidate.nome} ${candidate.email ?? ''}`.toLowerCase()
        return haystack.includes(activeMention)
      })
      .slice(0, 5)
  }, [activeMention, mentionCandidates])

  const submit = () => {
    if (!texto.trim()) return
    onSubmit({ texto: texto.trim(), data: new Date().toISOString(), pinned: false }, resolvedMentions)
    setTexto('')
    setResolvedMentions([])
  }

  const selectMention = (candidate: MentionCandidate) => {
    const marker = `@${candidate.nome.split(/\s+/)[0]}`
    setTexto((current) => current.replace(/@([\p{L}\d._-]*)$/u, `${marker} `))
    setResolvedMentions((current) => {
      if (current.some((mention) => mention.profileId === candidate.id)) return current
      return [...current, { profileId: candidate.id, marcador: marker }]
    })
  }

  return (
    <div className="relative mb-4 p-3 bg-bg-surface-2 rounded-[8px] border border-border-1 space-y-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva uma observação ou mencione @usuario"
        rows={2}
        className={inputCls}
      />
      {suggestions.length > 0 && (
        <div className="absolute left-3 right-3 top-[72px] z-20 rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-2)] overflow-hidden">
          {suggestions.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => selectMention(candidate)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bg-surface-2"
            >
              <span className="w-7 h-7 rounded-full bg-accent-primary-soft text-accent-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                {iniciais(candidate.nome)}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-fg-1 truncate">{candidate.nome}</span>
                {candidate.email && <span className="block text-xs text-fg-4 truncate">{candidate.email}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={!texto.trim()}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-semibold hover:bg-accent-primary-hover disabled:opacity-50"
        >
          <Send size={14} /> Enviar
        </button>
      </div>
    </div>
  )
}

export default function ObservacoesTab({
  observacoes,
  onAdd,
  onTogglePin,
  mentionCandidates,
  readOnly = false,
}: {
  observacoes: Observacao[]
  onAdd: (o: Omit<Observacao, 'id'>, mentions?: ResolvedMention[]) => void
  onTogglePin: (id: string) => void
  mentionCandidates: MentionCandidate[]
  readOnly?: boolean
}) {
  const ordered = useMemo(
    () => [...observacoes].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [observacoes],
  )

  return (
    <DetailCard title="Observações" icon={Pin}>
      {!readOnly && <NovaObservacaoForm onSubmit={onAdd} mentionCandidates={mentionCandidates} />}
      {ordered.length ? (
        <div className="space-y-2">
          {ordered.map((o) => (
            <div
              key={o.id}
              className={`px-3 py-2.5 rounded-[8px] border ${
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
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onTogglePin(o.id)}
                    className="ml-auto p-1 text-fg-4 hover:text-accent-primary transition-colors"
                    title={o.pinned ? 'Desafixar' : 'Fixar no topo'}
                  >
                    <Pin size={14} className={o.pinned ? 'fill-current' : ''} />
                  </button>
                )}
              </div>
              <p className="text-sm text-fg-1 whitespace-pre-wrap leading-snug">{o.texto}</p>
              <div className="flex items-center gap-2 text-xs text-fg-4 mt-1.5">
                <span className="w-5 h-5 rounded-full bg-bg-surface-3 text-fg-3 flex items-center justify-center text-[9px] font-bold">
                  {iniciais(o.autor)}
                </span>
                <span>{o.autor || 'Usuário da sessão'}</span>
                <span className="w-1 h-1 rounded-full bg-fg-4" />
                <span>{fmtDateTime(o.data)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Pin}
          title="Nenhuma observação"
          hint="Registre preferências, contexto e lembretes sobre este cadastro."
        />
      )}
    </DetailCard>
  )
}
