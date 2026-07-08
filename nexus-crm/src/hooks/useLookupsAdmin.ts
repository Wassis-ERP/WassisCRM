import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import {
  RAMO_CATEGORIA_RISCO_MAP,
  type RamoCategoriaRisco,
  type RamoFormaCalculo,
  type RamoGrupoOperacional,
  type RamoRiskType,
} from './useLookups';

type LookupTable = 'ramos' | 'origens' | 'seguradoras' | 'motivos_perda';

export type RamoInput = {
  nome: string;
  codigo_susep: string;
  categoria_risco: RamoCategoriaRisco;
  is_monthly: boolean;
  renovavel: boolean;
  permite_endosso: boolean;
  exige_item: boolean;
  exige_coberturas: boolean;
  ordem: number | null;
  ativo: boolean;
  observacoes: string;
};

export type RamoAdminRow = {
  id: string;
  tenant_id: string;
  nome: string;
  codigo_susep: string | null;
  risk_type: RamoRiskType;
  grupo_operacional: RamoGrupoOperacional;
  forma_calculo: RamoFormaCalculo | null;
  is_monthly: boolean;
  renovavel: boolean;
  permite_endosso: boolean;
  exige_item: boolean;
  exige_coberturas: boolean;
  ordem: number | null;
  ativo: boolean;
  observacoes: string | null;
};

export type SeguradoraRow = {
  id: string;
  tenant_id: string;
  nome: string;
  nome_curto: string | null;
  cnpj: string | null;
  codigo_susep: string | null;
  codigo_interno: string | null;
  site: string | null;
  portal_url: string | null;
  telefone_sac: string | null;
  telefone_assistencia: string | null;
  email: string | null;
  aceita_importacao_pdf: boolean;
  aceita_busca_automatica: boolean;
  ativo: boolean;
  observacoes: string | null;
};

export type SeguradoraInput = Omit<SeguradoraRow, 'id' | 'tenant_id'>;

export type CatalogoEnxutoTable = 'origens' | 'motivos_perda';
export type CatalogoEnxutoField = 'tipo' | 'categoria';

export type CatalogoEnxutoRow = {
  id: string;
  tenant_id: string;
  nome: string;
  ordem: number | null;
  ativo: boolean;
  tipo?: string | null;
  categoria?: string | null;
};

export type CatalogoEnxutoInput = {
  nome: string;
  classificacao: string;
  ordem: number | null;
  ativo: boolean;
};

export type CoberturaCatalogoRow = {
  id: string;
  ramo_id: string;
  codigo: string | null;
  codigo_susep: string | null;
  nome: string;
  descricao: string | null;
  tipo_cobertura: string | null;
  caracteristica: string | null;
  tipo_risco: string | null;
  modalidade: string | null;
  capital_lmi_padrao: number | null;
  franquia_padrao: number | null;
  carencia_dias: number | null;
  obrigatoria: boolean;
  ordem: number | null;
  ativo: boolean;
};

export type CoberturaCatalogoInput = Omit<CoberturaCatalogoRow, 'id'>;

export type RecebimentoGradeTipo =
  | 'ANTECIPADO_N'
  | 'ESGOTAMENTO'
  | 'NA_PARCELA'
  | 'VITALICIO_PCT_PROPOSTA'
  | 'VITALICIO_PCT_DEFINIDO';

export type RecebimentoBaseCalculo = 'PREMIO_LIQUIDO' | 'PREMIO_TOTAL' | 'PARCELA_LIQUIDA';
export type RecebimentoPercentualSobre = 'COMISSAO_TOTAL' | 'PARCELA' | 'PREMIO';

export type RecebimentoGradeRow = {
  id: string;
  seguradora_id: string;
  ramo_id: string;
  nome: string;
  tipo: RecebimentoGradeTipo;
  qtd_parcelas: number;
  base_calculo: RecebimentoBaseCalculo | null;
  percentual_default: number | null;
  considera_iof: boolean;
  considera_adicional_fracionamento: boolean;
  vitalicio: boolean;
  ativo: boolean;
  observacoes: string | null;
};

export type RecebimentoGradeInput = Omit<RecebimentoGradeRow, 'id' | 'base_calculo' | 'observacoes'> & {
  base_calculo: RecebimentoBaseCalculo;
  observacoes: string;
};

