import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, Copy, FilePlus2, Loader2, ReceiptText, ShieldAlert, X } from 'lucide-react'
import { usePropostas } from '../../contexts/usePropostas'
import { ContractOperationError, type DerivedDocumentType, type EndorsementNature } from '../../contexts/contractOperations'
import { getTable } from '../../lib/inMemoryDb'
import type { ApoliceItemRow, ItemCoberturaRow } from '../../types/database'
import type { Proposal } from '../../types/proposta'
import { useSystemFeedback } from '../feedback/systemFeedbackContext'
import { useAuth } from '../../hooks/useAuth'
import { resolveScopedCatalog } from '../../contexts/contractCatalogCore'

interface LookupRow {
  id: string
  nome?: string | null
  ativo?: boolean | null
  ramo_id?: string | null
  filial_id?: string | null
  natureza_canonica?: string | null
  descricao?: string | null
  tipo?: string | null
  apolice_id?: string | null
  numero_fatura?: string | null
  competencia_inicio?: string | null
  competencia_fim?: string | null
  data_emissao?: string | null
  premio_total?: number | null
  premio_liquido?: number | null
  forma_pagamento?: string | null
  qtd_parcelas?: number | null
}

const inputClass = 'w-full rounded-[8px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm text-fg-1 outline-none transition-colors placeholder:text-fg-3 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50'

const documentMeta: Record<DerivedDocumentType, { label: string; description: string }> = {
  ENDOSSO: { label: 'Endosso', description: 'Altere itens, coberturas ou dados do contrato.' },
  CANCELAMENTO: { label: 'Cancelamento', description: 'Registre o encerramento contratual com motivo.' },
  FATURA: { label: 'Fatura', description: 'Crie uma competência mensal com agendas próprias.' },
}

const natureLabels: Record<EndorsementNature, string> = {
  ALTERACAO_DADOS: 'Alteração de dados',
  INCLUSAO_ITEM: 'Inclusão de item',
  EXCLUSAO_ITEM: 'Exclusão de item',
  SUBSTITUICAO_ITEM: 'Substituição de item',
  ALTERACAO_COBERTURA: 'Alteração de cobertura',
  ALTERACAO_IMPORTANCIA_SEGURADA: 'Alteração de importância segurada',
  ALTERACAO_CLAUSULA: 'Alteração de cláusula',
}

const numberOrNull = (value: string): number | null => value.trim() ? Number(value.replace(',', '.')) : null

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-fg-3">{label}</span>{children}{hint && <span className="mt-1.5 block text-[11px] text-fg-3">{hint}</span>}</label>
}

