import {
  getTable,
  MOCK_TENANT_ID,
  MOCK_USER_ID,
  newId,
  nowIso,
} from '../../lib/inMemoryDb'
import type {
  ComissaoBaixaConciliacaoRow,
  ComissaoBaixaMotivoTipo,
  ComissaoBaixaRow,
  ComissaoConciliacaoOcorrenciaRow,
  ComissaoConciliacaoRow,
  ComissaoExtratoItemRow,
  ComissaoExtratoRow,
  ComissaoRow,
  ComissaoStatus,
  Database,
  RepasseRow,
} from '../../types/database'

type ProposalRow = Database['public']['Tables']['propostas']['Row']
type PolicyRow = Database['public']['Tables']['apolices']['Row']
type InsuredRow = Database['public']['Tables']['segurados']['Row']
type InsurerRow = Database['public']['Tables']['seguradoras']['Row']
type RamoRow = Database['public']['Tables']['ramos']['Row']
type AuditInsert = Database['public']['Tables']['audit_logs']['Insert'] & { id: string }
type BranchRow = { id: string; fantasia: string | null; razao_social: string | null }
type ProfileRow = { id: string; nome: string | null }

export type ComissaoStatusOperacional = 'PENDENTE' | 'CONCILIADA' | 'PARCIAL' | 'DIVERGENTE' | 'BAIXADA' | 'CANCELADA'

export interface ComissaoHistoricoItem extends ComissaoBaixaRow {
  autorNome: string
  valorAtivo: number
  podeEstornar: boolean
  bloqueioEstorno: string | null
  conciliacoes: number
}

export interface FinanceiroComissao extends ComissaoRow {
  statusOperacional: ComissaoStatusOperacional
  propostaNumero: string | null
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
  valorInformadoBruto: number
  valorInformadoLiquido: number
  valorDescontosInformado: number
  valorConciliado: number
  valorBaixado: number
  saldo: number
  diferenca: number
  conciliacoesConfirmadas: number
  conciliacoesPendentes: number
  ocorrenciasAbertas: number
  conciliacaoIds: string[]
  historico: ComissaoHistoricoItem[]
}

export interface ComissaoFilters {
  filialId: string
  seguradoId: string
  seguradoraId: string
  ramoId: string
  documento: string
  competenciaDe: string
  competenciaAte: string
  status: '' | ComissaoStatusOperacional
  tipo: '' | ComissaoRow['tipo_comissao']
}

export interface BaixaManualItemInput {
  comissaoId: string
  valorBruto: number
  valorDescontos: number
  valorEfetivo: number
  percentualInformado?: number | null
  justificativa?: string
  conciliacaoIds?: string[]
}

export interface BaixaManualCommand {
  filialId: string
  seguradoraId: string
  competencia: string
  dataEfetiva: string
  identificacaoExterna?: string
  observacoes?: string
  justificativa?: string
  chaveIdempotencia: string
  items: BaixaManualItemInput[]
}

export interface BaixaManualResult {
  extratoId: string | null
  baixaIds: string[]
  comissaoIds: string[]
  idempotent: boolean
}

export interface EstornoComissaoCommand {
  baixaId: string
  dataEfetiva: string
  justificativa: string
  chaveIdempotencia: string
  valor?: number
}

const MONEY_TOLERANCE = 0.01
const typedRows = <T,>(table: string): T[] => getTable(table) as unknown as T[]
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const hasValue = (value: string | undefined, minimum = 5) => (value?.trim().length ?? 0) >= minimum
const sameDirection = (left: number, right: number) => Math.sign(left) === Math.sign(right)

function documentReference(proposal: ProposalRow): string {
  if (proposal.numero_fatura) return proposal.numero_fatura
  if (proposal.numero_endosso && proposal.numero_endosso !== '0') return `Endosso ${proposal.numero_endosso}`
  return proposal.numero_proposta ?? 'Documento sem número'
}

function sum(rows: readonly number[]): number {
  return roundMoney(rows.reduce((total, value) => total + value, 0))
}

function eventTotal(commissionId: string): number {
  return sum(typedRows<ComissaoBaixaRow>('comissao_baixas')
    .filter((event) => event.comissao_id === commissionId)
    .map((event) => event.valor_efetivo))
}

