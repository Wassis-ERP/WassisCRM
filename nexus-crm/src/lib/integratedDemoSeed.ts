import {
  addCalendarYear,
  createCalculationAtomic,
  type CalculationCoverageInput,
  type CalculationCreateInput,
  type CalculationSpecializationInput,
  type CalculationStore,
} from '../modules/comercial/calculationDomain'

type DemoRow = Record<string, unknown>
type DemoDatabase = Record<string, DemoRow[]>

export type IntegratedDemoSeedContext = {
  db: DemoDatabase
  calculationStore: CalculationStore
  tenantId: string
  matrixBranchId: string
  centerBranchId: string
  userId: string
  secondaryUserId: string
  internalProducerId: string
  externalProducerId: string
  lineIds: Record<string, string>
  insurerIds: Record<string, string>
  opportunityStageIds: {
    prospecting: string
    quoting: string
    negotiation: string
    closing: string
  }
  proposalStageIds: {
    issued: string
    waiting: string
    analysis: string
    refused: string
  }
}

type SpecializationData<Form extends CalculationSpecializationInput['forma']> =
  Extract<CalculationSpecializationInput, { forma: Form }>['data']

const DEMO_NOW = '2026-07-22T15:00:00.000Z'

function pushRows(db: DemoDatabase, tableName: string, ...rows: DemoRow[]) {
  const table = db[tableName]
  rows.forEach((row) => {
    const id = row.id ?? row.calculo_id ?? row.apolice_item_id
    const exists = table.some((candidate) => (candidate.id ?? candidate.calculo_id ?? candidate.apolice_item_id) === id)
    if (!exists) table.push(row)
  })
}

function findNamedId(db: DemoDatabase, tableName: string, name: string): string | null {
  const row = db[tableName].find((candidate) => candidate.nome === name)
  return typeof row?.id === 'string' ? row.id : null
}

function coverageIdsForLine(db: DemoDatabase, lineId: string, limit = 2): string[] {
  return db.coberturas_catalogo
    .filter((row) => row.ramo_id === lineId && row.ativo !== false && typeof row.id === 'string')
    .sort((left, right) => Number(left.ordem ?? 0) - Number(right.ordem ?? 0))
    .slice(0, limit)
    .map((row) => String(row.id))
}

function coverageInput(
  coberturaId: string,
  options: Partial<CalculationCoverageInput> = {},
): CalculationCoverageInput {
  return {
    cobertura_id: coberturaId,
    selecionada: true,
    limite_solicitado: null,
    percentual_fipe_solicitado: null,
    franquia_tipo_solicitado: null,
    opcao_solicitada: null,
    quantidade_solicitada: null,
    observacao_transmitida: null,
    ...options,
  }
}

function autoSpecialization(overrides: Partial<SpecializationData<'AUTO'>>): CalculationSpecializationInput {
  return {
    forma: 'AUTO',
    data: {
      codigo_fipe: null, marca: null, modelo: null, versao: null,
      ano_fabricacao: null, ano_modelo: null, placa: null, chassi: null,
      chassi_remarcado: false,
      renavam: null, zero_km: false, combustivel: null, cambio: null,
      categoria: null, tipo_veiculo: null, uso: null, cep_pernoite: null,
      possui_garagem_residencia: null, possui_garagem_trabalho: null,
      possui_garagem_estudo: null, km_mensal: null, blindado: false,
      alienado: false, rastreador: false, antifurto: false, kit_gas: false,
      condutor_nome: null, condutor_cpf: null, condutor_data_nascimento: null,
      condutor_sexo: null, condutor_estado_civil: null,
      condutor_profissao: null, condutor_reside_com_segurado: null,
      condutor_tempo_habilitacao: null,
      ...overrides,
    },
  }
}

function residenceSpecialization(overrides: Partial<SpecializationData<'RESIDENCIA'>>): CalculationSpecializationInput {
  return {
    forma: 'RESIDENCIA',
    data: {
      cep: null, endereco: null, numero: null, complemento: null, bairro: null,
      cidade: null, uf: null, tipo_imovel: null, tipo_ocupacao: null,
      tipo_construcao: null, area_m2: null, valor_imovel: null,
      proprietario: null, desocupado: false, condominio_fechado: null,
      area_de_risco: false, possui_alarme: null, possui_monitoramento: null,
      possui_portao_eletronico: null,
      ...overrides,
    },
  }
}

function condominiumSpecialization(overrides: Partial<SpecializationData<'CONDOMINIO'>>): CalculationSpecializationInput {
  return {
    forma: 'CONDOMINIO',
    data: {
      nome_condominio: null, cep: null, endereco: null, numero: null,
      complemento: null, bairro: null, cidade: null, uf: null,
      tipo_condominio: null, area_total_m2: null, qtd_blocos: null,
      qtd_pavimentos: null, qtd_unidades: null, qtd_elevadores: null,
      possui_portaria_24h: null, possui_sprinklers: null,
      possui_extintores: null, possui_para_raios: null, possui_garagem: null,
      ...overrides,
    },
  }
}

function lifeSpecialization(overrides: Partial<SpecializationData<'VIDA'>>): CalculationSpecializationInput {
  return {
    forma: 'VIDA',
    data: {
      sexo: null, data_nascimento: null, altura_cm: null, peso_kg: null,
      renda_mensal: null, profissao: null, fumante: false,
      pratica_esporte_risco: false, possui_doenca_preexistente: false,
      usa_medicamento_continuo: false, capital_desejado: null,
      beneficiarios_texto: null,
      ...overrides,
    },
  }
}

function companySpecialization(overrides: Partial<SpecializationData<'EMPRESA'>>): CalculationSpecializationInput {
  return {
    forma: 'EMPRESA',
    data: {
      cnpj: null, razao_social: null, atividade: null, cnae: null,
      faturamento_anual: null, cep: null, endereco: null, numero: null,
      complemento: null, bairro: null, cidade: null, uf: null,
      tipo_construcao: null, area_m2: null, qtd_funcionarios: null,
      possui_extintores: null, possui_alarme: null, possui_sprinklers: null,
      possui_inflamaveis: null, valor_estoque: null, valor_equipamentos: null,
      ...overrides,
    },
  }
}

function diverseSpecialization(overrides: Partial<SpecializationData<'DIVERSOS'>>): CalculationSpecializationInput {
  return {
    forma: 'DIVERSOS',
    data: {
      categoria: null, descricao_risco: null, valor_declarado: null,
      observacoes: null,
      ...overrides,
    },
  }
}

const BASE_CALCULATION: Omit<CalculationCreateInput,
  'oportunidade_id' | 'ramo_id' | 'segurado_id' | 'tipo_seguro' |
  'vigencia_inicio' | 'vigencia_fim' | 'specialization' | 'coverages'
> = {
  seguradora_anterior_id: null,
  origem: 'ASSISTIDA',
  comissao_sugerida_pct: 20,
  rotulo_versao: null,
  bonus: null,
  qtd_sinistros: null,
  qtd_sinistros_perda_parcial: null,
  transferiu_titularidade: null,
  vigencia_fim_anterior: null,
  numero_apolice_anterior: null,
  codigo_identificacao_anterior: null,
  status_apolice_anterior: null,
  nota_interna: null,
}

function seedCalculation(store: CalculationStore, id: string, input: CalculationCreateInput) {
  if (store.calculations.some((row) => row.id === id)) return
  let sequence = 0
  createCalculationAtomic(store, input, {
    now: () => DEMO_NOW,
    newId: () => {
      sequence += 1
      return sequence === 1 ? id : `${id}-cobertura-${sequence - 1}`
    },
  })
}

function seedInsuredsAndContacts(context: IntegratedDemoSeedContext) {
  const { db, tenantId, matrixBranchId, centerBranchId, internalProducerId, externalProducerId } = context
  pushRows(db, 'segurados',
    {
      id: 'mock-segurado-fernanda-contato', tenant_id: tenantId, filial_id: matrixBranchId,
      tipo: 'PF', nome: 'Fernanda Nunes', nome_fantasia: null, cpf_cnpj: '52998224725',
      email: 'fernanda.nunes@viaforte.example.com', telefone: '11974443322', celular: '11974443322',
      data_nascimento: '1991-08-14', sexo: 'F', estado_civil: 'Casada', status: 'Ativo',
      lgpd_autorizado: true, produtor_id: internalProducerId, gerente_id: internalProducerId,
      cep: '04038001', logradouro: 'Rua Domingos de Morais', endereco: 'Rua Domingos de Morais',
      numero: '1450', complemento: null, bairro: 'Vila Mariana', cidade: 'São Paulo', estado: 'SP',
      observacoes: 'Contato financeiro e de seguros da Viaforte.', created_at: DEMO_NOW, updated_at: DEMO_NOW,
    },
    {
      id: 'mock-segurado-lucas', tenant_id: tenantId, filial_id: centerBranchId,
      tipo: 'PF', nome: 'Lucas Martins', nome_fantasia: null, cpf_cnpj: '16899535009',
      email: 'lucas.martins@example.com', telefone: '11981112233', celular: '11981112233',
      data_nascimento: '1988-02-29', sexo: 'M', estado_civil: 'Casado', status: 'Ativo',
      lgpd_autorizado: true, produtor_id: externalProducerId, gerente_id: externalProducerId,
      cep: '01001000', logradouro: 'Praça da Sé', endereco: 'Praça da Sé', numero: '210',
      complemento: 'Apto 83', bairro: 'Sé', cidade: 'São Paulo', estado: 'SP',
      observacoes: 'Cliente da filial Centro com cadeia completa de renovação.', created_at: DEMO_NOW, updated_at: DEMO_NOW,
    },
    {
      id: 'mock-segurado-beatriz', tenant_id: tenantId, filial_id: centerBranchId,
      tipo: 'PF', nome: 'Beatriz Rocha', nome_fantasia: null, cpf_cnpj: '39053344705',
      email: 'beatriz.rocha@example.com', telefone: '11972221100', celular: '11972221100',
      data_nascimento: '1995-11-03', sexo: 'F', estado_civil: 'Solteira', status: 'Prospecto',
      lgpd_autorizado: true, produtor_id: externalProducerId, gerente_id: externalProducerId,
      cep: '01503000', logradouro: 'Rua dos Estudantes', endereco: 'Rua dos Estudantes', numero: '55',
      complemento: null, bairro: 'Liberdade', cidade: 'São Paulo', estado: 'SP',
      observacoes: 'Tentativa recusada preservada para análise de aproveitamento.', created_at: DEMO_NOW, updated_at: DEMO_NOW,
    },
    {
      id: 'mock-segurado-clinica', tenant_id: tenantId, filial_id: centerBranchId,
      tipo: 'PJ', nome: 'Clínica Bem-Estar Ltda', nome_fantasia: 'Clínica Bem-Estar',
      cpf_cnpj: '48239107000164', email: 'administrativo@clinicabemestar.example.com',
      telefone: '1132187766', celular: '11993332211', status: 'Ativo', lgpd_autorizado: true,
      produtor_id: externalProducerId, gerente_id: externalProducerId, cep: '01310930',
      logradouro: 'Alameda Santos', endereco: 'Alameda Santos', numero: '880', complemento: '10º andar',
      bairro: 'Cerqueira César', cidade: 'São Paulo', estado: 'SP',
      observacoes: 'Conta empresarial da filial Centro.', created_at: DEMO_NOW, updated_at: DEMO_NOW,
    },
  )

  pushRows(db, 'pessoa_contato',
    {
      id: 'mock-contato-viaforte-fernanda', pj_id: 'mock-segurado-viaforte',
      pf_id: 'mock-segurado-fernanda-contato', nome: 'Fernanda Nunes', cargo: 'Gerente financeira',
      departamento: 'Financeiro', email: 'fernanda.nunes@viaforte.example.com', telefone: '11974443322',
      celular: '11974443322', principal: true, ativo: true, observacoes: 'Contato principal para apólices e sinistros.',
    },
    {
      id: 'mock-contato-clinica-lucas', pj_id: 'mock-segurado-clinica', pf_id: 'mock-segurado-lucas',
      nome: 'Lucas Martins', cargo: 'Administrador', departamento: 'Diretoria',
      email: 'lucas.martins@example.com', telefone: '11981112233', celular: '11981112233',
      principal: true, ativo: true, observacoes: null,
    },
  )
}

