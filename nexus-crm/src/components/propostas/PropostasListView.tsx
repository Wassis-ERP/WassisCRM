import { ChevronDown, ChevronRight, Edit } from 'lucide-react'
import type { Proposal } from '../../types/proposta'
import { STATUS_BADGE, initials, fmtDate } from './propostaFormat'

/* =========================================================================
 * Tabela de propostas/apólices reutilizável.
 * Usada no Painel (`PropostasPage`) e na aba "Apólices" do segurado.
 * ========================================================================= */

export function PropostasListView({
  proposals,
  expanded,
  onToggleExpand,
  emptyMessage = 'Nenhuma proposta encontrada com os filtros atuais.',
}: {
  proposals: Proposal[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  emptyMessage?: string
}) {
  if (proposals.length === 0) {
    return <div className="p-12 text-center text-sm text-fg-4">{emptyMessage}</div>
  }

  return (
    <div className="overflow-x-auto">
      {/* Cabeçalho */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-fg-4 border-b border-border-1">
        <div className="col-span-3">Segurado</div>
        <div className="col-span-2">Ramo</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Produtor</div>
        <div className="col-span-2">Seguradora</div>
        <div className="col-span-1 text-right">Ações</div>
      </div>
      {proposals.map(p => {
        const isOpen = expanded.has(p.id)
        const effectiveStatus = p.currentStatus ?? p.status
        return (
          <div key={p.id} className="border-b border-border-1 last:border-b-0">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm hover:bg-bg-surface-2">
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleExpand(p.id)}
                    className="text-fg-4 hover:text-fg-2"
                    aria-label="Expandir"
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div>
                    <a className="font-semibold text-fg-1 hover:text-accent-primary cursor-pointer">
                      {p.insured}
                    </a>
                    <p className="text-xs text-fg-4">
                      {p.vigenciaInicial && p.vigenciaFinal
                        ? `Vigência: ${fmtDate(p.vigenciaInicial)} → ${fmtDate(p.vigenciaFinal)}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span-2 text-fg-2">{p.branch}</div>
              <div className="col-span-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-fg-3">{p.proposalType}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit ${
                      STATUS_BADGE[effectiveStatus] ?? 'bg-bg-surface-3 text-fg-3'
                    }`}
                  >
                    {effectiveStatus}
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent-primary-soft text-accent-primary text-xs font-bold flex items-center justify-center">
                  {initials(p.producer.name)}
                </div>
                <span className="text-fg-2 text-sm truncate">{p.producer.name}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-bg-surface-2 text-fg-3 text-[10px] font-bold flex items-center justify-center">
                  {initials(p.insurer)}
                </div>
                <span className="text-fg-2 text-sm truncate">{p.insurer}</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => alert(`Abrir ProposalDetails: ${p.id}`)}
                  className="p-1.5 rounded-[10px] hover:bg-bg-surface-2 text-fg-3"
                  aria-label="Editar"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="px-12 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-fg-2">
                <Detail label="Modelo" value={p.details?.model} />
                <Detail label="Marca" value={p.details?.brand} />
                <Detail label="Ano" value={p.details?.year} />
                <Detail label="Placa" value={p.details?.plate} />
                <Detail label="Chassi" value={p.details?.chassis} />
                <Detail label="Apólice" value={p.policyNumber} />
                <Detail label="Vigência Inicial" value={p.vigenciaInicial && fmtDate(p.vigenciaInicial)} />
                <Detail label="Vigência Final" value={p.vigenciaFinal && fmtDate(p.vigenciaFinal)} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-fg-4 tracking-wider">{label}</p>
      <p>{value || '—'}</p>
    </div>
  )
}
