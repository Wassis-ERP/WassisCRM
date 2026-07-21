import type { RamoFormaCalculo } from '../../hooks/useLookups'

export type AggerCoverageNature = 'cobertura' | 'assistencia' | 'parametro_calculo'
export type AggerCoverageValueType = 'selecao' | 'capital_lmi' | 'percentual' | 'enum'
export type AggerCoverageDestination = 'calculo_coberturas' | 'calc_especializacao' | 'adaptador'

export interface AggerCoverageMapping {
  formaCalculo: RamoFormaCalculo
  externalKey: string
  internalCode: string | null
  label: string
  nature: AggerCoverageNature
  valueType: AggerCoverageValueType
  destination: AggerCoverageDestination
  appliesToManualProposal: boolean
  zeroNullRule: 'zero_e_valor' | 'zero_desabilita' | 'ausente_nao_informado'
  catalogType: 'basica' | 'adicional' | 'assistencia' | 'servico' | null
}

const coverage = (
  formaCalculo: RamoFormaCalculo,
  externalKey: string,
  internalCode: string,
  label: string,
  catalogType: NonNullable<AggerCoverageMapping['catalogType']> = 'adicional',
  valueType: AggerCoverageValueType = 'capital_lmi',
): AggerCoverageMapping => ({
  formaCalculo,
  externalKey,
  internalCode,
  label,
  nature: catalogType === 'assistencia' ? 'assistencia' : 'cobertura',
  valueType,
  destination: 'calculo_coberturas',
  appliesToManualProposal: true,
  zeroNullRule: valueType === 'selecao' ? 'zero_desabilita' : 'zero_e_valor',
  catalogType,
})

const parameter = (
  formaCalculo: RamoFormaCalculo,
  externalKey: string,
  label: string,
  valueType: Extract<AggerCoverageValueType, 'percentual' | 'enum' | 'selecao'>,
): AggerCoverageMapping => ({
  formaCalculo,
  externalKey,
  internalCode: null,
  label,
  nature: 'parametro_calculo',
  valueType,
  destination: 'calc_especializacao',
  appliesToManualProposal: false,
  zeroNullRule: 'ausente_nao_informado',
  catalogType: null,
})

