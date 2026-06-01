import { format, isValid, parse } from 'date-fns'

export type DateStatus = 'today' | 'overdue' | 'future'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}/
const BR_SLASH_RE = /^\d{2}\/\d{2}\/\d{4}$/
const BR_DASH_RE = /^\d{2}-\d{2}-\d{4}$/

function toMidnight(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function parseDateAny(value: unknown): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return isValid(value) ? toMidnight(value) : null
  }

  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw || raw === '-') return null

  // ISO datetime or ISO date prefix (yyyy-mm-ddTHH:mm:ss...)
  if (ISO_DATE_PREFIX_RE.test(raw)) {
    const datePart = raw.slice(0, 10)
    const d = new Date(`${datePart}T00:00:00`)
    return isValid(d) ? toMidnight(d) : null
  }

  if (BR_SLASH_RE.test(raw)) {
    const d = parse(raw, 'dd/MM/yyyy', new Date())
    return isValid(d) ? toMidnight(d) : null
  }

  if (BR_DASH_RE.test(raw)) {
    const d = parse(raw, 'dd-MM-yyyy', new Date())
    return isValid(d) ? toMidnight(d) : null
  }

  // Fallback (best effort)
  const d = new Date(raw)
  return isValid(d) ? toMidnight(d) : null
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE_RE.test(value.trim())
}

export function toIsoDate(value: unknown): string {
  if (isIsoDate(value)) return value.trim()
  const d = parseDateAny(value)
  return d ? format(d, 'yyyy-MM-dd') : ''
}

export function toDisplayDateBr(value: unknown): string {
  const d = parseDateAny(value)
  return d ? format(d, 'dd-MM-yyyy') : ''
}

export function startOfDayTs(value: unknown): number | null {
  const d = parseDateAny(value)
  return d ? d.getTime() : null
}

export function getDateStatus(value: unknown): DateStatus | null {
  const due = parseDateAny(value)
  if (!due) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueTs = due.getTime()
  const todayTs = today.getTime()

  if (dueTs === todayTs) return 'today'
  if (dueTs < todayTs) return 'overdue'
  return 'future'
}

/** Apresentação curta pt-BR: `dd/mm/aaaa`. Vazio → '—'. */
export function fmtDate(value: unknown): string {
  const d = parseDateAny(value)
  if (!d) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Apresentação data + hora pt-BR: `12 mai 2026 · 14:30`.
 * Usa o valor original (não normalizado à meia-noite) para preservar a hora.
 */
export function fmtDateTime(value: unknown): string {
  if (!value) return '—'
  const raw = typeof value === 'string' ? value.trim() : value
  const d = raw instanceof Date ? raw : new Date(raw as string)
  if (Number.isNaN(d.getTime())) return '—'
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

/** Dias (cheios) até a data informada. Negativo = no passado. Null se inválida. */
export function relativeDays(value: unknown): number | null {
  const d = parseDateAny(value)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export function isWithinRange(dateValue: unknown, startIso: unknown, endIso: unknown): boolean {
  const ts = startOfDayTs(dateValue)
  if (ts == null) return false

  const startTs = startIso ? (startOfDayTs(startIso) ?? null) : null
  const endTs = endIso ? (startOfDayTs(endIso) ?? null) : null

  if (startTs != null && ts < startTs) return false
  if (endTs != null && ts > endTs) return false
  return true
}

