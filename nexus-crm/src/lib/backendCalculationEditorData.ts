import { getBackendCalculationContext, listBackendCalculationCoverages, listBackendCalculationInsurers } from './backendCalculationApi'
import { readCalculationPages } from './backendCalculationReads'

/** Calendar/source policy and selectable catalogs. Person search retains the Segurados module permission. */
export async function readBackendCalculationEditorData(opportunityId: string, insuranceBranchId?: string, signal?: AbortSignal) {
  const context = await getBackendCalculationContext(opportunityId, insuranceBranchId, signal)
  const line = context.insuranceBranchId
  const [insurers, coverages] = await Promise.all([
    readCalculationPages(options => listBackendCalculationInsurers(opportunityId, options), row => row.id, signal),
    line ? readCalculationPages(options => listBackendCalculationCoverages(opportunityId, line, options), row => row.id, signal) : [],
  ])
  return { context, insurers, coverages }
}
