import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import {
  listFinanceiroComissoes,
  registerManualCommissionReceipt,
  reverseCommissionReceipt,
  type BaixaManualCommand,
  type EstornoComissaoCommand,
} from '../modules/financeiro/comissoesDomain'

export function useFinanceiroComissoes(branchIds: readonly string[] | null) {
  return useQuery({
    queryKey: [...queryKeys.financeiroComissoes, ...(branchIds ?? ['all'])],
    queryFn: async () => listFinanceiroComissoes(branchIds),
  })
}
export function useRegistrarBaixaManualComissao() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (command: BaixaManualCommand) => registerManualCommissionReceipt(command),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.financeiroComissoes })
    },
  })
}

export function useEstornarBaixaComissao() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (command: EstornoComissaoCommand) => reverseCommissionReceipt(command),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: queryKeys.financeiroComissoes })
    },
  })
}
