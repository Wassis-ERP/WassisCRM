import { platformDefaults } from '../types/platformRows'
import { describe, expect, it } from 'vitest'
import { buildCreateSeguradoInput, mapSeguradoRowToView, mapPessoaContatoRowToView, partialSeguradoToUpdate } from './seguradoMapper'
import type { Database } from '../types/database'

type SeguradoRow = Database['public']['Tables']['segurados']['Row']

const baseRow: SeguradoRow = {
  ...platformDefaults.segurados,
  bairro: null,
  cep: null,
  chatwoot_id: null,
  cidade: null,
  cnae: null,
  complemento: null,
  cpf_cnpj: '12345678901',
  created_at: '2026-06-22T12:00:00.000Z',
  data_nascimento: null,
  email: null,
  endereco: null,
  estado: null,
  estado_civil: null,
  filial_id: 'filial-1',
  gerente_id: null,
  id: 'seg-1',
  lgpd_autorizado: true,
  logradouro: null,
  nome: 'Maria Silva',
  nome_fantasia: null,
  numero: null,
  observacoes: null,
  porte: null,
  produtor_id: null,
  sexo: null,
  site: null,
  status: 'Prospecto',
  telefone: null,
  tenant_id: 'tenant-1',
  tipo: 'PF',
  updated_at: '2026-06-22T12:00:00.000Z',
}

describe('seguradoMapper', () => {
  it('separa canais herdados da PF dos valores próprios usados na edição do contato', () => {
    const view = mapPessoaContatoRowToView({
      ...platformDefaults.pessoa_contato, id: 'contato', pj_id: 'empresa', pf_id: 'pessoa',
      pf: { id: 'pessoa', nome: 'Pessoa', email: 'pessoa@example.com', telefone: '1133334444', celular: '11999998888' },
    })
    expect(view.email).toBe('pessoa@example.com')
    expect(view.dadosProprios).toEqual({ email: null, telefone: null, celular: null })
  })
  it('mantem cpf_cnpj normalizado no payload de criacao', () => {
    const input = buildCreateSeguradoInput({
      tipo: 'PF',
      nome: 'Maria Silva',
      documento: '123.456.789-01',
      status: 'Prospecto',
      lgpdAutorizado: true,
    })

    expect(input.cpf_cnpj).toBe('12345678901')
    expect(input.status).toBe('Prospecto')
  })

  it('mantem cpf_cnpj normalizado no payload de atualizacao', () => {
    const update = partialSeguradoToUpdate({
      tipo: 'PJ',
      documento: '12.345.678/0001-90',
    })

    expect(update.cpf_cnpj).toBe('12345678000190')
    expect(update.data_nascimento).toBeNull()
    expect(update.sexo).toBeNull()
    expect(update.estado_civil).toBeNull()
  })

  it('formata cpf_cnpj normalizado para exibicao', () => {
    const view = mapSeguradoRowToView(baseRow)

    expect(view.documento).toBe('123.456.789-01')
  })
})
