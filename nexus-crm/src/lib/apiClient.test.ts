import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

describe('apiRequest', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('sends JSON body and bearer token to the configured API', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await apiRequest<{ status: string }>('/health', {
      method: 'POST',
      accessToken: 'token-123',
      body: { ping: true },
    });

    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://localhost:54269/health',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ping: true }),
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        }),
      }),
    );
  });

  it('throws response text when the API returns an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));

    await expect(apiRequest('/api/identity/me')).rejects.toThrow('Forbidden');
  });

  it('returns undefined for no-content responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiRequest('/empty')).resolves.toBeUndefined();
  });
});
