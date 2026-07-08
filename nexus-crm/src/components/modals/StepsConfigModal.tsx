import { useMemo, useState } from 'react'
import { Plus, Trash2, GripVertical, Save, Trophy, ShieldOff, Loader2, GitBranch } from 'lucide-react'
import type { PipelineRow, PipelineStageRow } from '../../modules/types'
import { usePipelineStages } from '../../hooks/usePipelineStages'
import { usePipelinesAdmin } from '../../hooks/usePipelinesAdmin'
import AppModal from './AppModal'

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

type LocalStage = Pick<PipelineStageRow, 'id' | 'nome' | 'cor' | 'finaliza_com_sucesso' | 'finaliza_com_perda'> & {
  __isNew?: boolean
}

const tempId = () => `new-${crypto.randomUUID()}`

export default function StepsConfigModal({ isOpen, onClose, pipeline }: StepsConfigModalProps) {
  const pipelineId = pipeline?.id ?? null
  const { data: dbStages, isLoading } = usePipelineStages(pipelineId)

  const initialFromDb = useMemo<LocalStage[]>(
    () =>
      (dbStages ?? []).map((s) => ({
        id: s.id,
        nome: s.nome,
        cor: s.cor,
        finaliza_com_sucesso: s.finaliza_com_sucesso,
        finaliza_com_perda: s.finaliza_com_perda,
      })),
    [dbStages]
  )

  if (!isOpen || !pipeline || !pipelineId) return null

  if (isLoading) {
    return (
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Etapas de "${pipeline.nome}"`}
        description="Defina ordem, nomes e regras de conclusão deste funil."
        icon={<GitBranch size={20} />}
        size="lg"
      >
        <div className="flex items-center justify-center gap-2 px-8 py-16 text-fg-3">
          <Loader2 className="animate-spin" size={18} /> Carregando etapas...
        </div>
      </AppModal>
    )
  }

  return (
    <StepsConfigEditor
      key={pipelineId}
      isOpen={isOpen}
      onClose={onClose}
      pipeline={pipeline}
      pipelineId={pipelineId}
      initialSteps={initialFromDb}
    />
  )
}

interface StepsConfigEditorProps {
  isOpen: boolean
  onClose: () => void
  pipeline: PipelineRow
  pipelineId: string
  initialSteps: LocalStage[]
}

function StepsConfigEditor({
  isOpen,
  onClose,
  pipeline,
  pipelineId,
  initialSteps,
}: StepsConfigEditorProps) {
  const { createStage, deleteStage, saveStagesBatch, isSavingStages } = usePipelinesAdmin()

  const [steps, setSteps] = useState<LocalStage[]>(initialSteps)
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [newStepName, setNewStepName] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAddStep = () => {
    if (!newStepName.trim()) return
    setSteps([
      ...steps,
      {
        id: tempId(),
        nome: newStepName.trim(),
        cor: COLORS[steps.length % COLORS.length],
        finaliza_com_sucesso: false,
        finaliza_com_perda: true,
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
            name: s.nome,
            color: s.cor ?? 'bg-slate-400',
            order: idx,
            is_win_eligible: s.finaliza_com_sucesso,
            is_loss_eligible: s.finaliza_com_perda,
          })
          finalSteps.push({
            id: created.id,
            patch: {
              nome: s.nome,
              cor: s.cor,
              finaliza_com_sucesso: s.finaliza_com_sucesso,
              finaliza_com_perda: s.finaliza_com_perda,
            },
          })
        } else {
          finalSteps.push({
            id: s.id,
            patch: {
              nome: s.nome,
              cor: s.cor,
              finaliza_com_sucesso: s.finaliza_com_sucesso,
              finaliza_com_perda: s.finaliza_com_perda,
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
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Etapas de "${pipeline.nome}"`}
      description="Defina ordem, nomes e regras de conclusão deste funil."
      icon={<GitBranch size={20} />}
      size="lg"
      isDismissDisabled={isSavingStages}
    >
      <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary border border-accent-primary/20 font-black uppercase tracking-widest">
            {pipeline.entidade_tipo}
          </span>

          {error && (
            <div className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger">
              {error}
            </div>
          )}

          {/* Add Step Input */}
          <div className="flex flex-col gap-3 p-4 bg-bg-surface-2 rounded-[8px] border border-border-1 sm:flex-row">
            <input
              type="text"
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
              placeholder="Nome da nova etapa..."
              className="flex-1 px-4 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium"
            />
            <button
              type="button"
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

            {steps.map((step, index) => (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`grid grid-cols-[auto,1fr,auto] gap-3 p-4 bg-bg-surface border border-border-1 rounded-[8px] transition-all lg:grid-cols-[auto,1fr,auto,auto,auto] ${
                    draggedIndex === index
                      ? 'opacity-50 border-accent-primary scale-95'
                      : 'hover:border-accent-primary/30 shadow-[var(--shadow-1)]'
                  }`}
                >
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing p-1 text-fg-4 hover:text-fg-2"
                    aria-label={`Arrastar etapa ${step.nome}`}
                  >
                    <GripVertical size={18} />
                  </button>

                  <label className="min-w-0 space-y-1">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-fg-4">
                      Ordem {index + 1} / nome da etapa
                    </span>
                    <input
                      type="text"
                      value={step.nome}
                      onChange={(e) => handleUpdate(step.id, { nome: e.target.value })}
                      className="w-full min-w-0 bg-transparent border-none text-sm font-bold text-fg-1 focus:outline-none focus:ring-2 focus:ring-accent-primary/30 rounded-[4px]"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(step.id, { finaliza_com_sucesso: !step.finaliza_com_sucesso })
                      }
                      title={
                        step.finaliza_com_sucesso
                          ? 'Cards podem ser concluídos como GANHO desta etapa'
                          : 'Marcar etapa como elegível para GANHO'
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        step.finaliza_com_sucesso
                          ? 'bg-signal-success/15 text-signal-success'
                          : 'bg-bg-surface-2 text-fg-4 hover:text-fg-2'
                      }`}
                    >
                      <Trophy size={13} />
                      Ganho
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(step.id, { finaliza_com_perda: !step.finaliza_com_perda })
                      }
                      title={
                        step.finaliza_com_perda
                          ? 'Cards podem ser concluídos como PERDIDO desta etapa'
                          : 'Marcar etapa como elegível para PERDA'
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        step.finaliza_com_perda
                          ? 'bg-signal-danger/15 text-signal-danger'
                          : 'bg-bg-surface-2 text-fg-4 hover:text-fg-2'
                      }`}
                    >
                      <ShieldOff size={13} />
                      Perda
                    </button>
                  </div>

                  <div className="col-span-full flex flex-wrap items-center gap-1 lg:col-span-1 lg:justify-end">
                    <span className="mr-1 text-[9px] font-black uppercase tracking-widest text-fg-4">Cor</span>
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdate(step.id, { cor: c })}
                        aria-label={`Aplicar cor ${c.replace('bg-', '').replace('-500', '')} na etapa ${step.nome}`}
                        className={`w-3 h-3 rounded-full ${c} transition-all ${
                          step.cor === c
                            ? 'ring-2 ring-offset-2 ring-accent-primary scale-125'
                            : 'opacity-40 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStep(step.id)}
                    className="p-2 text-fg-4 hover:text-signal-danger hover:bg-signal-danger/10 rounded-lg transition-colors"
                    aria-label={`Remover etapa ${step.nome}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

            {steps.length === 0 && (
              <div className="text-center py-8 text-sm text-fg-4 italic">
                Nenhuma etapa cadastrada. Adicione a primeira acima.
              </div>
            )}
          </div>
      </div>

      <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingStages}
            className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingStages || steps.length === 0}
            className="flex items-center gap-2 px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
          >
            {isSavingStages ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSavingStages ? 'Salvando...' : 'Salvar Configuração'}
          </button>
      </div>
    </AppModal>
  )
}
