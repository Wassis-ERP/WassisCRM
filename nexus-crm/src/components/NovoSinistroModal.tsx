import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import DateField from './DateField';
import { supabase } from '../lib/supabase';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { useCreateSinistro } from '../hooks/useSinistros';
import { SINISTRO_CORE_FIELDS, SINISTRO_METADATA_BY_RAMO } from '../modules/sinistro/fieldSchema';
import type { CreateCardModalProps } from '../modules/types';
import type { Database } from '../types/database';

type TipoSinistro = Database['public']['Enums']['tipo_sinistro'];

interface OportunidadeLite {
  id: string;
  nome: string;
  segurado_nome: string | null;
  ramo_nome: string | null;
}

/**
 * Hook interno para buscar oportunidades ativas do tenant com dados minimos
 * (segurado, ramo) para alimentar o select de vinculo do sinistro.
 */
function useOportunidadesLookup(searchTerm: string) {
  return useQuery({
    queryKey: ['oportunidades_lookup', searchTerm],
    staleTime: 30_000,
    queryFn: async (): Promise<OportunidadeLite[]> => {
      let builder = supabase
        .from('oportunidades')
        .select(`
          id,
          nome,
          segurados:segurado_id ( nome ),
          ramos:ramo_id ( nome )
        `)
        .order('created_at', { ascending: false })
        .limit(25);

      const term = searchTerm.trim();
      if (term) {
        builder = builder.ilike('nome', `%${term}%`);
      }

      const { data, error } = await builder;
      if (error) throw error;

      return (data ?? []).map((row: unknown) => {
        const r = row as unknown as {
          id: string;
          nome: string;
          segurados: { nome: string } | null;
          ramos: { nome: string } | null;
        };
        return {
          id: r.id,
          nome: r.nome,
          segurado_nome: r.segurados?.nome ?? null,
          ramo_nome: r.ramos?.nome ?? null,
        };
      });
    },
  });
}

const TIPO_SINISTRO_OPTIONS = SINISTRO_CORE_FIELDS.find((f) => f.key === 'tipo_sinistro')?.options ?? [];

/**
 * Modal de criacao de sinistro.
 * Persiste em `public.sinistros` com `tenant_id` + `responsavel_id` do usuario logado.
 * Metadata JSONB por ramo (placa, BO, oficina para Auto; tipo_dano para Residencial etc.)
 * e resolvido via ramo da oportunidade vinculada.
 */
