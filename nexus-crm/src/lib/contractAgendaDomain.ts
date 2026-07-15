import type {
  ComissaoRow,
  Database,
  ParcelaRow,
  RepasseRow,
} from '../types/database'
import {
  compatibleReceiptGrades,
  roundMoney,
  simulateReceiptGrade,
  validateReceiptGrade,
  addDaysIso,
  type ReceiptGrade,
  type ReceiptGradeEvent,
} from './receiptGradeDomain'

type PolicyRow = Database['public']['Tables']['apolices']['Row']
type ProposalRow = Database['public']['Tables']['propostas']['Row']
type InsuredRow = Database['public']['Tables']['segurados']['Row'] & { gerente_id?: string | null }
type TransferRuleRow = Database['public']['Tables']['repasse_regras']['Row']

export type AgendaState = 'VAZIA' | 'COMPLETA' | 'PARCIAL' | 'DIVERGENTE' | 'BLOQUEADA'
export type AgendaApplyMode = 'COMPLETE_MISSING' | 'REPLACE_PENDING'

export type AgendaDiagnosis = {
  state: AgendaState
  existing: number
  expected: number
  matching: number
  blocked: number
}

export type ContractAgendaTables = {
  policies: PolicyRow[]
  proposals: ProposalRow[]
  insureds: InsuredRow[]
  grades: ReceiptGrade[]
  gradeEvents: ReceiptGradeEvent[]
  transferRules: TransferRuleRow[]
  installments: ParcelaRow[]
  commissions: ComissaoRow[]
  transfers: RepasseRow[]
}

export type ContractAgendaPreview = {
  documentId: string
  gradeId: string | null
  gradeName: string | null
  compatibleGrades: ReceiptGrade[]
  errors: string[]
  warnings: string[]
  installments: ParcelaRow[]
  commissions: ComissaoRow[]
  transfers: RepasseRow[]
  diagnosis: {
    installments: AgendaDiagnosis
    commissions: AgendaDiagnosis
    transfers: AgendaDiagnosis
  }
}

export type AgendaApplyResult = {
  created: { installments: number; commissions: number; transfers: number }
  cancelled: { installments: number; commissions: number; transfers: number }
  preview: ContractAgendaPreview
}

const cancelledInstallment = (row: ParcelaRow) => row.status?.toLocaleLowerCase('pt-BR') === 'cancelada'
const cancelledCommission = (row: ComissaoRow) => row.status === 'CANCELADA'
const cancelledTransfer = (row: RepasseRow) => row.status === 'CANCELADO'

const protectedInstallment = (row: ParcelaRow) => Boolean(
  row.data_pagamento || row.valor_pago != null || row.data_baixa
  || ['paga', 'baixada', 'estornada'].includes(row.status?.toLocaleLowerCase('pt-BR') ?? ''),
)
const protectedCommission = (row: ComissaoRow) => Boolean(
  row.recebida_em || row.valor_recebido != null
  || ['RECEBIDA', 'DIVERGENTE'].includes(row.status ?? ''),
)
const protectedTransfer = (row: RepasseRow) => Boolean(
  row.liberado_em || row.pago_em || row.valor_pago != null || row.comprovante_referencia
  || ['LIBERADO', 'PAGO'].includes(row.status ?? ''),
)

const closeEnough = (left: number | null, right: number | null) =>
  left === right || (left != null && right != null && Math.abs(left - right) < 0.011)

const installmentMatches = (actual: ParcelaRow, expected: ParcelaRow) =>
  actual.numero === expected.numero
  && actual.vencimento === expected.vencimento
  && closeEnough(actual.valor, expected.valor)
  && closeEnough(actual.valor_liquido, expected.valor_liquido)

const commissionMatches = (actual: ComissaoRow, expected: ComissaoRow) =>
  actual.numero === expected.numero
  && actual.tipo_comissao === expected.tipo_comissao
  && actual.prevista_em === expected.prevista_em
  && closeEnough(actual.percentual, expected.percentual)
  && closeEnough(actual.base_calculo, expected.base_calculo)
  && closeEnough(actual.valor_previsto, expected.valor_previsto)

