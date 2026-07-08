import { describe, expect, it } from 'vitest';
import {
  buildCatalogoEnxutoInsertPayload,
  buildCatalogoEnxutoUpdatePayload,
  buildCampoDefinicaoInsertPayload,
  buildCampoDefinicaoUpdatePayload,
  buildCampoOpcaoInsertPayload,
  buildCoberturaCatalogoInsertPayload,
  buildCoberturaCatalogoUpdatePayload,
  buildLookupInsertPayload,
  buildRamoInsertPayload,
  buildRamoUpdatePayload,
  buildRecebimentoGradeInsertPayload,
  buildRecebimentoGradeParcelaInsertPayload,
  buildRepasseRegraInsertPayload,
  buildRepasseRegraUpdatePayload,
  buildSeguradoraInsertPayload,
  buildSeguradoraUpdatePayload,
  slugifyCampoChave,
} from './useLookupsAdmin';
import { getRamoCategoriaRiscoFromFields } from './useLookups';

const ramoInput = {
  nome: '  Vida em Grupo PME  ',
  codigo_susep: ' 09876 ',
  categoria_risco: 'VIDA' as const,
  is_monthly: true,
  renovavel: true,
  permite_endosso: true,
  exige_item: true,
  exige_coberturas: true,
  ordem: 30,
  ativo: true,
  observacoes: '  Ramo mensal PME  ',
};

describe('useLookupsAdmin Ramos payload', () => {
  it('cria ramo ativo para aparecer nas consultas do mock', () => {
    expect(buildRamoInsertPayload(ramoInput, 'tenant-test')).toEqual({
      nome: 'Vida em Grupo PME',
      tenant_id: 'tenant-test',
      codigo_susep: '09876',
      risk_type: 'VIDA',
      grupo_operacional: 'Pessoas',
      forma_calculo: 'VIDA',
      is_monthly: true,
      renovavel: true,
      permite_endosso: true,
      exige_item: true,
      exige_coberturas: true,
      ordem: 30,
      ativo: true,
      observacoes: 'Ramo mensal PME',
    });
  });

  it('monta payload de edicao sem trocar tenant', () => {
    expect(buildRamoUpdatePayload({ ...ramoInput, nome: 'Vida Global', is_monthly: false, ativo: false })).toEqual({
      nome: 'Vida Global',
      codigo_susep: '09876',
      risk_type: 'VIDA',
      grupo_operacional: 'Pessoas',
      forma_calculo: 'VIDA',
      is_monthly: false,
      renovavel: true,
      permite_endosso: true,
      exige_item: true,
      exige_coberturas: true,
      ordem: 30,
      ativo: false,
      observacoes: 'Ramo mensal PME',
    });
  });

  it('deriva os campos tecnicos da categoria residencial', () => {
    expect(buildRamoUpdatePayload({ ...ramoInput, categoria_risco: 'RESIDENCIAL' })).toMatchObject({
      risk_type: 'IMOVEL',
      grupo_operacional: 'Patrimonial',
      forma_calculo: 'RESIDENCIA',
    });
  });

  it('deriva os campos tecnicos da categoria auto e frota', () => {
    expect(buildRamoUpdatePayload({ ...ramoInput, categoria_risco: 'AUTO_FROTA' })).toMatchObject({
      risk_type: 'VEICULO',
      grupo_operacional: 'Auto e Frota',
      forma_calculo: 'AUTO',
    });
  });

  it('reconhece categoria de ramo existente ao editar', () => {
    expect(getRamoCategoriaRiscoFromFields('VIDA', 'Pessoas', 'VIDA').value).toBe('VIDA');
  });
});

describe('useCoberturasCatalogoAdmin payload', () => {
  const coberturaInput = {
    ramo_id: 'ramo-test',
    codigo: ' cas-001 ',
    codigo_susep: '',
    nome: '  Casco  ',
    descricao: '  Cobertura básica do casco  ',
    tipo_cobertura: ' basica ',
    caracteristica: ' massificado ',
    tipo_risco: ' danos ',
    modalidade: ' regular ',
    capital_lmi_padrao: 100000,
    franquia_padrao: null,
    carencia_dias: 0,
    obrigatoria: true,
    ordem: 10,
    ativo: true,
  };

  it('normaliza payload de criacao conforme coberturas_catalogo V2', () => {
    expect(buildCoberturaCatalogoInsertPayload(coberturaInput)).toEqual({
      ramo_id: 'ramo-test',
      codigo: 'cas-001',
      codigo_susep: null,
      nome: 'Casco',
      descricao: 'Cobertura básica do casco',
      tipo_cobertura: 'basica',
      caracteristica: 'massificado',
      tipo_risco: 'danos',
      modalidade: 'regular',
      capital_lmi_padrao: 100000,
      franquia_padrao: null,
      carencia_dias: 0,
      obrigatoria: true,
      ordem: 10,
      ativo: true,
    });
  });

  it('monta payload de edicao preservando ramo_id', () => {
    expect(buildCoberturaCatalogoUpdatePayload({ ...coberturaInput, nome: '  APP  ', ativo: false })).toMatchObject({
      ramo_id: 'ramo-test',
      nome: 'APP',
      ativo: false,
    });
  });
});

