import { useEffect, useMemo, useState } from 'react'
import { Edit3, FileCheck2, Save, X } from 'lucide-react'
import { getTable } from '../../lib/inMemoryDb'
import type { Database } from '../../types/database'
import type { Proposal } from '../../types/proposta'
import { usePropostas } from '../../contexts/usePropostas'
import { useSystemFeedback } from '../feedback/systemFeedbackContext'
import { fmtCompetence, fmtDate, fmtMoney } from '../propostas/propostaFormat'
import { getDocumentNumber } from '../propostas/propostaSelectors'
import { validateDocumentDraft, type DocumentDraft } from './apoliceOverviewCore'

type PolicyPatch = Database['public']['Tables']['apolices']['Update']
type DocumentPatch = Database['public']['Tables']['propostas']['Update']
type Lookup = Record<string, string | number | boolean | null | undefined>

const inputClass = 'w-full rounded-[8px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 outline-none transition-colors placeholder:text-fg-4 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:opacity-60'
const activeStages = new Set(['Em Análise', 'Pendente', 'Pendência Resolvida', 'Recusada'])
const nullable = (value: string) => value.trim() || null
const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value.replace(',', '.'))

function documentDraft(document: Proposal): DocumentDraft {
  return {
    numero_proposta: document.proposalNumber ?? '',
    numero_endosso: document.endorsementNumber ?? '',
    numero_fatura: document.invoiceNumber ?? '',
    stage_id: document.stageId ?? '',
    endosso_subtipo_id: document.endorsementSubtypeId ?? '',
    cancelamento_motivo_id: document.cancellationReasonId ?? '',
    data_transmissao: document.transmissionDate ?? '',
    data_recebimento_seguradora: document.insurerReceiptDate ?? '',
    data_aceitacao: document.acceptanceDate ?? '',
    data_recusa: document.refusalDate ?? '',
    motivo_recusa: document.refusalReason ?? '',
    data_emissao: document.issueDate ?? '',
    vigencia_inicio: document.vigenciaInicial ?? '',
    vigencia_fim: document.vigenciaFinal ?? '',
    premio_total: document.totalPremium?.toString() ?? '',
    premio_liquido: document.netPremium?.toString() ?? '',
    forma_pagamento: document.paymentMethod ?? '',
    periodicidade_pagamento: document.paymentFrequency ?? '',
    qtd_parcelas: document.installmentCount?.toString() ?? '',
    primeira_parcela_vencimento: document.firstInstallmentDueDate ?? '',
    primeira_parcela_valor: document.firstInstallmentValue?.toString() ?? '',
    competencia_inicio: document.competenceStart ?? '',
    competencia_fim: document.competenceEnd ?? '',
  }
}

function toDocumentPatch(document: Proposal, draft: DocumentDraft, subtypes: Lookup[]): DocumentPatch {
  const subtype = subtypes.find((item) => item.id === draft.endosso_subtipo_id)
  return {
    numero_proposta: nullable(draft.numero_proposta),
    numero_endosso: nullable(draft.numero_endosso),
    numero_fatura: nullable(draft.numero_fatura),
    stage_id: draft.stage_id,
    endosso_subtipo_id: nullable(draft.endosso_subtipo_id),
    cancelamento_motivo_id: nullable(draft.cancelamento_motivo_id),
    tipo_movimento_endosso: document.proposalType === 'Endosso' ? String(subtype?.natureza_canonica ?? '') || null : null,
    data_transmissao: nullable(draft.data_transmissao),
    data_recebimento_seguradora: nullable(draft.data_recebimento_seguradora),
    data_aceitacao: nullable(draft.data_aceitacao),
    data_recusa: nullable(draft.data_recusa),
    motivo_recusa: nullable(draft.motivo_recusa),
    data_emissao: nullable(draft.data_emissao),
    vigencia_inicio: nullable(draft.vigencia_inicio),
    vigencia_fim: nullable(draft.vigencia_fim),
    premio_total: numberOrNull(draft.premio_total),
    premio_liquido: numberOrNull(draft.premio_liquido),
    forma_pagamento: nullable(draft.forma_pagamento),
    periodicidade_pagamento: nullable(draft.periodicidade_pagamento),
    qtd_parcelas: numberOrNull(draft.qtd_parcelas),
    primeira_parcela_vencimento: nullable(draft.primeira_parcela_vencimento),
    primeira_parcela_valor: numberOrNull(draft.primeira_parcela_valor),
    competencia_inicio: nullable(draft.competencia_inicio),
    competencia_fim: nullable(draft.competencia_fim),
  }
}

