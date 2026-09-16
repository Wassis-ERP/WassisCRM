const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
let backendSession: BackendSessionSnapshot | null = null;
let backendLastActivityAt = 0;
let csrfToken: string | null = null;
let selectedBranchId: string | null = null;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
export const usesExternalIdentity = import.meta.env.VITE_AUTH_MODE === 'backend'
  && import.meta.env.VITE_AUTH_PROVIDER === 'auth0';
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

export type BackendSessionSnapshot = BackendLoginResponse & {
  username: string;
};

export interface BackendEffectivePermission {
  branchId: string;
  module: string;
  scope: 'GRUPO' | 'CORRETORA' | 'PROPRIO';
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManage: boolean;
}

function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL nao configurada para o WAssisBE.');
  }
}

function isExpired(expiresAtUtc: string) {
  const expiresAt = Date.parse(expiresAtUtc);
  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

function isIdleTimedOut() {
  return !backendLastActivityAt || Date.now() - backendLastActivityAt > BACKEND_IDLE_TIMEOUT_MS;
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
  if (!path.startsWith('/api/') || path.includes('..') || path.includes('\\')) {
    throw new Error('Caminho de API inválido.');
  }
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('X-Correlation-ID', crypto.randomUUID());
  if (selectedBranchId) headers.set('X-Office-Branch-Id', selectedBranchId);
  const method = (init?.method ?? 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    csrfToken ??= await fetchCsrfToken();
    headers.set('X-CSRF-TOKEN', csrfToken);
  }
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 15_000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal: init?.signal ? AbortSignal.any([init.signal, timeout.signal]) : timeout.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearBackendSession();
        throw new Error(path === '/api/identity/login' ? 'Usuário ou senha inválidos.' : 'Sessão expirada. Entre novamente.');
      }
      const messages: Record<number, string> = {
        400: 'Não foi possível salvar. Revise os campos informados.',
        403: 'Sua conta não tem permissão para esta operação.',
        404: 'Registro não encontrado ou indisponível para sua conta.',
        409: path === '/api/identity/login' ? 'Autenticação indisponível neste ambiente. Contate o administrador.' : 'Os dados foram alterados ou já existem. Atualize a consulta antes de continuar.',
        429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
        501: 'Integração pendente. Esta operação ainda não está disponível.',
      };
      // Never display arbitrary response bodies, stack traces, or proxy HTML.
      throw new Error(messages[response.status] ?? 'Serviço indisponível. Tente novamente mais tarde.');
    }

    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  } catch (error) {
    if (timeout.signal.aborted) throw new Error('Tempo de resposta excedido. Consulte os dados antes de repetir um salvamento.');
    if (init?.signal?.aborted) throw new Error('Consulta cancelada.');
    if (error instanceof TypeError) throw new Error('Não foi possível conectar ao serviço. Verifique sua conexão.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestAuthenticatedBackendJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestJson<T>(path, init);
}

export async function loginToBackend(username: string, password: string): Promise<BackendLoginResponse> {
  const result = normalizeLoginResponse(
    await requestJson('/api/identity/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  );

  const snapshot: BackendSessionSnapshot = { ...result, username };
  if (!result.userId || !result.tenantId || !result.userType || !result.roles.length || isExpired(result.expiresAtUtc)) {
    clearBackendSession();
    throw new Error('Resposta de autenticação inválida. Nenhuma sessão foi criada.');
  }
  backendSession = snapshot;
  // ASP.NET antiforgery request tokens are bound to the identity that obtained
  // them. Discard the anonymous/previous user's token after the cookie changes.
  csrfToken = null;
  selectedBranchId = null;
  markBackendActivity();

  return result;
}

export function beginExternalLogin() {
  ensureApiBaseUrl();
  window.location.assign(`${API_BASE_URL}/api/identity/external/login`);
}

export function finishExternalLogout() {
  ensureApiBaseUrl();
  window.location.assign(`${API_BASE_URL}/api/identity/external/logout`);
}

export function getBackendAccessToken(): string | null {
  return null;
}

export function getBackendSessionSnapshot(): BackendSessionSnapshot | null {
  const snapshot = backendSession;
  if (!snapshot) return null;

  if (isExpired(snapshot.expiresAtUtc) || isIdleTimedOut()) {
    clearBackendSession();
    return null;
  }

  return snapshot;
}

export async function getBackendCurrentUser(): Promise<BackendCurrentUser | null> {
  return normalizeCurrentUser(
    await requestJson('/api/identity/me'),
  );
}

export async function getBackendEffectivePermissions(branchId?: string | null): Promise<BackendEffectivePermission[]> {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
  return requestJson<BackendEffectivePermission[]>(`/api/identity/me/permissions${query}`);
}

export function setBackendActiveBranch(branchId: string | null) {
  selectedBranchId = branchId;
}

export async function logoutBackend() {
  try {
    await requestJson<void>('/api/identity/logout', { method: 'POST' });
  } finally {
    clearBackendSession();
  }
}

export function clearBackendSession() {
  backendSession = null;
  backendLastActivityAt = 0;
  csrfToken = null;
  selectedBranchId = null;
}

export function markBackendActivity() {
  if (backendSession) backendLastActivityAt = Date.now();
}

async function fetchCsrfToken(): Promise<string> {
  ensureApiBaseUrl();
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 15_000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/identity/csrf`, {
      credentials: 'include',
      signal: timeout.signal,
    });
    if (!response.ok) throw new Error('Não foi possível iniciar a proteção da sessão.');
    const payload = asRecord(await response.json());
    const token = asString(payload.token ?? payload.Token);
    if (!token) throw new Error('Resposta CSRF inválida.');
    return token;
  } catch (error) {
    if (timeout.signal.aborted) throw new Error('Tempo de resposta excedido. Consulte os dados antes de repetir um salvamento.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
