import { apiClient } from './apiClient';

const BACKEND_ACCESS_TOKEN_KEY = 'wassis.backendAccessToken';

export type BackendLoginResponse = {
  accessToken: string;
  expiresAtUtc: string;
  userId: string;
  tenantId: string | null;
  brokerageId: string | null;
  sellerId: string | null;
  userType: string;
  roles: string[];
};

export type BackendCurrentUser = {
  isAuthenticated: boolean;
  userId: string | null;
  tenantId: string | null;
  brokerageId: string | null;
  sellerId: string | null;
  userType: string | null;
  roles: string[];
};

let memoryAccessToken: string | undefined;

function getStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function saveBackendSession(session: BackendLoginResponse): void {
  memoryAccessToken = session.accessToken;
  getStorage()?.setItem(BACKEND_ACCESS_TOKEN_KEY, session.accessToken);
}

export function getBackendAccessToken(): string | undefined {
  return getStorage()?.getItem(BACKEND_ACCESS_TOKEN_KEY) ?? memoryAccessToken;
}

export function clearBackendSession(): void {
  memoryAccessToken = undefined;
  getStorage()?.removeItem(BACKEND_ACCESS_TOKEN_KEY);
}

export async function loginToBackend(username: string, password: string): Promise<BackendLoginResponse> {
  const session = await apiClient.post<BackendLoginResponse>('/api/identity/login', { username, password });
  saveBackendSession(session);
  return session;
}

export async function getBackendCurrentUser(): Promise<BackendCurrentUser> {
  return apiClient.get<BackendCurrentUser>('/api/identity/me', getBackendAccessToken());
}
