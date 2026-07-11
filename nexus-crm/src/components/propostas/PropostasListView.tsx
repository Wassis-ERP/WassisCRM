import {
  ChevronDown,
  ChevronRight,
  FileClock,
  Files,
  FoldVertical,
  ArrowUpRight,
  UnfoldVertical,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Proposal } from '../../types/proposta'
import {
  buildPolicyTree,
  getDocumentFinancialEffect,
  getDocumentNumber,
  getDocumentSummary,
  getMovementLabel,
  getCurrentPolicyDocument,
  getPolicyExpansionIds,
  type DocumentTreeRow,
  type PolicyTreeRow,
} from './propostaSelectors'
import {
  STATUS_BADGE,
  fmtCompetence,
  fmtDate,
  fmtMoney,
  initials,
} from './propostaFormat'

export type PropostasListMode = 'tree' | 'documents'

interface PropostasListViewProps {
  proposals: Proposal[]
  allProposals?: Proposal[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  onSetExpanded: (ids: string[], open: boolean) => void
  emptyMessage?: string
  mode?: PropostasListMode
}

/**
 * Lista reutilizavel do Painel e da aba do segurado.
 * `tree` compoe contrato -> documentos; `documents` preserva a fila plana que
 * acompanha o Kanban de propostas em andamento.
 */
export function PropostasListView({
  proposals,
  allProposals = proposals,
  expanded,
  onToggleExpand,
  onSetExpanded,
  emptyMessage = 'Nenhuma proposta encontrada com os filtros atuais.',
  mode = 'tree',
}: PropostasListViewProps) {
  if (proposals.length === 0) {
    return <div className="p-12 text-center text-sm text-fg-4">{emptyMessage}</div>
  }

  if (mode === 'documents') {
    const documents = proposals.filter((record) => record.entityType === 'proposta')
    if (documents.length === 0) {
      return <div className="p-12 text-center text-sm text-fg-4">{emptyMessage}</div>
    }

    return (
      <DocumentList
        documents={documents}
        expanded={expanded}
        onToggleExpand={onToggleExpand}
        flat
      />
    )
  }

  const policies = buildPolicyTree(proposals, allProposals)
  if (policies.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-fg-4">
        Nenhuma apólice encontrada. Documentos sem contrato não são agrupados automaticamente.
      </div>
    )
  }

  return (
    <div>
      <TableHeader firstColumn="APÓLICE / SEGURADO" />
      {policies.map((row) => (
        <PolicyRow
          key={row.policy.id}
          row={row}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          onSetExpanded={onSetExpanded}
        />
      ))}
    </div>
  )
}

function TableHeader({ firstColumn }: { firstColumn: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 border-b border-border-1 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-fg-4">
      <div className="col-span-3">{firstColumn}</div>
      <div className="col-span-2">Ramo</div>
      <div className="col-span-3">Status</div>
      <div className="col-span-1">Produtor</div>
      <div className="col-span-2">Seguradora</div>
      <div className="col-span-1 text-right">Ações</div>
    </div>
  )
}

