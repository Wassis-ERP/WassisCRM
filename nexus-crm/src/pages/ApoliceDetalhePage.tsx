import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Ban, Check, CheckCircle2, ChevronDown, FilePlus2, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EntityTabsBar } from '../components/detail/EntityTabsBar'
import AnexosLogsTab from '../components/detail/tabs/AnexosLogsTab'
import CamposPersonalizadosTab from '../components/detail/tabs/CamposPersonalizadosTab'
import ObservacoesTab from '../components/detail/tabs/ObservacoesTab'
import TarefasTab from '../components/detail/tabs/TarefasTab'
import { ItensSeguradosTab, ParcelasComissoesTab, RepassesTab } from '../components/apolices/ApoliceContractTabs'
import { ApoliceOverview } from '../components/apolices/ApoliceOverview'
import { DerivedDocumentModal, NotRenewedModal } from '../components/apolices/DerivedDocumentModal'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import { useEntityTabsState } from '../components/detail/useEntityTabsState'
import { buildPolicyTree, getCurrentPolicyDocument, getDocumentNumber } from '../components/propostas/propostaSelectors'
import { fmtCompetence } from '../components/propostas/propostaFormat'
import { usePropostas } from '../contexts/usePropostas'
import type { Proposal } from '../types/proposta'

type DetailTab = 'visao' | 'itens' | 'agendas' | 'repasses' | 'tarefas' | 'personalizados' | 'anexos' | 'observacoes'
type RecordsScope = 'apolice' | 'proposta'

const tabs = [
  { id: 'visao' as const, label: 'Visão geral' },
  { id: 'itens' as const, label: 'Itens segurados' },
  { id: 'agendas' as const, label: 'Parcelas e comissões' },
  { id: 'repasses' as const, label: 'Repasses' },
  { id: 'tarefas' as const, label: 'Tarefas' },
  { id: 'personalizados' as const, label: 'Campos personalizados' },
  { id: 'anexos' as const, label: 'Anexos e logs' },
  { id: 'observacoes' as const, label: 'Observações' },
]

function selectorLabel(document: Proposal): string {
  if (document.proposalType === 'Proposta' || document.proposalType === 'Renovação') {
    return document.endorsementNumber === '0'
      ? `${document.proposalType} · Endosso 0`
      : document.proposalType
  }
  if (document.proposalType === 'Fatura') {
    return `Fatura · ${fmtCompetence(document.competenceStart, document.competenceEnd)}`
  }
  return `${document.proposalType} · ${getDocumentNumber(document)}`
}

function groupLabel(document: Proposal): string {
  if (document.proposalType === 'Endosso') return 'Endossos'
  if (document.proposalType === 'Cancelamento') return 'Cancelamentos'
  if (document.proposalType === 'Fatura') return 'Faturas'
  return 'Emissão original'
}

