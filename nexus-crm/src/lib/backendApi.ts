const BACKEND_ACCESS_TOKEN_KEY = 'wassis.backend.accessToken';
const BACKEND_SESSION_KEY = 'wassis.backend.session';
const BACKEND_LAST_ACTIVITY_KEY = 'wassis.backend.lastActivityAt';
const DEFAULT_IDLE_TIMEOUT_MINUTES = 120;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const configuredIdleTimeoutMinutes = Number(import.meta.env.VITE_BACKEND_IDLE_TIMEOUT_MINUTES);
const BACKEND_IDLE_TIMEOUT_MINUTES = Number.isFinite(configuredIdleTimeoutMinutes)
  ? configuredIdleTimeoutMinutes
  : DEFAULT_IDLE_TIMEOUT_MINUTES;
const BACKEND_IDLE_TIMEOUT_MS = BACKEND_IDLE_TIMEOUT_MINUTES * 60 * 1000;

type BackendRoles = string[];

export interface BackendLoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  userId: string;
  tenantId: string | null;
  brokerageId: string | null;
  branchId: string | null;
  branchIds: string[];
  hasAllBranchesAccess: boolean;
  sellerId: string | null;
  userType: string;
  roles: BackendRoles;
}

export interface BackendCurrentUser {
  isAuthenticated: boolean;
  userId: string | null;
  tenantId: string | null;
  brokerageId: string | null;
  branchId: string | null;
  branchIds: string[];
  hasAllBranchesAccess: boolean;
  sellerId: string | null;
  userType: string | null;
  roles: BackendRoles;
}

type BackendSessionSnapshot = BackendLoginResponse & {
  username: string;
};

function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL nao configurada para o WAssisBE.');
  }
}

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function isExpired(expiresAtUtc: string) {
  const expiresAt = Date.parse(expiresAtUtc);
  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

function isIdleTimedOut() {
  const lastActivityAt = Number(localStorage.getItem(BACKEND_LAST_ACTIVITY_KEY));
  return !Number.isFinite(lastActivityAt) || Date.now() - lastActivityAt > BACKEND_IDLE_TIMEOUT_MS;
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeLoginResponse(raw: unknown): BackendLoginResponse {
  const data = asRecord(raw);
  return {
    accessToken: asString(data.accessToken ?? data.AccessToken),
    expiresAtUtc: asString(data.expiresAtUtc ?? data.ExpiresAtUtc),
    userId: asString(data.userId ?? data.UserId),
    tenantId: asNullableString(data.tenantId ?? data.TenantId),
    brokerageId: asNullableString(data.brokerageId ?? data.BrokerageId),
    branchId: asNullableString(data.branchId ?? data.BranchId),
    branchIds: asStringArray(data.branchIds ?? data.BranchIds),
    hasAllBranchesAccess: asBoolean(data.hasAllBranchesAccess ?? data.HasAllBranchesAccess),
    sellerId: asNullableString(data.sellerId ?? data.SellerId),
    userType: asString(data.userType ?? data.UserType),
    roles: asStringArray(data.roles ?? data.Roles),
  };
}

function normalizeCurrentUser(raw: unknown): BackendCurrentUser {
  const data = asRecord(raw);
  return {
    isAuthenticated: data.isAuthenticated === true || data.IsAuthenticated === true,
    userId: asNullableString(data.userId ?? data.UserId),
    tenantId: asNullableString(data.tenantId ?? data.TenantId),
    brokerageId: asNullableString(data.brokerageId ?? data.BrokerageId),
    branchId: asNullableString(data.branchId ?? data.BranchId),
    branchIds: asStringArray(data.branchIds ?? data.BranchIds),
    hasAllBranchesAccess: asBoolean(data.hasAllBranchesAccess ?? data.HasAllBranchesAccess),
    sellerId: asNullableString(data.sellerId ?? data.SellerId),
    userType: asNullableString(data.userType ?? data.UserType),
    roles: asStringArray(data.roles ?? data.Roles),
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  ensureApiBaseUrl();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `WAssisBE respondeu ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function loginToBackend(username: string, password: string): Promise<BackendLoginResponse> {
  const result = normalizeLoginResponse(
    await requestJson('/api/identity/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  );

  const snapshot: BackendSessionSnapshot = { ...result, username };
  localStorage.setItem(BACKEND_ACCESS_TOKEN_KEY, result.accessToken);
  localStorage.setItem(BACKEND_SESSION_KEY, JSON.stringify(snapshot));
  markBackendActivity();

  return result;
}

export function getBackendAccessToken(): string | null {
  return localStorage.getItem(BACKEND_ACCESS_TOKEN_KEY);
}

export function getBackendSessionSnapshot(): BackendSessionSnapshot | null {
  const snapshot = readJson<BackendSessionSnapshot>(BACKEND_SESSION_KEY);
  if (!snapshot) return null;

  if (isExpired(snapshot.expiresAtUtc) || isIdleTimedOut()) {
    clearBackendSession();
    return null;
  }

  return snapshot;
}

export async function getBackendCurrentUser(): Promise<BackendCurrentUser | null> {
  const token = getBackendAccessToken();
  if (!token) return null;

  return normalizeCurrentUser(
    await requestJson('/api/identity/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
}

export function clearBackendSession() {
  localStorage.removeItem(BACKEND_ACCESS_TOKEN_KEY);
  localStorage.removeItem(BACKEND_SESSION_KEY);
  localStorage.removeItem(BACKEND_LAST_ACTIVITY_KEY);
}

export function markBackendActivity() {
  if (localStorage.getItem(BACKEND_ACCESS_TOKEN_KEY)) {
    localStorage.setItem(BACKEND_LAST_ACTIVITY_KEY, Date.now().toString());
  }
}
