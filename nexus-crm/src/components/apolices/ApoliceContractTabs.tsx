import { useMemo, useState } from 'react'
import { ChevronDown, CircleDollarSign, Layers3, ReceiptText, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getTable } from '../../lib/inMemoryDb'
import type { ApoliceItemRow, ComissaoRow, ItemCoberturaRow, ParcelaRow, RepasseRow } from '../../types/database'
import type { Proposal } from '../../types/proposta'
import { fmtDate, fmtMoney } from '../propostas/propostaFormat'

type LookupRow = Record<string, string | number | boolean | null | undefined>
type Scope = 'documento' | 'apolice'

const rows = <T,>(name: string) => getTable(name) as unknown as T[]
const documentTitle = (document: Proposal | undefined) => {
  if (!document) return 'Documento'
  if (document.proposalType === 'Fatura') return document.invoiceNumber ?? 'Fatura'
  if (document.proposalType === 'Endosso') return `Endosso ${document.endorsementNumber ?? 'sem número'}`
  if (document.endorsementNumber === '0') return `${document.proposalType} · Endosso 0`
  return document.proposalNumber ?? document.proposalType
}

function Card({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: typeof ShieldCheck; children: React.ReactNode }) {
  return <section className="rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-sm"><div className="mb-4 flex items-start gap-3"><span className="rounded-[6px] bg-accent-primary-soft p-2 text-accent-primary"><Icon size={17} /></span><div><h2 className="text-sm font-bold text-fg-1">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-fg-4">{subtitle}</p>}</div></div>{children}</section>
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' }) {
  const colors = tone === 'success' ? 'bg-success-soft text-success' : tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-bg-surface-2 text-fg-3'
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${colors}`}>{children}</span>
}

function ScopeToggle({ value, onChange }: { value: Scope; onChange: (value: Scope) => void }) {
  return <div className="inline-flex rounded-[6px] bg-bg-surface-2 p-1" aria-label="Perspectiva da agenda"><button type="button" onClick={() => onChange('documento')} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${value === 'documento' ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Documento selecionado</button><button type="button" onClick={() => onChange('apolice')} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${value === 'apolice' ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Toda a apólice</button></div>
}

function documentMap(documents: Proposal[]) { return new Map(documents.map((document) => [document.id, document])) }

export function ItensSeguradosTab({ apoliceId, selectedDocument, documents }: { apoliceId: string; selectedDocument?: Proposal; documents: Proposal[] }) {
  const [showAll, setShowAll] = useState(true)
  const docs = useMemo(() => documentMap(documents), [documents])
  const catalog = new Map(rows<LookupRow>('coberturas_catalogo').map((row) => [String(row.id), String(row.nome ?? row.codigo ?? 'Cobertura sem catálogo')]))
  const items = rows<ApoliceItemRow>('apolice_itens').filter((item) => item.apolice_id === apoliceId)
  const visibleItems = showAll ? items : items.filter((item) => !item.excluido_por_proposta_id)
  const movement = selectedDocument ? items.filter((item) => item.incluido_por_proposta_id === selectedDocument.id || item.excluido_por_proposta_id === selectedDocument.id) : []

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface px-4 py-3 shadow-sm"><div><p className="text-sm font-bold text-fg-1">Riscos do contrato</p><p className="text-xs text-fg-4">Perspectiva de {selectedDocument ? documentTitle(selectedDocument) : 'toda a apólice'}.</p></div><div className="inline-flex rounded-[6px] bg-bg-surface-2 p-1"><button type="button" onClick={() => setShowAll(false)} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${!showAll ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Vigentes</button><button type="button" onClick={() => setShowAll(true)} className={`rounded-[4px] px-3 py-1.5 text-xs font-bold ${showAll ? 'bg-bg-surface text-accent-primary shadow-sm' : 'text-fg-3'}`}>Todos</button></div></div>
    {movement.length > 0 && <Card title="Antes x Depois" subtitle={`Movimentação registrada por ${documentTitle(selectedDocument)}`} icon={Layers3}><div className="grid gap-3 sm:grid-cols-2"><div><p className="mb-2 text-xs font-bold text-fg-3">Antes</p>{movement.filter((item) => item.excluido_por_proposta_id === selectedDocument?.id).map((item) => <p key={item.id} className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-2">{item.descricao}</p>)}{!movement.some((item) => item.excluido_por_proposta_id === selectedDocument?.id) && <p className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-4">O item ainda não fazia parte do contrato.</p>}</div><div><p className="mb-2 text-xs font-bold text-fg-3">Depois</p>{movement.filter((item) => item.incluido_por_proposta_id === selectedDocument?.id).map((item) => <p key={item.id} className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-2">{item.descricao}</p>)}{!movement.some((item) => item.incluido_por_proposta_id === selectedDocument?.id) && <p className="rounded-[6px] bg-bg-surface-2 p-3 text-sm text-fg-4">O item foi removido sem substituição.</p>}</div></div></Card>}
    {visibleItems.map((item) => {
      const coverages = rows<ItemCoberturaRow>('item_coberturas').filter((coverage) => coverage.apolice_item_id === item.id)
      const specialization = rows<LookupRow>(`item_${String(item.risk_type).toLocaleLowerCase('pt-BR')}`).find((row) => row.apolice_item_id === item.id)
        ?? (item.risk_type === 'VEICULO' ? rows<LookupRow>('item_veiculo').find((row) => row.apolice_item_id === item.id) : undefined)
      const included = item.incluido_por_proposta_id ? docs.get(item.incluido_por_proposta_id) : undefined
      const excluded = item.excluido_por_proposta_id ? docs.get(item.excluido_por_proposta_id) : undefined
      return <details key={item.id} open className="group rounded-[8px] border border-border-1 bg-bg-surface shadow-sm"><summary className="flex cursor-pointer list-none items-center gap-3 p-4"><span className="rounded-[6px] bg-accent-primary-soft p-2 text-accent-primary"><ShieldCheck size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-fg-1">Item {item.numero_item ?? '—'} · {item.descricao ?? 'Risco sem descrição'}</span><span className="mt-0.5 block truncate font-mono text-xs text-fg-4">{item.identificador_externo ?? item.id} · {item.risk_type ?? 'Tipo não informado'}</span></span><Badge tone={excluded ? 'warning' : 'success'}>{excluded ? 'Histórico' : 'Vigente'}</Badge><ChevronDown size={16} className="text-fg-4 transition-transform group-open:rotate-180" /></summary><div className="border-t border-border-1 p-4"><div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4"><Data label="Valor do risco" value={fmtMoney(item.valor_risco ?? undefined)} mono /><Data label="Incluído por" value={included ? documentTitle(included) : 'Carga inicial'} link={included ? `/apolices/${apoliceId}?documento=${included.id}` : undefined} /><Data label="Excluído por" value={excluded ? documentTitle(excluded) : '—'} link={excluded ? `/apolices/${apoliceId}?documento=${excluded.id}` : undefined} />{specialization && Object.entries(specialization).filter(([key, value]) => key !== 'apolice_item_id' && value != null).slice(0, 5).map(([key, value]) => <Data key={key} label={key.replaceAll('_', ' ')} value={String(value)} />)}</div><div className="mt-4 border-t border-border-1 pt-4"><p className="mb-3 text-xs font-bold text-fg-3">Coberturas do item</p><div className="space-y-2">{coverages.map((coverage) => <div key={coverage.id} className="grid gap-2 rounded-[6px] bg-bg-surface-2 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto]"><div><p className="font-bold text-fg-2">{coverage.cobertura_id ? catalog.get(coverage.cobertura_id) : 'Cobertura não reconhecida'}</p><p className="text-fg-4">{coverage.excluido_por_proposta_id ? 'Versão histórica preservada' : 'Cobertura vigente'}</p></div><Data label="Capital / LMI" value={fmtMoney(coverage.capital_lmi ?? undefined)} mono /><Data label="Prêmio" value={fmtMoney(coverage.premio ?? undefined)} mono /></div>)}{coverages.length === 0 && <p className="text-sm text-fg-4">Nenhuma cobertura registrada para este item.</p>}</div></div></div></details>
    })}
    {visibleItems.length === 0 && <Empty text="Nenhum item segurado nesta perspectiva." />}
  </div>
}

export function ParcelasComissoesTab({ selectedDocument, documents }: { selectedDocument?: Proposal; documents: Proposal[] }) {
  const [scope, setScope] = useState<Scope>('documento')
  const docs = useMemo(() => documentMap(documents), [documents])
  const ids = scope === 'apolice' ? new Set(documents.map((document) => document.id)) : new Set(selectedDocument ? [selectedDocument.id] : [])
  const parcelas = rows<ParcelaRow>('parcelas').filter((row) => ids.has(row.proposta_id))
  const comissoes = rows<ComissaoRow>('comissoes').filter((row) => ids.has(row.proposta_id))
  const grades = new Map(rows<LookupRow>('recebimento_grades').map((row) => [String(row.id), String(row.nome)]))
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-3 shadow-sm"><div><p className="text-sm font-bold text-fg-1">Agendas do contrato</p><p className="text-xs text-fg-4">Leitura apenas; baixas e conciliação pertencem à Fase 3.</p></div><ScopeToggle value={scope} onChange={setScope} /></div>
    <Card title="Parcelas do segurado" subtitle={`${parcelas.length} parcela(s) · cobrança do cliente`} icon={ReceiptText}><AgendaTable headers={['Parcela', 'Documento', 'Vencimento', 'Valor', 'Status']} rows={parcelas.map((row) => [String(row.numero ?? '—'), documentTitle(docs.get(row.proposta_id)), row.vencimento ? fmtDate(row.vencimento) : '—', fmtMoney(row.valor ?? undefined), row.status ?? '—'])} /></Card>
    <Card title="Comissões da corretora" subtitle={`${comissoes.length} evento(s) · receita prevista da corretora`} icon={CircleDollarSign}><AgendaTable headers={['Evento', 'Documento / grade', 'Prevista em', 'Percentual', 'Valor previsto', 'Status']} rows={comissoes.map((row) => { const doc = docs.get(row.proposta_id); const raw = rows<LookupRow>('propostas').find((item) => item.id === row.proposta_id); return [String(row.numero ?? '—'), `${documentTitle(doc)} · ${grades.get(String(raw?.recebimento_grade_id)) ?? 'Agenda manual'}`, row.prevista_em ? fmtDate(row.prevista_em) : '—', row.percentual == null ? '—' : `${row.percentual}%`, fmtMoney(row.valor_previsto ?? undefined), row.status ?? '—'] })} /></Card>
  </div>
}

export function RepassesTab({ selectedDocument, documents }: { apoliceId: string; selectedDocument?: Proposal; documents: Proposal[] }) {
  const [scope, setScope] = useState<Scope>('documento')
  const docs = useMemo(() => documentMap(documents), [documents])
  const ids = scope === 'apolice' ? new Set(documents.map((document) => document.id)) : new Set(selectedDocument ? [selectedDocument.id] : [])
  const repasses = rows<RepasseRow>('repasses').filter((row) => ids.has(row.proposta_id))
  const produtores = new Map(rows<LookupRow>('produtores').map((row) => [String(row.id), String(row.nome ?? row.name ?? 'Beneficiário')]))
  const regras = new Map(rows<LookupRow>('repasse_regras').map((row) => [String(row.id), row]))
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border-1 bg-bg-surface p-3 shadow-sm"><div><p className="text-sm font-bold text-fg-1">Agenda de repasses</p><p className="text-xs text-fg-4">Despesa com produtor e gerente, separada da comissão.</p></div><ScopeToggle value={scope} onChange={setScope} /></div><Card title="Repasses previstos" subtitle={`${repasses.length} snapshot(s) materializado(s), sem ação de pagamento`} icon={UsersRound}><AgendaTable headers={['Beneficiário', 'Papel', 'Documento / regra', 'Base', 'Percentual / valor', 'Previsto em', 'Status']} rows={repasses.map((row) => { const regra = row.regra_id ? regras.get(row.regra_id) : undefined; return [produtores.get(row.beneficiario_id) ?? 'Beneficiário não encontrado', row.papel_beneficiario ?? '—', `${documentTitle(docs.get(row.proposta_id))} · ${row.regra_id ? `Regra ${String(regra?.papel ?? row.regra_id)}` : 'Manual'}`, row.base ?? '—', row.percentual == null ? fmtMoney(row.valor_previsto ?? undefined) : `${row.percentual}% · ${fmtMoney(row.valor_previsto ?? undefined)}`, row.previsto_em ? fmtDate(row.previsto_em) : '—', row.status ?? '—'] })} /></Card></div>
}

function Data({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) { const content = <span className={`${mono ? 'font-mono' : ''} mt-1 block font-semibold text-fg-2`}>{value}</span>; return <div><p className="text-[10px] font-bold uppercase tracking-wider text-fg-4">{label}</p>{link ? <Link className="text-accent-primary hover:underline" to={link}>{content}</Link> : content}</div> }
function Empty({ text }: { text: string }) { return <div className="rounded-[8px] border border-dashed border-border-1 bg-bg-surface p-8 text-center text-sm text-fg-4">{text}</div> }
function AgendaTable({ headers, rows: data }: { headers: string[]; rows: string[][] }) { if (!data.length) return <Empty text="Nenhum fato materializado nesta perspectiva." />; return <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead><tr className="border-b border-border-1">{headers.map((header) => <th key={header} className="px-3 py-2 font-bold text-fg-3">{header}</th>)}</tr></thead><tbody>{data.map((row, index) => <tr key={`${row[0]}-${index}`} className="border-b border-border-1 last:border-0">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className={`px-3 py-3 text-fg-2 ${cellIndex > 2 && /R\$|%/.test(cell) ? 'font-mono' : ''}`}>{cell}</td>)}</tr>)}</tbody></table></div> }
