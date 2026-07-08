/**
 * Banco de dados in-memory volátil para o modo "frontend puro".
 *
 * As tabelas vivem como variáveis de módulo neste arquivo: sobrevivem entre
 * renders, mas zeram a cada full reload da página (que é o comportamento
 * desejado — sessão aberta = dados temporários).
 *
 * Quando o backend definitivo existir, este arquivo e o inMemoryQueryBuilder
 * podem ser deletados; o adapter em lib/supabase.ts volta a apontar para HTTP.
 */

// O mock in-memory precisa aceitar linhas heterogeneas de todas as tabelas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

const TABLES = [
  'oportunidades',
  'emissoes',
  'pos_vendas',
  'financeiro_cobrancas',
  'sinistros',
  'segurados',
  'pessoa_contato',
  'pipelines',
  'pipeline_stages',
  'profiles',
  'filiais',
  'profile_filiais',
  'perfis',
  'produtores',
  'role_permissions',
  'ramos',
  'coberturas_catalogo',
  'seguradoras',
  'recebimento_grades',
  'recebimento_grade_parcelas',
  'repasse_regras',
  'campo_definicoes',
  'campo_opcoes',
  'origens',
  'motivos_perda',
  'anexos',
  'atividades',
  'audit_logs',
  'tenants',
] as const;

export type TableName = (typeof TABLES)[number];

const db: Record<string, Row[]> = {};
TABLES.forEach((t) => {
  db[t] = [];
});

