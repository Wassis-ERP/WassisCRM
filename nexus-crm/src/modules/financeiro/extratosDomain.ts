import { getTable } from '../../lib/inMemoryDb'
import type {
  ComissaoConciliacaoOcorrenciaRow,
  ComissaoConciliacaoRow,
  ComissaoExtratoConciliacaoStatus,
  ComissaoExtratoFormato,
  ComissaoExtratoItemRow,
  ComissaoExtratoOrigemTipo,
  ComissaoExtratoProcessamentoStatus,
  ComissaoExtratoRow,
} from '../../types/database'
import { listFinanceiroComissoes } from './comissoesDomain'

type NamedRow = { id: string; nome?: string | null; fantasia?: string | null; nome_completo?: string | null }

export interface ExtratoFilters {
  busca: string
  filialId: string
  seguradoraId: string
  origem: '' | ComissaoExtratoOrigemTipo
  formato: '' | ComissaoExtratoFormato
  processamento: '' | ComissaoExtratoProcessamentoStatus
  conciliacao: '' | ComissaoExtratoConciliacaoStatus
  periodoDe: string
  periodoAte: string
}

export interface ExtratoStatusCounts {
  prontos: number
  pendentes: number
  divergentes: number
  ignorados: number
  semVinculo: number
  ocorrenciasAbertas: number
  ocorrenciasResolvidas: number
}

export interface FinanceiroExtratoResumo extends ComissaoExtratoRow {
  filialNome: string
  seguradoraNome: string
  recebidoPorNome: string | null
  processadoPorNome: string | null
  somaItensBruto: number
  somaItensLiquido: number
  somaItensDescontos: number
  diferencaTotalizacao: number
  totalizacaoCompativel: boolean
  contagens: ExtratoStatusCounts
}

export interface ExtratoLinkResolvido {
  comissaoId: string
  propostaId: string
  apoliceId: string
  seguradoId: string
  documentoReferencia: string
  apoliceNumero: string | null
  seguradoNome: string
}

export interface ExtratoConciliacaoDetalhe extends ComissaoConciliacaoRow {
  itemReferencia: string
  link: ExtratoLinkResolvido | null
}

export interface ExtratoOcorrenciaDetalhe extends ComissaoConciliacaoOcorrenciaRow {
  itemReferencia: string
}

export interface ExtratoItemDetalhe extends ComissaoExtratoItemRow {
  conciliacoes: ExtratoConciliacaoDetalhe[]
  ocorrencias: ExtratoOcorrenciaDetalhe[]
}

export interface FinanceiroExtratoDetalhe {
  resumo: FinanceiroExtratoResumo
  itens: ExtratoItemDetalhe[]
  conciliacoes: ExtratoConciliacaoDetalhe[]
  ocorrencias: ExtratoOcorrenciaDetalhe[]
}

const typedRows = <T,>(table: string): T[] => getTable(table) as unknown as T[]
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

function itemReference(item: ComissaoExtratoItemRow): string {
  return item.identificacao_externa ?? item.sequencia_externa ?? item.id
}

function buildSummary(extrato: ComissaoExtratoRow): FinanceiroExtratoResumo {
  const items = typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').filter((item) => item.extrato_id === extrato.id)
  const itemIds = new Set(items.map((item) => item.id))
  const occurrences = typedRows<ComissaoConciliacaoOcorrenciaRow>('comissao_conciliacao_ocorrencias')
    .filter((occurrence) => itemIds.has(occurrence.item_id))
  const branches = typedRows<NamedRow>('filiais')
  const insurers = typedRows<NamedRow>('seguradoras')
  const profiles = typedRows<NamedRow>('profiles')
  const somaItensBruto = money(items.reduce((sum, item) => sum + (item.valor_bruto_informado ?? 0), 0))
  const somaItensLiquido = money(items.reduce((sum, item) => sum + (item.valor_liquido_informado ?? 0), 0))
  const somaItensDescontos = money(items.reduce((sum, item) => sum + (item.valor_descontos_informado ?? 0), 0))
  const diferencaTotalizacao = money((extrato.valor_liquido_total ?? 0) - somaItensLiquido)

  return {
    ...extrato,
    filialNome: branches.find((row) => row.id === extrato.filial_id)?.fantasia
      ?? branches.find((row) => row.id === extrato.filial_id)?.nome
      ?? 'Corretora não identificada',
    seguradoraNome: insurers.find((row) => row.id === extrato.seguradora_id)?.nome ?? 'Seguradora não identificada',
    recebidoPorNome: profiles.find((row) => row.id === extrato.recebido_por_id)?.nome_completo ?? null,
    processadoPorNome: profiles.find((row) => row.id === extrato.processado_por_id)?.nome_completo ?? null,
    somaItensBruto,
    somaItensLiquido,
    somaItensDescontos,
    diferencaTotalizacao,
    totalizacaoCompativel: Math.abs(diferencaTotalizacao) <= 0.01,
    contagens: {
      prontos: items.filter((item) => ['CONCILIADO', 'PRONTO_PARA_BAIXAR'].includes(item.status_conciliacao)).length,
      pendentes: items.filter((item) => ['PENDENTE', 'SUGERIDO', 'PARCIAL', 'AMBIGUO'].includes(item.status_conciliacao)).length,
      divergentes: items.filter((item) => item.status_conciliacao === 'DIVERGENTE').length,
      ignorados: items.filter((item) => item.status_conciliacao === 'IGNORADO').length,
      semVinculo: items.filter((item) => item.status_conciliacao === 'NAO_ENCONTRADO').length,
      ocorrenciasAbertas: occurrences.filter((item) => ['ABERTA', 'EM_ANALISE'].includes(item.status)).length,
      ocorrenciasResolvidas: occurrences.filter((item) => ['RESOLVIDA', 'IGNORADA'].includes(item.status)).length,
    },
  }
}

