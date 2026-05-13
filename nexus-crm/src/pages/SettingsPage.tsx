import { useMemo, useState, type ComponentType } from 'react'
import {
  Users,
  GitBranch,
  ShieldCheck,
  Building2,
  Target,
  XCircle,
  Plus,
  Trash2,
  ChevronRight,
  Briefcase,
  FileSignature,
  HeartHandshake,
  DollarSign,
  AlertTriangle,
  Loader2,
  Archive,
} from 'lucide-react'
import ProdutoresPage from './ProdutoresPage'
import StepsConfigModal from '../components/modals/StepsConfigModal'
import { PermissionsMatrix } from '../components/admin/PermissionsMatrix'

import { useRamos, useOrigens, useSeguradoras, useMotivosPerda } from '../hooks/useLookups'
import { useLookupsAdmin } from '../hooks/useLookupsAdmin'
import { usePipelines } from '../hooks/usePipelines'
import { usePipelinesAdmin } from '../hooks/usePipelinesAdmin'
import { usePipelineStages } from '../hooks/usePipelineStages'
import type { PipelineModule, PipelineRow } from '../modules/types'

// --- Aba de Funis & Etapas (Supabase) ---

const MODULE_META: Record<PipelineModule, { label: string; icon: ComponentType<{ size?: number; className?: string }>; tone: string }> = {
  comercial: { label: 'Comercial', icon: Briefcase, tone: 'text-primary bg-primary/10' },
  emissao: { label: 'Emissão', icon: FileSignature, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  pos_venda: { label: 'Pós-Venda', icon: HeartHandshake, tone: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  financeiro: { label: 'Financeiro', icon: DollarSign, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  sinistro: { label: 'Sinistro', icon: AlertTriangle, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
}

const MODULE_ORDER: PipelineModule[] = ['comercial', 'emissao', 'pos_venda', 'financeiro', 'sinistro']

const PipelineStagesPreview = ({ pipelineId }: { pipelineId: string }) => {
  const { data, isLoading } = usePipelineStages(pipelineId)
  if (isLoading) return <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse mt-1" />
  const stages = data ?? []
  if (stages.length === 0) {
    return <p className="text-[10px] text-slate-400 italic mt-1">Nenhuma etapa configurada — clique para adicionar</p>
  }
  return (
    <div className="flex gap-1 mt-1 opacity-60">
      {stages.map((step) => (
        <div key={step.id} className={`h-1 flex-1 rounded-full ${step.color}`} title={step.name} />
      ))}
    </div>
  )
}

const FunisEtapasTab = () => {
  const { data: pipelines, isLoading, isError, error } = usePipelines()
  const { createPipeline, archivePipeline, isCreatingPipeline, isArchivingPipeline } = usePipelinesAdmin()

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
    if (!window.confirm(`Arquivar o funil "${p.name}"? Cards já existentes não serão removidos, mas ele deixa de aparecer no Kanban.`)) return
    try {
      await archivePipeline(p.id)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao arquivar funil')
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Criação */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Novo Funil</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newPipelineName}
            onChange={(e) => setNewPipelineName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Ex: Renovação Auto..."
            disabled={isCreatingPipeline}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:outline-none transition-all disabled:opacity-50"
          />
          <select
            value={newPipelineModule}
            onChange={(e) => setNewPipelineModule(e.target.value as PipelineModule)}
            disabled={isCreatingPipeline}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm font-bold focus:border-primary focus:outline-none transition-all"
          >
            {MODULE_ORDER.map((m) => (
              <option key={m} value={m}>{MODULE_META[m].label}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={isCreatingPipeline || !newPipelineName.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
          >
            {isCreatingPipeline ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {isCreatingPipeline ? 'Criando...' : 'Criar Funil'}
          </button>
        </div>
        {createError && (
          <p className="mt-3 text-xs text-red-600 font-medium">{createError}</p>
        )}
        <p className="mt-3 text-[11px] text-slate-400 italic">
          O funil é criado vazio. Clique nele depois para adicionar as etapas.
        </p>
      </div>

      {/* Listagem por módulo */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
          <Loader2 className="animate-spin" size={18} /> Carregando funis...
        </div>
      )}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
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
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{meta.label}</h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{list.length}</span>
                </div>
                <div className="space-y-3">
                  {list.length === 0 ? (
                    <p className="text-xs text-slate-400 italic px-3">Nenhum funil criado para este módulo</p>
                  ) : (
                    list.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPipeline(p)
                          setIsModalOpen(true)
                        }}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-primary/50 cursor-pointer transition-all shadow-sm hover:shadow-md hover:translate-x-1"
                      >
                        <div className={`p-2 rounded-lg ${meta.tone}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors truncate">{p.name}</p>
                          <PipelineStagesPreview pipelineId={p.id} />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArchive(p)
                          }}
                          disabled={isArchivingPipeline}
                          title="Arquivar funil"
                          className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
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

// --- Componente DB Lookup ---
const DBLookupListTab = ({ 
  title, 
  table,
  useDataHook,
  icon: Icon
}: { 
  title: string,
  table: 'ramos' | 'origens' | 'seguradoras' | 'motivos_perda',
  useDataHook: () => { data: {id: string, nome: string}[] | undefined, isLoading: boolean },
  icon: ComponentType<{ size?: number; className?: string }>
}) => {
  const [newValue, setNewValue] = useState('')
  const { data, isLoading } = useDataHook()
  const { add, remove, isAdding, isRemoving } = useLookupsAdmin(table)

  const handleAdd = async () => {
    if (newValue.trim() && !isAdding) { 
      try {
        await add(newValue.trim())
        setNewValue('')
      } catch (err) {
        console.error("Erro ao adicionar:", err)
      }
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Adicionar {title}</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            disabled={isAdding}
            placeholder={`Novo(a) ${title.toLowerCase()}...`} 
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:outline-none transition-all disabled:opacity-50"
          />
          <button 
            onClick={handleAdd}
            disabled={isAdding || !newValue.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus size={18} /> {isAdding ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 font-medium">Carregando {title.toLowerCase()}...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                  <Icon size={16} />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.nome}</span>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja inativar "${item.nome}"?`)) {
                    remove(item.id)
                  }
                }}
                disabled={isRemoving}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {data?.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-400 font-medium text-sm">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('produtores')

  const tabs = [
    { id: 'produtores', label: 'Equipe e Perfis', icon: Users, component: <ProdutoresPage /> },
    { id: 'permissoes', label: 'Matriz de Permissões', icon: ShieldCheck, component: <PermissionsMatrix /> },
    { id: 'funis', label: 'Funis & Etapas', icon: GitBranch, component: <FunisEtapasTab /> },
    { id: 'ramos', label: 'Ramos de Seguros', icon: ShieldCheck, component: <DBLookupListTab title="Ramo" table="ramos" useDataHook={useRamos} icon={ShieldCheck} /> },
    { id: 'seguradoras', label: 'Seguradoras', icon: Building2, component: <DBLookupListTab title="Seguradora" table="seguradoras" useDataHook={useSeguradoras} icon={Building2} /> },
    { id: 'origens', label: 'Origem de Lead', icon: Target, component: <DBLookupListTab title="Origem" table="origens" useDataHook={useOrigens} icon={Target} /> },
    { id: 'perda', label: 'Motivos de Perda', icon: XCircle, component: <DBLookupListTab title="Motivo de Perda" table="motivos_perda" useDataHook={useMotivosPerda} icon={XCircle} /> },
  ]

  const activeTabDetails = tabs.find(t => t.id === activeTab)

  return (
    <div className="animate-fade-in flex flex-col min-h-full">
      {/* Cabeçalho Padronizado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Gerencie os parâmetros, regras e automações do seu CRM.
          </p>
        </div>
      </div>

      <div className="flex bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[600px]">
        {/* Sidebar Interna */}
        <div className="w-72 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-4 gap-1.5 overflow-y-auto custom-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-between group px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={18} className={`${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'} transition-colors`} />
                <span>{tab.label}</span>
              </div>
              <ChevronRight size={14} className={`${activeTab === tab.id ? 'text-white/70' : 'text-slate-200 dark:text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'} transition-all`} />
            </button>
          ))}
          

        </div>

        {/* Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/30 dark:bg-slate-900/10">
          <div className="max-w-6xl">
             {activeTabDetails?.component}
          </div>
        </div>
      </div>
    </div>
  )
}