export function getTable(name: string): Row[] {
  if (!db[name]) db[name] = [];
  return db[name];
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // fallback
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export const MOCK_TENANT_ID = 'mock-tenant-id';
export const MOCK_USER_ID = 'mock-user-id';

/**
 * Mapa de relações usadas pelo query builder para resolver joins.
 *
 * - `<source>.<alias>` para joins com alias explícito do PostgREST
 *   (`alias:fk ( ... )`): mapeia alias → tabela alvo + FK no source.
 * - `<source>.<targetTable>` para joins reversos sem alias
 *   (`pipeline_stages (*)` num select em `pipelines`).
 */
export const RELATIONS: Record<
  string,
  { target: string; localFk?: string; childFk?: string; kind: 'forward' | 'reverse' }
> = {
  // forward (many-to-one): row.<alias> = registro único da tabela alvo
  'oportunidades.segurados': { target: 'segurados', localFk: 'segurado_id', kind: 'forward' },
  'oportunidades.ramos': { target: 'ramos', localFk: 'ramo_id', kind: 'forward' },
  'oportunidades.seguradoras': { target: 'seguradoras', localFk: 'seguradora_id', kind: 'forward' },
  'oportunidades.origens': { target: 'origens', localFk: 'origem_id', kind: 'forward' },
  'oportunidades.motivos_perda': { target: 'motivos_perda', localFk: 'motivo_perda_id', kind: 'forward' },
  'emissoes.oportunidades': { target: 'oportunidades', localFk: 'oportunidade_id', kind: 'forward' },
  'pos_vendas.oportunidades': { target: 'oportunidades', localFk: 'oportunidade_id', kind: 'forward' },
  'sinistros.oportunidades': { target: 'oportunidades', localFk: 'oportunidade_id', kind: 'forward' },
  'financeiro_cobrancas.oportunidades': { target: 'oportunidades', localFk: 'oportunidade_id', kind: 'forward' },
  'recebimento_grades.seguradoras': { target: 'seguradoras', localFk: 'seguradora_id', kind: 'forward' },
  'recebimento_grades.ramos': { target: 'ramos', localFk: 'ramo_id', kind: 'forward' },
  'recebimento_grade_parcelas.recebimento_grades': { target: 'recebimento_grades', localFk: 'grade_id', kind: 'forward' },
  'repasse_regras.filiais': { target: 'filiais', localFk: 'filial_id', kind: 'forward' },
  'repasse_regras.produtores': { target: 'produtores', localFk: 'produtor_id', kind: 'forward' },
  'repasse_regras.ramos': { target: 'ramos', localFk: 'ramo_id', kind: 'forward' },
  'campo_definicoes.filiais': { target: 'filiais', localFk: 'filial_id', kind: 'forward' },
  'campo_opcoes.campo_definicoes': { target: 'campo_definicoes', localFk: 'campo_definicao_id', kind: 'forward' },
  // Segurado -> Produtor/Gerente (ambos apontam para produtores desde a fase 0.2)
  'segurados.produtor': { target: 'produtores', localFk: 'produtor_id', kind: 'forward' },
  'segurados.gerente': { target: 'produtores', localFk: 'gerente_id', kind: 'forward' },
  // pessoa_contato -> PJ/PF (ambos apontam para segurados)
  'pessoa_contato.pj': { target: 'segurados', localFk: 'pj_id', kind: 'forward' },
  'pessoa_contato.pf': { target: 'segurados', localFk: 'pf_id', kind: 'forward' },

  // plataforma multi-corretora (v1.1)
  'filiais.matriz': { target: 'filiais', localFk: 'matriz_id', kind: 'forward' },
  'filiais.gerente_produtor': { target: 'produtores', localFk: 'gerente_id', kind: 'forward' },
  'profile_filiais.profiles': { target: 'profiles', localFk: 'profile_id', kind: 'forward' },
  'profile_filiais.filiais': { target: 'filiais', localFk: 'filial_id', kind: 'forward' },
  'profile_filiais.perfis': { target: 'perfis', localFk: 'perfil_id', kind: 'forward' },

  // reverse (one-to-many): row.<targetTable> = array de filhos
  'pipelines.pipeline_stages': { target: 'pipeline_stages', childFk: 'pipeline_id', kind: 'reverse' },
};

let seeded = false;

/**
 * Popula tabelas com dados mínimos para que a UI tenha algo para mostrar
 * (lookups + pipelines/stages padrão por módulo + usuário/tenant mock).
 *
 * Chamado uma única vez na primeira carga do módulo.
 */
export function seed(): void {
  if (seeded) return;
  seeded = true;

  db.tenants.push({
    id: MOCK_TENANT_ID,
    name: 'Wassis Dev',
    created_at: nowIso(),
  });

  db.profiles.push({
    id: MOCK_USER_ID,
    full_name: 'Dev Wassis',
    avatar_url: null,
    tenant_id: MOCK_TENANT_ID,
    email: 'dev@wassis.com',
    created_at: nowIso(),
  });

  const allModules = [
    'dashboard',
    'segurados',
    'apolices',
    'financeiro',
    'configuracoes',
    'comercial',
    'sinistro',
    'emissao',
    'pos_venda',
  ];
  // Perfis de acesso cadastráveis (D18): 4 pré-configurados "sistema".
  const perfilIds: Record<string, string> = {};
  ['Master', 'Gestor', 'Produtor', 'Operador'].forEach((nome) => {
    const id = newId();
    perfilIds[nome] = id;
    db.perfis.push({
      id,
      nome,
      sistema: true,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  });

  // role_permissions agora pendura no PERFIL (D18), não em papel global fixo.
  // [can_read, can_create, can_update, can_delete] por perfil-sistema.
  const PERFIL_DEFAULTS: Record<string, [boolean, boolean, boolean, boolean]> = {
    Master: [true, true, true, true],
    Gestor: [true, true, true, false],
    Produtor: [true, true, true, false],
    Operador: [true, false, false, false],
  };
  Object.entries(perfilIds).forEach(([nome, perfilId]) => {
    const [r, c, u, d] = PERFIL_DEFAULTS[nome];
    allModules.forEach((module) => {
      db.role_permissions.push({
        id: newId(),
        perfil_id: perfilId,
        module,
        can_read: r,
        can_create: c,
        can_update: u,
        can_delete: d,
        created_at: nowIso(),
      });
    });
  });

  // --- Plataforma multi-corretora (v1.1) ---
  // (perfis e suas role_permissions já foram semeados acima.)
  // Corretoras (filiais). Os IDs CASAM com os branchIds do MOCK_USER (AuthContext)
  // para o seletor do Header resolver razão social/fantasia reais.
  const MATRIZ_ID = 'mock-branch-id';
  const FILIAL_CENTRO_ID = 'mock-branch-centro';
  db.filiais.push({
    id: MATRIZ_ID,
    tenant_id: MOCK_TENANT_ID,
    matriz_id: null,
    razao_social: 'Wassis Corretora de Seguros LTDA',
    fantasia: 'Wassis Matriz',
    cnpj_cpf: '12345678000190',
    susep: '202312345',
    percentual_imposto: 5,
    lgpd_aceito: true,
    lgpd_aceito_em: nowIso(),
    gerente: 'Renato Assis',
    gerente_id: null,
    contato: 'Comercial',
    home_page: 'https://wassis.com.br',
    email: 'contato@wassis.com.br',
    telefone: '1133334444',
    celular: '11999998888',
    telefone2: null,
    cep: '01310100',
    endereco: 'Av. Paulista, 1000',
    numero: '1000',
    complemento: 'Conj. 101',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    ativo: true,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  db.filiais.push({
    id: FILIAL_CENTRO_ID,
    tenant_id: MOCK_TENANT_ID,
    matriz_id: MATRIZ_ID,
    razao_social: 'Wassis Seguros Filial Centro LTDA',
    fantasia: 'Wassis Centro',
    cnpj_cpf: '12345678000271',
    susep: '202354321',
    percentual_imposto: 5,
    lgpd_aceito: true,
    lgpd_aceito_em: nowIso(),
    gerente: 'Equipe Centro',
    gerente_id: null,
    contato: 'Atendimento',
    home_page: null,
    email: 'centro@wassis.com.br',
    telefone: '1132321111',
    celular: null,
    telefone2: null,
    cep: '01001000',
    endereco: 'Praça da Sé, 100',
    numero: '100',
    complemento: null,
    bairro: 'Sé',
    cidade: 'São Paulo',
    uf: 'SP',
    ativo: true,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  // Vínculo perfil-por-corretora: o usuário mock atua nas 2 corretoras como Master,
  // com a Matriz como corretora "casa" (principal).
  [
    { filial_id: MATRIZ_ID, principal: true },
    { filial_id: FILIAL_CENTRO_ID, principal: false },
  ].forEach((v) => {
    db.profile_filiais.push({
      id: newId(),
      profile_id: MOCK_USER_ID,
      filial_id: v.filial_id,
      perfil_id: perfilIds['Master'],
      principal: v.principal,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  });

  const PRODUTOR_INTERNO_ID = 'mock-produtor-interno';
  const PRODUTOR_EXTERNO_ID = 'mock-produtor-externo';
  db.produtores.push({
    id: PRODUTOR_INTERNO_ID,
    tenant_id: MOCK_TENANT_ID,
    profile_id: MOCK_USER_ID,
    nome: 'Dev Wassis',
    cpf_cnpj: '12345678901',
    email: 'dev@wassis.com',
    telefone: null,
    celular: '11999998888',
    banco: 'Banco do Brasil',
    agencia: '0001',
    conta: '12345-6',
    chave_pix: 'dev@wassis.com',
    percentual_repasse_padrao: 35,
    ativo: true,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  db.produtores.push({
    id: PRODUTOR_EXTERNO_ID,
    tenant_id: MOCK_TENANT_ID,
    profile_id: null,
    nome: 'Marina Costa',
    cpf_cnpj: '98765432100',
    email: 'marina.parceira@example.com',
    telefone: null,
    celular: '11988887777',
    banco: null,
    agencia: null,
    conta: null,
    chave_pix: '98765432100',
    percentual_repasse_padrao: 25,
    ativo: true,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  db.filiais.forEach((f) => {
    if (f.id === MATRIZ_ID) {
      f.gerente_id = PRODUTOR_INTERNO_ID;
      f.gerente = 'Dev Wassis';
    }
    if (f.id === FILIAL_CENTRO_ID) {
      f.gerente_id = PRODUTOR_EXTERNO_ID;
      f.gerente = 'Marina Costa';
    }
  });

  const ramoIds: Record<string, string> = {};
  const seguradoraIds: Record<string, string> = {};
  [
    { nome: 'Automóvel', codigo_susep: '0531', risk_type: 'VEICULO', grupo_operacional: 'Auto e Frota', forma_calculo: 'AUTO', is_monthly: false, ordem: 10 },
    { nome: 'Frota', codigo_susep: '0532', risk_type: 'VEICULO', grupo_operacional: 'Auto e Frota', forma_calculo: 'AUTO', is_monthly: false, ordem: 20 },
    { nome: 'Residencial', codigo_susep: '0114', risk_type: 'IMOVEL', grupo_operacional: 'Patrimonial', forma_calculo: 'RESIDENCIA', is_monthly: false, ordem: 30 },
    { nome: 'Empresarial', codigo_susep: '0118', risk_type: 'EMPRESA', grupo_operacional: 'Empresarial', forma_calculo: 'EMPRESA', is_monthly: false, ordem: 40 },
    { nome: 'Vida em Grupo Global', codigo_susep: '0993', risk_type: 'VIDA', grupo_operacional: 'Pessoas', forma_calculo: 'VIDA', is_monthly: false, ordem: 50 },
    { nome: 'Vida em Grupo PME', codigo_susep: '0994', risk_type: 'VIDA', grupo_operacional: 'Pessoas', forma_calculo: 'VIDA', is_monthly: true, ordem: 60 },
    { nome: 'Saúde Empresarial', codigo_susep: '1134', risk_type: 'SAUDE', grupo_operacional: 'Pessoas', forma_calculo: 'DIVERSOS', is_monthly: true, ordem: 70 },
    { nome: 'Transporte', codigo_susep: '0621', risk_type: 'CARGA', grupo_operacional: 'Transporte', forma_calculo: 'DIVERSOS', is_monthly: true, ordem: 80 },
  ].forEach((ramo) => {
    const id = newId();
    ramoIds[ramo.nome] = id;
    db.ramos.push({
      id,
      ...ramo,
      renovavel: true,
      permite_endosso: true,
      exige_item: true,
      exige_coberturas: ramo.risk_type !== 'SAUDE',
      ativo: true,
      observacoes: null,
      tenant_id: MOCK_TENANT_ID,
    });
  });
  [
    { ramo: 'Automóvel', codigo: 'casco', codigo_susep: '001', nome: 'Casco', tipo_cobertura: 'basica', tipo_risco: 'danos', capital_lmi_padrao: 100000 },
    { ramo: 'Automóvel', codigo: 'rcf-v', codigo_susep: '002', nome: 'RCF-V', tipo_cobertura: 'adicional', tipo_risco: 'danos', capital_lmi_padrao: 50000 },
    { ramo: 'Residencial', codigo: 'incendio', codigo_susep: '010', nome: 'Incêndio, Raio e Explosão', tipo_cobertura: 'basica', tipo_risco: 'danos', capital_lmi_padrao: 300000 },
    { ramo: 'Residencial', codigo: 'danos-eletricos', codigo_susep: '011', nome: 'Danos Elétricos', tipo_cobertura: 'adicional', tipo_risco: 'danos', capital_lmi_padrao: 20000 },
    { ramo: 'Vida em Grupo PME', codigo: 'morte', codigo_susep: '100', nome: 'Morte Natural ou Acidental', tipo_cobertura: 'basica', tipo_risco: 'pessoas', capital_lmi_padrao: 100000 },
  ].forEach((cobertura, index) => {
    const ramo_id = ramoIds[cobertura.ramo];
    if (!ramo_id) return;
    db.coberturas_catalogo.push({
      id: newId(),
      ramo_id,
      codigo: cobertura.codigo,
      codigo_susep: cobertura.codigo_susep,
      nome: cobertura.nome,
      descricao: null,
      tipo_cobertura: cobertura.tipo_cobertura,
      caracteristica: 'massificado',
      tipo_risco: cobertura.tipo_risco,
      modalidade: 'regular',
      capital_lmi_padrao: cobertura.capital_lmi_padrao,
      franquia_padrao: null,
      carencia_dias: 0,
      obrigatoria: cobertura.tipo_cobertura === 'basica',
      ordem: (index + 1) * 10,
      ativo: true,
    });
  });
  [
    {
      nome: 'Porto Seguro',
      nome_curto: 'Porto',
      cnpj: '61198164000160',
      codigo_susep: '05886',
      codigo_interno: 'porto',
      site: 'https://www.portoseguro.com.br',
      portal_url: 'https://corretor.portoseguro.com.br',
      telefone_sac: '0800 727 2766',
      telefone_assistencia: '3337 6786',
      email: 'atendimento@portoseguro.com.br',
      aceita_importacao_pdf: true,
      aceita_busca_automatica: true,
      observacoes: 'Seguradora com alto volume operacional no grupo.',
    },
    {
      nome: 'Bradesco Seguros',
      nome_curto: 'Bradesco',
      cnpj: '33055146000193',
      codigo_susep: '05495',
      codigo_interno: 'bradesco',
      site: 'https://www.bradescoseguros.com.br',
      portal_url: 'https://wwws.bradescoseguros.com.br',
      telefone_sac: '0800 727 9966',
      telefone_assistencia: '0800 701 2757',
      email: 'atendimento@bradescoseguros.com.br',
      aceita_importacao_pdf: true,
      aceita_busca_automatica: false,
      observacoes: null,
    },
    {
      nome: 'Allianz',
      nome_curto: 'Allianz',
      cnpj: '61573620000115',
      codigo_susep: '05177',
      codigo_interno: 'allianz',
      site: 'https://www.allianz.com.br',
      portal_url: 'https://portal.allianz.com.br',
      telefone_sac: '0800 115 215',
      telefone_assistencia: '0800 130 700',
      email: 'relacionamento@allianz.com.br',
      aceita_importacao_pdf: false,
      aceita_busca_automatica: false,
      observacoes: null,
    },
    {
      nome: 'SulAmérica',
      nome_curto: 'SulAmérica',
      cnpj: '01742199000166',
      codigo_susep: '06238',
      codigo_interno: 'sulamerica',
      site: 'https://www.sulamerica.com.br',
      portal_url: 'https://portal.sulamerica.com.br',
      telefone_sac: '0800 725 3374',
      telefone_assistencia: '4004 4100',
      email: 'atendimento@sulamerica.com.br',
      aceita_importacao_pdf: true,
      aceita_busca_automatica: false,
      observacoes: null,
    },
    {
      nome: 'Tokio Marine',
      nome_curto: 'Tokio',
      cnpj: '33164021000100',
      codigo_susep: '06190',
      codigo_interno: 'tokio',
      site: 'https://www.tokiomarine.com.br',
      portal_url: 'https://portal.tokiomarine.com.br',
      telefone_sac: '0800 703 9000',
      telefone_assistencia: '0800 318 6546',
      email: 'atendimento@tokiomarine.com.br',
      aceita_importacao_pdf: true,
      aceita_busca_automatica: true,
      observacoes: null,
    },
  ].forEach((seguradora) => {
    const id = newId();
    seguradoraIds[seguradora.nome] = id;
    db.seguradoras.push({
      id,
      ...seguradora,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  });

  const portoAutoGradeId = newId();
  const sulamericaSaudeGradeId = newId();
  const portoId = seguradoraIds['Porto Seguro'];
  const sulamericaId = seguradoraIds['SulAmérica'];
  const automovelId = ramoIds['Automóvel'];
  const saudeId = ramoIds['Saúde Empresarial'];
  if (portoId && automovelId) {
    db.recebimento_grades.push({
      id: portoAutoGradeId,
      seguradora_id: portoId,
      ramo_id: automovelId,
      nome: 'Porto Auto - antecipado 3x',
      tipo: 'ANTECIPADO_N',
      qtd_parcelas: 3,
      base_calculo: 'PREMIO_LIQUIDO',
      percentual_default: 20,
      considera_iof: false,
      considera_adicional_fracionamento: false,
      vitalicio: false,
      ativo: true,
      observacoes: 'Comissão antecipada em três eventos após emissão.',
    });
    [
      { numero: 1, percentual: 50, dias_apos_vencimento: 0 },
      { numero: 2, percentual: 30, dias_apos_vencimento: 30 },
      { numero: 3, percentual: 20, dias_apos_vencimento: 60 },
    ].forEach((parcela) => {
      db.recebimento_grade_parcelas.push({
        id: newId(),
        grade_id: portoAutoGradeId,
        numero: parcela.numero,
        percentual: parcela.percentual,
        percentual_sobre: 'COMISSAO_TOTAL',
        dias_apos_vencimento: parcela.dias_apos_vencimento,
        ativo: true,
      });
    });
  }
  if (sulamericaId && saudeId) {
    db.recebimento_grades.push({
      id: sulamericaSaudeGradeId,
      seguradora_id: sulamericaId,
      ramo_id: saudeId,
      nome: 'SulAmérica Saúde - vitalício mensal',
      tipo: 'VITALICIO_PCT_PROPOSTA',
      qtd_parcelas: 1,
      base_calculo: 'PREMIO_TOTAL',
      percentual_default: null,
      considera_iof: false,
      considera_adicional_fracionamento: true,
      vitalicio: true,
      ativo: true,
      observacoes: 'Usa o percentual da proposta em cada fatura mensal.',
    });
    db.recebimento_grade_parcelas.push({
      id: newId(),
      grade_id: sulamericaSaudeGradeId,
      numero: 1,
      percentual: null,
      percentual_sobre: 'PREMIO',
      dias_apos_vencimento: 0,
      ativo: true,
    });
  }
  db.repasse_regras.push({
    id: newId(),
    tenant_id: MOCK_TENANT_ID,
    filial_id: null,
    produtor_id: null,
    ramo_id: null,
    papel: 'PRODUTOR',
    tipo_documento: null,
    base: 'COMISSAO',
    percentual: 35,
    valor_fixo: null,
    gatilho: 'CONFORME_RECEBIMENTO',
    qtd_parcelas: null,
    limite_parcelas: null,
    prioridade: 10,
    inicio_vigencia: '2026-01-01',
    fim_vigencia: null,
    ativo: true,
    observacoes: 'Regra padrão do grupo para produtores.',
  });
  db.repasse_regras.push({
    id: newId(),
    tenant_id: MOCK_TENANT_ID,
    filial_id: MATRIZ_ID,
    produtor_id: PRODUTOR_EXTERNO_ID,
    ramo_id: saudeId ?? null,
    papel: 'PRODUTOR',
    tipo_documento: 'NOVA',
    base: 'PREMIO_LIQUIDO',
    percentual: 10,
    valor_fixo: null,
    gatilho: 'PARCELADO',
    qtd_parcelas: 12,
    limite_parcelas: 12,
    prioridade: 80,
    inicio_vigencia: '2026-01-01',
    fim_vigencia: null,
    ativo: true,
    observacoes: 'Override de Saúde para produtora parceira na matriz.',
  });

  const campoCarteirinhaId = newId();
  const campoValorSeguradoId = newId();
  const campoPlanoId = newId();
  [
    {
      id: campoCarteirinhaId,
      filial_id: null,
      entidade_tipo: 'segurado',
      chave: 'numero_carteirinha',
      nome: 'Nº da carteirinha',
      tipo_dado: 'TEXTO_CURTO',
      formato: null,
      obrigatorio: false,
      ordem: 10,
      ajuda: 'Usado em carteiras de saúde e benefícios.',
      min_valor: null,
      max_valor: null,
      tamanho_max: 30,
      mascara: null,
      placeholder: 'Ex: ABC123456',
      agrupamento: 'Saúde',
      visivel_em_listagem: true,
    },
    {
      id: campoValorSeguradoId,
      filial_id: MATRIZ_ID,
      entidade_tipo: 'apolice',
      chave: 'valor_segurado_referencia',
      nome: 'Valor segurado de referência',
      tipo_dado: 'DECIMAL',
      formato: 'MOEDA',
      obrigatorio: false,
      ordem: 20,
      ajuda: 'Campo local da matriz para análise gerencial.',
      min_valor: 0,
      max_valor: null,
      tamanho_max: null,
      mascara: null,
      placeholder: 'Ex: 150000,00',
      agrupamento: 'Operação',
      visivel_em_listagem: false,
    },
    {
      id: campoPlanoId,
      filial_id: null,
      entidade_tipo: 'segurado',
      chave: 'tipo_plano_saude',
      nome: 'Tipo de plano de saúde',
      tipo_dado: 'LISTA_UNICA',
      formato: null,
      obrigatorio: false,
      ordem: 30,
      ajuda: 'Classificação operacional para carteiras de saúde.',
      min_valor: null,
      max_valor: null,
      tamanho_max: null,
      mascara: null,
      placeholder: null,
      agrupamento: 'Saúde',
      visivel_em_listagem: true,
    },
  ].forEach((campo) => {
    db.campo_definicoes.push({
      ...campo,
      tenant_id: MOCK_TENANT_ID,
      ativo: true,
    });
  });
  [
    { rotulo: 'Individual', valor: 'individual', ordem: 10 },
    { rotulo: 'Familiar', valor: 'familiar', ordem: 20 },
    { rotulo: 'Empresarial', valor: 'empresarial', ordem: 30 },
  ].forEach((opcao) => {
    db.campo_opcoes.push({
      id: newId(),
      campo_definicao_id: campoPlanoId,
      ...opcao,
      ativo: true,
    });
  });
  [
    { nome: 'Indicação', tipo: 'indicação', ordem: 10 },
    { nome: 'Site', tipo: 'site', ordem: 20 },
    { nome: 'Redes Sociais', tipo: 'campanha', ordem: 30 },
    { nome: 'Telemarketing', tipo: 'campanha', ordem: 40 },
    { nome: 'Renovação', tipo: 'renovação', ordem: 50 },
  ].forEach((origem) => {
    db.origens.push({
      id: newId(),
      ...origem,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
    });
  });
  [
    { nome: 'Preço', categoria: 'preço', ordem: 10 },
    { nome: 'Concorrente', categoria: 'concorrência', ordem: 20 },
    { nome: 'Sem interesse', categoria: 'desistência', ordem: 30 },
    { nome: 'Sem retorno', categoria: 'sem retorno', ordem: 40 },
  ].forEach((motivo) => {
    db.motivos_perda.push({
      id: newId(),
      ...motivo,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
    });
  });

  const pipelineDefs: Array<{
    entidade_tipo: string;
    nome: string;
    ordem: number;
    stages: Array<{ nome: string; cor: string; sucesso?: boolean; perda?: boolean }>;
  }> = [
    {
      entidade_tipo: 'oportunidade',
      nome: 'Pipeline Comercial',
      ordem: 10,
      stages: [
        { nome: 'Prospecção', cor: 'bg-slate-400' },
        { nome: 'Cotação', cor: 'bg-blue-400' },
        { nome: 'Negociação', cor: 'bg-amber-400' },
        { nome: 'Fechamento', cor: 'bg-emerald-400', sucesso: true, perda: true },
      ],
    },
    {
      entidade_tipo: 'proposta',
      nome: 'Pipeline de Emissão',
      ordem: 20,
      stages: [
        { nome: 'Aguardando proposta', cor: 'bg-slate-400' },
        { nome: 'Em análise', cor: 'bg-blue-400' },
        { nome: 'Emitida', cor: 'bg-emerald-400', sucesso: true },
      ],
    },
    {
      entidade_tipo: 'pos_venda',
      nome: 'Pipeline Pós-Venda',
      ordem: 30,
      stages: [
        { nome: 'Onboarding', cor: 'bg-slate-400' },
        { nome: 'Acompanhamento', cor: 'bg-blue-400' },
        { nome: 'Renovação', cor: 'bg-emerald-400', sucesso: true },
      ],
    },
    {
      entidade_tipo: 'cobranca',
      nome: 'Pipeline Financeiro',
      ordem: 40,
      stages: [
        { nome: 'A vencer', cor: 'bg-slate-400' },
        { nome: 'Vencida', cor: 'bg-amber-400' },
        { nome: 'Paga', cor: 'bg-emerald-400', sucesso: true },
      ],
    },
    {
      entidade_tipo: 'sinistro',
      nome: 'Pipeline de Sinistro',
      ordem: 50,
      stages: [
        { nome: 'Aviso', cor: 'bg-slate-400' },
        { nome: 'Em análise', cor: 'bg-blue-400' },
        { nome: 'Concluído', cor: 'bg-emerald-400', sucesso: true },
      ],
    },
  ];

  pipelineDefs.forEach((p) => {
    const pipelineId = newId();
    db.pipelines.push({
      id: pipelineId,
      nome: p.nome,
      entidade_tipo: p.entidade_tipo,
      filial_id: null,
      ativo: true,
      ordem: p.ordem,
      descricao: null,
      modelo_fabrica: true,
      permite_customizacao: true,
      tenant_id: MOCK_TENANT_ID,
    });
    p.stages.forEach((s, idx) => {
      db.pipeline_stages.push({
        id: newId(),
        pipeline_id: pipelineId,
        nome: s.nome,
        cor: s.cor,
        ordem: idx,
        codigo: null,
        tipo_stage: null,
        probabilidade: null,
        sla_dias: null,
        finaliza_com_sucesso: !!s.sucesso,
        finaliza_com_perda: !!s.perda,
        ativo: true,
      });
    });
  });
}

seed();
