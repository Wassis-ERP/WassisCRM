import { describe, expect, it } from 'vitest';
import { InMemoryQueryBuilder } from '../lib/inMemoryQueryBuilder';
import { buildPipelineInsertPayload } from './usePipelinesAdmin';

describe('usePipelinesAdmin pipeline payload', () => {
  it('cria funil ativo como modelo do grupo por padrao', () => {
    expect(buildPipelineInsertPayload({ name: '  Renovacao Auto  ', module: 'pos_venda' }, 'tenant-test')).toEqual({
      name: 'Renovacao Auto',
      module: 'pos_venda',
      tenant_id: 'tenant-test',
      filial_id: null,
      is_active: true,
    });
  });

  it('persiste funil novo ativo e com escopo de grupo no mock', async () => {
    const payload = buildPipelineInsertPayload({ name: '  Renovacao Auto  ', module: 'pos_venda' }, 'tenant-test');

    const result = await new InMemoryQueryBuilder('pipelines').insert(payload).select('*').single();

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      name: 'Renovacao Auto',
      module: 'pos_venda',
      tenant_id: 'tenant-test',
      filial_id: null,
      is_active: true,
    });
  });
});
