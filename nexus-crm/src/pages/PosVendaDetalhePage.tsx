import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  LifeBuoy,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import DateField from '../components/DateField';
import ConcludeCardModal from '../components/kanban/ConcludeCardModal';
import { usePosVenda, useUpdatePosVenda } from '../hooks/usePosVendas';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { POS_VENDA_METADATA } from '../modules/pos_venda/fieldSchema';
import type { CardStatus, KanbanCard } from '../modules/types';

interface JoinSegurado {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
}

interface JoinOportunidade {
  id: string;
  nome: string;
  segurados: JoinSegurado | null;
  ramos: { id: string; nome: string } | null;
  seguradoras: { id: string; nome: string } | null;
}

interface JoinProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Detalhe de um registro de pos-venda (endosso/renovacao/cancelamento).
 * Edicao de campos core + metadata JSONB (tipo_demanda, data_referencia, motivo).
 */
export default function PosVendaDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const posVendaId = String(id ?? '');

  const detail = usePosVenda(posVendaId);
  const update = useUpdatePosVenda();

  const rawRow = (detail.data as Record<string, unknown> | undefined) ?? undefined;
  const pipelineId = (rawRow?.pipeline_id as string | null | undefined) ?? undefined;
  const stagesQuery = usePipelineStages(pipelineId);

  const oportunidade = (rawRow?.oportunidades ?? null) as JoinOportunidade | null;
  const segurado = oportunidade?.segurados ?? null;
  const responsavel = (rawRow?.profiles ?? null) as JoinProfile | null;

  const [formData, setFormData] = useState({ proximoFollowup: '', stageId: '', observacoes: '' });
  const [metaFields, setMetaFields] = useState<Record<string, unknown>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [concludeMode, setConcludeMode] = useState<Exclude<CardStatus, 'pending'> | null>(null);

  useEffect(() => {
    if (!rawRow) return;
    setFormData({
      proximoFollowup: (rawRow.proximo_followup as string | null) ?? '',
      stageId: (rawRow.stage_id as string | null) ?? '',
      observacoes: (rawRow.observacoes as string | null) ?? '',
    });
    setMetaFields((rawRow.metadata as Record<string, unknown> | null) ?? {});
  }, [rawRow]);

  const funnelSteps = stagesQuery.data ?? [];
  const currentIdx = useMemo(
    () => funnelSteps.findIndex((s) => s.id === formData.stageId),
    [funnelSteps, formData.stageId],
  );
  const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;
  const currentStage = funnelSteps.find((s) => s.id === formData.stageId);
  const canWin = !!currentStage?.is_win_eligible;
  const isConcluded = (rawRow?.status as CardStatus | undefined) !== 'pending' && !!rawRow?.status;

  const cardForConclude: KanbanCard | null = rawRow
    ? {
        id: posVendaId,
        pipelineId: (rawRow.pipeline_id as string | null) ?? null,
        stageId: (rawRow.stage_id as string | null) ?? null,
        status: (rawRow.status as CardStatus) ?? 'pending',
        title: oportunidade?.nome ?? 'Pos-Venda',
        responsavelId: (rawRow.responsavel_id as string | null) ?? null,
        raw: rawRow,
      }
    : null;

  const handleDiscard = () => {
    if (!rawRow) return;
    setFormData({
      proximoFollowup: (rawRow.proximo_followup as string | null) ?? '',
      stageId: (rawRow.stage_id as string | null) ?? '',
      observacoes: (rawRow.observacoes as string | null) ?? '',
    });
    setMetaFields((rawRow.metadata as Record<string, unknown> | null) ?? {});
    setSaveStatus('idle');
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await update.mutateAsync({
        id: posVendaId,
        patch: {
          proximo_followup: formData.proximoFollowup || null,
          stage_id: formData.stageId || null,
          observacoes: formData.observacoes || null,
          metadata: metaFields as never,
        },
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  if (detail.isLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-24">
        <p className="text-fg-4 font-bold uppercase tracking-widest text-xs">Carregando registro...</p>
      </div>
    );
  }

  if (detail.isError || !rawRow) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-signal-danger font-bold uppercase tracking-widest text-xs">Registro nao encontrado</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2 bg-bg-surface-2 text-fg-1 rounded-[10px] text-sm font-bold">
          Voltar
        </button>
      </div>
    );
  }

  const clienteNome = segurado?.nome ?? oportunidade?.nome ?? 'Pos-Venda';
  const email = segurado?.email ?? '';
  const telefone = segurado?.telefone ?? '';
  const criadoPor = responsavel?.full_name ?? '-';
  const shortId = posVendaId.slice(0, 8).toUpperCase();
  const tipoDemanda = metaFields.tipo_demanda ? String(metaFields.tipo_demanda) : null;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="relative z-0 bg-bg-surface backdrop-blur-md border-b border-border-1 -mx-4 px-4 md:-mx-8 md:px-8 mb-8 shadow-[var(--shadow-1)]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-bg-surface-2 rounded-[10px] text-fg-3 transition-colors border border-transparent hover:border-border-1">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-fg-1 flex items-center gap-2">
                  <LifeBuoy size={18} className="text-accent-primary" /> #{shortId}
                  <span className="text-fg-3 text-base font-medium">| {clienteNome}</span>
                </h1>
                <p className="text-[10px] text-fg-4 font-bold uppercase tracking-wider">
                  Registrado por {criadoPor}{tipoDemanda ? ` - ${tipoDemanda}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isConcluded && (
                <>
                  {canWin && (
                    <button onClick={() => setConcludeMode('won')} className="flex items-center gap-2 px-4 py-2.5 bg-signal-success/10 hover:bg-signal-success/20 border border-signal-success/20 text-signal-success rounded-full text-xs font-black uppercase tracking-widest transition-all">
                      <Check size={14} /> Concluido
                    </button>
                  )}
                  <button onClick={() => setConcludeMode('lost')} className="flex items-center gap-2 px-4 py-2.5 bg-signal-danger/10 hover:bg-signal-danger/20 border border-signal-danger/20 text-signal-danger rounded-full text-xs font-black uppercase tracking-widest transition-all">
                    <X size={14} /> Cancelado
                  </button>
                </>
              )}

              {isConcluded && (
                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                  (rawRow.status as CardStatus) === 'won'
                    ? 'bg-signal-success/10 text-signal-success border border-signal-success/20'
                    : 'bg-signal-danger/10 text-signal-danger border border-signal-danger/20'
                }`}>
                  {(rawRow.status as CardStatus) === 'won' ? 'Concluido' : 'Cancelado'}
                </span>
              )}

              <button onClick={handleDiscard} className="px-5 py-2.5 text-sm font-bold text-fg-3 hover:text-signal-danger hover:bg-signal-danger/10 rounded-[10px] transition-all">
                Descartar
              </button>
              <button onClick={handleSave} disabled={saveStatus === 'saving'} className="bg-accent-primary hover:bg-accent-primary-hover active:scale-95 text-fg-on-brand px-8 py-2.5 rounded-full text-sm font-black shadow-[var(--shadow-brand)] transition-all flex items-center gap-2 disabled:opacity-60">
                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : 'Salvar Alteracoes'}
              </button>
            </div>
          </div>

          <div className="py-3 border-t border-border-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {funnelSteps.map((step, idx) => {
              const isActive = step.id === formData.stageId;
              const isPast = idx < safeCurrentIdx;
              return (
                <div key={step.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setFormData({ ...formData, stageId: step.id })}
                    className={`relative h-8 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                      isActive ? 'bg-accent-primary text-fg-on-brand border-accent-primary shadow-[var(--shadow-brand)]'
                      : isPast ? 'bg-signal-success/10 text-signal-success border-signal-success/20 hover:bg-signal-success/20'
                      : 'bg-bg-surface-2 text-fg-4 border-border-1 hover:border-border-2'
                    }`}
                  >
                    {isPast && <div className="w-1.5 h-1.5 rounded-full bg-signal-success" />}
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-fg-on-brand" />}
                    {step.name}
                  </button>
                  {idx < funnelSteps.length - 1 && <div className={`h-[2px] w-4 ${isPast ? 'bg-signal-success/40' : 'bg-border-1'}`} />}
                </div>
              );
            })}
          </div>

          {saveError && <div className="pb-3 text-[11px] font-bold text-signal-danger">{saveError}</div>}
        </div>
      </div>

      {oportunidade && (
        <div className="bg-accent-primary-soft border border-accent-primary/10 rounded-[14px] p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[var(--shadow-1)]">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[14px] bg-gradient-to-br from-accent-primary to-brand-primary-deep flex items-center justify-center text-fg-on-brand text-2xl font-bold shadow-[var(--shadow-2)]">
              {clienteNome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-black text-fg-1 uppercase tracking-tight">{clienteNome}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-fg-3 font-bold">
                <span className="flex items-center gap-1.5 bg-bg-surface px-3 py-1 rounded-full shadow-[var(--shadow-1)]">
                  <Mail size={14} className="text-accent-primary" /> {email || '-'}
                </span>
                <span className="flex items-center gap-1.5 bg-bg-surface px-3 py-1 rounded-full shadow-[var(--shadow-1)]">
                  <Phone size={14} className="text-accent-primary" /> {telefone || '-'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => oportunidade.id && navigate(`/oportunidades/${oportunidade.id}`)} className="px-6 py-2.5 bg-bg-surface text-accent-primary border border-accent-primary/20 rounded-full text-sm font-black shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <ExternalLink size={16} /> Oportunidade Vinculada
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 animate-fade-in">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-bg-surface p-8 rounded-[14px] border border-border-1 shadow-[var(--shadow-1)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-fg-4 mb-6">Dados da Demanda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {POS_VENDA_METADATA.filter((f) => f.type !== 'textarea').map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] font-bold text-fg-3 uppercase">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={String(metaFields[field.key] ?? '')}
                      onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full bg-bg-surface-2 text-fg-1 border-border-1 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <DateField
                      value={String(metaFields[field.key] ?? '')}
                      onChange={(v) => setMetaFields((prev) => ({ ...prev, [field.key]: v }))}
                      inputClassName="bg-bg-surface-2 text-fg-1 border-border-1 rounded-xl"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(metaFields[field.key] ?? '')}
                      onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full bg-bg-surface-2 text-fg-1 border-border-1 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {POS_VENDA_METADATA.filter((f) => f.type === 'textarea').map((field) => (
              <div key={field.key} className="space-y-2 mt-6">
                <label className="text-[10px] font-bold text-fg-3 uppercase">{field.label}</label>
                <textarea
                  value={String(metaFields[field.key] ?? '')}
                  onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  rows={3}
                  className="w-full bg-bg-surface-2 text-fg-1 border-border-1 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="bg-bg-surface p-8 rounded-[14px] border border-border-1 shadow-[var(--shadow-1)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-fg-4 mb-4">Observacoes</h3>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full bg-bg-surface-2 text-fg-1 border-border-1 rounded-xl p-4 text-sm h-32 resize-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary focus:outline-none"
              placeholder="Anotacoes sobre a demanda..."
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-bg-surface p-8 rounded-[14px] border border-border-1 shadow-[var(--shadow-1)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-fg-4 mb-6">Agendamento</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-fg-3 uppercase">Proximo Followup</label>
              <DateField
                value={formData.proximoFollowup}
                onChange={(v) => setFormData({ ...formData, proximoFollowup: v })}
                inputClassName="bg-accent-primary-soft text-accent-primary border border-accent-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <ConcludeCardModal
        isOpen={!!concludeMode}
        card={cardForConclude}
        mode={concludeMode ?? 'won'}
        module="pos_venda"
        pipelineId={(rawRow.pipeline_id as string | null) ?? ''}
        onClose={() => setConcludeMode(null)}
        onDone={() => detail.refetch()}
      />
    </div>
  );
}
