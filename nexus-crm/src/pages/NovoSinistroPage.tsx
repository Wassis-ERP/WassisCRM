import { useMemo, useState } from 'react'
import type { FormEvent, InputHTMLAttributes } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  FileSearch,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import DateField from '../components/DateField'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import { useActivePipeline } from '../hooks/useActivePipeline'
import { useAuth } from '../hooks/useAuth'
import { usePipelineStages } from '../hooks/usePipelineStages'
import {
  useApolicesSinistroLookup,
  useOpenSinistro,
  useSinistroResponsaveis,
} from '../hooks/useSinistros'
import type {
  ApoliceSinistroOption,
  SinistroAberturaInput,
  SinistroEnvolvidoDraft,
} from '../modules/sinistro/opening'

type OpeningForm = Omit<
  SinistroAberturaInput,
  'apolice_id' | 'responsavel_id' | 'envolvidos'
>

type ThirdPartyDraft = {
  key: string
  nome: string
  cpf_cnpj: string
  email: string
  telefone: string
  placa: string
  seguradora_terceiro: string
  apolice_terceiro: string
  tipo_dano: string
  valor_reclamado: string
  responsavel_pelo_evento: boolean
  observacoes: string
}

const today = new Date().toISOString().slice(0, 10)

const INITIAL_FORM: OpeningForm = {
  numero_sinistro: '',
  numero_aviso: '',
  protocolo_seguradora: '',
  cobertura_codigo: '',
  cobertura_nome: '',
  data_ocorrencia: '',
  data_aviso: '',
  data_registro_aviso: today,
  tipo_sinistro: 'administrativo',
  causa: '',
  descricao: '',
  local_ocorrencia: '',
  valor_estimado: null,
  valor_pendente: null,
  regulador_nome: '',
  oficina_nome: '',
  observacoes: '',
}

const inputClass = 'w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-bold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'
const labelClass = 'mb-1 block text-[10px] font-black uppercase tracking-widest text-fg-4'

function TextField({ label, required, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}{required ? ' *' : ''}</span>
      <input {...props} required={required} className={inputClass} />
    </label>
  )
}