function projectCommission(commission: ComissaoRow): Exclude<ComissaoStatus, 'CANCELADA'> {
  const received = eventTotal(commission.id)
  const expected = roundMoney(commission.valor_previsto ?? 0)
  const difference = roundMoney(received - expected)
  let status: Exclude<ComissaoStatus, 'CANCELADA'>

  if (Math.abs(received) <= MONEY_TOLERANCE) status = 'PREVISTA'
  else if (sameDirection(received, expected) && Math.abs(received) < Math.abs(expected) - MONEY_TOLERANCE) status = 'PARCIAL'
  else if (Math.abs(difference) <= MONEY_TOLERANCE) status = 'RECEBIDA'
  else status = 'DIVERGENTE'

  const positiveEvents = typedRows<ComissaoBaixaRow>('comissao_baixas')
    .filter((event) => event.comissao_id === commission.id && event.tipo === 'BAIXA')
    .sort((a, b) => b.data_efetiva.localeCompare(a.data_efetiva))
  Object.assign(commission, {
    valor_recebido: received,
    valor_diferenca: difference,
    recebida_em: Math.abs(received) <= MONEY_TOLERANCE ? null : positiveEvents[0]?.data_efetiva ?? null,
    status,
  })

  const transfers = typedRows<RepasseRow>('repasses').filter((row) => row.comissao_id === commission.id)
  if (Math.abs(received) > MONEY_TOLERANCE) {
    transfers.filter((row) => row.status === 'PREVISTO').forEach((row) => Object.assign(row, {
      status: 'LIBERADO',
      liberado_em: positiveEvents[0]?.data_efetiva ?? null,
    }))
  } else {
    transfers.filter((row) => row.status === 'LIBERADO').forEach((row) => Object.assign(row, {
      status: 'PREVISTO',
      liberado_em: null,
    }))
  }
  return status
}

function eventHistory(commissionId: string): ComissaoHistoricoItem[] {
  const events = typedRows<ComissaoBaixaRow>('comissao_baixas').filter((row) => row.comissao_id === commissionId)
  const bridges = typedRows<ComissaoBaixaConciliacaoRow>('comissao_baixa_conciliacoes')
  const profiles = typedRows<ProfileRow>('profiles')
  const hasPaidTransfer = typedRows<RepasseRow>('repasses').some((row) => row.comissao_id === commissionId && row.status === 'PAGO')

  return events.map((event) => {
    const reversed = event.tipo === 'BAIXA'
      ? sum(events.filter((candidate) => candidate.baixa_origem_id === event.id).map((candidate) => candidate.valor_efetivo))
      : 0
    const active = event.tipo === 'BAIXA' ? roundMoney(event.valor_efetivo + reversed) : event.valor_efetivo
    const exhausted = Math.abs(active) <= MONEY_TOLERANCE
    return {
      ...event,
      autorNome: profiles.find((profile) => profile.id === event.criado_por_id)?.nome ?? 'Usuário W.Assis',
      valorAtivo: active,
      podeEstornar: event.tipo === 'BAIXA' && !exhausted && !hasPaidTransfer,
      bloqueioEstorno: event.tipo !== 'BAIXA'
        ? 'Eventos de estorno não geram novo estorno.'
        : exhausted
          ? 'Esta baixa já foi integralmente estornada.'
          : hasPaidTransfer
            ? 'Existe repasse pago vinculado; corrija o repasse antes do estorno.'
            : null,
      conciliacoes: bridges.filter((bridge) => bridge.baixa_id === event.id).length,
    }
  }).sort((a, b) => b.criado_em.localeCompare(a.criado_em))
}

