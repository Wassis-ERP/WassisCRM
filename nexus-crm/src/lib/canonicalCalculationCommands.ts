import {
  cancelBackendManualExecution, createBackendCalculation, createBackendManualExecution,
  getBackendCalculation, getBackendCalculationExecution, recordBackendManualQuote,
  retryBackendManualExecution, saveBackendPresentation, type ManualQuoteHttpInput,
} from './backendCalculationApi'
import { createRetryableBackendWrite } from './retryableBackendWrite'
import type { SaveCommercialPresentationInput } from '../modules/comercial/commercialPresentationDomain'

export type CreateManualExecutionCommand = { calculationId: string; insurerId: string; commissionOverridePct: number | null }
export type RetryManualExecutionCommand = { executionId: string; commissionOverridePct: number | null }
export type CancelManualExecutionCommand = { executionId: string }
export type RecordManualQuoteCommand = { opportunityId: string; calculationId: string; executionId: string; quote: ManualQuoteHttpInput }
export type SaveCanonicalPresentationCommand = { input: SaveCommercialPresentationInput; expectedRevision?: number }
const sameId = (left: string, right: string) => left.toLowerCase() === right.toLowerCase()

async function recordManualQuote(command: RecordManualQuoteCommand, key: string) {
  const execution = await getBackendCalculationExecution(command.executionId)
  if (!sameId(execution.calculo_id, command.calculationId) || execution.motor !== 'MANUAL') throw new Error('A tentativa manual não pertence ao pedido aberto.')
  const calculation = await getBackendCalculation(command.calculationId)
  if (!sameId(calculation.calculation.oportunidade_id, command.opportunityId)) throw new Error('O pedido não pertence à oportunidade aberta.')
  // A completed attempt can be an acknowledged server write whose response was lost. The receipt decides replay/conflict.
  return recordBackendManualQuote(command.executionId, command.quote, key)
}

/** One independent write session per command; callers retain it across renders/retries. */
export function createCanonicalCalculationCommandSession() {
  return {
    createCalculation: createRetryableBackendWrite(createBackendCalculation),
    createManualExecution: createRetryableBackendWrite((command: CreateManualExecutionCommand, key) =>
      createBackendManualExecution(command.calculationId, command.insurerId, key, command.commissionOverridePct)),
    retryManualExecution: createRetryableBackendWrite((command: RetryManualExecutionCommand, key) =>
      retryBackendManualExecution(command.executionId, key, command.commissionOverridePct)),
    cancelManualExecution: createRetryableBackendWrite((command: CancelManualExecutionCommand, key) => cancelBackendManualExecution(command.executionId, key)),
    recordManualQuote: createRetryableBackendWrite(recordManualQuote),
    savePresentation: createRetryableBackendWrite((command: SaveCanonicalPresentationCommand, key) =>
      saveBackendPresentation(command.input, key, command.expectedRevision)),
  }
}
