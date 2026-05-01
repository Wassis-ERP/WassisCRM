import { supabase } from '../../lib/supabase';
import { genericConclude, genericUpdateStage } from '../shared';
import type { KanbanCard, ModuleAdapter } from '../types';
import { ComercialCard } from './Card';

/**
 * Adapter do Pipeline Comercial.
 * Entidade: public.oportunidades (hub central da Fase 1.1).
 *
 * O CardComponent definitivo sera implementado no Micro 4. Aqui usamos um
 * placeholder compartilhado para que o Kanban possa ja renderizar vazio.
 */
export const comercialAdapter: ModuleAdapter = {
  module: 'comercial',

  async fetchCards({ pipelineId, includeConcluded }) {
    // Nao usar embed `profiles:responsavel_id`: o schema publico nao expoe FK
    // oportunidades.responsavel_id -> profiles (PostgREST retorna 400).
    let builder = supabase
      .from('oportunidades')
      .select(`
        id,
        nome,
        pipeline_id,
        stage_id,
        status,
        responsavel_id,
        premio_liquido,
        proximo_followup,
        vigencia_inicio,
        vigencia_fim,
        tipo_negocio,
        concluded_at,
        created_at,
        segurados:segurado_id ( id, nome ),
        ramos:ramo_id ( id, nome ),
        seguradoras:seguradora_id ( id, nome ),
        origens:origem_id ( id, nome )
      `)
      .eq('pipeline_id', pipelineId);

    if (!includeConcluded) {
      builder = builder.eq('status', 'pending');
    }

    const { data, error } = await builder.order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    return rows.map<KanbanCard>((row) => {
      const segurado = (row.segurados ?? null) as { id: string; nome: string } | null;
      const ramo = (row.ramos ?? null) as { id: string; nome: string } | null;
      const seguradora = (row.seguradoras ?? null) as { id: string; nome: string } | null;

      return {
        id: row.id as string,
        pipelineId: (row.pipeline_id as string | null) ?? null,
        stageId: (row.stage_id as string | null) ?? null,
        status: row.status as KanbanCard['status'],
        title: segurado?.nome ?? (row.nome as string | null) ?? 'Oportunidade',
        subtitle: ramo?.nome ?? undefined,
        responsavelId: (row.responsavel_id as string | null) ?? null,
        responsavelName: undefined,
        responsavelAvatar: undefined,
        primaryValue: row.premio_liquido ? Number(row.premio_liquido) : null,
        primaryValueLabel: 'Premio',
        dueDate: (row.proximo_followup as string | null) ?? null,
        tags: [
          ramo?.nome ? { label: ramo.nome, tone: 'default' as const } : null,
          seguradora?.nome ? { label: seguradora.nome, tone: 'info' as const } : null,
          row.tipo_negocio ? { label: String(row.tipo_negocio), tone: 'default' as const } : null,
        ].filter(Boolean) as KanbanCard['tags'],
        concludedAt: (row.concluded_at as string | null) ?? null,
        raw: row,
      };
    });
  },

  async updateStage(args) {
    await genericUpdateStage('comercial', args.cardId, args.toStageId);
  },

  async conclude(args) {
    await genericConclude('comercial', args.cardId, args.payload);
  },

  CardComponent: ComercialCard,

  availableFilters: ['search', 'ramo', 'origem', 'produtor', 'tipoNegocio', 'dataRetorno', 'dataVigencia'],
};
