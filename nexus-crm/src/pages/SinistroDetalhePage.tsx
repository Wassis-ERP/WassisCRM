import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  MapPin,
  Pencil,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import SinistroMaintenanceForm, { SinistroEnvolvidosEditor } from '../components/sinistro/SinistroMaintenanceForm'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import { EntityTabsBar, type EntityTab } from '../components/detail/EntityTabsBar'
import { DetailCard, DetailField, EmptyState, StatusBadge, type BadgeTone } from '../components/detail/primitives'
import AnexosLogsTab from '../components/detail/tabs/AnexosLogsTab'
import CamposPersonalizadosTab from '../components/detail/tabs/CamposPersonalizadosTab'
import ObservacoesTab from '../components/detail/tabs/ObservacoesTab'
import TarefasTab from '../components/detail/tabs/TarefasTab'
import { useEntityTabsState } from '../components/detail/useEntityTabsState'
import { usePermission } from '../hooks/usePermission'
import {
  useMaintainSinistro,
  useSinistro,
  useSinistroResponsaveis,
  type SinistroEnvolvidoDetalhe,
} from '../hooks/useSinistros'
import type { SinistroStatus } from '../types/database'
import { fmtDate } from '../utils/date'

type TabId = 'visao' | 'envolvidos' | 'tarefas' | 'personalizados' | 'anexos' | 'observacoes'

const VALID_TABS: TabId[] = ['visao', 'envolvidos', 'tarefas', 'personalizados', 'anexos', 'observacoes']

