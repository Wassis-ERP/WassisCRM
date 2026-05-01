import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  DollarSign,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import DateField from '../components/DateField';
import ConcludeCardModal from '../components/kanban/ConcludeCardModal';
import { useCobranca, useUpdateCobranca } from '../hooks/useFinanceiroCobrancas';
import { usePipelineStages } from '../hooks/usePipelineStages';
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
 * Pagina de detalhe de uma Cobranca financeira (controle de inadimplencia).
 * Le de `public.financeiro_cobrancas`. Quando vinculada a oportunidade, mostra
 * dados do segurado. Permite edicao dos campos de parcela (JSONB), mover stage
 * e concluir (Quitado/Inadimplente).
 */
export default function FinanceiroDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cobrancaId = String(id ?? '');

  const detail = useCobranca(cobrancaId);
  const update = useUpdateCobranca();

  const rawRow = (detail.data as Record<string, unknown> | undefined) ?? undefined;
  const pipelineId = (rawRow?.pipeline_id as string | null | undefined) ?? undefined;
  const stagesQuery = usePipelineStages(pipelineId);

  const oportunidade = (rawRow?.oportunidades ?? null) as JoinOportunidade | null;
  const segurado = oportunidade?.segurados ?? null;
  const responsavel = (rawRow?.profiles ?? null) as JoinProfile | null;

  const [formData, setFormData] = useState({
    proximoFollowup: '',
    stageId: '',
    observacoes: '',
  });
  const [metaFields, setMetaFields] = useState<{
    valor_parcela: string;
    numero_parcela: string;
    total_parcelas: string;
    data_vencimento: string;
    dias_atraso: string;
    forma_pagamento: string;
  }>({
    valor_parcela: '',
    numero_parcela: '',
    total_parcelas: '',
    data_vencimento: '',
    dias_atraso: '',
    forma_pagamento: '',
  });
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
    const meta = (rawRow.metadata as Record<string, unknown> | null) ?? {};
    setMetaFields({
      valor_parcela: meta.valor_parcela !== undefined && meta.valor_parcela !== null ? String(meta.valor_parcela) : '',
      numero_parcela: meta.numero_parcela !== undefined && meta.numero_parcela !== null ? String(meta.numero_parcela) : '',
      total_parcelas: meta.total_parcelas !== undefined && meta.total_parcelas !== null ? String(meta.total_parcelas) : '',
      data_vencimento: (meta.data_vencimento as string | undefined) ?? '',
      dias_atraso: meta.dias_atraso !== undefined && meta.dias_atraso !== null ? String(meta.dias_atraso) : '',
      forma_pagamento: (meta.forma_pagamento as string | undefined) ?? '',
    });
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
        id: cobrancaId,
        pipelineId: (rawRow.pipeline_id as string | null) ?? null,
        stageId: (rawRow.stage_id as string | null) ?? null,
        status: (rawRow.status as CardStatus) ?? 'pending',
        title: oportunidade?.nome ?? 'Cobranca avulsa',
        responsavelId: (rawRow.responsavel_id as string | null) ?? null,
        raw: rawRow,
      }
    : null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleDiscard = () => {
    if (!rawRow) return;
    setFormData({
      proximoFollowup: (rawRow.proximo_followup as string | null) ?? '',
      stageId: (rawRow.stage_id as string | null) ?? '',
      observacoes: (rawRow.observacoes as string | null) ?? '',
    });
    const meta = (rawRow.metadata as Record<string, unknown> | null) ?? {};
    setMetaFields({
      valor_parcela: meta.valor_parcela !== undefined && meta.valor_parcela !== null ? String(meta.valor_parcela) : '',
      numero_parcela: meta.numero_parcela !== undefined && meta.numero_parcela !== null ? String(meta.numero_parcela) : '',
      total_parcelas: meta.total_parcelas !== undefined && meta.total_parcelas !== null ? String(meta.total_parcelas) : '',
      data_vencimento: (meta.data_vencimento as string | undefined) ?? '',
      dias_atraso: meta.dias_atraso !== undefined && meta.dias_atraso !== null ? String(meta.dias_atraso) : '',
      forma_pagamento: (meta.forma_pagamento as string | undefined) ?? '',
    });
    setSaveStatus('idle');
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError(null);

    const metadata: Record<string, unknown> = {};
    if (metaFields.valor_parcela) metadata.valor_parcela = Number(metaFields.valor_parcela.replace(',', '.'));
    if (metaFields.numero_parcela) metadata.numero_parcela = Number(metaFields.numero_parcela);
    if (metaFields.total_parcelas) metadata.total_parcelas = Number(metaFields.total_parcelas);
    if (metaFields.data_vencimento) metadata.data_vencimento = metaFields.data_vencimento;
    if (metaFields.dias_atraso) metadata.dias_atraso = Number(metaFields.dias_atraso);
    if (metaFields.forma_pagamento) metadata.forma_pagamento = metaFields.forma_pagamento;

    try {
      await update.mutateAsync({
        id: cobrancaId,
        patch: {
          proximo_followup: formData.proximoFollowup || null,
          stage_id: formData.stageId || null,
          observacoes: formData.observacoes || null,
          metadata: metadata as never,
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
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando cobranca...</p>
      </div>
    );
  }

  if (detail.isError || !rawRow) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-rose-500 font-bold uppercase tracking-widest text-xs">Cobranca nao encontrada</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  const clienteNome = segurado?.nome ?? oportunidade?.nome ?? 'Cobranca avulsa';
  const email = segurado?.email ?? '';
  const telefone = segurado?.telefone ?? '';
  const criadoPor = responsavel?.full_name ?? '-';
  const shortId = cobrancaId.slice(0, 8).toUpperCase();

  const valorParcelaNumeric = Number(metaFields.valor_parcela.replace(',', '.') || 0);
  const diasAtrasoNumeric = Number(metaFields.dias_atraso || 0);

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="relative z-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 md:-mx-8 md:px-8 mb-8 shadow-sm">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-200"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-500" /> #{shortId}
                  <span className="text-secondary text-base font-medium">| {clienteNome}</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Registrado por {criadoPor}
                  {metaFields.numero_parcela && metaFields.total_parcelas
                    ? ` - Parcela ${metaFields.numero_parcela}/${metaFields.total_parcelas}`
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isConcluded && (
                <>
                  {canWin && (
                    <button
                      onClick={() => setConcludeMode('won')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Check size={14} /> Quitado
                    </button>
                  )}
                  <button
                    onClick={() => setConcludeMode('lost')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <X size={14} /> Inadimplente
                  </button>
                </>
              )}

              {isConcluded && (
                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                  (rawRow.status as CardStatus) === 'won'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}>
                  {(rawRow.status as CardStatus) === 'won' ? 'Quitada' : 'Inadimplente'}
                </span>
              )}

              <button
                onClick={handleDiscard}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="bg-primary hover:opacity-90 active:scale-95 text-white px-8 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20 transition-all flex items-center gap-2 border border-primary/10 disabled:opacity-60"
              >
                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo!' : 'Salvar Alteracoes'}
              </button>
            </div>
          </div>

          <div className="py-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {funnelSteps.map((step, idx) => {
              const isActive = step.id === formData.stageId;
              const isPast = idx < safeCurrentIdx;
              return (
                <div key={step.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setFormData({ ...formData, stageId: step.id })}
                    className={`relative h-8 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                      isActive ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : isPast ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {isPast && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    {step.name}
                  </button>
                  {idx < funnelSteps.length - 1 && (
                    <div className={`h-[2px] w-4 ${isPast ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {saveError && <div className="pb-3 text-[11px] font-bold text-rose-600">{saveError}</div>}
        </div>
      </div>

      {oportunidade && (
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white dark:border-slate-800 shadow-xl shadow-emerald-500/10">
              {clienteNome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{clienteNome}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 font-bold">
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                  <Mail size={14} className="text-primary" /> {email || '-'}
                </span>
                <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                  <Phone size={14} className="text-primary" /> {telefone || '-'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => oportunidade.id && navigate(`/oportunidades/${oportunidade.id}`)}
            className="px-6 py-2.5 bg-white dark:bg-slate-800 text-primary border border-primary/20 dark:border-primary/40 rounded-xl text-sm font-black shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <ExternalLink size={16} /> Oportunidade Vinculada
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 animate-fade-in">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-slate-400">
              <FileText size={18} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Dados da Parcela</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Numero da Parcela</label>
                <input
                  type="text"
                  value={metaFields.numero_parcela}
                  onChange={(e) => setMetaFields({ ...metaFields, numero_parcela: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Total de Parcelas</label>
                <input
                  type="text"
                  value={metaFields.total_parcelas}
                  onChange={(e) => setMetaFields({ ...metaFields, total_parcelas: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Data de Vencimento</label>
                <DateField
                  value={metaFields.data_vencimento}
                  onChange={(v) => setMetaFields({ ...metaFields, data_vencimento: v })}
                  inputClassName="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Forma de Pagamento</label>
                <input
                  type="text"
                  value={metaFields.forma_pagamento}
                  onChange={(e) => setMetaFields({ ...metaFields, forma_pagamento: e.target.value })}
                  placeholder="Boleto, PIX, Cartao..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Tratativas</h3>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm h-32 resize-none focus:ring-primary focus:border-primary"
              placeholder="Contatos feitos, promessas de pagamento, acordos..."
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-slate-400">
              <DollarSign size={18} className="text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Valores</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Valor da Parcela (R$)</label>
                <input
                  type="text"
                  value={metaFields.valor_parcela}
                  onChange={(e) => setMetaFields({ ...metaFields, valor_parcela: e.target.value })}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xl font-black text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                />
                <p className="text-[10px] text-slate-400">{formatCurrency(valorParcelaNumeric)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dias em Atraso</label>
                <input
                  type="number"
                  value={metaFields.dias_atraso}
                  onChange={(e) => setMetaFields({ ...metaFields, dias_atraso: e.target.value })}
                  className={`w-full border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xl font-black focus:ring-primary focus:border-primary ${
                    diasAtrasoNumeric > 0
                      ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                  }`}
                />
                {diasAtrasoNumeric > 0 && (
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Em atraso</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Proximo Followup</label>
                <DateField
                  value={formData.proximoFollowup}
                  onChange={(v) => setFormData({ ...formData, proximoFollowup: v })}
                  inputClassName="bg-primary/5 dark:bg-primary/10 text-primary border border-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConcludeCardModal
        isOpen={!!concludeMode}
        card={cardForConclude}
        mode={concludeMode ?? 'won'}
        module="financeiro"
        pipelineId={(rawRow.pipeline_id as string | null) ?? ''}
        onClose={() => setConcludeMode(null)}
        onDone={() => detail.refetch()}
      />
    </div>
  );
}
