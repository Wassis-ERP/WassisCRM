import type { ChangeEvent, ReactNode } from 'react'
import {
  Building2,
  Car,
  FileText,
  HeartPulse,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { newId } from '../../../lib/inMemoryDb'
import { createEmptyItem, hasManualItemContent, previewManualAgendas } from './cadastroManualDomain'
import type {
  ManualDocumentDraft,
  ManualItemDraft,
  ManualLookups,
  ManualLookupOption,
} from './cadastroManualTypes'

interface StepProps {
  draft: ManualDocumentDraft
  lookups: ManualLookups
  update: (patch: Partial<ManualDocumentDraft>) => void
}

const controlClass = 'w-full rounded-[8px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm text-fg-1 placeholder:text-fg-3 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/25 disabled:cursor-not-allowed disabled:bg-bg-surface-2 disabled:text-fg-3'
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numeric = (value: string) => Number(value.replace(',', '.')) || 0

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-fg-3">{hint}</span>}
    </label>
  )
}

export function OptionSelect({ value, options, onChange, placeholder = 'Selecione', disabled }: {
  value: string
  options: ManualLookupOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass} disabled={disabled}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>{option.label}{option.detail ? ` · ${option.detail}` : ''}</option>
      ))}
    </select>
  )
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return <div><h2 className="font-display text-xl font-bold tracking-[-0.02em] text-fg-1">{title}</h2><p className="mt-1 max-w-[70ch] text-sm leading-6 text-fg-3">{description}</p></div>
}

export function ContextStep({ draft, lookups, update, onNewInsured }: StepProps & { onNewInsured: () => void }) {
  const branchOffice = lookups.branchOffices.find((option) => option.id === draft.branchOfficeId)
  return (
    <div className="space-y-7">
      <SectionIntro title="Contexto do cadastro" description="Defina se o documento ainda está em tramitação ou se a apólice oficial já foi emitida." />
      <fieldset>
        <legend className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">Ponto de partida</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <ModeButton active={draft.mode === 'PROPOSTA'} icon={<FileText size={20} />} title="Proposta em tramitação" description="Cria o contrato em emissão, sem número de apólice nem efeitos oficiais." onClick={() => update({ mode: 'PROPOSTA', policyNumber: '', issueDate: '' })} />
          <ModeButton active={draft.mode === 'APOLICE'} icon={<ShieldCheck size={20} />} title="Apólice já emitida" description="Registra o documento oficial e materializa as agendas contratuais." onClick={() => update({ mode: 'APOLICE', issueDate: draft.issueDate || draft.transmissionDate, documentReceiptDate: draft.documentReceiptDate || draft.transmissionDate })} />
        </div>
      </fieldset>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Segurado">
          <div className="flex gap-2">
            <OptionSelect value={draft.insuredId} onChange={(insuredId) => update({ insuredId })} options={lookups.insureds} placeholder="Buscar por nome ou CPF/CNPJ" />
            <button type="button" onClick={onNewInsured} className="shrink-0 rounded-full border border-accent-primary px-3 text-accent-primary hover:bg-accent-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30" aria-label="Cadastrar novo segurado" title="Cadastrar novo segurado"><Plus size={18} /></button>
          </div>
        </Field>
        <Field label="Corretora" hint="Derivada do segurado selecionado."><input value={branchOffice?.label ?? ''} readOnly className={`${controlClass} bg-bg-surface-2`} /></Field>
        <Field label="Seguradora"><OptionSelect value={draft.insurerId} onChange={(insurerId) => update({ insurerId })} options={lookups.insurers} /></Field>
        <Field label="Ramo"><OptionSelect value={draft.branchId} onChange={(branchId) => update({ branchId })} options={lookups.branches} /></Field>
        <Field label="Produtor principal"><OptionSelect value={draft.producerId} onChange={(producerId) => update({ producerId })} options={lookups.producers} /></Field>
        <Field label="Responsável"><OptionSelect value={draft.responsibleId} onChange={(responsibleId) => update({ responsibleId })} options={lookups.responsibles} /></Field>
      </div>
    </div>
  )
}

