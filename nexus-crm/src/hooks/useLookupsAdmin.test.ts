import { describe, expect, it } from 'vitest';
import { buildRamoInsertPayload, buildRamoUpdatePayload } from './useLookupsAdmin';

const ramoInput = {
  nome: '  Vida em Grupo PME  ',
  risk_type: 'VIDA' as const,
  grupo_operacional: 'Pessoas' as const,
  is_monthly: true,
};

describe('useLookupsAdmin Ramos payload', () => {
  it('cria ramo ativo para aparecer nas consultas do mock', () => {
    expect(buildRamoInsertPayload(ramoInput, 'tenant-test')).toEqual({
      nome: 'Vida em Grupo PME',
      tenant_id: 'tenant-test',
      risk_type: 'VIDA',
      grupo_operacional: 'Pessoas',
      is_monthly: true,
      comissao_padrao: 0,
      ativo: true,
    });
  });

  it('monta payload de edicao sem trocar tenant ou status ativo', () => {
    expect(buildRamoUpdatePayload({ ...ramoInput, nome: 'Vida Global', is_monthly: false })).toEqual({
      nome: 'Vida Global',
      risk_type: 'VIDA',
      grupo_operacional: 'Pessoas',
      is_monthly: false,
      comissao_padrao: 0,
    });
  });
});
