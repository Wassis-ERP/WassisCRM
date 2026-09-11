import { opportunityPermissionContext } from '../modules/plataforma/platformDomain'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Calculator,
  CalendarRange,
  Car,
  CircleAlert,
  CheckCircle2,
  CopyPlus,
  FileCheck2,
  Loader2,
  LocateFixed,
  Save,
  Search,
  Shield,
  Umbrella,
  UserRound,
} from 'lucide-react'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import CalculationExecutionSection from '../components/oportunidades/CalculationExecutionSection'
import {
  getCalculationDuplicateInput,
  useCalculation,
  useCalculationAssistance,
  useCalculationEditorLookups,
  useCalculationSourcePolicy,
  useCreateCalculation,
} from '../hooks/useCalculos'
import { useOportunidade } from '../hooks/useOportunidades'
import { usePermission } from '../hooks/usePermission'
import type { SourcePolicyAssistance } from '../modules/comercial/calculationAssistance'
import {
  addCalendarYear,
  buildCalculationVersionLabel,
  type CalculationAggregate,
  type CalculationCoverageInput,
  type CalculationCreateInput,
} from '../modules/comercial/calculationDomain'
import {
  createEmptySpecialization,
  RISK_FIELDS,
  updateSpecializationField,
  type RiskFieldDefinition,
} from '../modules/comercial/calculationForm'
import type { CalculoForma, CalculoRow, CalculoTipoSeguro } from '../types/database'
import { fmtDate } from '../utils/date'
import { formatCpfCnpj, onlyDigits } from '../utils/documento'
import {
  formatCep,
  formatCurrency,
  formatPlate,
  formatVehicleIdentifier,
  normalizeVehicleIdentifier,
  parseCurrencyInput,
} from '../utils/masks'

const inputClass = 'w-full rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-3 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-70'
const labelClass = 'mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3'
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-1 px-4 py-2.5 text-xs font-black text-fg-2 hover:border-accent-primary/30 hover:bg-accent-primary-soft hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-50'

function isCalculationForm(value: string | null | undefined): value is CalculoForma {
  return ['AUTO', 'RESIDENCIA', 'CONDOMINIO', 'VIDA', 'EMPRESA', 'DIVERSOS'].includes(value ?? '')
}

function todayInBranchTimezone(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

function withAutoValues(
  specialization: CalculationCreateInput['specialization'],
  values: Record<string, string | number | boolean | null | undefined>,
): CalculationCreateInput['specialization'] {
  if (specialization.forma !== 'AUTO') return specialization
  const accepted = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined))
  return { forma: 'AUTO', data: { ...specialization.data, ...accepted } }
}

function createInitialInput(
  opportunityId: string,
  lineId: string,
  insuredId: string | null,
  forma: CalculoForma,
  sourcePolicy: SourcePolicyAssistance | null,
): CalculationCreateInput {
  const type: CalculoTipoSeguro = sourcePolicy ? 'RENOVACAO_PROPRIA' : 'NOVO'
  const validityStart = sourcePolicy?.vigencia_fim ?? todayInBranchTimezone()
  const specialization = sourcePolicy?.vehicle
    ? withAutoValues(createEmptySpecialization(forma), sourcePolicy.vehicle)
    : createEmptySpecialization(forma)
  return {
    oportunidade_id: opportunityId,
    ramo_id: lineId,
    segurado_id: sourcePolicy?.segurado_id ?? insuredId,
    seguradora_anterior_id: sourcePolicy?.seguradora_id ?? null,
    origem: sourcePolicy ? 'ASSISTIDA' : 'MANUAL',
    comissao_sugerida_pct: null,
    rotulo_versao: null,
    tipo_seguro: type,
    bonus: sourcePolicy?.bonus ?? null,
    qtd_sinistros: null,
    qtd_sinistros_perda_parcial: null,
    transferiu_titularidade: null,
    vigencia_inicio: validityStart,
    vigencia_fim: addCalendarYear(validityStart),
    vigencia_fim_anterior: sourcePolicy?.vigencia_fim ?? null,
    numero_apolice_anterior: sourcePolicy?.numero_apolice ?? null,
    codigo_identificacao_anterior: null,
    status_apolice_anterior: sourcePolicy?.status ?? null,
    nota_interna: null,
    specialization,
    coverages: [],
  }
}

function inputFromAggregate(aggregate: CalculationAggregate): CalculationCreateInput {
  return getCalculationDuplicateInput(aggregate.calculation.id)
}

