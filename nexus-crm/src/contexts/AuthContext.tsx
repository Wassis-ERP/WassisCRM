import { createContext } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, ModulePermission, Session, UserProfile } from '../types/auth';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider
      value={{
        session: MOCK_SESSION,
        user: MOCK_USER,
        loading: false,
        signOut: async () => {},
        refreshSession: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
