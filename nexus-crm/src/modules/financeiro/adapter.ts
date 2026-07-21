import { listFinanceiroCobrancas, moveFinanceiroCobrancaStage } from './cobrancasDomain'
import type { KanbanCard, ModuleAdapter } from '../types'
import { FinanceiroCard } from './Card'

export const financeiroAdapter: ModuleAdapter = {
  module: 'financeiro',

  async fetchCards({ pipelineId, includeConcluded, filialId }) {
    return listFinanceiroCobrancas(filialId ? [filialId] : null)
      .filter((row) => row.pipelineId === pipelineId && (includeConcluded || row.status === 'ATIVA'))
      .map<KanbanCard>((row) => ({
        id: row.id,
        pipelineId: row.pipelineId,
        stageId: row.stage_id,
        status: row.status === 'ATIVA' ? 'pending' : row.status === 'QUITADA' ? 'won' : 'lost',
        title: row.parcela.seguradoNome,
        subtitle: `${row.parcela.documentoReferencia} · Parcela ${row.parcela.numero ?? '—'}`,
        responsavelId: row.responsavel_id,
        responsavelName: row.responsavelNome ?? undefined,
        responsavelAvatar: row.responsavelAvatar ?? undefined,
        primaryValue: row.parcela.valor,
        primaryValueLabel: 'Parcela vencida',
        dueDate: row.proxima_cobranca_em ?? row.vencimento_followup,
        tags: [
          { label: row.parcela.ramoNome, tone: 'default' as const },
          { label: row.parcela.seguradoraNome, tone: 'info' as const },
          row.parcela.diasVencidos > 0 ? { label: `${row.parcela.diasVencidos} dias em atraso`, tone: 'danger' as const } : null,
          row.prioridade === 'URGENTE' || row.prioridade === 'ALTA'
            ? { label: row.prioridade === 'URGENTE' ? 'Urgente' : 'Alta prioridade', tone: 'warning' as const }
            : null,
        ].filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
        concludedAt: row.encerrada_em,
        raw: {
          ...row,
          ramos: { nome: row.parcela.ramoNome },
          filialId: row.parcela.filialId,
        },
      }))
  },

  async updateStage({ cardId, toStageId }) {
    moveFinanceiroCobrancaStage(cardId, toStageId)
  },

  async conclude() {
    throw new Error('Use os comandos explícitos de quitar ou cancelar no detalhe da cobrança.')
  },

  CardComponent: FinanceiroCard,
  availableFilters: ['search', 'dataRetorno'],
  detailRoute: (id) => `/financeiro/${id}`,
}
