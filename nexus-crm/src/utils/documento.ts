/**
 * Utilitários de CPF/CNPJ — formatação, sanitização e validação (algoritmo
 * de dígitos verificadores).
 */

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D+/g, '')
}

export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

export function formatCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

export function formatDocumento(value: string, tipo: 'PF' | 'PJ'): string {
  return tipo === 'PF' ? formatCpf(value) : formatCnpj(value)
}

/**
 * Formata por tamanho: até 11 dígitos -> CPF; acima -> CNPJ. Para documentos
 * PF/PJ ambíguos (ex.: a corretora pode ser pessoa física — contrato v1.1).
 */
export function formatCpfCnpj(value: string): string {
  return onlyDigits(value).length <= 11 ? formatCpf(value) : formatCnpj(value)
}

function calcCpfDigit(digits: string, length: number): number {
  let sum = 0
  for (let i = 0; i < length; i++) {
    sum += Number(digits.charAt(i)) * (length + 1 - i)
  }
  const mod = (sum * 10) % 11
  return mod === 10 ? 0 : mod
}

export function isValidCpf(value: string | null | undefined): boolean {
  const d = onlyDigits(value)
  if (d.length !== 11) return false
  if (/^(\d)\1+$/.test(d)) return false
  const dig1 = calcCpfDigit(d, 9)
  const dig2 = calcCpfDigit(d, 10)
  return dig1 === Number(d.charAt(9)) && dig2 === Number(d.charAt(10))
}

function calcCnpjDigit(digits: string, weights: number[]): number {
  let sum = 0
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits.charAt(i)) * weights[i]
  }
  const mod = sum % 11
  return mod < 2 ? 0 : 11 - mod
}

export function isValidCnpj(value: string | null | undefined): boolean {
  const d = onlyDigits(value)
  if (d.length !== 14) return false
  if (/^(\d)\1+$/.test(d)) return false
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const dig1 = calcCnpjDigit(d, weights1)
  const dig2 = calcCnpjDigit(d, weights2)
  return dig1 === Number(d.charAt(12)) && dig2 === Number(d.charAt(13))
}

export function isValidDocumento(value: string | null | undefined, tipo: 'PF' | 'PJ'): boolean {
  return tipo === 'PF' ? isValidCpf(value) : isValidCnpj(value)
}
