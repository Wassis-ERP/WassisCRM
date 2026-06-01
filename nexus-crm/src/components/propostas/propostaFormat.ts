/* =========================================================================
 * Helpers de formatação compartilhados de proposta/apólice.
 * Usados pelo Painel (`PropostasPage`) e pela tabela reutilizável
 * (`PropostasListView`).
 * ========================================================================= */

/** Badge de status — sempre via tokens --signal-* / accent (nunca por ramo). */
export const STATUS_BADGE: Record<string, string> = {
  Vigente: 'bg-signal-success/15 text-signal-success',
  Renovada: 'bg-signal-success/15 text-signal-success',
  Endossada: 'bg-signal-success/15 text-signal-success',
  Cancelada: 'bg-signal-danger/15 text-signal-danger',
  Recusada: 'bg-signal-danger/15 text-signal-danger',
  'Não renovada': 'bg-bg-surface-3 text-fg-3',
  'Em Análise': 'bg-signal-warning/15 text-signal-warning',
  Pendente: 'bg-signal-warning/15 text-signal-warning',
  'Pendência Resolvida': 'bg-accent-primary-soft text-accent-primary',
  'Proposta Emitida': 'bg-accent-primary-soft text-accent-primary',
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('')
}

export function fmtDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}
