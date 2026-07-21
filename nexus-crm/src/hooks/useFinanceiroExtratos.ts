import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import {
  confirmCommissionImport,
  processCommissionStatementFile,
  type CommissionImportPreview,
  type ProcessCommissionStatementCommand,
} from '../modules/financeiro/extratoImportDomain'
import { getFinanceiroExtratoDetail, listFinanceiroExtratos } from '../modules/financeiro/extratosDomain'

export function useFinanceiroExtratos(branchIds: readonly string[] | null) {
  return useQuery({
    queryKey: [...queryKeys.financeiroExtratos, branchIds ?? 'todas'],
    queryFn: async () => listFinanceiroExtratos(branchIds),
  })
}

export function useFinanceiroExtrato(id: string | null | undefined, branchIds: readonly string[] | null) {
  return useQuery({
    queryKey: [...queryKeys.financeiroExtrato(id), branchIds ?? 'todas'],
    queryFn: async () => id ? getFinanceiroExtratoDetail(id, branchIds) : null,
    enabled: Boolean(id),
  })
}

export function useProcessarDemonstrativoComissao() {
  return useMutation({
    mutationFn: async (command: ProcessCommissionStatementCommand) => processCommissionStatementFile(command),
  })
}

export function useConfirmarImportacaoComissao() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (preview: CommissionImportPreview) => confirmCommissionImport(preview),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.financeiroExtratos }),
        client.invalidateQueries({ queryKey: queryKeys.financeiroComissoes }),
      ])
    },
  })
}
