import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Edit3,
  FileCog,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useFiliais } from '../../hooks/useFiliais'
import {
  useCampoDefinicoesAdmin,
  useCampoOpcoesAdmin,
  slugifyCampoChave,
  type CampoDefinicaoInput,
  type CampoDefinicaoRow,
  type CampoEntidadeTipo,
  type CampoFormato,
  type CampoOpcaoInput,
  type CampoOpcaoRow,
  type CampoTipoDado,
} from '../../hooks/useLookupsAdmin'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'

type ViewMode = 'definicoes' | 'opcoes'
type DetailView = 'list' | 'detail'

const ENTIDADES: Array<{ value: CampoEntidadeTipo; label: string }> = [
  { value: 'segurado', label: 'Segurado' },
  { value: 'oportunidade', label: 'Oportunidade' },
  { value: 'cotacao', label: 'Cotação' },
  { value: 'apolice', label: 'Apólice' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'apolice_item', label: 'Item da apólice' },
  { value: 'sinistro', label: 'Sinistro' },
  { value: 'cobranca', label: 'Cobrança' },
  { value: 'pos_venda', label: 'Pós-venda' },
]

const TIPOS_DADO: Array<{ value: CampoTipoDado; label: string }> = [
  { value: 'TEXTO_CURTO', label: 'Texto curto' },
  { value: 'TEXTO_LONGO', label: 'Texto longo' },
  { value: 'INTEIRO', label: 'Inteiro' },
  { value: 'DECIMAL', label: 'Decimal' },
  { value: 'BOOLEANO', label: 'Booleano' },
  { value: 'DATA', label: 'Data' },
  { value: 'DATA_HORA', label: 'Data e hora' },
  { value: 'LISTA_UNICA', label: 'Lista única' },
  { value: 'LISTA_MULTIPLA', label: 'Lista múltipla' },
]

const FORMATOS: Array<{ value: CampoFormato; label: string }> = [
  { value: 'NUMERO', label: 'Número' },
  { value: 'PERCENTUAL', label: 'Percentual' },
  { value: 'MOEDA', label: 'Moeda' },
]

const labelFrom = <T extends string>(items: Array<{ value: T; label: string }>, value: T | null | undefined) =>
  items.find((item) => item.value === value)?.label ?? value ?? '-'

const isNumericType = (tipo: CampoTipoDado) => tipo === 'INTEIRO' || tipo === 'DECIMAL'
const isListType = (tipo: CampoTipoDado) => tipo === 'LISTA_UNICA' || tipo === 'LISTA_MULTIPLA'
const numberOrNull = (value: string) => (value === '' ? null : Number(value))
const chipClass = 'inline-flex h-6 items-center justify-center rounded-full px-2.5 text-[10px] font-black uppercase leading-none tracking-widest'

const emptyDefinicaoForm = (): CampoDefinicaoInput => ({
  filial_id: null,
  entidade_tipo: 'segurado',
  chave: '',
  nome: '',
  tipo_dado: 'TEXTO_CURTO',
  formato: null,
  obrigatorio: false,
  ativo: true,
  ordem: null,
  ajuda: '',
  min_valor: null,
  max_valor: null,
  tamanho_max: null,
  mascara: '',
  placeholder: '',
  agrupamento: '',
  visivel_em_listagem: false,
})

const definicaoFormFromRow = (row: CampoDefinicaoRow): CampoDefinicaoInput => ({
  filial_id: row.filial_id,
  entidade_tipo: row.entidade_tipo,
  chave: row.chave,
  nome: row.nome,
  tipo_dado: row.tipo_dado,
  formato: row.formato,
  obrigatorio: row.obrigatorio,
  ativo: row.ativo,
  ordem: row.ordem,
  ajuda: row.ajuda ?? '',
  min_valor: row.min_valor,
  max_valor: row.max_valor,
  tamanho_max: row.tamanho_max,
  mascara: row.mascara ?? '',
  placeholder: row.placeholder ?? '',
  agrupamento: row.agrupamento ?? '',
  visivel_em_listagem: row.visivel_em_listagem,
})

const emptyOpcaoForm = (campoDefinicaoId = ''): CampoOpcaoInput => ({
  campo_definicao_id: campoDefinicaoId,
  rotulo: '',
  valor: '',
  ordem: null,
  ativo: true,
})

