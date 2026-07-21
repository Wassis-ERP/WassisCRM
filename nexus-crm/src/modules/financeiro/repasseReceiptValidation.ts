export function canSubmitRepasseReceipt(confirmed: boolean, dataPagamento: string, isSaving: boolean): boolean {
  return confirmed && Boolean(dataPagamento) && !isSaving
}
