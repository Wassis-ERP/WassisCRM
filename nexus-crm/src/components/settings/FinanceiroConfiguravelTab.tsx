import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useFiliais } from '../../hooks/useFiliais'
import { useRamos, useSeguradoras } from '../../hooks/useLookups'
import { useProdutores } from '../../hooks/useProdutores'
import {
  useRecebimentoGradeParcelasAdmin,
  useRecebimentoGradesAdmin,
  useRepasseRegrasAdmin,
  type RecebimentoBaseCalculo,
  type RecebimentoGradeInput,
  type RecebimentoGradeParcelaInput,
  type RecebimentoGradeParcelaRow,
  type RecebimentoComissaoTipo,
  type RecebimentoGradeRow,
  type RecebimentoGradeTipo,
  type RecebimentoPercentualSobre,
  type RepasseBase,
  type RepasseGatilho,
  type RepassePapel,
  type RepasseRegraInput,
  type RepasseRegraRow,
  type RepasseTipoDocumento,
} from '../../hooks/useLookupsAdmin'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'
import { ReceiptGradeInspector } from './ReceiptGradeInspector'

type FinanceiroSection = 'grades' | 'repasses'
type GradeView = 'list' | 'detail'

const GRADE_TIPOS: Array<{ value: RecebimentoGradeTipo; label: string }> = [
  { value: 'ANTECIPADO_N', label: 'Antecipado N parcelas' },
  { value: 'ESGOTAMENTO', label: 'Esgotamento' },
  { value: 'NA_PARCELA', label: 'Na parcela' },
  { value: 'VITALICIO_PCT_PROPOSTA', label: 'Vitalício: % da proposta' },
  { value: 'VITALICIO_PCT_DEFINIDO', label: 'Vitalício: % definido' },
]

const BASES_CALCULO: Array<{ value: RecebimentoBaseCalculo; label: string }> = [
  { value: 'PREMIO_LIQUIDO', label: 'Prêmio líquido' },
  { value: 'PREMIO_TOTAL', label: 'Prêmio total' },
  { value: 'PARCELA_LIQUIDA', label: 'Parcela líquida' },
]

const PERCENTUAL_SOBRE: Array<{ value: RecebimentoPercentualSobre; label: string }> = [
  { value: 'COMISSAO_TOTAL', label: 'Comissão total' },
  { value: 'PARCELA', label: 'Parcela' },
  { value: 'PREMIO', label: 'Prêmio' },
]

const COMISSAO_TIPOS: Array<{ value: RecebimentoComissaoTipo; label: string }> = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'AGENCIAMENTO', label: 'Agenciamento' },
  { value: 'VITALICIA', label: 'Vitalícia' },
  { value: 'ADICIONAL', label: 'Adicional' },
  { value: 'RESTITUICAO', label: 'Restituição' },
]

const REPASSE_PAPEIS: Array<{ value: RepassePapel; label: string }> = [
  { value: 'PRODUTOR', label: 'Produtor' },
  { value: 'GERENTE', label: 'Gerente' },
]

const REPASSE_DOCUMENTOS: Array<{ value: RepasseTipoDocumento | ''; label: string }> = [
  { value: '', label: 'Nova e renovação' },
  { value: 'NOVA', label: 'Nova' },
  { value: 'RENOVACAO', label: 'Renovação' },
]

const REPASSE_BASES: Array<{ value: RepasseBase; label: string }> = [
  { value: 'COMISSAO', label: 'Comissão' },
  { value: 'PREMIO_LIQUIDO', label: 'Prêmio líquido' },
  { value: 'VALOR_FIXO', label: 'Valor fixo' },
]

const REPASSE_GATILHOS: Array<{ value: RepasseGatilho; label: string }> = [
  { value: 'NA_EMISSAO', label: 'Na emissão' },
  { value: 'PRIMEIRA_COMISSAO', label: 'Primeira comissão' },
  { value: 'CONFORME_RECEBIMENTO', label: 'Conforme recebimento' },
  { value: 'PARCELADO', label: 'Parcelado' },
]

const labelFrom = <T extends string>(items: Array<{ value: T; label: string }>, value: T | null | undefined) =>
  items.find((item) => item.value === value)?.label ?? value ?? '-'

const numberOrNull = (value: string) => (value === '' ? null : Number(value))
const percentText = (value: number | null) => (value == null ? 'Usa % da proposta' : `${value}%`)

const emptyGradeForm = (seguradoraId = '', ramoId = ''): RecebimentoGradeInput => ({
  seguradora_id: seguradoraId,
  ramo_id: ramoId,
  nome: '',
  tipo: 'ANTECIPADO_N',
  qtd_parcelas: 1,
  base_calculo: 'PREMIO_LIQUIDO',
  percentual_default: null,
  considera_iof: false,
  considera_adicional_fracionamento: false,
  vitalicio: false,
  ativo: true,
  observacoes: '',
})

const gradeFormFromRow = (row: RecebimentoGradeRow): RecebimentoGradeInput => ({
  seguradora_id: row.seguradora_id,
  ramo_id: row.ramo_id,
  nome: row.nome,
  tipo: row.tipo,
  qtd_parcelas: row.qtd_parcelas,
  base_calculo: row.base_calculo ?? 'PREMIO_LIQUIDO',
  percentual_default: row.percentual_default,
  considera_iof: row.considera_iof,
  considera_adicional_fracionamento: row.considera_adicional_fracionamento,
  vitalicio: row.vitalicio,
  ativo: row.ativo,
  observacoes: row.observacoes ?? '',
})

const emptyParcelaForm = (gradeId = ''): RecebimentoGradeParcelaInput => ({
  grade_id: gradeId,
  numero: 1,
  tipo_comissao: 'NORMAL',
  percentual: null,
  percentual_sobre: 'COMISSAO_TOTAL',
  dias_apos_vencimento: 0,
  ativo: true,
})

