import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBackendInsuredPerson, createBackendOpportunity, mapInsuredPerson, mapOpportunity,
  updateBackendOpportunity, updateBackendInsuredPerson, listBackendInsuredPeople,
  type BackendInsuredPerson, type BackendOpportunity,
} from './backendDomainApi'

const { request } = vi.hoisted(() => ({ request: vi.fn<(path: string, init?: RequestInit) => Promise<unknown>>() }))
vi.mock('./backendApi', () => ({
  requestAuthenticatedBackendJson: request,
  getBackendSessionSnapshot: () => ({ tenantId: 'tenant-1' }),
}))
vi.mock('./backendLookups', () => ({ listBackendCatalog: async () => [{ id: 'stage-1', pipeline_id: 'pipeline-1' }] }))

const insured: BackendInsuredPerson = {
  id: 'person-1', officeBranchId: 'branch-1', name: 'Pessoa de teste', personType: 'PF', status: 'Ativo',
  documentNumber: '12345678909', email: null, phoneNumber: '1133334444', birthDateUtc: null,
  tradeName: null, gender: null, maritalStatus: null, companySize: null, cnae: null, website: null,
  postalCode: null, street: null, number: null, complement: null, neighborhood: null, city: null,
  state: null, notes: null, producerId: null, managerId: null, chatwootId: null, lgpdAuthorized: false,
  createdBy: 'user-1', createdAtUtc: '2026-09-11T10:00:00Z', updatedAtUtc: '2026-09-11T10:00:00Z',
}
const opportunity: BackendOpportunity = {
  id: 'op-1', officeBranchId: 'branch-1', name: 'Seguro teste', responsibleId: 'user-1',
  insuredPersonId: 'person-1', pipelineId: 'pipeline-1', stageId: 'stage-1', insuranceLineId: null,
  insurerId: 'insurer-legacy', originId: null, lossReasonId: null, status: 'pending', businessType: 'novo',
  contactType: false, netPremium: 1000, commissionPercentage: 15, agencyPercentage: null,
  productionAmount: 1200, validityStartUtc: '2026-09-11', validityEndUtc: '2027-09-11',
  nextFollowUpUtc: '2026-09-12', concludedAtUtc: null, referrer: 'Indicador legado', notes: 'Notas',
  metadata: { legacyReference: 'preservar' }, createdAtUtc: '2026-09-11T10:00:00Z', updatedAtUtc: '2026-09-11T10:00:00Z',
}