function ModeButton({ active, icon, title, description, onClick }: { active: boolean; icon: ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-24 items-start gap-3 rounded-[8px] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 ${active ? 'border-accent-primary bg-accent-primary-soft' : 'border-border-1 bg-bg-surface hover:bg-bg-surface-2'}`}>
      <span className={`mt-0.5 rounded-[6px] p-2 ${active ? 'bg-accent-primary text-fg-on-brand' : 'bg-bg-surface-2 text-fg-3'}`}>{icon}</span>
      <span><span className="block text-sm font-extrabold text-fg-1">{title}</span><span className="mt-1 block text-xs leading-5 text-fg-3">{description}</span></span>
    </button>
  )
}

export function DocumentStep({ draft, update }: StepProps) {
  const handleAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    update({ attachment: file ? { name: file.name, type: file.type, size: file.size } : null })
  }
  return (
    <div className="space-y-7">
      <SectionIntro title="Dados do documento" description="Registre os dados comuns da proposta e, quando aplicável, os campos oficiais da apólice emitida." />
      <section className="space-y-4">
        <h3 className="text-sm font-extrabold text-fg-1">Identificação e vigência</h3>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Número da proposta"><input value={draft.proposalNumber} onChange={(e) => update({ proposalNumber: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          {draft.mode === 'APOLICE' && <Field label="Número da apólice"><input value={draft.policyNumber} onChange={(e) => update({ policyNumber: e.target.value })} className={`${controlClass} font-mono`} /></Field>}
          <Field label="Controle interno"><input value={draft.controlNumber} onChange={(e) => update({ controlNumber: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Protocolo na seguradora"><input value={draft.insurerProtocol} onChange={(e) => update({ insurerProtocol: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Data de transmissão"><input type="date" value={draft.transmissionDate} onChange={(e) => update({ transmissionDate: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          {draft.mode === 'APOLICE' && <Field label="Data de emissão"><input type="date" value={draft.issueDate} onChange={(e) => update({ issueDate: e.target.value })} className={`${controlClass} font-mono`} /></Field>}
          {draft.mode === 'APOLICE' && <Field label="Recebimento do documento"><input type="date" value={draft.documentReceiptDate} onChange={(e) => update({ documentReceiptDate: e.target.value })} className={`${controlClass} font-mono`} /></Field>}
          <Field label="Início da vigência"><input type="date" value={draft.coverageStart} onChange={(e) => update({ coverageStart: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Fim da vigência"><input type="date" value={draft.coverageEnd} onChange={(e) => update({ coverageEnd: e.target.value })} className={`${controlClass} font-mono`} /></Field>
        </div>
      </section>
      <section className="space-y-4 border-t border-border-1 pt-5">
        <h3 className="text-sm font-extrabold text-fg-1">Prêmios e contratação</h3>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Prêmio total"><input inputMode="decimal" value={draft.totalPremium} onChange={(e) => update({ totalPremium: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Prêmio líquido"><input inputMode="decimal" value={draft.netPremium} onChange={(e) => update({ netPremium: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="IOF"><input inputMode="decimal" value={draft.iof} onChange={(e) => update({ iof: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Adicional de fracionamento"><input inputMode="decimal" value={draft.fractionationFee} onChange={(e) => update({ fractionationFee: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Tipo de contratação"><select value={draft.contractType} onChange={(e) => update({ contractType: e.target.value })} className={controlClass}><option value="INDIVIDUAL">Individual</option><option value="COLETIVA">Coletiva</option></select></Field>
          <Field label="Tipo de apólice"><select value={draft.policyType} onChange={(e) => update({ policyType: e.target.value })} className={controlClass}><option value="NORMAL">Normal</option><option value="ABERTA">Aberta</option><option value="AVERBACAO">Averbação</option></select></Field>
          <Field label="Processo SUSEP"><input value={draft.susepProcess} onChange={(e) => update({ susepProcess: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Estipulante"><input value={draft.stipulatorName} onChange={(e) => update({ stipulatorName: e.target.value })} className={controlClass} /></Field>
        </div>
      </section>
      <section className="grid gap-5 border-t border-border-1 pt-5 md:grid-cols-2">
        <Field label="Documento anexo (opcional)" hint="O arquivo fica vinculado em Anexos e logs, sem leitura automática."><input type="file" accept="application/pdf,image/*" onChange={handleAttachment} className={`${controlClass} file:mr-3 file:rounded-full file:border-0 file:bg-accent-primary-soft file:px-3 file:py-1 file:text-xs file:font-bold file:text-accent-primary`} />{draft.attachment && <span className="mt-2 block truncate font-mono text-xs text-fg-3">{draft.attachment.name}</span>}</Field>
        <Field label="Observações"><textarea value={draft.notes} onChange={(e) => update({ notes: e.target.value })} rows={4} className={controlClass} /></Field>
      </section>
    </div>
  )
}

export function ItemsStep({ draft, lookups, update }: StepProps) {
  const branch = lookups.branches.find((option) => option.id === draft.branchId)
  const coverageOptions = lookups.coverages.filter((option) => option.branchId === draft.branchId)
  const updateItem = (id: string, next: ManualItemDraft) => update({ items: draft.items.map((item) => item.id === id ? next : item) })
  const removeItem = (id: string) => update({ items: draft.items.filter((item) => item.id !== id) })
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionIntro title="Itens e coberturas" description={`Opcional: cadastre os riscos do ramo ${branch?.label ?? 'selecionado'} quando essas informações estiverem disponíveis.`} />
        <button type="button" onClick={() => update({ items: [...draft.items, createEmptyItem()] })} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2.5 text-sm font-bold text-fg-on-brand shadow-[var(--shadow-brand)] hover:bg-accent-primary-hover"><Plus size={16} /> Adicionar item</button>
      </div>
      {draft.items.length === 0 && <div className="rounded-[8px] bg-bg-surface-2 p-5 text-sm text-fg-3">Nenhum item informado. É possível continuar e complementar os riscos depois.</div>}
      <div className="space-y-4">
        {draft.items.map((item, index) => (
          <ItemEditor key={item.id} item={item} index={index} riskType={branch?.riskType ?? 'DIVERSOS'} coverageOptions={coverageOptions} onChange={(next) => updateItem(item.id, next)} onRemove={() => removeItem(item.id)} canRemove />
        ))}
      </div>
    </div>
  )
}

function ItemEditor({ item, index, riskType, coverageOptions, onChange, onRemove, canRemove }: {
  item: ManualItemDraft
  index: number
  riskType: string
  coverageOptions: ManualLookupOption[] & Array<{ defaultCapital?: number | null }>
  onChange: (item: ManualItemDraft) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const updateDetails = (patch: Partial<ManualItemDraft['details']>) => onChange({ ...item, details: { ...item.details, ...patch } })
  const addCoverage = () => {
    const option = coverageOptions[0]
    onChange({ ...item, coverages: [...item.coverages, { id: newId(), catalogId: option?.id ?? '', capital: String(option?.defaultCapital ?? ''), deductible: '', premium: '' }] })
  }
  const icon = riskType === 'VEICULO' ? <Car size={18} /> : riskType === 'VIDA' ? <UsersRound size={18} /> : riskType === 'EMPRESA' ? <Building2 size={18} /> : riskType === 'IMOVEL' ? <Building2 size={18} /> : <ShieldCheck size={18} />
  return (
    <section className="rounded-[8px] border border-border-1 bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-1 bg-bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-fg-1"><span className="text-accent-primary">{icon}</span> Item {index + 1} · {riskType}</div>
        <button type="button" onClick={onRemove} disabled={!canRemove} className="rounded-[6px] p-2 text-fg-3 hover:bg-signal-danger-soft hover:text-signal-danger disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Remover item ${index + 1}`}><Trash2 size={16} /></button>
      </div>
      <div className="space-y-6 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Descrição"><input value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })} className={controlClass} placeholder="Identifique o risco" /></Field>
          <Field label="Identificador externo"><input value={item.externalIdentifier} onChange={(e) => onChange({ ...item, externalIdentifier: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Valor do risco"><input inputMode="decimal" value={item.riskValue} onChange={(e) => onChange({ ...item, riskValue: e.target.value })} className={`${controlClass} font-mono`} /></Field>
          <Field label="Resumo do endereço"><input value={item.addressSummary} onChange={(e) => onChange({ ...item, addressSummary: e.target.value })} className={controlClass} /></Field>
        </div>
        <SpecificRiskFields riskType={riskType} item={item} updateDetails={updateDetails} />
        <div className="border-t border-border-1 pt-5">
          <div className="mb-3 flex items-center justify-between"><div><h4 className="text-sm font-extrabold text-fg-1">Coberturas</h4><p className="mt-0.5 text-xs text-fg-3">Valores vinculados ao item e ao documento criado.</p></div><button type="button" onClick={addCoverage} disabled={coverageOptions.length === 0} className="inline-flex items-center gap-1 rounded-full border border-accent-primary px-3 py-1.5 text-xs font-bold text-accent-primary hover:bg-accent-primary-soft disabled:opacity-40"><Plus size={14} /> Cobertura</button></div>
          {item.coverages.length === 0 ? <p className="rounded-[6px] bg-bg-surface-2 px-3 py-2 text-xs text-fg-3">Nenhuma cobertura adicionada.</p> : <div className="space-y-2">{item.coverages.map((coverage) => <div key={coverage.id} className="grid gap-3 rounded-[6px] bg-bg-surface-2 p-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]"><OptionSelect value={coverage.catalogId} onChange={(catalogId) => onChange({ ...item, coverages: item.coverages.map((entry) => entry.id === coverage.id ? { ...entry, catalogId } : entry) })} options={coverageOptions} /><input aria-label="Capital da cobertura" placeholder="Capital/LMI" inputMode="decimal" value={coverage.capital} onChange={(e) => onChange({ ...item, coverages: item.coverages.map((entry) => entry.id === coverage.id ? { ...entry, capital: e.target.value } : entry) })} className={`${controlClass} font-mono`} /><input aria-label="Franquia da cobertura" placeholder="Franquia" inputMode="decimal" value={coverage.deductible} onChange={(e) => onChange({ ...item, coverages: item.coverages.map((entry) => entry.id === coverage.id ? { ...entry, deductible: e.target.value } : entry) })} className={`${controlClass} font-mono`} /><input aria-label="Prêmio da cobertura" placeholder="Prêmio" inputMode="decimal" value={coverage.premium} onChange={(e) => onChange({ ...item, coverages: item.coverages.map((entry) => entry.id === coverage.id ? { ...entry, premium: e.target.value } : entry) })} className={`${controlClass} font-mono`} /><button type="button" onClick={() => onChange({ ...item, coverages: item.coverages.filter((entry) => entry.id !== coverage.id) })} className="rounded-[6px] p-2 text-fg-3 hover:bg-signal-danger-soft hover:text-signal-danger" aria-label="Remover cobertura"><Trash2 size={16} /></button></div>)}</div>}
        </div>
      </div>
    </section>
  )
}

function SpecificRiskFields({ riskType, item, updateDetails }: { riskType: string; item: ManualItemDraft; updateDetails: (patch: Partial<ManualItemDraft['details']>) => void }) {
  if (riskType === 'VEICULO') return <div className="grid gap-4 border-t border-border-1 pt-5 md:grid-cols-2 xl:grid-cols-4"><Field label="Marca"><input value={item.details.marca} onChange={(e) => updateDetails({ marca: e.target.value })} className={controlClass} /></Field><Field label="Modelo"><input value={item.details.modelo} onChange={(e) => updateDetails({ modelo: e.target.value })} className={controlClass} /></Field><Field label="Placa"><input value={item.details.placa} onChange={(e) => updateDetails({ placa: e.target.value.toUpperCase() })} className={`${controlClass} font-mono`} /></Field><Field label="Chassi"><input value={item.details.chassi} onChange={(e) => updateDetails({ chassi: e.target.value.toUpperCase() })} className={`${controlClass} font-mono`} /></Field></div>
  if (riskType === 'IMOVEL') return <AddressFields item={item} updateDetails={updateDetails} />
  if (riskType === 'EMPRESA') return <div className="space-y-4 border-t border-border-1 pt-5"><div className="grid gap-4 md:grid-cols-3"><Field label="CNPJ do risco"><input value={item.details.cnpjRisco} onChange={(e) => updateDetails({ cnpjRisco: e.target.value })} className={`${controlClass} font-mono`} /></Field><Field label="Razão social"><input value={item.details.razaoSocialRisco} onChange={(e) => updateDetails({ razaoSocialRisco: e.target.value })} className={controlClass} /></Field><Field label="Atividade"><input value={item.details.atividade} onChange={(e) => updateDetails({ atividade: e.target.value })} className={controlClass} /></Field></div><AddressFields item={item} updateDetails={updateDetails} compact /></div>
  if (riskType === 'VIDA') return <div className="grid gap-4 border-t border-border-1 pt-5 md:grid-cols-3"><Field label="Grupo segurado"><input value={item.details.nomeGrupo} onChange={(e) => updateDetails({ nomeGrupo: e.target.value })} className={controlClass} /></Field><Field label="Número de vidas"><input type="number" min="1" value={item.details.numeroVidas} onChange={(e) => updateDetails({ numeroVidas: e.target.value })} className={`${controlClass} font-mono`} /></Field><Field label="Capital individual"><input inputMode="decimal" value={item.details.capitalIndividual} onChange={(e) => updateDetails({ capitalIndividual: e.target.value })} className={`${controlClass} font-mono`} /></Field></div>
  return null
}

function AddressFields({ item, updateDetails, compact = false }: { item: ManualItemDraft; updateDetails: (patch: Partial<ManualItemDraft['details']>) => void; compact?: boolean }) {
  return <div className={`${compact ? '' : 'border-t border-border-1 pt-5'} grid gap-4 md:grid-cols-2 xl:grid-cols-4`}><Field label="CEP"><input value={item.details.cep} onChange={(e) => updateDetails({ cep: e.target.value })} className={`${controlClass} font-mono`} /></Field><Field label="Endereço"><input value={item.details.endereco} onChange={(e) => updateDetails({ endereco: e.target.value })} className={controlClass} /></Field><Field label="Cidade"><input value={item.details.cidade} onChange={(e) => updateDetails({ cidade: e.target.value })} className={controlClass} /></Field><Field label="UF"><input maxLength={2} value={item.details.uf} onChange={(e) => updateDetails({ uf: e.target.value.toUpperCase() })} className={`${controlClass} font-mono`} /></Field></div>
}

export function FinanceStep({ draft, lookups, update }: StepProps) {
  const preview = previewManualAgendas(draft)
  const branch = lookups.branches.find((option) => option.id === draft.branchId)
  const showAgencyCommission = branch?.riskType === 'SAUDE' || branch?.riskType === 'VIDA'
  return (
    <div className="space-y-7">
      <SectionIntro title="Parcelas e agendas" description="Revise a cobrança do segurado, a receita da corretora e o repasse ao produtor como três fatos separados." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Forma de pagamento"><select value={draft.paymentMethod} onChange={(e) => update({ paymentMethod: e.target.value })} className={controlClass}><option value="BOLETO">Boleto</option><option value="CARTAO">Cartão</option><option value="DEBITO">Débito em conta</option><option value="PIX">Pix</option></select></Field>
        <Field label="Periodicidade"><select value={draft.paymentFrequency} onChange={(e) => update({ paymentFrequency: e.target.value })} className={controlClass}><option value="MENSAL">Mensal</option><option value="UNICA">Única</option><option value="ANUAL">Anual</option></select></Field>
        <Field label="Quantidade de parcelas"><input type="number" min="1" value={draft.installmentCount} onChange={(e) => update({ installmentCount: e.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Primeiro vencimento"><input type="date" value={draft.firstDueDate} onChange={(e) => update({ firstDueDate: e.target.value })} className={`${controlClass} font-mono`} /></Field>
        <Field label="Comissão da corretora (%)"><input inputMode="decimal" value={draft.commissionPct} onChange={(e) => update({ commissionPct: e.target.value })} className={`${controlClass} font-mono`} /></Field>
        {showAgencyCommission && <Field label="Agenciamento (%)" hint="Percentual total distribuído nas linhas de agenciamento da grade."><input inputMode="decimal" value={draft.agencyCommissionPct} onChange={(e) => update({ agencyCommissionPct: e.target.value })} className={`${controlClass} font-mono`} /></Field>}
        <Field label="Grade de recebimento"><OptionSelect value={draft.gradeId} onChange={(gradeId) => update({ gradeId })} options={lookups.grades} placeholder="Agenda manual" /></Field>
      </div>
      <div className="overflow-hidden rounded-[8px] border border-border-1">
        <div className="border-b border-border-1 bg-bg-surface-2 px-4 py-3"><h3 className="text-sm font-extrabold text-fg-1">Prévia contratual</h3><p className="mt-0.5 text-xs text-fg-3">{preview.willMaterialize ? 'As agendas serão materializadas na confirmação da apólice.' : 'A prévia será preservada, mas os fatos só nascem quando houver documento oficial.'}</p></div>
        <div className="grid divide-y divide-border-1 md:grid-cols-3 md:divide-x md:divide-y-0">
          <PreviewCell icon={<FileText size={18} />} label="Parcelas do segurado" value={`${preview.installments} parcela(s)`} detail={`${money.format(numeric(draft.totalPremium) / preview.installments)} por parcela`} />
          <PreviewCell icon={<Building2 size={18} />} label="Comissão da corretora" value={money.format(preview.commissionAmount)} detail={`${preview.commissionEvents} evento(s) · ${preview.gradeName}`} />
          <PreviewCell icon={<UserRound size={18} />} label="Repasse previsto" value={preview.transferAmount == null ? 'Sem regra' : money.format(preview.transferAmount)} detail={preview.transferRule} />
        </div>
      </div>
    </div>
  )
}

function PreviewCell({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <div className="p-4"><div className="flex items-center gap-2 text-accent-primary">{icon}<span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-fg-3">{label}</span></div><p className="mt-3 font-mono text-base font-bold text-fg-1">{value}</p><p className="mt-1 text-xs text-fg-3">{detail}</p></div>
}

export function ReviewStep({ draft, lookups, confirmed, setConfirmed }: StepProps & { confirmed: boolean; setConfirmed: (value: boolean) => void }) {
  const insured = lookups.insureds.find((option) => option.id === draft.insuredId)
  const insurer = lookups.insurers.find((option) => option.id === draft.insurerId)
  const branch = lookups.branches.find((option) => option.id === draft.branchId)
  const producer = lookups.producers.find((option) => option.id === draft.producerId)
  const preview = previewManualAgendas(draft)
  const informedItems = draft.items.filter(hasManualItemContent)
  return (
    <div className="space-y-7">
      <SectionIntro title="Revisão e conclusão" description="Confira o documento completo. A confirmação cria contrato, documento, riscos e agendas em uma única operação." />
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
        <ReviewSection title="Contexto" icon={<ShieldCheck size={18} />} rows={[[draft.mode === 'APOLICE' ? 'Apólice emitida' : 'Proposta em tramitação', draft.mode === 'APOLICE' ? draft.policyNumber : draft.proposalNumber || 'Sem número'], ['Segurado', insured?.label ?? '—'], ['Seguradora e ramo', `${insurer?.label ?? '—'} · ${branch?.label ?? '—'}`], ['Produtor', producer?.label ?? '—']]} />
        <ReviewSection title="Documento" icon={<FileText size={18} />} rows={[["Vigência", `${draft.coverageStart} a ${draft.coverageEnd}`], ['Prêmio total', money.format(numeric(draft.totalPremium))], ['Prêmio líquido', money.format(numeric(draft.netPremium))], ['Anexo', draft.attachment?.name ?? 'Sem anexo']]} />
        <ReviewSection title="Riscos" icon={branch?.riskType === 'VEICULO' ? <Car size={18} /> : branch?.riskType === 'VIDA' ? <HeartPulse size={18} /> : <Building2 size={18} />} rows={informedItems.length ? informedItems.map((item, index) => [`Item ${index + 1}`, `${item.description} · ${item.coverages.length} cobertura(s)`]) : [['Itens', 'Nenhum item informado']]} />
        <ReviewSection title="Agendas" icon={<UsersRound size={18} />} rows={[["Parcelas", `${preview.installments}`], ['Comissão / agenciamento', `${draft.commissionPct}% / ${draft.agencyCommissionPct}%`], ['Comissão prevista', money.format(preview.commissionAmount)], ['Repasse previsto', preview.transferAmount == null ? 'Sem regra' : money.format(preview.transferAmount)], ['Materialização', preview.willMaterialize ? 'Na confirmação' : 'Após documento oficial']]} />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-border-1 bg-bg-surface-2 p-4">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]" />
        <span><span className="block text-sm font-bold text-fg-1">Confirmo que revisei os dados do cadastro</span><span className="mt-0.5 block text-xs leading-5 text-fg-3">Os dados serão registrados como origem manual e ficarão disponíveis no Painel e no detalhe contratual.</span></span>
      </label>
    </div>
  )
}

function ReviewSection({ title, icon, rows }: { title: string; icon: ReactNode; rows: string[][] }) {
  return <section className="min-w-0 border-t border-border-1 pt-4"><h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-fg-1"><span className="text-accent-primary">{icon}</span>{title}</h3><dl className="space-y-2">{rows.map(([label, value]) => <div key={`${label}-${value}`} className="flex min-w-0 items-baseline justify-between gap-4 text-sm"><dt className="shrink-0 text-fg-3">{label}</dt><dd className="min-w-0 truncate text-right font-semibold text-fg-1">{value}</dd></div>)}</dl></section>
}
