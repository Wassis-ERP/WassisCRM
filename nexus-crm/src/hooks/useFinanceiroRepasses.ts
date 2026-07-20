import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import {
  cancelRepasseReceipt,
  issueRepasseReceipts,
  listFinanceiroRepasses,
  type CancelarRepasseReciboCommand,
  type EmitirRepasseRecibosCommand,
} from '../modules/financeiro/repasseDomain'

export function useFinanceiroRepasses(branchIds: readonly string[] | null) {
  return useQuery({
    queryKey: [...queryKeys.financeiroRepasses, ...(branchIds ?? ['all'])],
    queryFn: async () => listFinanceiroRepasses(branchIds),
  })
}

export function useEmitirRepasseRecibos() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (command: EmitirRepasseRecibosCommand) => issueRepasseReceipts(command),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.financeiroRepasses }),
        client.invalidateQueries({ queryKey: queryKeys.financeiroComissoes }),
      ])
    },
  })
}

export function useCancelarRepasseRecibo() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (command: CancelarRepasseReciboCommand) => cancelRepasseReceipt(command),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.financeiroRepasses }),
        client.invalidateQueries({ queryKey: queryKeys.financeiroComissoes }),
      ])
    },
  })
}