export function listFinanceiroComissoes(branchIds?: readonly string[] | null): FinanceiroComissao[] {
  const proposals = typedRows<ProposalRow>('propostas')
  const policies = typedRows<PolicyRow>('apolices')
  const insureds = typedRows<InsuredRow>('segurados')
  const insurers = typedRows<InsurerRow>('seguradoras')
  const branches = typedRows<BranchRow>('filiais')
  const ramos = typedRows<RamoRow>('ramos')
  const items = typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens')
  const reconciliations = typedRows<ComissaoConciliacaoRow>('comissao_conciliacoes')
  const occurrences = typedRows<ComissaoConciliacaoOcorrenciaRow>('comissao_conciliacao_ocorrencias')
  const allowedBranches = branchIds ? new Set(branchIds) : null

  return typedRows<ComissaoRow>('comissoes').flatMap((commission): FinanceiroComissao[] => {
    const proposal = proposals.find((row) => row.id === commission.proposta_id)
    const policy = proposal ? policies.find((row) => row.id === proposal.apolice_id) : undefined
    const insured = policy ? insureds.find((row) => row.id === policy.segurado_id) : undefined
    if (!proposal || !policy || !insured?.filial_id || (allowedBranches && !allowedBranches.has(insured.filial_id))) return []
    const insurer = policy.seguradora_id ? insurers.find((row) => row.id === policy.seguradora_id) : undefined
    const branch = branches.find((row) => row.id === insured.filial_id)
    const ramo = policy.ramo_id ? ramos.find((row) => row.id === policy.ramo_id) : undefined
    const confirmed = reconciliations.filter((row) => row.comissao_id === commission.id && row.status === 'CONFIRMADA')
    const suggested = reconciliations.filter((row) => row.comissao_id === commission.id && row.status === 'SUGERIDA')
    const itemIds = new Set(confirmed.map((row) => row.item_id))
    const relatedItems = items.filter((row) => itemIds.has(row.id))
    const lowered = eventTotal(commission.id)
    const expected = roundMoney(commission.valor_previsto ?? 0)
    const balance = roundMoney(expected - lowered)
    const difference = roundMoney(lowered - expected)
    const openOccurrences = occurrences.filter((row) => itemIds.has(row.item_id) && ['ABERTA', 'EM_ANALISE'].includes(row.status)).length
    let operationalStatus: ComissaoStatusOperacional = 'PENDENTE'
    if (commission.status === 'CANCELADA') operationalStatus = 'CANCELADA'
    else if (Math.abs(lowered) > MONEY_TOLERANCE) {
      if (sameDirection(lowered, expected) && Math.abs(lowered) < Math.abs(expected) - MONEY_TOLERANCE) operationalStatus = 'PARCIAL'
      else if (Math.abs(difference) <= MONEY_TOLERANCE) operationalStatus = 'BAIXADA'
      else operationalStatus = 'DIVERGENTE'
    } else if (confirmed.length > 0) operationalStatus = 'CONCILIADA'

    return [{
      ...commission,
      statusOperacional: operationalStatus,
      propostaNumero: proposal.numero_proposta,
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
      valorInformadoBruto: sum(relatedItems.map((item) => item.valor_bruto_informado ?? 0)),
      valorInformadoLiquido: sum(relatedItems.map((item) => item.valor_liquido_informado ?? 0)),
      valorDescontosInformado: sum(relatedItems.map((item) => item.valor_descontos_informado ?? 0)),
      valorConciliado: sum(confirmed.map((row) => row.valor_conciliado ?? 0)),
      valorBaixado: lowered,
      saldo: balance,
      diferenca: difference,
      conciliacoesConfirmadas: confirmed.length,
      conciliacoesPendentes: suggested.length,
      ocorrenciasAbertas: openOccurrences,
      conciliacaoIds: confirmed.map((row) => row.id),
      historico: eventHistory(commission.id),
    }]
  }).sort((a, b) => (a.prevista_em ?? '').localeCompare(b.prevista_em ?? '') || (a.numero ?? 0) - (b.numero ?? 0))
}

export function filterFinanceiroComissoes(rows: FinanceiroComissao[], filters: ComissaoFilters): FinanceiroComissao[] {
  const term = filters.documento.trim().toLocaleLowerCase('pt-BR')
  return rows.filter((row) => {
    if (filters.filialId && row.filialId !== filters.filialId) return false
    if (filters.seguradoId && row.seguradoId !== filters.seguradoId) return false
    if (filters.seguradoraId && row.seguradoraId !== filters.seguradoraId) return false
    if (filters.ramoId && row.ramoId !== filters.ramoId) return false
    if (filters.status && row.statusOperacional !== filters.status) return false
    if (filters.tipo && row.tipo_comissao !== filters.tipo) return false
    if (filters.competenciaDe && (!row.competencia_inicio || row.competencia_inicio < filters.competenciaDe)) return false
    if (filters.competenciaAte && (!row.competencia_inicio || row.competencia_inicio > filters.competenciaAte)) return false
    if (term) {
      const haystack = [row.documentoReferencia, row.propostaNumero, row.apoliceNumero, row.seguradoNome]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLocaleLowerCase('pt-BR')
      if (!haystack.includes(term)) return false
    }
    return true
  })
}