export default function CalculoOportunidadePage() {
  const { oportunidadeId, calculoId } = useParams<{ oportunidadeId: string; calculoId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const opportunity = useOportunidade(oportunidadeId)
  const calculation = useCalculation(calculoId)
  const sourcePolicy = useCalculationSourcePolicy(opportunity.data?.apolice_origem_id ?? undefined)
  const sourceId = searchParams.get('from')
  const { can } = usePermission('comercial', opportunityPermissionContext(opportunity.data))
  const isSavedRoute = Boolean(calculoId)
  const isReadOnly = isSavedRoute && !can('create')

  if (!oportunidadeId) return <PageState title="Identificador inválido" description="Não foi possível localizar a oportunidade." onBack={() => navigate('/oportunidades')} />
  if (opportunity.isLoading || (calculoId && calculation.isLoading) || (!calculoId && opportunity.data?.apolice_origem_id && sourcePolicy.isLoading)) return <PageSkeleton />
  if (opportunity.isError || !opportunity.data) return <PageState title="Oportunidade não encontrada" description="O registro pode ter sido removido ou não estar acessível." onBack={() => navigate('/oportunidades')} />
  if (calculoId && (calculation.isError || !calculation.data)) return <PageState title="Cálculo não encontrado" description="A versão solicitada não pertence ao contexto disponível." onBack={() => navigate(`/oportunidades/${oportunidadeId}?tab=calculos`)} />

  const row = opportunity.data
  if (!row.ramo_id || !isCalculationForm(row.ramos?.forma_calculo)) {
    return <PageState title="Ramo necessário" description="Defina um ramo com forma de cálculo suportada na Visão geral antes de continuar." onBack={() => navigate(`/oportunidades/${oportunidadeId}`)} />
  }
  if (!isReadOnly && !can('create')) return <PageState title="Acesso somente leitura" description="Seu perfil não pode criar versões de cálculo nesta corretora." onBack={() => navigate(`/oportunidades/${oportunidadeId}?tab=calculos`)} />

  let initialInput: CalculationCreateInput
  try {
    initialInput = calculation.data
      ? inputFromAggregate(calculation.data)
      : sourceId
        ? getCalculationDuplicateInput(sourceId)
        : createInitialInput(row.id, row.ramo_id, row.segurado_id, row.ramos.forma_calculo, sourcePolicy.data ?? null)
  } catch (cause) {
    return <PageState title="Não foi possível preparar a versão" description={cause instanceof Error ? cause.message : 'Revise o cálculo de origem.'} onBack={() => navigate(`/oportunidades/${oportunidadeId}?tab=calculos`)} />
  }

  if (initialInput.oportunidade_id !== row.id || initialInput.ramo_id !== row.ramo_id) {
    return <PageState title="Versão incompatível" description="O cálculo de origem precisa pertencer à mesma oportunidade e ao mesmo ramo." onBack={() => navigate(`/oportunidades/${oportunidadeId}?tab=calculos`)} />
  }

  return (
    <CalculationForm
      key={`${calculoId ?? 'new'}:${sourceId ?? 'empty'}`}
      opportunity={row}
      initialInput={initialInput}
      sourcePolicy={sourcePolicy.data ?? null}
      readOnly={isReadOnly}
      savedCalculation={calculation.data?.calculation ?? null}
      canExecute={can('update')}
      sourceId={sourceId}
      onBack={() => navigate(`/oportunidades/${oportunidadeId}?tab=calculos`)}
      onDuplicate={calculoId && can('create') ? () => navigate(`/oportunidades/${oportunidadeId}/calculos/novo?from=${encodeURIComponent(calculoId)}`) : undefined}
    />
  )
}

function CalculationForm({ opportunity, initialInput, sourcePolicy, readOnly, savedCalculation, canExecute, sourceId, onBack, onDuplicate }: {
  opportunity: NonNullable<ReturnType<typeof useOportunidade>['data']>
  initialInput: CalculationCreateInput
  sourcePolicy: SourcePolicyAssistance | null
  readOnly: boolean
  savedCalculation: CalculoRow | null
  canExecute: boolean
  sourceId: string | null
  onBack: () => void
  onDuplicate?: () => void
}) {
  const [draft, setDraft] = useState(initialInput)
  const [dirty, setDirty] = useState(false)
  const [otherInsured, setOtherInsured] = useState(initialInput.segurado_id !== opportunity.segurado_id)
  const [insuredDocument, setInsuredDocument] = useState('')
  const [vehicleIdentifier, setVehicleIdentifier] = useState(() => initialInput.specialization.forma === 'AUTO'
    ? String(initialInput.specialization.data.placa || initialInput.specialization.data.chassi || '')
    : '')
  const [vehicleIdentifierEdited, setVehicleIdentifierEdited] = useState(false)
  const [cepEdited, setCepEdited] = useState(false)
  const savedRef = useRef(false)
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const create = useCreateCalculation()
  const lookups = useCalculationEditorLookups(opportunity.tenant_id, opportunity.filial_id, opportunity.ramo_id ?? undefined)
  const assistance = useCalculationAssistance(opportunity.filial_id)

  useEffect(() => {
    if (readOnly || !dirty || savedRef.current) return
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    const guardInternalNavigation = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest('a[href]')
      if (!anchor || anchor.getAttribute('target') === '_blank') return
      const href = anchor.getAttribute('href')
      if (!href || (!href.startsWith('/') && !href.startsWith(window.location.origin))) return
      event.preventDefault()
      event.stopPropagation()
      void confirm({
        title: 'Descartar alterações?',
        description: 'O cálculo ainda não foi salvo e nenhum rascunho parcial será mantido.',
        confirmLabel: 'Descartar',
        tone: 'warning',
      }).then((accepted) => {
        if (!accepted) return
        savedRef.current = true
        navigate(href.replace(window.location.origin, ''))
      })
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', guardInternalNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', guardInternalNavigation, true)
    }
  }, [confirm, dirty, navigate, readOnly])

  const set = <Key extends keyof CalculationCreateInput>(key: Key, value: CalculationCreateInput[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }
  const patch = (values: Partial<CalculationCreateInput>) => {
    setDraft((current) => ({ ...current, ...values }))
    setDirty(true)
  }
  const setAuto = (key: string, value: string | number | boolean | null) => {
    set('specialization', updateSpecializationField(draft.specialization, key, value))
  }
  const autoValue = (key: string) => draft.specialization.forma === 'AUTO'
    ? (draft.specialization.data as Record<string, string | number | boolean | null>)[key] ?? null
    : null

  const leave = async () => {
    if (!dirty || readOnly) { onBack(); return }
    const accepted = await confirm({
      title: 'Descartar alterações?',
      description: 'O cálculo ainda não foi salvo e nenhum rascunho parcial será mantido.',
      confirmLabel: 'Descartar',
      tone: 'warning',
    })
    if (accepted) { savedRef.current = true; onBack() }
  }

  const createSnapshot = async () => create.mutateAsync(draft)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (readOnly || (savedCalculation && !dirty)) return
    if (savedCalculation) {
      const accepted = await confirm({
        title: 'Gerar uma nova versão?',
        description: 'O cálculo atual e seus resultados serão preservados. As alterações serão gravadas em um novo snapshot.',
        confirmLabel: 'Gerar nova versão',
      })
      if (!accepted) return
    }
    try {
      const aggregate = await createSnapshot()
      savedRef.current = true
      setDirty(false)
      notify({
        title: savedCalculation ? 'Nova versão criada' : 'Cálculo salvo',
        description: 'O pedido e suas preferências foram gravados como um novo snapshot.',
        tone: 'success',
      })
      navigate(`/oportunidades/${opportunity.id}/calculos/${aggregate.calculation.id}`, { replace: true })
    } catch (cause) {
      notify({ title: 'Não foi possível salvar', description: cause instanceof Error ? cause.message : 'Revise os dados informados.', tone: 'danger' })
    }
  }

  const changeInsuranceType = (type: CalculoTipoSeguro) => {
    const today = todayInBranchTimezone()
    if (type === 'NOVO') {
      patch({
        tipo_seguro: type,
        seguradora_anterior_id: null,
        bonus: null,
        qtd_sinistros: null,
        qtd_sinistros_perda_parcial: null,
        transferiu_titularidade: null,
        vigencia_inicio: today,
        vigencia_fim: addCalendarYear(today),
        vigencia_fim_anterior: null,
        numero_apolice_anterior: null,
        codigo_identificacao_anterior: null,
        status_apolice_anterior: null,
      })
      return
    }
    if (type === 'RENOVACAO_PROPRIA' && sourcePolicy) {
      const start = sourcePolicy.vigencia_fim
      setDraft((current) => ({
        ...current,
        tipo_seguro: type,
        origem: 'ASSISTIDA',
        segurado_id: sourcePolicy.segurado_id,
        seguradora_anterior_id: sourcePolicy.seguradora_id,
        bonus: sourcePolicy.bonus,
        vigencia_inicio: start,
        vigencia_fim: addCalendarYear(start),
        vigencia_fim_anterior: sourcePolicy.vigencia_fim,
        numero_apolice_anterior: sourcePolicy.numero_apolice,
        status_apolice_anterior: sourcePolicy.status,
        specialization: sourcePolicy.vehicle ? withAutoValues(current.specialization, sourcePolicy.vehicle) : current.specialization,
      }))
      setDirty(true)
      return
    }
    patch({
      tipo_seguro: type,
      seguradora_anterior_id: null,
      bonus: type === 'RENOVACAO_OUTRA' ? 0 : null,
      qtd_sinistros: null,
      vigencia_inicio: today,
      vigencia_fim: addCalendarYear(today),
      vigencia_fim_anterior: null,
      numero_apolice_anterior: null,
      codigo_identificacao_anterior: null,
      status_apolice_anterior: null,
    })
  }

  const findInsured = async () => {
    if (![11, 14].includes(onlyDigits(insuredDocument).length)) return
    const result = await assistance.insured.mutateAsync(insuredDocument)
    if (!result) return
    setDraft((current) => ({
      ...current,
      segurado_id: result.id,
      origem: 'ASSISTIDA',
      specialization: withAutoValues(current.specialization, {
        condutor_nome: result.nome,
        condutor_cpf: result.cpf_cnpj,
        condutor_data_nascimento: result.data_nascimento,
        condutor_sexo: result.sexo,
        condutor_estado_civil: result.estado_civil,
        condutor_reside_com_segurado: true,
      }),
    }))
    setDirty(true)
  }

  const useOpportunityInsuredAsDriver = () => {
    const insured = lookups.data?.insureds.find((row) => row.id === draft.segurado_id)
    if (!insured) return
    patch({
      origem: draft.origem === 'MANUAL' ? 'ASSISTIDA' : draft.origem,
      specialization: withAutoValues(draft.specialization, {
        condutor_nome: insured.nome,
        condutor_cpf: insured.cpf_cnpj,
        condutor_data_nascimento: insured.data_nascimento,
        condutor_sexo: insured.sexo,
        condutor_estado_civil: insured.estado_civil,
        condutor_reside_com_segurado: true,
      }),
    })
  }

  const toggleOtherInsured = () => {
    assistance.insured.reset()
    if (otherInsured) {
      patch({ segurado_id: opportunity.segurado_id })
      setInsuredDocument('')
      setOtherInsured(false)
      return
    }
    setOtherInsured(true)
  }

  const findVehicle = async () => {
    const identifier = normalizeVehicleIdentifier(vehicleIdentifier)
    if (![7, 17].includes(identifier.length)) return
    const result = await assistance.vehicle.mutateAsync(identifier)
    if (!result) return
    patch({ origem: 'ASSISTIDA', specialization: withAutoValues(draft.specialization, result) })
    setVehicleIdentifier(String(result.placa || result.chassi || identifier))
    setVehicleIdentifierEdited(false)
  }

  const findCep = async () => {
    const value = onlyDigits(String(autoValue('cep_pernoite') ?? ''))
    if (value.length !== 8) return
    const result = await assistance.cep.mutateAsync(value)
    if (!result) return
    patch({ origem: 'ASSISTIDA', specialization: withAutoValues(draft.specialization, { cep_pernoite: result.cep }) })
    setCepEdited(false)
  }

  const coverageOptions = lookups.data?.coverages ?? []
  const selectedById = useMemo(() => new Map(draft.coverages.map((coverage) => [coverage.cobertura_id, coverage])), [draft.coverages])
  const changeCoverage = (coverageId: string, values: Partial<CalculationCoverageInput>, selected: boolean) => {
    setDraft((current) => {
      const existing = current.coverages.find((coverage) => coverage.cobertura_id === coverageId)
      const nextCoverage: CalculationCoverageInput = {
        cobertura_id: coverageId,
        limite_solicitado: null,
        percentual_fipe_solicitado: null,
        franquia_tipo_solicitado: null,
        opcao_solicitada: null,
        quantidade_solicitada: null,
        observacao_transmitida: null,
        ...existing,
        ...values,
        selecionada: true,
      }
      const coverages = selected
        ? existing
          ? current.coverages.map((coverage) => coverage.cobertura_id === coverageId ? nextCoverage : coverage)
          : [...current.coverages, nextCoverage]
        : current.coverages.filter((coverage) => coverage.cobertura_id !== coverageId)
      return { ...current, coverages }
    })
    setDirty(true)
  }
  const setVehicleFeature = (key: 'alienado' | 'kit_gas' | 'blindado' | 'chassi_remarcado' | 'antifurto', value: boolean) => {
    const removedCodes = key === 'kit_gas' && !value
      ? ['kit-gas']
      : key === 'blindado' && !value
        ? ['blindagem']
        : []
    const removedIds = new Set(coverageOptions.filter((coverage) => removedCodes.includes(coverage.codigo?.toLowerCase() ?? '')).map((coverage) => coverage.id))
    setDraft((current) => ({
      ...current,
      specialization: updateSpecializationField(current.specialization, key, value),
      coverages: removedIds.size > 0
        ? current.coverages.filter((coverage) => !removedIds.has(coverage.cobertura_id))
        : current.coverages,
    }))
    setDirty(true)
  }

  const generatedLabel = buildCalculationVersionLabel(draft)
  const title = savedCalculation ? draft.rotulo_versao || generatedLabel : sourceId ? 'Criar nova versão' : 'Novo cálculo'
  const customer = opportunity.segurados?.nome ?? opportunity.lead_nome ?? 'Lead ainda não qualificado'
  const isAuto = draft.specialization.forma === 'AUTO'

  return (
    <div className="mx-auto max-w-[1600px] animate-fade-in">
    <form onSubmit={submit} className={savedCalculation ? 'pb-5' : 'pb-10'}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => void leave()} className="inline-flex items-center gap-2 text-sm font-bold text-fg-3 hover:text-accent-primary"><ArrowLeft size={15} /> Voltar para a oportunidade</button>
        <span className="rounded-full bg-accent-primary-soft px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-primary">{opportunity.ramos?.nome}</span>
      </div>

      <header className="mb-6 border-b border-border-1 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-2"><Calculator size={21} className="mt-1 shrink-0 text-accent-primary" /><h1 className="min-w-0 break-words text-2xl font-black tracking-tight text-fg-1">{title}</h1></div>
            <p className="mt-1 text-sm font-semibold text-fg-3">{opportunity.titulo || customer} · {customer}</p>
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-[6px] bg-bg-surface-2 px-3 py-2 text-xs font-bold text-fg-2">
              <FileCheck2 size={14} className="shrink-0 text-accent-primary" />
              <span className="min-w-0 break-words">{draft.rotulo_versao || generatedLabel}</span>
              {!readOnly && <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-fg-4">gerado automaticamente</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onDuplicate && <button type="button" onClick={onDuplicate} className={secondaryButton}><CopyPlus size={14} /> Criar nova versão</button>}
            {!readOnly && (!savedCalculation || dirty) && <button type="submit" disabled={create.isPending || lookups.isLoading} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-xs font-black text-accent-primary-fg shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{create.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {savedCalculation ? 'Gerar nova versão' : 'Salvar cálculo'}</button>}
          </div>
        </div>
      </header>

      {savedCalculation && dirty && (
        <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-signal-warning/30 bg-signal-warning/10 p-4" role="status">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-signal-warning" />
          <div>
            <p className="text-sm font-black text-fg-1">Alterações em rascunho</p>
            <p className="mt-1 text-xs text-fg-2">A versão atual continua preservada. Ao salvar ou calcular nas seguradoras, será gerada uma nova versão com estas alterações.</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <InsuranceSection
          draft={draft}
          insurers={lookups.data?.insurers ?? []}
          sourcePolicy={sourcePolicy}
          readOnly={readOnly}
          onTypeChange={changeInsuranceType}
          onPatch={patch}
        />

        {isAuto ? (
          <>
            <Section number="2" title="Segurado e condutor" description="O cliente da oportunidade é o cotado padrão; troque somente quando necessário.">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 rounded-[6px] bg-bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <UserRound size={18} className="mt-0.5 shrink-0 text-accent-primary" />
                    <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-fg-4">Cotado nesta versão</p><p className="truncate text-sm font-black text-fg-1">{lookups.data?.insureds.find((row) => row.id === draft.segurado_id)?.nome ?? customer}</p><p className="mt-0.5 text-xs text-fg-3">{draft.segurado_id === opportunity.segurado_id ? 'Cliente da oportunidade' : 'Pessoa selecionada explicitamente'}</p></div>
                  </div>
                  {!readOnly && <button type="button" className={secondaryButton} onClick={toggleOtherInsured}>{otherInsured ? 'Usar cliente da oportunidade' : 'Cotar outra pessoa'}</button>}
                </div>

                {otherInsured && !readOnly && (
                  <div className="rounded-[6px] border border-border-1 p-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <Field label="CPF/CNPJ da pessoa"><input inputMode="numeric" value={formatCpfCnpj(insuredDocument)} onChange={(event) => { setInsuredDocument(onlyDigits(event.target.value).slice(0, 14)); assistance.insured.reset() }} onBlur={() => void findInsured()} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void findInsured() } }} className={inputClass} placeholder="000.000.000-00" /></Field>
                      <button type="button" onClick={() => void findInsured()} disabled={assistance.insured.isPending || ![11, 14].includes(onlyDigits(insuredDocument).length)} className={secondaryButton}>{assistance.insured.isPending ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Consultar pessoa</button>
                    </div>
                    <AssistanceMessage pending={assistance.insured.isPending} success={assistance.insured.isSuccess && Boolean(assistance.insured.data)} notFound={assistance.insured.isSuccess && !assistance.insured.data} error={assistance.insured.isError} foundText={assistance.insured.data ? `${assistance.insured.data.nome}: pessoa localizada e dados básicos reaproveitados.` : undefined} notFoundText="Pessoa não encontrada nesta corretora. Cadastre ou qualifique a pessoa antes de cotar em nome dela." />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-1 pt-4">
                  <div><h3 className="text-sm font-black text-fg-1">Condutor principal</h3><p className="mt-0.5 text-xs text-fg-3">Revise os dados que efetivamente compõem o perfil de risco.</p></div>
                  {!readOnly && draft.segurado_id && <button type="button" className={secondaryButton} onClick={useOpportunityInsuredAsDriver}><BadgeCheck size={14} /> Usar dados do cotado</button>}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Nome do condutor"><TextInput disabled={readOnly} value={autoValue('condutor_nome')} onChange={(value) => setAuto('condutor_nome', value)} /></Field>
                  <Field label="CPF do condutor"><input inputMode="numeric" disabled={readOnly} value={formatCpfCnpj(String(autoValue('condutor_cpf') ?? ''))} onChange={(event) => setAuto('condutor_cpf', onlyDigits(event.target.value).slice(0, 14) || null)} className={inputClass} placeholder="000.000.000-00" /></Field>
                  <Field label="Nascimento"><TextInput type="date" disabled={readOnly} value={autoValue('condutor_data_nascimento')} onChange={(value) => setAuto('condutor_data_nascimento', value)} /></Field>
                  <Field label="Sexo"><TextInput disabled={readOnly} value={autoValue('condutor_sexo')} onChange={(value) => setAuto('condutor_sexo', value)} /></Field>
                  <Field label="Estado civil"><TextInput disabled={readOnly} value={autoValue('condutor_estado_civil')} onChange={(value) => setAuto('condutor_estado_civil', value)} /></Field>
                  <Field label="Profissão"><TextInput disabled={readOnly} value={autoValue('condutor_profissao')} onChange={(value) => setAuto('condutor_profissao', value)} /></Field>
                  <Field label="Reside com o segurado"><BooleanSelect disabled={readOnly} value={typeof autoValue('condutor_reside_com_segurado') === 'boolean' ? autoValue('condutor_reside_com_segurado') as boolean : null} onChange={(value) => setAuto('condutor_reside_com_segurado', value)} /></Field>
                  <Field label="Tempo de habilitação (anos)"><NumberInput disabled={readOnly} value={typeof autoValue('condutor_tempo_habilitacao') === 'number' ? autoValue('condutor_tempo_habilitacao') as number : null} onChange={(value) => setAuto('condutor_tempo_habilitacao', value)} /></Field>
                </div>
              </div>
            </Section>

            <Section number="3" title="Veículo" description="Consulte por placa ou chassi e mantenha preenchimento manual como fallback.">
              {!readOnly && <div className="mb-5 rounded-[6px] border border-border-1 bg-bg-surface-2 p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"><Field label="Placa ou chassi"><input value={formatVehicleIdentifier(vehicleIdentifier)} onChange={(event) => { setVehicleIdentifier(normalizeVehicleIdentifier(event.target.value)); setVehicleIdentifierEdited(true); assistance.vehicle.reset() }} onBlur={() => { if (vehicleIdentifierEdited) void findVehicle() }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void findVehicle() } }} className={inputClass} placeholder="Ex.: BRA-2E19" /></Field><button type="button" onClick={() => void findVehicle()} disabled={assistance.vehicle.isPending || ![7, 17].includes(normalizeVehicleIdentifier(vehicleIdentifier).length)} className={secondaryButton}>{assistance.vehicle.isPending ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Consultar veículo</button></div><AssistanceMessage pending={assistance.vehicle.isPending} success={assistance.vehicle.isSuccess && Boolean(assistance.vehicle.data)} notFound={assistance.vehicle.isSuccess && !assistance.vehicle.data} error={assistance.vehicle.isError} foundText={assistance.vehicle.data ? `${assistance.vehicle.data.marca ?? 'Veículo'} ${assistance.vehicle.data.modelo ?? ''} localizado; revise os dados preenchidos.` : undefined} notFoundText="Veículo não encontrado. Continue pelo preenchimento manual abaixo." /></div>}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Código FIPE"><TextInput disabled={readOnly} value={autoValue('codigo_fipe')} onChange={(value) => setAuto('codigo_fipe', value)} /></Field>
                <Field label="Marca"><TextInput disabled={readOnly} value={autoValue('marca')} onChange={(value) => setAuto('marca', value)} /></Field>
                <Field label="Modelo"><TextInput disabled={readOnly} value={autoValue('modelo')} onChange={(value) => setAuto('modelo', value)} /></Field>
                <Field label="Versão"><TextInput disabled={readOnly} value={autoValue('versao')} onChange={(value) => setAuto('versao', value)} /></Field>
                <Field label="Ano de fabricação"><NumberInput disabled={readOnly} value={typeof autoValue('ano_fabricacao') === 'number' ? autoValue('ano_fabricacao') as number : null} onChange={(value) => setAuto('ano_fabricacao', value)} /></Field>
                <Field label="Ano do modelo"><NumberInput disabled={readOnly} value={typeof autoValue('ano_modelo') === 'number' ? autoValue('ano_modelo') as number : null} onChange={(value) => setAuto('ano_modelo', value)} /></Field>
                <Field label="Placa"><input disabled={readOnly} value={formatPlate(String(autoValue('placa') ?? ''))} onChange={(event) => setAuto('placa', normalizeVehicleIdentifier(event.target.value).slice(0, 7) || null)} className={inputClass} /></Field>
                <Field label="Chassi"><TextInput disabled={readOnly} value={autoValue('chassi')} onChange={(value) => setAuto('chassi', value?.toUpperCase() ?? null)} /></Field>
                <Field label="Renavam"><TextInput disabled={readOnly} value={autoValue('renavam')} onChange={(value) => setAuto('renavam', value)} /></Field>
                <Field label="Combustível"><TextInput disabled={readOnly} value={autoValue('combustivel')} onChange={(value) => setAuto('combustivel', value)} /></Field>
                <Field label="Câmbio"><TextInput disabled={readOnly} value={autoValue('cambio')} onChange={(value) => setAuto('cambio', value)} /></Field>
                <Field label="Categoria"><TextInput disabled={readOnly} value={autoValue('categoria')} onChange={(value) => setAuto('categoria', value)} /></Field>
                <Field label="Tipo de veículo"><TextInput disabled={readOnly} value={autoValue('tipo_veiculo')} onChange={(value) => setAuto('tipo_veiculo', value)} /></Field>
              </div>
              <div className="mt-5 border-t border-border-1 pt-5">
                <h3 className="text-sm font-black text-fg-1">Informações adicionais</h3>
                <p className="mt-1 text-xs text-fg-3">Ative somente as características presentes neste veículo.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                  <ToggleSwitch label="Zero km" disabled={readOnly} checked={autoValue('zero_km') === true} onChange={(value) => setAuto('zero_km', value)} />
                  <ToggleSwitch label="Alienado" disabled={readOnly} checked={autoValue('alienado') === true} onChange={(value) => setVehicleFeature('alienado', value)} />
                  <ToggleSwitch label="Kit gás" disabled={readOnly} checked={autoValue('kit_gas') === true} onChange={(value) => setVehicleFeature('kit_gas', value)} />
                  <ToggleSwitch label="Blindado" disabled={readOnly} checked={autoValue('blindado') === true} onChange={(value) => setVehicleFeature('blindado', value)} />
                  <ToggleSwitch label="Chassi remarcado" disabled={readOnly} checked={autoValue('chassi_remarcado') === true} onChange={(value) => setVehicleFeature('chassi_remarcado', value)} />
                  <ToggleSwitch label="Antifurto" disabled={readOnly} checked={autoValue('antifurto') === true} onChange={(value) => setVehicleFeature('antifurto', value)} />
                </div>
              </div>
            </Section>

            <Section number="4" title="Avaliação de risco" description="Perguntas adicionais aparecem somente quando a resposta anterior as torna aplicáveis.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="CEP de pernoite" className="md:col-span-2"><div className="flex gap-2"><input inputMode="numeric" disabled={readOnly} value={formatCep(String(autoValue('cep_pernoite') ?? ''))} onChange={(event) => { setAuto('cep_pernoite', onlyDigits(event.target.value).slice(0, 8) || null); setCepEdited(true); assistance.cep.reset() }} onBlur={() => { if (cepEdited) void findCep() }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void findCep() } }} className={inputClass} placeholder="00000-000" /><button type="button" title="Consultar CEP" aria-label="Consultar CEP de pernoite" onClick={() => void findCep()} disabled={readOnly || assistance.cep.isPending || onlyDigits(String(autoValue('cep_pernoite') ?? '')).length !== 8} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] border border-border-1 text-accent-primary hover:bg-accent-primary-soft disabled:opacity-50">{assistance.cep.isPending ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}</button></div></Field>
                <Field label="Uso do veículo"><select disabled={readOnly} value={String(autoValue('uso') ?? '')} onChange={(event) => setAuto('uso', event.target.value || null)} className={inputClass}><option value="">Selecione</option><option value="PARTICULAR">Particular</option><option value="TRABALHO">Deslocamento ao trabalho</option><option value="COMERCIAL">Uso comercial</option><option value="APLICATIVO">Aplicativo</option><option value="ESTUDO">Deslocamento para estudo</option><option value="LAZER">Lazer</option></select></Field>
                {autoValue('uso') !== 'LAZER' && <Field label="Quilometragem mensal"><NumberInput disabled={readOnly} value={typeof autoValue('km_mensal') === 'number' ? autoValue('km_mensal') as number : null} onChange={(value) => setAuto('km_mensal', value)} /></Field>}
              </div>
              <AssistanceMessage pending={assistance.cep.isPending} success={assistance.cep.isSuccess && Boolean(assistance.cep.data)} notFound={assistance.cep.isSuccess && !assistance.cep.data} error={assistance.cep.isError} foundText={assistance.cep.data ? `${assistance.cep.data.logradouro} · ${assistance.cep.data.bairro} · ${assistance.cep.data.cidade}/${assistance.cep.data.uf}` : undefined} notFoundText="CEP não encontrado na demonstração. O CEP informado permanece disponível para preenchimento manual." />
              <div className="mt-5 grid gap-4 border-t border-border-1 pt-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Garagem na residência"><BooleanSelect disabled={readOnly} value={typeof autoValue('possui_garagem_residencia') === 'boolean' ? autoValue('possui_garagem_residencia') as boolean : null} onChange={(value) => setAuto('possui_garagem_residencia', value)} /></Field>
                {['TRABALHO', 'COMERCIAL', 'APLICATIVO'].includes(String(autoValue('uso') ?? '')) && <Field label="Garagem no trabalho"><BooleanSelect disabled={readOnly} value={typeof autoValue('possui_garagem_trabalho') === 'boolean' ? autoValue('possui_garagem_trabalho') as boolean : null} onChange={(value) => setAuto('possui_garagem_trabalho', value)} /></Field>}
                {autoValue('uso') === 'ESTUDO' && <Field label="Garagem no local de estudo"><BooleanSelect disabled={readOnly} value={typeof autoValue('possui_garagem_estudo') === 'boolean' ? autoValue('possui_garagem_estudo') as boolean : null} onChange={(value) => setAuto('possui_garagem_estudo', value)} /></Field>}
                <Field label="Possui rastreador"><BooleanSelect disabled={readOnly} value={typeof autoValue('rastreador') === 'boolean' ? autoValue('rastreador') as boolean : null} onChange={(value) => setAuto('rastreador', value)} /></Field>
              </div>
            </Section>
          </>
        ) : (
          <Section number="2" title="Risco" description={`Questionário ${draft.specialization.forma.toLocaleLowerCase('pt-BR')} preservado sem extrapolar a jornada Auto.`}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{RISK_FIELDS[draft.specialization.forma].map((field) => <RiskField key={field.key} definition={field} specialization={draft.specialization} readOnly={readOnly} onChange={(value) => set('specialization', updateSpecializationField(draft.specialization, field.key, value))} />)}</div>
          </Section>
        )}

        <CoverageSection
          number={isAuto ? '5' : '3'}
          options={coverageOptions}
          selectedById={selectedById}
          loading={lookups.isLoading}
          error={lookups.isError}
          readOnly={readOnly}
          autoFeatures={isAuto ? {
            blindado: autoValue('blindado') === true,
            kitGas: autoValue('kit_gas') === true,
          } : undefined}
          onChange={changeCoverage}
        />

        <Section number={isAuto ? '6' : '4'} title="Revisão" description="O salvamento cria pedido, especialização e preferências de cobertura em uma única operação.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReviewItem icon={<FileCheck2 size={16} />} label="Versão" value={draft.rotulo_versao || generatedLabel} />
            <ReviewItem icon={<Shield size={16} />} label="Forma" value={draft.specialization.forma} />
            <ReviewItem icon={<Umbrella size={16} />} label="Coberturas" value={`${draft.coverages.length} selecionada${draft.coverages.length === 1 ? '' : 's'}`} />
            <ReviewItem icon={<CheckCircle2 size={16} />} label="Persistência" value={readOnly ? 'Snapshot salvo' : 'Novo snapshot do pedido'} />
          </div>
          {!readOnly && (!savedCalculation || dirty) && <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border-1 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => void leave()} className={secondaryButton}>Cancelar</button><button type="submit" disabled={create.isPending || lookups.isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-xs font-black text-accent-primary-fg shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-50">{create.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {savedCalculation ? 'Gerar nova versão' : 'Salvar cálculo'}</button></div>}
        </Section>

      </div>
    </form>

        {savedCalculation && (
          <div className="space-y-5 pb-10">
          <CalculationExecutionSection
            calculation={savedCalculation}
            insurers={lookups.data?.insurers ?? []}
            canExecute={canExecute}
            draftChanged={dirty}
            versionCreating={create.isPending}
            createVersion={dirty && !readOnly ? async () => (await createSnapshot()).calculation : undefined}
            onVersionCreated={(row) => {
              savedRef.current = true
              setDirty(false)
              navigate(`/oportunidades/${opportunity.id}/calculos/${row.id}`, { replace: true })
            }}
            executionSectionNumber={isAuto ? '7' : '5'}
            resultsSectionNumber={isAuto ? '8' : '6'}
          />
          </div>
        )}
    </div>
  )
}

function InsuranceSection({ draft, insurers, sourcePolicy, readOnly, onTypeChange, onPatch }: {
  draft: CalculationCreateInput
  insurers: Array<{ id: string; nome: string }>
  sourcePolicy: SourcePolicyAssistance | null
  readOnly: boolean
  onTypeChange: (type: CalculoTipoSeguro) => void
  onPatch: (values: Partial<CalculationCreateInput>) => void
}) {
  const externalRenewal = draft.tipo_seguro === 'RENOVACAO_OUTRA'
  const renewal = draft.tipo_seguro !== 'NOVO'
  return (
    <Section number="1" title="Tipo e vigência" description="Datas e referências anteriores seguem o tipo de seguro; endosso permanece no fluxo contratual.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Tipo de seguro"><select disabled={readOnly} value={draft.tipo_seguro} onChange={(event) => onTypeChange(event.target.value as CalculoTipoSeguro)} className={inputClass}><option value="NOVO">Novo</option><option value="RENOVACAO_PROPRIA">Renovação própria</option><option value="RENOVACAO_OUTRA">Renovação de outra corretora</option></select></Field>
        <Field label="Início da vigência"><input disabled={readOnly || draft.tipo_seguro === 'RENOVACAO_PROPRIA'} type="date" value={draft.vigencia_inicio ?? ''} onChange={(event) => { const start = event.target.value || null; onPatch({ vigencia_inicio: start, vigencia_fim: addCalendarYear(start) }) }} className={inputClass} /></Field>
        <Field label="Fim da vigência"><div className="relative"><input readOnly value={fmtDate(draft.vigencia_fim)} className={`${inputClass} pr-9`} /><CalendarRange size={14} className="pointer-events-none absolute right-3 top-3.5 text-fg-4" /></div><span className="mt-1 block text-[11px] text-fg-3">Derivado em um ano-calendário.</span></Field>
      </div>

      {draft.tipo_seguro === 'RENOVACAO_PROPRIA' && (
        sourcePolicy ? <div className="mt-5 flex flex-col gap-3 rounded-[6px] bg-accent-primary-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Shield size={17} className="mt-0.5 shrink-0 text-accent-primary" /><div><p className="font-black text-fg-1">Dados vindos da apólice de origem</p><p className="mt-1 text-xs text-fg-3">{sourcePolicy.seguradora_nome ?? 'Seguradora não informada'} · {sourcePolicy.numero_apolice ?? 'sem número'} · vigência final {sourcePolicy.vigencia_fim ?? 'não informada'}</p></div></div><span className="rounded-full bg-bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-primary">revisar somente mudanças</span></div>
          : <div className="mt-5 rounded-[6px] border border-signal-warning/30 bg-signal-warning/10 p-4 text-sm font-bold text-fg-2">A oportunidade não possui uma apólice de origem disponível. Selecione outro tipo de seguro ou vincule a renovação no fluxo contratual.</div>
      )}

      {externalRenewal && (
        <div className="mt-5 grid gap-4 border-t border-border-1 pt-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Seguradora anterior *"><select required disabled={readOnly} value={draft.seguradora_anterior_id ?? ''} onChange={(event) => onPatch({ seguradora_anterior_id: event.target.value || null })} className={inputClass}><option value="">Selecione</option>{insurers.map((insurer) => <option key={insurer.id} value={insurer.id}>{insurer.nome}</option>)}</select></Field>
          <Field label="Apólice anterior *"><input required disabled={readOnly} value={draft.numero_apolice_anterior ?? ''} onChange={(event) => onPatch({ numero_apolice_anterior: event.target.value || null })} className={inputClass} /></Field>
          <Field label="Fim da vigência anterior *"><input required disabled={readOnly} type="date" value={draft.vigencia_fim_anterior ?? ''} onChange={(event) => { const previousEnd = event.target.value || null; onPatch({ vigencia_fim_anterior: previousEnd, vigencia_inicio: previousEnd, vigencia_fim: addCalendarYear(previousEnd) }) }} className={inputClass} /></Field>
        </div>
      )}

      {renewal && (
        <div className="mt-5 grid gap-4 border-t border-border-1 pt-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Classe de bônus"><select disabled={readOnly} value={draft.bonus ?? ''} onChange={(event) => onPatch({ bonus: event.target.value === '' ? null : Number(event.target.value) })} className={inputClass}><option value="">Selecione</option>{Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>{value === 0 ? '0 · sem bônus' : value}</option>)}</select></Field>
          <Field label="Quantidade de sinistros"><NumberInput disabled={readOnly} value={draft.qtd_sinistros} onChange={(value) => onPatch({ qtd_sinistros: value })} /></Field>
        </div>
      )}
    </Section>
  )
}

function CoverageSection({ number, options, selectedById, loading, error, readOnly, autoFeatures, onChange }: {
  number: string
  options: Array<{ id: string; codigo: string | null; nome: string; tipo_cobertura: string | null }>
  selectedById: Map<string, CalculationCoverageInput>
  loading: boolean
  error: boolean
  readOnly: boolean
  autoFeatures?: { blindado: boolean; kitGas: boolean }
  onChange: (id: string, values: Partial<CalculationCoverageInput>, selected: boolean) => void
}) {
  const groups = useMemo(() => {
    const definitions = [
      { id: 'principal', title: 'Cobertura principal' },
      { id: 'responsabilidade', title: 'Responsabilidade civil' },
      { id: 'passageiros', title: 'Passageiros' },
      { id: 'servicos', title: 'Assistências e serviços' },
      { id: 'adicionais', title: 'Proteções adicionais' },
    ]
    const grouped = new Map(definitions.map((definition) => [definition.id, [] as typeof options]))
    options.forEach((option) => {
      const code = option.codigo?.toLowerCase() ?? ''
      if (code === 'kit-gas' && !autoFeatures?.kitGas) return
      if (code === 'blindagem' && !autoFeatures?.blindado) return
      const type = option.tipo_cobertura?.toLowerCase() ?? ''
      const group = code === 'casco' || type === 'basica'
        ? 'principal'
        : code === 'rcf-v' || code.startsWith('danos-morais') || code.startsWith('danos-materiais') || code.startsWith('danos-corporais')
          ? 'responsabilidade'
          : code.includes('passageiro') || code.includes('morte-invalidez')
            ? 'passageiros'
            : ['assistencia', 'servico'].includes(type) || code.includes('assist') || code.includes('vidro') || code.includes('carro-reserva')
              ? 'servicos'
              : 'adicionais'
      grouped.get(group)?.push(option)
    })
    return definitions
      .map((definition) => ({ ...definition, options: grouped.get(definition.id) ?? [] }))
      .filter((group) => group.options.length > 0)
  }, [autoFeatures?.blindado, autoFeatures?.kitGas, options])

  return (
    <Section number={number} title="Coberturas desejadas" description="Preencha diretamente as preferências. Valor zero e opções “Sem cobertura” não serão enviados para contratação.">
      {loading ? <div className="h-24 animate-pulse rounded-[6px] bg-bg-surface-2" /> : error ? <p className="rounded-[6px] bg-signal-danger/10 p-4 text-sm font-bold text-signal-danger">Não foi possível carregar o catálogo de coberturas.</p> : options.length === 0 ? <p className="rounded-[6px] border border-dashed border-border-2 p-5 text-sm text-fg-3">Nenhuma cobertura ativa foi cadastrada para este ramo. O cálculo pode ser salvo sem preferências de cobertura.</p> : (
        <div className="space-y-6">
          {groups.map((group) => <div key={group.id}>
            <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-fg-2">{group.title}</h3>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
              {group.options.map((catalog) => {
                const coverage = selectedById.get(catalog.id)
                const code = catalog.codigo?.toLowerCase() ?? ''
                const type = catalog.tipo_cobertura?.toLowerCase() ?? ''
                const isCasco = code === 'casco'
                const isService = ['assistencia', 'servico'].includes(type) || code.includes('assist') || code.includes('vidro') || code.includes('carro-reserva')
                if (isCasco) {
                  const percentage = coverage?.percentual_fipe_solicitado ?? 0
                  return <div key={catalog.id} className="contents">
                    <Field label="Casco — percentual FIPE (%)"><NumberInput disabled={readOnly} value={percentage} onChange={(value) => {
                      const next = value ?? 0
                      onChange(catalog.id, {
                        percentual_fipe_solicitado: next,
                        franquia_tipo_solicitado: coverage?.franquia_tipo_solicitado ?? 'NORMAL',
                      }, next > 0)
                    }} step="0.01" /></Field>
                    <Field label="Casco — franquia"><select disabled={readOnly || percentage <= 0} value={coverage?.franquia_tipo_solicitado ?? 'NORMAL'} onChange={(event) => onChange(catalog.id, { franquia_tipo_solicitado: event.target.value }, percentage > 0)} className={inputClass}><option value="NORMAL">Normal</option><option value="REDUZIDA">Reduzida</option><option value="MAJORADA">Majorada</option></select></Field>
                  </div>
                }
                if (isService) {
                  const selectedOption = coverage ? coverage.opcao_solicitada || 'PADRAO' : ''
                  const emptyLabel = code.includes('assist')
                    ? 'Sem assistência'
                    : code.includes('carro-reserva')
                      ? 'Sem carro reserva'
                      : 'Sem cobertura'
                  const selectedLabel = code.includes('assist')
                    ? 'Com assistência'
                    : code.includes('carro-reserva')
                      ? 'Com carro reserva'
                      : 'Com cobertura'
                  return <div key={catalog.id} className="contents">
                    <Field label={catalog.nome}><select disabled={readOnly} value={selectedOption} onChange={(event) => {
                      const next = event.target.value
                      onChange(catalog.id, { opcao_solicitada: next || null }, Boolean(next))
                    }} className={inputClass}><option value="">{emptyLabel}</option><option value="PADRAO">{selectedLabel}</option></select></Field>
                    {code.includes('carro-reserva') && selectedOption && <Field label="Carro reserva — diárias"><NumberInput disabled={readOnly} value={coverage?.quantidade_solicitada ?? 0} onChange={(value) => onChange(catalog.id, { quantidade_solicitada: value ?? 0 }, true)} /></Field>}
                  </div>
                }
                const amount = coverage?.limite_solicitado ?? 0
                return <Field key={catalog.id} label={catalog.nome}><CurrencyInput disabled={readOnly} value={amount} onChange={(value) => {
                  const next = value ?? 0
                  onChange(catalog.id, { limite_solicitado: next }, next > 0)
                }} /></Field>
              })}
            </div>
          </div>)}
        </div>
      )}
    </Section>
  )
}

function AssistanceMessage({ pending, success, notFound, error, foundText, notFoundText }: { pending: boolean; success: boolean; notFound: boolean; error: boolean; foundText?: string; notFoundText: string }) {
  if (!pending && !success && !notFound && !error) return null
  const tone = error ? 'text-signal-danger' : notFound ? 'text-signal-warning' : success ? 'text-signal-success' : 'text-accent-primary'
  return <p aria-live="polite" className={`mt-3 flex items-center gap-2 text-xs font-bold ${tone}`}>{pending ? <Loader2 size={13} className="animate-spin" /> : success ? <CheckCircle2 size={13} /> : <Search size={13} />}{pending ? 'Consultando fixture local…' : error ? 'A consulta simulada falhou. Continue pelo preenchimento manual.' : success ? foundText : notFoundText}</p>
}

function Section({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return <section className="rounded-[8px] border border-border-1 bg-bg-surface p-4 shadow-[var(--shadow-1)] sm:p-5"><div className="mb-5 flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-black text-accent-primary-fg">{number}</span><div><h2 className="text-sm font-black uppercase tracking-wide text-fg-1">{title}</h2><p className="mt-0.5 max-w-3xl text-xs text-fg-3">{description}</p></div></div>{children}</section>
}

function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={className}><span className={labelClass}>{label}</span>{children}</label>
}

function TextInput({ value, onChange, disabled, type = 'text' }: { value: unknown; onChange: (value: string | null) => void; disabled?: boolean; type?: 'text' | 'date' }) {
  return <input type={type} disabled={disabled} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || null)} className={inputClass} />
}

function NumberInput({ value, onChange, disabled, step = '1' }: { value: number | null; onChange: (value: number | null) => void; disabled?: boolean; step?: string }) {
  return <input type="number" min="0" step={step} disabled={disabled} value={value ?? ''} onChange={(event) => { const next = event.target.value; onChange(next === '' ? null : Number(next)) }} className={inputClass} />
}

function CurrencyInput({ value, onChange, disabled }: { value: number | null; onChange: (value: number | null) => void; disabled?: boolean }) {
  return <input inputMode="numeric" disabled={disabled} value={formatCurrency(value)} onChange={(event) => onChange(parseCurrencyInput(event.target.value))} className={inputClass} placeholder="R$ 0,00" />
}

function BooleanSelect({ value, onChange, disabled }: { value: boolean | null; onChange: (value: boolean | null) => void; disabled?: boolean }) {
  return <select disabled={disabled} value={value === null ? '' : value ? 'sim' : 'nao'} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'sim')} className={inputClass}><option value="">Não informado</option><option value="sim">Sim</option><option value="nao">Não</option></select>
}

