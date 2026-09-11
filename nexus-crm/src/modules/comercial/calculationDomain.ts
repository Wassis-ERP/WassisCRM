import type {
  CalcAutoRow,
  CalcCondominioRow,
  CalcDiversosRow,
  CalcEmpresaRow,
  CalcResidenciaRow,
  CalcVidaRow,
  CalculoCoberturaRow,
  CalculoForma,
  CalculoOrigem,
  CalculoRow,
  CalculoTipoSeguro,
  Database,
} from '../../types/database'
import { formatPlate } from '../../utils/masks'

type OpportunityRow = Database['public']['Tables']['oportunidades']['Row']
type RamoRow = Database['public']['Tables']['ramos']['Row']
type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoraRow = Database['public']['Tables']['seguradoras']['Row']
type CoberturaCatalogoRow = Database['public']['Tables']['coberturas_catalogo']['Row']
type ApoliceRow = Database['public']['Tables']['apolices']['Row']

type WithoutCalculationId<Row extends { calculo_id: string }> = Omit<Row, 'calculo_id'>

export type CalculationSpecializationInput =
  | { forma: 'AUTO'; data: WithoutCalculationId<CalcAutoRow> }
  | { forma: 'RESIDENCIA'; data: WithoutCalculationId<CalcResidenciaRow> }
  | { forma: 'CONDOMINIO'; data: WithoutCalculationId<CalcCondominioRow> }
  | { forma: 'VIDA'; data: WithoutCalculationId<CalcVidaRow> }
  | { forma: 'EMPRESA'; data: WithoutCalculationId<CalcEmpresaRow> }
  | { forma: 'DIVERSOS'; data: WithoutCalculationId<CalcDiversosRow> }

export type CalculationSpecialization =
  | { forma: 'AUTO'; data: CalcAutoRow }
  | { forma: 'RESIDENCIA'; data: CalcResidenciaRow }
  | { forma: 'CONDOMINIO'; data: CalcCondominioRow }
  | { forma: 'VIDA'; data: CalcVidaRow }
  | { forma: 'EMPRESA'; data: CalcEmpresaRow }
  | { forma: 'DIVERSOS'; data: CalcDiversosRow }

export type CalculationCoverageInput = Omit<CalculoCoberturaRow, 'id' | 'calculo_id'> & {
  cobertura_id: string
}

export type CalculationCreateInput = {
  oportunidade_id: string
  ramo_id: string
  segurado_id: string | null
  seguradora_anterior_id: string | null
  origem: CalculoOrigem
  comissao_sugerida_pct: number | null
  rotulo_versao: string | null
  tipo_seguro: CalculoTipoSeguro
  bonus: number | null
  qtd_sinistros: number | null
  qtd_sinistros_perda_parcial: number | null
  transferiu_titularidade: boolean | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  vigencia_fim_anterior: string | null
  numero_apolice_anterior: string | null
  codigo_identificacao_anterior: string | null
  status_apolice_anterior: string | null
  nota_interna: string | null
  specialization: CalculationSpecializationInput
  coverages: CalculationCoverageInput[]
}

export type CalculationAggregate = {
  calculation: CalculoRow
  specialization: CalculationSpecialization
  coverages: CalculoCoberturaRow[]
}

export type CalculationStore = {
  opportunities: OpportunityRow[]
  branches: Array<{ id: string; tenant_id: string }>
  branchesAllowed?: string[]
  lines: RamoRow[]
  insureds: SeguradoRow[]
  insurers: SeguradoraRow[]
  policies: ApoliceRow[]
  coverageCatalog: CoberturaCatalogoRow[]
  calculations: CalculoRow[]
  autos: CalcAutoRow[]
  residences: CalcResidenciaRow[]
  condominiums: CalcCondominioRow[]
  lives: CalcVidaRow[]
  companies: CalcEmpresaRow[]
  diverse: CalcDiversosRow[]
  coverages: CalculoCoberturaRow[]
}

export type CalculationDependencies = {
  now: () => string
  newId: () => string
}

export type CalculationListItem = {
  id: string
  versionLabel: string
  lineName: string
  insuredName: string
  origin: CalculoRow['origem']
  validityStart: string | null
  validityEnd: string | null
  suggestedCommission: number | null
  riskSummary: string
  coverageCount: number
  createdAt: string | null
}

