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
  'apolices',
  'propostas',
  'apolice_itens',
  'item_veiculo',
  'item_imovel',
  'item_empresa',
  'item_vida',
  'item_coberturas',
  'parcelas',
  'comissoes',
  'comissao_extratos',
  'comissao_extrato_itens',
  'comissao_conciliacoes',
  'comissao_conciliacao_ocorrencias',
  'comissao_baixas',
  'comissao_baixa_conciliacoes',
  'repasses',
  'repasse_recibos',
  'repasse_recibo_itens',
  'pos_vendas',
  'financeiro_cobrancas',
  'sinistros',
  'sinistro_envolvidos',
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
  'endosso_subtipos',
  'cancelamento_motivos',
  'campo_definicoes',
  'campo_opcoes',
  'campo_valores',
  'campo_valor_opcoes',
  'origens',
  'motivos_perda',
  'anexos',
  'atividades',
  'atividade_mencoes',
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

export interface AgendaMaterializationResult {
  parcelas: number;
  comissoes: number;
  repasses: number;
}

import {
  createSinistroAtomic,
  type SinistroAberturaInput,
  type SinistroCreationResult,
  type SinistroCreationStore,
} from '../modules/sinistro/opening'
import {
  maintainSinistroAtomic,
  type SinistroMaintenanceInput,
  type SinistroMaintenanceResult,
  type SinistroMaintenanceStore,
} from '../modules/sinistro/maintenance'
import {
  executeSinistroOperationalCommandAtomic,
  type SinistroOperationalInput,
  type SinistroOperationalResult,
  type SinistroOperationalStore,
} from '../modules/sinistro/closure'
import {
  createPosVendaAtomic,
  maintainPosVendaAtomic,
  movePosVendaStageAtomic,
  type PosVendaCreateInput,
  type PosVendaCreationResult,
  type PosVendaMaintenanceInput,
  type PosVendaMaintenanceResult,
  type PosVendaStore,
} from '../modules/pos_venda/domain'

export type SinistroInMemoryContext = {
  tenantId: string
  filialId?: string | null
  sessionUserId: string | null
  pipelineId?: string | null
}

export type PosVendaInMemoryContext = {
  tenantId: string
  filialId?: string | null
  sessionUserId: string | null
  pipelineId: string
}

function posVendaStore(): PosVendaStore {
  return {
    apolices: db.apolices as unknown as PosVendaStore['apolices'],
    segurados: db.segurados as unknown as PosVendaStore['segurados'],
    ramos: db.ramos as unknown as PosVendaStore['ramos'],
    pipelines: db.pipelines as unknown as PosVendaStore['pipelines'],
    stages: db.pipeline_stages as unknown as PosVendaStore['stages'],
    profiles: db.profiles as unknown as PosVendaStore['profiles'],
    posVendas: db.pos_vendas as unknown as PosVendaStore['posVendas'],
    atividades: db.atividades as unknown as PosVendaStore['atividades'],
    auditLogs: db.audit_logs as unknown as PosVendaStore['auditLogs'],
  }
}

export function createPosVendaInMemory(
  input: PosVendaCreateInput,
  context: PosVendaInMemoryContext,
): PosVendaCreationResult {
  return createPosVendaAtomic(posVendaStore(), input, { ...context, now: nowIso, newId })
}

export function maintainPosVendaInMemory(
  input: PosVendaMaintenanceInput,
  context: Pick<PosVendaInMemoryContext, 'tenantId' | 'sessionUserId'>,
): PosVendaMaintenanceResult {
  return maintainPosVendaAtomic(posVendaStore(), input, { ...context, now: nowIso, newId })
}

export function movePosVendaStageInMemory(
  input: { id: string; toStageId: string },
  context: Pick<PosVendaInMemoryContext, 'tenantId' | 'sessionUserId'>,
): PosVendaMaintenanceResult {
  return movePosVendaStageAtomic(posVendaStore(), input, { ...context, now: nowIso, newId })
}

/**
 * Único ponto de escrita da abertura de Sinistro no mock. O domínio restaura
 * Sinistro, envolvidos e auditoria se qualquer etapa da operação falhar.
 */
export function createSinistroInMemory(
  input: SinistroAberturaInput,
  context: SinistroInMemoryContext,
): SinistroCreationResult {
  const store: SinistroCreationStore = {
    apolices: db.apolices as unknown as SinistroCreationStore['apolices'],
    apoliceItens: db.apolice_itens as unknown as SinistroCreationStore['apoliceItens'],
    propostas: db.propostas as unknown as SinistroCreationStore['propostas'],
    segurados: db.segurados as unknown as SinistroCreationStore['segurados'],
    pipelines: db.pipelines as unknown as SinistroCreationStore['pipelines'],
    stages: db.pipeline_stages as unknown as SinistroCreationStore['stages'],
    profiles: db.profiles as unknown as SinistroCreationStore['profiles'],
    sinistros: db.sinistros as unknown as SinistroCreationStore['sinistros'],
    envolvidos: db.sinistro_envolvidos as unknown as SinistroCreationStore['envolvidos'],
    auditLogs: db.audit_logs as unknown as SinistroCreationStore['auditLogs'],
  }

  return createSinistroAtomic(store, input, {
    ...context,
    now: nowIso,
    newId,
  })
}

/**
 * Manutenção atômica do Sinistro já persistido. Apólice, status e etapa não
 * fazem parte do comando; envolvidos e auditorias compartilham o mesmo rollback.
 */
export function maintainSinistroInMemory(
  input: SinistroMaintenanceInput,
  context: Pick<SinistroInMemoryContext, 'tenantId' | 'sessionUserId'>,
): SinistroMaintenanceResult {
  const store: SinistroMaintenanceStore = {
    apolices: db.apolices as unknown as SinistroMaintenanceStore['apolices'],
    apoliceItens: db.apolice_itens as unknown as SinistroMaintenanceStore['apoliceItens'],
    profiles: db.profiles as unknown as SinistroMaintenanceStore['profiles'],
    sinistros: db.sinistros as unknown as SinistroMaintenanceStore['sinistros'],
    envolvidos: db.sinistro_envolvidos as unknown as SinistroMaintenanceStore['envolvidos'],
    auditLogs: db.audit_logs as unknown as SinistroMaintenanceStore['auditLogs'],
  }

  return maintainSinistroAtomic(store, input, {
    ...context,
    now: nowIso,
    newId,
  })
}

/**
 * Comandos finais atomicos de Sinistro. A operacao preserva apolice, etapa e
 * envolvidos e restaura o estado completo se a atualizacao ou auditoria falhar.
 */
export function executeSinistroOperationalInMemory(
  input: SinistroOperationalInput,
  context: Pick<SinistroInMemoryContext, 'tenantId' | 'sessionUserId'>,
): SinistroOperationalResult {
  const store: SinistroOperationalStore = {
    sinistros: db.sinistros as unknown as SinistroOperationalStore['sinistros'],
    envolvidos: db.sinistro_envolvidos as unknown as SinistroOperationalStore['envolvidos'],
    auditLogs: db.audit_logs as unknown as SinistroOperationalStore['auditLogs'],
  }

  return executeSinistroOperationalCommandAtomic(store, input, {
    ...context,
    now: nowIso,
    newId,
  })
}

function contractAgendaTables(): ContractAgendaTables {
  return {
    policies: db.apolices as unknown as ContractAgendaTables['policies'],
    proposals: db.propostas as unknown as ContractAgendaTables['proposals'],
    insureds: db.segurados as unknown as ContractAgendaTables['insureds'],
    grades: db.recebimento_grades as unknown as ContractAgendaTables['grades'],
    gradeEvents: db.recebimento_grade_parcelas as unknown as ContractAgendaTables['gradeEvents'],
    transferRules: db.repasse_regras as unknown as ContractAgendaTables['transferRules'],
    installments: db.parcelas as unknown as ContractAgendaTables['installments'],
    commissions: db.comissoes as unknown as ContractAgendaTables['commissions'],
    transfers: db.repasses as unknown as ContractAgendaTables['transfers'],
  };
}

import {
  applyContractAgendaPreview,
  previewContractAgendas,
  type AgendaApplyMode,
  type AgendaApplyResult,
  type ContractAgendaPreview,
  type ContractAgendaTables,
} from './contractAgendaDomain'

/**
 * Materializa os fatos financeiros de um documento uma unica vez.
 * A funcao e compartilhada entre os seeds da Fase 2.5 e a importacao 2.3.
 */
export function materializeDocumentAgendas(
  documentoId: string,
  vencimento: string,
  numeroFatura?: string,
): AgendaMaterializationResult {
  return materializeDocumentAgendasV2(documentoId, vencimento, numeroFatura);
}

export function previewDocumentAgendas(documentId: string, gradeId?: string | null): ContractAgendaPreview {
  return previewContractAgendas(contractAgendaTables(), documentId, gradeId);
}

export function applyDocumentAgendas(documentId: string, gradeId: string, mode: AgendaApplyMode): AgendaApplyResult {
  const snapshots = new Map(['parcelas', 'comissoes', 'repasses', 'audit_logs'].map((table) => [
    table,
    db[table].map((row) => ({ ...row })),
  ]));
  const document = db.propostas.find((row) => row.id === documentId);
  const previousGradeId = document?.recebimento_grade_id ?? null;
  try {
    const preview = previewDocumentAgendas(documentId, gradeId);
    const result = applyContractAgendaPreview(contractAgendaTables(), preview, mode);
    db.audit_logs.push({
      id: newId(), tenant_id: MOCK_TENANT_ID, user_id: MOCK_USER_ID,
      entidade_tipo: 'proposta', entidade_id: documentId, campo: 'agendas_contratuais',
      valor_antigo: previousGradeId, valor_novo: gradeId, acao: 'UPDATE', ocorrido_em: nowIso(),
      origem: 'FRONT_MOCK', ip: null,
      user_agent: `WassisCRM mock · ${mode} · +${result.created.installments}/${result.created.commissions}/${result.created.transfers}`,
    });
    return result;
  } catch (error) {
    snapshots.forEach((rows, table) => db[table].splice(0, db[table].length, ...rows));
    if (document) document.recebimento_grade_id = previousGradeId;
    throw error;
  }
}