export function listFinanceiroExtratos(branchIds: readonly string[] | null): FinanceiroExtratoResumo[] {
  const allowed = branchIds ? new Set(branchIds) : null
  return typedRows<ComissaoExtratoRow>('comissao_extratos')
    .filter((row) => !allowed || allowed.has(row.filial_id))
    .map(buildSummary)
    .sort((a, b) => (b.recebido_em ?? b.criado_em).localeCompare(a.recebido_em ?? a.criado_em))
}

export function filterFinanceiroExtratos(rows: readonly FinanceiroExtratoResumo[], filters: ExtratoFilters): FinanceiroExtratoResumo[] {
  const search = filters.busca.trim().toLocaleLowerCase('pt-BR')
  return rows.filter((row) => {
    const searchable = [row.identificacao_externa, row.arquivo_nome, row.arquivo_referencia]
      .filter(Boolean).join(' ').toLocaleLowerCase('pt-BR')
    const referenceDate = row.periodo_inicio ?? row.competencia ?? row.data_recebimento ?? ''
    return (!search || searchable.includes(search))
      && (!filters.filialId || row.filial_id === filters.filialId)
      && (!filters.seguradoraId || row.seguradora_id === filters.seguradoraId)
      && (!filters.origem || row.origem_tipo === filters.origem)
      && (!filters.formato || row.origem_formato === filters.formato)
      && (!filters.processamento || row.status_processamento === filters.processamento)
      && (!filters.conciliacao || row.status_conciliacao === filters.conciliacao)
      && (!filters.periodoDe || referenceDate >= filters.periodoDe)
      && (!filters.periodoAte || referenceDate <= filters.periodoAte)
  })
}

export function getFinanceiroExtratoDetail(id: string, branchIds: readonly string[] | null): FinanceiroExtratoDetalhe | null {
  const resumo = listFinanceiroExtratos(branchIds).find((row) => row.id === id)
  if (!resumo) return null
  const commissions = listFinanceiroComissoes(branchIds)
  const items = typedRows<ComissaoExtratoItemRow>('comissao_extrato_itens').filter((item) => item.extrato_id === id)
  const itemById = new Map(items.map((item) => [item.id, item]))
  const reconciliations = typedRows<ComissaoConciliacaoRow>('comissao_conciliacoes')
    .filter((row) => itemById.has(row.item_id))
    .map((row): ExtratoConciliacaoDetalhe => {
      const commission = commissions.find((candidate) => candidate.id === row.comissao_id)
      return {
        ...row,
        itemReferencia: itemReference(itemById.get(row.item_id)!),
        link: commission ? {
          comissaoId: commission.id,
          propostaId: commission.proposta_id,
          apoliceId: commission.apoliceId,
          seguradoId: commission.seguradoId,
          documentoReferencia: commission.documentoReferencia,
          apoliceNumero: commission.apoliceNumero,
          seguradoNome: commission.seguradoNome,
        } : null,
      }
    })
  const occurrences = typedRows<ComissaoConciliacaoOcorrenciaRow>('comissao_conciliacao_ocorrencias')
    .filter((row) => itemById.has(row.item_id))
    .map((row): ExtratoOcorrenciaDetalhe => ({ ...row, itemReferencia: itemReference(itemById.get(row.item_id)!) }))

  return {
    resumo,
    itens: items.map((item) => ({
      ...item,
      conciliacoes: reconciliations.filter((row) => row.item_id === item.id),
      ocorrencias: occurrences.filter((row) => row.item_id === item.id),
    })),
    conciliacoes: reconciliations,
    ocorrencias: occurrences,
  }
}
