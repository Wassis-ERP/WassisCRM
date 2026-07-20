import { getTable, MOCK_TENANT_ID, MOCK_USER_ID, newId, nowIso } from '../../lib/inMemoryDb'
import type {
  Database,
  RepasseFormaPagamento,
  RepasseReciboItemRow,
  RepasseReciboRow,
  RepasseReciboSentido,
  RepasseRow,
  RepasseStatus,
  ComissaoRow,
} from '../../types/database'

type ProposalRow = Database['public']['Tables']['propostas']['Row']
type PolicyRow = Database['public']['Tables']['apolices']['Row']
type InsuredRow = Database['public']['Tables']['segurados']['Row']
type InsurerRow = Database['public']['Tables']['seguradoras']['Row']
type RamoRow = Database['public']['Tables']['ramos']['Row']
type ProducerRow = { id: string; nome: string | null; ativo: boolean | null }
type AuditInsert = Database['public']['Tables']['audit_logs']['Insert'] & { id: string }
type BranchRow = { id: string; fantasia: string | null; razao_social: string | null }

export interface RepasseReciboResumo {
  id: string
  numero: string
  status: RepasseReciboRow['status']
  dataPagamento: string
  total: number
}

export interface FinanceiroRepasse extends RepasseRow {
  propostaNumero: string | null
  comissaoNumero: number | null
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
  beneficiarioNome: string
  origem: 'REGRA' | 'MANUAL'
  sentido: RepasseReciboSentido
  reciboAtivo: RepasseReciboResumo | null
  ultimoRecibo: RepasseReciboResumo | null
  elegivel: boolean
  bloqueio: string | null
}

export interface RepasseFilters {
  filialId: string
  beneficiarioId: string
  papel: string
  seguradoId: string
  seguradoraId: string
  ramoId: string
  documento: string
  comissaoId: string
  origem: '' | 'REGRA' | 'MANUAL'
  periodo: 'PREVISTO' | 'LIBERADO' | 'PAGO'
  dataDe: string
  dataAte: string
  status: '' | RepasseStatus
}

export interface EmitirRepasseRecibosCommand {
  repasseIds: string[]
  dataPagamento: string
  formaPagamento: RepasseFormaPagamento
  comprovanteReferencia?: string
  observacoes?: string
  chaveIdempotencia: string
  emitidoPorId?: string
}

export type EmitirReciboGrupoStatus = 'EMITIDO' | 'IDEMPOTENTE' | 'FALHOU'

export interface EmitirReciboGrupoResult {
  grupo: string
  beneficiarioNome: string
  sentido: RepasseReciboSentido
  quantidade: number
  total: number
  status: EmitirReciboGrupoStatus
  reciboId: string | null
  numero: string | null
  mensagem: string
}

export interface EmitirRepasseRecibosResult {
  grupos: EmitirReciboGrupoResult[]
  emitidos: number
  idempotentes: number
  falhos: number
}

export interface CancelarRepasseReciboCommand {
  reciboId: string
  justificativa: string
  chaveCancelamento: string
  canceladoPorId?: string
}

export interface CancelarRepasseReciboResult {
  recibo: RepasseReciboRow
  repasseIds: string[]
  idempotent: boolean
}

export interface RepasseReciboDetalhe {
  recibo: RepasseReciboRow
  itens: RepasseReciboItemRow[]
  total: number
}

export interface RepasseReceiptGroup {
  key: string
  filialId: string
  filialNome: string
  beneficiarioId: string
  beneficiarioNome: string
  sentido: RepasseReciboSentido
  rows: FinanceiroRepasse[]
  total: number
}

const typedRows = <T,>(table: string): T[] => getTable(table) as unknown as T[]
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const sum = (values: readonly number[]) => roundMoney(values.reduce((total, value) => total + value, 0))
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const hasText = (value: string | undefined, minimum: number) => (value?.trim().length ?? 0) >= minimum

function documentReference(proposal: ProposalRow): string {
  if (proposal.numero_fatura) return proposal.numero_fatura
  if (proposal.numero_endosso && proposal.numero_endosso !== '0') return `Endosso ${proposal.numero_endosso}`
  return proposal.numero_proposta ?? 'Documento sem número'
}

function receiptItems(receiptId: string): RepasseReciboItemRow[] {
  return typedRows<RepasseReciboItemRow>('repasse_recibo_itens').filter((item) => item.recibo_id === receiptId)
}

function receiptTotal(receiptId: string): number {
  return sum(receiptItems(receiptId).map((item) => item.valor_pago_snapshot))
}

