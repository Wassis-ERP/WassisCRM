import type { TenantRow, FilialRow, ProfileRow, PerfilRow, ProfileFilialRow, RolePermissionRow, ProdutorRow, SeguradoRow, PessoaContatoRow } from './platformRows'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApoliceRow = {
  id: string
  segurado_id: string
  seguradora_id: string | null
  ramo_id: string | null
  status: string | null
  renovada_de_id: string | null
  produtor_id: string | null
  numero_apolice: string | null
  numero_controle_documento: string | null
  tipo_contratacao: string | null
  tipo_apolice: string | null
  certificado_individual: string | null
  processo_susep: string | null
  estipulante_nome: string | null
  estipulante_cpf_cnpj: string | null
  subestipulante_nome: string | null
  subestipulante_cpf_cnpj: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  vigencia_inicio_hora: string | null
  vigencia_fim_hora: string | null
  data_emissao: string | null
  data_recebimento_documento: string | null
  premio_total: number | null
  premio_liquido: number | null
  iof: number | null
  adicional_fracionamento: number | null
  lmg_total: number | null
  moeda: string | null
  periodicidade_pagamento: string | null
  motivo_status: string | null
  canal_emissao: string | null
  observacoes: string | null
}

type PropostaRow = {
  id: string
  apolice_id: string
  tipo: string | null
  cotacao_id: string | null
  stage_id: string
  responsavel_id: string | null
  recebimento_grade_id: string | null
  endosso_subtipo_id: string | null
  cancelamento_motivo_id: string | null
  numero_proposta: string | null
  numero_endosso: string | null
  numero_controle_documento: string | null
  protocolo_seguradora: string | null
  tipo_movimento_endosso: string | null
  data_transmissao: string | null
  data_recebimento_seguradora: string | null
  data_aceitacao: string | null
  data_recusa: string | null
  motivo_recusa: string | null
  data_emissao: string | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  premio_total: number | null
  premio_liquido: number | null
  iof: number | null
  adicional_fracionamento: number | null
  forma_pagamento: string | null
  periodicidade_pagamento: string | null
  qtd_parcelas: number | null
  primeira_parcela_vencimento: string | null
  primeira_parcela_valor: number | null
  comissao_pct: number | null
  agenciamento_pct: number | null
  numero_fatura: string | null
  competencia_inicio: string | null
  competencia_fim: string | null
  observacoes: string | null
}

type OportunidadeContractFields = {
  apolice_origem_id: string | null
  lead_nome: string | null
  lead_documento: string | null
  lead_email: string | null
  lead_telefone: string | null
  titulo: string | null
  descricao: string | null
  prioridade: string | null
  valor_premio_estimado: number | null
  valor_comissao_estimada: number | null
  comissao_estimada_pct: number | null
  agenciamento_pct: number | null
  data_abertura: string | null
  data_fechamento_prevista: string | null
  ganha_em: string | null
  perdida_em: string | null
  motivo_perda_observacao: string | null
  campanha: string | null
  observacoes: string | null
}

export type CalculoOrigem = 'MANUAL' | 'ASSISTIDA' | 'IMPORTADA'
export type CalculoForma = 'AUTO' | 'RESIDENCIA' | 'CONDOMINIO' | 'VIDA' | 'EMPRESA' | 'DIVERSOS'
export type CalculoTipoSeguro = 'NOVO' | 'RENOVACAO_PROPRIA' | 'RENOVACAO_OUTRA'

export type CalculoRow = {
  id: string
  oportunidade_id: string
  ramo_id: string
  segurado_id: string | null
  seguradora_anterior_id: string | null
  origem: CalculoOrigem | null
  comissao_sugerida_pct: number | null
  rotulo_versao: string | null
  tipo_seguro: CalculoTipoSeguro | null
  bonus: number | null
  qtd_sinistros: number | null
  qtd_sinistros_perda_parcial: number | null
  transferiu_titularidade: boolean | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  vigencia_fim_anterior: string | null
  numero_apolice_anterior: string | null
  codigo_identificacao_anterior: string | null
  status_apolice_anterior: string | null
  nota_interna: string | null
  criado_em: string | null
}

export type CalcAutoRow = {
  calculo_id: string
  codigo_fipe: string | null
  marca: string | null
  modelo: string | null
  versao: string | null
  ano_fabricacao: number | null
  ano_modelo: number | null
  placa: string | null
  chassi: string | null
  chassi_remarcado: boolean | null
  renavam: string | null
  zero_km: boolean | null
  combustivel: string | null
  cambio: string | null
  categoria: string | null
  tipo_veiculo: string | null
  uso: string | null
  cep_pernoite: string | null
  possui_garagem_residencia: boolean | null
  possui_garagem_trabalho: boolean | null
  possui_garagem_estudo: boolean | null
  km_mensal: number | null
  blindado: boolean | null
  alienado: boolean | null
  rastreador: boolean | null
  antifurto: boolean | null
  kit_gas: boolean | null
  condutor_nome: string | null
  condutor_cpf: string | null
  condutor_data_nascimento: string | null
  condutor_sexo: string | null
  condutor_estado_civil: string | null
  condutor_profissao: string | null
  condutor_reside_com_segurado: boolean | null
  condutor_tempo_habilitacao: number | null
}

export type CalcResidenciaRow = {
  calculo_id: string
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  tipo_imovel: string | null
  tipo_ocupacao: string | null
  tipo_construcao: string | null
  area_m2: number | null
  valor_imovel: number | null
  proprietario: boolean | null
  desocupado: boolean | null
  condominio_fechado: boolean | null
  area_de_risco: boolean | null
  possui_alarme: boolean | null
  possui_monitoramento: boolean | null
  possui_portao_eletronico: boolean | null
}

export type CalcCondominioRow = {
  calculo_id: string
  nome_condominio: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  tipo_condominio: string | null
  area_total_m2: number | null
  qtd_blocos: number | null
  qtd_pavimentos: number | null
  qtd_unidades: number | null
  qtd_elevadores: number | null
  possui_portaria_24h: boolean | null
  possui_sprinklers: boolean | null
  possui_extintores: boolean | null
  possui_para_raios: boolean | null
  possui_garagem: boolean | null
}

export type CalcVidaRow = {
  calculo_id: string
  sexo: string | null
  data_nascimento: string | null
  altura_cm: number | null
  peso_kg: number | null
  renda_mensal: number | null
  profissao: string | null
  fumante: boolean | null
  pratica_esporte_risco: boolean | null
  possui_doenca_preexistente: boolean | null
  usa_medicamento_continuo: boolean | null
  capital_desejado: number | null
  beneficiarios_texto: string | null
}

export type CalcEmpresaRow = {
  calculo_id: string
  cnpj: string | null
  razao_social: string | null
  atividade: string | null
  cnae: string | null
  faturamento_anual: number | null
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  tipo_construcao: string | null
  area_m2: number | null
  qtd_funcionarios: number | null
  possui_extintores: boolean | null
  possui_alarme: boolean | null
  possui_sprinklers: boolean | null
  possui_inflamaveis: boolean | null
  valor_estoque: number | null
  valor_equipamentos: number | null
}