const transferKey = (row: RepasseRow) => `${row.beneficiario_id}:${row.regra_id ?? 'manual'}:${row.numero ?? 0}`
const transferMatches = (actual: RepasseRow, expected: RepasseRow) =>
  transferKey(actual) === transferKey(expected)
  && actual.previsto_em === expected.previsto_em
  && actual.base === expected.base
  && closeEnough(actual.percentual, expected.percentual)
  && closeEnough(actual.valor_previsto, expected.valor_previsto)

function diagnose<T>(
  current: T[],
  expected: T[],
  isProtected: (row: T) => boolean,
  matches: (actual: T, expected: T) => boolean,
): AgendaDiagnosis {
  const blocked = current.filter(isProtected).length
  const matching = current.filter((row) => expected.some((candidate) => matches(row, candidate))).length
  let state: AgendaState
  if (blocked) state = 'BLOQUEADA'
  else if (!current.length && !expected.length) state = 'COMPLETA'
  else if (!current.length) state = 'VAZIA'
  else if (current.length === expected.length && matching === expected.length) state = 'COMPLETA'
  else if (matching === current.length && current.length < expected.length) state = 'PARCIAL'
  else state = 'DIVERGENTE'
  return { state, existing: current.length, expected: expected.length, matching, blocked }
}

function installmentValues(total: number, quantity: number): number[] {
  const regular = roundMoney(total / quantity)
  const values = Array.from({ length: quantity }, () => regular)
  values[quantity - 1] = roundMoney(total - regular * (quantity - 1))
  return values
}

function effectiveFirstDue(document: ProposalRow, current: ParcelaRow[]): string | null {
  if (document.primeira_parcela_vencimento) return document.primeira_parcela_vencimento
  const first = current
    .filter((row) => row.vencimento && row.numero === 1)
    .sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)))[0]
  return first?.vencimento ?? document.vigencia_inicio ?? document.data_emissao ?? null
}

function ruleSpecificity(rule: TransferRuleRow): number {
  return Number(Boolean(rule.produtor_id)) * 16
    + Number(Boolean(rule.ramo_id)) * 8
    + Number(Boolean(rule.tipo_documento)) * 4
    + Number(Boolean(rule.filial_id)) * 2
    + Number(rule.prioridade ?? 0) / 1000
}

function winningRules(
  rules: TransferRuleRow[],
  document: ProposalRow,
  policy: PolicyRow,
  insured: InsuredRow | undefined,
  date: string,
): Array<{ rule: TransferRuleRow; beneficiaryId: string }> {
  const beneficiary = (role: string) => role === 'GERENTE' ? insured?.gerente_id : policy.produtor_id
  const documentType = document.tipo === 'RENOVACAO' ? 'RENOVACAO' : document.tipo === 'NOVA' ? 'NOVA' : null
  const valid = rules.filter((rule) => {
    const beneficiaryId = beneficiary(rule.papel)
    return rule.ativo && Boolean(beneficiaryId)
      && (!rule.filial_id || rule.filial_id === insured?.filial_id)
      && (!rule.produtor_id || rule.produtor_id === beneficiaryId)
      && (!rule.ramo_id || rule.ramo_id === policy.ramo_id)
      && (!rule.tipo_documento || rule.tipo_documento === documentType)
      && (!rule.inicio_vigencia || rule.inicio_vigencia <= date)
      && (!rule.fim_vigencia || rule.fim_vigencia >= date)
  })
  return ['PRODUTOR', 'GERENTE'].flatMap((role) => {
    const rule = valid.filter((candidate) => candidate.papel === role)
      .sort((left, right) => ruleSpecificity(right) - ruleSpecificity(left))[0]
    const beneficiaryId = beneficiary(role)
    return rule && beneficiaryId ? [{ rule, beneficiaryId }] : []
  })
}

