import { usesBackendDomainData } from '../lib/backendDomainApi'
import { opportunityPermissionContext } from '../modules/plataforma/platformDomain'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Edit3,
  Mail,
  Phone,
  Save,
  Send,
  Target,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { EntityTabsBar, type EntityTab } from '../components/detail/EntityTabsBar'
import { DetailCard, DetailField, GhostButton, StatusBadge } from '../components/detail/primitives'
import AnexosLogsTab from '../components/detail/tabs/AnexosLogsTab'
import CamposPersonalizadosTab from '../components/detail/tabs/CamposPersonalizadosTab'
import ObservacoesTab from '../components/detail/tabs/ObservacoesTab'
import TarefasTab from '../components/detail/tabs/TarefasTab'
import { useEntityTabsState } from '../components/detail/useEntityTabsState'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import ConcludeCardModal from '../components/kanban/ConcludeCardModal'
import LeadQualificationPanel from '../components/oportunidades/LeadQualificationPanel'
import CalculationsTab from '../components/oportunidades/CalculationsTab'
import {
  useOportunidade,
  useOpportunityProfiles,
  useUpdateOportunidade,
  type OpportunityDetail,
} from '../hooks/useOportunidades'
import { useOrigens, useRamos } from '../hooks/useLookups'
import { usePermission } from '../hooks/usePermission'
import { usePropostas } from '../contexts/usePropostas'
import {
  deriveOpportunityStatus,
  buildOpportunityQualificationPatch,
  mapOpportunityToKanbanCard,
  opportunityCustomerLabel,
  opportunityTitle,
  type OpportunityUpdate,
} from '../modules/comercial/opportunityDomain'
import { normalizePipelineStageRow, type CardStatus } from '../modules/types'
import { fmtDate } from '../utils/date'
import { formatCpfCnpj, onlyDigits } from '../utils/documento'

type TabId = 'visao' | 'calculos' | 'tarefas' | 'personalizados' | 'anexos' | 'observacoes'
const VALID_TABS: TabId[] = ['visao', 'calculos', 'tarefas', 'personalizados', 'anexos', 'observacoes']

interface OpportunityDraft {
  titulo: string
  descricao: string
  ramoId: string
  origemId: string
  responsavelId: string
  prioridade: string
  premioEstimado: string
  comissaoEstimada: string
  comissaoPercentual: string
  agenciamentoPercentual: string
  dataAbertura: string
  fechamentoPrevisto: string
  campanha: string
  observacoes: string
}

const inputClass =
  'w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function toDraft(row: OpportunityDetail): OpportunityDraft {
  return {
    titulo: row.titulo ?? '',
    descricao: row.descricao ?? '',
    ramoId: row.ramo_id ?? '',
    origemId: row.origem_id ?? '',
    responsavelId: row.responsavel_id ?? '',
    prioridade: row.prioridade ?? '',
    premioEstimado: row.valor_premio_estimado?.toString() ?? '',
    comissaoEstimada: row.valor_comissao_estimada?.toString() ?? '',
    comissaoPercentual: row.comissao_estimada_pct?.toString() ?? '',
    agenciamentoPercentual: row.agenciamento_pct?.toString() ?? '',
    dataAbertura: row.data_abertura ?? '',
    fechamentoPrevisto: row.data_fechamento_prevista ?? '',
    campanha: row.campanha ?? '',
    observacoes: row.observacoes ?? '',
  }
}