function PolicyRow({
  row,
  expanded,
  onToggleExpand,
  onSetExpanded,
}: {
  row: PolicyTreeRow
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  onSetExpanded: (ids: string[], open: boolean) => void
}) {
  const { policy, operationalStatus, documents, regularDocuments, invoices } = row
  const isOpen = expanded.has(policy.id)
  const contractStatus = policy.currentStatus ?? policy.status
  const contentId = `policy-documents-${policy.id}`
  const expansionIds = getPolicyExpansionIds(row)
  const allExpanded = expansionIds.length > 1 && expansionIds.every((id) => expanded.has(id))
  const currentDocument = getCurrentPolicyDocument(row)

  return (
    <section className="border-b border-border-1 last:border-b-0">
      <div className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm hover:bg-bg-surface-2">
        <div className="col-span-3 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
              <ExpandButton
                open={isOpen}
                controls={contentId}
                label={`${isOpen ? 'Recolher' : 'Expandir'} documentos da apólice ${policy.policyNumber ?? 'em emissão'} de ${policy.insured}`}
                onClick={() => onToggleExpand(policy.id)}
                compact
              />
              {documents.length > 0 && (
                <ExpandAllButton
                  open={allExpanded}
                  label={`${allExpanded ? 'Recolher' : 'Expandir'} apólice e todos os documentos de ${policy.insured}`}
                  onClick={() => onSetExpanded(expansionIds, !allExpanded)}
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg-1">{policy.insured}</p>
              <p className="truncate font-mono text-[11px] text-fg-3">
                {policy.policyNumber ?? 'Em emissão'}
              </p>
              <p className="text-[11px] text-fg-4">
                {policy.vigenciaInicial && policy.vigenciaFinal
                  ? `${fmtDate(policy.vigenciaInicial)} → ${fmtDate(policy.vigenciaFinal)}`
                  : 'Vigência não informada'}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-2 min-w-0">
          <p className="truncate text-fg-2">{policy.branch}</p>
          <p className="mt-0.5 text-[11px] text-fg-4">{fmtMoney(policy.totalPremium)}</p>
        </div>

        <div className="col-span-3">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-4">
              Status contratual
            </span>
            <StatusBadge value={contractStatus} />
            {operationalStatus && (
              <span className="inline-flex items-center gap-1 rounded-full bg-signal-warning/15 px-2 py-0.5 text-[10px] font-semibold text-signal-warning">
                <FileClock size={11} />
                {operationalStatus}
              </span>
            )}
            <span className="text-[11px] text-fg-4">
              {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
            </span>
          </div>
        </div>

        <PartyCell name={policy.producer.name} avatar span={1} />
        <PartyCell name={policy.insurer} />
        <ActionLink
          to={`/apolices/${policy.id}`}
          label={currentDocument ? `Abrir documento vigente de ${policy.insured}` : `Abrir apólice de ${policy.insured}`}
        />
      </div>

      {isOpen && (
        <div id={contentId} className="border-t border-border-1 bg-bg-surface-2/35">
          {regularDocuments.length > 0 && (
            <DocumentGroupLabel label="Documentos" count={regularDocuments.length} />
          )}
          {regularDocuments.map((document) => (
            <DocumentRow
              key={document.document.id}
              row={document}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
            />
          ))}

          {invoices.length > 0 && (
            <InvoiceGroup
              policyId={policy.id}
              invoices={invoices}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
            />
          )}

          {documents.length === 0 && (
            <div className="px-12 py-5 text-xs text-fg-4">
              Nenhum documento vinculado a esta apólice.
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function InvoiceGroup({
  policyId,
  invoices,
  expanded,
  onToggleExpand,
}: {
  policyId: string
  invoices: DocumentTreeRow[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
}) {
  const groupId = `invoices:${policyId}`
  const isOpen = expanded.has(groupId)
  const latest = invoices[0]?.document
  const pending = invoices.filter(({ document }) => document.status === 'Pendente').length

  return (
    <div className="border-t border-border-1">
      <button
        type="button"
        onClick={() => onToggleExpand(groupId)}
        aria-expanded={isOpen}
        aria-controls={`invoice-list-${policyId}`}
        className="flex w-full items-center gap-2 px-12 py-2.5 text-left text-xs hover:bg-bg-surface-2"
      >
        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <Files size={14} className="text-accent-primary" />
        <span className="font-bold text-fg-2">Faturas ({invoices.length})</span>
        <span className="text-fg-4">
          Última competência: {fmtCompetence(latest?.competenceStart, latest?.competenceEnd)}
        </span>
        {pending > 0 && (
          <span className="rounded-full bg-signal-warning/15 px-2 py-0.5 font-semibold text-signal-warning">
            {pending} {pending === 1 ? 'pendente' : 'pendentes'}
          </span>
        )}
      </button>
      {isOpen && (
        <div id={`invoice-list-${policyId}`}>
          {invoices.map((invoice) => (
            <DocumentRow
              key={invoice.document.id}
              row={invoice}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              invoice
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentGroupLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-12 pb-1 pt-3 text-[10px] font-black uppercase tracking-wider text-fg-4">
      {label} ({count})
    </div>
  )
}

function DocumentRow({
  row,
  expanded,
  onToggleExpand,
  invoice = false,
}: {
  row: DocumentTreeRow
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  invoice?: boolean
}) {
  const { document } = row
  const isOpen = expanded.has(document.id)
  const contentId = `document-details-${document.id}`
  const primaryLabel = invoice
    ? fmtCompetence(document.competenceStart, document.competenceEnd)
    : row.movementLabel ?? row.typeLabel

  return (
    <div className="border-t border-border-1/70 bg-bg-surface-2 first:border-t-0">
      <div className="grid grid-cols-12 items-center gap-3 py-2.5 pl-11 pr-4 text-sm hover:bg-bg-surface-3">
        <div className="col-span-3 min-w-0">
          <div className="flex items-start gap-2">
            <ExpandButton
              open={isOpen}
              controls={contentId}
              label={`${isOpen ? 'Recolher' : 'Expandir'} detalhes de ${row.typeLabel.toLowerCase()} ${row.documentNumber}`}
              onClick={() => onToggleExpand(document.id)}
              compact
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg-2">{primaryLabel}</p>
              <p className="truncate font-mono text-[11px] text-fg-4">{row.documentNumber}</p>
              <p className="truncate text-[11px] text-fg-4">{row.summary}</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 text-xs text-fg-3">
          <p>{document.proposalType}</p>
          <p className="mt-0.5 text-[11px] text-fg-4">
            {document.vigenciaInicial ? `Início: ${fmtDate(document.vigenciaInicial)}` : 'Início não informado'}
          </p>
        </div>

        <div className="col-span-3">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-4">
              Etapa do documento
            </span>
            <StatusBadge value={document.status} />
            {(document.proposalType === 'Endosso' || document.proposalType === 'Cancelamento') && (
              <span className="text-[11px] text-fg-4">{row.financialEffect}</span>
            )}
          </div>
        </div>

        <PartyCell name={document.producer.name} avatar span={1} />
        <PartyCell name={document.insurer} />
        {document.apoliceId ? (
          <ActionLink
            to={`/apolices/${document.apoliceId}?documento=${document.id}`}
            label={`Abrir ${document.proposalType.toLowerCase()} ${row.documentNumber}`}
          />
        ) : <div className="col-span-1" />}
      </div>

      {isOpen && (
        <DocumentDetails id={contentId} row={row} />
      )}
    </div>
  )
}

function DocumentList({
  documents,
  expanded,
  onToggleExpand,
  flat,
}: {
  documents: Proposal[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  flat: boolean
}) {
  return (
    <div>
      <TableHeader firstColumn="DOCUMENTO / SEGURADO" />
      {documents.map((document) => {
        const row: DocumentTreeRow = {
          document,
          typeLabel: document.proposalType,
          movementLabel: getMovementLabel(document),
          financialEffect: getDocumentFinancialEffect(document),
          documentNumber: getDocumentNumber(document),
          summary: getDocumentSummary(document),
        }
        return (
          <DocumentRow
            key={document.id}
            row={row}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            invoice={flat && document.proposalType === 'Fatura'}
          />
        )
      })}
    </div>
  )
}

function DocumentDetails({ id, row }: { id: string; row: DocumentTreeRow }) {
  const { document } = row
  return (
    <div id={id} className="grid grid-cols-2 gap-3 bg-bg-surface px-12 py-4 text-xs text-fg-2 md:grid-cols-4">
      <Detail label="Tipo" value={row.typeLabel} />
      <Detail label="Natureza" value={row.movementLabel} />
      <Detail label="Efeito financeiro" value={row.financialEffect} />
      <Detail label="Número" value={row.documentNumber} mono />
      <Detail label="Transmissão" value={formatOptionalDate(document.transmissionDate)} />
      <Detail label="Emissão" value={formatOptionalDate(document.issueDate)} />
      <Detail label="Início dos efeitos" value={formatOptionalDate(document.vigenciaInicial)} />
      <Detail
        label="Competência"
        value={document.proposalType === 'Fatura'
          ? fmtCompetence(document.competenceStart, document.competenceEnd)
          : undefined}
      />
      <Detail label="Prêmio do documento" value={fmtMoney(document.totalPremium)} mono />
      <Detail label="Prêmio líquido" value={fmtMoney(document.netPremium)} mono />
      <Detail label="Protocolo" value={document.insurerProtocol} mono />
      <div className="col-span-2 md:col-span-4">
        <Detail label="Resumo do movimento" value={row.summary} />
      </div>
      {row.previewBeforeAfter && (
        <div className="col-span-2 md:col-span-4">
          <div className="grid grid-cols-[minmax(7rem,1fr)_minmax(0,2fr)_minmax(0,2fr)] gap-x-3 gap-y-1 rounded-[6px] border border-border-1 bg-bg-surface-2 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-4">Campo</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-4">{row.previewBeforeAfter.beforeLabel}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-fg-4">{row.previewBeforeAfter.afterLabel}</span>
            {row.previewBeforeAfter.fields.map((field) => (
              <ChangePreviewRow key={field.label} {...field} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChangePreviewRow({
  label,
  before,
  after,
}: {
  label: string
  before?: string
  after?: string
}) {
  return (
    <>
      <span className="font-semibold text-fg-3">{label}</span>
      <span>{before || '—'}</span>
      <span>{after || '—'}</span>
    </>
  )
}

function ExpandButton({
  open,
  controls,
  label,
  onClick,
  compact = false,
}: {
  open: boolean
  controls: string
  label: string
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      className={`${compact ? 'mt-0' : 'mt-0.5'} rounded-[4px] p-1 text-fg-4 hover:bg-bg-surface-3 hover:text-fg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary`}
    >
      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
  )
}

function ExpandAllButton({
  open,
  label,
  onClick,
}: {
  open: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={open}
      title={label}
      className="rounded-[4px] p-1 text-fg-4 hover:bg-bg-surface-3 hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
    >
      {open ? <FoldVertical size={14} /> : <UnfoldVertical size={14} />}
    </button>
  )
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[value] ?? 'bg-bg-surface-3 text-fg-3'}`}>
      {value}
    </span>
  )
}

function PartyCell({ name, avatar = false, span = 2 }: { name: string; avatar?: boolean; span?: 1 | 2 }) {
  return (
    <div className={`${span === 1 ? 'col-span-1' : 'col-span-2'} flex min-w-0 items-center gap-2`}>
      <div className={`${avatar ? 'rounded-full bg-accent-primary-soft text-accent-primary' : 'rounded bg-bg-surface-2 text-fg-3'} flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-bold`}>
        {initials(name)}
      </div>
      <span className="truncate text-sm text-fg-2">{name}</span>
    </div>
  )
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <div className="col-span-1 flex justify-end">
      <Link
        to={to}
        aria-label={label}
        title={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-fg-3 hover:bg-accent-primary-soft hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <ArrowUpRight size={16} />
      </Link>
    </div>
  )
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-fg-4">{label}</p>
      <p className={mono ? 'font-mono' : undefined}>{value || '—'}</p>
    </div>
  )
}

function formatOptionalDate(value?: string) {
  return value ? fmtDate(value) : undefined
}
