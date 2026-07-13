import { useMemo, useState, type ReactNode } from 'react'
import {
  ChevronDown, CircleDollarSign, Edit3, Layers3, Plus, ReceiptText,
  ShieldCheck, Trash2, UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'
import { usePropostas } from '../../contexts/usePropostas'
import { getTable } from '../../lib/inMemoryDb'
import type { ApoliceItemRow, ComissaoRow, ItemCoberturaRow, ParcelaRow, RepasseRow } from '../../types/database'
import type { Proposal } from '../../types/proposta'
import { fmtDate, fmtMoney } from '../propostas/propostaFormat'
import {
  BatchDeleteModal, FinancialEditorModal, ItemEditorModal, CoverageEditorModal, type FinancialKind,
} from './ContractEditors'
import {
  cancelComissoes, cancelParcelas, cancelRepasses, canOperateComissao,
  canOperateParcela, canOperateRepasse, excludeCoverage, excludeItem,
  type BatchMutationResult,
} from './contractTabOperations'
import { AgendaGenerationModal } from './AgendaGenerationModal'

type LookupRow = Record<string, string | number | boolean | null | undefined>
type Scope = 'documento' | 'apolice'
type FinancialRow = ParcelaRow | ComissaoRow | RepasseRow
type ModalState = { kind: FinancialKind; mode: 'create' | 'edit' | 'batch'; row?: FinancialRow } | null

const rows = <T,>(name: string) => getTable(name) as unknown as T[]
const actionButton = 'inline-flex items-center justify-center gap-1.5 rounded-full border border-border-1 bg-bg-surface px-3 py-2 text-xs font-extrabold text-fg-2 transition-colors hover:border-accent-primary/45 hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-45'
const primaryButton = 'inline-flex items-center justify-center gap-1.5 rounded-full bg-accent-primary px-4 py-2 text-xs font-extrabold text-fg-on-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45'

const documentTitle = (document: Proposal | undefined) => {
  if (!document) return 'Documento'
  if (document.proposalType === 'Fatura') return document.invoiceNumber ?? 'Fatura'
  if (document.proposalType === 'Endosso') return `Endosso ${document.endorsementNumber ?? 'sem número'}`
  if (document.endorsementNumber === '0') return `${document.proposalType} · Endosso 0`
  return document.proposalNumber ?? document.proposalType
}

function Card({ title, subtitle, icon: Icon, action, children }: {
  title: string; subtitle?: string; icon: typeof ShieldCheck; action?: ReactNode; children: ReactNode
}) {
  return <section className="rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-sm">
    <div className="mb-4 flex flex-wrap items-start gap-3">
      <span className="rounded-[6px] bg-accent-primary-soft p-2 text-accent-primary"><Icon size={17} /></span>
      <div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-fg-1">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-fg-4">{subtitle}</p>}</div>
      {action}
    </div>
    {children}
  </section>
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' }) {
  const colors = tone === 'success' ? 'bg-success-soft text-success' : tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-bg-surface-2 text-fg-3'
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${colors}`}>{children}</span>
}

function ScopeToggle({ value, onChange }: { value: Scope; onChange: (value: Scope) => void }) {
  return <div className="inline-flex rounded-[6px] bg-bg-surface-2 p-1" aria-label="Perspectiva da agenda">
    <button type="button" onClick={() => onChange('documento')} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${value === 'documento' ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Documento selecionado</button>
    <button type="button" onClick={() => onChange('apolice')} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${value === 'apolice' ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Toda a apólice</button>
  </div>
}

function documentMap(documents: Proposal[]) { return new Map(documents.map((document) => [document.id, document])) }
function specializationTable(riskType: string | null): string | undefined {
  if (!riskType) return undefined
  return ({ VEICULO: 'item_veiculo', IMOVEL: 'item_imovel', EMPRESA: 'item_empresa', VIDA: 'item_vida' } as Record<string, string>)[riskType]
}

export function ItensSeguradosTab({ apoliceId, selectedDocument, documents }: { apoliceId: string; selectedDocument?: Proposal; documents: Proposal[] }) {
  const [showAll, setShowAll] = useState(true)
  const [itemEditor, setItemEditor] = useState<{ item?: ApoliceItemRow; specialization?: Record<string, unknown> } | null>(null)
  const [coverageEditor, setCoverageEditor] = useState<{ itemId: string; coverage?: ItemCoberturaRow } | null>(null)
  const [revision, setRevision] = useState(0)
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const { refreshProposals } = usePropostas()
  const docs = useMemo(() => documentMap(documents), [documents])
  const catalogRows = rows<LookupRow>('coberturas_catalogo').filter((row) => row.ativo !== false)
  const catalog = new Map(catalogRows.map((row) => [String(row.id), String(row.nome ?? row.codigo ?? 'Cobertura sem catálogo')]))
  const items = rows<ApoliceItemRow>('apolice_itens').filter((item) => item.apolice_id === apoliceId)
  const visibleItems = showAll ? items : items.filter((item) => !item.excluido_por_proposta_id)
  const movement = selectedDocument ? items.filter((item) => item.incluido_por_proposta_id === selectedDocument.id || item.excluido_por_proposta_id === selectedDocument.id) : []
  const refresh = () => { setRevision((current) => current + 1); refreshProposals() }
  void revision

  const requestItemExclusion = async (item: ApoliceItemRow) => {
    if (!selectedDocument) return
    const accepted = await confirm({ title: 'Registrar exclusão do item?', description: 'O item e suas coberturas vigentes passarão ao histórico pelo documento selecionado.', confirmLabel: 'Registrar exclusão', tone: 'warning' })
    if (!accepted) return
    const changed = excludeItem(item.id, selectedDocument.id)
    notify({ title: changed ? 'Exclusão registrada' : 'Item já estava no histórico', description: item.descricao ?? undefined, tone: changed ? 'success' : 'info' })
    refresh()
  }

  const requestCoverageExclusion = async (coverage: ItemCoberturaRow) => {
    if (!selectedDocument) return
    const accepted = await confirm({ title: 'Registrar exclusão da cobertura?', description: 'A versão será preservada no histórico contratual.', confirmLabel: 'Registrar exclusão', tone: 'warning' })
    if (!accepted) return
    const changed = excludeCoverage(coverage.id, selectedDocument.id)
    notify({ title: changed ? 'Cobertura excluída' : 'Cobertura já histórica', tone: changed ? 'success' : 'info' })
    refresh()
  }

  const openItemEditor = (item?: ApoliceItemRow) => {
    const table = item ? specializationTable(item.risk_type) : undefined
    const specialization = table && item ? rows<Record<string, unknown>>(table).find((row) => row.apolice_item_id === item.id) : undefined
    setItemEditor({ item, specialization })
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface px-4 py-3 shadow-sm">
      <div><p className="text-sm font-bold text-fg-1">Riscos do contrato</p><p className="text-xs text-fg-4">Inclusões, correções e exclusões ficam vinculadas ao documento selecionado.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-[6px] bg-bg-surface-2 p-1"><button type="button" onClick={() => setShowAll(false)} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${!showAll ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Vigentes</button><button type="button" onClick={() => setShowAll(true)} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${showAll ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Todos</button></div>
        <button type="button" className={primaryButton} disabled={!selectedDocument} onClick={() => openItemEditor()}><Plus size={14} />Novo item</button>
      </div>
    </div>
    {!selectedDocument && <div className="rounded-[8px] border border-warning/25 bg-warning-soft p-3 text-xs font-semibold text-warning">Selecione um documento para criar ou alterar fatos contratuais.</div>}
    {movement.length > 0 && <Card title="Antes x Depois" subtitle={`Movimentação registrada por ${documentTitle(selectedDocument)}`} icon={Layers3}><div className="grid gap-3 sm:grid-cols-2"><div><p className="mb-2 text-xs font-bold text-fg-3">Antes</p>{movement.filter((item) => item.excluido_por_proposta_id === selectedDocument?.id).map((item) => <p key={item.id} className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-2">{item.descricao}</p>)}{!movement.some((item) => item.excluido_por_proposta_id === selectedDocument?.id) && <p className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-4">O item ainda não fazia parte do contrato.</p>}</div><div><p className="mb-2 text-xs font-bold text-fg-3">Depois</p>{movement.filter((item) => item.incluido_por_proposta_id === selectedDocument?.id).map((item) => <p key={item.id} className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-2">{item.descricao}</p>)}{!movement.some((item) => item.incluido_por_proposta_id === selectedDocument?.id) && <p className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-4">O item foi removido sem substituição.</p>}</div></div></Card>}
    {visibleItems.map((item) => {
      const coverages = rows<ItemCoberturaRow>('item_coberturas').filter((coverage) => coverage.apolice_item_id === item.id)
      const table = specializationTable(item.risk_type)
      const specialization = table ? rows<LookupRow>(table).find((row) => row.apolice_item_id === item.id) : undefined
      const included = item.incluido_por_proposta_id ? docs.get(item.incluido_por_proposta_id) : undefined
      const excluded = item.excluido_por_proposta_id ? docs.get(item.excluido_por_proposta_id) : undefined
      return <details key={item.id} open className="group rounded-[8px] border border-border-1 bg-bg-surface shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4"><span className="rounded-[6px] bg-accent-primary-soft p-2 text-accent-primary"><ShieldCheck size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-fg-1">Item {item.numero_item ?? '—'} · {item.descricao ?? 'Risco sem descrição'}</span><span className="mt-0.5 block truncate font-mono text-xs text-fg-4">{item.identificador_externo ?? item.id} · {item.risk_type ?? 'Tipo não informado'}</span></span><Badge tone={excluded ? 'warning' : 'success'}>{excluded ? 'Histórico' : 'Vigente'}</Badge><ChevronDown size={16} className="text-fg-4 transition-transform group-open:rotate-180" /></summary>
        <div className="border-t border-border-1 p-4">
          {!excluded && <div className="mb-4 flex flex-wrap justify-end gap-2"><button type="button" className={actionButton} disabled={!selectedDocument} onClick={() => openItemEditor(item)}><Edit3 size={13} />Corrigir item</button><button type="button" className={actionButton} disabled={!selectedDocument} onClick={() => setCoverageEditor({ itemId: item.id })}><Plus size={13} />Nova cobertura</button><button type="button" className={`${actionButton} text-danger`} disabled={!selectedDocument} onClick={() => void requestItemExclusion(item)}><Trash2 size={13} />Registrar exclusão</button></div>}
          <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4"><Data label="Valor do risco" value={fmtMoney(item.valor_risco ?? undefined)} mono /><Data label="Incluído por" value={included ? documentTitle(included) : 'Carga inicial'} link={included ? `/apolices/${apoliceId}?documento=${included.id}` : undefined} /><Data label="Excluído por" value={excluded ? documentTitle(excluded) : '—'} link={excluded ? `/apolices/${apoliceId}?documento=${excluded.id}` : undefined} />{specialization && Object.entries(specialization).filter(([key, value]) => key !== 'apolice_item_id' && value != null).slice(0, 5).map(([key, value]) => <Data key={key} label={key.replaceAll('_', ' ')} value={String(value)} />)}</div>
          <div className="mt-4 border-t border-border-1 pt-4"><p className="mb-3 text-xs font-bold text-fg-3">Coberturas do item</p><div className="space-y-2">{coverages.map((coverage) => <div key={coverage.id} className="grid gap-2 rounded-[6px] bg-bg-surface-2 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"><div><p className="font-bold text-fg-2">{coverage.cobertura_id ? catalog.get(coverage.cobertura_id) : 'Cobertura não reconhecida'}</p><p className="text-fg-4">{coverage.excluido_por_proposta_id ? 'Versão histórica preservada' : 'Cobertura vigente'}</p></div><Data label="Capital / LMI" value={fmtMoney(coverage.capital_lmi ?? undefined)} mono /><Data label="Prêmio" value={fmtMoney(coverage.premio ?? undefined)} mono />{!coverage.excluido_por_proposta_id && !excluded ? <div className="flex items-center gap-1"><button type="button" title="Editar cobertura" className={actionButton} disabled={!selectedDocument} onClick={() => setCoverageEditor({ itemId: item.id, coverage })}><Edit3 size={13} /></button><button type="button" title="Excluir cobertura" className={`${actionButton} text-danger`} disabled={!selectedDocument} onClick={() => void requestCoverageExclusion(coverage)}><Trash2 size={13} /></button></div> : <Badge tone="warning">Histórico</Badge>}</div>)}{coverages.length === 0 && <p className="text-sm text-fg-4">Nenhuma cobertura registrada para este item.</p>}</div></div>
        </div>
      </details>
    })}
    {visibleItems.length === 0 && <Empty text="Nenhum item segurado nesta perspectiva." />}
    {itemEditor && selectedDocument && <ItemEditorModal item={itemEditor.item} specialization={itemEditor.specialization} apoliceId={apoliceId} propostaId={selectedDocument.id} nextNumber={Math.max(0, ...items.map((item) => item.numero_item ?? 0)) + 1} onClose={() => setItemEditor(null)} onSaved={() => { setItemEditor(null); refresh(); notify({ title: itemEditor.item ? 'Item atualizado' : 'Item criado', tone: 'success' }) }} />}
    {coverageEditor && selectedDocument && <CoverageEditorModal itemId={coverageEditor.itemId} propostaId={selectedDocument.id} coverage={coverageEditor.coverage} catalog={catalogRows.map((row) => ({ id: String(row.id), name: String(row.nome ?? row.codigo ?? row.id) }))} onClose={() => setCoverageEditor(null)} onSaved={() => { setCoverageEditor(null); refresh(); notify({ title: coverageEditor.coverage ? 'Nova versão criada' : 'Cobertura criada', description: coverageEditor.coverage ? 'A versão anterior foi preservada no histórico.' : undefined, tone: 'success' }) }} />}
  </div>
}

function FinancialToolbar({ selected, onEdit, onDelete, onClear }: { selected: number; onEdit: () => void; onDelete: () => void; onClear: () => void }) {
  if (!selected) return null
  return <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[6px] border border-accent-primary/20 bg-accent-primary-soft px-3 py-2"><span className="mr-auto text-xs font-extrabold text-accent-primary">{selected} selecionado(s)</span><button type="button" className={actionButton} onClick={onEdit}><Edit3 size={13} />Alterar selecionados</button><button type="button" className={`${actionButton} text-danger`} onClick={onDelete}><Trash2 size={13} />Excluir selecionados</button><button type="button" className={actionButton} onClick={onClear}>Limpar</button></div>
}

function SelectableAgendaTable<T extends { id: string }>({ headers, data, selected, onSelected, cells, canOperate, onEdit }: {
  headers: string[]; data: T[]; selected: Set<string>; onSelected: (selected: Set<string>) => void
  cells: (row: T) => ReactNode[]; canOperate: (row: T) => boolean; onEdit: (row: T) => void
}) {
  if (!data.length) return <Empty text="Nenhum fato materializado nesta perspectiva." />
  const allSelected = data.every((row) => selected.has(row.id))
  const someSelected = data.some((row) => selected.has(row.id))
  const toggleAll = () => onSelected(allSelected ? new Set() : new Set(data.map((row) => row.id)))
  const toggle = (id: string) => { const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id); onSelected(next) }
  return <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead><tr className="border-b border-border-1"><th className="w-10 px-3 py-2"><input ref={(node) => { if (node) node.indeterminate = someSelected && !allSelected }} aria-label="Selecionar todas as linhas visíveis" type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-[var(--accent-primary)]" /></th>{headers.map((header) => <th key={header} className="px-3 py-2 font-bold text-fg-3">{header}</th>)}<th className="w-20 px-3 py-2 text-right font-bold text-fg-3">Ações</th></tr></thead><tbody>{data.map((row) => { const operable = canOperate(row); return <tr key={row.id} className={`border-b border-border-1 last:border-0 ${operable ? '' : 'bg-bg-surface-2/55'}`}><td className="px-3 py-3"><input aria-label="Selecionar linha" type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} className="h-4 w-4 accent-[var(--accent-primary)]" /></td>{cells(row).map((cell, index) => <td key={index} className="px-3 py-3 text-fg-2">{cell}</td>)}<td className="px-3 py-3 text-right"><button type="button" className={actionButton} title={operable ? 'Editar linha' : 'Linha conciliada ou liquidada; alteração bloqueada'} disabled={!operable} onClick={() => onEdit(row)}><Edit3 size={13} /></button></td></tr> })}</tbody></table></div>
}

function resultMessage(result: BatchMutationResult): string {
  if (!result.blocked.length) return `${result.eligible.length} linha(s) elegível(is) processada(s).`
  return `${result.eligible.length} linha(s) processada(s) e ${result.blocked.length} bloqueada(s) por liquidação ou conciliação.`
}

export function ParcelasComissoesTab({ selectedDocument, documents }: { selectedDocument?: Proposal; documents: Proposal[] }) {
  const [scope, setScope] = useState<Scope>('documento')
  const [selectedParcelas, setSelectedParcelas] = useState<Set<string>>(new Set())
  const [selectedComissoes, setSelectedComissoes] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>(null)
  const [deleteKind, setDeleteKind] = useState<'parcela' | 'comissao' | null>(null)
  const [generationOpen, setGenerationOpen] = useState(false)
  const [revision, setRevision] = useState(0)
  const { notify } = useSystemFeedback()
  const { refreshProposals } = usePropostas()
  const docs = useMemo(() => documentMap(documents), [documents])
  const ids = scope === 'apolice' ? new Set(documents.map((document) => document.id)) : new Set(selectedDocument ? [selectedDocument.id] : [])
  const parcelas = rows<ParcelaRow>('parcelas').filter((row) => ids.has(row.proposta_id) && row.status?.toLocaleLowerCase('pt-BR') !== 'cancelada')
  const comissoes = rows<ComissaoRow>('comissoes').filter((row) => ids.has(row.proposta_id) && row.status !== 'CANCELADA')
  const grades = new Map(rows<LookupRow>('recebimento_grades').map((row) => [String(row.id), String(row.nome)]))
  void revision
  const refresh = () => { setRevision((current) => current + 1); refreshProposals() }

  const remove = (kind: 'parcela' | 'comissao', selected: Set<string>, reason: string) => {
    const result = kind === 'parcela' ? cancelParcelas([...selected], reason) : cancelComissoes([...selected], reason)
    notify({ title: result.blocked.length ? 'Exclusão parcial' : 'Exclusão concluída', description: resultMessage(result), tone: result.blocked.length ? 'warning' : 'success' })
    if (kind === 'parcela') setSelectedParcelas(new Set()); else setSelectedComissoes(new Set())
    setDeleteKind(null)
    refresh()
  }
  const saved = (kind: FinancialKind, result?: BatchMutationResult) => {
    setModal(null)
    if (kind === 'parcela') setSelectedParcelas(new Set()); else setSelectedComissoes(new Set())
    notify({ title: result?.blocked.length ? 'Alteração parcial' : 'Agenda atualizada', description: result ? resultMessage(result) : 'Novo evento incluído no documento.', tone: result?.blocked.length ? 'warning' : 'success' })
    refresh()
  }

  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-3 shadow-sm"><div><p className="text-sm font-bold text-fg-1">Agendas do contrato</p><p className="text-xs text-fg-4">Gere parcelas, comissões e repasses juntos; baixas e conciliação continuam reservadas à Fase 3.</p></div><div className="flex flex-wrap items-center gap-2"><ScopeToggle value={scope} onChange={(value) => { setScope(value); setSelectedParcelas(new Set()); setSelectedComissoes(new Set()) }} /><button type="button" className={primaryButton} disabled={!selectedDocument} onClick={() => setGenerationOpen(true)}><Layers3 size={14} />Gerar agendas</button></div></div>
    <Card title="Parcelas do segurado" subtitle={`${parcelas.length} parcela(s) · cobrança do cliente`} icon={ReceiptText} action={<button type="button" className={actionButton} disabled={!documents.length} onClick={() => setModal({ kind: 'parcela', mode: 'create' })}><Plus size={14} />Nova parcela</button>}>
      <FinancialToolbar selected={selectedParcelas.size} onEdit={() => setModal({ kind: 'parcela', mode: 'batch' })} onDelete={() => setDeleteKind('parcela')} onClear={() => setSelectedParcelas(new Set())} />
      <SelectableAgendaTable headers={['Parcela', 'Documento', 'Vencimento', 'Valor', 'Status']} data={parcelas} selected={selectedParcelas} onSelected={setSelectedParcelas} canOperate={canOperateParcela} onEdit={(row) => setModal({ kind: 'parcela', mode: 'edit', row })} cells={(row) => [String(row.numero ?? '—'), documentTitle(docs.get(row.proposta_id)), row.vencimento ? fmtDate(row.vencimento) : '—', <span className="font-mono">{fmtMoney(row.valor ?? undefined)}</span>, row.status ?? '—']} />
    </Card>
    <Card title="Comissões da corretora" subtitle={`${comissoes.length} evento(s) · normal, agenciamento, vitalícia, adicional ou restituição`} icon={CircleDollarSign} action={<button type="button" className={actionButton} disabled={!documents.length} onClick={() => setModal({ kind: 'comissao', mode: 'create' })}><Plus size={14} />Nova comissão</button>}>
      <FinancialToolbar selected={selectedComissoes.size} onEdit={() => setModal({ kind: 'comissao', mode: 'batch' })} onDelete={() => setDeleteKind('comissao')} onClear={() => setSelectedComissoes(new Set())} />
      <SelectableAgendaTable headers={['Evento', 'Tipo', 'Documento / grade', 'Prevista em', 'Percentual', 'Valor previsto', 'Status']} data={comissoes} selected={selectedComissoes} onSelected={setSelectedComissoes} canOperate={canOperateComissao} onEdit={(row) => setModal({ kind: 'comissao', mode: 'edit', row })} cells={(row) => { const doc = docs.get(row.proposta_id); const raw = rows<LookupRow>('propostas').find((item) => item.id === row.proposta_id); return [String(row.numero ?? '—'), <Badge>{row.tipo_comissao}</Badge>, `${documentTitle(doc)} · ${grades.get(String(raw?.recebimento_grade_id)) ?? 'Agenda manual'}`, row.prevista_em ? fmtDate(row.prevista_em) : '—', row.percentual == null ? '—' : <span className="font-mono">{row.percentual}%</span>, <span className="font-mono">{fmtMoney(row.valor_previsto ?? undefined)}</span>, row.status ?? '—'] }} />
    </Card>
    {modal && (modal.kind === 'parcela' || modal.kind === 'comissao') && <FinancialEditorModal kind={modal.kind} mode={modal.mode} row={modal.row} selectedIds={modal.kind === 'parcela' ? [...selectedParcelas] : [...selectedComissoes]} documents={documents} defaultDocumentId={selectedDocument?.id} onClose={() => setModal(null)} onSaved={(result) => saved(modal.kind, result)} />}
    {deleteKind && (() => { const selected = deleteKind === 'parcela' ? selectedParcelas : selectedComissoes; const eligible = deleteKind === 'parcela' ? parcelas.filter((row) => selected.has(row.id) && canOperateParcela(row)).length : comissoes.filter((row) => selected.has(row.id) && canOperateComissao(row)).length; return <BatchDeleteModal label={deleteKind === 'parcela' ? 'parcelas' : 'comissões'} count={selected.size} eligible={eligible} blocked={selected.size - eligible} onClose={() => setDeleteKind(null)} onConfirm={(reason) => remove(deleteKind, selected, reason)} /> })()}
    {generationOpen && selectedDocument && <AgendaGenerationModal document={selectedDocument} onClose={() => setGenerationOpen(false)} onApplied={(message) => { setGenerationOpen(false); refresh(); notify({ title: 'Agendas geradas', description: message, tone: 'success' }) }} />}
  </div>
}

export function RepassesTab({ selectedDocument, documents }: { apoliceId: string; selectedDocument?: Proposal; documents: Proposal[] }) {
  const [scope, setScope] = useState<Scope>('documento')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [revision, setRevision] = useState(0)
  const { notify } = useSystemFeedback()
  const { refreshProposals } = usePropostas()
  const docs = useMemo(() => documentMap(documents), [documents])
  const ids = scope === 'apolice' ? new Set(documents.map((document) => document.id)) : new Set(selectedDocument ? [selectedDocument.id] : [])
  const repasses = rows<RepasseRow>('repasses').filter((row) => ids.has(row.proposta_id) && row.status !== 'CANCELADO')
  const produtores = new Map(rows<LookupRow>('produtores').map((row) => [String(row.id), String(row.nome ?? row.name ?? 'Beneficiário')]))
  const regras = new Map(rows<LookupRow>('repasse_regras').map((row) => [String(row.id), row]))
  void revision
  const refresh = () => { setRevision((current) => current + 1); refreshProposals() }
  const remove = (reason: string) => {
    const result = cancelRepasses([...selected], reason)
    notify({ title: result.blocked.length ? 'Exclusão parcial' : 'Exclusão concluída', description: resultMessage(result), tone: result.blocked.length ? 'warning' : 'success' })
    setSelected(new Set()); setDeleteOpen(false); refresh()
  }
  const saved = (result?: BatchMutationResult) => {
    setModal(null); setSelected(new Set())
    notify({ title: result?.blocked.length ? 'Alteração parcial' : 'Agenda atualizada', description: result ? resultMessage(result) : 'Novo repasse incluído no documento.', tone: result?.blocked.length ? 'warning' : 'success' })
    refresh()
  }
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-3 shadow-sm"><div><p className="text-sm font-bold text-fg-1">Agenda de repasses</p><p className="text-xs text-fg-4">Despesa com produtor e gerente, separada da comissão da corretora.</p></div><ScopeToggle value={scope} onChange={(value) => { setScope(value); setSelected(new Set()) }} /></div>
    <Card title="Repasses previstos" subtitle={`${repasses.length} snapshot(s) materializado(s), sem ação de pagamento`} icon={UsersRound} action={<button type="button" className={primaryButton} disabled={!documents.length} onClick={() => setModal({ kind: 'repasse', mode: 'create' })}><Plus size={14} />Novo repasse</button>}>
      <FinancialToolbar selected={selected.size} onEdit={() => setModal({ kind: 'repasse', mode: 'batch' })} onDelete={() => setDeleteOpen(true)} onClear={() => setSelected(new Set())} />
      <SelectableAgendaTable headers={['Beneficiário', 'Papel', 'Documento / regra', 'Base', 'Percentual / valor', 'Previsto em', 'Status']} data={repasses} selected={selected} onSelected={setSelected} canOperate={canOperateRepasse} onEdit={(row) => setModal({ kind: 'repasse', mode: 'edit', row })} cells={(row) => { const regra = row.regra_id ? regras.get(row.regra_id) : undefined; return [produtores.get(row.beneficiario_id) ?? 'Beneficiário não encontrado', row.papel_beneficiario ?? '—', `${documentTitle(docs.get(row.proposta_id))} · ${row.regra_id ? `Regra ${String(regra?.papel ?? row.regra_id)}` : 'Manual'}`, row.base ?? '—', <span className="font-mono">{row.percentual == null ? fmtMoney(row.valor_previsto ?? undefined) : `${row.percentual}% · ${fmtMoney(row.valor_previsto ?? undefined)}`}</span>, row.previsto_em ? fmtDate(row.previsto_em) : '—', row.status ?? '—'] }} />
    </Card>
    {modal?.kind === 'repasse' && <FinancialEditorModal kind="repasse" mode={modal.mode} row={modal.row} selectedIds={[...selected]} documents={documents} defaultDocumentId={selectedDocument?.id} onClose={() => setModal(null)} onSaved={saved} />}
    {deleteOpen && (() => { const eligible = repasses.filter((row) => selected.has(row.id) && canOperateRepasse(row)).length; return <BatchDeleteModal label="repasses" count={selected.size} eligible={eligible} blocked={selected.size - eligible} onClose={() => setDeleteOpen(false)} onConfirm={remove} /> })()}
  </div>
}

function Data({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) { const content = <span className={`${mono ? 'font-mono' : ''} mt-1 block font-semibold text-fg-2`}>{value}</span>; return <div><p className="text-[10px] font-bold uppercase tracking-wider text-fg-4">{label}</p>{link ? <Link className="text-accent-primary hover:underline" to={link}>{content}</Link> : content}</div> }
function Empty({ text }: { text: string }) { return <div className="rounded-[8px] border border-dashed border-border-1 bg-bg-surface p-8 text-center text-sm text-fg-4">{text}</div> }
