import { useState, type ReactNode } from 'react'
import { Layers3, Save } from 'lucide-react'
import AppModal from '../modals/AppModal'
import { useSystemFeedback } from '../feedback/systemFeedbackContext'
import type {
  ApoliceItemRow,
  ComissaoRow,
  ComissaoTipo,
  ItemCoberturaRow,
  ParcelaRow,
  RepasseRow,
} from '../../types/database'
import type { Proposal } from '../../types/proposta'
import { getTable } from '../../lib/inMemoryDb'
import {
  createComissao,
  createParcela,
  createRepasse,
  canOperateComissao,
  canOperateParcela,
  canOperateRepasse,
  saveCoverage,
  saveItem,
  updateComissoes,
  updateParcelas,
  updateRepasses,
  type BatchMutationResult,
} from './contractTabOperations'

export type FinancialKind = 'parcela' | 'comissao' | 'repasse'
type FinancialRow = ParcelaRow | ComissaoRow | RepasseRow
type EditorMode = 'create' | 'edit' | 'batch'
type FinancialDraft = Record<string, string>

const controlClass = 'w-full rounded-[8px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm text-fg-1 outline-none transition-colors placeholder:text-fg-3 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:bg-bg-surface-2 disabled:text-fg-3'
const commissionTypes: ComissaoTipo[] = ['NORMAL', 'AGENCIAMENTO', 'VITALICIA', 'ADICIONAL', 'RESTITUICAO']
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function BatchDeleteModal({ label, count, eligible, blocked, onClose, onConfirm }: {
  label: string
  count: number
  eligible: number
  blocked: number
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return <AppModal isOpen onClose={onClose} title={`Excluir ${count} ${label}`} description="A exclusão é lógica e mantém o histórico auditável." icon={<Layers3 size={18} />} footer={<><button type="button" onClick={onClose} className="rounded-[6px] px-5 py-2.5 text-sm font-bold text-fg-3">Cancelar</button><button type="button" disabled={!reason.trim() || eligible === 0} onClick={() => onConfirm(reason)} className="rounded-full bg-signal-danger px-6 py-2.5 text-sm font-extrabold text-fg-on-brand disabled:opacity-45">Excluir {eligible} elegíveis</button></>}>
    <div className="px-8 py-6"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-[8px] bg-success-soft p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-fg-4">Elegíveis</span><strong className="mt-1 block font-mono text-xl text-signal-success">{eligible}</strong></div><div className="rounded-[8px] bg-warning-soft p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-fg-4">Bloqueados</span><strong className="mt-1 block font-mono text-xl text-signal-warning">{blocked}</strong></div></div><div className="mt-4"><Field label="Motivo da exclusão" hint="Será gravado nas observações e no log de auditoria."><textarea autoFocus className={`${controlClass} min-h-24 resize-y`} value={reason} onChange={(event) => setReason(event.target.value)} /></Field></div></div>
  </AppModal>
}

function Field({ label, children, enabled, onEnabled, hint }: {
  label: string
  children: ReactNode
  enabled?: boolean
  onEnabled?: (enabled: boolean) => void
  hint?: string
}) {
  return <label className="block min-w-0">
    <span className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">
      {onEnabled && <input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} className="h-4 w-4 accent-[var(--accent-primary)]" />}
      {label}
    </span>
    <span className={onEnabled && !enabled ? 'pointer-events-none opacity-45' : ''}>{children}</span>
    {hint && <span className="mt-1 block text-xs text-fg-4">{hint}</span>}
  </label>
}

