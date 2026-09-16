import { getBackendEffectivePermissions } from '../lib/backendApi'
import { useQuery } from '@tanstack/react-query'
import { usesBackendData } from '../lib/dataMode'
import { getTable } from '../lib/inMemoryDb'
import { queryKeys } from '../lib/queryClient'
import { useAuth } from './useAuth'
import { activeProfileLinks } from '../modules/plataforma/platformCommands'
import { allowsPermission, type PermissionAction, type PermissionContext } from '../modules/plataforma/platformDomain'
import type { ProfileRow, RolePermissionRow } from '../types/platformRows'

/** Simulação de gating da UI. Enforcement definitivo e isolamento pertencem ao backend. */
export const usePermission = (moduleName: string, defaultContext?: PermissionContext) => {
  const { user, activeBranchId } = useAuth()
  const userId = user?.id
  const { data } = useQuery({
    enabled: !!user,
    queryKey: [...queryKeys.permissions, 'effective', user?.id, activeBranchId],
    queryFn: async () => usesBackendData
      ? { effective: await getBackendEffectivePermissions(activeBranchId) }
      : {
          profile: getTable('profiles').filter(p => p.id === user?.id).map(p => ({ ...p }))[0] as ProfileRow | undefined,
          links: user ? activeProfileLinks(user.id).map(v => ({ ...v })) : [],
          permissions: getTable('role_permissions').map(p => ({ ...p })) as RolePermissionRow[],
        },
    refetchInterval: 60_000,
  })
  const actionField: Record<PermissionAction, 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' | 'canExport' | 'canManage'> = {
    read: 'canRead', create: 'canCreate', update: 'canUpdate', delete: 'canDelete', export: 'canExport', manage: 'canManage',
  }
  const effectivePermissions = data && 'effective' in data ? data.effective ?? [] : []
  const can = (action: PermissionAction, context = defaultContext): boolean => usesBackendData
    ? !!user && !!activeBranchId && effectivePermissions.some(permission =>
        permission.branchId === activeBranchId
        && permission.module === moduleName
        && permission[actionField[action]] === true
        && (permission.scope !== 'PROPRIO'
          || action === 'create'
          || !context
          || (userId !== undefined && context.responsibleProfileIds?.includes(userId) === true)))
    : allowsPermission({
    profile: data?.profile, links: data?.links ?? [], permissions: data?.permissions ?? [],
    activeBranchId, module: moduleName, action, context,
  })
  return { can }
}