function receiptSummary(receipt: RepasseReciboRow): RepasseReciboResumo {
  return {
    id: receipt.id,
    numero: receipt.numero,
    status: receipt.status,
    dataPagamento: receipt.data_pagamento,
    total: receiptTotal(receipt.id),
  }
}

function receiptsForTransfer(repasseId: string): RepasseReciboRow[] {
  const receiptIds = new Set(typedRows<RepasseReciboItemRow>('repasse_recibo_itens')
    .filter((item) => item.repasse_id === repasseId)
    .map((item) => item.recibo_id))
  return typedRows<RepasseReciboRow>('repasse_recibos')
    .filter((receipt) => receiptIds.has(receipt.id))
    .sort((left, right) => right.emitido_em.localeCompare(left.emitido_em))
}

function audit(entityType: 'repasse_recibo' | 'repasse', entityId: string, field: string, previous: string | null, next: string, userId: string): void {
  typedRows<AuditInsert>('audit_logs').push({
    id: newId(), tenant_id: MOCK_TENANT_ID, user_id: userId,
    entidade_tipo: entityType, entidade_id: entityId, campo: field,
    valor_antigo: previous, valor_novo: next, acao: previous === null ? 'INSERT' : 'UPDATE',
    ocorrido_em: nowIso(), origem: 'FRONT_MOCK', ip: null,
    user_agent: 'WassisCRM mock · recibo de repasse v2.5',
  })
}

function transaction<T>(tables: readonly string[], operation: () => T): T {
  const snapshots = new Map(tables.map((table) => [table, typedRows<Record<string, unknown>>(table).map((row) => ({ ...row }))]))
  try {
    return operation()
  } catch (error) {
    snapshots.forEach((rows, table) => {
      const target = typedRows<Record<string, unknown>>(table)
      target.splice(0, target.length, ...rows)
    })
    throw error
  }
}

export function listFinanceiroRepasses(branchIds?: readonly string[] | null): FinanceiroRepasse[] {
  const proposals = typedRows<ProposalRow>('propostas')
  const policies = typedRows<PolicyRow>('apolices')
  const insureds = typedRows<InsuredRow>('segurados')
  const insurers = typedRows<InsurerRow>('seguradoras')
  const ramos = typedRows<RamoRow>('ramos')
  const branches = typedRows<BranchRow>('filiais')
  const producers = typedRows<ProducerRow>('produtores')
  const commissions = typedRows<ComissaoRow>('comissoes')
  const allowedBranches = branchIds ? new Set(branchIds) : null

  return typedRows<RepasseRow>('repasses').flatMap((repasse): FinanceiroRepasse[] => {
    const proposal = proposals.find((row) => row.id === repasse.proposta_id)
    const policy = proposal ? policies.find((row) => row.id === proposal.apolice_id) : undefined
    const insured = policy ? insureds.find((row) => row.id === policy.segurado_id) : undefined
    if (!proposal || !policy || !insured?.filial_id || (allowedBranches && !allowedBranches.has(insured.filial_id))) return []
    const branch = branches.find((row) => row.id === insured.filial_id)
    const producer = producers.find((row) => row.id === repasse.beneficiario_id)
    const insurer = policy.seguradora_id ? insurers.find((row) => row.id === policy.seguradora_id) : undefined
    const ramo = policy.ramo_id ? ramos.find((row) => row.id === policy.ramo_id) : undefined
    const commission = repasse.comissao_id ? commissions.find((row) => row.id === repasse.comissao_id) : undefined
    const receipts = receiptsForTransfer(repasse.id)
    const active = receipts.find((receipt) => receipt.status === 'EMITIDO') ?? null
    const value = roundMoney(repasse.valor_previsto ?? 0)
    let bloqueio: string | null = null
    if (repasse.status !== 'LIBERADO') bloqueio = `Status ${repasse.status ?? 'não informado'} não é elegível.`
    else if (!producer || producer.ativo === false) bloqueio = 'Beneficiário ausente ou inativo.'
    else if (Math.abs(value) < 0.01) bloqueio = 'Repasse com valor zero não é elegível.'
    else if (active) bloqueio = `Já existe o recibo ativo ${active.numero}.`

    return [{
      ...repasse,
      propostaNumero: proposal.numero_proposta,
      comissaoNumero: commission?.numero ?? null,
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
      beneficiarioNome: producer?.nome ?? 'Beneficiário não encontrado',
      origem: repasse.regra_id ? 'REGRA' : 'MANUAL',
      sentido: value < 0 ? 'DEBITO' : 'CREDITO',
      reciboAtivo: active ? receiptSummary(active) : null,
      ultimoRecibo: receipts[0] ? receiptSummary(receipts[0]) : null,
      elegivel: bloqueio === null,
      bloqueio,
    }]
  }).sort((left, right) => (right.liberado_em ?? right.previsto_em ?? '').localeCompare(left.liberado_em ?? left.previsto_em ?? '') || left.beneficiarioNome.localeCompare(right.beneficiarioNome, 'pt-BR'))
}

