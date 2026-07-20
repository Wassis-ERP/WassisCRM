import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  LifeBuoy,
  Pencil,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DateField from '../components/DateField'
import { EntityTabsBar, type EntityTab } from '../components/detail/EntityTabsBar'
import { DetailCard, DetailField, EmptyState, StatusBadge } from '../components/detail/primitives'
import AnexosLogsTab from '../components/detail/tabs/AnexosLogsTab'
import CamposPersonalizadosTab from '../components/detail/tabs/CamposPersonalizadosTab'
import ObservacoesTab from '../components/detail/tabs/ObservacoesTab'
import TarefasTab from '../components/detail/tabs/TarefasTab'
import { useEntityTabsState } from '../components/detail/useEntityTabsState'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import {
  useMaintainPosVenda,
  usePosVenda,
  usePosVendaPipeline,
  usePosVendaResponsaveis,
  type PosVendaDetalhe,
} from '../hooks/usePosVendas'
import { usePermission } from '../hooks/usePermission'
import { inferPosVendaProcesso, type PosVendaMaintenanceInput } from '../modules/pos_venda/domain'
import { fmtDate } from '../utils/date'

type TabId = 'visao' | 'tarefas' | 'personalizados' | 'anexos' | 'observacoes'
const VALID_TABS: TabId[] = ['visao', 'tarefas', 'personalizados', 'anexos', 'observacoes']

function safeDate(value: string | null): string | undefined {
  return value ? fmtDate(value) : undefined
}