function numberOrNull(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function draftToPatch(draft: OpportunityDraft): OpportunityUpdate {
  const text = (value: string) => value.trim() || null
  return {
    titulo: text(draft.titulo),
    descricao: text(draft.descricao),
    ramo_id: draft.ramoId || null,
    origem_id: draft.origemId || null,
    responsavel_id: draft.responsavelId || null,
    prioridade: text(draft.prioridade),
    valor_premio_estimado: numberOrNull(draft.premioEstimado),
    valor_comissao_estimada: numberOrNull(draft.comissaoEstimada),
    comissao_estimada_pct: numberOrNull(draft.comissaoPercentual),
    agenciamento_pct: numberOrNull(draft.agenciamentoPercentual),
    data_abertura: draft.dataAbertura || null,
    data_fechamento_prevista: draft.fechamentoPrevisto || null,
    campanha: text(draft.campanha),
    observacoes: text(draft.observacoes),
  }
}

export default function OportunidadeDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const detail = useOportunidade(id)
  const update = useUpdateOportunidade()
  const profiles = useOpportunityProfiles()
  const ramos = useRamos()
  const origens = useOrigens()
  const { can } = usePermission('comercial', opportunityPermissionContext(detail.data))
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const { transmitRenewalOpportunity } = usePropostas()
  const [draft, setDraft] = useState<OpportunityDraft | null>(null)
  const [qualifying, setQualifying] = useState(false)
  const [concludeMode, setConcludeMode] = useState<Exclude<CardStatus, 'pending'> | null>(null)

  const row = detail.data
  const pipelineId = row?.pipeline_stage?.pipeline_id
  const tabsState = useEntityTabsState('oportunidade', id, { filialId: row?.filial_id })
  const requestedTab = searchParams.get('tab')
  const activeTab: TabId = VALID_TABS.includes(requestedTab as TabId) ? requestedTab as TabId : 'visao'

  const normalizedStage = row?.pipeline_stage ? normalizePipelineStageRow(row.pipeline_stage) : undefined
  const card = row
    ? mapOpportunityToKanbanCard(
        row,
        {
          segurado: row.segurados,
          ramo: row.ramos,
          origem: row.origens,
          motivoPerda: row.motivos_perda,
          responsavel: row.profiles,
        },
        normalizedStage,
      )
    : null
  const status = row ? deriveOpportunityStatus(row) : 'pending'
  const isEditing = draft !== null || qualifying
  const canUpdate = can('update')
  const canDelete = can('delete')
  const canCreate = can('create')

  const handleTabChange = (nextTab: TabId) => {
    if (isEditing) {
      notify({
        title: 'Conclua ou cancele a edição',
        description: 'A oportunidade permanece no bloco atual para evitar perda de alterações.',
        tone: 'warning',
      })
      return
    }
    const next = new URLSearchParams(searchParams)
    if (nextTab === 'visao') next.delete('tab')
    else next.set('tab', nextTab)
    setSearchParams(next, { replace: true })
  }

  const goBack = async () => {
    if (isEditing) {
      const discard = await confirm({
        title: 'Descartar alterações?',
        description: 'As informações ainda não salvas serão perdidas.',
        confirmLabel: 'Descartar',
        tone: 'warning',
      })
      if (!discard) return
    }
    navigate('/oportunidades')
  }

  const saveOverview = async () => {
    if (!id || !draft) return
    try {
      await update.mutateAsync({ id, patch: draftToPatch(draft) })
      setDraft(null)
      notify({ title: 'Oportunidade atualizada', description: 'As alterações da Visão geral foram salvas.', tone: 'success' })
    } catch (cause) {
      notify({ title: 'Não foi possível salvar', description: cause instanceof Error ? cause.message : 'Revise os campos informados.', tone: 'danger' })
    }
  }

  const qualifyLead = async (seguradoId: string) => {
    if (!id) return
    await update.mutateAsync({ id, patch: buildOpportunityQualificationPatch(seguradoId) })
    setQualifying(false)
    notify({ title: 'Lead qualificado', description: 'O segurado foi vinculado sem alterar a identidade da oportunidade.', tone: 'success' })
  }

  const runTabAction = async (operation: () => Promise<void>, success: string) => {
    try {
      await operation()
      notify({ title: success, tone: 'success' })
    } catch (cause) {
      notify({ title: 'Não foi possível concluir', description: cause instanceof Error ? cause.message : 'Tente novamente.', tone: 'danger' })
    }
  }

  const confirmRemove = (title: string, description: string) => confirm({ title, description, confirmLabel: 'Remover', tone: 'danger' })

  const transmitRenewal = async () => {
    if (!id) return
    const accepted = await confirm({
      title: 'Transmitir renovação',
      description: 'Será criada uma nova apólice em emissão vinculada ao contrato anterior.',
      confirmLabel: 'Transmitir',
      tone: 'warning',
    })
    if (!accepted) return
    try {
      const result = transmitRenewalOpportunity(id)
      notify({ title: 'Renovação transmitida', description: 'A sucessora foi criada em emissão.', tone: 'success' })
      navigate(`/apolices/${result.policyId}?documento=${result.documentId}`)
    } catch (cause) {
      notify({ title: 'Não foi possível transmitir', description: cause instanceof Error ? cause.message : 'Revise a oportunidade.', tone: 'danger' })
    }
  }

  if (!id) return <PageMessage message="Identificador de oportunidade inválido." onBack={() => navigate('/oportunidades')} />
  if (detail.isLoading) return <OpportunitySkeleton />
  if (detail.isError || !row) return <PageMessage message="Oportunidade não encontrada ou sem permissão de acesso." onBack={() => navigate('/oportunidades')} onRetry={() => void detail.refetch()} />

  const pendingTasks = tabsState.tarefas.filter((task) => task.status !== 'Concluída').length
  const tabs: EntityTab<TabId>[] = [
    { id: 'visao', label: 'Visão geral' },
    { id: 'calculos', label: 'Cálculos' },
    { id: 'tarefas', label: 'Tarefas', badge: pendingTasks || undefined },
    { id: 'personalizados', label: 'Campos personalizados' },
    { id: 'anexos', label: 'Anexos e logs', badge: tabsState.anexos.length || undefined },
    { id: 'observacoes', label: 'Observações', badge: tabsState.observacoes.length || undefined },
  ]

  const title = opportunityTitle(row, { segurado: row.segurados })
  const customer = opportunityCustomerLabel(row, { segurado: row.segurados })
  const statusLabel = status === 'won' ? 'Ganha' : status === 'lost' ? 'Perdida' : 'Em andamento'
  const statusTone = status === 'won' ? 'success' : status === 'lost' ? 'danger' : 'info'

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-5 flex items-center gap-2 text-sm text-fg-3">
        <button type="button" onClick={() => void goBack()} className="inline-flex items-center gap-1.5 hover:text-accent-primary"><ArrowLeft size={15} /> Oportunidades</button>
        <ChevronRight size={14} className="text-fg-4" />
        <span className="truncate font-medium text-fg-1">{title}</span>
      </div>

      <section className="mb-6 border-b border-border-1 pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-fg-1">{title}</h1>
              <StatusBadge status={statusLabel} tone={statusTone} />
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${row.segurado_id ? 'bg-signal-success/15 text-signal-success' : 'bg-signal-warning/15 text-signal-warning'}`}>
                {row.segurado_id ? 'Segurado' : 'Lead'}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-fg-3">{customer}{row.ramos?.nome ? ` · ${row.ramos.nome}` : ''}{normalizedStage?.name ? ` · ${normalizedStage.name}` : ''}</p>
            <p className="mt-2 font-mono text-xs text-fg-4">#{row.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {row.apolice_origem_id && status === 'pending' && (
              <button type="button" onClick={() => void transmitRenewal()} className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary-soft px-4 py-2.5 text-xs font-black text-accent-primary hover:bg-accent-primary/15"><Send size={14} /> Transmitir renovação</button>
            )}
            {status === 'pending' && normalizedStage?.is_win_eligible && (
              <button type="button" onClick={() => setConcludeMode('won')} className="inline-flex items-center gap-2 rounded-full bg-signal-success/15 px-4 py-2.5 text-xs font-black text-signal-success hover:bg-signal-success/25"><Check size={14} /> Marcar como ganha</button>
            )}
            {status === 'pending' && (
              <button type="button" onClick={() => setConcludeMode('lost')} className="inline-flex items-center gap-2 rounded-full bg-signal-danger/10 px-4 py-2.5 text-xs font-black text-signal-danger hover:bg-signal-danger/20"><X size={14} /> Marcar como perdida</button>
            )}
          </div>
        </div>
      </section>

      <EntityTabsBar tabs={tabs} active={activeTab} onChange={handleTabChange} wrap />

      <div role="tabpanel">
        {activeTab === 'visao' && (
          <div className="space-y-5">
            {!row.segurado_id && qualifying && (
              <LeadQualificationPanel opportunity={row} onCancel={() => setQualifying(false)} onQualify={qualifyLead} />
            )}
            {draft ? (
              <OpportunityOverviewEditor
                draft={draft}
                onChange={setDraft}
                onCancel={() => setDraft(null)}
                onSave={() => void saveOverview()}
                isSaving={update.isPending}
                ramos={ramos.data ?? []}
                origens={origens.data ?? []}
                profiles={profiles.data ?? []}
                showAgenciamento={row.ramos?.risk_type === 'VIDA' || row.ramos?.risk_type === 'SAUDE'}
              />
            ) : (
              <OpportunityOverview
                row={row}
                onEdit={canUpdate && !qualifying ? () => setDraft(toDraft(row)) : undefined}
                onQualify={!row.segurado_id && canUpdate && !qualifying ? () => setQualifying(true) : undefined}
              />
            )}
          </div>
        )}
        {activeTab === 'calculos' && <CalculationsTab opportunity={row} canCreate={canCreate} />}
        {activeTab === 'tarefas' && (
          <TarefasTab
            tarefas={tabsState.tarefas}
            onAdd={(task) => void runTabAction(() => tabsState.addTarefa(task), 'Tarefa criada')}
            onEdit={canUpdate ? (taskId, task) => void runTabAction(() => tabsState.updateTarefa(taskId, task), 'Tarefa atualizada') : undefined}
            onToggle={(taskId) => void runTabAction(() => tabsState.toggleTarefa(taskId), 'Tarefa atualizada')}
            onRemove={canDelete ? (taskId) => void (async () => { if (await confirmRemove('Remover tarefa?', 'A tarefa será removida desta oportunidade.')) await runTabAction(() => tabsState.removeTarefa(taskId), 'Tarefa removida') })() : undefined}
            readOnly={!canUpdate}
          />
        )}
        {activeTab === 'personalizados' && <CamposPersonalizadosTab entidadeTipo="oportunidade" entidadeId={row.id} readOnly={!canUpdate} />}
        {activeTab === 'anexos' && (
          <AnexosLogsTab
            anexos={tabsState.anexos}
            logs={tabsState.logs}
            onAddAnexo={tabsState.addAnexo}
            onEditAnexo={canUpdate ? (anexoId, anexo) => void runTabAction(() => tabsState.updateAnexo(anexoId, anexo), 'Metadados atualizados') : undefined}
            onRemoveAnexo={canDelete ? (anexoId) => void (async () => { if (await confirmRemove('Remover anexo?', 'Somente os metadados mantidos no mock serão removidos.')) await runTabAction(() => tabsState.removeAnexo(anexoId), 'Metadado removido') })() : undefined}
            autorPadrao="Usuário da sessão"
            showAuditLogs={tabsState.showAuditLogs}
            onToggleAuditLogs={tabsState.setShowAuditLogs}
            metadataOnly
            readOnly={!canUpdate}
          />
        )}
        {activeTab === 'observacoes' && (
          <ObservacoesTab observacoes={tabsState.observacoes} onAdd={tabsState.addObservacao} onTogglePin={tabsState.togglePin} mentionCandidates={tabsState.mentionCandidates} readOnly={!canUpdate} />
        )}
      </div>

      {card && pipelineId && (
        <ConcludeCardModal
          isOpen={concludeMode !== null}
          onClose={() => setConcludeMode(null)}
          card={card}
          module="comercial"
          pipelineId={pipelineId}
          mode={concludeMode ?? 'won'}
          onDone={() => void detail.refetch()}
        />
      )}
    </div>
  )
}

function OpportunityOverview({
  row,
  onEdit,
  onQualify,
}: {
  row: OpportunityDetail
  onEdit?: () => void
  onQualify?: () => void
}) {
  const phone = row.segurados?.telefone ?? row.lead_telefone
  const email = row.segurados?.email ?? row.lead_email
  const document = row.segurados?.cpf_cnpj ?? row.lead_documento
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-5">
        <DetailCard title="Identidade comercial" icon={Target} action={onEdit ? <GhostButton icon={Edit3} onClick={onEdit}>Editar</GhostButton> : undefined}>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
            <DetailField label="Título">{row.titulo}</DetailField>
            <DetailField label={row.segurado_id ? 'Segurado' : 'Lead'}>{row.segurados?.nome ?? row.lead_nome}</DetailField>
            <DetailField label="Documento" mono>{document ? formatCpfCnpj(document) : null}</DetailField>
            <DetailField label="Ramo">{row.ramos?.nome}</DetailField>
            <DetailField label="Origem">{row.origens?.nome}</DetailField>
            <DetailField label="Prioridade">{row.prioridade}</DetailField>
            <DetailField label="Responsável">{row.profiles?.nome_completo}</DetailField>
            <DetailField label="Etapa">{row.pipeline_stage?.nome}</DetailField>
            <DetailField label="Campanha">{row.campanha}</DetailField>
            <DetailField label="Descrição" full>{row.descricao}</DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Estimativas e datas" icon={CircleDollarSign}>
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
            <DetailField label="Prêmio estimado">{row.valor_premio_estimado != null ? money.format(row.valor_premio_estimado) : null}</DetailField>
            <DetailField label="Comissão estimada">{row.valor_comissao_estimada != null ? money.format(row.valor_comissao_estimada) : null}</DetailField>
            <DetailField label="Comissão estimada (%)">{row.comissao_estimada_pct != null ? `${row.comissao_estimada_pct}%` : null}</DetailField>
            {(row.ramos?.risk_type === 'VIDA' || row.ramos?.risk_type === 'SAUDE') && <DetailField label="Agenciamento (%)">{row.agenciamento_pct != null ? `${row.agenciamento_pct}%` : null}</DetailField>}
            <DetailField label="Data de abertura">{row.data_abertura ? fmtDate(row.data_abertura) : null}</DetailField>
            <DetailField label="Fechamento previsto">{row.data_fechamento_prevista ? fmtDate(row.data_fechamento_prevista) : null}</DetailField>
          </div>
        </DetailCard>
      </div>

      <div className="space-y-5">
        <DetailCard title="Contato" icon={UserRoundCheck} action={onQualify ? <GhostButton icon={UserRoundCheck} onClick={onQualify}>Qualificar lead</GhostButton> : undefined}>
          <div className="space-y-4">
            <DetailField label="Nome">{row.segurados?.nome ?? row.lead_nome}</DetailField>
            <DetailField label="Telefone">{phone ? <a href={`tel:${onlyDigits(phone)}`} className="inline-flex items-center gap-2 text-accent-primary hover:underline"><Phone size={14} /> {phone}</a> : null}</DetailField>
            <DetailField label="E-mail">{email ? <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-accent-primary hover:underline"><Mail size={14} /> {email}</a> : null}</DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Registro" icon={CalendarDays}>
          <div className="space-y-4">
            <DetailField label="Observações internas">{row.observacoes}</DetailField>
            {row.perdida_em && <DetailField label="Motivo da perda">{row.motivos_perda?.nome}</DetailField>}
            {row.motivo_perda_observacao && <DetailField label="Contexto da perda">{row.motivo_perda_observacao}</DetailField>}
          </div>
        </DetailCard>
      </div>
    </div>
  )
}

function OpportunityOverviewEditor({
  draft,
  onChange,
  onCancel,
  onSave,
  isSaving,
  ramos,
  origens,
  profiles,
  showAgenciamento,
}: {
  draft: OpportunityDraft
  onChange: (draft: OpportunityDraft) => void
  onCancel: () => void
  onSave: () => void
  isSaving: boolean
  ramos: Array<{ id: string; nome: string }>
  origens: Array<{ id: string; nome: string }>
  profiles: Array<{ id: string; nome_completo: string | null }>
  showAgenciamento: boolean
}) {
  const change = <K extends keyof OpportunityDraft>(key: K, value: OpportunityDraft[K]) => onChange({ ...draft, [key]: value })
  return (
    <DetailCard
      title="Editar Visão geral"
      icon={Edit3}
      action={<div className="flex items-center gap-2"><button type="button" onClick={onCancel} disabled={isSaving} className="rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 hover:bg-bg-surface-2 disabled:opacity-40"><X size={14} className="inline" /> Cancelar</button><button type="button" onClick={onSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40"><Save size={14} /> {isSaving ? 'Salvando…' : 'Salvar alterações'}</button></div>}
    >
      <p className="mb-4 text-sm text-fg-3" hidden={!usesBackendDomainData}>Os campos desabilitados aguardam suporte da integração. A data de abertura é definida no cadastro.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Título" span="lg:col-span-2"><input value={draft.titulo} onChange={(event) => change('titulo', event.target.value)} className={inputClass} /></Field>
        <Field label="Prioridade"><select disabled={usesBackendDomainData} value={draft.prioridade} onChange={(event) => change('prioridade', event.target.value)} className={inputClass}><option value="">Não informada</option><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></Field>
        <Field label="Ramo"><select value={draft.ramoId} onChange={(event) => change('ramoId', event.target.value)} className={inputClass}><option value="">Não informado</option>{ramos.map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}</select></Field>
        <Field label="Origem"><select value={draft.origemId} onChange={(event) => change('origemId', event.target.value)} className={inputClass}><option value="">Não informada</option>{origens.map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}</select></Field>
        <Field label="Responsável"><select value={draft.responsavelId} onChange={(event) => change('responsavelId', event.target.value)} className={inputClass}><option value="">Não atribuído</option>{profiles.map((row) => <option key={row.id} value={row.id}>{row.nome_completo ?? 'Usuário sem nome'}</option>)}</select></Field>
        <Field label="Prêmio estimado"><input inputMode="decimal" value={draft.premioEstimado} onChange={(event) => change('premioEstimado', event.target.value)} className={`${inputClass} font-mono`} /></Field>
        <Field label="Comissão estimada"><input inputMode="decimal" disabled={usesBackendDomainData} value={draft.comissaoEstimada} onChange={(event) => change('comissaoEstimada', event.target.value)} className={`${inputClass} font-mono`} /></Field>
        <Field label="Comissão estimada (%)"><input inputMode="decimal" value={draft.comissaoPercentual} onChange={(event) => change('comissaoPercentual', event.target.value)} className={`${inputClass} font-mono`} /></Field>
        {showAgenciamento && <Field label="Agenciamento (%)"><input inputMode="decimal" value={draft.agenciamentoPercentual} onChange={(event) => change('agenciamentoPercentual', event.target.value)} className={`${inputClass} font-mono`} /></Field>}
        <Field label="Data de abertura"><input type="date" disabled={usesBackendDomainData} value={draft.dataAbertura} onChange={(event) => change('dataAbertura', event.target.value)} className={inputClass} /></Field>
        <Field label="Fechamento previsto"><input type="date" disabled={usesBackendDomainData} value={draft.fechamentoPrevisto} onChange={(event) => change('fechamentoPrevisto', event.target.value)} className={inputClass} /></Field>
        <Field label="Campanha"><input disabled={usesBackendDomainData} value={draft.campanha} onChange={(event) => change('campanha', event.target.value)} className={inputClass} /></Field>
        <Field label="Descrição" span="sm:col-span-2 lg:col-span-3"><textarea rows={3} value={draft.descricao} onChange={(event) => change('descricao', event.target.value)} className={`${inputClass} resize-none`} /></Field>
        <Field label="Observações internas" span="sm:col-span-2 lg:col-span-3"><textarea rows={3} disabled={usesBackendDomainData} value={draft.observacoes} onChange={(event) => change('observacoes', event.target.value)} className={`${inputClass} resize-none`} /></Field>
      </div>
    </DetailCard>
  )
}

function Field({ label, span = '', children }: { label: string; span?: string; children: ReactNode }) {
  return <label className={`space-y-1.5 ${span}`}><span className="text-[10px] font-black uppercase tracking-widest text-fg-4">{label}</span>{children}</label>
}

function OpportunitySkeleton() {
  return <div className="animate-pulse space-y-6"><div className="h-6 w-52 rounded bg-bg-surface-2" /><div className="h-24 rounded-[8px] bg-bg-surface-2" /><div className="h-10 rounded bg-bg-surface-2" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-72 rounded-[8px] bg-bg-surface-2" /><div className="h-72 rounded-[8px] bg-bg-surface-2" /></div></div>
}

function PageMessage({ message, onBack, onRetry }: { message: string; onBack: () => void; onRetry?: () => void }) {
  return <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-center"><p className="text-sm font-semibold text-fg-3">{message}</p>{onRetry && <button type="button" onClick={onRetry} className="text-sm font-bold text-accent-primary">Tentar novamente</button>}<button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-bold text-fg-on-brand"><ArrowLeft size={15} /> Voltar para Oportunidades</button></div>
}
