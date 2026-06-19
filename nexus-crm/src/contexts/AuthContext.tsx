import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, ModulePermission, Session, UserProfile } from '../types/auth';
import {
  clearBackendSession,
  getBackendAccessToken,
  getBackendCurrentUser,
  getBackendSessionSnapshot,
  loginToBackend,
} from '../lib/backendApi';
import { AuthContext } from './authCore';

const REQUIRE_BACKEND_AUTH = import.meta.env.VITE_AUTH_MODE === 'backend';

/**
 * Provider de autenticação do modo frontend puro.
 *
 * Entrega sempre o mesmo usuário admin estático: não há login, logout ou
 * troca de identidade. Quando o backend real existir, este provider volta a
 * conversar com ele (ou é substituído por uma versão HTTP).
 */
const MOCK_PERMISSIONS: ModulePermission[] = [
  { module: 'dashboard', can_read: true, can_create: true, can_update: true, can_delete: true },
  { module: 'segurados', can_read: true, can_create: true, can_update: true, can_delete: true },
  { module: 'apolices', can_read: true, can_create: true, can_update: true, can_delete: true },
  { module: 'financeiro', can_read: true, can_create: true, can_update: true, can_delete: true },
  { module: 'configuracoes', can_read: true, can_create: true, can_update: true, can_delete: true },
];

const MOCK_USER: UserProfile = {
  id: 'mock-user-id',
  email: 'dev@wassis.com',
  role: 'admin',
  firstName: 'Dev',
  lastName: 'Wassis',
  fullName: 'Dev Wassis',
  avatarUrl: undefined,
  tenantId: 'mock-tenant-id',
  brokerageId: 'mock-brokerage-id',
  branchId: 'mock-branch-id',
  branchIds: ['mock-branch-id'],
  hasAllBranchesAccess: true,
  permissions: MOCK_PERMISSIONS,
};

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: MOCK_USER.id,
    email: MOCK_USER.email,
  },
};

function toUnixSeconds(value?: string) {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : Math.floor(timestamp / 1000);
}

function normalizeRole(roles: string[]): UserProfile['role'] {
  const normalizedRoles = roles.map((role) => role.toLowerCase().replace(/_/g, '-'));

  if (
    normalizedRoles.includes('admin') ||
    normalizedRoles.includes('brokerage-owner') ||
    normalizedRoles.includes('brokerage-admin') ||
    normalizedRoles.includes('platform-admin')
  ) {
    return 'admin';
  }

  if (
    normalizedRoles.includes('seller') ||
    normalizedRoles.includes('brokerage-seller') ||
    normalizedRoles.includes('vendedor')
  ) {
    return 'vendedor';
  }

  return 'visualizador';
}

async function loadBackendAuthState(): Promise<AuthState | null> {
  const snapshot = getBackendSessionSnapshot();
  const token = getBackendAccessToken();
  if (!snapshot || !token) return null;

  const currentUser = await getBackendCurrentUser();
  if (!currentUser?.isAuthenticated || !currentUser.userId) {
    clearBackendSession();
    return null;
  }

  const email = snapshot.username;
  const roles = currentUser.roles.length > 0 ? currentUser.roles : snapshot.roles;
  const user: UserProfile = {
    id: currentUser.userId,
    email,
    role: normalizeRole(roles),
    firstName: email.split('@')[0],
    fullName: email,
    tenantId: currentUser.tenantId,
    brokerageId: currentUser.brokerageId,
    branchId: currentUser.branchId ?? snapshot.branchId,
    branchIds: currentUser.branchIds.length > 0 ? currentUser.branchIds : snapshot.branchIds,
    hasAllBranchesAccess: currentUser.hasAllBranchesAccess || snapshot.hasAllBranchesAccess,
    permissions: MOCK_PERMISSIONS,
  };

  return {
    loading: false,
    user,
    session: {
      access_token: token,
      expires_at: toUnixSeconds(snapshot.expiresAtUtc),
      user: {
        id: user.id,
        email: user.email,
      },
    },
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    session: REQUIRE_BACKEND_AUTH ? null : MOCK_SESSION,
    user: REQUIRE_BACKEND_AUTH ? null : MOCK_USER,
    loading: true,
  });

  const refreshSession = useCallback(async () => {
    try {
      const backendState = await loadBackendAuthState();
      setAuthState(
        backendState ??
          (REQUIRE_BACKEND_AUTH
            ? { session: null, user: null, loading: false }
            : { session: MOCK_SESSION, user: MOCK_USER, loading: false }),
      );
    } catch {
      clearBackendSession();
      setAuthState(
        REQUIRE_BACKEND_AUTH
          ? { session: null, user: null, loading: false }
          : { session: MOCK_SESSION, user: MOCK_USER, loading: false },
      );
    }
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      // Modo frontend puro: aceita qualquer credencial e entra com o usuário
      // mock (mantendo o e-mail digitado), sem chamar o backend.
      if (!REQUIRE_BACKEND_AUTH) {
        const email = username || MOCK_USER.email;
        setAuthState({
          session: { ...MOCK_SESSION, user: { id: MOCK_USER.id, email } },
          user: { ...MOCK_USER, email },
          loading: false,
        });
        return;
      }

      await loginToBackend(username, password);
      await refreshSession();
    },
    [refreshSession],
  );

  const signOut = useCallback(async () => {
    // Sempre encerra a sessão de fato — inclusive no modo mock, para que o
    // botão "Sair" leve de volta à tela de login.
    clearBackendSession();
    setAuthState({ session: null, user: null, loading: false });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
