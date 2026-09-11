import type { CalculationSpecializationInput } from './calculationDomain'
import type { CalculoForma } from '../../types/database'

export type RiskFieldType = 'text' | 'number' | 'date' | 'boolean' | 'textarea'

export type RiskFieldDefinition = {
  key: string
  label: string
  type: RiskFieldType
  wide?: boolean
  step?: string
}

type SpecializationData<Form extends CalculoForma> = Extract<CalculationSpecializationInput, { forma: Form }>['data']

export const RISK_FIELDS: Record<CalculoForma, readonly RiskFieldDefinition[]> = {
  AUTO: [
    { key: 'codigo_fipe', label: 'Código FIPE', type: 'text' },
    { key: 'marca', label: 'Marca', type: 'text' },
    { key: 'modelo', label: 'Modelo', type: 'text' },
    { key: 'versao', label: 'Versão', type: 'text' },
    { key: 'ano_fabricacao', label: 'Ano de fabricação', type: 'number' },
    { key: 'ano_modelo', label: 'Ano do modelo', type: 'number' },
    { key: 'placa', label: 'Placa', type: 'text' },
    { key: 'chassi', label: 'Chassi', type: 'text' },
    { key: 'chassi_remarcado', label: 'Chassi remarcado', type: 'boolean' },
    { key: 'renavam', label: 'Renavam', type: 'text' },
    { key: 'zero_km', label: 'Veículo zero km', type: 'boolean' },
    { key: 'combustivel', label: 'Combustível', type: 'text' },
    { key: 'cambio', label: 'Câmbio', type: 'text' },
    { key: 'categoria', label: 'Categoria', type: 'text' },
    { key: 'tipo_veiculo', label: 'Tipo de veículo', type: 'text' },
    { key: 'uso', label: 'Uso do veículo', type: 'text' },
    { key: 'cep_pernoite', label: 'CEP de pernoite', type: 'text' },
    { key: 'possui_garagem_residencia', label: 'Garagem na residência', type: 'boolean' },
    { key: 'possui_garagem_trabalho', label: 'Garagem no trabalho', type: 'boolean' },
    { key: 'possui_garagem_estudo', label: 'Garagem no local de estudo', type: 'boolean' },
    { key: 'km_mensal', label: 'Quilometragem mensal', type: 'number' },
    { key: 'blindado', label: 'Blindado', type: 'boolean' },
    { key: 'alienado', label: 'Alienado', type: 'boolean' },
    { key: 'rastreador', label: 'Possui rastreador', type: 'boolean' },
    { key: 'antifurto', label: 'Possui antifurto', type: 'boolean' },
    { key: 'kit_gas', label: 'Possui kit gás', type: 'boolean' },
    { key: 'condutor_nome', label: 'Nome do condutor principal', type: 'text' },
    { key: 'condutor_cpf', label: 'CPF do condutor', type: 'text' },
    { key: 'condutor_data_nascimento', label: 'Nascimento do condutor', type: 'date' },
    { key: 'condutor_sexo', label: 'Sexo do condutor', type: 'text' },
    { key: 'condutor_estado_civil', label: 'Estado civil do condutor', type: 'text' },
    { key: 'condutor_profissao', label: 'Profissão do condutor', type: 'text' },
    { key: 'condutor_reside_com_segurado', label: 'Condutor reside com o segurado', type: 'boolean' },
    { key: 'condutor_tempo_habilitacao', label: 'Tempo de habilitação (anos)', type: 'number' },
  ],
  RESIDENCIA: [
    { key: 'cep', label: 'CEP', type: 'text' },
    { key: 'endereco', label: 'Endereço', type: 'text', wide: true },
    { key: 'numero', label: 'Número', type: 'text' },
    { key: 'complemento', label: 'Complemento', type: 'text' },
    { key: 'bairro', label: 'Bairro', type: 'text' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
    { key: 'uf', label: 'UF', type: 'text' },
    { key: 'tipo_imovel', label: 'Tipo de imóvel', type: 'text' },
    { key: 'tipo_ocupacao', label: 'Tipo de ocupação', type: 'text' },
    { key: 'tipo_construcao', label: 'Tipo de construção', type: 'text' },
    { key: 'area_m2', label: 'Área (m²)', type: 'number', step: '0.01' },
    { key: 'valor_imovel', label: 'Valor do imóvel', type: 'number', step: '0.01' },
    { key: 'proprietario', label: 'Cotado é proprietário', type: 'boolean' },
    { key: 'desocupado', label: 'Imóvel desocupado', type: 'boolean' },
    { key: 'condominio_fechado', label: 'Condomínio fechado', type: 'boolean' },
    { key: 'area_de_risco', label: 'Localizado em área de risco', type: 'boolean' },
    { key: 'possui_alarme', label: 'Possui alarme', type: 'boolean' },
    { key: 'possui_monitoramento', label: 'Possui monitoramento', type: 'boolean' },
    { key: 'possui_portao_eletronico', label: 'Possui portão eletrônico', type: 'boolean' },
  ],
  CONDOMINIO: [
    { key: 'nome_condominio', label: 'Nome do condomínio', type: 'text', wide: true },
    { key: 'cep', label: 'CEP', type: 'text' },
    { key: 'endereco', label: 'Endereço', type: 'text', wide: true },
    { key: 'numero', label: 'Número', type: 'text' },
    { key: 'complemento', label: 'Complemento', type: 'text' },
    { key: 'bairro', label: 'Bairro', type: 'text' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
    { key: 'uf', label: 'UF', type: 'text' },
    { key: 'tipo_condominio', label: 'Tipo de condomínio', type: 'text' },
    { key: 'area_total_m2', label: 'Área total (m²)', type: 'number', step: '0.01' },
    { key: 'qtd_blocos', label: 'Quantidade de blocos', type: 'number' },
    { key: 'qtd_pavimentos', label: 'Quantidade de pavimentos', type: 'number' },
    { key: 'qtd_unidades', label: 'Quantidade de unidades', type: 'number' },
    { key: 'qtd_elevadores', label: 'Quantidade de elevadores', type: 'number' },
    { key: 'possui_portaria_24h', label: 'Portaria 24 horas', type: 'boolean' },
    { key: 'possui_sprinklers', label: 'Possui sprinklers', type: 'boolean' },
    { key: 'possui_extintores', label: 'Possui extintores', type: 'boolean' },
    { key: 'possui_para_raios', label: 'Possui para-raios', type: 'boolean' },
    { key: 'possui_garagem', label: 'Possui garagem', type: 'boolean' },
  ],
  VIDA: [
    { key: 'sexo', label: 'Sexo', type: 'text' },
    { key: 'data_nascimento', label: 'Data de nascimento', type: 'date' },
    { key: 'altura_cm', label: 'Altura (cm)', type: 'number' },
    { key: 'peso_kg', label: 'Peso (kg)', type: 'number', step: '0.01' },
    { key: 'renda_mensal', label: 'Renda mensal', type: 'number', step: '0.01' },
    { key: 'profissao', label: 'Profissão', type: 'text' },
    { key: 'fumante', label: 'Fumante', type: 'boolean' },
    { key: 'pratica_esporte_risco', label: 'Pratica esporte de risco', type: 'boolean' },
    { key: 'possui_doenca_preexistente', label: 'Possui doença preexistente', type: 'boolean' },
    { key: 'usa_medicamento_continuo', label: 'Usa medicamento contínuo', type: 'boolean' },
    { key: 'capital_desejado', label: 'Capital desejado', type: 'number', step: '0.01' },
    { key: 'beneficiarios_texto', label: 'Beneficiários', type: 'textarea', wide: true },
  ],
  EMPRESA: [
    { key: 'cnpj', label: 'CNPJ do risco', type: 'text' },
    { key: 'razao_social', label: 'Razão social', type: 'text', wide: true },
    { key: 'atividade', label: 'Atividade', type: 'text' },
    { key: 'cnae', label: 'CNAE', type: 'text' },
    { key: 'faturamento_anual', label: 'Faturamento anual', type: 'number', step: '0.01' },
    { key: 'cep', label: 'CEP', type: 'text' },
    { key: 'endereco', label: 'Endereço', type: 'text', wide: true },
    { key: 'numero', label: 'Número', type: 'text' },
    { key: 'complemento', label: 'Complemento', type: 'text' },
    { key: 'bairro', label: 'Bairro', type: 'text' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
    { key: 'uf', label: 'UF', type: 'text' },
    { key: 'tipo_construcao', label: 'Tipo de construção', type: 'text' },
    { key: 'area_m2', label: 'Área (m²)', type: 'number', step: '0.01' },
    { key: 'qtd_funcionarios', label: 'Quantidade de funcionários', type: 'number' },
    { key: 'possui_extintores', label: 'Possui extintores', type: 'boolean' },
    { key: 'possui_alarme', label: 'Possui alarme', type: 'boolean' },
    { key: 'possui_sprinklers', label: 'Possui sprinklers', type: 'boolean' },
    { key: 'possui_inflamaveis', label: 'Possui inflamáveis', type: 'boolean' },
    { key: 'valor_estoque', label: 'Valor do estoque', type: 'number', step: '0.01' },
    { key: 'valor_equipamentos', label: 'Valor dos equipamentos', type: 'number', step: '0.01' },
  ],
  DIVERSOS: [
    { key: 'categoria', label: 'Categoria do risco', type: 'text' },
    { key: 'descricao_risco', label: 'Descrição do risco', type: 'textarea', wide: true },
    { key: 'valor_declarado', label: 'Valor declarado', type: 'number', step: '0.01' },
    { key: 'observacoes', label: 'Observações do risco', type: 'textarea', wide: true },
  ],
}

export function createEmptySpecialization(forma: CalculoForma): CalculationSpecializationInput {
  const data = Object.fromEntries(RISK_FIELDS[forma].map((field) => [field.key, null]))
  switch (forma) {
    case 'AUTO': return { forma, data: data as SpecializationData<'AUTO'> }
    case 'RESIDENCIA': return { forma, data: data as SpecializationData<'RESIDENCIA'> }
    case 'CONDOMINIO': return { forma, data: data as SpecializationData<'CONDOMINIO'> }
    case 'VIDA': return { forma, data: data as SpecializationData<'VIDA'> }
    case 'EMPRESA': return { forma, data: data as SpecializationData<'EMPRESA'> }
    case 'DIVERSOS': return { forma, data: data as SpecializationData<'DIVERSOS'> }
  }
}

export function updateSpecializationField(
  specialization: CalculationSpecializationInput,
  field: string,
  value: string | number | boolean | null,
): CalculationSpecializationInput {
  const data = { ...specialization.data, [field]: value }
  return { forma: specialization.forma, data } as CalculationSpecializationInput
}
