import { ArrowLeft, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import ImportacaoDocumentosWizard from '../components/propostas/importacao/ImportacaoDocumentosWizard'
import { usePropostas } from '../contexts/usePropostas'

export default function ImportacaoDocumentosPage() {
  const { refreshProposals } = usePropostas()

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-fg-4">Negócios &rsaquo; Propostas e Apólices &rsaquo; Importação</p>
          <div className="mt-2 flex items-start gap-3">
            <div className="rounded-[6px] bg-accent-primary-soft p-2.5 text-accent-primary">
              <UploadCloud size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-fg-1">Importar documentos</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-fg-3">
                Revise propostas, apólices e endossos em um fluxo persistente. A página permanece disponível até a conferência final de todos os arquivos.
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/propostas"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border-1 bg-bg-surface px-4 py-2 text-sm font-bold text-fg-2 hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
        >
          <ArrowLeft size={16} />
          Voltar ao Painel
        </Link>
      </header>

      <ImportacaoDocumentosWizard onImported={refreshProposals} />
    </div>
  )
}
