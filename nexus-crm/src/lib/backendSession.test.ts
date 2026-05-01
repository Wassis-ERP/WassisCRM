import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearBackendSession,
  getBackendAccessToken,
  getBackendCurrentUser,
  loginToBackend,
  saveBackendSession,
  type BackendLoginResponse,
} from './backendSession';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

const session: BackendLoginResponse = {
  accessToken: 'backend-token',
  expiresAtUtc: '2026-05-01T12:00:00Z',
  userId: 'user-1',
  tenantId: 'tenant-1',
  brokerageId: 'brokerage-1',
  sellerId: null,
  userType: 'brokerage_staff',
  roles: ['brokerage_admin'],
};

describe('backend session', () => {
  afterEach(() => {
    fetchMock.mockReset();
    clearBackendSession();
  });

  it('stores and clears the backend access token', () => {
    saveBackendSession(session);

    expect(getBackendAccessToken()).toBe('backend-token');

    clearBackendSession();

    expect(getBackendAccessToken()).toBeUndefined();
  });

  it('logs into the backend and stores the returned token', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(loginToBackend('broker.admin@wassis.local', 'password')).resolves.toEqual(session);
    expect(getBackendAccessToken()).toBe('backend-token');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://localhost:54269/api/identity/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'broker.admin@wassis.local',
          password: 'password',
        }),
      }),
    );
  });

  it('uses the stored backend token when loading the current user', async () => {
    saveBackendSession(session);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ isAuthenticated: true, roles: ['brokerage_admin'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await getBackendCurrentUser();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://localhost:54269/api/identity/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer backend-token',
        }),
      }),
    );
  });
});
