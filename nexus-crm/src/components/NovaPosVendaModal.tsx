import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Search, X } from 'lucide-react';
import DateField from './DateField';
import { supabase } from '../lib/supabase';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { useCreatePosVenda } from '../hooks/usePosVendas';
import { POS_VENDA_METADATA } from '../modules/pos_venda/fieldSchema';
import type { CreateCardModalProps } from '../modules/types';

interface OportunidadeLite {
  id: string;
  nome: string;
  segurado_nome: string | null;
}

function useOportunidadesLookup(searchTerm: string) {
  return useQuery({
    queryKey: ['oportunidades_lookup_pos_venda', searchTerm],
    staleTime: 30_000,
    queryFn: async (): Promise<OportunidadeLite[]> => {
      let builder = supabase
        .from('oportunidades')
        .select('id, nome, segurados:segurado_id ( nome )')
        .eq('status', 'won')
        .order('created_at', { ascending: false })
        .limit(25);

      const term = searchTerm.trim();
      if (term) builder = builder.ilike('nome', `%${term}%`);

      const { data, error } = await builder;
      if (error) throw error;

      return (data ?? []).map((row: unknown) => {
        const r = row as unknown as { id: string; nome: string; segurados: { nome: string } | null };
        return { id: r.id, nome: r.nome, segurado_nome: r.segurados?.nome ?? null };
      });
    },
  });
}

/**
 * Modal fallback para criacao manual de registro de pos-venda.
 * Em producao, o fluxo primario sera via n8n apos emissao (Fase 4). Este
 * modal cobre os cenarios excepcionais e revisao administrativa.
 */
export default function NovaPosVendaModal({ isOpen, onClose, pipelineId, onCreated }: CreateCardModalProps) {
  const stagesQuery = usePipelineStages(pipelineId);
  const createPosVenda = useCreatePosVenda();

  const [oportunidadeSearch, setOportunidadeSearch] = useState('');
  const [selectedOportunidade, setSelectedOportunidade] = useState<OportunidadeLite | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const oportunidadesQuery = useOportunidadesLookup(oportunidadeSearch);

  const [proximoFollowup, setProximoFollowup] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [metaFields, setMetaFields] = useState<Record<string, unknown>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const resetForm = () => {
    setOportunidadeSearch('');
    setSelectedOportunidade(null);
    setProximoFollowup('');
    setObservacoes('');
    setMetaFields({});
    setSubmitError(null);
  };

  const canSubmit =
    !!selectedOportunidade &&
    !!pipelineId &&
    !!(stagesQuery.data && stagesQuery.data.length > 0) &&
    !createPosVenda.isPending;

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!pipelineId || !stagesQuery.data?.length) {
      setSubmitError('Pipeline de Pos-Venda nao configurado');
      return;
    }
    if (!selectedOportunidade) {
      setSubmitError('Selecione a oportunidade/apolice vinculada');
      return;
    }
    const firstStage = stagesQuery.data[0];

    try {
      const created = await createPosVenda.mutateAsync({
        oportunidadeId: selectedOportunidade.id,
        pipelineId,
        stageId: firstStage.id,
        proximoFollowup: proximoFollowup || null,
        observacoes: observacoes || null,
        metadata: metaFields,
      });
      onCreated?.(created.id);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar pos-venda');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="fixed inset-0 z-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[640px] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Nova Demanda de Pos-Venda</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Endosso, renovacao ou cancelamento</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex gap-3">
            <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary/90 leading-relaxed">
              <strong className="font-black uppercase tracking-wider">Fluxo automatizado:</strong> em producao, registros de pos-venda sao criados automaticamente apos emissao ou por trigger de renovacao (Fase 4 - n8n). Use este formulario apenas para casos excepcionais.
            </p>
          </div>

          <div ref={searchRef} className="relative z-[60]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
              Oportunidade / Apolice *
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar apolice..."
                value={selectedOportunidade ? `${selectedOportunidade.nome}${selectedOportunidade.segurado_nome ? ` - ${selectedOportunidade.segurado_nome}` : ''}` : oportunidadeSearch}
                onChange={(e) => {
                  if (selectedOportunidade) setSelectedOportunidade(null);
                  setOportunidadeSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            {showSuggestions && !selectedOportunidade && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[80] overflow-hidden max-h-[220px] overflow-y-auto">
                {oportunidadesQuery.isError ? (
                  <div className="p-3 text-center text-[10px] text-rose-500 font-bold">Erro ao carregar</div>
                ) : oportunidadesQuery.isLoading ? (
                  <div className="p-3 text-center text-[10px] text-slate-400 font-bold">Carregando...</div>
                ) : (oportunidadesQuery.data ?? []).length > 0 ? (
                  (oportunidadesQuery.data ?? []).map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => { setSelectedOportunidade(op); setShowSuggestions(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{op.nome}</p>
                      <p className="text-[9px] text-slate-400">{op.segurado_nome ?? '-'}</p>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-[10px] text-slate-400 font-bold">
                    Nenhuma oportunidade ganha encontrada
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {POS_VENDA_METADATA.filter((f) => f.type !== 'textarea').map((field) => (
              <div key={field.key}>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={String(metaFields[field.key] ?? '')}
                    onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
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
                    inputClassName="text-xs"
                  />
                ) : (
                  <input
                    type="text"
                    value={String(metaFields[field.key] ?? '')}
                    onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                )}
              </div>
            ))}
          </div>

          {POS_VENDA_METADATA.filter((f) => f.type === 'textarea').map((field) => (
            <div key={field.key}>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                {field.label}
              </label>
              <textarea
                value={String(metaFields[field.key] ?? '')}
                onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold resize-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ))}

          <DateField
            label="Proximo Followup"
            value={proximoFollowup}
            onChange={setProximoFollowup}
            inputClassName="text-xs"
          />

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Observacoes</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold resize-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {submitError && (
            <div className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {submitError}
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full max-w-[300px] py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createPosVenda.isPending ? 'Salvando...' : 'Criar Demanda'}
          </button>
        </div>
      </div>
    </div>
  );
}