function seedOpportunitiesAndCalculations(context: IntegratedDemoSeedContext) {
  const {
    db, calculationStore, tenantId, matrixBranchId, centerBranchId, userId,
    secondaryUserId, lineIds, insurerIds, opportunityStageIds,
  } = context
  const indicationId = findNamedId(db, 'origens', 'Indicação')
  const siteId = findNamedId(db, 'origens', 'Site')
  const renewalId = findNamedId(db, 'origens', 'Renovação')
  const socialId = findNamedId(db, 'origens', 'Redes Sociais')
  const priceLossId = findNamedId(db, 'motivos_perda', 'Preço')

  const opportunityDefaults = {
    tenant_id: tenantId, filial_id: matrixBranchId, segurado_id: null,
    ramo_id: null, origem_id: indicationId, apolice_origem_id: null,
    responsavel_id: userId, motivo_perda_id: null, lead_nome: null,
    lead_documento: null, lead_email: null, lead_telefone: null,
    descricao: null, prioridade: 'MEDIA', valor_premio_estimado: null,
    valor_comissao_estimada: null, comissao_estimada_pct: null,
    agenciamento_pct: null, data_abertura: '2026-07-22',
    data_fechamento_prevista: '2026-08-15', ganha_em: null, perdida_em: null,
    motivo_perda_observacao: null, campanha: null, observacoes: null,
  }

  pushRows(db, 'oportunidades',
    { ...opportunityDefaults, id: 'mock-oportunidade-joao-auto', segurado_id: 'mock-segurado-joao', ramo_id: lineIds['Automóvel'], origem_id: indicationId, stage_id: opportunityStageIds.quoting, titulo: 'Seguro Auto · João Almeida', prioridade: 'ALTA', valor_premio_estimado: 3100, valor_comissao_estimada: 620, comissao_estimada_pct: 20, data_abertura: '2026-07-18' },
    { ...opportunityDefaults, id: 'mock-oportunidade-mariana-renovacao', segurado_id: 'mock-segurado-mariana', ramo_id: lineIds.Residencial, origem_id: renewalId, apolice_origem_id: 'mock-apolice-mariana', stage_id: opportunityStageIds.negotiation, titulo: 'Renovação residencial · Mariana Costa', prioridade: 'URGENTE', valor_premio_estimado: 815, valor_comissao_estimada: 163, comissao_estimada_pct: 20, data_abertura: '2026-07-10', data_fechamento_prevista: '2026-07-22' },
    { ...opportunityDefaults, id: 'mock-oportunidade-padaria-empresarial', segurado_id: 'mock-segurado-padaria', ramo_id: lineIds.Empresarial, origem_id: siteId, stage_id: opportunityStageIds.quoting, titulo: 'Seguro empresarial · Padaria Pão Dourado', valor_premio_estimado: 5400, valor_comissao_estimada: 972, comissao_estimada_pct: 18, data_abertura: '2026-07-16' },
    { ...opportunityDefaults, id: 'mock-oportunidade-condominio', segurado_id: 'mock-segurado-condominio', ramo_id: lineIds.Condomínio, origem_id: indicationId, stage_id: opportunityStageIds.quoting, titulo: 'Condomínio · Jardim das Águas', valor_premio_estimado: 3900, valor_comissao_estimada: 780, comissao_estimada_pct: 20, data_abertura: '2026-07-14' },
    { ...opportunityDefaults, id: 'mock-oportunidade-camila-vida', segurado_id: 'mock-segurado-camila', ramo_id: lineIds['Vida Individual'], origem_id: socialId, stage_id: opportunityStageIds.negotiation, titulo: 'Vida individual · Camila Ferreira', valor_premio_estimado: 1380, valor_comissao_estimada: 345, comissao_estimada_pct: 25, data_abertura: '2026-07-12' },
    { ...opportunityDefaults, id: 'mock-oportunidade-aurora-saude', segurado_id: 'mock-segurado-aurora', ramo_id: lineIds['Saúde Empresarial'], origem_id: renewalId, apolice_origem_id: 'mock-apolice-aurora', stage_id: opportunityStageIds.negotiation, titulo: 'Renovação Saúde · Aurora Tecnologia', valor_premio_estimado: 94800, valor_comissao_estimada: 1896, comissao_estimada_pct: 2, agenciamento_pct: 300, data_abertura: '2026-07-05' },
    { ...opportunityDefaults, id: 'mock-oportunidade-viaforte-frota', segurado_id: 'mock-segurado-viaforte', ramo_id: lineIds.Frota, origem_id: renewalId, apolice_origem_id: 'mock-apolice-viaforte', stage_id: opportunityStageIds.quoting, titulo: 'Renovação da frota · Viaforte', prioridade: 'ALTA', valor_premio_estimado: 2240, valor_comissao_estimada: 448, comissao_estimada_pct: 20, data_abertura: '2026-07-20' },
    { ...opportunityDefaults, id: 'mock-oportunidade-lead-auto', ramo_id: lineIds['Automóvel'], origem_id: socialId, stage_id: opportunityStageIds.prospecting, titulo: 'Lead Auto · Instagram', lead_nome: 'Patrícia Souza', lead_email: 'patricia.souza@example.com', lead_telefone: '11970001122', campanha: 'Auto Inverno 2026', data_abertura: '2026-07-22', data_fechamento_prevista: '2026-08-22' },
    { ...opportunityDefaults, id: 'mock-oportunidade-lumina-perdida', segurado_id: 'mock-segurado-lumina', ramo_id: lineIds.Empresarial, origem_id: siteId, stage_id: opportunityStageIds.closing, motivo_perda_id: priceLossId, titulo: 'Renovação empresarial · Lumina', valor_premio_estimado: 6100, valor_comissao_estimada: 1098, comissao_estimada_pct: 18, data_abertura: '2026-06-20', perdida_em: '2026-07-08T16:30:00.000Z', motivo_perda_observacao: 'Cliente manteve a renovação com a corretora concorrente.', data_fechamento_prevista: '2026-07-08' },
    { ...opportunityDefaults, id: 'mock-oportunidade-lucas-renovada', filial_id: centerBranchId, segurado_id: 'mock-segurado-lucas', ramo_id: lineIds['Automóvel'], origem_id: renewalId, apolice_origem_id: 'mock-apolice-lucas-anterior', responsavel_id: secondaryUserId, stage_id: opportunityStageIds.closing, titulo: 'Renovação Auto · Lucas Martins', valor_premio_estimado: 2840, valor_comissao_estimada: 568, comissao_estimada_pct: 20, data_abertura: '2026-04-10', ganha_em: '2026-04-27T14:00:00.000Z', data_fechamento_prevista: '2026-05-01' },
    { ...opportunityDefaults, id: 'mock-oportunidade-beatriz-recusada', filial_id: centerBranchId, segurado_id: 'mock-segurado-beatriz', ramo_id: lineIds['Automóvel'], origem_id: siteId, responsavel_id: secondaryUserId, stage_id: opportunityStageIds.closing, titulo: 'Seguro Auto · Beatriz Rocha', valor_premio_estimado: 4200, valor_comissao_estimada: 840, comissao_estimada_pct: 20, data_abertura: '2026-06-18', perdida_em: '2026-07-02T11:00:00.000Z', motivo_perda_id: priceLossId, motivo_perda_observacao: 'Risco recusado pela seguradora após análise.', data_fechamento_prevista: '2026-07-02' },
  )

  const newEnd = (start: string) => addCalendarYear(start) as string
  const autoCoverages = coverageIdsForLine(db, lineIds['Automóvel'], 3)
  const fleetCoverages = coverageIdsForLine(db, lineIds.Frota, 2)
  const residenceCoverages = coverageIdsForLine(db, lineIds.Residencial, 2)
  const condominiumCoverages = coverageIdsForLine(db, lineIds.Condomínio, 2)
  const lifeCoverages = coverageIdsForLine(db, lineIds['Vida Individual'], 2)
  const companyCoverages = coverageIdsForLine(db, lineIds.Empresarial, 2)
  const healthCoverages = coverageIdsForLine(db, lineIds['Saúde Empresarial'], 2)

  seedCalculation(calculationStore, 'mock-calculo-joao-auto-basico', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-joao-auto', ramo_id: lineIds['Automóvel'],
    segurado_id: 'mock-segurado-joao', tipo_seguro: 'NOVO', vigencia_inicio: '2026-07-22',
    vigencia_fim: newEnd('2026-07-22'),
    specialization: autoSpecialization({ codigo_fipe: '005340-6', marca: 'Honda', modelo: 'City', versao: 'EXL 1.5 CVT', ano_fabricacao: 2023, ano_modelo: 2024, placa: 'FVR5I05', chassi: '93HGN2840RZ100321', renavam: '01399887766', combustivel: 'Flex', cambio: 'Automático', categoria: 'Passeio', tipo_veiculo: 'Automóvel', uso: 'Particular', cep_pernoite: '01415000', possui_garagem_residencia: true, possui_garagem_trabalho: true, possui_garagem_estudo: false, km_mensal: 900, alienado: true, rastreador: true, antifurto: true, condutor_nome: 'João Almeida', condutor_cpf: '12345678909', condutor_data_nascimento: '1985-04-12', condutor_sexo: 'M', condutor_estado_civil: 'Casado', condutor_profissao: 'Administrador', condutor_reside_com_segurado: true, condutor_tempo_habilitacao: 20 }),
    coverages: autoCoverages.map((id, index) => coverageInput(id, index === 0 ? { percentual_fipe_solicitado: 100, franquia_tipo_solicitado: 'REDUZIDA' } : { limite_solicitado: index === 1 ? 150000 : 50000 })),
  })

  seedCalculation(calculationStore, 'mock-calculo-joao-auto-ampliado', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-joao-auto', ramo_id: lineIds['Automóvel'],
    segurado_id: 'mock-segurado-joao', tipo_seguro: 'NOVO', vigencia_inicio: '2026-07-22',
    vigencia_fim: newEnd('2026-07-22'), comissao_sugerida_pct: 22,
    specialization: autoSpecialization({ codigo_fipe: '005340-6', marca: 'Honda', modelo: 'City', versao: 'EXL 1.5 CVT', ano_fabricacao: 2023, ano_modelo: 2024, placa: 'FVR5I05', combustivel: 'Flex', cambio: 'Automático', tipo_veiculo: 'Automóvel', uso: 'Particular', cep_pernoite: '01415000', possui_garagem_residencia: true, possui_garagem_trabalho: true, km_mensal: 900, alienado: true, rastreador: true, antifurto: true, condutor_nome: 'João Almeida', condutor_cpf: '12345678909', condutor_data_nascimento: '1985-04-12', condutor_sexo: 'M', condutor_estado_civil: 'Casado', condutor_profissao: 'Administrador', condutor_reside_com_segurado: true, condutor_tempo_habilitacao: 20 }),
    coverages: autoCoverages.map((id, index) => coverageInput(id, index === 0 ? { percentual_fipe_solicitado: 110, franquia_tipo_solicitado: 'NORMAL' } : { limite_solicitado: index === 1 ? 300000 : 100000 })),
  })

  seedCalculation(calculationStore, 'mock-calculo-mariana-residencial-renovacao', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-mariana-renovacao', ramo_id: lineIds.Residencial,
    segurado_id: 'mock-segurado-mariana', seguradora_anterior_id: insurerIds['Tokio Marine'],
    tipo_seguro: 'RENOVACAO_PROPRIA', bonus: 0, qtd_sinistros: 0,
    vigencia_inicio: '2026-07-22', vigencia_fim: newEnd('2026-07-22'),
    vigencia_fim_anterior: '2026-07-22', numero_apolice_anterior: 'RES-2025-071922',
    status_apolice_anterior: 'VIGENTE',
    specialization: residenceSpecialization({ cep: '05010000', endereco: 'Rua Clélia', numero: '820', complemento: 'Apto 54', bairro: 'Água Branca', cidade: 'São Paulo', uf: 'SP', tipo_imovel: 'Apartamento', tipo_ocupacao: 'Habitual', tipo_construcao: 'Alvenaria', area_m2: 84, valor_imovel: 580000, proprietario: true, condominio_fechado: true, possui_alarme: true, possui_monitoramento: true, possui_portao_eletronico: true }),
    coverages: residenceCoverages.map((id, index) => coverageInput(id, { limite_solicitado: index === 0 ? 580000 : 30000, franquia_tipo_solicitado: 'NORMAL' })),
  })

  seedCalculation(calculationStore, 'mock-calculo-padaria-empresarial', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-padaria-empresarial', ramo_id: lineIds.Empresarial,
    segurado_id: 'mock-segurado-padaria', tipo_seguro: 'NOVO', comissao_sugerida_pct: 18,
    vigencia_inicio: '2026-08-01', vigencia_fim: newEnd('2026-08-01'),
    specialization: companySpecialization({ cnpj: '34567890000130', razao_social: 'Padaria Pão Dourado Ltda', atividade: 'Panificação e confeitaria', cnae: '1091102', faturamento_anual: 1800000, cep: '06016020', endereco: 'Rua Antônio Agú', numero: '570', bairro: 'Centro', cidade: 'Osasco', uf: 'SP', tipo_construcao: 'Alvenaria', area_m2: 310, qtd_funcionarios: 18, possui_extintores: true, possui_alarme: true, possui_sprinklers: false, possui_inflamaveis: true, valor_estoque: 95000, valor_equipamentos: 420000 }),
    coverages: companyCoverages.map((id, index) => coverageInput(id, { limite_solicitado: index === 0 ? 900000 : 180000 })),
  })

  seedCalculation(calculationStore, 'mock-calculo-condominio-patrimonial', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-condominio', ramo_id: lineIds.Condomínio,
    segurado_id: 'mock-segurado-condominio', tipo_seguro: 'NOVO', vigencia_inicio: '2026-08-05',
    vigencia_fim: newEnd('2026-08-05'),
    specialization: condominiumSpecialization({ nome_condominio: 'Condomínio Jardim das Águas', cep: '13214101', endereco: 'Avenida Nove de Julho', numero: '2700', bairro: 'Anhangabaú', cidade: 'Jundiaí', uf: 'SP', tipo_condominio: 'Residencial vertical', area_total_m2: 12800, qtd_blocos: 4, qtd_pavimentos: 12, qtd_unidades: 192, qtd_elevadores: 8, possui_portaria_24h: true, possui_sprinklers: true, possui_extintores: true, possui_para_raios: true, possui_garagem: true }),
    coverages: condominiumCoverages.map((id, index) => coverageInput(id, { limite_solicitado: index === 0 ? 18500000 : 250000 })),
  })

  seedCalculation(calculationStore, 'mock-calculo-camila-vida', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-camila-vida', ramo_id: lineIds['Vida Individual'],
    segurado_id: 'mock-segurado-camila', tipo_seguro: 'NOVO', comissao_sugerida_pct: 25,
    vigencia_inicio: '2026-08-10', vigencia_fim: newEnd('2026-08-10'),
    specialization: lifeSpecialization({ sexo: 'F', data_nascimento: '1990-06-18', altura_cm: 168, peso_kg: 64, renda_mensal: 14500, profissao: 'Arquiteta', capital_desejado: 500000, beneficiarios_texto: 'Cônjuge e filha, conforme proposta.' }),
    coverages: lifeCoverages.map((id, index) => coverageInput(id, { limite_solicitado: index === 0 ? 500000 : 250000 })),
  })

  seedCalculation(calculationStore, 'mock-calculo-aurora-saude', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-aurora-saude', ramo_id: lineIds['Saúde Empresarial'],
    segurado_id: 'mock-segurado-aurora', seguradora_anterior_id: insurerIds['SulAmérica'],
    tipo_seguro: 'RENOVACAO_PROPRIA', comissao_sugerida_pct: 2,
    vigencia_inicio: '2026-12-31', vigencia_fim: newEnd('2026-12-31'),
    vigencia_fim_anterior: '2026-12-31', numero_apolice_anterior: 'SAU-2026-00881',
    status_apolice_anterior: 'VIGENTE',
    specialization: diverseSpecialization({ categoria: 'Saúde empresarial', descricao_risco: 'Plano coletivo para 24 colaboradores ativos e dependentes elegíveis.', valor_declarado: 94800, observacoes: 'Execução manual por seguradora no futuro 6.5A.' }),
    coverages: healthCoverages.map((id, index) => coverageInput(id, { quantidade_solicitada: 24, opcao_solicitada: index === 0 ? 'NACIONAL' : 'ENFERMARIA' })),
  })

  seedCalculation(calculationStore, 'mock-calculo-viaforte-frota-renovacao', {
    ...BASE_CALCULATION, oportunidade_id: 'mock-oportunidade-viaforte-frota', ramo_id: lineIds.Frota,
    segurado_id: 'mock-segurado-viaforte', seguradora_anterior_id: insurerIds['Porto Seguro'],
    tipo_seguro: 'RENOVACAO_PROPRIA', bonus: 6, qtd_sinistros: 1,
    vigencia_inicio: '2027-06-19', vigencia_fim: newEnd('2027-06-19'),
    vigencia_fim_anterior: '2027-06-19', numero_apolice_anterior: '531820260444005',
    status_apolice_anterior: 'VIGENTE',
    specialization: autoSpecialization({ codigo_fipe: '005482-8', marca: 'Volkswagen', modelo: 'Delivery', versao: '11.180', ano_fabricacao: 2022, ano_modelo: 2023, placa: 'BRA2E19', chassi: '953658264PR000202', renavam: '01357924680', combustivel: 'Diesel', cambio: 'Manual', categoria: 'Caminhão', tipo_veiculo: 'Caminhão', uso: 'Carga', cep_pernoite: '03064000', possui_garagem_residencia: false, possui_garagem_trabalho: true, km_mensal: 4800, rastreador: true, antifurto: true, condutor_nome: 'Equipe de motoristas cadastrada', condutor_reside_com_segurado: false }),
    coverages: fleetCoverages.map((id, index) => coverageInput(id, index === 0 ? { percentual_fipe_solicitado: 100, franquia_tipo_solicitado: 'NORMAL' } : { limite_solicitado: 300000 })),
  })
}

