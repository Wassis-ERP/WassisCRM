import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, Session, UserProfile } from '../types/auth';
import {
  clearBackendSession,
  getBackendAccessToken,
  getBackendCurrentUser,
  getBackendSessionSnapshot,
  loginToBackend,
  markBackendActivity,
} from '../lib/backendApi';
import { queryClient } from '../lib/queryClient';
import { getTable } from '../lib/inMemoryDb';
import { AuthContext } from './authCore';

const REQUIRE_BACKEND_AUTH = import.meta.env.VITE_AUTH_MODE === 'backend';
const ACTIVE_BRANCH_STORAGE_KEY = 'wassis.crm.activeBranchId';

/**
 * Provider de autenticação do modo frontend puro.
 *
 * Entrega sempre o mesmo usuário admin estático: não há login, logout ou
 * troca de identidade. Quando o backend real existir, este provider volta a
 * conversar com ele (ou é substituído por uma versão HTTP).
 */
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
  branchIds: ['mock-branch-id', 'mock-branch-centro'],
  hasAllBranchesAccess: true,
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

function getAvailableBranchIds(user: UserProfile | null) {
  if (!user) return [];

  // Modo mock: as corretoras acessíveis derivam de profile_filiais do usuário
  // (D12/D18) — editar o acesso na Equipe reflete no seletor. No backend real,
  // o mesmo conjunto viria do token (branchIds).
  if (!REQUIRE_BACKEND_AUTH) {
    const vinculos = getTable('profile_filiais').filter((v) => v.profile_id === user.id);
    const ids = Array.from(
      new Set(vinculos.map((v) => v.filial_id).filter((x): x is string => Boolean(x))),
    );
    if (ids.length > 0) return ids;
  }

  return Array.from(
    new Set(
      [user.branchId, ...(user.branchIds ?? [])]
        .filter((branchId): branchId is string => Boolean(branchId?.trim()))
        .map((branchId) => branchId.trim()),
    ),
  );
}

function resolveInitialActiveBranchId(user: UserProfile | null) {
  if (!user) return null;

  const availableBranchIds = getAvailableBranchIds(user);
  const savedBranchId = localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);

  if (savedBranchId === '__all__' && user.hasAllBranchesAccess) {
    return null;
  }

  if (savedBranchId && availableBranchIds.includes(savedBranchId)) {
    return savedBranchId;
  }

  return user.branchId ?? availableBranchIds[0] ?? null;
}

function applyActiveBranch(user: UserProfile | null, activeBranchId: string | null): UserProfile | null {
  if (!user) return null;
  return { ...user, branchId: activeBranchId };
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
  };
  const activeBranchId = resolveInitialActiveBranchId(user);

  return {
    loading: false,
    user: applyActiveBranch(user, activeBranchId),
    activeBranchId,
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
  const mockActiveBranchId = resolveInitialActiveBranchId(MOCK_USER);
  const [authState, setAuthState] = useState<AuthState>({
    session: REQUIRE_BACKEND_AUTH ? null : MOCK_SESSION,
    user: REQUIRE_BACKEND_AUTH ? null : applyActiveBranch(MOCK_USER, mockActiveBranchId),
    activeBranchId: REQUIRE_BACKEND_AUTH ? null : mockActiveBranchId,
    loading: true,
  });

  const refreshSession = useCallback(async () => {
    try {
      const backendState = await loadBackendAuthState();
      setAuthState(
        backendState ??
          (REQUIRE_BACKEND_AUTH
            ? { session: null, user: null, activeBranchId: null, loading: false }
            : {
                session: MOCK_SESSION,
                user: applyActiveBranch(MOCK_USER, mockActiveBranchId),
                activeBranchId: mockActiveBranchId,
                loading: false,
              }),
      );
    } catch {
      clearBackendSession();
      setAuthState(
        REQUIRE_BACKEND_AUTH
          ? { session: null, user: null, activeBranchId: null, loading: false }
          : {
              session: MOCK_SESSION,
              user: applyActiveBranch(MOCK_USER, mockActiveBranchId),
              activeBranchId: mockActiveBranchId,
              loading: false,
            },
      );
    }
  }, [mockActiveBranchId]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      // Modo frontend puro: aceita qualquer credencial e entra com o usuário
      // mock (mantendo o e-mail digitado), sem chamar o backend.
      if (!REQUIRE_BACKEND_AUTH) {
        const email = username || MOCK_USER.email;
        setAuthState({
          session: { ...MOCK_SESSION, user: { id: MOCK_USER.id, email } },
          user: applyActiveBranch({ ...MOCK_USER, email }, mockActiveBranchId),
          activeBranchId: mockActiveBranchId,
          loading: false,
        });
        return;
      }

      await loginToBackend(username, password);
      await refreshSession();
    },
    [mockActiveBranchId, refreshSession],
  );

  const signOut = useCallback(async () => {
    // Sempre encerra a sessão de fato — inclusive no modo mock, para que o
    // botão "Sair" leve de volta à tela de login.
    clearBackendSession();
    setAuthState({ session: null, user: null, activeBranchId: null, loading: false });
  }, []);

  const setActiveBranchId = useCallback((branchId: string | null) => {
    setAuthState((current) => {
      const availableBranchIds = getAvailableBranchIds(current.user);
      const canUseAllBranches = current.user?.hasAllBranchesAccess === true;
      const nextBranchId = branchId && availableBranchIds.includes(branchId) ? branchId : null;

      if (branchId && !nextBranchId) {
        return current;
      }

      if (!nextBranchId && !canUseAllBranches) {
        return current;
      }

      localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, nextBranchId ?? '__all__');
      void queryClient.invalidateQueries();

      return {
        ...current,
        activeBranchId: nextBranchId,
        user: applyActiveBranch(current.user, nextBranchId),
      };
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!REQUIRE_BACKEND_AUTH || !authState.session) return undefined;

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    const handleActivity = () => markBackendActivity();
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));

    const intervalId = window.setInterval(() => {
      if (!getBackendSessionSnapshot()) {
        clearBackendSession();
        setAuthState({ session: null, user: null, activeBranchId: null, loading: false });
      }
    }, 60_000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      window.clearInterval(intervalId);
    };
  }, [authState.session]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
        refreshSession,
        setActiveBranchId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
