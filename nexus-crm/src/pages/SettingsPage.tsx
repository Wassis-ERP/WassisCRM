import { useEffect, useMemo, useState, type ComponentType } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  GitBranch,
  ShieldCheck,
  Building2,
  XCircle,
  Plus,
  ChevronRight,
  Briefcase,
  FileSignature,
  HeartHandshake,
  DollarSign,
  AlertTriangle,
  Loader2,
  Archive,
  BadgeDollarSign,
  FileCog,
  Landmark,
  Layers3,
  Percent,
  Search,
  SlidersHorizontal,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import EquipeAcessosPage from './EquipeAcessosPage'
import ProdutoresPage from './ProdutoresPage'
import StepsConfigModal from '../components/modals/StepsConfigModal'
import { PermissionsMatrix } from '../components/admin/PermissionsMatrix'
import CamposPersonalizadosTab from '../components/settings/CamposPersonalizadosTab'
import CoberturasCatalogoTab from '../components/settings/CoberturasCatalogoTab'
import CatalogoEnxutoTab from '../components/settings/CatalogoEnxutoTab'
import FiliaisTab from '../components/settings/FiliaisTab'
import {
  FinanceiroGradesRecebimentoTab,
  FinanceiroRegrasRepasseTab,
} from '../components/settings/FinanceiroConfiguravelTab'
import RamosTab from '../components/settings/RamosTab'
import SeguradorasTab from '../components/settings/SeguradorasTab'
import ContractCatalogTab from '../components/settings/ContractCatalogTab'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'

import { usePipelines } from '../hooks/usePipelines'
import { usePipelinesAdmin } from '../hooks/usePipelinesAdmin'
import { usePipelineStages } from '../hooks/usePipelineStages'
import { getPipelineScopeLabel } from '../hooks/pipelineScope'
import type { PipelineModule, PipelineRow } from '../modules/types'

// --- Aba de Funis & Etapas (Supabase) ---

const MODULE_META: Record<PipelineModule, { label: string; icon: ComponentType<{ size?: number; className?: string }>; tone: string }> = {
  comercial: { label: 'Comercial', icon: Briefcase, tone: 'text-ramo-auto bg-ramo-auto/12' },
  emissao: { label: 'Emissão', icon: FileSignature, tone: 'text-ramo-moto bg-ramo-moto/12' },
  pos_venda: { label: 'Pós-Venda', icon: HeartHandshake, tone: 'text-ramo-saude bg-ramo-saude/12' },
  financeiro: { label: 'Financeiro', icon: DollarSign, tone: 'text-ramo-previdencia bg-ramo-previdencia/12' },
  sinistro: { label: 'Sinistro', icon: AlertTriangle, tone: 'text-ramo-empresarial bg-ramo-empresarial/12' },
}

const MODULE_ORDER: PipelineModule[] = ['comercial', 'emissao', 'financeiro', 'sinistro']

type SettingsTab = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  component?: ReactNode
  meta?: string
  status?: 'available' | 'planned'
}

type SettingsGroup = {
  title: string
  description: string
  tabs: SettingsTab[]
}

const PipelineStagesPreview = ({ pipelineId }: { pipelineId: string }) => {
  const { data, isLoading } = usePipelineStages(pipelineId)
  if (isLoading) return <div className="h-1 w-full rounded-full bg-bg-surface-2 animate-pulse mt-1" />
  const stages = data ?? []
  if (stages.length === 0) {
    return <p className="text-[10px] text-fg-4 italic mt-1">Nenhuma etapa configurada — clique para adicionar</p>
  }
  return (
    <div className="flex gap-1 mt-1 opacity-60">
      {stages.map((step) => (
        <div key={step.id} className={`h-1 flex-1 rounded-full ${step.cor ?? 'bg-slate-400'}`} title={step.nome} />
      ))}
    </div>
  )
}