const touchedTables = [
  'comissoes', 'comissao_extratos', 'comissao_extrato_itens', 'comissao_conciliacoes',
  'comissao_conciliacao_ocorrencias', 'comissao_baixas', 'comissao_baixa_conciliacoes',
  'repasses', 'audit_logs',
] as const

function transaction<T>(work: () => T): T {
  const snapshots = new Map(touchedTables.map((table) => [table, getTable(table).map((row) => ({ ...row }))]))
  try {
    return work()
  } catch (error) {
    snapshots.forEach((rows, table) => getTable(table).splice(0, getTable(table).length, ...rows))
    throw error
  }
}

function audit(event: ComissaoBaixaRow): void {
  const entry: AuditInsert = {
    id: newId(), tenant_id: MOCK_TENANT_ID, user_id: MOCK_USER_ID,
    entidade_tipo: 'comissao_baixa', entidade_id: event.id, campo: 'valor_efetivo',
    valor_antigo: null,
    valor_novo: `tipo=${event.tipo};comissao=${event.comissao_id};valor=${event.valor_efetivo.toFixed(2)};saldo=${event.saldo_apos.toFixed(2)}`,
    acao: 'INSERT', ocorrido_em: event.criado_em, origem: 'FRONT_MOCK', ip: null,
    user_agent: 'WassisCRM frontend puro · Fase 3.3',
  }
  typedRows<AuditInsert>('audit_logs').push(entry)
}

function validateManualCommand(command: BaixaManualCommand): void {
  if (!validDate(command.dataEfetiva) || !validDate(command.competencia)) throw new Error('Informe competência e data efetiva válidas.')
  if (!command.filialId || !command.seguradoraId) throw new Error('Corretora e seguradora são obrigatórias.')
  if (!hasValue(command.chaveIdempotencia, 8)) throw new Error('A chave idempotente da baixa é inválida.')
  if (command.items.length === 0) throw new Error('Adicione ao menos uma comissão à baixa.')
  if (new Set(command.items.map((item) => item.comissaoId)).size !== command.items.length) throw new Error('A mesma comissão não pode aparecer duas vezes na baixa.')
}

function existingManualResult(command: BaixaManualCommand): BaixaManualResult | null {
  const receipts = command.items.map((item) => typedRows<ComissaoBaixaRow>('comissao_baixas')
    .find((row) => row.comissao_id === item.comissaoId && row.chave_idempotencia === `${command.chaveIdempotencia}|baixa|${item.comissaoId}`))
  if (receipts.every((event) => !event)) return null
  if (receipts.some((event) => !event)) throw new Error('Existe uma operação parcial com esta chave. Revise o histórico antes de repetir.')
  const completed = receipts.filter((event): event is ComissaoBaixaRow => Boolean(event))
  const receiptIds = new Set(completed.map((event) => event.id))
  const reconciliationIds = new Set(typedRows<ComissaoBaixaConciliacaoRow>('comissao_baixa_conciliacoes')
    .filter((bridge) => receiptIds.has(bridge.baixa_id)).map((bridge) => bridge.conciliacao_id))
  const itemIds = new Set(typedRows<ComissaoConciliacaoRow>('comissao_conciliacoes')
    .filter((row) => reconciliationIds.has(row.id)).map((row) => row.item_id))
  const extractId = typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').find((row) => itemIds.has(row.id))?.extrato_id ?? null
  return { extratoId: extractId, baixaIds: completed.map((row) => row.id), comissaoIds: completed.map((row) => row.comissao_id), idempotent: true }
}

