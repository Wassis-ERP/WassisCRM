import type {
  ApoliceItemRow,
  Database,
  SinistroEnvolvidoRow,
  SinistroRow,
  SinistroTipo,
} from '../../types/database'

type ApoliceRow = Database['public']['Tables']['apolices']['Row']
type PropostaRow = Database['public']['Tables']['propostas']['Row']
type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type PipelineRow = Database['public']['Tables']['pipelines']['Row']
type PipelineStageRow = Database['public']['Tables']['pipeline_stages']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']

export type ApoliceSinistroOption = {
  id: string
  numero_apolice: string | null
  status: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  segurado: {
    id: string
    nome: string
    cpf_cnpj: string | null
    filial_id: string | null
    email: string | null
    telefone: string | null
  }
  seguradora: { id: string; nome: string } | null
  ramo: { id: string; nome: string; risk_type: string | null } | null
  itens: ApoliceItemRow[]
}

export type SinistroEnvolvidoDraft = Omit<SinistroEnvolvidoRow, 'id' | 'sinistro_id'>

export type SinistroAberturaInput = {
  apolice_id: string
  responsavel_id?: string | null
  numero_sinistro?: string | null
  numero_aviso?: string | null
  protocolo_seguradora?: string | null
  cobertura_codigo?: string | null
  cobertura_nome?: string | null
  data_ocorrencia: string
  data_aviso?: string | null
  data_registro_aviso?: string | null
  tipo_sinistro?: SinistroTipo | null
  causa?: string | null
  descricao?: string | null
  local_ocorrencia?: string | null
  valor_estimado?: number | null
  valor_pendente?: number | null
  regulador_nome?: string | null
  oficina_nome?: string | null
  observacoes?: string | null
  envolvidos: SinistroEnvolvidoDraft[]
}

export type SinistroCreationStore = {
  apolices: ApoliceRow[]
  apoliceItens: ApoliceItemRow[]
  propostas: PropostaRow[]
  segurados: SeguradoRow[]
  pipelines: PipelineRow[]
  stages: PipelineStageRow[]
  profiles: ProfileRow[]
  sinistros: SinistroRow[]
  envolvidos: SinistroEnvolvidoRow[]
  auditLogs: AuditLogRow[]
}

export type SinistroCreationContext = {
  tenantId: string
  filialId?: string | null
  sessionUserId: string | null
  pipelineId?: string | null
  now: () => string
  newId: () => string
  today?: string
}

export type SinistroCreationResult = {
  sinistro: SinistroRow
  envolvidos: SinistroEnvolvidoRow[]
  auditLogs: AuditLogRow[]
}

function normalizeSearch(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

export function filterApolicesForSinistro(
  apolices: ApoliceSinistroOption[],
  search: string,
): ApoliceSinistroOption[] {
  const term = normalizeSearch(search).trim()
  if (!term) return apolices

  const digits = term.replace(/\D+/g, '')
  return apolices.filter((apolice) => {
    const values = [
      apolice.numero_apolice,
      apolice.segurado.nome,
      apolice.segurado.cpf_cnpj,
      apolice.seguradora?.nome,
      apolice.ramo?.nome,
    ]
    return values.some((value) => normalizeSearch(value).includes(term)) ||
      (digits.length > 0 && (apolice.segurado.cpf_cnpj ?? '').replace(/\D+/g, '').includes(digits))
  })
}

function isFiniteNonNegative(value: number | null | undefined): boolean {
  return value == null || (Number.isFinite(value) && value >= 0)
}

function valueOrNull(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function dateOnly(value: string): string {
  return value.slice(0, 10)
}

function validateDates(input: SinistroAberturaInput, apolice: ApoliceRow, today: string): void {
  if (!input.data_ocorrencia) throw new Error('Informe a data da ocorrência.')
  if (input.data_ocorrencia > today) throw new Error('A data da ocorrência não pode estar no futuro.')
  if (input.data_aviso && input.data_aviso < input.data_ocorrencia) {
    throw new Error('A data do aviso não pode ser anterior à ocorrência.')
  }
  if (input.data_registro_aviso && input.data_registro_aviso < input.data_ocorrencia) {
    throw new Error('O registro do aviso não pode ser anterior à ocorrência.')
  }
  if (apolice.vigencia_inicio && input.data_ocorrencia < apolice.vigencia_inicio) {
    throw new Error('A ocorrência é anterior ao início da vigência da apólice.')
  }
  if (apolice.vigencia_fim && input.data_ocorrencia > apolice.vigencia_fim) {
    throw new Error('A ocorrência é posterior ao fim da vigência da apólice.')
  }
}

function validateItem(
  itemId: string,
  apolice: ApoliceRow,
  input: SinistroAberturaInput,
  store: SinistroCreationStore,
): void {
  const item = store.apoliceItens.find((row) => row.id === itemId)
  if (!item || item.apolice_id !== apolice.id) {
    throw new Error('O item selecionado não pertence à apólice.')
  }
  if (!item.excluido_por_proposta_id) return

  const exclusao = store.propostas.find((row) => row.id === item.excluido_por_proposta_id)
  if (!exclusao?.vigencia_inicio || exclusao.vigencia_inicio <= input.data_ocorrencia) {
    throw new Error('O item não estava vigente na data da ocorrência.')
  }
}

function cloneRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }))
}

