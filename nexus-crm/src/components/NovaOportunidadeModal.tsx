import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import DateField from './DateField';
import { useActivePipeline } from '../hooks/useActivePipeline';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { useOrigens, useRamos, useSeguradoras } from '../hooks/useLookups';
import { useCreateSegurado, useSegurados } from '../hooks/useSegurados';
import { useCreateOportunidade } from '../hooks/useOportunidades';
import { COMERCIAL_METADATA_BY_RAMO, COMERCIAL_METADATA_FLAGS } from '../modules/comercial/fieldSchema';
import type { Database } from '../types/database';

/**
 * Tipo legado exportado apenas por compatibilidade com componentes que ainda o
 * importam. Apos o Micro 4 completo esta interface sera removida e os
 * consumidores passarao a trabalhar com `KanbanCard`.
 */
export interface Oportunidade {
  id: string;
  nome: string;
  seguradoId: string;
  seguradoNome: string;
  origem: string;
  premioLiquido: string;
  ramo: string;
  comissao: string;
  seguroNovo: string;
  seguradora: string;
  vigencia: string;
  vigenciaFim?: string;
  retorno: string;
  etapa: string;
  status: string;
  produtor: string;
  criadoEm: string;
  notas?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

/**
 * Modal de criacao de oportunidade (modulo Comercial).
 * Persiste em `public.oportunidades` com `tenant_id` + `responsavel_id` do usuario logado.
 * Aceita campos dinamicos por ramo, que vao para `metadata` (jsonb).
 */
export default function NovaOportunidadeModal({ isOpen, onClose, onCreated }: Props) {
  const ramos = useRamos();
  const origens = useOrigens();
  const seguradoras = useSeguradoras();
  const segurados = useSegurados();
  const createSegurado = useCreateSegurado();
  const createOportunidade = useCreateOportunidade();
  const { active: activePipeline } = useActivePipeline('comercial');
  const stagesQuery = usePipelineStages(activePipeline?.id);

  const [nome, setNome] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedSeguradoId, setSelectedSeguradoId] = useState('');
  const [selectedSeguradoNome, setSelectedSeguradoNome] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteDoc, setNovoClienteDoc] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [ramoId, setRamoId] = useState<string>('');
  const [origemId, setOrigemId] = useState<string>('');
  const [seguradoraId, setSeguradoraId] = useState<string>('');
  const [tipoNegocio, setTipoNegocio] = useState<Database['public']['Enums']['tipo_negocio'] | ''>('');
  const [premioLiquidoStr, setPremioLiquidoStr] = useState('');
  const [comissaoStr, setComissaoStr] = useState('');
  const [vigencia, setVigencia] = useState('');
  const [retorno, setRetorno] = useState('');
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

  const selectedRamoName = useMemo(
    () => ramos.data?.find((r) => r.id === ramoId)?.nome ?? '',
    [ramos.data, ramoId],
  );
  const metaFieldsForRamo = selectedRamoName ? (COMERCIAL_METADATA_BY_RAMO[selectedRamoName] ?? []) : [];

  const filteredSegurados = useMemo(() => {
    const all = segurados.data ?? [];
    const term = clienteSearch.trim().toLowerCase();
    if (!term) return all.slice(0, 20);
    return all
      .filter(
        (s) =>
          s.nome.toLowerCase().includes(term) ||
          (s.cpf_cnpj ?? '').toLowerCase().replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
          (s.cpf_cnpj ?? '').toLowerCase().includes(term),
      )
      .slice(0, 20);
  }, [segurados.data, clienteSearch]);

  const handleSelectSegurado = (s: { id: string; nome: string }) => {
    setSelectedSeguradoId(s.id);
    setSelectedSeguradoNome(s.nome);
    setClienteSearch(s.nome);
    setShowSuggestions(false);
  };

  const handleCriarNovoCliente = async () => {
    if (!novoClienteNome.trim()) return;
    try {
      const created = await createSegurado.mutateAsync({
        nome: novoClienteNome,
        cpf_cnpj: novoClienteDoc,
        telefone: novoClienteTelefone,
      });
      setSelectedSeguradoId(created.id);
      setSelectedSeguradoNome(created.nome);
      setClienteSearch(created.nome);
      setShowNovoCliente(false);
      setNovoClienteNome('');
      setNovoClienteDoc('');
      setNovoClienteTelefone('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar segurado');
    }
  };

  const parseMoneyBr = (value: string): number | null => {
    if (!value) return null;
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const parsePercent = (value: string): number | null => {
    if (!value) return null;
    const cleaned = value.replace('%', '').replace(',', '.').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const resetForm = () => {
    setNome(''); setClienteSearch(''); setSelectedSeguradoId(''); setSelectedSeguradoNome('');
    setRamoId(''); setOrigemId(''); setSeguradoraId('');
    setTipoNegocio(''); setPremioLiquidoStr(''); setComissaoStr('');
    setVigencia(''); setRetorno('');
    setMetaFields({});
    setShowNovoCliente(false);
    setSubmitError(null);
  };

  /** Pelo menos titulo OU cliente; sempre data de retorno; pipeline com etapas. */
  const hasTituloOuCliente = !!nome.trim() || !!selectedSeguradoId;
  const hasRetorno = !!retorno.trim();
  const canSubmit =
    hasTituloOuCliente &&
    hasRetorno &&
    !!activePipeline &&
    !!(stagesQuery.data && stagesQuery.data.length > 0) &&
    !createOportunidade.isPending;

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!activePipeline || !stagesQuery.data?.length) {
      setSubmitError('Pipeline Comercial nao configurado');
      return;
    }
    const firstStage = stagesQuery.data[0];

    try {
      const tituloPersistido =
        nome.trim() ||
        selectedSeguradoNome.trim() ||
        'Nova oportunidade';

      const created = await createOportunidade.mutateAsync({
        nome: tituloPersistido,
        pipelineId: activePipeline.id,
        stageId: firstStage.id,
        seguradoId: selectedSeguradoId || null,
        ramoId: ramoId || null,
        seguradoraId: seguradoraId || null,
        origemId: origemId || null,
        tipoNegocio: tipoNegocio || null,
        premioLiquido: parseMoneyBr(premioLiquidoStr),
        comissaoPercentual: parsePercent(comissaoStr),
        vigenciaInicio: vigencia || null,
        proximoFollowup: retorno || null,
        metadata: metaFields,
      });
      onCreated?.(created.id);
      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar oportunidade');
    }
  };

  const handleClienteSearchChange = (v: string) => {
    const matchesSelected =
      !!selectedSeguradoId &&
      !!selectedSeguradoNome &&
      v.trim().toLowerCase() === selectedSeguradoNome.trim().toLowerCase();
    if (selectedSeguradoId && !matchesSelected) {
      setSelectedSeguradoId('');
      setSelectedSeguradoNome('');
    }
    setClienteSearch(v);
    setShowSuggestions(true);
  };

  /** Painel visivel sempre que o campo de cliente esta em modo "sugestoes" (foco ou digitacao). */
  const showClientePanel = showSuggestions;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="fixed inset-0 z-0 bg-[var(--bg-overlay)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 my-auto bg-bg-surface rounded-[14px] shadow-[var(--shadow-3)] w-full max-w-[720px] border border-border-1 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border-1 sticky top-0 bg-bg-surface z-10">
          <div>
            <h2 className="text-lg font-black text-fg-1 tracking-tight">Nova Oportunidade</h2>
            <p className="text-[10px] text-fg-4 font-bold uppercase tracking-widest mt-0.5">
              {activePipeline ? `Pipeline: ${activePipeline.name}` : 'Carregando pipeline...'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-surface-2 rounded-[10px] transition-all text-fg-4 hover:text-fg-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
              Titulo da oportunidade <span className="text-fg-4 font-bold normal-case">(opcional se houver cliente)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Carro Corolla do Seu Jose"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-sm font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none focus:border-accent-primary/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div ref={searchRef} className="relative z-[60]">
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                Cliente <span className="text-fg-4 font-bold normal-case">(opcional se houver titulo)</span>
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                <input
                  type="text"
                  placeholder="Buscar nome ou documento..."
                  value={clienteSearch}
                  onChange={(e) => handleClienteSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-9 pr-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all"
                />
              </div>
              {showClientePanel && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface border border-border-1 rounded-[10px] shadow-[var(--shadow-3)] z-[80] overflow-hidden max-h-[220px] overflow-y-auto">
                  {segurados.isError ? (
                    <div className="p-3 text-center text-[10px] text-signal-danger font-bold">
                      Erro ao carregar clientes. Verifique sessao e permissoes.
                    </div>
                  ) : segurados.isLoading || segurados.isFetching ? (
                    <div className="p-3 text-center text-[10px] text-fg-4 font-bold">Carregando clientes...</div>
                  ) : filteredSegurados.length > 0 ? (
                    filteredSegurados.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSegurado(s)}
                        className="w-full text-left px-3 py-2 hover:bg-accent-primary-soft transition-colors border-b border-border-1 last:border-0"
                      >
                        <p className="text-xs font-bold text-fg-1">{s.nome}</p>
                        <p className="text-[9px] text-fg-4">{s.cpf_cnpj ?? '-'}</p>
                      </button>
                    ))
                  ) : clienteSearch.trim() ? (
                    <div className="p-3 text-center text-[10px] text-fg-4 font-bold">Nenhum resultado</div>
                  ) : (
                    <div className="p-3 text-center text-[10px] text-fg-4 font-bold">
                      Nenhum cliente cadastrado. Use &quot;Novo cliente&quot; abaixo.
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowNovoCliente(!showNovoCliente)}
                className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-accent-primary hover:underline"
              >
                <UserPlus size={10} /> Novo cliente
              </button>
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">Origem</label>
              <select
                value={origemId}
                onChange={(e) => setOrigemId(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all appearance-none"
              >
                <option value="">De onde veio?</option>
                {(origens.data ?? []).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">Premio Liquido</label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={premioLiquidoStr}
                onChange={(e) => setPremioLiquidoStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          {showNovoCliente && (
            <div className="bg-accent-primary-soft border border-accent-primary/10 rounded-[10px] p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
              <p className="text-[9px] font-black text-accent-primary uppercase tracking-widest">Cadastro rapido de cliente</p>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="Nome completo *" value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)}
                  className="px-3 py-2 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none" />
                <input type="text" placeholder="CPF / CNPJ" value={novoClienteDoc} onChange={(e) => setNovoClienteDoc(e.target.value)}
                  className="px-3 py-2 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none" />
                <div className="flex gap-2">
                  <input type="text" placeholder="Telefone" value={novoClienteTelefone} onChange={(e) => setNovoClienteTelefone(e.target.value)}
                    className="flex-1 px-3 py-2 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none" />
                  <button
                    onClick={handleCriarNovoCliente}
                    disabled={createSegurado.isPending}
                    className="px-3 py-2 bg-accent-primary text-fg-on-brand rounded-full text-[10px] font-black hover:bg-accent-primary-hover transition-all whitespace-nowrap disabled:opacity-50"
                  >
                    {createSegurado.isPending ? 'Salvando' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <DateField
                label="Vigencia"
                value={vigencia}
                onChange={setVigencia}
                inputClassName="text-xs"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">Ramo</label>
              <select
                value={ramoId}
                onChange={(e) => { setRamoId(e.target.value); setMetaFields({}); }}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all appearance-none"
              >
                <option value="">Qual ramo?</option>
                {(ramos.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">Comissao (%)</label>
              <input
                type="text"
                placeholder="Ex: 15"
                value={comissaoStr}
                onChange={(e) => setComissaoStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <DateField
                label="Retorno"
                required
                value={retorno}
                onChange={setRetorno}
                inputClassName="text-xs"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">Tipo de Negocio</label>
              <select
                value={tipoNegocio}
                onChange={(e) => setTipoNegocio(e.target.value as typeof tipoNegocio)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all appearance-none"
              >
                <option value="">Selecione</option>
                <option value="novo">Novo</option>
                <option value="renovacao">Renovacao</option>
                <option value="endosso">Endosso</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">Seguradora</label>
              <select
                value={seguradoraId}
                onChange={(e) => setSeguradoraId(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold focus:ring-2 focus:ring-accent-primary/30 focus:outline-none transition-all appearance-none"
              >
                <option value="">Selecione</option>
                {(seguradoras.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>

          {metaFieldsForRamo.length > 0 && (
            <div className="bg-bg-surface-2 border border-border-1 rounded-[10px] p-3 space-y-3">
              <p className="text-[9px] font-black text-fg-4 uppercase tracking-widest">Campos de {selectedRamoName}</p>
              <div className="grid grid-cols-3 gap-3">
                {metaFieldsForRamo.map((field) => (
                  <div key={field.key}>
                    <label className="text-[9px] font-black text-fg-4 uppercase tracking-widest mb-1.5 block">
                      {field.label}
                    </label>
                    {field.type === 'boolean' ? (
                      <label className="flex items-center gap-2 px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px]">
                        <input
                          type="checkbox"
                          checked={!!metaFields[field.key]}
                          onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.checked }))}
                        />
                        <span className="text-[10px] font-bold text-fg-3">Sim</span>
                      </label>
                    ) : field.type === 'select' ? (
                      <select
                        value={String(metaFields[field.key] ?? '')}
                        onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold"
                      >
                        <option value="">Selecione</option>
                        {(field.options ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={String(metaFields[field.key] ?? '')}
                        onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold resize-none"
                      />
                    ) : (
                      <input
                        type={field.type === 'number' || field.type === 'money' ? 'text' : 'text'}
                        value={String(metaFields[field.key] ?? '')}
                        onChange={(e) => setMetaFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] text-xs font-bold"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {COMERCIAL_METADATA_FLAGS.map((flag) => (
              <label key={flag.key} className="flex items-center gap-2 text-[10px] font-bold text-fg-3">
                <input
                  type="checkbox"
                  checked={!!metaFields[flag.key]}
                  onChange={(e) => setMetaFields((prev) => ({ ...prev, [flag.key]: e.target.checked }))}
                />
                {flag.label}
              </label>
            ))}
          </div>

          {submitError && (
            <div className="text-[11px] font-bold text-signal-danger bg-signal-danger/10 border border-signal-danger/30 rounded-[10px] px-3 py-2">
              {submitError}
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            title={
              !hasTituloOuCliente
                ? 'Informe o titulo da oportunidade ou selecione um cliente'
                : !hasRetorno
                  ? 'Informe a data de retorno'
                  : undefined
            }
            className="w-full max-w-[300px] py-3 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black uppercase tracking-widest hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createOportunidade.isPending ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