function nullable(value: string): string | null { return value.trim() || null }
function numberOrNull(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function financialInitial(kind: FinancialKind, row?: FinancialRow): FinancialDraft {
  if (kind === 'parcela') {
    const item = row as ParcelaRow | undefined
    return {
      numero: item?.numero?.toString() ?? '', vencimento: item?.vencimento ?? '',
      valor: item?.valor?.toString() ?? '', valorLiquido: item?.valor_liquido?.toString() ?? '',
      formaPagamento: item?.forma_pagamento ?? '', observacoes: item?.observacoes ?? '',
    }
  }
  if (kind === 'comissao') {
    const item = row as ComissaoRow | undefined
    return {
      numero: item?.numero?.toString() ?? '', tipoComissao: item?.tipo_comissao ?? 'NORMAL',
      percentual: item?.percentual?.toString() ?? '', baseCalculo: item?.base_calculo?.toString() ?? '',
      valorPrevisto: item?.valor_previsto?.toString() ?? '', previstaEm: item?.prevista_em ?? '',
      observacoes: item?.observacoes ?? '',
    }
  }
  const item = row as RepasseRow | undefined
  return {
    numero: item?.numero?.toString() ?? '', beneficiarioId: item?.beneficiario_id ?? '',
    papelBeneficiario: item?.papel_beneficiario ?? 'PRODUTOR', base: item?.base ?? 'COMISSAO',
    percentual: item?.percentual?.toString() ?? '', valorPrevisto: item?.valor_previsto?.toString() ?? '',
    previstoEm: item?.previsto_em ?? '', formaPagamento: item?.forma_pagamento ?? '',
    observacoes: item?.observacoes ?? '',
  }
}

export function FinancialEditorModal({
  kind, mode, row, selectedIds = [], documents, defaultDocumentId, onClose, onSaved,
}: {
  kind: FinancialKind
  mode: EditorMode
  row?: FinancialRow
  selectedIds?: string[]
  documents: Proposal[]
  defaultDocumentId?: string
  onClose: () => void
  onSaved: (result?: BatchMutationResult) => void
}) {
  const [documentId, setDocumentId] = useState(defaultDocumentId ?? documents[0]?.id ?? '')
  const [draft, setDraft] = useState(() => financialInitial(kind, row))
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(mode === 'batch' ? [] : Object.keys(financialInitial(kind, row))))
  const [reviewing, setReviewing] = useState(false)
  const producers = getProducerOptions()
  const { notify } = useSystemFeedback()
  const title = mode === 'create' ? `Novo ${kind}` : mode === 'batch' ? `Alterar ${selectedIds.length} selecionados` : `Editar ${kind}`
  const set = (field: string, value: string) => { setReviewing(false); setDraft((current) => ({ ...current, [field]: value })) }
  const toggle = (field: string, active: boolean) => {
    setReviewing(false)
    setEnabled((current) => {
      const next = new Set(current)
      if (active) next.add(field); else next.delete(field)
      return next
    })
  }

  const batchRows = mode === 'batch'
    ? (getTable(kind === 'parcela' ? 'parcelas' : kind === 'comissao' ? 'comissoes' : 'repasses') as unknown as FinancialRow[])
      .filter((candidate) => selectedIds.includes(candidate.id))
    : []
  const isOperable = (candidate: FinancialRow) => kind === 'parcela'
    ? canOperateParcela(candidate as ParcelaRow)
    : kind === 'comissao'
      ? canOperateComissao(candidate as ComissaoRow)
      : canOperateRepasse(candidate as RepasseRow)
  const eligibleCount = batchRows.filter(isOperable).length
  const blockedCount = batchRows.length - eligibleCount
  const eligibleRows = batchRows.filter(isOperable)
  const valueField = kind === 'parcela' ? 'valor' : 'valorPrevisto'
  const beforeTotal = eligibleRows.reduce((sum, candidate) => sum + Number(
    kind === 'parcela' ? (candidate as ParcelaRow).valor ?? 0
      : kind === 'comissao' ? (candidate as ComissaoRow).valor_previsto ?? 0
        : (candidate as RepasseRow).valor_previsto ?? 0,
  ), 0)
  const afterTotal = enabled.has(valueField)
    ? Number(numberOrNull(draft[valueField]) ?? 0) * eligibleCount
    : beforeTotal

  const save = () => {
    if (mode === 'create') {
      const numero = Number(draft.numero)
      if (!documentId || !Number.isInteger(numero) || numero < 1) {
        notify({ title: 'Revise os campos obrigatórios', description: 'Selecione o documento e informe um número inteiro maior que zero.', tone: 'danger' })
        return
      }
      if (kind === 'repasse' && !draft.beneficiarioId) {
        notify({ title: 'Selecione o beneficiário', description: 'Todo repasse precisa apontar para um produtor ou gerente cadastrado.', tone: 'danger' })
        return
      }
      try {
        if (kind === 'parcela') createParcela({
        propostaId: documentId, numero, vencimento: nullable(draft.vencimento),
        valor: numberOrNull(draft.valor), valorLiquido: numberOrNull(draft.valorLiquido),
        formaPagamento: nullable(draft.formaPagamento), observacoes: nullable(draft.observacoes),
      })
        if (kind === 'comissao') createComissao({
        propostaId: documentId, numero, tipoComissao: draft.tipoComissao as ComissaoTipo,
        percentual: numberOrNull(draft.percentual), baseCalculo: numberOrNull(draft.baseCalculo),
        valorPrevisto: numberOrNull(draft.valorPrevisto), previstaEm: nullable(draft.previstaEm),
        observacoes: nullable(draft.observacoes),
      })
        if (kind === 'repasse') createRepasse({
        propostaId: documentId, numero, beneficiarioId: draft.beneficiarioId,
        papelBeneficiario: nullable(draft.papelBeneficiario), base: nullable(draft.base),
        percentual: numberOrNull(draft.percentual), valorPrevisto: numberOrNull(draft.valorPrevisto),
        previstoEm: nullable(draft.previstoEm), observacoes: nullable(draft.observacoes),
      })
        onSaved()
      } catch (error) {
        notify({ title: 'Não foi possível criar', description: error instanceof Error ? error.message : 'Revise os dados informados.', tone: 'danger' })
      }
      return
    }

    const ids = mode === 'edit' && row ? [row.id] : selectedIds
    let result: BatchMutationResult
    if (kind === 'parcela') result = updateParcelas(ids, {
      ...(enabled.has('vencimento') ? { vencimento: nullable(draft.vencimento) } : {}),
      ...(enabled.has('valor') ? { valor: numberOrNull(draft.valor) } : {}),
      ...(enabled.has('valorLiquido') ? { valor_liquido: numberOrNull(draft.valorLiquido) } : {}),
      ...(enabled.has('formaPagamento') ? { forma_pagamento: nullable(draft.formaPagamento) } : {}),
      ...(enabled.has('observacoes') ? { observacoes: nullable(draft.observacoes) } : {}),
    })
    else if (kind === 'comissao') result = updateComissoes(ids, {
      ...(enabled.has('tipoComissao') ? { tipo_comissao: draft.tipoComissao as ComissaoTipo } : {}),
      ...(enabled.has('percentual') ? { percentual: numberOrNull(draft.percentual) } : {}),
      ...(enabled.has('baseCalculo') ? { base_calculo: numberOrNull(draft.baseCalculo) } : {}),
      ...(enabled.has('valorPrevisto') ? { valor_previsto: numberOrNull(draft.valorPrevisto) } : {}),
      ...(enabled.has('previstaEm') ? { prevista_em: nullable(draft.previstaEm) } : {}),
      ...(enabled.has('observacoes') ? { observacoes: nullable(draft.observacoes) } : {}),
    })
    else result = updateRepasses(ids, {
      ...(enabled.has('beneficiarioId') ? { beneficiario_id: draft.beneficiarioId } : {}),
      ...(enabled.has('papelBeneficiario') ? { papel_beneficiario: nullable(draft.papelBeneficiario) } : {}),
      ...(enabled.has('base') ? { base: nullable(draft.base) } : {}),
      ...(enabled.has('percentual') ? { percentual: numberOrNull(draft.percentual) } : {}),
      ...(enabled.has('valorPrevisto') ? { valor_previsto: numberOrNull(draft.valorPrevisto) } : {}),
      ...(enabled.has('previstoEm') ? { previsto_em: nullable(draft.previstoEm) } : {}),
      ...(enabled.has('formaPagamento') ? { forma_pagamento: nullable(draft.formaPagamento) } : {}),
      ...(enabled.has('observacoes') ? { observacoes: nullable(draft.observacoes) } : {}),
    })
    onSaved(result)
  }

  const fieldProps = (name: string) => mode === 'batch'
    ? { enabled: enabled.has(name), onEnabled: (active: boolean) => toggle(name, active) }
    : {}

  const submit = () => {
    if (mode === 'batch' && !reviewing) {
      setReviewing(true)
      return
    }
    save()
  }

  return <AppModal isOpen onClose={onClose} title={title} description={mode === 'batch' ? 'Marque somente os campos que devem ser aplicados a todas as linhas elegíveis.' : 'Somente campos persistidos no contrato v2.2.'} icon={<Save size={18} />} footer={<><button type="button" onClick={onClose} className="rounded-[6px] px-5 py-2.5 text-sm font-bold text-fg-3 hover:bg-bg-surface-3">Cancelar</button><button type="button" onClick={submit} disabled={mode === 'batch' && enabled.size === 0} className="rounded-full bg-accent-primary px-6 py-2.5 text-sm font-extrabold text-fg-on-brand disabled:opacity-50">{mode === 'create' ? 'Criar' : mode === 'batch' && !reviewing ? 'Revisar alterações' : mode === 'batch' ? `Alterar ${eligibleCount} elegíveis` : 'Salvar alterações'}</button></>}>
    <div className="max-h-[62vh] overflow-y-auto px-8 py-6">
      {mode === 'create' && <Field label="Documento"><select className={controlClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)}>{documents.map((document) => <option key={document.id} value={document.id}>{document.proposalType} · {document.proposalNumber ?? document.endorsementNumber ?? document.invoiceNumber ?? 'Sem número'}</option>)}</select></Field>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {mode !== 'batch' && <Field label="Número"><input className={controlClass} type="number" min="1" value={draft.numero} onChange={(event) => set('numero', event.target.value)} /></Field>}
        {kind === 'parcela' && <>
          <Field label="Vencimento" {...fieldProps('vencimento')}><input className={controlClass} type="date" value={draft.vencimento} onChange={(event) => set('vencimento', event.target.value)} /></Field>
          <Field label="Valor" {...fieldProps('valor')}><input className={controlClass} inputMode="decimal" value={draft.valor} onChange={(event) => set('valor', event.target.value)} /></Field>
          <Field label="Valor líquido" {...fieldProps('valorLiquido')}><input className={controlClass} inputMode="decimal" value={draft.valorLiquido} onChange={(event) => set('valorLiquido', event.target.value)} /></Field>
          <Field label="Forma de pagamento" {...fieldProps('formaPagamento')}><input className={controlClass} value={draft.formaPagamento} onChange={(event) => set('formaPagamento', event.target.value)} /></Field>
        </>}
        {kind === 'comissao' && <>
          <Field label="Tipo" {...fieldProps('tipoComissao')}><select className={controlClass} value={draft.tipoComissao} onChange={(event) => set('tipoComissao', event.target.value)}>{commissionTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
          <Field label="Percentual" {...fieldProps('percentual')}><input className={controlClass} inputMode="decimal" value={draft.percentual} onChange={(event) => set('percentual', event.target.value)} /></Field>
          <Field label="Base de cálculo" {...fieldProps('baseCalculo')}><input className={controlClass} inputMode="decimal" value={draft.baseCalculo} onChange={(event) => set('baseCalculo', event.target.value)} /></Field>
          <Field label="Valor previsto" {...fieldProps('valorPrevisto')}><input className={controlClass} inputMode="decimal" value={draft.valorPrevisto} onChange={(event) => set('valorPrevisto', event.target.value)} /></Field>
          <Field label="Prevista em" {...fieldProps('previstaEm')}><input className={controlClass} type="date" value={draft.previstaEm} onChange={(event) => set('previstaEm', event.target.value)} /></Field>
        </>}
        {kind === 'repasse' && <>
          <Field label="Beneficiário" {...fieldProps('beneficiarioId')}><select className={controlClass} value={draft.beneficiarioId} onChange={(event) => set('beneficiarioId', event.target.value)}><option value="">Selecione</option>{producers.map((producer) => <option key={producer.id} value={producer.id}>{producer.name}</option>)}</select></Field>
          <Field label="Papel" {...fieldProps('papelBeneficiario')}><select className={controlClass} value={draft.papelBeneficiario} onChange={(event) => set('papelBeneficiario', event.target.value)}><option value="PRODUTOR">Produtor</option><option value="GERENTE">Gerente</option></select></Field>
          <Field label="Base" {...fieldProps('base')}><select className={controlClass} value={draft.base} onChange={(event) => set('base', event.target.value)}><option value="COMISSAO">Comissão</option><option value="PREMIO_LIQUIDO">Prêmio líquido</option><option value="VALOR_FIXO">Valor fixo</option></select></Field>
          <Field label="Percentual" {...fieldProps('percentual')}><input className={controlClass} inputMode="decimal" value={draft.percentual} onChange={(event) => set('percentual', event.target.value)} /></Field>
          <Field label="Valor previsto" {...fieldProps('valorPrevisto')}><input className={controlClass} inputMode="decimal" value={draft.valorPrevisto} onChange={(event) => set('valorPrevisto', event.target.value)} /></Field>
          <Field label="Previsto em" {...fieldProps('previstoEm')}><input className={controlClass} type="date" value={draft.previstoEm} onChange={(event) => set('previstoEm', event.target.value)} /></Field>
          <Field label="Forma de pagamento" {...fieldProps('formaPagamento')}><input className={controlClass} value={draft.formaPagamento} onChange={(event) => set('formaPagamento', event.target.value)} /></Field>
        </>}
        <div className="sm:col-span-2"><Field label="Observações" {...fieldProps('observacoes')}><textarea className={`${controlClass} min-h-24 resize-y`} value={draft.observacoes} onChange={(event) => set('observacoes', event.target.value)} /></Field></div>
      </div>
      {mode === 'batch' && reviewing && <div className="mt-5 rounded-[8px] border border-accent-primary/25 bg-accent-primary-soft p-4"><p className="text-sm font-extrabold text-fg-1">Prévia da alteração coletiva</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div><span className="text-[10px] font-bold uppercase tracking-wide text-fg-4">Elegíveis</span><strong className="mt-1 block font-mono text-lg text-signal-success">{eligibleCount}</strong></div><div><span className="text-[10px] font-bold uppercase tracking-wide text-fg-4">Bloqueados</span><strong className="mt-1 block font-mono text-lg text-signal-warning">{blockedCount}</strong></div><div><span className="text-[10px] font-bold uppercase tracking-wide text-fg-4">Total antes</span><strong className="mt-1 block font-mono text-sm text-fg-2">{currency.format(beforeTotal)}</strong></div><div><span className="text-[10px] font-bold uppercase tracking-wide text-fg-4">Total depois</span><strong className="mt-1 block font-mono text-sm text-fg-2">{currency.format(afterTotal)}</strong></div><div><span className="text-[10px] font-bold uppercase tracking-wide text-fg-4">Campos</span><strong className="mt-1 block text-sm text-fg-2">{[...enabled].join(', ')}</strong></div></div><p className="mt-3 text-xs leading-5 text-fg-3">Linhas liquidadas ou conciliadas permanecerão intactas. Documento e número de origem não serão alterados.</p></div>}
    </div>
  </AppModal>
}

function getProducerOptions(): Array<{ id: string; name: string }> {
  return (getTable('produtores') as unknown as Array<{ id: string; nome?: string; ativo?: boolean }>)
    .filter((producer) => producer.ativo !== false)
    .map((producer) => ({ id: producer.id, name: producer.nome ?? 'Produtor sem nome' }))
}

interface SpecialField { key: string; label: string; type?: 'number' | 'date' }
const specialFields: Record<string, SpecialField[]> = {
  VEICULO: [
    { key: 'marca', label: 'Marca' }, { key: 'modelo', label: 'Modelo' },
    { key: 'versao', label: 'Versão' }, { key: 'ano_fabricacao', label: 'Ano fabricação', type: 'number' },
    { key: 'ano_modelo', label: 'Ano modelo', type: 'number' }, { key: 'placa', label: 'Placa' },
    { key: 'chassi', label: 'Chassi' }, { key: 'renavam', label: 'Renavam' },
    { key: 'uso', label: 'Uso' }, { key: 'condutor_principal_nome', label: 'Condutor principal' },
  ],
  IMOVEL: [
    { key: 'cep', label: 'CEP' }, { key: 'endereco', label: 'Endereço' },
    { key: 'numero', label: 'Número' }, { key: 'complemento', label: 'Complemento' },
    { key: 'bairro', label: 'Bairro' }, { key: 'cidade', label: 'Cidade' },
    { key: 'uf', label: 'UF' }, { key: 'tipo_imovel', label: 'Tipo de imóvel' },
    { key: 'tipo_ocupacao', label: 'Ocupação' }, { key: 'area_m2', label: 'Área (m²)', type: 'number' },
    { key: 'valor_imovel', label: 'Valor do imóvel', type: 'number' },
  ],
  EMPRESA: [
    { key: 'cnpj_risco', label: 'CNPJ do risco' }, { key: 'razao_social_risco', label: 'Razão social' },
    { key: 'atividade', label: 'Atividade' }, { key: 'cnae', label: 'CNAE' },
    { key: 'faturamento_anual', label: 'Faturamento anual', type: 'number' },
    { key: 'cep', label: 'CEP' }, { key: 'endereco', label: 'Endereço' },
    { key: 'numero', label: 'Número' }, { key: 'cidade', label: 'Cidade' }, { key: 'uf', label: 'UF' },
  ],
  VIDA: [
    { key: 'nome_grupo', label: 'Grupo segurado' }, { key: 'n_vidas', label: 'Número de vidas', type: 'number' },
    { key: 'certificado_individual', label: 'Certificado' },
    { key: 'capital_individual', label: 'Capital individual', type: 'number' },
    { key: 'beneficiarios_texto', label: 'Beneficiários' },
  ],
}

export function ItemEditorModal({ item, specialization, apoliceId, propostaId, nextNumber, onClose, onSaved }: {
  item?: ApoliceItemRow
  specialization?: Record<string, unknown>
  apoliceId: string
  propostaId: string
  nextNumber: number
  onClose: () => void
  onSaved: () => void
}) {
  const [riskType, setRiskType] = useState(item?.risk_type ?? 'VEICULO')
  const [numeroItem, setNumeroItem] = useState(String(item?.numero_item ?? nextNumber))
  const [descricao, setDescricao] = useState(item?.descricao ?? '')
  const [externalId, setExternalId] = useState(item?.identificador_externo ?? '')
  const [riskValue, setRiskValue] = useState(item?.valor_risco?.toString() ?? '')
  const [address, setAddress] = useState(item?.endereco_risco_resumo ?? '')
  const [notes, setNotes] = useState(item?.observacoes ?? '')
  const [special, setSpecial] = useState<Record<string, string>>(() => Object.fromEntries(
    Object.entries(specialization ?? {}).filter(([key]) => key !== 'apolice_item_id').map(([key, value]) => [key, value == null ? '' : String(value)]),
  ))
  const save = () => {
    if (!descricao.trim()) return
    const normalized = Object.fromEntries((specialFields[riskType] ?? []).map((field) => [
      field.key,
      field.type === 'number' ? numberOrNull(special[field.key] ?? '') : nullable(special[field.key] ?? ''),
    ]))
    saveItem({
      id: item?.id, apoliceId, propostaId, riskType,
      numeroItem: numberOrNull(numeroItem), descricao: descricao.trim(),
      identificadorExterno: nullable(externalId), valorRisco: numberOrNull(riskValue),
      enderecoRiscoResumo: nullable(address), observacoes: nullable(notes),
      specialization: normalized,
    })
    onSaved()
  }
  return <AppModal isOpen onClose={onClose} title={item ? 'Corrigir item segurado' : 'Novo item segurado'} description="O formulário usa somente campos mapeados no contrato v2.2." icon={<Layers3 size={18} />} size="lg" footer={<><button type="button" onClick={onClose} className="rounded-[6px] px-5 py-2.5 text-sm font-bold text-fg-3">Cancelar</button><button type="button" onClick={save} className="rounded-full bg-accent-primary px-6 py-2.5 text-sm font-extrabold text-fg-on-brand">Salvar item</button></>}>
    <div className="max-h-[62vh] overflow-y-auto px-8 py-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Tipo do risco"><select className={controlClass} value={riskType} disabled={Boolean(item)} onChange={(event) => setRiskType(event.target.value)}>{['VEICULO', 'IMOVEL', 'EMPRESA', 'VIDA'].map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
        <Field label="Número do item"><input className={controlClass} type="number" min="1" value={numeroItem} onChange={(event) => setNumeroItem(event.target.value)} /></Field>
        <Field label="Descrição"><input className={controlClass} value={descricao} onChange={(event) => setDescricao(event.target.value)} /></Field>
        <Field label="Identificador externo"><input className={controlClass} value={externalId} onChange={(event) => setExternalId(event.target.value)} /></Field>
        <Field label="Valor do risco"><input className={controlClass} inputMode="decimal" value={riskValue} onChange={(event) => setRiskValue(event.target.value)} /></Field>
        <Field label="Endereço resumido"><input className={controlClass} value={address} onChange={(event) => setAddress(event.target.value)} /></Field>
      </div>
      <div className="mt-6 border-t border-border-1 pt-5"><h3 className="mb-4 text-sm font-extrabold text-fg-1">Dados de {riskType.toLocaleLowerCase('pt-BR')}</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(specialFields[riskType] ?? []).map((field) => <Field key={field.key} label={field.label}><input className={controlClass} type={field.type ?? 'text'} value={special[field.key] ?? ''} onChange={(event) => setSpecial((current) => ({ ...current, [field.key]: event.target.value }))} /></Field>)}</div></div>
      <div className="mt-5"><Field label="Observações"><textarea className={`${controlClass} min-h-24 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></div>
    </div>
  </AppModal>
}

export function CoverageEditorModal({ coverage, itemId, propostaId, catalog, onClose, onSaved }: {
  coverage?: ItemCoberturaRow
  itemId: string
  propostaId: string
  catalog: Array<{ id: string; name: string }>
  onClose: () => void
  onSaved: () => void
}) {
  const [catalogId, setCatalogId] = useState(coverage?.cobertura_id ?? '')
  const [capital, setCapital] = useState(coverage?.capital_lmi?.toString() ?? '')
  const [deductible, setDeductible] = useState(coverage?.franquia_valor?.toString() ?? '')
  const [deductibleType, setDeductibleType] = useState(coverage?.franquia_tipo ?? 'VALOR')
  const [premium, setPremium] = useState(coverage?.premio?.toString() ?? '')
  const [netPremium, setNetPremium] = useState(coverage?.premio_liquido?.toString() ?? '')
  const [waitingDays, setWaitingDays] = useState(coverage?.carencia_dias?.toString() ?? '')
  const [participation, setParticipation] = useState(coverage?.participacao_obrigatoria_pct?.toString() ?? '')
  const [start, setStart] = useState(coverage?.vigencia_inicio ?? '')
  const [end, setEnd] = useState(coverage?.vigencia_fim ?? '')
  const [notes, setNotes] = useState(coverage?.observacoes ?? '')
  const save = () => {
    if (!catalogId) return
    saveCoverage({
      id: coverage?.id, itemId, propostaId, coberturaId: catalogId,
      capitalLmi: numberOrNull(capital), franquiaValor: numberOrNull(deductible),
      franquiaTipo: nullable(deductibleType), premio: numberOrNull(premium),
      premioLiquido: numberOrNull(netPremium), carenciaDias: numberOrNull(waitingDays),
      participacaoObrigatoriaPct: numberOrNull(participation), vigenciaInicio: nullable(start),
      vigenciaFim: nullable(end), observacoes: nullable(notes),
    })
    onSaved()
  }
  return <AppModal isOpen onClose={onClose} title={coverage ? 'Alterar cobertura' : 'Nova cobertura'} description={coverage ? 'A versão anterior será preservada no histórico.' : 'Cobertura vinculada ao item e ao documento responsável.'} size="lg" footer={<><button type="button" onClick={onClose} className="rounded-[6px] px-5 py-2.5 text-sm font-bold text-fg-3">Cancelar</button><button type="button" onClick={save} className="rounded-full bg-accent-primary px-6 py-2.5 text-sm font-extrabold text-fg-on-brand">Salvar cobertura</button></>}>
    <div className="max-h-[62vh] overflow-y-auto px-8 py-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Cobertura"><select className={controlClass} value={catalogId} onChange={(event) => setCatalogId(event.target.value)}><option value="">Selecione</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      <Field label="Capital / LMI"><input className={controlClass} inputMode="decimal" value={capital} onChange={(event) => setCapital(event.target.value)} /></Field>
      <Field label="Franquia"><input className={controlClass} inputMode="decimal" value={deductible} onChange={(event) => setDeductible(event.target.value)} /></Field>
      <Field label="Tipo da franquia"><select className={controlClass} value={deductibleType} onChange={(event) => setDeductibleType(event.target.value)}><option value="VALOR">Valor</option><option value="PERCENTUAL">Percentual</option></select></Field>
      <Field label="Prêmio"><input className={controlClass} inputMode="decimal" value={premium} onChange={(event) => setPremium(event.target.value)} /></Field>
      <Field label="Prêmio líquido"><input className={controlClass} inputMode="decimal" value={netPremium} onChange={(event) => setNetPremium(event.target.value)} /></Field>
      <Field label="Carência (dias)"><input className={controlClass} type="number" min="0" value={waitingDays} onChange={(event) => setWaitingDays(event.target.value)} /></Field>
      <Field label="Participação obrigatória (%)"><input className={controlClass} inputMode="decimal" value={participation} onChange={(event) => setParticipation(event.target.value)} /></Field>
      <Field label="Início da vigência"><input className={controlClass} type="date" value={start} onChange={(event) => setStart(event.target.value)} /></Field>
      <Field label="Fim da vigência"><input className={controlClass} type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></Field>
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Observações"><textarea className={`${controlClass} min-h-24 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></div>
    </div></div>
  </AppModal>
}
