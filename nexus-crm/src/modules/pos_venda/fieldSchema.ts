import type { FieldDef } from '../comercial/fieldSchema';

/** Campos core de public.pos_vendas. */
export const POS_VENDA_CORE_FIELDS: FieldDef[] = [
  { key: 'oportunidade_id',  label: 'Apolice/Oportunidade', type: 'select', required: true },
  { key: 'proximo_followup', label: 'Proximo Followup',      type: 'date' },
  { key: 'observacoes',      label: 'Observacoes',           type: 'textarea' },
];

/** JSONB em pos_vendas.metadata - trata endossos, renovacoes e cancelamentos. */
export const POS_VENDA_METADATA: FieldDef[] = [
  { key: 'tipo_demanda',      label: 'Tipo de Demanda',     type: 'select', options: [
      { value: 'endosso',         label: 'Endosso' },
      { value: 'renovacao',       label: 'Renovacao' },
      { value: 'cancelamento',    label: 'Cancelamento' },
  ] },
  { key: 'data_referencia',   label: 'Data de Referencia',  type: 'date' },
  { key: 'motivo',            label: 'Motivo',              type: 'textarea' },
];
