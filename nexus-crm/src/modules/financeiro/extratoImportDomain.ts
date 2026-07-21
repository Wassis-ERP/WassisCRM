import { getTable, MOCK_TENANT_ID, MOCK_USER_ID, newId, nowIso } from '../../lib/inMemoryDb'
import type {
  ComissaoConciliacaoOcorrenciaRow,
  ComissaoConciliacaoRow,
  ComissaoConciliacaoTipo,
  ComissaoExtratoFormato,
  ComissaoExtratoItemRow,
  ComissaoExtratoItemStatus,
  ComissaoExtratoRow,
} from '../../types/database'
import { buildExtratoIdempotencyKey, buildExtratoItemIdempotencyKey } from './conciliacaoContract'
import { listFinanceiroComissoes, type FinanceiroComissao } from './comissoesDomain'

export type ImportAssociationKind = 'EXATA' | 'SUGERIDA' | 'AMBIGUA' | 'PARCIAL' | 'MANUAL' | 'NAO_ENCONTRADA'

export interface CommissionImportItem {
  id: string
  sequence: number
  externalId: string
  insuredName: string
  proposalNumber: string
  policyNumber: string
  installmentNumber: string
  competence: string
  grossValue: number
  discountValue: number
  netValue: number
  percentage: number | null
  originalDescription: string
  candidateIds: string[]
  selectedCommissionId: string | null
  associationKind: ImportAssociationKind
  confidence: number | null
  ignored: boolean
  resolutionNote: string
  editedFields: string[]
}

export interface CommissionImportPreview {
  fileName: string
  fileSize: number
  mimeType: string
  fileHash: string
  format: Extract<ComissaoExtratoFormato, 'PDF' | 'XLS' | 'XLSX'>
  branchId: string
  insurerId: string
  competence: string
  periodStart: string
  periodEnd: string
  issueDate: string
  creditDate: string
  externalReference: string
  grossTotal: number
  netTotal: number
  discountTotal: number
  currency: string
  totalizationNote: string
  parserIdentifier: string
  parserVersion: string
  duplicateExtractId: string | null
  items: CommissionImportItem[]
}

export interface ProcessCommissionStatementCommand {
  file: File
  branchId: string
  insurerId: string
  competence: string
}

export interface ConfirmCommissionImportResult {
  extractId: string
  commissionIds: string[]
  reconciliations: number
  occurrences: number
  ignoredItems: number
  idempotent: boolean
}

const typedRows = <T,>(table: string): T[] => getTable(table) as unknown as T[]
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const importTables = [
  'comissao_extratos', 'comissao_extrato_itens',
  'comissao_conciliacoes', 'comissao_conciliacao_ocorrencias',
] as const

function transaction<T>(work: () => T): T {
  const snapshots = new Map(importTables.map((table) => [table, getTable(table).map((row) => ({ ...row }))]))
  try {
    return work()
  } catch (error) {
    snapshots.forEach((rows, table) => getTable(table).splice(0, getTable(table).length, ...rows))
    throw error
  }
}

function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLocaleLowerCase('pt-BR') ?? ''
}

function fileFormat(file: File): CommissionImportPreview['format'] {
  const extension = extensionOf(file.name)
  if (extension === 'pdf') return 'PDF'
  if (extension === 'xls') return 'XLS'
  if (extension === 'xlsx') return 'XLSX'
  throw new Error('Formato não suportado. Selecione um arquivo PDF, XLS ou XLSX.')
}

