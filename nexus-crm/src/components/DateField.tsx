import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { parseDateAny, toDisplayDateBr, toIsoDate } from '../utils/date'

type Props = {
  label?: string
  value: string
  onChange: (nextIso: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  inputClassName?: string
}

function formatMaskedDdMmYyyy(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '').slice(0, 8)
  const dd = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  const yyyy = digits.slice(4, 8)
  if (digits.length <= 2) return dd
  if (digits.length <= 4) return `${dd}-${mm}`
  return `${dd}-${mm}-${yyyy}`
}

function isCompleteDisplay(value: string): boolean {
  return /^\d{2}-\d{2}-\d{4}$/.test(value.trim())
}

export default function DateField({
  label,
  value,
  onChange,
  placeholder = 'dd-mm-aaaa',
  disabled,
  required,
  className,
  inputClassName,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const selectedDate = useMemo(() => parseDateAny(value), [value])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => (value ? toDisplayDateBr(value) : ''))
  const [month, setMonth] = useState<Date>(() => parseDateAny(value) ?? new Date())

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const days: Date[] = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })

    const arr: Date[] = []
    const d = new Date(start)
    while (d <= end) {
      arr.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return arr
  }, [month])

  const commitDraftIfValid = (nextDraft: string) => {
    const trimmed = nextDraft.trim()
    if (!trimmed) {
      onChange('')
      return
    }

    const iso = toIsoDate(trimmed)
    if (iso) onChange(iso)
  }

  const handleSelectDate = (d: Date) => {
    const iso = toIsoDate(d)
    onChange(iso)
    setDraft(toDisplayDateBr(d))
    setMonth(d)
    setOpen(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const displayValue =
    open
      ? draft
      : (isCompleteDisplay(draft) ? draft : (value ? toDisplayDateBr(value) : draft))

  return (
    <div ref={rootRef} className={className}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label} {required ? '*' : ''}
        </label>
      )}

      <div className="relative mt-1">
        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

        <input
          ref={inputRef}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
            setMonth(selectedDate ?? new Date())
          }}
          onChange={(e) => {
            const masked = formatMaskedDdMmYyyy(e.target.value)
            setDraft(masked)

            if (isCompleteDisplay(masked)) {
              commitDraftIfValid(masked)
            }
          }}
          onBlur={() => {
            // No blur, tenta consolidar somente se estiver completo (evita apagar parciais).
            if (isCompleteDisplay(draft)) commitDraftIfValid(draft)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (isCompleteDisplay(draft)) {
                commitDraftIfValid(draft)
                setOpen(false)
              }
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          className={[
            'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all',
            inputClassName ?? '',
          ].join(' ')}
        />

        {!!draft && !disabled && (
          <button
            type="button"
            onClick={() => {
              setDraft('')
              onChange('')
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 dark:hover:bg-slate-700/50 transition-all"
            title="Limpar data"
          >
            <X size={14} />
          </button>
        )}

        {open && !disabled && (
          <div className="absolute z-50 mt-2 w-[320px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-slate-900/10 p-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-1.5 pb-2">
              <button
                type="button"
                onClick={() => setMonth((m) => subMonths(m, 1))}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-200">
                {format(month, 'MMMM yyyy', { locale: ptBR })}
              </div>

              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                title="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 px-1.5 pb-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((w) => (
                <div key={w} className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-1.5 pb-1">
              {days.map((d) => {
                const inMonth = isSameMonth(d, month)
                const selected = selectedDate ? isSameDay(d, selectedDate) : false
                const today = isToday(d)

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => handleSelectDate(d)}
                    className={[
                      'h-9 rounded-xl text-sm font-black transition-all',
                      inMonth ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600',
                      selected
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70',
                      today && !selected ? 'ring-2 ring-primary/30' : '',
                    ].join(' ')}
                    aria-label={format(d, 'dd-MM-yyyy')}
                  >
                    {format(d, 'd')}
                  </button>
                )
              })}
            </div>

            <div className="pt-2 px-1.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelectDate(new Date())}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
              >
                Hoje
              </button>

              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {selectedDate ? toDisplayDateBr(selectedDate) : '—'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

