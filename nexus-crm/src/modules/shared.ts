import { supabase } from '../lib/supabase';
import type { CardStatus, ConcludePayload, PipelineModule } from './types';

/**
 * Tabela real por modulo - unica fonte que mapeia um modulo para seu backing store.
 */
export const MODULE_TABLE: Record<PipelineModule, 'oportunidades' | 'sinistros' | 'emissoes' | 'pos_vendas' | 'financeiro_cobrancas'> = {
  comercial: 'oportunidades',
  sinistro: 'sinistros',
  emissao: 'emissoes',
  pos_venda: 'pos_vendas',
  financeiro: 'financeiro_cobrancas',
};

/**
 * Atualiza apenas o stage_id de um card. Mantem status/concluded_at intactos.
 * RLS do Supabase garante que so o tenant correto consiga persistir.
 */
export async function genericUpdateStage(
  module: PipelineModule,
  cardId: string,
  toStageId: string,
): Promise<void> {
  const table = MODULE_TABLE[module];
  const { error } = await supabase
    .from(table)
    .update({ stage_id: toStageId })
    .eq('id', cardId);

  if (error) throw error;
}

/**
 * Marca o card como ganho ou perdido, preenchendo concluded_at.
 * O card PERMANECE na mesma stage (decisao arquitetural da Fase 1).
 * motivo_perda_id so e aplicavel a oportunidades (comercial).
 */
export async function genericConclude(
  module: PipelineModule,
  cardId: string,
  payload: ConcludePayload,
): Promise<void> {
  const table = MODULE_TABLE[module];
  const now = new Date().toISOString();

  const update: Record<string, unknown> = {
    status: payload.status as CardStatus,
    concluded_at: now,
  };

  if (module === 'comercial' && payload.status === 'lost' && payload.motivoPerdaId) {
    update.motivo_perda_id = payload.motivoPerdaId;
  }

  const { error } = await supabase.from(table).update(update).eq('id', cardId);
  if (error) throw error;
}

/**
 * Volta o card para status pending e zera concluded_at.
 * Util para reverter um "Ganho"/"Perdido" acidental.
 */
export async function genericReopen(module: PipelineModule, cardId: string): Promise<void> {
  const table = MODULE_TABLE[module];
  const { error } = await supabase
    .from(table)
    .update({ status: 'pending', concluded_at: null })
    .eq('id', cardId);
  if (error) throw error;
}
