import {
  getTable,
  MOCK_TENANT_ID,
  MOCK_USER_ID,
  newId,
  nowIso,
} from '../../lib/inMemoryDb'
import type { Database, ParcelaRow, ParcelaStatus } from '../../types/database'

type ProposalRow = Database['public']['Tables']['propostas']['Row']
type PolicyRow = Database['public']['Tables']['apolices']['Row']
type InsuredRow = Database['public']['Tables']['segurados']['Row']
type InsurerRow = Database['public']['Tables']['seguradoras']['Row']
type RamoRow = Database['public']['Tables']['ramos']['Row']
type AuditInsert = Database['public']['Tables']['audit_logs']['Insert'] & { id: string }
type BranchRow = { id: string; fantasia: string | null; razao_social: string | null }

export interface FinanceiroParcela extends ParcelaRow {
  statusEfetivo: ParcelaStatus
  diasVencidos: number
  propostaNumero: string | null
  propostaTipo: string | null
  documentoReferencia: string
  apoliceId: string
  apoliceNumero: string | null
  seguradoId: string
  seguradoNome: string
  seguradoraId: string | null
  seguradoraNome: string
  ramoId: string | null
  ramoNome: string
  filialId: string
  filialNome: string
}

export interface ParcelaFilters {
  filialId: string
  seguradoId: string
  seguradoraId: string
  ramoId: string
  documento: string
  vencimentoDe: string
  vencimentoAte: string
  status: '' | ParcelaStatus
}

export interface PaymentCommand {
  ids: string[]
  dataPagamento: string
  valorPago?: number
}

export interface PaymentResult {
  changed: number
  ids: string[]
}

const typedRows = <T,>(table: string): T[] => getTable(table) as unknown as T[]
const todayLocal = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function parcelaStatusEfetivo(row: ParcelaRow, today = todayLocal()): ParcelaStatus {
  if (row.status === 'paga' || row.status === 'cancelada' || row.status === 'estornada') return row.status
  if (row.vencimento && row.vencimento < today) return 'vencida'
  return row.status === 'vencida' ? 'vencida' : 'em_aberto'
}

export function diasVencidos(vencimento: string | null, today = todayLocal()): number {
  if (!vencimento || vencimento >= today) return 0
  const start = Date.parse(`${vencimento}T12:00:00`)
  const end = Date.parse(`${today}T12:00:00`)
  return Math.max(0, Math.round((end - start) / 86_400_000))
}

function documentReference(proposal: ProposalRow): string {
  if (proposal.numero_fatura) return proposal.numero_fatura
  if (proposal.numero_endosso && proposal.numero_endosso !== '0') return `Endosso ${proposal.numero_endosso}`
  return proposal.numero_proposta ?? 'Documento sem número'
}

export function listFinanceiroParcelas(branchIds?: readonly string[] | null): FinanceiroParcela[] {
  const proposals = typedRows<ProposalRow>('propostas')
  const policies = typedRows<PolicyRow>('apolices')
  const insureds = typedRows<InsuredRow>('segurados')
  const insurers = typedRows<InsurerRow>('seguradoras')
  const branches = typedRows<BranchRow>('filiais')
  const ramos = typedRows<RamoRow>('ramos')
  const allowedBranches = branchIds ? new Set(branchIds) : null

  return typedRows<ParcelaRow>('parcelas').flatMap((installment): FinanceiroParcela[] => {
    const proposal = proposals.find((row) => row.id === installment.proposta_id)
    const policy = proposal ? policies.find((row) => row.id === proposal.apolice_id) : undefined
    const insured = policy ? insureds.find((row) => row.id === policy.segurado_id) : undefined
    if (!proposal || !policy || !insured || !insured.filial_id || (allowedBranches && !allowedBranches.has(insured.filial_id))) return []
    const insurer = policy.seguradora_id ? insurers.find((row) => row.id === policy.seguradora_id) : undefined
    const branch = branches.find((row) => row.id === insured.filial_id)
    const ramo = policy.ramo_id ? ramos.find((row) => row.id === policy.ramo_id) : undefined
    const statusEfetivo = parcelaStatusEfetivo(installment)
    return [{
      ...installment,
      statusEfetivo,
      diasVencidos: statusEfetivo === 'vencida' ? diasVencidos(installment.vencimento) : 0,
      propostaNumero: proposal.numero_proposta,
      propostaTipo: proposal.tipo,
      documentoReferencia: documentReference(proposal),
      apoliceId: policy.id,
      apoliceNumero: policy.numero_apolice,
      seguradoId: insured.id,
      seguradoNome: insured.nome,
      seguradoraId: insurer?.id ?? null,
      seguradoraNome: insurer?.nome ?? 'Seguradora não informada',
      ramoId: ramo?.id ?? null,
      ramoNome: ramo?.nome ?? 'Ramo não informado',
      filialId: insured.filial_id,
      filialNome: branch?.fantasia ?? branch?.razao_social ?? 'Corretora não informada',
    }]
  }).sort((a, b) => (a.vencimento ?? '').localeCompare(b.vencimento ?? '') || (a.numero ?? 0) - (b.numero ?? 0))
}