describe('useLookupsAdmin lookup payload', () => {
  it('cria catalogo auxiliar ativo para aparecer nas consultas filtradas', () => {
    expect(buildLookupInsertPayload('  Porto Seguro  ', 'tenant-test')).toEqual({
      nome: 'Porto Seguro',
      tenant_id: 'tenant-test',
      ativo: true,
    });
  });
});

describe('useCatalogoEnxutoAdmin payload', () => {
  const input = {
    nome: '  Indicação Parceiro  ',
    classificacao: '  indicação  ',
    ordem: 20,
    ativo: true,
  };

  it('cria origem com tipo, ordem e ativo conforme o DBML V2', () => {
    expect(buildCatalogoEnxutoInsertPayload(input, 'tenant-test', 'tipo')).toEqual({
      nome: 'Indicação Parceiro',
      tipo: 'indicação',
      ordem: 20,
      ativo: true,
      tenant_id: 'tenant-test',
    });
  });

  it('cria motivo de perda com categoria e permite ordem nula', () => {
    expect(buildCatalogoEnxutoInsertPayload({ ...input, classificacao: '', ordem: null }, 'tenant-test', 'categoria')).toEqual({
      nome: 'Indicação Parceiro',
      categoria: null,
      ordem: null,
      ativo: true,
      tenant_id: 'tenant-test',
    });
  });

  it('monta payload de edicao sem trocar tenant', () => {
    expect(buildCatalogoEnxutoUpdatePayload({ ...input, nome: 'Preço', ativo: false }, 'categoria')).toEqual({
      nome: 'Preço',
      categoria: 'indicação',
      ordem: 20,
      ativo: false,
    });
  });
});

describe('useSeguradorasAdmin payload', () => {
  const seguradoraInput = {
    nome: '  Porto Seguro  ',
    nome_curto: ' Porto ',
    cnpj: '61.198.164/0001-60',
    codigo_susep: ' 12345 ',
    codigo_interno: ' porto-auto ',
    site: ' https://porto.com.br ',
    portal_url: ' https://portal.porto.com.br ',
    telefone_sac: ' 0800 000 000 ',
    telefone_assistencia: '',
    email: ' atendimento@porto.com.br ',
    aceita_importacao_pdf: true,
    aceita_busca_automatica: false,
    ativo: true,
    observacoes: '  Seguradora principal  ',
  };

  it('normaliza o payload de criacao conforme o DBML V2', () => {
    expect(buildSeguradoraInsertPayload(seguradoraInput, 'tenant-test')).toEqual({
      nome: 'Porto Seguro',
      nome_curto: 'Porto',
      cnpj: '61198164000160',
      codigo_susep: '12345',
      codigo_interno: 'porto-auto',
      site: 'https://porto.com.br',
      portal_url: 'https://portal.porto.com.br',
      telefone_sac: '0800 000 000',
      telefone_assistencia: null,
      email: 'atendimento@porto.com.br',
      aceita_importacao_pdf: true,
      aceita_busca_automatica: false,
      ativo: true,
      observacoes: 'Seguradora principal',
      tenant_id: 'tenant-test',
    });
  });

  it('monta payload de edicao sem trocar tenant', () => {
    expect(buildSeguradoraUpdatePayload({ ...seguradoraInput, nome: '  Allianz  ', ativo: false })).toMatchObject({
      nome: 'Allianz',
      ativo: false,
      cnpj: '61198164000160',
    });
  });
});

describe('useRecebimentoGradesAdmin payload', () => {
  const gradeInput = {
    seguradora_id: 'seguradora-test',
    ramo_id: 'ramo-test',
    nome: '  Porto Auto 3x  ',
    tipo: 'ANTECIPADO_N' as const,
    qtd_parcelas: 3,
    base_calculo: 'PREMIO_LIQUIDO' as const,
    percentual_default: 20,
    considera_iof: false,
    considera_adicional_fracionamento: true,
    vitalicio: false,
    ativo: true,
    observacoes: '  Antecipado em eventos  ',
  };

  it('normaliza grade de recebimento conforme o DBML V2', () => {
    expect(buildRecebimentoGradeInsertPayload(gradeInput)).toEqual({
      seguradora_id: 'seguradora-test',
      ramo_id: 'ramo-test',
      nome: 'Porto Auto 3x',
      tipo: 'ANTECIPADO_N',
      qtd_parcelas: 3,
      base_calculo: 'PREMIO_LIQUIDO',
      percentual_default: 20,
      considera_iof: false,
      considera_adicional_fracionamento: true,
      vitalicio: false,
      ativo: true,
      observacoes: 'Antecipado em eventos',
    });
  });

  it('preserva percentual nulo em parcela para significar percentual da proposta', () => {
    expect(buildRecebimentoGradeParcelaInsertPayload({
      grade_id: 'grade-test',
      numero: 1,
      percentual: null,
      percentual_sobre: 'PREMIO',
      dias_apos_vencimento: 0,
      ativo: true,
    })).toEqual({
      grade_id: 'grade-test',
      numero: 1,
      percentual: null,
      percentual_sobre: 'PREMIO',
      dias_apos_vencimento: 0,
      ativo: true,
    });
  });
});

