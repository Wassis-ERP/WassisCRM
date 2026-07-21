import { AlertCircle, ArrowLeft, FileUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CommissionImportWizard from '../components/financeiro/CommissionImportWizard'
import { useAuth } from '../hooks/useAuth'
import { useFinanceiroComissoes } from '../hooks/useFinanceiroComissoes'
import { usePermission } from '../hooks/usePermission'

export default function ImportacaoDemonstrativoComissoesPage() {
  const navigate = useNavigate()
  const { user, activeBranchId } = useAuth()
  const { can } = usePermission('financeiro')
  const branchIds = activeBranchId ? [activeBranchId] : user?.branchIds ?? null
  const query = useFinanceiroComissoes(branchIds)
  const returnToCommissions = () => navigate('/financeiro?visao=comissoes')

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-fg-4">Financeiro &rsaquo; Comissões &rsaquo; Importação</p>
          <div className="mt-2 flex items-start gap-3">
            <div className="shrink-0 rounded-[6px] bg-accent-primary-soft p-2.5 text-accent-primary"><FileUp size={22} /></div>
            <div>
              <h1 className="text-3xl font-bold text-fg-1">Importar demonstrativo</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-fg-3">Valide o arquivo, revise as associações e confirme a conciliação em uma página dedicada. A baixa de comissão permanece separada e explícita.</p>
            </div>
          </div>
        </div>
        <Link to="/financeiro?visao=comissoes" className="inline-flex w-fit items-center gap-2 rounded-full border border-border-1 bg-bg-surface px-4 py-2 text-sm font-bold text-fg-2 hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"><ArrowLeft size={16} />Voltar para Comissões</Link>
      </header>

      {query.isLoading ? (
        <div className="space-y-4 rounded-[12px] border border-border-1 bg-bg-surface p-6"><div className="h-16 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-80 animate-pulse rounded-[8px] bg-bg-surface-2" /></div>
      ) : query.isError ? (
        <section className="rounded-[12px] border border-border-1 bg-bg-surface px-6 py-16 text-center">
          <AlertCircle className="mx-auto text-signal-danger" size={30} />
          <h2 className="mt-4 text-lg font-black text-fg-1">Não foi possível preparar a importação</h2>
          <p className="mt-2 text-sm text-fg-3">{query.error instanceof Error ? query.error.message : 'Tente novamente.'}</p>
          <button type="button" onClick={() => void query.refetch()} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Tentar novamente</button>
        </section>
      ) : (
        <CommissionImportWizard
          rows={query.data ?? []}
          canUpdate={can('update')}
          onCancel={returnToCommissions}
          onStartReceipt={(commissionIds) => {
            const params = new URLSearchParams({ visao: 'comissoes' })
            if (commissionIds.length > 0) params.set('baixa', commissionIds.join(','))
            navigate(`/financeiro?${params.toString()}`)
          }}
        />
      )}
    </div>
  )
}
