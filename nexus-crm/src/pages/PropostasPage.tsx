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

const CUSTOM_STATUSES: CustomProposalStatus[] = [
  { id: 's1', name: 'Em Análise', color: 'bg-amber-500', order: 1 },
  { id: 's2', name: 'Pendente', color: 'bg-orange-500', order: 2 },
  { id: 's3', name: 'Pendência Resolvida', color: 'bg-sky-500', order: 3 },
  { id: 's4', name: 'Proposta Emitida', color: 'bg-emerald-500', order: 4 },
]

const STATUS_BADGE: Record<string, string> = {
  Vigente: 'bg-emerald-100 text-emerald-700',
  Renovada: 'bg-emerald-100 text-emerald-700',
  Endossada: 'bg-emerald-100 text-emerald-700',
  Cancelada: 'bg-rose-100 text-rose-700',
  Recusada: 'bg-rose-100 text-rose-700',
  'Não renovada': 'bg-slate-200 text-slate-600',
  'Em Análise': 'bg-amber-100 text-amber-700',
  Pendente: 'bg-orange-100 text-orange-700',
  'Pendência Resolvida': 'bg-sky-100 text-sky-700',
  'Proposta Emitida': 'bg-blue-100 text-blue-700',
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
      icon: <FileText size={28} className="text-slate-400" />,
      color: 'text-emerald-500',
      value: counts.emAndamento,
    },
    {
      key: 'vigentes',
      title: 'Apólices',
      subtitle: 'Vigentes',
      icon: <Shield size={28} className="text-slate-400" />,
      color: 'text-blue-500',
      value: counts.vigentes,
    },
    {
      key: 'renovacoesPendentes',
      title: 'Renovações',
      subtitle: 'Pendentes de renovação',
      icon: <RefreshCcw size={28} className="text-slate-400" />,
      color: 'text-orange-500',
      value: counts.renovacoesPendentes,
    },
    {
      key: 'renovacoes30d',
      title: 'Renovações',
      subtitle: 'Próximos 30 dias',
      icon: <Calendar size={28} className="text-slate-400" />,
      color: 'text-violet-500',
      value: counts.renovacoes30d,
    },
  ]

  /* ====================================================================== */

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Negócios &rsaquo; Propostas e Apólices</p>
          <h1 className="text-3xl font-bold">Propostas e Apólices</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Abrir tela de nova proposta (newProposal)')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            <Plus size={16} />
            Novo
          </button>
          <button
            onClick={() => alert('Abrir tela de importação em lote')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold"
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
              className={`text-left bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border transition-all hover:shadow-md ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{c.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.subtitle}</p>
                </div>
                <div>{c.icon}</div>
              </div>
              <p className="text-xs text-slate-400 mt-4">Atualizado em: {lastUpdated}</p>
            </button>
          )
        })}
      </div>

      {/* Busca + Filtro */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.searchTerm}
            onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
            placeholder="Buscar por segurado, ramo, seguradora, produtor, apólice..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilterPanel(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
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
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <X size={14} />
            Limpar filtro do card
          </button>
        )}
      </div>

      {/* Tabela / Kanban */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold">Acompanhamento de Propostas</h2>
          <div
            className={`flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg ${
              activeCard === 'emAndamento' ? '' : 'invisible'
            }`}
          >
            <button
              onClick={() => setViewMode('Kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                viewMode === 'Kanban'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Kanban size={14} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('Lista')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                viewMode === 'Lista'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
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
    return <div className="p-12 text-center text-sm text-slate-400">Nenhuma proposta encontrada com os filtros atuais.</div>
  }

  return (
    <div className="overflow-x-auto">
      {/* Cabeçalho */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
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
          <div key={p.id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleExpand(p.id)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Expandir"
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div>
                    <a className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 cursor-pointer">
                      {p.insured}
                    </a>
                    <p className="text-xs text-slate-400">
                      {p.vigenciaInicial && p.vigenciaFinal
                        ? `Vigência: ${fmtDate(p.vigenciaInicial)} → ${fmtDate(p.vigenciaFinal)}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-slate-600 dark:text-slate-300">{p.branch}</div>
              <div className="col-span-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">{p.proposalType}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${
                      STATUS_BADGE[effectiveStatus] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {effectiveStatus}
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {initials(p.producer.name)}
                </div>
                <span className="text-slate-600 dark:text-slate-300 text-sm truncate">{p.producer.name}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                  {initials(p.insurer)}
                </div>
                <span className="text-slate-600 dark:text-slate-300 text-sm truncate">{p.insurer}</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => alert(`Abrir ProposalDetails: ${p.id}`)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  aria-label="Editar"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="px-12 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
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
      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{label}</p>
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
                className="w-72 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-900 rounded-full px-2 py-0.5">
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
                      className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                    >
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{p.insured}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.branch}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {p.proposalType}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {initials(p.producer.name)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-6">Sem propostas</div>
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold">Filtros avançados</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
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

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            onClick={onClear}
            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-200"
          >
            Limpar Filtros
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
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
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</h4>
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
      <label className="text-xs text-slate-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm"
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
      <label className="text-xs text-slate-500">{label}</label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm"
      />
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm"
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
