import { opportunityPermissionContext } from '../modules/plataforma/platformDomain'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import './ManualQuotePage.css'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useCalculation, useCalculationEditorLookups } from '../hooks/useCalculos'
import { useCanonicalCalculationCommands } from '../hooks/useCanonicalCalculationCommands'
import { useCanonicalCalculationEditorData } from '../hooks/useCanonicalCalculationEditorData'
import { useOportunidade } from '../hooks/useOportunidades'
import { usePermission } from '../hooks/usePermission'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import { usesBackendDomainData } from '../lib/backendDomainApi'
import { isBackendRequestError } from '../lib/backendApi'
import { getBackendCalculationExecution, type ManualQuoteHttpInput } from '../lib/backendCalculationApi'
import type { CreateManualExecutionCommand, RetryManualExecutionCommand } from '../lib/canonicalCalculationCommands'
import type { BackendCoverageOption } from '../lib/calculationHttpContracts'
import type { CalculoExecucaoRow } from '../types/database'
import { createManualQuote, manualQuoteCoverageOptions, type ManualQuoteCoverage, type ManualQuotePayment } from '../modules/comercial/manualQuoteDomain'

const inputClass = 'mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:outline-none focus:ring-2 focus:ring-accent-primary'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-full border border-border-1 px-4 py-2 text-sm font-bold text-fg-2 hover:bg-bg-surface-2'
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-bold text-fg-on-brand hover:bg-accent-primary-hover disabled:opacity-50'
const nullableNumber = (value: string) => value === '' ? null : Number(value)
const emptyPayment = (index: number): ManualQuotePayment => ({ codigo_opcao: `OPCAO_${index}`, forma_pagamento: usesBackendDomainData ? '' : 'PIX', quantidade_parcelas: usesBackendDomainData ? 0 : 1, valor_entrada: null, valor_parcela: null, valor_total: null, juros_pct: null, adicional_fracionamento: null, primeiro_vencimento: null, principal: usesBackendDomainData ? false : index === 1, ordem: index })
const connectedCoverageOptions = (catalog: BackendCoverageOption[]): ManualQuoteCoverage[] => catalog.map((row, index) => ({
  cobertura_id: row.id,
  chave_resultado: row.id,
  codigo_externo: null,
  nome_informado: row.nome ?? row.codigo ?? 'Cobertura sem nome',
  incluida: null,
  limite_aceito: null,
  percentual_fipe_aceito: null,
  franquia_tipo: null,
  franquia_valor: null,
  premio: null,
  carencia_dias: null,
  participacao_obrigatoria_pct: null,
  clausula_texto: null,
  observacao_seguradora: null,
  ordem: index + 1,
}))

export default function ManualQuotePage() {
  const { oportunidadeId, calculoId } = useParams()
  const [searchParams] = useSearchParams()
  const executionId = searchParams.get('tentativa')
  const originalExecution = useQuery({
    queryKey: ['manual-quote-original-execution', calculoId, executionId],
    enabled: Boolean(usesBackendDomainData && executionId && calculoId),
    queryFn: ({ signal }) => getBackendCalculationExecution(executionId!, signal),
  })
  const calculation = useCalculation(calculoId)
  const opportunity = useOportunidade(oportunidadeId)
  const canonicalEditor = useCanonicalCalculationEditorData(oportunidadeId, calculation.data?.calculation.ramo_id)
  const lookups = useCalculationEditorLookups(opportunity.data?.tenant_id, opportunity.data?.filial_id, calculation.data?.calculation.ramo_id)
  const { can } = usePermission('comercial', opportunityPermissionContext(opportunity.data))
  const editorLoading = usesBackendDomainData ? canonicalEditor.isLoading : lookups.isLoading
  const editorError = usesBackendDomainData ? canonicalEditor.isError || !canonicalEditor.data : lookups.isError || !lookups.data
  if (calculation.isLoading || opportunity.isLoading || editorLoading || originalExecution.isLoading) return <p>Carregando cotação…</p>
  if (usesBackendDomainData && executionId && (originalExecution.isError || !originalExecution.data || originalExecution.data.calculo_id !== calculoId || originalExecution.data.motor !== 'MANUAL')) return <p role="alert">Tentativa indisponível para este cálculo.</p>
  if (!calculation.data || !opportunity.data || editorError || calculation.data.calculation.oportunidade_id !== oportunidadeId) return <p role="alert">Cálculo indisponível nesta oportunidade.</p>
  if (!can('create')) return <p role="alert">Seu perfil não permite cadastrar cotações.</p>
  return <ManualQuoteForm
    key={`${calculoId}:${executionId ?? 'nova'}`}
    calculationId={calculation.data.calculation.id}
    opportunityId={opportunity.data.id}
    title={calculation.data.calculation.rotulo_versao ?? 'Cálculo'}
    commission={calculation.data.calculation.comissao_sugerida_pct}
    insurers={usesBackendDomainData ? canonicalEditor.data?.insurers ?? [] : lookups.data?.insurers ?? []}
    initialCoverages={usesBackendDomainData ? connectedCoverageOptions(canonicalEditor.data?.coverages ?? []) : manualQuoteCoverageOptions(calculation.data.calculation.id)}
    originalExecution={originalExecution.data ?? null}
  />
}

