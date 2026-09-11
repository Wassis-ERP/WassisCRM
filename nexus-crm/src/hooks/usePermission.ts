import { useQuery } from '@tanstack/react-query'
import { getTable } from '../lib/inMemoryDb'
import { queryKeys } from '../lib/queryClient'
import { useAuth } from './useAuth'
import { activeProfileLinks } from '../modules/plataforma/platformCommands'
import { allowsPermission, type PermissionAction, type PermissionContext } from '../modules/plataforma/platformDomain'
import type { ProfileRow, RolePermissionRow } from '../types/platformRows'

/** Simulação de gating da UI. Enforcement definitivo e isolamento pertencem ao backend. */
export const usePermission = (moduleName: string, defaultContext?: PermissionContext) => {
  const { user, activeBranchId } = useAuth()
  const { data } = useQuery({
    queryKey: [...queryKeys.permissions, 'effective', user?.id, activeBranchId],
    queryFn: () => ({
      profile: getTable('profiles').filter(p => p.id === user?.id).map(p => ({ ...p }))[0] as ProfileRow | undefined,
      links: user ? activeProfileLinks(user.id).map(v => ({ ...v })) : [],
      permissions: getTable('role_permissions').map(p => ({ ...p })) as RolePermissionRow[],
    }),
    refetchInterval: 60_000,
  })
  const can = (action: PermissionAction, context = defaultContext): boolean => allowsPermission({
    profile: data?.profile, links: data?.links ?? [], permissions: data?.permissions ?? [],
    activeBranchId, module: moduleName, action, context,
  })
  return { can }
}
