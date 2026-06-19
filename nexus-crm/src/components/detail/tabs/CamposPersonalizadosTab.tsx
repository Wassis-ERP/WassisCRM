/**
 * Guia padrão "Campos personalizados" — entity-agnostic. Lista campos extras
 * configuráveis pela corretora e permite adicionar valores em sessão.
 */
import { useState } from 'react'
import { Sliders, Hash, Calendar, ShieldCheck, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DetailCard, EmptyState, GhostButton } from '../primitives'
import type { CampoPersonalizado, CampoTipo } from '../types'

const CAMPO_ICON: Record<CampoTipo, LucideIcon> = {
  texto: Hash,
  numero: Hash,
  moeda: Hash,
  data: Calendar,
  lista: Sliders,
  booleano: ShieldCheck,
}

const inputCls =
  'w-full px-3 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

function NovoCampoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (c: Omit<CampoPersonalizado, 'id'>) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<CampoTipo>('texto')

  const submit = () => {
    if (!label.trim()) return
    onSubmit({ label: label.trim(), valor: valor.trim(), tipo })
    onCancel()
  }

  return (
    <div className="mb-4 p-4 bg-bg-surface-2 rounded-xl border border-border-1 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome do campo"
          className={inputCls}
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value as CampoTipo)} className={inputCls}>
          {Object.keys(CAMPO_ICON).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Valor"
        className={inputCls}
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-fg-3 hover:text-fg-1">
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!label.trim()}
          className="px-4 py-1.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-semibold hover:bg-accent-primary-hover disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}

export default function CamposPersonalizadosTab({
  campos,
  onAdd,
  tipoEntidade,
}: {
  campos: CampoPersonalizado[]
  onAdd: (c: Omit<CampoPersonalizado, 'id'>) => void
  tipoEntidade?: string
}) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-4">
      <DetailCard
        title="Campos personalizados"
        icon={Sliders}
        action={
          !adding && (
            <GhostButton icon={Plus} onClick={() => setAdding(true)}>
              Adicionar campo
            </GhostButton>
          )
        }
      >
        {adding && <NovoCampoForm onSubmit={onAdd} onCancel={() => setAdding(false)} />}
        {campos.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campos.map((c) => {
              const Icon = CAMPO_ICON[c.tipo] ?? Hash
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 bg-bg-surface-2 rounded-xl"
                >
                  <span className="w-8 h-8 rounded-lg bg-accent-primary-soft text-accent-primary flex items-center justify-center shrink-0">
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-fg-4 uppercase tracking-widest font-bold">{c.label}</p>
                    <p className="text-sm font-medium text-fg-1 truncate">{c.valor || '—'}</p>
                  </div>
                  <span className="text-[10px] text-fg-4 uppercase font-bold shrink-0">{c.tipo}</span>
                </div>
              )
            })}
          </div>
        ) : (
          !adding && (
            <EmptyState
              icon={Sliders}
              title="Nenhum campo personalizado"
              hint="Adicione campos extras para guardar informações específicas deste cadastro."
            />
          )
        )}
      </DetailCard>
      <p className="flex items-start gap-2 text-xs text-fg-4 px-1">
        <Sliders size={14} className="shrink-0 mt-0.5" />
        Campos personalizados são configurados pela corretora em Configurações → Campos. Aparecem
        para todos os cadastros do mesmo tipo{tipoEntidade ? ` (${tipoEntidade})` : ''}.
      </p>
    </div>
  )
}