function seedContractPortfolio(context: IntegratedDemoSeedContext) {
  const { db, internalProducerId, externalProducerId, lineIds, insurerIds, proposalStageIds, userId, secondaryUserId } = context
  pushRows(db, 'apolices',
    { id: 'mock-apolice-lucas-anterior', segurado_id: 'mock-segurado-lucas', seguradora_id: insurerIds['Porto Seguro'], ramo_id: lineIds['Automóvel'], status: 'RENOVADA', renovada_de_id: null, produtor_id: externalProducerId, numero_apolice: 'AUTO-2025-050118', vigencia_inicio: '2025-05-01', vigencia_fim: '2026-05-01', data_emissao: '2025-04-27', premio_total: 2610.4, premio_liquido: 2385.2, observacoes: 'Contrato predecessor preservado na cadeia de renovação.' },
    { id: 'mock-apolice-lucas-atual', segurado_id: 'mock-segurado-lucas', seguradora_id: insurerIds['Porto Seguro'], ramo_id: lineIds['Automóvel'], status: 'VIGENTE', renovada_de_id: 'mock-apolice-lucas-anterior', produtor_id: externalProducerId, numero_apolice: 'AUTO-2026-050204', vigencia_inicio: '2026-05-01', vigencia_fim: '2027-05-01', data_emissao: '2026-04-27', premio_total: 2840.9, premio_liquido: 2598.1, observacoes: 'Renovação concluída pela filial Centro.' },
    { id: 'mock-apolice-lumina-cancelada', segurado_id: 'mock-segurado-lumina', seguradora_id: insurerIds['Bradesco Seguros'], ramo_id: lineIds.Empresarial, status: 'CANCELADA', renovada_de_id: null, produtor_id: internalProducerId, numero_apolice: 'EMP-2026-020773', vigencia_inicio: '2026-02-01', vigencia_fim: '2027-02-01', data_emissao: '2026-01-28', premio_total: 6100, premio_liquido: 5580, motivo_status: 'Cancelamento por encerramento das atividades no local segurado.', observacoes: null },
    { id: 'mock-apolice-beatriz-recusada', segurado_id: 'mock-segurado-beatriz', seguradora_id: insurerIds.Allianz, ramo_id: lineIds['Automóvel'], status: 'RECUSADA', renovada_de_id: null, produtor_id: externalProducerId, numero_apolice: null, vigencia_inicio: '2026-07-05', vigencia_fim: '2027-07-05', premio_total: null, premio_liquido: null, motivo_status: 'Risco recusado após análise.', observacoes: null },
  )

  pushRows(db, 'propostas',
    { id: 'mock-proposta-lucas-anterior', apolice_id: 'mock-apolice-lucas-anterior', tipo: 'NOVA', cotacao_id: null, stage_id: proposalStageIds.issued, responsavel_id: secondaryUserId, recebimento_grade_id: null, numero_proposta: 'PROP-2025-50118', data_transmissao: '2025-04-24', data_aceitacao: '2025-04-26', data_emissao: '2025-04-27', vigencia_inicio: '2025-05-01', vigencia_fim: '2026-05-01', premio_total: 2610.4, premio_liquido: 2385.2, forma_pagamento: 'CARTAO', qtd_parcelas: 6, comissao_pct: 20, agenciamento_pct: null, observacoes: null },
    { id: 'mock-proposta-lucas-atual', apolice_id: 'mock-apolice-lucas-atual', tipo: 'RENOVACAO', cotacao_id: null, stage_id: proposalStageIds.issued, responsavel_id: secondaryUserId, recebimento_grade_id: null, numero_proposta: 'REN-2026-50204', data_transmissao: '2026-04-22', data_aceitacao: '2026-04-26', data_emissao: '2026-04-27', vigencia_inicio: '2026-05-01', vigencia_fim: '2027-05-01', premio_total: 2840.9, premio_liquido: 2598.1, forma_pagamento: 'CARTAO', qtd_parcelas: 6, comissao_pct: 20, agenciamento_pct: null, observacoes: null },
    { id: 'mock-proposta-lumina-original', apolice_id: 'mock-apolice-lumina-cancelada', tipo: 'NOVA', cotacao_id: null, stage_id: proposalStageIds.issued, responsavel_id: userId, recebimento_grade_id: null, numero_proposta: 'EMP-2026-20773', data_transmissao: '2026-01-20', data_aceitacao: '2026-01-27', data_emissao: '2026-01-28', vigencia_inicio: '2026-02-01', vigencia_fim: '2027-02-01', premio_total: 6100, premio_liquido: 5580, forma_pagamento: 'BOLETO', qtd_parcelas: 10, comissao_pct: 18, agenciamento_pct: null, observacoes: null },
    { id: 'mock-proposta-lumina-cancelamento', apolice_id: 'mock-apolice-lumina-cancelada', tipo: 'CANCELAMENTO', cotacao_id: null, stage_id: proposalStageIds.issued, responsavel_id: userId, recebimento_grade_id: null, cancelamento_motivo_id: 'mock-cancelamento-solicitacao-segurado', numero_proposta: 'CAN-2026-20773', data_emissao: '2026-06-30', vigencia_inicio: '2026-07-01', premio_total: -3050, premio_liquido: -2790, qtd_parcelas: 1, comissao_pct: 18, agenciamento_pct: null, observacoes: 'Cancelamento solicitado pelo segurado.' },
    { id: 'mock-proposta-beatriz-recusada', apolice_id: 'mock-apolice-beatriz-recusada', tipo: 'NOVA', cotacao_id: null, stage_id: proposalStageIds.refused, responsavel_id: secondaryUserId, recebimento_grade_id: null, numero_proposta: 'AUTO-2026-77401', data_transmissao: '2026-06-28', data_recusa: '2026-07-02', motivo_recusa: 'Perfil de risco fora da política de aceitação.', vigencia_inicio: '2026-07-05', vigencia_fim: '2027-07-05', premio_total: null, premio_liquido: null, comissao_pct: 20, agenciamento_pct: null, observacoes: null },
  )

  pushRows(db, 'apolice_itens',
    { id: 'mock-item-joao-auto', apolice_id: 'mock-apolice-joao', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-joao', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Honda City EXL 1.5 CVT', identificador_externo: 'FVR5I05', valor_risco: 112500, status: 'vigente', observacoes: null },
    { id: 'mock-item-padaria-empresa', apolice_id: 'mock-apolice-padaria', risk_type: 'EMPRESA', incluido_por_proposta_id: 'mock-proposta-padaria', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Estabelecimento comercial e conteúdo', identificador_externo: '34567890000130', valor_risco: 900000, status: 'vigente', observacoes: null },
    { id: 'mock-item-mariana-original', apolice_id: 'mock-apolice-mariana', risk_type: 'IMOVEL', incluido_por_proposta_id: 'mock-proposta-mariana-original', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Apartamento residencial', identificador_externo: '05010-000-820', valor_risco: 540000, status: 'vigente', observacoes: null },
    { id: 'mock-item-mariana-renovacao', apolice_id: 'mock-apolice-mariana-renovacao', risk_type: 'IMOVEL', incluido_por_proposta_id: 'mock-proposta-mariana-renovacao', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Apartamento residencial', identificador_externo: '05010-000-820', valor_risco: 580000, status: 'vigente', observacoes: null },
    { id: 'mock-item-oficina-empresa', apolice_id: 'mock-apolice-oficina-horizonte', risk_type: 'EMPRESA', incluido_por_proposta_id: 'mock-proposta-oficina-horizonte', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Oficina, equipamentos e estoque', identificador_externo: '56789012000150', valor_risco: 1250000, status: 'vigente', observacoes: null },
    { id: 'mock-item-rafael-auto', apolice_id: 'mock-apolice-rafael', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-rafael', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Toyota Corolla XEi 2.0', identificador_externo: 'RFM3D21', valor_risco: 132800, status: 'vigente', observacoes: null },
    { id: 'mock-item-condominio-imovel', apolice_id: 'mock-apolice-condominio', risk_type: 'IMOVEL', incluido_por_proposta_id: 'mock-proposta-condominio', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Áreas comuns e estrutura do condomínio', identificador_externo: '13214-101-2700', valor_risco: 18500000, status: 'vigente', observacoes: null },
    { id: 'mock-item-lucas-anterior', apolice_id: 'mock-apolice-lucas-anterior', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-lucas-anterior', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Jeep Renegade Longitude', identificador_externo: 'GHT8A19', valor_risco: 104500, status: 'vigente', observacoes: null },
    { id: 'mock-item-lucas-atual', apolice_id: 'mock-apolice-lucas-atual', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-lucas-atual', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Jeep Renegade Longitude', identificador_externo: 'GHT8A19', valor_risco: 109900, status: 'vigente', observacoes: null },
    { id: 'mock-item-lumina-empresa', apolice_id: 'mock-apolice-lumina-cancelada', risk_type: 'EMPRESA', incluido_por_proposta_id: 'mock-proposta-lumina-original', excluido_por_proposta_id: 'mock-proposta-lumina-cancelamento', numero_item: 1, descricao: 'Loja, estoque e equipamentos', identificador_externo: '45678901000140', valor_risco: 980000, status: 'historico', observacoes: null },
    { id: 'mock-item-beatriz-auto', apolice_id: 'mock-apolice-beatriz-recusada', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-beatriz-recusada', excluido_por_proposta_id: null, numero_item: 1, descricao: 'BMW 320i Sport', identificador_externo: 'BTR2R02', valor_risco: 286000, status: 'vigente', observacoes: 'Item preservado na casca recusada.' },
  )

  pushRows(db, 'item_veiculo',
    { apolice_item_id: 'mock-item-joao-auto', codigo_fipe: '005340-6', marca: 'Honda', modelo: 'City', versao: 'EXL 1.5 CVT', ano_fabricacao: 2023, ano_modelo: 2024, placa: 'FVR5I05', chassi: '93HGN2840RZ100321', renavam: '01399887766', combustivel: 'Flex', cambio: 'Automático', categoria: 'Passeio', uso: 'Particular', cep_pernoite: '01415000', classe_bonus: 0, blindado: false, alienado: true, rastreador: true, antifurto: true, kit_gas: false, condutor_principal_nome: 'João Almeida', condutor_principal_cpf: '12345678909', condutor_principal_data_nascimento: '1985-04-12' },
    { apolice_item_id: 'mock-item-rafael-auto', codigo_fipe: '002111-3', marca: 'Toyota', modelo: 'Corolla', versao: 'XEi 2.0', ano_fabricacao: 2022, ano_modelo: 2023, placa: 'RFM3D21', chassi: '9BRB33BE0P2000456', renavam: '01344112233', combustivel: 'Flex', cambio: 'Automático', categoria: 'Passeio', uso: 'Particular', cep_pernoite: '13025000', classe_bonus: 5, blindado: false, alienado: false, rastreador: true, antifurto: true, kit_gas: false, condutor_principal_nome: 'Rafael Mendes', condutor_principal_cpf: '45678901234', condutor_principal_data_nascimento: '1987-09-21' },
    { apolice_item_id: 'mock-item-lucas-anterior', codigo_fipe: '017044-4', marca: 'Jeep', modelo: 'Renegade', versao: 'Longitude', ano_fabricacao: 2021, ano_modelo: 2022, placa: 'GHT8A19', chassi: '98861110ZNK300178', renavam: '01288445566', combustivel: 'Flex', cambio: 'Automático', categoria: 'SUV', uso: 'Particular', cep_pernoite: '01001000', classe_bonus: 4, blindado: false, alienado: false, rastreador: true, antifurto: true, kit_gas: false, condutor_principal_nome: 'Lucas Martins', condutor_principal_cpf: '16899535009', condutor_principal_data_nascimento: '1988-02-29' },
    { apolice_item_id: 'mock-item-lucas-atual', codigo_fipe: '017044-4', marca: 'Jeep', modelo: 'Renegade', versao: 'Longitude', ano_fabricacao: 2021, ano_modelo: 2022, placa: 'GHT8A19', chassi: '98861110ZNK300178', renavam: '01288445566', combustivel: 'Flex', cambio: 'Automático', categoria: 'SUV', uso: 'Particular', cep_pernoite: '01001000', classe_bonus: 5, blindado: false, alienado: false, rastreador: true, antifurto: true, kit_gas: false, condutor_principal_nome: 'Lucas Martins', condutor_principal_cpf: '16899535009', condutor_principal_data_nascimento: '1988-02-29' },
    { apolice_item_id: 'mock-item-beatriz-auto', codigo_fipe: '009297-5', marca: 'BMW', modelo: '320i', versao: 'Sport GP', ano_fabricacao: 2023, ano_modelo: 2024, placa: 'BTR2R02', chassi: 'WBA5R1100RFM00192', renavam: '01455001122', combustivel: 'Gasolina', cambio: 'Automático', categoria: 'Passeio', uso: 'Particular', cep_pernoite: '01503000', classe_bonus: 0, blindado: false, alienado: true, rastreador: false, antifurto: true, kit_gas: false, condutor_principal_nome: 'Beatriz Rocha', condutor_principal_cpf: '39053344705', condutor_principal_data_nascimento: '1995-11-03' },
  )

  pushRows(db, 'item_imovel',
    { apolice_item_id: 'mock-item-mariana-original', cep: '05010000', endereco: 'Rua Clélia', numero: '820', complemento: 'Apto 54', bairro: 'Água Branca', cidade: 'São Paulo', uf: 'SP', tipo_imovel: 'Apartamento', tipo_ocupacao: 'Habitual', tipo_construcao: 'Alvenaria', area_m2: 84, valor_imovel: 540000, condominio_fechado: true, desocupado: false },
    { apolice_item_id: 'mock-item-mariana-renovacao', cep: '05010000', endereco: 'Rua Clélia', numero: '820', complemento: 'Apto 54', bairro: 'Água Branca', cidade: 'São Paulo', uf: 'SP', tipo_imovel: 'Apartamento', tipo_ocupacao: 'Habitual', tipo_construcao: 'Alvenaria', area_m2: 84, valor_imovel: 580000, condominio_fechado: true, desocupado: false },
    { apolice_item_id: 'mock-item-condominio-imovel', cep: '13214101', endereco: 'Avenida Nove de Julho', numero: '2700', complemento: null, bairro: 'Anhangabaú', cidade: 'Jundiaí', uf: 'SP', tipo_imovel: 'Condomínio residencial', tipo_ocupacao: 'Coletiva', tipo_construcao: 'Alvenaria', area_m2: 12800, valor_imovel: 18500000, condominio_fechado: true, desocupado: false },
  )

  pushRows(db, 'item_empresa',
    { apolice_item_id: 'mock-item-padaria-empresa', cnpj_risco: '34567890000130', razao_social_risco: 'Padaria Pão Dourado Ltda', atividade: 'Panificação e confeitaria', cnae: '1091102', faturamento_anual: 1800000, cep: '06016020', endereco: 'Rua Antônio Agú', numero: '570', complemento: null, bairro: 'Centro', cidade: 'Osasco', uf: 'SP', tipo_construcao: 'Alvenaria', area_m2: 310, qtd_funcionarios: 18, valor_estoque: 95000, valor_equipamentos: 420000, protecao_incendio: 'Extintores revisados e brigada treinada' },
    { apolice_item_id: 'mock-item-oficina-empresa', cnpj_risco: '56789012000150', razao_social_risco: 'Oficina Horizonte Ltda', atividade: 'Manutenção automotiva', cnae: '4520001', faturamento_anual: 2400000, cep: '07023000', endereco: 'Avenida Guarulhos', numero: '1520', complemento: null, bairro: 'Vila Augusta', cidade: 'Guarulhos', uf: 'SP', tipo_construcao: 'Mista', area_m2: 680, qtd_funcionarios: 26, valor_estoque: 210000, valor_equipamentos: 520000, protecao_incendio: 'Extintores, hidrantes e alarme' },
    { apolice_item_id: 'mock-item-lumina-empresa', cnpj_risco: '45678901000140', razao_social_risco: 'Lumina Comércio Ltda', atividade: 'Comércio de luminárias', cnae: '4754701', faturamento_anual: 3200000, cep: '11013020', endereco: 'Rua João Pessoa', numero: '425', complemento: null, bairro: 'Paquetá', cidade: 'Santos', uf: 'SP', tipo_construcao: 'Alvenaria', area_m2: 440, qtd_funcionarios: 22, valor_estoque: 380000, valor_equipamentos: 180000, protecao_incendio: 'Extintores e alarme monitorado' },
  )

  const addItemCoverage = (id: string, itemId: string, lineId: string, includedBy: string, capital: number, premium: number, excludedBy: string | null = null) => {
    const coverageId = coverageIdsForLine(db, lineId, 1)[0] ?? null
    pushRows(db, 'item_coberturas', {
      id, apolice_item_id: itemId, cobertura_id: coverageId,
      incluido_por_proposta_id: includedBy, excluido_por_proposta_id: excludedBy,
      capital_lmi: capital, franquia_valor: null, franquia_tipo: 'NORMAL',
      premio: premium, premio_liquido: premium, carencia_dias: 0,
      participacao_obrigatoria_pct: null, vigencia_inicio: null, vigencia_fim: null,
      observacoes: null,
    })
  }
  addItemCoverage('mock-cobertura-joao-casco', 'mock-item-joao-auto', lineIds['Automóvel'], 'mock-proposta-joao', 112500, 1850)
  addItemCoverage('mock-cobertura-padaria-incendio', 'mock-item-padaria-empresa', lineIds.Empresarial, 'mock-proposta-padaria', 900000, 3120)
  addItemCoverage('mock-cobertura-mariana-original', 'mock-item-mariana-original', lineIds.Residencial, 'mock-proposta-mariana-original', 540000, 520)
  addItemCoverage('mock-cobertura-mariana-renovacao', 'mock-item-mariana-renovacao', lineIds.Residencial, 'mock-proposta-mariana-renovacao', 580000, 575)
  addItemCoverage('mock-cobertura-oficina-incendio', 'mock-item-oficina-empresa', lineIds.Empresarial, 'mock-proposta-oficina-horizonte', 1250000, 2780)
  addItemCoverage('mock-cobertura-rafael-casco', 'mock-item-rafael-auto', lineIds['Automóvel'], 'mock-proposta-rafael', 132800, 2190)
  addItemCoverage('mock-cobertura-condominio-incendio', 'mock-item-condominio-imovel', lineIds.Residencial, 'mock-proposta-condominio', 18500000, 1620)
  addItemCoverage('mock-cobertura-lucas-anterior', 'mock-item-lucas-anterior', lineIds['Automóvel'], 'mock-proposta-lucas-anterior', 104500, 1720)
  addItemCoverage('mock-cobertura-lucas-atual', 'mock-item-lucas-atual', lineIds['Automóvel'], 'mock-proposta-lucas-atual', 109900, 1880)
  addItemCoverage('mock-cobertura-lumina-incendio', 'mock-item-lumina-empresa', lineIds.Empresarial, 'mock-proposta-lumina-original', 980000, 3460, 'mock-proposta-lumina-cancelamento')
  addItemCoverage('mock-cobertura-beatriz-casco', 'mock-item-beatriz-auto', lineIds['Automóvel'], 'mock-proposta-beatriz-recusada', 286000, 0)
}

function seedClaims(context: IntegratedDemoSeedContext) {
  const { db, userId, secondaryUserId, tenantId, matrixBranchId, centerBranchId } = context
  const claimPipeline = db.pipelines.find((row) => row.entidade_tipo === 'sinistro')
  const claimStages = db.pipeline_stages
    .filter((row) => row.pipeline_id === claimPipeline?.id)
    .sort((left, right) => Number(left.ordem ?? 0) - Number(right.ordem ?? 0))
  const noticeStageId = String(claimStages[0]?.id ?? '')
  const analysisStageId = String(claimStages[1]?.id ?? claimStages[0]?.id ?? '')
  const completedStageId = String(claimStages[2]?.id ?? claimStages[1]?.id ?? claimStages[0]?.id ?? '')

  pushRows(db, 'sinistros',
    { id: 'mock-sinistro-rafael-concluido', apolice_id: 'mock-apolice-rafael', stage_id: completedStageId, responsavel_id: userId, numero_sinistro: '531-2026-003440', numero_aviso: 'AVI-2026-00031', protocolo_seguradora: 'PORTO-2026-774219', cobertura_codigo: 'casco', cobertura_nome: 'Casco', data_ocorrencia: '2026-05-14', data_aviso: '2026-05-14', data_registro_aviso: '2026-05-15', data_documentacao_completa: '2026-05-20', data_liquidacao_financeira: '2026-06-04', data_conclusao: '2026-06-05', tipo_sinistro: 'administrativo', causa: 'Colisão lateral', descricao: 'Colisão sem vítima durante mudança de faixa.', local_ocorrencia: 'Rodovia Anhanguera, Campinas/SP', status: 'encerrado_com_indenizacao', valor_estimado: 14600, valor_indenizado: 13980, valor_pendente: 0, valor_despesas_regulacao: 480, valor_salvado: 0, data_salvado: null, valor_ressarcimento: 0, data_ressarcimento: null, negativa_motivo: null, regulador_nome: 'Ana Paula Freire', oficina_nome: 'Toyota Campinas', observacoes: 'Reparo concluído e indenização liquidada.' },
    { id: 'mock-sinistro-camila-negado', apolice_id: 'mock-apolice-camila', stage_id: completedStageId, responsavel_id: secondaryUserId, numero_sinistro: 'RES-2026-001922', numero_aviso: 'AVI-RES-2026-118', protocolo_seguradora: 'TOKIO-2026-55482', cobertura_codigo: 'danos-eletricos', cobertura_nome: 'Danos Elétricos', data_ocorrencia: '2026-07-02', data_aviso: '2026-07-03', data_registro_aviso: '2026-07-03', data_documentacao_completa: '2026-07-08', data_liquidacao_financeira: null, data_conclusao: '2026-07-14', tipo_sinistro: 'administrativo', causa: 'Oscilação de energia', descricao: 'Danos informados em eletrodomésticos após oscilação de energia.', local_ocorrencia: 'Avenida Paulista, São Paulo/SP', status: 'encerrado_sem_indenizacao', valor_estimado: 6800, valor_indenizado: 0, valor_pendente: 0, valor_despesas_regulacao: 250, valor_salvado: null, data_salvado: null, valor_ressarcimento: null, data_ressarcimento: null, negativa_motivo: 'Laudo técnico não caracterizou dano elétrico coberto.', regulador_nome: 'Carlos Prado', oficina_nome: null, observacoes: 'Negativa comunicada ao segurado com orientação de recurso.' },
    { id: 'mock-sinistro-aurora-reaberto', apolice_id: 'mock-apolice-aurora', stage_id: analysisStageId, responsavel_id: secondaryUserId, numero_sinistro: 'VIDA-2026-000773', numero_aviso: 'AVI-VIDA-2026-77', protocolo_seguradora: 'SULA-VIDA-77821', cobertura_codigo: 'internacoes', cobertura_nome: 'Internações hospitalares', data_ocorrencia: '2026-06-10', data_aviso: '2026-06-11', data_registro_aviso: '2026-06-11', data_documentacao_completa: '2026-06-18', data_liquidacao_financeira: null, data_conclusao: null, tipo_sinistro: 'administrativo', causa: 'Internação emergencial', descricao: 'Processo reaberto após envio de documentação complementar.', local_ocorrencia: 'Campinas/SP', status: 'reaberto', valor_estimado: 22000, valor_indenizado: 8000, valor_pendente: 14000, valor_despesas_regulacao: 0, valor_salvado: null, data_salvado: null, valor_ressarcimento: null, data_ressarcimento: null, negativa_motivo: null, regulador_nome: 'Equipe Saúde SulAmérica', oficina_nome: null, observacoes: 'Funcionário descrito como envolvido do item-grupo.' },
    { id: 'mock-sinistro-oficina-aberto', apolice_id: 'mock-apolice-oficina-horizonte', stage_id: noticeStageId, responsavel_id: userId, numero_sinistro: 'EMP-2026-004712', numero_aviso: 'AVI-EMP-2026-221', protocolo_seguradora: 'BRAD-EMP-66210', cobertura_codigo: 'incendio', cobertura_nome: 'Incêndio', data_ocorrencia: '2026-07-20', data_aviso: '2026-07-20', data_registro_aviso: '2026-07-21', data_documentacao_completa: null, data_liquidacao_financeira: null, data_conclusao: null, tipo_sinistro: 'administrativo', causa: 'Princípio de incêndio em equipamento', descricao: 'Curto em elevador automotivo controlado pela equipe local.', local_ocorrencia: 'Guarulhos/SP', status: 'aberto', valor_estimado: 78000, valor_indenizado: null, valor_pendente: 78000, valor_despesas_regulacao: null, valor_salvado: 12000, data_salvado: null, valor_ressarcimento: null, data_ressarcimento: null, negativa_motivo: null, regulador_nome: 'A definir', oficina_nome: null, observacoes: 'Aguardando vistoria e relação dos equipamentos danificados.' },
  )

  pushRows(db, 'sinistro_envolvidos',
    { id: 'mock-envolvido-rafael', sinistro_id: 'mock-sinistro-rafael-concluido', apolice_item_id: 'mock-item-rafael-auto', tipo: 'SEGURADO', nome: 'Rafael Mendes', cpf_cnpj: '45678901234', email: 'rafael.mendes@example.com', telefone: '19992345678', placa: 'RFM3D21', seguradora_terceiro: null, apolice_terceiro: null, tipo_dano: 'Danos materiais no veículo segurado', valor_reclamado: 14600, valor_indenizado: 13980, responsavel_pelo_evento: false, observacoes: null },
    { id: 'mock-envolvido-rafael-terceiro', sinistro_id: 'mock-sinistro-rafael-concluido', apolice_item_id: null, tipo: 'TERCEIRO', nome: 'Marcelo Pires', cpf_cnpj: '70632193005', email: 'marcelo.pires@example.com', telefone: '11994448822', placa: 'EJK4H02', seguradora_terceiro: 'HDI', apolice_terceiro: 'HDI-5511002', tipo_dano: 'Danos leves na lateral', valor_reclamado: 2900, valor_indenizado: 2500, responsavel_pelo_evento: true, observacoes: 'Terceiro descritivo, sem cadastro em segurados.' },
    { id: 'mock-envolvido-camila-imovel', sinistro_id: 'mock-sinistro-camila-negado', apolice_item_id: 'mock-item-camila-imovel', tipo: 'SEGURADO', nome: 'Camila Ferreira', cpf_cnpj: '23456789012', email: 'camila.ferreira@example.com', telefone: '11987654320', placa: null, seguradora_terceiro: null, apolice_terceiro: null, tipo_dano: 'Eletrodomésticos', valor_reclamado: 6800, valor_indenizado: 0, responsavel_pelo_evento: false, observacoes: null },
    { id: 'mock-envolvido-aurora-funcionario', sinistro_id: 'mock-sinistro-aurora-reaberto', apolice_item_id: 'mock-item-aurora-grupo', tipo: 'SEGURADO', nome: 'Eduardo Lima · funcionário', cpf_cnpj: '48329418030', email: 'eduardo.lima@auroratec.example.com', telefone: '19990012233', placa: null, seguradora_terceiro: null, apolice_terceiro: null, tipo_dano: 'Despesas hospitalares', valor_reclamado: 22000, valor_indenizado: 8000, responsavel_pelo_evento: false, observacoes: 'Vida do grupo global mantida fora do cadastro de segurados.' },
    { id: 'mock-envolvido-oficina-empresa', sinistro_id: 'mock-sinistro-oficina-aberto', apolice_item_id: 'mock-item-oficina-empresa', tipo: 'SEGURADO', nome: 'Oficina Horizonte Ltda', cpf_cnpj: '56789012000150', email: 'administrativo@oficinahorizonte.com.br', telefone: '1124098800', placa: null, seguradora_terceiro: null, apolice_terceiro: null, tipo_dano: 'Equipamentos e estrutura', valor_reclamado: 78000, valor_indenizado: null, responsavel_pelo_evento: false, observacoes: null },
  )

  pushRows(db, 'atividades',
    { id: 'mock-tarefa-sinistro-oficina-vistoria', tenant_id: tenantId, filial_id: matrixBranchId, responsavel_id: userId, entidade_tipo: 'sinistro', entidade_id: 'mock-sinistro-oficina-aberto', tipo: 'tarefa', titulo: 'Agendar vistoria empresarial', descricao: 'Confirmar regulador, data e acesso à oficina.', status: 'pendente', prioridade: 'alta', vencimento: '2026-07-23T13:00:00.000Z', concluida_em: null, fixada_em: null, canal: 'telefone', origem: 'mock', lembrete_em: '2026-07-23T12:00:00.000Z', recorrente: false, observacoes: null },
    { id: 'mock-nota-sinistro-rafael-liquidado', tenant_id: tenantId, filial_id: matrixBranchId, responsavel_id: userId, entidade_tipo: 'sinistro', entidade_id: 'mock-sinistro-rafael-concluido', tipo: 'nota', titulo: 'Indenização liquidada', descricao: 'Cliente confirmou o recebimento e a entrega do veículo reparado.', status: 'concluida', prioridade: 'media', vencimento: null, concluida_em: '2026-06-05T17:30:00.000Z', fixada_em: null, canal: 'whatsapp', origem: 'mock', lembrete_em: null, recorrente: false, observacoes: null },
    { id: 'mock-tarefa-sinistro-aurora-documentos', tenant_id: tenantId, filial_id: centerBranchId, responsavel_id: secondaryUserId, entidade_tipo: 'sinistro', entidade_id: 'mock-sinistro-aurora-reaberto', tipo: 'followup', titulo: 'Conferir documentos complementares', descricao: 'Validar relatório médico e demonstrativo hospitalar reenviados.', status: 'pendente', prioridade: 'alta', vencimento: '2026-07-24T14:00:00.000Z', concluida_em: null, fixada_em: null, canal: 'email', origem: 'mock', lembrete_em: null, recorrente: false, observacoes: null },
  )

  pushRows(db, 'anexos',
    { id: 'mock-anexo-laudo-rafael', tenant_id: tenantId, filial_id: matrixBranchId, entidade_tipo: 'sinistro', entidade_id: 'mock-sinistro-rafael-concluido', nome_arquivo: 'laudo-regulacao-rafael.pdf', mime_type: 'application/pdf', tamanho_bytes: 428000, url_armazenamento: null, categoria: 'laudo', descricao: 'Metadado demonstrativo do laudo final.', origem: 'mock', status: 'ativo', hash_sha256: null, anexado_em: '2026-05-22T12:00:00.000Z' },
    { id: 'mock-anexo-fotos-oficina', tenant_id: tenantId, filial_id: matrixBranchId, entidade_tipo: 'sinistro', entidade_id: 'mock-sinistro-oficina-aberto', nome_arquivo: 'fotos-iniciais-oficina.zip', mime_type: 'application/zip', tamanho_bytes: 2450000, url_armazenamento: null, categoria: 'fotos', descricao: 'Metadado demonstrativo; sem upload real.', origem: 'mock', status: 'ativo', hash_sha256: null, anexado_em: '2026-07-21T10:00:00.000Z' },
  )
}

function seedFinancialHistory(context: IntegratedDemoSeedContext) {
  const { db, tenantId, centerBranchId, userId, secondaryUserId, externalProducerId, insurerIds, lineIds } = context
  const exactValue = 519.62
  const partialExpected = 207.85
  const partialReceipt = 124.71
  const partialReversal = 41.57
  const partialReceived = partialReceipt - partialReversal

  pushRows(db, 'comissoes',
    { id: 'mock-comissao-lucas-recebida', proposta_id: 'mock-proposta-lucas-atual', parcela_id: null, numero: 1, tipo_comissao: 'NORMAL', percentual: 20, base_calculo: 2598.1, valor_previsto: exactValue, valor_recebido: exactValue, valor_diferenca: 0, status: 'RECEBIDA', prevista_em: '2026-05-10', recebida_em: '2026-05-15', competencia_inicio: '2026-05-01', competencia_fim: '2026-05-31', observacoes: 'Comissão recebida com cadeia completa de conciliação e baixa.' },
    { id: 'mock-comissao-lucas-parcial', proposta_id: 'mock-proposta-lucas-atual', parcela_id: null, numero: 2, tipo_comissao: 'ADICIONAL', percentual: 8, base_calculo: 2598.1, valor_previsto: partialExpected, valor_recebido: partialReceived, valor_diferenca: partialReceived - partialExpected, status: 'PARCIAL', prevista_em: '2026-06-10', recebida_em: '2026-06-15', competencia_inicio: '2026-06-01', competencia_fim: '2026-06-30', observacoes: 'Baixa parcial com estorno compensatório.' },
  )
  pushRows(db, 'comissao_extratos',
    { id: 'mock-extrato-lucas-recebida', tenant_id: tenantId, filial_id: centerBranchId, seguradora_id: insurerIds['Porto Seguro'], identificacao_externa: 'PORTO-LUCAS-2026-05', competencia: '2026-05-01', periodo_inicio: '2026-05-01', periodo_fim: '2026-05-31', data_emissao: '2026-05-14', data_recebimento: '2026-05-15', arquivo_nome: 'demonstrativo-porto-maio-2026.pdf', arquivo_referencia: 'mock://extratos/porto-lucas-maio-2026.pdf', origem_tipo: 'ARQUIVO', origem_formato: 'PDF', arquivo_mime_type: 'application/pdf', arquivo_hash_sha256: 'mock-sha256-lucas-maio-2026', chave_idempotencia: 'centro|porto|lucas-maio-2026', parser_identificador: 'PORTO_DEMO', parser_versao: '1.0', tentativa_processamento: 1, status_processamento: 'NORMALIZADO', status_conciliacao: 'CONCILIADO', quantidade_itens: 1, valor_bruto_total: exactValue, valor_liquido_total: exactValue, valor_descontos_total: 0, moeda: 'BRL', erro_codigo: null, erro_mensagem_segura: null, recebido_por_id: secondaryUserId, processado_por_id: secondaryUserId, recebido_em: '2026-05-15T12:00:00.000Z', processamento_iniciado_em: '2026-05-15T12:01:00.000Z', processamento_concluido_em: '2026-05-15T12:01:05.000Z', criado_em: '2026-05-15T12:00:00.000Z', atualizado_em: '2026-05-15T12:01:05.000Z', observacoes: null },
    { id: 'mock-extrato-lucas-parcial', tenant_id: tenantId, filial_id: centerBranchId, seguradora_id: insurerIds['Porto Seguro'], identificacao_externa: 'PORTO-LUCAS-2026-06', competencia: '2026-06-01', periodo_inicio: '2026-06-01', periodo_fim: '2026-06-30', data_emissao: '2026-06-14', data_recebimento: '2026-06-15', arquivo_nome: null, arquivo_referencia: null, origem_tipo: 'MANUAL', origem_formato: null, arquivo_mime_type: null, arquivo_hash_sha256: null, chave_idempotencia: 'centro|porto|lucas-junho-2026', parser_identificador: null, parser_versao: null, tentativa_processamento: 1, status_processamento: 'NORMALIZADO', status_conciliacao: 'CONCILIADO', quantidade_itens: 1, valor_bruto_total: partialReceipt, valor_liquido_total: partialReceipt, valor_descontos_total: 0, moeda: 'BRL', erro_codigo: null, erro_mensagem_segura: null, recebido_por_id: secondaryUserId, processado_por_id: secondaryUserId, recebido_em: '2026-06-15T12:00:00.000Z', processamento_iniciado_em: '2026-06-15T12:00:00.000Z', processamento_concluido_em: '2026-06-15T12:01:00.000Z', criado_em: '2026-06-15T12:00:00.000Z', atualizado_em: '2026-06-15T12:01:00.000Z', observacoes: 'Origem manual para demonstrar parcialidade e estorno.' },
  )
  pushRows(db, 'comissao_extrato_itens',
    { id: 'mock-extrato-item-lucas-recebida', extrato_id: 'mock-extrato-lucas-recebida', identificacao_externa: 'PORTO-LUCAS-001', sequencia_externa: '1', chave_idempotencia: 'mock-extrato-lucas-recebida|1', produtor_id: externalProducerId, ramo_id: lineIds['Automóvel'], produtor_beneficiario_informado: 'Marina Costa', proposta_numero_informado: 'REN-2026-50204', apolice_numero_informado: 'AUTO-2026-050204', endosso_numero_informado: null, documento_numero_informado: 'REN-2026-50204', parcela_numero_informado: '1', segurado_nome_informado: 'Lucas Martins', competencia: '2026-05-01', data_credito: '2026-05-15', data_recebimento_informada: '2026-05-15', valor_bruto_informado: exactValue, valor_liquido_informado: exactValue, valor_descontos_informado: 0, percentual_informado: 20, tipo_comissao: 'NORMAL', seguradora_lote_informado: 'LOTE-LUCAS-05', seguradora_referencia_informada: 'PORTO-LUCAS-001', descricao_original: 'Comissão renovação Auto', status_conciliacao: 'CONCILIADO', normalizado_em: '2026-05-15T12:01:00.000Z', criado_em: '2026-05-15T12:01:00.000Z', atualizado_em: '2026-05-15T12:01:05.000Z' },
    { id: 'mock-extrato-item-lucas-parcial', extrato_id: 'mock-extrato-lucas-parcial', identificacao_externa: 'MANUAL-LUCAS-002', sequencia_externa: '1', chave_idempotencia: 'mock-extrato-lucas-parcial|1', produtor_id: externalProducerId, ramo_id: lineIds['Automóvel'], produtor_beneficiario_informado: 'Marina Costa', proposta_numero_informado: 'REN-2026-50204', apolice_numero_informado: 'AUTO-2026-050204', endosso_numero_informado: null, documento_numero_informado: 'REN-2026-50204', parcela_numero_informado: '2', segurado_nome_informado: 'Lucas Martins', competencia: '2026-06-01', data_credito: '2026-06-15', data_recebimento_informada: '2026-06-15', valor_bruto_informado: partialReceipt, valor_liquido_informado: partialReceipt, valor_descontos_informado: 0, percentual_informado: 8, tipo_comissao: 'ADICIONAL', seguradora_lote_informado: 'MANUAL', seguradora_referencia_informada: 'PORTO-LUCAS-002', descricao_original: 'Recebimento adicional parcial', status_conciliacao: 'CONCILIADO', normalizado_em: '2026-06-15T12:01:00.000Z', criado_em: '2026-06-15T12:01:00.000Z', atualizado_em: '2026-06-15T12:01:00.000Z' },
  )
  pushRows(db, 'comissao_conciliacoes',
    { id: 'mock-conciliacao-lucas-recebida', item_id: 'mock-extrato-item-lucas-recebida', comissao_id: 'mock-comissao-lucas-recebida', chave_idempotencia: 'mock-extrato-item-lucas-recebida|mock-comissao-lucas-recebida', tipo_associacao: 'EXATA', status: 'CONFIRMADA', confianca_pct: 100, valor_previsto_snapshot: exactValue, valor_informado_alocado: exactValue, valor_conciliado: exactValue, valor_diferenca: 0, percentual_previsto_snapshot: 20, percentual_informado_snapshot: 20, percentual_diferenca: 0, competencia_prevista_inicio: '2026-05-01', competencia_prevista_fim: '2026-05-31', competencia_informada: '2026-05-01', motivo: null, associado_por_id: secondaryUserId, confirmado_por_id: secondaryUserId, criado_em: '2026-05-15T12:02:00.000Z', confirmado_em: '2026-05-15T12:02:00.000Z', atualizado_em: '2026-05-15T12:02:00.000Z' },
    { id: 'mock-conciliacao-lucas-parcial', item_id: 'mock-extrato-item-lucas-parcial', comissao_id: 'mock-comissao-lucas-parcial', chave_idempotencia: 'mock-extrato-item-lucas-parcial|mock-comissao-lucas-parcial', tipo_associacao: 'PARCIAL', status: 'CONFIRMADA', confianca_pct: 100, valor_previsto_snapshot: partialExpected, valor_informado_alocado: partialReceipt, valor_conciliado: partialReceipt, valor_diferenca: partialReceipt - partialExpected, percentual_previsto_snapshot: 8, percentual_informado_snapshot: 8, percentual_diferenca: 0, competencia_prevista_inicio: '2026-06-01', competencia_prevista_fim: '2026-06-30', competencia_informada: '2026-06-01', motivo: 'Recebimento parcial confirmado.', associado_por_id: secondaryUserId, confirmado_por_id: secondaryUserId, criado_em: '2026-06-15T12:02:00.000Z', confirmado_em: '2026-06-15T12:02:00.000Z', atualizado_em: '2026-06-15T12:02:00.000Z' },
  )
  pushRows(db, 'comissao_baixas',
    { id: 'mock-baixa-lucas-recebida', comissao_id: 'mock-comissao-lucas-recebida', tipo: 'BAIXA', baixa_origem_id: null, origem_tipo: 'ARQUIVO', data_efetiva: '2026-05-15', valor_efetivo: exactValue, motivo_tipo: 'EXATA', justificativa: null, chave_idempotencia: 'baixa-lucas-recebida-2026-05', saldo_apos: 0, status_resultante: 'RECEBIDA', criado_por_id: secondaryUserId, criado_em: '2026-05-15T12:05:00.000Z' },
    { id: 'mock-baixa-lucas-parcial', comissao_id: 'mock-comissao-lucas-parcial', tipo: 'BAIXA', baixa_origem_id: null, origem_tipo: 'MANUAL', data_efetiva: '2026-06-15', valor_efetivo: partialReceipt, motivo_tipo: 'PARCIAL', justificativa: 'Recebimento parcial confirmado pelo demonstrativo.', chave_idempotencia: 'baixa-lucas-parcial-2026-06', saldo_apos: partialExpected - partialReceipt, status_resultante: 'PARCIAL', criado_por_id: secondaryUserId, criado_em: '2026-06-15T12:05:00.000Z' },
    { id: 'mock-estorno-lucas-parcial', comissao_id: 'mock-comissao-lucas-parcial', tipo: 'ESTORNO', baixa_origem_id: 'mock-baixa-lucas-parcial', origem_tipo: 'MANUAL', data_efetiva: '2026-06-16', valor_efetivo: -partialReversal, motivo_tipo: 'ESTORNO', justificativa: 'Ajuste do valor líquido efetivamente creditado.', chave_idempotencia: 'estorno-lucas-parcial-2026-06', saldo_apos: partialExpected - partialReceived, status_resultante: 'PARCIAL', criado_por_id: secondaryUserId, criado_em: '2026-06-16T10:00:00.000Z' },
  )
  pushRows(db, 'comissao_baixa_conciliacoes',
    { id: 'mock-ponte-baixa-lucas-recebida', baixa_id: 'mock-baixa-lucas-recebida', conciliacao_id: 'mock-conciliacao-lucas-recebida', valor_aplicado: exactValue, criado_em: '2026-05-15T12:05:00.000Z' },
    { id: 'mock-ponte-baixa-lucas-parcial', baixa_id: 'mock-baixa-lucas-parcial', conciliacao_id: 'mock-conciliacao-lucas-parcial', valor_aplicado: partialReceipt, criado_em: '2026-06-15T12:05:00.000Z' },
    { id: 'mock-ponte-estorno-lucas-parcial', baixa_id: 'mock-estorno-lucas-parcial', conciliacao_id: 'mock-conciliacao-lucas-parcial', valor_aplicado: -partialReversal, criado_em: '2026-06-16T10:00:00.000Z' },
  )
  pushRows(db, 'repasses',
    { id: 'mock-repasse-lucas-pago', proposta_id: 'mock-proposta-lucas-atual', comissao_id: 'mock-comissao-lucas-recebida', beneficiario_id: externalProducerId, regra_id: null, numero: 1, papel_beneficiario: 'PRODUTOR', base: 'COMISSAO', percentual: 35, valor_previsto: 181.87, valor_pago: 181.87, valor_diferenca: 0, status: 'PAGO', previsto_em: '2026-05-10', liberado_em: '2026-05-15', pago_em: '2026-05-20', forma_pagamento: 'TRANSFERENCIA_BANCARIA', comprovante_referencia: 'COMP-MOCK-LUCAS-2026-05', observacoes: 'Repasse manual demonstrativo ligado à comissão recebida.' },
    { id: 'mock-repasse-lucas-liberado', proposta_id: 'mock-proposta-lucas-atual', comissao_id: 'mock-comissao-lucas-parcial', beneficiario_id: externalProducerId, regra_id: null, numero: 2, papel_beneficiario: 'PRODUTOR', base: 'COMISSAO', percentual: 35, valor_previsto: 29.1, valor_pago: null, valor_diferenca: null, status: 'LIBERADO', previsto_em: '2026-06-10', liberado_em: '2026-06-15', pago_em: null, forma_pagamento: null, comprovante_referencia: null, observacoes: 'Aguardando emissão de recibo.' },
  )
  pushRows(db, 'repasse_recibos', {
    id: 'mock-recibo-repasse-lucas', filial_id: centerBranchId, beneficiario_id: externalProducerId,
    numero: 'REC-CENTRO-2026-0001', sentido: 'CREDITO', status: 'EMITIDO', data_pagamento: '2026-05-20',
    forma_pagamento: 'TRANSFERENCIA_BANCARIA', comprovante_referencia: 'COMP-MOCK-LUCAS-2026-05',
    observacoes: 'Recibo demonstrativo de repasse integral.', chave_idempotencia: 'recibo-lucas-2026-05-20',
    chave_cancelamento: null, filial_nome_snapshot: 'Wassis Centro', beneficiario_nome_snapshot: 'Marina Costa',
    emitido_por_id: userId, emitido_em: '2026-05-20T18:00:00.000Z', cancelado_por_id: null,
    cancelado_em: null, motivo_cancelamento: null, atualizado_em: '2026-05-20T18:00:00.000Z',
  })
  pushRows(db, 'repasse_recibo_itens', {
    id: 'mock-recibo-item-lucas', recibo_id: 'mock-recibo-repasse-lucas', repasse_id: 'mock-repasse-lucas-pago',
    numero_repasse_snapshot: 1, documento_referencia_snapshot: 'REN-2026-50204',
    segurado_nome_snapshot: 'Lucas Martins', seguradora_nome_snapshot: 'Porto Seguro',
    ramo_nome_snapshot: 'Automóvel', papel_beneficiario_snapshot: 'PRODUTOR',
    valor_previsto_snapshot: 181.87, valor_pago_snapshot: 181.87, criado_em: '2026-05-20T18:00:00.000Z',
  })

  const paidInstallment = db.parcelas.find((row) => row.proposta_id === 'mock-proposta-viaforte-original' && row.status === 'paga')
  const cancelledInstallment = db.parcelas.find((row) => row.proposta_id === 'mock-proposta-aurora-original' && row.status === 'cancelada')
  const collectionPipeline = db.pipelines.find((row) => row.entidade_tipo === 'cobranca')
  const collectionStages = db.pipeline_stages
    .filter((row) => row.pipeline_id === collectionPipeline?.id)
    .sort((left, right) => Number(left.ordem ?? 0) - Number(right.ordem ?? 0))
  if (paidInstallment?.id && collectionStages[3]?.id) {
    pushRows(db, 'financeiro_cobrancas', {
      id: 'mock-cobranca-quitada', parcela_id: paidInstallment.id, stage_id: collectionStages[3].id,
      responsavel_id: userId, data_abertura: '2026-07-06', vencimento_followup: '2026-07-10',
      status: 'QUITADA', prioridade: 'ALTA', ultima_cobranca_em: '2026-07-09T16:00:00.000Z',
      proxima_cobranca_em: null, canal_preferencial: 'WHATSAPP',
      observacoes: 'Pagamento confirmado na parcela antes do encerramento da cobrança.',
      encerrada_em: '2026-07-10T11:00:00.000Z', motivo_encerramento: null,
    })
  }
  if (cancelledInstallment?.id && collectionStages[0]?.id) {
    pushRows(db, 'financeiro_cobrancas', {
      id: 'mock-cobranca-cancelada', parcela_id: cancelledInstallment.id, stage_id: collectionStages[0].id,
      responsavel_id: secondaryUserId, data_abertura: '2026-06-14', vencimento_followup: '2026-06-18',
      status: 'CANCELADA', prioridade: 'MEDIA', ultima_cobranca_em: '2026-06-17T13:00:00.000Z',
      proxima_cobranca_em: null, canal_preferencial: 'EMAIL', observacoes: 'Cobrança cancelada após cancelamento da parcela.',
      encerrada_em: '2026-06-18T10:30:00.000Z', motivo_encerramento: 'Parcela cancelada por ajuste contratual.',
    })
  }
}

function seedCrossModuleData(context: IntegratedDemoSeedContext) {
  const { db, tenantId, matrixBranchId, centerBranchId, userId, secondaryUserId } = context
  pushRows(db, 'campo_definicoes', {
    id: 'mock-campo-segurado-interesses', tenant_id: tenantId, filial_id: null,
    entidade_tipo: 'segurado', chave: 'produtos_interesse', nome: 'Produtos de interesse',
    tipo_dado: 'LISTA_MULTIPLA', formato: null, obrigatorio: false, ativo: true,
    ordem: 40, ajuda: 'Interesses declarados para futuras oportunidades.', min_valor: null,
    max_valor: null, tamanho_max: null, mascara: null, placeholder: null,
    agrupamento: 'Comercial', visivel_em_listagem: true,
  })
  pushRows(db, 'campo_opcoes',
    { id: 'mock-opcao-interesse-auto', campo_definicao_id: 'mock-campo-segurado-interesses', rotulo: 'Automóvel', valor: 'AUTO', ordem: 10, ativo: true },
    { id: 'mock-opcao-interesse-residencial', campo_definicao_id: 'mock-campo-segurado-interesses', rotulo: 'Residencial', valor: 'RESIDENCIAL', ordem: 20, ativo: true },
    { id: 'mock-opcao-interesse-vida', campo_definicao_id: 'mock-campo-segurado-interesses', rotulo: 'Vida', valor: 'VIDA', ordem: 30, ativo: true },
  )
  pushRows(db, 'campo_valores', {
    id: 'mock-campo-valor-joao-interesses', campo_definicao_id: 'mock-campo-segurado-interesses',
    entidade_id: 'mock-segurado-joao', valor_texto: null, valor_numero: null,
    valor_booleano: null, valor_data: null, valor_datahora: null, valor_opcao_id: null,
    preenchido_em: DEMO_NOW, origem: 'mock', validado_em: DEMO_NOW,
  })
  pushRows(db, 'campo_valor_opcoes',
    { id: 'mock-campo-valor-opcao-joao-auto', campo_valor_id: 'mock-campo-valor-joao-interesses', campo_opcao_id: 'mock-opcao-interesse-auto', ordem: 10 },
    { id: 'mock-campo-valor-opcao-joao-residencial', campo_valor_id: 'mock-campo-valor-joao-interesses', campo_opcao_id: 'mock-opcao-interesse-residencial', ordem: 20 },
  )

  const planDefinition = db.campo_definicoes.find((row) => row.chave === 'tipo_plano_saude')
  const businessPlan = planDefinition && db.campo_opcoes.find((row) =>
    row.campo_definicao_id === planDefinition.id && row.valor === 'empresarial',
  )
  if (planDefinition?.id && businessPlan?.id) {
    pushRows(db, 'campo_valores', {
      id: 'mock-campo-valor-aurora-plano', campo_definicao_id: planDefinition.id,
      entidade_id: 'mock-segurado-aurora', valor_texto: null, valor_numero: null,
      valor_booleano: null, valor_data: null, valor_datahora: null,
      valor_opcao_id: businessPlan.id, preenchido_em: DEMO_NOW, origem: 'mock', validado_em: DEMO_NOW,
    })
  }

  pushRows(db, 'atividades',
    { id: 'mock-followup-oportunidade-joao', tenant_id: tenantId, filial_id: matrixBranchId, responsavel_id: userId, entidade_tipo: 'oportunidade', entidade_id: 'mock-oportunidade-joao-auto', tipo: 'followup', titulo: 'Apresentar opções Auto', descricao: 'Revisar diferenças de cobertura entre os dois perfis calculados.', status: 'pendente', prioridade: 'alta', vencimento: '2026-07-23T17:00:00.000Z', concluida_em: null, fixada_em: null, canal: 'whatsapp', origem: 'mock', lembrete_em: '2026-07-23T16:30:00.000Z', recorrente: false, observacoes: null },
    { id: 'mock-nota-oportunidade-mariana', tenant_id: tenantId, filial_id: matrixBranchId, responsavel_id: userId, entidade_tipo: 'oportunidade', entidade_id: 'mock-oportunidade-mariana-renovacao', tipo: 'nota', titulo: 'Continuidade de vigência', descricao: 'Cliente pediu renovação sem lacuna e manutenção das coberturas atuais.', status: 'concluida', prioridade: 'alta', vencimento: null, concluida_em: '2026-07-20T14:00:00.000Z', fixada_em: DEMO_NOW, canal: 'telefone', origem: 'mock', lembrete_em: null, recorrente: false, observacoes: null },
    { id: 'mock-tarefa-pos-venda-lucas', tenant_id: tenantId, filial_id: centerBranchId, responsavel_id: secondaryUserId, entidade_tipo: 'apolice', entidade_id: 'mock-apolice-lucas-atual', tipo: 'tarefa', titulo: 'Enviar cartão de assistência', descricao: 'Confirmar recebimento do material da renovação.', status: 'concluida', prioridade: 'media', vencimento: '2026-05-03T12:00:00.000Z', concluida_em: '2026-05-02T16:00:00.000Z', fixada_em: null, canal: 'email', origem: 'mock', lembrete_em: null, recorrente: false, observacoes: null },
  )
  pushRows(db, 'atividade_mencoes', {
    id: 'mock-mencao-oportunidade-mariana', atividade_id: 'mock-nota-oportunidade-mariana',
    profile_id: secondaryUserId, lida_em: null, notificada_em: DEMO_NOW,
  })
  pushRows(db, 'anexos',
    { id: 'mock-anexo-apolice-lucas', tenant_id: tenantId, filial_id: centerBranchId, entidade_tipo: 'apolice', entidade_id: 'mock-apolice-lucas-atual', nome_arquivo: 'apolice-auto-lucas-2026.pdf', mime_type: 'application/pdf', tamanho_bytes: 612000, url_armazenamento: null, categoria: 'apolice', descricao: 'Documento demonstrativo da renovação emitida.', origem: 'mock', status: 'ativo', hash_sha256: null, anexado_em: '2026-04-28T10:00:00.000Z' },
    { id: 'mock-anexo-oportunidade-mariana', tenant_id: tenantId, filial_id: matrixBranchId, entidade_tipo: 'oportunidade', entidade_id: 'mock-oportunidade-mariana-renovacao', nome_arquivo: 'questionario-renovacao-mariana.pdf', mime_type: 'application/pdf', tamanho_bytes: 188000, url_armazenamento: null, categoria: 'questionario', descricao: 'Metadado de apoio à renovação.', origem: 'mock', status: 'ativo', hash_sha256: null, anexado_em: '2026-07-20T14:05:00.000Z' },
  )
  pushRows(db, 'audit_logs',
    { id: 'mock-audit-oportunidade-joao-calculo', tenant_id: tenantId, user_id: userId, entidade_tipo: 'oportunidade', entidade_id: 'mock-oportunidade-joao-auto', campo: 'calculos', valor_antigo: '0', valor_novo: '2', acao: 'UPDATE', ocorrido_em: DEMO_NOW, origem: 'MOCK_SEED', ip: null, user_agent: 'mock' },
    { id: 'mock-audit-apolice-lucas-renovada', tenant_id: tenantId, user_id: secondaryUserId, entidade_tipo: 'apolice', entidade_id: 'mock-apolice-lucas-anterior', campo: 'status', valor_antigo: 'VIGENTE', valor_novo: 'RENOVADA', acao: 'UPDATE', ocorrido_em: '2026-04-27T14:00:00.000Z', origem: 'MOCK_SEED', ip: null, user_agent: 'mock' },
    { id: 'mock-audit-recibo-lucas', tenant_id: tenantId, user_id: userId, entidade_tipo: 'repasse_recibo', entidade_id: 'mock-recibo-repasse-lucas', campo: 'status', valor_antigo: null, valor_novo: 'EMITIDO', acao: 'INSERT', ocorrido_em: '2026-05-20T18:00:00.000Z', origem: 'MOCK_SEED', ip: null, user_agent: 'mock' },
  )
}

export function populateIntegratedDemoData(context: IntegratedDemoSeedContext) {
  seedInsuredsAndContacts(context)
  seedContractPortfolio(context)
  seedOpportunitiesAndCalculations(context)
  seedClaims(context)
  seedFinancialHistory(context)
  seedCrossModuleData(context)
}
