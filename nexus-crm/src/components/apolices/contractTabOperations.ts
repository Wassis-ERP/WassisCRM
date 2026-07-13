import {
  getTable,
  MOCK_TENANT_ID,
  MOCK_USER_ID,
  newId,
  nowIso,
} from '../../lib/inMemoryDb'
import type {
  ApoliceItemRow,
  ComissaoRow,
  ComissaoTipo,
  Database,
  ItemCoberturaRow,
  ParcelaRow,
  RepasseRow,
} from '../../types/database'

type AuditInsert = Database['public']['Tables']['audit_logs']['Insert'] & { id: string }
type ProposalRow = Database['public']['Tables']['propostas']['Row']

export type ParcelaEditablePatch = Partial<Pick<ParcelaRow,
  'vencimento' | 'valor' | 'valor_liquido' | 'iof' | 'adicional_fracionamento' |
  'forma_pagamento' | 'nosso_numero' | 'linha_digitavel' | 'codigo_barras' |
  'numero_fatura' | 'competencia_inicio' | 'competencia_fim' | 'observacoes'
>>

export type ComissaoEditablePatch = Partial<Pick<ComissaoRow,
  'tipo_comissao' | 'percentual' | 'base_calculo' | 'valor_previsto' |
  'prevista_em' | 'competencia_inicio' | 'competencia_fim' | 'observacoes'
>>

export type RepasseEditablePatch = Partial<Pick<RepasseRow,
  'beneficiario_id' | 'papel_beneficiario' | 'base' | 'percentual' |
  'valor_previsto' | 'previsto_em' | 'forma_pagamento' | 'observacoes'
>>

export interface BatchMutationResult {
  changed: number
  blocked: string[]
  eligible: string[]
}

export interface ItemEditorInput {
  id?: string
  apoliceId: string
  propostaId: string
  riskType: string
  numeroItem: number | null
  descricao: string
  identificadorExterno: string | null
  valorRisco: number | null
  enderecoRiscoResumo: string | null
  observacoes: string | null
  specialization: Record<string, string | number | boolean | null>
}

export interface CoverageEditorInput {
  id?: string
  itemId: string
  propostaId: string
  coberturaId: string | null
  capitalLmi: number | null
  franquiaValor: number | null
  franquiaTipo: string | null
  premio: number | null
  premioLiquido: number | null
  carenciaDias: number | null
  participacaoObrigatoriaPct: number | null
  vigenciaInicio: string | null
  vigenciaFim: string | null
  observacoes: string | null
}

const specializationTable: Record<string, string> = {
  VEICULO: 'item_veiculo',
  IMOVEL: 'item_imovel',
  EMPRESA: 'item_empresa',
  VIDA: 'item_vida',
}

const specializationFields: Record<string, ReadonlySet<string>> = {
  VEICULO: new Set([
    'codigo_fipe', 'marca', 'modelo', 'versao', 'ano_fabricacao', 'ano_modelo',
    'placa', 'chassi', 'renavam', 'zero_km', 'combustivel', 'cambio', 'categoria',
    'uso', 'cep_pernoite', 'classe_bonus', 'blindado', 'alienado', 'rastreador',
    'antifurto', 'kit_gas', 'condutor_principal_nome', 'condutor_principal_cpf',
    'condutor_principal_data_nascimento',
  ]),
  IMOVEL: new Set([
    'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
    'tipo_imovel', 'tipo_ocupacao', 'tipo_construcao', 'area_m2', 'valor_imovel',
    'condominio_fechado', 'desocupado',
  ]),
  EMPRESA: new Set([
    'cnpj_risco', 'razao_social_risco', 'atividade', 'cnae', 'faturamento_anual',
    'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
    'tipo_construcao', 'area_m2', 'qtd_funcionarios', 'valor_estoque',
    'valor_equipamentos', 'protecao_incendio',
  ]),
  VIDA: new Set([
    'pessoa_id', 'nome_grupo', 'n_vidas', 'certificado_individual', 'parentesco',
    'data_nascimento', 'sexo', 'profissao', 'salario', 'capital_individual',
    'data_inclusao', 'data_exclusao', 'beneficiarios_texto',
  ]),
}

const typedRows = <T,>(name: string): T[] => getTable(name) as unknown as T[]

