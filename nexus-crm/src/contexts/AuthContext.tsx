import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, Session, UserProfile } from '../types/auth';
import {
  beginExternalLogin,
  clearBackendSession,
  finishExternalLogout,
  getBackendCurrentUser,
  getBackendEffectivePermissions,
  getBackendSessionSnapshot,
  loginToBackend,
  logoutBackend,
  markBackendActivity,
  setBackendActiveBranch,
  usesExternalIdentity,
} from '../lib/backendApi';
import { queryClient } from '../lib/queryClient';
import { getTable } from '../lib/inMemoryDb';
import { activeProfileLinks } from '../modules/plataforma/platformCommands';
import { AuthContext } from './authCore';

const REQUIRE_BACKEND_AUTH = import.meta.env.VITE_AUTH_MODE === 'backend';
const ACTIVE_BRANCH_STORAGE_KEY = 'wassis.crm.activeBranchId';
const PROFILE_STORAGE_KEY = 'wassis.crm.mockProfile';

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

type ProfilePatch = Partial<Pick<UserProfile, 'fullName' | 'avatarUrl'>>;

function getStoredProfilePatch(): ProfilePatch {
  if (REQUIRE_BACKEND_AUTH) return {};

  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as ProfilePatch;
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : undefined,
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : undefined,
    };
  } catch {
    return {};
  }
}

function applyStoredProfile(user: UserProfile): UserProfile {
  return { ...user, ...getStoredProfilePatch() };
}

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
    return activeProfileLinks(user.id).map(v => v.filial_id);
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

  return (user.branchId && availableBranchIds.includes(user.branchId) ? user.branchId : availableBranchIds[0]) ?? null;
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
  const currentUser = await getBackendCurrentUser();
  if (!currentUser?.isAuthenticated || !currentUser.userId) {
    clearBackendSession();
    return null;
  }

  const permissions = await getBackendEffectivePermissions();
  const email = snapshot?.username ?? currentUser.userId;
  const roles = currentUser.roles;
  const user: UserProfile = {
    id: currentUser.userId,
    email,
    role: normalizeRole(roles),
    firstName: email.split('@')[0],
    fullName: email,
    tenantId: currentUser.tenantId,
    brokerageId: currentUser.brokerageId,
    branchId: currentUser.branchId,
    branchIds: Array.from(new Set(permissions.map(permission => permission.branchId))),
    hasAllBranchesAccess: false,
    permissions,
  };
  const activeBranchId = resolveInitialActiveBranchId(user);
  setBackendActiveBranch(activeBranchId);

  return {
    loading: false,
    user: applyActiveBranch(user, activeBranchId),
    activeBranchId,
    session: {
      access_token: '',
      expires_at: toUnixSeconds(snapshot?.expiresAtUtc),
      user: {
        id: user.id,
        email: user.email,
      },
    },
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const mockActiveBranchId = resolveInitialActiveBranchId(MOCK_USER);
  const mockUser = applyStoredProfile(MOCK_USER);
  const [authState, setAuthState] = useState<AuthState>({
    session: REQUIRE_BACKEND_AUTH ? null : MOCK_SESSION,
    user: REQUIRE_BACKEND_AUTH ? null : applyActiveBranch(mockUser, mockActiveBranchId),
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
                user: applyActiveBranch(applyStoredProfile(MOCK_USER), mockActiveBranchId),
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
              user: applyActiveBranch(applyStoredProfile(MOCK_USER), mockActiveBranchId),
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
        const user = applyStoredProfile({ ...MOCK_USER, email });
        setAuthState({
          session: { ...MOCK_SESSION, user: { id: MOCK_USER.id, email } },
          user: applyActiveBranch(user, mockActiveBranchId),
          activeBranchId: mockActiveBranchId,
          loading: false,
        });
        return;
      }

      queryClient.clear();
      await loginToBackend(username, password);
      await refreshSession();
    },
    [mockActiveBranchId, refreshSession],
  );

  const signOut = useCallback(async () => {
    // Sempre encerra a sessão de fato — inclusive no modo mock, para que o
    // botão "Sair" leve de volta à tela de login.
    try {
      if (REQUIRE_BACKEND_AUTH) await logoutBackend();
      else clearBackendSession();
    } finally {
      queryClient.clear();
      setAuthState({ session: null, user: null, activeBranchId: null, loading: false });
      if (REQUIRE_BACKEND_AUTH && usesExternalIdentity) finishExternalLogout();
    }
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
      setBackendActiveBranch(nextBranchId);
      void queryClient.invalidateQueries();

      return {
        ...current,
        activeBranchId: nextBranchId,
        user: applyActiveBranch(current.user, nextBranchId),
      };
    });
  }, []);

  useEffect(() => {
    if (REQUIRE_BACKEND_AUTH) return;
    const updateAccess = () => setAuthState(current => {
      if (!current.user) return current;
      const ids = getAvailableBranchIds(current.user);
      const activeBranchId = current.activeBranchId === null && current.user.hasAllBranchesAccess ? null : current.activeBranchId && ids.includes(current.activeBranchId) ? current.activeBranchId : ids[0] ?? null;
      return {...current, activeBranchId, user: {...current.user, branchIds: ids, branchId: activeBranchId}};
    });
    window.addEventListener('wassis:access-changed', updateAccess);
    const timer = window.setInterval(updateAccess, 60_000);
    return () => { window.removeEventListener('wassis:access-changed', updateAccess); window.clearInterval(timer); };
  }, []);

  const updateProfile = useCallback((patch: ProfilePatch) => {
    if (REQUIRE_BACKEND_AUTH) throw new Error('Integração de edição do perfil pendente. Nenhuma alteração foi salva.');
    setAuthState((current) => {
      if (!current.user) return current;

      const nextUser = { ...current.user, ...patch };
      if (!REQUIRE_BACKEND_AUTH) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
          fullName: nextUser.fullName,
          avatarUrl: nextUser.avatarUrl,
        }));

        const profile = getTable('profiles').find((row) => row.id === current.user?.id);
        if (profile) {
          profile.nome_completo = nextUser.fullName ?? null;
          profile.avatar_url = nextUser.avatarUrl ?? null;
        }
      }

      void queryClient.invalidateQueries();
      return { ...current, user: nextUser };
    });
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!REQUIRE_BACKEND_AUTH || !authState.session) return undefined;

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    const handleActivity = () => markBackendActivity();
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
    };
  }, [authState.session]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signInExternal: beginExternalLogin,
        signOut,
        refreshSession,
        setActiveBranchId,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
