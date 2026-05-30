import { useMemo, useState } from 'react'
import {
  Search,
  Filter,
  Plus,
  Upload,
  FileText,
  Shield,
  RefreshCcw,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit,
  List,
  Kanban,
  X,
} from 'lucide-react'

/* =========================================================================
 * Tipos
 * ========================================================================= */

type ProposalStatus =
  | 'Em Análise'
  | 'Pendente'
  | 'Pendência Resolvida'
  | 'Proposta Emitida'
  | 'Vigente'
  | 'Renovada'
  | 'Endossada'
  | 'Cancelada'
  | 'Recusada'
  | 'Não renovada'

type ProposalType = 'Proposta' | 'Renovação' | 'Endosso'

interface Proposal {
  id: string
  insured: string
  branch: string
  status: ProposalStatus
  currentStatus?: ProposalStatus
  proposalType: ProposalType
  producer: { name: string; avatarUrl?: string }
  insurer: string
  policyNumber?: string
  vigenciaInicial?: string // ISO
  vigenciaFinal?: string // ISO
  details?: { model?: string; brand?: string; year?: string; plate?: string; chassis?: string }
}

interface CustomProposalStatus {
  id: string
  name: ProposalStatus
  color: string
  order: number
}

type CardKey = 'emAndamento' | 'vigentes' | 'renovacoesPendentes' | 'renovacoes30d' | null

/* =========================================================================
 * Dados mock (modo frontend puro)
 * ========================================================================= */

const today = new Date()
const iso = (offsetDays: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'P-0001',
    insured: 'Leonardo Perboni',
    branch: 'Auto',
    status: 'Em Análise',
    proposalType: 'Proposta',
    producer: { name: 'Vinícius Assis' },
    insurer: 'Porto Seguro',
    vigenciaInicial: iso(10),
    vigenciaFinal: iso(375),
    details: { model: 'Corolla XEi', brand: 'Toyota', year: '2024', plate: 'ABC-1D23', chassis: '9BR53ZEC...' },
  },
  {
    id: 'P-0002',
    insured: 'Mario Sgarbi',
    branch: 'Vida',
    status: 'Pendente',
    proposalType: 'Proposta',
    producer: { name: 'Hicila Fernandes' },
    insurer: 'Bradesco Seguros',
    vigenciaInicial: iso(2),
    vigenciaFinal: iso(367),
  },
  {
    id: 'P-0003',
    insured: '1001 Indústria Ltda.',
    branch: 'Empresarial',
    status: 'Pendência Resolvida',
    proposalType: 'Renovação',
    producer: { name: 'Carlos Santos' },
    insurer: 'Allianz',
    vigenciaInicial: iso(-360),
    vigenciaFinal: iso(5),
  },
  {
    id: 'P-0004',
    insured: 'Ana Silva',
    branch: 'Residencial',
    status: 'Proposta Emitida',
    currentStatus: 'Vigente',
    proposalType: 'Proposta',
    producer: { name: 'Marina Costa' },
    insurer: 'Tokio Marine',
    policyNumber: 'AP-77821',
    vigenciaInicial: iso(-30),
    vigenciaFinal: iso(335),
  },
  {
    id: 'P-0005',
    insured: 'Edmilson Giovani',
    branch: 'Auto',
    status: 'Vigente',
    currentStatus: 'Vigente',
    proposalType: 'Proposta',
    producer: { name: 'Roberto Lima' },
    insurer: 'Porto Seguro',
    policyNumber: 'AP-77900',
    vigenciaInicial: iso(-200),
    vigenciaFinal: iso(165),
    details: { model: 'HB20', brand: 'Hyundai', year: '2022', plate: 'XYZ-9K11' },
  },
  {
    id: 'P-0006',
    insured: 'Construtora Beta S/A',
    branch: 'RC Profissional',
    status: 'Renovada',
    currentStatus: 'Vigente',
    proposalType: 'Renovação',
    producer: { name: 'Vinícius Assis' },
    insurer: 'Mapfre',
    policyNumber: 'AP-77450',
    vigenciaInicial: iso(-10),
    vigenciaFinal: iso(355),
  },
  {
    id: 'P-0007',
    insured: 'Joana Pereira',
    branch: 'Auto',
    status: 'Pendente',
    proposalType: 'Renovação',
    producer: { name: 'Hicila Fernandes' },
    insurer: 'Liberty',
    vigenciaInicial: iso(-355),
    vigenciaFinal: iso(15),
  },
  {
    id: 'P-0008',
    insured: 'Mecânica Central Ltda.',
    branch: 'Empresarial',
    status: 'Endossada',
    currentStatus: 'Vigente',
    proposalType: 'Endosso',
    producer: { name: 'Marina Costa' },
    insurer: 'Allianz',
    policyNumber: 'AP-77001',
    vigenciaInicial: iso(-150),
    vigenciaFinal: iso(28),
  },
  {
    id: 'P-0009',
    insured: 'Café & Cia ME',
    branch: 'Empresarial',
    status: 'Cancelada',
    proposalType: 'Proposta',
    producer: { name: 'Carlos Santos' },
    insurer: 'Tokio Marine',
    vigenciaInicial: iso(-90),
    vigenciaFinal: iso(275),
  },
]