function serialize(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function audit(
  entityType: string,
  entityId: string,
  action: 'CREATE' | 'UPDATE',
  field: string | null,
  previous: unknown,
  next: unknown,
): void {
  const entry: AuditInsert = {
    id: newId(),
    tenant_id: MOCK_TENANT_ID,
    user_id: MOCK_USER_ID,
    entidade_tipo: entityType,
    entidade_id: entityId,
    campo: field,
    valor_antigo: serialize(previous),
    valor_novo: serialize(next),
    acao: action,
    ocorrido_em: nowIso(),
    origem: 'FRONT_MOCK',
    ip: null,
    user_agent: 'WassisCRM frontend puro',
  }
  typedRows<AuditInsert>('audit_logs').push(entry)
}

function proposalExists(id: string): boolean {
  return typedRows<ProposalRow>('propostas').some((row) => row.id === id)
}

function applyPatch<T extends { id: string }>(
  entityType: string,
  row: T,
  patch: Partial<T>,
): number {
  let changed = 0
  const entries = Object.entries(patch) as Array<[keyof T, T[keyof T]]>
  entries.forEach(([field, next]) => {
    const previous = row[field]
    if (Object.is(previous, next)) return
    row[field] = next
    audit(entityType, row.id, 'UPDATE', String(field), previous, next)
    changed += 1
  })
  return changed
}

export function canOperateParcela(row: ParcelaRow): boolean {
  return !['paga', 'estornada'].includes((row.status ?? '').toLocaleLowerCase('pt-BR'))
    && !row.data_pagamento
    && !row.data_baixa
    && row.valor_pago === null
}

export function canOperateComissao(row: ComissaoRow): boolean {
  return !['RECEBIDA', 'DIVERGENTE'].includes(row.status ?? '')
    && !row.recebida_em
    && row.valor_recebido === null
}

export function canOperateRepasse(row: RepasseRow): boolean {
  return !['LIBERADO', 'PAGO'].includes(row.status ?? '')
    && !row.liberado_em
    && !row.pago_em
    && row.valor_pago === null
}

function batchUpdate<T extends { id: string }>(
  rows: T[],
  ids: string[],
  patch: Partial<T>,
  entityType: string,
  canOperate: (row: T) => boolean,
): BatchMutationResult {
  const selected = new Set(ids)
  const blocked: string[] = []
  const eligible: string[] = []
  let changed = 0
  rows.filter((row) => selected.has(row.id)).forEach((row) => {
    if (!canOperate(row)) {
      blocked.push(row.id)
      return
    }
    eligible.push(row.id)
    changed += applyPatch(entityType, row, patch)
  })
  return { changed, blocked, eligible }
}

export function createParcela(input: {
  propostaId: string
  numero: number
  vencimento: string | null
  valor: number | null
  valorLiquido: number | null
  formaPagamento: string | null
  observacoes: string | null
}): ParcelaRow {
  if (!proposalExists(input.propostaId)) throw new Error('Documento não encontrado.')
  const row: ParcelaRow = {
    id: newId(), proposta_id: input.propostaId, numero: input.numero,
    vencimento: input.vencimento, valor: input.valor, valor_liquido: input.valorLiquido,
    iof: null, adicional_fracionamento: null, status: 'em_aberto',
    forma_pagamento: input.formaPagamento, nosso_numero: null, linha_digitavel: null,
    codigo_barras: null, data_pagamento: null, valor_pago: null, data_baixa: null,
    numero_fatura: null, competencia_inicio: null, competencia_fim: null,
    observacoes: input.observacoes,
  }
  typedRows<ParcelaRow>('parcelas').push(row)
  audit('parcela', row.id, 'CREATE', null, null, row)
  return row
}

export function createComissao(input: {
  propostaId: string
  numero: number
  tipoComissao: ComissaoTipo
  percentual: number | null
  baseCalculo: number | null
  valorPrevisto: number | null
  previstaEm: string | null
  observacoes: string | null
}): ComissaoRow {
  if (!proposalExists(input.propostaId)) throw new Error('Documento não encontrado.')
  const row: ComissaoRow = {
    id: newId(), proposta_id: input.propostaId, parcela_id: null, numero: input.numero,
    tipo_comissao: input.tipoComissao, percentual: input.percentual,
    base_calculo: input.baseCalculo, valor_previsto: input.valorPrevisto,
    valor_recebido: null, valor_diferenca: null, status: 'PREVISTA',
    prevista_em: input.previstaEm, recebida_em: null, extrato_numero: null,
    seguradora_lote: null, competencia_inicio: null, competencia_fim: null,
    observacoes: input.observacoes,
  }
  typedRows<ComissaoRow>('comissoes').push(row)
  audit('comissao', row.id, 'CREATE', null, null, row)
  return row
}

export function createRepasse(input: {
  propostaId: string
  numero: number
  beneficiarioId: string
  papelBeneficiario: string | null
  base: string | null
  percentual: number | null
  valorPrevisto: number | null
  previstoEm: string | null
  observacoes: string | null
}): RepasseRow {
  if (!proposalExists(input.propostaId)) throw new Error('Documento não encontrado.')
  if (!typedRows<{ id: string }>('produtores').some((row) => row.id === input.beneficiarioId)) {
    throw new Error('Beneficiário não encontrado.')
  }
  const row: RepasseRow = {
    id: newId(), proposta_id: input.propostaId, comissao_id: null,
    beneficiario_id: input.beneficiarioId, regra_id: null, numero: input.numero,
    papel_beneficiario: input.papelBeneficiario, base: input.base,
    percentual: input.percentual, valor_previsto: input.valorPrevisto,
    valor_pago: null, valor_diferenca: null, status: 'PREVISTO',
    previsto_em: input.previstoEm, liberado_em: null, pago_em: null,
    forma_pagamento: null, comprovante_referencia: null, observacoes: input.observacoes,
  }
  typedRows<RepasseRow>('repasses').push(row)
  audit('repasse', row.id, 'CREATE', null, null, row)
  return row
}

export function updateParcelas(ids: string[], patch: ParcelaEditablePatch): BatchMutationResult {
  return batchUpdate(typedRows<ParcelaRow>('parcelas'), ids, patch, 'parcela', canOperateParcela)
}

export function updateComissoes(ids: string[], patch: ComissaoEditablePatch): BatchMutationResult {
  return batchUpdate(typedRows<ComissaoRow>('comissoes'), ids, patch, 'comissao', canOperateComissao)
}

export function updateRepasses(ids: string[], patch: RepasseEditablePatch): BatchMutationResult {
  return batchUpdate(typedRows<RepasseRow>('repasses'), ids, patch, 'repasse', canOperateRepasse)
}

export function cancelParcelas(ids: string[], reason?: string): BatchMutationResult {
  return batchUpdate(typedRows<ParcelaRow>('parcelas'), ids, {
    status: 'cancelada',
    ...(reason?.trim() ? { observacoes: `Cancelamento contratual: ${reason.trim()}` } : {}),
  }, 'parcela', canOperateParcela)
}

export function cancelRepasses(ids: string[], reason?: string): BatchMutationResult {
  return batchUpdate(typedRows<RepasseRow>('repasses'), ids, {
    status: 'CANCELADO',
    ...(reason?.trim() ? { observacoes: `Cancelamento contratual: ${reason.trim()}` } : {}),
  }, 'repasse', canOperateRepasse)
}

export function cancelComissoes(ids: string[], reason?: string): BatchMutationResult {
  const commissions = typedRows<ComissaoRow>('comissoes')
  const transfers = typedRows<RepasseRow>('repasses')
  const selected = new Set(ids)
  const blocked: string[] = []
  const eligible: string[] = []
  let changed = 0
  commissions.filter((row) => selected.has(row.id)).forEach((commission) => {
    const dependents = transfers.filter((row) => row.comissao_id === commission.id && row.status !== 'CANCELADO')
    if (!canOperateComissao(commission) || dependents.some((row) => !canOperateRepasse(row))) {
      blocked.push(commission.id)
      return
    }
    dependents.forEach((row) => { changed += applyPatch('repasse', row, { status: 'CANCELADO', ...(reason?.trim() ? { observacoes: `Cancelado com a comissão: ${reason.trim()}` } : {}) }) })
    changed += applyPatch('comissao', commission, { status: 'CANCELADA', ...(reason?.trim() ? { observacoes: `Cancelamento contratual: ${reason.trim()}` } : {}) })
    eligible.push(commission.id)
  })
  return { changed, blocked, eligible }
}

export function saveItem(input: ItemEditorInput): ApoliceItemRow {
  if (!proposalExists(input.propostaId)) throw new Error('Documento responsável não encontrado.')
  const items = typedRows<ApoliceItemRow>('apolice_itens')
  const existing = input.id ? items.find((row) => row.id === input.id) : undefined
  const row = existing ?? {
    id: newId(), apolice_id: input.apoliceId, risk_type: input.riskType,
    incluido_por_proposta_id: input.propostaId, excluido_por_proposta_id: null,
    numero_item: input.numeroItem, descricao: input.descricao,
    identificador_externo: input.identificadorExterno, valor_risco: input.valorRisco,
    endereco_risco_resumo: input.enderecoRiscoResumo, status: 'vigente',
    observacoes: input.observacoes,
  }
  if (!existing) {
    items.push(row)
    audit('apolice_item', row.id, 'CREATE', null, null, row)
  } else {
    applyPatch('apolice_item', row, {
      numero_item: input.numeroItem, descricao: input.descricao,
      identificador_externo: input.identificadorExterno, valor_risco: input.valorRisco,
      endereco_risco_resumo: input.enderecoRiscoResumo, observacoes: input.observacoes,
    })
  }

  const tableName = specializationTable[input.riskType]
  if (tableName) {
    const allowed = specializationFields[input.riskType] ?? new Set<string>()
    const table = typedRows<Record<string, unknown>>(tableName)
    let specialization = table.find((candidate) => candidate.apolice_item_id === row.id)
    if (!specialization) {
      specialization = { apolice_item_id: row.id }
      table.push(specialization)
    }
    Object.entries(input.specialization).forEach(([field, value]) => {
      if (!allowed.has(field)) return
      const previous = specialization?.[field]
      if (Object.is(previous, value)) return
      if (specialization) specialization[field] = value
      audit(tableName, row.id, 'UPDATE', field, previous, value)
    })
  }
  return row
}

export function excludeItem(itemId: string, propostaId: string): boolean {
  const item = typedRows<ApoliceItemRow>('apolice_itens').find((row) => row.id === itemId)
  if (!item || item.excluido_por_proposta_id) return false
  applyPatch('apolice_item', item, { excluido_por_proposta_id: propostaId, status: 'historico' })
  typedRows<ItemCoberturaRow>('item_coberturas')
    .filter((coverage) => coverage.apolice_item_id === itemId && !coverage.excluido_por_proposta_id)
    .forEach((coverage) => applyPatch('item_cobertura', coverage, { excluido_por_proposta_id: propostaId }))
  return true
}

export function saveCoverage(input: CoverageEditorInput): ItemCoberturaRow {
  if (!proposalExists(input.propostaId)) throw new Error('Documento responsável não encontrado.')
  const coverages = typedRows<ItemCoberturaRow>('item_coberturas')
  const previous = input.id ? coverages.find((row) => row.id === input.id) : undefined
  if (previous?.excluido_por_proposta_id) throw new Error('A versão histórica não pode ser alterada.')
  if (previous) applyPatch('item_cobertura', previous, { excluido_por_proposta_id: input.propostaId })
  const row: ItemCoberturaRow = {
    id: newId(), apolice_item_id: input.itemId, cobertura_id: input.coberturaId,
    incluido_por_proposta_id: input.propostaId, excluido_por_proposta_id: null,
    capital_lmi: input.capitalLmi, franquia_valor: input.franquiaValor,
    franquia_tipo: input.franquiaTipo, premio: input.premio,
    premio_liquido: input.premioLiquido, carencia_dias: input.carenciaDias,
    participacao_obrigatoria_pct: input.participacaoObrigatoriaPct,
    vigencia_inicio: input.vigenciaInicio, vigencia_fim: input.vigenciaFim,
    observacoes: input.observacoes,
  }
  coverages.push(row)
  audit('item_cobertura', row.id, 'CREATE', null, previous ?? null, row)
  return row
}

export function excludeCoverage(coverageId: string, propostaId: string): boolean {
  const coverage = typedRows<ItemCoberturaRow>('item_coberturas').find((row) => row.id === coverageId)
  if (!coverage || coverage.excluido_por_proposta_id) return false
  applyPatch('item_cobertura', coverage, { excluido_por_proposta_id: propostaId })
  return true
}
