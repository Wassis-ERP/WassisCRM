import type {
  ComissaoConciliacaoOcorrenciaTipo,
  ComissaoConciliacaoRow,
  ComissaoConciliacaoTipo,
  ComissaoExtratoItemStatus,
} from '../../types/database'

function normalizeKeyPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildExtratoIdempotencyKey(input: {
  filialId: string
  seguradoraId: string
  arquivoHash?: string | null
  identificacaoExterna?: string | null
}): string {
  const identity = input.arquivoHash || input.identificacaoExterna
  if (!identity) throw new Error('Hash do arquivo ou identificação externa é obrigatório.')
  return [input.filialId, input.seguradoraId, identity].map(normalizeKeyPart).join('|')
}

export function buildExtratoItemIdempotencyKey(input: {
  extratoId: string
  identificacaoExterna?: string | null
  sequenciaExterna?: string | null
}): string {
  const identity = input.identificacaoExterna || input.sequenciaExterna
  if (!identity) throw new Error('Identificação ou sequência externa do item é obrigatória.')
  return [input.extratoId, identity].map(normalizeKeyPart).join('|')
}

export type ConciliationClassification = {
  itemStatus: ComissaoExtratoItemStatus
  associationType: ComissaoConciliacaoTipo | null
  occurrences: ComissaoConciliacaoOcorrenciaTipo[]
  difference: number | null
}

export function classifyConciliation(input: {
  candidateCount: number
  expectedValue?: number | null
  informedValue?: number | null
  allocatedValue?: number | null
  manual?: boolean
  tolerance?: number
}): ConciliationClassification {
  if (input.candidateCount < 0) throw new Error('Quantidade de candidatos inválida.')
  if (input.candidateCount === 0 && !input.manual) {
    return {
      itemStatus: 'NAO_ENCONTRADO', associationType: null,
      occurrences: ['COMISSAO_NAO_ENCONTRADA'], difference: null,
    }
  }
  if (input.candidateCount > 1 && !input.manual) {
    return {
      itemStatus: 'AMBIGUO', associationType: null,
      occurrences: ['MULTIPLAS_COMISSOES'], difference: null,
    }
  }

  const expected = input.expectedValue
  const informed = input.informedValue
  if (expected == null || informed == null) {
    return {
      itemStatus: 'SUGERIDO', associationType: input.manual ? 'MANUAL' : 'SUGERIDA',
      occurrences: ['IDENTIFICACAO_INSUFICIENTE'], difference: null,
    }
  }

  const tolerance = input.tolerance ?? 0.01
  const difference = Number((informed - expected).toFixed(2))
  const allocated = input.allocatedValue
  const isPartial = allocated != null && (
    Math.abs(allocated) + tolerance < Math.abs(expected)
    || Math.abs(allocated) + tolerance < Math.abs(informed)
  )
  if (isPartial) {
    return {
      itemStatus: 'PARCIAL', associationType: input.manual ? 'MANUAL' : 'PARCIAL',
      occurrences: Math.abs(difference) > tolerance ? ['VALOR_DIVERGENTE'] : [], difference,
    }
  }
  if (Math.abs(difference) <= tolerance) {
    return {
      itemStatus: 'CONCILIADO', associationType: input.manual ? 'MANUAL' : 'EXATA',
      occurrences: [], difference: 0,
    }
  }
  return {
    itemStatus: 'DIVERGENTE', associationType: input.manual ? 'MANUAL' : 'SUGERIDA',
    occurrences: ['VALOR_DIVERGENTE'], difference,
  }
}

export function hasConciliationDuplicate(
  existing: ReadonlyArray<Pick<ComissaoConciliacaoRow, 'item_id' | 'comissao_id' | 'chave_idempotencia'>>,
  candidate: Pick<ComissaoConciliacaoRow, 'item_id' | 'comissao_id' | 'chave_idempotencia'>,
): boolean {
  return existing.some((row) =>
    row.chave_idempotencia === candidate.chave_idempotencia
    || (row.item_id === candidate.item_id && row.comissao_id === candidate.comissao_id),
  )
}
