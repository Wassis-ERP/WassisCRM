import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import {
  confirmParcelaPayments,
  listFinanceiroParcelas,
  reverseParcelaPayments,
  type PaymentCommand,
} from '../modules/financeiro/parcelasDomain'

export function useFinanceiroParcelas(branchIds: readonly string[] | null) {
  return useQuery({
    queryKey: [...queryKeys.financeiroParcelas, ...(branchIds ?? ['all'])],
    queryFn: async () => listFinanceiroParcelas(branchIds),
  })
}

export function useConfirmarPagamentoParcela() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (command: PaymentCommand) => confirmParcelaPayments(command),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.financeiroParcelas })
      client.invalidateQueries({ queryKey: queryKeys.financeiroCobrancas })
      client.invalidateQueries({ queryKey: ['kanban_cards', 'financeiro'] })
    },
  })
}

export function useDesfazerPagamentoParcela() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => reverseParcelaPayments(ids),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.financeiroParcelas })
      client.invalidateQueries({ queryKey: queryKeys.financeiroCobrancas })
      client.invalidateQueries({ queryKey: ['kanban_cards', 'financeiro'] })
    },
  })
}
