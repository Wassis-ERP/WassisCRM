import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useMotivosPerda } from '../../hooks/useLookups';
import { useConcludeCard } from '../../hooks/useConcludeCard';
import type { CardStatus, KanbanCard, PipelineModule } from '../../modules/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: KanbanCard | null;
  module: PipelineModule;
  pipelineId: string;
  mode: Exclude<CardStatus, 'pending'>;
  onDone?: () => void;
}

/**
 * Modal de conclusao (Ganho/Perdido) para cards do Kanban.
 * No modo "lost", exige selecao de motivo quando houver motivos cadastrados.
 * Persiste via `useConcludeCard` (adapter.conclude do modulo correspondente).
 */
export default function ConcludeCardModal({ isOpen, onClose, card, module, pipelineId, mode, onDone }: Props) {
  const motivos = useMotivosPerda();
  const conclude = useConcludeCard({ module, pipelineId });

  const [motivoId, setMotivoId] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMotivoId('');
      setObservacao('');
      setSubmitError(null);
    }
  }, [isOpen, card?.id, mode]);

  const isLost = mode === 'lost';
  const motivoRequired = isLost && (motivos.data?.length ?? 0) > 0;
  const canSubmit = !!card && !conclude.isPending && (!motivoRequired || !!motivoId);

  const title = useMemo(() => (isLost ? 'Marcar como Perdida' : 'Marcar como Ganha'), [isLost]);
  const accentClass = isLost
    ? 'bg-signal-danger hover:opacity-90'
    : 'bg-signal-success hover:opacity-90';

  const handleSubmit = async () => {
    if (!card) return;
    setSubmitError(null);
    try {
      await conclude.mutateAsync({
        cardId: card.id,
        payload: {
          status: mode,
          motivoPerdaId: isLost ? (motivoId || null) : null,
          observacao: observacao || undefined,
        },
      });
      onDone?.();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao concluir card');
    }
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-surface rounded-[8px] shadow-[var(--shadow-3)] w-full max-w-md mx-4 border border-border-1 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border-1">
          <div>
            <h2 className="text-lg font-black text-fg-1 tracking-tight">{title}</h2>
            <p className="text-[10px] text-fg-4 font-bold uppercase tracking-widest mt-0.5">{card.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-surface-2 rounded-[6px] transition-all text-fg-4 hover:text-fg-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isLost && (
            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                Motivo da Perda {motivoRequired && '*'}
              </label>
              <select
                value={motivoId}
                onChange={(e) => setMotivoId(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all appearance-none"
              >
                <option value="">Selecione um motivo</option>
                {(motivos.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
              {motivos.data && motivos.data.length === 0 && (
                <p className="text-[10px] text-fg-4 mt-1">Nenhum motivo cadastrado - continue sem motivo.</p>
              )}
            </div>
          )}

          <div>
            <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
              Observacao (opcional)
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold resize-none focus:ring-2 focus:ring-accent-primary/30 focus:outline-none"
              placeholder="Contexto adicional..."
            />
          </div>

          {submitError && (
            <div className="text-[11px] font-bold text-signal-danger bg-signal-danger/10 border border-signal-danger/30 rounded-[6px] px-3 py-2">
              {submitError}
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] text-xs font-bold text-fg-3 hover:bg-bg-surface-2 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-2.5 ${accentClass} text-fg-on-brand rounded-full text-xs font-black uppercase tracking-widest shadow-[var(--shadow-2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {conclude.isPending ? 'Salvando...' : isLost ? 'Confirmar Perda' : 'Confirmar Ganho'}
          </button>
        </div>
      </div>
    </div>
  );
}