function hasSignature(format: CommissionImportPreview['format'], bytes: Uint8Array): boolean {
  if (format === 'PDF') return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
  if (format === 'XLSX') return bytes[0] === 0x50 && bytes[1] === 0x4b
  const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
  return signature.every((value, index) => bytes[index] === value)
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('O navegador não oferece cálculo seguro de hash para este arquivo.')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function eligibleCommissions(branchId: string, insurerId: string): FinanceiroComissao[] {
  return listFinanceiroComissoes(null).filter((row) =>
    row.filialId === branchId
    && row.seguradoraId === insurerId
    && row.statusOperacional !== 'CANCELADA'
    && Math.abs(row.saldo) > 0.01,
  )
}

function simulatedItem(row: FinanceiroComissao, sequence: number, kind: ImportAssociationKind): CommissionImportItem {
  const partial = kind === 'PARCIAL'
  const netValue = partial ? money(row.saldo / 2) : row.saldo
  return {
    id: `preview-${sequence}-${row.id}`,
    sequence,
    externalId: `LINHA-${String(sequence).padStart(3, '0')}`,
    insuredName: row.seguradoNome,
    proposalNumber: row.propostaNumero ?? row.documentoReferencia,
    policyNumber: row.apoliceNumero ?? '',
    installmentNumber: String(row.numero ?? sequence),
    competence: row.competencia_inicio ?? new Date().toISOString().slice(0, 10),
    grossValue: netValue,
    discountValue: 0,
    netValue,
    percentage: row.percentual,
    originalDescription: `${row.seguradoNome} · ${row.documentoReferencia} · ${netValue.toFixed(2)}`,
    candidateIds: [row.id],
    selectedCommissionId: row.id,
    associationKind: kind,
    confidence: kind === 'EXATA' ? 100 : kind === 'PARCIAL' ? 92 : 86,
    ignored: false,
    resolutionNote: '',
    editedFields: [],
  }
}

export function summarizeImportPreview(preview: CommissionImportPreview) {
  const itemsGross = money(preview.items.reduce((total, item) => total + item.grossValue, 0))
  const itemsNet = money(preview.items.reduce((total, item) => total + item.netValue, 0))
  const itemsDiscounts = money(preview.items.reduce((total, item) => total + item.discountValue, 0))
  const difference = money(preview.netTotal - itemsNet)
  return { itemsGross, itemsNet, itemsDiscounts, difference, compatible: Math.abs(difference) <= 0.01 }
}

export function refreshImportItem(item: CommissionImportItem, rows: readonly FinanceiroComissao[]): CommissionImportItem {
  if (item.ignored) return { ...item, associationKind: item.selectedCommissionId ? item.associationKind : 'NAO_ENCONTRADA' }
  const selected = rows.find((row) => row.id === item.selectedCommissionId)
  if (!selected) {
    return {
      ...item,
      associationKind: item.candidateIds.length > 1 ? 'AMBIGUA' : 'NAO_ENCONTRADA',
      confidence: null,
    }
  }
  const manual = !item.candidateIds.includes(selected.id)
  const difference = money(item.netValue - selected.saldo)
  const partial = Math.abs(item.netValue) + 0.01 < Math.abs(selected.saldo)
  const exact = Math.abs(difference) <= 0.01
  return {
    ...item,
    associationKind: manual ? 'MANUAL' : partial ? 'PARCIAL' : exact && item.confidence === 100 ? 'EXATA' : 'SUGERIDA',
    confidence: manual ? 100 : item.confidence,
  }
}

export function validateImportPreview(preview: CommissionImportPreview, rows: readonly FinanceiroComissao[]): string[] {
  const totalization = summarizeImportPreview(preview)
  const headerErrors = Math.abs(totalization.difference) > 0.01 && preview.totalizationNote.trim().length < 5
    ? ['Cabeçalho: justifique a diferença entre o total líquido informado e a soma dos itens.']
    : []
  return [...headerErrors, ...preview.items.flatMap((item) => {
    const current = refreshImportItem(item, rows)
    if (current.ignored) return current.resolutionNote.trim().length >= 5 ? [] : [`Linha ${current.sequence}: informe o motivo do descarte.`]
    if (!current.selectedCommissionId) return [`Linha ${current.sequence}: escolha uma comissão ou descarte o item.`]
    const selected = rows.find((row) => row.id === current.selectedCommissionId)
    if (!selected) return [`Linha ${current.sequence}: a comissão selecionada não está disponível.`]
    if (Math.abs(current.netValue - selected.saldo) > 0.01 && current.resolutionNote.trim().length < 5) {
      return [`Linha ${current.sequence}: justifique a diferença ou parcialidade.`]
    }
    if (![current.grossValue, current.discountValue, current.netValue].every(Number.isFinite)) {
      return [`Linha ${current.sequence}: revise os valores informados.`]
    }
    if (current.discountValue < 0) return [`Linha ${current.sequence}: descontos não podem ser negativos.`]
    return []
  })]
}

export async function processCommissionStatementFile(command: ProcessCommissionStatementCommand): Promise<CommissionImportPreview> {
  if (!command.branchId || !command.insurerId) throw new Error('Selecione a corretora e a seguradora.')
  if (!validDate(command.competence)) throw new Error('Informe uma competência válida.')
  const format = fileFormat(command.file)
  const buffer = await command.file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (bytes.length === 0) throw new Error('O arquivo está vazio e não possui conteúdo útil.')
  if (!hasSignature(format, bytes)) throw new Error('A assinatura do arquivo não corresponde ao formato selecionado.')
  if (format === 'PDF' && new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 4096))).includes('/Encrypt')) {
    throw new Error('O arquivo está protegido. Gere uma cópia sem senha para continuar.')
  }
  const candidates = eligibleCommissions(command.branchId, command.insurerId)
  if (candidates.length === 0) throw new Error('Não há comissões pendentes para a corretora e a seguradora selecionadas.')
  const hash = await sha256(buffer)
  const duplicate = typedRows<ComissaoExtratoRow>('comissao_extratos').find((row) =>
    row.filial_id === command.branchId
    && row.seguradora_id === command.insurerId
    && row.arquivo_hash_sha256 === hash,
  )
  const items = candidates.slice(0, 3).map((row, index) => simulatedItem(
    row,
    index + 1,
    index === 0 ? 'EXATA' : index === 2 ? 'PARCIAL' : 'SUGERIDA',
  ))
  const grossTotal = money(items.reduce((total, item) => total + item.grossValue, 0))
  const discountTotal = money(items.reduce((total, item) => total + item.discountValue, 0))
  const netTotal = money(items.reduce((total, item) => total + item.netValue, 0))
  const competenceMonth = command.competence.slice(0, 7)
  const periodEnd = new Date(Number(competenceMonth.slice(0, 4)), Number(competenceMonth.slice(5, 7)), 0)
    .toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  return {
    fileName: command.file.name,
    fileSize: command.file.size,
    mimeType: command.file.type || 'application/octet-stream',
    fileHash: hash,
    format,
    branchId: command.branchId,
    insurerId: command.insurerId,
    competence: command.competence,
    periodStart: `${competenceMonth}-01`,
    periodEnd,
    issueDate: today,
    creditDate: today,
    externalReference: `DEMO-${new Date().toISOString().slice(0, 10)}-${hash.slice(0, 8).toUpperCase()}`,
    grossTotal,
    netTotal,
    discountTotal,
    currency: 'BRL',
    totalizationNote: '',
    parserIdentifier: 'backend-mock-demonstrativo-comissao',
    parserVersion: '1.0.0',
    duplicateExtractId: duplicate?.id ?? null,
    items,
  }
}

