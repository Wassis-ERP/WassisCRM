import { describe, expect, it } from 'vitest'
import { getManualLookups } from '../../components/propostas/cadastro-manual/cadastroManualDomain'
import { AGGER_COVERAGE_MAP, findAggerMapping, getAggerCatalogMappings } from './aggerCoverageMap'

describe('de-para de coberturas do Aggilizador', () => {
  it('mantem as chaves documentadas separadas por forma de calculo', () => {
    expect(getAggerCatalogMappings('AUTO')).toHaveLength(11)
    expect(getAggerCatalogMappings('RESIDENCIA')).toHaveLength(15)
    expect(getAggerCatalogMappings('CONDOMINIO')).toHaveLength(23)
    expect(getAggerCatalogMappings('VIDA')).toHaveLength(3)
    expect(getAggerCatalogMappings('EMPRESA')).toHaveLength(13)
    expect(getAggerCatalogMappings('DIVERSOS')).toHaveLength(0)
  })

  it('nao transforma parametros estruturais do calculo em coberturas', () => {
    const factor = findAggerMapping('AUTO', 'FatorAjuste')
    expect(factor).toMatchObject({
      nature: 'parametro_calculo',
      destination: 'calc_especializacao',
      internalCode: null,
      appliesToManualProposal: false,
    })
    expect(getAggerCatalogMappings('AUTO').some((item) => item.externalKey === 'FatorAjuste')).toBe(false)
  })

  it('mantem codigos internos unicos dentro de cada ramo', () => {
    for (const forma of ['AUTO', 'RESIDENCIA', 'CONDOMINIO', 'VIDA', 'EMPRESA'] as const) {
      const codes = getAggerCatalogMappings(forma).map((item) => item.internalCode)
      expect(new Set(codes).size).toBe(codes.length)
    }
  })

  it('nao inclui nenhum dado de fio, segredo ou payload no mapeamento', () => {
    expect(AGGER_COVERAGE_MAP.every((item) => !('token' in item) && !('payload' in item))).toBe(true)
  })

  it('expoe o mesmo catalogo mapeado no cadastro manual de proposta', () => {
    const lookups = getManualLookups()
    const autoBranch = lookups.branches.find((branch) => branch.label === 'Automóvel')
    expect(autoBranch).toBeDefined()

    const manualCodes = new Set(
      lookups.coverages
        .filter((coverage) => coverage.branchId === autoBranch?.id)
        .map((coverage) => coverage.detail),
    )

    for (const mapping of getAggerCatalogMappings('AUTO')) {
      expect(manualCodes).toContain(mapping.internalCode)
    }
  })
})