export function filterFinanceiroParcelas(rows: FinanceiroParcela[], filters: ParcelaFilters): FinanceiroParcela[] {
  const term = filters.documento.trim().toLocaleLowerCase('pt-BR')
  return rows.filter((row) => {
    if (filters.filialId && row.filialId !== filters.filialId) return false
    if (filters.seguradoId && row.seguradoId !== filters.seguradoId) return false
    if (filters.seguradoraId && row.seguradoraId !== filters.seguradoraId) return false
    if (filters.ramoId && row.ramoId !== filters.ramoId) return false
    if (filters.vencimentoDe && (!row.vencimento || row.vencimento < filters.vencimentoDe)) return false
    if (filters.vencimentoAte && (!row.vencimento || row.vencimento > filters.vencimentoAte)) return false
    if (filters.status && row.statusEfetivo !== filters.status) return false
    if (term) {
      const haystack = [row.propostaNumero, row.apoliceNumero, row.documentoReferencia]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')
      if (!haystack.includes(term)) return false
    }
    return true
  })
}

function serialize(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function audit(row: ParcelaRow, previous: ParcelaRow, action: 'CONFIRMAR_PAGAMENTO' | 'DESFAZER_PAGAMENTO'): void {
  const entry: AuditInsert = {
    id: newId(), tenant_id: MOCK_TENANT_ID, user_id: MOCK_USER_ID,
    entidade_tipo: 'parcela', entidade_id: row.id, campo: 'liquidacao',
    valor_antigo: serialize(previous), valor_novo: serialize(row), acao: 'UPDATE',
    ocorrido_em: nowIso(), origem: 'FRONT_MOCK', ip: null,
    user_agent: `WassisCRM frontend puro · ${action}`,
  }
  typedRows<AuditInsert>('audit_logs').push(entry)
}

function validateUniqueIds(ids: string[]): string[] {
  const unique = Array.from(new Set(ids))
  if (unique.length === 0) throw new Error('Selecione ao menos uma parcela.')
  return unique
}

export function confirmParcelaPayments(command: PaymentCommand): PaymentResult {
  const ids = validateUniqueIds(command.ids)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(command.dataPagamento)) throw new Error('Informe uma data de pagamento válida.')
  if (command.valorPago !== undefined && (!Number.isFinite(command.valorPago) || command.valorPago <= 0)) {
    throw new Error('Informe um valor pago maior que zero.')
  }
  const table = typedRows<ParcelaRow>('parcelas')
  const selected = ids.map((id) => table.find((row) => row.id === id))
  if (selected.some((row) => !row)) throw new Error('Uma parcela selecionada não foi encontrada.')
  const rows = selected.filter((row): row is ParcelaRow => Boolean(row))
  if (rows.some((row) => !['em_aberto', 'vencida'].includes(parcelaStatusEfetivo(row)))) {
    throw new Error('O lote contém parcela paga, cancelada ou estornada.')
  }
  if (command.valorPago !== undefined && rows.length !== 1) throw new Error('Valor informado manualmente só pode ser usado em uma parcela.')
  const snapshots = rows.map((row) => ({ ...row }))
  const auditTable = typedRows<AuditInsert>('audit_logs')
  const auditLength = auditTable.length
  try {
    rows.forEach((row, index) => {
      const paidValue = command.valorPago ?? row.valor ?? row.valor_liquido
      if (paidValue === null || paidValue <= 0) throw new Error(`A parcela ${row.numero ?? ''} não possui valor válido.`)
      Object.assign(row, { status: 'paga' as const, data_pagamento: command.dataPagamento, data_baixa: command.dataPagamento, valor_pago: paidValue })
      audit(row, snapshots[index], 'CONFIRMAR_PAGAMENTO')
    })
    return { changed: rows.length, ids }
  } catch (error) {
    rows.forEach((row, index) => Object.assign(row, snapshots[index]))
    auditTable.splice(auditLength)
    throw error
  }
}

export function reverseParcelaPayments(idsInput: string[]): PaymentResult {
  const ids = validateUniqueIds(idsInput)
  const table = typedRows<ParcelaRow>('parcelas')
  const selected = ids.map((id) => table.find((row) => row.id === id))
  if (selected.some((row) => !row)) throw new Error('Uma parcela selecionada não foi encontrada.')
  const rows = selected.filter((row): row is ParcelaRow => Boolean(row))
  if (rows.some((row) => row.status !== 'paga')) throw new Error('Somente parcelas pagas podem ter o pagamento desfeito.')
  const snapshots = rows.map((row) => ({ ...row }))
  const auditTable = typedRows<AuditInsert>('audit_logs')
  const auditLength = auditTable.length
  try {
    rows.forEach((row, index) => {
      const reopenedStatus: ParcelaStatus = row.vencimento && row.vencimento < todayLocal() ? 'vencida' : 'em_aberto'
      Object.assign(row, { status: reopenedStatus, data_pagamento: null, data_baixa: null, valor_pago: null })
      audit(row, snapshots[index], 'DESFAZER_PAGAMENTO')
    })
    return { changed: rows.length, ids }
  } catch (error) {
    rows.forEach((row, index) => Object.assign(row, snapshots[index]))
    auditTable.splice(auditLength)
    throw error
  }
}
