import type { FieldDef } from '../comercial/fieldSchema';

/** Campos core de public.financeiro_cobrancas. */
export const FINANCEIRO_CORE_FIELDS: FieldDef[] = [
  { key: 'oportunidade_id',   label: 'Apolice/Oportunidade', type: 'select', required: true },
  { key: 'proximo_followup',  label: 'Proximo Followup',      type: 'date' },
  { key: 'observacoes',       label: 'Observacoes',           type: 'textarea' },
];

/** JSONB em financeiro_cobrancas.metadata - cobrancas e inadimplencia. */
export const FINANCEIRO_METADATA: FieldDef[] = [
  { key: 'valor_parcela',      label: 'Valor da Parcela (R$)',  type: 'money' },
  { key: 'numero_parcela',     label: 'Numero da Parcela',       type: 'number' },
  { key: 'total_parcelas',     label: 'Total de Parcelas',       type: 'number' },
  { key: 'data_vencimento',    label: 'Data de Vencimento',      type: 'date' },
  { key: 'dias_atraso',        label: 'Dias em Atraso',          type: 'number' },
  { key: 'forma_pagamento',    label: 'Forma de Pagamento',      type: 'text' },
];