function formatCurrency(value: number | null): string | undefined {
  if (value == null) return undefined
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function EditForm({
  posVenda,
  responsaveis,
  saving,
  onCancel,
  onSave,
}: {
  posVenda: PosVendaDetalhe
  responsaveis: ReturnType<typeof usePosVendaResponsaveis>['data']
  saving: boolean
  onCancel: () => void
  onSave: (input: PosVendaMaintenanceInput) => void
}) {
  const [assunto, setAssunto] = useState(posVenda.assunto ?? '')
  const [descricao, setDescricao] = useState(posVenda.descricao ?? '')
  const [prioridade, setPrioridade] = useState(posVenda.prioridade ?? '')
  const [responsavelId, setResponsavelId] = useState(posVenda.responsavel_id ?? '')
  const [dataPrevista, setDataPrevista] = useState(posVenda.data_conclusao_prevista ?? '')
  const [motivoPendencia, setMotivoPendencia] = useState(posVenda.motivo_pendencia ?? '')
  const [resultado, setResultado] = useState(posVenda.resultado ?? '')
  const [observacoes, setObservacoes] = useState(posVenda.observacoes ?? '')

  return (
    <DetailCard title="Editar dados operacionais" icon={Pencil}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Assunto *</span>
          <input value={assunto} onChange={(event) => setAssunto(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Descrição</span>
          <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={3} className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm text-fg-1 focus:border-accent-primary focus:outline-none" />
        </label>
        <label>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Prioridade</span>
          <select value={prioridade} onChange={(event) => setPrioridade(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1">
            <option value="">Não informada</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Responsável</span>
          <select value={responsavelId} onChange={(event) => setResponsavelId(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1">
            <option value="">Sem responsável</option>
            {(responsaveis ?? []).map((responsavel) => <option key={responsavel.id} value={responsavel.id}>{responsavel.full_name ?? responsavel.email ?? responsavel.id}</option>)}
          </select>
        </label>
        <DateField label="Conclusão prevista" value={dataPrevista} onChange={setDataPrevista} inputClassName="text-sm" />
        <label>
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Motivo da pendência</span>
          <input value={motivoPendencia} onChange={(event) => setMotivoPendencia(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm text-fg-1" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Resultado</span>
          <textarea value={resultado} onChange={(event) => setResultado(event.target.value)} rows={2} className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm text-fg-1" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Observação contratual</span>
          <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm text-fg-1" />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-border-1 pt-5">
        <button type="button" onClick={onCancel} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-2">Cancelar</button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave({
            id: posVenda.id,
            patch: {
              assunto,
              descricao,
              prioridade,
              responsavel_id: responsavelId || null,
              data_conclusao_prevista: dataPrevista || null,
              motivo_pendencia: motivoPendencia,
              resultado,
              observacoes,
            },
          })}
          className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </DetailCard>
  )
}

function Overview({ posVenda, processLabel }: { posVenda: PosVendaDetalhe; processLabel: string }) {
  const apolice = posVenda.apolices
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="space-y-6">
        <DetailCard title="Operação de Pós-venda" icon={ClipboardList}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Processo">{processLabel}</DetailField>
            <DetailField label="Etapa">{posVenda.pipeline_stages?.nome}</DetailField>
            <DetailField label="Status operacional">{posVenda.status ?? 'Não definido no contrato vigente'}</DetailField>
            <DetailField label="Prioridade">{posVenda.prioridade}</DetailField>
            <DetailField label="Responsável">{posVenda.profiles?.full_name}</DetailField>
            <DetailField label="Abertura" mono>{safeDate(posVenda.data_abertura)}</DetailField>
            <DetailField label="Conclusão prevista" mono>{safeDate(posVenda.data_conclusao_prevista)}</DetailField>
            <DetailField label="Conclusão" mono>{safeDate(posVenda.data_conclusao)}</DetailField>
            <DetailField label="Assunto" full>{posVenda.assunto}</DetailField>
            <DetailField label="Descrição" full>{posVenda.descricao}</DetailField>
            <DetailField label="Motivo da pendência" full>{posVenda.motivo_pendencia}</DetailField>
            <DetailField label="Resultado" full>{posVenda.resultado}</DetailField>
          </div>
        </DetailCard>
        {posVenda.observacoes && (
          <DetailCard title="Observação contratual" icon={FileCheck2}>
            <p className="max-w-[72ch] whitespace-pre-wrap text-sm font-medium leading-relaxed text-fg-2">{posVenda.observacoes}</p>
          </DetailCard>
        )}
      </div>
      <DetailCard title="Apólice vinculada" icon={ShieldCheck}>
        <div className="space-y-4">
          <DetailField label="Apólice" mono>{apolice?.numero_apolice}</DetailField>
          <DetailField label="Segurado">{apolice?.segurados?.nome}</DetailField>
          <DetailField label="CPF/CNPJ" mono>{apolice?.segurados?.cpf_cnpj}</DetailField>
          <DetailField label="Seguradora">{apolice?.seguradoras?.nome}</DetailField>
          <DetailField label="Ramo">{apolice?.ramos?.nome}</DetailField>
          <DetailField label="Ramo faturável">{apolice?.ramos?.is_monthly ? 'Sim' : 'Não'}</DetailField>
          <DetailField label="Vigência" mono>{apolice?.vigencia_inicio && apolice.vigencia_fim ? `${fmtDate(apolice.vigencia_inicio)} a ${fmtDate(apolice.vigencia_fim)}` : undefined}</DetailField>
          <DetailField label="Prêmio" mono>{formatCurrency(apolice?.premio_total ?? null)}</DetailField>
        </div>
      </DetailCard>
    </div>
  )
}

export default function PosVendaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const { can } = usePermission('pos_venda')
  const detail = usePosVenda(id)
  const responsaveis = usePosVendaResponsaveis()
  const maintain = useMaintainPosVenda()
  const [editing, setEditing] = useState(false)
  const posVenda = detail.data
  const pipeline = usePosVendaPipeline(posVenda?.pipeline_stages?.pipeline_id)
  const tabsState = useEntityTabsState('pos_venda', id, { filialId: posVenda?.apolices?.segurados?.filial_id })
  const requestedTab = searchParams.get('tab')
  const activeTab: TabId = VALID_TABS.includes(requestedTab as TabId) ? requestedTab as TabId : 'visao'

  if (!id || detail.isError || (!detail.isLoading && !posVenda)) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
        <LifeBuoy size={28} className="mb-3 text-signal-warning" />
        <p className="font-semibold text-fg-2">Pós-venda não encontrado ou sem permissão de acesso.</p>
        <button type="button" onClick={() => navigate('/pos-venda')} className="mt-4 text-sm font-bold text-accent-primary hover:underline">Voltar para Pós-venda</button>
      </div>
    )
  }
  if (detail.isLoading || !posVenda) return <div className="animate-pulse py-24 text-center text-sm font-semibold text-fg-4">Carregando Pós-venda...</div>

  const apolice = posVenda.apolices
  const processo = inferPosVendaProcesso(pipeline.data?.nome ?? null)
  const processLabel = processo === 'ACOMPANHAMENTO_MENSAL'
    ? 'Acompanhamento mensal'
    : processo === 'ONBOARDING'
      ? 'Onboarding do segurado'
      : pipeline.data?.nome ?? 'Processo configurado'
  const canUpdate = can('update')
  const canDelete = can('delete')
  const pendentes = tabsState.tarefas.filter((tarefa) => tarefa.status !== 'Concluída').length
  const tabs: EntityTab<TabId>[] = [
    { id: 'visao', label: 'Visão geral' },
    { id: 'tarefas', label: 'Tarefas', badge: pendentes || undefined },
    { id: 'personalizados', label: 'Campos personalizados' },
    { id: 'anexos', label: 'Anexos e logs', badge: tabsState.anexos.length || undefined },
    { id: 'observacoes', label: 'Observações', badge: tabsState.observacoes.length || undefined },
  ]

  const handleTabChange = (nextTab: TabId) => {
    if (editing) {
      notify({ title: 'Conclua ou cancele a edição', description: 'A edição permanece no mesmo bloco para evitar perda de alterações.', tone: 'warning' })
      return
    }
    const next = new URLSearchParams(searchParams)
    if (nextTab === 'visao') next.delete('tab')
    else next.set('tab', nextTab)
    setSearchParams(next, { replace: true })
  }

  const handleSave = async (input: PosVendaMaintenanceInput) => {
    try {
      const result = await maintain.mutateAsync(input)
      setEditing(false)
      notify({ title: 'Pós-venda atualizado', description: `${result.changedFields} campo(s) alterado(s) com auditoria.`, tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível salvar', description: error instanceof Error ? error.message : 'A operação foi revertida integralmente.', tone: 'danger' })
    }
  }

  const runTabAction = async (action: () => Promise<void>, successTitle?: string) => {
    try {
      await action()
      if (successTitle) notify({ title: successTitle, tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível concluir a ação', description: error instanceof Error ? error.message : 'Tente novamente.', tone: 'danger' })
    }
  }

  const confirmRemove = (title: string, description: string) => confirm({ title, description, confirmLabel: 'Remover', tone: 'danger' })

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-5 flex items-center gap-2 text-sm text-fg-3">
        <button type="button" onClick={() => navigate('/pos-venda')} className="inline-flex items-center gap-1.5 font-semibold hover:text-accent-primary"><ArrowLeft size={15} /> Pós-venda</button>
        <ChevronRight size={14} className="text-fg-4" />
        <span className="truncate font-medium text-fg-1">{posVenda.assunto ?? posVenda.id}</span>
      </div>

      <section className="mb-5 rounded-[8px] border border-border-1 bg-bg-surface p-6 shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] bg-accent-primary-soft text-accent-primary"><LifeBuoy size={25} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-fg-1">{apolice?.segurados?.nome ?? posVenda.assunto ?? 'Pós-venda'}</h1>
                <StatusBadge status={processLabel} tone={processo === 'ACOMPANHAMENTO_MENSAL' ? 'warning' : 'info'} />
              </div>
              <p className="mt-1 text-sm font-semibold text-fg-3">{posVenda.assunto ?? 'Demanda operacional'} · {apolice?.ramos?.nome ?? 'Ramo não informado'}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-fg-3">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {safeDate(posVenda.data_abertura) ?? 'Data não informada'}</span>
                <span className="inline-flex items-center gap-1.5"><ClipboardList size={13} /> {posVenda.pipeline_stages?.nome ?? 'Etapa não identificada'}</span>
                <span className="inline-flex items-center gap-1.5"><UserRound size={13} /> {posVenda.profiles?.full_name ?? 'Sem responsável'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canUpdate && activeTab === 'visao' && !editing && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-full border border-accent-primary px-4 py-2.5 text-sm font-bold text-accent-primary hover:bg-accent-primary-soft"><Pencil size={15} /> Editar</button>}
            {apolice && <button type="button" onClick={() => navigate(`/apolices/${apolice.id}`)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover"><ShieldCheck size={15} /> Abrir Apólice <ExternalLink size={13} /></button>}
          </div>
        </div>
      </section>

      <div className="mb-6 flex items-start gap-3 rounded-[6px] border border-accent-primary/20 bg-accent-primary-soft px-4 py-3 text-sm text-fg-2">
        <FileCheck2 size={18} className="mt-0.5 shrink-0 text-accent-primary" />
        <div><p className="font-bold text-fg-1">Contrato protegido</p><p className="mt-0.5 text-xs font-semibold text-fg-3">A Apólice é imutável e a etapa é movimentada exclusivamente no Kanban. Status não é tratado como etapa nem como campo livre.</p></div>
      </div>

      <EntityTabsBar tabs={tabs} active={activeTab} onChange={handleTabChange} />
      <div role="tabpanel">
        {activeTab === 'visao' && (editing
          ? <EditForm posVenda={posVenda} responsaveis={responsaveis.data} saving={maintain.isPending} onCancel={() => setEditing(false)} onSave={(input) => void handleSave(input)} />
          : <Overview posVenda={posVenda} processLabel={processLabel} />)}
        {activeTab === 'tarefas' && (tabsState.tarefas.length > 0 || canUpdate
          ? <TarefasTab tarefas={tabsState.tarefas} onAdd={(task) => void runTabAction(() => tabsState.addTarefa(task), 'Tarefa criada')} onEdit={canUpdate ? (taskId, task) => void runTabAction(() => tabsState.updateTarefa(taskId, task), 'Tarefa atualizada') : undefined} onToggle={(taskId) => void runTabAction(() => tabsState.toggleTarefa(taskId))} onRemove={canDelete ? (taskId) => void (async () => { if (await confirmRemove('Remover tarefa?', 'A tarefa será removida deste Pós-venda.')) await runTabAction(() => tabsState.removeTarefa(taskId), 'Tarefa removida') })() : undefined} readOnly={!canUpdate} />
          : <EmptyState icon={ClipboardList} title="Nenhuma tarefa registrada" hint="Onboarding e acompanhamentos são representados por atividades do Pós-venda." />)}
        {activeTab === 'personalizados' && <CamposPersonalizadosTab entidadeTipo="pos_venda" entidadeId={posVenda.id} readOnly={!canUpdate} />}
        {activeTab === 'anexos' && <AnexosLogsTab anexos={tabsState.anexos} logs={tabsState.logs} onAddAnexo={tabsState.addAnexo} onEditAnexo={canUpdate ? (anexoId, anexo) => void runTabAction(() => tabsState.updateAnexo(anexoId, anexo), 'Metadados atualizados') : undefined} onRemoveAnexo={canDelete ? (anexoId) => void (async () => { if (await confirmRemove('Remover anexo?', 'Somente os metadados do mock serão removidos.')) await runTabAction(() => tabsState.removeAnexo(anexoId), 'Metadado removido') })() : undefined} autorPadrao="Usuário da sessão" showAuditLogs={tabsState.showAuditLogs} onToggleAuditLogs={tabsState.setShowAuditLogs} metadataOnly readOnly={!canUpdate} />}
        {activeTab === 'observacoes' && <ObservacoesTab observacoes={tabsState.observacoes} onAdd={tabsState.addObservacao} onTogglePin={tabsState.togglePin} mentionCandidates={tabsState.mentionCandidates} readOnly={!canUpdate} />}
      </div>
    </div>
  )
}
