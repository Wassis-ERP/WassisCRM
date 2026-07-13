import { useMemo, useState } from 'react'
import { Edit3, ListChecks, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react'
import { getTable, MOCK_TENANT_ID, newId } from '../../lib/inMemoryDb'
import type { CancelamentoMotivoRow, EndossoSubtipoRow } from '../../types/database'
import { useAuth } from '../../hooks/useAuth'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'
import { hasScopedCatalogDuplicate } from '../../contexts/contractCatalogCore'

type CatalogKind = 'endorsement' | 'cancellation'
type CatalogRow = EndossoSubtipoRow | CancelamentoMotivoRow

interface LookupRow {
  id: string
  nome?: string | null
  fantasia?: string | null
}

const inputClass = 'w-full rounded-[8px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm text-fg-1 outline-none transition-colors placeholder:text-fg-3 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20'

const natures = [
  ['ALTERACAO_DADOS', 'Alteração de dados'],
  ['INCLUSAO_ITEM', 'Inclusão de item'],
  ['EXCLUSAO_ITEM', 'Exclusão de item'],
  ['SUBSTITUICAO_ITEM', 'Substituição de item'],
  ['ALTERACAO_COBERTURA', 'Alteração de cobertura'],
  ['ALTERACAO_IMPORTANCIA_SEGURADA', 'Alteração de importância segurada'],
  ['ALTERACAO_CLAUSULA', 'Alteração de cláusula'],
] as const

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">{label}</span>{children}</label>
}

