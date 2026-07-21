import { useEffect, useState } from 'react'
import {
  ArrowLeft, CalendarClock, CheckCircle2, ChevronRight, ClipboardList,
  ExternalLink, FileCheck2, MessageSquareText, Pencil, ReceiptText,
  RotateCcw, ShieldAlert, ShieldCheck, UserRound, X,
} from 'lucide-react'
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
import { useAuth } from '../hooks/useAuth'
import {
  useCloseCobranca,
  useCobranca,
  useCobrancaResponsaveis,
  useMaintainCobranca,
  useReopenCobranca,
} from '../hooks/useFinanceiroCobrancas'
import { usePermission } from '../hooks/usePermission'
import type { CobrancaCanal, CobrancaPrioridade } from '../types/database'

type TabId = 'visao' | 'tarefas' | 'personalizados' | 'anexos' | 'observacoes'
const VALID_TABS: TabId[] = ['visao', 'tarefas', 'personalizados', 'anexos', 'observacoes']

const money = (value: number | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
const date = (value: string | null) => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('pt-BR') : '—'
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('pt-BR') : '—'
const toInputDateTime = (value: string | null) => value ? new Date(value).toISOString().slice(0, 16) : ''

function EditForm({ cobranca, responsaveis, saving, onCancel, onSave }: {
  cobranca: NonNullable<ReturnType<typeof useCobranca>['data']>
  responsaveis: ReturnType<typeof useCobrancaResponsaveis>['data']
  saving: boolean
  onCancel: () => void
  onSave: (patch: Parameters<ReturnType<typeof useMaintainCobranca>['mutateAsync']>[0]['patch']) => void
}) {
  const [responsavelId, setResponsavelId] = useState(cobranca.responsavel_id ?? '')
  const [prioridade, setPrioridade] = useState<CobrancaPrioridade>(cobranca.prioridade ?? 'MEDIA')
  const [canal, setCanal] = useState<CobrancaCanal>(cobranca.canal_preferencial ?? 'WHATSAPP')
  const [followup, setFollowup] = useState(cobranca.vencimento_followup ?? '')
  const [ultima, setUltima] = useState(toInputDateTime(cobranca.ultima_cobranca_em))
  const [proxima, setProxima] = useState(toInputDateTime(cobranca.proxima_cobranca_em))
  const [observacoes, setObservacoes] = useState(cobranca.observacoes ?? '')

  return <DetailCard title="Editar acompanhamento" icon={Pencil}>
    <div className="grid gap-5 sm:grid-cols-2">
      <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Responsável</span><select value={responsavelId} onChange={(event) => setResponsavelId(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1"><option value="">Sem responsável</option>{(responsaveis ?? []).map((row) => <option key={row.id} value={row.id}>{row.full_name ?? row.email ?? row.id}</option>)}</select></label>
      <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Prioridade</span><select value={prioridade} onChange={(event) => setPrioridade(event.target.value as CobrancaPrioridade)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1"><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></label>
      <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Canal preferencial</span><select value={canal} onChange={(event) => setCanal(event.target.value as CobrancaCanal)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1"><option value="WHATSAPP">WhatsApp</option><option value="TELEFONE">Telefone</option><option value="EMAIL">E-mail</option><option value="OUTRO">Outro</option></select></label>
      <DateField label="Prazo do follow-up" value={followup} onChange={setFollowup} inputClassName="text-sm" />
      <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Última cobrança</span><input type="datetime-local" value={ultima} onChange={(event) => setUltima(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1" /></label>
      <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Próxima cobrança</span><input type="datetime-local" value={proxima} onChange={(event) => setProxima(event.target.value)} className="w-full rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1" /></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-3">Observações operacionais</span><textarea rows={4} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm text-fg-1" /></label>
    </div>
    <div className="mt-6 flex justify-end gap-3 border-t border-border-1 pt-5"><button type="button" onClick={onCancel} className="rounded-full border border-border-1 px-4 py-2.5 text-sm font-bold text-fg-3">Cancelar</button><button type="button" disabled={saving} onClick={() => onSave({ responsavel_id: responsavelId || null, prioridade, canal_preferencial: canal, vencimento_followup: followup || null, ultima_cobranca_em: ultima ? new Date(ultima).toISOString() : null, proxima_cobranca_em: proxima ? new Date(proxima).toISOString() : null, observacoes: observacoes || null })} className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40">{saving ? 'Salvando...' : 'Salvar alterações'}</button></div>
  </DetailCard>
}

function CancelModal({ saving, onClose, onConfirm }: { saving: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, saving])
  return <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"><button type="button" aria-label="Fechar modal" onClick={() => !saving && onClose()} className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm" /><section role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-3)]"><header className="flex items-center justify-between border-b border-border-1 p-5"><div><h2 className="font-black text-fg-1">Cancelar cobrança</h2><p className="mt-1 text-xs font-semibold text-fg-3">O histórico será preservado e poderá ser reaberto quando elegível.</p></div><button type="button" onClick={onClose} disabled={saving} className="rounded-[6px] p-2 text-fg-4 hover:bg-bg-surface-2"><X size={18} /></button></header><div className="p-5"><label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">Motivo *</span><textarea autoFocus rows={4} value={reason} onChange={(event) => setReason(event.target.value)} className="w-full resize-none rounded-[8px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm text-fg-1" /></label></div><footer className="flex justify-end gap-3 border-t border-border-1 p-5"><button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-border-1 px-4 py-2 text-sm font-bold text-fg-3">Voltar</button><button type="button" onClick={() => onConfirm(reason)} disabled={saving || !reason.trim()} className="rounded-full bg-signal-danger px-5 py-2 text-sm font-black text-white disabled:opacity-40">{saving ? 'Cancelando...' : 'Cancelar cobrança'}</button></footer></section></div>
}

export default function FinanceiroDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, activeBranchId } = useAuth()
  const branchIds = activeBranchId ? [activeBranchId] : user?.branchIds ?? null
  const { can } = usePermission('financeiro')
  const detail = useCobranca(id, branchIds)
  const responsaveis = useCobrancaResponsaveis()
  const maintain = useMaintainCobranca()
  const close = useCloseCobranca()
  const reopen = useReopenCobranca()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const [editing, setEditing] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const cobranca = detail.data
  const tabsState = useEntityTabsState('cobranca', id, { filialId: cobranca?.parcela.filialId })
  const requestedTab = searchParams.get('tab')
  const activeTab: TabId = VALID_TABS.includes(requestedTab as TabId) ? requestedTab as TabId : 'visao'

  if (!can('read')) return <div className="flex min-h-[45vh] flex-col items-center justify-center text-center"><ShieldAlert size={28} className="mb-3 text-signal-warning" /><p className="font-semibold text-fg-2">Sem permissão para acessar o Financeiro nesta corretora.</p><button type="button" onClick={() => navigate('/financeiro')} className="mt-4 text-sm font-bold text-accent-primary hover:underline">Voltar para o Financeiro</button></div>
  if (!id || detail.isError || (!detail.isLoading && !cobranca)) return <div className="flex min-h-[45vh] flex-col items-center justify-center text-center"><ShieldAlert size={28} className="mb-3 text-signal-warning" /><p className="font-semibold text-fg-2">Cobrança não encontrada ou sem acesso nesta corretora.</p><button type="button" onClick={() => navigate('/financeiro?visao=cobrancas')} className="mt-4 text-sm font-bold text-accent-primary hover:underline">Voltar para Cobranças</button></div>
  if (detail.isLoading || !cobranca) return <div className="animate-pulse py-24 text-center text-sm font-semibold text-fg-4">Carregando cobrança...</div>

  const canUpdate = can('update')
  const canDelete = can('delete')
  const pendentes = tabsState.tarefas.filter((row) => row.status !== 'Concluída').length
  const tabs: EntityTab<TabId>[] = [
    { id: 'visao', label: 'Visão geral' },
    { id: 'tarefas', label: 'Tarefas', badge: pendentes || undefined },
    { id: 'personalizados', label: 'Campos personalizados' },
    { id: 'anexos', label: 'Anexos e logs', badge: tabsState.anexos.length || undefined },
    { id: 'observacoes', label: 'Observações', badge: tabsState.observacoes.length || undefined },
  ]
  const statusLabel = cobranca.status === 'ATIVA' ? 'Ativa' : cobranca.status === 'QUITADA' ? 'Quitada' : 'Cancelada'
  const statusTone = cobranca.status === 'ATIVA' ? 'warning' : cobranca.status === 'QUITADA' ? 'success' : 'danger'

  const setTab = (tab: TabId) => {
    if (editing) return notify({ title: 'Conclua ou cancele a edição', description: 'As alterações permanecem no bloco atual.', tone: 'warning' })
    const next = new URLSearchParams(searchParams)
    if (tab === 'visao') next.delete('tab'); else next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }
  const runTabAction = async (action: () => Promise<void>, title?: string) => { try { await action(); if (title) notify({ title, tone: 'success' }) } catch (error) { notify({ title: 'Não foi possível concluir a ação', description: error instanceof Error ? error.message : 'Tente novamente.', tone: 'danger' }) } }
  const confirmRemove = (title: string, description: string) => confirm({ title, description, confirmLabel: 'Remover', tone: 'danger' })

  const save = async (patch: Parameters<typeof maintain.mutateAsync>[0]['patch']) => { try { const result = await maintain.mutateAsync({ id: cobranca.id, patch }); setEditing(false); notify({ title: 'Cobrança atualizada', description: `${result.changedFields} campo(s) alterado(s) com auditoria.`, tone: 'success' }) } catch (error) { notify({ title: 'Não foi possível salvar', description: error instanceof Error ? error.message : 'A operação foi revertida.', tone: 'danger' }) } }
  const closeAs = async (status: 'QUITADA' | 'CANCELADA', reason?: string) => { try { await close.mutateAsync({ id: cobranca.id, status, reason }); setCancelOpen(false); notify({ title: status === 'QUITADA' ? 'Cobrança quitada' : 'Cobrança cancelada', description: 'A transição foi registrada no histórico.', tone: 'success' }) } catch (error) { notify({ title: 'Não foi possível encerrar', description: error instanceof Error ? error.message : 'A operação foi revertida.', tone: 'danger' }) } }
  const handleReopen = async () => { if (!await confirm({ title: 'Reabrir cobrança?', description: 'A parcela precisa estar vencida e não pode possuir outra cobrança ativa.', confirmLabel: 'Reabrir', tone: 'warning' })) return; try { await reopen.mutateAsync(cobranca.id); notify({ title: 'Cobrança reaberta', tone: 'success' }) } catch (error) { notify({ title: 'Não foi possível reabrir', description: error instanceof Error ? error.message : 'A operação foi revertida.', tone: 'danger' }) } }

  return <div className="animate-fade-in pb-10">
    <div className="mb-5 flex items-center gap-2 text-sm text-fg-3"><button type="button" onClick={() => navigate('/financeiro?visao=cobrancas')} className="inline-flex items-center gap-1.5 font-semibold hover:text-accent-primary"><ArrowLeft size={15} /> Cobranças</button><ChevronRight size={14} className="text-fg-4" /><span className="truncate font-medium text-fg-1">{cobranca.parcela.seguradoNome}</span></div>
    <section className="mb-5 rounded-[8px] border border-border-1 bg-bg-surface p-6 shadow-[var(--shadow-1)]"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] bg-signal-warning/12 text-signal-warning"><MessageSquareText size={25} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-[-0.02em] text-fg-1">{cobranca.parcela.seguradoNome}</h1><StatusBadge status={statusLabel} tone={statusTone} /></div><p className="mt-1 text-sm font-semibold text-fg-3">{cobranca.parcela.documentoReferencia} · Parcela {cobranca.parcela.numero ?? '—'} · {money(cobranca.parcela.valor)}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-fg-3"><span className="inline-flex items-center gap-1.5"><CalendarClock size={13} /> {dateTime(cobranca.proxima_cobranca_em)}</span><span className="inline-flex items-center gap-1.5"><ClipboardList size={13} /> {cobranca.etapaNome}</span><span className="inline-flex items-center gap-1.5"><UserRound size={13} /> {cobranca.responsavelNome ?? 'Sem responsável'}</span></div></div></div><div className="flex flex-wrap gap-2">{canUpdate && activeTab === 'visao' && cobranca.status === 'ATIVA' && !editing && <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-full border border-accent-primary px-4 py-2.5 text-sm font-bold text-accent-primary hover:bg-accent-primary-soft"><Pencil size={15} />Editar</button>}{canUpdate && cobranca.status === 'ATIVA' && <><button type="button" onClick={() => void closeAs('QUITADA')} className="inline-flex items-center gap-2 rounded-full border border-signal-success/40 px-4 py-2.5 text-sm font-bold text-signal-success hover:bg-signal-success/10"><CheckCircle2 size={15} />Quitar</button><button type="button" onClick={() => setCancelOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-signal-danger/40 px-4 py-2.5 text-sm font-bold text-signal-danger hover:bg-signal-danger/10"><X size={15} />Cancelar</button></>}{canUpdate && cobranca.status !== 'ATIVA' && <button type="button" onClick={() => void handleReopen()} className="inline-flex items-center gap-2 rounded-full border border-signal-warning/40 px-4 py-2.5 text-sm font-bold text-signal-warning"><RotateCcw size={15} />Reabrir</button>}</div></div></section>
    <div className="mb-6 flex items-start gap-3 rounded-[6px] border border-accent-primary/20 bg-accent-primary-soft px-4 py-3 text-sm text-fg-2"><FileCheck2 size={18} className="mt-0.5 shrink-0 text-accent-primary" /><div><p className="font-bold text-fg-1">Origem protegida</p><p className="mt-0.5 text-xs font-semibold text-fg-3">A parcela e seus valores são somente leitura. A baixa acontece em Parcelas; a etapa muda exclusivamente pelo Kanban.</p></div></div>
    <EntityTabsBar tabs={tabs} active={activeTab} onChange={setTab} />
    <div role="tabpanel">
      {activeTab === 'visao' && (editing ? <EditForm cobranca={cobranca} responsaveis={responsaveis.data} saving={maintain.isPending} onCancel={() => setEditing(false)} onSave={(patch) => void save(patch)} /> : <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"><div className="space-y-6"><DetailCard title="Acompanhamento" icon={MessageSquareText}><div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3"><DetailField label="Etapa">{cobranca.etapaNome}</DetailField><DetailField label="Status">{statusLabel}</DetailField><DetailField label="Prioridade">{cobranca.prioridade}</DetailField><DetailField label="Responsável">{cobranca.responsavelNome}</DetailField><DetailField label="Abertura" mono>{date(cobranca.data_abertura)}</DetailField><DetailField label="Prazo do follow-up" mono>{date(cobranca.vencimento_followup)}</DetailField><DetailField label="Última cobrança" mono>{dateTime(cobranca.ultima_cobranca_em)}</DetailField><DetailField label="Próxima cobrança" mono>{dateTime(cobranca.proxima_cobranca_em)}</DetailField><DetailField label="Canal">{cobranca.canal_preferencial}</DetailField><DetailField label="Observações" full>{cobranca.observacoes}</DetailField>{cobranca.encerrada_em && <><DetailField label="Encerramento" mono>{dateTime(cobranca.encerrada_em)}</DetailField><DetailField label="Motivo" full>{cobranca.motivo_encerramento}</DetailField></>}</div></DetailCard></div><DetailCard title="Parcela de origem" icon={ReceiptText}><div className="space-y-4"><DetailField label="Documento">{cobranca.parcela.documentoReferencia}</DetailField><DetailField label="Apólice" mono>{cobranca.parcela.apoliceNumero}</DetailField><DetailField label="Parcela">{cobranca.parcela.numero}</DetailField><DetailField label="Vencimento" mono>{date(cobranca.parcela.vencimento)}</DetailField><DetailField label="Valor" mono>{money(cobranca.parcela.valor)}</DetailField><DetailField label="Situação efetiva">{cobranca.parcela.statusEfetivo}</DetailField><DetailField label="Atraso">{cobranca.parcela.diasVencidos} dias</DetailField><DetailField label="Seguradora">{cobranca.parcela.seguradoraNome}</DetailField><DetailField label="Ramo">{cobranca.parcela.ramoNome}</DetailField><div className="flex flex-wrap gap-2 border-t border-border-1 pt-4"><button type="button" onClick={() => navigate(`/financeiro?parcela=${cobranca.parcela.id}`)} className="rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-fg-2">Abrir parcela <ExternalLink size={12} className="ml-1 inline" /></button><button type="button" onClick={() => navigate(`/apolices/${cobranca.parcela.apoliceId}?documento=${cobranca.parcela.proposta_id}`)} className="rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-fg-2"><ShieldCheck size={12} className="mr-1 inline" />Documento</button><button type="button" onClick={() => navigate(`/segurados/${cobranca.parcela.seguradoId}`)} className="rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-fg-2"><UserRound size={12} className="mr-1 inline" />Segurado</button></div></div></DetailCard></div>)}
      {activeTab === 'tarefas' && (tabsState.tarefas.length > 0 || canUpdate ? <TarefasTab tarefas={tabsState.tarefas} onAdd={(task) => void runTabAction(() => tabsState.addTarefa(task), 'Tarefa criada')} onEdit={canUpdate ? (taskId, task) => void runTabAction(() => tabsState.updateTarefa(taskId, task), 'Tarefa atualizada') : undefined} onToggle={(taskId) => void runTabAction(() => tabsState.toggleTarefa(taskId))} onRemove={canDelete ? (taskId) => void (async () => { if (await confirmRemove('Remover tarefa?', 'A tarefa será removida desta cobrança.')) await runTabAction(() => tabsState.removeTarefa(taskId), 'Tarefa removida') })() : undefined} readOnly={!canUpdate} /> : <EmptyState icon={ClipboardList} title="Nenhuma tarefa registrada" hint="Crie atividades para organizar o próximo contato." />)}
      {activeTab === 'personalizados' && <CamposPersonalizadosTab entidadeTipo="cobranca" entidadeId={cobranca.id} readOnly={!canUpdate} />}
      {activeTab === 'anexos' && <AnexosLogsTab anexos={tabsState.anexos} logs={tabsState.logs} onAddAnexo={tabsState.addAnexo} onEditAnexo={canUpdate ? (anexoId, anexo) => void runTabAction(() => tabsState.updateAnexo(anexoId, anexo), 'Metadados atualizados') : undefined} onRemoveAnexo={canDelete ? (anexoId) => void (async () => { if (await confirmRemove('Remover anexo?', 'Somente os metadados do mock serão removidos.')) await runTabAction(() => tabsState.removeAnexo(anexoId), 'Metadado removido') })() : undefined} autorPadrao="Usuário da sessão" showAuditLogs={tabsState.showAuditLogs} onToggleAuditLogs={tabsState.setShowAuditLogs} metadataOnly readOnly={!canUpdate} />}
      {activeTab === 'observacoes' && <ObservacoesTab observacoes={tabsState.observacoes} onAdd={tabsState.addObservacao} onTogglePin={tabsState.togglePin} mentionCandidates={tabsState.mentionCandidates} readOnly={!canUpdate} />}
    </div>
    {cancelOpen && <CancelModal saving={close.isPending} onClose={() => setCancelOpen(false)} onConfirm={(reason) => void closeAs('CANCELADA', reason)} />}
  </div>
}