export function filterFinanceiroRepasses(rows: FinanceiroRepasse[], filters: RepasseFilters): FinanceiroRepasse[] {
  const term = filters.documento.trim().toLocaleLowerCase('pt-BR')
  return rows.filter((row) => {
    if (filters.filialId && row.filialId !== filters.filialId) return false
    if (filters.beneficiarioId && row.beneficiario_id !== filters.beneficiarioId) return false
    if (filters.papel && row.papel_beneficiario !== filters.papel) return false
    if (filters.seguradoId && row.seguradoId !== filters.seguradoId) return false
    if (filters.seguradoraId && row.seguradoraId !== filters.seguradoraId) return false
    if (filters.ramoId && row.ramoId !== filters.ramoId) return false
    if (filters.comissaoId && row.comissao_id !== filters.comissaoId) return false
    if (filters.origem && row.origem !== filters.origem) return false
    if (filters.status && row.status !== filters.status) return false
    const date = filters.periodo === 'LIBERADO' ? row.liberado_em : filters.periodo === 'PAGO' ? row.pago_em : row.previsto_em
    if (filters.dataDe && (!date || date < filters.dataDe)) return false
    if (filters.dataAte && (!date || date > filters.dataAte)) return false
    if (term) {
      const haystack = [row.documentoReferencia, row.propostaNumero, row.apoliceNumero, row.seguradoNome, row.beneficiarioNome, row.comissao_id, row.comissaoNumero === null ? null : String(row.comissaoNumero)]
        .filter((value): value is string => Boolean(value)).join(' ').toLocaleLowerCase('pt-BR')
      if (!haystack.includes(term)) return false
    }
    return true
  })
}

export function groupRepasseReceipts(rows: FinanceiroRepasse[]): RepasseReceiptGroup[] {
  const groups = new Map<string, RepasseReceiptGroup>()
  rows.forEach((row) => {
    const key = `${row.filialId}|${row.beneficiario_id}|${row.sentido}`
    const current = groups.get(key) ?? {
      key, filialId: row.filialId, filialNome: row.filialNome,
      beneficiarioId: row.beneficiario_id, beneficiarioNome: row.beneficiarioNome,
      sentido: row.sentido, rows: [], total: 0,
    }
    current.rows.push(row)
    current.total = sum(current.rows.map((item) => item.valor_previsto ?? 0))
    groups.set(key, current)
  })
  return [...groups.values()].sort((left, right) => left.beneficiarioNome.localeCompare(right.beneficiarioNome, 'pt-BR') || left.sentido.localeCompare(right.sentido))
}