const FORMS: readonly CalculoForma[] = ['AUTO', 'RESIDENCIA', 'CONDOMINIO', 'VIDA', 'EMPRESA', 'DIVERSOS']

function isKnownForm(value: string | null): value is CalculoForma {
  return value !== null && FORMS.includes(value as CalculoForma)
}

const INSURANCE_TYPE_LABELS: Record<CalculoTipoSeguro, string> = {
  NOVO: 'Novo',
  RENOVACAO_PROPRIA: 'Renovação própria',
  RENOVACAO_OUTRA: 'Renovação de outra corretora',
}

export function addCalendarYear(date: string | null): string | null {
  if (!date) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  const year = Number(match[1]) + 1
  const month = Number(match[2])
  const day = Number(match[3])
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year.toString().padStart(4, '0')}-${match[2]}-${Math.min(day, lastDay).toString().padStart(2, '0')}`
}

function formatDatePtBr(date: string | null): string | null {
  const match = date ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(date) : null
  return match ? `${match[3]}/${match[2]}/${match[1]}` : null
}

export function buildCalculationVersionLabel(input: CalculationCreateInput): string {
  const risk = input.specialization.forma === 'AUTO'
    ? (input.specialization.data.placa ? formatPlate(input.specialization.data.placa) : null)
      || input.specialization.data.modelo
      || input.specialization.data.codigo_fipe
    : null
  const parts = [
    input.specialization.forma === 'AUTO' ? 'Auto' : input.specialization.forma,
    risk?.trim() || null,
    INSURANCE_TYPE_LABELS[input.tipo_seguro],
    formatDatePtBr(input.vigencia_inicio),
  ].filter((value): value is string => Boolean(value))
  return parts.join(' · ')
}

function requireFiniteNonNegative(value: number | null, label: string) {
  if (value === null) return
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} deve ser um número maior ou igual a zero.`)
}

function validateSpecializationNumbers(specialization: CalculationSpecializationInput) {
  for (const [field, value] of Object.entries(specialization.data)) {
    if (typeof value === 'number') requireFiniteNonNegative(value, field)
  }
}