export const AGGER_COVERAGE_MAP: readonly AggerCoverageMapping[] = [
  coverage('AUTO', 'DanosMorais', 'danos-morais', 'Danos morais'),
  coverage('AUTO', 'DanosMateriais', 'danos-materiais', 'Danos materiais a terceiros'),
  coverage('AUTO', 'DanosCorporais', 'danos-corporais', 'Danos corporais a terceiros'),
  coverage('AUTO', 'MorteInvalidez', 'morte-invalidez-passageiros', 'Morte e invalidez de passageiros'),
  coverage('AUTO', 'Assistencia', 'assistencia-24h', 'Assistência 24 horas', 'assistencia', 'selecao'),
  coverage('AUTO', 'Vidros', 'vidros', 'Vidros', 'adicional', 'selecao'),
  coverage('AUTO', 'CarroReserva', 'carro-reserva', 'Carro reserva', 'servico', 'selecao'),
  coverage('AUTO', 'KitGas', 'kit-gas', 'Kit gás'),
  coverage('AUTO', 'Carroceria', 'carroceria', 'Carroceria'),
  coverage('AUTO', 'Equipamento', 'equipamentos', 'Equipamentos'),
  parameter('AUTO', 'TipoVeiculo', 'Tipo de veículo', 'enum'),
  parameter('AUTO', 'TipoFranquia', 'Tipo de franquia', 'enum'),
  parameter('AUTO', 'FatorAjuste', 'Fator de ajuste da FIPE', 'percentual'),
  parameter('AUTO', 'ArCondicionado', 'Ar-condicionado para carro reserva', 'selecao'),

  coverage('RESIDENCIA', 'Assistencia', 'assistencia-24h', 'Assistência 24 horas', 'assistencia', 'selecao'),
  coverage('RESIDENCIA', 'Basica', 'incendio-raio-explosao', 'Incêndio, raio e explosão', 'basica'),
  coverage('RESIDENCIA', 'DanosMorais', 'danos-morais', 'Danos morais'),
  coverage('RESIDENCIA', 'ResponsabilidadeCivilFamiliar', 'responsabilidade-civil-familiar', 'Responsabilidade civil familiar'),
  coverage('RESIDENCIA', 'DanosEletricos', 'danos-eletricos', 'Danos elétricos'),
  coverage('RESIDENCIA', 'Equipamentos', 'equipamentos', 'Equipamentos'),
  coverage('RESIDENCIA', 'Aluguel', 'perda-pagamento-aluguel', 'Perda ou pagamento de aluguel'),
  coverage('RESIDENCIA', 'Vidros', 'vidros', 'Vidros'),
  coverage('RESIDENCIA', 'RouboFurto', 'roubo-furto-bens', 'Roubo ou furto de bens'),
  coverage('RESIDENCIA', 'Vazamentos', 'vazamentos', 'Vazamentos'),
  coverage('RESIDENCIA', 'Vendaval', 'vendaval', 'Vendaval, furacão, ciclone e granizo'),
  coverage('RESIDENCIA', 'Desmoronamento', 'desmoronamento', 'Desmoronamento'),
  coverage('RESIDENCIA', 'TumultoGreve', 'tumultos-greves-lockout', 'Tumultos, greves e lockout'),
  coverage('RESIDENCIA', 'ImpactoVeiculos', 'impacto-veiculos', 'Impacto de veículos'),
  coverage('RESIDENCIA', 'RecomposicaoDocumento', 'recomposicao-documentos', 'Recomposição de documentos'),

  coverage('CONDOMINIO', 'Assistencia', 'assistencia-24h', 'Assistência 24 horas', 'assistencia', 'selecao'),
  coverage('CONDOMINIO', 'Basica', 'incendio-raio-explosao', 'Incêndio, raio e explosão', 'basica'),
  coverage('CONDOMINIO', 'DanosMorais', 'danos-morais', 'Danos morais'),
  coverage('CONDOMINIO', 'DanosEletricos', 'danos-eletricos', 'Danos elétricos'),
  coverage('CONDOMINIO', 'Portoes', 'portoes', 'Portões'),
  coverage('CONDOMINIO', 'Vidros', 'vidros', 'Vidros'),
  coverage('CONDOMINIO', 'RouboBens', 'roubo-bens-condominio', 'Roubo de bens do condomínio'),
  coverage('CONDOMINIO', 'Vazamentos', 'vazamentos', 'Vazamentos'),
  coverage('CONDOMINIO', 'Vendaval', 'vendaval', 'Vendaval, furacão, ciclone e granizo'),
  coverage('CONDOMINIO', 'Desmoronamento', 'desmoronamento', 'Desmoronamento'),
  coverage('CONDOMINIO', 'TumultoGreve', 'tumultos-greves-lockout', 'Tumultos, greves e lockout'),
  coverage('CONDOMINIO', 'ImpactoVeiculo', 'impacto-veiculos', 'Impacto de veículos'),
  coverage('CONDOMINIO', 'Alagamento', 'alagamento', 'Alagamento'),
  coverage('CONDOMINIO', 'DespesasFixas', 'despesas-fixas', 'Despesas fixas'),
  coverage('CONDOMINIO', 'Sindico', 'rc-sindico', 'Responsabilidade civil do síndico'),
  coverage('CONDOMINIO', 'Condominio', 'rc-condominio', 'Responsabilidade civil do condomínio'),
  coverage('CONDOMINIO', 'Garagista', 'rc-garagista', 'Responsabilidade civil do garagista'),
  coverage('CONDOMINIO', 'IncendioBens', 'incendio-bens-condominos', 'Incêndio de bens dos condôminos'),
  coverage('CONDOMINIO', 'Aluguel', 'perda-pagamento-aluguel', 'Perda ou pagamento de aluguel'),
  coverage('CONDOMINIO', 'GaragistaExclusiva', 'rc-garagista-exclusiva', 'RC garagista — cobertura exclusiva'),
  coverage('CONDOMINIO', 'VidaFuncionario', 'vida-funcionarios', 'Vida de funcionários'),
  coverage('CONDOMINIO', 'RouboCondomino', 'roubo-bens-condominos', 'Roubo de bens dos condôminos'),
  coverage('CONDOMINIO', 'Anuncios', 'anuncios-luminosos', 'Anúncios luminosos'),

  coverage('VIDA', 'Capital', 'morte-natural-acidental', 'Morte natural ou acidental', 'basica'),
  coverage('VIDA', 'AssistenciaFuneral', 'assistencia-funeral', 'Assistência funeral', 'assistencia', 'selecao'),
  coverage('VIDA', 'InvalidezDoenca', 'invalidez-doenca', 'Invalidez funcional por doença'),

  coverage('EMPRESA', 'Assistencia', 'assistencia-24h', 'Assistência 24 horas', 'assistencia', 'selecao'),
  coverage('EMPRESA', 'Basica', 'incendio-raio-explosao', 'Incêndio, raio e explosão', 'basica'),
  coverage('EMPRESA', 'DanoEletrico', 'danos-eletricos', 'Danos elétricos'),
  coverage('EMPRESA', 'Vidro', 'vidros', 'Vidros'),
  coverage('EMPRESA', 'RouboFurto', 'roubo-furto-bens', 'Roubo ou furto de bens'),
  coverage('EMPRESA', 'Equipamento', 'equipamentos', 'Equipamentos'),
  coverage('EMPRESA', 'Vendaval', 'vendaval', 'Vendaval, furacão, ciclone e granizo'),
  coverage('EMPRESA', 'ImpactoVeiculo', 'impacto-veiculos', 'Impacto de veículos'),
  coverage('EMPRESA', 'Desmoronamento', 'desmoronamento', 'Desmoronamento'),
  coverage('EMPRESA', 'Anuncio', 'anuncios-luminosos', 'Anúncios luminosos'),
  coverage('EMPRESA', 'Aluguel', 'perda-pagamento-aluguel', 'Perda ou pagamento de aluguel'),
  coverage('EMPRESA', 'TumultoGreve', 'tumultos-greves-lockout', 'Tumultos, greves e lockout'),
  coverage('EMPRESA', 'RecomposicaoDocumento', 'recomposicao-documentos', 'Recomposição de documentos'),
] as const

export function getAggerMappings(formaCalculo: RamoFormaCalculo): AggerCoverageMapping[] {
  return AGGER_COVERAGE_MAP.filter((item) => item.formaCalculo === formaCalculo)
}

export function getAggerCatalogMappings(formaCalculo: RamoFormaCalculo): AggerCoverageMapping[] {
  return getAggerMappings(formaCalculo).filter(
    (item) => item.destination === 'calculo_coberturas' && item.internalCode !== null,
  )
}

export function findAggerMapping(
  formaCalculo: RamoFormaCalculo,
  externalKey: string,
): AggerCoverageMapping | undefined {
  return AGGER_COVERAGE_MAP.find(
    (item) => item.formaCalculo === formaCalculo && item.externalKey === externalKey,
  )
}
