import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBackendOpportunityReadContext, type BackendOpportunityReadContext, type OpportunityContextReferences } from './backendOpportunityContextApi'

const { request } = vi.hoisted(() => ({ request: vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>() }))
vi.mock('./backendApi', () => ({ requestAuthenticatedBackendJson: request }))
const opportunity: OpportunityContextReferences = {
  id: '11111111-1111-1111-1111-111111111111', ramo_id: '22222222-2222-2222-2222-222222222222', origem_id: null,
  motivo_perda_id: null, stage_id: '33333333-3333-3333-3333-333333333333',
}
function context(): BackendOpportunityReadContext {
  return {
    opportunityId: opportunity.id,
    insuranceBranch: { id: opportunity.ramo_id!, nome: 'Auto fixture', risk_type: 'VEICULO', grupo_operacional: 'AutoFrota', forma_calculo: 'AUTO' },
    origin: null, lossReason: null,
    stage: { id: opportunity.stage_id, pipeline_id: '44444444-4444-4444-4444-444444444444', nome: 'Etapa histórica', codigo: null, tipo_stage: 'GANHO', cor: null,
      ordem: 0, probabilidade: 0, sla_dias: null, finaliza_com_sucesso: true, finaliza_com_perda: false, ativo: false },
  }
}

describe('contexto comercial da oportunidade', () => {
  beforeEach(() => { request.mockReset() })
  it('usa apenas contexto comercial, mantém referência inativa/zero/nulos e descarta campos extras', async () => {
    const response = context()
    request.mockResolvedValue({ ...response, profiles: ['extra'], insuranceBranch: { ...response.insuranceBranch, observacoes: 'extra' } })
    const signal = new AbortController().signal
    const result = await getBackendOpportunityReadContext(opportunity, signal)
    expect(result).toEqual(response)
    expect(request).toHaveBeenCalledExactlyOnceWith(`/api/oportunidades/${opportunity.id}/contexto-comercial`, { signal })
    expect(result.stage).toMatchObject({ ativo: false, ordem: 0, probabilidade: 0, cor: null })
  })

  it('aceita referências ausentes como nulas, sem fabricar catálogos', async () => {
    const empty = { ...context(), insuranceBranch: null, stage: null }
    request.mockResolvedValue(empty)
    await expect(getBackendOpportunityReadContext({ ...opportunity, ramo_id: null })).resolves.toEqual(empty)
  })

  it.each(['opportunity', 'line', 'stage', 'pipeline', 'origin'] as const)('recusa referência de outro contexto: %s', async mismatch => {
    const response = context(), foreign = '99999999-9999-9999-9999-999999999999'
    if (mismatch === 'opportunity') response.opportunityId = foreign
    if (mismatch === 'line') response.insuranceBranch!.id = foreign
    if (mismatch === 'stage') response.stage!.id = foreign
    if (mismatch === 'pipeline') response.stage!.pipeline_id = 'not-a-uuid'
    if (mismatch === 'origin') response.origin = { id: foreign, nome: 'Outro catálogo' }
    request.mockResolvedValue(response)
    await expect(getBackendOpportunityReadContext(opportunity)).rejects.toThrow('incompatíveis')
  })

  it('recusa campos ausentes, bool falso representado por texto e números não finitos', async () => {
    request.mockResolvedValue({ ...context(), lossReason: undefined })
    await expect(getBackendOpportunityReadContext(opportunity)).rejects.toThrow('incompatíveis')
    request.mockResolvedValue({ ...context(), stage: { ...context().stage, ativo: 'false' } })
    await expect(getBackendOpportunityReadContext(opportunity)).rejects.toThrow('incompatíveis')
    request.mockResolvedValue({ ...context(), stage: { ...context().stage, ordem: Number.NaN } })
    await expect(getBackendOpportunityReadContext(opportunity)).rejects.toThrow('incompatíveis')
  })

  it('propaga falta de autorização sem buscar catálogos administrativos ou dados em memória', async () => {
    const denied = new Error('HTTP 403')
    request.mockImplementation(async () => { throw denied })
    await expect(getBackendOpportunityReadContext(opportunity)).rejects.toBe(denied)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