const FunisEtapasTab = () => {
  const { data: pipelines, isLoading, isError, error } = usePipelines()
  const { createPipeline, archivePipeline, isCreatingPipeline, isArchivingPipeline } = usePipelinesAdmin()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()

  const [newPipelineName, setNewPipelineName] = useState('')
  const [newPipelineModule, setNewPipelineModule] = useState<PipelineModule>('comercial')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineRow | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map: Record<PipelineModule, PipelineRow[]> = {
      comercial: [],
      emissao: [],
      pos_venda: [],
      financeiro: [],
      sinistro: [],
    }
    for (const p of pipelines ?? []) {
      map[p.module].push(p)
    }
    return map
  }, [pipelines])

  const handleAdd = async () => {
    if (!newPipelineName.trim() || isCreatingPipeline) return
    setCreateError(null)
    try {
      await createPipeline({ name: newPipelineName.trim(), module: newPipelineModule })
      setNewPipelineName('')
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Erro ao criar funil')
    }
  }

  const handleArchive = async (p: PipelineRow) => {
    const shouldArchive = await confirm({
      title: 'Arquivar funil',
      description: `Arquivar o funil "${p.nome}"? Cards já existentes não serão removidos, mas ele deixa de aparecer no Kanban.`,
      confirmLabel: 'Arquivar',
      tone: 'warning',
    })
    if (!shouldArchive) return
    try {
      await archivePipeline(p.id)
    } catch (e) {
      notify({
        title: 'Erro ao arquivar funil',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Criação */}
      <div className="bg-bg-surface p-6 rounded-[8px] border border-border-1 shadow-[var(--shadow-1)] transition-all">
        <h3 className="text-xs font-bold text-fg-3 uppercase tracking-wider mb-4">Novo Funil</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newPipelineName}
            onChange={(e) => setNewPipelineName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Ex: Renovação Auto..."
            disabled={isCreatingPipeline}
            className="flex-1 px-4 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 transition-all disabled:opacity-50"
          />
          <select
            value={newPipelineModule}
            onChange={(e) => setNewPipelineModule(e.target.value as PipelineModule)}
            disabled={isCreatingPipeline}
            className="px-4 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-sm font-bold focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 transition-all"
          >
            {MODULE_ORDER.map((m) => (
              <option key={m} value={m}>{MODULE_META[m].label}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={isCreatingPipeline || !newPipelineName.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-bold hover:bg-accent-primary-hover transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {isCreatingPipeline ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {isCreatingPipeline ? 'Criando...' : 'Criar Funil'}
          </button>
        </div>
        {createError && (
          <p className="mt-3 text-xs text-signal-danger font-medium">{createError}</p>
        )}
        <p className="mt-3 text-[11px] text-fg-4 italic">
          O funil é criado vazio como modelo do grupo. Clique nele depois para adicionar as etapas.
        </p>
      </div>

      {/* Listagem por módulo */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-fg-3">
          <Loader2 className="animate-spin" size={18} /> Carregando funis...
        </div>
      )}
      {isError && (
        <div className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger">
          {error instanceof Error ? error.message : 'Erro ao carregar funis'}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {MODULE_ORDER.map((mod) => {
            const meta = MODULE_META[mod]
            const Icon = meta.icon
            const list = grouped[mod]
            return (
              <div key={mod}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={16} className={meta.tone.split(' ')[0]} />
                  <h4 className="font-bold text-fg-1">{meta.label}</h4>
                  <span className="text-[10px] font-bold text-fg-4 bg-bg-surface-2 px-2 py-0.5 rounded-full">{list.length}</span>
                </div>
                <div className="space-y-3">
                  {list.length === 0 ? (
                    <p className="text-xs text-fg-4 italic px-3">Nenhum funil criado para este módulo</p>
                  ) : (
                    list.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPipeline(p)
                          setIsModalOpen(true)
                        }}
                        className="flex items-center gap-4 p-4 bg-bg-surface border border-border-1 rounded-[8px] group hover:border-accent-primary/50 cursor-pointer transition-all shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]"
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedPipeline(p)
                            setIsModalOpen(true)
                          }
                        }}
                      >
                        <div className={`p-2 rounded-lg ${meta.tone}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-fg-2 group-hover:text-accent-primary transition-colors truncate">{p.nome}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-bg-surface-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-fg-4">
                              {getPipelineScopeLabel(p)}
                            </span>
                            <PipelineStagesPreview pipelineId={p.id} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArchive(p)
                          }}
                          disabled={isArchivingPipeline}
                          title="Arquivar funil"
                          aria-label={`Arquivar funil ${p.nome}`}
                          className="p-2 text-fg-4 hover:text-signal-warning hover:bg-signal-warning/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Archive size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <StepsConfigModal
        key={`${isModalOpen}-${selectedPipeline?.id ?? 'none'}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pipeline={selectedPipeline}
      />
    </div>
  )
}

const SettingsHub = ({
  groups,
  search,
  onSearchChange,
  onOpen,
}: {
  groups: SettingsGroup[]
  search: string
  onSearchChange: (value: string) => void
  onOpen: (tab: SettingsTab) => void
}) => {
  const needle = search.trim().toLowerCase()
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => {
        if (!needle) return true
        return [group.title, group.description, tab.label, tab.description, tab.meta]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle)
      }),
    }))
    .filter((group) => group.tabs.length > 0)

  const availableCount = groups.flatMap((group) => group.tabs).filter((tab) => tab.component).length
  const totalCount = groups.flatMap((group) => group.tabs).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="block w-full max-w-xl space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-fg-4">
            Busque por uma configuração
          </span>
          <span className="relative block">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Digite parte do título, descrição ou campo..."
              className="w-full rounded-[8px] border border-border-1 bg-bg-surface py-3 pl-10 pr-4 text-sm font-semibold text-fg-1 shadow-[var(--shadow-1)] placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
          </span>
        </label>
        <div className="rounded-[8px] border border-border-1 bg-bg-surface px-4 py-3 text-right shadow-[var(--shadow-1)]">
          <p className="text-lg font-black text-fg-1">{availableCount}/{totalCount}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-fg-4">cadastros operáveis</p>
        </div>
      </div>

      {visibleGroups.map((group) => (
        <section key={group.title} className="space-y-3">
          <div>
            <h2 className="!text-[24px] !leading-tight font-black uppercase tracking-widest text-fg-4">{group.title}</h2>
            <p className="mt-1 text-sm font-semibold text-fg-3">{group.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.tabs.map((tab) => {
              const Icon = tab.icon
              const isAvailable = Boolean(tab.component)
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onOpen(tab)}
                  disabled={!isAvailable}
                  className={`group min-h-[154px] rounded-[8px] border border-border-1 bg-bg-surface p-5 text-left shadow-[var(--shadow-1)] transition-all ${
                    isAvailable
                      ? 'hover:-translate-y-0.5 hover:border-accent-primary/50 hover:shadow-[var(--shadow-2)]'
                      : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <span className="flex items-start gap-4">
                    <span className="rounded-[8px] bg-accent-primary-soft p-3 text-accent-primary">
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-base font-black text-fg-1">{tab.label}</span>
                        <ChevronRight
                          size={16}
                          className={`mt-1 shrink-0 text-fg-4 transition-colors ${
                            isAvailable ? 'group-hover:text-accent-primary' : ''
                          }`}
                        />
                      </span>
                      <span className="mt-3 block text-sm font-semibold leading-relaxed text-fg-3">
                        {tab.description}
                      </span>
                    </span>
                  </span>
                  <span className="mt-5 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                        isAvailable
                          ? 'bg-accent-primary-soft text-accent-primary'
                          : 'border border-border-1 bg-bg-surface-2 text-fg-4'
                      }`}
                    >
                      {isAvailable ? 'Disponível' : 'Planejado V2'}
                    </span>
                    {tab.meta && (
                      <span className="rounded-full border border-border-1 bg-bg-surface-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-fg-4">
                        {tab.meta}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {visibleGroups.length === 0 && (
        <div className="rounded-[8px] border border-border-1 bg-bg-surface p-10 text-center text-sm font-semibold text-fg-4 shadow-[var(--shadow-1)]">
          Nenhuma configuração encontrada.
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [hubSearch, setHubSearch] = useState('')
  const activeTabId = searchParams.get('tab')
  const canonicalActiveTabId = activeTabId === 'financeiro_configuravel' ? 'financeiro_grades_recebimento' : activeTabId

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [canonicalActiveTabId])

  const settingsGroups: SettingsGroup[] = [
    {
      title: 'Organização',
      description: 'Estrutura jurídica, unidades e força comercial do grupo.',
      tabs: [
        {
          id: 'corretoras',
          label: 'Corretoras/Filiais',
          description: 'Cadastre unidades, matriz, contatos e dados fiscais.',
          icon: Building2,
          component: <FiliaisTab />,
          meta: 'grupo e filiais',
        },
        {
          id: 'produtores',
          label: 'Produtores',
          description: 'Gerencie produtores internos e parceiros externos.',
          icon: BadgeDollarSign,
          component: <ProdutoresPage />,
          meta: 'cadastro comercial',
        },
      ],
    },
    {
      title: 'Acessos',
      description: 'Controle de usuários, perfis, filiais e permissões operacionais.',
      tabs: [
        {
          id: 'equipe',
          label: 'Usuários e Perfis',
          description: 'Vincule usuários às corretoras e aos perfis por unidade.',
          icon: Users,
          component: <EquipeAcessosPage />,
          meta: 'multiunidade',
        },
        {
          id: 'permissoes',
          label: 'Matriz de Permissões',
          description: 'Autorize leitura, criação, edição e exclusão por perfil.',
          icon: ShieldCheck,
          component: <PermissionsMatrix />,
          meta: 'RBAC front',
        },
      ],
    },
    {
      title: 'Operação',
      description: 'Funis, etapas, ramos e coberturas usados nos fluxos de seguros.',
      tabs: [
        {
          id: 'funis',
          label: 'Funis & Etapas',
          description: 'Configure pipelines, etapas e regras de conclusão.',
          icon: GitBranch,
          component: <FunisEtapasTab />,
          meta: 'pipelines',
        },
        {
          id: 'ramos',
          label: 'Ramos de Seguros',
          description: 'Cadastre ramos comerciais e classificação do risco.',
          icon: ShieldCheck,
          component: <RamosTab />,
          meta: '17 campos V2',
        },
        {
          id: 'coberturas',
          label: 'Coberturas',
          description: 'Estruture garantias, capitais, franquias e regras por ramo.',
          icon: Layers3,
          component: <CoberturasCatalogoTab />,
          meta: '16 campos V2',
        },
      ],
    },
    {
      title: 'Catálogos',
      description: 'Tabelas auxiliares compartilhadas entre corretoras do grupo.',
      tabs: [
        {
          id: 'seguradoras',
          label: 'Seguradoras',
          description: 'Mantenha dados cadastrais, canais e flags de automação.',
          icon: Building2,
          component: <SeguradorasTab />,
          meta: '16 campos V2',
        },
        {
          id: 'origens',
          label: 'Origem de Lead',
          description: 'Padronize origens usadas nos funis comerciais.',
          icon: SlidersHorizontal,
          component: (
            <CatalogoEnxutoTab
              title="Origens de Lead"
              singular="Origem"
              description="Classifique as entradas comerciais por tipo."
              table="origens"
              field="tipo"
              fieldLabel="Tipo"
              fieldPlaceholder="Ex: indicação, campanha, site..."
              newLabel="Nova Origem"
              icon={SlidersHorizontal}
            />
          ),
          meta: 'tipo',
        },
        {
          id: 'perda',
          label: 'Motivos de Perda',
          description: 'Defina motivos usados ao encerrar oportunidades.',
          icon: XCircle,
          component: (
            <CatalogoEnxutoTab
              title="Motivos de Perda"
              singular="Motivo"
              description="Agrupe motivos de perda por categoria para apoiar leitura comercial."
              table="motivos_perda"
              field="categoria"
              fieldLabel="Categoria"
              fieldPlaceholder="Ex: preço, cobertura..."
              icon={XCircle}
            />
          ),
          meta: 'categoria',
        },
        {
          id: 'endosso_subtipos',
          label: 'Subtipos de Endosso',
          description: 'Defina rótulos operacionais e sua natureza contratual canônica.',
          icon: ListChecks,
          component: <ContractCatalogTab kind="endorsement" />,
          meta: 'escopo e natureza',
        },
        {
          id: 'cancelamento_motivos',
          label: 'Motivos de Cancelamento',
          description: 'Padronize motivos usados nos documentos de cancelamento.',
          icon: XCircle,
          component: <ContractCatalogTab kind="cancellation" />,
          meta: 'escopo contratual',
        },
      ],
    },
    {
      title: 'Financeiro',
      description: 'Moldes separados para comissão recebida e pagamentos de repasse.',
      tabs: [
        {
          id: 'financeiro_grades_recebimento',
          label: 'Grades de Recebimento',
          description: 'Configure a comissão que a corretora recebe das seguradoras.',
          icon: Landmark,
          component: <FinanceiroGradesRecebimentoTab />,
          meta: 'recebimento',
        },
        {
          id: 'financeiro_regras_repasse',
          label: 'Regras de Repasse',
          description: 'Configure pagamentos para produtores, vendedores e gerentes.',
          icon: Percent,
          component: <FinanceiroRegrasRepasseTab />,
          meta: 'repasse',
        },
      ],
    },
    {
      title: 'Campos',
      description: 'Campos personalizados tipados por módulo.',
      tabs: [
        {
          id: 'campos_personalizados',
          label: 'Campos Personalizados',
          description: 'Crie campos por módulo, tipo de dado, validações e valores de lista.',
          icon: FileCog,
          component: <CamposPersonalizadosTab />,
          meta: '20 campos V2',
        },
      ],
    },
  ]

  const tabs = settingsGroups.flatMap((group) => group.tabs)
  const activeTabDetails = canonicalActiveTabId ? tabs.find((tab) => tab.id === canonicalActiveTabId) ?? null : null
  const activeGroup = activeTabDetails
    ? settingsGroups.find((group) => group.tabs.some((tab) => tab.id === activeTabDetails.id))
    : null
  const ActiveIcon = activeTabDetails?.icon

  const openTab = (tab: SettingsTab) => {
    if (!tab.component) return
    setSearchParams({ tab: tab.id })
  }

  return (
    <div className="animate-fade-in min-h-full space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {activeTabDetails && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="mb-3 inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-black text-fg-3 transition-colors hover:text-accent-primary"
            >
              <ArrowLeft size={17} /> Configurações
            </button>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {ActiveIcon && (
              <span className="rounded-[8px] bg-accent-primary-soft p-2 text-accent-primary">
                <ActiveIcon size={20} />
              </span>
            )}
            <h1 className="!text-[32px] !leading-tight font-black tracking-tight text-fg-1">
              {activeTabDetails?.label ?? 'Configurações'}
            </h1>
            {activeGroup && (
              <span className="rounded-full bg-bg-surface-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-fg-4">
                {activeGroup.title}
              </span>
            )}
          </div>
          <p className="mt-2 text-fg-3 font-medium tracking-tight">
            {activeTabDetails?.description ?? 'Administre cadastros, acessos, catálogos e fluxos operacionais do CRM.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl">
        {activeTabDetails ? (
          activeTabDetails.component ?? (
            <div className="rounded-[8px] border border-border-1 bg-bg-surface p-8 shadow-[var(--shadow-1)]">
              <p className="text-sm font-black uppercase tracking-widest text-fg-4">Planejado V2</p>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-fg-3">
                Este cadastro já está mapeado no esqueleto, mas será implementado em um recorte próprio para preservar as regras de negócio e a validação visual.
              </p>
            </div>
          )
        ) : (
          <SettingsHub
            groups={settingsGroups}
            search={hubSearch}
            onSearchChange={setHubSearch}
            onOpen={openTab}
          />
        )}
      </div>
    </div>
  )
}