function occurrenceType(item: CommissionImportItem, selected: FinanceiroComissao | undefined): ComissaoConciliacaoOcorrenciaRow['tipo'] {
  if (!selected) return item.candidateIds.length > 1 ? 'MULTIPLAS_COMISSOES' : 'COMISSAO_NAO_ENCONTRADA'
  if (item.associationKind === 'AMBIGUA') return 'MULTIPLAS_COMISSOES'
  if (item.editedFields.includes('insuredName')) return 'SEGURADO_DIVERGENTE'
  if (item.editedFields.includes('policyNumber')) return 'APOLICE_DIVERGENTE'
  return 'VALOR_DIVERGENTE'
}

function associationType(kind: ImportAssociationKind): ComissaoConciliacaoTipo {
  if (kind === 'EXATA') return 'EXATA'
  if (kind === 'PARCIAL') return 'PARCIAL'
  if (kind === 'MANUAL' || kind === 'AMBIGUA') return 'MANUAL'
  return 'SUGERIDA'
}

export function confirmCommissionImport(preview: CommissionImportPreview): ConfirmCommissionImportResult {
  const rows = listFinanceiroComissoes(null)
  const errors = validateImportPreview(preview, rows)
  if (errors.length > 0) throw new Error(errors[0])
  const key = buildExtratoIdempotencyKey({
    filialId: preview.branchId,
    seguradoraId: preview.insurerId,
    arquivoHash: preview.fileHash,
  })
  const existing = typedRows<ComissaoExtratoRow>('comissao_extratos').find((row) => row.chave_idempotencia === key)
  if (existing) {
    const itemIds = new Set(typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').filter((item) => item.extrato_id === existing.id).map((item) => item.id))
    const reconciliations = typedRows<ComissaoConciliacaoRow>('comissao_conciliacoes').filter((row) => itemIds.has(row.item_id) && row.status === 'CONFIRMADA')
    const currentRows = listFinanceiroComissoes(null)
    const eligibleIds = reconciliations.flatMap((reconciliation) => {
      const commission = currentRows.find((row) => row.id === reconciliation.comissao_id)
      return commission && Math.abs((reconciliation.valor_conciliado ?? 0) - commission.saldo) <= 0.01 ? [commission.id] : []
    })
    return {
      extractId: existing.id,
      commissionIds: Array.from(new Set(eligibleIds)),
      reconciliations: reconciliations.length,
      occurrences: typedRows<ComissaoConciliacaoOcorrenciaRow>('comissao_conciliacao_ocorrencias').filter((row) => itemIds.has(row.item_id)).length,
      ignoredItems: typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').filter((row) => itemIds.has(row.id) && row.status_conciliacao === 'IGNORADO').length,
      idempotent: true,
    }
  }

  return transaction(() => {
    const createdAt = nowIso()
    const extractId = newId()
    const reconciledIds: string[] = []
    const eligibleIds: string[] = []
    let occurrenceCount = 0
    let ignoredCount = 0
    const normalizedItems = preview.items.map((item) => refreshImportItem(item, rows))
    const totalization = summarizeImportPreview({ ...preview, items: normalizedItems })

  const extract: ComissaoExtratoRow = {
    id: extractId,
    tenant_id: MOCK_TENANT_ID,
    filial_id: preview.branchId,
    seguradora_id: preview.insurerId,
    identificacao_externa: preview.externalReference,
    competencia: preview.competence,
    periodo_inicio: preview.periodStart,
    periodo_fim: preview.periodEnd,
    data_emissao: preview.issueDate,
    data_recebimento: preview.creditDate,
    arquivo_nome: preview.fileName,
    arquivo_referencia: `mock://comissao-extratos/${extractId}/${encodeURIComponent(preview.fileName)}`,
    origem_tipo: 'ARQUIVO',
    origem_formato: preview.format,
    arquivo_mime_type: preview.mimeType,
    arquivo_hash_sha256: preview.fileHash,
    chave_idempotencia: key,
    parser_identificador: preview.parserIdentifier,
    parser_versao: preview.parserVersion,
    tentativa_processamento: 1,
    status_processamento: 'NORMALIZADO',
    status_conciliacao: 'EM_ANALISE',
    quantidade_itens: normalizedItems.length,
    valor_bruto_total: preview.grossTotal,
    valor_liquido_total: preview.netTotal,
    valor_descontos_total: preview.discountTotal,
    moeda: preview.currency,
    erro_codigo: null,
    erro_mensagem_segura: null,
    recebido_por_id: MOCK_USER_ID,
    processado_por_id: MOCK_USER_ID,
    recebido_em: createdAt,
    processamento_iniciado_em: createdAt,
    processamento_concluido_em: createdAt,
    criado_em: createdAt,
    atualizado_em: createdAt,
    observacoes: [
      'Processamento demonstrativo do frontend; extração autoritativa será fornecida pelo backend.',
      totalization.compatible ? null : `Diferença de totalização justificada: ${preview.totalizationNote.trim()}`,
    ].filter(Boolean).join(' '),
  }
  typedRows<ComissaoExtratoRow>('comissao_extratos').push(extract)

  normalizedItems.forEach((item) => {
    const selected = rows.find((row) => row.id === item.selectedCommissionId)
    const itemId = newId()
    const storedStatus: ComissaoExtratoItemStatus = item.ignored ? 'IGNORADO' : selected ? 'PRONTO_PARA_BAIXAR' : item.candidateIds.length > 1 ? 'AMBIGUO' : 'NAO_ENCONTRADO'
    const storedItem: ComissaoExtratoItemRow = {
      id: itemId,
      extrato_id: extractId,
      identificacao_externa: item.externalId,
      sequencia_externa: String(item.sequence),
      chave_idempotencia: buildExtratoItemIdempotencyKey({ extratoId: extractId, identificacaoExterna: item.externalId }),
      produtor_id: null,
      ramo_id: selected?.ramoId ?? null,
      produtor_beneficiario_informado: null,
      proposta_numero_informado: item.proposalNumber || null,
      apolice_numero_informado: item.policyNumber || null,
      endosso_numero_informado: null,
      documento_numero_informado: item.policyNumber || item.proposalNumber || null,
      parcela_numero_informado: item.installmentNumber || null,
      segurado_nome_informado: item.insuredName || null,
      competencia: item.competence,
      data_credito: null,
      data_recebimento_informada: null,
      valor_bruto_informado: item.grossValue,
      valor_liquido_informado: item.netValue,
      valor_descontos_informado: item.discountValue,
      percentual_informado: item.percentage,
      tipo_comissao: selected?.tipo_comissao ?? null,
      seguradora_lote_informado: preview.externalReference,
      seguradora_referencia_informada: item.externalId,
      descricao_original: item.originalDescription,
      status_conciliacao: storedStatus,
      normalizado_em: createdAt,
      criado_em: createdAt,
      atualizado_em: createdAt,
    }
    typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').push(storedItem)

    let reconciliation: ComissaoConciliacaoRow | null = null
    if (selected && !item.ignored) {
      const difference = money(item.netValue - selected.saldo)
      reconciliation = {
        id: newId(),
        item_id: itemId,
        comissao_id: selected.id,
        chave_idempotencia: `${storedItem.chave_idempotencia}|${selected.id}`,
        tipo_associacao: associationType(item.associationKind),
        status: 'CONFIRMADA',
        confianca_pct: item.confidence,
        valor_previsto_snapshot: selected.saldo,
        valor_informado_alocado: item.netValue,
        valor_conciliado: item.netValue,
        valor_diferenca: difference,
        percentual_previsto_snapshot: selected.percentual,
        percentual_informado_snapshot: item.percentage,
        percentual_diferenca: selected.percentual === null || item.percentage === null ? null : money(item.percentage - selected.percentual),
        competencia_prevista_inicio: selected.competencia_inicio,
        competencia_prevista_fim: selected.competencia_fim,
        competencia_informada: item.competence,
        motivo: item.resolutionNote.trim() || null,
        associado_por_id: MOCK_USER_ID,
        confirmado_por_id: MOCK_USER_ID,
        criado_em: createdAt,
        confirmado_em: createdAt,
        atualizado_em: createdAt,
      }
      typedRows<ComissaoConciliacaoRow>('comissao_conciliacoes').push(reconciliation)
      reconciledIds.push(selected.id)
      if (Math.abs(item.netValue - selected.saldo) <= 0.01) eligibleIds.push(selected.id)
    }

    const needsOccurrence = item.ignored || item.editedFields.length > 0 || item.associationKind === 'AMBIGUA'
      || (selected ? Math.abs(item.netValue - selected.saldo) > 0.01 : true)
    if (needsOccurrence) {
      const resolved = item.ignored || Boolean(selected)
      typedRows<ComissaoConciliacaoOcorrenciaRow>('comissao_conciliacao_ocorrencias').push({
        id: newId(),
        item_id: itemId,
        conciliacao_id: reconciliation?.id ?? null,
        tipo: occurrenceType(item, selected),
        status: resolved ? 'RESOLVIDA' : 'ABERTA',
        motivo: item.resolutionNote.trim() || 'Revisão necessária antes da baixa.',
        valor_esperado: selected?.saldo ?? null,
        valor_encontrado: item.netValue,
        percentual_esperado: selected?.percentual ?? null,
        percentual_encontrado: item.percentage,
        competencia_esperada_inicio: selected?.competencia_inicio ?? null,
        competencia_esperada_fim: selected?.competencia_fim ?? null,
        competencia_encontrada: item.competence,
        resolucao_tipo: resolved ? item.ignored ? 'ITEM_DESCARTADO' : item.editedFields.length > 0 ? 'DADO_CORRIGIDO' : item.associationKind === 'AMBIGUA' ? 'VINCULO_CORRIGIDO' : 'DIVERGENCIA_ACEITA' : null,
        resolucao_observacao: resolved ? item.resolutionNote.trim() || 'Vínculo confirmado na prévia.' : null,
        identificada_por_id: MOCK_USER_ID,
        resolvida_por_id: resolved ? MOCK_USER_ID : null,
        identificada_em: createdAt,
        resolvida_em: resolved ? createdAt : null,
        atualizado_em: createdAt,
      })
      occurrenceCount += 1
    }
    if (item.ignored) ignoredCount += 1
  })

    extract.status_conciliacao = normalizedItems.every((item) => item.ignored || item.selectedCommissionId) ? 'CONCILIADO' : 'COM_OCORRENCIAS'
    extract.atualizado_em = nowIso()
    return {
      extractId,
      commissionIds: Array.from(new Set(eligibleIds)),
      reconciliations: reconciledIds.length,
      occurrences: occurrenceCount,
      ignoredItems: ignoredCount,
      idempotent: false,
    }
  })
}