export function registerManualCommissionReceipt(command: BaixaManualCommand): BaixaManualResult {
  validateManualCommand(command)
  const repeated = existingManualResult(command)
  if (repeated) return repeated

  return transaction(() => {
    const commissionRows = listFinanceiroComissoes(null)
    const commissions = typedRows<ComissaoRow>('comissoes')
    const normalizedItems = command.items.map((input) => {
      const view = commissionRows.find((row) => row.id === input.comissaoId)
      const commission = commissions.find((row) => row.id === input.comissaoId)
      if (!view || !commission) throw new Error('Uma comissão selecionada não foi encontrada.')
      if (view.filialId !== command.filialId || view.seguradoraId !== command.seguradoraId) {
        throw new Error('A baixa deve conter comissões da mesma corretora e seguradora.')
      }
      if (commission.status === 'CANCELADA') throw new Error('Comissões canceladas não admitem baixa.')
      if (view.ocorrenciasAbertas > 0 || view.conciliacoesPendentes > 0) {
        throw new Error('Resolva ocorrências e sugestões de conciliação antes de registrar a baixa.')
      }
      if (Math.abs(view.saldo) <= MONEY_TOLERANCE) throw new Error(`A comissão ${commission.numero ?? ''} não possui saldo pendente.`)
      if (![input.valorBruto, input.valorDescontos, input.valorEfetivo].every(Number.isFinite)) throw new Error('Informe valores numéricos válidos.')
      if (input.valorDescontos < 0) throw new Error('Descontos não podem ser negativos.')
      if (Math.abs(input.valorEfetivo) <= MONEY_TOLERANCE || !sameDirection(input.valorEfetivo, view.saldo)) {
        throw new Error('O valor efetivo deve ter o mesmo sinal do saldo da comissão.')
      }
      if (Math.abs(input.valorBruto) <= MONEY_TOLERANCE || !sameDirection(input.valorBruto, view.saldo)) {
        throw new Error('O valor bruto deve ter o mesmo sinal do saldo da comissão.')
      }
      const partial = Math.abs(input.valorEfetivo) < Math.abs(view.saldo) - MONEY_TOLERANCE
      const over = Math.abs(input.valorEfetivo) > Math.abs(view.saldo) + MONEY_TOLERANCE
      const netDifference = Math.abs(Math.abs(input.valorBruto) - input.valorDescontos - Math.abs(input.valorEfetivo)) > MONEY_TOLERANCE
      const percentageDifference = input.percentualInformado !== undefined && input.percentualInformado !== null && commission.percentual !== null
        && Math.abs(input.percentualInformado - commission.percentual) > MONEY_TOLERANCE
      const competenceDifference = Boolean(
        commission.competencia_inicio && commission.competencia_fim
          ? command.competencia < commission.competencia_inicio || command.competencia > commission.competencia_fim
          : commission.competencia_inicio && command.competencia !== commission.competencia_inicio,
      )
      const justification = input.justificativa?.trim() || command.justificativa?.trim() || ''
      if ((partial || over || netDifference || percentageDifference || competenceDifference) && !hasValue(justification)) {
        throw new Error('Baixa parcial ou divergente exige justificativa com ao menos 5 caracteres.')
      }
      const requestedReconciliationIds = Array.from(new Set(input.conciliacaoIds ?? []))
      const existingReconciliations = requestedReconciliationIds.map((id) =>
        typedRows<ComissaoConciliacaoRow>('comissao_conciliacoes').find((row) => row.id === id),
      )
      if (existingReconciliations.some((row) => !row)) throw new Error('Uma conciliação selecionada não foi encontrada.')
      const confirmedReconciliations = existingReconciliations.filter((row): row is ComissaoConciliacaoRow => Boolean(row))
      if (confirmedReconciliations.some((row) => row.comissao_id !== commission.id || row.status !== 'CONFIRMADA')) {
        throw new Error('Somente conciliações confirmadas da própria comissão podem ser consumidas pela baixa.')
      }
      if (confirmedReconciliations.length > 0) {
        const reconciliationIds = new Set(confirmedReconciliations.map((row) => row.id))
        const consumed = sum(typedRows<ComissaoBaixaConciliacaoRow>('comissao_baixa_conciliacoes')
          .filter((bridge) => reconciliationIds.has(bridge.conciliacao_id)).map((bridge) => bridge.valor_aplicado))
        const available = sum(confirmedReconciliations.map((row) => row.valor_conciliado ?? 0)) - consumed
        if (!sameDirection(available, input.valorEfetivo) || Math.abs(input.valorEfetivo) > Math.abs(available) + MONEY_TOLERANCE) {
          throw new Error('As conciliações selecionadas não possuem saldo suficiente para esta baixa.')
        }
      }
      const reason: ComissaoBaixaMotivoTipo = over || netDifference || percentageDifference || competenceDifference
        ? 'DIVERGENCIA_ACEITA' : partial ? 'PARCIAL' : 'EXATA'
      return {
        input, view, commission, partial, over, netDifference, percentageDifference,
        competenceDifference, justification, reason, existingReconciliations: confirmedReconciliations,
      }
    })

    const createdAt = nowIso()
    const manualItems = normalizedItems.filter(({ existingReconciliations }) => existingReconciliations.length === 0)
    const extractId = manualItems.length > 0 ? newId() : null
    const grossTotal = sum(manualItems.map(({ input }) => input.valorBruto))
    const discountsTotal = sum(manualItems.map(({ input }) => input.valorDescontos))
    const netTotal = sum(manualItems.map(({ input }) => input.valorEfetivo))
    if (extractId) {
      const extract: ComissaoExtratoRow = {
      id: extractId, tenant_id: MOCK_TENANT_ID, filial_id: command.filialId,
      seguradora_id: command.seguradoraId, identificacao_externa: command.identificacaoExterna?.trim() || null,
      competencia: command.competencia, periodo_inicio: command.competencia, periodo_fim: command.competencia,
      data_emissao: null, data_recebimento: command.dataEfetiva, arquivo_nome: null,
      arquivo_referencia: null, origem_tipo: 'MANUAL', origem_formato: null,
      arquivo_mime_type: null, arquivo_hash_sha256: null, chave_idempotencia: command.chaveIdempotencia,
      parser_identificador: null, parser_versao: null, tentativa_processamento: 1,
      status_processamento: 'NORMALIZADO', status_conciliacao: 'CONCILIADO',
      quantidade_itens: manualItems.length, valor_bruto_total: grossTotal,
      valor_liquido_total: netTotal, valor_descontos_total: discountsTotal, moeda: 'BRL',
      erro_codigo: null, erro_mensagem_segura: null, recebido_por_id: MOCK_USER_ID,
      processado_por_id: MOCK_USER_ID, recebido_em: createdAt,
      processamento_iniciado_em: createdAt, processamento_concluido_em: createdAt,
      criado_em: createdAt, atualizado_em: createdAt, observacoes: command.observacoes?.trim() || null,
      }
      typedRows<ComissaoExtratoRow>('comissao_extratos').push(extract)
    }

    const receiptIds: string[] = []
    normalizedItems.forEach(({ input, view, commission, over, netDifference, percentageDifference, competenceDifference, justification, reason, existingReconciliations }, index) => {
      let itemId: string
      let reconciliationRows: ComissaoConciliacaoRow[]
      const receiptId = newId()
      const previousReceived = eventTotal(commission.id)
      const expectedAfter = roundMoney((commission.valor_previsto ?? 0) - previousReceived - input.valorEfetivo)
      if (existingReconciliations.length > 0) {
        reconciliationRows = existingReconciliations
        itemId = existingReconciliations[0].item_id
      } else {
        if (!extractId) throw new Error('Não foi possível criar a origem manual da baixa.')
        itemId = newId()
        const reconciliationId = newId()
        const item: ComissaoExtratoItemRow = {
          id: itemId, extrato_id: extractId, identificacao_externa: command.identificacaoExterna?.trim() || null,
          sequencia_externa: String(index + 1), chave_idempotencia: `${command.chaveIdempotencia}|item|${commission.id}`,
          produtor_id: null, ramo_id: view.ramoId, produtor_beneficiario_informado: null,
          proposta_numero_informado: view.propostaNumero, apolice_numero_informado: view.apoliceNumero,
          endosso_numero_informado: null, documento_numero_informado: view.documentoReferencia,
          parcela_numero_informado: commission.numero === null ? null : String(commission.numero),
          segurado_nome_informado: view.seguradoNome, competencia: command.competencia,
          data_credito: command.dataEfetiva, data_recebimento_informada: command.dataEfetiva,
          valor_bruto_informado: input.valorBruto, valor_liquido_informado: input.valorEfetivo,
          valor_descontos_informado: input.valorDescontos,
          percentual_informado: input.percentualInformado ?? commission.percentual,
          tipo_comissao: commission.tipo_comissao, seguradora_lote_informado: command.identificacaoExterna?.trim() || null,
          seguradora_referencia_informada: command.identificacaoExterna?.trim() || null,
          descricao_original: command.observacoes?.trim() || 'Baixa manual registrada no cockpit Financeiro',
          status_conciliacao: over || netDifference || percentageDifference || competenceDifference ? 'DIVERGENTE' : 'CONCILIADO',
          normalizado_em: createdAt, criado_em: createdAt, atualizado_em: createdAt,
        }
        typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').push(item)

        const reconciliation: ComissaoConciliacaoRow = {
          id: reconciliationId, item_id: itemId, comissao_id: commission.id,
          chave_idempotencia: `${command.chaveIdempotencia}|conciliacao|${commission.id}`,
          tipo_associacao: reason === 'EXATA' ? 'EXATA' : reason === 'PARCIAL' ? 'PARCIAL' : 'MANUAL',
          status: 'CONFIRMADA', confianca_pct: 100,
          valor_previsto_snapshot: view.saldo, valor_informado_alocado: input.valorBruto,
          valor_conciliado: input.valorEfetivo, valor_diferenca: roundMoney(input.valorEfetivo - view.saldo),
          percentual_previsto_snapshot: commission.percentual,
          percentual_informado_snapshot: input.percentualInformado ?? commission.percentual,
          percentual_diferenca: input.percentualInformado === undefined || input.percentualInformado === null || commission.percentual === null
            ? null : roundMoney(input.percentualInformado - commission.percentual),
          competencia_prevista_inicio: commission.competencia_inicio,
          competencia_prevista_fim: commission.competencia_fim, competencia_informada: command.competencia,
          motivo: reason === 'EXATA' ? null : justification, associado_por_id: MOCK_USER_ID,
          confirmado_por_id: MOCK_USER_ID, criado_em: createdAt, confirmado_em: createdAt, atualizado_em: createdAt,
        }
        typedRows<ComissaoConciliacaoRow>('comissao_conciliacoes').push(reconciliation)
        reconciliationRows = [reconciliation]
      }

      const firstSourceItem = typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').find((row) => row.id === reconciliationRows[0].item_id)
      const sourceOrigin = firstSourceItem
        ? typedRows<ComissaoExtratoRow>('comissao_extratos').find((row) => row.id === firstSourceItem.extrato_id)?.origem_tipo ?? 'MANUAL'
        : 'MANUAL'
      const receipt: ComissaoBaixaRow = {
        id: receiptId, comissao_id: commission.id, tipo: 'BAIXA', baixa_origem_id: null,
        origem_tipo: sourceOrigin, data_efetiva: command.dataEfetiva, valor_efetivo: roundMoney(input.valorEfetivo),
        motivo_tipo: reason, justificativa: justification || null,
        chave_idempotencia: `${command.chaveIdempotencia}|baixa|${commission.id}`,
        saldo_apos: expectedAfter, status_resultante: 'PREVISTA', criado_por_id: MOCK_USER_ID, criado_em: createdAt,
      }
      typedRows<ComissaoBaixaRow>('comissao_baixas').push(receipt)
      const reconciliationTotal = sum(reconciliationRows.map((row) => row.valor_conciliado ?? 0))
      let applied = 0
      reconciliationRows.forEach((reconciliation, reconciliationIndex) => {
        const value = reconciliationIndex === reconciliationRows.length - 1
          ? roundMoney(input.valorEfetivo - applied)
          : roundMoney(input.valorEfetivo * ((reconciliation.valor_conciliado ?? 0) / reconciliationTotal))
        applied = roundMoney(applied + value)
        typedRows<ComissaoBaixaConciliacaoRow>('comissao_baixa_conciliacoes').push({
          id: newId(), baixa_id: receiptId, conciliacao_id: reconciliation.id,
          valor_aplicado: value, criado_em: createdAt,
        })
      })
      receipt.status_resultante = projectCommission(commission)
      receipt.saldo_apos = roundMoney((commission.valor_previsto ?? 0) - (commission.valor_recebido ?? 0))
      audit(receipt)
      receiptIds.push(receiptId)

      if (over || netDifference || percentageDifference || competenceDifference) {
        const occurrenceTypes: ComissaoConciliacaoOcorrenciaRow['tipo'][] = []
        if (over || netDifference) occurrenceTypes.push('VALOR_DIVERGENTE')
        if (percentageDifference) occurrenceTypes.push('PERCENTUAL_DIVERGENTE')
        if (competenceDifference) occurrenceTypes.push('COMPETENCIA_DIVERGENTE')
        occurrenceTypes.forEach((occurrenceType) => typedRows<ComissaoConciliacaoOcorrenciaRow>('comissao_conciliacao_ocorrencias').push({
          id: newId(), item_id: itemId, conciliacao_id: reconciliationRows[0].id, tipo: occurrenceType,
          status: 'RESOLVIDA', motivo: justification, valor_esperado: view.saldo,
          valor_encontrado: input.valorEfetivo, percentual_esperado: commission.percentual,
          percentual_encontrado: input.percentualInformado ?? commission.percentual,
          competencia_esperada_inicio: commission.competencia_inicio,
          competencia_esperada_fim: commission.competencia_fim, competencia_encontrada: command.competencia,
          resolucao_tipo: 'DIVERGENCIA_ACEITA', resolucao_observacao: justification,
          identificada_por_id: MOCK_USER_ID, resolvida_por_id: MOCK_USER_ID,
          identificada_em: createdAt, resolvida_em: createdAt, atualizado_em: createdAt,
        })
        )
      }
    })

    return { extratoId: extractId, baixaIds: receiptIds, comissaoIds: normalizedItems.map(({ commission }) => commission.id), idempotent: false }
  })
}

