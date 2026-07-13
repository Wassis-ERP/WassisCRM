import type { ComissaoTipo, Database } from '../types/database'

export type ReceiptGrade = Database['public']['Tables']['recebimento_grades']['Row']
export type ReceiptGradeEvent = Database['public']['Tables']['recebimento_grade_parcelas']['Row']

export type ReceiptGradeIssue = {
  code: string
  message: string
  eventId?: string
}

export type ReceiptGradeValidation = {
  applicable: boolean
  issues: ReceiptGradeIssue[]
  activeEvents: ReceiptGradeEvent[]
}

export type ReceiptGradeSimulationInput = {
  totalPremium: number
  netPremium: number
  commissionPct: number
  agencyCommissionPct: number
  installmentCount: number
  firstDueDate: string
}

export type ReceiptGradeSimulationEvent = {
  number: number
  commissionType: ComissaoTipo
  percentage: number
  percentageOrigin: 'GRADE' | 'PROPOSTA_COMISSAO' | 'PROPOSTA_AGENCIAMENTO'
  calculationBase: number
  expectedDate: string
  expectedValue: number
}

const finiteTypes = new Set(['ANTECIPADO_N', 'ESGOTAMENTO', 'NA_PARCELA'])

export function addDaysIso(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00`)
  parsed.setDate(parsed.getDate() + days)
  return parsed.toISOString().slice(0, 10)
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function validateReceiptGrade(
  grade: ReceiptGrade,
  events: ReceiptGradeEvent[],
  catalog: ReceiptGrade[] = [],
): ReceiptGradeValidation {
  const issues: ReceiptGradeIssue[] = []
  const activeEvents = events
    .filter((event) => event.ativo)
    .sort((a, b) => a.numero - b.numero)

  if (!grade.ativo) issues.push({ code: 'INACTIVE', message: 'A grade está inativa.' })
  if (!grade.nome.trim()) issues.push({ code: 'NAME_REQUIRED', message: 'Informe o nome da grade.' })
  if (!grade.seguradora_id) issues.push({ code: 'INSURER_REQUIRED', message: 'Informe a seguradora.' })
  if (!grade.ramo_id) issues.push({ code: 'BRANCH_REQUIRED', message: 'Informe o ramo.' })
  if (!Number.isInteger(grade.qtd_parcelas) || grade.qtd_parcelas < 1) {
    issues.push({ code: 'INVALID_COUNT', message: 'A quantidade de eventos deve ser um inteiro maior que zero.' })
  }

  const duplicate = catalog.find((candidate) =>
    candidate.id !== grade.id
    && candidate.ativo
    && candidate.seguradora_id === grade.seguradora_id
    && candidate.ramo_id === grade.ramo_id
    && candidate.nome.trim().toLocaleLowerCase('pt-BR') === grade.nome.trim().toLocaleLowerCase('pt-BR'))
  if (duplicate) issues.push({ code: 'DUPLICATE_NAME', message: 'Já existe uma grade ativa com este nome para a seguradora e o ramo.' })

  if (grade.tipo === 'VITALICIO_PCT_DEFINIDO' && grade.percentual_default == null) {
    issues.push({ code: 'DEFAULT_PERCENT_REQUIRED', message: 'Informe o percentual padrão para o vitalício com percentual definido.' })
  }
  if (grade.percentual_default != null && grade.percentual_default < 0) {
    issues.push({ code: 'INVALID_DEFAULT_PERCENT', message: 'O percentual padrão não pode ser negativo.' })
  }
  if (!activeEvents.length) issues.push({ code: 'NO_EVENTS', message: 'Inclua ao menos um evento ativo no cronograma.' })

  const numbers = new Set<number>()
  activeEvents.forEach((event) => {
    if (!Number.isInteger(event.numero) || event.numero < 1) {
      issues.push({ code: 'INVALID_EVENT_NUMBER', message: 'O número do evento deve ser um inteiro maior que zero.', eventId: event.id })
    } else if (numbers.has(event.numero)) {
      issues.push({ code: 'DUPLICATE_EVENT_NUMBER', message: `O evento ${event.numero} está repetido.`, eventId: event.id })
    }
    numbers.add(event.numero)
    if (event.numero > grade.qtd_parcelas) {
      issues.push({ code: 'EVENT_OUT_OF_RANGE', message: `O evento ${event.numero} excede a quantidade configurada na grade.`, eventId: event.id })
    }
    if (event.percentual != null && event.percentual < 0) {
      issues.push({ code: 'INVALID_EVENT_PERCENT', message: `O percentual do evento ${event.numero} não pode ser negativo.`, eventId: event.id })
    }
    if (event.tipo_comissao === 'AGENCIAMENTO' && event.percentual == null) {
      issues.push({ code: 'AGENCY_PERCENT_REQUIRED', message: `Defina a distribuição explícita do agenciamento no evento ${event.numero}.`, eventId: event.id })
    }
  })

  if (finiteTypes.has(grade.tipo) && activeEvents.length !== grade.qtd_parcelas) {
    issues.push({ code: 'FINITE_COUNT_MISMATCH', message: `A grade exige ${grade.qtd_parcelas} evento(s) ativo(s), mas possui ${activeEvents.length}.` })
  }
  if (activeEvents.length) {
    const missing = Array.from({ length: Math.min(grade.qtd_parcelas, activeEvents.length) }, (_, index) => index + 1)
      .filter((number) => !numbers.has(number))
    if (missing.length) issues.push({ code: 'EVENT_GAP', message: `A numeração possui lacuna: ${missing.join(', ')}.` })
  }

  return { applicable: issues.length === 0, issues, activeEvents }
}

export function compatibleReceiptGrades(
  grades: ReceiptGrade[],
  events: ReceiptGradeEvent[],
  insurerId: string,
  branchId: string,
): ReceiptGrade[] {
  return grades.filter((grade) =>
    grade.seguradora_id === insurerId
    && grade.ramo_id === branchId
    && validateReceiptGrade(grade, events.filter((event) => event.grade_id === grade.id), grades).applicable)
}

function eventPercentage(
  event: ReceiptGradeEvent,
  input: ReceiptGradeSimulationInput,
): Pick<ReceiptGradeSimulationEvent, 'percentage' | 'percentageOrigin'> {
  if (event.percentual != null) return { percentage: Number(event.percentual), percentageOrigin: 'GRADE' }
  if (event.tipo_comissao === 'AGENCIAMENTO') {
    return { percentage: input.agencyCommissionPct, percentageOrigin: 'PROPOSTA_AGENCIAMENTO' }
  }
  return { percentage: input.commissionPct, percentageOrigin: 'PROPOSTA_COMISSAO' }
}

function premiumBase(grade: ReceiptGrade, input: ReceiptGradeSimulationInput): number {
  if (grade.base_calculo === 'PREMIO_TOTAL') return input.totalPremium
  if (grade.base_calculo === 'PARCELA_LIQUIDA') return input.netPremium / Math.max(1, input.installmentCount)
  return input.netPremium
}

export function simulateReceiptGrade(
  grade: ReceiptGrade,
  events: ReceiptGradeEvent[],
  input: ReceiptGradeSimulationInput,
): ReceiptGradeSimulationEvent[] {
  const basePremium = premiumBase(grade, input)
  const commissionTotal = basePremium * input.commissionPct / 100

  return events
    .filter((event) => event.ativo)
    .sort((a, b) => a.numero - b.numero)
    .map((event) => {
      const { percentage, percentageOrigin } = eventPercentage(event, input)
      const calculationBase = event.percentual_sobre === 'COMISSAO_TOTAL'
        ? commissionTotal
        : event.percentual_sobre === 'PARCELA'
          ? input.netPremium / Math.max(1, input.installmentCount)
          : basePremium
      return {
        number: event.numero,
        commissionType: event.tipo_comissao,
        percentage,
        percentageOrigin,
        calculationBase: roundMoney(calculationBase),
        expectedDate: addDaysIso(input.firstDueDate, Number(event.dias_apos_vencimento ?? 0)),
        expectedValue: roundMoney(calculationBase * percentage / 100),
      }
    })
}
