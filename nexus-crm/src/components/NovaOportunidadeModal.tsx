import { useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Search, UserRound, UsersRound, X } from 'lucide-react'
import { useActivePipeline } from '../hooks/useActivePipeline'
import { useCreateOportunidade } from '../hooks/useOportunidades'
import { useOrigens, useRamos } from '../hooks/useLookups'
import { usePipelineStages } from '../hooks/usePipelineStages'
import { useSegurados } from '../hooks/useSegurados'
import { formatCpfCnpj, isValidCnpj, isValidCpf, onlyDigits } from '../utils/documento'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

type CaptureMode = 'lead' | 'segurado'

const inputClass =
  'w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

function validOptionalDocument(value: string): boolean {
  const digits = onlyDigits(value)
  if (!digits) return true
  return digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false
}

export default function NovaOportunidadeModal({ isOpen, onClose, onCreated }: Props) {
  const { active: activePipeline } = useActivePipeline('comercial')
  const stages = usePipelineStages(activePipeline?.id)
  const segurados = useSegurados()
  const ramos = useRamos()
  const origens = useOrigens()
  const createOpportunity = useCreateOportunidade()

  const [mode, setMode] = useState<CaptureMode>('lead')
  const [titulo, setTitulo] = useState('')
  const [leadNome, setLeadNome] = useState('')
  const [leadDocumento, setLeadDocumento] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadTelefone, setLeadTelefone] = useState('')
  const [seguradoId, setSeguradoId] = useState('')
  const [seguradoSearch, setSeguradoSearch] = useState('')
  const [ramoId, setRamoId] = useState('')
  const [origemId, setOrigemId] = useState('')
  const [prioridade, setPrioridade] = useState('media')
  const [fechamentoPrevisto, setFechamentoPrevisto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !createOpportunity.isPending) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createOpportunity.isPending, isOpen, onClose])

  const seguradoOptions = useMemo(() => {
    const needle = seguradoSearch.trim().toLocaleLowerCase('pt-BR')
    return (segurados.data ?? [])
      .filter((row) => !needle || `${row.nome} ${row.cpf_cnpj ?? ''}`.toLocaleLowerCase('pt-BR').includes(needle))
      .slice(0, 8)
  }, [seguradoSearch, segurados.data])

  const firstStage = stages.data?.[0]
  const leadHasContact = Boolean(onlyDigits(leadDocumento) || leadEmail.trim() || onlyDigits(leadTelefone))
  const canSubmit = Boolean(
    firstStage &&
    ramoId &&
    (mode === 'segurado' ? seguradoId : leadNome.trim() && leadHasContact && validOptionalDocument(leadDocumento)) &&
    !createOpportunity.isPending,
  )

  const reset = () => {
    setMode('lead')
    setTitulo('')
    setLeadNome('')
    setLeadDocumento('')
    setLeadEmail('')
    setLeadTelefone('')
    setSeguradoId('')
    setSeguradoSearch('')
    setRamoId('')
    setOrigemId('')
    setPrioridade('media')
    setFechamentoPrevisto('')
    setDescricao('')
    setSubmitError(null)
  }

  const close = () => {
    if (createOpportunity.isPending) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!firstStage) {
      setSubmitError('O funil Comercial precisa ter ao menos uma etapa ativa.')
      return
    }
    if (mode === 'lead' && !validOptionalDocument(leadDocumento)) {
      setSubmitError('Informe um CPF ou CNPJ válido, ou deixe o documento em branco.')
      return
    }
    setSubmitError(null)
    try {
      const created = await createOpportunity.mutateAsync({
        stageId: firstStage.id,
        seguradoId: mode === 'segurado' ? seguradoId : null,
        ramoId,
        origemId: origemId || null,
        titulo: titulo || null,
        descricao: descricao || null,
        prioridade,
        leadNome: mode === 'lead' ? leadNome : null,
        leadDocumento: mode === 'lead' ? leadDocumento : null,
        leadEmail: mode === 'lead' ? leadEmail : null,
        leadTelefone: mode === 'lead' ? leadTelefone : null,
        dataFechamentoPrevista: fechamentoPrevisto || null,
      })
      onCreated?.(created.id)
      reset()
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível cadastrar a oportunidade.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
      <button type="button" aria-label="Fechar cadastro de oportunidade" className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm" onClick={close} />
      <section role="dialog" aria-modal="true" aria-labelledby="nova-oportunidade-title" className="relative w-full max-w-2xl overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-3)]">
        <header className="flex items-start justify-between gap-4 border-b border-border-1 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="rounded-[8px] bg-accent-primary-soft p-2 text-accent-primary"><BriefcaseBusiness size={19} /></span>
            <div>
              <h2 id="nova-oportunidade-title" className="text-lg font-black text-fg-1">Nova oportunidade</h2>
              <p className="mt-0.5 text-xs font-semibold text-fg-3">
                Captura comercial rápida · {activePipeline?.name ?? 'Funil não configurado'}
              </p>
            </div>
          </div>
          <button type="button" onClick={close} disabled={createOpportunity.isPending} className="rounded-[6px] p-2 text-fg-4 hover:bg-bg-surface-2 hover:text-fg-1 disabled:opacity-40" aria-label="Fechar">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-1 rounded-[8px] bg-bg-surface-2 p-1" aria-label="Tipo de identificação da oportunidade">
            <button type="button" onClick={() => setMode('lead')} className={`flex items-center justify-center gap-2 rounded-[6px] px-3 py-2 text-sm font-bold transition-colors ${mode === 'lead' ? 'bg-bg-surface text-accent-primary shadow-[var(--shadow-1)]' : 'text-fg-3 hover:text-fg-1'}`}>
              <UserRound size={16} /> Novo lead
            </button>
            <button type="button" onClick={() => setMode('segurado')} className={`flex items-center justify-center gap-2 rounded-[6px] px-3 py-2 text-sm font-bold transition-colors ${mode === 'segurado' ? 'bg-bg-surface text-accent-primary shadow-[var(--shadow-1)]' : 'text-fg-3 hover:text-fg-1'}`}>
              <UsersRound size={16} /> Segurado cadastrado
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Título da oportunidade</span>
            <input value={titulo} onChange={(event) => setTitulo(event.target.value)} placeholder="Ex.: Seguro residencial — apartamento novo" className={inputClass} />
          </label>

          {mode === 'lead' ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Nome do lead *</span>
                  <input autoFocus value={leadNome} onChange={(event) => setLeadNome(event.target.value)} placeholder="Nome ou razão social" className={inputClass} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">CPF/CNPJ</span>
                  <input value={formatCpfCnpj(leadDocumento)} onChange={(event) => setLeadDocumento(onlyDigits(event.target.value).slice(0, 14))} placeholder="Opcional nesta etapa" className={`${inputClass} font-mono`} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">E-mail</span>
                  <input type="email" value={leadEmail} onChange={(event) => setLeadEmail(event.target.value)} placeholder="lead@empresa.com.br" className={inputClass} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Telefone</span>
                  <input value={leadTelefone} onChange={(event) => setLeadTelefone(event.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
                </label>
              </div>
              {!leadHasContact && <p className="text-xs font-semibold text-signal-warning">Informe ao menos documento, e-mail ou telefone para permitir o acompanhamento.</p>}
              {leadDocumento && !validOptionalDocument(leadDocumento) && <p className="text-xs font-semibold text-signal-danger">CPF/CNPJ inválido.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="relative block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-fg-4">Buscar segurado *</span>
                <Search size={15} className="pointer-events-none absolute bottom-3 left-3 text-fg-4" />
                <input autoFocus value={seguradoSearch} onChange={(event) => setSeguradoSearch(event.target.value)} placeholder="Nome ou documento" className={`${inputClass} pl-9`} />
              </label>
              <div className="max-h-40 overflow-y-auto rounded-[8px] border border-border-1">
                {seguradoOptions.map((row) => (
                  <button key={row.id} type="button" onClick={() => { setSeguradoId(row.id); setSeguradoSearch(row.nome ?? '') }} className={`flex w-full items-center justify-between gap-3 border-b border-border-1 px-3 py-2.5 text-left last:border-0 ${seguradoId === row.id ? 'bg-accent-primary-soft text-accent-primary' : 'hover:bg-bg-surface-2'}`}>
                    <span className="text-sm font-bold">{row.nome}</span>
                    <span className="font-mono text-xs text-fg-4">{row.cpf_cnpj ? formatCpfCnpj(row.cpf_cnpj) : 'Sem documento'}</span>
                  </button>
                ))}
                {!segurados.isLoading && seguradoOptions.length === 0 && <p className="px-3 py-4 text-center text-xs font-semibold text-fg-4">Nenhum segurado encontrado.</p>}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Ramo *</span>
              <select value={ramoId} onChange={(event) => setRamoId(event.target.value)} className={inputClass}>
                <option value="">Selecione</option>
                {(ramos.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Origem</span>
              <select value={origemId} onChange={(event) => setOrigemId(event.target.value)} className={inputClass}>
                <option value="">Não informada</option>
                {(origens.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Prioridade</span>
              <select value={prioridade} onChange={(event) => setPrioridade(event.target.value)} className={inputClass}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Fechamento previsto</span>
              <input type="date" value={fechamentoPrevisto} onChange={(event) => setFechamentoPrevisto(event.target.value)} className={inputClass} />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Contexto inicial</span>
            <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={3} placeholder="Necessidade, produto desejado ou contexto do primeiro contato." className={`${inputClass} resize-none`} />
          </label>

          {submitError && <div className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-sm font-semibold text-signal-danger">{submitError}</div>}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-border-1 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} disabled={createOpportunity.isPending} className="rounded-[6px] px-4 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-2 disabled:opacity-40">Cancelar</button>
          <button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit} className="rounded-full bg-accent-primary px-6 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-40">
            {createOpportunity.isPending ? 'Cadastrando…' : 'Cadastrar oportunidade'}
          </button>
        </footer>
      </section>
    </div>
  )
}
