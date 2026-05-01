import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import DateField from './DateField';
import { supabase } from '../lib/supabase';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { useCreateCobranca } from '../hooks/useFinanceiroCobrancas';
import type { CreateCardModalProps } from '../modules/types';

interface OportunidadeLite {
  id: string;
  nome: string;
  segurado_nome: string | null;
}

function useOportunidadesLookup(searchTerm: string) {
  return useQuery({
    queryKey: ['oportunidades_lookup_cobranca', searchTerm],
    staleTime: 30_000,
    queryFn: async (): Promise<OportunidadeLite[]> => {
      let builder = supabase
        .from('oportunidades')
        .select('id, nome, segurados:segurado_id ( nome )')
        .order('created_at', { ascending: false })
        .limit(25);

      const term = searchTerm.trim();
      if (term) {
        builder = builder.ilike('nome', `%${term}%`);
      }

      const { data, error } = await builder;
      if (error) throw error;

      return (data ?? []).map((row) => {
        const r = row as unknown as { id: string; nome: string; segurados: { nome: string } | null };
        return { id: r.id, nome: r.nome, segurado_nome: r.segurados?.nome ?? null };
      });
    },
  });
}

/**
 * Modal de criacao de cobranca financeira.
 * Persiste em `public.financeiro_cobrancas`. A vinculacao com oportunidade/apolice
 * e OPCIONAL — permite registrar inadimplencia avulsa (requer migracao 007).
 */
export default function NovaCobrancaModal({ isOpen, onClose, pipelineId, onCreated }: CreateCardModalProps) {
  const stagesQuery = usePipelineStages(pipelineId);
  const createCobranca = useCreateCobranca();

  const [vinculaOportunidade, setVinculaOportunidade] = useState(true);
  const [oportunidadeSearch, setOportunidadeSearch] = useState('');
  const [selectedOportunidade, setSelectedOportunidade] = useState<OportunidadeLite | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const oportunidadesQuery = useOportunidadesLookup(oportunidadeSearch);

  const [proximoFollowup, setProximoFollowup] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // metadata JSONB
  const [valorParcelaStr, setValorParcelaStr] = useState('');
  const [numeroParcelaStr, setNumeroParcelaStr] = useState('');
  const [totalParcelasStr, setTotalParcelasStr] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [diasAtrasoStr, setDiasAtrasoStr] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');

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

  const parseMoneyBr = (value: string): number | null => {
    if (!value) return null;
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const parseInt10 = (value: string): number | null => {
    if (!value) return null;
    const n = Number(value.replace(/\D/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const resetForm = () => {
    setVinculaOportunidade(true);
    setOportunidadeSearch('');
    setSelectedOportunidade(null);
    setProximoFollowup('');
    setObservacoes('');
    setValorParcelaStr('');
    setNumeroParcelaStr('');
    setTotalParcelasStr('');
    setDataVencimento('');
    setDiasAtrasoStr('');
    setFormaPagamento('');
    setSubmitError(null);
  };

  const canSubmit =
    !!pipelineId &&
    !!(stagesQuery.data && stagesQuery.data.length > 0) &&
    (!vinculaOportunidade || !!selectedOportunidade) &&
    !createCobranca.isPending;

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!pipelineId || !stagesQuery.data?.length) {
      setSubmitError('Pipeline Financeiro nao configurado');
      return;
    }
    if (vinculaOportunidade && !selectedOportunidade) {
      setSubmitError('Selecione a apolice/oportunidade ou desmarque a vinculacao');
      return;
    }
    const firstStage = stagesQuery.data[0];

    const metadata: Record<string, unknown> = {};
    const valorParcela = parseMoneyBr(valorParcelaStr);
    const numeroParcela = parseInt10(numeroParcelaStr);
    const totalParcelas = parseInt10(totalParcelasStr);
    const diasAtraso = parseInt10(diasAtrasoStr);
    if (valorParcela !== null) metadata.valor_parcela = valorParcela;
    if (numeroParcela !== null) metadata.numero_parcela = numeroParcela;
    if (totalParcelas !== null) metadata.total_parcelas = totalParcelas;
    if (dataVencimento) metadata.data_vencimento = dataVencimento;
    if (diasAtraso !== null) metadata.dias_atraso = diasAtraso;
    if (formaPagamento) metadata.forma_pagamento = formaPagamento;

    try {
      const created = await createCobranca.mutateAsync({
        oportunidadeId: vinculaOportunidade ? selectedOportunidade?.id ?? null : null,
        pipelineId,
        stageId: firstStage.id,
        proximoFollowup: proximoFollowup || null,
        observacoes: observacoes || null,
        metadata,
      });
      onCreated?.(created.id);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar cobranca');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="fixed inset-0 z-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[720px] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Nova Cobranca</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Controle de inadimplencia e cobrancas avulsas
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setVinculaOportunidade(true)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                vinculaOportunidade ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'
              }`}
            >
              Vinculada a Apolice
            </button>
            <button
              type="button"
              onClick={() => { setVinculaOportunidade(false); setSelectedOportunidade(null); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                !vinculaOportunidade ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'
              }`}
            >
              Avulsa
            </button>
          </div>

          {vinculaOportunidade && (
            <div ref={searchRef} className="relative z-[60]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                Oportunidade / Apolice *
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por titulo da oportunidade..."
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
                    <div className="p-3 text-center text-[10px] text-rose-500 font-bold">Erro ao carregar oportunidades</div>
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
                    <div className="p-3 text-center text-[10px] text-slate-400 font-bold">Nenhuma oportunidade encontrada</div>
                  )}
                </div>
              )}
            </div>
          )}

          {!vinculaOportunidade && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Cobranca avulsa
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-300/80 mt-1">
                Requer migracao <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">007_fase2_5_cobranca_oportunidade_nullable.sql</code> aplicada no banco. Caso nao esteja, o insert falhara com erro de constraint.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor da Parcela</label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={valorParcelaStr}
                onChange={(e) => setValorParcelaStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Num. Parcela</label>
              <input
                type="text"
                placeholder="Ex: 3"
                value={numeroParcelaStr}
                onChange={(e) => setNumeroParcelaStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Parcelas</label>
              <input
                type="text"
                placeholder="Ex: 12"
                value={totalParcelasStr}
                onChange={(e) => setTotalParcelasStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <DateField
                label="Data de Vencimento"
                value={dataVencimento}
                onChange={setDataVencimento}
                inputClassName="text-xs"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Dias em Atraso</label>
              <input
                type="text"
                placeholder="Ex: 15"
                value={diasAtrasoStr}
                onChange={(e) => setDiasAtrasoStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Forma de Pagamento</label>
              <input
                type="text"
                placeholder="Boleto, PIX..."
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <DateField
              label="Proximo Followup"
              value={proximoFollowup}
              onChange={setProximoFollowup}
              inputClassName="text-xs"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Observacoes</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Tratativas, contatos, promessas de pagamento..."
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
            title={vinculaOportunidade && !selectedOportunidade ? 'Selecione a oportunidade ou marque como avulsa' : undefined}
            className="w-full max-w-[300px] py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createCobranca.isPending ? 'Salvando...' : 'Registrar Cobranca'}
          </button>
        </div>
      </div>
    </div>
  );
}
