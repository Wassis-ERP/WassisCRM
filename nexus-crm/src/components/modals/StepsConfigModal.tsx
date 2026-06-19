import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Trash2, GripVertical, Save, Trophy, ShieldOff, Loader2 } from 'lucide-react'
import type { PipelineRow, PipelineStageRow } from '../../modules/types'
import { usePipelineStages } from '../../hooks/usePipelineStages'
import { usePipelinesAdmin } from '../../hooks/usePipelinesAdmin'

interface StepsConfigModalProps {
  isOpen: boolean
  onClose: () => void
  pipeline: PipelineRow | null
}

const COLORS = [
  'bg-slate-400',
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-rose-500',
]

type LocalStage = Pick<PipelineStageRow, 'id' | 'name' | 'color' | 'is_win_eligible' | 'is_loss_eligible'> & {
  __isNew?: boolean
}

const tempId = () => `new-${crypto.randomUUID()}`

export default function StepsConfigModal({ isOpen, onClose, pipeline }: StepsConfigModalProps) {
  const pipelineId = pipeline?.id ?? null
  const { data: dbStages, isLoading } = usePipelineStages(pipelineId)
  const { createStage, deleteStage, saveStagesBatch, isSavingStages } = usePipelinesAdmin()

  const [steps, setSteps] = useState<LocalStage[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [newStepName, setNewStepName] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialFromDb = useMemo<LocalStage[]>(
    () =>
      (dbStages ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        is_win_eligible: s.is_win_eligible,
        is_loss_eligible: s.is_loss_eligible,
      })),
    [dbStages]
  )

  // Reseta o estado local sempre que o pipeline muda ou o modal reabre
  useEffect(() => {
    if (isOpen) {
      setSteps(initialFromDb)
      setRemovedIds([])
      setError(null)
      setNewStepName('')
    }
  }, [isOpen, initialFromDb])

  if (!isOpen || !pipeline) return null

  const handleAddStep = () => {
    if (!newStepName.trim()) return
    setSteps([
      ...steps,
      {
        id: tempId(),
        name: newStepName.trim(),
        color: COLORS[steps.length % COLORS.length],
        is_win_eligible: false,
        is_loss_eligible: true,
        __isNew: true,
      },
    ])
    setNewStepName('')
  }

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id))
    if (!id.startsWith('new-')) {
      setRemovedIds((prev) => [...prev, id])
    }
  }

  const handleUpdate = (id: string, patch: Partial<LocalStage>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const handleDragStart = (index: number) => setDraggedIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const next = [...steps]
    const [item] = next.splice(draggedIndex, 1)
    next.splice(index, 0, item)
    setSteps(next)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => setDraggedIndex(null)

  const handleSave = async () => {
    if (!pipelineId) return
    setError(null)
    try {
      // 1) Apaga as removidas (somente IDs reais).
      for (const id of removedIds) {
        await deleteStage({ id, pipelineId })
      }

      // 2) Cria as novas (insere com order = posicao atual).
      const finalSteps: Array<{ id: string; patch: Parameters<typeof saveStagesBatch>[0]['stages'][number]['patch'] }> = []
      for (let idx = 0; idx < steps.length; idx++) {
        const s = steps[idx]
        if (s.__isNew) {
          const created = await createStage({
            pipelineId,
            name: s.name,
            color: s.color,
            order: idx,
            is_win_eligible: s.is_win_eligible,
            is_loss_eligible: s.is_loss_eligible,
          })
          finalSteps.push({
            id: created.id,
            patch: {
              name: s.name,
              color: s.color,
              is_win_eligible: s.is_win_eligible,
              is_loss_eligible: s.is_loss_eligible,
            },
          })
        } else {
          finalSteps.push({
            id: s.id,
            patch: {
              name: s.name,
              color: s.color,
              is_win_eligible: s.is_win_eligible,
              is_loss_eligible: s.is_loss_eligible,
            },
          })
        }
      }

      // 3) Salva ordem + patches em lote para todas as stages remanescentes.
      if (finalSteps.length > 0) {
        await saveStagesBatch({ pipelineId, stages: finalSteps })
      }

      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar etapas')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-3xl rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <div>
            <h2 className="text-xl font-black text-fg-1 uppercase tracking-tight flex items-center gap-2">
              Etapas de "{pipeline.name}"
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary border border-accent-primary/20">{pipeline.module}</span>
            </h2>
            <p className="text-xs text-fg-3 font-bold mt-1">
              Defina o fluxo, ordem, cores e regras de conclusão das etapas
            </p>
          </div>
          <button onClick={onClose} disabled={isSavingStages} className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger">
              {error}
            </div>
          )}

          {/* Add Step Input */}
          <div className="flex gap-2 p-4 bg-bg-surface-2 rounded-[8px] border border-border-1">
            <input
              type="text"
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
              placeholder="Nome da nova etapa..."
              className="flex-1 px-4 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium"
            />
            <button
              onClick={handleAddStep}
              disabled={isSavingStages || !newStepName.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-colors disabled:opacity-50"
            >
              <Plus size={18} /> Adicionar
            </button>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest">
                Etapas do Funil ({steps.length})
              </span>
              <span className="text-[10px] font-bold text-fg-4 italic">
                Arraste pelo ícone <GripVertical size={10} className="inline" /> para reordenar
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-fg-3">
                <Loader2 className="animate-spin" size={18} /> Carregando etapas...
              </div>
            ) : (
              steps.map((step, index) => (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-4 bg-bg-surface border border-border-1 rounded-[8px] group transition-all ${
                    draggedIndex === index
                      ? 'opacity-50 border-accent-primary scale-95'
                      : 'hover:border-accent-primary/30 shadow-[var(--shadow-1)]'
                  }`}
                >
                  <div className="cursor-grab active:cursor-grabbing p-1 text-fg-4 hover:text-fg-2">
                    <GripVertical size={18} />
                  </div>

                  <div className={`w-4 h-4 rounded-full ${step.color} shrink-0`} />

                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleUpdate(step.id, { name: e.target.value })}
                    className="flex-1 min-w-0 bg-transparent border-none text-sm font-bold text-fg-1 focus:outline-none"
                  />

                  {/* Flags */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleUpdate(step.id, { is_win_eligible: !step.is_win_eligible })
                      }
                      title={
                        step.is_win_eligible
                          ? 'Cards podem ser concluídos como GANHO desta etapa'
                          : 'Marcar etapa como elegível para GANHO'
                      }
                      className={`p-1.5 rounded-lg transition-all ${
                        step.is_win_eligible
                          ? 'bg-signal-success/15 text-signal-success'
                          : 'bg-bg-surface-2 text-fg-4 hover:text-fg-2'
                      }`}
                    >
                      <Trophy size={13} />
                    </button>
                    <button
                      onClick={() =>
                        handleUpdate(step.id, { is_loss_eligible: !step.is_loss_eligible })
                      }
                      title={
                        step.is_loss_eligible
                          ? 'Cards podem ser concluídos como PERDIDO desta etapa'
                          : 'Marcar etapa como elegível para PERDA'
                      }
                      className={`p-1.5 rounded-lg transition-all ${
                        step.is_loss_eligible
                          ? 'bg-signal-danger/15 text-signal-danger'
                          : 'bg-bg-surface-2 text-fg-4 hover:text-fg-2'
                      }`}
                    >
                      <ShieldOff size={13} />
                    </button>
                  </div>

                  {/* Color Picker */}
                  <div className="flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleUpdate(step.id, { color: c })}
                        className={`w-3 h-3 rounded-full ${c} transition-all ${
                          step.color === c
                            ? 'ring-2 ring-offset-2 ring-accent-primary scale-125'
                            : 'opacity-40 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleRemoveStep(step.id)}
                    className="p-2 text-fg-4 hover:text-signal-danger hover:bg-signal-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}

            {!isLoading && steps.length === 0 && (
              <div className="text-center py-8 text-sm text-fg-4 italic">
                Nenhuma etapa cadastrada. Adicione a primeira acima.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSavingStages}
            className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSavingStages || steps.length === 0}
            className="flex items-center gap-2 px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
          >
            {isSavingStages ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSavingStages ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  )
}
