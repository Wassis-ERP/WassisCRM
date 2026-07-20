import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LifeBuoy,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DateField from '../components/DateField'
import { useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import {
  useApolicesPosVendaLookup,
  useCreatePosVenda,
  usePosVendaPipeline,
  usePosVendaResponsaveis,
  type PosVendaApoliceOption,
} from '../hooks/usePosVendas'
import { usePermission } from '../hooks/usePermission'
import { inferPosVendaProcesso } from '../modules/pos_venda/domain'
import { fmtDate } from '../utils/date'

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PolicyOption({
  option,
  selected,
  onSelect,
}: {
  option: PosVendaApoliceOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={!option.eligible}
      onClick={onSelect}
      className={`w-full rounded-[8px] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 ${
        selected
          ? 'border-accent-primary bg-accent-primary-soft'
          : option.eligible
            ? 'border-border-1 bg-bg-surface hover:border-accent-primary/50 hover:bg-bg-surface-2'
            : 'cursor-not-allowed border-border-1 bg-bg-surface-2 opacity-65'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-fg-1">{option.segurado.nome}</p>
          <p className="mt-1 font-mono text-xs text-fg-3">
            {option.numero_apolice ? `Apólice ${option.numero_apolice}` : 'Apólice sem número'}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
          option.eligible
            ? 'bg-signal-success/10 text-signal-success'
            : 'bg-signal-warning/10 text-signal-warning'
        }`}>
          {option.eligible ? 'Elegível' : option.status ?? 'Inelegível'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-fg-3">
        <span>{option.ramo.nome}</span>
        <span>{option.seguradora?.nome ?? 'Seguradora não informada'}</span>
        <span>{formatCurrency(option.premio_total)}</span>
      </div>
      {option.reason && <p className="mt-2 text-xs font-semibold text-signal-warning">{option.reason}</p>}
    </button>
  )
}

export default function NovoPosVendaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pipelineId = searchParams.get('pipeline')
  const { notify } = useSystemFeedback()
  const { can } = usePermission('pos_venda')
  const pipeline = usePosVendaPipeline(pipelineId)
  const responsaveis = usePosVendaResponsaveis()
  const create = useCreatePosVenda()
  const [search, setSearch] = useState('')
  const policies = useApolicesPosVendaLookup(search, pipelineId)
  const [selected, setSelected] = useState<PosVendaApoliceOption | null>(null)
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prioridade, setPrioridade] = useState('media')
  const [responsavelId, setResponsavelId] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const processo = inferPosVendaProcesso(pipeline.data?.nome ?? null)
  const processLabel = processo === 'ACOMPANHAMENTO_MENSAL'
    ? 'Acompanhamento mensal'
    : processo === 'ONBOARDING'
      ? 'Onboarding do segurado'
      : 'Processo configurado'

  const visiblePolicies = useMemo(() => policies.data ?? [], [policies.data])

  const handleSubmit = async () => {
    setError(null)
    if (!can('create')) {
      setError('Seu perfil não permite criar Pós-venda nesta corretora.')
      return
    }
    if (!pipelineId || !pipeline.data) {
      setError('Selecione um funil de Pós-venda válido.')
      return
    }
    if (!selected) {
      setError('Selecione uma Apólice elegível.')
      return
    }
    if (!assunto.trim()) {
      setError('Informe o assunto do Pós-venda.')
      return
    }

    try {
      const result = await create.mutateAsync({
        pipelineId,
        input: {
          apoliceId: selected.id,
          responsavelId: responsavelId || null,
          prioridade,
          assunto,
          descricao,
          dataConclusaoPrevista: dataPrevista || null,
          observacoes,
        },
      })
      notify({
        title: 'Pós-venda criado',
        description: result.atividade
          ? `${processLabel} iniciado com tarefa vinculada.`
          : 'Registro criado no funil selecionado.',
        tone: 'success',
      })
      navigate(`/pos-venda/${result.posVenda.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'A operação foi revertida integralmente.')
    }
  }

  if (!pipelineId) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
        <LifeBuoy size={30} className="mb-3 text-signal-warning" />
        <p className="font-semibold text-fg-2">Abra o cadastro a partir de um funil de Pós-venda.</p>
        <button type="button" onClick={() => navigate('/pos-venda')} className="mt-4 text-sm font-bold text-accent-primary hover:underline">
          Voltar para Pós-venda
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-5 flex items-center gap-2 text-sm text-fg-3">
        <button type="button" onClick={() => navigate('/pos-venda')} className="inline-flex items-center gap-1.5 font-semibold hover:text-accent-primary">
          <ArrowLeft size={15} /> Pós-venda
        </button>
      </div>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-accent-primary-soft text-accent-primary">
              <LifeBuoy size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.02em] text-fg-1">Novo Pós-venda</h1>
              <p className="mt-1 text-sm font-semibold text-fg-3">{pipeline.data?.nome ?? 'Carregando funil...'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[6px] border border-accent-primary/20 bg-accent-primary-soft px-4 py-3 text-xs font-semibold text-fg-2">
          <p className="font-bold text-fg-1">{processLabel}</p>
          <p className="mt-0.5">A etapa inicial vem do funil; a Apólice não poderá ser trocada.</p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent-primary" />
            <div>
              <h2 className="font-bold text-fg-1">Apólice obrigatória</h2>
              <p className="text-xs font-semibold text-fg-4">Busque por número, segurado, documento, seguradora ou ramo.</p>
            </div>
          </div>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar Apólice..."
              className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 py-2.5 pl-9 pr-3 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
            />
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {policies.isLoading && <p className="py-10 text-center text-sm font-semibold text-fg-4">Carregando Apólices...</p>}
            {policies.isError && <p className="py-10 text-center text-sm font-semibold text-signal-danger">Não foi possível carregar as Apólices.</p>}
            {!policies.isLoading && visiblePolicies.length === 0 && (
              <p className="py-10 text-center text-sm font-semibold text-fg-4">Nenhuma Apólice encontrada.</p>
            )}
            {visiblePolicies.map((option) => (
              <PolicyOption
                key={option.id}
                option={option}
                selected={selected?.id === option.id}
                onSelect={() => setSelected(option)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-accent-primary" />
            <div>
              <h2 className="font-bold text-fg-1">Dados operacionais</h2>
              <p className="text-xs font-semibold text-fg-4">Apólice e etapa ficam protegidas após a criação.</p>
            </div>
          </div>

          {selected && (
            <div className="mb-5 rounded-[6px] bg-bg-surface-2 p-3 text-xs font-semibold text-fg-3">
              <p className="font-bold text-fg-1">{selected.segurado.nome}</p>
              <p className="mt-1 font-mono">{selected.numero_apolice ?? 'Sem número'} · {selected.ramo.nome}</p>
              <p className="mt-1">Vigência: {selected.vigencia_inicio ? fmtDate(selected.vigencia_inicio) : '—'} a {selected.vigencia_fim ? fmtDate(selected.vigencia_fim) : '—'}</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Assunto *</span>
              <input value={assunto} onChange={(event) => setAssunto(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Descrição</span>
              <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={3} className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-medium text-fg-1 focus:border-accent-primary focus:outline-none" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Prioridade</span>
                <select value={prioridade} onChange={(event) => setPrioridade(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </label>
              <DateField label="Conclusão prevista" value={dataPrevista} onChange={setDataPrevista} inputClassName="text-sm" />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Responsável</span>
              <div className="relative">
                <UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                <select value={responsavelId} onChange={(event) => setResponsavelId(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 py-2.5 pl-9 pr-3 text-sm font-semibold text-fg-1">
                  <option value="">Usuário da sessão</option>
                  {(responsaveis.data ?? []).map((responsavel) => <option key={responsavel.id} value={responsavel.id}>{responsavel.full_name ?? responsavel.email ?? responsavel.id}</option>)}
                </select>
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Observações</span>
              <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-medium text-fg-1 focus:border-accent-primary focus:outline-none" />
            </label>
          </div>

          {error && <p role="alert" className="mt-4 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">{error}</p>}

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border-1 pt-5">
            <button type="button" onClick={() => navigate('/pos-venda')} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-2">Cancelar</button>
            <button type="button" onClick={() => void handleSubmit()} disabled={create.isPending || pipeline.isLoading} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-50">
              <CalendarDays size={16} /> {create.isPending ? 'Criando...' : 'Criar Pós-venda'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
