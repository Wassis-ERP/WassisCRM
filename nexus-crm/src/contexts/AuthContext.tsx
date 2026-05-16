import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, ModulePermission, Session, UserProfile } from '../types/auth';
import {
  clearBackendSession,
  getBackendAccessToken,
  getBackendCurrentUser,
  getBackendSessionSnapshot,
} from '../lib/backendApi';
import { AuthContext } from './authCore';

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
  if (roles.includes('admin') || roles.includes('brokerage-admin') || roles.includes('platform-admin')) {
    return 'admin';
  }

  if (roles.includes('seller') || roles.includes('vendedor')) {
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
    session: MOCK_SESSION,
    user: MOCK_USER,
    loading: true,
  });

  const refreshSession = useCallback(async () => {
    try {
      const backendState = await loadBackendAuthState();
      setAuthState(backendState ?? { session: MOCK_SESSION, user: MOCK_USER, loading: false });
    } catch {
      clearBackendSession();
      setAuthState({ session: MOCK_SESSION, user: MOCK_USER, loading: false });
    }
  }, []);

  const signOut = useCallback(async () => {
    clearBackendSession();
    setAuthState({ session: MOCK_SESSION, user: MOCK_USER, loading: false });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
