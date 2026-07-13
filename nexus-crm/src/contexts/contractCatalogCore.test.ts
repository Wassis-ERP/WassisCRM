import { describe, expect, it } from 'vitest'
import { hasScopedCatalogDuplicate, resolveScopedCatalog, type ScopedCatalogRow } from './contractCatalogCore'

const rows: ScopedCatalogRow[] = [
  { id: 'grupo', nome: 'Substituição', ativo: true, filial_id: null, ramo_id: null },
  { id: 'ramo', nome: 'Substituição', ativo: true, filial_id: null, ramo_id: 'auto' },
  { id: 'filial', nome: 'Substituição', ativo: true, filial_id: 'centro', ramo_id: 'auto' },
  { id: 'outro', nome: 'Alteração de dados', ativo: true, filial_id: null, ramo_id: null },
  { id: 'inativo', nome: 'Exclusão', ativo: false, filial_id: null, ramo_id: null },
]

describe('contractCatalogCore', () => {
  it('resolve o cadastro mais específico por filial e ramo', () => {
    expect(resolveScopedCatalog(rows, 'centro', 'auto').map((row) => row.id)).toEqual(['outro', 'filial'])
  })

  it('usa o cadastro do grupo quando não existe override aplicável', () => {
    expect(resolveScopedCatalog(rows, 'outra', 'residencial').map((row) => row.id)).toEqual(['outro', 'grupo'])
  })

  it('bloqueia duplicidade ativa apenas dentro do mesmo escopo', () => {
    expect(hasScopedCatalogDuplicate(rows, { nome: ' substituição ', filialId: null, ramoId: null })).toBe(true)
    expect(hasScopedCatalogDuplicate(rows, { nome: 'Substituição', filialId: 'outra', ramoId: null })).toBe(false)
    expect(hasScopedCatalogDuplicate(rows, { id: 'grupo', nome: 'Substituição', filialId: null, ramoId: null })).toBe(false)
  })
})
