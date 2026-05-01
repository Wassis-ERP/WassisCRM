/**
 * Schema de campos do pipeline Comercial (oportunidades).
 *
 * Estrategia hibrida (decidida na Fase 1.1):
 * - "core" -> colunas tipadas na tabela oportunidades (usadas em filtros/BI)
 * - "metadata" -> jsonb livre por ramo (placa, profissao, etc.)
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
  { key: 'nome',             label: 'Titulo',           type: 'text',     required: true },
  { key: 'segurado_id',      label: 'Segurado',         type: 'select',   required: true },
  { key: 'ramo_id',          label: 'Ramo',             type: 'select',   required: true },
  { key: 'seguradora_id',    label: 'Seguradora',       type: 'select' },
  { key: 'origem_id',        label: 'Origem',           type: 'select' },
  { key: 'tipo_negocio',     label: 'Tipo de Negocio',  type: 'select', options: [
      { value: 'novo',        label: 'Novo' },
      { value: 'renovacao',   label: 'Renovacao' },
      { value: 'endosso',     label: 'Endosso' },
  ] },
  { key: 'tipo_contato',     label: 'Contato',          type: 'select', options: [
      { value: 'true',  label: 'Ativo' },
      { value: 'false', label: 'Receptivo' },
  ] },
  { key: 'premio_liquido',   label: 'Premio Liquido',      type: 'money' },
  { key: 'comissao_percentual', label: 'Comissao (%)',     type: 'number' },
  { key: 'agenciamento',     label: 'Agenciamento (%)',    type: 'number' },
  { key: 'vigencia_inicio',  label: 'Vigencia Inicio',     type: 'date' },
  { key: 'vigencia_fim',     label: 'Vigencia Fim',        type: 'date' },
  { key: 'proximo_followup', label: 'Proximo Retorno',     type: 'date' },
  { key: 'indicador',        label: 'Indicador',           type: 'text' },
  { key: 'observacoes',      label: 'Observacoes',         type: 'textarea' },
];

/**
 * Campos extras por ramo, persistidos em oportunidades.metadata (jsonb).
 * Chave = nome do ramo (compativel com ramos.nome).
 */
export const COMERCIAL_METADATA_BY_RAMO: Record<string, FieldDef[]> = {
  Auto: [
    { key: 'placa',           label: 'Placa',              type: 'text' },
    { key: 'chassi',          label: 'Chassi',             type: 'text' },
    { key: 'modelo',          label: 'Modelo',             type: 'text' },
    { key: 'ano_fabricacao',  label: 'Ano de Fabricacao',  type: 'number' },
    { key: 'bonus_atual',     label: 'Classe de Bonus',    type: 'number' },
    { key: 'pernoite_cep',    label: 'CEP de Pernoite',    type: 'text' },
  ],
  Automovel: [
    { key: 'placa',           label: 'Placa',              type: 'text' },
    { key: 'chassi',          label: 'Chassi',             type: 'text' },
    { key: 'modelo',          label: 'Modelo',             type: 'text' },
    { key: 'ano_fabricacao',  label: 'Ano de Fabricacao',  type: 'number' },
    { key: 'bonus_atual',     label: 'Classe de Bonus',    type: 'number' },
    { key: 'pernoite_cep',    label: 'CEP de Pernoite',    type: 'text' },
  ],
  Residencial: [
    { key: 'tipo_imovel',     label: 'Tipo de Imovel',     type: 'select', options: [
        { value: 'casa',       label: 'Casa' },
        { value: 'apartamento',label: 'Apartamento' },
        { value: 'comercial',  label: 'Comercial' },
    ] },
    { key: 'endereco',        label: 'Endereco Completo',  type: 'text' },
    { key: 'cobertura_incendio', label: 'Cobertura Incendio (R$)', type: 'money' },
  ],
  Vida: [
    { key: 'profissao',       label: 'Profissao',           type: 'text' },
    { key: 'fumante',         label: 'Fumante',             type: 'boolean' },
    { key: 'beneficiarios',   label: 'Beneficiarios',       type: 'textarea' },
  ],
};

/**
 * Flags temporarias no metadata (usadas pela corretora em campanhas).
 */
export const COMERCIAL_METADATA_FLAGS: FieldDef[] = [
  { key: 'cartao_porto', label: 'Cartao Porto',  type: 'boolean' },
  { key: 'ge_porto',     label: 'GE Porto',      type: 'boolean' },
  { key: 'checado',      label: 'Checado pelo gerente', type: 'boolean' },
];