export type CalcDiversosRow = {
  calculo_id: string
  categoria: string | null
  descricao_risco: string | null
  valor_declarado: number | null
  observacoes: string | null
}

export type CalculoCoberturaRow = {
  id: string
  calculo_id: string
  cobertura_id: string
  selecionada: boolean | null
  limite_solicitado: number | null
  percentual_fipe_solicitado: number | null
  franquia_tipo_solicitado: string | null
  opcao_solicitada: string | null
  quantidade_solicitada: number | null
  observacao_transmitida: string | null
}

export type CalculoExecucaoMotor = 'PROPRIO' | 'AGGER' | 'MANUAL'
export type CalculoExecucaoComissaoOrigem = 'PADRAO_CALCULO' | 'SOBRESCRITA'
export type CalculoExecucaoStatus =
  | 'AGUARDANDO'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'PENDENTE_DADOS'
  | 'INDISPONIVEL'
  | 'ERRO'
  | 'CANCELADA'

export type CalculoExecucaoRow = {
  id: string
  calculo_id: string
  seguradora_id: string
  reexecucao_de_id: string | null
  tentativa: number
  motor: CalculoExecucaoMotor
  comissao_pct_aplicada: number | null
  comissao_origem: CalculoExecucaoComissaoOrigem
  status: CalculoExecucaoStatus
  pendencia_codigo: string | null
  pendencia_mensagem: string | null
  erro_codigo: string | null
  erro_mensagem_segura: string | null
  referencia_externa: string | null
  iniciada_em: string | null
  concluida_em: string | null
  criada_em: string
}

export type CotacaoStatus = 'APRESENTADA' | 'APROVADA' | 'DESCARTADA' | 'EXPIRADA' | 'RECUSADA'

export type CotacaoRow = {
  id: string
  execucao_id: string
  numero_cotacao_seguradora: string | null
  premio_total: number | null
  premio_liquido: number | null
  iof: number | null
  adicional_fracionamento: number | null
  comissao_valor: number | null
  validade: string | null
  status: CotacaoStatus | null
  link_proposta: string | null
  mensagem_seguradora: string | null
  restricoes: string | null
  recebida_em: string | null
  aprovada_em: string | null
  descartada_motivo: string | null
  observacao_interna: string | null
}

export type CotacaoCoberturaRow = {
  id: string
  cotacao_id: string
  cobertura_id: string | null
  chave_resultado: string
  codigo_externo: string | null
  nome_informado: string | null
  incluida: boolean | null
  limite_aceito: number | null
  percentual_fipe_aceito: number | null
  franquia_tipo: string | null
  franquia_valor: number | null
  premio: number | null
  carencia_dias: number | null
  participacao_obrigatoria_pct: number | null
  clausula_texto: string | null
  observacao_seguradora: string | null
  ordem: number | null
}

export type CotacaoParcelamentoRow = {
  id: string
  cotacao_id: string
  codigo_opcao: string
  forma_pagamento: string
  quantidade_parcelas: number
  valor_entrada: number | null
  valor_parcela: number | null
  valor_total: number | null
  juros_pct: number | null
  adicional_fracionamento: number | null
  primeiro_vencimento: string | null
  principal: boolean | null
  ordem: number | null
}

export type ApresentacaoLayout = 'VERTICAL' | 'HORIZONTAL'
export type ApresentacaoCriterioOrdenacao = 'RECOMENDACAO' | 'PREMIO' | 'FRANQUIA' | 'MANUAL'
export type ApresentacaoStatus = 'RASCUNHO' | 'GERADA'

export type ApresentacaoComercialRow = {
  id: string
  oportunidade_id: string
  criado_por_id: string | null
  cotacao_escolhida_id: string | null
  titulo: string | null
  layout: ApresentacaoLayout | null
  criterio_ordenacao: ApresentacaoCriterioOrdenacao | null
  exibir_percentual_fipe: boolean | null
  exibir_vantagens: boolean | null
  exibir_legenda: boolean | null
  exibir_observacoes: boolean | null
  exibir_comissao: boolean | null
  observacoes_comerciais: string | null
  status: ApresentacaoStatus | null
  criado_em: string | null
  atualizado_em: string | null
  gerada_em: string | null
  escolhida_em: string | null
}

export type ApresentacaoCotacaoRow = {
  id: string
  apresentacao_id: string
  cotacao_id: string
  parcelamento_id: string | null
  ordem: number
  recomendada: boolean | null
  titulo_comercial: string | null
  vantagens_texto: string | null
  observacao_comercial: string | null
}

export type EndossoSubtipoRow = {
  id: string
  tenant_id: string
  filial_id: string | null
  ramo_id: string | null
  nome: string | null
  natureza_canonica: string | null
  ordem: number | null
  ativo: boolean | null
  observacoes: string | null
}

export type CancelamentoMotivoRow = {
  id: string
  tenant_id: string
  filial_id: string | null
  ramo_id: string | null
  nome: string | null
  ordem: number | null
  ativo: boolean | null
  observacoes: string | null
}

type DbTable<Row, RequiredKeys extends keyof Row> = {
  Row: Row
  Insert: Partial<Row> & { [Key in RequiredKeys]: NonNullable<Row[Key]> }
  Update: Partial<Row>
  Relationships: readonly unknown[]
}

export type ApoliceItemRow = {
  id: string
  apolice_id: string
  risk_type: string | null
  incluido_por_proposta_id: string | null
  excluido_por_proposta_id: string | null
  numero_item: number | null
  descricao: string | null
  identificador_externo: string | null
  valor_risco: number | null
  endereco_risco_resumo: string | null
  status: string | null
  observacoes: string | null
}

export type SinistroTipo = 'administrativo' | 'judicial'
export type SinistroStatus =
  | 'aberto'
  | 'encerrado_sem_indenizacao'
  | 'encerrado_com_indenizacao'
  | 'reaberto'
  | 'cancelado'

export type SinistroRow = {
  id: string
  apolice_id: string
  stage_id: string
  responsavel_id: string | null
  numero_sinistro: string | null
  numero_aviso: string | null
  protocolo_seguradora: string | null
  cobertura_codigo: string | null
  cobertura_nome: string | null
  data_ocorrencia: string | null
  data_aviso: string | null
  data_registro_aviso: string | null
  data_documentacao_completa: string | null
  data_liquidacao_financeira: string | null
  data_conclusao: string | null
  tipo_sinistro: SinistroTipo | null
  causa: string | null
  descricao: string | null
  local_ocorrencia: string | null
  status: SinistroStatus | null
  valor_estimado: number | null
  valor_indenizado: number | null
  valor_pendente: number | null
  valor_despesas_regulacao: number | null
  valor_salvado: number | null
  data_salvado: string | null
  valor_ressarcimento: number | null
  data_ressarcimento: string | null
  negativa_motivo: string | null
  regulador_nome: string | null
  oficina_nome: string | null
  observacoes: string | null
}

