import { createContext, useContext } from 'react'

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: FeedbackTone
}

export interface NotifyOptions {
  title: string
  description?: string
  tone?: FeedbackTone
}

export interface FeedbackContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  notify: (options: NotifyOptions) => void
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null)

function useFeedbackContext() {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useConfirm deve ser utilizado dentro de um <ConfirmProvider>')
  return context
}

export function useConfirm() {
  return useFeedbackContext().confirm
}

export function useSystemFeedback() {
  return useFeedbackContext()
}
