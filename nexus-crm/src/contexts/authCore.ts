import { createContext } from 'react';
import type { AuthState } from '../types/auth';

export interface AuthContextType extends AuthState {
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setActiveBranchId: (branchId: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
