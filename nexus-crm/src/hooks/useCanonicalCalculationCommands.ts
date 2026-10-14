import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { usesBackendDomainData } from '../lib/backendDomainApi'
import {
  createCanonicalCalculationCommandSession, type CancelManualExecutionCommand, type CreateManualExecutionCommand,
  type RecordManualQuoteCommand, type RetryManualExecutionCommand, type SaveCanonicalPresentationCommand,
} from '../lib/canonicalCalculationCommands'
import type { CalculationCreateInput } from '../modules/comercial/calculationDomain'
import type { CalculoExecucaoRow } from '../types/database'

/** Data-only commands for the connected UI; no demo/provider simulation is performed here. */
export function useCanonicalCalculationCommands() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [session] = useState(createCanonicalCalculationCommandSession)
  const mutationKey = (operation: string) => ['canonical-calculation-command', operation, user?.id, user?.tenantId, user?.branchId]
  function scope() {
    if (!usesBackendDomainData || !user?.id || !user.tenantId || !user.branchId) throw new Error('Conecte a sessão e selecione uma corretora antes de gravar.')
    return JSON.stringify([user.id, user.tenantId, user.branchId])
  }
  function invalidateExecution(execution: CalculoExecucaoRow) {
    void queryClient.invalidateQueries({ queryKey: ['calculation-executions', execution.calculo_id] })
  }
  const createCalculation = useMutation({
    mutationKey: mutationKey('create'),
    mutationFn: (input: CalculationCreateInput) => session.createCalculation(input, scope()),
    onSuccess: aggregate => {
      void queryClient.invalidateQueries({ queryKey: ['calculations', aggregate.calculation.oportunidade_id] })
      void queryClient.invalidateQueries({ queryKey: ['calculation', aggregate.calculation.id] })
      void queryClient.invalidateQueries({ queryKey: ['oportunidade', aggregate.calculation.oportunidade_id] })
    },
  })
  const createManualExecution = useMutation({ mutationKey: mutationKey('manual'), mutationFn: (input: CreateManualExecutionCommand) => session.createManualExecution(input, scope()), onSuccess: invalidateExecution })
  const retryManualExecution = useMutation({ mutationKey: mutationKey('retry'), mutationFn: (input: RetryManualExecutionCommand) => session.retryManualExecution(input, scope()), onSuccess: invalidateExecution })
  const cancelManualExecution = useMutation({ mutationKey: mutationKey('cancel'), mutationFn: (input: CancelManualExecutionCommand) => session.cancelManualExecution(input, scope()), onSuccess: invalidateExecution })
  const recordManualQuote = useMutation({
    mutationKey: mutationKey('quote'),
    mutationFn: (input: RecordManualQuoteCommand) => session.recordManualQuote(input, scope()),
    onSuccess: (result, input) => {
      invalidateExecution(result.execution)
      void queryClient.invalidateQueries({ queryKey: ['commercial-presentation', input.opportunityId] })
    },
  })
  const savePresentation = useMutation({
    mutationKey: mutationKey('presentation'),
    mutationFn: (input: SaveCanonicalPresentationCommand) => session.savePresentation(input, scope()),
    onSuccess: result => { void queryClient.invalidateQueries({ queryKey: ['commercial-presentation', result.presentation.oportunidade_id] }) },
  })
  return { createCalculation, createManualExecution, retryManualExecution, cancelManualExecution, recordManualQuote, savePresentation }
}
