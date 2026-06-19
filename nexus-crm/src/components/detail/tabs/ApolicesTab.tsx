import { useMemo, useState } from 'react'
import { usePropostas } from '../../../contexts/usePropostas'
import { PropostasListView } from '../../propostas/PropostasListView'

/**
 * Aba "Apólices" do segurado: o histórico completo de propostas/apólices
 * vinculadas a este segurado (`seguradoId`), com o mesmo layout da tabela do
 * Painel (`PropostasListView`). A fonte é o store frontend compartilhado, então
 * qualquer item criado no Painel para este segurado aparece aqui.
 */
export default function ApolicesTab({ seguradoId }: { seguradoId: string }) {
  const { proposals } = usePropostas()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const doSegurado = useMemo(
    () => proposals.filter((p) => p.seguradoId === seguradoId),
    [proposals, seguradoId],
  )

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="bg-bg-surface border border-border-1 rounded-[8px] shadow-[var(--shadow-1)]">
      <div className="flex items-center justify-between p-4 border-b border-border-1">
        <h2 className="text-lg font-bold">Apólices &amp; propostas</h2>
        {doSegurado.length > 0 && (
          <span className="text-xs font-semibold text-fg-4">{doSegurado.length} registro(s)</span>
        )}
      </div>
      <PropostasListView
        proposals={doSegurado}
        expanded={expanded}
        onToggleExpand={toggleExpand}
        emptyMessage="Nenhuma apólice ou proposta vinculada a este segurado."
      />
    </div>
  )
}
