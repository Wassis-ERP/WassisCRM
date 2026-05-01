import { supabase } from '../../lib/supabase';
import NovaEmissaoModal from '../../components/NovaEmissaoModal';
import { genericConclude, genericUpdateStage } from '../shared';
import type { KanbanCard, ModuleAdapter } from '../types';
import { EmissaoCard } from './Card';

/** Adapter do Pipeline de Emissao (public.emissoes). */
export const emissaoAdapter: ModuleAdapter = {
  module: 'emissao',

  async fetchCards({ pipelineId, includeConcluded }) {
    let builder = supabase
      .from('emissoes')
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

    const { data, error } = await builder.order('created_at', { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    return rows.map<KanbanCard>((row) => {
      const op = (row.oportunidades ?? null) as
        | { id: string; nome: string | null; premio_liquido: number | null; segurados: { nome: string } | null; ramos: { nome: string } | null; seguradoras: { nome: string } | null }
        | null;
      const meta = (row.metadata as Record<string, unknown>) ?? {};
      const numeroProposta = typeof meta['numero_proposta'] === 'string' ? (meta['numero_proposta'] as string) : null;

      return {
        id: row.id as string,
        pipelineId: (row.pipeline_id as string | null) ?? null,
        stageId: (row.stage_id as string | null) ?? null,
        status: row.status as KanbanCard['status'],
        title: op?.segurados?.nome ?? op?.nome ?? 'Emissao',
        subtitle: numeroProposta ? `Proposta ${numeroProposta}` : (op?.ramos?.nome ?? undefined),
        responsavelId: (row.responsavel_id as string | null) ?? null,
        responsavelName: undefined,
        responsavelAvatar: undefined,
        primaryValue: op?.premio_liquido ? Number(op.premio_liquido) : null,
        primaryValueLabel: 'Premio',
        dueDate: (row.proximo_followup as string | null) ?? null,
        tags: [
          op?.ramos?.nome ? { label: op.ramos.nome, tone: 'default' as const } : null,
          op?.seguradoras?.nome ? { label: op.seguradoras.nome, tone: 'info' as const } : null,
        ].filter(Boolean) as KanbanCard['tags'],
        concludedAt: (row.concluded_at as string | null) ?? null,
        raw: row,
      };
    });
  },

  async updateStage(args) { await genericUpdateStage('emissao', args.cardId, args.toStageId); },
  async conclude(args)    { await genericConclude('emissao', args.cardId, args.payload); },

  CardComponent: EmissaoCard,
  availableFilters: ['search', 'ramo', 'produtor', 'dataRetorno'],
  createModalComponent: NovaEmissaoModal,
  createLabel: 'Nova Emissao',
  detailRoute: (id) => `/emissoes/${id}`,
};
