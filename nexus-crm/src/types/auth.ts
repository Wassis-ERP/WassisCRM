export interface Session {
  access_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    created_at?: string;
    app_metadata?: Record<string, unknown>;
  } | null;
}

// Papel de IDENTIDADE do provedor de auth (WAssisBE). NÃO é mais a fonte de
// permissão de NEGÓCIO — esta vem do PERFIL por corretora (D18, profile_filiais).
export type Role = 'admin' | 'vendedor' | 'visualizador';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  tenantId: string | null;
  brokerageId?: string | null;
  branchId?: string | null;
  branchIds?: string[];
  hasAllBranchesAccess?: boolean;
}

export interface AuthState {
  session: Session | null;
  user: UserProfile | null;
  activeBranchId: string | null;
  loading: boolean;
}
