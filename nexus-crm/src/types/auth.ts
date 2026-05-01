import type { Session } from '@supabase/supabase-js';

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
  permissions: ModulePermission[];
}

export interface AuthState {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
}