function restoreRows<T>(target: T[], snapshot: T[]): void {
  target.splice(0, target.length, ...snapshot)
}

export function createSinistroAtomic(
  store: SinistroCreationStore,
  input: SinistroAberturaInput,
  context: SinistroCreationContext,
): SinistroCreationResult {
  const snapshots = {
    sinistros: cloneRows(store.sinistros),
    envolvidos: cloneRows(store.envolvidos),
    auditLogs: cloneRows(store.auditLogs),
  }

  try {
    const apolice = store.apolices.find((row) => row.id === input.apolice_id)
    if (!apolice) throw new Error('Selecione uma apólice válida.')
    if (apolice.status?.toUpperCase() === 'RECUSADA') {
      throw new Error('Apólices recusadas não podem receber abertura de Sinistro.')
    }

    const segurado = store.segurados.find((row) => row.id === apolice.segurado_id)
    if (!segurado) throw new Error('A apólice não possui segurado válido.')
    if (context.filialId && segurado.filial_id !== context.filialId) {
      throw new Error('A apólice não pertence à corretora ativa.')
    }

    const pipeline = context.pipelineId
      ? store.pipelines.find((row) => row.id === context.pipelineId)
      : [...store.pipelines]
          .filter((row) => row.entidade_tipo === 'sinistro' && row.ativo)
          .sort((left, right) => (left.ordem ?? 0) - (right.ordem ?? 0))[0]
    if (!pipeline || !pipeline.ativo || pipeline.entidade_tipo !== 'sinistro') {
      throw new Error('Funil de Sinistros inválido ou inativo.')
    }

    const initialStage = [...store.stages]
      .filter((row) => row.pipeline_id === pipeline.id && row.ativo)
      .sort((left, right) => (left.ordem ?? 0) - (right.ordem ?? 0))[0]
    if (!initialStage) throw new Error('O funil de Sinistros não possui etapa ativa.')

    const responsibleId = input.responsavel_id ?? context.sessionUserId
    if (!responsibleId || !store.profiles.some((row) => row.id === responsibleId)) {
      throw new Error('Selecione um responsável válido para o Sinistro.')
    }

    validateDates(input, apolice, context.today ?? dateOnly(context.now()))
    if (!isFiniteNonNegative(input.valor_estimado) || !isFiniteNonNegative(input.valor_pendente)) {
      throw new Error('Os valores do Sinistro devem ser finitos e maiores ou iguais a zero.')
    }
    if (
      input.valor_estimado != null &&
      input.valor_pendente != null &&
      input.valor_pendente > input.valor_estimado
    ) {
      throw new Error('O valor pendente não pode superar o valor estimado.')
    }

    if (!input.envolvidos.some((row) => row.tipo === 'SEGURADO')) {
      throw new Error('Adicione pelo menos um envolvido do tipo Segurado.')
    }
    input.envolvidos.forEach((envolvido) => {
      if (envolvido.tipo !== 'SEGURADO' && envolvido.tipo !== 'TERCEIRO') {
        throw new Error('Tipo de envolvido inválido.')
      }
      if (!valueOrNull(envolvido.nome)) throw new Error('Informe o nome de cada envolvido.')
      if (envolvido.tipo === 'TERCEIRO' && envolvido.apolice_item_id) {
        throw new Error('Terceiros não podem ser vinculados a itens da apólice.')
      }
      const documento = (envolvido.cpf_cnpj ?? '').replace(/\D+/g, '')
      if (documento && documento.length !== 11 && documento.length !== 14) {
        throw new Error('Informe um CPF ou CNPJ válido para o envolvido.')
      }
      if (envolvido.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(envolvido.email)) {
        throw new Error('Informe um e-mail válido para o envolvido.')
      }
      if (envolvido.apolice_item_id) validateItem(envolvido.apolice_item_id, apolice, input, store)
      if (!isFiniteNonNegative(envolvido.valor_reclamado)) {
        throw new Error('O valor reclamado do envolvido deve ser maior ou igual a zero.')
      }
    })

    const sinistroId = context.newId()
    const sinistro: SinistroRow = {
      id: sinistroId,
      apolice_id: apolice.id,
      stage_id: initialStage.id,
      responsavel_id: responsibleId,
      numero_sinistro: valueOrNull(input.numero_sinistro),
      numero_aviso: valueOrNull(input.numero_aviso),
      protocolo_seguradora: valueOrNull(input.protocolo_seguradora),
      cobertura_codigo: valueOrNull(input.cobertura_codigo),
      cobertura_nome: valueOrNull(input.cobertura_nome),
      data_ocorrencia: input.data_ocorrencia,
      data_aviso: input.data_aviso ?? null,
      data_registro_aviso: input.data_registro_aviso ?? null,
      data_documentacao_completa: null,
      data_liquidacao_financeira: null,
      data_conclusao: null,
      tipo_sinistro: input.tipo_sinistro ?? null,
      causa: valueOrNull(input.causa),
      descricao: valueOrNull(input.descricao),
      local_ocorrencia: valueOrNull(input.local_ocorrencia),
      status: 'aberto',
      valor_estimado: input.valor_estimado ?? null,
      valor_indenizado: null,
      valor_pendente: input.valor_pendente ?? null,
      valor_despesas_regulacao: null,
      valor_salvado: null,
      data_salvado: null,
      valor_ressarcimento: null,
      data_ressarcimento: null,
      negativa_motivo: null,
      regulador_nome: valueOrNull(input.regulador_nome),
      oficina_nome: valueOrNull(input.oficina_nome),
      observacoes: valueOrNull(input.observacoes),
    }
    store.sinistros.push(sinistro)

    const createdEnvolvidos = input.envolvidos.map((draft): SinistroEnvolvidoRow => ({
      id: context.newId(),
      sinistro_id: sinistroId,
      apolice_item_id: draft.tipo === 'TERCEIRO' ? null : draft.apolice_item_id,
      tipo: draft.tipo,
      nome: valueOrNull(draft.nome),
      cpf_cnpj: valueOrNull(draft.cpf_cnpj),
      email: valueOrNull(draft.email),
      telefone: valueOrNull(draft.telefone),
      placa: valueOrNull(draft.placa),
      seguradora_terceiro: draft.tipo === 'TERCEIRO' ? valueOrNull(draft.seguradora_terceiro) : null,
      apolice_terceiro: draft.tipo === 'TERCEIRO' ? valueOrNull(draft.apolice_terceiro) : null,
      tipo_dano: valueOrNull(draft.tipo_dano),
      valor_reclamado: draft.valor_reclamado ?? null,
      valor_indenizado: null,
      responsavel_pelo_evento: draft.responsavel_pelo_evento ?? null,
      observacoes: valueOrNull(draft.observacoes),
    }))
    store.envolvidos.push(...createdEnvolvidos)

    const ocorridoEm = context.now()
    const auditLogs: AuditLogRow[] = [
      {
        id: context.newId(),
        tenant_id: context.tenantId,
        user_id: context.sessionUserId,
        entidade_tipo: 'sinistro',
        entidade_id: sinistroId,
        campo: null,
        valor_antigo: null,
        valor_novo: 'aberto',
        acao: 'INSERT',
        ocorrido_em: ocorridoEm,
        origem: 'FRONT_MOCK',
        ip: null,
        user_agent: 'WassisCRM mock',
      },
      ...createdEnvolvidos.map((envolvido): AuditLogRow => ({
        id: context.newId(),
        tenant_id: context.tenantId,
        user_id: context.sessionUserId,
        entidade_tipo: 'sinistro',
        entidade_id: sinistroId,
        campo: `envolvido:${envolvido.id}`,
        valor_antigo: null,
        valor_novo: `${envolvido.tipo ?? 'ENVOLVIDO'} · ${envolvido.nome ?? 'Sem nome'}`,
        acao: 'INSERT',
        ocorrido_em: ocorridoEm,
        origem: 'FRONT_MOCK',
        ip: null,
        user_agent: 'WassisCRM mock',
      })),
    ]
    store.auditLogs.push(...auditLogs)

    return { sinistro, envolvidos: createdEnvolvidos, auditLogs }
  } catch (error) {
    restoreRows(store.sinistros, snapshots.sinistros)
    restoreRows(store.envolvidos, snapshots.envolvidos)
    restoreRows(store.auditLogs, snapshots.auditLogs)
    throw error
  }
}