function nextReceiptNumber(branchId: string, date: string, sentido: RepasseReciboSentido): string {
  const year = date.slice(0, 4)
  const prefix = sentido === 'CREDITO' ? 'REP' : 'DEB'
  const count = typedRows<RepasseReciboRow>('repasse_recibos')
    .filter((receipt) => receipt.filial_id === branchId && receipt.numero.startsWith(`${prefix}-${year}-`)).length + 1
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`
}

function sameIds(receiptId: string, repasseIds: readonly string[]): boolean {
  const existing = receiptItems(receiptId).map((item) => item.repasse_id).sort()
  const requested = [...repasseIds].sort()
  return existing.length === requested.length && existing.every((id, index) => id === requested[index])
}

function emitGroup(group: RepasseReceiptGroup, command: EmitirRepasseRecibosCommand): EmitirReciboGrupoResult {
  const groupKey = `${command.chaveIdempotencia}|${group.filialId}|${group.beneficiarioId}|${group.sentido}`
  const existing = typedRows<RepasseReciboRow>('repasse_recibos')
    .find((receipt) => receipt.filial_id === group.filialId && receipt.chave_idempotencia === groupKey)
  if (existing) {
    if (!sameIds(existing.id, group.rows.map((row) => row.id))) throw new Error('A chave idempotente já foi usada com uma seleção diferente.')
    return {
      grupo: group.key, beneficiarioNome: existing.beneficiario_nome_snapshot,
      sentido: existing.sentido, quantidade: receiptItems(existing.id).length,
      total: receiptTotal(existing.id), status: 'IDEMPOTENTE', reciboId: existing.id,
      numero: existing.numero, mensagem: 'A emissão já havia sido concluída; o recibo original foi reutilizado.',
    }
  }

  return transaction(['repasses', 'repasse_recibos', 'repasse_recibo_itens', 'audit_logs'], () => {
    const currentRows = listFinanceiroRepasses(null)
    const validated = group.rows.map((requested) => currentRows.find((row) => row.id === requested.id))
    if (validated.some((row) => !row)) throw new Error('Um repasse não está mais disponível. Atualize a seleção.')
    const rows = validated.filter((row): row is FinanceiroRepasse => Boolean(row))
    if (rows.some((row) => !row.elegivel)) throw new Error(rows.find((row) => !row.elegivel)?.bloqueio ?? 'A seleção mudou e não é mais elegível.')
    if (rows.some((row) => row.filialId !== group.filialId || row.beneficiario_id !== group.beneficiarioId || row.sentido !== group.sentido)) {
      throw new Error('A seleção mudou de filial, beneficiário ou sentido durante a confirmação.')
    }

    const createdAt = nowIso()
    const userId = command.emitidoPorId ?? MOCK_USER_ID
    const receipt: RepasseReciboRow = {
      id: newId(), filial_id: group.filialId, beneficiario_id: group.beneficiarioId,
      numero: nextReceiptNumber(group.filialId, command.dataPagamento, group.sentido),
      sentido: group.sentido, status: 'EMITIDO', data_pagamento: command.dataPagamento,
      forma_pagamento: command.formaPagamento,
      comprovante_referencia: command.comprovanteReferencia?.trim() || null,
      observacoes: command.observacoes?.trim() || null, chave_idempotencia: groupKey,
      chave_cancelamento: null, filial_nome_snapshot: group.filialNome,
      beneficiario_nome_snapshot: group.beneficiarioNome, emitido_por_id: userId,
      emitido_em: createdAt, cancelado_por_id: null, cancelado_em: null,
      motivo_cancelamento: null, atualizado_em: createdAt,
    }
    typedRows<RepasseReciboRow>('repasse_recibos').push(receipt)

    rows.forEach((row) => {
      const value = roundMoney(row.valor_previsto ?? 0)
      typedRows<RepasseReciboItemRow>('repasse_recibo_itens').push({
        id: newId(), recibo_id: receipt.id, repasse_id: row.id,
        numero_repasse_snapshot: row.numero, documento_referencia_snapshot: row.documentoReferencia,
        segurado_nome_snapshot: row.seguradoNome, seguradora_nome_snapshot: row.seguradoraNome,
        ramo_nome_snapshot: row.ramoNome, papel_beneficiario_snapshot: row.papel_beneficiario,
        valor_previsto_snapshot: value, valor_pago_snapshot: value, criado_em: createdAt,
      })
      const transfer = typedRows<RepasseRow>('repasses').find((candidate) => candidate.id === row.id)
      if (!transfer) throw new Error('Um repasse deixou de existir durante a emissão.')
      Object.assign(transfer, {
        status: 'PAGO' satisfies RepasseStatus, valor_pago: value, valor_diferenca: 0,
        pago_em: command.dataPagamento, forma_pagamento: command.formaPagamento,
        comprovante_referencia: command.comprovanteReferencia?.trim() || null,
        observacoes: command.observacoes?.trim() || null,
      })
      audit('repasse', transfer.id, 'status', 'LIBERADO', 'PAGO', userId)
    })
    audit('repasse_recibo', receipt.id, 'status', null, 'EMITIDO', userId)
    return {
      grupo: group.key, beneficiarioNome: group.beneficiarioNome, sentido: group.sentido,
      quantidade: rows.length, total: sum(rows.map((row) => row.valor_previsto ?? 0)),
      status: 'EMITIDO', reciboId: receipt.id, numero: receipt.numero,
      mensagem: 'Recibo emitido e repasses marcados integralmente como pagos.',
    }
  })
}

export function issueRepasseReceipts(command: EmitirRepasseRecibosCommand): EmitirRepasseRecibosResult {
  if (!validDate(command.dataPagamento)) throw new Error('Informe uma data de pagamento válida.')
  if (!hasText(command.chaveIdempotencia, 8)) throw new Error('A chave idempotente da emissão é inválida.')
  if (command.repasseIds.length === 0) throw new Error('Selecione ao menos um repasse.')
  const uniqueIds = [...new Set(command.repasseIds)]
  if (uniqueIds.length !== command.repasseIds.length) throw new Error('A mesma linha de repasse não pode aparecer duas vezes.')
  const current = listFinanceiroRepasses(null)
  const selected = uniqueIds.map((id) => current.find((row) => row.id === id)).filter((row): row is FinanceiroRepasse => Boolean(row))
  if (selected.length !== uniqueIds.length) throw new Error('Um repasse selecionado não foi encontrado.')
  const groups = groupRepasseReceipts(selected)
  const results = groups.map((group): EmitirReciboGrupoResult => {
    try {
      return emitGroup(group, command)
    } catch (error) {
      return {
        grupo: group.key, beneficiarioNome: group.beneficiarioNome, sentido: group.sentido,
        quantidade: group.rows.length, total: group.total, status: 'FALHOU',
        reciboId: null, numero: null,
        mensagem: error instanceof Error ? error.message : 'Falha inesperada ao emitir o recibo.',
      }
    }
  })
  return {
    grupos: results,
    emitidos: results.filter((result) => result.status === 'EMITIDO').length,
    idempotentes: results.filter((result) => result.status === 'IDEMPOTENTE').length,
    falhos: results.filter((result) => result.status === 'FALHOU').length,
  }
}

export function getRepasseReceipt(receiptId: string): RepasseReciboDetalhe | null {
  const receipt = typedRows<RepasseReciboRow>('repasse_recibos').find((row) => row.id === receiptId)
  if (!receipt) return null
  const items = receiptItems(receipt.id)
  return { recibo: { ...receipt }, itens: items.map((item) => ({ ...item })), total: sum(items.map((item) => item.valor_pago_snapshot)) }
}

export function cancelRepasseReceipt(command: CancelarRepasseReciboCommand): CancelarRepasseReciboResult {
  if (!hasText(command.justificativa, 5)) throw new Error('Informe uma justificativa com ao menos 5 caracteres.')
  if (!hasText(command.chaveCancelamento, 8)) throw new Error('A chave idempotente do cancelamento é inválida.')
  const receipt = typedRows<RepasseReciboRow>('repasse_recibos').find((row) => row.id === command.reciboId)
  if (!receipt) throw new Error('Recibo não encontrado.')
  if (receipt.status === 'CANCELADO') {
    if (receipt.chave_cancelamento === command.chaveCancelamento && receipt.motivo_cancelamento === command.justificativa.trim()) {
      return { recibo: { ...receipt }, repasseIds: receiptItems(receipt.id).map((item) => item.repasse_id), idempotent: true }
    }
    throw new Error('Este recibo já foi cancelado por outra operação.')
  }

  return transaction(['repasses', 'repasse_recibos', 'audit_logs'], () => {
    const items = receiptItems(receipt.id)
    if (items.length === 0) throw new Error('O recibo não possui itens auditáveis.')
    const userId = command.canceladoPorId ?? MOCK_USER_ID
    const cancelledAt = nowIso()
    items.forEach((item) => {
      const transfer = typedRows<RepasseRow>('repasses').find((row) => row.id === item.repasse_id)
      if (!transfer || transfer.status !== 'PAGO') throw new Error('Um item do recibo não está mais pago. Atualize antes de cancelar.')
      Object.assign(transfer, {
        status: 'LIBERADO' satisfies RepasseStatus, valor_pago: null, valor_diferenca: null,
        pago_em: null, forma_pagamento: null, comprovante_referencia: null, observacoes: null,
      })
      audit('repasse', transfer.id, 'status', 'PAGO', 'LIBERADO', userId)
    })
    Object.assign(receipt, {
      status: 'CANCELADO', chave_cancelamento: command.chaveCancelamento,
      cancelado_por_id: userId, cancelado_em: cancelledAt,
      motivo_cancelamento: command.justificativa.trim(), atualizado_em: cancelledAt,
    })
    audit('repasse_recibo', receipt.id, 'status', 'EMITIDO', 'CANCELADO', userId)
    return { recibo: { ...receipt }, repasseIds: items.map((item) => item.repasse_id), idempotent: false }
  })
}

export function snapshotRepasseState(): { repasses: RepasseRow[]; recibos: RepasseReciboRow[]; itens: RepasseReciboItemRow[] } {
  return {
    repasses: typedRows<RepasseRow>('repasses').map((row) => ({ ...row })),
    recibos: typedRows<RepasseReciboRow>('repasse_recibos').map((row) => ({ ...row })),
    itens: typedRows<RepasseReciboItemRow>('repasse_recibo_itens').map((row) => ({ ...row })),
  }
}
