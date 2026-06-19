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

// Papéis definidos no banco de dados (app_role)
export type Role = 'admin' | 'vendedor' | 'visualizador';

export interface ModulePermission {
  module: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

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
  permissions: ModulePermission[];
}

export interface AuthState {
  session: Session | null;
  user: UserProfile | null;
  activeBranchId: string | null;
  loading: boolean;
}
