import { useAuth } from './useAuth';

/**
 * Hook para verificação granular de permissões por módulo e ação.
 * Uso: const { can } = usePermission('comercial');
 */
export const usePermission = (moduleName: string) => {
  const { user } = useAuth();

  /**
   * Verifica se o usuário tem permissão para uma ação específica no módulo.
   * @param action 'read' | 'create' | 'update' | 'delete'
   */
  const can = (action: 'read' | 'create' | 'update' | 'delete') => {
    if (!user) return false;
    
    // Admin tem passe livre em tudo
    if (user.role === 'admin') return true;

    const modulePerm = user.permissions.find(p => p.module === moduleName);
    
    if (!modulePerm) return false;

    // Mapeamento dinâmico baseado na chave da ação
    const permissionKey = `can_${action}` as keyof typeof modulePerm;
    return !!modulePerm[permissionKey];
  };

  return { can };
};
