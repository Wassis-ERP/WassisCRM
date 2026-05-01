import { supabase } from '../../lib/supabase';
import NovaCobrancaModal from '../../components/NovaCobrancaModal';
import { genericConclude, genericUpdateStage } from '../shared';
import type { KanbanCard, ModuleAdapter } from '../types';
import { FinanceiroCard } from './Card';

/** Adapter do Pipeline Financeiro (public.financeiro_cobrancas). */
export const financeiroAdapter: ModuleAdapter = {
  module: 'financeiro',

  async fetchCards({ pipelineId, includeConcluded }) {
    let builder = supabase
      .from('financeiro_cobrancas')
      .select(`
        id,
        pipeline_id,
        stage_id,
        status,
        responsavel_id,
        proximo_followup,
        metadata,
        concluded_at,
        oportunidades:oportunidade_id (
          id,
          nome,
          premio_liquido,
          segurados:segurado_id ( id, nome ),
          ramos:ramo_id ( id, nome ),
          seguradoras:seguradora_id ( id, nome )
        )
      `)
      .eq('pipeline_id', pipelineId);

    if (!includeConcluded) builder = builder.eq('status', 'pending');

    const { data, error } = await builder.order('proximo_followup', { ascending: true, nullsFirst: false });
    if (error) throw error;

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    return rows.map<KanbanCard>((row) => {
      const op = (row.oportunidades ?? null) as
        | { id: string; nome: string | null; premio_liquido: number | null; segurados: { nome: string } | null; ramos: { nome: string } | null; seguradoras: { nome: string } | null }
        | null;
      const meta = (row.metadata as Record<string, unknown>) ?? {};
      const valorParcela = typeof meta['valor_parcela'] === 'number' ? (meta['valor_parcela'] as number) : null;
      const numeroParcela = typeof meta['numero_parcela'] === 'number' ? (meta['numero_parcela'] as number) : null;
      const totalParcelas = typeof meta['total_parcelas'] === 'number' ? (meta['total_parcelas'] as number) : null;
      const diasAtraso = typeof meta['dias_atraso'] === 'number' ? (meta['dias_atraso'] as number) : null;

      return {
        id: row.id as string,
        pipelineId: (row.pipeline_id as string | null) ?? null,
        stageId: (row.stage_id as string | null) ?? null,
        status: row.status as KanbanCard['status'],
        title: op?.segurados?.nome ?? op?.nome ?? 'Cobranca',
        subtitle: numeroParcela && totalParcelas
          ? `Parcela ${numeroParcela}/${totalParcelas}`
          : (op?.ramos?.nome ?? undefined),
        responsavelId: (row.responsavel_id as string | null) ?? null,
        responsavelName: undefined,
        responsavelAvatar: undefined,
        primaryValue: valorParcela ?? (op?.premio_liquido ? Number(op.premio_liquido) : null),
        primaryValueLabel: valorParcela ? 'Parcela' : 'Premio',
        dueDate: (row.proximo_followup as string | null) ?? null,
        tags: [
          op?.ramos?.nome ? { label: op.ramos.nome, tone: 'default' as const } : null,
          op?.seguradoras?.nome ? { label: op.seguradoras.nome, tone: 'info' as const } : null,
          diasAtraso && diasAtraso > 0 ? { label: `${diasAtraso} dias atraso`, tone: 'danger' as const } : null,
        ].filter(Boolean) as KanbanCard['tags'],
        concludedAt: (row.concluded_at as string | null) ?? null,
        raw: row,
      };
    });
  },

  async updateStage(args) { await genericUpdateStage('financeiro', args.cardId, args.toStageId); },
  async conclude(args)    { await genericConclude('financeiro', args.cardId, args.payload); },

  CardComponent: FinanceiroCard,
  availableFilters: ['search', 'produtor', 'dataRetorno'],
  createModalComponent: NovaCobrancaModal,
  createLabel: 'Nova Cobranca',
  detailRoute: (id) => `/financeiro/${id}`,
};
