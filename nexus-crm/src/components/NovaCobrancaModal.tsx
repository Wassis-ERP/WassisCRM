import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, X } from 'lucide-react'
import DateField from './DateField'
import { usePipelineStages } from '../hooks/usePipelineStages'
import {
  useCobrancaResponsaveis,
  useCreateCobranca,
  useParcelasElegiveisCobranca,
} from '../hooks/useFinanceiroCobrancas'
import type { CobrancaCanal, CobrancaPrioridade } from '../types/database'

interface NovaCobrancaModalProps {
  isOpen: boolean
  onClose: () => void
  pipelineId: string
  branchIds: readonly string[] | null
  initialParcelaId?: string | null
  onCreated?: (id: string) => void
}

const money = (value: number | null) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format(value ?? 0)

export default function NovaCobrancaModal({
  isOpen, onClose, pipelineId, branchIds, initialParcelaId, onCreated,
}: NovaCobrancaModalProps) {
  const stages = usePipelineStages(pipelineId)
  const eligible = useParcelasElegiveisCobranca(branchIds)
  const responsaveis = useCobrancaResponsaveis()
  const create = useCreateCobranca(branchIds)
  const [parcelaId, setParcelaId] = useState(initialParcelaId ?? '')
  const [responsavelId, setResponsavelId] = useState('')
  const [prioridade, setPrioridade] = useState<CobrancaPrioridade>('MEDIA')
  const [canal, setCanal] = useState<CobrancaCanal>('WHATSAPP')
  const [followup, setFollowup] = useState('')
  const [proxima, setProxima] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !create.isPending) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [create.isPending, isOpen, onClose])

  const rows = useMemo(() => eligible.data ?? [], [eligible.data])
  const selected = rows.find((row) => row.id === parcelaId)

  if (!isOpen) return null

  const handleSubmit = async () => {
    setError(null)
    const firstStage = stages.data?.[0]
    if (!firstStage) return setError('O pipeline de Cobranças não possui uma etapa inicial.')
    if (!selected) return setError('Selecione uma parcela vencida elegível.')
    try {
      const row = await create.mutateAsync({
        parcelaId: selected.id,
        stageId: firstStage.id,
        responsavelId: responsavelId || null,
        prioridade,
        vencimentoFollowup: followup || null,
        proximaCobrancaEm: proxima ? new Date(proxima).toISOString() : null,
        canalPreferencial: canal,
        observacoes: observacoes || null,
      })
      onClose()
      onCreated?.(row.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível abrir a cobrança.')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto px-4 py-8">
      <button type="button" aria-label="Fechar modal" className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm" onClick={() => !create.isPending && onClose()} />
      <section role="dialog" aria-modal="true" aria-labelledby="nova-cobranca-title" className="relative my-auto w-full max-w-[680px] rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-3)]">
        <header className="flex items-start justify-between border-b border-border-1 p-5">
          <div>
            <h2 id="nova-cobranca-title" className="text-lg font-black text-fg-1">Abrir cobrança</h2>
            <p className="mt-1 text-xs font-semibold text-fg-3">A origem e os valores vêm da parcela vencida e permanecem somente leitura.</p>
          </div>
          <button type="button" disabled={create.isPending} onClick={onClose} className="rounded-[6px] p-2 text-fg-4 hover:bg-bg-surface-2 hover:text-fg-2 disabled:opacity-40"><X size={18} /></button>
        </header>

        <div className="space-y-5 p-5">
          <label>
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Parcela vencida *</span>
            <select value={parcelaId} onChange={(event) => setParcelaId(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none">
              <option value="">Selecione a origem</option>
              {rows.map((row) => <option key={row.id} value={row.id}>{row.seguradoNome} · {row.documentoReferencia} · parcela {row.numero ?? '—'} · {money(row.valor)}</option>)}
            </select>
          </label>

          {selected && <div className="grid gap-3 rounded-[8px] border border-signal-danger/25 bg-signal-danger/5 p-4 sm:grid-cols-3">
            <div><p className="text-[9px] font-black uppercase tracking-wider text-fg-4">Segurado</p><p className="mt-1 text-sm font-black text-fg-1">{selected.seguradoNome}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-wider text-fg-4">Vencimento</p><p className="mt-1 font-mono text-sm font-bold text-fg-1">{selected.vencimento ? new Date(`${selected.vencimento}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-wider text-fg-4">Atraso</p><p className="mt-1 text-sm font-black text-signal-danger">{selected.diasVencidos} dias · {money(selected.valor)}</p></div>
          </div>}

          {!eligible.isLoading && rows.length === 0 && <div className="flex gap-3 rounded-[8px] border border-signal-warning/30 bg-signal-warning/10 p-4 text-sm text-fg-2"><AlertCircle className="shrink-0 text-signal-warning" size={18} /><div><p className="font-bold text-fg-1">Nenhuma parcela elegível</p><p className="mt-0.5 text-xs font-semibold text-fg-3">Parcelas não vencidas, encerradas ou que já possuem cobrança ativa ficam fora desta lista.</p></div></div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Responsável</span>
              <select value={responsavelId} onChange={(event) => setResponsavelId(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1">
                <option value="">Usuário atual</option>
                {(responsaveis.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.full_name ?? row.email ?? row.id}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Prioridade</span>
              <select value={prioridade} onChange={(event) => setPrioridade(event.target.value as CobrancaPrioridade)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1">
                <option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Canal preferencial</span>
              <select value={canal} onChange={(event) => setCanal(event.target.value as CobrancaCanal)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1">
                <option value="WHATSAPP">WhatsApp</option><option value="TELEFONE">Telefone</option><option value="EMAIL">E-mail</option><option value="OUTRO">Outro</option>
              </select>
            </label>
            <DateField label="Prazo do follow-up" value={followup} onChange={setFollowup} inputClassName="text-sm" />
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Próximo contato</span>
              <div className="relative"><CalendarClock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" /><input type="datetime-local" value={proxima} onChange={(event) => setProxima(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 py-2.5 pl-9 pr-3 text-sm font-semibold text-fg-1" /></div>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Observações</span>
              <textarea rows={3} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Contexto da primeira tratativa" className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm text-fg-1" />
            </label>
          </div>

          {error && <p className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-bold text-signal-danger">{error}</p>}
        </div>

        <footer className="flex justify-end gap-3 border-t border-border-1 p-5">
          <button type="button" disabled={create.isPending} onClick={onClose} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-2">Cancelar</button>
          <button type="button" disabled={!selected || create.isPending} onClick={() => void handleSubmit()} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-40">{create.isPending ? 'Abrindo...' : 'Abrir cobrança'}</button>
        </footer>
      </section>
    </div>
  )
}
