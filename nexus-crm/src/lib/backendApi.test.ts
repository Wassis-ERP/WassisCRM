import { beforeEach, describe, expect, it, vi } from 'vitest'

const storage = new Map<string, string>()

function installLocalStorage() {
  storage.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
    },
  })
}

async function importBackendApi() {
  vi.resetModules()
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  return import('./backendApi')
}

const csrfResponse = () => ({ ok: true, status: 200, json: async () => ({ token: 'csrf-test' }) })
const loginResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    accessToken: '',
    expiresAtUtc: '2099-07-23T18:00:00Z',
    userId: 'user-1',
    tenantId: 'tenant-1',
    brokerageId: 'brokerage-1',
    branchId: 'branch-a',
    branchIds: ['branch-a', 'branch-b'],
    hasAllBranchesAccess: false,
    sellerId: 'seller-1',
    userType: 'brokerage_seller',
    roles: ['brokerage_seller'],
  }),
})

describe('backendApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllEnvs()
    installLocalStorage()
  })

  it('não exibe corpo bruto do backend nem persiste token em falha', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(csrfResponse())
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ detail: 'sensitive' }) })
    vi.stubGlobal('fetch', fetchMock)
    const { loginToBackend } = await importBackendApi()
    await expect(loginToBackend('test@example.invalid', 'fixture')).rejects.toThrow('Serviço indisponível')
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('recusa resposta de autenticação incompleta', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(csrfResponse())
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ expiresAtUtc: '2099-01-01T00:00:00Z' }) })
    vi.stubGlobal('fetch', fetchMock)
    const { loginToBackend } = await importBackendApi()
    await expect(loginToBackend('test@example.invalid', 'fixture')).rejects.toThrow('Resposta de autenticação inválida')
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('encerra obtenção do CSRF quando estoura o timeout', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    vi.stubGlobal('fetch', fetchMock)
    const { loginToBackend } = await importBackendApi()
    const result = expect(loginToBackend('test@example.invalid', 'fixture')).rejects.toThrow('Tempo de resposta excedido')
    await vi.advanceTimersByTimeAsync(15_000)
    await result
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('usa CSRF e cookie HttpOnly sem armazenar credenciais no Web Storage', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(csrfResponse()).mockResolvedValueOnce(loginResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { getBackendSessionSnapshot, loginToBackend } = await importBackendApi()
    const result = await loginToBackend('user@test.local', 'secret')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/api/identity/csrf')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' })
    const [loginUrl, loginInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(loginUrl).toBe('https://api.test/api/identity/login')
    expect(loginInit).toMatchObject({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ username: 'user@test.local', password: 'secret' }),
    })
    expect(new Headers(loginInit.headers).get('X-CSRF-TOKEN')).toBe('csrf-test')
    expect(new Headers(loginInit.headers).get('Authorization')).toBeNull()
    expect(result.accessToken).toBe('')
    expect(getBackendSessionSnapshot()).toMatchObject({ username: 'user@test.local', branchId: 'branch-a' })
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('consulta o usuário atual por cookie e nunca envia bearer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ isAuthenticated: true, userId: 'user-2', tenantId: 'tenant-2', branchId: 'branch-c', branchIds: ['branch-c'], roles: ['brokerage_admin'] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { getBackendCurrentUser } = await importBackendApi()
    const result = await getBackendCurrentUser()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.test/api/identity/me')
    expect(init.credentials).toBe('include')
    expect(new Headers(init.headers).get('Authorization')).toBeNull()
    expect(result).toMatchObject({ isAuthenticated: true, branchId: 'branch-c' })
  })

  it('envia filial ativa no cliente autenticado sem expor token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'insured-1' }) })
    vi.stubGlobal('fetch', fetchMock)
    const { requestAuthenticatedBackendJson, setBackendActiveBranch } = await importBackendApi()
    setBackendActiveBranch('branch-a')
    await requestAuthenticatedBackendJson('/api/segurados')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('X-Office-Branch-Id')).toBe('branch-a')
    expect(headers.get('Authorization')).toBeNull()
  })

  it('faz logout no servidor com CSRF e limpa a sessão em memória', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(csrfResponse()).mockResolvedValueOnce(loginResponse())
      .mockResolvedValueOnce({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)
    const { getBackendSessionSnapshot, loginToBackend, logoutBackend } = await importBackendApi()
    await loginToBackend('user@test.local', 'secret')
    await logoutBackend()
    expect(getBackendSessionSnapshot()).toBeNull()
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://api.test/api/identity/logout')
    expect((fetchMock.mock.calls[2]?.[1] as RequestInit).credentials).toBe('include')
  })
})