export default function ApoliceDetalhePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    proposals,
    createRenewalOpportunity,
    issueContractDocument,
    markPolicyNotRenewed,
  } = usePropostas()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const [activeTab, setActiveTab] = useState<DetailTab>('visao')
  const [recordsScope, setRecordsScope] = useState<RecordsScope>('proposta')
  const [query, setQuery] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [operationOpen, setOperationOpen] = useState(false)
  const [notRenewedOpen, setNotRenewedOpen] = useState(false)
  const selectorRef = useRef<HTMLDetailsElement>(null)

  const row = useMemo(
    () => buildPolicyTree(proposals).find((candidate) => candidate.policy.id === id),
    [id, proposals],
  )
  const requestedDocumentId = searchParams.get('documento')
  const selectedDocument = useMemo(() => {
    if (!row) return undefined
    return row.documents.find(({ document }) => document.id === requestedDocumentId)?.document
      ?? getCurrentPolicyDocument(row)
  }, [requestedDocumentId, row])

  const entityType = recordsScope === 'apolice' ? 'apolice' : 'proposta'
  const entityId = recordsScope === 'apolice' ? row?.policy.id : selectedDocument?.id
  const tabsState = useEntityTabsState(entityType, entityId)
  const contractDocuments = useMemo(() => row?.documents.map(({ document }) => document) ?? [], [row])
  const isTransversalTab = activeTab === 'tarefas' || activeTab === 'personalizados' || activeTab === 'anexos' || activeTab === 'observacoes'
  const renewalSuccessors = useMemo(
    () => proposals.filter((candidate) => candidate.entityType === 'apolice' && candidate.renewedFromId === id),
    [id, proposals],
  )

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const protectReload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', protectReload)
    return () => window.removeEventListener('beforeunload', protectReload)
  }, [hasUnsavedChanges])

  const allowDiscard = useCallback(async () => {
    if (!hasUnsavedChanges) return true
    return confirm({
      title: 'Descartar alterações?',
      description: 'Há dados editados que ainda não foram salvos.',
      confirmLabel: 'Descartar',
      cancelLabel: 'Continuar editando',
      tone: 'warning',
    })
  }, [confirm, hasUnsavedChanges])

  const groupedDocuments = useMemo(() => {
    const groups = new Map<string, Proposal[]>()
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    row?.documents.forEach(({ document }) => {
      const searchable = `${selectorLabel(document)} ${getDocumentNumber(document)} ${document.status}`.toLocaleLowerCase('pt-BR')
      if (normalizedQuery && !searchable.includes(normalizedQuery)) return
      const label = groupLabel(document)
      groups.set(label, [...(groups.get(label) ?? []), document])
    })
    return Array.from(groups.entries())
  }, [query, row])

  if (!row) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldCheck size={32} className="text-fg-4" />
        <div>
          <h1 className="text-lg font-bold text-fg-1">Apólice não encontrada</h1>
          <p className="mt-1 text-sm text-fg-4">O registro pode ter sido removido ou o endereço está incompleto.</p>
        </div>
        <button type="button" onClick={() => navigate('/propostas')} className="rounded-[6px] bg-accent-primary px-4 py-2 text-sm font-bold text-fg-on-brand">
          Voltar ao painel
        </button>
      </div>
    )
  }

  const { policy } = row
  const selectDocument = async (document: Proposal) => {
    if (!await allowDiscard()) return
    setHasUnsavedChanges(false)
    setSearchParams({ documento: document.id })
    setRecordsScope('proposta')
    selectorRef.current?.removeAttribute('open')
  }

  const changeTab = async (tab: DetailTab) => {
    if (tab === activeTab || await allowDiscard()) {
      setHasUnsavedChanges(false)
      setActiveTab(tab)
    }
  }

  const goBack = async () => {
    if (await allowDiscard()) navigate(-1)
  }

  const startRenewal = () => {
    try {
      const opportunityId = createRenewalOpportunity(policy.id)
      notify({ title: 'Renovação iniciada', description: 'A nova oportunidade foi aberta no Comercial.', tone: 'success' })
      navigate(`/oportunidades/${opportunityId}`)
    } catch (error) {
      notify({ title: 'Não foi possível iniciar a renovação', description: error instanceof Error ? error.message : 'Revise a situação da apólice.', tone: 'danger' })
    }
  }

  const confirmNotRenewed = (reason: string) => {
    try {
      markPolicyNotRenewed(policy.id, reason)
      setNotRenewedOpen(false)
      notify({ title: 'Apólice marcada como não renovada', description: 'O contrato e seus documentos foram preservados no histórico.', tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível atualizar a apólice', description: error instanceof Error ? error.message : 'Revise a situação do contrato.', tone: 'danger' })
    }
  }

  const issueSelectedDocument = async () => {
    if (!selectedDocument) return
    const accepted = await confirm({
      title: 'Efetivar documento',
      description: 'Esta operação aplicará os efeitos contratuais e materializará as agendas previstas. A mudança de etapa, isoladamente, não faz isso.',
      confirmLabel: 'Efetivar',
      tone: selectedDocument.proposalType === 'Cancelamento' ? 'danger' : 'warning',
    })
    if (!accepted) return
    try {
      issueContractDocument(selectedDocument.id)
      notify({ title: 'Documento efetivado', description: 'Contrato, histórico e agendas foram atualizados.', tone: 'success' })
    } catch (error) {
      notify({ title: 'Não foi possível efetivar', description: error instanceof Error ? error.message : 'Revise os campos obrigatórios.', tone: 'danger' })
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 lg:px-6">
      <header className="space-y-4 rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-sm">
        <button type="button" onClick={() => void goBack()} className="inline-flex items-center gap-2 text-sm font-semibold text-fg-3 hover:text-fg-1">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-fg-3"><ShieldCheck size={16} /><span className="font-mono">Apólice {policy.policyNumber ?? 'em emissão'}</span></div>
          {policy.seguradoId && <a href={`/segurados/${policy.seguradoId}`} target="_blank" rel="noreferrer" aria-label={`Abrir segurado ${policy.insured} em nova aba`} className="mt-2 inline-flex max-w-full items-center gap-2 text-lg font-bold text-fg-1 hover:text-accent-primary focus-visible:rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"><span className="truncate">{policy.insured}</span><ArrowUpRight size={17} className="shrink-0" /></a>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-3">
            {policy.insuredDocument && <span className="font-mono">{formatDocument(policy.insuredDocument)}</span>}
            {(policy.insuredCity || policy.insuredState) && <span>{[policy.insuredCity, policy.insuredState].filter(Boolean).join('/')}</span>}
            {policy.insuredEmail && <span>{policy.insuredEmail}</span>}
            {policy.insuredPhone && <span>{formatPhone(policy.insuredPhone)}</span>}
          </div>
          {(policy.renewedFromId || renewalSuccessors.length > 0) && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="font-bold text-fg-3">Cadeia de renovação:</span>{policy.renewedFromId && <button type="button" onClick={() => navigate(`/apolices/${policy.renewedFromId}`)} className="rounded-full bg-bg-surface-2 px-3 py-1.5 font-semibold text-accent-primary hover:bg-accent-primary-soft">Apólice anterior</button>}{renewalSuccessors.map((successor) => <button key={successor.id} type="button" onClick={() => navigate(`/apolices/${successor.id}`)} className="rounded-full bg-bg-surface-2 px-3 py-1.5 font-semibold text-accent-primary hover:bg-accent-primary-soft">Sucessora {successor.policyNumber ?? 'em emissão'}</button>)}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border-1 pt-4">
          {policy.currentStatus === 'Vigente' && <button type="button" onClick={() => setOperationOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover"><FilePlus2 size={16} />Nova operação</button>}
          {policy.currentStatus === 'Vigente' && policy.isRenewable && <button type="button" onClick={startRenewal} className="inline-flex items-center gap-2 rounded-full border border-accent-primary px-4 py-2.5 text-sm font-black text-accent-primary hover:bg-accent-primary-soft"><RefreshCw size={16} />Iniciar renovação</button>}
          {policy.currentStatus === 'Vigente' && policy.isRenewable && <button type="button" onClick={() => setNotRenewedOpen(true)} className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2.5 text-sm font-bold text-fg-3 hover:bg-signal-warning/10 hover:text-signal-warning"><Ban size={16} />Não renovar</button>}
          {selectedDocument && !selectedDocument.issueDate && ['Renovação', 'Endosso', 'Cancelamento', 'Fatura'].includes(selectedDocument.proposalType) && <button type="button" onClick={() => void issueSelectedDocument()} className="ml-auto inline-flex items-center gap-2 rounded-full bg-signal-success px-4 py-2.5 text-sm font-black text-white hover:brightness-95"><CheckCircle2 size={16} />Efetivar documento</button>}
        </div>
      </header>

      <section className="relative flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-bg-surface-2 px-4 py-3">
        <div>
          <p className="text-xs font-bold text-fg-3">Documento em exibição</p>
          <p className="text-[11px] text-fg-4">A página permanece na mesma apólice ao alternar emissões, endossos e faturas.</p>
        </div>
        <details ref={selectorRef} className="group relative w-full sm:w-[22rem]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm font-semibold text-fg-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">
            <span className="truncate">{selectedDocument ? selectorLabel(selectedDocument) : 'Nenhum documento vinculado'}</span>
            <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-full rounded-[8px] border border-border-1 bg-bg-surface p-2">
            <label className="flex items-center gap-2 rounded-[6px] border border-border-1 px-3 py-2">
              <Search size={15} className="text-fg-4" />
              <span className="sr-only">Pesquisar documento</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar número, tipo ou status" className="min-w-0 flex-1 bg-transparent text-sm text-fg-1 outline-none placeholder:text-fg-4" />
            </label>
            <div className="mt-2 max-h-80 overflow-y-auto">
              {groupedDocuments.map(([label, documents]) => (
                <div key={label} className="py-1">
                  <p className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-fg-4">{label}</p>
                  {documents.map((document) => (
                    <button key={document.id} type="button" onClick={() => selectDocument(document)} className="flex w-full items-center justify-between gap-3 rounded-[6px] px-2 py-2 text-left hover:bg-bg-surface-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-fg-2">{selectorLabel(document)}</span>
                        <span className="block truncate font-mono text-[11px] text-fg-4">{getDocumentNumber(document)} · {document.status}</span>
                      </span>
                      {selectedDocument?.id === document.id && <Check size={15} className="shrink-0 text-accent-primary" />}
                    </button>
                  ))}
                </div>
              ))}
              {groupedDocuments.length === 0 && <p className="px-3 py-6 text-center text-sm text-fg-4">Nenhum documento encontrado.</p>}
            </div>
          </div>
        </details>
      </section>

      <section className="pt-2">
        <EntityTabsBar tabs={tabs} active={activeTab} onChange={(tab) => void changeTab(tab)} wrap />
        <div className="mt-4" role="tabpanel">
          {activeTab === 'visao' && (
            <ApoliceOverview key={selectedDocument?.id ?? policy.id} policy={policy} document={selectedDocument} onDirtyChange={setHasUnsavedChanges} />
          )}
          {activeTab === 'itens' && <ItensSeguradosTab apoliceId={policy.id} selectedDocument={selectedDocument} documents={contractDocuments} />}
          {activeTab === 'agendas' && <ParcelasComissoesTab selectedDocument={selectedDocument} documents={contractDocuments} />}
          {activeTab === 'repasses' && <RepassesTab apoliceId={policy.id} selectedDocument={selectedDocument} documents={contractDocuments} />}
          {isTransversalTab && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-bg-surface-2 p-3">
                <div>
                  <p className="text-sm font-bold text-fg-1">Registros relacionados</p>
                  <p className="text-xs text-fg-4">
                    {recordsScope === 'apolice' ? 'Registros da apólice' : `Registros de ${selectedDocument ? selectorLabel(selectedDocument) : 'documento'}`}
                  </p>
                </div>
                <div className="inline-flex rounded-[6px] bg-bg-surface p-1" aria-label="Escopo dos registros">
                  <ScopeButton active={recordsScope === 'apolice'} onClick={() => setRecordsScope('apolice')}>Apólice</ScopeButton>
                  <ScopeButton active={recordsScope === 'proposta'} disabled={!selectedDocument} onClick={() => setRecordsScope('proposta')}>Documento atual</ScopeButton>
                </div>
              </div>
              {activeTab === 'tarefas' && <TarefasTab tarefas={tabsState.tarefas} onAdd={tabsState.addTarefa} onToggle={tabsState.toggleTarefa} />}
              {activeTab === 'personalizados' && entityId && <CamposPersonalizadosTab entidadeTipo={entityType} entidadeId={entityId} />}
              {activeTab === 'anexos' && <AnexosLogsTab anexos={tabsState.anexos} logs={tabsState.logs} onAddAnexo={tabsState.addAnexo} autorPadrao="Usuário da sessão" showAuditLogs={tabsState.showAuditLogs} onToggleAuditLogs={tabsState.setShowAuditLogs} />}
              {activeTab === 'observacoes' && <ObservacoesTab observacoes={tabsState.observacoes} onAdd={tabsState.addObservacao} onTogglePin={tabsState.togglePin} mentionCandidates={tabsState.mentionCandidates} />}
            </>
          )}
        </div>
      </section>
      {operationOpen && <DerivedDocumentModal key={`operation-${policy.id}`} policy={policy} onClose={() => setOperationOpen(false)} onCreated={(documentId) => { setOperationOpen(false); setSearchParams({ documento: documentId }); setActiveTab('visao') }} />}
      {notRenewedOpen && <NotRenewedModal key={`not-renewed-${policy.id}`} policy={policy} onClose={() => setNotRenewedOpen(false)} onConfirm={confirmNotRenewed} />}
    </div>
  )
}

function ScopeButton({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${active ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3 hover:text-fg-1'}`}>{children}</button>
}

function formatDocument(value: string): string { const digits = value.replace(/\D/g, ''); return digits.length === 11 ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : digits.length === 14 ? digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : value }
function formatPhone(value: string): string { const digits = value.replace(/\D/g, ''); return digits.length === 11 ? digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : digits.length === 10 ? digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3') : value }
