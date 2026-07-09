export const ENTIDADE_TIPOS = [
  'segurado',
  'oportunidade',
  'cotacao',
  'apolice',
  'proposta',
  'apolice_item',
  'sinistro',
  'cobranca',
  'pos_venda',
] as const;

export type EntidadeTipo = (typeof ENTIDADE_TIPOS)[number];

export interface EntidadeContexto {
  entidadeTipo: EntidadeTipo;
  entidadeId: string;
  tenantId: string;
  filialId?: string | null;
}

export function entityContextKey(context: Pick<EntidadeContexto, 'entidadeTipo' | 'entidadeId'>): string {
  return `${context.entidadeTipo}:${context.entidadeId}`;
}