export function ApoliceOverview({ policy, document, onDirtyChange }: { policy: Proposal; document?: Proposal; onDirtyChange: (dirty: boolean) => void }) {
  const { updatePolicy, updateDocument } = usePropostas()
  const { notify } = useSystemFeedback()
  const [editing, setEditing] = useState<'policy' | 'document' | null>(null)
  const [saving, setSaving] = useState(false)
  const [policyDraft, setPolicyDraft] = useState<PolicyPatch>({})
  const [docDraft, setDocDraft] = useState<DocumentDraft | null>(null)
  const lookups = useMemo(() => ({
    insurers: getTable('seguradoras').filter((item) => item.ativo !== false),
    branches: getTable('ramos').filter((item) => item.ativo !== false),
    producers: getTable('produtores').filter((item) => item.ativo !== false),
    stages: getTable('pipeline_stages'),
    subtypes: getTable('endosso_subtipos').filter((item) => item.ativo !== false),
    reasons: getTable('cancelamento_motivos').filter((item) => item.ativo !== false),
  }), [])

  useEffect(() => onDirtyChange(editing !== null), [editing, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const startPolicy = () => {
    setPolicyDraft({ seguradora_id: policy.insurerId ?? null, ramo_id: policy.branchId ?? null, produtor_id: policy.producerId ?? null, status: policy.currentStatus === 'Em emissão' ? 'EM_EMISSAO' : String(policy.currentStatus ?? '').toLocaleUpperCase('pt-BR').replaceAll(' ', '_'), vigencia_inicio: policy.vigenciaInicial ?? null, vigencia_fim: policy.vigenciaFinal ?? null, premio_total: policy.totalPremium ?? null, premio_liquido: policy.netPremium ?? null })
    setEditing('policy')
  }
  const startDocument = () => {
    if (!document) return
    setDocDraft(documentDraft(document))
    setEditing('document')
  }
  const cancel = () => { if (!saving) { setEditing(null); setDocDraft(null); setPolicyDraft({}) } }
  const savePolicy = async () => {
    if (policyDraft.vigencia_inicio && policyDraft.vigencia_fim && policyDraft.vigencia_fim < policyDraft.vigencia_inicio) { notify({ title: 'Revise a vigência', description: 'O fim não pode ser anterior ao início.', tone: 'danger' }); return }
    setSaving(true)
    await Promise.resolve()
    const count = updatePolicy(policy.id, policyDraft)
    setSaving(false); setEditing(null)
    notify({ title: count ? 'Apólice atualizada' : 'Nenhuma alteração', description: count ? `${count} campo(s) auditado(s).` : 'Os dados permanecem iguais.', tone: count ? 'success' : 'info' })
  }
  const saveDocument = async () => {
    if (!document || !docDraft) return
    const error = validateDocumentDraft(document, docDraft)
    if (error) { notify({ title: 'Não foi possível salvar', description: error, tone: 'danger' }); return }
    setSaving(true)
    await Promise.resolve()
    const count = updateDocument(document.id, toDocumentPatch(document, docDraft, lookups.subtypes))
    setSaving(false); setEditing(null); setDocDraft(null)
    notify({ title: count ? 'Documento atualizado' : 'Nenhuma alteração', description: count ? `${count} campo(s) auditado(s).` : 'Os dados permanecem iguais.', tone: count ? 'success' : 'info' })
  }

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
    <div className="space-y-4">
      <Section title="Resumo contratual" action={editing !== 'policy' ? <EditButton label="Editar" onClick={startPolicy} disabled={editing !== null} /> : <EditActions saving={saving} onCancel={cancel} onSave={savePolicy} />}>
        {editing === 'policy' ? <PolicyForm draft={policyDraft} setDraft={setPolicyDraft} lookups={lookups} /> : <PolicyRead policy={policy} />}
      </Section>
      {document ? <Section title={document.proposalType === 'Proposta' ? 'Documento selecionado' : document.proposalType} subtitle={getDocumentNumber(document)} action={editing !== 'document' ? <EditButton label={document.status === 'Proposta Emitida' ? 'Corrigir dados' : 'Editar'} onClick={startDocument} disabled={editing !== null} /> : <EditActions saving={saving} onCancel={cancel} onSave={saveDocument} />}>
        {editing === 'document' && docDraft ? <DocumentForm document={document} draft={docDraft} setDraft={setDocDraft} lookups={lookups} /> : <DocumentRead document={document} />}
      </Section> : <div className="rounded-[8px] border border-dashed border-border-1 p-8 text-center text-sm text-fg-4">Nenhum documento vinculado a esta apólice.</div>}
    </div>
    <aside className="self-start rounded-[8px] border border-border-1 bg-bg-surface p-4">
      <div className="flex items-center gap-2 text-fg-3"><FileCheck2 size={16} /><p className="text-xs font-bold">Leitura auditável</p></div>
      <p className="mt-3 text-sm leading-relaxed text-fg-3">Apólice e documento são editados separadamente. Somente campos alterados geram eventos em <strong>Anexos e logs</strong>.</p>
      <p className="mt-3 text-xs text-fg-4">Prêmios negativos representam restituição ou estorno.</p>
    </aside>
  </div>
}

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-[8px] border border-border-1 bg-bg-surface p-4"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-fg-1">{title}</h2>{subtitle && <p className="mt-0.5 font-mono text-xs text-fg-4">{subtitle}</p>}</div>{action}</div>{children}</section> }
function EditButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-4 py-2 text-xs font-bold text-accent-primary hover:bg-accent-primary-soft disabled:opacity-40"><Edit3 size={14} />{label}</button> }
function EditActions({ saving, onCancel, onSave }: { saving: boolean; onCancel: () => void; onSave: () => void }) { return <div className="flex gap-2"><button type="button" onClick={onCancel} disabled={saving} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-4 py-2 text-xs font-bold text-fg-3 disabled:opacity-50"><X size={14} />Cancelar</button><button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-bold text-fg-on-brand disabled:opacity-60"><Save size={14} />{saving ? 'Salvando...' : 'Salvar alterações'}</button></div> }
function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) { if (!value) return null; return <div><p className="text-[10px] font-bold uppercase tracking-wider text-fg-4">{label}</p><p className={`${mono ? 'font-mono' : ''} mt-1 text-sm font-semibold text-fg-2`}>{value}</p></div> }
function ReadGrid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div> }