// Status do funil de propostas — sempre via tokens --signal-* / accent (nunca ramo).
const CUSTOM_STATUSES: CustomProposalStatus[] = [
  { id: 's1', name: 'Em Análise', color: 'bg-signal-warning', order: 1 },
  { id: 's2', name: 'Pendente', color: 'bg-signal-warning', order: 2 },
  { id: 's3', name: 'Pendência Resolvida', color: 'bg-accent-primary', order: 3 },
  { id: 's4', name: 'Proposta Emitida', color: 'bg-signal-success', order: 4 },
]

const STATUS_BADGE: Record<string, string> = {
  Vigente: 'bg-signal-success/15 text-signal-success',
  Renovada: 'bg-signal-success/15 text-signal-success',
  Endossada: 'bg-signal-success/15 text-signal-success',
  Cancelada: 'bg-signal-danger/15 text-signal-danger',
  Recusada: 'bg-signal-danger/15 text-signal-danger',
  'Não renovada': 'bg-bg-surface-3 text-fg-3',
  'Em Análise': 'bg-signal-warning/15 text-signal-warning',
  Pendente: 'bg-signal-warning/15 text-signal-warning',
  'Pendência Resolvida': 'bg-accent-primary-soft text-accent-primary',
  'Proposta Emitida': 'bg-accent-primary-soft text-accent-primary',
}

/* =========================================================================
 * Página
 * ========================================================================= */

interface FilterValues {
  searchTerm: string
  status: string
  branch: string
  insurer: string
  proposalType: string
  vigenciaStart: string
  vigenciaEnd: string
  insured: string
  producer: string
  netPremiumMin: string
  netPremiumMax: string
}

