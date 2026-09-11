import { opportunityPermissionContext } from '../modules/plataforma/platformDomain'
import { useState, type FormEvent, type ReactNode } from 'react'
import './ManualQuotePage.css'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { useCalculation, useCalculationEditorLookups } from '../hooks/useCalculos'
import { useOportunidade } from '../hooks/useOportunidades'
import { usePermission } from '../hooks/usePermission'
import { useConfirm } from '../components/feedback/systemFeedbackContext'
import { createManualQuote, manualQuoteCoverageOptions, type ManualQuoteCoverage, type ManualQuotePayment } from '../modules/comercial/manualQuoteDomain'

const inputClass = 'mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:outline-none focus:ring-2 focus:ring-accent-primary'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-full border border-border-1 px-4 py-2 text-sm font-bold text-fg-2 hover:bg-bg-surface-2'
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-sm font-bold text-fg-on-brand hover:bg-accent-primary-hover disabled:opacity-50'
const nullableNumber = (value: string) => value === '' ? null : Number(value)
const emptyPayment = (index: number): ManualQuotePayment => ({ codigo_opcao: `OPCAO_${index}`, forma_pagamento: 'PIX', quantidade_parcelas: 1, valor_entrada: null, valor_parcela: null, valor_total: null, juros_pct: null, adicional_fracionamento: null, primeiro_vencimento: null, principal: index === 1, ordem: index })

export default function ManualQuotePage() {
  const { oportunidadeId, calculoId } = useParams()
  const calculation = useCalculation(calculoId)
  const opportunity = useOportunidade(oportunidadeId)
  const lookups = useCalculationEditorLookups(opportunity.data?.tenant_id, opportunity.data?.filial_id, calculation.data?.calculation.ramo_id)
  const { can } = usePermission('comercial', opportunityPermissionContext(opportunity.data))
  if (calculation.isLoading || opportunity.isLoading || lookups.isLoading) return <p>Carregando cotação…</p>
  if (!calculation.data || !opportunity.data || !lookups.data || calculation.data.calculation.oportunidade_id !== oportunidadeId) return <p role="alert">Cálculo indisponível nesta oportunidade.</p>
  if (!can('create')) return <p role="alert">Seu perfil não permite cadastrar cotações.</p>
  return <ManualQuoteForm key={calculoId} calculationId={calculation.data.calculation.id} opportunityId={opportunity.data.id} title={calculation.data.calculation.rotulo_versao ?? 'Cálculo'} commission={calculation.data.calculation.comissao_sugerida_pct ?? 0} insurers={lookups.data.insurers} />
}

