import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

function installLocalStorage() {
  storage.clear();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
    },
  });
}

async function importBackendApi() {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test');
  return import('./backendApi');
}

describe('backendApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    installLocalStorage();
  });

  it('normaliza login do BE e persiste dados de filial na sessao local', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        AccessToken: 'token-123',
        ExpiresAtUtc: '2099-07-23T18:00:00Z',
        UserId: 'user-1',
        TenantId: 'tenant-1',
        BrokerageId: 'brokerage-1',
        BranchId: 'branch-a',
        BranchIds: ['branch-a', 'branch-b'],
        HasAllBranchesAccess: false,
        SellerId: 'seller-1',
        UserType: 'brokerage_seller',
        Roles: ['brokerage_seller'],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getBackendSessionSnapshot, loginToBackend } = await importBackendApi();
    const result = await loginToBackend('user@test.local', 'secret');

    const [, loginInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/api/identity/login');
    expect(loginInit).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ username: 'user@test.local', password: 'secret' }),
    });
    expect(new Headers(loginInit.headers).get('Content-Type')).toBe('application/json');
    expect(result).toMatchObject({
      accessToken: 'token-123',
      branchId: 'branch-a',
      branchIds: ['branch-a', 'branch-b'],
      hasAllBranchesAccess: false,
    });
    expect(getBackendSessionSnapshot()).toMatchObject({
      username: 'user@test.local',
      branchId: 'branch-a',
      branchIds: ['branch-a', 'branch-b'],
    });
  });

  it('normaliza usuario atual e envia bearer token salvo', async () => {
    storage.set('wassis.backend.accessToken', 'token-abc');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        isAuthenticated: true,
        userId: 'user-2',
        tenantId: 'tenant-2',
        brokerageId: 'brokerage-2',
        branchId: 'branch-c',
        branchIds: ['branch-c'],
        hasAllBranchesAccess: true,
        sellerId: null,
        userType: 'brokerage_admin',
        roles: ['brokerage_admin'],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getBackendCurrentUser } = await importBackendApi();
    const result = await getBackendCurrentUser();

    const [, currentUserInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/api/identity/me');
    const currentUserHeaders = new Headers(currentUserInit.headers);
    expect(currentUserHeaders.get('Content-Type')).toBe('application/json');
    expect(currentUserHeaders.get('Authorization')).toBe('Bearer token-abc');
    expect(result).toMatchObject({
      isAuthenticated: true,
      branchId: 'branch-c',
      branchIds: ['branch-c'],
      hasAllBranchesAccess: true,
      roles: ['brokerage_admin'],
    });
  });

  it('preserva o bearer token no cliente autenticado de dominio', async () => {
    storage.set('wassis.backend.accessToken', 'token-domain');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'insured-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestAuthenticatedBackendJson } = await importBackendApi();
    await requestAuthenticatedBackendJson('/api/segurados');

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/api/segurados');
    expect(new Headers(requestInit.headers).get('Authorization')).toBe('Bearer token-domain');
  });

  it('limpa sessao local quando token absoluto expirou', async () => {
    vi.useFakeTimers();
    storage.set('wassis.backend.accessToken', 'token-expired');
    storage.set(
      'wassis.backend.session',
      JSON.stringify({
        accessToken: 'token-expired',
        expiresAtUtc: '2026-05-23T18:00:00Z',
        username: 'user@test.local',
      }),
    );
    storage.set('wassis.backend.lastActivityAt', Date.parse('2026-05-23T17:30:00Z').toString());
    vi.setSystemTime(new Date('2026-05-23T18:00:01Z'));

    const { getBackendSessionSnapshot } = await importBackendApi();

    expect(getBackendSessionSnapshot()).toBeNull();
    expect(storage.has('wassis.backend.accessToken')).toBe(false);
    expect(storage.has('wassis.backend.session')).toBe(false);
    expect(storage.has('wassis.backend.lastActivityAt')).toBe(false);

    vi.useRealTimers();
  });

  it('limpa sessao local apos duas horas sem atividade', async () => {
    vi.useFakeTimers();
    storage.set('wassis.backend.accessToken', 'token-idle');
    storage.set(
      'wassis.backend.session',
      JSON.stringify({
        accessToken: 'token-idle',
        expiresAtUtc: '2026-05-24T02:00:00Z',
        username: 'user@test.local',
      }),
    );
    storage.set('wassis.backend.lastActivityAt', Date.parse('2026-05-23T18:00:00Z').toString());
    vi.setSystemTime(new Date('2026-05-23T20:00:01Z'));

    const { getBackendSessionSnapshot } = await importBackendApi();

    expect(getBackendSessionSnapshot()).toBeNull();

    vi.useRealTimers();
  });
});