function ManualQuoteForm({ calculationId, opportunityId, title, commission, insurers, initialCoverages, originalExecution }: { calculationId: string; opportunityId: string; title: string; commission: number | null; insurers: { id: string; nome: string }[]; initialCoverages: ManualQuoteCoverage[]; originalExecution: CalculoExecucaoRow | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const commands = useCanonicalCalculationCommands()
  const [insurerId, setInsurerId] = useState(originalExecution?.seguradora_id ?? '')
  const [number, setNumber] = useState('')
  const [premium, setPremium] = useState('')
  const [netPremium, setNetPremium] = useState('')
  const [iof, setIof] = useState('')
  const [commissionPct, setCommissionPct] = useState(usesBackendDomainData ? '' : String(commission ?? 0))
  const [validity, setValidity] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [message, setMessage] = useState('')
  const [coverages, setCoverages] = useState(initialCoverages)
  const [payments, setPayments] = useState(() => usesBackendDomainData ? [] : [emptyPayment(1)])
  const [execution, setExecution] = useState<CalculoExecucaoRow | null>(originalExecution)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [recoveryLocked, setRecoveryLocked] = useState(false)
  const [failedAction, setFailedAction] = useState<'prepare' | 'quote' | 'retry' | 'cancel'>('quote')
  const actionInProgress = useRef(false)
  const pendingPreparation = useRef<CreateManualExecutionCommand | null>(null)
  const pendingRetry = useRef<RetryManualExecutionCommand | null>(null)
  const pendingQuote = useRef<ManualQuoteHttpInput | null>(null)
  const isOpen = execution ? ['AGUARDANDO', 'EM_EXECUCAO', 'PENDENTE_DADOS'].includes(execution.status) : false
  const back = `/oportunidades/${opportunityId}/calculos/${calculationId}`
  const leave = async () => {
    if (actionInProgress.current) return
    if (await confirm({ title: 'Sair da cotação manual?', description: 'Os dados ainda não registrados serão descartados.', confirmLabel: 'Sair sem salvar', tone: 'warning' })) navigate(back)
  }
  const updateCoverage = (index: number, patch: Partial<ManualQuoteCoverage>) => setCoverages((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row))
  const updatePayment = (index: number, patch: Partial<ManualQuotePayment>) => setPayments((current) => current.map((row, i) => i === index ? { ...row, ...patch } : patch.principal ? { ...row, principal: false } : row))
  const save = async () => {
    if (actionInProgress.current) return
    actionInProgress.current = true
    setSaving(true); setError(null)
    try {
      if (usesBackendDomainData) {
        if (execution && !isOpen) throw new Error('Prepare uma nova tentativa antes de registrar o resultado.')
        const activeExecution = execution
          ? execution
          : await commands.createManualExecution.mutateAsync(pendingPreparation.current ??= {
              calculationId,
              insurerId,
              commissionOverridePct: nullableNumber(commissionPct),
            })
        setExecution(activeExecution)
        await commands.recordManualQuote.mutateAsync({
          opportunityId,
          calculationId,
          executionId: activeExecution.id,
          quote: pendingQuote.current ??= {
            numero_cotacao_seguradora: number.trim() || null,
            premio_total: premium === '' ? null : Number(premium),
            premio_liquido: nullableNumber(netPremium),
            iof: nullableNumber(iof),
            adicional_fracionamento: null,
            comissao_valor: null,
            validade: validity || null,
            link_proposta: null,
            mensagem_seguradora: message.trim() || null,
            restricoes: restrictions.trim() || null,
            observacao_interna: null,
            coverages: coverages.filter(row => row.incluida !== null),
            installments: payments,
          },
        })
      } else {
        createManualQuote({ calculationId, insurerId, number, premium: premium === '' ? NaN : Number(premium), netPremium: netPremium === '' ? NaN : Number(netPremium), iof: nullableNumber(iof), commissionPct: commissionPct === '' ? NaN : Number(commissionPct), validity, restrictions, message, coverages, payments })
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['calculation-executions', calculationId] }),
        queryClient.invalidateQueries({ queryKey: ['commercial-presentation', opportunityId] }),
      ])
      notify({ title: 'Cotação registrada', description: 'A tentativa manual e o resultado foram gravados sem aprovar a cotação.', tone: 'success' })
      navigate(back)
    } catch (cause) {
      setFailedAction('quote')
      if (isBackendRequestError(cause, 400)) {
        pendingQuote.current = null
        if (!execution) pendingPreparation.current = null
        setRecoveryLocked(false)
      } else setRecoveryLocked(usesBackendDomainData)
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar a cotação.'); setSaving(false)
    }
    finally { actionInProgress.current = false }
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await save()
  }
  const prepareAttempt = async () => {
    if (actionInProgress.current || !insurerId || execution) return
    actionInProgress.current = true
    setSaving(true); setError(null)
    try {
      const prepared = await commands.createManualExecution.mutateAsync(pendingPreparation.current ??= {
        calculationId, insurerId, commissionOverridePct: nullableNumber(commissionPct),
      })
      setExecution(prepared)
      setRecoveryLocked(false)
      notify({ title: 'Tentativa preparada', description: 'Informe somente o resultado recebido da seguradora.', tone: 'success' })
    } catch (cause) {
      setFailedAction('prepare')
      if (isBackendRequestError(cause, 400)) { pendingPreparation.current = null; setRecoveryLocked(false) }
      else setRecoveryLocked(true)
      setError(cause instanceof Error ? cause.message : 'Não foi possível preparar a tentativa.')
    } finally { actionInProgress.current = false; setSaving(false) }
  }
  const cancelAttempt = async () => {
    if (!execution || actionInProgress.current) return
    const accepted = await confirm({ title: 'Cancelar tentativa manual?', description: 'O formulário será mantido para permitir uma nova tentativa explícita.', confirmLabel: 'Cancelar tentativa', tone: 'warning' })
    if (!accepted) return
    actionInProgress.current = true
    setSaving(true)
    try {
      const cancelled = await commands.cancelManualExecution.mutateAsync({ executionId: execution.id })
      setExecution(cancelled)
      pendingQuote.current = null
      setRecoveryLocked(false)
      setError(null)
      notify({ title: 'Tentativa cancelada', description: 'Nenhum resultado foi criado.', tone: 'success' })
    } catch (cause) {
      setFailedAction('cancel')
      setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar a tentativa.')
    } finally {
      actionInProgress.current = false
      setSaving(false)
    }
  }
  const retryAttempt = async () => {
    if (!execution || actionInProgress.current) return
    actionInProgress.current = true
    setSaving(true); setError(null)
    try {
      const retried = await commands.retryManualExecution.mutateAsync(pendingRetry.current ??= { executionId: execution.id, commissionOverridePct: nullableNumber(commissionPct) })
      setExecution(retried)
      pendingQuote.current = null
      pendingPreparation.current = null
      pendingRetry.current = null
      setRecoveryLocked(false)
      notify({ title: 'Nova tentativa preparada', description: 'O histórico anterior foi preservado. Revise e registre o resultado.', tone: 'success' })
    } catch (cause) {
      setFailedAction('retry')
      setRecoveryLocked(true)
      setError(cause instanceof Error ? cause.message : 'Não foi possível preparar a nova tentativa.')
    } finally {
      actionInProgress.current = false
      setSaving(false)
    }
  }
  return <form onSubmit={(event) => void submit(event)} className="manual-quote-page space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><button type="button" disabled={saving} onClick={() => void leave()} className={buttonClass}><ArrowLeft size={15} /> Voltar ao cálculo</button><h1 className="mt-4 text-2xl font-bold text-fg-1">Registrar cotação manual</h1><p className="mt-1 text-sm text-fg-3">{title} · informe o resultado recebido da seguradora.</p></div><button disabled={saving || (usesBackendDomainData && Boolean(execution) && !isOpen)} className={primaryButton}><Save size={16} /> {saving ? 'Processando…' : 'Registrar cotação'}</button></header>
    {error && <div role="alert" className="rounded-[6px] border border-signal-danger/20 bg-signal-danger/10 p-4 text-sm text-signal-danger"><p className="font-bold">{error}</p>{recoveryLocked && <p className="mt-1">Os dados enviados foram preservados. Recupere a resposta antes de editar.</p>}<div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void ({ prepare: prepareAttempt, quote: save, cancel: cancelAttempt, retry: retryAttempt }[failedAction])()} className={buttonClass}><RefreshCw size={14} /> Tentar novamente</button>{execution && isOpen && <button type="button" disabled={saving} onClick={() => void cancelAttempt()} className={buttonClass}><Ban size={14} /> Cancelar tentativa</button>}</div></div>}
    {usesBackendDomainData && !execution && !error && <div className="flex justify-end"><button type="button" disabled={saving || !insurerId} onClick={() => void prepareAttempt()} className={buttonClass}>Preparar tentativa manual</button></div>}
    {usesBackendDomainData && execution && !error && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] bg-accent-primary-soft p-4 text-sm text-fg-2"><span className="flex items-center gap-3">{saving && <Loader2 size={16} className="animate-spin text-accent-primary" />}<span><strong>Tentativa {execution.tentativa}</strong> · {execution.status.replaceAll('_', ' ').toLocaleLowerCase('pt-BR')}</span></span>{isOpen ? <button type="button" disabled={saving} onClick={() => void cancelAttempt()} className={buttonClass}><Ban size={14} /> Cancelar tentativa</button> : <button type="button" disabled={saving} onClick={() => void retryAttempt()} className={buttonClass}><RefreshCw size={14} /> Preparar nova tentativa</button>}</div>}
    <fieldset disabled={saving || recoveryLocked} className="min-w-0 space-y-5">
    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5"><h2 className="text-lg font-bold">Resultado da seguradora</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Seguradora"><select required disabled={Boolean(execution)} className={inputClass} value={insurerId} onChange={(event) => setInsurerId(event.target.value)}><option value="">Selecione</option>{insurers.map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}</select></Field>
      <Field label="Número da cotação"><input className={inputClass} value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Não informado" /></Field>
      <Field label="Validade"><input type="date" className={inputClass} value={validity} onChange={(event) => setValidity(event.target.value)} /></Field>
      <Field label="Comissão (%)"><input type="number" disabled={usesBackendDomainData && isOpen} min="0" max="100" step="0.01" className={inputClass} value={commissionPct} onChange={(event) => setCommissionPct(event.target.value)} placeholder={commission === null ? 'Padrão não informado' : `Herda ${commission}%`} /><span className="mt-1 block text-[11px] font-normal text-fg-3">Vazio mantém o padrão; zero é sobrescrita explícita.</span></Field>
      <Field label="Prêmio total (R$)"><input required type="number" min="0" step="0.01" className={inputClass} value={premium} onChange={(event) => setPremium(event.target.value)} /></Field>
      <Field label="Prêmio líquido (R$)"><input type="number" min="0" step="0.01" className={inputClass} value={netPremium} onChange={(event) => setNetPremium(event.target.value)} placeholder="Não informado" /></Field>
      <Field label="IOF (R$)"><input type="number" min="0" step="0.01" className={inputClass} value={iof} onChange={(event) => setIof(event.target.value)} /></Field>
    </div></section>
    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5"><h2 className="text-lg font-bold">Coberturas retornadas</h2><p className="mt-1 text-sm text-fg-3">Marque as coberturas incluídas e informe os valores recebidos. Campos vazios permanecem não informados.</p><div className="mt-4 divide-y divide-border-1">{coverages.map((row, index) => <div key={row.chave_resultado} className="py-4">
      {usesBackendDomainData ? <Field label={row.nome_informado ?? 'Cobertura'}><select className={inputClass} value={row.incluida === null ? '' : String(row.incluida)} onChange={(event) => updateCoverage(index, { incluida: event.target.value === '' ? null : event.target.value === 'true' })}><option value="">Não informado</option><option value="true">Incluída</option><option value="false">Não incluída</option></select></Field> : <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={row.incluida === true} onChange={(event) => updateCoverage(index, { incluida: event.target.checked })} />{row.nome_informado}</label>}
      {row.incluida && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label={`${row.nome_informado} — Limite (R$)`} value={row.limite_aceito} onChange={(value) => updateCoverage(index, { limite_aceito: value })} />
        <NumberField label={`${row.nome_informado} — FIPE (%)`} value={row.percentual_fipe_aceito} onChange={(value) => updateCoverage(index, { percentual_fipe_aceito: value })} />
        <NumberField label={`${row.nome_informado} — Franquia (R$)`} value={row.franquia_valor} onChange={(value) => updateCoverage(index, { franquia_valor: value })} />
        <NumberField label={`${row.nome_informado} — Carência (dias)`} value={row.carencia_dias} onChange={(value) => updateCoverage(index, { carencia_dias: value })} />
        <NumberField label={`${row.nome_informado} — Participação (%)`} value={row.participacao_obrigatoria_pct} onChange={(value) => updateCoverage(index, { participacao_obrigatoria_pct: value })} />
        <Field label={`${row.nome_informado} — Cláusula`}><input className={inputClass} value={row.clausula_texto ?? ''} onChange={(event) => updateCoverage(index, { clausula_texto: event.target.value || null })} /></Field>
      </div>}
    </div>)}</div></section>
    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Opções de pagamento</h2><p className="mt-1 text-sm text-fg-3">Adicione somente as opções efetivamente recebidas.</p></div><button type="button" className={buttonClass} onClick={() => setPayments((current) => [...current, emptyPayment(Math.max(...current.map((row) => row.ordem ?? 0), 0) + 1)])}><Plus size={15} /> Adicionar opção</button></div>
      {payments.length === 0 && <p className="mt-4 rounded-[6px] border border-dashed border-border-2 p-4 text-sm text-fg-3">Parcelamento não informado.</p>}
      {payments.map((row, index) => <div key={row.codigo_opcao} className="mt-4 border-t border-border-1 pt-4"><div className="flex items-center justify-between"><label className="text-sm font-bold"><input type="radio" name="principal" checked={row.principal === true} onChange={() => updatePayment(index, { principal: true })} /> Opção {index + 1} · principal</label><button type="button" aria-label={`Remover pagamento ${index + 1}`} className={buttonClass} onClick={() => setPayments((current) => current.filter((_, i) => i !== index))}><Trash2 size={14} /></button></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`Forma de pagamento ${index + 1}`}><select required className={inputClass} value={row.forma_pagamento} onChange={(event) => updatePayment(index, { forma_pagamento: event.target.value })}><option value="">Selecione a forma recebida</option><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="CARTAO_CREDITO">Cartão de crédito</option><option value="DEBITO_CONTA">Débito em conta</option></select></Field>
        <Field label={`Quantidade de parcelas ${index + 1}`}><input required type="number" min="1" step="1" className={inputClass} value={row.quantidade_parcelas || ''} onChange={(event) => updatePayment(index, { quantidade_parcelas: Number(event.target.value) })} /></Field>
        <NumberField label={`Valor da parcela ${index + 1}`} value={row.valor_parcela} onChange={(value) => updatePayment(index, { valor_parcela: value })} />
        <NumberField label={`Total do pagamento ${index + 1}`} value={row.valor_total} onChange={(value) => updatePayment(index, { valor_total: value })} />
        <NumberField label={`Entrada ${index + 1}`} value={row.valor_entrada} onChange={(value) => updatePayment(index, { valor_entrada: value })} />
        <NumberField label={`Juros (%) ${index + 1}`} value={row.juros_pct} onChange={(value) => updatePayment(index, { juros_pct: value })} />
        <Field label={`Primeiro vencimento ${index + 1}`}><input type="date" className={inputClass} value={row.primeiro_vencimento ?? ''} onChange={(event) => updatePayment(index, { primeiro_vencimento: event.target.value || null })} /></Field>
      </div></div>)}
    </section>
    <section className="grid gap-4 sm:grid-cols-2"><Field label="Restrições da seguradora"><textarea className={inputClass} rows={3} value={restrictions} onChange={(event) => setRestrictions(event.target.value)} /></Field><Field label="Mensagem da seguradora"><textarea className={inputClass} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} /></Field></section>
    </fieldset>
  </form>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-xs font-bold text-fg-2">{label}{children}</label> }
function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) { return <Field label={label}><input type="number" min="0" step="0.01" className={inputClass} value={value ?? ''} onChange={(event) => onChange(nullableNumber(event.target.value))} /></Field> }
