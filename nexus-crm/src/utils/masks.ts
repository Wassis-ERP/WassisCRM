/**
 * Máscaras de apresentação (CEP, telefone). Reusa `onlyDigits` de documento.ts.
 * O valor é sempre armazenado normalizado (só dígitos) — a máscara é só na UI.
 */
import { onlyDigits } from './documento'

export function formatCep(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export function formatTelefone(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function normalizeVehicleIdentifier(value: string | null | undefined): string {
  return (value ?? '').replace(/[^a-zA-Z0-9]+/g, '').toUpperCase().slice(0, 17)
}

export function formatPlate(value: string | null | undefined): string {
  const normalized = normalizeVehicleIdentifier(value).slice(0, 7)
  if (normalized.length <= 3) return normalized
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`
}

export function formatVehicleIdentifier(value: string | null | undefined): string {
  const normalized = normalizeVehicleIdentifier(value)
  return normalized.length <= 7 ? formatPlate(normalized) : normalized
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function parseCurrencyInput(value: string): number | null {
  const digits = onlyDigits(value)
  return digits ? Number(digits) / 100 : null
}
