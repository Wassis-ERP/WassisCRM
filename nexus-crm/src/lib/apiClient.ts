const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:54269').replace(/\/$/, '');

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  accessToken?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, headers, body, ...init } = options;
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, accessToken?: string) => apiRequest<T>(path, { method: 'GET', accessToken }),
  post: <T>(path: string, body?: unknown, accessToken?: string) =>
    apiRequest<T>(path, { method: 'POST', body, accessToken }),
};
