import { describe, expect, it } from 'vitest';
import { InMemoryQueryBuilder } from '../lib/inMemoryQueryBuilder';
import { buildPipelineInsertPayload, buildStageInsertPayload } from './usePipelinesAdmin';

describe('usePipelinesAdmin pipeline payload', () => {
  it('cria funil ativo como modelo do grupo por padrao', () => {
    expect(buildPipelineInsertPayload({ name: '  Emissao Auto  ', module: 'emissao' }, 'tenant-test')).toEqual({
      nome: 'Emissao Auto',
      entidade_tipo: 'proposta',
      tenant_id: 'tenant-test',
      filial_id: null,
      ativo: true,
      ordem: null,
      modelo_fabrica: false,
      permite_customizacao: true,
    });
  });

  it('persiste funil novo ativo e com escopo de grupo no mock', async () => {
    const payload = buildPipelineInsertPayload({ name: '  Emissao Auto  ', module: 'emissao' }, 'tenant-test');

    const result = await new InMemoryQueryBuilder('pipelines').insert(payload).select('*').single();

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      nome: 'Emissao Auto',
      entidade_tipo: 'proposta',
      tenant_id: 'tenant-test',
      filial_id: null,
      ativo: true,
    });
  });

  it('cria etapa com campos oficiais de conclusao', async () => {
    const payload = buildStageInsertPayload({
      pipelineId: 'pipeline-test',
      name: '  Emitida  ',
      color: 'bg-emerald-400',
      order: 2,
      is_win_eligible: true,
      is_loss_eligible: false,
    });

    expect(payload).toEqual({
      pipeline_id: 'pipeline-test',
      nome: 'Emitida',
      cor: 'bg-emerald-400',
      ordem: 2,
      finaliza_com_sucesso: true,
      finaliza_com_perda: false,
      ativo: true,
    });
  });

  it('arquiva etapa no mock por ativo false', async () => {
    const created = await new InMemoryQueryBuilder('pipeline_stages')
      .insert(buildStageInsertPayload({ pipelineId: 'pipeline-test', name: 'Emitida' }))
      .select('*')
      .single();

    const archived = await new InMemoryQueryBuilder('pipeline_stages')
      .update({ ativo: false })
      .eq('id', created.data.id)
      .select('*')
      .single();

    expect(archived.error).toBeNull();
    expect(archived.data).toMatchObject({ ativo: false });
  });
});