describe('useRepasseRegrasAdmin payload', () => {
  const regraInput = {
    filial_id: '',
    produtor_id: 'produtor-test',
    ramo_id: null,
    papel: 'PRODUTOR' as const,
    tipo_documento: 'NOVA' as const,
    base: 'COMISSAO' as const,
    percentual: 35,
    valor_fixo: null,
    gatilho: 'CONFORME_RECEBIMENTO' as const,
    qtd_parcelas: null,
    limite_parcelas: null,
    prioridade: 80,
    inicio_vigencia: '2026-01-01',
    fim_vigencia: '',
    ativo: true,
    observacoes: '  Override individual  ',
  };

  it('cria regra de repasse com tenant e datas vazias como null', () => {
    expect(buildRepasseRegraInsertPayload({ ...regraInput, filial_id: null }, 'tenant-test')).toEqual({
      tenant_id: 'tenant-test',
      filial_id: null,
      produtor_id: 'produtor-test',
      ramo_id: null,
      papel: 'PRODUTOR',
      tipo_documento: 'NOVA',
      base: 'COMISSAO',
      percentual: 35,
      valor_fixo: null,
      gatilho: 'CONFORME_RECEBIMENTO',
      qtd_parcelas: null,
      limite_parcelas: null,
      prioridade: 80,
      inicio_vigencia: '2026-01-01',
      fim_vigencia: null,
      ativo: true,
      observacoes: 'Override individual',
    });
  });

  it('monta payload de edicao sem trocar tenant', () => {
    expect(buildRepasseRegraUpdatePayload({
      ...regraInput,
      produtor_id: null,
      tipo_documento: null,
      base: 'VALOR_FIXO',
      percentual: null,
      valor_fixo: 150,
    })).toMatchObject({
      produtor_id: null,
      tipo_documento: null,
      base: 'VALOR_FIXO',
      percentual: null,
      valor_fixo: 150,
      observacoes: 'Override individual',
    });
  });
});

describe('useCampoDefinicoesAdmin payload', () => {
  const campoInput = {
    filial_id: null,
    entidade_tipo: 'segurado' as const,
    chave: ' Nº da Carteirinha ',
    nome: '  Nº da carteirinha  ',
    tipo_dado: 'TEXTO_CURTO' as const,
    formato: 'MOEDA' as const,
    obrigatorio: false,
    ativo: true,
    ordem: 10,
    ajuda: '  Usado em saúde  ',
    min_valor: null,
    max_valor: null,
    tamanho_max: 30,
    mascara: '',
    placeholder: ' ABC123 ',
    agrupamento: ' Saúde ',
    visivel_em_listagem: true,
  };

  it('normaliza chave estavel e limpa formato quando o tipo nao e numerico', () => {
    expect(buildCampoDefinicaoInsertPayload(campoInput, 'tenant-test')).toEqual({
      tenant_id: 'tenant-test',
      filial_id: null,
      entidade_tipo: 'segurado',
      chave: 'n_da_carteirinha',
      nome: 'Nº da carteirinha',
      tipo_dado: 'TEXTO_CURTO',
      formato: null,
      obrigatorio: false,
      ativo: true,
      ordem: 10,
      ajuda: 'Usado em saúde',
      min_valor: null,
      max_valor: null,
      tamanho_max: 30,
      mascara: null,
      placeholder: 'ABC123',
      agrupamento: 'Saúde',
      visivel_em_listagem: true,
    });
  });

  it('preserva formato em campos numericos e nao troca tenant na edicao', () => {
    expect(buildCampoDefinicaoUpdatePayload({
      ...campoInput,
      tipo_dado: 'DECIMAL',
      formato: 'MOEDA',
      chave: 'Valor Segurado',
    })).toMatchObject({
      chave: 'valor_segurado',
      tipo_dado: 'DECIMAL',
      formato: 'MOEDA',
    });
  });

  it('normaliza opcoes de lista usando slug estavel', () => {
    expect(buildCampoOpcaoInsertPayload({
      campo_definicao_id: 'campo-test',
      rotulo: '  Plano Familiar  ',
      valor: '',
      ordem: 20,
      ativo: true,
    })).toEqual({
      campo_definicao_id: 'campo-test',
      rotulo: 'Plano Familiar',
      valor: 'plano_familiar',
      ordem: 20,
      ativo: true,
    });
  });

  it('slugifyCampoChave remove acentos e pontuacao', () => {
    expect(slugifyCampoChave('Nº da Carteirinha / Saúde')).toBe('n_da_carteirinha_saude');
  });
});
