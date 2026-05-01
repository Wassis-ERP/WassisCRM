import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PrivateRouteProps {
  children: ReactElement;
  requiredRole?: 'admin' | 'corretor';
}

/**
 * Rota Protegida guardiã. Envolve os componentes que não podem ser abertos deslogados.
 */
export const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Esqueleto limpo ou spinner enquanto verificamos a sessão
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
        <div className="flex space-x-2 animate-pulse">
          <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
          <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
          <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
        </div>
        <p className="mt-4 text-sm font-medium tracking-wide">Autenticando...</p>
      </div>
    );
  }

  // Barreira Principal: Usuário não logado é kickado pro /login, registrando sua intenção
  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Barreira Secundária: RBAC roles
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    // Se precisar de algo específico mas o usuário não for nem admin nem tiver a permissão
    // Joga pra tela central
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