function validateInput(store: CalculationStore, input: CalculationCreateInput) {
  const opportunity = store.opportunities.find((row) => row.id === input.oportunidade_id)
  if (!opportunity) throw new Error('Oportunidade não encontrada.')
  if (!opportunity.ramo_id) throw new Error('Defina o ramo na Visão geral antes de iniciar o cálculo.')
  if (opportunity.ramo_id !== input.ramo_id) throw new Error('O ramo do cálculo deve ser o mesmo da oportunidade.')
  if (store.branchesAllowed && !store.branchesAllowed.includes(opportunity.filial_id)) {
    throw new Error('A oportunidade não pertence a uma corretora acessível.')
  }

  const branch = store.branches.find((row) => row.id === opportunity.filial_id)
  if (!branch || branch.tenant_id !== opportunity.tenant_id) throw new Error('Contexto da corretora inválido.')

  const line = store.lines.find((row) => row.id === input.ramo_id)
  if (!line || line.tenant_id !== opportunity.tenant_id) throw new Error('Ramo indisponível para esta oportunidade.')
  if (!isKnownForm(line.forma_calculo)) throw new Error('O ramo não possui uma forma de cálculo suportada.')
  if (line.forma_calculo !== input.specialization.forma) throw new Error('A especialização não corresponde à forma de cálculo do ramo.')

  if (!input.vigencia_inicio) throw new Error('Informe o início da vigência.')
  if (input.vigencia_inicio && input.vigencia_fim && input.vigencia_fim < input.vigencia_inicio) {
    throw new Error('O fim da vigência não pode ser anterior ao início.')
  }
  if (input.vigencia_fim !== addCalendarYear(input.vigencia_inicio)) {
    throw new Error('O fim da vigência deve corresponder a um ano-calendário após o início.')
  }

  requireFiniteNonNegative(input.comissao_sugerida_pct, 'Comissão sugerida')
  if (input.bonus !== null && (!Number.isInteger(input.bonus) || input.bonus < 0 || input.bonus > 10)) {
    throw new Error('A classe de bônus deve ser um número inteiro de 0 a 10.')
  }
  requireFiniteNonNegative(input.qtd_sinistros, 'Quantidade de sinistros')
  requireFiniteNonNegative(input.qtd_sinistros_perda_parcial, 'Sinistros com perda parcial')
  validateSpecializationNumbers(input.specialization)

  if (input.tipo_seguro === 'NOVO') {
    if (input.seguradora_anterior_id || input.numero_apolice_anterior || input.vigencia_fim_anterior || input.bonus !== null) {
      throw new Error('Novo seguro não deve carregar dados de apólice anterior ou bônus.')
    }
  }
  if (input.tipo_seguro === 'RENOVACAO_PROPRIA') {
    if (!opportunity.apolice_origem_id) throw new Error('A renovação própria exige uma apólice de origem vinculada à oportunidade.')
    const sourcePolicy = store.policies.find((row) => row.id === opportunity.apolice_origem_id)
    if (!sourcePolicy) throw new Error('A apólice de origem não está disponível.')
    if (sourcePolicy.vigencia_fim && input.vigencia_inicio !== sourcePolicy.vigencia_fim) {
      throw new Error('A renovação própria deve iniciar na data final da apólice de origem.')
    }
    if (input.seguradora_anterior_id !== sourcePolicy.seguradora_id) throw new Error('A seguradora anterior deve vir da apólice de origem.')
    if (input.numero_apolice_anterior !== sourcePolicy.numero_apolice) throw new Error('O número anterior deve vir da apólice de origem.')
  }
  if (input.tipo_seguro === 'RENOVACAO_OUTRA') {
    if (!input.seguradora_anterior_id || !input.numero_apolice_anterior || !input.vigencia_fim_anterior) {
      throw new Error('Informe seguradora, número e fim da vigência da apólice anterior.')
    }
  }

  if (input.segurado_id) {
    const insured = store.insureds.find((row) => row.id === input.segurado_id)
    if (!insured || insured.tenant_id !== opportunity.tenant_id || insured.filial_id !== opportunity.filial_id) {
      throw new Error('O cotado precisa pertencer à mesma corretora da oportunidade.')
    }
  }
  if (input.seguradora_anterior_id) {
    const insurer = store.insurers.find((row) => row.id === input.seguradora_anterior_id)
    if (!insurer || insurer.tenant_id !== opportunity.tenant_id) throw new Error('Seguradora anterior inválida.')
  }

  const coverageIds = new Set<string>()
  input.coverages.forEach((coverage) => {
    if (coverageIds.has(coverage.cobertura_id)) throw new Error('A mesma cobertura não pode ser adicionada duas vezes.')
    coverageIds.add(coverage.cobertura_id)
    const catalogItem = store.coverageCatalog.find((row) => row.id === coverage.cobertura_id)
    if (!catalogItem || catalogItem.ramo_id !== input.ramo_id) throw new Error('Cobertura incompatível com o ramo do cálculo.')
    requireFiniteNonNegative(coverage.limite_solicitado, 'Limite solicitado')
    requireFiniteNonNegative(coverage.percentual_fipe_solicitado, 'Percentual FIPE solicitado')
    requireFiniteNonNegative(coverage.quantidade_solicitada, 'Quantidade solicitada')
  })
}

function pushSpecialization(store: CalculationStore, calculationId: string, specialization: CalculationSpecializationInput) {
  switch (specialization.forma) {
    case 'AUTO': store.autos.push({ calculo_id: calculationId, ...specialization.data }); break
    case 'RESIDENCIA': store.residences.push({ calculo_id: calculationId, ...specialization.data }); break
    case 'CONDOMINIO': store.condominiums.push({ calculo_id: calculationId, ...specialization.data }); break
    case 'VIDA': store.lives.push({ calculo_id: calculationId, ...specialization.data }); break
    case 'EMPRESA': store.companies.push({ calculo_id: calculationId, ...specialization.data }); break
    case 'DIVERSOS': store.diverse.push({ calculo_id: calculationId, ...specialization.data }); break
  }
}

function snapshotLengths(store: CalculationStore) {
  return {
    calculations: store.calculations.length,
    autos: store.autos.length,
    residences: store.residences.length,
    condominiums: store.condominiums.length,
    lives: store.lives.length,
    companies: store.companies.length,
    diverse: store.diverse.length,
    coverages: store.coverages.length,
  }
}