function PolicyRead({ policy }: { policy: Proposal }) { return <ReadGrid><Field label="Seguradora" value={policy.insurer} /><Field label="Ramo" value={policy.branch} /><Field label="Produtor" value={policy.producer.name} /><Field label="Status" value={policy.currentStatus ?? policy.status} /><Field label="Vigência" value={policy.vigenciaInicial && policy.vigenciaFinal ? `${fmtDate(policy.vigenciaInicial)} a ${fmtDate(policy.vigenciaFinal)}` : undefined} /><Field label="Prêmio total" value={fmtMoney(policy.totalPremium)} mono /><Field label="Prêmio líquido" value={fmtMoney(policy.netPremium)} mono /></ReadGrid> }
function DocumentRead({ document }: { document: Proposal }) { const showStage = activeStages.has(document.status); return <ReadGrid><Field label="Tipo" value={document.proposalType} /><Field label="Número oficial" value={getDocumentNumber(document)} mono />{showStage && <Field label="Etapa" value={document.status} />} {document.proposalType === 'Endosso' && <><Field label="Subtipo" value={document.endorsementSubtype} /><Field label="Natureza canônica" value={document.endorsementMovement?.replaceAll('_', ' ')} /></>} {document.proposalType === 'Cancelamento' && <Field label="Motivo do cancelamento" value={document.cancellationReason} />} {showStage && <><Field label="Transmissão" value={document.transmissionDate ? fmtDate(document.transmissionDate) : undefined} /><Field label="Recebimento" value={document.insurerReceiptDate ? fmtDate(document.insurerReceiptDate) : undefined} /><Field label={document.status === 'Recusada' ? 'Recusa' : 'Aceitação'} value={(document.status === 'Recusada' ? document.refusalDate : document.acceptanceDate) ? fmtDate(document.status === 'Recusada' ? document.refusalDate! : document.acceptanceDate!) : undefined} /><Field label="Motivo da recusa" value={document.status === 'Recusada' ? document.refusalReason : undefined} /></>} <Field label="Emissão" value={document.issueDate ? fmtDate(document.issueDate) : undefined} />{document.proposalType !== 'Fatura' && <Field label="Início dos efeitos" value={document.vigenciaInicial ? fmtDate(document.vigenciaInicial) : undefined} />}{document.vigenciaFinal && document.proposalType !== 'Cancelamento' && document.proposalType !== 'Fatura' && <Field label="Fim da vigência" value={fmtDate(document.vigenciaFinal)} />}{document.proposalType === 'Fatura' && <Field label="Competência" value={fmtCompetence(document.competenceStart, document.competenceEnd)} />}<Field label="Prêmio total" value={fmtMoney(document.totalPremium)} mono /><Field label="Prêmio líquido" value={fmtMoney(document.netPremium)} mono /><Field label="Forma de pagamento" value={document.paymentMethod} /><Field label="Periodicidade" value={document.paymentFrequency} /><Field label="Parcelas" value={document.installmentCount?.toString()} mono /></ReadGrid> }