function buildTransfers(
  rules: Array<{ rule: TransferRuleRow; beneficiaryId: string }>,
  document: ProposalRow,
  commissions: ComissaoRow[],
  netPremium: number,
  firstDue: string,
): RepasseRow[] {
  return rules.flatMap(({ rule, beneficiaryId }) => {
    const count = rule.gatilho === 'CONFORME_RECEBIMENTO'
      ? Math.max(1, Math.min(commissions.length, rule.limite_parcelas ?? commissions.length))
      : rule.gatilho === 'PARCELADO'
        ? Math.max(1, Math.min(rule.qtd_parcelas ?? 1, rule.limite_parcelas ?? rule.qtd_parcelas ?? 1))
        : 1
    const commissionTotal = commissions.reduce((sum, row) => sum + Number(row.valor_previsto ?? 0), 0)
    return Array.from({ length: count }, (_, index): RepasseRow => {
      const commission = commissions[Math.min(index, Math.max(0, commissions.length - 1))]
      const baseAmount = rule.base === 'VALOR_FIXO'
        ? Number(rule.valor_fixo ?? 0) / (rule.gatilho === 'PARCELADO' ? count : 1)
        : rule.base === 'PREMIO_LIQUIDO'
          ? netPremium / (rule.gatilho === 'PARCELADO' ? count : 1)
          : rule.gatilho === 'CONFORME_RECEBIMENTO' || rule.gatilho === 'PRIMEIRA_COMISSAO'
            ? Number(commission?.valor_previsto ?? 0)
            : commissionTotal / (rule.gatilho === 'PARCELADO' ? count : 1)
      const value = rule.base === 'VALOR_FIXO'
        ? baseAmount
        : baseAmount * Number(rule.percentual ?? 0) / 100
      const followsCommission = ['CONFORME_RECEBIMENTO', 'PRIMEIRA_COMISSAO'].includes(rule.gatilho)
      return {
        id: `repasse:${document.id}:${rule.id}:${index + 1}`,
        proposta_id: document.id,
        comissao_id: followsCommission ? commission?.id ?? null : null,
        beneficiario_id: beneficiaryId,
        regra_id: rule.id,
        numero: index + 1,
        papel_beneficiario: rule.papel,
        base: rule.base,
        percentual: rule.base === 'VALOR_FIXO' ? null : rule.percentual,
        valor_previsto: roundMoney(value),
        valor_pago: null,
        valor_diferenca: null,
        status: 'PREVISTO',
        previsto_em: followsCommission ? commission?.prevista_em ?? firstDue : addDaysIso(firstDue, index * 30),
        liberado_em: null,
        pago_em: null,
        forma_pagamento: null,
        comprovante_referencia: null,
        observacoes: `Snapshot da regra ${rule.id}.`,
      }
    })
  })
}

