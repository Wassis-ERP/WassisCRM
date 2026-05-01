import type { FieldDef } from '../comercial/fieldSchema';

/** Campos core de public.emissoes. */
export const EMISSAO_CORE_FIELDS: FieldDef[] = [
  { key: 'oportunidade_id',   label: 'Oportunidade vinculada', type: 'select', required: true },
  { key: 'proximo_followup',  label: 'Proximo Followup',        type: 'date' },
  { key: 'observacoes',       label: 'Observacoes',             type: 'textarea' },
];

/**
 * Contratos JSONB em emissoes.metadata (chaves padronizadas para n8n/front).
 * Nao sao colunas do DB.
 */
export const EMISSAO_METADATA: FieldDef[] = [
  { key: 'numero_proposta',    label: 'Numero da Proposta',   type: 'text' },
  { key: 'numero_apolice',     label: 'Numero da Apolice',    type: 'text' },
  { key: 'forma_pagamento',    label: 'Forma de Pagamento',   type: 'select', options: [
      { value: 'boleto',            label: 'Boleto' },
      { value: 'cartao_credito',    label: 'Cartao de Credito' },
      { value: 'debito_automatico', label: 'Debito Automatico' },
      { value: 'pix',               label: 'Pix' },
  ] },
  { key: 'quantidade_parcelas',label: 'Quantidade de Parcelas', type: 'number' },
];