function formatDate(value: string | null): string {
  if (!value) return 'Não informada'
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function statusTone(status: string | null): string {
  const normalized = status?.toUpperCase()
  if (normalized === 'RECUSADA') return 'bg-signal-danger/10 text-signal-danger border-signal-danger/20'
  if (normalized === 'EMITIDA' || normalized === 'ATIVA' || normalized === 'VIGENTE') {
    return 'bg-signal-success/10 text-signal-success border-signal-success/20'
  }
  return 'bg-signal-warning/10 text-signal-warning border-signal-warning/20'
}

function policyIsRejected(policy: ApoliceSinistroOption): boolean {
  return policy.status?.toUpperCase() === 'RECUSADA'
}

function newThirdParty(): ThirdPartyDraft {
  return {
    key: crypto.randomUUID(),
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    placa: '',
    seguradora_terceiro: '',
    apolice_terceiro: '',
    tipo_dano: '',
    valor_reclamado: '',
    responsavel_pelo_evento: false,
    observacoes: '',
  }
}

function nullableNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export default function NovoSinistroPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const { pipelines, active, isLoading: pipelinesLoading } = useActivePipeline('sinistro')
  const requestedPipelineId = searchParams.get('pipeline')
  const pipeline = useMemo(
    () => pipelines.find((candidate) => candidate.id === requestedPipelineId) ?? active,
    [active, pipelines, requestedPipelineId],
  )
  const stagesQuery = usePipelineStages(pipeline?.id)
  const firstStage = stagesQuery.data?.[0] ?? null

  const [search, setSearch] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState<ApoliceSinistroOption | null>(null)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [responsibleId, setResponsibleId] = useState(user?.id ?? '')
  const [form, setForm] = useState<OpeningForm>(INITIAL_FORM)
  const [insuredDamage, setInsuredDamage] = useState('')
  const [insuredClaimedValue, setInsuredClaimedValue] = useState('')
  const [insuredResponsible, setInsuredResponsible] = useState(false)
  const [insuredNotes, setInsuredNotes] = useState('')
  const [thirdParties, setThirdParties] = useState<ThirdPartyDraft[]>([])

  const policiesQuery = useApolicesSinistroLookup(search)
  const responsiblesQuery = useSinistroResponsaveis()
  const createMutation = useOpenSinistro()

  const occurrenceError = useMemo(() => {
    if (!form.data_ocorrencia || !selectedPolicy) return null
    if (form.data_ocorrencia > today) return 'A ocorrência não pode estar no futuro.'
    if (selectedPolicy.vigencia_inicio && form.data_ocorrencia < selectedPolicy.vigencia_inicio) {
      return 'A ocorrência é anterior ao início da vigência da apólice.'
    }
    if (selectedPolicy.vigencia_fim && form.data_ocorrencia > selectedPolicy.vigencia_fim) {
      return 'A ocorrência é posterior ao fim da vigência da apólice.'
    }
    return null
  }, [form.data_ocorrencia, selectedPolicy])

  const setFormValue = <K extends keyof OpeningForm>(key: K, value: OpeningForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const selectPolicy = async (policy: ApoliceSinistroOption) => {
    if (policyIsRejected(policy)) return
    if (selectedPolicy && selectedPolicy.id !== policy.id) {
      const accepted = await confirm({
        title: 'Trocar a apólice?',
        description: 'O item e os envolvidos adicionais já informados serão limpos.',
        confirmLabel: 'Trocar apólice',
        tone: 'warning',
      })
      if (!accepted) return
    }
    setSelectedPolicy(policy)
    setSelectedItemId('')
    setThirdParties([])
  }

  const leaveOpening = async () => {
    if (selectedPolicy) {
      const accepted = await confirm({
        title: 'Descartar a abertura?',
        description: 'Os dados ainda não salvos serão perdidos.',
        confirmLabel: 'Descartar',
        tone: 'danger',
      })
      if (!accepted) return
    }
    navigate('/sinistros')
  }

  const updateThirdParty = (key: string, patch: Partial<ThirdPartyDraft>) => {
    setThirdParties((current) => current.map((thirdParty) => (
      thirdParty.key === key ? { ...thirdParty, ...patch } : thirdParty
    )))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPolicy) {
      notify({ title: 'Selecione uma apólice', description: 'A abertura deve começar pelo contrato vigente.', tone: 'warning' })
      return
    }
    if (occurrenceError) {
      notify({ title: 'Data de ocorrência inválida', description: occurrenceError, tone: 'danger' })
      return
    }
    if (!pipeline || !firstStage) {
      notify({ title: 'Funil indisponível', description: 'Configure uma etapa ativa no funil de Sinistros.', tone: 'danger' })
      return
    }

    const insured: SinistroEnvolvidoDraft = {
      apolice_item_id: selectedItemId || null,
      tipo: 'SEGURADO',
      nome: selectedPolicy.segurado.nome,
      cpf_cnpj: selectedPolicy.segurado.cpf_cnpj,
      email: selectedPolicy.segurado.email,
      telefone: selectedPolicy.segurado.telefone,
      placa: selectedPolicy.itens.find((item) => item.id === selectedItemId)?.identificador_externo ?? null,
      seguradora_terceiro: null,
      apolice_terceiro: null,
      tipo_dano: insuredDamage || null,
      valor_reclamado: nullableNumber(insuredClaimedValue),
      valor_indenizado: null,
      responsavel_pelo_evento: insuredResponsible,
      observacoes: insuredNotes || null,
    }
    const involvedThirdParties: SinistroEnvolvidoDraft[] = thirdParties.map((thirdParty) => ({
      apolice_item_id: null,
      tipo: 'TERCEIRO',
      nome: thirdParty.nome,
      cpf_cnpj: thirdParty.cpf_cnpj || null,
      email: thirdParty.email || null,
      telefone: thirdParty.telefone || null,
      placa: thirdParty.placa || null,
      seguradora_terceiro: thirdParty.seguradora_terceiro || null,
      apolice_terceiro: thirdParty.apolice_terceiro || null,
      tipo_dano: thirdParty.tipo_dano || null,
      valor_reclamado: nullableNumber(thirdParty.valor_reclamado),
      valor_indenizado: null,
      responsavel_pelo_evento: thirdParty.responsavel_pelo_evento,
      observacoes: thirdParty.observacoes || null,
    }))

    try {
      const result = await createMutation.mutateAsync({
        pipelineId: pipeline.id,
        input: {
          ...form,
          apolice_id: selectedPolicy.id,
          responsavel_id: responsibleId || null,
          envolvidos: [insured, ...involvedThirdParties],
        },
      })
      notify({ title: 'Sinistro aberto', description: 'Registro e envolvidos auditados com sucesso.', tone: 'success' })
      navigate(`/sinistros/${result.sinistro.id}`)
    } catch (error) {
      notify({
        title: 'Não foi possível abrir o Sinistro',
        description: error instanceof Error ? error.message : 'Revise os dados e tente novamente.',
        tone: 'danger',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-10">
      <header className="flex flex-col gap-4 border-b border-border-1 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <button type="button" onClick={leaveOpening} className="mt-1 rounded-[6px] border border-border-1 bg-bg-surface p-2 text-fg-3 transition-colors hover:text-fg-1" aria-label="Voltar para Sinistros">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary">Sinistros · abertura contratual</p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tighter text-fg-1">Novo Sinistro</h1>
            <p className="mt-1 text-sm text-fg-3">Comece pela apólice. O status e a etapa inicial são definidos pelo contrato.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-xs font-bold text-fg-3">
          <ShieldCheck size={16} className="text-accent-primary" />
          <span>Status <strong className="text-fg-1">Aberto</strong></span>
          <span className="text-border-2">·</span>
          <span>Etapa <strong className="text-fg-1">{firstStage?.name ?? 'Carregando...'}</strong></span>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
          <div className="border-b border-border-1 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-xs font-black text-fg-on-brand">1</span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-fg-1">Selecione a apólice</h2>
                <p className="text-xs text-fg-3">Busque por número, segurado, CPF/CNPJ, seguradora ou ramo.</p>
              </div>
            </div>
            <div className="relative mt-4">
              <FileSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-10`} placeholder="Ex.: apólice 531, Viaforte, 12.345..., Porto ou Automóvel" aria-label="Buscar apólice" />
            </div>
          </div>

          <div className="max-h-[420px] divide-y divide-border-1 overflow-y-auto custom-scrollbar">
            {policiesQuery.isLoading && <div className="flex items-center justify-center gap-2 p-10 text-sm text-fg-3"><Loader2 size={17} className="animate-spin" /> Carregando apólices...</div>}
            {policiesQuery.isError && <div className="p-8 text-center text-sm font-bold text-signal-danger">Não foi possível consultar as apólices.</div>}
            {!policiesQuery.isLoading && policiesQuery.data?.length === 0 && <div className="p-10 text-center text-sm text-fg-3">Nenhuma apólice encontrada com esses critérios.</div>}
            {policiesQuery.data?.map((policy) => {
              const rejected = policyIsRejected(policy)
              const selected = selectedPolicy?.id === policy.id
              return (
                <button key={policy.id} type="button" disabled={rejected} onClick={() => selectPolicy(policy)} className={`w-full p-4 text-left transition-colors ${selected ? 'bg-accent-primary/8 ring-1 ring-inset ring-accent-primary/30' : 'hover:bg-bg-surface-2'} disabled:cursor-not-allowed disabled:opacity-65`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-fg-1">{policy.numero_apolice || 'Apólice sem número'}</p>
                      <p className="mt-0.5 truncate text-xs font-bold text-fg-2">{policy.segurado.nome}</p>
                      <p className="mt-1 text-[11px] text-fg-4">{policy.segurado.cpf_cnpj || 'CPF/CNPJ não informado'} · {policy.seguradora?.nome || 'Sem seguradora'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${statusTone(policy.status)}`}>{policy.status || 'Sem status'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-fg-4">
                    <span>{policy.ramo?.nome || 'Ramo não informado'}</span>
                    <span>{formatDate(policy.vigencia_inicio)} — {formatDate(policy.vigencia_fim)}</span>
                  </div>
                  {rejected && <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-signal-danger"><AlertTriangle size={12} /> Apólice recusada: abertura bloqueada</p>}
                </button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-[var(--shadow-1)]">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-fg-4">Contexto selecionado</h2>
          {!selectedPolicy ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center text-fg-4">
              <ShieldCheck size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-bold text-fg-3">Selecione uma apólice para liberar a abertura.</p>
              <p className="mt-1 max-w-xs text-xs">O item, o segurado e a vigência serão herdados desse contrato.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="rounded-[6px] border border-accent-primary/20 bg-accent-primary/5 p-4">
                <div className="flex items-center gap-2 text-accent-primary"><CheckCircle2 size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Apólice validada</span></div>
                <p className="mt-2 text-lg font-black text-fg-1">{selectedPolicy.numero_apolice || 'Sem número'}</p>
                <p className="text-sm font-bold text-fg-2">{selectedPolicy.segurado.nome}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div><dt className="font-black uppercase tracking-wide text-fg-4">CPF/CNPJ</dt><dd className="mt-1 font-bold text-fg-2">{selectedPolicy.segurado.cpf_cnpj || '—'}</dd></div>
                <div><dt className="font-black uppercase tracking-wide text-fg-4">Seguradora</dt><dd className="mt-1 font-bold text-fg-2">{selectedPolicy.seguradora?.nome || '—'}</dd></div>
                <div><dt className="font-black uppercase tracking-wide text-fg-4">Ramo</dt><dd className="mt-1 font-bold text-fg-2">{selectedPolicy.ramo?.nome || '—'}</dd></div>
                <div><dt className="font-black uppercase tracking-wide text-fg-4">Vigência</dt><dd className="mt-1 font-bold text-fg-2">{formatDate(selectedPolicy.vigencia_inicio)} a {formatDate(selectedPolicy.vigencia_fim)}</dd></div>
              </dl>
              <label>
                <span className={labelClass}>Item da apólice (opcional)</span>
                <select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} className={inputClass}>
                  <option value="">Sem item específico</option>
                  {selectedPolicy.itens.map((item) => <option key={item.id} value={item.id}>Item {item.numero_item ?? '—'} · {item.descricao || item.identificador_externo || 'Sem descrição'} ({item.status || 'sem status'})</option>)}
                </select>
              </label>
            </div>
          )}
        </aside>
      </section>

      {selectedPolicy && (
        <>
          <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
            <div className="mb-5 flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-xs font-black text-fg-on-brand">2</span><div><h2 className="text-sm font-black uppercase tracking-wide text-fg-1">Ocorrência e aviso</h2><p className="text-xs text-fg-3">Somente campos escalares do contrato v2.4.</p></div></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DateField label="Data da ocorrência" required value={form.data_ocorrencia} onChange={(value) => setFormValue('data_ocorrencia', value)} />
              <DateField label="Data do aviso" value={form.data_aviso ?? ''} onChange={(value) => setFormValue('data_aviso', value)} />
              <DateField label="Registro do aviso" value={form.data_registro_aviso ?? ''} onChange={(value) => setFormValue('data_registro_aviso', value)} />
              <label><span className={labelClass}>Tipo</span><select value={form.tipo_sinistro ?? ''} onChange={(event) => setFormValue('tipo_sinistro', event.target.value === 'judicial' ? 'judicial' : 'administrativo')} className={inputClass}><option value="administrativo">Administrativo</option><option value="judicial">Judicial</option></select></label>
              {occurrenceError && <p className="md:col-span-2 xl:col-span-4 flex items-center gap-2 rounded-[6px] border border-signal-danger/20 bg-signal-danger/10 px-3 py-2 text-xs font-bold text-signal-danger"><AlertTriangle size={14} /> {occurrenceError}</p>}
              <TextField label="Número do Sinistro" value={form.numero_sinistro ?? ''} onChange={(event) => setFormValue('numero_sinistro', event.target.value)} />
              <TextField label="Número do aviso" value={form.numero_aviso ?? ''} onChange={(event) => setFormValue('numero_aviso', event.target.value)} />
              <TextField label="Protocolo da seguradora" value={form.protocolo_seguradora ?? ''} onChange={(event) => setFormValue('protocolo_seguradora', event.target.value)} />
              <TextField label="Local da ocorrência" value={form.local_ocorrencia ?? ''} onChange={(event) => setFormValue('local_ocorrencia', event.target.value)} />
              <TextField label="Código da cobertura" value={form.cobertura_codigo ?? ''} onChange={(event) => setFormValue('cobertura_codigo', event.target.value)} />
              <TextField label="Cobertura" value={form.cobertura_nome ?? ''} onChange={(event) => setFormValue('cobertura_nome', event.target.value)} />
              <TextField label="Causa" value={form.causa ?? ''} onChange={(event) => setFormValue('causa', event.target.value)} />
              <TextField label="Regulador" value={form.regulador_nome ?? ''} onChange={(event) => setFormValue('regulador_nome', event.target.value)} />
              <TextField label="Oficina / prestador" value={form.oficina_nome ?? ''} onChange={(event) => setFormValue('oficina_nome', event.target.value)} />
              <TextField label="Valor estimado" type="number" min="0" step="0.01" value={form.valor_estimado ?? ''} onChange={(event) => setFormValue('valor_estimado', nullableNumber(event.target.value))} />
              <TextField label="Valor pendente" type="number" min="0" step="0.01" value={form.valor_pendente ?? ''} onChange={(event) => setFormValue('valor_pendente', nullableNumber(event.target.value))} />
              <label className="md:col-span-2"><span className={labelClass}>Descrição</span><textarea value={form.descricao ?? ''} onChange={(event) => setFormValue('descricao', event.target.value)} rows={3} className={inputClass} /></label>
              <label className="md:col-span-2"><span className={labelClass}>Observações</span><textarea value={form.observacoes ?? ''} onChange={(event) => setFormValue('observacoes', event.target.value)} rows={3} className={inputClass} /></label>
            </div>
          </section>

          <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary text-xs font-black text-fg-on-brand">3</span><div><h2 className="text-sm font-black uppercase tracking-wide text-fg-1">Envolvidos</h2><p className="text-xs text-fg-3">O segurado é obrigatório. Terceiros ficam apenas neste Sinistro.</p></div></div><button type="button" onClick={() => setThirdParties((current) => [...current, newThirdParty()])} className="flex items-center gap-2 rounded-full border border-accent-primary/30 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-accent-primary hover:bg-accent-primary/5"><Plus size={14} /> Adicionar terceiro</button></div>
            <div className="rounded-[6px] border border-border-1 bg-bg-surface-2 p-4">
              <div className="mb-3 flex items-center gap-2"><Users size={16} className="text-accent-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-fg-3">Segurado obrigatório</span></div>
              <p className="text-sm font-black text-fg-1">{selectedPolicy.segurado.nome}</p><p className="text-xs text-fg-4">{selectedPolicy.segurado.cpf_cnpj || 'CPF/CNPJ não informado'}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="Tipo de dano" value={insuredDamage} onChange={(event) => setInsuredDamage(event.target.value)} /><TextField label="Valor reclamado" type="number" min="0" step="0.01" value={insuredClaimedValue} onChange={(event) => setInsuredClaimedValue(event.target.value)} /><label className="flex items-end gap-2 pb-2 text-xs font-bold text-fg-2"><input type="checkbox" checked={insuredResponsible} onChange={(event) => setInsuredResponsible(event.target.checked)} className="h-4 w-4 rounded border-border-2 text-accent-primary" /> Responsável pelo evento</label><TextField label="Observações" value={insuredNotes} onChange={(event) => setInsuredNotes(event.target.value)} /></div>
            </div>
            <div className="mt-4 space-y-3">{thirdParties.map((thirdParty, index) => <div key={thirdParty.key} className="rounded-[6px] border border-border-1 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest text-fg-3">Terceiro {index + 1}</p><button type="button" onClick={() => setThirdParties((current) => current.filter((row) => row.key !== thirdParty.key))} className="rounded-[6px] p-1.5 text-fg-4 hover:bg-signal-danger/10 hover:text-signal-danger" aria-label={`Remover terceiro ${index + 1}`}><Trash2 size={15} /></button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="Nome" required value={thirdParty.nome} onChange={(event) => updateThirdParty(thirdParty.key, { nome: event.target.value })} /><TextField label="CPF/CNPJ" value={thirdParty.cpf_cnpj} onChange={(event) => updateThirdParty(thirdParty.key, { cpf_cnpj: event.target.value })} /><TextField label="E-mail" type="email" value={thirdParty.email} onChange={(event) => updateThirdParty(thirdParty.key, { email: event.target.value })} /><TextField label="Telefone" value={thirdParty.telefone} onChange={(event) => updateThirdParty(thirdParty.key, { telefone: event.target.value })} /><TextField label="Placa" value={thirdParty.placa} onChange={(event) => updateThirdParty(thirdParty.key, { placa: event.target.value })} /><TextField label="Seguradora do terceiro" value={thirdParty.seguradora_terceiro} onChange={(event) => updateThirdParty(thirdParty.key, { seguradora_terceiro: event.target.value })} /><TextField label="Apólice do terceiro" value={thirdParty.apolice_terceiro} onChange={(event) => updateThirdParty(thirdParty.key, { apolice_terceiro: event.target.value })} /><TextField label="Tipo de dano" value={thirdParty.tipo_dano} onChange={(event) => updateThirdParty(thirdParty.key, { tipo_dano: event.target.value })} /><TextField label="Valor reclamado" type="number" min="0" step="0.01" value={thirdParty.valor_reclamado} onChange={(event) => updateThirdParty(thirdParty.key, { valor_reclamado: event.target.value })} /><TextField label="Observações" className="md:col-span-2" value={thirdParty.observacoes} onChange={(event) => updateThirdParty(thirdParty.key, { observacoes: event.target.value })} /><label className="flex items-end gap-2 pb-2 text-xs font-bold text-fg-2"><input type="checkbox" checked={thirdParty.responsavel_pelo_evento} onChange={(event) => updateThirdParty(thirdParty.key, { responsavel_pelo_evento: event.target.checked })} className="h-4 w-4 rounded border-border-2 text-accent-primary" /> Responsável pelo evento</label></div></div>)}</div>
          </section>

          <section className="flex flex-col gap-4 rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)] lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-2"><label><span className={labelClass}>Responsável *</span><select required value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)} className={inputClass}><option value="">Selecione</option>{responsiblesQuery.data?.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email || 'Usuário sem nome'}</option>)}</select></label><div className="rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-4"><CalendarRange size={14} /> Destino no funil</div><p className="mt-1 text-sm font-bold text-fg-1">{pipeline?.name || 'Funil de Sinistros'} · {firstStage?.name || 'Primeira etapa ativa'}</p></div></div>
            <div className="flex gap-2"><button type="button" onClick={leaveOpening} className="rounded-full border border-border-1 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-fg-3 hover:bg-bg-surface-2">Cancelar</button><button type="submit" disabled={createMutation.isPending || pipelinesLoading || !firstStage} className="flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Abrir Sinistro</button></div>
          </section>
        </>
      )}
    </form>
  )
}
