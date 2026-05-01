import { supabase } from '../../lib/supabase';
import NovaPosVendaModal from '../../components/NovaPosVendaModal';
import { genericConclude, genericUpdateStage } from '../shared';
import type { KanbanCard, ModuleAdapter } from '../types';
import { PosVendaCard } from './Card';

/** Adapter do Pipeline de Pos-Venda (public.pos_vendas). */
export const posVendaAdapter: ModuleAdapter = {
  module: 'pos_venda',

  async fetchCards({ pipelineId, includeConcluded }) {
    let builder = supabase
      .from('pos_vendas')
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
          vigencia_fim,
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
        | { id: string; nome: string | null; vigencia_fim: string | null; premio_liquido: number | null; segurados: { nome: string } | null; ramos: { nome: string } | null; seguradoras: { nome: string } | null }
        | null;
      const meta = (row.metadata as Record<string, unknown>) ?? {};
      const tipo = typeof meta['tipo_demanda'] === 'string' ? (meta['tipo_demanda'] as string) : null;

      return {
        id: row.id as string,
        pipelineId: (row.pipeline_id as string | null) ?? null,
        stageId: (row.stage_id as string | null) ?? null,
        status: row.status as KanbanCard['status'],
        title: op?.segurados?.nome ?? op?.nome ?? 'Pos-Venda',
        subtitle: tipo ? tipo.toUpperCase() : (op?.ramos?.nome ?? undefined),
        responsavelId: (row.responsavel_id as string | null) ?? null,
        responsavelName: undefined,
        responsavelAvatar: undefined,
        primaryValue: op?.premio_liquido ? Number(op.premio_liquido) : null,
        primaryValueLabel: 'Premio',
        dueDate: ((row.proximo_followup as string | null) ?? op?.vigencia_fim) ?? null,
        tags: [
          op?.ramos?.nome ? { label: op.ramos.nome, tone: 'default' as const } : null,
          op?.seguradoras?.nome ? { label: op.seguradoras.nome, tone: 'info' as const } : null,
          tipo ? { label: tipo, tone: 'warning' as const } : null,
        ].filter(Boolean) as KanbanCard['tags'],
        concludedAt: (row.concluded_at as string | null) ?? null,
        raw: row,
      };
    });
  },

  async updateStage(args) { await genericUpdateStage('pos_venda', args.cardId, args.toStageId); },
  async conclude(args)    { await genericConclude('pos_venda', args.cardId, args.payload); },

  CardComponent: PosVendaCard,
  availableFilters: ['search', 'ramo', 'produtor', 'dataRetorno', 'dataVigencia'],
  createModalComponent: NovaPosVendaModal,
  createLabel: 'Nova Demanda',
  detailRoute: (id) => `/pos-venda/${id}`,
};
