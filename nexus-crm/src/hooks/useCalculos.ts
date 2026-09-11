import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCalculationInMemory,
  findCalculationCepInMemory,
  findCalculationInsuredInMemory,
  findCalculationVehicleInMemory,
  completeCalculationExecutionSimulationInMemory,
  getCalculationDuplicateInputInMemory,
  getCalculationExecutionSimulationDelayInMemory,
  getCalculationExecutionWorkspaceInMemory,
  getCalculationInMemory,
  markCalculationExecutionRunningInMemory,
  getCalculationSourcePolicyInMemory,
  listCalculationsInMemory,
  startCalculationExecutionsInMemory,
  startCalculationRecalculationInMemory,
} from '../lib/inMemoryDb'
import { supabase } from '../lib/supabase'
import type {
  CalculationAggregate,
  CalculationCreateInput,
  CalculationListItem,
} from '../modules/comercial/calculationDomain'
import type {
  CalculationExecutionSort,
  CalculationExecutionWorkspace,
  StartCalculationExecutionsInput,
  StartRecalculationInput,
} from '../modules/comercial/calculationExecutionDomain'
import type { Database } from '../types/database'

type SeguradoOption = Pick<Database['public']['Tables']['segurados']['Row'],
  'id' | 'nome' | 'cpf_cnpj' | 'filial_id' | 'tenant_id' | 'data_nascimento' | 'sexo' | 'estado_civil'
>
type SeguradoraRow = Pick<Database['public']['Tables']['seguradoras']['Row'], 'id' | 'nome' | 'tenant_id'>
type SeguradoraOption = Omit<SeguradoraRow, 'nome'> & { nome: string }
type CoverageRow = Database['public']['Tables']['coberturas_catalogo']['Row']
type CoverageOption = Omit<CoverageRow, 'nome'> & { nome: string }

export type CalculationEditorLookups = {
  insureds: SeguradoOption[]
  insurers: SeguradoraOption[]
  coverages: CoverageOption[]
}

const mockAssistanceDelay = () => new Promise<void>((resolve) => window.setTimeout(resolve, 240))
const mockExecutionDelay = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

export function useCalculations(opportunityId: string | undefined) {
  return useQuery({
    enabled: Boolean(opportunityId),
    queryKey: ['calculations', opportunityId],
    queryFn: async (): Promise<CalculationListItem[]> => listCalculationsInMemory(opportunityId as string),
  })
}

export function useCalculation(calculationId: string | undefined) {
  return useQuery({
    enabled: Boolean(calculationId),
    queryKey: ['calculation', calculationId],
    queryFn: async (): Promise<CalculationAggregate> => getCalculationInMemory(calculationId as string),
  })
}

export function useCalculationEditorLookups(
  tenantId: string | undefined,
  branchId: string | undefined,
  lineId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(tenantId && branchId && lineId),
    queryKey: ['calculation-editor-lookups', tenantId, branchId, lineId],
    queryFn: async (): Promise<CalculationEditorLookups> => {
      const [insuredResult, insurerResult, coverageResult] = await Promise.all([
        supabase.from('segurados').select('id, nome, cpf_cnpj, filial_id, tenant_id, data_nascimento, sexo, estado_civil').eq('tenant_id', tenantId as string).eq('filial_id', branchId as string).order('nome'),
        supabase.from('seguradoras').select('id, nome, tenant_id').eq('tenant_id', tenantId as string).eq('ativo', true).order('nome'),
        supabase.from('coberturas_catalogo').select('*').eq('ramo_id', lineId as string).eq('ativo', true).order('ordem'),
      ])
      if (insuredResult.error) throw insuredResult.error
      if (insurerResult.error) throw insurerResult.error
      if (coverageResult.error) throw coverageResult.error
      return {
        insureds: (insuredResult.data ?? []) as SeguradoOption[],
        insurers: ((insurerResult.data ?? []) as SeguradoraRow[]).map(row => ({ ...row, nome: row.nome ?? 'Seguradora sem nome' })),
        coverages: ((coverageResult.data ?? []) as CoverageRow[]).map(row => ({ ...row, nome: row.nome ?? 'Cobertura sem nome' })),
      }
    },
  })
}