describe('fronteira HTTP legada × DBML v3.1', () => {
  beforeEach(() => request.mockReset())

  it('não inventa canais de contato nem inclui created_by fora do DBML', () => {
    const row = mapInsuredPerson(insured, 'tenant-1')
    expect(row).toMatchObject({ telefone: '1133334444', celular: null, whatsapp: null, filial_id: 'branch-1' })
    expect(row).not.toHaveProperty('created_by')
  })

  it('rejeita resposta sem corretora obrigatória', () => {
    expect(() => mapInsuredPerson({ ...insured, officeBranchId: null }, 'tenant-1')).toThrow('Corretora')
    expect(() => mapOpportunity({ ...opportunity, stageId: null }, 'tenant-1')).toThrow('Etapa')
  })

  it('preserva campos fora da edição, inclusive propriedades futuras do BE', async () => {
    const raw = { ...insured, socialName: 'Nome social', monthlyIncome: 1500, futureProperty: 'Preservar' }
    request.mockResolvedValueOnce(raw).mockResolvedValueOnce({ ...raw, name: 'Editado' })
    await updateBackendInsuredPerson(raw.id, { nome: 'Editado' }, 'tenant-1')
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toMatchObject({ name: 'Editado', socialName: 'Nome social', monthlyIncome: 1500, futureProperty: 'Preservar' })
  })

  it('não confunde fim da vigência com previsão de fechamento nem reinsere colunas aposentadas', () => {
    const row = mapOpportunity(opportunity, 'tenant-1')
    expect(row).toMatchObject({ titulo: 'Seguro teste', valor_premio_estimado: 1000, data_fechamento_prevista: null })
    for (const key of ['status', 'metadata', 'pipeline_id', 'nome', 'seguradora_id']) expect(row).not.toHaveProperty(key)
  })

  it('impede que uma conclusão sem data pareça uma oportunidade em aberto', () => {
    expect(() => mapOpportunity({ ...opportunity, status: 'won' }, 'tenant-1')).toThrow('sem data')
  })

  it('traduz ganho e preserva informações legadas no PUT', async () => {
    request.mockResolvedValueOnce(opportunity).mockResolvedValueOnce({ ...opportunity, status: 'won', concludedAtUtc: '2026-09-11T12:00:00Z' })
    const row = await updateBackendOpportunity('op-1', { ganha_em: '2026-09-11T12:00:00Z', perdida_em: null }, null)
    const body = JSON.parse(String(request.mock.calls[1][1]?.body)) as Record<string, unknown>
    expect(body).toMatchObject({ status: 'won', concludedAtUtc: '2026-09-11T12:00:00Z', insurerId: 'insurer-legacy', businessType: 'novo', validityEndUtc: '2027-09-11', nextFollowUpUtc: '2026-09-12', referrer: 'Indicador legado', metadata: opportunity.metadata })
    expect(row.ganha_em).toBe('2026-09-11T12:00:00Z')
    expect(row.perdida_em).toBeNull()
  })

  it('traduz reabertura sem apagar os dados não exibidos pelo front', async () => {
    request.mockResolvedValueOnce({ ...opportunity, status: 'lost', concludedAtUtc: '2026-09-10T12:00:00Z' }).mockResolvedValueOnce(opportunity)
    await updateBackendOpportunity('op-1', { ganha_em: null, perdida_em: null }, 'tenant-1')
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toMatchObject({ status: 'pending', concludedAtUtc: null, productionAmount: 1200 })
  })

  it('preserva o vínculo de renovação v3.1 ao editar outro campo', async () => {
    const raw = { ...opportunity, originPolicyId: 'policy-1' }
    request.mockResolvedValueOnce(raw).mockResolvedValueOnce({ ...raw, title: 'Atualizado' })
    await updateBackendOpportunity('op-1', { titulo: 'Atualizado' }, 'tenant-1')
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toMatchObject({ title: 'Atualizado', originPolicyId: 'policy-1' })
  })

  it('mantém criação pelos endpoints existentes com nomes HTTP separados dos nomes DBML', async () => {
    request.mockResolvedValueOnce(insured).mockResolvedValueOnce(opportunity)
    await createBackendInsuredPerson(mapInsuredPerson(insured, 'tenant-1'), 'tenant-1')
    await createBackendOpportunity({ tenant_id: 'tenant-1', filial_id: 'branch-1', stage_id: 'stage-1', titulo: 'Seguro teste', segurado_id: 'person-1' }, 'tenant-1')
    expect(request.mock.calls[0][0]).toBe('/api/segurados')
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toMatchObject({ personType: 'PF', phoneNumber: '1133334444' })
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toMatchObject({ name: 'Seguro teste', pipelineId: 'pipeline-1', status: 'pending' })
  })

  it('navega todas as páginas sem truncar silenciosamente', async () => {
    request
      .mockResolvedValueOnce({ items: [insured], page: 1, pageSize: 100, totalCount: 2, hasMore: true })
      .mockResolvedValueOnce({ items: [{ ...insured, id: 'person-2', name: 'Segunda pessoa' }], page: 2, pageSize: 100, totalCount: 2, hasMore: false })
    const result = await listBackendInsuredPeople('tenant-1')
    expect(result.map(item => item.id)).toEqual(['person-1', 'person-2'])
    expect(request.mock.calls.map(call => call[0])).toEqual([
      '/api/segurados?page=1&pageSize=100',
      '/api/segurados?page=2&pageSize=100',
    ])
  })

  it('persiste campos explícitos v3.1 sem dados de negócio em JSON', async () => {
    request.mockResolvedValueOnce(insured).mockResolvedValueOnce(opportunity)
    await createBackendInsuredPerson({ ...mapInsuredPerson(insured, 'tenant-1'), whatsapp: '11999998888' }, 'tenant-1')
    await createBackendOpportunity({ tenant_id: 'tenant-1', filial_id: 'branch-1', stage_id: 'stage-1', lead_nome: 'Lead', lead_email: 'lead@example.invalid', data_fechamento_prevista: '2026-10-20' }, 'tenant-1')
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toMatchObject({ whatsAppNumber: '11999998888' })
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toMatchObject({ leadEmail: 'lead@example.invalid', expectedCloseDate: '2026-10-20', metadata: {} })
  })
})