export type SinistroEnvolvidoTipo = 'SEGURADO' | 'TERCEIRO'
export type SinistroEnvolvidoRow = {
  id: string
  sinistro_id: string
  apolice_item_id: string | null
  tipo: SinistroEnvolvidoTipo | null
  nome: string | null
  cpf_cnpj: string | null
  email: string | null
  telefone: string | null
  placa: string | null
  seguradora_terceiro: string | null
  apolice_terceiro: string | null
  tipo_dano: string | null
  valor_reclamado: number | null
  valor_indenizado: number | null
  responsavel_pelo_evento: boolean | null
  observacoes: string | null
}

export type PosVendaRow = {
  id: string
  apolice_id: string
  stage_id: string
  responsavel_id: string | null
  tipo_processo: string | null
  status: string | null
  prioridade: string | null
  assunto: string | null
  descricao: string | null
  data_abertura: string | null
  data_conclusao_prevista: string | null
  data_conclusao: string | null
  motivo_pendencia: string | null
  resultado: string | null
  observacoes: string | null
}

export type ItemVeiculoRow = { apolice_item_id: string; codigo_fipe: string | null; marca: string | null; modelo: string | null; versao: string | null; ano_fabricacao: number | null; ano_modelo: number | null; placa: string | null; chassi: string | null; renavam: string | null; zero_km: boolean | null; combustivel: string | null; cambio: string | null; categoria: string | null; uso: string | null; cep_pernoite: string | null; classe_bonus: number | null; blindado: boolean | null; alienado: boolean | null; rastreador: boolean | null; antifurto: boolean | null; kit_gas: boolean | null; condutor_principal_nome: string | null; condutor_principal_cpf: string | null; condutor_principal_data_nascimento: string | null }
export type ItemImovelRow = { apolice_item_id: string; cep: string | null; endereco: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; uf: string | null; tipo_imovel: string | null; tipo_ocupacao: string | null; tipo_construcao: string | null; area_m2: number | null; valor_imovel: number | null; condominio_fechado: boolean | null; desocupado: boolean | null }
export type ItemEmpresaRow = { apolice_item_id: string; cnpj_risco: string | null; razao_social_risco: string | null; atividade: string | null; cnae: string | null; faturamento_anual: number | null; cep: string | null; endereco: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; uf: string | null; tipo_construcao: string | null; area_m2: number | null; qtd_funcionarios: number | null; valor_estoque: number | null; valor_equipamentos: number | null; protecao_incendio: string | null }
export type ItemVidaRow = { apolice_item_id: string; pessoa_id: string | null; nome_grupo: string | null; n_vidas: number | null; certificado_individual: string | null; parentesco: string | null; data_nascimento: string | null; sexo: string | null; profissao: string | null; salario: number | null; capital_individual: number | null; data_inclusao: string | null; data_exclusao: string | null; beneficiarios_texto: string | null }
export type ItemCoberturaRow = { id: string; apolice_item_id: string; cobertura_id: string | null; incluido_por_proposta_id: string | null; excluido_por_proposta_id: string | null; capital_lmi: number | null; franquia_valor: number | null; franquia_tipo: string | null; premio: number | null; premio_liquido: number | null; carencia_dias: number | null; participacao_obrigatoria_pct: number | null; vigencia_inicio: string | null; vigencia_fim: string | null; observacoes: string | null }
export type ParcelaStatus = 'em_aberto' | 'paga' | 'vencida' | 'cancelada' | 'estornada'
export type ParcelaRow = { id: string; proposta_id: string; numero: number | null; vencimento: string | null; valor: number | null; valor_liquido: number | null; iof: number | null; adicional_fracionamento: number | null; status: ParcelaStatus | null; forma_pagamento: string | null; nosso_numero: string | null; linha_digitavel: string | null; codigo_barras: string | null; data_pagamento: string | null; valor_pago: number | null; data_baixa: string | null; numero_fatura: string | null; competencia_inicio: string | null; competencia_fim: string | null; observacoes: string | null }
export type CobrancaStatus = 'ATIVA' | 'QUITADA' | 'CANCELADA'
export type CobrancaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
export type CobrancaCanal = 'TELEFONE' | 'WHATSAPP' | 'EMAIL' | 'OUTRO'
export type FinanceiroCobrancaRow = {
  id: string
  parcela_id: string
  stage_id: string
  responsavel_id: string | null
  data_abertura: string | null
  vencimento_followup: string | null
  status: CobrancaStatus | null
  prioridade: CobrancaPrioridade | null
  ultima_cobranca_em: string | null
  proxima_cobranca_em: string | null
  canal_preferencial: CobrancaCanal | null
  observacoes: string | null
  encerrada_em: string | null
  motivo_encerramento: string | null
}
export type ComissaoTipo = 'NORMAL' | 'AGENCIAMENTO' | 'VITALICIA' | 'ADICIONAL' | 'RESTITUICAO'
export type ComissaoStatus = 'PREVISTA' | 'PARCIAL' | 'RECEBIDA' | 'DIVERGENTE' | 'CANCELADA'
export type ComissaoRow = { id: string; proposta_id: string; parcela_id: string | null; numero: number | null; tipo_comissao: ComissaoTipo | null; percentual: number | null; base_calculo: number | null; valor_previsto: number | null; valor_recebido: number | null; valor_diferenca: number | null; status: ComissaoStatus | null; prevista_em: string | null; recebida_em: string | null; competencia_inicio: string | null; competencia_fim: string | null; observacoes: string | null }
export type ComissaoExtratoOrigemTipo = 'MANUAL' | 'ARQUIVO' | 'INTEGRACAO'
export type ComissaoExtratoFormato = 'PDF' | 'XLS' | 'XLSX' | 'CSV' | 'TXT' | 'XML' | 'OUTRO'
export type ComissaoExtratoProcessamentoStatus = 'RECEBIDO' | 'NORMALIZANDO' | 'NORMALIZADO' | 'ERRO' | 'CANCELADO'
export type ComissaoExtratoConciliacaoStatus = 'NAO_INICIADA' | 'EM_ANALISE' | 'PARCIAL' | 'CONCILIADO' | 'COM_OCORRENCIAS'
export type ComissaoExtratoErroCodigo = 'LAYOUT_NAO_SUPORTADO' | 'ERRO_DE_LEITURA' | 'ARQUIVO_CORROMPIDO' | 'ARQUIVO_PROTEGIDO' | 'FORMATO_NAO_SUPORTADO'
export type ComissaoExtratoItemStatus = 'PENDENTE' | 'SUGERIDO' | 'CONCILIADO' | 'PRONTO_PARA_BAIXAR' | 'PARCIAL' | 'AMBIGUO' | 'NAO_ENCONTRADO' | 'DIVERGENTE' | 'IGNORADO'
export type ComissaoConciliacaoTipo = 'EXATA' | 'PARCIAL' | 'SUGERIDA' | 'MANUAL'
export type ComissaoConciliacaoStatus = 'SUGERIDA' | 'CONFIRMADA' | 'REJEITADA' | 'CANCELADA'
export type ComissaoConciliacaoOcorrenciaTipo =
  | 'COMISSAO_NAO_ENCONTRADA' | 'DOCUMENTO_NAO_ENCONTRADO' | 'MULTIPLAS_COMISSOES'
  | 'VALOR_DIVERGENTE' | 'PERCENTUAL_DIVERGENTE' | 'COMPETENCIA_DIVERGENTE'
  | 'PARCELA_DIVERGENTE' | 'PROPOSTA_DIVERGENTE' | 'APOLICE_DIVERGENTE'
  | 'SEGURADO_DIVERGENTE' | 'ITEM_DUPLICADO' | 'COMISSAO_JA_CONCILIADA' | 'COMISSAO_JA_RECEBIDA'
  | 'IDENTIFICACAO_INSUFICIENTE'
