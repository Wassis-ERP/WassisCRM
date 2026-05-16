import { parseDateAny } from './date'

/**
 * Calcula a idade em anos cheios a partir de uma data de nascimento.
 * Aceita ISO (yyyy-MM-dd), `dd/MM/yyyy`, `dd-MM-yyyy` ou `Date`.
 *
 * O PRD do cadastro de pessoa especifica que a idade é sempre calculada,
 * nunca armazenada.
 */
export function calcIdade(dataNascimento: unknown, today: Date = new Date()): number | null {
  const dob = parseDateAny(dataNascimento)
  if (!dob) return null

  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}
