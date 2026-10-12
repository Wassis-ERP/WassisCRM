import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBackendCalculation } from '../lib/backendCalculationApi'
import { readBackendCalculationItems, readBackendCalculationExecutionWorkspace } from '../lib/backendCalculationReads'
import { getCalculationInMemory, listCalculationsInMemory, getCalculationExecutionWorkspaceInMemory, startCalculationExecutionsInMemory, createCalculationInMemory, findCalculationVehicleInMemory } from '../lib/inMemoryDb'
import {
  useCalculation, useCalculations, useCalculationExecutionWorkspace, useCreateCalculation,
  useStartCalculationExecutions, useCalculationAssistance, getCalculationDuplicateInput,
} from './useCalculos'

type QueryOptions = {
  queryKey: readonly unknown[]
  enabled: boolean
  queryFn: (context: { signal: AbortSignal }) => Promise<unknown>
}
type MutationOptions = { mutationFn: (input: unknown) => Promise<unknown> }
const state = vi.hoisted(() => ({
  backend: true,
  user: { id: 'user', tenantId: 'tenant', branchId: 'branch-1' } as { id: string; tenantId: string; branchId: string } | null,
  query: null as QueryOptions | null,
  mutations: [] as MutationOptions[],
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: QueryOptions) => { state.query = options; return options },
  useMutation: (options: MutationOptions) => { state.mutations.push(options); return options },
  useQueryClient: () => ({ invalidateQueries: vi.fn().mockResolvedValue(undefined) }),
}))
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: state.user }) }))
vi.mock('../lib/backendDomainApi', () => ({ get usesBackendDomainData() { return state.backend } }))
vi.mock('../lib/backendCalculationApi', () => ({ getBackendCalculation: vi.fn() }))
vi.mock('../lib/backendCalculationReads', () => ({ readBackendCalculationItems: vi.fn(), readBackendCalculationExecutionWorkspace: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: {} }))
vi.mock('../lib/inMemoryDb', () => ({
  createCalculationInMemory: vi.fn(), findCalculationCepInMemory: vi.fn(), findCalculationInsuredInMemory: vi.fn(),
  findCalculationVehicleInMemory: vi.fn(), completeCalculationExecutionSimulationInMemory: vi.fn(),
  getCalculationDuplicateInputInMemory: vi.fn(), getCalculationExecutionSimulationDelayInMemory: vi.fn(),
  getCalculationExecutionWorkspaceInMemory: vi.fn(), getCalculationInMemory: vi.fn(), markCalculationExecutionRunningInMemory: vi.fn(),
  getCalculationSourcePolicyInMemory: vi.fn(), listCalculationsInMemory: vi.fn(), startCalculationExecutionsInMemory: vi.fn(), startCalculationRecalculationInMemory: vi.fn(),
}))

function query() {
  if (!state.query) throw new Error('Hook não registrou a consulta.')
  return state.query
}

describe('hooks de leitura de cálculo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.backend = true; state.user = { id: 'user', tenantId: 'tenant', branchId: 'branch-1' }
    state.query = null; state.mutations = []
  })

  it('lê lista, pedido e execuções pelas APIs com AbortSignal, sem invocar memória', async () => {
    const signal = new AbortController().signal
    useCalculations('opportunity'); await query().queryFn({ signal })
    useCalculation('calculation'); await query().queryFn({ signal })
    useCalculationExecutionWorkspace('calculation', 'FRANQUIA'); await query().queryFn({ signal })
    expect(readBackendCalculationItems).toHaveBeenCalledWith('opportunity', signal)
    expect(getBackendCalculation).toHaveBeenCalledWith('calculation', signal)
    expect(readBackendCalculationExecutionWorkspace).toHaveBeenCalledWith('calculation', 'FRANQUIA', signal)
    expect(listCalculationsInMemory).not.toHaveBeenCalled()
    expect(getCalculationInMemory).not.toHaveBeenCalled()
    expect(getCalculationExecutionWorkspaceInMemory).not.toHaveBeenCalled()
  })

  it('isola cache por filial e por usuário, mantendo o prefixo de invalidação', () => {
    useCalculation('calculation'); const first = query().queryKey
    state.user = { id: 'user', tenantId: 'tenant', branchId: 'branch-2' }
    useCalculation('calculation'); const otherBranch = query().queryKey
    state.user = { ...state.user, id: 'other-user' }
    useCalculation('calculation'); const otherUser = query().queryKey
    expect(first.slice(0, 2)).toEqual(['calculation', 'calculation'])
    expect(first).not.toEqual(otherBranch); expect(otherBranch).not.toEqual(otherUser)
  })

  it('não inicia consultas conectadas sem sessão/filial ou identificador', () => {
    state.user = null
    useCalculations('opportunity'); expect(query().enabled).toBe(false)
    useCalculation('calculation'); expect(query().enabled).toBe(false)
    useCalculationExecutionWorkspace('calculation', 'RETORNO'); expect(query().enabled).toBe(false)
    state.user = { id: 'user', tenantId: 'tenant', branchId: '' }
    useCalculation('calculation'); expect(query().enabled).toBe(false)
    state.user.branchId = 'branch-1'
    useCalculations(undefined); expect(query().enabled).toBe(false)
  })

  it('preserva leitura em memória somente no modo de demonstração', async () => {
    state.backend = false
    const signal = new AbortController().signal
    useCalculations('opportunity'); await query().queryFn({ signal })
    useCalculation('calculation'); await query().queryFn({ signal })
    useCalculationExecutionWorkspace('calculation', 'PREMIO'); await query().queryFn({ signal })
    expect(listCalculationsInMemory).toHaveBeenCalledWith('opportunity')
    expect(getCalculationInMemory).toHaveBeenCalledWith('calculation')
    expect(getCalculationExecutionWorkspaceInMemory).toHaveBeenCalledWith('calculation', 'PREMIO')
    expect(getBackendCalculation).not.toHaveBeenCalled()
    expect(readBackendCalculationItems).not.toHaveBeenCalled()
  })

  it('propaga erro do backend sem retornar um pedido de demonstração', async () => {
    vi.mocked(getBackendCalculation).mockRejectedValue(new Error('HTTP 404'))
    useCalculation('calculation')
    await expect(query().queryFn({ signal: new AbortController().signal })).rejects.toThrow('HTTP 404')
    expect(getCalculationInMemory).not.toHaveBeenCalled()
  })

  it('impede criação/transmissão/assistência simuladas enquanto esses fluxos não estão conectados', async () => {
    useCreateCalculation()
    await expect(state.mutations[0].mutationFn({})).rejects.toThrow('não está conectado')
    useStartCalculationExecutions()
    await expect(state.mutations[1].mutationFn({})).rejects.toThrow('não está conectado')
    useCalculationAssistance('branch-1')
    await expect(state.mutations[3].mutationFn('ABC1D23')).rejects.toThrow('não está conectado')
    expect(() => getCalculationDuplicateInput('calculation')).toThrow('não está conectado')
    expect(createCalculationInMemory).not.toHaveBeenCalled()
    expect(startCalculationExecutionsInMemory).not.toHaveBeenCalled()
    expect(findCalculationVehicleInMemory).not.toHaveBeenCalled()
  })
})