export type RecebimentoGradeParcelaRow = {
  id: string;
  grade_id: string;
  numero: number;
  percentual: number | null;
  percentual_sobre: RecebimentoPercentualSobre | null;
  dias_apos_vencimento: number | null;
  ativo: boolean;
};

export type RecebimentoGradeParcelaInput = Omit<RecebimentoGradeParcelaRow, 'id' | 'percentual_sobre'> & {
  percentual_sobre: RecebimentoPercentualSobre;
};

export type RepassePapel = 'PRODUTOR' | 'GERENTE';
export type RepasseTipoDocumento = 'NOVA' | 'RENOVACAO';
export type RepasseBase = 'COMISSAO' | 'PREMIO_LIQUIDO' | 'VALOR_FIXO';
export type RepasseGatilho = 'NA_EMISSAO' | 'PRIMEIRA_COMISSAO' | 'CONFORME_RECEBIMENTO' | 'PARCELADO';

export type RepasseRegraRow = {
  id: string;
  tenant_id: string;
  filial_id: string | null;
  produtor_id: string | null;
  ramo_id: string | null;
  papel: RepassePapel;
  tipo_documento: RepasseTipoDocumento | null;
  base: RepasseBase;
  percentual: number | null;
  valor_fixo: number | null;
  gatilho: RepasseGatilho;
  qtd_parcelas: number | null;
  limite_parcelas: number | null;
  prioridade: number;
  inicio_vigencia: string | null;
  fim_vigencia: string | null;
  ativo: boolean;
  observacoes: string | null;
};

export type RepasseRegraInput = Omit<RepasseRegraRow, 'id' | 'tenant_id' | 'inicio_vigencia' | 'fim_vigencia' | 'observacoes'> & {
  inicio_vigencia: string;
  fim_vigencia: string;
  observacoes: string;
};

export type CampoEntidadeTipo =
  | 'segurado'
  | 'oportunidade'
  | 'cotacao'
  | 'apolice'
  | 'proposta'
  | 'apolice_item'
  | 'sinistro'
  | 'cobranca'
  | 'pos_venda';

export type CampoTipoDado =
  | 'TEXTO_CURTO'
  | 'TEXTO_LONGO'
  | 'INTEIRO'
  | 'DECIMAL'
  | 'BOOLEANO'
  | 'DATA'
  | 'DATA_HORA'
  | 'LISTA_UNICA'
  | 'LISTA_MULTIPLA';

export type CampoFormato = 'NUMERO' | 'PERCENTUAL' | 'MOEDA';

export type CampoDefinicaoRow = {
  id: string;
  tenant_id: string;
  filial_id: string | null;
  entidade_tipo: CampoEntidadeTipo;
  chave: string;
  nome: string;
  tipo_dado: CampoTipoDado;
  formato: CampoFormato | null;
  obrigatorio: boolean;
  ativo: boolean;
  ordem: number | null;
  ajuda: string | null;
  min_valor: number | null;
  max_valor: number | null;
  tamanho_max: number | null;
  mascara: string | null;
  placeholder: string | null;
  agrupamento: string | null;
  visivel_em_listagem: boolean;
};

export type CampoDefinicaoInput = Omit<
  CampoDefinicaoRow,
  'id' | 'tenant_id' | 'chave' | 'ajuda' | 'mascara' | 'placeholder' | 'agrupamento'
> & {
  chave: string;
  ajuda: string;
  mascara: string;
  placeholder: string;
  agrupamento: string;
};

export type CampoOpcaoRow = {
  id: string;
  campo_definicao_id: string;
  rotulo: string;
  valor: string;
  ordem: number | null;
  ativo: boolean;
};

export type CampoOpcaoInput = Omit<CampoOpcaoRow, 'id' | 'valor'> & {
  valor: string;
};

const textOrNull = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
};

const digitsOrNull = (value: string | null | undefined) => {
  const digits = (value ?? '').replace(/\D+/g, '');
  return digits.length > 0 ? digits : null;
};

export const slugifyCampoChave = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export function buildRamoInsertPayload(input: RamoInput, tenantId: string) {
  return {
    ...buildRamoUpdatePayload(input),
    tenant_id: tenantId,
  };
}

