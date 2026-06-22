import { describe, expect, it } from 'vitest'
import { InMemoryQueryBuilder } from './inMemoryQueryBuilder'

function insertSegurado(input: {
  id: string
  filialId: string
  cpfCnpj: string
  nome?: string
  tipo?: 'PF' | 'PJ'
}) {
  return new InMemoryQueryBuilder('segurados')
    .insert({
      id: input.id,
      tenant_id: 'tenant-test',
      filial_id: input.filialId,
      nome: input.nome ?? input.id,
      tipo: input.tipo ?? 'PF',
      cpf_cnpj: input.cpfCnpj,
      status: 'Prospecto',
      lgpd_autorizado: true,
    })
    .select('*')
    .single()
}

describe('InMemoryQueryBuilder segurados', () => {
  it('bloqueia segurado sem cpf_cnpj', async () => {
    const result = await insertSegurado({
      id: 'seg-sem-doc',
      filialId: 'filial-sem-doc',
      cpfCnpj: '',
    })

    expect(result.error?.message).toBe('CPF/CNPJ é obrigatório para cadastrar segurado')
  })

  it('bloqueia cpf_cnpj duplicado dentro da mesma corretora', async () => {
    await insertSegurado({
      id: 'seg-dup-a',
      filialId: 'filial-dup-a',
      cpfCnpj: '123.456.789-01',
    })

    const duplicate = await insertSegurado({
      id: 'seg-dup-b',
      filialId: 'filial-dup-a',
      cpfCnpj: '12345678901',
    })

    expect(duplicate.error?.message).toBe('Já existe segurado com este CPF/CNPJ nesta corretora')
  })

  it('permite mesmo cpf_cnpj em corretoras diferentes', async () => {
    const first = await insertSegurado({
      id: 'seg-cross-a',
      filialId: 'filial-cross-a',
      cpfCnpj: '987.654.321-00',
    })
    const second = await insertSegurado({
      id: 'seg-cross-b',
      filialId: 'filial-cross-b',
      cpfCnpj: '98765432100',
    })

    expect(first.error).toBeNull()
    expect(second.error).toBeNull()
    expect(second.data).toMatchObject({
      filial_id: 'filial-cross-b',
      cpf_cnpj: '98765432100',
    })
  })
})
