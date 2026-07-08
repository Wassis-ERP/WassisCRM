import { describe, expect, it } from 'vitest';
import {
  buildCampoValorPayload,
  isCampoValorInputEmpty,
} from './useCamposPersonalizados';
import type { CampoDefinicaoRow } from './useLookupsAdmin';

const baseDefinicao: CampoDefinicaoRow = {
  id: 'campo-test',
  tenant_id: 'tenant-test',
  filial_id: null,
  entidade_tipo: 'segurado',
  chave: 'campo_test',
  nome: 'Campo test',
  tipo_dado: 'TEXTO_CURTO',
  formato: null,
  obrigatorio: false,
  ativo: true,
  ordem: 10,
  ajuda: null,
  min_valor: null,
  max_valor: null,
  tamanho_max: null,
  mascara: null,
  placeholder: null,
  agrupamento: null,
  visivel_em_listagem: false,
};

describe('campos personalizados operacionais', () => {
  it('monta valor texto na coluna fisica correta', () => {
    expect(buildCampoValorPayload(baseDefinicao, 'segurado-1', ' ABC123 ')).toMatchObject({
      campo_definicao_id: 'campo-test',
      entidade_id: 'segurado-1',
      valor_texto: 'ABC123',
      valor_numero: null,
      valor_booleano: null,
      valor_opcao_id: null,
      origem: 'manual',
    });
  });

  it('monta valor numerico sem usar mascara como regra', () => {
    expect(buildCampoValorPayload({
      ...baseDefinicao,
      tipo_dado: 'DECIMAL',
      formato: 'PERCENTUAL',
    }, 'segurado-1', '12,5')).toMatchObject({
      valor_numero: 12.5,
      valor_texto: null,
      valor_opcao_id: null,
    });
  });

  it('monta lista unica em valor_opcao_id e lista multipla sem array/json', () => {
    expect(buildCampoValorPayload({
      ...baseDefinicao,
      tipo_dado: 'LISTA_UNICA',
    }, 'segurado-1', 'opcao-1')).toMatchObject({
      valor_opcao_id: 'opcao-1',
      valor_texto: null,
    });

    expect(buildCampoValorPayload({
      ...baseDefinicao,
      tipo_dado: 'LISTA_MULTIPLA',
    }, 'segurado-1', ['opcao-1', 'opcao-2'])).toMatchObject({
      valor_opcao_id: null,
      valor_texto: null,
      valor_numero: null,
    });
  });

  it('trata false como valor preenchido para booleano', () => {
    expect(isCampoValorInputEmpty({
      ...baseDefinicao,
      tipo_dado: 'BOOLEANO',
    }, false)).toBe(false);
  });
});
