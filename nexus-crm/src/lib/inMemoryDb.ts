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
  // Segurado -> Produtor/Gerente (ambos apontam para profiles)
  'segurados.produtor': { target: 'profiles', localFk: 'produtor_id', kind: 'forward' },
  'segurados.gerente': { target: 'profiles', localFk: 'gerente_id', kind: 'forward' },
  // pessoa_contato -> PJ/PF (ambos apontam para segurados)
  'pessoa_contato.pj': { target: 'segurados', localFk: 'pj_id', kind: 'forward' },
  'pessoa_contato.pf': { target: 'segurados', localFk: 'pf_id', kind: 'forward' },

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

  db.user_roles.push({
    id: newId(),
    user_id: MOCK_USER_ID,
    role: 'admin',
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
  (['admin', 'vendedor', 'visualizador'] as const).forEach((role) => {
    allModules.forEach((module) => {
      db.role_permissions.push({
        id: newId(),
        role,
        module,
        can_read: true,
        can_create: role !== 'visualizador',
        can_update: role !== 'visualizador',
        can_delete: role === 'admin',
      });
    });
  });

  ['Auto', 'Vida', 'Residencial', 'Empresarial', 'Saúde'].forEach((nome) => {
    db.ramos.push({
      id: newId(),
      nome,
      ativo: true,
      tenant_id: MOCK_TENANT_ID,
      comissao_padrao: 10,
      created_at: nowIso(),
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