function materializeDocumentAgendasV2(
  documentId: string,
  dueDate: string,
  invoiceNumber?: string,
): AgendaMaterializationResult {
  const document = db.propostas.find((row) => row.id === documentId);
  if (!document) return { parcelas: 0, comissoes: 0, repasses: 0 };
  const previous = {
    firstDueDate: document.primeira_parcela_vencimento,
    invoiceNumber: document.numero_fatura,
    quantity: document.qtd_parcelas,
  };
  try {
    document.primeira_parcela_vencimento ??= dueDate;
    document.numero_fatura ??= invoiceNumber ?? null;
    document.qtd_parcelas ??= 1;
    const preview = previewDocumentAgendas(documentId, document.recebimento_grade_id);
    const gradeId = document.recebimento_grade_id ?? (preview.compatibleGrades.length === 1 ? preview.compatibleGrades[0].id : null);
    if (!gradeId) throw new Error(preview.errors[0] ?? 'Selecione uma grade de recebimento compatível.');
    const result = applyDocumentAgendas(documentId, gradeId, 'COMPLETE_MISSING');
    return { parcelas: result.created.installments, comissoes: result.created.commissions, repasses: result.created.transfers };
  } catch (error) {
    document.primeira_parcela_vencimento = previous.firstDueDate;
    document.numero_fatura = previous.invoiceNumber;
    document.qtd_parcelas = previous.quantity;
    throw error;
  }
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
  'apolices.segurados': { target: 'segurados', localFk: 'segurado_id', kind: 'forward' },
  'apolices.seguradoras': { target: 'seguradoras', localFk: 'seguradora_id', kind: 'forward' },
  'apolices.ramos': { target: 'ramos', localFk: 'ramo_id', kind: 'forward' },
  'apolices.produtores': { target: 'produtores', localFk: 'produtor_id', kind: 'forward' },
  'apolices.renovada_de': { target: 'apolices', localFk: 'renovada_de_id', kind: 'forward' },
  'oportunidades.apolice_origem': { target: 'apolices', localFk: 'apolice_origem_id', kind: 'forward' },
  'propostas.apolices': { target: 'apolices', localFk: 'apolice_id', kind: 'forward' },
  'propostas.pipeline_stages': { target: 'pipeline_stages', localFk: 'stage_id', kind: 'forward' },
  'propostas.profiles': { target: 'profiles', localFk: 'responsavel_id', kind: 'forward' },
  'propostas.recebimento_grades': { target: 'recebimento_grades', localFk: 'recebimento_grade_id', kind: 'forward' },
  'propostas.endosso_subtipos': { target: 'endosso_subtipos', localFk: 'endosso_subtipo_id', kind: 'forward' },
  'propostas.cancelamento_motivos': { target: 'cancelamento_motivos', localFk: 'cancelamento_motivo_id', kind: 'forward' },
  'comissao_extratos.tenants': { target: 'tenants', localFk: 'tenant_id', kind: 'forward' },
  'comissao_extratos.filiais': { target: 'filiais', localFk: 'filial_id', kind: 'forward' },
  'comissao_extratos.seguradoras': { target: 'seguradoras', localFk: 'seguradora_id', kind: 'forward' },
  'comissao_extrato_itens.comissao_extratos': { target: 'comissao_extratos', localFk: 'extrato_id', kind: 'forward' },
  'comissao_extrato_itens.produtores': { target: 'produtores', localFk: 'produtor_id', kind: 'forward' },
  'comissao_extrato_itens.ramos': { target: 'ramos', localFk: 'ramo_id', kind: 'forward' },
  'comissao_conciliacoes.comissao_extrato_itens': { target: 'comissao_extrato_itens', localFk: 'item_id', kind: 'forward' },
  'comissao_conciliacoes.comissoes': { target: 'comissoes', localFk: 'comissao_id', kind: 'forward' },
  'comissao_conciliacao_ocorrencias.comissao_extrato_itens': { target: 'comissao_extrato_itens', localFk: 'item_id', kind: 'forward' },
  'comissao_conciliacao_ocorrencias.comissao_conciliacoes': { target: 'comissao_conciliacoes', localFk: 'conciliacao_id', kind: 'forward' },
  'comissao_baixas.comissoes': { target: 'comissoes', localFk: 'comissao_id', kind: 'forward' },
  'comissao_baixas.comissao_baixas': { target: 'comissao_baixas', localFk: 'baixa_origem_id', kind: 'forward' },
  'comissao_baixas.profiles': { target: 'profiles', localFk: 'criado_por_id', kind: 'forward' },
  'comissao_baixa_conciliacoes.comissao_baixas': { target: 'comissao_baixas', localFk: 'baixa_id', kind: 'forward' },
  'comissao_baixa_conciliacoes.comissao_conciliacoes': { target: 'comissao_conciliacoes', localFk: 'conciliacao_id', kind: 'forward' },
  'pos_vendas.apolices': { target: 'apolices', localFk: 'apolice_id', kind: 'forward' },
  'pos_vendas.pipeline_stages': { target: 'pipeline_stages', localFk: 'stage_id', kind: 'forward' },
  'pos_vendas.profiles': { target: 'profiles', localFk: 'responsavel_id', kind: 'forward' },
  'sinistros.apolices': { target: 'apolices', localFk: 'apolice_id', kind: 'forward' },
  'sinistros.pipeline_stages': { target: 'pipeline_stages', localFk: 'stage_id', kind: 'forward' },
  'sinistros.profiles': { target: 'profiles', localFk: 'responsavel_id', kind: 'forward' },
  'sinistro_envolvidos.sinistros': { target: 'sinistros', localFk: 'sinistro_id', kind: 'forward' },
  'sinistro_envolvidos.apolice_itens': { target: 'apolice_itens', localFk: 'apolice_item_id', kind: 'forward' },
  'financeiro_cobrancas.parcelas': { target: 'parcelas', localFk: 'parcela_id', kind: 'forward' },
  'financeiro_cobrancas.pipeline_stages': { target: 'pipeline_stages', localFk: 'stage_id', kind: 'forward' },
  'financeiro_cobrancas.profiles': { target: 'profiles', localFk: 'responsavel_id', kind: 'forward' },
  'recebimento_grades.seguradoras': { target: 'seguradoras', localFk: 'seguradora_id', kind: 'forward' },
  'recebimento_grades.ramos': { target: 'ramos', localFk: 'ramo_id', kind: 'forward' },
  'recebimento_grade_parcelas.recebimento_grades': { target: 'recebimento_grades', localFk: 'grade_id', kind: 'forward' },
  'repasse_regras.filiais': { target: 'filiais', localFk: 'filial_id', kind: 'forward' },
  'repasse_regras.produtores': { target: 'produtores', localFk: 'produtor_id', kind: 'forward' },
  'repasse_regras.ramos': { target: 'ramos', localFk: 'ramo_id', kind: 'forward' },
  'campo_definicoes.filiais': { target: 'filiais', localFk: 'filial_id', kind: 'forward' },
  'campo_opcoes.campo_definicoes': { target: 'campo_definicoes', localFk: 'campo_definicao_id', kind: 'forward' },
  'campo_valores.campo_definicoes': { target: 'campo_definicoes', localFk: 'campo_definicao_id', kind: 'forward' },
  'campo_valores.campo_opcoes': { target: 'campo_opcoes', localFk: 'valor_opcao_id', kind: 'forward' },
  'campo_valor_opcoes.campo_valores': { target: 'campo_valores', localFk: 'campo_valor_id', kind: 'forward' },
  'campo_valor_opcoes.campo_opcoes': { target: 'campo_opcoes', localFk: 'campo_opcao_id', kind: 'forward' },
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
  'apolices.propostas': { target: 'propostas', childFk: 'apolice_id', kind: 'reverse' },
  'apolices.apolice_itens': { target: 'apolice_itens', childFk: 'apolice_id', kind: 'reverse' },
  'sinistros.sinistro_envolvidos': { target: 'sinistro_envolvidos', childFk: 'sinistro_id', kind: 'reverse' },
  'apolice_itens.apolices': { target: 'apolices', localFk: 'apolice_id', kind: 'forward' },
  'apolice_itens.proposta_inclusao': { target: 'propostas', localFk: 'incluido_por_proposta_id', kind: 'forward' },
  'apolice_itens.proposta_exclusao': { target: 'propostas', localFk: 'excluido_por_proposta_id', kind: 'forward' },
  'item_coberturas.apolice_itens': { target: 'apolice_itens', localFk: 'apolice_item_id', kind: 'forward' },
  'item_coberturas.coberturas_catalogo': { target: 'coberturas_catalogo', localFk: 'cobertura_id', kind: 'forward' },
  'item_veiculo.apolice_itens': { target: 'apolice_itens', localFk: 'apolice_item_id', kind: 'forward' },
  'item_imovel.apolice_itens': { target: 'apolice_itens', localFk: 'apolice_item_id', kind: 'forward' },
  'item_empresa.apolice_itens': { target: 'apolice_itens', localFk: 'apolice_item_id', kind: 'forward' },
  'item_vida.apolice_itens': { target: 'apolice_itens', localFk: 'apolice_item_id', kind: 'forward' },
  'parcelas.propostas': { target: 'propostas', localFk: 'proposta_id', kind: 'forward' },
  'comissoes.propostas': { target: 'propostas', localFk: 'proposta_id', kind: 'forward' },
  'comissoes.parcelas': { target: 'parcelas', localFk: 'parcela_id', kind: 'forward' },
  'repasses.propostas': { target: 'propostas', localFk: 'proposta_id', kind: 'forward' },
  'repasses.comissoes': { target: 'comissoes', localFk: 'comissao_id', kind: 'forward' },
  'repasses.produtores': { target: 'produtores', localFk: 'beneficiario_id', kind: 'forward' },
  'repasses.repasse_regras': { target: 'repasse_regras', localFk: 'regra_id', kind: 'forward' },
  'repasse_recibos.filiais': { target: 'filiais', localFk: 'filial_id', kind: 'forward' },
  'repasse_recibos.produtores': { target: 'produtores', localFk: 'beneficiario_id', kind: 'forward' },
  'repasse_recibos.emitido_por': { target: 'profiles', localFk: 'emitido_por_id', kind: 'forward' },
  'repasse_recibos.cancelado_por': { target: 'profiles', localFk: 'cancelado_por_id', kind: 'forward' },
  'repasse_recibo_itens.repasse_recibos': { target: 'repasse_recibos', localFk: 'recibo_id', kind: 'forward' },
  'repasse_recibo_itens.repasses': { target: 'repasses', localFk: 'repasse_id', kind: 'forward' },
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
  db.profiles.push({
    id: 'mock-user-renato',
    full_name: 'Renato Assis',
    avatar_url: null,
    tenant_id: MOCK_TENANT_ID,
    email: 'renato@wassis.com',
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
  const SEGURADO_DEMO_ID = 'mock-segurado-joao';
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

  db.segurados.push({
    id: SEGURADO_DEMO_ID,
    tenant_id: MOCK_TENANT_ID,
    filial_id: MATRIZ_ID,
    tipo: 'PF',
    nome: 'João Almeida',
    nome_fantasia: null,
    cpf_cnpj: '12345678909',
    email: 'joao.almeida@example.com',
    telefone: '11987654321',
    data_nascimento: '1985-04-12',
    sexo: 'M',
    estado_civil: 'Casado',
    porte: null,
    cnae: null,
    site: null,
    chatwoot_id: null,
    lgpd_autorizado: true,
    status: 'Ativo',
    produtor_id: PRODUTOR_INTERNO_ID,
    gerente_id: PRODUTOR_INTERNO_ID,
    logradouro: 'Rua das Acácias',
    endereco: 'Rua das Acácias',
    numero: '120',
    complemento: 'Apto 42',
    bairro: 'Jardim Paulista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01415000',
    observacoes: 'Cadastro demo para validação das guias transversais.',
    created_by: MOCK_USER_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  const tarefaPendenteId = newId();
  const tarefaConcluidaId = newId();
  const notaFixadaId = newId();
  db.atividades.push(
    {
      id: tarefaPendenteId,
      tenant_id: MOCK_TENANT_ID,
      filial_id: MATRIZ_ID,
      responsavel_id: MOCK_USER_ID,
      entidade_tipo: 'segurado',
      entidade_id: SEGURADO_DEMO_ID,
      tipo: 'tarefa',
      titulo: 'Conferir documentação da renovação',
      descricao: 'Confirmar CNH e comprovante de residência antes da próxima cotação.',
      status: 'pendente',
      prioridade: 'alta',
      vencimento: '2026-07-15',
      concluida_em: null,
      fixada_em: null,
      canal: null,
      origem: 'mock',
      lembrete_em: null,
      recorrente: false,
      observacoes: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: tarefaConcluidaId,
      tenant_id: MOCK_TENANT_ID,
      filial_id: MATRIZ_ID,
      responsavel_id: MOCK_USER_ID,
      entidade_tipo: 'segurado',
      entidade_id: SEGURADO_DEMO_ID,
      tipo: 'followup',
      titulo: 'Retorno sobre proposta de saúde',
      descricao: null,
      status: 'concluida',
      prioridade: 'media',
      vencimento: '2026-07-05',
      concluida_em: nowIso(),
      fixada_em: null,
      canal: 'whatsapp',
      origem: 'mock',
      lembrete_em: null,
      recorrente: false,
      observacoes: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: notaFixadaId,
      tenant_id: MOCK_TENANT_ID,
      filial_id: MATRIZ_ID,
      responsavel_id: MOCK_USER_ID,
      entidade_tipo: 'segurado',
      entidade_id: SEGURADO_DEMO_ID,
      tipo: 'nota',
      titulo: 'Preferência de contato',
      descricao: 'Prefere atendimento por WhatsApp após 17h. Mencionar @Dev em renovações de saúde.',
      status: 'concluida',
      prioridade: 'baixa',
      vencimento: null,
      concluida_em: nowIso(),
      fixada_em: nowIso(),
      canal: 'whatsapp',
      origem: 'mock',
      lembrete_em: null,
      recorrente: false,
      observacoes: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  );
  db.atividade_mencoes.push({
    id: newId(),
    atividade_id: notaFixadaId,
    profile_id: MOCK_USER_ID,
    lida_em: null,
    notificada_em: nowIso(),
  });
  db.atividade_mencoes.push({
    id: newId(),
    atividade_id: notaFixadaId,
    profile_id: 'mock-user-renato',
    lida_em: nowIso(),
    notificada_em: nowIso(),
  });
  db.anexos.push({
    id: newId(),
    tenant_id: MOCK_TENANT_ID,
    filial_id: MATRIZ_ID,
    entidade_tipo: 'segurado',
    entidade_id: SEGURADO_DEMO_ID,
    nome_arquivo: 'documentos-renovacao.pdf',
    mime_type: 'application/pdf',
    tamanho_bytes: 245_760,
    url_armazenamento: null,
    categoria: 'documento',
    descricao: 'Metadado demo, sem upload real no front.',
    origem: 'mock',
    status: 'ativo',
    hash_sha256: null,
    anexado_em: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  db.audit_logs.push(
    {
      id: newId(),
      tenant_id: MOCK_TENANT_ID,
      user_id: MOCK_USER_ID,
      entidade_tipo: 'segurado',
      entidade_id: SEGURADO_DEMO_ID,
      campo: 'telefone',
      valor_antigo: '11911112222',
      valor_novo: '11987654321',
      acao: 'UPDATE',
      ocorrido_em: nowIso(),
      origem: 'MOCK_SEED',
      ip: null,
      user_agent: 'mock',
    },
    {
      id: newId(),
      tenant_id: MOCK_TENANT_ID,
      user_id: MOCK_USER_ID,
      entidade_tipo: 'segurado',
      entidade_id: SEGURADO_DEMO_ID,
      campo: 'status',
      valor_antigo: 'Prospecto',
      valor_novo: 'Ativo',
      acao: 'UPDATE',
      ocorrido_em: nowIso(),
      origem: 'MOCK_SEED',
      ip: null,
      user_agent: 'mock',
    },
  );

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
  const portoFrotaGradeId = newId();
  const sulamericaSaudeGradeId = newId();
  const sulamericaSaudeAgenciamentoGradeId = newId();
  const portoId = seguradoraIds['Porto Seguro'];
  const sulamericaId = seguradoraIds['SulAmérica'];
  const automovelId = ramoIds['Automóvel'];
  const frotaId = ramoIds.Frota;
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
      { numero: 1, tipo_comissao: 'NORMAL', percentual: 50, dias_apos_vencimento: 0 },
      { numero: 2, tipo_comissao: 'NORMAL', percentual: 30, dias_apos_vencimento: 30 },
      { numero: 3, tipo_comissao: 'NORMAL', percentual: 20, dias_apos_vencimento: 60 },
    ].forEach((parcela) => {
      db.recebimento_grade_parcelas.push({
        id: newId(),
        grade_id: portoAutoGradeId,
        numero: parcela.numero,
        tipo_comissao: parcela.tipo_comissao,
        percentual: parcela.percentual,
        percentual_sobre: 'COMISSAO_TOTAL',
        dias_apos_vencimento: parcela.dias_apos_vencimento,
        ativo: true,
      });
    });
  }
  if (portoId && frotaId) {
    db.recebimento_grades.push({
      id: portoFrotaGradeId,
      seguradora_id: portoId,
      ramo_id: frotaId,
      nome: 'Porto Frota - antecipado 3x',
      tipo: 'ANTECIPADO_N',
      qtd_parcelas: 3,
      base_calculo: 'PREMIO_LIQUIDO',
      percentual_default: 20,
      considera_iof: false,
      considera_adicional_fracionamento: false,
      vitalicio: false,
      ativo: true,
      observacoes: 'Comissão antecipada em três eventos para apólices de frota.',
    });
    [
      { numero: 1, percentual: 50, dias_apos_vencimento: 0 },
      { numero: 2, percentual: 30, dias_apos_vencimento: 30 },
      { numero: 3, percentual: 20, dias_apos_vencimento: 60 },
    ].forEach((event) => db.recebimento_grade_parcelas.push({
      id: newId(), grade_id: portoFrotaGradeId, numero: event.numero,
      tipo_comissao: 'NORMAL', percentual: event.percentual,
      percentual_sobre: 'COMISSAO_TOTAL', dias_apos_vencimento: event.dias_apos_vencimento, ativo: true,
    }));
  }
  if (sulamericaId && saudeId) {
    db.recebimento_grades.push({
      id: sulamericaSaudeAgenciamentoGradeId,
      seguradora_id: sulamericaId,
      ramo_id: saudeId,
      nome: 'SulAmérica Saúde - 300% + vitalício',
      tipo: 'VITALICIO_PCT_PROPOSTA',
      qtd_parcelas: 4,
      base_calculo: 'PREMIO_TOTAL',
      percentual_default: null,
      considera_iof: false,
      considera_adicional_fracionamento: true,
      vitalicio: true,
      ativo: true,
      observacoes: 'Três eventos de agenciamento e continuidade pelo percentual da proposta.',
    });
    [
      { numero: 1, tipo_comissao: 'AGENCIAMENTO', percentual: 100, dias_apos_vencimento: 0 },
      { numero: 2, tipo_comissao: 'AGENCIAMENTO', percentual: 100, dias_apos_vencimento: 30 },
      { numero: 3, tipo_comissao: 'AGENCIAMENTO', percentual: 100, dias_apos_vencimento: 60 },
      { numero: 4, tipo_comissao: 'VITALICIA', percentual: null, dias_apos_vencimento: 90 },
    ].forEach((parcela) => db.recebimento_grade_parcelas.push({
      id: newId(),
      grade_id: sulamericaSaudeAgenciamentoGradeId,
      numero: parcela.numero,
      tipo_comissao: parcela.tipo_comissao,
      percentual: parcela.percentual,
      percentual_sobre: 'PREMIO',
      dias_apos_vencimento: parcela.dias_apos_vencimento,
      ativo: true,
    }));
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
      tipo_comissao: 'VITALICIA',
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
        { nome: 'Recusada', cor: 'bg-red-400', perda: true },
      ],
    },
    {
      entidade_tipo: 'pos_venda',
      nome: 'Pós-venda · Onboarding',
      ordem: 30,
      stages: [
        { nome: 'A iniciar', cor: 'bg-slate-400' },
        { nome: 'Em andamento', cor: 'bg-blue-400' },
        { nome: 'Orientação concluída', cor: 'bg-emerald-400', sucesso: true },
      ],
    },
    {
      entidade_tipo: 'pos_venda',
      nome: 'Pós-venda · Acompanhamento mensal',
      ordem: 35,
      stages: [
        { nome: 'Planejado', cor: 'bg-slate-400' },
        { nome: 'Em contato', cor: 'bg-blue-400' },
        { nome: 'Acompanhado', cor: 'bg-emerald-400', sucesso: true },
      ],
    },
    {
      entidade_tipo: 'cobranca',
      nome: 'Cobranças securitárias',
      ordem: 40,
      stages: [
        { nome: 'Nova', cor: 'bg-slate-400' },
        { nome: 'Em contato', cor: 'bg-blue-400' },
        { nome: 'Promessa de pagamento', cor: 'bg-amber-400' },
        { nome: 'Acompanhamento final', cor: 'bg-emerald-400' },
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

  const propostaStageId = (nome: string) =>
    db.pipeline_stages.find((stage) => stage.nome === nome &&
      db.pipelines.some((pipeline) => pipeline.id === stage.pipeline_id && pipeline.entidade_tipo === 'proposta'))?.id;
  const emitidaStageId = propostaStageId('Emitida');
  const aguardandoStageId = propostaStageId('Aguardando proposta');
  const analiseStageId = propostaStageId('Em análise');
  const recusadaStageId = propostaStageId('Recusada');
  const sinistroAvisoStageId = db.pipeline_stages.find((stage) => stage.nome === 'Aviso' &&
    db.pipelines.some((pipeline) => pipeline.id === stage.pipeline_id && pipeline.entidade_tipo === 'sinistro'))?.id;
  const onboardingPipeline = db.pipelines.find((pipeline) =>
    pipeline.entidade_tipo === 'pos_venda' && pipeline.nome === 'Pós-venda · Onboarding');
  const monthlyPipeline = db.pipelines.find((pipeline) =>
    pipeline.entidade_tipo === 'pos_venda' && pipeline.nome === 'Pós-venda · Acompanhamento mensal');
  const onboardingStageId = db.pipeline_stages.find((stage) =>
    stage.pipeline_id === onboardingPipeline?.id && stage.nome === 'A iniciar')?.id;
  const monthlyStageId = db.pipeline_stages.find((stage) =>
    stage.pipeline_id === monthlyPipeline?.id && stage.nome === 'Planejado')?.id;

  if (!emitidaStageId || !aguardandoStageId || !analiseStageId || !recusadaStageId ||
      !sinistroAvisoStageId || !onboardingStageId || !monthlyStageId) return;

  const demoSegurados = [
    { id: 'mock-segurado-viaforte', nome: 'Viaforte Logística Ltda', tipo: 'PJ', cpf_cnpj: '12345678000110', cidade: 'São Paulo', estado: 'SP', email: 'seguros@viaforte.com.br', telefone: '1130550198' },
    { id: 'mock-segurado-aurora', nome: 'Aurora Tecnologia Ltda', tipo: 'PJ', cpf_cnpj: '23456789000120', cidade: 'Campinas', estado: 'SP', email: 'financeiro@auroratec.com.br', telefone: '1932517788' },
    { id: 'mock-segurado-camila', nome: 'Camila Ferreira', tipo: 'PF', cpf_cnpj: '23456789012', cidade: 'São Paulo', estado: 'SP', email: 'camila.ferreira@example.com', telefone: '11987654320' },
    { id: 'mock-segurado-padaria', nome: 'Padaria Pão Dourado Ltda', tipo: 'PJ', cpf_cnpj: '34567890000130', cidade: 'Osasco', estado: 'SP', email: 'contato@paodourado.com.br', telefone: '1136992200' },
    { id: 'mock-segurado-lumina', nome: 'Lumina Comércio Ltda', tipo: 'PJ', cpf_cnpj: '45678901000140', cidade: 'Santos', estado: 'SP', email: 'administrativo@lumina.com.br', telefone: '1332214400' },
    { id: 'mock-segurado-mariana', nome: 'Mariana Costa', tipo: 'PF', cpf_cnpj: '34567890123', cidade: 'São Paulo', estado: 'SP', email: 'mariana.costa@example.com', telefone: '11981234567' },
    { id: 'mock-segurado-oficina-horizonte', nome: 'Oficina Horizonte Ltda', tipo: 'PJ', cpf_cnpj: '56789012000150', cidade: 'Guarulhos', estado: 'SP', email: 'administrativo@oficinahorizonte.com.br', telefone: '1124098800' },
    { id: 'mock-segurado-rafael', nome: 'Rafael Mendes', tipo: 'PF', cpf_cnpj: '45678901234', cidade: 'Campinas', estado: 'SP', email: 'rafael.mendes@example.com', telefone: '19992345678' },
    { id: 'mock-segurado-condominio', nome: 'Condomínio Jardim das Águas', tipo: 'PJ', cpf_cnpj: '67890123000160', cidade: 'Jundiaí', estado: 'SP', email: 'sindico@jardimdasaguas.com.br', telefone: '1145216600' },
  ];
  demoSegurados.forEach((segurado) => db.segurados.push({
    ...segurado,
    tenant_id: MOCK_TENANT_ID,
    filial_id: MATRIZ_ID,
    status: 'Ativo',
    produtor_id: PRODUTOR_INTERNO_ID,
    gerente_id: PRODUTOR_INTERNO_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  const policies = [
    {
      id: 'mock-apolice-viaforte', segurado_id: 'mock-segurado-viaforte', seguradora_id: seguradoraIds['Porto Seguro'],
      ramo_id: ramoIds.Frota, status: 'VIGENTE', numero_apolice: '531820260444005', vigencia_inicio: '2026-06-19',
      vigencia_fim: '2027-06-19', data_emissao: '2026-06-19', premio_total: 1950.74, premio_liquido: 1780.12,
    },
    {
      id: 'mock-apolice-aurora', segurado_id: 'mock-segurado-aurora', seguradora_id: seguradoraIds['SulAmérica'],
      ramo_id: ramoIds['Saúde Empresarial'], status: 'VIGENTE', numero_apolice: 'SAU-2026-00881', vigencia_inicio: '2026-01-01',
      vigencia_fim: '2026-12-31', data_emissao: '2025-12-20', premio_total: 86400, premio_liquido: 81000,
      periodicidade_pagamento: 'MENSAL',
    },
    {
      id: 'mock-apolice-joao', segurado_id: SEGURADO_DEMO_ID, seguradora_id: seguradoraIds.Allianz,
      ramo_id: ramoIds['Automóvel'], status: 'EM_EMISSAO', numero_apolice: null, vigencia_inicio: '2026-07-15',
      vigencia_fim: '2027-07-15', premio_total: 2980.44, premio_liquido: 2710.18,
    },
    {
      id: 'mock-apolice-camila', segurado_id: 'mock-segurado-camila', seguradora_id: seguradoraIds['Tokio Marine'],
      ramo_id: ramoIds.Residencial, status: 'EM_EMISSAO', numero_apolice: null, vigencia_inicio: '2026-07-20',
      vigencia_fim: '2027-07-20', premio_total: 860.9, premio_liquido: 790.2,
    },
    {
      id: 'mock-apolice-padaria', segurado_id: 'mock-segurado-padaria', seguradora_id: seguradoraIds['Bradesco Seguros'],
      ramo_id: ramoIds.Empresarial, status: 'EM_EMISSAO', numero_apolice: null, vigencia_inicio: '2026-08-01',
      vigencia_fim: '2027-08-01', premio_total: 5230, premio_liquido: 4800,
    },
    {
      id: 'mock-apolice-mariana', segurado_id: 'mock-segurado-mariana', seguradora_id: seguradoraIds['Tokio Marine'],
      ramo_id: ramoIds.Residencial, status: 'VIGENTE', numero_apolice: 'RES-2025-071922', vigencia_inicio: '2025-07-22',
      vigencia_fim: '2026-07-22', data_emissao: '2025-07-18', premio_total: 742.8, premio_liquido: 681.35,
    },
    {
      id: 'mock-apolice-mariana-renovacao', segurado_id: 'mock-segurado-mariana', seguradora_id: seguradoraIds['Tokio Marine'],
      ramo_id: ramoIds.Residencial, status: 'EM_EMISSAO', numero_apolice: null, vigencia_inicio: '2026-07-23',
      vigencia_fim: '2027-07-23', premio_total: 814.6, premio_liquido: 748.25, renovada_de_id: 'mock-apolice-mariana',
    },
    {
      id: 'mock-apolice-oficina-horizonte', segurado_id: 'mock-segurado-oficina-horizonte', seguradora_id: seguradoraIds['Bradesco Seguros'],
      ramo_id: ramoIds.Empresarial, status: 'VIGENTE', numero_apolice: 'EMP-2025-080517', vigencia_inicio: '2025-08-05',
      vigencia_fim: '2026-08-05', data_emissao: '2025-08-01', premio_total: 4380, premio_liquido: 4029.6,
    },
    {
      id: 'mock-apolice-rafael', segurado_id: 'mock-segurado-rafael', seguradora_id: seguradoraIds['Porto Seguro'],
      ramo_id: ramoIds['Automóvel'], status: 'VIGENTE', numero_apolice: 'AUTO-2026-031048', vigencia_inicio: '2026-03-10',
      vigencia_fim: '2027-03-10', data_emissao: '2026-03-07', premio_total: 3265.4, premio_liquido: 2978.1,
    },
    {
      id: 'mock-apolice-condominio', segurado_id: 'mock-segurado-condominio', seguradora_id: seguradoraIds.Allianz,
      ramo_id: ramoIds.Residencial, status: 'VIGENTE', numero_apolice: 'RES-2026-041522', vigencia_inicio: '2026-04-15',
      vigencia_fim: '2027-04-15', data_emissao: '2026-04-11', premio_total: 2180.75, premio_liquido: 1999.2,
    },
  ];
  policies.forEach((policy) => db.apolices.push({
    produtor_id: PRODUTOR_INTERNO_ID,
    renovada_de_id: null,
    observacoes: null,
    ...policy,
  }));

  db.pos_vendas.push(
    {
      id: 'mock-pos-venda-onboarding-rafael',
      apolice_id: 'mock-apolice-rafael',
      stage_id: onboardingStageId,
      responsavel_id: MOCK_USER_ID,
      tipo_processo: null,
      status: null,
      prioridade: 'alta',
      assunto: 'Onboarding da Apólice Auto',
      descricao: 'Orientação inicial após a emissão e entrega do contexto contratual.',
      data_abertura: '2026-07-16',
      data_conclusao_prevista: '2026-07-18',
      data_conclusao: null,
      motivo_pendencia: null,
      resultado: null,
      observacoes: 'Apólice e dados mestres permanecem consultados por vínculo.',
    },
    {
      id: 'mock-pos-venda-mensal-aurora',
      apolice_id: 'mock-apolice-aurora',
      stage_id: monthlyStageId,
      responsavel_id: 'mock-user-renato',
      tipo_processo: null,
      status: null,
      prioridade: 'media',
      assunto: 'Acompanhamento mensal de Saúde',
      descricao: 'Contato operacional recorrente do contrato faturável.',
      data_abertura: '2026-07-01',
      data_conclusao_prevista: '2026-08-01',
      data_conclusao: null,
      motivo_pendencia: null,
      resultado: null,
      observacoes: null,
    },
  );
  db.atividades.push(
    {
      id: 'mock-tarefa-pos-venda-onboarding',
      tenant_id: MOCK_TENANT_ID,
      filial_id: MATRIZ_ID,
      responsavel_id: MOCK_USER_ID,
      entidade_tipo: 'pos_venda',
      entidade_id: 'mock-pos-venda-onboarding-rafael',
      tipo: 'tarefa',
      titulo: 'Onboarding do segurado',
      descricao: 'Orientar Rafael Mendes após a emissão da Apólice.',
      status: 'pendente',
      prioridade: 'alta',
      vencimento: '2026-07-18',
      concluida_em: null,
      fixada_em: null,
      canal: null,
      origem: 'pos_venda',
      lembrete_em: null,
      recorrente: false,
      observacoes: null,
    },
    {
      id: 'mock-tarefa-pos-venda-mensal',
      tenant_id: MOCK_TENANT_ID,
      filial_id: MATRIZ_ID,
      responsavel_id: 'mock-user-renato',
      entidade_tipo: 'pos_venda',
      entidade_id: 'mock-pos-venda-mensal-aurora',
      tipo: 'followup',
      titulo: 'Acompanhamento mensal do contrato',
      descricao: 'Realizar acompanhamento mensal do contrato de Aurora Tecnologia Ltda.',
      status: 'pendente',
      prioridade: 'media',
      vencimento: '2026-08-01',
      concluida_em: null,
      fixada_em: null,
      canal: null,
      origem: 'pos_venda',
      lembrete_em: null,
      recorrente: true,
      observacoes: null,
    },
  );
  db.audit_logs.push(
    {
      id: 'mock-audit-pos-venda-onboarding',
      tenant_id: MOCK_TENANT_ID,
      user_id: MOCK_USER_ID,
      entidade_tipo: 'pos_venda',
      entidade_id: 'mock-pos-venda-onboarding-rafael',
      campo: 'apolice_id',
      valor_antigo: null,
      valor_novo: 'mock-apolice-rafael',
      acao: 'INSERT',
      ocorrido_em: nowIso(),
      origem: 'MOCK_SEED',
      ip: null,
      user_agent: 'mock',
    },
    {
      id: 'mock-audit-pos-venda-mensal',
      tenant_id: MOCK_TENANT_ID,
      user_id: 'mock-user-renato',
      entidade_tipo: 'pos_venda',
      entidade_id: 'mock-pos-venda-mensal-aurora',
      campo: 'apolice_id',
      valor_antigo: null,
      valor_novo: 'mock-apolice-aurora',
      acao: 'INSERT',
      ocorrido_em: nowIso(),
      origem: 'MOCK_SEED',
      ip: null,
      user_agent: 'mock',
    },
  );
  db.campo_definicoes.push({
    id: 'mock-campo-pos-venda-canal-preferencial',
    tenant_id: MOCK_TENANT_ID,
    filial_id: null,
    entidade_tipo: 'pos_venda',
    chave: 'canal_preferencial_contato',
    nome: 'Canal preferencial de contato',
    tipo_dado: 'LISTA_UNICA',
    formato: null,
    obrigatorio: false,
    ordem: 10,
    ajuda: 'Canal definido pela corretora para o acompanhamento operacional.',
    min_valor: null,
    max_valor: null,
    tamanho_max: null,
    mascara: null,
    placeholder: null,
    agrupamento: 'Relacionamento',
    visivel_em_listagem: false,
    ativo: true,
  });
  db.campo_opcoes.push(
    { id: 'mock-opcao-pos-venda-whatsapp', campo_definicao_id: 'mock-campo-pos-venda-canal-preferencial', rotulo: 'WhatsApp', valor: 'WHATSAPP', ordem: 10, ativo: true },
    { id: 'mock-opcao-pos-venda-email', campo_definicao_id: 'mock-campo-pos-venda-canal-preferencial', rotulo: 'E-mail', valor: 'EMAIL', ordem: 20, ativo: true },
  );

  db.endosso_subtipos.push(
    { id: 'mock-endosso-alteracao-dados', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Alteração de dados', natureza_canonica: 'ALTERACAO_DADOS', ordem: 5, ativo: true, observacoes: null },
    { id: 'mock-endosso-inclusao-item', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Inclusão de item', natureza_canonica: 'INCLUSAO_ITEM', ordem: 8, ativo: true, observacoes: null },
    { id: 'mock-endosso-substituicao-item', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Substituição de item', natureza_canonica: 'SUBSTITUICAO_ITEM', ordem: 10, ativo: true, observacoes: null },
    { id: 'mock-endosso-alteracao-cobertura', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Alteração de cobertura', natureza_canonica: 'ALTERACAO_COBERTURA', ordem: 20, ativo: true, observacoes: null },
    { id: 'mock-endosso-exclusao-item', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Exclusão de item', natureza_canonica: 'EXCLUSAO_ITEM', ordem: 30, ativo: true, observacoes: null },
    { id: 'mock-endosso-importancia-segurada', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Alteração de importância segurada', natureza_canonica: 'ALTERACAO_IMPORTANCIA_SEGURADA', ordem: 40, ativo: true, observacoes: null },
    { id: 'mock-endosso-alteracao-clausula', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Alteração de cláusula', natureza_canonica: 'ALTERACAO_CLAUSULA', ordem: 50, ativo: true, observacoes: null },
  );
  db.cancelamento_motivos.push(
    { id: 'mock-cancelamento-solicitacao-segurado', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Solicitação do segurado', ordem: 10, ativo: true, observacoes: null },
    { id: 'mock-cancelamento-inadimplencia', tenant_id: MOCK_TENANT_ID, filial_id: null, ramo_id: null, nome: 'Inadimplência', ordem: 20, ativo: true, observacoes: null },
  );

  const documents = [
    {
      id: 'mock-proposta-viaforte-original', apolice_id: 'mock-apolice-viaforte', tipo: 'NOVA', stage_id: emitidaStageId,
      numero_proposta: '1304103126', numero_endosso: '0', data_transmissao: '2026-06-15', data_aceitacao: '2026-06-18',
      data_emissao: '2026-06-19', vigencia_inicio: '2026-06-19', vigencia_fim: '2027-06-19',
      premio_total: 1950.74, premio_liquido: 1780.12, forma_pagamento: 'DÉBITO_EM_CONTA', qtd_parcelas: 5, comissao_pct: 20,
    },
    {
      id: 'mock-proposta-viaforte-endosso-1', apolice_id: 'mock-apolice-viaforte', tipo: 'ENDOSSO', stage_id: recusadaStageId,
      numero_proposta: '1307200101', numero_endosso: '1', data_transmissao: '2026-06-20', data_recusa: '2026-06-21',
      motivo_recusa: 'Documentação incompleta.', tipo_movimento_endosso: 'SUBSTITUICAO_ITEM', endosso_subtipo_id: 'mock-endosso-substituicao-item', vigencia_inicio: '2026-06-22',
    },
    {
      id: 'mock-proposta-viaforte-endosso-2', apolice_id: 'mock-apolice-viaforte', tipo: 'ENDOSSO', stage_id: analiseStageId,
      numero_proposta: '1308116912', numero_endosso: '2', data_transmissao: '2026-07-10',
      tipo_movimento_endosso: 'SUBSTITUICAO_ITEM', endosso_subtipo_id: 'mock-endosso-substituicao-item', vigencia_inicio: '2026-07-15', premio_total: -120.4, premio_liquido: -110.25,
    },
    {
      id: 'mock-proposta-viaforte-endosso-3', apolice_id: 'mock-apolice-viaforte', tipo: 'ENDOSSO', stage_id: emitidaStageId,
      numero_proposta: '1308222201', numero_endosso: '3', data_transmissao: '2026-07-01', data_aceitacao: '2026-07-03',
      data_emissao: '2026-07-04', tipo_movimento_endosso: 'ALTERACAO_COBERTURA', endosso_subtipo_id: 'mock-endosso-alteracao-cobertura',
      vigencia_inicio: '2026-07-05', premio_total: -85.5, premio_liquido: -78.25, forma_pagamento: 'CARTAO', qtd_parcelas: 1,
    },
    {
      id: 'mock-proposta-viaforte-cancelamento', apolice_id: 'mock-apolice-viaforte', tipo: 'CANCELAMENTO', stage_id: emitidaStageId,
      numero_proposta: 'CAN-2026-004', data_emissao: '2026-08-01', vigencia_inicio: '2026-08-01',
      cancelamento_motivo_id: 'mock-cancelamento-solicitacao-segurado', premio_total: -975.37, premio_liquido: -890.06,
    },
    {
      id: 'mock-proposta-aurora-original', apolice_id: 'mock-apolice-aurora', tipo: 'NOVA', stage_id: emitidaStageId,
      numero_proposta: 'SAU-000881', data_emissao: '2025-12-20',
      vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', premio_total: 86400, premio_liquido: 81000,
      qtd_parcelas: 12, comissao_pct: 2, agenciamento_pct: 300,
    },
    {
      id: 'mock-proposta-aurora-fatura-maio', apolice_id: 'mock-apolice-aurora', tipo: 'FATURA', stage_id: emitidaStageId,
      numero_fatura: 'FAT-2026-05', data_emissao: '2026-05-02', competencia_inicio: '2026-05-01', competencia_fim: '2026-05-31',
      premio_total: 7200, premio_liquido: 6750, comissao_pct: 2, agenciamento_pct: 0,
    },
    {
      id: 'mock-proposta-aurora-fatura-junho', apolice_id: 'mock-apolice-aurora', tipo: 'FATURA', stage_id: emitidaStageId,
      numero_fatura: 'FAT-2026-06', data_emissao: '2026-06-02', competencia_inicio: '2026-06-01', competencia_fim: '2026-06-30',
      premio_total: 7200, premio_liquido: 6750, comissao_pct: 2, agenciamento_pct: 0,
    },
    {
      id: 'mock-proposta-aurora-fatura-julho', apolice_id: 'mock-apolice-aurora', tipo: 'FATURA', stage_id: aguardandoStageId,
      numero_fatura: 'FAT-2026-07', competencia_inicio: '2026-07-01', competencia_fim: '2026-07-31', premio_total: 7200,
    },
    {
      id: 'mock-proposta-joao', apolice_id: 'mock-apolice-joao', tipo: 'NOVA', stage_id: analiseStageId,
      numero_proposta: 'AUTO-2026-001', data_transmissao: '2026-07-09', vigencia_inicio: '2026-07-15', vigencia_fim: '2027-07-15',
      premio_total: 2980.44, premio_liquido: 2710.18,
    },
    {
      id: 'mock-proposta-camila', apolice_id: 'mock-apolice-camila', tipo: 'NOVA', stage_id: aguardandoStageId,
      numero_proposta: 'RES-2026-014', data_transmissao: '2026-07-11', vigencia_inicio: '2026-07-20', vigencia_fim: '2027-07-20',
      premio_total: 860.9, premio_liquido: 790.2,
    },
    {
      id: 'mock-proposta-padaria', apolice_id: 'mock-apolice-padaria', tipo: 'NOVA', stage_id: aguardandoStageId,
      numero_proposta: 'EMP-2026-091', data_transmissao: '2026-07-11', vigencia_inicio: '2026-08-01', vigencia_fim: '2027-08-01',
      premio_total: 5230, premio_liquido: 4800,
    },
    {
      id: 'mock-proposta-mariana-original', apolice_id: 'mock-apolice-mariana', tipo: 'NOVA', stage_id: emitidaStageId,
      numero_proposta: 'RES-2025-18842', data_transmissao: '2025-07-15', data_aceitacao: '2025-07-17', data_emissao: '2025-07-18',
      vigencia_inicio: '2025-07-22', vigencia_fim: '2026-07-22', premio_total: 742.8, premio_liquido: 681.35,
      forma_pagamento: 'CARTAO', qtd_parcelas: 4, comissao_pct: 20,
    },
    {
      id: 'mock-proposta-mariana-renovacao', apolice_id: 'mock-apolice-mariana-renovacao', tipo: 'RENOVACAO', stage_id: aguardandoStageId,
      numero_proposta: 'REN-2026-00419', data_transmissao: '2026-07-12', vigencia_inicio: '2026-07-23', vigencia_fim: '2027-07-23',
      premio_total: 814.6, premio_liquido: 748.25, forma_pagamento: 'CARTAO', qtd_parcelas: 4, comissao_pct: 20,
    },
    {
      id: 'mock-proposta-oficina-horizonte', apolice_id: 'mock-apolice-oficina-horizonte', tipo: 'NOVA', stage_id: emitidaStageId,
      numero_proposta: 'EMP-2025-77218', data_transmissao: '2025-07-28', data_aceitacao: '2025-07-31', data_emissao: '2025-08-01',
      vigencia_inicio: '2025-08-05', vigencia_fim: '2026-08-05', premio_total: 4380, premio_liquido: 4029.6,
      forma_pagamento: 'BOLETO', qtd_parcelas: 6, comissao_pct: 18,
    },
    {
      id: 'mock-proposta-rafael', apolice_id: 'mock-apolice-rafael', tipo: 'NOVA', stage_id: emitidaStageId,
      numero_proposta: 'AUTO-2026-30481', data_transmissao: '2026-03-03', data_aceitacao: '2026-03-06', data_emissao: '2026-03-07',
      vigencia_inicio: '2026-03-10', vigencia_fim: '2027-03-10', premio_total: 3265.4, premio_liquido: 2978.1,
      forma_pagamento: 'DÉBITO_EM_CONTA', qtd_parcelas: 10, primeira_parcela_vencimento: '2026-03-10', comissao_pct: 20,
    },
    {
      id: 'mock-proposta-condominio', apolice_id: 'mock-apolice-condominio', tipo: 'NOVA', stage_id: emitidaStageId,
      numero_proposta: 'RES-2026-41522', data_transmissao: '2026-04-07', data_aceitacao: '2026-04-10', data_emissao: '2026-04-11',
      vigencia_inicio: '2026-04-15', vigencia_fim: '2027-04-15', premio_total: 2180.75, premio_liquido: 1999.2,
      forma_pagamento: 'BOLETO', qtd_parcelas: 5, comissao_pct: 20,
    },
  ];
  documents.forEach((document) => db.propostas.push({
    cotacao_id: null,
    responsavel_id: MOCK_USER_ID,
    recebimento_grade_id: null,
    comissao_pct: null,
    agenciamento_pct: null,
    endosso_subtipo_id: null,
    cancelamento_motivo_id: null,
    observacoes: null,
    ...document,
  }));

  const proposta = (id: string) => db.propostas.find((row) => row.id === id);
  const auroraOriginal = proposta('mock-proposta-aurora-original');
  const auroraMaio = proposta('mock-proposta-aurora-fatura-maio');
  const auroraJunho = proposta('mock-proposta-aurora-fatura-junho');
  const viaforteOriginal = proposta('mock-proposta-viaforte-original');
  if (auroraOriginal) auroraOriginal.recebimento_grade_id = sulamericaSaudeAgenciamentoGradeId;
  if (auroraMaio) auroraMaio.recebimento_grade_id = sulamericaSaudeGradeId;
  if (auroraJunho) auroraJunho.recebimento_grade_id = sulamericaSaudeGradeId;
  if (viaforteOriginal) viaforteOriginal.recebimento_grade_id = portoFrotaGradeId;

  const saudeCoberturaIds = ['consultas', 'internacoes'].map((codigo, index) => {
    const id = `mock-cobertura-saude-${codigo}`;
    db.coberturas_catalogo.push({ id, ramo_id: saudeId, codigo, nome: index === 0 ? 'Consultas e exames' : 'Internações hospitalares', tipo_cobertura: index === 0 ? 'basica' : 'adicional', ativo: true, ordem: (index + 1) * 10 });
    return id;
  });
  const autoCoberturaIds = db.coberturas_catalogo.filter((row) => row.ramo_id === automovelId).map((row) => row.id as string);
  const residencialCoberturaIds = db.coberturas_catalogo.filter((row) => row.ramo_id === ramoIds.Residencial).map((row) => row.id as string);

  const itens = [
    { id: 'mock-item-viaforte-1', apolice_id: 'mock-apolice-viaforte', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-viaforte-original', excluido_por_proposta_id: 'mock-proposta-viaforte-endosso-2', numero_item: 1, descricao: 'Ford Ka SE 1.0', identificador_externo: 'QAA1A23', valor_risco: 48500, status: 'historico' },
    { id: 'mock-item-viaforte-2', apolice_id: 'mock-apolice-viaforte', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-viaforte-original', excluido_por_proposta_id: null, numero_item: 2, descricao: 'Volkswagen Delivery 11.180', identificador_externo: 'BRA2E19', valor_risco: 238000, status: 'vigente' },
    { id: 'mock-item-viaforte-3', apolice_id: 'mock-apolice-viaforte', risk_type: 'VEICULO', incluido_por_proposta_id: 'mock-proposta-viaforte-endosso-2', excluido_por_proposta_id: null, numero_item: 3, descricao: 'Volkswagen Fox Connect', identificador_externo: 'GHI4J56', valor_risco: 61200, status: 'vigente' },
    { id: 'mock-item-aurora-grupo', apolice_id: 'mock-apolice-aurora', risk_type: 'VIDA', incluido_por_proposta_id: 'mock-proposta-aurora-original', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Colaboradores ativos', identificador_externo: 'GRUPO-001', valor_risco: 2400000, status: 'vigente' },
    { id: 'mock-item-camila-imovel', apolice_id: 'mock-apolice-camila', risk_type: 'IMOVEL', incluido_por_proposta_id: 'mock-proposta-camila', excluido_por_proposta_id: null, numero_item: 1, descricao: 'Residência principal', identificador_externo: '01310-100-84', valor_risco: 650000, status: 'vigente' },
  ];
  itens.forEach((item) => db.apolice_itens.push({ observacoes: null, endereco_risco_resumo: null, ...item }));
  [
    { apolice_item_id: 'mock-item-viaforte-1', marca: 'Ford', modelo: 'Ka', versao: 'SE 1.0', ano_fabricacao: 2020, ano_modelo: 2021, placa: 'QAA1A23', chassi: '9BFZH55L7M8000101', renavam: '01234567891', uso: 'Comercial' },
    { apolice_item_id: 'mock-item-viaforte-2', marca: 'Volkswagen', modelo: 'Delivery', versao: '11.180', ano_fabricacao: 2022, ano_modelo: 2023, placa: 'BRA2E19', chassi: '953658264PR000202', renavam: '01357924680', uso: 'Carga' },
    { apolice_item_id: 'mock-item-viaforte-3', marca: 'Volkswagen', modelo: 'Fox', versao: 'Connect', ano_fabricacao: 2021, ano_modelo: 2022, placa: 'GHI4J56', chassi: '9BWAB45Z9N4000303', renavam: '01468035791', uso: 'Comercial' },
  ].forEach((item) => db.item_veiculo.push(item));
  db.item_vida.push({ apolice_item_id: 'mock-item-aurora-grupo', pessoa_id: null, nome_grupo: 'Colaboradores ativos', n_vidas: 24, capital_individual: 100000, data_inclusao: '2026-01-01' });
  db.item_imovel.push({ apolice_item_id: 'mock-item-camila-imovel', cep: '01310-100', endereco: 'Avenida Paulista', numero: '84', complemento: 'Apto 71', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', tipo_imovel: 'Apartamento', tipo_ocupacao: 'Habitual', area_m2: 92, valor_imovel: 650000 });

  const addCobertura = (id: string, apolice_item_id: string, cobertura_id: string | undefined, capital_lmi: number, premio: number, incluido: string, excluido: string | null = null) => db.item_coberturas.push({ id, apolice_item_id, cobertura_id: cobertura_id ?? null, incluido_por_proposta_id: incluido, excluido_por_proposta_id: excluido, capital_lmi, franquia_valor: null, franquia_tipo: null, premio, premio_liquido: premio, carencia_dias: 0, participacao_obrigatoria_pct: null, vigencia_inicio: null, vigencia_fim: null, observacoes: null });
  addCobertura('mock-cob-via-1-casco', 'mock-item-viaforte-1', autoCoberturaIds[0], 48500, 620, 'mock-proposta-viaforte-original', 'mock-proposta-viaforte-endosso-2');
  addCobertura('mock-cob-via-2-casco', 'mock-item-viaforte-2', autoCoberturaIds[0], 238000, 980, 'mock-proposta-viaforte-original');
  addCobertura('mock-cob-via-3-casco', 'mock-item-viaforte-3', autoCoberturaIds[0], 61200, 690, 'mock-proposta-viaforte-endosso-2');
  addCobertura('mock-cob-aurora-consultas', 'mock-item-aurora-grupo', saudeCoberturaIds[0], 1200000, 3600, 'mock-proposta-aurora-original');
  addCobertura('mock-cob-aurora-internacoes', 'mock-item-aurora-grupo', saudeCoberturaIds[1], 1200000, 3600, 'mock-proposta-aurora-original');
  addCobertura('mock-cob-camila-incendio', 'mock-item-camila-imovel', residencialCoberturaIds[0], 650000, 620, 'mock-proposta-camila');

  const SINISTRO_DEMO_ID = 'mock-sinistro-viaforte';
  db.sinistros.push({
    id: SINISTRO_DEMO_ID,
    apolice_id: 'mock-apolice-viaforte',
    stage_id: sinistroAvisoStageId,
    responsavel_id: MOCK_USER_ID,
    numero_sinistro: '531-2026-004981',
    numero_aviso: 'AVI-2026-00042',
    protocolo_seguradora: 'PORTO-2026-883104',
    cobertura_codigo: 'casco',
    cobertura_nome: 'Casco',
    data_ocorrencia: '2026-07-12',
    data_aviso: '2026-07-13',
    data_registro_aviso: '2026-07-13',
    data_documentacao_completa: null,
    data_liquidacao_financeira: null,
    data_conclusao: null,
    tipo_sinistro: 'administrativo',
    causa: 'Colisão traseira em via urbana',
    descricao: 'Veículo segurado atingiu um automóvel parado durante manobra de baixa velocidade.',
    local_ocorrencia: 'Avenida Paulista, São Paulo/SP',
    status: 'aberto',
    valor_estimado: 18400,
    valor_indenizado: null,
    valor_pendente: 18400,
    valor_despesas_regulacao: null,
    valor_salvado: null,
    data_salvado: null,
    valor_ressarcimento: null,
    data_ressarcimento: null,
    negativa_motivo: null,
    regulador_nome: 'Marcos Vieira',
    oficina_nome: 'Oficina Central Paulista',
    observacoes: 'Aguardando vistoria e documentação complementar do terceiro.',
  });
  db.sinistro_envolvidos.push(
    {
      id: 'mock-sinistro-envolvido-segurado',
      sinistro_id: SINISTRO_DEMO_ID,
      apolice_item_id: 'mock-item-viaforte-2',
      tipo: 'SEGURADO',
      nome: 'Viaforte Logística Ltda',
      cpf_cnpj: '12345678000110',
      email: 'seguros@viaforte.com.br',
      telefone: '1130550198',
      placa: 'BRA2E19',
      seguradora_terceiro: null,
      apolice_terceiro: null,
      tipo_dano: 'Danos materiais no veículo segurado',
      valor_reclamado: 12400,
      valor_indenizado: null,
      responsavel_pelo_evento: true,
      observacoes: 'Item 2 da apólice, vigente na data da ocorrência.',
    },
    {
      id: 'mock-sinistro-envolvido-terceiro',
      sinistro_id: SINISTRO_DEMO_ID,
      apolice_item_id: null,
      tipo: 'TERCEIRO',
      nome: 'Carlos Eduardo Lima',
      cpf_cnpj: '98765432100',
      email: 'carlos.lima@example.com',
      telefone: '11995554433',
      placa: 'DEF7G89',
      seguradora_terceiro: 'Azul Seguros',
      apolice_terceiro: 'AZ-442190-7',
      tipo_dano: 'Danos materiais na traseira do veículo',
      valor_reclamado: 6000,
      valor_indenizado: null,
      responsavel_pelo_evento: false,
      observacoes: 'Terceiro descritivo; não integra o cadastro de segurados.',
    },
  );
  db.atividades.push({
    id: 'mock-tarefa-vistoria-sinistro',
    tenant_id: MOCK_TENANT_ID,
    filial_id: MATRIZ_ID,
    responsavel_id: MOCK_USER_ID,
    entidade_tipo: 'sinistro',
    entidade_id: SINISTRO_DEMO_ID,
    tipo: 'tarefa',
    titulo: 'Acompanhar vistoria do veículo segurado',
    descricao: 'Confirmar data, oficina e laudo da vistoria.',
    status: 'pendente',
    prioridade: 'alta',
    vencimento: '2026-07-17',
    concluida_em: null,
    fixada_em: null,
    canal: null,
    origem: 'mock',
    lembrete_em: null,
    recorrente: false,
    observacoes: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  db.anexos.push({
    id: 'mock-anexo-aviso-sinistro',
    tenant_id: MOCK_TENANT_ID,
    filial_id: MATRIZ_ID,
    entidade_tipo: 'sinistro',
    entidade_id: SINISTRO_DEMO_ID,
    nome_arquivo: 'aviso-sinistro-avi-2026-00042.pdf',
    mime_type: 'application/pdf',
    tamanho_bytes: 186_240,
    url_armazenamento: null,
    categoria: 'aviso',
    descricao: 'Metadado demo do aviso enviado à seguradora.',
    origem: 'mock',
    status: 'ativo',
    hash_sha256: null,
    anexado_em: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  db.audit_logs.push({
    id: 'mock-audit-abertura-sinistro',
    tenant_id: MOCK_TENANT_ID,
    user_id: MOCK_USER_ID,
    entidade_tipo: 'sinistro',
    entidade_id: SINISTRO_DEMO_ID,
    campo: null,
    valor_antigo: null,
    valor_novo: 'aberto',
    acao: 'INSERT',
    ocorrido_em: nowIso(),
    origem: 'MOCK_SEED',
    ip: null,
    user_agent: 'mock',
  });
  db.campo_definicoes.push({
    id: 'mock-campo-sinistro-bo',
    tenant_id: MOCK_TENANT_ID,
    filial_id: null,
    entidade_tipo: 'sinistro',
    chave: 'numero_boletim_ocorrencia',
    nome: 'Número do boletim de ocorrência',
    tipo_dado: 'TEXTO_CURTO',
    formato: null,
    obrigatorio: false,
    ordem: 10,
    ajuda: 'Referência operacional quando houver boletim de ocorrência.',
    min_valor: null,
    max_valor: null,
    tamanho_max: 40,
    mascara: null,
    placeholder: 'Ex.: 2026-004219',
    agrupamento: 'Ocorrência',
    visivel_em_listagem: false,
    ativo: true,
  });
  db.campo_valores.push({
    id: 'mock-campo-valor-sinistro-bo',
    campo_definicao_id: 'mock-campo-sinistro-bo',
    entidade_id: SINISTRO_DEMO_ID,
    valor_texto: '2026-004219',
    valor_numero: null,
    valor_data: null,
    valor_datahora: null,
    valor_booleano: null,
    valor_opcao_id: null,
    preenchido_em: nowIso(),
    validado_em: null,
    origem: 'mock',
  });

  materializeDocumentAgendas('mock-proposta-viaforte-original', '2026-07-10');
  materializeDocumentAgendas('mock-proposta-viaforte-endosso-3', '2026-07-15');
  materializeDocumentAgendas('mock-proposta-viaforte-cancelamento', '2026-08-10');
  materializeDocumentAgendas('mock-proposta-aurora-original', '2026-01-10');
  materializeDocumentAgendas('mock-proposta-aurora-fatura-maio', '2026-05-10', 'FAT-2026-05');
  materializeDocumentAgendas('mock-proposta-aurora-fatura-junho', '2026-06-10', 'FAT-2026-06');
  // Reprocessamento deliberado: o guard por proposta preserva idempotencia.
  materializeDocumentAgendas('mock-proposta-aurora-fatura-junho', '2026-06-10', 'FAT-2026-06');
  // Massa operacional do 3.5: a baixa de comissão é o gatilho contratual que
  // torna repasses elegíveis; o pagamento continua dependendo de recibo.
  db.repasses.slice(0, 5).forEach((row, index) => Object.assign(row, {
    status: 'LIBERADO',
    liberado_em: index < 3 ? '2026-07-15' : '2026-07-16',
  }));
  // Prova estrutural do contrato 3.2: conciliar não altera nem baixa a comissão.
  const commissionForStatement = db.comissoes.find((row) => row.proposta_id === 'mock-proposta-viaforte-original');
  const policyForStatement = db.apolices.find((row) => row.id === 'mock-apolice-viaforte');
  const insuredForStatement = db.segurados.find((row) => row.id === policyForStatement?.segurado_id);
  if (commissionForStatement && policyForStatement?.seguradora_id && insuredForStatement?.filial_id) {
    const expectedValue = Number(commissionForStatement.valor_previsto ?? 0);
    db.comissao_extratos.push({
      id: 'mock-extrato-comissao-porto-jul-2026', tenant_id: MOCK_TENANT_ID,
      filial_id: insuredForStatement.filial_id, seguradora_id: policyForStatement.seguradora_id,
      identificacao_externa: 'EXT-PORTO-2026-07', competencia: '2026-07-01',
      periodo_inicio: '2026-07-01', periodo_fim: '2026-07-31', data_emissao: '2026-07-11',
      data_recebimento: '2026-07-12', arquivo_nome: 'extrato-porto-julho-2026.pdf',
      arquivo_referencia: 'mock://extratos/extrato-porto-julho-2026.pdf', origem_tipo: 'ARQUIVO',
      origem_formato: 'PDF', arquivo_mime_type: 'application/pdf',
      arquivo_hash_sha256: 'mock-sha256-extrato-porto-julho-2026',
      chave_idempotencia: `${insuredForStatement.filial_id}|${policyForStatement.seguradora_id}|mock-sha256-extrato-porto-julho-2026`,
      parser_identificador: null, parser_versao: null, tentativa_processamento: 1,
      status_processamento: 'NORMALIZADO', status_conciliacao: 'COM_OCORRENCIAS',
      quantidade_itens: 2, valor_bruto_total: expectedValue + 37.5,
      valor_liquido_total: expectedValue + 37.5, valor_descontos_total: 0, moeda: 'BRL',
      erro_codigo: null, erro_mensagem_segura: null, recebido_por_id: MOCK_USER_ID,
      processado_por_id: MOCK_USER_ID, recebido_em: '2026-07-12T12:00:00.000Z',
      processamento_iniciado_em: '2026-07-12T12:01:00.000Z',
      processamento_concluido_em: '2026-07-12T12:01:02.000Z',
      criado_em: '2026-07-12T12:00:00.000Z', atualizado_em: '2026-07-12T12:01:02.000Z',
      observacoes: 'Massa minima do contrato 3.2; sem leitura ou baixa funcional.',
    });
    db.comissao_extrato_itens.push(
      {
        id: 'mock-extrato-item-conciliado', extrato_id: 'mock-extrato-comissao-porto-jul-2026',
        identificacao_externa: 'PORTO-LINHA-001', sequencia_externa: '1',
        chave_idempotencia: 'mock-extrato-comissao-porto-jul-2026|PORTO-LINHA-001',
        produtor_id: null, ramo_id: policyForStatement.ramo_id ?? null,
        produtor_beneficiario_informado: null, proposta_numero_informado: 'FROTA-2026-00991',
        apolice_numero_informado: policyForStatement.numero_apolice ?? null,
        endosso_numero_informado: null, documento_numero_informado: 'FROTA-2026-00991',
        parcela_numero_informado: String(commissionForStatement.numero ?? 1),
        segurado_nome_informado: insuredForStatement.nome ?? null, competencia: '2026-07-01',
        data_credito: '2026-07-11', data_recebimento_informada: '2026-07-11',
        valor_bruto_informado: expectedValue, valor_liquido_informado: expectedValue,
        valor_descontos_informado: 0, percentual_informado: commissionForStatement.percentual ?? null,
        tipo_comissao: commissionForStatement.tipo_comissao ?? null, seguradora_lote_informado: 'LOTE-0711',
        seguradora_referencia_informada: 'PORTO-REF-001', descricao_original: 'Comissao apolice frota',
        status_conciliacao: 'CONCILIADO', normalizado_em: '2026-07-12T12:01:01.000Z',
        criado_em: '2026-07-12T12:01:01.000Z', atualizado_em: '2026-07-12T12:01:02.000Z',
      },
      {
        id: 'mock-extrato-item-nao-encontrado', extrato_id: 'mock-extrato-comissao-porto-jul-2026',
        identificacao_externa: 'PORTO-LINHA-002', sequencia_externa: '2',
        chave_idempotencia: 'mock-extrato-comissao-porto-jul-2026|PORTO-LINHA-002',
        produtor_id: null, ramo_id: null, produtor_beneficiario_informado: null,
        proposta_numero_informado: null, apolice_numero_informado: 'NAO-CADASTRADA-999',
        endosso_numero_informado: null, documento_numero_informado: 'NAO-CADASTRADA-999',
        parcela_numero_informado: '1', segurado_nome_informado: 'Segurado não localizado',
        competencia: '2026-07-01', data_credito: '2026-07-11',
        data_recebimento_informada: '2026-07-11', valor_bruto_informado: 37.5,
        valor_liquido_informado: 37.5, valor_descontos_informado: 0,
        percentual_informado: null, tipo_comissao: 'NORMAL', seguradora_lote_informado: 'LOTE-0711',
        seguradora_referencia_informada: 'PORTO-REF-002', descricao_original: 'Documento não localizado',
        status_conciliacao: 'NAO_ENCONTRADO', normalizado_em: '2026-07-12T12:01:01.000Z',
        criado_em: '2026-07-12T12:01:01.000Z', atualizado_em: '2026-07-12T12:01:02.000Z',
      },
    );
    db.comissao_conciliacoes.push({
      id: 'mock-conciliacao-exata', item_id: 'mock-extrato-item-conciliado',
      comissao_id: commissionForStatement.id,
      chave_idempotencia: `mock-extrato-item-conciliado|${commissionForStatement.id}`,
      tipo_associacao: 'EXATA', status: 'CONFIRMADA', confianca_pct: 100,
      valor_previsto_snapshot: expectedValue, valor_informado_alocado: expectedValue,
      valor_conciliado: expectedValue, valor_diferenca: 0,
      percentual_previsto_snapshot: commissionForStatement.percentual ?? null,
      percentual_informado_snapshot: commissionForStatement.percentual ?? null,
      percentual_diferenca: 0, competencia_prevista_inicio: commissionForStatement.competencia_inicio ?? null,
      competencia_prevista_fim: commissionForStatement.competencia_fim ?? null,
      competencia_informada: '2026-07-01', motivo: null, associado_por_id: MOCK_USER_ID,
      confirmado_por_id: MOCK_USER_ID, criado_em: '2026-07-12T12:01:02.000Z',
      confirmado_em: '2026-07-12T12:01:02.000Z', atualizado_em: '2026-07-12T12:01:02.000Z',
    });
    db.comissao_conciliacao_ocorrencias.push({
      id: 'mock-ocorrencia-documento-nao-encontrado', item_id: 'mock-extrato-item-nao-encontrado',
      conciliacao_id: null, tipo: 'DOCUMENTO_NAO_ENCONTRADO', status: 'ABERTA',
      motivo: 'Nenhuma comissao elegivel foi encontrada para o documento informado.',
      valor_esperado: null, valor_encontrado: 37.5, percentual_esperado: null,
      percentual_encontrado: null, competencia_esperada_inicio: null,
      competencia_esperada_fim: null, competencia_encontrada: '2026-07-01',
      resolucao_tipo: null, resolucao_observacao: null, identificada_por_id: MOCK_USER_ID,
      resolvida_por_id: null, identificada_em: '2026-07-12T12:01:02.000Z',
      resolvida_em: null, atualizado_em: '2026-07-12T12:01:02.000Z',
    });
  }
  // Estados operacionais da Fase 3.1 sobre fatos previamente materializados.
  const viafortePaid = db.parcelas.find((row) => row.proposta_id === 'mock-proposta-viaforte-original' && row.numero === 1);
  if (viafortePaid) Object.assign(viafortePaid, {
    status: 'paga', data_pagamento: '2026-07-10', data_baixa: '2026-07-10', valor_pago: viafortePaid.valor,
  });
  const auroraCancelled = db.parcelas.find((row) => row.proposta_id === 'mock-proposta-aurora-original' && row.numero === 11);
  if (auroraCancelled) Object.assign(auroraCancelled, { status: 'cancelada' });
  const auroraReversed = db.parcelas.find((row) => row.proposta_id === 'mock-proposta-aurora-original' && row.numero === 12);
  if (auroraReversed) Object.assign(auroraReversed, { status: 'estornada' });
  db.parcelas.filter((row) => Number(row.valor) < 0).forEach((row) => Object.assign(row, { status: 'estornada' }));
  const cobrancaPipeline = db.pipelines.find((row) => row.entidade_tipo === 'cobranca');
  const cobrancaStages = cobrancaPipeline
    ? db.pipeline_stages.filter((row) => row.pipeline_id === cobrancaPipeline.id).sort((a, b) => Number(a.ordem) - Number(b.ordem))
    : [];
  const parcelasVencidas = db.parcelas.filter((row) =>
    row.vencimento && row.vencimento < '2026-07-20' && !['paga', 'cancelada', 'estornada'].includes(String(row.status)),
  );
  if (cobrancaStages[0] && parcelasVencidas[0]) {
    db.financeiro_cobrancas.push({
      id: 'mock-cobranca-ativa-01', parcela_id: parcelasVencidas[0].id, stage_id: cobrancaStages[1]?.id ?? cobrancaStages[0].id,
      responsavel_id: MOCK_USER_ID, data_abertura: '2026-07-15', vencimento_followup: '2026-07-21',
      status: 'ATIVA', prioridade: 'ALTA', ultima_cobranca_em: '2026-07-18T14:30:00.000Z',
      proxima_cobranca_em: '2026-07-21T13:00:00.000Z', canal_preferencial: 'WHATSAPP',
      observacoes: 'Cliente contatado; aguardando confirmação da programação de pagamento.',
      encerrada_em: null, motivo_encerramento: null,
    });
  }
  if (cobrancaStages[0] && parcelasVencidas[1]) {
    db.financeiro_cobrancas.push({
      id: 'mock-cobranca-ativa-02', parcela_id: parcelasVencidas[1].id, stage_id: cobrancaStages[0].id,
      responsavel_id: 'mock-user-renato', data_abertura: '2026-07-19', vencimento_followup: '2026-07-22',
      status: 'ATIVA', prioridade: 'MEDIA', ultima_cobranca_em: null,
      proxima_cobranca_em: '2026-07-22T13:00:00.000Z', canal_preferencial: 'EMAIL',
      observacoes: 'Primeira tratativa pendente.', encerrada_em: null, motivo_encerramento: null,
    });
  }
  // Caso deliberadamente divergente para validar a recuperação coletiva do 2.9b.
  db.parcelas.push({
    id: 'mock-parcela-rafael-manual-10', proposta_id: 'mock-proposta-rafael', numero: 10,
    vencimento: '2026-10-10', valor: 150, valor_liquido: 150, iof: null,
    adicional_fracionamento: null, status: 'em_aberto', forma_pagamento: 'DÉBITO_EM_CONTA',
    nosso_numero: null, linha_digitavel: null, codigo_barras: null, data_pagamento: null,
    valor_pago: null, data_baixa: null, numero_fatura: null, competencia_inicio: null,
    competencia_fim: null, observacoes: 'Lançamento manual incompleto para demonstração da regeneração coletiva.',
  });
}

seed();