const STATUS_VIEW: Record<SinistroStatus, { label: string; tone: BadgeTone }> = {
  aberto: { label: 'Aberto', tone: 'info' },
  reaberto: { label: 'Reaberto', tone: 'warning' },
  encerrado_sem_indenizacao: { label: 'Encerrado sem indenização', tone: 'neutral' },
  encerrado_com_indenizacao: { label: 'Encerrado com indenização', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
}

function formatCurrency(value: number | null): string | undefined {
  if (value == null) return undefined
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function safeDate(value: string | null): string | undefined {
  return value ? fmtDate(value) : undefined
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Carregando sinistro">
      <div className="h-5 w-56 rounded bg-bg-surface-3" />
      <div className="rounded-[8px] border border-border-1 bg-bg-surface p-6">
        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-[8px] bg-bg-surface-3" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-72 max-w-full rounded bg-bg-surface-3" />
            <div className="h-4 w-96 max-w-full rounded bg-bg-surface-2" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-[8px] bg-bg-surface-2" />
        <div className="h-64 rounded-[8px] bg-bg-surface-2" />
      </div>
    </div>
  )
}

export default function SinistroDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [editing, setEditing] = useState<'overview' | 'envolvidos' | null>(null)
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const { can } = usePermission('sinistro')
  const detail = useSinistro(id)
  const responsaveis = useSinistroResponsaveis()
  const maintain = useMaintainSinistro()
  const sinistro = detail.data
  const filialId = sinistro?.apolices?.segurados?.filial_id ?? null
  const tabsState = useEntityTabsState('sinistro', id, { filialId })

  const requestedTab = searchParams.get('tab')
  const activeTab: TabId = VALID_TABS.includes(requestedTab as TabId) ? requestedTab as TabId : 'visao'

  if (!id) {
    return (
      <EmptyPage
        message="Identificador de Sinistro inválido."
        onBack={() => navigate('/sinistros')}
      />
    )
  }

  if (detail.isLoading) return <LoadingState />

  if (detail.isError || !sinistro) {
    return (
      <EmptyPage
        message="Sinistro não encontrado ou sem permissão de acesso."
        onBack={() => navigate('/sinistros')}
        onRetry={() => detail.refetch()}
      />
    )
  }

  const status = sinistro.status ? STATUS_VIEW[sinistro.status] : STATUS_VIEW.aberto
  const apolice = sinistro.apolices
  const segurado = apolice?.segurados
  const envolvidos = sinistro.sinistro_envolvidos ?? []
  const pendentes = tabsState.tarefas.filter((tarefa) => tarefa.status !== 'Concluída').length
  const canUpdate = can('update')
  const canDelete = can('delete')

  const tabs: EntityTab<TabId>[] = [
    { id: 'visao', label: 'Visão geral' },
    { id: 'envolvidos', label: 'Envolvidos', badge: envolvidos.length || undefined },
    { id: 'tarefas', label: 'Tarefas', badge: pendentes || undefined },
    { id: 'personalizados', label: 'Campos personalizados' },
    { id: 'anexos', label: 'Anexos e logs', badge: tabsState.anexos.length || undefined },
    { id: 'observacoes', label: 'Observações', badge: tabsState.observacoes.length || undefined },
  ]

  const handleTabChange = (nextTab: TabId) => {
    if (editing) {
      notify({
        title: 'Conclua ou cancele a edição',
        description: 'A edição permanece no bloco atual para evitar perda de alterações.',
        tone: 'warning',
      })
      return
    }
    const next = new URLSearchParams(searchParams)
    if (nextTab === 'visao') next.delete('tab')
    else next.set('tab', nextTab)
    setSearchParams(next, { replace: true })
  }

  const handleSave = async (input: Parameters<typeof maintain.mutateAsync>[0]) => {
    try {
      const result = await maintain.mutateAsync(input)
      setEditing(null)
      notify({
        title: 'Sinistro atualizado',
        description: `${result.changedFields} campo(s) e ${result.insertedEnvolvidos + result.updatedEnvolvidos + result.removedEnvolvidos} envolvido(s) alterados.`,
        tone: 'success',
      })
    } catch (error) {
      notify({
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'A operação foi revertida integralmente.',
        tone: 'danger',
      })
    }
  }

  const confirmRemove = (title: string, description: string) => confirm({
    title,
    description,
    confirmLabel: 'Remover',
    tone: 'danger',
  })

  const runTabAction = async (action: () => Promise<void>, successTitle?: string) => {
    try {
      await action()
      if (successTitle) notify({ title: successTitle, tone: 'success' })
    } catch (error) {
      notify({
        title: 'Não foi possível concluir a ação',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex items-center gap-2 text-sm text-fg-3">
        <button
          type="button"
          onClick={() => navigate('/sinistros')}
          className="flex items-center gap-1.5 transition-colors hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
        >
          <ArrowLeft size={15} /> Sinistros
        </button>
        <ChevronRight size={14} className="text-fg-4" />
        <span className="truncate font-medium text-fg-1">
          {sinistro.numero_sinistro ? `Sinistro ${sinistro.numero_sinistro}` : `Aviso ${sinistro.numero_aviso ?? sinistro.id}`}
        </span>
      </div>

      <section className="mb-5 rounded-[8px] border border-border-1 bg-bg-surface p-6 shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] bg-signal-danger/10 text-signal-danger">
              <AlertTriangle size={25} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-fg-1">
                  {segurado?.nome ?? 'Sinistro sem segurado identificado'}
                </h1>
                <StatusBadge status={status.label} tone={status.tone} />
              </div>
              <p className="mt-1 text-sm font-semibold text-fg-3">
                {[
                  sinistro.numero_sinistro ? `Sinistro ${sinistro.numero_sinistro}` : `Aviso ${sinistro.numero_aviso ?? 'sem número'}`,
                  apolice?.ramos?.nome,
                  apolice?.seguradoras?.nome,
                ].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-fg-3">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <CalendarDays size={13} /> {safeDate(sinistro.data_ocorrencia) ?? 'Data não informada'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClipboardList size={13} /> {sinistro.pipeline_stages?.nome ?? 'Etapa não identificada'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound size={13} /> {sinistro.profiles?.full_name ?? 'Sem responsável'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canUpdate && activeTab === 'visao' && editing === null && (
              <button
                type="button"
                onClick={() => setEditing('overview')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-accent-primary bg-bg-surface px-4 py-2.5 text-sm font-bold text-accent-primary transition-colors hover:bg-accent-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
              >
                <Pencil size={15} /> Editar Sinistro
              </button>
            )}
            {apolice && (
              <button
                type="button"
                onClick={() => navigate(`/apolices/${apolice.id}`)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-sm font-semibold text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40"
              >
                <ShieldCheck size={16} /> Abrir apólice <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mb-6 flex items-start gap-3 rounded-[6px] border border-accent-primary/20 bg-accent-primary-soft px-4 py-3 text-sm text-fg-2">
        <FileCheck2 size={18} className="mt-0.5 shrink-0 text-accent-primary" />
        <div>
          <p className="font-bold text-fg-1">Manutenção contratual controlada</p>
          <p className="mt-0.5 text-xs font-semibold text-fg-3">
            Apólice e status permanecem protegidos. A etapa continua sendo movimentada exclusivamente pelo Kanban.
          </p>
        </div>
      </div>

      <EntityTabsBar tabs={tabs} active={activeTab} onChange={handleTabChange} />

      <div role="tabpanel">
        {activeTab === 'visao' && (editing === 'overview' ? (
          <SinistroMaintenanceForm
            sinistro={sinistro}
            responsaveis={responsaveis.data ?? []}
            isSaving={maintain.isPending}
            onCancel={() => setEditing(null)}
            onSave={(input) => void handleSave(input)}
          />
        ) : <VisaoGeral sinistro={sinistro} />)}
        {activeTab === 'envolvidos' && (editing === 'envolvidos' ? (
          <SinistroEnvolvidosEditor
            sinistro={sinistro}
            isSaving={maintain.isPending}
            onCancel={() => setEditing(null)}
            onSave={(input) => void handleSave(input)}
            onConfirmRemove={(nome) => confirmRemove('Remover envolvido?', `${nome} será removido deste Sinistro.`)}
            onLastInsuredBlocked={() => notify({
              title: 'O último segurado não pode ser removido',
              description: 'Todo Sinistro deve manter ao menos um envolvido do tipo Segurado.',
              tone: 'warning',
            })}
          />
        ) : (
          <Envolvidos
            envolvidos={envolvidos}
            action={canUpdate ? (
              <button type="button" onClick={() => setEditing('envolvidos')} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-accent-primary hover:bg-accent-primary-soft">
                <Pencil size={14} /> Editar
              </button>
            ) : undefined}
          />
        ))}
        {activeTab === 'tarefas' && (
          <TarefasTab
            tarefas={tabsState.tarefas}
            onAdd={(task) => void runTabAction(() => tabsState.addTarefa(task), 'Tarefa criada')}
            onEdit={canUpdate ? (taskId, task) => void runTabAction(() => tabsState.updateTarefa(taskId, task), 'Tarefa atualizada') : undefined}
            onToggle={(taskId) => void runTabAction(() => tabsState.toggleTarefa(taskId))}
            onRemove={canDelete ? (taskId) => void (async () => {
              if (await confirmRemove('Remover tarefa?', 'A tarefa será excluída deste Sinistro.')) {
                await runTabAction(() => tabsState.removeTarefa(taskId), 'Tarefa removida')
              }
            })() : undefined}
            readOnly={!canUpdate}
          />
        )}
        {activeTab === 'personalizados' && (
          <CamposPersonalizadosTab entidadeTipo="sinistro" entidadeId={sinistro.id} readOnly={!canUpdate} />
        )}
        {activeTab === 'anexos' && (
          <AnexosLogsTab
            anexos={tabsState.anexos}
            logs={tabsState.logs}
            onAddAnexo={tabsState.addAnexo}
            onEditAnexo={canUpdate ? (anexoId, anexo) => void runTabAction(() => tabsState.updateAnexo(anexoId, anexo), 'Metadados atualizados') : undefined}
            onRemoveAnexo={canDelete ? (anexoId) => void (async () => {
              if (await confirmRemove('Remover anexo?', 'Somente os metadados mantidos no mock serão removidos.')) {
                await runTabAction(() => tabsState.removeAnexo(anexoId), 'Metadado removido')
              }
            })() : undefined}
            autorPadrao="Usuário da sessão"
            showAuditLogs={tabsState.showAuditLogs}
            onToggleAuditLogs={tabsState.setShowAuditLogs}
            metadataOnly
            readOnly={!canUpdate}
          />
        )}
        {activeTab === 'observacoes' && (
          <ObservacoesTab
            observacoes={tabsState.observacoes}
            onAdd={tabsState.addObservacao}
            onTogglePin={tabsState.togglePin}
            mentionCandidates={tabsState.mentionCandidates}
            readOnly={!canUpdate}
          />
        )}
      </div>
    </div>
  )
}

function VisaoGeral({ sinistro }: { sinistro: NonNullable<ReturnType<typeof useSinistro>['data']> }) {
  const apolice = sinistro.apolices
  const segurado = apolice?.segurados

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-6">
        <DetailCard title="Ocorrência e aviso" icon={AlertTriangle}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Número do aviso" mono>{sinistro.numero_aviso}</DetailField>
            <DetailField label="Número do sinistro" mono>{sinistro.numero_sinistro}</DetailField>
            <DetailField label="Protocolo da seguradora" mono>{sinistro.protocolo_seguradora}</DetailField>
            <DetailField label="Data da ocorrência" mono>{safeDate(sinistro.data_ocorrencia)}</DetailField>
            <DetailField label="Data do aviso" mono>{safeDate(sinistro.data_aviso)}</DetailField>
            <DetailField label="Registro do aviso" mono>{safeDate(sinistro.data_registro_aviso)}</DetailField>
            <DetailField label="Tipo">{sinistro.tipo_sinistro === 'judicial' ? 'Judicial' : 'Administrativo'}</DetailField>
            <DetailField label="Responsável">{sinistro.profiles?.full_name}</DetailField>
            <DetailField label="Causa" full>{sinistro.causa}</DetailField>
            <DetailField label="Descrição" full>{sinistro.descricao}</DetailField>
            <DetailField label="Local da ocorrência" full>{sinistro.local_ocorrencia}</DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Regulação e cobertura" icon={Wrench}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Cobertura">{sinistro.cobertura_nome}</DetailField>
            <DetailField label="Código da cobertura" mono>{sinistro.cobertura_codigo}</DetailField>
            <DetailField label="Documentação completa" mono>{safeDate(sinistro.data_documentacao_completa)}</DetailField>
            <DetailField label="Regulador">{sinistro.regulador_nome}</DetailField>
            <DetailField label="Oficina">{sinistro.oficina_nome}</DetailField>
            <DetailField label="Motivo de negativa" full>{sinistro.negativa_motivo}</DetailField>
          </div>
        </DetailCard>

        {sinistro.observacoes && (
          <DetailCard title="Observação contratual" icon={ClipboardList}>
            <p className="max-w-[72ch] whitespace-pre-wrap text-sm font-medium leading-relaxed text-fg-2">
              {sinistro.observacoes}
            </p>
          </DetailCard>
        )}
      </div>

      <div className="space-y-6">
        <DetailCard title="Apólice vinculada" icon={ShieldCheck}>
          <div className="space-y-4">
            <DetailField label="Apólice" mono>{apolice?.numero_apolice}</DetailField>
            <DetailField label="Segurado">{segurado?.nome}</DetailField>
            <DetailField label="CPF/CNPJ" mono>{segurado?.cpf_cnpj}</DetailField>
            <DetailField label="Seguradora">{apolice?.seguradoras?.nome}</DetailField>
            <DetailField label="Ramo">{apolice?.ramos?.nome}</DetailField>
            <DetailField label="Vigência" mono>
              {apolice?.vigencia_inicio && apolice.vigencia_fim
                ? `${fmtDate(apolice.vigencia_inicio)} a ${fmtDate(apolice.vigencia_fim)}`
                : undefined}
            </DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Valores" icon={Banknote}>
          <div className="grid grid-cols-2 gap-5">
            <DetailField label="Estimado" mono>{formatCurrency(sinistro.valor_estimado)}</DetailField>
            <DetailField label="Pendente" mono>{formatCurrency(sinistro.valor_pendente)}</DetailField>
            <DetailField label="Indenizado" mono>{formatCurrency(sinistro.valor_indenizado)}</DetailField>
            <DetailField label="Regulação" mono>{formatCurrency(sinistro.valor_despesas_regulacao)}</DetailField>
            <DetailField label="Salvado" mono>{formatCurrency(sinistro.valor_salvado)}</DetailField>
            <DetailField label="Ressarcimento" mono>{formatCurrency(sinistro.valor_ressarcimento)}</DetailField>
          </div>
        </DetailCard>
      </div>
    </div>
  )
}

function Envolvidos({ envolvidos, action }: { envolvidos: SinistroEnvolvidoDetalhe[]; action?: React.ReactNode }) {
  if (envolvidos.length === 0) {
    return (
      <DetailCard title="Envolvidos" icon={Users} action={action}>
        <EmptyState icon={Users} title="Nenhum envolvido registrado" hint="Os envolvidos serão mantidos separadamente do cadastro de segurados." />
      </DetailCard>
    )
  }

  return (
    <DetailCard title="Envolvidos" icon={Users} action={action}>
      <div className="divide-y divide-border-1">
        {envolvidos.map((envolvido) => (
          <div key={envolvido.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] ${
                envolvido.tipo === 'TERCEIRO'
                  ? 'bg-signal-warning/15 text-signal-warning'
                  : 'bg-accent-primary-soft text-accent-primary'
              }`}>
                {envolvido.tipo === 'TERCEIRO' ? <UserRound size={18} /> : <Building2 size={18} />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-fg-1">{envolvido.nome ?? 'Envolvido sem nome'}</h3>
                  <StatusBadge
                    status={envolvido.tipo === 'TERCEIRO' ? 'Terceiro' : 'Segurado'}
                    tone={envolvido.tipo === 'TERCEIRO' ? 'warning' : 'info'}
                    dot={false}
                  />
                </div>
                <p className="mt-1 font-mono text-xs text-fg-4">{envolvido.cpf_cnpj ?? 'Documento não informado'}</p>
                {envolvido.responsavel_pelo_evento && (
                  <p className="mt-2 text-xs font-semibold text-signal-warning">Indicado como responsável pelo evento</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailField label="Item segurado">
                {envolvido.apolice_itens
                  ? `Item ${envolvido.apolice_itens.numero_item ?? '—'} · ${envolvido.apolice_itens.descricao ?? envolvido.apolice_itens.identificador_externo ?? 'Sem descrição'}`
                  : undefined}
              </DetailField>
              <DetailField label="Placa" mono>{envolvido.placa}</DetailField>
              <DetailField label="Tipo de dano">{envolvido.tipo_dano}</DetailField>
              <DetailField label="Contato">{envolvido.telefone ?? envolvido.email}</DetailField>
              <DetailField label="Seguradora do terceiro">{envolvido.seguradora_terceiro}</DetailField>
              <DetailField label="Apólice do terceiro" mono>{envolvido.apolice_terceiro}</DetailField>
              <DetailField label="Valor reclamado" mono>{formatCurrency(envolvido.valor_reclamado)}</DetailField>
              <DetailField label="Valor indenizado" mono>{formatCurrency(envolvido.valor_indenizado)}</DetailField>
              <DetailField label="Observações" full>{envolvido.observacoes}</DetailField>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 flex items-start gap-2 border-t border-border-1 pt-4 text-xs font-semibold text-fg-4">
        <MapPin size={14} className="mt-0.5 shrink-0" />
        Terceiros permanecem neste processo e não são adicionados ao cadastro de segurados.
      </p>
    </DetailCard>
  )
}

function EmptyPage({
  message,
  onBack,
  onRetry,
}: {
  message: string
  onBack: () => void
  onRetry?: () => void
}) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center text-center text-fg-3">
      <AlertTriangle size={28} className="mb-3 text-signal-warning" />
      <p className="font-semibold">{message}</p>
      <div className="mt-4 flex items-center gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="text-sm font-semibold text-accent-primary hover:underline">
            Tentar novamente
          </button>
        )}
        <button type="button" onClick={onBack} className="text-sm font-semibold text-accent-primary hover:underline">
          Voltar para Sinistros
        </button>
      </div>
    </div>
  )
}
