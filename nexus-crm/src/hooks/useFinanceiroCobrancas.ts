import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import {
  closeFinanceiroCobranca,
  createFinanceiroCobranca,
  getFinanceiroCobranca,
  listCobrancaResponsaveis,
  listFinanceiroCobrancas,
  listParcelasElegiveisCobranca,
  maintainFinanceiroCobranca,
  reopenFinanceiroCobranca,
  type CobrancaMaintenanceInput,
  type CreateCobrancaInput,
} from '../modules/financeiro/cobrancasDomain'
import type { CobrancaStatus } from '../types/database'

function invalidateCobrancas(client: ReturnType<typeof useQueryClient>, id?: string) {
  client.invalidateQueries({ queryKey: queryKeys.financeiroCobrancas })
  client.invalidateQueries({ queryKey: ['kanban_cards', 'financeiro'] })
  client.invalidateQueries({ queryKey: queryKeys.financeiroParcelas })
  if (id) {
    client.invalidateQueries({ queryKey: queryKeys.financeiroCobranca(id) })
    client.invalidateQueries({ queryKey: queryKeys.entityTabs('cobranca', id) })
  }
}

export function useFinanceiroCobrancas(branchIds: readonly string[] | null) {
  return useQuery({
    queryKey: [...queryKeys.financeiroCobrancas, ...(branchIds ?? ['all'])],
    queryFn: async () => listFinanceiroCobrancas(branchIds),
  })
}

export function useParcelasElegiveisCobranca(branchIds: readonly string[] | null) {
  return useQuery({
    queryKey: [...queryKeys.financeiroCobrancas, 'elegiveis', ...(branchIds ?? ['all'])],
    queryFn: async () => listParcelasElegiveisCobranca(branchIds),
  })
}

export function useCobranca(id: string | undefined, branchIds: readonly string[] | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.financeiroCobranca(id),
    queryFn: async () => id ? getFinanceiroCobranca(id, branchIds) : null,
  })
}

export function useCobrancaResponsaveis() {
  return useQuery({
    queryKey: [...queryKeys.financeiroCobrancas, 'responsaveis'],
    queryFn: async () => listCobrancaResponsaveis(),
  })
}

export function useCreateCobranca(branchIds: readonly string[] | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCobrancaInput) => createFinanceiroCobranca(input, branchIds),
    onSuccess: (row) => invalidateCobrancas(client, row.id),
  })
}

export function useMaintainCobranca() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: CobrancaMaintenanceInput) => maintainFinanceiroCobranca(input),
    onSuccess: (result) => invalidateCobrancas(client, result.row.id),
  })
}

export function useCloseCobranca() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; status: Exclude<CobrancaStatus, 'ATIVA'>; reason?: string }) =>
      closeFinanceiroCobranca(input.id, input.status, input.reason),
    onSuccess: (result) => invalidateCobrancas(client, result.row.id),
  })
}

export function useReopenCobranca() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => reopenFinanceiroCobranca(id),
    onSuccess: (result) => invalidateCobrancas(client, result.row.id),
  })
}
