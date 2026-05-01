import type { FieldDef } from '../comercial/fieldSchema';

/** Campos core de public.sinistros (colunas tipadas). */
export const SINISTRO_CORE_FIELDS: FieldDef[] = [
  { key: 'oportunidade_id', label: 'Oportunidade vinculada', type: 'select', required: true },
  { key: 'numero_sinistro', label: 'Numero do Sinistro',     type: 'text' },
  { key: 'data_sinistro',   label: 'Data do Sinistro',       type: 'date' },
  { key: 'data_aviso',      label: 'Data do Aviso',          type: 'date' },
  { key: 'tipo_sinistro',   label: 'Tipo de Sinistro',       type: 'select', options: [
      { value: 'colisao',     label: 'Colisao' },
      { value: 'roubo_furto', label: 'Roubo / Furto' },
      { value: 'incendio',    label: 'Incendio' },
      { value: 'alagamento',  label: 'Alagamento' },
      { value: 'outros',      label: 'Outros' },
  ] },
  { key: 'valor_prejuizo',    label: 'Valor de Prejuizo (R$)',    type: 'money' },
  { key: 'valor_indenizacao', label: 'Valor de Indenizacao (R$)', type: 'money' },
  { key: 'observacoes',       label: 'Observacoes',               type: 'textarea' },
];

/** Campos flexiveis por ramo, em sinistros.metadata. */
export const SINISTRO_METADATA_BY_RAMO: Record<string, FieldDef[]> = {
  Auto: [
    { key: 'placa',              label: 'Placa',                 type: 'text' },
    { key: 'local_ocorrencia',   label: 'Local da Ocorrencia',   type: 'text' },
    { key: 'boletim_ocorrencia', label: 'Num. do BO',            type: 'text' },
    { key: 'oficina',            label: 'Oficina',               type: 'text' },
    { key: 'carro_reserva',      label: 'Carro Reserva',         type: 'boolean' },
    { key: 'terceiros',          label: 'Envolveu Terceiros',    type: 'boolean' },
  ],
  Automovel: [
    { key: 'placa',              label: 'Placa',                 type: 'text' },
    { key: 'local_ocorrencia',   label: 'Local da Ocorrencia',   type: 'text' },
    { key: 'boletim_ocorrencia', label: 'Num. do BO',            type: 'text' },
    { key: 'oficina',            label: 'Oficina',               type: 'text' },
    { key: 'carro_reserva',      label: 'Carro Reserva',         type: 'boolean' },
    { key: 'terceiros',          label: 'Envolveu Terceiros',    type: 'boolean' },
  ],
  Residencial: [
    { key: 'tipo_dano', label: 'Tipo de Dano',   type: 'text' },
    { key: 'comodo',    label: 'Comodo afetado', type: 'text' },
    { key: 'prestador', label: 'Prestador',      type: 'text' },
  ],
  Vida: [
    { key: 'tipo_evento',         label: 'Tipo de Evento',       type: 'text' },
    { key: 'beneficiario',        label: 'Beneficiario',         type: 'text' },
    { key: 'documentacao_medica', label: 'Documentacao Medica',  type: 'textarea' },
  ],
};