export function previewContractAgendas(
  tables: ContractAgendaTables,
  documentId: string,
  selectedGradeId?: string | null,
): ContractAgendaPreview {
  const errors: string[] = []
  const warnings: string[] = []
  const document = tables.proposals.find((row) => row.id === documentId)
  const emptyDiagnosis = { state: 'VAZIA' as const, existing: 0, expected: 0, matching: 0, blocked: 0 }
  if (!document) return {
    documentId, gradeId: null, gradeName: null, compatibleGrades: [], errors: ['Documento não encontrado.'], warnings: [],
    installments: [], commissions: [], transfers: [],
    diagnosis: { installments: emptyDiagnosis, commissions: emptyDiagnosis, transfers: emptyDiagnosis },
  }
  const policy = tables.policies.find((row) => row.id === document.apolice_id)
  if (!policy) errors.push('Apólice do documento não encontrada.')
  const compatibleGrades = policy
    ? compatibleReceiptGrades(tables.grades, tables.gradeEvents, policy.seguradora_id ?? '', policy.ramo_id ?? '')
    : []
  const gradeId = selectedGradeId ?? document.recebimento_grade_id
  const grade = compatibleGrades.find((row) => row.id === gradeId)
  if (!compatibleGrades.length) errors.push('Nenhuma grade ativa e íntegra atende à seguradora e ao ramo deste documento.')
  else if (!grade) errors.push('Selecione uma grade de recebimento compatível.')

  const existingInstallments = tables.installments.filter((row) => row.proposta_id === documentId && !cancelledInstallment(row))
  const existingCommissions = tables.commissions.filter((row) => row.proposta_id === documentId && !cancelledCommission(row))
  const existingTransfers = tables.transfers.filter((row) => row.proposta_id === documentId && !cancelledTransfer(row))
  const firstDue = effectiveFirstDue(document, existingInstallments)
  if (!firstDue) errors.push('Informe o primeiro vencimento no documento.')
  const quantity = document.tipo === 'FATURA' ? 1 : Number(document.qtd_parcelas ?? 0)
  if (!Number.isInteger(quantity) || quantity < 1) errors.push('Informe uma quantidade válida de parcelas no documento.')

  const total = Number(document.premio_total ?? 0)
  const net = Number(document.premio_liquido ?? total)
  const installmentAmounts = quantity > 0 ? installmentValues(total, quantity) : []
  const netAmounts = quantity > 0 ? installmentValues(net, quantity) : []
  const installments = firstDue ? installmentAmounts.map((value, index): ParcelaRow => ({
    id: `parcela:${document.id}:${index + 1}`,
    proposta_id: document.id,
    numero: index + 1,
    vencimento: addDaysIso(firstDue, index * 30),
    valor: value,
    valor_liquido: netAmounts[index],
    iof: null,
    adicional_fracionamento: null,
    status: 'em_aberto',
    forma_pagamento: document.forma_pagamento,
    nosso_numero: null,
    linha_digitavel: null,
    codigo_barras: null,
    data_pagamento: null,
    valor_pago: null,
    data_baixa: null,
    numero_fatura: document.numero_fatura,
    competencia_inicio: document.competencia_inicio,
    competencia_fim: document.competencia_fim,
    observacoes: 'Materializada pela geração consolidada das agendas.',
  })) : []

  let commissions: ComissaoRow[] = []
  if (grade && firstDue) {
    const events = tables.gradeEvents.filter((event) => event.grade_id === grade.id)
    const validation = validateReceiptGrade(grade, events, tables.grades)
    if (!validation.applicable) errors.push(...validation.issues.map((issue) => issue.message))
    const agencyTotal = validation.activeEvents
      .filter((event) => event.tipo_comissao === 'AGENCIAMENTO')
      .reduce((sum, event) => sum + Number(event.percentual ?? 0), 0)
    if (agencyTotal && Math.abs(agencyTotal - Number(document.agenciamento_pct ?? 0)) > 0.001) {
      errors.push(`A grade distribui ${agencyTotal}% de agenciamento, mas a proposta informa ${Number(document.agenciamento_pct ?? 0)}%.`)
    }
    const simulation = simulateReceiptGrade(grade, validation.activeEvents, {
      totalPremium: total,
      netPremium: net,
      commissionPct: Number(document.comissao_pct ?? grade.percentual_default ?? 0),
      agencyCommissionPct: Number(document.agenciamento_pct ?? 0),
      installmentCount: Math.max(1, quantity),
      firstDueDate: firstDue,
    })
    commissions = simulation.map((event): ComissaoRow => ({
      id: `comissao:${document.id}:${event.number}`,
      proposta_id: document.id,
      parcela_id: null,
      numero: event.number,
      tipo_comissao: event.commissionType,
      percentual: event.percentage,
      base_calculo: event.calculationBase,
      valor_previsto: event.expectedValue,
      valor_recebido: null,
      valor_diferenca: null,
      status: 'PREVISTA',
      prevista_em: event.expectedDate,
      recebida_em: null,
      competencia_inicio: document.competencia_inicio,
      competencia_fim: document.competencia_fim,
      observacoes: `Snapshot da grade ${grade.nome}.`,
    }))
  }

  const insured = policy ? tables.insureds.find((row) => row.id === policy.segurado_id) : undefined
  const rules = policy && firstDue ? winningRules(tables.transferRules, document, policy, insured, firstDue) : []
  const transfers = firstDue ? buildTransfers(rules, document, commissions, net, firstDue) : []
  if (!rules.length) warnings.push('Nenhuma regra de repasse aplicável; nenhum repasse automático será criado.')

  return {
    documentId,
    gradeId: grade?.id ?? gradeId ?? null,
    gradeName: grade?.nome ?? null,
    compatibleGrades,
    errors: [...new Set(errors)],
    warnings,
    installments,
    commissions,
    transfers,
    diagnosis: {
      installments: diagnose(existingInstallments, installments, protectedInstallment, installmentMatches),
      commissions: diagnose(existingCommissions, commissions, protectedCommission, commissionMatches),
      transfers: diagnose(existingTransfers, transfers, protectedTransfer, transferMatches),
    },
  }
}