export function buildRamoUpdatePayload(input: RamoInput) {
  const categoria = RAMO_CATEGORIA_RISCO_MAP[input.categoria_risco];

  return {
    nome: input.nome.trim(),
    codigo_susep: textOrNull(input.codigo_susep),
    risk_type: categoria.risk_type,
    grupo_operacional: categoria.grupo_operacional,
    forma_calculo: categoria.forma_calculo,
    is_monthly: input.is_monthly,
    renovavel: input.renovavel,
    permite_endosso: input.permite_endosso,
    exige_item: input.exige_item,
    exige_coberturas: input.exige_coberturas,
    ordem: input.ordem,
    ativo: input.ativo,
    observacoes: textOrNull(input.observacoes),
  };
}

export function buildLookupInsertPayload(nome: string, tenantId: string) {
  return {
    nome: nome.trim(),
    tenant_id: tenantId,
    ativo: true,
  };
}

export function buildSeguradoraUpdatePayload(input: SeguradoraInput) {
  return {
    nome: input.nome.trim(),
    nome_curto: textOrNull(input.nome_curto),
    cnpj: digitsOrNull(input.cnpj),
    codigo_susep: textOrNull(input.codigo_susep),
    codigo_interno: textOrNull(input.codigo_interno),
    site: textOrNull(input.site),
    portal_url: textOrNull(input.portal_url),
    telefone_sac: textOrNull(input.telefone_sac),
    telefone_assistencia: textOrNull(input.telefone_assistencia),
    email: textOrNull(input.email),
    aceita_importacao_pdf: input.aceita_importacao_pdf,
    aceita_busca_automatica: input.aceita_busca_automatica,
    ativo: input.ativo,
    observacoes: textOrNull(input.observacoes),
  };
}

export function buildSeguradoraInsertPayload(input: SeguradoraInput, tenantId: string) {
  return {
    ...buildSeguradoraUpdatePayload(input),
    tenant_id: tenantId,
  };
}

export function buildCatalogoEnxutoUpdatePayload(input: CatalogoEnxutoInput, field: CatalogoEnxutoField) {
  return {
    nome: input.nome.trim(),
    [field]: textOrNull(input.classificacao),
    ordem: input.ordem,
    ativo: input.ativo,
  };
}

export function buildCatalogoEnxutoInsertPayload(
  input: CatalogoEnxutoInput,
  tenantId: string,
  field: CatalogoEnxutoField,
) {
  return {
    ...buildCatalogoEnxutoUpdatePayload(input, field),
    tenant_id: tenantId,
  };
}

export function buildCoberturaCatalogoUpdatePayload(input: CoberturaCatalogoInput) {
  return {
    ramo_id: input.ramo_id,
    codigo: textOrNull(input.codigo),
    codigo_susep: textOrNull(input.codigo_susep),
    nome: input.nome.trim(),
    descricao: textOrNull(input.descricao),
    tipo_cobertura: textOrNull(input.tipo_cobertura),
    caracteristica: textOrNull(input.caracteristica),
    tipo_risco: textOrNull(input.tipo_risco),
    modalidade: textOrNull(input.modalidade),
    capital_lmi_padrao: input.capital_lmi_padrao,
    franquia_padrao: input.franquia_padrao,
    carencia_dias: input.carencia_dias,
    obrigatoria: input.obrigatoria,
    ordem: input.ordem,
    ativo: input.ativo,
  };
}

export function buildCoberturaCatalogoInsertPayload(input: CoberturaCatalogoInput) {
  return buildCoberturaCatalogoUpdatePayload(input);
}

export function buildRecebimentoGradeUpdatePayload(input: RecebimentoGradeInput) {
  return {
    seguradora_id: input.seguradora_id,
    ramo_id: input.ramo_id,
    nome: input.nome.trim(),
    tipo: input.tipo,
    qtd_parcelas: input.qtd_parcelas,
    base_calculo: input.base_calculo,
    percentual_default: input.percentual_default,
    considera_iof: input.considera_iof,
    considera_adicional_fracionamento: input.considera_adicional_fracionamento,
    vitalicio: input.vitalicio,
    ativo: input.ativo,
    observacoes: textOrNull(input.observacoes),
  };
}

