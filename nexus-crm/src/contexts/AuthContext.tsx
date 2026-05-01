import { createContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthState, UserProfile, Role, ModulePermission } from '../types/auth';
import type { Session } from '../types/auth';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });

  /**
   * Busca completa dos dados do usuário (Perfil + Role + Permissões)
   */
  const fetchFullUserProfile = useCallback(async (session: Session | null): Promise<UserProfile | null> => {
    if (!session || !session.user) return null;

    const user = session.user;

    try {
      // 1. Buscar Perfil e Role em paralelo para performance
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_roles').select('role').eq('user_id', user.id).single()
      ]);

      const role: Role = (roleRes.data?.role as Role) || 'visualizador';

      // 2. Buscar Matriz de Permissões baseada no Role
      const { data: permissions } = await supabase
        .from('role_permissions')
        .select('module, can_read, can_create, can_update, can_delete')
        .eq('role', role);

      return {
        id: user.id,
        email: user.email || '',
        role: role,
        firstName: profileRes.data?.full_name?.split(' ')[0] || '',
        lastName: profileRes.data?.full_name?.split(' ').slice(1).join(' ') || '',
        fullName: profileRes.data?.full_name ?? undefined,
        avatarUrl: profileRes.data?.avatar_url,
        tenantId: (profileRes.data as { tenant_id?: string | null } | null)?.tenant_id ?? null,
        permissions: (permissions as ModulePermission[]) || [],
      };
    } catch (err) {
      console.error('[AuthContext] Erro ao carregar perfil completo:', err);
      // Fallback básico para não travar o app se houver erro no fetch de permissões
      return {
        id: user.id,
        email: user.email || '',
        role: 'visualizador',
        tenantId: null,
        permissions: [],
      };
    }
  }, []);

  /** Perfil minimo a partir do JWT para nao bloquear a UI em `fetchFullUserProfile` (rede/RLS lenta). */
  const bootstrapUserFromSession = useCallback((session: Session | null): UserProfile | null => {
    if (!session?.user) return null;
    const u = session.user;
    return {
      id: u.id,
      email: u.email ?? '',
      role: 'visualizador',
      tenantId: null,
      permissions: [],
    };
  }, []);

  /** Incrementado a cada mount do efeito; evita aplicar estado de execuções obsoletas sem deixar loading preso no Strict Mode. */
  const authEffectGen = useRef(0);

  useEffect(() => {
    const myGen = ++authEffectGen.current;

    const applyAuthState = (session: Session | null, fullUser: UserProfile | null) => {
      const cur = authEffectGen.current;
      if (cur !== myGen) {
        return;
      }
      setState({
        session,
        user: fullUser,
        loading: false,
      });
    };

    const finishLoadingOnly = () => {
      const cur = authEffectGen.current;
      if (cur !== myGen) {
        return;
      }
      setState((prev) => ({ ...prev, loading: false }));
    };

    const initAuth = async () => {
      // Nao forcar loading:true aqui: re-execucoes do efeito (Strict Mode) recolocavam a tela em Autenticando.

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const boot = bootstrapUserFromSession(session);
        applyAuthState(session, boot);

        const fullUser = await fetchFullUserProfile(session);
        if (authEffectGen.current !== myGen) return;
        setState((prev) => ({
          ...prev,
          session,
          user: fullUser ?? prev.user,
        }));
      } catch (err) {
        console.error('[AuthContext] initAuth falhou:', err);
        finishLoadingOnly();
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (authEffectGen.current !== myGen) return;

        const boot = bootstrapUserFromSession(session);
        applyAuthState(session, boot);

        try {
          const fullUser = await fetchFullUserProfile(session);
          if (authEffectGen.current !== myGen) return;
          setState((prev) => ({
            ...prev,
            session,
            user: fullUser ?? prev.user,
          }));
        } catch (err) {
          console.error('[AuthContext] onAuthStateChange falhou:', err);
          finishLoadingOnly();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      authEffectGen.current += 1;
    };
  }, [fetchFullUserProfile, bootstrapUserFromSession]);

  const signOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthProvider] Erro ao sair', err);
    }
    // Estado será limpo pelo listener onAuthStateChange
  };

  const refreshSession = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const { data: { session } } = await supabase.auth.refreshSession();
    const fullUser = await fetchFullUserProfile(session);
    setState({
      session,
      user: fullUser,
      loading: false,
    });
  };

  if (state.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>
        <p>Autenticando...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