export function reverseCommissionReceipt(command: EstornoComissaoCommand): ComissaoBaixaRow {
  if (!validDate(command.dataEfetiva)) throw new Error('Informe uma data efetiva válida para o estorno.')
  if (!hasValue(command.justificativa)) throw new Error('O estorno exige justificativa com ao menos 5 caracteres.')
  if (!hasValue(command.chaveIdempotencia, 8)) throw new Error('A chave idempotente do estorno é inválida.')
  const receipts = typedRows<ComissaoBaixaRow>('comissao_baixas')
  const original = receipts.find((row) => row.id === command.baixaId)
  if (!original || original.tipo !== 'BAIXA') throw new Error('A baixa original não foi encontrada.')
  const repeated = receipts.find((row) => row.comissao_id === original.comissao_id && row.chave_idempotencia === command.chaveIdempotencia)
  if (repeated) return repeated

  return transaction(() => {
    if (typedRows<RepasseRow>('repasses').some((row) => row.comissao_id === original.comissao_id && row.status === 'PAGO')) {
      throw new Error('Existe repasse pago vinculado. O estorno da comissão está bloqueado.')
    }
    const alreadyReversed = sum(receipts.filter((row) => row.baixa_origem_id === original.id).map((row) => row.valor_efetivo))
    const activeValue = roundMoney(original.valor_efetivo + alreadyReversed)
    if (Math.abs(activeValue) <= MONEY_TOLERANCE) throw new Error('Esta baixa já foi integralmente estornada.')
    const requested = command.valor === undefined ? Math.abs(activeValue) : Math.abs(command.valor)
    if (!Number.isFinite(requested) || requested <= MONEY_TOLERANCE) throw new Error('Informe um valor de estorno válido.')
    if (requested > Math.abs(activeValue) + MONEY_TOLERANCE) throw new Error('O estorno não pode superar o valor ainda ativo da baixa.')
    const reversalValue = roundMoney(-Math.sign(activeValue) * requested)
    const commission = typedRows<ComissaoRow>('comissoes').find((row) => row.id === original.comissao_id)
    if (!commission) throw new Error('A comissão da baixa não foi encontrada.')
    const createdAt = nowIso()
    const event: ComissaoBaixaRow = {
      id: newId(), comissao_id: original.comissao_id, tipo: 'ESTORNO', baixa_origem_id: original.id,
      origem_tipo: 'MANUAL', data_efetiva: command.dataEfetiva, valor_efetivo: reversalValue,
      motivo_tipo: 'ESTORNO', justificativa: command.justificativa.trim(),
      chave_idempotencia: command.chaveIdempotencia, saldo_apos: 0,
      status_resultante: 'PREVISTA', criado_por_id: MOCK_USER_ID, criado_em: createdAt,
    }
    receipts.push(event)

    const originalBridges = typedRows<ComissaoBaixaConciliacaoRow>('comissao_baixa_conciliacoes').filter((row) => row.baixa_id === original.id)
    if (originalBridges.length === 0) throw new Error('A baixa original não possui conciliação auditável.')
    const ratio = requested / Math.abs(original.valor_efetivo)
    let allocated = 0
    originalBridges.forEach((bridge, index) => {
      const value = index === originalBridges.length - 1
        ? roundMoney(reversalValue - allocated)
        : roundMoney(-Math.sign(bridge.valor_aplicado) * Math.abs(bridge.valor_aplicado) * ratio)
      allocated = roundMoney(allocated + value)
      typedRows<ComissaoBaixaConciliacaoRow>('comissao_baixa_conciliacoes').push({
        id: newId(), baixa_id: event.id, conciliacao_id: bridge.conciliacao_id,
        valor_aplicado: value, criado_em: createdAt,
      })
    })
    event.status_resultante = projectCommission(commission)
    event.saldo_apos = roundMoney((commission.valor_previsto ?? 0) - (commission.valor_recebido ?? 0))
    audit(event)
    return event
  })
}