function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-fg-4">{label}</span>{children}</label> }
function TextInput({ value, onChange, type = 'text' }: { value: string; onChange: (value: string) => void; type?: string }) { return <input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} /> }
function SelectInput({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Lookup[] }) { return <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{options.map((option) => <option key={String(option.id)} value={String(option.id)}>{String(option.nome ?? option.name ?? option.id)}</option>)}</select> }

function PolicyForm({ draft, setDraft, lookups }: { draft: PolicyPatch; setDraft: React.Dispatch<React.SetStateAction<PolicyPatch>>; lookups: { insurers: Lookup[]; branches: Lookup[]; producers: Lookup[] } }) { const set = <K extends keyof PolicyPatch>(key: K, value: PolicyPatch[K]) => setDraft((current) => ({ ...current, [key]: value })); return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><FormField label="Seguradora"><SelectInput value={draft.seguradora_id ?? ''} onChange={(value) => set('seguradora_id', nullable(value))} options={lookups.insurers} /></FormField><FormField label="Ramo"><SelectInput value={draft.ramo_id ?? ''} onChange={(value) => set('ramo_id', nullable(value))} options={lookups.branches} /></FormField><FormField label="Produtor"><SelectInput value={draft.produtor_id ?? ''} onChange={(value) => set('produtor_id', nullable(value))} options={lookups.producers} /></FormField><FormField label="Status"><select className={inputClass} value={draft.status ?? ''} onChange={(event) => set('status', event.target.value)}>{['EM_EMISSAO','VIGENTE','RENOVADA','NAO_RENOVADA','CANCELADA','RECUSADA'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></FormField><FormField label="Início da vigência"><TextInput type="date" value={draft.vigencia_inicio ?? ''} onChange={(value) => set('vigencia_inicio', nullable(value))} /></FormField><FormField label="Fim da vigência"><TextInput type="date" value={draft.vigencia_fim ?? ''} onChange={(value) => set('vigencia_fim', nullable(value))} /></FormField><FormField label="Prêmio total"><TextInput type="number" value={draft.premio_total?.toString() ?? ''} onChange={(value) => set('premio_total', numberOrNull(value))} /></FormField><FormField label="Prêmio líquido"><TextInput type="number" value={draft.premio_liquido?.toString() ?? ''} onChange={(value) => set('premio_liquido', numberOrNull(value))} /></FormField></div> }

function DocumentForm({ document, draft, setDraft, lookups }: { document: Proposal; draft: DocumentDraft; setDraft: React.Dispatch<React.SetStateAction<DocumentDraft | null>>; lookups: { stages: Lookup[]; subtypes: Lookup[]; reasons: Lookup[] } }) { const set = (key: keyof DocumentDraft, value: string) => setDraft((current) => current ? { ...current, [key]: value } : current); const stageOptions = lookups.stages.map((item) => ({ ...item, nome: item.nome })); return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
  {(document.proposalType === 'Proposta' || document.proposalType === 'Renovação' || document.proposalType === 'Cancelamento') && <FormField label="Número oficial"><TextInput value={draft.numero_proposta} onChange={(value) => set('numero_proposta', value)} /></FormField>}
  {document.proposalType === 'Endosso' && <><FormField label="Número do endosso"><TextInput value={draft.numero_endosso} onChange={(value) => set('numero_endosso', value)} /></FormField><FormField label="Subtipo do endosso"><SelectInput value={draft.endosso_subtipo_id} onChange={(value) => set('endosso_subtipo_id', value)} options={lookups.subtypes} /></FormField></>}
  {document.proposalType === 'Cancelamento' && <FormField label="Motivo do cancelamento"><SelectInput value={draft.cancelamento_motivo_id} onChange={(value) => set('cancelamento_motivo_id', value)} options={lookups.reasons} /></FormField>}
  {document.proposalType === 'Fatura' && <><FormField label="Número da fatura"><TextInput value={draft.numero_fatura} onChange={(value) => set('numero_fatura', value)} /></FormField><FormField label="Competência inicial"><TextInput type="date" value={draft.competencia_inicio} onChange={(value) => set('competencia_inicio', value)} /></FormField><FormField label="Competência final"><TextInput type="date" value={draft.competencia_fim} onChange={(value) => set('competencia_fim', value)} /></FormField></>}
  {activeStages.has(document.status) && <><FormField label="Etapa"><SelectInput value={draft.stage_id} onChange={(value) => set('stage_id', value)} options={stageOptions} /></FormField><FormField label="Transmissão"><TextInput type="date" value={draft.data_transmissao} onChange={(value) => set('data_transmissao', value)} /></FormField><FormField label="Recebimento pela seguradora"><TextInput type="date" value={draft.data_recebimento_seguradora} onChange={(value) => set('data_recebimento_seguradora', value)} /></FormField><FormField label="Aceitação"><TextInput type="date" value={draft.data_aceitacao} onChange={(value) => set('data_aceitacao', value)} /></FormField><FormField label="Recusa"><TextInput type="date" value={draft.data_recusa} onChange={(value) => set('data_recusa', value)} /></FormField><FormField label="Motivo da recusa"><TextInput value={draft.motivo_recusa} onChange={(value) => set('motivo_recusa', value)} /></FormField></>}
  <FormField label="Emissão"><TextInput type="date" value={draft.data_emissao} onChange={(value) => set('data_emissao', value)} /></FormField>{document.proposalType !== 'Fatura' && <><FormField label="Início dos efeitos"><TextInput type="date" value={draft.vigencia_inicio} onChange={(value) => set('vigencia_inicio', value)} /></FormField>{document.proposalType !== 'Cancelamento' && <FormField label="Fim da vigência"><TextInput type="date" value={draft.vigencia_fim} onChange={(value) => set('vigencia_fim', value)} /></FormField>}</>}
  <FormField label="Prêmio total"><TextInput type="number" value={draft.premio_total} onChange={(value) => set('premio_total', value)} /></FormField><FormField label="Prêmio líquido"><TextInput type="number" value={draft.premio_liquido} onChange={(value) => set('premio_liquido', value)} /></FormField><FormField label="Forma de pagamento"><TextInput value={draft.forma_pagamento} onChange={(value) => set('forma_pagamento', value)} /></FormField><FormField label="Periodicidade"><TextInput value={draft.periodicidade_pagamento} onChange={(value) => set('periodicidade_pagamento', value)} /></FormField><FormField label="Quantidade de parcelas"><TextInput type="number" value={draft.qtd_parcelas} onChange={(value) => set('qtd_parcelas', value)} /></FormField><FormField label="Primeira parcela"><TextInput type="date" value={draft.primeira_parcela_vencimento} onChange={(value) => set('primeira_parcela_vencimento', value)} /></FormField><FormField label="Valor da primeira parcela"><TextInput type="number" value={draft.primeira_parcela_valor} onChange={(value) => set('primeira_parcela_valor', value)} /></FormField>
  </div> }
