import { supabase } from '../../lib/supabase';
import NovoSinistroModal from '../../components/NovoSinistroModal';
import { genericConclude, genericUpdateStage } from '../shared';
import type { KanbanCard, ModuleAdapter } from '../types';
import { SinistroCard } from './Card';

/**
 * Adapter do Pipeline de Sinistros.
 * Entidade: public.sinistros. O contexto de negocio (segurado/seguradora)
 * vem via lookup em oportunidade_id (hub central).
 */
export const sinistroAdapter: ModuleAdapter = {
  module: 'sinistro',

  async fetchCards({ pipelineId, includeConcluded }) {
    let builder = supabase
      .from('sinistros')
      .select(`
        id,
        pipeline_id,
        stage_id,
        status,
        responsavel_id,
        numero_sinistro,
        data_sinistro,
        tipo_sinistro,
        valor_prejuizo,
        valor_indenizacao,
        concluded_at,
        oportunidades:oportunidade_id (
          id,
          nome,
          segurados:segurado_id ( id, nome ),
          ramos:ramo_id ( id, nome ),
          seguradoras:seguradora_id ( id, nome )
        )
      `)
      .eq('pipeline_id', pipelineId);

    if (!includeConcluded) builder = builder.eq('status', 'pending');

    const { data, error } = await builder.order('data_sinistro', { ascending: false, nullsFirst: false });
    if (error) throw error;

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    return rows.map<KanbanCard>((row) => {
      const op = (row.oportunidades ?? null) as
        | { id: string; nome: string | null; segurados: { nome: string } | null; ramos: { nome: string } | null; seguradoras: { nome: string } | null }
        | null;
      const numeroSinistro = (row.numero_sinistro as string | null) ?? null;
      const valorIndenizacao = row.valor_indenizacao !== null && row.valor_indenizacao !== undefined ? Number(row.valor_indenizacao) : null;
      const valorPrejuizo = row.valor_prejuizo !== null && row.valor_prejuizo !== undefined ? Number(row.valor_prejuizo) : null;

      return {
        id: row.id as string,
        pipelineId: (row.pipeline_id as string | null) ?? null,
        stageId: (row.stage_id as string | null) ?? null,
        status: row.status as KanbanCard['status'],
        title: op?.segurados?.nome ?? numeroSinistro ?? 'Sinistro',
        subtitle: numeroSinistro ? `Sinistro ${numeroSinistro}` : (op?.ramos?.nome ?? undefined),
        responsavelId: (row.responsavel_id as string | null) ?? null,
        responsavelName: undefined,
        responsavelAvatar: undefined,
        primaryValue: valorIndenizacao ?? valorPrejuizo ?? null,
        primaryValueLabel: valorIndenizacao !== null ? 'Indenizacao' : 'Prejuizo',
        dueDate: (row.data_sinistro as string | null) ?? null,
        tags: [
          op?.ramos?.nome ? { label: op.ramos.nome, tone: 'default' as const } : null,
          op?.seguradoras?.nome ? { label: op.seguradoras.nome, tone: 'info' as const } : null,
          row.tipo_sinistro ? { label: String(row.tipo_sinistro).replace('_', ' '), tone: 'danger' as const } : null,
        ].filter(Boolean) as KanbanCard['tags'],
        concludedAt: (row.concluded_at as string | null) ?? null,
        raw: row,
      };
    });
  },

  async updateStage(args) { await genericUpdateStage('sinistro', args.cardId, args.toStageId); },
  async conclude(args)    { await genericConclude('sinistro', args.cardId, args.payload); },

  CardComponent: SinistroCard,
  availableFilters: ['search', 'ramo', 'produtor'],
  createModalComponent: NovoSinistroModal,
  createLabel: 'Novo Sinistro',
  detailRoute: (id) => `/sinistros/${id}`,
};