export function buildRecebimentoGradeInsertPayload(input: RecebimentoGradeInput) {
  return buildRecebimentoGradeUpdatePayload(input);
}

export function buildRecebimentoGradeParcelaUpdatePayload(input: RecebimentoGradeParcelaInput) {
  return {
    grade_id: input.grade_id,
    numero: input.numero,
    percentual: input.percentual,
    percentual_sobre: input.percentual_sobre,
    dias_apos_vencimento: input.dias_apos_vencimento,
    ativo: input.ativo,
  };
}

export function buildRecebimentoGradeParcelaInsertPayload(input: RecebimentoGradeParcelaInput) {
  return buildRecebimentoGradeParcelaUpdatePayload(input);
}

export function buildRepasseRegraUpdatePayload(input: RepasseRegraInput) {
  return {
    filial_id: input.filial_id,
    produtor_id: input.produtor_id,
    ramo_id: input.ramo_id,
    papel: input.papel,
    tipo_documento: input.tipo_documento,
    base: input.base,
    percentual: input.percentual,
    valor_fixo: input.valor_fixo,
    gatilho: input.gatilho,
    qtd_parcelas: input.qtd_parcelas,
    limite_parcelas: input.limite_parcelas,
    prioridade: input.prioridade,
    inicio_vigencia: textOrNull(input.inicio_vigencia),
    fim_vigencia: textOrNull(input.fim_vigencia),
    ativo: input.ativo,
    observacoes: textOrNull(input.observacoes),
  };
}

export function buildRepasseRegraInsertPayload(input: RepasseRegraInput, tenantId: string) {
  return {
    ...buildRepasseRegraUpdatePayload(input),
    tenant_id: tenantId,
  };
}

export function buildCampoDefinicaoUpdatePayload(input: CampoDefinicaoInput) {
  const numericType = input.tipo_dado === 'INTEIRO' || input.tipo_dado === 'DECIMAL';
  return {
    filial_id: input.filial_id,
    entidade_tipo: input.entidade_tipo,
    chave: slugifyCampoChave(input.chave || input.nome),
    nome: input.nome.trim(),
    tipo_dado: input.tipo_dado,
    formato: numericType ? input.formato : null,
    obrigatorio: input.obrigatorio,
    ativo: input.ativo,
    ordem: input.ordem,
    ajuda: textOrNull(input.ajuda),
    min_valor: input.min_valor,
    max_valor: input.max_valor,
    tamanho_max: input.tamanho_max,
    mascara: textOrNull(input.mascara),
    placeholder: textOrNull(input.placeholder),
    agrupamento: textOrNull(input.agrupamento),
    visivel_em_listagem: input.visivel_em_listagem,
  };
}

export function buildCampoDefinicaoInsertPayload(input: CampoDefinicaoInput, tenantId: string) {
  return {
    ...buildCampoDefinicaoUpdatePayload(input),
    tenant_id: tenantId,
  };
}

export function buildCampoOpcaoUpdatePayload(input: CampoOpcaoInput) {
  return {
    campo_definicao_id: input.campo_definicao_id,
    rotulo: input.rotulo.trim(),
    valor: slugifyCampoChave(input.valor || input.rotulo),
    ordem: input.ordem,
    ativo: input.ativo,
  };
}

export function buildCampoOpcaoInsertPayload(input: CampoOpcaoInput) {
  return buildCampoOpcaoUpdatePayload(input);
}

