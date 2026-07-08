import { describe, expect, it } from 'vitest';
import type { PipelineRow } from '../modules/types';
import { moduleToPipelineEntityTipo, normalizePipelineRow } from '../modules/types';
import {
  comparePipelinesForBranch,
  getPipelineScopeLabel,
  isPipelineVisibleForBranch,
} from './pipelineScope';

function pipeline(overrides: Partial<PipelineRow>): PipelineRow {
  const module = overrides.module ?? 'comercial';
  return normalizePipelineRow({
    id: overrides.id ?? crypto.randomUUID(),
    tenant_id: 'tenant-test',
    filial_id: null,
    nome: overrides.nome ?? overrides.name ?? 'Funil',
    entidade_tipo: overrides.entidade_tipo ?? moduleToPipelineEntityTipo(module),
    ativo: true,
    ordem: null,
    descricao: null,
    modelo_fabrica: false,
    permite_customizacao: true,
    ...overrides,
  });
}

describe('pipelineScope', () => {
  it('mantem modelos do grupo visiveis em qualquer corretora', () => {
    expect(isPipelineVisibleForBranch(pipeline({ filial_id: null }), 'filial-a')).toBe(true);
  });

  it('filtra funil proprio de outra corretora quando uma corretora esta ativa', () => {
    expect(isPipelineVisibleForBranch(pipeline({ filial_id: 'filial-b' }), 'filial-a')).toBe(false);
  });

  it('mostra funis de corretora no modo Todas as filiais', () => {
    expect(isPipelineVisibleForBranch(pipeline({ filial_id: 'filial-b' }), null)).toBe(true);
  });

  it('prioriza funil proprio da corretora ativa antes dos modelos do grupo', () => {
    const rows = [
      pipeline({ id: 'grupo', filial_id: null, name: 'Comercial geral' }),
      pipeline({ id: 'filial', filial_id: 'filial-a', name: 'Comercial filial' }),
    ].sort((a, b) => comparePipelinesForBranch('filial-a', a, b));

    expect(rows.map((row) => row.id)).toEqual(['filial', 'grupo']);
  });

  it('rotula o escopo de exibicao do funil', () => {
    expect(getPipelineScopeLabel(pipeline({ filial_id: null }))).toBe('Modelo do grupo');
    expect(getPipelineScopeLabel(pipeline({ filial_id: 'filial-a' }))).toBe('Funil da corretora');
  });
});