const parcelaFormFromRow = (row: RecebimentoGradeParcelaRow): RecebimentoGradeParcelaInput => ({
  grade_id: row.grade_id,
  numero: row.numero,
  tipo_comissao: row.tipo_comissao,
  percentual: row.percentual,
  percentual_sobre: row.percentual_sobre ?? 'COMISSAO_TOTAL',
  dias_apos_vencimento: row.dias_apos_vencimento,
  ativo: row.ativo,
})

const emptyRegraForm = (produtorId: string | null = null): RepasseRegraInput => ({
  filial_id: null,
  produtor_id: produtorId,
  ramo_id: null,
  papel: 'PRODUTOR',
  tipo_documento: null,
  base: 'COMISSAO',
  percentual: 35,
  valor_fixo: null,
  gatilho: 'CONFORME_RECEBIMENTO',
  qtd_parcelas: null,
  limite_parcelas: null,
  prioridade: 10,
  inicio_vigencia: '',
  fim_vigencia: '',
  ativo: true,
  observacoes: '',
})

const regraFormFromRow = (row: RepasseRegraRow): RepasseRegraInput => ({
  filial_id: row.filial_id,
  produtor_id: row.produtor_id,
  ramo_id: row.ramo_id,
  papel: row.papel,
  tipo_documento: row.tipo_documento,
  base: row.base,
  percentual: row.percentual,
  valor_fixo: row.valor_fixo,
  gatilho: row.gatilho,
  qtd_parcelas: row.qtd_parcelas,
  limite_parcelas: row.limite_parcelas,
  prioridade: row.prioridade,
  inicio_vigencia: row.inicio_vigencia ?? '',
  fim_vigencia: row.fim_vigencia ?? '',
  ativo: row.ativo,
  observacoes: row.observacoes ?? '',
})

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit self-center justify-self-start whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black uppercase leading-none tracking-widest ${
        active
          ? 'bg-signal-success/15 text-signal-success'
          : 'border border-border-1 bg-bg-surface-2 text-fg-4'
      }`}
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

export function FinanceiroGradesRecebimentoTab() {
  return <FinanceiroConfiguravelContent section="grades" />
}

export function FinanceiroRegrasRepasseTab() {
  return <FinanceiroConfiguravelContent section="repasses" />
}

export default FinanceiroGradesRecebimentoTab

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
    <label className="flex h-[42px] w-full min-w-0 items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 text-sm font-black text-fg-2">
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

function FinanceiroConfiguravelContent({ section }: { section: FinanceiroSection }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const produtorFiltroId = section === 'repasses' ? searchParams.get('produtorId') : null
  const seguradorasQuery = useSeguradoras()
  const ramosQuery = useRamos()
  const filiaisQuery = useFiliais()
  const produtoresQuery = useProdutores()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()

  const {
    grades,
    isLoading: isLoadingGrades,
    create: createGrade,
    update: updateGrade,
    duplicate: duplicateGrade,
    remove: removeGrade,
    isCreating: isCreatingGrade,
    isUpdating: isUpdatingGrade,
    isDuplicating: isDuplicatingGrade,
    isRemoving: isRemovingGrade,
  } = useRecebimentoGradesAdmin()
  const {
    regras,
    isLoading: isLoadingRegras,
    create: createRegra,
    update: updateRegra,
    remove: removeRegra,
    isCreating: isCreatingRegra,
    isUpdating: isUpdatingRegra,
    isRemoving: isRemovingRegra,
  } = useRepasseRegrasAdmin()

  const seguradoras = useMemo(() => seguradorasQuery.data ?? [], [seguradorasQuery.data])
  const ramos = useMemo(() => ramosQuery.data ?? [], [ramosQuery.data])
  const filiais = useMemo(() => filiaisQuery.data ?? [], [filiaisQuery.data])
  const produtores = useMemo(() => produtoresQuery.data ?? [], [produtoresQuery.data])

  const seguradoraMap = useMemo(() => new Map(seguradoras.map((item) => [item.id, item.nome])), [seguradoras])
  const ramoMap = useMemo(() => new Map(ramos.map((item) => [item.id, item.nome])), [ramos])
  const filialMap = useMemo(() => new Map(filiais.map((item) => [item.id, item.label])), [filiais])
  const produtorMap = useMemo(() => new Map(produtores.map((item) => [item.id, item.nome])), [produtores])

  const [gradeSearch, setGradeSearch] = useState('')
  const [gradeView, setGradeView] = useState<GradeView>('list')
  const [gradeSeguradoraFilter, setGradeSeguradoraFilter] = useState('')
  const [gradeRamoFilter, setGradeRamoFilter] = useState('')
  const [gradeTipoFilter, setGradeTipoFilter] = useState<RecebimentoGradeTipo | ''>('')
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)
  const activeGradeId = selectedGradeId
  const activeGrade = grades.find((grade) => grade.id === activeGradeId) ?? null
  const {
    parcelas,
    isLoading: isLoadingParcelas,
    create: createParcela,
    update: updateParcela,
    remove: removeParcela,
    isCreating: isCreatingParcela,
    isUpdating: isUpdatingParcela,
    isRemoving: isRemovingParcela,
  } = useRecebimentoGradeParcelasAdmin(activeGradeId)

  const [editingGradeId, setEditingGradeId] = useState<string | null>(null)
  const [gradeForm, setGradeForm] = useState<RecebimentoGradeInput>(() => emptyGradeForm())
  const [gradeError, setGradeError] = useState<string | null>(null)

  const [editingParcelaId, setEditingParcelaId] = useState<string | null>(null)
  const [parcelaForm, setParcelaForm] = useState<RecebimentoGradeParcelaInput>(() => emptyParcelaForm())
  const [parcelaError, setParcelaError] = useState<string | null>(null)

  const [regraSearch, setRegraSearch] = useState('')
  const [regraView, setRegraView] = useState<GradeView>('list')
  const [editingRegraId, setEditingRegraId] = useState<string | null>(null)
  const [regraForm, setRegraForm] = useState<RepasseRegraInput>(() => emptyRegraForm(produtorFiltroId))
  const [regraError, setRegraError] = useState<string | null>(null)

  const isSavingGrade = isCreatingGrade || isUpdatingGrade
  const isSavingParcela = isCreatingParcela || isUpdatingParcela
  const isSavingRegra = isCreatingRegra || isUpdatingRegra

  const filteredGrades = useMemo(() => {
    const needle = gradeSearch.trim().toLowerCase()
    return grades.filter((grade) => {
      const matchesText = !needle || (
        [
          grade.nome,
          grade.tipo,
          grade.base_calculo,
          seguradoraMap.get(grade.seguradora_id),
          ramoMap.get(grade.ramo_id),
          grade.observacoes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle)
      )

      return (
        matchesText &&
        (!gradeSeguradoraFilter || grade.seguradora_id === gradeSeguradoraFilter) &&
        (!gradeRamoFilter || grade.ramo_id === gradeRamoFilter) &&
        (!gradeTipoFilter || grade.tipo === gradeTipoFilter)
      )
    })
  }, [gradeRamoFilter, gradeSearch, gradeSeguradoraFilter, gradeTipoFilter, grades, ramoMap, seguradoraMap])

  const filteredRegras = useMemo(() => {
    const regrasBase = produtorFiltroId
      ? regras.filter((regra) => regra.produtor_id === produtorFiltroId)
      : regras
    const needle = regraSearch.trim().toLowerCase()
    if (!needle) return regrasBase
    return regrasBase.filter((regra) =>
      [
        regra.papel,
        regra.base,
        regra.gatilho,
        regra.tipo_documento,
        filialMap.get(regra.filial_id ?? ''),
        produtorMap.get(regra.produtor_id ?? ''),
        ramoMap.get(regra.ramo_id ?? ''),
        regra.observacoes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [filialMap, produtorFiltroId, produtorMap, ramoMap, regraSearch, regras])

  const hasGradeFilters = Boolean(
    gradeSearch.trim() || gradeSeguradoraFilter || gradeRamoFilter || gradeTipoFilter,
  )
  const produtorFiltroNome = produtorFiltroId ? produtorMap.get(produtorFiltroId) ?? 'Produtor selecionado' : null

  const resetGradeForm = () => {
    setEditingGradeId(null)
    setGradeForm(emptyGradeForm(seguradoras[0]?.id ?? '', ramos[0]?.id ?? ''))
    setGradeError(null)
  }

  const clearGradeFilters = () => {
    setGradeSearch('')
    setGradeSeguradoraFilter('')
    setGradeRamoFilter('')
    setGradeTipoFilter('')
  }

  const resetParcelaForm = (gradeId = activeGradeId ?? '') => {
    setEditingParcelaId(null)
    setParcelaForm(emptyParcelaForm(gradeId))
    setParcelaError(null)
  }

  const resetRegraForm = () => {
    setEditingRegraId(null)
    setRegraForm(emptyRegraForm(produtorFiltroId))
    setRegraError(null)
  }

  const setGradeField = <Key extends keyof RecebimentoGradeInput>(key: Key, value: RecebimentoGradeInput[Key]) => {
    setGradeForm((prev) => ({ ...prev, [key]: value }))
  }

  const setParcelaField = <Key extends keyof RecebimentoGradeParcelaInput>(
    key: Key,
    value: RecebimentoGradeParcelaInput[Key],
  ) => {
    setParcelaForm((prev) => ({ ...prev, [key]: value }))
  }

  const setRegraField = <Key extends keyof RepasseRegraInput>(key: Key, value: RepasseRegraInput[Key]) => {
    setRegraForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleRegraBaseChange = (base: RepasseBase) => {
    setRegraForm((prev) => ({
      ...prev,
      base,
      percentual: base === 'VALOR_FIXO' ? null : prev.percentual ?? 35,
      valor_fixo: base === 'VALOR_FIXO' ? prev.valor_fixo : null,
    }))
  }

  const handleRegraGatilhoChange = (gatilho: RepasseGatilho) => {
    setRegraForm((prev) => ({
      ...prev,
      gatilho,
      qtd_parcelas: gatilho === 'PARCELADO' ? prev.qtd_parcelas ?? 1 : null,
    }))
  }

  const handleSaveGrade = async () => {
    if (isSavingGrade) return
    const payload = {
      ...gradeForm,
      seguradora_id: gradeForm.seguradora_id || seguradoras[0]?.id || '',
      ramo_id: gradeForm.ramo_id || ramos[0]?.id || '',
    }
    const duplicateName = grades.some((grade) =>
      grade.id !== editingGradeId && grade.ativo
      && grade.seguradora_id === payload.seguradora_id
      && grade.ramo_id === payload.ramo_id
      && grade.nome.trim().toLocaleLowerCase('pt-BR') === payload.nome.trim().toLocaleLowerCase('pt-BR'))
    if (duplicateName) {
      setGradeError('Já existe uma grade ativa com este nome para a seguradora e o ramo.')
      return
    }
    setGradeError(null)
    try {
      const saved = editingGradeId
        ? await updateGrade({ id: editingGradeId, input: payload })
        : await createGrade(payload)
      setSelectedGradeId(saved.id)
      setEditingGradeId(saved.id)
      setGradeForm(gradeFormFromRow(saved))
      setGradeView('detail')
      setGradeError(null)
      resetParcelaForm(saved.id)
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Erro ao salvar grade')
    }
  }

  const handleCreateGrade = () => {
    setSelectedGradeId(null)
    setGradeView('detail')
    resetGradeForm()
    resetParcelaForm('')
  }

  const handleEditGrade = (row: RecebimentoGradeRow) => {
    setSelectedGradeId(row.id)
    setGradeView('detail')
    setEditingGradeId(row.id)
    setGradeForm(gradeFormFromRow(row))
    setGradeError(null)
    resetParcelaForm(row.id)
  }

  const handleBackToGradeList = () => {
    setGradeView('list')
    setSelectedGradeId(null)
    resetGradeForm()
    resetParcelaForm('')
  }

  const handleRemoveGrade = async (row: RecebimentoGradeRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar grade',
      description: `Inativar "${row.nome}"? Ela deixa de aparecer em novas emissões, mas fatos já gerados continuam preservados.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return
    try {
      await removeGrade(row.id)
      if (editingGradeId === row.id) resetGradeForm()
    } catch (err) {
      notify({
        title: 'Erro ao inativar grade',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const handleSaveParcela = async () => {
    if (isSavingParcela || !activeGradeId) return
    const payload = { ...parcelaForm, grade_id: activeGradeId }
    setParcelaError(null)
    if (activeGrade && payload.numero > activeGrade.qtd_parcelas) {
      setParcelaError(`O evento não pode exceder a quantidade ${activeGrade.qtd_parcelas} definida na grade.`)
      return
    }
    if (parcelas.some((row) => row.id !== editingParcelaId && row.ativo && row.numero === payload.numero)) {
      setParcelaError(`O evento ${payload.numero} já existe nesta grade.`)
      return
    }
    try {
      if (editingParcelaId) {
        await updateParcela({ id: editingParcelaId, input: payload })
      } else {
        await createParcela(payload)
      }
      resetParcelaForm(activeGradeId)
    } catch (err) {
      setParcelaError(err instanceof Error ? err.message : 'Erro ao salvar parcela')
    }
  }

  const handleEditParcela = (row: RecebimentoGradeParcelaRow) => {
    setEditingParcelaId(row.id)
    setParcelaForm(parcelaFormFromRow(row))
    setParcelaError(null)
  }

  const handleRemoveParcela = async (row: RecebimentoGradeParcelaRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar parcela da grade',
      description: `Inativar a parcela ${row.numero}? Ela deixa de compor novas agendas geradas por este molde.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return
    try {
      await removeParcela(row.id)
      if (editingParcelaId === row.id) resetParcelaForm(activeGradeId ?? '')
    } catch (err) {
      notify({
        title: 'Erro ao inativar parcela',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const handleDuplicateGrade = async () => {
    if (!activeGrade || isDuplicatingGrade) return
    const baseName = `${activeGrade.nome} - cópia`
    let copyName = baseName
    let suffix = 2
    while (grades.some((grade) => grade.seguradora_id === activeGrade.seguradora_id && grade.ramo_id === activeGrade.ramo_id && grade.nome.toLocaleLowerCase('pt-BR') === copyName.toLocaleLowerCase('pt-BR'))) {
      copyName = `${baseName} ${suffix}`
      suffix += 1
    }
    try {
      const ready = await duplicateGrade({ id: activeGrade.id, name: copyName })
      setSelectedGradeId(ready.id)
      setEditingGradeId(ready.id)
      setGradeForm(gradeFormFromRow(ready))
      resetParcelaForm(ready.id)
      notify({ title: 'Grade duplicada', description: `${parcelas.filter((row) => row.ativo).length} evento(s) copiado(s).`, tone: 'success' })
    } catch (err) {
      notify({ title: 'Erro ao duplicar grade', description: err instanceof Error ? err.message : 'A cópia permaneceu inativa.', tone: 'danger' })
    }
  }

  const handleSaveRegra = async () => {
    if (isSavingRegra) return
    setRegraError(null)
    try {
      if (editingRegraId) {
        await updateRegra({ id: editingRegraId, input: regraForm })
      } else {
        await createRegra(regraForm)
      }
      resetRegraForm()
      setRegraView('list')
    } catch (err) {
      setRegraError(err instanceof Error ? err.message : 'Erro ao salvar regra')
    }
  }

  const handleEditRegra = (row: RepasseRegraRow) => {
    setEditingRegraId(row.id)
    setRegraView('detail')
    setRegraForm(regraFormFromRow(row))
    setRegraError(null)
  }

  const handleCreateRegra = () => {
    resetRegraForm()
    setRegraView('detail')
  }

  const handleBackToRegraList = () => {
    resetRegraForm()
    setRegraView('list')
  }

  const handleRemoveRegra = async (row: RepasseRegraRow) => {
    const shouldRemove = await confirm({
      title: 'Inativar regra de repasse',
      description: 'Inativar esta regra? Repasses já gerados permanecem com o snapshot original.',
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return
    try {
      await removeRegra(row.id)
      if (editingRegraId === row.id) resetRegraForm()
    } catch (err) {
      notify({
        title: 'Erro ao inativar regra',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const clearProdutorFilter = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('produtorId')
    setSearchParams(nextParams, { replace: true })
    setRegraSearch('')
    setRegraForm(emptyRegraForm(null))
  }

  return (
    <div className="animate-fade-in space-y-6">
      {section === 'grades' ? (
        <>
          {gradeView === 'list' ? (
            <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
              <div className="flex flex-col gap-4 border-b border-border-1 bg-bg-surface-2 px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">Grades de Recebimento</h3>
                  <p className="mt-1 max-w-3xl text-xs font-semibold text-fg-3">
                    Moldes da comissão que a corretora recebe das seguradoras. Use os filtros para localizar a grade antes de editar o cronograma.
                  </p>
                  <p className="mt-3 text-xs font-black text-fg-2">
                    {filteredGrades.length} de {grades.length} grade(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateGrade}
                  disabled={seguradoras.length === 0 || ramos.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50 sm:w-fit"
                >
                  <Plus size={17} /> Adicionar grade
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 border-b border-border-1 px-5 py-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="relative block min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Busca</span>
                  <Search size={16} className="pointer-events-none absolute left-3 top-[32px] text-fg-4" />
                  <input
                    value={gradeSearch}
                    onChange={(event) => setGradeSearch(event.target.value)}
                    placeholder="Nome, seguradora, ramo ou observação..."
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 py-2.5 pl-9 pr-3 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Seguradora</span>
                  <select
                    value={gradeSeguradoraFilter}
                    onChange={(event) => setGradeSeguradoraFilter(event.target.value)}
                    disabled={seguradorasQuery.isLoading}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  >
                    <option value="">Todas</option>
                    {seguradoras.map((seguradora) => (
                      <option key={seguradora.id} value={seguradora.id}>{seguradora.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Ramo</span>
                  <select
                    value={gradeRamoFilter}
                    onChange={(event) => setGradeRamoFilter(event.target.value)}
                    disabled={ramosQuery.isLoading}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  >
                    <option value="">Todos</option>
                    {ramos.map((ramo) => (
                      <option key={ramo.id} value={ramo.id}>{ramo.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tipo de recebimento</span>
                  <select
                    value={gradeTipoFilter}
                    onChange={(event) => setGradeTipoFilter(event.target.value as RecebimentoGradeTipo | '')}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    <option value="">Todos</option>
                    {GRADE_TIPOS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearGradeFilters}
                    disabled={!hasGradeFilters}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X size={16} /> Limpar
                  </button>
                </div>
              </div>

              {isLoadingGrades ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
                  <Loader2 className="animate-spin" size={18} /> Carregando grades...
                </div>
              ) : (
                <div className="divide-y divide-border-1">
                  {filteredGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-bg-surface-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,110px)_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-fg-1">{grade.nome}</p>
                        {grade.observacoes && <p className="mt-1 line-clamp-1 text-xs font-semibold text-fg-3">{grade.observacoes}</p>}
                      </div>
                      <div className="min-w-0 text-sm font-semibold text-fg-2">
                        <p>{seguradoraMap.get(grade.seguradora_id) ?? 'Seguradora'}</p>
                        <p className="mt-1 text-xs text-fg-4">{ramoMap.get(grade.ramo_id) ?? 'Ramo'}</p>
                      </div>
                      <div className="min-w-0 text-sm font-semibold text-fg-2">
                        <p>{labelFrom(GRADE_TIPOS, grade.tipo)}</p>
                        <p className="mt-1 text-xs text-fg-4">{grade.qtd_parcelas} parcela(s)</p>
                      </div>
                      <div className="flex min-w-0 flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-widest text-fg-3">
                        <span className="rounded-full bg-bg-surface-2 px-2 py-1">{labelFrom(BASES_CALCULO, grade.base_calculo)}</span>
                        <span className="rounded-full bg-bg-surface-2 px-2 py-1">{percentText(grade.percentual_default)}</span>
                        {grade.vitalicio && <span className="rounded-full bg-accent-primary-soft px-2 py-1 text-accent-primary">Vitalício</span>}
                      </div>
                      <StatusPill active={grade.ativo} />
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditGrade(grade)}
                          className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                          aria-label={`Ver ou editar grade ${grade.nome}`}
                          title="Ver/editar"
                        >
                          <Edit3 size={15} /> Ver/editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGrade(grade)}
                          disabled={isRemovingGrade || !grade.ativo}
                          className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Inativar grade ${grade.nome}`}
                          title="Inativar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredGrades.length === 0 && (
                    <div className="px-5 py-12 text-center">
                      <p className="text-sm font-black text-fg-2">Nenhuma grade encontrada.</p>
                      <p className="mt-1 text-xs font-semibold text-fg-4">
                        Ajuste os filtros ou adicione uma nova grade de recebimento.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
                <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={handleBackToGradeList}
                      className="mb-3 inline-flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                    >
                      <ArrowLeft size={15} /> Voltar para lista
                    </button>
                    <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                      {editingGradeId ? 'Editar Grade de Recebimento' : 'Nova Grade de Recebimento de Comissão'}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-fg-3">
                      Molde da comissão que a corretora recebe da seguradora por seguradora e ramo.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-widest text-fg-3">
                    {activeGrade && (
                      <>
                        <span className="rounded-full bg-bg-surface px-2 py-1">{seguradoraMap.get(activeGrade.seguradora_id) ?? 'Seguradora'}</span>
                        <span className="rounded-full bg-bg-surface px-2 py-1">{ramoMap.get(activeGrade.ramo_id) ?? 'Ramo'}</span>
                        <span className="rounded-full bg-bg-surface px-2 py-1">{labelFrom(GRADE_TIPOS, activeGrade.tipo)}</span>
                        <StatusPill active={activeGrade.ativo} />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-fg-4">Identificação</h4>
                    <p className="mt-1 text-xs font-semibold text-fg-3">Seguradora, ramo e nome operacional do molde de recebimento.</p>
                  </div>
                  <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.7fr)]">
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Seguradora *</span>
                      <select
                        value={gradeForm.seguradora_id || seguradoras[0]?.id || ''}
                        onChange={(event) => setGradeField('seguradora_id', event.target.value)}
                        disabled={seguradorasQuery.isLoading}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                      >
                        {seguradoras.map((seguradora) => (
                          <option key={seguradora.id} value={seguradora.id}>{seguradora.nome}</option>
                        ))}
                      </select>
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Ramo *</span>
                      <select
                        value={gradeForm.ramo_id || ramos[0]?.id || ''}
                        onChange={(event) => setGradeField('ramo_id', event.target.value)}
                        disabled={ramosQuery.isLoading}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                      >
                        {ramos.map((ramo) => (
                          <option key={ramo.id} value={ramo.id}>{ramo.nome}</option>
                        ))}
                      </select>
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Nome *</span>
                      <input
                        value={gradeForm.nome}
                        onChange={(event) => setGradeField('nome', event.target.value)}
                        placeholder="Ex: Porto Auto - antecipado 3x"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tipo de recebimento</span>
                      <select
                        value={gradeForm.tipo}
                        onChange={(event) => setGradeField('tipo', event.target.value as RecebimentoGradeTipo)}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      >
                        {GRADE_TIPOS.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Qtd. parcelas de comissão</span>
                      <input
                        type="number"
                        min={1}
                        value={gradeForm.qtd_parcelas}
                        onChange={(event) => setGradeField('qtd_parcelas', Number(event.target.value))}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-fg-4">Modelo da comissão</h4>
                    <p className="mt-1 text-xs font-semibold text-fg-3">Base e percentuais usados para gerar a agenda de recebimento da corretora.</p>
                  </div>
                  <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_repeat(4,minmax(0,0.9fr))]">
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Base da comissão</span>
                      <select
                        value={gradeForm.base_calculo}
                        onChange={(event) => setGradeField('base_calculo', event.target.value as RecebimentoBaseCalculo)}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      >
                        {BASES_CALCULO.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">% padrão da comissão</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={gradeForm.percentual_default ?? ''}
                        onChange={(event) => setGradeField('percentual_default', numberOrNull(event.target.value))}
                        placeholder="% da proposta"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <ToggleField label="Considera IOF" checked={gradeForm.considera_iof} onChange={(checked) => setGradeField('considera_iof', checked)} />
                    <ToggleField label="Adicional fracionamento" checked={gradeForm.considera_adicional_fracionamento} onChange={(checked) => setGradeField('considera_adicional_fracionamento', checked)} />
                    <ToggleField label="Vitalício" checked={gradeForm.vitalicio} onChange={(checked) => setGradeField('vitalicio', checked)} />
                    <ToggleField label="Ativo" checked={gradeForm.ativo} onChange={(checked) => setGradeField('ativo', checked)} />
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Observações</span>
                    <textarea
                      value={gradeForm.observacoes}
                      onChange={(event) => setGradeField('observacoes', event.target.value)}
                      rows={3}
                      placeholder="Regras operacionais deste molde de recebimento da corretora."
                      className="w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                    />
                  </label>
                </div>

                {gradeError && (
                  <div className="mx-5 mb-4 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
                    {gradeError}
                  </div>
                )}

                <div className="flex flex-col gap-2 border-t border-border-1 px-5 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleBackToGradeList}
                    className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
                  >
                    <ArrowLeft size={16} /> Voltar
                  </button>
                  <button
                    type="button"
                    onClick={resetGradeForm}
                    className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
                  >
                    <X size={16} /> Limpar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGrade}
                    disabled={isSavingGrade || !gradeForm.nome.trim() || seguradoras.length === 0 || ramos.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
                  >
                    {isSavingGrade ? <Loader2 size={17} className="animate-spin" /> : editingGradeId ? <Save size={17} /> : <Plus size={17} />}
                    {isSavingGrade ? 'Salvando...' : editingGradeId ? 'Salvar grade' : 'Criar grade'}
                  </button>
                </div>
              </section>

              {activeGradeId ? (
                <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
                  <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                        Cronograma de recebimento da comissão
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-fg-3">
                        Define como a seguradora paga a comissão da corretora nesta grade.
                      </p>
                    </div>
                    {editingParcelaId && (
                      <button
                        type="button"
                        onClick={() => resetParcelaForm(activeGradeId ?? '')}
                        className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                      >
                        <X size={15} /> Cancelar edição
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_auto]">
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Número</span>
                      <input
                        type="number"
                        min={1}
                        value={parcelaForm.numero}
                        onChange={(event) => setParcelaField('numero', Number(event.target.value))}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tipo de comissão</span>
                      <select
                        value={parcelaForm.tipo_comissao}
                        onChange={(event) => setParcelaField('tipo_comissao', event.target.value as RecebimentoComissaoTipo)}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      >
                        {COMISSAO_TIPOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Percentual</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={parcelaForm.percentual ?? ''}
                        onChange={(event) => setParcelaField('percentual', numberOrNull(event.target.value))}
                        placeholder="% da proposta"
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Sobre</span>
                      <select
                        value={parcelaForm.percentual_sobre}
                        onChange={(event) => setParcelaField('percentual_sobre', event.target.value as RecebimentoPercentualSobre)}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      >
                        {PERCENTUAL_SOBRE.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Dias após vencimento</span>
                      <input
                        type="number"
                        min={0}
                        value={parcelaForm.dias_apos_vencimento ?? ''}
                        onChange={(event) => setParcelaField('dias_apos_vencimento', numberOrNull(event.target.value))}
                        className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                      />
                    </label>
                    <ToggleField label="Ativa" checked={parcelaForm.ativo} onChange={(checked) => setParcelaField('ativo', checked)} />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSaveParcela}
                        disabled={isSavingParcela}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
                      >
                        {isSavingParcela ? <Loader2 size={17} className="animate-spin" /> : editingParcelaId ? <Save size={17} /> : <Plus size={17} />}
                        {editingParcelaId ? 'Salvar' : 'Adicionar'}
                      </button>
                    </div>
                  </div>

                  {parcelaError && (
                    <div className="mx-5 mb-4 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
                      {parcelaError}
                    </div>
                  )}

                  <p className="px-5 pb-4 text-xs font-semibold text-fg-3">
                    Percentual vazio usa o percentual da proposta. Sem valor mágico no mock.
                  </p>

                  <div className="divide-y divide-border-1 border-t border-border-1">
                    {isLoadingParcelas ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-fg-3">
                        <Loader2 className="animate-spin" size={18} /> Carregando parcelas...
                      </div>
                    ) : (
                      parcelas.map((parcela) => (
                        <div key={parcela.id} className="grid grid-cols-1 gap-3 px-5 py-3 md:grid-cols-[minmax(0,0.65fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto] md:items-center">
                          <p className="text-sm font-black text-fg-1">Parcela {parcela.numero}</p>
                          <p className="text-xs font-black uppercase tracking-wide text-accent-primary">{labelFrom(COMISSAO_TIPOS, parcela.tipo_comissao)}</p>
                          <p className="min-w-0 text-sm font-semibold text-fg-2">
                            {percentText(parcela.percentual)} sobre {labelFrom(PERCENTUAL_SOBRE, parcela.percentual_sobre)}
                          </p>
                          <p className="min-w-0 text-xs font-semibold text-fg-4">{parcela.dias_apos_vencimento ?? 0} dia(s) após vencimento</p>
                          <StatusPill active={parcela.ativo} />
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditParcela(parcela)}
                              className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                              aria-label={`Editar parcela ${parcela.numero}`}
                              title="Editar"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveParcela(parcela)}
                              disabled={isRemovingParcela || !parcela.ativo}
                              className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Inativar parcela ${parcela.numero}`}
                              title="Inativar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    {!isLoadingParcelas && parcelas.length === 0 && (
                      <div className="py-10 text-center text-sm font-semibold text-fg-4">
                        Nenhuma parcela configurada para a grade selecionada.
                      </div>
                    )}
                  </div>
                  {activeGrade && <ReceiptGradeInspector grade={activeGrade} events={parcelas} catalog={grades} duplicating={isDuplicatingGrade} onDuplicate={() => void handleDuplicateGrade()} />}
                </section>
              ) : (
                <section className="rounded-[8px] border border-border-1 bg-bg-surface px-5 py-6 text-sm font-semibold text-fg-3 shadow-[var(--shadow-1)]">
                  Salve a grade para configurar o cronograma de recebimento da comissão.
                </section>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {regraView === 'detail' ? (
          <section className="rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
            <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div>
                <button
                  type="button"
                  onClick={handleBackToRegraList}
                  className="mb-4 inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                >
                  <ArrowLeft size={14} /> Voltar para lista
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider text-fg-1">
                  {editingRegraId ? 'Editar Regra de Repasse' : 'Nova Regra de Repasse'}
                </h3>
                <p className="mt-1 text-xs font-semibold text-fg-3">
                  Pagamento ao produtor ou gerente. Regra mais específica vence e mudanças não reescrevem repasses já gerados.
                </p>
              </div>
              {editingRegraId && (
                <button
                  type="button"
                  onClick={resetRegraForm}
                  className="inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1"
                >
                  <X size={15} /> Cancelar edição
                </button>
              )}
            </div>

            <div className="space-y-5 p-5">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-fg-4">Escopo da regra</h4>
                <p className="mt-1 text-xs font-semibold text-fg-3">Grupo, corretora, produtor/gerente, ramo e tipo de documento atendidos pela regra.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Corretora</span>
                  <select
                    value={regraForm.filial_id ?? ''}
                    onChange={(event) => setRegraField('filial_id', event.target.value || null)}
                    disabled={filiaisQuery.isLoading}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  >
                    <option value="">Grupo inteiro</option>
                    {filiais.map((filial) => (
                      <option key={filial.id} value={filial.id}>{filial.label}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Produtor</span>
                  <select
                    value={regraForm.produtor_id ?? ''}
                    onChange={(event) => setRegraField('produtor_id', event.target.value || null)}
                    disabled={produtoresQuery.isLoading}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  >
                    <option value="">Padrão</option>
                    {produtores.map((produtor) => (
                      <option key={produtor.id} value={produtor.id}>{produtor.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Ramo</span>
                  <select
                    value={regraForm.ramo_id ?? ''}
                    onChange={(event) => setRegraField('ramo_id', event.target.value || null)}
                    disabled={ramosQuery.isLoading}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  >
                    <option value="">Todos os ramos</option>
                    {ramos.map((ramo) => (
                      <option key={ramo.id} value={ramo.id}>{ramo.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Papel</span>
                  <select
                    value={regraForm.papel}
                    onChange={(event) => setRegraField('papel', event.target.value as RepassePapel)}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {REPASSE_PAPEIS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Documento</span>
                  <select
                    value={regraForm.tipo_documento ?? ''}
                    onChange={(event) => setRegraField('tipo_documento', event.target.value ? event.target.value as RepasseTipoDocumento : null)}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {REPASSE_DOCUMENTOS.map((item) => (
                      <option key={item.value || 'ambos'} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-fg-4">Cálculo do repasse</h4>
                <p className="mt-1 text-xs font-semibold text-fg-3">Percentual ou valor fixo usado para pagar o beneficiário do repasse.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Base do repasse</span>
                  <select
                    value={regraForm.base}
                    onChange={(event) => handleRegraBaseChange(event.target.value as RepasseBase)}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {REPASSE_BASES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">% do repasse</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={regraForm.percentual ?? ''}
                    onChange={(event) => setRegraField('percentual', numberOrNull(event.target.value))}
                    disabled={regraForm.base === 'VALOR_FIXO'}
                    placeholder={regraForm.base === 'VALOR_FIXO' ? 'Limpo' : 'Obrigatório'}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  />
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Valor fixo do repasse</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={regraForm.valor_fixo ?? ''}
                    onChange={(event) => setRegraField('valor_fixo', numberOrNull(event.target.value))}
                    disabled={regraForm.base !== 'VALOR_FIXO'}
                    placeholder={regraForm.base === 'VALOR_FIXO' ? 'Obrigatório' : 'Limpo'}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  />
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Gatilho de pagamento</span>
                  <select
                    value={regraForm.gatilho}
                    onChange={(event) => handleRegraGatilhoChange(event.target.value as RepasseGatilho)}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-black text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {REPASSE_GATILHOS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Qtd. parcelas do repasse</span>
                  <input
                    type="number"
                    min={1}
                    value={regraForm.qtd_parcelas ?? ''}
                    onChange={(event) => setRegraField('qtd_parcelas', numberOrNull(event.target.value))}
                    disabled={regraForm.gatilho !== 'PARCELADO'}
                    placeholder={regraForm.gatilho === 'PARCELADO' ? 'Obrigatório' : 'Opcional'}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
                  />
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Limite</span>
                  <input
                    type="number"
                    min={1}
                    value={regraForm.limite_parcelas ?? ''}
                    onChange={(event) => setRegraField('limite_parcelas', numberOrNull(event.target.value))}
                    placeholder="Ex: 12"
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Prioridade</span>
                  <input
                    type="number"
                    value={regraForm.prioridade}
                    onChange={(event) => setRegraField('prioridade', Number(event.target.value))}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-fg-4">Vigência e observações</h4>
                <p className="mt-1 text-xs font-semibold text-fg-3">Período de validade e motivo operacional da regra de pagamento.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Início vigência</span>
                  <input
                    type="date"
                    value={regraForm.inicio_vigencia}
                    onChange={(event) => setRegraField('inicio_vigencia', event.target.value)}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Fim vigência</span>
                  <input
                    type="date"
                    value={regraForm.fim_vigencia}
                    onChange={(event) => setRegraField('fim_vigencia', event.target.value)}
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <ToggleField label="Ativa" checked={regraForm.ativo} onChange={(checked) => setRegraField('ativo', checked)} />
                <label className="min-w-0 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Observações</span>
                  <input
                    value={regraForm.observacoes}
                    onChange={(event) => setRegraField('observacoes', event.target.value)}
                    placeholder="Exceções, escopo ou motivo da regra."
                    className="w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
              </div>
            </div>

            {regraError && (
              <div className="mx-5 mb-4 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
                {regraError}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-border-1 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleBackToRegraList}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                type="button"
                onClick={resetRegraForm}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-black text-fg-3 transition-colors hover:bg-bg-surface-2 hover:text-fg-1"
              >
                <X size={16} /> Limpar
              </button>
              <button
                type="button"
                onClick={handleSaveRegra}
                disabled={isSavingRegra}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
              >
                {isSavingRegra ? <Loader2 size={17} className="animate-spin" /> : editingRegraId ? <Save size={17} /> : <Plus size={17} />}
                {isSavingRegra ? 'Salvando...' : editingRegraId ? 'Salvar regra' : 'Criar regra'}
              </button>
            </div>
          </section>
          ) : (

          <section className="overflow-hidden rounded-[8px] border border-border-1 bg-bg-surface shadow-[var(--shadow-1)]">
            <div className="flex flex-col gap-3 border-b border-border-1 bg-bg-surface-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-black text-fg-1">Regras cadastradas</h3>
                <p className="mt-1 text-xs font-semibold text-fg-3">A regra mais específica vence; prioridade ajuda a resolver exceções autorais.</p>
              </div>
              <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row md:items-center">
                <label className="relative block min-w-0 flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    value={regraSearch}
                    onChange={(event) => setRegraSearch(event.target.value)}
                    placeholder="Buscar regra, produtor, ramo..."
                    className="w-full rounded-full border border-border-1 bg-bg-surface py-2.5 pl-9 pr-4 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCreateRegra}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover"
                >
                  <Plus size={17} /> Nova regra
                </button>
              </div>
            </div>

            {produtorFiltroId && (
              <div className="flex flex-col gap-3 border-b border-border-1 bg-accent-primary-soft/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary">Filtro por produtor</p>
                  <p className="mt-1 text-xs font-semibold text-fg-2">
                    {produtorFiltroNome}. Novas regras já começam com este produtor selecionado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearProdutorFilter}
                  className="inline-flex w-fit items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface hover:text-fg-1"
                >
                  <X size={14} /> Remover filtro
                </button>
              </div>
            )}

            {isLoadingRegras ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-fg-3">
                <Loader2 className="animate-spin" size={18} /> Carregando regras...
              </div>
            ) : (
              <div className="divide-y divide-border-1">
                {filteredRegras.map((regra) => (
                  <div
                    key={regra.id}
                    className={`grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-bg-surface-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,110px)_auto] ${
                      editingRegraId === regra.id ? 'bg-accent-primary-soft/40' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-fg-1">{labelFrom(REPASSE_PAPEIS, regra.papel)}</p>
                        <span className="rounded-full bg-bg-surface-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-fg-4">
                          prioridade {regra.prioridade}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-fg-3">
                        {filialMap.get(regra.filial_id ?? '') ?? 'Grupo inteiro'} · {produtorMap.get(regra.produtor_id ?? '') ?? 'Padrão'}
                      </p>
                    </div>
                    <div className="min-w-0 text-sm font-semibold text-fg-2">
                      <p>{ramoMap.get(regra.ramo_id ?? '') ?? 'Todos os ramos'}</p>
                      <p className="mt-1 text-xs text-fg-4">{regra.tipo_documento ? labelFrom(REPASSE_DOCUMENTOS, regra.tipo_documento) : 'Nova e renovação'}</p>
                    </div>
                    <div className="min-w-0 text-sm font-semibold text-fg-2">
                      <p>{labelFrom(REPASSE_BASES, regra.base)}</p>
                      <p className="mt-1 text-xs text-fg-4">
                        {regra.base === 'VALOR_FIXO' ? `R$ ${regra.valor_fixo ?? 0}` : `${regra.percentual ?? 0}%`}
                      </p>
                    </div>
                    <div className="min-w-0 text-sm font-semibold text-fg-2">
                      <p>{labelFrom(REPASSE_GATILHOS, regra.gatilho)}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-fg-4">
                        <CalendarDays size={12} />
                        {regra.inicio_vigencia ?? 'sem início'} a {regra.fim_vigencia ?? 'sem fim'}
                      </p>
                    </div>
                    <StatusPill active={regra.ativo} />
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditRegra(regra)}
                        className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-accent-primary-soft hover:text-accent-primary"
                        aria-label={`Editar regra ${labelFrom(REPASSE_PAPEIS, regra.papel)} prioridade ${regra.prioridade}`}
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRegra(regra)}
                        disabled={isRemovingRegra || !regra.ativo}
                        className="rounded-[6px] p-2 text-fg-4 transition-colors hover:bg-signal-danger/10 hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Inativar regra ${labelFrom(REPASSE_PAPEIS, regra.papel)} prioridade ${regra.prioridade}`}
                        title="Inativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredRegras.length === 0 && (
                  <div className="py-12 text-center text-sm font-semibold text-fg-4">
                    Nenhuma regra encontrada.
                  </div>
                )}
              </div>
            )}
          </section>
          )}
        </>
      )}
    </div>
  )
}