function restoreLengths(store: CalculationStore, lengths: ReturnType<typeof snapshotLengths>) {
  store.calculations.splice(lengths.calculations)
  store.autos.splice(lengths.autos)
  store.residences.splice(lengths.residences)
  store.condominiums.splice(lengths.condominiums)
  store.lives.splice(lengths.lives)
  store.companies.splice(lengths.companies)
  store.diverse.splice(lengths.diverse)
  store.coverages.splice(lengths.coverages)
}

export function createCalculationAtomic(
  store: CalculationStore,
  input: CalculationCreateInput,
  dependencies: CalculationDependencies,
): CalculationAggregate {
  validateInput(store, input)
  const lengths = snapshotLengths(store)
  const calculationId = dependencies.newId()

  try {
    const calculation: CalculoRow = {
      id: calculationId,
      oportunidade_id: input.oportunidade_id,
      ramo_id: input.ramo_id,
      segurado_id: input.segurado_id,
      seguradora_anterior_id: input.seguradora_anterior_id,
      origem: input.origem,
      comissao_sugerida_pct: input.comissao_sugerida_pct,
      rotulo_versao: buildCalculationVersionLabel(input),
      tipo_seguro: input.tipo_seguro,
      bonus: input.bonus,
      qtd_sinistros: input.qtd_sinistros,
      qtd_sinistros_perda_parcial: input.qtd_sinistros_perda_parcial,
      transferiu_titularidade: input.transferiu_titularidade,
      vigencia_inicio: input.vigencia_inicio,
      vigencia_fim: input.vigencia_fim,
      vigencia_fim_anterior: input.vigencia_fim_anterior,
      numero_apolice_anterior: input.numero_apolice_anterior,
      codigo_identificacao_anterior: input.codigo_identificacao_anterior,
      status_apolice_anterior: input.status_apolice_anterior,
      nota_interna: input.nota_interna,
      criado_em: dependencies.now(),
    }
    store.calculations.push(calculation)
    pushSpecialization(store, calculationId, input.specialization)
    input.coverages.forEach((coverage) => {
      store.coverages.push({ id: dependencies.newId(), calculo_id: calculationId, ...coverage, selecionada: true })
    })
    return getCalculationAggregate(store, calculationId)
  } catch (error) {
    restoreLengths(store, lengths)
    throw error
  }
}

function getCalculationSpecializations(store: CalculationStore, calculationId: string): CalculationSpecialization[] {
  const rows: CalculationSpecialization[] = []
  const auto = store.autos.find((row) => row.calculo_id === calculationId)
  const residence = store.residences.find((row) => row.calculo_id === calculationId)
  const condominium = store.condominiums.find((row) => row.calculo_id === calculationId)
  const life = store.lives.find((row) => row.calculo_id === calculationId)
  const company = store.companies.find((row) => row.calculo_id === calculationId)
  const diverse = store.diverse.find((row) => row.calculo_id === calculationId)
  if (auto) rows.push({ forma: 'AUTO', data: auto })
  if (residence) rows.push({ forma: 'RESIDENCIA', data: residence })
  if (condominium) rows.push({ forma: 'CONDOMINIO', data: condominium })
  if (life) rows.push({ forma: 'VIDA', data: life })
  if (company) rows.push({ forma: 'EMPRESA', data: company })
  if (diverse) rows.push({ forma: 'DIVERSOS', data: diverse })
  return rows
}

export function getCalculationAggregate(store: CalculationStore, calculationId: string): CalculationAggregate {
  const calculation = store.calculations.find((row) => row.id === calculationId)
  if (!calculation) throw new Error('Cálculo não encontrado.')
  const specializations = getCalculationSpecializations(store, calculationId)
  if (specializations.length !== 1) throw new Error('O cálculo precisa possuir exatamente uma especialização.')
  return {
    calculation,
    specialization: specializations[0],
    coverages: store.coverages.filter((row) => row.calculo_id === calculationId),
  }
}

