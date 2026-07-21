/**
 * Schema de campos do pipeline Comercial (oportunidades).
 *
 * O contrato v2.6 mantém apenas campos comerciais escalares na oportunidade.
 * Dados de risco pertencem aos futuros `calculos/calc_*`; extensões definidas
 * pela corretora usam exclusivamente o EAV tipado das guias transversais.
 */
export type FieldInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'money'
  | 'date'
  | 'select'
  | 'boolean';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldInputType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  help?: string;
}

/**
 * Campos core do comercial. Persistidos como colunas em public.oportunidades.
 */
export const COMERCIAL_CORE_FIELDS: FieldDef[] = [
  { key: 'titulo', label: 'Título', type: 'text' },
  { key: 'segurado_id', label: 'Segurado', type: 'select' },
  { key: 'ramo_id', label: 'Ramo', type: 'select' },
  { key: 'origem_id', label: 'Origem', type: 'select' },
  { key: 'prioridade', label: 'Prioridade', type: 'select' },
  { key: 'valor_premio_estimado', label: 'Prêmio estimado', type: 'money' },
  { key: 'valor_comissao_estimada', label: 'Comissão estimada', type: 'money' },
  { key: 'comissao_estimada_pct', label: 'Comissão estimada (%)', type: 'number' },
  { key: 'agenciamento_pct', label: 'Agenciamento (%)', type: 'number' },
  { key: 'data_abertura', label: 'Data de abertura', type: 'date' },
  { key: 'data_fechamento_prevista', label: 'Fechamento previsto', type: 'date' },
  { key: 'campanha', label: 'Campanha', type: 'text' },
  { key: 'descricao', label: 'Descrição', type: 'textarea' },
  { key: 'observacoes', label: 'Observações', type: 'textarea' },
];
