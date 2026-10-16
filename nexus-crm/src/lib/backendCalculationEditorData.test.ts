import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readBackendCalculationEditorData } from './backendCalculationEditorData'
import { canonicalIds as ids } from '../testUtils/canonicalCalculationFixtures'

const { request } = vi.hoisted(() => ({ request: vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>() }))
vi.mock('./backendApi', () => ({ requestAuthenticatedBackendJson: request }))
function context(line: string | null = ids.line) {
  return { opportunityId: ids.opportunity, insuranceBranchId: line, insuredPersonId: null, leadName: 'Lead fixture',
    branchId: ids.other, timeZone: 'America/Sao_Paulo', branchDate: '2028-02-29', sourcePolicy: null }
}

describe('dados do editor canônico', () => {
  beforeEach(() => { request.mockReset() })
  it('fornece calendário do grupo e somente catálogos ativos comerciais, sem consulta assistida fictícia', async () => {
    request.mockImplementation(async path => path.includes('/contexto') ? context()
      : { items: [], page: 1, pageSize: 100, totalCount: 0, hasMore: false })
    const signal = new AbortController().signal
    const result = await readBackendCalculationEditorData(ids.opportunity, ids.line, signal)
    expect(result.context.branchDate).toBe('2028-02-29')
    expect(result.context.sourcePolicy).toBeNull()
    expect(request.mock.calls).toHaveLength(3)
    expect(request.mock.calls.every(([path, init]) => !path.includes('includeReferencedInactive') && !path.includes('/core/') && init?.signal === signal)).toBe(true)
  })
  it('não inventa ramo/coberturas quando a oportunidade ainda não tem ramo', async () => {
    request.mockImplementation(async path => path.includes('/contexto') ? context(null)
      : { items: [], page: 1, pageSize: 100, totalCount: 0, hasMore: false })
    const result = await readBackendCalculationEditorData(ids.opportunity)
    expect(result.context.insuranceBranchId).toBeNull(); expect(result.coverages).toEqual([])
    expect(request.mock.calls).toHaveLength(2)
  })
})
