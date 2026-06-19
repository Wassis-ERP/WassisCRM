import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Search, X } from 'lucide-react';
import DateField from './DateField';
import { supabase } from '../lib/supabase';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { useCreateEmissao } from '../hooks/useEmissoes';
import { EMISSAO_METADATA } from '../modules/emissao/fieldSchema';
import type { CreateCardModalProps } from '../modules/types';

interface OportunidadeLite {
  id: string;
  nome: string;
  segurado_nome: string | null;
}

function useOportunidadesLookup(searchTerm: string) {
  return useQuery({
    queryKey: ['oportunidades_lookup_emissao', searchTerm],
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
 * Modal fallback para criacao manual de emissao.
 * Em producao, emissoes sao criadas automaticamente via n8n quando uma
 * oportunidade e concluida como Ganho (Fase 4). Este modal deve ser usado
 * apenas para casos excepcionais (migracao manual, correcao).
 */
export default function NovaEmissaoModal({ isOpen, onClose, pipelineId, onCreated }: CreateCardModalProps) {
  const stagesQuery = usePipelineStages(pipelineId);
  const createEmissao = useCreateEmissao();

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
    !createEmissao.isPending;

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!pipelineId || !stagesQuery.data?.length) {
      setSubmitError('Pipeline de Emissao nao configurado');
      return;
    }
    if (!selectedOportunidade) {
      setSubmitError('Selecione a oportunidade ganha vinculada');
      return;
    }
    const firstStage = stagesQuery.data[0];

    try {
      const created = await createEmissao.mutateAsync({
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
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar emissao');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="fixed inset-0 z-0 bg-[var(--bg-overlay)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 my-auto bg-bg-surface rounded-[8px] shadow-[var(--shadow-3)] w-full max-w-[640px] border border-border-1 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border-1 sticky top-0 bg-bg-surface z-10">
          <div>
            <h2 className="text-lg font-black text-fg-1 tracking-tight">Nova Emissao</h2>
            <p className="text-[10px] text-fg-4 font-bold uppercase tracking-widest mt-0.5">Cadastro administrativo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-surface-2 rounded-[6px] transition-all text-fg-4 hover:text-fg-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-accent-primary-soft border border-accent-primary/20 rounded-[6px] p-3 flex gap-3">
            <Info size={16} className="text-accent-primary flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-accent-primary leading-relaxed">
              <strong className="font-black uppercase tracking-wider">Fluxo automatizado:</strong> em producao, emissoes sao criadas automaticamente quando uma oportunidade e concluida como <strong>Ganho</strong> (Fase 4 - n8n). Use este formulario apenas para casos excepcionais.
            </p>
          </div>

          <div ref={searchRef} className="relative z-[60]">
            <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
              Oportunidade Ganha *
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
              <input
                type="text"
                placeholder="Buscar oportunidade concluida como Ganho..."
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
                  <div className="p-3 text-center text-[10px] text-signal-danger font-bold">Erro ao carregar</div>
                ) : oportunidadesQuery.isLoading ? (
                  <div className="p-3 text-center text-[10px] text-fg-4 font-bold">Carregando...</div>
                ) : (oportunidadesQuery.data ?? []).length > 0 ? (
                  (oportunidadesQuery.data ?? []).map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => { setSelectedOportunidade(op); setShowSuggestions(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-accent-primary-soft transition-colors border-b border-border-1 last:border-0"
                    >
                      <p className="text-xs font-bold text-fg-1">{op.nome}</p>
                      <p className="text-[9px] text-fg-4">{op.segurado_nome ?? '-'}</p>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-[10px] text-fg-4 font-bold">
                    Nenhuma oportunidade ganha encontrada
                  </div>
                )}
              </div>
            )}
          </div>

          <DateField
            label="Proximo Followup"
            value={proximoFollowup}
            onChange={setProximoFollowup}
            inputClassName="text-xs"
          />

          <div className="bg-bg-surface-2 border border-border-1 rounded-[6px] p-3 space-y-3">
            <p className="text-[9px] font-black text-fg-4 uppercase tracking-widest">Metadata (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              {EMISSAO_METADATA.map((field) => (
                <div key={field.key}>
                  <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={String(metaFields[field.key] ?? '')}
                      onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(metaFields[field.key] ?? '')}
                      onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">Observacoes</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
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
            className="w-full max-w-[300px] py-3 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black uppercase tracking-widest hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createEmissao.isPending ? 'Salvando...' : 'Criar Emissao'}
          </button>
        </div>
      </div>
    </div>
  );
}