function ToggleSwitch({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2.5 text-left focus-visible:border-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <span className="text-sm font-semibold text-fg-1">{label}</span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform ${
          checked ? 'bg-accent-primary after:translate-x-5' : 'bg-border-2'
        }`}
      />
    </button>
  )
}

function RiskField({ definition, specialization, readOnly, onChange }: { definition: RiskFieldDefinition; specialization: CalculationCreateInput['specialization']; readOnly: boolean; onChange: (value: string | number | boolean | null) => void }) {
  const record = specialization.data as Record<string, string | number | boolean | null>
  const value = record[definition.key] ?? null
  const className = definition.wide ? 'md:col-span-2' : ''
  if (definition.type === 'boolean') return <Field label={definition.label} className={className}><BooleanSelect disabled={readOnly} value={typeof value === 'boolean' ? value : null} onChange={onChange} /></Field>
  if (definition.type === 'number') return <Field label={definition.label} className={className}><NumberInput disabled={readOnly} value={typeof value === 'number' ? value : null} step={definition.step} onChange={onChange} /></Field>
  if (definition.type === 'textarea') return <Field label={definition.label} className={className}><textarea disabled={readOnly} rows={3} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || null)} className={`${inputClass} resize-y`} /></Field>
  return <Field label={definition.label} className={className}><input disabled={readOnly} type={definition.type} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || null)} className={inputClass} /></Field>
}

function ReviewItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-[6px] bg-bg-surface-2 p-3"><div className="flex items-center gap-2 text-accent-primary">{icon}<span className="text-[10px] font-black uppercase tracking-wider text-fg-4">{label}</span></div><p className="mt-2 truncate text-sm font-black text-fg-1">{value}</p></div>
}

function PageSkeleton() {
  return <div className="space-y-4" aria-label="Carregando cálculo"><div className="h-20 animate-pulse rounded-[8px] bg-bg-surface-2" />{[1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-[8px] bg-bg-surface-2" />)}</div>
}

function PageState({ title, description, onBack }: { title: string; description: string; onBack: () => void }) {
  return <div className="flex min-h-[55vh] items-center justify-center"><div className="max-w-lg rounded-[8px] border border-border-1 bg-bg-surface p-7 text-center shadow-[var(--shadow-1)]"><Car size={28} className="mx-auto text-accent-primary" /><h1 className="mt-4 text-lg font-black text-fg-1">{title}</h1><p className="mt-2 text-sm text-fg-3">{description}</p><button type="button" onClick={onBack} className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 px-4 py-2.5 text-xs font-black text-accent-primary hover:bg-accent-primary-soft"><ArrowLeft size={14} /> Voltar</button></div></div>
}
