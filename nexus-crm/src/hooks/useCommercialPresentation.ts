import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCommercialPresentationWorkspaceInMemory,
  saveCommercialPresentationInMemory,
  toggleCommercialPresentationQuoteInMemory,
} from '../lib/inMemoryDb'
import type {
  CommercialPresentationWorkspace,
  SaveCommercialPresentationInput,
} from '../modules/comercial/commercialPresentationDomain'

export function useCommercialPresentationWorkspace(opportunityId: string | undefined, presentationId?: string) {
  return useQuery({
    enabled: Boolean(opportunityId),
    queryKey: ['commercial-presentation', opportunityId, presentationId ?? 'latest'],
    queryFn: async (): Promise<CommercialPresentationWorkspace> => getCommercialPresentationWorkspaceInMemory(
      opportunityId as string,
      presentationId,
    ),
  })
}

export function useToggleCommercialPresentationQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { opportunityId: string; quoteId: string; createdById: string | null }) =>
      toggleCommercialPresentationQuoteInMemory(
        input.opportunityId,
        input.quoteId,
        input.createdById,
      ),
    onSuccess: (_workspace, input) => {
      void queryClient.invalidateQueries({ queryKey: ['commercial-presentation', input.opportunityId] })
    },
  })
}

export function useSaveCommercialPresentation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveCommercialPresentationInput) => saveCommercialPresentationInMemory(input),
    onSuccess: (_workspace, input) => {
      void queryClient.invalidateQueries({ queryKey: ['commercial-presentation', input.opportunityId] })
    },
  })
}