const opcaoFormFromRow = (row: CampoOpcaoRow): CampoOpcaoInput => ({
  campo_definicao_id: row.campo_definicao_id,
  rotulo: row.rotulo,
  valor: row.valor,
  ordem: row.ordem,
  ativo: row.ativo,
})

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`${chipClass} w-fit self-center justify-self-start ${
        active
          ? 'bg-signal-success/15 text-signal-success'
          : 'border border-border-1 bg-bg-surface-2 text-fg-4'
      }`}
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex h-[42px] items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 text-sm font-black text-fg-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-accent-primary"
      />
      {label}
    </label>
  )
}

export default function CamposPersonalizadosTab() {
  const [mode, setMode] = useState<ViewMode>('definicoes')
  const [defView, setDefView] = useState<DetailView>('list')
  const [opcaoView, setOpcaoView] = useState<DetailView>('list')
  const filiaisQuery = useFiliais()
  const filiais = useMemo(() => filiaisQuery.data ?? [], [filiaisQuery.data])
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()

  const {
    definicoes,
    isLoading: isLoadingDefinicoes,
    create: createDefinicao,
    update: updateDefinicao,
    remove: removeDefinicao,
    isCreating: isCreatingDefinicao,
    isUpdating: isUpdatingDefinicao,
    isRemoving: isRemovingDefinicao,
  } = useCampoDefinicoesAdmin()

  const listDefinicoes = useMemo(() => definicoes.filter((def) => isListType(def.tipo_dado)), [definicoes])
  const [selectedDefinicaoId, setSelectedDefinicaoId] = useState<string | null>(null)
  const activeListaDefinicaoId = selectedDefinicaoId ?? listDefinicoes[0]?.id ?? null
  const activeListaDefinicao = listDefinicoes.find((def) => def.id === activeListaDefinicaoId) ?? null
  const {
    opcoes,
    isLoading: isLoadingOpcoes,
    create: createOpcao,
    update: updateOpcao,
    remove: removeOpcao,
    isCreating: isCreatingOpcao,
    isUpdating: isUpdatingOpcao,
    isRemoving: isRemovingOpcao,
  } = useCampoOpcoesAdmin(activeListaDefinicaoId)

  const filialMap = useMemo(() => new Map(filiais.map((filial) => [filial.id, filial.label])), [filiais])

  const [defSearch, setDefSearch] = useState('')
  const [editingDefId, setEditingDefId] = useState<string | null>(null)
  const [defForm, setDefForm] = useState<CampoDefinicaoInput>(() => emptyDefinicaoForm())
  const [defError, setDefError] = useState<string | null>(null)

  const [opcaoSearch, setOpcaoSearch] = useState('')
  const [editingOpcaoId, setEditingOpcaoId] = useState<string | null>(null)
  const [opcaoForm, setOpcaoForm] = useState<CampoOpcaoInput>(() => emptyOpcaoForm())
  const [opcaoError, setOpcaoError] = useState<string | null>(null)

  const isSavingDef = isCreatingDefinicao || isUpdatingDefinicao
  const isSavingOpcao = isCreatingOpcao || isUpdatingOpcao

  const filteredDefinicoes = useMemo(() => {
    const needle = defSearch.trim().toLowerCase()
    if (!needle) return definicoes
    return definicoes.filter((def) =>
      [
        def.nome,
        def.chave,
        def.entidade_tipo,
        def.tipo_dado,
        def.formato,
        def.agrupamento,
        filialMap.get(def.filial_id ?? ''),
        def.ajuda,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [defSearch, definicoes, filialMap])

  const filteredOpcoes = useMemo(() => {
    const needle = opcaoSearch.trim().toLowerCase()
    if (!needle) return opcoes
    return opcoes.filter((opcao) =>
      [opcao.rotulo, opcao.valor]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [opcaoSearch, opcoes])

  const resetDefForm = () => {
    setEditingDefId(null)
    setDefForm(emptyDefinicaoForm())
    setDefError(null)
  }

  const resetOpcaoForm = (campoDefinicaoId = activeListaDefinicaoId ?? '') => {
    setEditingOpcaoId(null)
    setOpcaoForm(emptyOpcaoForm(campoDefinicaoId))
    setOpcaoError(null)
  }

  const setDefField = <Key extends keyof CampoDefinicaoInput>(key: Key, value: CampoDefinicaoInput[Key]) => {
    setDefForm((prev) => ({ ...prev, [key]: value }))
  }

  const setOpcaoField = <Key extends keyof CampoOpcaoInput>(key: Key, value: CampoOpcaoInput[Key]) => {
    setOpcaoForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveDef = async () => {
    if (isSavingDef) return
    const normalizedChave = slugifyCampoChave(defForm.chave)
    if (!defForm.nome.trim()) {
      setDefError('Nome do campo é obrigatório.')
      return
    }
    if (!normalizedChave) {
      setDefError('Chave estável é obrigatória.')
      return
    }
    const duplicatedChave = definicoes.some((def) =>
      def.id !== editingDefId &&
      def.entidade_tipo === defForm.entidade_tipo &&
      slugifyCampoChave(def.chave) === normalizedChave,
    )
    if (duplicatedChave) {
      setDefError('Já existe um campo com esta chave para a entidade selecionada.')
      return
    }
    setDefError(null)
    try {
      const saved = editingDefId
        ? await updateDefinicao({ id: editingDefId, input: defForm })
        : await createDefinicao(defForm)
      if (isListType(saved.tipo_dado)) {
        setSelectedDefinicaoId(saved.id)
      }
      resetDefForm()
      setDefView('list')
    } catch (err) {
      setDefError(err instanceof Error ? err.message : 'Erro ao salvar definição')
    }
  }

  const handleEditDef = (row: CampoDefinicaoRow) => {
    setEditingDefId(row.id)
    setDefView('detail')
    setDefForm(definicaoFormFromRow(row))
    setDefError(null)
    if (isListType(row.tipo_dado)) {
      setSelectedDefinicaoId(row.id)
      resetOpcaoForm(row.id)
    }
  }

  const handleCreateDef = () => {
    resetDefForm()
    setDefView('detail')
  }

  const handleBackToDefList = () => {
    resetDefForm()
    setDefView('list')
  }

  const handleRemoveDef = async (row: CampoDefinicaoRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar definição',
      description: `Inativar "${row.nome}"? Ela deixa de aparecer em novos preenchimentos, mas valores antigos permanecem preservados.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return
    try {
      await removeDefinicao(row.id)
      if (editingDefId === row.id) resetDefForm()
    } catch (err) {
      notify({
        title: 'Erro ao inativar definição',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const handleSaveOpcao = async () => {
    if (isSavingOpcao || !activeListaDefinicaoId) return
    const payload = { ...opcaoForm, campo_definicao_id: activeListaDefinicaoId }
    setOpcaoError(null)
    try {
      if (editingOpcaoId) {
        await updateOpcao({ id: editingOpcaoId, input: payload })
      } else {
        await createOpcao(payload)
      }
      resetOpcaoForm(activeListaDefinicaoId)
      setOpcaoView('list')
    } catch (err) {
      setOpcaoError(err instanceof Error ? err.message : 'Erro ao salvar opção')
    }
  }

  const handleEditOpcao = (row: CampoOpcaoRow) => {
    setEditingOpcaoId(row.id)
    setOpcaoView('detail')
    setOpcaoForm(opcaoFormFromRow(row))
    setOpcaoError(null)
  }

  const handleCreateOpcao = () => {
    resetOpcaoForm(activeListaDefinicaoId ?? '')
    setOpcaoView('detail')
  }

  const handleBackToOpcaoList = () => {
    resetOpcaoForm(activeListaDefinicaoId ?? '')
    setOpcaoView('list')
  }

  const handleRemoveOpcao = async (row: CampoOpcaoRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar opção',
      description: `Inativar "${row.rotulo}"? Ela não aparecerá em novas escolhas, mas referências antigas continuam válidas.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return
    try {
      await removeOpcao(row.id)
      if (editingOpcaoId === row.id) resetOpcaoForm(activeListaDefinicaoId ?? '')
    } catch (err) {
      notify({
        title: 'Erro ao inativar opção',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const numericType = isNumericType(defForm.tipo_dado)

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="rounded-[8px] bg-accent-primary-soft p-2 text-accent-primary">
              <FileCog size={18} />
            </span>
            <div>
              <h3 className="text-sm font-black text-fg-1">Definição dos campos</h3>
              <p className="mt-1 max-w-4xl text-xs font-semibold leading-relaxed text-fg-3">
                Esta tela autora o catálogo de campos. O preenchimento em segurados, apólices e demais registros fica nas guias operacionais.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="inline-flex rounded-[8px] border border-border-1 bg-bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setMode('definicoes')}
                className={`inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black transition-colors ${
                  mode === 'definicoes' ? 'bg-accent-primary text-fg-on-brand' : 'text-fg-3 hover:text-fg-1'
                }`}
              >
                <FileCog size={15} /> Definições
              </button>
              <button
                type="button"
                onClick={() => setMode('opcoes')}
                className={`inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black transition-colors ${
                  mode === 'opcoes' ? 'bg-accent-primary text-fg-on-brand' : 'text-fg-3 hover:text-fg-1'
                }`}
              >
                <ListChecks size={15} /> Opções
              </button>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-fg-4">
              {definicoes.length} definições · {listDefinicoes.length} listas
            </p>
          </div>
        </div>
      </div>

      {mode === 'definicoes' ? (
        <>
          {defView === 'detail' ? (
          <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
            <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div>
                <button
                  type="button"
                  onClick={handleBackToDefList}
                  className="mb-4 inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                >
                  <ArrowLeft size={14} /> Voltar para lista
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                  {editingDefId ? 'Editar Definição' : 'Nova Definição'}
                </h3>
                <p className="mt-1 text-xs font-semibold text-fg-3">
                  Campos personalizados são EAV tipado: use apenas para dados que a corretora define.
                </p>
              </div>
              {editingDefId && (
                <button
                  type="button"
                  onClick={resetDefForm}
                  className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                >
                  <X size={15} /> Cancelar edição
                </button>
              )}
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-4">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Escopo</span>
                  <select
                    value={defForm.filial_id ?? ''}
                    onChange={(event) => setDefField('filial_id', event.target.value || null)}
                    disabled={filiaisQuery.isLoading}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  >
                    <option value="">Grupo inteiro</option>
                    {filiais.map((filial) => (
                      <option key={filial.id} value={filial.id}>{filial.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Entidade *</span>
                  <select
                    value={defForm.entidade_tipo}
                    onChange={(event) => setDefField('entidade_tipo', event.target.value as CampoEntidadeTipo)}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {ENTIDADES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Nome *</span>
                  <input
                    value={defForm.nome}
                    onChange={(event) => setDefField('nome', event.target.value)}
                    placeholder="Ex: Nº da carteirinha"
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Chave estável *</span>
                  <input
                    value={defForm.chave}
                    onChange={(event) => setDefField('chave', event.target.value)}
                    placeholder="numero_carteirinha"
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 font-mono text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tipo de dado</span>
                  <select
                    value={defForm.tipo_dado}
                    onChange={(event) => {
                      const tipo = event.target.value as CampoTipoDado
                      setDefForm((prev) => ({
                        ...prev,
                        tipo_dado: tipo,
                        formato: isNumericType(tipo) ? prev.formato ?? 'NUMERO' : null,
                      }))
                    }}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {TIPOS_DADO.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <details
                open={Boolean(editingDefId)}
                className="rounded-[8px] border border-border-1 bg-bg-surface-2"
              >
                <summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-widest text-fg-3 marker:text-accent-primary">
                  Validação, exibição e ajuda contextual
                </summary>
                <div className="space-y-4 border-t border-border-1 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Formato</span>
                      <select
                        value={defForm.formato ?? ''}
                        onChange={(event) => setDefField('formato', event.target.value as CampoFormato)}
                        disabled={!numericType}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                      >
                        <option value="">Não se aplica</option>
                        {FORMATOS.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Mínimo</span>
                      <input
                        type="number"
                        value={defForm.min_valor ?? ''}
                        onChange={(event) => setDefField('min_valor', numberOrNull(event.target.value))}
                        placeholder="Opcional"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Máximo</span>
                      <input
                        type="number"
                        value={defForm.max_valor ?? ''}
                        onChange={(event) => setDefField('max_valor', numberOrNull(event.target.value))}
                        placeholder="Opcional"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tamanho máximo</span>
                      <input
                        type="number"
                        min={0}
                        value={defForm.tamanho_max ?? ''}
                        onChange={(event) => setDefField('tamanho_max', numberOrNull(event.target.value))}
                        placeholder="Texto"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <ToggleField label="Obrigatório" checked={defForm.obrigatorio} onChange={(checked) => setDefField('obrigatorio', checked)} />
                    <ToggleField label="Visível em lista" checked={defForm.visivel_em_listagem} onChange={(checked) => setDefField('visivel_em_listagem', checked)} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Agrupamento</span>
                      <input
                        value={defForm.agrupamento}
                        onChange={(event) => setDefField('agrupamento', event.target.value)}
                        placeholder="Ex: Saúde"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Placeholder</span>
                      <input
                        value={defForm.placeholder}
                        onChange={(event) => setDefField('placeholder', event.target.value)}
                        placeholder="Ex: ABC123456"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Máscara</span>
                      <input
                        value={defForm.mascara}
                        onChange={(event) => setDefField('mascara', event.target.value)}
                        placeholder="Opcional"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <ToggleField label="Ativo" checked={defForm.ativo} onChange={(checked) => setDefField('ativo', checked)} />
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Ajuda contextual</span>
                    <textarea
                      value={defForm.ajuda}
                      onChange={(event) => setDefField('ajuda', event.target.value)}
                      rows={3}
                      placeholder="Texto curto de apoio para quem preenche o campo."
                      className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                    />
                  </label>
                </div>
              </details>
            </div>

            {defError && (
              <div className="mx-5 mb-4 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
                {defError}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-border-1 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleBackToDefList}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                type="button"
                onClick={resetDefForm}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
              >
                <X size={16} /> Limpar
              </button>
              <button
                type="button"
                onClick={handleSaveDef}
                disabled={isSavingDef || !defForm.nome.trim() || !defForm.chave.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
              >
                {isSavingDef ? <Loader2 size={17} className="animate-spin" /> : editingDefId ? <Save size={17} /> : <Plus size={17} />}
                {isSavingDef ? 'Salvando...' : editingDefId ? 'Salvar definição' : 'Criar definição'}
              </button>
            </div>
          </section>
          ) : (

          <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
            <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-black text-fg-1">Definições cadastradas</h3>
                <p className="mt-1 text-xs font-semibold text-fg-3">Chave é estável; nome e ajuda podem evoluir sem quebrar integração.</p>
              </div>
              <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row md:items-center">
                <label className="relative block min-w-0 flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    value={defSearch}
                    onChange={(event) => setDefSearch(event.target.value)}
                    placeholder="Buscar campo, chave, módulo..."
                    className="w-full rounded-full border border-border-1 bg-bg-surface py-2.5 pl-9 pr-4 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCreateDef}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover"
                >
                  <Plus size={17} /> Nova definição
                </button>
              </div>
            </div>

            {isLoadingDefinicoes ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
                <Loader2 className="animate-spin" size={18} /> Carregando definições...
              </div>
            ) : (
              <div className="divide-y divide-border-1">
                {filteredDefinicoes.map((def) => (
                  <div
                    key={def.id}
                    className={`grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-bg-surface-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_100px_auto] ${
                      editingDefId === def.id ? 'bg-accent-primary-soft/40' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isListType(def.tipo_dado)) {
                          setSelectedDefinicaoId(def.id)
                          resetOpcaoForm(def.id)
                        }
                      }}
                      className="min-w-0 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-fg-1">{def.nome}</p>
                        <span className="font-mono text-xs font-semibold text-fg-4">{def.chave}</span>
                      </div>
                      {def.ajuda && <p className="mt-1 line-clamp-1 text-xs font-semibold text-fg-3">{def.ajuda}</p>}
                    </button>
                    <div className="text-sm font-semibold text-fg-2">
                      <p>{labelFrom(ENTIDADES, def.entidade_tipo)}</p>
                      <p className="mt-1 text-xs text-fg-4">{filialMap.get(def.filial_id ?? '') ?? 'Grupo inteiro'}</p>
                    </div>
                    <div className="text-sm font-semibold text-fg-2">
                      <p>{labelFrom(TIPOS_DADO, def.tipo_dado)}</p>
                      <p className="mt-1 text-xs text-fg-4">{def.formato ? labelFrom(FORMATOS, def.formato) : def.agrupamento ?? 'sem agrupamento'}</p>
                    </div>
                    <div className="flex flex-wrap items-center self-center gap-1.5 text-fg-3">
                      {def.obrigatorio && <span className={`${chipClass} bg-signal-warning/15 text-signal-warning`}>Obrigatório</span>}
                      {def.visivel_em_listagem && <span className={`${chipClass} bg-accent-primary-soft text-accent-primary`}>Listagem</span>}
                      {isListType(def.tipo_dado) && <span className={`${chipClass} bg-bg-surface-2 text-fg-3`}>Opções</span>}
                    </div>
                    <StatusPill active={def.ativo} />
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditDef(def)}
                        className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                        aria-label={`Editar definição ${def.nome}`}
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDef(def)}
                        disabled={isRemovingDefinicao || !def.ativo}
                        className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Inativar definição ${def.nome}`}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredDefinicoes.length === 0 && (
                  <div className="py-12 text-center text-sm font-semibold text-fg-4">
                    Nenhuma definição encontrada.
                  </div>
                )}
              </div>
            )}
          </section>
          )}
        </>
      ) : (
        <>
          {opcaoView === 'detail' ? (
          <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
            <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div>
                <button
                  type="button"
                  onClick={handleBackToOpcaoList}
                  className="mb-4 inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                >
                  <ArrowLeft size={14} /> Voltar para lista
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                  {editingOpcaoId ? 'Editar Opção' : 'Nova Opção'}
                </h3>
                <p className="mt-1 text-xs font-semibold text-fg-3">
                  Opções só são usadas por campos de Lista única ou Lista múltipla.
                </p>
              </div>
              {editingOpcaoId && (
                <button
                  type="button"
                  onClick={() => resetOpcaoForm(activeListaDefinicaoId ?? '')}
                  className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                >
                  <X size={15} /> Cancelar edição
                </button>
              )}
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-4">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Definição de lista</span>
                <select
                  value={activeListaDefinicaoId ?? ''}
                  onChange={(event) => {
                    setSelectedDefinicaoId(event.target.value || null)
                    resetOpcaoForm(event.target.value)
                  }}
                  className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                >
                  {listDefinicoes.map((def) => (
                    <option key={def.id} value={def.id}>{def.nome}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Rótulo *</span>
                <input
                  value={opcaoForm.rotulo}
                  onChange={(event) => setOpcaoField('rotulo', event.target.value)}
                  disabled={!activeListaDefinicaoId}
                  placeholder="Ex: Plano Familiar"
                  className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Valor canônico</span>
                <input
                  value={opcaoForm.valor}
                  onChange={(event) => setOpcaoField('valor', event.target.value)}
                  disabled={!activeListaDefinicaoId}
                  placeholder="plano_familiar"
                  className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 font-mono text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                />
              </label>
              <ToggleField label="Ativa" checked={opcaoForm.ativo} onChange={(checked) => setOpcaoField('ativo', checked)} />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSaveOpcao}
                  disabled={isSavingOpcao || !activeListaDefinicaoId || !opcaoForm.rotulo.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
                >
                  {isSavingOpcao ? <Loader2 size={17} className="animate-spin" /> : editingOpcaoId ? <Save size={17} /> : <Plus size={17} />}
                  {editingOpcaoId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </div>

            {opcaoError && (
              <div className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
                {opcaoError}
              </div>
            )}

            </div>
          </section>
          ) : (

        <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
            <div className="border-b border-border-1 bg-bg-surface-2 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-sm font-black text-fg-1">{activeListaDefinicao?.nome ?? 'Sem definição de lista'}</h4>
                  <p className="mt-1 text-xs font-semibold text-fg-3">
                    {activeListaDefinicao ? activeListaDefinicao.chave : 'Crie uma definição do tipo Lista única ou Lista múltipla para cadastrar opções.'}
                  </p>
                </div>
                <label className="relative block w-full md:max-w-sm">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    value={opcaoSearch}
                    onChange={(event) => setOpcaoSearch(event.target.value)}
                    placeholder="Buscar opção..."
                    className="w-full rounded-full border border-border-1 bg-bg-surface py-2.5 pl-9 pr-4 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCreateOpcao}
                  disabled={!activeListaDefinicaoId}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
                >
                  <Plus size={17} /> Nova opção
                </button>
              </div>
            </div>

          <div className="divide-y divide-border-1 border-t border-border-1">
            {isLoadingOpcoes ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
                <Loader2 className="animate-spin" size={18} /> Carregando opções...
              </div>
            ) : (
              filteredOpcoes.map((opcao) => (
                <div key={opcao.id} className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1fr_1fr_100px_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-fg-1">{opcao.rotulo}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-fg-4">{opcao.valor}</p>
                  </div>
                  <p className="text-sm font-semibold text-fg-2">{activeListaDefinicao?.nome ?? '-'}</p>
                  <StatusPill active={opcao.ativo} />
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditOpcao(opcao)}
                      className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                      aria-label={`Editar opção ${opcao.rotulo}`}
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveOpcao(opcao)}
                      disabled={isRemovingOpcao || !opcao.ativo}
                      className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Inativar opção ${opcao.rotulo}`}
                      title="Inativar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}

            {!isLoadingOpcoes && filteredOpcoes.length === 0 && (
              <div className="py-12 text-center text-sm font-semibold text-fg-4">
                Nenhuma opção encontrada.
              </div>
            )}
          </div>
        </section>
          )}
        </>
      )}
    </div>
  )
}