export default function NovoSinistroModal({ isOpen, onClose, pipelineId, onCreated }: CreateCardModalProps) {
  const stagesQuery = usePipelineStages(pipelineId);
  const createSinistro = useCreateSinistro();

  const [oportunidadeSearch, setOportunidadeSearch] = useState('');
  const [selectedOportunidade, setSelectedOportunidade] = useState<OportunidadeLite | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const oportunidadesQuery = useOportunidadesLookup(oportunidadeSearch);

  const [numeroSinistro, setNumeroSinistro] = useState('');
  const [dataSinistro, setDataSinistro] = useState('');
  const [dataAviso, setDataAviso] = useState('');
  const [tipoSinistro, setTipoSinistro] = useState<TipoSinistro | ''>('');
  const [valorPrejuizoStr, setValorPrejuizoStr] = useState('');
  const [valorIndenizacaoStr, setValorIndenizacaoStr] = useState('');
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

  const metaFieldsForRamo = useMemo(() => {
    const ramo = selectedOportunidade?.ramo_nome;
    if (!ramo) return [];
    return SINISTRO_METADATA_BY_RAMO[ramo] ?? [];
  }, [selectedOportunidade]);

  const parseMoneyBr = (value: string): number | null => {
    if (!value) return null;
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const resetForm = () => {
    setOportunidadeSearch('');
    setSelectedOportunidade(null);
    setNumeroSinistro('');
    setDataSinistro('');
    setDataAviso('');
    setTipoSinistro('');
    setValorPrejuizoStr('');
    setValorIndenizacaoStr('');
    setObservacoes('');
    setMetaFields({});
    setSubmitError(null);
  };

  const canSubmit =
    !!selectedOportunidade &&
    !!pipelineId &&
    !!(stagesQuery.data && stagesQuery.data.length > 0) &&
    !createSinistro.isPending;

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!pipelineId || !stagesQuery.data?.length) {
      setSubmitError('Pipeline de Sinistros nao configurado');
      return;
    }
    if (!selectedOportunidade) {
      setSubmitError('Selecione a oportunidade/apolice vinculada');
      return;
    }
    const firstStage = stagesQuery.data[0];

    try {
      const created = await createSinistro.mutateAsync({
        oportunidadeId: selectedOportunidade.id,
        pipelineId,
        stageId: firstStage.id,
        numeroSinistro: numeroSinistro || null,
        dataSinistro: dataSinistro || null,
        dataAviso: dataAviso || null,
        tipoSinistro: tipoSinistro || null,
        valorPrejuizo: parseMoneyBr(valorPrejuizoStr),
        valorIndenizacao: parseMoneyBr(valorIndenizacaoStr),
        observacoes: observacoes || null,
        metadata: metaFields,
      });
      onCreated?.(created.id);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar sinistro');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="fixed inset-0 z-0 bg-[var(--bg-overlay)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 my-auto bg-bg-surface rounded-[8px] shadow-[var(--shadow-3)] w-full max-w-[720px] border border-border-1 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border-1 sticky top-0 bg-bg-surface z-10">
          <div>
            <h2 className="text-lg font-black text-fg-1 tracking-tight">Novo Sinistro</h2>
            <p className="text-[10px] text-fg-4 font-bold uppercase tracking-widest mt-0.5">
              Aviso de sinistro vinculado a uma apolice
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-surface-2 rounded-[6px] transition-all text-fg-4 hover:text-fg-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div ref={searchRef} className="relative z-[60]">
            <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
              Oportunidade / Apolice vinculada *
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
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
                className="w-full pl-9 pr-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all"
              />
            </div>
            {showSuggestions && !selectedOportunidade && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface border border-border-1 rounded-[6px] shadow-[var(--shadow-3)] z-[80] overflow-hidden max-h-[220px] overflow-y-auto">
                {oportunidadesQuery.isError ? (
                  <div className="p-3 text-center text-[10px] text-signal-danger font-bold">
                    Erro ao carregar oportunidades
                  </div>
                ) : oportunidadesQuery.isLoading ? (
                  <div className="p-3 text-center text-[10px] text-fg-4 font-bold">Carregando...</div>
                ) : (oportunidadesQuery.data ?? []).length > 0 ? (
                  (oportunidadesQuery.data ?? []).map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => {
                        setSelectedOportunidade(op);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-accent-primary-soft transition-colors border-b border-border-1 last:border-0"
                    >
                      <p className="text-xs font-bold text-fg-1">{op.nome}</p>
                      <p className="text-[9px] text-fg-4">
                        {op.segurado_nome ?? '-'}
                        {op.ramo_nome ? ` | ${op.ramo_nome}` : ''}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-[10px] text-fg-4 font-bold">
                    Nenhuma oportunidade encontrada
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                Numero do Sinistro
              </label>
              <input
                type="text"
                placeholder="Ex: SIN-2025-001"
                value={numeroSinistro}
                onChange={(e) => setNumeroSinistro(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                Tipo de Sinistro
              </label>
              <select
                value={tipoSinistro}
                onChange={(e) => setTipoSinistro(e.target.value as TipoSinistro | '')}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all appearance-none"
              >
                <option value="">Selecione</option>
                {TIPO_SINISTRO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <DateField
                label="Data do Sinistro"
                value={dataSinistro}
                onChange={setDataSinistro}
                inputClassName="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <DateField
                label="Data do Aviso"
                value={dataAviso}
                onChange={setDataAviso}
                inputClassName="text-xs"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                Valor de Prejuizo
              </label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={valorPrejuizoStr}
                onChange={(e) => setValorPrejuizoStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                Valor de Indenizacao
              </label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={valorIndenizacaoStr}
                onChange={(e) => setValorIndenizacaoStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          {metaFieldsForRamo.length > 0 && (
            <div className="bg-bg-surface-2 border border-border-1 rounded-[6px] p-3 space-y-3">
              <p className="text-[9px] font-black text-fg-4 uppercase tracking-widest">
                Campos de {selectedOportunidade?.ramo_nome}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {metaFieldsForRamo.map((field) => (
                  <div key={field.key}>
                    <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                      {field.label}
                    </label>
                    {field.type === 'boolean' ? (
                      <label className="flex items-center gap-2 px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px]">
                        <input
                          type="checkbox"
                          checked={!!metaFields[field.key]}
                          onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.checked }))}
                        />
                        <span className="text-[10px] font-bold text-fg-3">Sim</span>
                      </label>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={String(metaFields[field.key] ?? '')}
                        onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(metaFields[field.key] ?? '')}
                        onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
              Observacoes
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Descreva o ocorrido..."
              className="w-full px-3 py-2 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold resize-none focus:ring-2 focus:ring-accent-primary/30 focus:outline-none"
            />
          </div>

          {submitError && (
            <div className="text-[11px] font-bold text-signal-danger bg-signal-danger/10 border border-signal-danger/30 rounded-[6px] px-3 py-2">
              {submitError}
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            title={!selectedOportunidade ? 'Selecione a oportunidade vinculada' : undefined}
            className="w-full max-w-[300px] py-3 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black uppercase tracking-widest hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createSinistro.isPending ? 'Salvando...' : 'Registrar Sinistro'}
          </button>
        </div>
      </div>
    </div>
  );
}