export default function ContractCatalogTab({ kind }: { kind: CatalogKind }) {
  const isEndorsement = kind === 'endorsement'
  const tableName = isEndorsement ? 'endosso_subtipos' : 'cancelamento_motivos'
  const title = isEndorsement ? 'Subtipos de endosso' : 'Motivos de cancelamento'
  const singular = isEndorsement ? 'subtipo' : 'motivo'
  const { activeBranchId } = useAuth()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const [, setRevision] = useState(0)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nature, setNature] = useState<string>(isEndorsement ? 'ALTERACAO_DADOS' : '')
  const [branchId, setBranchId] = useState('')
  const [insuranceBranchId, setInsuranceBranchId] = useState('')
  const [order, setOrder] = useState('10')
  const [notes, setNotes] = useState('')

  const rows = (getTable(tableName) as unknown as CatalogRow[])
    .slice()
    .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || a.nome.localeCompare(b.nome, 'pt-BR'))
  const branches = useMemo(() => getTable('filiais') as unknown as LookupRow[], [])
  const insuranceBranches = useMemo(() => getTable('ramos') as unknown as LookupRow[], [])
  const branchNames = useMemo(() => new Map(branches.map((row) => [row.id, row.fantasia ?? row.nome ?? row.id])), [branches])
  const insuranceBranchNames = useMemo(() => new Map(insuranceBranches.map((row) => [row.id, row.nome ?? row.id])), [insuranceBranches])
  const filtered = rows.filter((row) => {
    const needle = search.trim().toLocaleLowerCase('pt-BR')
    if (!needle) return true
    const canonical = isEndorsement && 'natureza_canonica' in row ? row.natureza_canonica : ''
    return `${row.nome} ${canonical} ${branchNames.get(row.filial_id ?? '') ?? ''} ${insuranceBranchNames.get(row.ramo_id ?? '') ?? ''}`.toLocaleLowerCase('pt-BR').includes(needle)
  })

  const reset = () => {
    setEditingId(null)
    setName('')
    setNature(isEndorsement ? 'ALTERACAO_DADOS' : '')
    setBranchId('')
    setInsuranceBranchId('')
    setOrder('10')
    setNotes('')
  }

  const edit = (row: CatalogRow) => {
    setEditingId(row.id)
    setName(row.nome)
    setNature(isEndorsement && 'natureza_canonica' in row ? row.natureza_canonica : '')
    setBranchId(row.filial_id ?? '')
    setInsuranceBranchId(row.ramo_id ?? '')
    setOrder(String(row.ordem ?? 10))
    setNotes(row.observacoes ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = () => {
    const normalizedName = name.trim()
    if (!normalizedName) {
      notify({ title: 'Informe o nome', description: `O ${singular} precisa de um nome operacional.`, tone: 'danger' })
      return
    }
    const duplicate = hasScopedCatalogDuplicate(rows, {
      id: editingId,
      nome: normalizedName,
      filialId: branchId || null,
      ramoId: insuranceBranchId || null,
    })
    if (duplicate) {
      notify({ title: 'Registro duplicado', description: `Já existe ${singular} ativo com o mesmo nome e escopo.`, tone: 'danger' })
      return
    }

    const target = editingId ? rows.find((row) => row.id === editingId) : undefined
    if (target) {
      target.nome = normalizedName
      target.filial_id = branchId || null
      target.ramo_id = insuranceBranchId || null
      target.ordem = Number(order) || 10
      target.observacoes = notes.trim() || null
      if (isEndorsement && 'natureza_canonica' in target) target.natureza_canonica = nature
    } else if (isEndorsement) {
      ;(getTable(tableName) as unknown as EndossoSubtipoRow[]).push({
        id: newId(), tenant_id: MOCK_TENANT_ID, filial_id: branchId || null, ramo_id: insuranceBranchId || null,
        nome: normalizedName, natureza_canonica: nature, ordem: Number(order) || 10, ativo: true, observacoes: notes.trim() || null,
      })
    } else {
      ;(getTable(tableName) as unknown as CancelamentoMotivoRow[]).push({
        id: newId(), tenant_id: MOCK_TENANT_ID, filial_id: branchId || null, ramo_id: insuranceBranchId || null,
        nome: normalizedName, ordem: Number(order) || 10, ativo: true, observacoes: notes.trim() || null,
      })
    }
    setRevision((current) => current + 1)
    notify({ title: editingId ? 'Cadastro atualizado' : 'Cadastro criado', description: `${normalizedName} está disponível para o escopo selecionado.`, tone: 'success' })
    reset()
  }

  const toggle = async (row: CatalogRow) => {
    if (row.ativo) {
      const accepted = await confirm({
        title: `Inativar ${singular}`,
        description: `“${row.nome}” deixará de aparecer em novas seleções, mas continuará visível no histórico.`,
        confirmLabel: 'Inativar',
        tone: 'warning',
      })
      if (!accepted) return
    }
    row.ativo = !row.ativo
    setRevision((current) => current + 1)
    notify({ title: row.ativo ? 'Cadastro reativado' : 'Cadastro inativado', description: row.nome, tone: row.ativo ? 'success' : 'info' })
  }

  return <div className="space-y-5">
    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5 shadow-[var(--shadow-1)]">
      <div className="mb-5 flex items-start gap-3"><span className="rounded-[8px] bg-accent-primary-soft p-2.5 text-accent-primary"><ListChecks size={18} /></span><div><h2 className="text-base font-black text-fg-1">{editingId ? `Editar ${singular}` : `Novo ${singular}`}</h2><p className="mt-1 text-sm text-fg-3">Escopo de grupo por padrão; refine por corretora e ramo quando necessário.</p></div></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Nome"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={isEndorsement ? 'Ex: Inclusão de veículo' : 'Ex: Solicitação do segurado'} /></Field>
        {isEndorsement && <Field label="Natureza canônica"><select className={inputClass} value={nature} onChange={(event) => setNature(event.target.value)}>{natures.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>}
        <Field label="Corretora"><select className={inputClass} value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Todo o grupo</option>{branches.map((row) => <option key={row.id} value={row.id}>{row.fantasia ?? row.nome ?? row.id}{row.id === activeBranchId ? ' · atual' : ''}</option>)}</select></Field>
        <Field label="Ramo"><select className={inputClass} value={insuranceBranchId} onChange={(event) => setInsuranceBranchId(event.target.value)}><option value="">Todos os ramos</option>{insuranceBranches.map((row) => <option key={row.id} value={row.id}>{row.nome ?? row.id}</option>)}</select></Field>
        <Field label="Ordem"><input className={inputClass} type="number" value={order} onChange={(event) => setOrder(event.target.value)} /></Field>
        <Field label="Observações"><input className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Uso e restrições operacionais" /></Field>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-2"><X size={15} />Limpar</button><button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover">{editingId ? <Save size={16} /> : <Plus size={16} />}{editingId ? 'Salvar alterações' : `Criar ${singular}`}</button></div>
    </section>

    <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
      <header className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-4 md:flex-row md:items-center md:justify-between"><div><h3 className="text-sm font-black text-fg-1">{title}</h3><p className="mt-1 text-xs text-fg-3">{rows.filter((row) => row.ativo).length} ativo(s) · históricos inativos preservados</p></div><label className="relative block w-full md:max-w-sm"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" /><input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${singular}...`} /></label></header>
      <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_100px_auto] gap-4 border-b border-border-1 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-fg-3 lg:grid"><span>Nome e natureza</span><span>Escopo</span><span>Status</span><span className="text-right">Ações</span></div>
      <div className="divide-y divide-border-1">{filtered.map((row) => {
        const canonical = isEndorsement && 'natureza_canonica' in row ? row.natureza_canonica : null
        return <div key={row.id} className="grid gap-3 px-4 py-4 hover:bg-bg-surface-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_100px_auto] lg:items-center"><div className="min-w-0"><p className="truncate text-sm font-black text-fg-1">{row.nome}</p>{canonical && <p className="mt-1 truncate font-mono text-[11px] text-fg-3">{canonical.replaceAll('_', ' ')}</p>}</div><div className="text-xs font-semibold text-fg-3"><p>{row.filial_id ? branchNames.get(row.filial_id) : 'Todo o grupo'}</p><p className="mt-1">{row.ramo_id ? insuranceBranchNames.get(row.ramo_id) : 'Todos os ramos'}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${row.ativo ? 'bg-signal-success/10 text-signal-success' : 'bg-bg-surface-3 text-fg-3'}`}>{row.ativo ? 'Ativo' : 'Inativo'}</span><div className="flex justify-end gap-1"><button type="button" onClick={() => edit(row)} className="rounded-[6px] p-2 text-fg-3 hover:bg-accent-primary-soft hover:text-accent-primary" aria-label={`Editar ${row.nome}`} title="Editar"><Edit3 size={15} /></button><button type="button" onClick={() => void toggle(row)} className={`rounded-[6px] p-2 ${row.ativo ? 'text-fg-3 hover:bg-signal-warning/10 hover:text-signal-warning' : 'text-accent-primary hover:bg-accent-primary-soft'}`} aria-label={`${row.ativo ? 'Inativar' : 'Reativar'} ${row.nome}`} title={row.ativo ? 'Inativar' : 'Reativar'}>{row.ativo ? <Trash2 size={15} /> : <RotateCcw size={15} />}</button></div></div>
      })}{filtered.length === 0 && <p className="px-4 py-12 text-center text-sm font-semibold text-fg-3">Nenhum registro encontrado.</p>}</div>
    </section>
  </div>
}