export function duplicateCalculationInput(aggregate: CalculationAggregate): CalculationCreateInput {
  const { calculation, specialization, coverages } = aggregate
  if (!calculation.origem) throw new Error('Informe a origem do cálculo antes de duplicar.')
  const data = { ...specialization.data }
  delete (data as { calculo_id?: string }).calculo_id
  return {
    oportunidade_id: calculation.oportunidade_id,
    ramo_id: calculation.ramo_id,
    segurado_id: calculation.segurado_id,
    seguradora_anterior_id: calculation.seguradora_anterior_id,
    origem: calculation.origem,
    comissao_sugerida_pct: calculation.comissao_sugerida_pct,
    rotulo_versao: null,
    tipo_seguro: calculation.tipo_seguro ?? 'NOVO',
    bonus: calculation.bonus,
    qtd_sinistros: calculation.qtd_sinistros,
    qtd_sinistros_perda_parcial: calculation.qtd_sinistros_perda_parcial,
    transferiu_titularidade: calculation.transferiu_titularidade,
    vigencia_inicio: calculation.vigencia_inicio,
    vigencia_fim: calculation.vigencia_fim,
    vigencia_fim_anterior: calculation.vigencia_fim_anterior,
    numero_apolice_anterior: calculation.numero_apolice_anterior,
    codigo_identificacao_anterior: calculation.codigo_identificacao_anterior,
    status_apolice_anterior: calculation.status_apolice_anterior,
    nota_interna: calculation.nota_interna,
    specialization: { forma: specialization.forma, data } as CalculationSpecializationInput,
    coverages: coverages.map((coverage) => ({
      cobertura_id: coverage.cobertura_id ?? '',
      selecionada: coverage.selecionada,
      limite_solicitado: coverage.limite_solicitado,
      percentual_fipe_solicitado: coverage.percentual_fipe_solicitado,
      franquia_tipo_solicitado: coverage.franquia_tipo_solicitado,
      opcao_solicitada: coverage.opcao_solicitada,
      quantidade_solicitada: coverage.quantidade_solicitada,
      observacao_transmitida: coverage.observacao_transmitida,
    })).filter((coverage) => Boolean(coverage.cobertura_id)),
  }
}

function riskSummary(specialization: CalculationSpecialization): string {
  switch (specialization.forma) {
    case 'AUTO': return [specialization.data.marca, specialization.data.modelo, specialization.data.placa].filter(Boolean).join(' · ') || 'Veículo sem identificação'
    case 'RESIDENCIA': return [specialization.data.endereco, specialization.data.cidade].filter(Boolean).join(' · ') || 'Imóvel sem identificação'
    case 'CONDOMINIO': return specialization.data.nome_condominio || specialization.data.endereco || 'Condomínio sem identificação'
    case 'VIDA': return [specialization.data.profissao, specialization.data.capital_desejado ? `Capital ${specialization.data.capital_desejado}` : null].filter(Boolean).join(' · ') || 'Vida sem identificação'
    case 'EMPRESA': return specialization.data.razao_social || specialization.data.atividade || 'Empresa sem identificação'
    case 'DIVERSOS': return specialization.data.categoria || specialization.data.descricao_risco || 'Risco diverso sem identificação'
  }
}

export function listCalculationItems(store: CalculationStore, opportunityId: string): CalculationListItem[] {
  const opportunity = store.opportunities.find((row) => row.id === opportunityId)
  return store.calculations
    .filter((row) => row.oportunidade_id === opportunityId)
    .map((calculation) => {
      const aggregate = getCalculationAggregate(store, calculation.id)
      const insured = calculation.segurado_id ? store.insureds.find((row) => row.id === calculation.segurado_id) : null
      const line = store.lines.find((row) => row.id === calculation.ramo_id)
      return {
        id: calculation.id,
        versionLabel: calculation.rotulo_versao || 'Versão sem rótulo',
        lineName: line?.nome ?? 'Ramo não encontrado',
        insuredName: insured?.nome ?? opportunity?.lead_nome ?? 'Lead sem nome',
        origin: calculation.origem,
        validityStart: calculation.vigencia_inicio,
        validityEnd: calculation.vigencia_fim,
        suggestedCommission: calculation.comissao_sugerida_pct,
        riskSummary: riskSummary(aggregate.specialization),
        coverageCount: aggregate.coverages.length,
        createdAt: calculation.criado_em,
      }
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id.localeCompare(a.id))
}