export function useLookupsAdmin(table: LookupTable) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const invalidateKeys = () => {
    switch (table) {
      case 'ramos': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.ramos }); break;
      case 'origens': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.origens }); break;
      case 'seguradoras': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.seguradoras }); break;
      case 'motivos_perda': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.motivosPerda }); break;
    }
  };

  const addMutation = useMutation({
    mutationFn: async (nome: string) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      
      const payload = {
        ...buildLookupInsertPayload(nome, tenantId),
      };

      const { data, error } = await supabase.from(table).insert(payload).select().single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_LOOKUP',
        entity_type: table,
        entity_id: data.id,
        new_data: payload
      });

      return data;
    },
    onSuccess: () => invalidateKeys(),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase.from(table).update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_LOOKUP',
        entity_type: table,
        entity_id: id
      });
    },
    onSuccess: () => invalidateKeys(),
  });

  return {
    add: addMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useRamosAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const invalidateRamos = () => {
    queryClient.invalidateQueries({ queryKey: ['ramos', 'admin'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.lookups.ramos });
  };

  const listQuery = useQuery({
    queryKey: ['ramos', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ramos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data ?? []) as RamoAdminRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (input: RamoInput) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      if (!input.nome.trim()) throw new Error('Nome do ramo é obrigatório');

      const payload = buildRamoInsertPayload(input, tenantId);

      const { data, error } = await supabase.from('ramos').insert(payload).select().single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_LOOKUP',
        entity_type: 'ramos',
        entity_id: data.id,
        new_data: payload,
      });

      return data;
    },
    onSuccess: invalidateRamos,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RamoInput }) => {
      if (!input.nome.trim()) throw new Error('Nome do ramo é obrigatório');

      const payload = buildRamoUpdatePayload(input);

      const { data, error } = await supabase.from('ramos').update(payload).eq('id', id).select().single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_LOOKUP',
        entity_type: 'ramos',
        entity_id: id,
        new_data: payload,
      });

      return data;
    },
    onSuccess: invalidateRamos,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ramos').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_LOOKUP',
        entity_type: 'ramos',
        entity_id: id,
      });
    },
    onSuccess: invalidateRamos,
  });

  return {
    ramos: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useSeguradorasAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const invalidateSeguradoras = () => {
    queryClient.invalidateQueries({ queryKey: ['seguradoras', 'admin'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.lookups.seguradoras });
  };

  const listQuery = useQuery({
    queryKey: ['seguradoras', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seguradoras')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data ?? []) as SeguradoraRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: SeguradoraInput) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      if (!input.nome.trim()) throw new Error('Nome da seguradora é obrigatório');

      const payload = buildSeguradoraInsertPayload(input, tenantId);
      const { data, error } = await supabase.from('seguradoras').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_SEGURADORA',
        entity_type: 'seguradoras',
        entity_id: data.id,
        new_data: payload,
      });

      return data as SeguradoraRow;
    },
    onSuccess: invalidateSeguradoras,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SeguradoraInput }) => {
      if (!input.nome.trim()) throw new Error('Nome da seguradora é obrigatório');

      const payload = buildSeguradoraUpdatePayload(input);
      const { data, error } = await supabase.from('seguradoras').update(payload).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_SEGURADORA',
        entity_type: 'seguradoras',
        entity_id: id,
        new_data: payload,
      });

      return data as SeguradoraRow;
    },
    onSuccess: invalidateSeguradoras,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seguradoras').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_SEGURADORA',
        entity_type: 'seguradoras',
        entity_id: id,
      });
    },
    onSuccess: invalidateSeguradoras,
  });

  return {
    seguradoras: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useCatalogoEnxutoAdmin(table: CatalogoEnxutoTable, field: CatalogoEnxutoField) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const lookupKey = table === 'origens' ? queryKeys.lookups.origens : queryKeys.lookups.motivosPerda;

  const invalidateCatalogo = () => {
    queryClient.invalidateQueries({ queryKey: ['catalogo_enxuto', table] });
    queryClient.invalidateQueries({ queryKey: lookupKey });
  };

  const listQuery = useQuery({
    queryKey: ['catalogo_enxuto', table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data ?? []) as CatalogoEnxutoRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CatalogoEnxutoInput) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      if (!input.nome.trim()) throw new Error('Nome é obrigatório');

      const payload = buildCatalogoEnxutoInsertPayload(input, tenantId, field);
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_LOOKUP',
        entity_type: table,
        entity_id: data.id,
        new_data: payload,
      });

      return data as CatalogoEnxutoRow;
    },
    onSuccess: invalidateCatalogo,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CatalogoEnxutoInput }) => {
      if (!input.nome.trim()) throw new Error('Nome é obrigatório');

      const payload = buildCatalogoEnxutoUpdatePayload(input, field);
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_LOOKUP',
        entity_type: table,
        entity_id: id,
        new_data: payload,
      });

      return data as CatalogoEnxutoRow;
    },
    onSuccess: invalidateCatalogo,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_LOOKUP',
        entity_type: table,
        entity_id: id,
      });
    },
    onSuccess: invalidateCatalogo,
  });

  return {
    items: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useCoberturasCatalogoAdmin(ramoId: string | null) {
  const queryClient = useQueryClient();

  const invalidateCoberturas = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.coberturasCatalogo });
  };

  const listQuery = useQuery({
    queryKey: [...queryKeys.coberturasCatalogo, ramoId],
    enabled: Boolean(ramoId),
    queryFn: async () => {
      if (!ramoId) return [];

      const { data, error } = await supabase
        .from('coberturas_catalogo')
        .select('*')
        .eq('ramo_id', ramoId)
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data ?? []) as CoberturaCatalogoRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CoberturaCatalogoInput) => {
      if (!input.ramo_id) throw new Error('Ramo é obrigatório');
      if (!input.nome.trim()) throw new Error('Nome da cobertura é obrigatório');

      const payload = buildCoberturaCatalogoInsertPayload(input);
      const { data, error } = await supabase.from('coberturas_catalogo').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_COBERTURA',
        entity_type: 'coberturas_catalogo',
        entity_id: data.id,
        new_data: payload,
      });

      return data as CoberturaCatalogoRow;
    },
    onSuccess: invalidateCoberturas,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CoberturaCatalogoInput }) => {
      if (!input.ramo_id) throw new Error('Ramo é obrigatório');
      if (!input.nome.trim()) throw new Error('Nome da cobertura é obrigatório');

      const payload = buildCoberturaCatalogoUpdatePayload(input);
      const { data, error } = await supabase.from('coberturas_catalogo').update(payload).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_COBERTURA',
        entity_type: 'coberturas_catalogo',
        entity_id: id,
        new_data: payload,
      });

      return data as CoberturaCatalogoRow;
    },
    onSuccess: invalidateCoberturas,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coberturas_catalogo').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_COBERTURA',
        entity_type: 'coberturas_catalogo',
        entity_id: id,
      });
    },
    onSuccess: invalidateCoberturas,
  });

  return {
    coberturas: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useRecebimentoGradesAdmin() {
  const queryClient = useQueryClient();

  const invalidateGrades = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.recebimentoGrades });
    queryClient.invalidateQueries({ queryKey: ['recebimento_grade_parcelas'] });
  };

  const listQuery = useQuery({
    queryKey: queryKeys.recebimentoGrades,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recebimento_grades')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data ?? []) as RecebimentoGradeRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: RecebimentoGradeInput) => {
      if (!input.nome.trim()) throw new Error('Nome da grade é obrigatório');
      if (!input.seguradora_id) throw new Error('Seguradora é obrigatória');
      if (!input.ramo_id) throw new Error('Ramo é obrigatório');
      if (input.qtd_parcelas <= 0) throw new Error('Quantidade de parcelas deve ser maior que zero');

      const payload = buildRecebimentoGradeInsertPayload(input);
      const { data, error } = await supabase.from('recebimento_grades').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_RECEBIMENTO_GRADE',
        entity_type: 'recebimento_grades',
        entity_id: data.id,
        new_data: payload,
      });

      return data as RecebimentoGradeRow;
    },
    onSuccess: invalidateGrades,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RecebimentoGradeInput }) => {
      if (!input.nome.trim()) throw new Error('Nome da grade é obrigatório');
      if (!input.seguradora_id) throw new Error('Seguradora é obrigatória');
      if (!input.ramo_id) throw new Error('Ramo é obrigatório');
      if (input.qtd_parcelas <= 0) throw new Error('Quantidade de parcelas deve ser maior que zero');

      const payload = buildRecebimentoGradeUpdatePayload(input);
      const { data, error } = await supabase.from('recebimento_grades').update(payload).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_RECEBIMENTO_GRADE',
        entity_type: 'recebimento_grades',
        entity_id: id,
        new_data: payload,
      });

      return data as RecebimentoGradeRow;
    },
    onSuccess: invalidateGrades,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recebimento_grades').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_RECEBIMENTO_GRADE',
        entity_type: 'recebimento_grades',
        entity_id: id,
      });
    },
    onSuccess: invalidateGrades,
  });

  return {
    grades: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useRecebimentoGradeParcelasAdmin(gradeId: string | null) {
  const queryClient = useQueryClient();

  const invalidateParcelas = () => {
    queryClient.invalidateQueries({ queryKey: ['recebimento_grade_parcelas'] });
  };

  const listQuery = useQuery({
    queryKey: queryKeys.recebimentoGradeParcelas(gradeId),
    enabled: Boolean(gradeId),
    queryFn: async () => {
      if (!gradeId) return [];

      const { data, error } = await supabase
        .from('recebimento_grade_parcelas')
        .select('*')
        .eq('grade_id', gradeId)
        .order('numero', { ascending: true });

      if (error) throw error;
      return (data ?? []) as RecebimentoGradeParcelaRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: RecebimentoGradeParcelaInput) => {
      if (!input.grade_id) throw new Error('Grade é obrigatória');
      if (input.numero <= 0) throw new Error('Número da parcela deve ser maior que zero');

      const payload = buildRecebimentoGradeParcelaInsertPayload(input);
      const { data, error } = await supabase.from('recebimento_grade_parcelas').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_RECEBIMENTO_GRADE_PARCELA',
        entity_type: 'recebimento_grade_parcelas',
        entity_id: data.id,
        new_data: payload,
      });

      return data as RecebimentoGradeParcelaRow;
    },
    onSuccess: invalidateParcelas,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RecebimentoGradeParcelaInput }) => {
      if (!input.grade_id) throw new Error('Grade é obrigatória');
      if (input.numero <= 0) throw new Error('Número da parcela deve ser maior que zero');

      const payload = buildRecebimentoGradeParcelaUpdatePayload(input);
      const { data, error } = await supabase
        .from('recebimento_grade_parcelas')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_RECEBIMENTO_GRADE_PARCELA',
        entity_type: 'recebimento_grade_parcelas',
        entity_id: id,
        new_data: payload,
      });

      return data as RecebimentoGradeParcelaRow;
    },
    onSuccess: invalidateParcelas,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recebimento_grade_parcelas').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_RECEBIMENTO_GRADE_PARCELA',
        entity_type: 'recebimento_grade_parcelas',
        entity_id: id,
      });
    },
    onSuccess: invalidateParcelas,
  });

  return {
    parcelas: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useRepasseRegrasAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const invalidateRegras = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.repasseRegras });
  };

  const listQuery = useQuery({
    queryKey: queryKeys.repasseRegras,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repasse_regras')
        .select('*')
        .order('prioridade', { ascending: false });

      if (error) throw error;
      return (data ?? []) as RepasseRegraRow[];
    },
  });

  const validateInput = (input: RepasseRegraInput) => {
    if (input.gatilho === 'PARCELADO' && (!input.qtd_parcelas || input.qtd_parcelas <= 0)) {
      throw new Error('Quantidade de parcelas é obrigatória quando o gatilho é Parcelado');
    }
    if (input.base === 'VALOR_FIXO' && (input.valor_fixo == null || input.valor_fixo <= 0)) {
      throw new Error('Valor fixo é obrigatório quando a base é Valor fixo');
    }
    if (input.base !== 'VALOR_FIXO' && (input.percentual == null || input.percentual <= 0)) {
      throw new Error('Percentual é obrigatório quando a base não é Valor fixo');
    }
  };

  const createMutation = useMutation({
    mutationFn: async (input: RepasseRegraInput) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      validateInput(input);

      const payload = buildRepasseRegraInsertPayload(input, tenantId);
      const { data, error } = await supabase.from('repasse_regras').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_REPASSE_REGRA',
        entity_type: 'repasse_regras',
        entity_id: data.id,
        new_data: payload,
      });

      return data as RepasseRegraRow;
    },
    onSuccess: invalidateRegras,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RepasseRegraInput }) => {
      validateInput(input);

      const payload = buildRepasseRegraUpdatePayload(input);
      const { data, error } = await supabase.from('repasse_regras').update(payload).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_REPASSE_REGRA',
        entity_type: 'repasse_regras',
        entity_id: id,
        new_data: payload,
      });

      return data as RepasseRegraRow;
    },
    onSuccess: invalidateRegras,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('repasse_regras').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_REPASSE_REGRA',
        entity_type: 'repasse_regras',
        entity_id: id,
      });
    },
    onSuccess: invalidateRegras,
  });

  return {
    regras: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useCampoDefinicoesAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const invalidateDefinicoes = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.campoDefinicoes });
    queryClient.invalidateQueries({ queryKey: ['campo_opcoes'] });
  };

  const listQuery = useQuery({
    queryKey: queryKeys.campoDefinicoes,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campo_definicoes')
        .select('*')
        .order('entidade_tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      return (data ?? []) as CampoDefinicaoRow[];
    },
  });

  const validateInput = (input: CampoDefinicaoInput) => {
    if (!input.entidade_tipo) throw new Error('Entidade é obrigatória');
    if (!input.nome.trim()) throw new Error('Nome do campo é obrigatório');
    if (!slugifyCampoChave(input.chave || input.nome)) throw new Error('Chave do campo é obrigatória');
    if (!input.tipo_dado) throw new Error('Tipo de dado é obrigatório');
  };

  const createMutation = useMutation({
    mutationFn: async (input: CampoDefinicaoInput) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      validateInput(input);

      const payload = buildCampoDefinicaoInsertPayload(input, tenantId);
      const { data, error } = await supabase.from('campo_definicoes').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_CAMPO_DEFINICAO',
        entity_type: 'campo_definicoes',
        entity_id: data.id,
        new_data: payload,
      });

      return data as CampoDefinicaoRow;
    },
    onSuccess: invalidateDefinicoes,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CampoDefinicaoInput }) => {
      validateInput(input);

      const payload = buildCampoDefinicaoUpdatePayload(input);
      const { data, error } = await supabase.from('campo_definicoes').update(payload).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_CAMPO_DEFINICAO',
        entity_type: 'campo_definicoes',
        entity_id: id,
        new_data: payload,
      });

      return data as CampoDefinicaoRow;
    },
    onSuccess: invalidateDefinicoes,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campo_definicoes').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_CAMPO_DEFINICAO',
        entity_type: 'campo_definicoes',
        entity_id: id,
      });
    },
    onSuccess: invalidateDefinicoes,
  });

  return {
    definicoes: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useCampoOpcoesAdmin(campoDefinicaoId: string | null) {
  const queryClient = useQueryClient();

  const invalidateOpcoes = () => {
    queryClient.invalidateQueries({ queryKey: ['campo_opcoes'] });
  };

  const listQuery = useQuery({
    queryKey: queryKeys.campoOpcoes(campoDefinicaoId),
    enabled: Boolean(campoDefinicaoId),
    queryFn: async () => {
      if (!campoDefinicaoId) return [];

      const { data, error } = await supabase
        .from('campo_opcoes')
        .select('*')
        .eq('campo_definicao_id', campoDefinicaoId)
        .order('rotulo', { ascending: true });

      if (error) throw error;
      return (data ?? []) as CampoOpcaoRow[];
    },
  });

  const validateInput = (input: CampoOpcaoInput) => {
    if (!input.campo_definicao_id) throw new Error('Definição é obrigatória');
    if (!input.rotulo.trim()) throw new Error('Rótulo da opção é obrigatório');
    if (!slugifyCampoChave(input.valor || input.rotulo)) throw new Error('Valor da opção é obrigatório');
  };

  const createMutation = useMutation({
    mutationFn: async (input: CampoOpcaoInput) => {
      validateInput(input);

      const payload = buildCampoOpcaoInsertPayload(input);
      const { data, error } = await supabase.from('campo_opcoes').insert(payload).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_CAMPO_OPCAO',
        entity_type: 'campo_opcoes',
        entity_id: data.id,
        new_data: payload,
      });

      return data as CampoOpcaoRow;
    },
    onSuccess: invalidateOpcoes,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CampoOpcaoInput }) => {
      validateInput(input);

      const payload = buildCampoOpcaoUpdatePayload(input);
      const { data, error } = await supabase.from('campo_opcoes').update(payload).eq('id', id).select().single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_CAMPO_OPCAO',
        entity_type: 'campo_opcoes',
        entity_id: id,
        new_data: payload,
      });

      return data as CampoOpcaoRow;
    },
    onSuccess: invalidateOpcoes,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campo_opcoes').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_CAMPO_OPCAO',
        entity_type: 'campo_opcoes',
        entity_id: id,
      });
    },
    onSuccess: invalidateOpcoes,
  });

  return {
    opcoes: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