export type ComissaoConciliacaoOcorrenciaStatus = 'ABERTA' | 'EM_ANALISE' | 'RESOLVIDA' | 'IGNORADA'
export type ComissaoConciliacaoResolucaoTipo = 'VINCULO_CORRIGIDO' | 'DADO_CORRIGIDO' | 'DIVERGENCIA_ACEITA' | 'ITEM_DESCARTADO' | 'REPROCESSADO'
export type ComissaoBaixaTipo = 'BAIXA' | 'ESTORNO'
export type ComissaoBaixaMotivoTipo = 'EXATA' | 'PARCIAL' | 'DIVERGENCIA_ACEITA' | 'CORRECAO' | 'ESTORNO' | 'OUTRO'

export type ComissaoExtratoRow = {
  id: string; tenant_id: string; filial_id: string; seguradora_id: string
  identificacao_externa: string | null; competencia: string | null
  periodo_inicio: string | null; periodo_fim: string | null; data_emissao: string | null
  data_recebimento: string | null; arquivo_nome: string | null; arquivo_referencia: string | null
  origem_tipo: ComissaoExtratoOrigemTipo; origem_formato: ComissaoExtratoFormato | null
  arquivo_mime_type: string | null; arquivo_hash_sha256: string | null; chave_idempotencia: string
  parser_identificador: string | null; parser_versao: string | null; tentativa_processamento: number
  status_processamento: ComissaoExtratoProcessamentoStatus
  status_conciliacao: ComissaoExtratoConciliacaoStatus
  quantidade_itens: number | null; valor_bruto_total: number | null
  valor_liquido_total: number | null; valor_descontos_total: number | null; moeda: string | null
  erro_codigo: ComissaoExtratoErroCodigo | null; erro_mensagem_segura: string | null
  recebido_por_id: string | null; processado_por_id: string | null
  recebido_em: string | null; processamento_iniciado_em: string | null
  processamento_concluido_em: string | null; criado_em: string
  atualizado_em: string; observacoes: string | null
}

export type ComissaoExtratoItemRow = {
  id: string; extrato_id: string; identificacao_externa: string | null
  sequencia_externa: string | null; chave_idempotencia: string
  produtor_id: string | null; ramo_id: string | null; produtor_beneficiario_informado: string | null
  proposta_numero_informado: string | null; apolice_numero_informado: string | null
  endosso_numero_informado: string | null; documento_numero_informado: string | null
  parcela_numero_informado: string | null; segurado_nome_informado: string | null
  competencia: string | null; data_credito: string | null; data_recebimento_informada: string | null
  valor_bruto_informado: number | null; valor_liquido_informado: number | null
  valor_descontos_informado: number | null; percentual_informado: number | null
  tipo_comissao: ComissaoTipo | null; seguradora_lote_informado: string | null
  seguradora_referencia_informada: string | null; descricao_original: string | null
  status_conciliacao: ComissaoExtratoItemStatus; normalizado_em: string | null
  criado_em: string; atualizado_em: string
}

export type ComissaoConciliacaoRow = {
  id: string; item_id: string; comissao_id: string; chave_idempotencia: string
  tipo_associacao: ComissaoConciliacaoTipo; status: ComissaoConciliacaoStatus
  confianca_pct: number | null; valor_previsto_snapshot: number | null
  valor_informado_alocado: number | null; valor_conciliado: number | null
  valor_diferenca: number | null; percentual_previsto_snapshot: number | null
  percentual_informado_snapshot: number | null; percentual_diferenca: number | null
  competencia_prevista_inicio: string | null; competencia_prevista_fim: string | null
  competencia_informada: string | null; motivo: string | null
  associado_por_id: string | null; confirmado_por_id: string | null
  criado_em: string; confirmado_em: string | null; atualizado_em: string
}

export type ComissaoConciliacaoOcorrenciaRow = {
  id: string; item_id: string; conciliacao_id: string | null
  tipo: ComissaoConciliacaoOcorrenciaTipo
  status: ComissaoConciliacaoOcorrenciaStatus; motivo: string | null
  valor_esperado: number | null; valor_encontrado: number | null
  percentual_esperado: number | null; percentual_encontrado: number | null
  competencia_esperada_inicio: string | null; competencia_esperada_fim: string | null
  competencia_encontrada: string | null; resolucao_tipo: ComissaoConciliacaoResolucaoTipo | null
  resolucao_observacao: string | null; identificada_por_id: string | null
  resolvida_por_id: string | null; identificada_em: string
  resolvida_em: string | null; atualizado_em: string
}
export type ComissaoBaixaRow = {
  id: string; comissao_id: string; tipo: ComissaoBaixaTipo
  baixa_origem_id: string | null; origem_tipo: ComissaoExtratoOrigemTipo
  data_efetiva: string; valor_efetivo: number; motivo_tipo: ComissaoBaixaMotivoTipo
  justificativa: string | null; chave_idempotencia: string
  saldo_apos: number; status_resultante: Exclude<ComissaoStatus, 'CANCELADA'>
  criado_por_id: string; criado_em: string
}
export type ComissaoBaixaConciliacaoRow = {
  id: string; baixa_id: string; conciliacao_id: string
  valor_aplicado: number; criado_em: string
}
export type RepasseStatus = 'PREVISTO' | 'LIBERADO' | 'PAGO' | 'CANCELADO'
export type RepasseReciboSentido = 'CREDITO' | 'DEBITO'
export type RepasseReciboStatus = 'EMITIDO' | 'CANCELADO'
export type RepasseFormaPagamento = 'TRANSFERENCIA_BANCARIA' | 'DINHEIRO' | 'CHEQUE' | 'OUTRO'
export type RepasseRow = { id: string; proposta_id: string; comissao_id: string | null; beneficiario_id: string; regra_id: string | null; numero: number | null; papel_beneficiario: string | null; base: string | null; percentual: number | null; valor_previsto: number | null; valor_pago: number | null; valor_diferenca: number | null; status: RepasseStatus | null; previsto_em: string | null; liberado_em: string | null; pago_em: string | null; forma_pagamento: string | null; comprovante_referencia: string | null; observacoes: string | null }
export type RepasseReciboRow = {
  id: string; filial_id: string; beneficiario_id: string; numero: string
  sentido: RepasseReciboSentido; status: RepasseReciboStatus; data_pagamento: string
  forma_pagamento: RepasseFormaPagamento; comprovante_referencia: string | null
  observacoes: string | null; chave_idempotencia: string; chave_cancelamento: string | null
  filial_nome_snapshot: string; beneficiario_nome_snapshot: string
  emitido_por_id: string; emitido_em: string; cancelado_por_id: string | null
  cancelado_em: string | null; motivo_cancelamento: string | null; atualizado_em: string
}
export type RepasseReciboItemRow = {
  id: string; recibo_id: string; repasse_id: string; numero_repasse_snapshot: number | null
  documento_referencia_snapshot: string; segurado_nome_snapshot: string
  seguradora_nome_snapshot: string; ramo_nome_snapshot: string
  papel_beneficiario_snapshot: string | null; valor_previsto_snapshot: number
  valor_pago_snapshot: number; criado_em: string
}