const nextAvailableId = (base: string, rows: Array<{ id: string }>) => {
  if (!rows.some((row) => row.id === base)) return base
  let revision = 2
  while (rows.some((row) => row.id === `${base}:r${revision}`)) revision += 1
  return `${base}:r${revision}`
}

function appendMissing<T extends { id: string }>(
  target: T[],
  expected: T[],
  matches: (actual: T, expected: T) => boolean,
): number {
  let created = 0
  expected.forEach((row) => {
    if (target.some((current) => matches(current, row))) return
    target.push({ ...row, id: nextAvailableId(row.id, target) })
    created += 1
  })
  return created
}

export function applyContractAgendaPreview(
  tables: ContractAgendaTables,
  preview: ContractAgendaPreview,
  mode: AgendaApplyMode,
): AgendaApplyResult {
  if (preview.errors.length) throw new Error(preview.errors[0])
  const diagnosis = Object.values(preview.diagnosis)
  if (diagnosis.some((item) => item.state === 'BLOQUEADA')) {
    throw new Error('Existem fatos processados. Reverta a operação financeira antes de regenerar as agendas.')
  }
  if (mode === 'COMPLETE_MISSING' && diagnosis.some((item) => item.state === 'DIVERGENTE')) {
    throw new Error('A agenda possui divergências. Use a substituição coletiva dos fatos não processados.')
  }

  const proposal = tables.proposals.find((row) => row.id === preview.documentId)
  if (!proposal || !preview.gradeId) throw new Error('Documento ou grade não encontrado.')
  proposal.recebimento_grade_id = preview.gradeId
  const currentInstallments = tables.installments.filter((row) => row.proposta_id === preview.documentId && !cancelledInstallment(row))
  const currentCommissions = tables.commissions.filter((row) => row.proposta_id === preview.documentId && !cancelledCommission(row))
  const currentTransfers = tables.transfers.filter((row) => row.proposta_id === preview.documentId && !cancelledTransfer(row))
  const cancelled = { installments: 0, commissions: 0, transfers: 0 }

  if (mode === 'REPLACE_PENDING') {
    currentInstallments.forEach((row) => { row.status = 'cancelada'; cancelled.installments += 1 })
    currentCommissions.forEach((row) => { row.status = 'CANCELADA'; cancelled.commissions += 1 })
    currentTransfers.forEach((row) => { row.status = 'CANCELADO'; cancelled.transfers += 1 })
  }

  const createdInstallments = appendMissing(tables.installments, preview.installments, (actual, expected) =>
    actual.proposta_id === preview.documentId && !cancelledInstallment(actual) && installmentMatches(actual, expected))
  const createdCommissions = appendMissing(tables.commissions, preview.commissions, (actual, expected) =>
    actual.proposta_id === preview.documentId && !cancelledCommission(actual) && commissionMatches(actual, expected))
  const activeCommissions = tables.commissions.filter((row) => row.proposta_id === preview.documentId && !cancelledCommission(row))
  const commissionIds = new Map(preview.commissions.flatMap((expected) => {
    const actual = activeCommissions.find((row) => commissionMatches(row, expected))
    return actual ? [[expected.id, actual.id] as const] : []
  }))
  const transfers = preview.transfers.map((row) => ({
    ...row,
    comissao_id: row.comissao_id ? commissionIds.get(row.comissao_id) ?? row.comissao_id : null,
  }))
  const createdTransfers = appendMissing(tables.transfers, transfers, (actual, expected) =>
    actual.proposta_id === preview.documentId && !cancelledTransfer(actual) && transferMatches(actual, expected))
  const created = { installments: createdInstallments, commissions: createdCommissions, transfers: createdTransfers }
  return { created, cancelled, preview }
}
