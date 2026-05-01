import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Check,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  History,
  LayoutGrid,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Shield,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import DateField from '../components/DateField';
import ConcludeCardModal from '../components/kanban/ConcludeCardModal';
import { getDateStatus } from '../utils/date';
import { useOportunidade, useUpdateOportunidade } from '../hooks/useOportunidades';
import { useOrigens, useRamos, useSeguradoras } from '../hooks/useLookups';
import { usePipelineStages } from '../hooks/usePipelineStages';
import type { CardStatus, KanbanCard } from '../modules/types';
import type { Database } from '../types/database';

type TipoNegocio = Database['public']['Enums']['tipo_negocio'];

interface JoinRecord {
  id: string;
  nome?: string | null;
}

interface JoinSegurado {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
}

interface JoinProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Pagina de detalhe de Oportunidade (modulo Comercial).
 * Le dados de `oportunidades` + joins (segurados, ramos, origens, seguradoras,
 * profiles) no Supabase. Salva alteracoes via `useUpdateOportunidade`.
 */
export default function OportunidadeDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const opportunityId = String(id ?? '');

  const detail = useOportunidade(opportunityId);
  const ramos = useRamos();
  const origens = useOrigens();
  const seguradoras = useSeguradoras();
  const update = useUpdateOportunidade();

  const rawRow = detail.data as (Record<string, unknown> | undefined) ?? undefined;
  const pipelineId = (rawRow?.pipeline_id as string | null | undefined) ?? undefined;
  const stagesQuery = usePipelineStages(pipelineId);

  const segurado = (rawRow?.segurados ?? null) as JoinSegurado | null;
  const responsavel = (rawRow?.profiles ?? null) as JoinProfile | null;
  const ramoJoin = (rawRow?.ramos ?? null) as JoinRecord | null;
  const seguradoraJoin = (rawRow?.seguradoras ?? null) as JoinRecord | null;
  const origemJoin = (rawRow?.origens ?? null) as JoinRecord | null;

  const [activeTab, setActiveTab] = useState('orcamento');
  const [formData, setFormData] = useState({
    ramoId: '' as string,
    tipoNegocio: '' as TipoNegocio | '',
    seguradoraId: '' as string,
    vigenciaInicio: '' as string,
    vigenciaFim: '' as string,
    origemId: '' as string,
    proximoFollowup: '' as string,
    stageId: '' as string,
    premioLiquido: 0,
    comissaoPercent: 15,
    observacoes: '' as string,
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [concludeMode, setConcludeMode] = useState<Exclude<CardStatus, 'pending'> | null>(null);

  useEffect(() => {
    if (!rawRow) return;
    setFormData({
      ramoId: (rawRow.ramo_id as string | null) ?? '',
      tipoNegocio: (rawRow.tipo_negocio as TipoNegocio | null) ?? '',
      seguradoraId: (rawRow.seguradora_id as string | null) ?? '',
      vigenciaInicio: (rawRow.vigencia_inicio as string | null) ?? '',
      vigenciaFim: (rawRow.vigencia_fim as string | null) ?? '',
      origemId: (rawRow.origem_id as string | null) ?? '',
      proximoFollowup: (rawRow.proximo_followup as string | null) ?? '',
      stageId: (rawRow.stage_id as string | null) ?? '',
      premioLiquido: (rawRow.premio_liquido as number | null) ?? 0,
      comissaoPercent: (rawRow.comissao_percentual as number | null) ?? 15,
      observacoes: (rawRow.observacoes as string | null) ?? '',
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

  // KanbanCard minimo para alimentar o ConcludeCardModal a partir da pagina de detalhe.
  const cardForConclude: KanbanCard | null = rawRow
    ? {
        id: opportunityId,
        pipelineId: (rawRow.pipeline_id as string | null) ?? null,
        stageId: (rawRow.stage_id as string | null) ?? null,
        status: (rawRow.status as CardStatus) ?? 'pending',
        title: (rawRow.nome as string) ?? '',
        responsavelId: (rawRow.responsavel_id as string | null) ?? null,
        raw: rawRow,
      }
    : null;

  const comissaoValor = (formData.premioLiquido * formData.comissaoPercent) / 100;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const followUpStatus = getDateStatus(formData.proximoFollowup);
  const followUpBorderClass =
    followUpStatus === 'today' ? 'border-blue-500/60 dark:border-blue-400/50'
    : followUpStatus === 'overdue' ? 'border-red-500/70 dark:border-red-400/50'
    : 'border-primary/20 dark:border-primary/10';

  const tabs = [
    { id: 'orcamento', label: 'Orcamento', icon: FileText },
    { id: 'produtores', label: 'Produtores', icon: Users },
    { id: 'anexos_logs', label: 'Anexos e logs', icon: Download },
    { id: 'comentarios', label: 'Comentarios', icon: MessageSquare },
    { id: 'oportunidades', label: 'Oportunidades', icon: LayoutGrid },
  ];

  const handleDiscard = () => {
    if (!rawRow) return;
    setFormData({
      ramoId: (rawRow.ramo_id as string | null) ?? '',
      tipoNegocio: (rawRow.tipo_negocio as TipoNegocio | null) ?? '',
      seguradoraId: (rawRow.seguradora_id as string | null) ?? '',
      vigenciaInicio: (rawRow.vigencia_inicio as string | null) ?? '',
      vigenciaFim: (rawRow.vigencia_fim as string | null) ?? '',
      origemId: (rawRow.origem_id as string | null) ?? '',
      proximoFollowup: (rawRow.proximo_followup as string | null) ?? '',
      stageId: (rawRow.stage_id as string | null) ?? '',
      premioLiquido: (rawRow.premio_liquido as number | null) ?? 0,
      comissaoPercent: (rawRow.comissao_percentual as number | null) ?? 15,
      observacoes: (rawRow.observacoes as string | null) ?? '',
    });
    setSaveStatus('idle');
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await update.mutateAsync({
        id: opportunityId,
        patch: {
          ramo_id: formData.ramoId || null,
          tipo_negocio: formData.tipoNegocio || null,
          seguradora_id: formData.seguradoraId || null,
          vigencia_inicio: formData.vigenciaInicio || null,
          vigencia_fim: formData.vigenciaFim || null,
          origem_id: formData.origemId || null,
          proximo_followup: formData.proximoFollowup || null,
          stage_id: formData.stageId || null,
          premio_liquido: formData.premioLiquido || null,
          comissao_percentual: formData.comissaoPercent || null,
          observacoes: formData.observacoes || null,
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
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando oportunidade...</p>
      </div>
    );
  }

  if (detail.isError || !rawRow) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-rose-500 font-bold uppercase tracking-widest text-xs">Oportunidade nao encontrada</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  const clienteNome = segurado?.nome ?? (rawRow.nome as string);
  const email = segurado?.email ?? '';
  const telefone = segurado?.telefone ?? '';
  const origemLabel = origemJoin?.nome ?? '-';
  const criadoPor = responsavel?.full_name ?? '-';
  const shortId = opportunityId.slice(0, 8).toUpperCase();

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
                  #{shortId}
                  <span className="text-secondary text-base font-medium">| {clienteNome}</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Originado via {origemLabel} - Por {criadoPor}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Comissao Estimada</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(comissaoValor)}</span>
              </div>

              {!isConcluded && (
                <>
                  {canWin && (
                    <button
                      onClick={() => setConcludeMode('won')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Check size={14} /> Ganho
                    </button>
                  )}
                  <button
                    onClick={() => setConcludeMode('lost')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <X size={14} /> Perdido
                  </button>
                </>
              )}

              {isConcluded && (
                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                  (rawRow.status as CardStatus) === 'won'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}>
                  {(rawRow.status as CardStatus) === 'won' ? 'Ganha' : 'Perdida'}
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

          {saveError && (
            <div className="pb-3 text-[11px] font-bold text-rose-600">{saveError}</div>
          )}
        </div>
      </div>

      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-2xl font-bold border-2 border-white dark:border-slate-800 shadow-xl shadow-primary/10">
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
          onClick={() => segurado?.id && navigate(`/segurados/${segurado.id}`)}
          className="px-6 py-2.5 bg-white dark:bg-slate-800 text-primary border border-primary/20 dark:border-primary/40 rounded-xl text-sm font-black shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <ExternalLink size={16} /> Detalhes do Segurado
        </button>
      </div>

      <div className="mb-8 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-8 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'orcamento' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-slate-400">
                <Shield size={18} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Resumo do Orcamento</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Ramo do Seguro</label>
                  <select
                    value={formData.ramoId}
                    onChange={(e) => setFormData({ ...formData, ramoId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-primary focus:border-primary"
                  >
                    <option value="">Selecione</option>
                    {(ramos.data ?? []).map((r) => (
                      <option key={r.id} value={r.id}>{r.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo de Seguro</label>
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {(['novo', 'renovacao', 'endosso'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setFormData({ ...formData, tipoNegocio: tipo })}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize ${
                          formData.tipoNegocio === tipo ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Seguradora</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={formData.seguradoraId}
                      onChange={(e) => setFormData({ ...formData, seguradoraId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="">Selecione</option>
                      {(seguradoras.data ?? []).map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Inicio de Vigencia</label>
                  <DateField
                    value={formData.vigenciaInicio}
                    onChange={(v) => setFormData({ ...formData, vigenciaInicio: v })}
                    inputClassName="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Termino de Vigencia</label>
                  <DateField
                    value={formData.vigenciaFim}
                    onChange={(v) => setFormData({ ...formData, vigenciaFim: v })}
                    inputClassName="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-slate-400">
                <TrendingUp size={18} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Origem e Agendamento</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Origem do Lead</label>
                  <select
                    value={formData.origemId}
                    onChange={(e) => setFormData({ ...formData, origemId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm focus:ring-primary focus:border-primary"
                  >
                    <option value="">Selecione</option>
                    {(origens.data ?? []).map((o) => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Proximo Follow-up</label>
                  <DateField
                    value={formData.proximoFollowup}
                    onChange={(v) => setFormData({ ...formData, proximoFollowup: v })}
                    inputClassName={`bg-primary/5 dark:bg-primary/10 text-primary border ${followUpBorderClass}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-8 text-slate-400">
                <DollarSign size={18} className="text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Projecao Financeira</h3>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Premio Liquido (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      value={formData.premioLiquido}
                      onChange={(e) => setFormData({ ...formData, premioLiquido: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-slate-900 dark:text-white focus:ring-primary focus:border-primary transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Valor base para o calculo da comissao.</p>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Comissao (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.comissaoPercent}
                          onChange={(e) => setFormData({ ...formData, comissaoPercent: Number(e.target.value) })}
                          className="w-16 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-lg font-bold focus:ring-primary"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:border-slate-700"></div>
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Comissao</label>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(comissaoValor)}
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${formData.comissaoPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Notas da Oportunidade</h3>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm h-32 resize-none focus:ring-primary focus:border-primary"
                placeholder="Adicione observacoes importantes sobre a negociacao..."
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'produtores' && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold text-lg">
                {(responsavel?.full_name ?? '?').split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsavel</p>
                <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{responsavel?.full_name ?? '-'}</h4>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80 mx-2 transition-all">
            <Plus size={16} /> Vincular Outro Produtor
          </button>
        </div>
      )}

      {activeTab === 'anexos_logs' && (
        <div className="animate-fade-in bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <History size={18} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Anexos e Logs</h3>
          </div>
          <p className="text-xs text-slate-400 italic">Modulo em construcao.</p>
        </div>
      )}

      {activeTab === 'comentarios' && (
        <div className="animate-fade-in bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <MessageSquare size={18} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Comentarios Internos</h3>
          </div>
          <p className="text-xs text-slate-400 italic">Modulo em construcao.</p>
        </div>
      )}

      {activeTab === 'oportunidades' && (
        <div className="animate-fade-in bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <LayoutGrid size={18} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Historico de Oportunidades do Cliente</h3>
          </div>
          <p className="text-xs text-slate-400 italic">Modulo em construcao.</p>
        </div>
      )}

      {/* ramoJoin/seguradoraJoin referenciados para futuras melhorias (ex.: exibicao read-only do valor atual) */}
      <span className="hidden">{ramoJoin?.nome} {seguradoraJoin?.nome}</span>

      <ConcludeCardModal
        isOpen={!!concludeMode}
        card={cardForConclude}
        mode={concludeMode ?? 'won'}
        module="comercial"
        pipelineId={(rawRow.pipeline_id as string | null) ?? ''}
        onClose={() => setConcludeMode(null)}
        onDone={() => detail.refetch()}
      />
    </div>
  );
}
