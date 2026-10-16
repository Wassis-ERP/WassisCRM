import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { usesBackendDomainData } from '../lib/backendDomainApi'
import { readBackendCalculationEditorData } from '../lib/backendCalculationEditorData'

export function useCanonicalCalculationEditorData(opportunityId: string | undefined, insuranceBranchId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['calculation-editor-data', opportunityId, insuranceBranchId, 'backend', user?.id, user?.tenantId, user?.branchId],
    enabled: Boolean(usesBackendDomainData && opportunityId && user?.id && user.tenantId && user.branchId),
    queryFn: ({ signal }) => readBackendCalculationEditorData(opportunityId as string, insuranceBranchId, signal),
  })
}
