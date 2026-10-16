import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { usesBackendDomainData } from '../lib/backendDomainApi'
import { readBackendCommercialPresentationWorkspace } from '../lib/backendCommercialPresentationData'

/** Returns the revision loaded by the editor; save commands must carry that exact token. */
export function useCanonicalCommercialPresentation(opportunityId: string | undefined, presentationId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['commercial-presentation', opportunityId, presentationId ?? 'latest', 'backend', user?.id, user?.tenantId, user?.branchId],
    enabled: Boolean(usesBackendDomainData && opportunityId && user?.id && user.tenantId && user.branchId),
    queryFn: ({ signal }) => readBackendCommercialPresentationWorkspace(opportunityId as string, presentationId, signal),
  })
}