type ApoliceTable = {
  Row: ApoliceRow
  Insert: Partial<ApoliceRow> & Pick<ApoliceRow, "segurado_id">
  Update: Partial<ApoliceRow>
  Relationships: [
    { foreignKeyName: "apolices_segurado_id_fkey"; columns: ["segurado_id"]; isOneToOne: false; referencedRelation: "segurados"; referencedColumns: ["id"] },
    { foreignKeyName: "apolices_seguradora_id_fkey"; columns: ["seguradora_id"]; isOneToOne: false; referencedRelation: "seguradoras"; referencedColumns: ["id"] },
    { foreignKeyName: "apolices_ramo_id_fkey"; columns: ["ramo_id"]; isOneToOne: false; referencedRelation: "ramos"; referencedColumns: ["id"] },
    { foreignKeyName: "apolices_renovada_de_id_fkey"; columns: ["renovada_de_id"]; isOneToOne: false; referencedRelation: "apolices"; referencedColumns: ["id"] },
    { foreignKeyName: "apolices_produtor_id_fkey"; columns: ["produtor_id"]; isOneToOne: false; referencedRelation: "produtores"; referencedColumns: ["id"] },
  ]
}

type PropostaTable = {
  Row: PropostaRow
  Insert: Partial<PropostaRow> & Pick<PropostaRow, "apolice_id" | "stage_id">
  Update: Partial<PropostaRow>
  Relationships: [
    { foreignKeyName: "propostas_apolice_id_fkey"; columns: ["apolice_id"]; isOneToOne: false; referencedRelation: "apolices"; referencedColumns: ["id"] },
    { foreignKeyName: "propostas_cotacao_id_fkey"; columns: ["cotacao_id"]; isOneToOne: true; referencedRelation: "cotacoes"; referencedColumns: ["id"] },
    { foreignKeyName: "propostas_stage_id_fkey"; columns: ["stage_id"]; isOneToOne: false; referencedRelation: "pipeline_stages"; referencedColumns: ["id"] },
    { foreignKeyName: "propostas_responsavel_id_fkey"; columns: ["responsavel_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
    { foreignKeyName: "propostas_recebimento_grade_id_fkey"; columns: ["recebimento_grade_id"]; isOneToOne: false; referencedRelation: "recebimento_grades"; referencedColumns: ["id"] },
    { foreignKeyName: "propostas_endosso_subtipo_id_fkey"; columns: ["endosso_subtipo_id"]; isOneToOne: false; referencedRelation: "endosso_subtipos"; referencedColumns: ["id"] },
    { foreignKeyName: "propostas_cancelamento_motivo_id_fkey"; columns: ["cancelamento_motivo_id"]; isOneToOne: false; referencedRelation: "cancelamento_motivos"; referencedColumns: ["id"] },
  ]
}

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      apolices: ApoliceTable
      apolice_itens: DbTable<ApoliceItemRow, "apolice_id">
      pos_vendas: DbTable<PosVendaRow, "apolice_id" | "stage_id">
      sinistros: DbTable<SinistroRow, "apolice_id" | "stage_id">
      sinistro_envolvidos: DbTable<SinistroEnvolvidoRow, "sinistro_id">
      item_veiculo: DbTable<ItemVeiculoRow, "apolice_item_id">
      item_imovel: DbTable<ItemImovelRow, "apolice_item_id">
      item_empresa: DbTable<ItemEmpresaRow, "apolice_item_id">
      item_vida: DbTable<ItemVidaRow, "apolice_item_id">
      item_coberturas: DbTable<ItemCoberturaRow, "apolice_item_id">
      parcelas: DbTable<ParcelaRow, "proposta_id">
      comissoes: DbTable<ComissaoRow, "proposta_id">
      comissao_extratos: DbTable<ComissaoExtratoRow, "tenant_id" | "filial_id" | "seguradora_id" | "chave_idempotencia">
      comissao_extrato_itens: DbTable<ComissaoExtratoItemRow, "extrato_id" | "chave_idempotencia">
      comissao_conciliacoes: DbTable<ComissaoConciliacaoRow, "item_id" | "comissao_id" | "chave_idempotencia">
      comissao_conciliacao_ocorrencias: DbTable<ComissaoConciliacaoOcorrenciaRow, "item_id">
      comissao_baixas: DbTable<ComissaoBaixaRow, "comissao_id" | "tipo" | "origem_tipo" | "data_efetiva" | "valor_efetivo" | "motivo_tipo" | "chave_idempotencia" | "saldo_apos" | "status_resultante" | "criado_por_id" | "criado_em">
      comissao_baixa_conciliacoes: DbTable<ComissaoBaixaConciliacaoRow, "baixa_id" | "conciliacao_id" | "valor_aplicado" | "criado_em">
      repasses: DbTable<RepasseRow, "proposta_id" | "beneficiario_id">
      repasse_recibos: DbTable<RepasseReciboRow, "filial_id" | "beneficiario_id" | "numero" | "sentido" | "status" | "data_pagamento" | "forma_pagamento" | "chave_idempotencia" | "filial_nome_snapshot" | "beneficiario_nome_snapshot" | "emitido_por_id" | "emitido_em" | "atualizado_em">
      repasse_recibo_itens: DbTable<RepasseReciboItemRow, "recibo_id" | "repasse_id" | "documento_referencia_snapshot" | "segurado_nome_snapshot" | "seguradora_nome_snapshot" | "ramo_nome_snapshot" | "valor_previsto_snapshot" | "valor_pago_snapshot" | "criado_em">
      endosso_subtipos: DbTable<EndossoSubtipoRow, "tenant_id" | "nome" | "natureza_canonica" | "ativo">
      cancelamento_motivos: DbTable<CancelamentoMotivoRow, "tenant_id" | "nome" | "ativo">
      calculos: DbTable<CalculoRow, "oportunidade_id" | "ramo_id" | "origem">
      calc_auto: DbTable<CalcAutoRow, "calculo_id">
      calc_residencia: DbTable<CalcResidenciaRow, "calculo_id">
      calc_condominio: DbTable<CalcCondominioRow, "calculo_id">
      calc_vida: DbTable<CalcVidaRow, "calculo_id">
      calc_empresa: DbTable<CalcEmpresaRow, "calculo_id">
      calc_diversos: DbTable<CalcDiversosRow, "calculo_id">
      calculo_coberturas: DbTable<CalculoCoberturaRow, "calculo_id">
      calculo_execucoes: DbTable<CalculoExecucaoRow, "calculo_id" | "seguradora_id" | "tentativa" | "motor" | "comissao_origem" | "status" | "criada_em">
      cotacoes: DbTable<CotacaoRow, "execucao_id">
      cotacao_coberturas: DbTable<CotacaoCoberturaRow, "cotacao_id" | "chave_resultado">
      cotacao_parcelamentos: DbTable<CotacaoParcelamentoRow, "cotacao_id" | "codigo_opcao" | "forma_pagamento" | "quantidade_parcelas">
      apresentacoes_comerciais: DbTable<ApresentacaoComercialRow, "oportunidade_id">
      apresentacao_cotacoes: DbTable<ApresentacaoCotacaoRow, "apresentacao_id" | "cotacao_id" | "ordem">
      anexos: {
        Row: {
          anexado_em: string | null
          categoria: string | null
          descricao: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          filial_id: string | null
          hash_sha256: string | null
          id: string
          mime_type: string | null
          nome_arquivo: string | null
          origem: string | null
          status: string | null
          tamanho_bytes: number | null
          tenant_id: string
          url_armazenamento: string | null
        }
        Insert: {
          anexado_em?: string | null
          categoria?: string | null
          descricao?: string | null
          entidade_id: string
          entidade_tipo: string
          filial_id?: string | null
          hash_sha256?: string | null
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          origem?: string | null
          status?: string | null
          tamanho_bytes?: number | null
          tenant_id: string
          url_armazenamento?: string | null
        }
        Update: {
          anexado_em?: string | null
          categoria?: string | null
          descricao?: string | null
          entidade_id?: string
          entidade_tipo?: string
          filial_id?: string | null
          hash_sha256?: string | null
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          origem?: string | null
          status?: string | null
          tamanho_bytes?: number | null
          tenant_id?: string
          url_armazenamento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anexos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          canal: string | null
          concluida_em: string | null
          descricao: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          filial_id: string | null
          fixada_em: string | null
          id: string
          lembrete_em: string | null
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          recorrente: boolean | null
          responsavel_id: string | null
          status: string | null
          tenant_id: string
          tipo: string | null
          titulo: string | null
          vencimento: string | null
        }
        Insert: {
          canal?: string | null
          concluida_em?: string | null
          descricao?: string | null
          entidade_id: string
          entidade_tipo: string
          filial_id?: string | null
          fixada_em?: string | null
          id?: string
          lembrete_em?: string | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          recorrente?: boolean | null
          responsavel_id?: string | null
          status?: string | null
          tenant_id: string
          tipo: string
          titulo?: string | null
          vencimento?: string | null
        }
        Update: {
          canal?: string | null
          concluida_em?: string | null
          descricao?: string | null
          entidade_id?: string
          entidade_tipo?: string
          filial_id?: string | null
          fixada_em?: string | null
          id?: string
          lembrete_em?: string | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          recorrente?: boolean | null
          responsavel_id?: string | null
          status?: string | null
          tenant_id?: string
          tipo?: string
          titulo?: string | null
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      atividade_mencoes: {
        Row: {
          atividade_id: string
          id: string
          lida_em: string | null
          notificada_em: string | null
          profile_id: string
        }
        Insert: {
          atividade_id: string
          id?: string
          lida_em?: string | null
          notificada_em?: string | null
          profile_id: string
        }
        Update: {
          atividade_id?: string
          id?: string
          lida_em?: string | null
          notificada_em?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_mencoes_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_mencoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string | null
          campo: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          ip: string | null
          ocorrido_em: string | null
          origem: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          campo?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          ip?: string | null
          ocorrido_em?: string | null
          origem?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          campo?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          ip?: string | null
          ocorrido_em?: string | null
          origem?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coberturas_catalogo: {
        Row: {
          ativo: boolean | null
          capital_lmi_padrao: number | null
          carencia_dias: number | null
          caracteristica: string | null
          codigo: string | null
          codigo_susep: string | null
          descricao: string | null
          franquia_padrao: number | null
          id: string
          modalidade: string | null
          nome: string | null
          obrigatoria: boolean | null
          ordem: number | null
          ramo_id: string
          tipo_cobertura: string | null
          tipo_risco: string | null
        }
        Insert: {
          ativo?: boolean
          capital_lmi_padrao?: number | null
          carencia_dias?: number | null
          caracteristica?: string | null
          codigo?: string | null
          codigo_susep?: string | null
          descricao?: string | null
          franquia_padrao?: number | null
          id?: string
          modalidade?: string | null
          nome: string
          obrigatoria?: boolean
          ordem?: number | null
          ramo_id: string
          tipo_cobertura?: string | null
          tipo_risco?: string | null
        }
        Update: {
          ativo?: boolean
          capital_lmi_padrao?: number | null
          carencia_dias?: number | null
          caracteristica?: string | null
          codigo?: string | null
          codigo_susep?: string | null
          descricao?: string | null
          franquia_padrao?: number | null
          id?: string
          modalidade?: string | null
          nome?: string
          obrigatoria?: boolean
          ordem?: number | null
          ramo_id?: string
          tipo_cobertura?: string | null
          tipo_risco?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coberturas_catalogo_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
        ]
      }
      campo_definicoes: {
        Row: {
          agrupamento: string | null
          ajuda: string | null
          ativo: boolean | null
          chave: string
          entidade_tipo: string
          filial_id: string | null
          formato: string | null
          id: string
          mascara: string | null
          max_valor: number | null
          min_valor: number | null
          nome: string | null
          obrigatorio: boolean | null
          ordem: number | null
          placeholder: string | null
          tamanho_max: number | null
          tenant_id: string
          tipo_dado: string | null
          visivel_em_listagem: boolean | null
        }
        Insert: {
          agrupamento?: string | null
          ajuda?: string | null
          ativo?: boolean
          chave: string
          entidade_tipo: string
          filial_id?: string | null
          formato?: string | null
          id?: string
          mascara?: string | null
          max_valor?: number | null
          min_valor?: number | null
          nome: string
          obrigatorio?: boolean
          ordem?: number | null
          placeholder?: string | null
          tamanho_max?: number | null
          tenant_id: string
          tipo_dado: string
          visivel_em_listagem?: boolean
        }
        Update: {
          agrupamento?: string | null
          ajuda?: string | null
          ativo?: boolean
          chave?: string
          entidade_tipo?: string
          filial_id?: string | null
          formato?: string | null
          id?: string
          mascara?: string | null
          max_valor?: number | null
          min_valor?: number | null
          nome?: string
          obrigatorio?: boolean
          ordem?: number | null
          placeholder?: string | null
          tamanho_max?: number | null
          tenant_id?: string
          tipo_dado?: string
          visivel_em_listagem?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "campo_definicoes_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campo_definicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campo_opcoes: {
        Row: {
          ativo: boolean | null
          campo_definicao_id: string
          id: string
          ordem: number | null
          rotulo: string | null
          valor: string | null
        }
        Insert: {
          ativo?: boolean
          campo_definicao_id: string
          id?: string
          ordem?: number | null
          rotulo: string
          valor: string
        }
        Update: {
          ativo?: boolean
          campo_definicao_id?: string
          id?: string
          ordem?: number | null
          rotulo?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "campo_opcoes_campo_definicao_id_fkey"
            columns: ["campo_definicao_id"]
            isOneToOne: false
            referencedRelation: "campo_definicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      campo_valores: {
        Row: {
          campo_definicao_id: string
          entidade_id: string
          id: string
          origem: string | null
          preenchido_em: string | null
          validado_em: string | null
          valor_booleano: boolean | null
          valor_data: string | null
          valor_datahora: string | null
          valor_numero: number | null
          valor_opcao_id: string | null
          valor_texto: string | null
        }
        Insert: {
          campo_definicao_id: string
          entidade_id: string
          id?: string
          origem?: string | null
          preenchido_em?: string | null
          validado_em?: string | null
          valor_booleano?: boolean | null
          valor_data?: string | null
          valor_datahora?: string | null
          valor_numero?: number | null
          valor_opcao_id?: string | null
          valor_texto?: string | null
        }
        Update: {
          campo_definicao_id?: string
          entidade_id?: string
          id?: string
          origem?: string | null
          preenchido_em?: string | null
          validado_em?: string | null
          valor_booleano?: boolean | null
          valor_data?: string | null
          valor_datahora?: string | null
          valor_numero?: number | null
          valor_opcao_id?: string | null
          valor_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campo_valores_campo_definicao_id_fkey"
            columns: ["campo_definicao_id"]
            isOneToOne: false
            referencedRelation: "campo_definicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campo_valores_valor_opcao_id_fkey"
            columns: ["valor_opcao_id"]
            isOneToOne: false
            referencedRelation: "campo_opcoes"
            referencedColumns: ["id"]
          },
        ]
      }
      campo_valor_opcoes: {
        Row: {
          campo_opcao_id: string
          campo_valor_id: string
          id: string
          ordem: number | null
        }
        Insert: {
          campo_opcao_id: string
          campo_valor_id: string
          id?: string
          ordem?: number | null
        }
        Update: {
          campo_opcao_id?: string
          campo_valor_id?: string
          id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campo_valor_opcoes_campo_opcao_id_fkey"
            columns: ["campo_opcao_id"]
            isOneToOne: false
            referencedRelation: "campo_opcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campo_valor_opcoes_campo_valor_id_fkey"
            columns: ["campo_valor_id"]
            isOneToOne: false
            referencedRelation: "campo_valores"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: PropostaTable
      recebimento_grades: {
        Row: {
          ativo: boolean | null
          base_calculo: string | null
          considera_adicional_fracionamento: boolean | null
          considera_iof: boolean | null
          id: string
          nome: string | null
          observacoes: string | null
          percentual_default: number | null
          qtd_parcelas: number | null
          ramo_id: string
          seguradora_id: string
          tipo: string | null
          vitalicio: boolean | null
        }
        Insert: {
          ativo?: boolean
          base_calculo?: string | null
          considera_adicional_fracionamento?: boolean
          considera_iof?: boolean
          id?: string
          nome: string
          observacoes?: string | null
          percentual_default?: number | null
          qtd_parcelas: number
          ramo_id: string
          seguradora_id: string
          tipo: string
          vitalicio?: boolean
        }
        Update: {
          ativo?: boolean
          base_calculo?: string | null
          considera_adicional_fracionamento?: boolean
          considera_iof?: boolean
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_default?: number | null
          qtd_parcelas?: number
          ramo_id?: string
          seguradora_id?: string
          tipo?: string
          vitalicio?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_grades_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_grades_seguradora_id_fkey"
            columns: ["seguradora_id"]
            isOneToOne: false
            referencedRelation: "seguradoras"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento_grade_parcelas: {
        Row: {
          ativo: boolean | null
          dias_apos_vencimento: number | null
          grade_id: string
          id: string
          numero: number | null
          percentual: number | null
          percentual_sobre: string | null
          tipo_comissao: ComissaoTipo | null
        }
        Insert: {
          ativo?: boolean
          dias_apos_vencimento?: number | null
          grade_id: string
          id?: string
          numero: number
          percentual?: number | null
          percentual_sobre?: string | null
          tipo_comissao: ComissaoTipo
        }
        Update: {
          ativo?: boolean
          dias_apos_vencimento?: number | null
          grade_id?: string
          id?: string
          numero?: number
          percentual?: number | null
          percentual_sobre?: string | null
          tipo_comissao?: ComissaoTipo
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_grade_parcelas_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "recebimento_grades"
            referencedColumns: ["id"]
          },
        ]
      }
      repasse_regras: {
        Row: {
          ativo: boolean | null
          base: string | null
          filial_id: string | null
          fim_vigencia: string | null
          gatilho: string | null
          id: string
          inicio_vigencia: string | null
          limite_parcelas: number | null
          observacoes: string | null
          papel: string | null
          percentual: number | null
          prioridade: number | null
          produtor_id: string | null
          qtd_parcelas: number | null
          ramo_id: string | null
          tenant_id: string
          tipo_documento: string | null
          valor_fixo: number | null
        }
        Insert: {
          ativo?: boolean
          base: string
          filial_id?: string | null
          fim_vigencia?: string | null
          gatilho: string
          id?: string
          inicio_vigencia?: string | null
          limite_parcelas?: number | null
          observacoes?: string | null
          papel: string
          percentual?: number | null
          prioridade?: number
          produtor_id?: string | null
          qtd_parcelas?: number | null
          ramo_id?: string | null
          tenant_id: string
          tipo_documento?: string | null
          valor_fixo?: number | null
        }
        Update: {
          ativo?: boolean
          base?: string
          filial_id?: string | null
          fim_vigencia?: string | null
          gatilho?: string
          id?: string
          inicio_vigencia?: string | null
          limite_parcelas?: number | null
          observacoes?: string | null
          papel?: string
          percentual?: number | null
          prioridade?: number
          produtor_id?: string | null
          qtd_parcelas?: number | null
          ramo_id?: string | null
          tenant_id?: string
          tipo_documento?: string | null
          valor_fixo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repasse_regras_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_regras_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_regras_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_regras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_cobrancas: {
        Row: FinanceiroCobrancaRow
        Insert: Partial<FinanceiroCobrancaRow> & Pick<FinanceiroCobrancaRow, "parcela_id" | "stage_id">
        Update: Partial<FinanceiroCobrancaRow>
        Relationships: [
          {
            foreignKeyName: "financeiro_cobrancas_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perda: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          id: string
          nome: string | null
          ordem: number | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          id?: string
          nome: string
          ordem?: number | null
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "motivos_perda_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: OportunidadeContractFields & {
          filial_id: string
          id: string
          motivo_perda_id: string | null
          origem_id: string | null
          ramo_id: string | null
          responsavel_id: string | null
          segurado_id: string | null
          stage_id: string
          tenant_id: string
        }
        Insert: Partial<OportunidadeContractFields> & {
          filial_id: string
          id?: string
          motivo_perda_id?: string | null
          origem_id?: string | null
          ramo_id?: string | null
          responsavel_id?: string | null
          segurado_id?: string | null
          stage_id: string
          tenant_id: string
        }
        Update: Partial<OportunidadeContractFields> & {
          filial_id?: string
          id?: string
          motivo_perda_id?: string | null
          origem_id?: string | null
          ramo_id?: string | null
          responsavel_id?: string | null
          segurado_id?: string | null
          stage_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_apolice_origem_id_fkey"
            columns: ["apolice_origem_id"]
            isOneToOne: false
            referencedRelation: "apolices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_motivo_perda_id_fkey"
            columns: ["motivo_perda_id"]
            isOneToOne: false
            referencedRelation: "motivos_perda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_segurado_id_fkey"
            columns: ["segurado_id"]
            isOneToOne: false
            referencedRelation: "segurados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      origens: {
        Row: {
          ativo: boolean | null
          id: string
          nome: string | null
          ordem: number | null
          tenant_id: string
          tipo: string | null
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
          ordem?: number | null
          tenant_id: string
          tipo?: string | null
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          ordem?: number | null
          tenant_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "origens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          cor: string | null
          finaliza_com_perda: boolean | null
          finaliza_com_sucesso: boolean | null
          id: string
          nome: string | null
          ordem: number | null
          pipeline_id: string
          probabilidade: number | null
          sla_dias: number | null
          tipo_stage: string | null
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          cor?: string | null
          finaliza_com_perda?: boolean
          finaliza_com_sucesso?: boolean
          id?: string
          nome: string
          ordem?: number
          pipeline_id: string
          probabilidade?: number | null
          sla_dias?: number | null
          tipo_stage?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          cor?: string | null
          finaliza_com_perda?: boolean
          finaliza_com_sucesso?: boolean
          id?: string
          nome?: string
          ordem?: number
          pipeline_id?: string
          probabilidade?: number | null
          sla_dias?: number | null
          tipo_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          ativo: boolean | null
          descricao: string | null
          entidade_tipo: string | null
          filial_id: string | null
          id: string
          modelo_fabrica: boolean | null
          nome: string | null
          ordem: number | null
          permite_customizacao: boolean | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          entidade_tipo: string
          filial_id?: string | null
          id?: string
          modelo_fabrica?: boolean
          nome: string
          ordem?: number | null
          permite_customizacao?: boolean
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          entidade_tipo?: string
          filial_id?: string | null
          id?: string
          modelo_fabrica?: boolean
          nome?: string
          ordem?: number | null
          permite_customizacao?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_apolice_origem_id_fkey"
            columns: ["apolice_origem_id"]
            isOneToOne: false
            referencedRelation: "apolices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: DbTable<ProfileRow, 'id' | 'tenant_id'>
      ramos: {
        Row: {
          ativo: boolean | null
          codigo_susep: string | null
          exige_coberturas: boolean | null
          exige_item: boolean | null
          forma_calculo: string | null
          grupo_operacional: string | null
          id: string
          is_monthly: boolean | null
          nome: string | null
          observacoes: string | null
          ordem: number | null
          permite_endosso: boolean | null
          renovavel: boolean | null
          risk_type: string | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          codigo_susep?: string | null
          exige_coberturas?: boolean
          exige_item?: boolean
          forma_calculo?: string | null
          grupo_operacional?: string
          id?: string
          is_monthly?: boolean
          nome: string
          observacoes?: string | null
          ordem?: number | null
          permite_endosso?: boolean
          renovavel?: boolean
          risk_type?: string
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          codigo_susep?: string | null
          exige_coberturas?: boolean
          exige_item?: boolean
          forma_calculo?: string | null
          grupo_operacional?: string
          id?: string
          is_monthly?: boolean
          nome?: string
          observacoes?: string | null
          ordem?: number | null
          permite_endosso?: boolean
          renovavel?: boolean
          risk_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ramos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: DbTable<RolePermissionRow, 'perfil_id'>
      seguradoras: {
        Row: {
          ativo: boolean | null
          aceita_busca_automatica: boolean | null
          aceita_importacao_pdf: boolean | null
          cnpj: string | null
          codigo_interno: string | null
          codigo_susep: string | null
          email: string | null
          id: string
          nome: string | null
          nome_curto: string | null
          observacoes: string | null
          portal_url: string | null
          site: string | null
          telefone_assistencia: string | null
          telefone_sac: string | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          aceita_busca_automatica?: boolean
          aceita_importacao_pdf?: boolean
          cnpj?: string | null
          codigo_interno?: string | null
          codigo_susep?: string | null
          email?: string | null
          id?: string
          nome: string
          nome_curto?: string | null
          observacoes?: string | null
          portal_url?: string | null
          site?: string | null
          telefone_assistencia?: string | null
          telefone_sac?: string | null
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          aceita_busca_automatica?: boolean
          aceita_importacao_pdf?: boolean
          cnpj?: string | null
          codigo_interno?: string | null
          codigo_susep?: string | null
          email?: string | null
          id?: string
          nome?: string
          nome_curto?: string | null
          observacoes?: string | null
          portal_url?: string | null
          site?: string | null
          telefone_assistencia?: string | null
          telefone_sac?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguradoras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      segurados: DbTable<SeguradoRow, 'tenant_id' | 'filial_id'>
      pessoa_contato: DbTable<PessoaContatoRow, 'pj_id'>
      tenants: DbTable<TenantRow, never>
          produtores: DbTable<ProdutorRow, 'tenant_id'>
          profile_filiais: DbTable<ProfileFilialRow, 'profile_id' | 'filial_id' | 'perfil_id'>
          perfis: DbTable<PerfilRow, 'tenant_id'>
          filiais: DbTable<FilialRow, 'tenant_id'>
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_team_members: {
        Args: { tenantId: string }
        Returns: {
          avatar_url: string | null
          corretoras_count: number
          ativo: boolean
          status: string | null
          convite_status: string | null
          convite_enviado_em: string | null
          email: string
          nome_completo: string
          id: string
          perfil_principal: string | null
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      card_status: "pending" | "won" | "lost"
      estado_civil:
        | "Solteiro"
        | "Casado"
        | "Divorciado"
        | "Viuvo"
        | "UniaoEstavel"
      pipeline_module:
        | "comercial"
        | "emissao"
        | "pos_venda"
        | "financeiro"
        | "sinistro"
      porte_empresa:
        | "MEI"
        | "Microempresa"
        | "PequenoPorte"
        | "MedioPorte"
        | "GrandePorte"
      sexo_pessoa: "M" | "F" | "Outro"
      status_pessoa: "Ativo" | "Inativo" | "Prospecto"
      tipo_negocio: "novo" | "renovacao" | "endosso"
      tipo_pessoa: "PF" | "PJ"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_status: ["pending", "won", "lost"],
      estado_civil: [
        "Solteiro",
        "Casado",
        "Divorciado",
        "Viuvo",
        "UniaoEstavel",
      ],
      pipeline_module: [
        "comercial",
        "emissao",
        "pos_venda",
        "financeiro",
        "sinistro",
      ],
      porte_empresa: [
        "MEI",
        "Microempresa",
        "PequenoPorte",
        "MedioPorte",
        "GrandePorte",
      ],
      sexo_pessoa: ["M", "F", "Outro"],
      status_pessoa: ["Ativo", "Inativo", "Prospecto"],
      tipo_negocio: ["novo", "renovacao", "endosso"],
      tipo_pessoa: ["PF", "PJ"],
    },
  },
} as const