function TextInput({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
}

export function DerivedDocumentModal({ policy, onClose, onCreated }: { policy: Proposal; onClose: () => void; onCreated: (documentId: string) => void }) {
  const { createDerivedDocument } = usePropostas()
  const { activeBranchId } = useAuth()
  const { notify } = useSystemFeedback()
  const allowedTypes = useMemo<DerivedDocumentType[]>(() => [
    ...(policy.allowsEndorsement ? ['ENDOSSO' as const] : []),
    'CANCELAMENTO',
    ...(policy.isMonthly ? ['FATURA' as const] : []),
  ], [policy.allowsEndorsement, policy.isMonthly])
  const [type, setType] = useState<DerivedDocumentType>(allowedTypes[0] ?? 'CANCELAMENTO')
  const [officialNumber, setOfficialNumber] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [competenceStart, setCompetenceStart] = useState('')
  const [competenceEnd, setCompetenceEnd] = useState('')
  const [subtypeId, setSubtypeId] = useState('')
  const [reasonId, setReasonId] = useState('')
  const [totalPremium, setTotalPremium] = useState('')
  const [netPremium, setNetPremium] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [installmentCount, setInstallmentCount] = useState('1')
  const [firstDueDate, setFirstDueDate] = useState('')
  const [commissionPercent, setCommissionPercent] = useState('')
  const [agencyCommissionPercent, setAgencyCommissionPercent] = useState('')
  const [itemId, setItemId] = useState('')
  const [coverageId, setCoverageId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [externalIdentifier, setExternalIdentifier] = useState('')
  const [riskValue, setRiskValue] = useState('')
  const [coverageCapital, setCoverageCapital] = useState('')
  const [coveragePremium, setCoveragePremium] = useState('')
  const [notes, setNotes] = useState('')
  const [savingMode, setSavingMode] = useState<'draft' | 'issued' | null>(null)

  const subtypes = useMemo(() => resolveScopedCatalog(
    getTable('endosso_subtipos') as unknown as (LookupRow & { nome: string; ativo: boolean; filial_id: string | null; ramo_id: string | null })[],
    activeBranchId,
    policy.branchId ?? null,
  ), [activeBranchId, policy.branchId])
  const reasons = useMemo(() => resolveScopedCatalog(
    getTable('cancelamento_motivos') as unknown as (LookupRow & { nome: string; ativo: boolean; filial_id: string | null; ramo_id: string | null })[],
    activeBranchId,
    policy.branchId ?? null,
  ), [activeBranchId, policy.branchId])
  const items = useMemo(() => (getTable('apolice_itens') as unknown as ApoliceItemRow[])
    .filter((row) => row.apolice_id === policy.id && !row.excluido_por_proposta_id), [policy.id])
  const coverages = useMemo(() => (getTable('item_coberturas') as unknown as ItemCoberturaRow[])
    .filter((row) => row.apolice_item_id === itemId && !row.excluido_por_proposta_id), [itemId])
  const selectedSubtype = subtypes.find((row) => row.id === subtypeId)
  const policyBranch = (getTable('ramos') as unknown as Array<{ id: string; risk_type: string | null }>).find((row) => row.id === policy.branchId)
  const showsAgencyCommission = policyBranch?.risk_type === 'SAUDE' || policyBranch?.risk_type === 'VIDA'
  const nature = selectedSubtype?.natureza_canonica as EndorsementNature | undefined
  const needsItem = nature && !['ALTERACAO_DADOS', 'INCLUSAO_ITEM', 'ALTERACAO_CLAUSULA'].includes(nature)
  const needsNewItem = nature === 'INCLUSAO_ITEM' || nature === 'SUBSTITUICAO_ITEM'
  const needsCoverage = nature === 'ALTERACAO_COBERTURA' || nature === 'ALTERACAO_IMPORTANCIA_SEGURADA'

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingMode) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, savingMode])

  const duplicateLastInvoice = () => {
    const last = (getTable('propostas') as unknown as LookupRow[])
      .filter((row) => row.tipo === 'FATURA' && row.apolice_id === policy.id && Boolean(row.data_emissao))
      .sort((a, b) => String(b.competencia_inicio).localeCompare(String(a.competencia_inicio)))[0]
    if (!last) {
      notify({ title: 'Nenhuma fatura anterior', description: 'Preencha os dados da primeira competência.', tone: 'info' })
      return
    }
    setTotalPremium(last.premio_total?.toString() ?? '')
    setNetPremium(last.premio_liquido?.toString() ?? '')
    setPaymentMethod(last.forma_pagamento ?? '')
    setInstallmentCount('1')
    notify({ title: 'Dados reaproveitados', description: 'Número, competência, etapa e agendas não foram copiados.', tone: 'success' })
  }

  const save = (issued: boolean) => {
    setSavingMode(issued ? 'issued' : 'draft')
    try {
      const documentId = createDerivedDocument({
        policyId: policy.id,
        type,
        issued,
        officialNumber,
        endorsementSubtypeId: type === 'ENDOSSO' ? subtypeId : undefined,
        cancellationReasonId: type === 'CANCELAMENTO' ? reasonId : undefined,
        effectiveDate: type !== 'FATURA' ? effectiveDate : undefined,
        competenceStart: type === 'FATURA' ? competenceStart : undefined,
        competenceEnd: type === 'FATURA' ? competenceEnd : undefined,
        totalPremium: numberOrNull(totalPremium),
        netPremium: numberOrNull(netPremium),
        paymentMethod,
        installmentCount: numberOrNull(installmentCount),
        firstInstallmentDueDate: firstDueDate,
        commissionPercent: numberOrNull(commissionPercent),
        agencyCommissionPercent: showsAgencyCommission ? numberOrNull(agencyCommissionPercent) : null,
        notes,
        endorsementEffect: type === 'ENDOSSO' ? {
          itemId: itemId || undefined,
          coverageId: coverageId || undefined,
          description: newDescription || undefined,
          externalIdentifier: externalIdentifier || undefined,
          riskValue: numberOrNull(riskValue),
          coverageCapital: numberOrNull(coverageCapital),
          coveragePremium: numberOrNull(coveragePremium),
        } : undefined,
      })
      notify({
        title: issued ? 'Documento registrado' : 'Documento em análise',
        description: issued ? 'Os efeitos contratuais e agendas aplicáveis foram materializados.' : 'Nenhum efeito contratual foi aplicado nesta etapa.',
        tone: 'success',
      })
      onCreated(documentId)
    } catch (error) {
      notify({
        title: 'Não foi possível criar o documento',
        description: error instanceof ContractOperationError || error instanceof Error ? error.message : 'Revise os dados informados.',
        tone: 'danger',
      })
      setSavingMode(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--bg-overlay)] p-4" onMouseDown={() => !savingMode && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="derived-title" className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] bg-bg-surface shadow-[var(--shadow-3)]" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-border-1 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="rounded-[8px] bg-accent-primary-soft p-2.5 text-accent-primary"><FilePlus2 size={20} /></span>
            <div><h2 id="derived-title" className="text-base font-black text-fg-1">Nova operação contratual</h2><p className="mt-1 text-sm text-fg-3">Apólice <span className="font-mono">{policy.policyNumber ?? policy.id}</span> · {policy.insured}</p></div>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(savingMode)} className="rounded-[6px] p-2 text-fg-3 hover:bg-bg-surface-2 hover:text-fg-1 disabled:opacity-40" aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {allowedTypes.map((option) => {
              const Icon = option === 'ENDOSSO' ? FilePlus2 : option === 'CANCELAMENTO' ? ShieldAlert : ReceiptText
              return <button key={option} type="button" onClick={() => setType(option)} className={`rounded-[8px] border p-3 text-left transition-colors ${type === option ? 'border-accent-primary bg-accent-primary-soft' : 'border-border-1 hover:bg-bg-surface-2'}`}><span className="flex items-center gap-2 text-sm font-black text-fg-1"><Icon size={16} className={type === option ? 'text-accent-primary' : 'text-fg-3'} />{documentMeta[option].label}</span><span className="mt-1.5 block text-xs leading-relaxed text-fg-3">{documentMeta[option].description}</span></button>
            })}
          </div>

          <section className="mt-5 border-t border-border-1 pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-black text-fg-1">Dados do documento</h3><p className="mt-1 text-xs text-fg-3">Salvar em análise não altera contrato, itens ou agendas.</p></div>{type === 'FATURA' && <button type="button" onClick={duplicateLastInvoice} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-accent-primary hover:bg-accent-primary-soft"><Copy size={14} />Usar última fatura</button>}</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={type === 'ENDOSSO' ? 'Número do endosso' : type === 'FATURA' ? 'Número da fatura' : 'Número do cancelamento'}><TextInput value={officialNumber} onChange={setOfficialNumber} placeholder="Número oficial" /></Field>
              {type === 'ENDOSSO' && <Field label="Subtipo do endosso"><select className={inputClass} value={subtypeId} onChange={(event) => setSubtypeId(event.target.value)}><option value="">Selecione</option>{subtypes.map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}</select></Field>}
              {type === 'CANCELAMENTO' && <Field label="Motivo do cancelamento"><select className={inputClass} value={reasonId} onChange={(event) => setReasonId(event.target.value)}><option value="">Selecione</option>{reasons.map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}</select></Field>}
              {type !== 'FATURA' && <Field label="Início dos efeitos"><TextInput type="date" value={effectiveDate} onChange={setEffectiveDate} /></Field>}
              {type === 'FATURA' && <><Field label="Competência inicial"><TextInput type="date" value={competenceStart} onChange={setCompetenceStart} /></Field><Field label="Competência final"><TextInput type="date" value={competenceEnd} onChange={setCompetenceEnd} /></Field></>}
              <Field label="Prêmio total" hint={type === 'CANCELAMENTO' ? 'Use valor negativo quando houver restituição.' : undefined}><TextInput type="number" value={totalPremium} onChange={setTotalPremium} /></Field>
              <Field label="Prêmio líquido"><TextInput type="number" value={netPremium} onChange={setNetPremium} /></Field>
              <Field label="Forma de pagamento"><TextInput value={paymentMethod} onChange={setPaymentMethod} placeholder="Ex: BOLETO" /></Field>
              <Field label="Quantidade de parcelas"><TextInput type="number" value={installmentCount} onChange={setInstallmentCount} /></Field>
              <Field label="Primeiro vencimento"><TextInput type="date" value={firstDueDate} onChange={setFirstDueDate} /></Field>
              <Field label="Comissão (%)"><TextInput type="number" value={commissionPercent} onChange={setCommissionPercent} /></Field>
              {showsAgencyCommission && <Field label="Agenciamento (%)" hint="Percentual acumulado; por exemplo, 300% em saúde."><TextInput type="number" value={agencyCommissionPercent} onChange={setAgencyCommissionPercent} /></Field>}
            </div>
          </section>

          {type === 'ENDOSSO' && nature && !['ALTERACAO_DADOS', 'ALTERACAO_CLAUSULA'].includes(nature) && <section className="mt-5 border-t border-border-1 pt-5"><div className="mb-4"><h3 className="text-sm font-black text-fg-1">Movimentação do risco</h3><p className="mt-1 text-xs text-fg-3">{natureLabels[nature]}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {needsItem && <Field label="Item vigente"><select className={inputClass} value={itemId} onChange={(event) => { setItemId(event.target.value); setCoverageId('') }}><option value="">Selecione</option>{items.map((item) => <option key={item.id} value={item.id}>Item {item.numero_item ?? '—'} · {item.descricao}</option>)}</select></Field>}
            {needsCoverage && <Field label="Cobertura vigente"><select className={inputClass} value={coverageId} onChange={(event) => setCoverageId(event.target.value)}><option value="">Selecione</option>{coverages.map((coverage) => <option key={coverage.id} value={coverage.id}>{coverage.cobertura_id ?? coverage.id} · {coverage.capital_lmi ?? 'sem capital'}</option>)}</select></Field>}
            {needsNewItem && <><Field label="Descrição do novo item"><TextInput value={newDescription} onChange={setNewDescription} /></Field><Field label="Identificador externo"><TextInput value={externalIdentifier} onChange={setExternalIdentifier} /></Field><Field label="Valor do risco"><TextInput type="number" value={riskValue} onChange={setRiskValue} /></Field></>}
            {needsCoverage && <><Field label="Novo capital / LMI"><TextInput type="number" value={coverageCapital} onChange={setCoverageCapital} /></Field><Field label="Novo prêmio da cobertura"><TextInput type="number" value={coveragePremium} onChange={setCoveragePremium} /></Field></>}
          </div></section>}

          <section className="mt-5 border-t border-border-1 pt-5"><Field label="Observações"><textarea className={`${inputClass} min-h-24 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Informações complementares do documento" /></Field></section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-border-1 bg-bg-surface-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-fg-3"><CalendarRange size={14} /> A etapa do Painel continua independente da efetivação.</p>
          <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} disabled={Boolean(savingMode)} className="rounded-[6px] px-4 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-3 disabled:opacity-40">Cancelar</button><button type="button" onClick={() => save(false)} disabled={Boolean(savingMode)} className="inline-flex items-center gap-2 rounded-full border border-accent-primary px-5 py-2.5 text-sm font-black text-accent-primary hover:bg-accent-primary-soft disabled:opacity-50">{savingMode === 'draft' && <Loader2 size={16} className="animate-spin" />}Salvar em análise</button><button type="button" onClick={() => save(true)} disabled={Boolean(savingMode)} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover disabled:opacity-50">{savingMode === 'issued' && <Loader2 size={16} className="animate-spin" />}Registrar emitido</button></div>
        </footer>
      </div>
    </div>
  )
}

export function NotRenewedModal({ policy, onClose, onConfirm }: { policy: Proposal; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--bg-overlay)] p-4" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-labelledby="not-renewed-title" className="w-full max-w-lg rounded-[12px] bg-bg-surface shadow-[var(--shadow-3)]" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b border-border-1 px-5 py-4"><div><h2 id="not-renewed-title" className="text-base font-black text-fg-1">Marcar como não renovada</h2><p className="mt-1 text-sm text-fg-3">Apólice <span className="font-mono">{policy.policyNumber}</span></p></div><button type="button" onClick={onClose} className="rounded-[6px] p-2 text-fg-3 hover:bg-bg-surface-2" aria-label="Fechar"><X size={18} /></button></header><div className="px-5 py-5"><Field label="Motivo" hint="O contrato e seus documentos permanecem no histórico."><textarea autoFocus className={`${inputClass} min-h-28 resize-y`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Informe por que a apólice não será renovada" /></Field></div><footer className="flex justify-end gap-2 border-t border-border-1 bg-bg-surface-2 px-5 py-4"><button type="button" onClick={onClose} className="rounded-[6px] px-4 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-3">Cancelar</button><button type="button" onClick={() => onConfirm(reason)} disabled={!reason.trim()} className="rounded-full bg-signal-warning px-5 py-2.5 text-sm font-black text-white hover:brightness-95 disabled:opacity-50">Confirmar não renovação</button></footer></div></div>
}
