import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOportunidade, type OpportunityDetail } from './useOportunidades'

type QueryOptions = { enabled: boolean; queryKey: readonly unknown[]; queryFn: (context: { signal: AbortSignal }) => Promise<OpportunityDetail> }
const state = vi.hoisted(() => ({
  request: vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>(),
  query: null as QueryOptions | null,
  user: { id: 'user', tenantId: '22222222-2222-2222-2222-222222222222', branchId: '44444444-4444-4444-4444-444444444444' },
}))
vi.mock('../lib/backendApi', () => ({ requestAuthenticatedBackendJson: state.request, getBackendSessionSnapshot: () => null }))
vi.mock('../lib/backendDomainApi', async importOriginal => ({ ...await importOriginal<typeof import('../lib/backendDomainApi')>(), usesBackendDomainData: true }))
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: QueryOptions) => { state.query = options; return options } }))
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: state.user }) }))
vi.mock('./useActiveFilial', () => ({ useActiveFilialId: () => state.user.branchId }))
vi.mock('../lib/supabase', () => ({ supabase: {} }))

const opportunityId = '11111111-1111-1111-1111-111111111111'
const lineId = '55555555-5555-5555-5555-555555555555'
const stageId = '66666666-6666-6666-6666-666666666666'
function query() {
  if (!state.query) throw new Error('Consulta não registrada.')
  return state.query
}
function wireContext() {
  return {
    opportunityId, insuranceBranch: { id: lineId, nome: 'Auto fixture', forma_calculo: 'AUTO', risk_type: 'VEICULO', grupo_operacional: 'AutoFrota' },
    origin: null, lossReason: null,
    stage: { id: stageId, pipeline_id: '77777777-7777-7777-7777-777777777777', nome: 'Etapa fixture', codigo: null,
      tipo_stage: 'ABERTO', cor: null, ordem: 0, probabilidade: 0, sla_dias: null, finaliza_com_sucesso: false, finaliza_com_perda: false, ativo: true },
  }
}
describe('leitura do detalhe comercial', () => {
  beforeEach(() => {
    state.request.mockReset(); state.query = null
    state.user.branchId = '44444444-4444-4444-4444-444444444444'
    state.request.mockImplementation(async path => {
      if (path.endsWith('/contexto-comercial')) return wireContext()
      if (path === `/api/oportunidades/${opportunityId}`) return {
        id: opportunityId, officeBranchId: state.user.branchId, name: 'Lead fixture', insuredPersonId: null,
        stageId, insuranceLineId: lineId, responsibleId: null, status: 'pending', originId: null,
      }
      throw new Error(`Endpoint inesperado: ${path}`)
    })
  })

  it('resolve ramo e etapa por duas leituras comerciais, sem Configurações', async () => {
    const signal = new AbortController().signal
    useOportunidade(opportunityId)
    const result = await query().queryFn({ signal })
    expect(result.ramos).toEqual(wireContext().insuranceBranch)
    expect(result.pipeline_stage).toEqual(wireContext().stage)
    expect(result.segurados).toBeNull()
    expect(state.request.mock.calls.map(([path]) => path)).toEqual([
      `/api/oportunidades/${opportunityId}`, `/api/oportunidades/${opportunityId}/contexto-comercial`,
    ])
    expect(state.request.mock.calls.every(([, init]) => init?.signal === signal)).toBe(true)
  })

  it('isola o cache do detalhe ao trocar a filial', () => {
    useOportunidade(opportunityId); const first = query().queryKey
    state.user.branchId = '99999999-9999-9999-9999-999999999999'
    useOportunidade(opportunityId)
    expect(query().queryKey).not.toEqual(first)
    expect(query().queryKey.slice(0, 2)).toEqual(['oportunidade', opportunityId])
  })

  it('não substitui uma referência negada pelo catálogo administrativo ou pelo mock', async () => {
    state.request.mockResolvedValueOnce({ id: opportunityId, name: 'Lead fixture', status: 'pending', officeBranchId: state.user.branchId, stageId, insuranceLineId: lineId })
      .mockRejectedValueOnce(new Error('HTTP 403'))
    useOportunidade(opportunityId)
    await expect(query().queryFn({ signal: new AbortController().signal })).rejects.toThrow('HTTP 403')
    expect(state.request.mock.calls.length).toBe(2)
  })
})