const INITIAL_FILTERS: FilterValues = {
  searchTerm: '',
  status: '',
  branch: '',
  insurer: '',
  proposalType: '',
  vigenciaStart: '',
  vigenciaEnd: '',
  insured: '',
  producer: '',
  netPremiumMin: '',
  netPremiumMax: '',
}

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS)
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS)
  const [viewMode, setViewMode] = useState<'Lista' | 'Kanban'>('Lista')
  const [activeCard, setActiveCard] = useState<CardKey>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const lastUpdated = useMemo(() => {
    const d = new Date()
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }, [])

  /* ---- Cálculos dos cards ---- */
  const counts = useMemo(() => {
    const in30 = new Date()
    in30.setDate(in30.getDate() + 30)
    const todayISO = today.toISOString().slice(0, 10)
    const in30ISO = in30.toISOString().slice(0, 10)
    return {
      emAndamento: proposals.filter(p => p.status === 'Em Análise' || p.status === 'Pendente').length,
      vigentes: proposals.filter(p => p.currentStatus === 'Vigente').length,
      renovacoesPendentes: proposals.filter(p => p.proposalType === 'Renovação' && p.status === 'Pendente').length,
      renovacoes30d: proposals.filter(
        p => p.vigenciaFinal && p.vigenciaFinal >= todayISO && p.vigenciaFinal <= in30ISO,
      ).length,
    }
  }, [proposals])

  /* ---- Click em cards ---- */
  const handleCardClick = (key: Exclude<CardKey, null>) => {
    if (activeCard === key) {
      setActiveCard(null)
      if (key === 'emAndamento') setViewMode('Lista')
      return
    }
    setActiveCard(key)
    if (key === 'emAndamento') setViewMode('Kanban')
    else setViewMode('Lista')
  }

  /* ---- Filtragem ---- */
  const filtered = useMemo(() => {
    const in30 = new Date()
    in30.setDate(in30.getDate() + 30)
    const todayISO = today.toISOString().slice(0, 10)
    const in30ISO = in30.toISOString().slice(0, 10)

    return proposals.filter(p => {
      // filtros por card
      if (activeCard === 'vigentes' && p.currentStatus !== 'Vigente') return false
      if (activeCard === 'renovacoesPendentes' && !(p.proposalType === 'Renovação' && p.status === 'Pendente')) return false
      if (activeCard === 'renovacoes30d') {
        if (!p.vigenciaFinal || p.vigenciaFinal < todayISO || p.vigenciaFinal > in30ISO) return false
      }
      // busca textual
      if (filters.searchTerm) {
        const q = filters.searchTerm.toLowerCase()
        const hay = [p.insured, p.branch, p.insurer, p.producer.name, p.policyNumber ?? '']
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.status && p.status !== filters.status) return false
      if (filters.branch && p.branch !== filters.branch) return false
      if (filters.insurer && p.insurer !== filters.insurer) return false
      if (filters.proposalType && p.proposalType !== filters.proposalType) return false
      if (filters.insured && p.insured !== filters.insured) return false
      if (filters.producer && p.producer.name !== filters.producer) return false
      if (filters.vigenciaStart && (p.vigenciaInicial ?? '') < filters.vigenciaStart) return false
      if (filters.vigenciaEnd && (p.vigenciaFinal ?? '') > filters.vigenciaEnd) return false
      return true
    })
  }, [proposals, filters, activeCard])

  /* ---- Listas auxiliares para selects ---- */
  const uniq = (arr: (string | undefined)[]) =>
    Array.from(new Set(arr.filter(Boolean) as string[])).sort()
  const branches = uniq(proposals.map(p => p.branch))
  const insurers = uniq(proposals.map(p => p.insurer))
  const insureds = uniq(proposals.map(p => p.insured))
  const producers = uniq(proposals.map(p => p.producer.name))
  const statuses = uniq(proposals.map(p => p.status))
  const proposalTypes: ProposalType[] = ['Proposta', 'Renovação', 'Endosso']

  /* ---- Kanban: drop ---- */
  const onCardDrop = (proposalId: string, newStatus: ProposalStatus) => {
    setProposals(prev => prev.map(p => (p.id === proposalId ? { ...p, status: newStatus } : p)))
  }

  /* ---- Cards definição ---- */
  const cards: Array<{
    key: Exclude<CardKey, null>
    title: string
    subtitle: string
    icon: React.ReactNode
    color: string
    value: number
  }> = [
    {
      key: 'emAndamento',
      title: 'Propostas',
      subtitle: 'Em andamento',
      icon: <FileText size={28} className="text-fg-4" />,
      color: 'text-accent-primary',
      value: counts.emAndamento,
    },
    {
      key: 'vigentes',
      title: 'Apólices',
      subtitle: 'Vigentes',
      icon: <Shield size={28} className="text-fg-4" />,
      color: 'text-signal-success',
      value: counts.vigentes,
    },
    {
      key: 'renovacoesPendentes',
      title: 'Renovações',
      subtitle: 'Pendentes de renovação',
      icon: <RefreshCcw size={28} className="text-fg-4" />,
      color: 'text-signal-warning',
      value: counts.renovacoesPendentes,
    },
    {
      key: 'renovacoes30d',
      title: 'Renovações',
      subtitle: 'Próximos 30 dias',
      icon: <Calendar size={28} className="text-fg-4" />,
      color: 'text-accent-primary',
      value: counts.renovacoes30d,
    },
  ]

  /* ====================================================================== */

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-fg-4 mb-1">Negócios &rsaquo; Propostas e Apólices</p>
          <h1 className="text-3xl font-bold">Propostas e Apólices</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Abrir tela de nova proposta (newProposal)')}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-fg-on-brand rounded-full text-sm font-semibold shadow-[var(--shadow-brand)]"
          >
            <Plus size={16} />
            Novo
          </button>
          <button
            onClick={() => alert('Abrir tela de importação em lote')}
            className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-1 hover:bg-bg-surface-2 text-fg-2 rounded-full text-sm font-semibold"
          >
            <Upload size={16} />
            Importar
          </button>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map(c => {
          const isActive = activeCard === c.key
          return (
            <button
              key={c.key}
              onClick={() => handleCardClick(c.key)}
              className={`text-left bg-bg-surface p-6 rounded-[10px] shadow-[var(--shadow-1)] border transition-all hover:shadow-[var(--shadow-2)] ${
                isActive
                  ? 'border-accent-primary ring-2 ring-accent-primary/20'
                  : 'border-border-1 hover:border-accent-primary/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-3">{c.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-fg-3 mt-1">{c.subtitle}</p>
                </div>
                <div>{c.icon}</div>
              </div>
              <p className="text-xs text-fg-4 mt-4">Atualizado em: {lastUpdated}</p>
            </button>
          )
        })}
      </div>

      {/* Busca + Filtro */}
      <div className="bg-bg-surface border border-border-1 rounded-[14px] shadow-[var(--shadow-1)] p-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
          <input
            value={filters.searchTerm}
            onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
            placeholder="Buscar por segurado, ramo, seguradora, produtor, apólice..."
            className="w-full pl-9 pr-4 py-2 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border-none rounded-[10px] text-sm focus:ring-2 focus:ring-accent-primary/30"
          />
        </div>
        <button
          onClick={() => setShowFilterPanel(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm font-semibold bg-bg-surface-2 text-fg-3 hover:bg-bg-surface-3"
        >
          <Filter size={16} />
          Filtros
        </button>
        {activeCard && (
          <button
            onClick={() => {
              setActiveCard(null)
              setViewMode('Lista')
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-[10px] text-xs font-semibold bg-accent-primary-soft text-accent-primary hover:bg-accent-primary-soft"
          >
            <X size={14} />
            Limpar filtro do card
          </button>
        )}
      </div>

      {/* Tabela / Kanban */}
      <div className="bg-bg-surface border border-border-1 rounded-[14px] shadow-[var(--shadow-1)]">
        <div className="flex items-center justify-between p-4 border-b border-border-1">
          <h2 className="text-lg font-bold">Acompanhamento de Propostas</h2>
          <div
            className={`flex bg-bg-surface-2 p-1 rounded-[10px] ${
              activeCard === 'emAndamento' ? '' : 'invisible'
            }`}
          >
            <button
              onClick={() => setViewMode('Kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                viewMode === 'Kanban'
                  ? 'bg-bg-surface shadow-[var(--shadow-1)] text-accent-primary font-semibold'
                  : 'text-fg-3'
              }`}
            >
              <Kanban size={14} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('Lista')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                viewMode === 'Lista'
                  ? 'bg-bg-surface shadow-[var(--shadow-1)] text-accent-primary font-semibold'
                  : 'text-fg-3'
              }`}
            >
              <List size={14} />
              Lista
            </button>
          </div>
        </div>

        {viewMode === 'Lista' ? (
          <ListView
            proposals={filtered}
            expanded={expanded}
            onToggleExpand={id => {
              setExpanded(prev => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }}
          />
        ) : (
          <KanbanView proposals={filtered} statuses={CUSTOM_STATUSES} onDrop={onCardDrop} />
        )}
      </div>

      {/* Drawer de Filtros */}
      {showFilterPanel && (
        <FilterPanel
          values={filters}
          onChange={setFilters}
          onClose={() => setShowFilterPanel(false)}
          onClear={() => setFilters(INITIAL_FILTERS)}
          options={{ branches, insurers, insureds, producers, statuses, proposalTypes }}
        />
      )}
    </div>
  )
}

/* =========================================================================
 * Lista
 * ========================================================================= */

function ListView({
  proposals,
  expanded,
  onToggleExpand,
}: {
  proposals: Proposal[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
}) {
  if (proposals.length === 0) {
    return <div className="p-12 text-center text-sm text-fg-4">Nenhuma proposta encontrada com os filtros atuais.</div>
  }

  return (
    <div className="overflow-x-auto">
      {/* Cabeçalho */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-fg-4 border-b border-border-1">
        <div className="col-span-3">Segurado</div>
        <div className="col-span-2">Ramo</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Produtor</div>
        <div className="col-span-2">Seguradora</div>
        <div className="col-span-1 text-right">Ações</div>
      </div>
      {proposals.map(p => {
        const isOpen = expanded.has(p.id)
        const effectiveStatus = p.currentStatus ?? p.status
        return (
          <div key={p.id} className="border-b border-border-1 last:border-b-0">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm hover:bg-bg-surface-2">
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleExpand(p.id)}
                    className="text-fg-4 hover:text-fg-2"
                    aria-label="Expandir"
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div>
                    <a className="font-semibold text-fg-1 hover:text-accent-primary cursor-pointer">
                      {p.insured}
                    </a>
                    <p className="text-xs text-fg-4">
                      {p.vigenciaInicial && p.vigenciaFinal
                        ? `Vigência: ${fmtDate(p.vigenciaInicial)} → ${fmtDate(p.vigenciaFinal)}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-fg-2">{p.branch}</div>
              <div className="col-span-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-fg-3">{p.proposalType}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${
                      STATUS_BADGE[effectiveStatus] ?? 'bg-bg-surface-3 text-fg-3'
                    }`}
                  >
                    {effectiveStatus}
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent-primary-soft text-accent-primary text-xs font-bold flex items-center justify-center">
                  {initials(p.producer.name)}
                </div>
                <span className="text-fg-2 text-sm truncate">{p.producer.name}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-bg-surface-2 text-fg-3 text-[10px] font-bold flex items-center justify-center">
                  {initials(p.insurer)}
                </div>
                <span className="text-fg-2 text-sm truncate">{p.insurer}</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => alert(`Abrir ProposalDetails: ${p.id}`)}
                  className="p-1.5 rounded-[10px] hover:bg-bg-surface-2 text-fg-3"
                  aria-label="Editar"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="px-12 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-fg-2">
                <Detail label="Modelo" value={p.details?.model} />
                <Detail label="Marca" value={p.details?.brand} />
                <Detail label="Ano" value={p.details?.year} />
                <Detail label="Placa" value={p.details?.plate} />
                <Detail label="Chassi" value={p.details?.chassis} />
                <Detail label="Apólice" value={p.policyNumber} />
                <Detail label="Vigência Inicial" value={p.vigenciaInicial && fmtDate(p.vigenciaInicial)} />
                <Detail label="Vigência Final" value={p.vigenciaFinal && fmtDate(p.vigenciaFinal)} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-fg-4 tracking-wider">{label}</p>
      <p>{value || '—'}</p>
    </div>
  )
}

/* =========================================================================
 * Kanban
 * ========================================================================= */

function KanbanView({
  proposals,
  statuses,
  onDrop,
}: {
  proposals: Proposal[]
  statuses: CustomProposalStatus[]
  onDrop: (proposalId: string, newStatus: ProposalStatus) => void
}) {
  // Foca pipeline pré-emissão: ignora propostas já emitidas
  const pipeline = proposals.filter(p => !p.policyNumber)
  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {statuses
          .slice()
          .sort((a, b) => a.order - b.order)
          .map(s => {
            const items = pipeline.filter(p => p.status === s.name)
            return (
              <div
                key={s.id}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) onDrop(id, s.name)
                }}
                className="w-72 shrink-0 bg-bg-surface-2 rounded-[14px] p-3 border border-border-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <h3 className="text-sm font-bold text-fg-2">{s.name}</h3>
                  </div>
                  <span className="text-xs font-semibold text-fg-3 bg-bg-surface rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map(p => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('text/plain', p.id)}
                      onClick={() => alert(`Abrir ProposalDetails: ${p.id}`)}
                      className="bg-bg-surface rounded-[10px] p-3 shadow-[var(--shadow-1)] border border-border-1 cursor-grab active:cursor-grabbing hover:shadow-[var(--shadow-2)] transition-all"
                    >
                      <p className="font-semibold text-sm text-fg-1 truncate">{p.insured}</p>
                      <p className="text-xs text-fg-3 mt-0.5">{p.branch}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-fg-4">
                          {p.proposalType}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-accent-primary-soft text-accent-primary text-[10px] font-bold flex items-center justify-center">
                          {initials(p.producer.name)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs text-fg-4 py-6">Sem propostas</div>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

/* =========================================================================
 * Drawer de filtros
 * ========================================================================= */

function FilterPanel({
  values,
  onChange,
  onClose,
  onClear,
  options,
}: {
  values: FilterValues
  onChange: (v: FilterValues) => void
  onClose: () => void
  onClear: () => void
  options: {
    branches: string[]
    insurers: string[]
    insureds: string[]
    producers: string[]
    statuses: string[]
    proposalTypes: ProposalType[]
  }
}) {
  const set = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) =>
    onChange({ ...values, [k]: v })

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg-surface h-full shadow-[var(--shadow-3)] flex flex-col">
        <div className="p-4 border-b border-border-1 flex items-center justify-between">
          <h3 className="font-bold">Filtros avançados</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-surface-2 text-fg-3">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 text-sm">
          <Section title="Dados da Proposta">
            <SelectField label="Status" value={values.status} onChange={v => set('status', v)} options={options.statuses} />
            <SelectField label="Ramo" value={values.branch} onChange={v => set('branch', v)} options={options.branches} />
            <SelectField label="Seguradora" value={values.insurer} onChange={v => set('insurer', v)} options={options.insurers} />
            <SelectField label="Tipo" value={values.proposalType} onChange={v => set('proposalType', v)} options={options.proposalTypes} />
          </Section>

          <Section title="Período de Vigência">
            <DateRow label="De" value={values.vigenciaStart} onChange={v => set('vigenciaStart', v)} />
            <DateRow label="Até" value={values.vigenciaEnd} onChange={v => set('vigenciaEnd', v)} />
          </Section>

          <Section title="Segurado / Produtor">
            <SelectField label="Segurado" value={values.insured} onChange={v => set('insured', v)} options={options.insureds} />
            <SelectField label="Produtor" value={values.producer} onChange={v => set('producer', v)} options={options.producers} />
          </Section>

          <Section title="Prêmio Líquido">
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Mínimo" value={values.netPremiumMin} onChange={v => set('netPremiumMin', v)} />
              <NumberField label="Máximo" value={values.netPremiumMax} onChange={v => set('netPremiumMax', v)} />
            </div>
          </Section>
        </div>

        <div className="p-4 border-t border-border-1 flex gap-2">
          <button
            onClick={onClear}
            className="flex-1 px-3 py-2 bg-bg-surface-2 text-fg-2 rounded-[10px] text-sm font-semibold hover:bg-bg-surface-3"
          >
            Limpar Filtros
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-accent-primary hover:bg-accent-primary-hover text-fg-on-brand rounded-full text-sm font-semibold"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-fg-4">{title}</h4>
      {children}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-fg-3">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] px-2 py-1.5 text-sm focus:ring-2 focus:ring-accent-primary/30 focus:outline-none"
      >
        <option value="">Todos</option>
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function DateRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-fg-3">{label}</label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] px-2 py-1.5 text-sm focus:ring-2 focus:ring-accent-primary/30 focus:outline-none"
      />
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-fg-3">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[10px] px-2 py-1.5 text-sm focus:ring-2 focus:ring-accent-primary/30 focus:outline-none"
      />
    </div>
  )
}

/* =========================================================================
 * Utils
 * ========================================================================= */

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('')
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}
