/**
 * Guia padrão "Tarefas" — entity-agnostic. Recebe a lista de tarefas e os
 * handlers de criar/alternar conclusão. Reutilizável por qualquer módulo.
 */
import { useMemo, useState } from 'react'
import {
  Check,
  Clock,
  Phone,
  Mail,
  Users,
  FileText,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DetailCard, EmptyState, GhostButton } from '../primitives'
import { fmtDate, relativeDays } from '../../../utils/date'
import type { Tarefa, TarefaPrioridade, TarefaTipo } from '../types'

const TIPO_ICON: Record<TarefaTipo, LucideIcon> = {
  Ligação: Phone,
  'E-mail': Mail,
  Reunião: Users,
  Documento: FileText,
  'Follow-up': Clock,
  Renovação: ShieldCheck,
}

const PRIO_CLASS: Record<TarefaPrioridade, string> = {
  Alta: 'bg-signal-danger/15 text-signal-danger',
  Média: 'bg-signal-warning/15 text-signal-warning',
  Baixa: 'bg-bg-surface-3 text-fg-3',
}

const inputCls =
  'w-full px-3 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

function TaskRow({ t, onToggle }: { t: Tarefa; onToggle: (id: string) => void }) {
  const TipoIcon = TIPO_ICON[t.tipo] ?? Clock
  const concluida = t.status === 'Concluída'
  const atrasada = t.status === 'Atrasada'
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-surface-2 rounded-xl">
      <button
        type="button"
        onClick={() => onToggle(t.id)}
        aria-label={concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          concluida
            ? 'bg-signal-success border-signal-success text-fg-on-brand'
            : atrasada
              ? 'border-signal-danger'
              : 'border-border-2 hover:border-accent-primary'
        }`}
      >
        {concluida && <Check size={13} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${concluida ? 'line-through text-fg-4' : 'text-fg-1'}`}>
          {t.titulo}
        </p>
        <div className="flex items-center gap-2 text-xs text-fg-4 mt-0.5 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <TipoIcon size={13} /> {t.tipo}
          </span>
          {t.responsavel?.nome && (
            <>
              <span className="w-1 h-1 rounded-full bg-fg-4" />
              <span>{t.responsavel.nome}</span>
            </>
          )}
          {t.prazo && (
            <>
              <span className="w-1 h-1 rounded-full bg-fg-4" />
              <span className={atrasada ? 'text-signal-danger font-semibold' : ''}>
                {concluida ? 'concluída' : atrasada ? 'venceu' : 'vence'} {fmtDate(t.prazo)}
              </span>
            </>
          )}
        </div>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${PRIO_CLASS[t.prioridade]}`}>
        {t.prioridade}
      </span>
    </div>
  )
}

function NovaTarefaForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (t: Omit<Tarefa, 'id'>) => void
  onCancel: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TarefaTipo>('Follow-up')
  const [prazo, setPrazo] = useState('')
  const [prioridade, setPrioridade] = useState<TarefaPrioridade>('Média')

  const submit = () => {
    if (!titulo.trim()) return
    const status: Tarefa['status'] =
      prazo && (relativeDays(prazo) ?? 0) < 0 ? 'Atrasada' : 'Pendente'
    onSubmit({ titulo: titulo.trim(), tipo, prazo: prazo || undefined, prioridade, status })
    onCancel()
  }

  return (
    <div className="mb-4 p-4 bg-bg-surface-2 rounded-xl border border-border-1 space-y-3">
      <input
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título da tarefa"
        className={inputCls}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TarefaTipo)} className={inputCls}>
          {Object.keys(TIPO_ICON).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={inputCls} />
        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value as TarefaPrioridade)}
          className={inputCls}
        >
          <option value="Alta">Alta</option>
          <option value="Média">Média</option>
          <option value="Baixa">Baixa</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-fg-3 hover:text-fg-1">
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!titulo.trim()}
          className="px-4 py-1.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-semibold hover:bg-accent-primary-hover disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}

export default function TarefasTab({
  tarefas,
  onAdd,
  onToggle,
}: {
  tarefas: Tarefa[]
  onAdd: (t: Omit<Tarefa, 'id'>) => void
  onToggle: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)

  const { abertas, concluidas, atrasadas } = useMemo(() => {
    const ab = tarefas
      .filter((t) => t.status !== 'Concluída')
      .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''))
    return {
      abertas: ab,
      concluidas: tarefas.filter((t) => t.status === 'Concluída'),
      atrasadas: ab.filter((t) => t.status === 'Atrasada').length,
    }
  }, [tarefas])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat value={abertas.length} label="Em aberto" />
        <SummaryStat value={atrasadas} label="Atrasadas" tone="danger" />
        <SummaryStat value={concluidas.length} label="Concluídas" tone="success" />
      </div>

      <DetailCard
        title="Em aberto"
        icon={Clock}
        action={
          !adding && (
            <GhostButton icon={Plus} onClick={() => setAdding(true)}>
              Nova tarefa
            </GhostButton>
          )
        }
      >
        {adding && <NovaTarefaForm onSubmit={onAdd} onCancel={() => setAdding(false)} />}
        {abertas.length ? (
          <div className="space-y-2">
            {abertas.map((t) => (
              <TaskRow key={t.id} t={t} onToggle={onToggle} />
            ))}
          </div>
        ) : (
          !adding && (
            <EmptyState
              icon={Check}
              title="Nenhuma tarefa em aberto"
              hint="Crie tarefas de follow-up, ligações e documentos para esta entidade."
            />
          )
        )}
      </DetailCard>

      {concluidas.length > 0 && (
        <DetailCard title="Concluídas" icon={Check}>
          <div className="space-y-2">
            {concluidas.map((t) => (
              <TaskRow key={t.id} t={t} onToggle={onToggle} />
            ))}
          </div>
        </DetailCard>
      )}
    </div>
  )
}

function SummaryStat({
  value,
  label,
  tone = 'neutral',
}: {
  value: number
  label: string
  tone?: 'neutral' | 'danger' | 'success'
}) {
  const numClass =
    tone === 'danger'
      ? 'text-signal-danger'
      : tone === 'success'
        ? 'text-signal-success'
        : 'text-fg-1'
  return (
    <div className="bg-bg-surface rounded-[8px] border border-border-1 shadow-[var(--shadow-1)] px-4 py-3 text-center">
      <div className={`text-2xl font-bold ${numClass}`}>{value}</div>
      <div className="text-[11px] text-fg-4 uppercase tracking-wider font-bold mt-0.5">{label}</div>
    </div>
  )
}
