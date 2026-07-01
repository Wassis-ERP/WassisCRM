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
  'user_roles',
  'role_permissions',
  'ramos',
  'seguradoras',
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

  // role_permissions agora pendura no PERFIL (D18), não no enum app_role.
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

  [
    { nome: 'Automóvel', risk_type: 'VEICULO', grupo_operacional: 'Auto e Frota', is_monthly: false },
    { nome: 'Frota', risk_type: 'VEICULO', grupo_operacional: 'Auto e Frota', is_monthly: false },
    { nome: 'Residencial', risk_type: 'IMOVEL', grupo_operacional: 'Patrimonial', is_monthly: false },
    { nome: 'Empresarial', risk_type: 'EMPRESA', grupo_operacional: 'Empresarial', is_monthly: false },
    { nome: 'Vida em Grupo Global', risk_type: 'VIDA', grupo_operacional: 'Pessoas', is_monthly: false },
    { nome: 'Vida em Grupo PME', risk_type: 'VIDA', grupo_operacional: 'Pessoas', is_monthly: true },
    { nome: 'Saúde Empresarial', risk_type: 'SAUDE', grupo_operacional: 'Pessoas', is_monthly: true },
    { nome: 'Transporte', risk_type: 'CARGA', grupo_operacional: 'Transporte', is_monthly: true },
  ].forEach((ramo) => {
    db.ramos.push({
      id: newId(),
      ...ramo,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
      comissao_padrao: 10,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  });
  ['Porto Seguro', 'Bradesco', 'Allianz', 'Sulamérica', 'Tokio Marine'].forEach((nome) => {
    db.seguradoras.push({
      id: newId(),
      nome,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
      created_at: nowIso(),
    });
  });
  ['Indicação', 'Site', 'Redes Sociais', 'Telemarketing', 'Renovação'].forEach((nome) => {
    db.origens.push({
      id: newId(),
      nome,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
      created_at: nowIso(),
    });
  });
  ['Preço', 'Concorrente', 'Sem interesse', 'Sem retorno'].forEach((nome) => {
    db.motivos_perda.push({
      id: newId(),
      nome,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
      created_at: nowIso(),
    });
  });

  const pipelineDefs: Array<{
    module: string;
    name: string;
    stages: Array<{ name: string; color: string; win?: boolean; loss?: boolean }>;
  }> = [
    {
      module: 'comercial',
      name: 'Pipeline Comercial',
      stages: [
        { name: 'Prospecção', color: 'bg-slate-400' },
        { name: 'Cotação', color: 'bg-blue-400' },
        { name: 'Negociação', color: 'bg-amber-400' },
        { name: 'Fechamento', color: 'bg-emerald-400', win: true, loss: true },
      ],
    },
    {
      module: 'emissao',
      name: 'Pipeline de Emissão',
      stages: [
        { name: 'Aguardando proposta', color: 'bg-slate-400' },
        { name: 'Em análise', color: 'bg-blue-400' },
        { name: 'Emitida', color: 'bg-emerald-400', win: true },
      ],
    },
    {
      module: 'pos_venda',
      name: 'Pipeline Pós-Venda',
      stages: [
        { name: 'Onboarding', color: 'bg-slate-400' },
        { name: 'Acompanhamento', color: 'bg-blue-400' },
        { name: 'Renovação', color: 'bg-emerald-400', win: true },
      ],
    },
    {
      module: 'financeiro',
      name: 'Pipeline Financeiro',
      stages: [
        { name: 'A vencer', color: 'bg-slate-400' },
        { name: 'Vencida', color: 'bg-amber-400' },
        { name: 'Paga', color: 'bg-emerald-400', win: true },
      ],
    },
    {
      module: 'sinistro',
      name: 'Pipeline de Sinistro',
      stages: [
        { name: 'Aviso', color: 'bg-slate-400' },
        { name: 'Em análise', color: 'bg-blue-400' },
        { name: 'Concluído', color: 'bg-emerald-400', win: true },
      ],
    },
  ];

  pipelineDefs.forEach((p) => {
    const pipelineId = newId();
    db.pipelines.push({
      id: pipelineId,
      name: p.name,
      module: p.module,
      filial_id: null,
      is_active: true,
      tenant_id: MOCK_TENANT_ID,
      won_label: 'Ganho',
      lost_label: 'Perdido',
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    p.stages.forEach((s, idx) => {
      db.pipeline_stages.push({
        id: newId(),
        pipeline_id: pipelineId,
        name: s.name,
        color: s.color,
        order: idx,
        is_win_eligible: !!s.win,
        is_loss_eligible: !!s.loss,
        created_at: nowIso(),
      });
    });
  });
}

seed();