function ManualQuoteForm({ calculationId, opportunityId, title, commission, insurers }: { calculationId: string; opportunityId: string; title: string; commission: number; insurers: { id: string; nome: string }[] }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const [insurerId, setInsurerId] = useState('')
  const [number, setNumber] = useState('')
  const [premium, setPremium] = useState('')
  const [netPremium, setNetPremium] = useState('')
  const [iof, setIof] = useState('')
  const [commissionPct, setCommissionPct] = useState(String(commission))
  const [validity, setValidity] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [message, setMessage] = useState('')
  const [coverages, setCoverages] = useState(() => manualQuoteCoverageOptions(calculationId))
  const [payments, setPayments] = useState(() => [emptyPayment(1)])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const back = `/oportunidades/${opportunityId}/calculos/${calculationId}`
  const leave = async () => {
    if (await confirm({ title: 'Sair da cotação manual?', description: 'Os dados ainda não registrados serão descartados.', confirmLabel: 'Sair sem salvar', tone: 'warning' })) navigate(back)
  }
  const updateCoverage = (index: number, patch: Partial<ManualQuoteCoverage>) => setCoverages((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row))
  const updatePayment = (index: number, patch: Partial<ManualQuotePayment>) => setPayments((current) => current.map((row, i) => i === index ? { ...row, ...patch } : patch.principal ? { ...row, principal: false } : row))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(null)
    try {
      createManualQuote({ calculationId, insurerId, number, premium: premium === '' ? NaN : Number(premium), netPremium: netPremium === '' ? NaN : Number(netPremium), iof: nullableNumber(iof), commissionPct: commissionPct === '' ? NaN : Number(commissionPct), validity, restrictions, message, coverages, payments })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['calculation-executions', calculationId] }),
        queryClient.invalidateQueries({ queryKey: ['commercial-presentation', opportunityId] }),
      ])
      navigate(back)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível registrar a cotação.'); setSaving(false) }
  }
  return <form onSubmit={(event) => void submit(event)} className="manual-quote-page space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><button type="button" onClick={() => void leave()} className={buttonClass}><ArrowLeft size={15} /> Voltar ao cálculo</button><h1 className="mt-4 text-2xl font-bold text-fg-1">Registrar cotação manual</h1><p className="mt-1 text-sm text-fg-3">{title} · informe o resultado recebido da seguradora.</p></div><button disabled={saving} className={primaryButton}><Save size={16} /> {saving ? 'Registrando…' : 'Registrar cotação'}</button></header>
    {error && <p role="alert" className="rounded-[6px] bg-signal-danger/10 p-4 text-sm text-signal-danger">{error}</p>}
    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5"><h2 className="text-lg font-bold">Resultado da seguradora</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Seguradora"><select required className={inputClass} value={insurerId} onChange={(event) => setInsurerId(event.target.value)}><option value="">Selecione</option>{insurers.map((row) => <option key={row.id} value={row.id}>{row.nome}</option>)}</select></Field>
      <Field label="Número da cotação"><input required className={inputClass} value={number} onChange={(event) => setNumber(event.target.value)} /></Field>
      <Field label="Validade"><input required type="date" className={inputClass} value={validity} onChange={(event) => setValidity(event.target.value)} /></Field>
      <Field label="Comissão (%)"><input required type="number" min="0" max="100" step="0.01" className={inputClass} value={commissionPct} onChange={(event) => setCommissionPct(event.target.value)} /></Field>
      <Field label="Prêmio total (R$)"><input required type="number" min="0" step="0.01" className={inputClass} value={premium} onChange={(event) => setPremium(event.target.value)} /></Field>
      <Field label="Prêmio líquido (R$)"><input required type="number" min="0" step="0.01" className={inputClass} value={netPremium} onChange={(event) => setNetPremium(event.target.value)} /></Field>
      <Field label="IOF (R$)"><input type="number" min="0" step="0.01" className={inputClass} value={iof} onChange={(event) => setIof(event.target.value)} /></Field>
    </div></section>
    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5"><h2 className="text-lg font-bold">Coberturas retornadas</h2><p className="mt-1 text-sm text-fg-3">Marque as coberturas incluídas e informe os valores recebidos. Campos vazios permanecem não informados.</p><div className="mt-4 divide-y divide-border-1">{coverages.map((row, index) => <div key={row.chave_resultado} className="py-4">
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={row.incluida === true} onChange={(event) => updateCoverage(index, { incluida: event.target.checked })} />{row.nome_informado}</label>
      {row.incluida && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label={`${row.nome_informado} — Limite (R$)`} value={row.limite_aceito} onChange={(value) => updateCoverage(index, { limite_aceito: value })} />
        <NumberField label={`${row.nome_informado} — FIPE (%)`} value={row.percentual_fipe_aceito} onChange={(value) => updateCoverage(index, { percentual_fipe_aceito: value })} />
        <NumberField label={`${row.nome_informado} — Franquia (R$)`} value={row.franquia_valor} onChange={(value) => updateCoverage(index, { franquia_valor: value })} />
        <NumberField label={`${row.nome_informado} — Carência (dias)`} value={row.carencia_dias} onChange={(value) => updateCoverage(index, { carencia_dias: value })} />
        <NumberField label={`${row.nome_informado} — Participação (%)`} value={row.participacao_obrigatoria_pct} onChange={(value) => updateCoverage(index, { participacao_obrigatoria_pct: value })} />
        <Field label={`${row.nome_informado} — Cláusula`}><input className={inputClass} value={row.clausula_texto ?? ''} onChange={(event) => updateCoverage(index, { clausula_texto: event.target.value || null })} /></Field>
      </div>}
    </div>)}</div></section>
    <section className="rounded-[8px] border border-border-1 bg-bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Opções de pagamento</h2><button type="button" className={buttonClass} onClick={() => setPayments((current) => [...current, emptyPayment(Math.max(...current.map((row) => row.ordem ?? 0), 0) + 1)])}><Plus size={15} /> Adicionar opção</button></div>
      {payments.map((row, index) => <div key={row.codigo_opcao} className="mt-4 border-t border-border-1 pt-4"><div className="flex items-center justify-between"><label className="text-sm font-bold"><input type="radio" name="principal" checked={row.principal === true} onChange={() => updatePayment(index, { principal: true })} /> Opção {index + 1} · principal</label><button type="button" disabled={payments.length === 1} aria-label={`Remover pagamento ${index + 1}`} className={buttonClass} onClick={() => setPayments((current) => current.filter((_, i) => i !== index))}><Trash2 size={14} /></button></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`Forma de pagamento ${index + 1}`}><select className={inputClass} value={row.forma_pagamento} onChange={(event) => updatePayment(index, { forma_pagamento: event.target.value })}><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="CARTAO_CREDITO">Cartão de crédito</option><option value="DEBITO_CONTA">Débito em conta</option></select></Field>
        <NumberField label={`Quantidade de parcelas ${index + 1}`} value={row.quantidade_parcelas} onChange={(value) => updatePayment(index, { quantidade_parcelas: value ?? 0 })} />
        <NumberField label={`Valor da parcela ${index + 1}`} value={row.valor_parcela} onChange={(value) => updatePayment(index, { valor_parcela: value })} />
        <NumberField label={`Total do pagamento ${index + 1}`} value={row.valor_total} onChange={(value) => updatePayment(index, { valor_total: value })} />
        <NumberField label={`Entrada ${index + 1}`} value={row.valor_entrada} onChange={(value) => updatePayment(index, { valor_entrada: value })} />
        <NumberField label={`Juros (%) ${index + 1}`} value={row.juros_pct} onChange={(value) => updatePayment(index, { juros_pct: value })} />
        <Field label={`Primeiro vencimento ${index + 1}`}><input type="date" className={inputClass} value={row.primeiro_vencimento ?? ''} onChange={(event) => updatePayment(index, { primeiro_vencimento: event.target.value || null })} /></Field>
      </div></div>)}
    </section>
    <section className="grid gap-4 sm:grid-cols-2"><Field label="Restrições da seguradora"><textarea className={inputClass} rows={3} value={restrictions} onChange={(event) => setRestrictions(event.target.value)} /></Field><Field label="Mensagem da seguradora"><textarea className={inputClass} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} /></Field></section>
    <div className="flex justify-end"><button disabled={saving} className={primaryButton}><Save size={16} /> Registrar cotação</button></div>
  </form>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-xs font-bold text-fg-2">{label}{children}</label> }
function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) { return <Field label={label}><input type="number" min="0" step="0.01" className={inputClass} value={value ?? ''} onChange={(event) => onChange(nullableNumber(event.target.value))} /></Field> }