export function useCalculationSourcePolicy(policyId: string | undefined) {
  return useQuery({
    enabled: Boolean(policyId),
    queryKey: ['calculation-source-policy', policyId],
    queryFn: async () => getCalculationSourcePolicyInMemory(policyId as string),
  })
}

export function useCalculationAssistance(branchId: string) {
  const insured = useMutation({
    mutationFn: async (document: string) => {
      await mockAssistanceDelay()
      return findCalculationInsuredInMemory(document, branchId)
    },
  })
  const vehicle = useMutation({
    mutationFn: async (identifier: string) => {
      await mockAssistanceDelay()
      return findCalculationVehicleInMemory(identifier)
    },
  })
  const cep = useMutation({
    mutationFn: async (value: string) => {
      await mockAssistanceDelay()
      return findCalculationCepInMemory(value)
    },
  })
  return { insured, vehicle, cep }
}

export function useCreateCalculation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CalculationCreateInput): Promise<CalculationAggregate> => createCalculationInMemory(input),
    onSuccess: (aggregate) => {
      void queryClient.invalidateQueries({ queryKey: ['calculations', aggregate.calculation.oportunidade_id] })
      void queryClient.invalidateQueries({ queryKey: ['calculation', aggregate.calculation.id] })
      void queryClient.invalidateQueries({ queryKey: ['oportunidade', aggregate.calculation.oportunidade_id] })
    },
  })
}

export function getCalculationDuplicateInput(calculationId: string): CalculationCreateInput {
  return getCalculationDuplicateInputInMemory(calculationId)
}

export function useCalculationExecutionWorkspace(calculationId: string | undefined, sort: CalculationExecutionSort) {
  return useQuery({
    enabled: Boolean(calculationId),
    queryKey: ['calculation-executions', calculationId, sort],
    queryFn: async (): Promise<CalculationExecutionWorkspace> => getCalculationExecutionWorkspaceInMemory(calculationId as string, sort),
  })
}

export function useStartCalculationExecutions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: StartCalculationExecutionsInput) => {
      const rows = startCalculationExecutionsInMemory(input)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['calculation-executions', input.calculationId] }),
        queryClient.invalidateQueries({ queryKey: ['calculation', input.calculationId] }),
      ])
      await Promise.all(rows.map(async (row, index) => {
        await mockExecutionDelay(120 + index * 45)
        markCalculationExecutionRunningInMemory(row.id)
        await queryClient.invalidateQueries({ queryKey: ['calculation-executions', input.calculationId] })
        await mockExecutionDelay(getCalculationExecutionSimulationDelayInMemory(row.id))
        completeCalculationExecutionSimulationInMemory(row.id)
        await queryClient.invalidateQueries({ queryKey: ['calculation-executions', input.calculationId] })
      }))
      return getCalculationExecutionWorkspaceInMemory(input.calculationId, 'RETORNO')
    },
  })
}

export function useRecalculateCalculationExecution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: StartRecalculationInput) => {
      const row = startCalculationRecalculationInMemory(input)
      await queryClient.invalidateQueries({ queryKey: ['calculation-executions', row.calculo_id] })
      await mockExecutionDelay(120)
      markCalculationExecutionRunningInMemory(row.id)
      await queryClient.invalidateQueries({ queryKey: ['calculation-executions', row.calculo_id] })
      await mockExecutionDelay(getCalculationExecutionSimulationDelayInMemory(row.id))
      completeCalculationExecutionSimulationInMemory(row.id)
      await queryClient.invalidateQueries({ queryKey: ['calculation-executions', row.calculo_id] })
      return getCalculationExecutionWorkspaceInMemory(row.calculo_id, 'RETORNO')
    },
  })
}
